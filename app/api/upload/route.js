import { writeFile, stat, readdir, copyFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { spawn } from "child_process";

// Funzione per sanitizzare il nome del file (rimuove caratteri non alfanumerici, tranne il punto)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

// Funzione per convertire un file usando LibreOffice
// targetFormat deve essere "pdf" o "docx"
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

export async function POST(req) {
    // Configura PATH per pdftocairo e LibreOffice
    process.env.PATH = process.env.PATH + ":/opt/homebrew/bin";
    process.env.POPPLER_PATH = "/opt/homebrew/bin";

    const formData = await req.formData();
    const file = formData.get("file");
    let targetFormat = formData.get("targetFormat");

    if (!file) {
        return NextResponse.json({ message: "Nessun file caricato!" }, { status: 400 });
    }

    // I formati di destinazione supportati: PNG, JPEG, TIFF, PDF, DOCX
    const validFormats = ['png', 'jpeg', 'tiff', 'pdf', 'docx'];
    if (!targetFormat || !validFormats.includes(targetFormat.toLowerCase())) {
        targetFormat = 'png';
    } else {
        targetFormat = targetFormat.toLowerCase();
    }

    // Leggi il file in arrayBuffer e salvalo nella cartella uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/uploads");

    const sanitizedFileName = sanitizeFileName(file.name);
    console.log("Nome file originale:", file.name);
    console.log("Nome file sanitizzato:", sanitizedFileName);

    try {
        await writeFile(path.join(uploadDir, sanitizedFileName), buffer);
    } catch (error) {
        console.error("Errore nel salvataggio del file:", error);
        return NextResponse.json({ message: "Errore nel salvataggio del file!" }, { status: 500 });
    }

    try {
        const stats = await stat(path.join(uploadDir, sanitizedFileName));
        console.log("File salvato, dimensione:", stats.size);
    } catch (error) {
        console.error("Errore nel leggere il file salvato:", error);
    }

    let filePath = path.join(uploadDir, sanitizedFileName);
    const inputExt = path.extname(sanitizedFileName).toLowerCase();
    const outputDir = path.join(uploadDir, "converted");
    let finalOutputPath = "";
    const timestamp = Date.now().toString();

    // Caso 1: Conversione in immagine (PNG, JPEG, TIFF)
    if (['png', 'jpeg', 'tiff'].includes(targetFormat)) {
        // Se il file non è già PDF, convertilo in PDF
        if (inputExt !== ".pdf") {
            try {
                console.log("Input non è PDF; conversione in PDF in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "pdf");
                console.log("Conversione in PDF completata:", filePath);
            } catch (error) {
                console.error("Errore nella conversione in PDF:", error);
                return NextResponse.json({ message: "Errore nella conversione in PDF!" }, { status: 500 });
            }
        }
        // Ora filePath punta a un PDF; convertiamolo in immagine con pdftocairo
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
                path.join(outputDir, timestamp),
            ]);
            let errorData = "";
            child.stderr.on("data", (data) => {
                errorData += data.toString();
            });
            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    console.error("Errore durante la conversione PDF->immagine:", errorData);
                    reject(new Error("Errore durante la conversione PDF->immagine"));
                }
            });
            child.on("error", (err) => {
                console.error("Errore durante la conversione (spawn):", err);
                reject(err);
            });
        });
        try {
            const files = await readdir(outputDir);
            console.log("Files nella cartella convertita:", files);
            let outputFile = files.find(fname => fname.startsWith(timestamp) && fname.endsWith(`-1.${extForImage}`));
            if (!outputFile) {
                outputFile = files.find(fname => fname.startsWith(timestamp));
            }
            if (outputFile) {
                finalOutputPath = path.join(outputDir, outputFile);
            } else {
                return NextResponse.json({ message: "Errore: file immagine non generato!" }, { status: 500 });
            }
        } catch (err) {
            console.error("Errore durante la lettura della cartella convertita:", err);
            return NextResponse.json({ message: "Errore durante la lettura della cartella convertita!" }, { status: 500 });
        }
    }
    // Caso 2: Conversione in PDF
    else if (targetFormat === 'pdf') {
        if (inputExt !== ".pdf") {
            try {
                console.log("Conversione in PDF in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "pdf");
                console.log("Conversione in PDF completata:", filePath);
            } catch (error) {
                console.error("Errore nella conversione in PDF:", error);
                return NextResponse.json({ message: "Errore nella conversione in PDF!" }, { status: 500 });
            }
        }
        finalOutputPath = path.join(outputDir, `${timestamp}-converted.pdf`);
        try {
            await copyFile(filePath, finalOutputPath);
        } catch (err) {
            console.error("Errore nella copia del file PDF:", err);
            return NextResponse.json({ message: "Errore nella copia del file PDF!" }, { status: 500 });
        }
    }
    // Caso 3: Conversione in DOCX
    else if (targetFormat === 'docx') {
        // Conversione da PDF a DOCX non è supportata
        if (inputExt === ".pdf") {
            console.error("Conversione da PDF a DOCX non supportata!");
            return NextResponse.json({ message: "Conversione da PDF a DOCX non supportata!" }, { status: 400 });
        }
        // Se il file non è già DOCX, convertilo in DOCX
        if (inputExt !== ".docx") {
            try {
                console.log("Conversione in DOCX in corso...");
                filePath = await convertWithLibreOffice(filePath, uploadDir, "docx");
                console.log("Conversione in DOCX completata:", filePath);
            } catch (error) {
                console.error("Errore nella conversione in DOCX:", error);
                return NextResponse.json({ message: "Errore nella conversione in DOCX!" }, { status: 500 });
            }
        }
        // In questo caso, il file convertito è già prodotto in uploadDir
        finalOutputPath = filePath;
    }

    if (!finalOutputPath) {
        return NextResponse.json({ message: "Errore: nessun file convertito generato!" }, { status: 500 });
    }

    // Costruisci l'URL relativo (la cartella public è servita come root)
    const relativePath = finalOutputPath.split(path.join(process.cwd(), "public"))[1];
    const fileUrl = relativePath.replace(/\\/g, "/");

    console.log("File finale generato:", finalOutputPath);
    return NextResponse.json({
        message: "Conversione completata! Scarica il file convertito.",
        fileUrl: fileUrl,
    });
}
