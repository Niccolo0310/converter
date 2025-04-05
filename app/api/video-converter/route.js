import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { readFile, unlink } from "fs/promises";

export async function POST(req) {
    try {
        // Extract videoUrl from the request body
        const { videoUrl } = await req.json();
        if (!videoUrl) {
            return NextResponse.json({ message: "Video URL is required" }, { status: 400 });
        }

        // Define output file parameters
        const outputFileName = `audio-${Date.now()}.mp3`;
        const outputPath = path.join("/tmp", outputFileName);
        const ytDlpPath = "/opt/homebrew/bin/yt-dlp";

        console.log("Fetching video metadata...");
        // Spawn yt-dlp to fetch metadata in JSON format
        const metaProcess = spawn(ytDlpPath, [
            "--dump-json",
            "--no-playlist",
            videoUrl
        ]);

        let metaData = "";
        metaProcess.stdout.on("data", (data) => {
            metaData += data.toString();
        });

        await new Promise((resolve, reject) => {
            metaProcess.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("Failed to fetch metadata"));
                }
            });
            metaProcess.on("error", (err) => {
                reject(err);
            });
        });

        // Parse the metadata JSON
        const videoInfo = JSON.parse(metaData);
        const title = videoInfo.title || "unknown";
        const uploader = videoInfo.uploader || "unknown";

        console.log("Video title:", title);
        console.log("Uploader:", uploader);

        console.log("Starting audio extraction...");
        // Spawn yt-dlp to extract audio as MP3
        const ytDlp = spawn(ytDlpPath, [
            "--no-playlist",
            "-x",
            "--audio-format", "mp3",
            "-o", outputPath,
            videoUrl
        ]);

        let errorData = "";
        ytDlp.stderr.on("data", (data) => {
            errorData += data.toString();
            console.log("yt-dlp stderr:", data.toString());
        });

        await new Promise((resolve, reject) => {
            ytDlp.on("close", (code) => {
                console.log("yt-dlp process exited with code:", code);
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

        const fileBuffer = await readFile(outputPath);

        // Schedule automatic deletion after 5 minutes
        setTimeout(async () => {
            try {
                await unlink(outputPath);
                console.log("Temporary file deleted:", outputPath);
            } catch (err) {
                console.error("Error deleting temporary file:", err);
            }
        }, 5 * 60 * 1000);

        // Sanitize title and uploader to build a safe filename
        const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_');
        const safeUploader = uploader.replace(/[^a-zA-Z0-9-_]/g, '_');
        const finalFileName = `${safeTitle}-${safeUploader}-${outputFileName}`;

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${finalFileName}"`
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