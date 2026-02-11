// aws-config.ts
import { S3Client, PutObjectCommand, GetObjectCommand, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
export const generatePresignedUrl = async (cloudKey) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: cloudKey,
    });
    return await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
    });
};
export async function uploadFileToS3(file, formId) {
    const key = `uploads/forms/${formId}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    try {
        await s3Client.send(command);
        const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return {
            success: true,
            url: url,
            key: key,
        };
    }
    catch (error) {
        console.error("Upload error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
