import { S3Client } from "@aws-sdk/client-s3";
import Env from '@ioc:Adonis/Core/Env'

const s3 = new S3Client({
    apiVersion: "latest",
    region: 'id-jkt-1',
    credentials: {
        accessKeyId: Env.get("CK_ACCESS"),
        secretAccessKey: Env.get("CK_SECRET")
    },
    endpoint: 'http://s3-id-jkt-1.kilatstorage.id/'
});

export default s3;