import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// Configura S3 usando le variabili d'ambiente
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function POST(req) {
    try {
        // Ricevi dal client fileName e fileType (MIME type)
        const { fileName, fileType } = await req.json();
        if (!fileName || !fileType) {
            return NextResponse.json({ message: "Missing fileName or fileType" }, { status: 400 });
        }

        // Crea una chiave unica per il file
        const Key = `uploads/${Date.now()}-${fileName}`;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key,
            Expires: 60 * 5, // URL valido per 5 minuti
            ContentType: fileType,
            ACL: "public-read", // Se vuoi che il file sia pubblico, altrimenti rimuovi questa proprietà e genera URL per download
        };

        const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);
        return NextResponse.json({ uploadUrl, key: Key });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json({ message: "Error generating signed URL" }, { status: 500 });
    }
}