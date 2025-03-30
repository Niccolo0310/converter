import { writeFile, mkdir, readFile, unlink, readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9.]/g, '_');
const baseUploadDir = path.join("/tmp", "uploads", "shared");

// POST: Carica file nella stanza
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const room = formData.get("room");

        if (!file || !room) {
            return NextResponse.json({ message: "Mancano file o numero stanza." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const roomDir = path.join(baseUploadDir, room);
        await mkdir(roomDir, { recursive: true });

        const sanitizedFileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(roomDir, uniqueName);

        await writeFile(filePath, buffer);

        // Costruisci l'URL includendo il numero stanza
        const fileUrl = `/api/share?room=${room}&file=${uniqueName}`;

        // Pianifica la cancellazione automatica dopo 3 ore (3 * 60 * 60 * 1000 ms)
        setTimeout(async () => {
            try {
                await unlink(filePath);
                console.log("File eliminato dopo 3 ore:", filePath);
            } catch (err) {
                console.error("Errore cancellando file dopo 3 ore:", err);
            }
        }, 3 * 60 * 60 * 1000);

        return NextResponse.json({ message: "File caricato!", fileUrl });
    } catch (error) {
        console.error("Errore nella POST /api/share:", error);
        return NextResponse.json({ message: "Errore caricando il file." }, { status: 500 });
    }
}

// GET: Scarica il file dalla stanza
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file");
    const roomParam = searchParams.get("room");

    if (!fileParam || !roomParam) {
        return NextResponse.json({ error: "Parametri mancanti." }, { status: 400 });
    }

    const filePath = path.join(baseUploadDir, roomParam, fileParam);

    try {
        const buffer = await readFile(filePath);
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileParam}"`,
            },
        });
    } catch (error) {
        console.error("Errore nella GET /api/share:", error);
        return NextResponse.json({ error: "File non trovato o già eliminato." }, { status: 404 });
    }
}

// PUT: Elenca i file presenti nella stanza
export async function PUT(request) {
    try {
        const { room } = await request.json();
        if (!room) {
            return NextResponse.json({ error: "Numero stanza mancante." }, { status: 400 });
        }
        const roomDir = path.join(baseUploadDir, room);
        const files = await readdir(roomDir);
        return NextResponse.json({ files });
    } catch (error) {
        console.error("Errore nel PUT /api/share:", error);
        return NextResponse.json({ files: [] });
    }
}