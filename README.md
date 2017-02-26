# Face Auth
This is a prototype hackathon project based on information learned at AWS RE:Invent. Specifically the [Processing IoT Server Data Using Serverless Architectures](https://twitter.com/iamfiscus/status/803296681575911425). *It is still a work in progress*.

The end result is for the browsers webcam to register and authenticate based on Serverless Architectures IoT, and Rekognition from AWS. Then broadcast the response to both HTTP and MQTT. Everything is written in HTML5, CSS, and Javascript.

### Stack
- AWS
  - [Rekognition](https://aws.amazon.com/rekognition/)
  - [Internet of Things (IoT)](https://aws.amazon.com/iot/)
  - [API Gateway](https://aws.amazon.com/api-gateway/)
  - [CloudFront](https://aws.amazon.com/cloudfront/)
  - [Lambda](https://aws.amazon.com/lambda/)
- [Webcam.js](https://github.com/jhuckaby/webcamjs)
- [BeagleBone Green](https://beagleboard.org/)
- [Claudia.js](https://claudiajs.com/)


### @TODO
- Automate build and deploy through Claudia.js
- Finish Frontend


# Initialize
### Create collection
```shell
aws rekognition create-collection \
--collection-id "PROJECT_NAME" \
--region us-east-1 \
--profile face-auth
```

### Create Lambda's
- Registration
  - Pre-signed URL
  - Form
- Authentication
  - Pre-signed URL
  - Form
  - S3 Trigger Compare
  - SNS Pass / Fail?



### Create Bucket
```shell
aws s3 mb s3://PROJECT_NAME \
--region us-east-1 \
--profile face-auth
```
##### Configure:
- Create Registration Folder
  - Add trigger to Lambda
- Create Authentication Folder
  - Delete after X amount of time
  - Add trigger to Lambda
  - Define test event

### Create IoT
- Create device
- Create certification
- Create topic  
  - Test MQTT


# Workflow
## Registration

### Get Pre-signed URL

### Upload to S3

### Save to Dynamo

### Index Image on Dynamo change trigger
```shell
aws rekognition index-faces \
--image '{"S3Object":{"Bucket":"PROJECT_NAME","Name":"object-key"}}' \
--collection-id "PROJECT_NAME" \
--detection-attributes "ALL" \
--external-image-id "example-image.jpg" \
--region us-east-1 \
--profile face-auth
```

## Authentication
### Get Pre-signed URL

### Upload to S3
- Only because of Base64

### Send request
- Lambda chain
- Return response to

### Trigger

### Compare Face on Base64 (future)
```shell
aws rekognition search-faces \
--face-id face-id \
--collection-id "" \
--region us-east-1 \
--profile face-auth
```
