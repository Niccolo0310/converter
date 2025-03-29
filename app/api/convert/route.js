import { NextResponse } from "next/server";

export async function POST(req) {
    // Ottieni i dati dal form
    const formData = await req.formData();
    const file = formData.get("file");
    let targetFormat = formData.get("targetFormat") || "png"; // default png

    if (!file) {
        return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Converti il file in Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Se il target è PDF, non è necessaria conversione: restituisci il file originale
    if (targetFormat === "pdf") {
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="converted.pdf"'
            }
        });
    }

    // Determina l'endpoint API in base al target
    let endpoint = "";
    if (targetFormat === "png") {
        endpoint = "https://api.cloudmersive.com/convert/pdf/to/png";
    } else if (targetFormat === "jpeg") {
        endpoint = "https://api.cloudmersive.com/convert/pdf/to/jpg";
    } else {
        return NextResponse.json({ message: "Target format not supported" }, { status: 400 });
    }

    // Recupera la Cloudmersive API Key dalle variabili d'ambiente
    const apiKey = process.env.CLOUDMERSIVE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ message: "API key not configured" }, { status: 500 });
    }

    // Effettua la richiesta all'API di Cloudmersive
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
            "Apikey": apiKey
        },
        body: buffer
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ message: "Conversion error: " + errorText }, { status: 500 });
    }

    // Ottieni il file convertito come Buffer
    const convertedBuffer = await response.arrayBuffer();
    const convertedFile = Buffer.from(convertedBuffer);

    return new NextResponse(convertedFile, {
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="converted.${targetFormat}"`
        }
    });
}