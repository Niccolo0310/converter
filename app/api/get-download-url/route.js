import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// Configura S3 usando le variabili d'ambiente
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");
        if (!key) {
            return NextResponse.json({ message: "Missing key" }, { status: 400 });
        }

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 60 * 5, // URL valido per 5 minuti
        };

        const downloadUrl = await s3.getSignedUrlPromise("getObject", s3Params);
        return NextResponse.json({ downloadUrl });
    } catch (error) {
        console.error("Error generating download signed URL:", error);
        return NextResponse.json({ message: "Error generating download URL" }, { status: 500 });
    }
}