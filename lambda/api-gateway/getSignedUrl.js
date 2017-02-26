'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
const s3 = new aws.S3();

exports.handler = (event, context, callback) => {
    if (event.requestParams.path.indexOf('authentication') > -1 || event.requestParams.path.indexOf('registration') > -1) {
        if (process.env.BUCKET) {
            let key = (event.requestParams.path.indexOf('authentication') > -1) ? 'authentication' : 'registration';

            s3.getSignedUrl('putObject', {
                    Bucket: process.env.BUCKET,
                    Expires: 60 * 60,
                    Key: event.body.filename,
                    ContentType: 'application/octet-stream'
                },
                function(err, url) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(url)
                    callback(null, {
                        url: url
                    });
                });
        } else {
            callback({
                error: 'Alert admin invalid setup'
            });
        }


    } else {
        callback({
            error: 'Invalid path'
        });
    }

};
