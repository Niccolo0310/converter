"use client";
import { useState } from "react";

export default function FileUploader() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!file) return alert("Select a file!");
        setLoading(true);
        setMessage("");

        // Richiedi l'URL pre-firmato per l'upload
        const payload = {
            fileName: file.name,
            fileType: file.type,
        };

        const res = await fetch("/api/get-upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const { uploadUrl, key } = await res.json();
        if (!uploadUrl) {
            setMessage("Error generating upload URL");
            setLoading(false);
            return;
        }

        // Carica il file direttamente su S3 usando PUT
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
            setMessage("Error during file upload to S3");
            setLoading(false);
            return;
        }

        // Costruisci un URL pubblico per il download (se il bucket è public-read)
        const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        setDownloadUrl(publicUrl);
        setMessage("File uploaded successfully!");
        setLoading(false);
    };

    return (
        <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#36393f", color: "#dcddde", minHeight: "100vh" }}>
            <h1>File Uploader</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload File</button>
            {loading && <p>Uploading...</p>}
            {message && <p>{message}</p>}
            {downloadUrl && (
                <p>
                    Download URL: <a href={downloadUrl} target="_blank" rel="noopener noreferrer">{downloadUrl}</a>
                </p>
            )}
        </div>
    );
}