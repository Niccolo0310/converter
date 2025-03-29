"use client";
import { useState } from "react";

export default function FileUploader() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Ottieni l'URL pre-firmato dal backend
    const getUploadUrl = async () => {
        if (!file) return;
        const body = {
            fileName: file.name,
            fileType: file.type,
        };
        const res = await fetch("/api/get-upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return data;
    };

    // Esegue il caricamento diretto su S3
    const handleUpload = async () => {
        if (!file) return alert("Seleziona un file!");
        setLoading(true);
        setMessage("");
        setDownloadUrl("");

        try {
            const { uploadUrl, key } = await getUploadUrl();
            if (!uploadUrl) {
                setMessage("Errore: URL di upload non ottenuto");
                setLoading(false);
                return;
            }

            // Carica il file su S3 usando PUT
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadResponse.ok) {
                setMessage("Errore durante il caricamento su S3");
                setLoading(false);
                return;
            }

            // Costruisci l'URL pubblico del file (se il bucket è configurato con ACL public-read)
            const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            setDownloadUrl(publicUrl);
            setMessage("File caricato con successo!");
        } catch (error) {
            console.error("Error during upload:", error);
            setMessage("Errore durante il caricamento!");
        }

        setLoading(false);
    };

    return (
        <div style={{
            backgroundColor: "#36393f",
            color: "#dcddde",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
            padding: "20px"
        }}>
            <div style={{
                backgroundColor: "#2f3136",
                borderRadius: "8px",
                padding: "30px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                width: "100%",
                maxWidth: "500px",
                textAlign: "center"
            }}>
                <h1 style={{ marginBottom: "20px", color: "#ffffff" }}>Upload File</h1>
                <input type="file" onChange={handleFileChange} style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#202225",
                    color: "#dcddde"
                }} />
                <button onClick={handleUpload} style={{
                    backgroundColor: "#7289da",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    marginTop: "15px",
                    fontSize: "16px"
                }}>
                    Upload File
                </button>
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
                {downloadUrl && (
                    <div style={{ marginTop: "15px" }}>
                        <p>Download URL:</p>
                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#7289da", textDecoration: "none", fontWeight: "bold" }}>
                            {downloadUrl}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}