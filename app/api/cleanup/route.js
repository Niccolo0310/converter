import { readdir, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function POST() {
    // Imposta la directory da pulire (es. i file convertiti in audio)
    const dir = path.join("/tmp", "uploads", "audio", "converted");

    try {
        const files = await readdir(dir);
        for (const file of files) {
            await unlink(path.join(dir, file));
        }
        return NextResponse.json({ message: "Tutti i file convertiti eliminati!" });
    } catch (error) {
        console.error("Errore nella pulizia dei file:", error);
        return NextResponse.json({ error: "Impossibile eliminare i file!" }, { status: 500 });
    }
}

export async function GET(request) {
    return await POST(request);
}