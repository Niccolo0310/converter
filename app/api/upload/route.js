import { NextResponse } from "next/server";
import AWS from "aws-sdk";

if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION ||
    !process.env.AWS_BUCKET_NAME
) {
    console.error("Error: AWS env variables not set.");
}

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function POST(req) {
    try {
        const { fileName, fileType, targetFormat } = await req.json();
        if (!fileName || !fileType) {
            return NextResponse.json({ message: "Missing fileName or fileType" }, { status: 400 });
        }

        // Se vuoi gestire logic con targetFormat, aggiungila qui:
        console.log("Target format selected:", targetFormat);

        const Key = `uploads/${Date.now()}-${fileName}`;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key,
            Expires: 60 * 5,
            ContentType: fileType,
            ACL: "public-read",
        };

        console.info("Generating signed URL with parameters:", s3Params);
        const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);
        return NextResponse.json({ uploadUrl, key: Key });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json({ message: "Error generating signed URL" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to generate an upload URL" });
}