import { NextResponse } from "next/server";
import { readdir, unlink } from "fs/promises";
import path from "path";

export async function POST() {
    const dir = path.join(process.cwd(), "public/uploads/converted");

    try {
        const files = await readdir(dir);
        for (const file of files) {
            await unlink(path.join(dir, file));
        }
        return NextResponse.json({ message: "All files deleted!" });
    } catch (error) {
        console.error("Error cleaning files:", error);
        return NextResponse.json({ error: "Unable to delete files!" }, { status: 500 });
    }
}

export async function GET(request) {
    // Supporta richieste GET inviate tramite sendBeacon
    return await POST(request);
}