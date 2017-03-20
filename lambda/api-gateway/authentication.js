'use strict';

const aws = require('aws-sdk');
const rekognition = new aws.Rekognition();
const iotData = new aws.IotData({
    endpoint: process.env.IOT_ENDPOINT
});
const dynamodb = new aws.DynamoDB.DocumentClient();
const sts = new aws.STS();
const credentials = new aws.Credentials();

/**
 * utilities to do sigv4
 * @class SigV4Utils
 */
function SigV4Utils() {}

SigV4Utils.getSignatureKey = function(key, date, region, service) {
    let kDate = aws.util.crypto.hmac('AWS4' + key, date, 'buffer');
    let kRegion = aws.util.crypto.hmac(kDate, region, 'buffer');
    let kService = aws.util.crypto.hmac(kRegion, service, 'buffer');
    let kCredentials = aws.util.crypto.hmac(kService, 'aws4_request', 'buffer');
    return kCredentials;
};

SigV4Utils.getSignedUrl = function(options) {
    console.log('Options: ', options);
    let datetime = aws.util.date.iso8601(new Date()).replace(/[:\-]|\.\d{3}/g, '');
    let date = datetime.substr(0, 8);

    let method = 'GET';
    let protocol = 'wss';
    let uri = '/mqtt';
    let service = 'iotdevicegateway';
    let algorithm = 'AWS4-HMAC-SHA256';
    let host = process.env.IOT_ENDPOINT;
    let region = process.env.REGION;
    let expires = process.env.EXPIRES || '86400';

    let credentialScope = date + '/' + region + '/' + service + '/' + 'aws4_request';
    let canonicalQuerystring = 'X-Amz-Algorithm=' + algorithm;
    canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(options.accessKeyId + '/' + credentialScope);
    canonicalQuerystring += '&X-Amz-Date=' + datetime;
    canonicalQuerystring += '&X-Amz-Expires=86400';
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';

    let canonicalHeaders = 'host:' + host + '\n';
    let payloadHash = aws.util.crypto.sha256('', 'hex')
    let canonicalRequest = method + '\n' + uri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;

    let stringToSign = algorithm + '\n' + datetime + '\n' + credentialScope + '\n' + aws.util.crypto.sha256(canonicalRequest, 'hex');
    let signingKey = SigV4Utils.getSignatureKey(options.secretAccessKey, date, region, service);
    let signature = aws.util.crypto.hmac(signingKey, stringToSign, 'hex');

    canonicalQuerystring += '&X-Amz-Signature=' + signature;
    if (options.sessionToken) {
        canonicalQuerystring += '&X-Amz-Security-Token=' + encodeURIComponent(options.sessionToken);
    }

    let requestUrl = protocol + '://' + host + uri + '?' + canonicalQuerystring;
    return requestUrl;
};

let getRoleURL = function(role, callback) {
    let assumeRoleParams = {
        DurationSeconds: 3600,
        ExternalId: role.user.id + '_' + role.user.email,
        Policy: JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "iot:*"
                ],
                "Resource": "*"
            }]
        }),
        RoleArn: process.env.ASSUMED_ROLE_ARN,
        RoleSessionName: role.user.id + '_' + role.user.email
    };
    sts.assumeRole(assumeRoleParams, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            console.log(data); // successful response
            callback(SigV4Utils.getSignedUrl({
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            }));
        }
        /*
        data = {
         AssumedRoleUser: {
          Arn: "arn:aws:sts::123456789012:assumed-role/demo/Bob",
          AssumedRoleId: "ARO123EXAMPLE123:Bob"
         },
         Credentials: {
          AccessKeyId: "AKIAIOSFODNN7EXAMPLE",
          Expiration: <Date Representation>,
          SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
          SessionToken: "AQoDYXdzEPT//////////wEXAMPLEtc764bNrC9SAPBSM22wDOk4x4HIZ8j4FZTwdQWLWsKWHGBuFqwAeMicRXmxfpSPfIeoIYRqTflfKD8YUuwthAx7mSEI/qkPpKPi/kMcGdQrmGdeehM4IC1NtBmUpp2wUE8phUZampKsburEDy0KPkyQDYwT7WZ0wq5VSXDvp75YU9HFvlRd8Tx6q6fE8YQcHNVXAkiY9q6d+xo0rKwT38xVqr7ZD0u0iPPkUL64lIZbqBAz+scqKmlzm8FDrypNC9Yjc8fPOLn9FX9KSYvKTr4rvx3iSIlTJabIQwj2ICCR/oLxBA=="
         },
         PackedPolicySize: 6
        }
        */
    });
}


let getUser = function(face, callback) {
    let params = {
        // ProjectionExpression: "name,email",
        FilterExpression: "#f < :i",
        ExpressionAttributeNames: {
            "#f": "face",
        },
        ExpressionAttributeValues: {
            ":i": face
        },
        TableName: process.env.TABLE
    };

    console.log('Get User', face, params);
    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log('DynamoDB Error', err, err.stack);
            callback(false);
        } else {
            console.log('DynamoDB', data);
            callback(data.Items[0]);
        }
        /*
        data = {
         ConsumedCapacity: {
         },
         Count: 2,
         Items: [
            {
           "SongTitle": {
             S: "Call Me Today"
            }
          }
         ],
         ScannedCount: 2
        }
        */
    });
};

let iotPublish = function(payload) {
    let params = {
        "topic": process.env.TOPIC,
        "payload": JSON.stringify(payload)
    };
    iotData.publish(params, function(err, data) {
        if (err) {
            console.log(err.stack, data);
            return false;
        } else {
            console.log('IoT', data)
            return true;
        }
    });
}

let publish = function(face, payload, callback) {

    console.log('\n Publishing:\n', payload);
    if (payload.auth) {
        getUser(face, function(user) {
            payload.user = user;
            callback(payload);
        });
    } else {
        callback(payload);
    }
};

exports.handler = function(event, context, callback) {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(credentials));

    // Get temporary security credentials
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#assumeRole-property
    // https://www.npmjs.com/package/aws-device-gateway-signed-url



    let params = {
        CollectionId: process.env.COLLECTION_ID,
        FaceMatchThreshold: 95,
        Image: {
            // Bytes: event.body.image
            "S3Object": {
                "Bucket": process.env.BUCKET,
                "Name": event.body.key
            }
        },
        // MaxFaces: 5
    };


    rekognition.searchFacesByImage(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            context.succeed(err);
        } else {
            console.log(data);
            let payload = {
                auth: false
            };
            data.FaceMatches.forEach(function(f) {
                console.log(f);

                if (f.Similarity >= 90) {
                    payload.auth = true;
                }
            });

            publish(data.FaceMatches[0].Face.FaceId, payload, function(result) {
                let final = {
                    data: {
                        authentication: result
                    }
                };
                if (result) {
                    final = {
                        data: {
                            authentication: result.auth,
                            user: {
                                name: result.user.name,
                                email: result.user.email
                            }
                        }

                    }
                    iotPublish(final);

                    // Create signed url from Client to pub/sub MQTT over WS
                    // @TODO FIX ME!!!
                    getRoleURL(result, function(url) {
                        final.data.url = url;
                        console.log('Final result:', final);

                        callback(null, final);
                        context.done();
                    })
                } else {

                    iotPublish(final);
                    callback(final);
                    context.done();
                }
            });

        }
    });
};
