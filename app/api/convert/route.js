import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        // Ricevi file e targetFormat dal form
        const formData = await req.formData();
        const file = formData.get("file");
        let targetFormat = formData.get("targetFormat")?.toLowerCase() || "png"; // default: png

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        // Converte il file in Buffer e determina l'estensione di input
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const inputExt = fileName.split('.').pop().toLowerCase();

        // Se l'input ha già il formato target, restituisci il file senza conversione
        if (inputExt === targetFormat) {
            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": file.type,
                    "Content-Disposition": `attachment; filename="${fileName}"`,
                },
            });
        }

        // Mappa dei possibili endpoint Cloudmersive per la conversione
        const conversionMap = {
            pdf: {
                docx: "https://api.cloudmersive.com/convert/pdf/to/docx",
                png: "https://api.cloudmersive.com/convert/pdf/to/png",
                jpeg: "https://api.cloudmersive.com/convert/pdf/to/jpg",
                jpg: "https://api.cloudmersive.com/convert/pdf/to/jpg",
            },
            docx: {
                pdf: "https://api.cloudmersive.com/convert/docx/to/pdf",
            },
            // Aggiungi ulteriori conversioni se necessario
        };

        if (!conversionMap[inputExt] || !conversionMap[inputExt][targetFormat]) {
            return NextResponse.json(
                { message: "Conversion not supported for these formats" },
                { status: 400 }
            );
        }

        const endpoint = conversionMap[inputExt][targetFormat];
        const apiKey = process.env.CLOUDMERSIVE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ message: "API key not configured" }, { status: 500 });
        }

        // Effettua la richiesta all'API di Cloudmersive
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                "Apikey": apiKey,
            },
            body: buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { message: "Conversion error: " + errorText },
                { status: 500 }
            );
        }

        // Ottieni il file convertito come Buffer
        const convertedBuffer = await response.arrayBuffer();
        const convertedFile = Buffer.from(convertedBuffer);

        return new NextResponse(convertedFile, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="converted.${targetFormat}"`,
            },
        });
    } catch (error) {
        console.error("Error in /api/convert route:", error);
        return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to convert a file" });
}