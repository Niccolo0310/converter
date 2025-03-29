"use client";
import { useState } from "react";

export default function FileUploader() {
    const [file, setFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState("pdf"); // default
    const [message, setMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFormatChange = (e) => {
        setTargetFormat(e.target.value);
    };

    const handleUpload = async () => {
        if (!file) return alert("Seleziona un file!");
        setLoading(true);
        setMessage("");
        setDownloadUrl("");

        try {
            // 1. Richiedi l'URL pre-firmato per l'upload
            const payload = {
                fileName: file.name,
                fileType: file.type,
                targetFormat,
            };
            const res = await fetch("/api/get-upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.uploadUrl) {
                setMessage("Errore: URL di upload non ottenuto");
                setLoading(false);
                return;
            }

            // 2. Carica il file direttamente su S3
            const uploadResponse = await fetch(data.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadResponse.ok) {
                setMessage("Errore durante il caricamento su S3");
                setLoading(false);
                return;
            }

            // 3. Costruisci l'URL pubblico del file, se ACL=public-read
            const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${data.key}`;
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

                <input
                    type="file"
                    onChange={handleFileChange}
                    style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "15px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#202225",
                        color: "#dcddde"
                    }}
                />

                {/* Select per il formato desiderato */}
                <div style={{ marginBottom: "15px" }}>
                    <label htmlFor="format">Formato di destinazione:</label>
                    <select
                        id="format"
                        value={targetFormat}
                        onChange={handleFormatChange}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "#202225",
                            color: "#dcddde",
                            marginTop: "5px"
                        }}
                    >
                        <option value="pdf">PDF</option>
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="docx">DOCX</option>
                        {/* Aggiungi i formati che desideri */}
                    </select>
                </div>

                <button
                    onClick={handleUpload}
                    style={{
                        backgroundColor: "#7289da",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 20px",
                        cursor: "pointer",
                        marginTop: "15px",
                        fontSize: "16px"
                    }}
                >
                    Upload File
                </button>

                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
                {downloadUrl && (
                    <div style={{ marginTop: "15px" }}>
                        <p>Download URL:</p>
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#7289da", textDecoration: "none", fontWeight: "bold" }}
                        >
                            {downloadUrl}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}