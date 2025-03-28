import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9.]/g, '_');
};

const uploadDir = path.join("/tmp", "uploads", "shared");

// POST: Upload file
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ message: "Nessun file caricato." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await mkdir(uploadDir, { recursive: true });

        const sanitizedFileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(uploadDir, uniqueName);

        await writeFile(filePath, buffer);

        const fileUrl = `/api/share?file=${uniqueName}`;

        // Pianifica cancellazione dopo 3 ore (10800000 ms)
        setTimeout(async () => {
            try {
                await unlink(filePath);
                console.log("File eliminato dopo 3 ore:", filePath);
            } catch (err) {
                console.error("Errore cancellando file dopo 3 ore:", err);
            }
        }, 3 * 60 * 60 * 1000);

        return NextResponse.json({
            message: "File condiviso con successo!",
            fileUrl
        });

    } catch (error) {
        console.error("Errore nella POST:", error);
        return NextResponse.json({ message: "Errore interno caricando il file." }, { status: 500 });
    }
}

// GET: Download file
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file");

    if (!fileParam) {
        return NextResponse.json({ error: "File non specificato." }, { status: 400 });
    }

    const filePath = path.join(uploadDir, fileParam);

    try {
        const buffer = await readFile(filePath);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileParam}"`
            },
        });

    } catch (error) {
        console.error("Errore nella GET:", error);
        return NextResponse.json({ error: "File non trovato o già eliminato." }, { status: 404 });
    }
}