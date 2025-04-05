import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { readFile, unlink } from "fs/promises";

export async function POST(req) {
    try {
        // Ricevi dal body l'URL del video (assicurati che sia il tuo video)
        const { videoUrl } = await req.json();
        if (!videoUrl) {
            return NextResponse.json({ message: "Video URL is required" }, { status: 400 });
        }

        // Definisci un nome file unico e il percorso di output nella cartella temporanea
        const outputFileName = `audio-${Date.now()}.mp3`;
        const outputPath = path.join("/tmp", outputFileName);

        // Usa il percorso completo per yt-dlp
        const ytDlpPath = "/opt/homebrew/bin/yt-dlp";

        // Esegui yt-dlp per estrarre l'audio in formato mp3
        const ytDlp = spawn(ytDlpPath, [
            "-x",
            "--audio-format", "mp3",
            "-o", outputPath,
            videoUrl
        ]);

        let errorData = "";
        ytDlp.stderr.on("data", (data) => {
            errorData += data.toString();
        });

        await new Promise((resolve, reject) => {
            ytDlp.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("yt-dlp failed: " + errorData));
                }
            });
            ytDlp.on("error", (err) => {
                reject(err);
            });
        });

        // Leggi il file convertito
        const fileBuffer = await readFile(outputPath);

        // Pianifica la cancellazione automatica del file dopo 5 minuti
        setTimeout(async () => {
            try {
                await unlink(outputPath);
                console.log("Temporary audio file deleted:", outputPath);
            } catch (err) {
                console.error("Error deleting temporary file:", err);
            }
        }, 5 * 60 * 1000); // 5 minuti

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${outputFileName}"`
            }
        });
    } catch (error) {
        console.error("Error in /api/video-converter route:", error);
        return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to convert a video" });
}