'use strict';

console.log('Loading function');

const aws = require('aws-sdk');
const rekognition = new aws.Rekognition();

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    let params = {
        CollectionId: process.env.COLLECTION_ID,
        DetectionAttributes: [],
        ExternalImageId: new Date().toString(),
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: key
            }
        }
    };
    rekognition.indexFaces(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            console.log(data); // successful response
            // @TODO update ddb record
            /*
            data = {
             FaceRecords: [
                {
               Face: {
                BoundingBox: {
                 Height: 0.33481481671333313,
                 Left: 0.31888890266418457,
                 Top: 0.4933333396911621,
                 Width: 0.25
                },
                Confidence: 99.9991226196289,
                FaceId: "ff43d742-0c13-5d16-a3e8-03d3f58e980b",
                ImageId: "465f4e93-763e-51d0-b030-b9667a2d94b1"
               },
               FaceDetail: {
                BoundingBox: {
                 Height: 0.33481481671333313,
                 Left: 0.31888890266418457,
                 Top: 0.4933333396911621,
                 Width: 0.25
                },
                Confidence: 99.9991226196289,
                Landmarks: [
                   {
                  Type: "EYE_LEFT",
                  X: 0.3976764678955078,
                  Y: 0.6248345971107483
                 },
                   {
                  Type: "EYE_RIGHT",
                  X: 0.4810936450958252,
                  Y: 0.6317117214202881
                 },
                   {
                  Type: "NOSE_LEFT",
                  X: 0.41986238956451416,
                  Y: 0.7111940383911133
                 },
                   {
                  Type: "MOUTH_DOWN",
                  X: 0.40525302290916443,
                  Y: 0.7497701048851013
                 },
                   {
                  Type: "MOUTH_UP",
                  X: 0.4753248989582062,
                  Y: 0.7558549642562866
                 }
                ],
                Pose: {
                 Pitch: -9.713645935058594,
                 Roll: 4.707281112670898,
                 Yaw: -24.438663482666016
                },
                Quality: {
                 Brightness: 29.23358917236328,
                 Sharpness: 80
                }
               }
              },
                {
               Face: {
                BoundingBox: {
                 Height: 0.32592591643333435,
                 Left: 0.5144444704055786,
                 Top: 0.15111111104488373,
                 Width: 0.24444444477558136
                },
                Confidence: 99.99950408935547,
                FaceId: "8be04dba-4e58-520d-850e-9eae4af70eb2",
                ImageId: "465f4e93-763e-51d0-b030-b9667a2d94b1"
               },
               FaceDetail: {
                BoundingBox: {
                 Height: 0.32592591643333435,
                 Left: 0.5144444704055786,
                 Top: 0.15111111104488373,
                 Width: 0.24444444477558136
                },
                Confidence: 99.99950408935547,
                Landmarks: [
                   {
                  Type: "EYE_LEFT",
                  X: 0.6006892323493958,
                  Y: 0.290842205286026
                 },
                   {
                  Type: "EYE_RIGHT",
                  X: 0.6808141469955444,
                  Y: 0.29609042406082153
                 },
                   {
                  Type: "NOSE_LEFT",
                  X: 0.6395332217216492,
                  Y: 0.3522595763206482
                 },
                   {
                  Type: "MOUTH_DOWN",
                  X: 0.5892083048820496,
                  Y: 0.38689887523651123
                 },
                   {
                  Type: "MOUTH_UP",
                  X: 0.674560010433197,
                  Y: 0.394125759601593
                 }
                ],
                Pose: {
                 Pitch: -4.683138370513916,
                 Roll: 2.1029529571533203,
                 Yaw: 6.716655254364014
                },
                Quality: {
                 Brightness: 34.951698303222656,
                 Sharpness: 160
                }
               }
              }
             ],
             OrientationCorrection: "ROTATE_0"
            }
            */
        }
    });

};
