import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Funzione per sanitizzare il nome del file (rimuove caratteri non alfanumerici, tranne il punto)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

export async function POST(req) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json({ message: "Nessun file caricato!" }, { status: 400 });
    }

    // Converte il file in Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Imposta la directory di condivisione
    const shareDir = path.join(process.cwd(), "public/uploads/shared");

    // Crea la directory se non esiste
    try {
        await mkdir(shareDir, { recursive: true });
    } catch (err) {
        console.error("Errore nella creazione della directory shareDir:", err);
    }

    // Sanitizza il nome del file e aggiungi un timestamp per evitare collisioni
    const sanitizedFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = path.join(shareDir, uniqueName);

    try {
        await writeFile(filePath, buffer);
    } catch (error) {
        console.error("Errore nel salvataggio del file:", error);
        return NextResponse.json({ message: "Errore nel salvataggio del file!" }, { status: 500 });
    }

    // Costruisci l'URL relativo (la cartella "public" è servita come root)
    const fileUrl = `/uploads/shared/${uniqueName}`;

    return NextResponse.json({
        message: "File condiviso con successo!",
        fileUrl: fileUrl,
    });
}
