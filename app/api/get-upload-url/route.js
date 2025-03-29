import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// Verifica che le variabili d'ambiente siano definite
if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION ||
    !process.env.AWS_BUCKET_NAME
) {
    console.error("Error: Una o più variabili d'ambiente AWS non sono impostate.");
}

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function POST(req) {
    try {
        // Ricevi dal client fileName e fileType (MIME type) in formato JSON
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
            ACL: "public-read", // Se desideri che il file sia pubblico; altrimenti rimuovi questa proprietà
        };
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
                // Ricevi dal client fileName e fileType (MIME type) in formato JSON
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
                    ACL: "public-read", // Imposta a public-read se vuoi che il file sia accessibile pubblicamente
                };

                console.info("Generating signed URL with params:", s3Params);
                const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);
                return NextResponse.json({ uploadUrl, key: Key });
            } catch (error) {
                console.error("Error generating signed URL:", error);
                return NextResponse.json({ message: "Error generating signed URL" }, { status: 500 });
            }
        }

        export async function GET(request) {
            return NextResponse.json({ message: "Use POST to generate an upload URL" });
        }
        console.info("Generating signed URL with parameters:", s3Params);
        const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);

        return NextResponse.json({ uploadUrl, key: Key });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json({ message: "Error generating signed URL" }, { status: 500 });
    }
}

export async function GET(request) {
    return NextResponse.json({ message: "Use POST to generate an upload URL" });
}