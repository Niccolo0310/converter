import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { spawn } from "child_process";

// Funzione per sanitizzare il nome del file (rimuove caratteri non alfanumerici, tranne il punto)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

export async function POST(req) {
    const formData = await req.formData();
    const file = formData.get("file");
    let targetFormat = formData.get("targetFormat");

    if (!file) {
        return NextResponse.json({ message: "Nessun file caricato!" }, { status: 400 });
    }

    // Formati di output audio supportati
    const validFormats = ["mp3", "wav", "aac", "flac", "ogg"];
    if (!targetFormat || !validFormats.includes(targetFormat.toLowerCase())) {
        targetFormat = "mp3";
    } else {
        targetFormat = targetFormat.toLowerCase();
    }

    // Salva il file nella cartella public/uploads/audio
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/uploads/audio");

    // Crea la directory se non esiste
    await mkdir(uploadDir, { recursive: true });

    const sanitizedFileName = sanitizeFileName(file.name);
    const inputFilePath = path.join(uploadDir, `${Date.now()}-${sanitizedFileName}`);

    try {
        await writeFile(inputFilePath, buffer);
    } catch (error) {
        console.error("Errore nel salvataggio del file audio:", error);
        return NextResponse.json({ message: "Errore nel salvataggio del file audio!" }, { status: 500 });
    }

    // Imposta la cartella per l'output e crea se necessario
    const outputDir = path.join(uploadDir, "converted");
    await mkdir(outputDir, { recursive: true });
    const outputFileName = `${Date.now()}-converted.${targetFormat}`;
    const outputFilePath = path.join(outputDir, outputFileName);

    // Usa ffmpeg per convertire il file audio
    return new Promise((resolve, reject) => {
        const child = spawn("ffmpeg", ["-i", inputFilePath, outputFilePath]);
        let errorData = "";
        child.stderr.on("data", (data) => {
            errorData += data.toString();
        });
        child.on("close", (code) => {
            if (code === 0) {
                const relativePath = outputFilePath.split(path.join(process.cwd(), "public"))[1];
                const fileUrl = relativePath.replace(/\\/g, "/");
                resolve(NextResponse.json({
                    message: "Conversione audio completata! Scarica il file convertito.",
                    fileUrl: fileUrl,
                }));
            } else {
                console.error("Errore durante la conversione audio:", errorData);
                reject(NextResponse.json({ message: "Errore durante la conversione audio!" }, { status: 500 }));
            }
        });
        child.on("error", (err) => {
            console.error("Errore durante la conversione audio (spawn):", err);
            reject(NextResponse.json({ message: "Errore durante la conversione audio!" }, { status: 500 }));
        });
    });
}
