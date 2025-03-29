import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Funzione per sanitizzare il nome del file (rimuove caratteri non alfanumerici, tranne il punto)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

// POST: Carica il file e lo salva in /tmp/uploads/shared
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        // Converte il file in Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Imposta la directory di upload su /tmp/uploads/shared (scrivibile su Vercel)
        const uploadDir = path.join("/tmp", "uploads", "shared");

        // Crea la directory se non esiste
        await mkdir(uploadDir, { recursive: true });

        // Crea un nome file univoco
        const sanitizedFileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(uploadDir, uniqueName);

        // Salva il file
        await writeFile(filePath, buffer);
        console.log("File saved:", filePath);

        // Costruisci l'URL di download: la GET verrà chiamata con ?file=uniqueName
        const fileUrl = `/api/share?file=${uniqueName}`;

        return NextResponse.json({
            message: "File shared successfully!",
            fileUrl: fileUrl,
        });
    } catch (error) {
        console.error("Error in POST /api/share:", error);
        return NextResponse.json({ message: "Unexpected error in POST" }, { status: 500 });
    }
}

// GET: Scarica il file e lo cancella immediatamente dopo
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileParam = searchParams.get("file");

        if (!fileParam) {
            return NextResponse.json({ error: "File not specified" }, { status: 400 });
        }

        const filePath = path.join("/tmp", "uploads", "shared", fileParam);
        const buffer = await readFile(filePath);
        // Elimina il file subito dopo averlo letto
        await unlink(filePath);
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileParam}"`,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/share:", error);
        return NextResponse.json({ error: "File not found or already deleted" }, { status: 404 });
    }
}