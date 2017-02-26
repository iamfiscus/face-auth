'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
const rekognition = new aws.Rekognition();
const dynamodb = new aws.DynamoDB();

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    event.Records.forEach((record) => {
        console.log(record.eventID);
        console.log(record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);

        if (record.eventName === 'INSERT') {

            let id = record.dynamodb.Keys.id.S;
            let key = record.dynamodb.NewImage.key.S;
            let params = {
                CollectionId: process.env.COLLECTION_ID,
                DetectionAttributes: [],
                ExternalImageId: id,
                Image: {
                    S3Object: {
                        Bucket: process.env.BUCKET,
                        Name: key
                    }
                }
            };
            console.log(params);
            rekognition.indexFaces(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                } else {
                    console.log(data); // successful response
                    // @TODO update ddb record
                    var params = {
                        ExpressionAttributeNames: {
                            "#FI": "face",
                            "#II": "image"
                        },
                        ExpressionAttributeValues: {
                            ":f": {
                                S: data.FaceRecords[0].Face.FaceId
                            },
                            ":i": {
                                S: data.FaceRecords[0].Face.ImageId
                            }
                        },
                        Key: {
                            "id": {
                                S: id
                            }
                        },
                        ReturnValues: "ALL_NEW",
                        TableName: process.env.TABLE_ID,
                        UpdateExpression: "SET #FI = :f, #II = :i"
                    };
                    dynamodb.updateItem(params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else console.log(data); // successful response
                    });
                }
            });

        }
    });
    callback(null, `Successfully processed ${event.Records.length} records.`);

};
