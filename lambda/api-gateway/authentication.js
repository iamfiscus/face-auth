'use strict';

const aws = require('aws-sdk');
const rekognition = new aws.Rekognition();
const iotData = new aws.IotData({
    endpoint: process.env.IOT_ENDPOINT
});
const dynamodb = new aws.DynamoDB.DocumentClient();

let getUser = function(face, callback) {
    var params = {
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
                    callback(null, final);
                    context.done();
                } else {

                    iotPublish(final);
                    callback(final);
                    context.done();
                }
            });

        }
    });
};
