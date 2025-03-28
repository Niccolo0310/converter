import { writeFile, mkdir, stat, readdir, copyFile, unlink, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { spawn } from "child_process";

// --------------------------
// Funzione per sanitizzare il nome del file
// --------------------------
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

// --------------------------
// Funzione per convertire un file usando LibreOffice
// targetFormat deve essere "pdf" o "docx"
// --------------------------
const convertWithLibreOffice = (inputFile, outputDir, targetFormat) => {
    return new Promise((resolve, reject) => {
        const child = spawn("soffice", [
            "--headless",
            "--convert-to",
            targetFormat,
            "--outdir",
            outputDir,
            inputFile,
        ]);
        let errorData = "";
        child.stderr.on("data", (data) => {
            errorData += data.toString();
        });
        child.on("close", (code) => {
            if (code === 0) {
                const baseName = path.basename(inputFile, path.extname(inputFile));
                const outputFile = path.join(outputDir, baseName + "." + targetFormat);
                resolve(outputFile);
            } else {
                reject(new Error("Errore nella conversione con LibreOffice: " + errorData));
            }
        });
        child.on("error", (err) => {
            reject(err);
        });
    });
};

// --------------------------
// POST: Carica il file, lo converte e restituisce URL per il download
// Utilizza la cartella /tmp per Vercel
// --------------------------
export async function POST(req) {
    // Configura PATH per pdftocairo e LibreOffice (su macOS)
    process.env.PATH = process.env.PATH + ":/opt/homebrew/bin";
    process.env.POPPLER_PATH = "/opt/homebrew/bin";

    const formData = await req.formData();
    const file = formData.get("file");
    let targetFormat = formData.get("targetFormat");

    if (!file) {
        return NextResponse.json({ message: "Nessun file caricato!" }, { status: 400 });
    }

    // Formati supportati: PNG, JPEG, TIFF, PDF, DOCX
    const validFormats = ['png', 'jpeg', 'tiff', 'pdf', 'docx'];
    if (!targetFormat || !validFormats.includes(targetFormat.toLowerCase())) {
        targetFormat = 'png';
    } else {
        targetFormat = targetFormat.toLowerCase();
    }

    // Usa la cartella /tmp/uploads per i file temporanei su Vercel
    const uploadDir = path.join("/tmp", "uploads");
    const shareDir = path.join(uploadDir, "shared");

    try {
        await mkdir(shareDir, { recursive: true });
    } catch (err) {
        console.error("Errore nella creazione della directory shareDir:", err);
        return NextResponse.json({ message: "Errore creazione directory!" }, { status: 500 });
    }

    const sanitizedFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    const originalFilePath = path.join(shareDir, uniqueName);

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(originalFilePath, buffer);
    } catch (error) {
        console.error("Errore nel salvataggio del file:", error);
        return NextResponse.json({ message: "Errore nel salvataggio del file!" }, { status: 500 });
    }

    console.log("File caricato:", originalFilePath);

    let filePath = originalFilePath;
    const inputExt = path.extname(sanitizedFileName).toLowerCase();
    const convertedDir = path.join(uploadDir, "converted");
    try {
        await mkdir(convertedDir, { recursive: true });
    } catch (err) {
        console.error("Errore nella creazione della directory converted:", err);
    }

    let finalOutputPath = "";
    const timestamp = Date.now().toString();

    // Caso 1: Conversione in immagine (PNG, JPEG, TIFF)
    if (['png', 'jpeg', 'tiff'].includes(targetFormat)) {
        if (inputExt !== ".pdf") {
            try {
                console.log("Conversione in PDF in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "pdf");
                console.log("PDF generato:", filePath);
            } catch (error) {
                console.error("Errore nella conversione in PDF:", error);
                return NextResponse.json({ message: "Errore nella conversione in PDF!" }, { status: 500 });
            }
        }
        let flag, extForImage;
        if (targetFormat === 'png') { flag = '-png'; extForImage = 'png'; }
        else if (targetFormat === 'jpeg') { flag = '-jpeg'; extForImage = 'jpg'; }
        else if (targetFormat === 'tiff') { flag = '-tiff'; extForImage = 'tiff'; }

        await new Promise((resolve, reject) => {
            const child = spawn("/opt/homebrew/bin/pdftocairo", [
                flag,
                "-scale-to",
                "1024",
                filePath,
                path.join(convertedDir, timestamp),
            ]);
            let errorData = "";
            child.stderr.on("data", (data) => {
                errorData += data.toString();
            });
            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    console.error("Errore conversione PDF->immagine:", errorData);
                    reject(new Error("Errore conversione PDF->immagine"));
                }
            });
            child.on("error", (err) => {
                console.error("Errore spawn pdftocairo:", err);
                reject(err);
            });
        });
        try {
            const files = await readdir(convertedDir);
            console.log("Files convertiti:", files);
            const matchingFiles = files.filter(f => f.startsWith(timestamp));
            if (matchingFiles.length === 0) {
                return NextResponse.json({ message: "Errore: nessun file immagine generato!" }, { status: 500 });
            }
            if (matchingFiles.length === 1) {
                finalOutputPath = path.join(convertedDir, matchingFiles[0]);
            } else {
                // Crea un archivio ZIP se ci sono più file
                const AdmZip = require("adm-zip");
                const zip = new AdmZip();
                for (const f of matchingFiles) {
                    zip.addLocalFile(path.join(convertedDir, f));
                }
                const zipName = `${timestamp}-converted.zip`;
                finalOutputPath = path.join(convertedDir, zipName);
                zip.writeZip(finalOutputPath);
            }
        } catch (err) {
            console.error("Errore lettura cartella convertita:", err);
            return NextResponse.json({ message: "Errore lettura cartella convertita!" }, { status: 500 });
        }
    }
    // Caso 2: Conversione in PDF
    else if (targetFormat === 'pdf') {
        if (inputExt !== ".pdf") {
            try {
                console.log("Conversione in PDF in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "pdf");
                console.log("PDF generato:", filePath);
            } catch (error) {
                console.error("Errore conversione in PDF:", error);
                return NextResponse.json({ message: "Errore nella conversione in PDF!" }, { status: 500 });
            }
        }
        finalOutputPath = path.join(convertedDir, `${timestamp}-converted.pdf`);
        try {
            await copyFile(filePath, finalOutputPath);
        } catch (err) {
            console.error("Errore copia PDF:", err);
            return NextResponse.json({ message: "Errore nella copia del file PDF!" }, { status: 500 });
        }
    }
    // Caso 3: Conversione in DOCX
    else if (targetFormat === 'docx') {
        if (inputExt === ".pdf") {
            console.error("Conversione da PDF a DOCX non supportata!");
            return NextResponse.json({ message: "Conversione da PDF a DOCX non supportata!" }, { status: 400 });
        }
        if (inputExt !== ".docx") {
            try {
                console.log("Conversione in DOCX in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "docx");
                console.log("DOCX generato:", filePath);
            } catch (error) {
                console.error("Errore conversione in DOCX:", error);
                return NextResponse.json({ message: "Errore nella conversione in DOCX!" }, { status: 500 });
            }
        }
        finalOutputPath = filePath;
    }

    if (!finalOutputPath) {
        return NextResponse.json({ message: "Errore: nessun file convertito generato!" }, { status: 500 });
    }

    // Costruisci l'URL relativo: rimuovi la parte "/tmp" e usa una stringa che il frontend possa usare
    const relativePath = finalOutputPath.split("/tmp")[1];
    const fileUrl = relativePath.replace(/\\/g, "/");

    console.log("File finale generato:", finalOutputPath);

    // Programma una cancellazione automatica dopo 5 minuti, nel caso il file non venga scaricato
    setTimeout(async () => {
        try {
            await unlink(finalOutputPath);
            console.log("Timed deletion: converted file deleted:", finalOutputPath);
        } catch (err) {
            console.error("Timed deletion error for converted file:", err);
        }
        try {
            await unlink(originalFilePath);
            console.log("Timed deletion: original file deleted:", originalFilePath);
        } catch (err) {
            console.error("Timed deletion error for original file:", err);
        }
    }, 5 * 60 * 1000); // 5 minuti

    return NextResponse.json({
        message: "Conversione completata! Scarica il file convertito.",
        fileUrl: fileUrl,
        originalUrl: `/uploads/shared/${sanitizedFileName}`
    });
}

// --------------------------
// GET: Scarica il file convertito e cancella immediatamente sia il file convertito che l'originale
// (Questa route viene utilizzata se l'utente scarica il file prima che scada il timer di 5 minuti)
// --------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file"); // percorso relativo del file convertito o ZIP
    const origParam = searchParams.get("orig"); // percorso relativo del file originale

    if (!fileParam) {
        return NextResponse.json({ error: "File non specificato" }, { status: 400 });
    }

    const filePath = path.join("/tmp", "uploads", "converted", fileParam);
    let originalFilePath = null;
    if (origParam) {
        originalFilePath = path.join("/tmp", "uploads", "shared", origParam);
    }

    try {
        const buffer = await readFile(filePath);
        // Elimina il file convertito subito dopo la lettura
        await unlink(filePath);
        // Se il file è uno ZIP, elimina anche i file correlati
        if (filePath.endsWith(".zip")) {
            const dir = path.dirname(filePath);
            const prefix = path.basename(filePath, ".zip");
            const files = await readdir(dir);
            for (const f of files) {
                if (f.startsWith(prefix) && !f.endsWith(".zip")) {
                    try {
                        await unlink(path.join(dir, f));
                        console.log("Deleted related file:", path.join(dir, f));
                    } catch (err) {
                        console.error("Error deleting related file:", err);
                    }
                }
            }
        }
        // Elimina anche il file originale, se presente
        if (originalFilePath) {
            try {
                await unlink(originalFilePath);
                console.log("Original file deleted:", originalFilePath);
            } catch (err) {
                console.error("Error deleting original file:", err);
            }
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
            },
        });
    } catch (error) {
        console.error("Errore durante il download o la cancellazione:", error);
        return NextResponse.json({ error: "File non trovato o già cancellato!" }, { status: 404 });
    }
}