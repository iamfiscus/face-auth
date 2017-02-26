// @TODO dotenv
// KEY
// CERT
// CA
// REGION
// SUBSCRIBE
// CLIENT

var awsIot = require('aws-iot-device-sdk')
//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//

// https://www.digikey.com/en/articles/techzone/2016/sep/develop-iot-applications-fast-with-open-source-hardware
// https://www.hackster.io/bltrobotics/example-lcd-display-92f1e2?team=11520

// beaglebone black
// https://github.com/julianduque/beaglebone-io
var five = require('johnny-five');
var BeagleBone = require('beaglebone-io');

var board = new five.Board({
  io: new BeagleBone()
});

var device = awsIot.device({
    clientId: "HacksterDemo",
    caPath: process.env.CA_PATH,
    certPath: process.env.CERT_PATH,
    keyPath: process.env.KEY_PATH,
    region: process.env.REGION
});
device
    .on('connect', function() {
        console.log('connect');
        device.subscribe(process.env.TOPIC);
    });
device
    .on('message', function(topic, payload) {
        console.log('message', topic, payload.toString());

        board.on("ready", function() {

            var lcd = new five.LCD({
                controller: 'JHD1313M1'
            });

            lcd.print('Hello ' + payload.data.user.name);
        });
    });
