import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { readFile, unlink } from "fs/promises";

export async function POST(req) {
    try {
        const { videoUrl } = await req.json();
        if (!videoUrl) {
            return NextResponse.json({ message: "Video URL is required" }, { status: 400 });
        }

        // Temporary file in /tmp
        const tempFileName = `video-${Date.now()}.mp4`;
        const outputPath = path.join("/tmp", tempFileName);

        // Path to yt-dlp
        const ytDlpPath = "/opt/homebrew/bin/yt-dlp"; // Adjust if different

        console.log("Fetching video metadata...");
        const metaProcess = spawn(ytDlpPath, [
            "--dump-json",
            "--skip-download",    // Don’t download yet, just metadata
            "--no-playlist",
            videoUrl,
        ]);

        let metaData = "";
        metaProcess.stdout.on("data", (data) => {
            metaData += data.toString();
        });

        await new Promise((resolve, reject) => {
            metaProcess.on("close", (code) => {
                console.log("Metadata process exited with code:", code);
                if (code === 0) {
                    resolve();
                } else {
                    console.error("Metadata process error output:", metaData);
                    reject(new Error("Failed to fetch metadata"));
                }
            });
            metaProcess.on("error", (err) => {
                console.error("Error spawning metadata process:", err);
                reject(err);
            });
        });

        if (!metaData.trim()) {
            console.error("No metadata received. Raw output:", metaData);
            throw new Error("No metadata received");
        }

        console.log("Raw metadata:", metaData);
        const videoInfo = JSON.parse(metaData);
        const title = videoInfo.title || "downloaded-video";
        console.log("Video title:", title);

        // Now do the actual download + re-encode
        console.log("Starting video download as MP4 with H.264/AAC...");
        // Key option is: --recode-video mp4
        // which re-encodes the video into a QuickTime-friendly container/codec
        const ytDlp = spawn(ytDlpPath, [
            "--no-playlist",
            "-f", "bestvideo+bestaudio",
            "--recode-video", "mp4",
            "-o", outputPath,
            videoUrl,
        ]);

        let downloadErrorData = "";
        ytDlp.stderr.on("data", (data) => {
            downloadErrorData += data.toString();
            console.log("yt-dlp stderr:", data.toString());
        });

        await new Promise((resolve, reject) => {
            ytDlp.on("close", (code) => {
                console.log("yt-dlp download process exited with code:", code);
                if (code === 0) {
                    resolve();
                } else {
                    console.error("yt-dlp download error output:", downloadErrorData);
                    reject(new Error("yt-dlp failed: " + downloadErrorData));
                }
            });
            ytDlp.on("error", (err) => {
                console.error("Error spawning yt-dlp download process:", err);
                reject(err);
            });
        });

        // Read the re-encoded MP4 from disk
        const fileBuffer = await readFile(outputPath);

        // Schedule automatic deletion after 5 minutes
        setTimeout(async () => {
            try {
                await unlink(outputPath);
                console.log("Temporary video file deleted:", outputPath);
            } catch (err) {
                console.error("Error deleting temporary file:", err);
            }
        }, 5 * 60 * 1000);

        // Clean up the title for the final file name
        const safeTitle = title
            .replace(/[^a-zA-Z0-9\s\-\(\)_]/g, "_")
            .trim() || "downloaded-video";
        const finalFileName = `${safeTitle}.mp4`;

        console.log("Final file name:", finalFileName);

        // Return the file with a proper Content-Disposition
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="${finalFileName}"; filename*=UTF-8''${encodeURIComponent(finalFileName)}`,
            },
        });
    } catch (error) {
        console.error("Error in /api/video-to-mp4 route:", error);
        return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to convert a video" });
}