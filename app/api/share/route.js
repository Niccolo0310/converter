import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Funzione per sanitizzare il nome del file (rimuove caratteri non alfanumerici, tranne il punto)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

// POST: Carica il file e lo salva in /tmp/uploads/shared
export async function POST(req) {
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

    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (err) {
        console.error("Error creating share directory:", err);
        return NextResponse.json({ message: "Error creating directory" }, { status: 500 });
    }

    // Crea un nome file univoco
    const sanitizedFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = path.join(uploadDir, uniqueName);

    try {
        await writeFile(filePath, buffer);
    } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json({ message: "Error saving file" }, { status: 500 });
    }

    console.log("File saved:", filePath);

    // Costruisci l'URL di download (la GET verrà chiamata con ?file=uniqueName)
    const fileUrl = `/api/share?file=${uniqueName}`;

    return NextResponse.json({
        message: "File shared successfully!",
        fileUrl: fileUrl,
    });
}

// GET: Scarica il file e lo cancella immediatamente dopo
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file");

    if (!fileParam) {
        return NextResponse.json({ error: "File not specified" }, { status: 400 });
    }

    const filePath = path.join("/tmp", "uploads", "shared", fileParam);

    try {
        const buffer = await readFile(filePath);
        // Elimina il file subito dopo averlo letto
        await unlink(filePath);
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileParam}"`
            },
        });
    } catch (error) {
        console.error("Error during file download:", error);
        return NextResponse.json({ error: "File not found or already deleted" }, { status: 404 });
    }
}