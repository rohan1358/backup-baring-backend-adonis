const {S3Client,ListBucketsCommand} = require("@aws-sdk/client-s3")

async function test() {const s3 = new S3Client({
    apiVersion : 'latest',
    region  : 'id-jkt-1',
    credentials : {
        accessKeyId    : '31d1bb3c03e4e78dc41b',
        secretAccessKey : 'd4ERWF8d/9TqNdFweB/8aqAhwpYELTICojni4sWA',
    },
    endpoint : 'http://s3-id-jkt-1.kilatstorage.id/'
})

const command = new ListBucketsCommand({})

const response = await s3.send(command);
console.log(response)
}

test()