import { writeFile, mkdir, stat, readdir, copyFile, unlink, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { spawn } from "child_process";

// ------------------------------------------------
// Funzione per sanitizzare il nome del file
// ------------------------------------------------
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

// ------------------------------------------------
// Funzione per convertire un file con LibreOffice
// (Richiede soffice installato su macOS/Linux)
// ------------------------------------------------
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

// ------------------------------------------------
// POST: Carica e converte il file (PDF, PNG, JPEG, TIFF, DOCX) e salva in /tmp
// ------------------------------------------------
export async function POST(req) {
    // Se stai su macOS in locale
    process.env.PATH = process.env.PATH + ":/opt/homebrew/bin";
    process.env.POPPLER_PATH = "/opt/homebrew/bin";

    const formData = await req.formData();
    const file = formData.get("file");
    let targetFormat = formData.get("targetFormat");

    if (!file) {
        return NextResponse.json({ message: "Nessun file caricato!" }, { status: 400 });
    }

    // Formati supportati
    const validFormats = ['png', 'jpeg', 'tiff', 'pdf', 'docx'];
    if (!targetFormat || !validFormats.includes(targetFormat.toLowerCase())) {
        targetFormat = 'png';
    } else {
        targetFormat = targetFormat.toLowerCase();
    }

    // Cartelle temporanee su Vercel: /tmp/uploads
    const uploadDir = path.join("/tmp", "uploads");
    const shareDir = path.join(uploadDir, "shared");

    try {
        await mkdir(shareDir, { recursive: true });
    } catch (err) {
        console.error("Errore nella creazione della directory shareDir:", err);
        return NextResponse.json({ message: "Errore creazione directory!" }, { status: 500 });
    }

    // Nome file univoco
    const sanitizedFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    const originalFilePath = path.join(shareDir, uniqueName);

    // Salva il file caricato
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

    // ----------------------------
    // CASO 1: Conversione in immagine (png, jpeg, tiff)
    // ----------------------------
    if (['png', 'jpeg', 'tiff'].includes(targetFormat)) {
        // Se non è PDF, convertilo in PDF con LibreOffice
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

        // Converte PDF -> immagine con pdftocairo
        let flag, extForImage;
        if (targetFormat === 'png') { flag = '-png'; extForImage = 'png'; }
        else if (targetFormat === 'jpeg') { flag = '-jpeg'; extForImage = 'jpg'; }
        else if (targetFormat === 'tiff') { flag = '-tiff'; extForImage = 'tiff'; }

        await new Promise((resolve, reject) => {
            const child = spawn("pdftocairo", [
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
            // Se c'è un solo file
            if (matchingFiles.length === 1) {
                finalOutputPath = path.join(convertedDir, matchingFiles[0]);
            } else {
                // Se ci sono più file (es. PDF multipagina), crea un archivio ZIP
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
        // ----------------------------
        // CASO 2: Conversione in PDF
    // ----------------------------
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
        // ----------------------------
        // CASO 3: Conversione in DOCX
    // ----------------------------
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

    // Rimuovi la parte "/tmp" dal percorso
    const relativePath = finalOutputPath.split("/tmp")[1];
    const fileUrl = relativePath.replace(/\\/g, "/");

    console.log("File finale generato:", finalOutputPath);

    // Timer 5 minuti se non scaricato
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
    }, 5 * 60 * 1000);

    return NextResponse.json({
        message: "Conversione completata! Scarica il file convertito.",
        fileUrl: fileUrl,
        originalUrl: `/uploads/shared/${sanitizedFileName}`
    });
}

// ------------------------------------------------
// GET: Scarica il file e cancella tutto
// ------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file");
    const origParam = searchParams.get("orig");

    if (!fileParam) {
        return NextResponse.json({ error: "File non specificato" }, { status: 400 });
    }

    // Cartelle
    const filePath = path.join("/tmp", "uploads", "converted", fileParam);
    let originalFilePath = null;
    if (origParam) {
        originalFilePath = path.join("/tmp", "uploads", "shared", origParam);
    }

    try {
        const buffer = await readFile(filePath);

        // Cancella il file convertito
        await unlink(filePath);

        // Se è un archivio ZIP, cancella i file correlati
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

        // Cancella il file originale se presente
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