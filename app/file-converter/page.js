"use client";
import { useState } from "react";

function ProgressBar({ loading }) {
    return (
        loading && (
            <div style={progressContainerStyle}>
                <div className="progress-bar"></div>
                <style jsx>{`
          @keyframes progressAnimation {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .progress-bar {
            width: 50%;
            height: 8px;
            background-color: #7289da;
            animation: progressAnimation 2s linear infinite;
          }
        `}</style>
            </div>
        )
    );
}

const progressContainerStyle = {
    width: "100%",
    backgroundColor: "#202225",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "15px",
    height: "8px",
};

export default function FileConverter() {
    const [file, setFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState("png");
    const [message, setMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleFormatChange = (event) => {
        setTargetFormat(event.target.value);
    };

    const handleUpload = async () => {
        if (!file) return alert("Seleziona un file!");
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("targetFormat", targetFormat);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        setMessage(data.message);
        if (data.fileUrl) {
            setDownloadUrl(data.fileUrl);
        }
        setLoading(false);
    };

    const containerStyle = {
        backgroundColor: "#36393f",
        color: "#dcddde",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
    };

    const cardStyle = {
        backgroundColor: "#2f3136",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
        width: "100%",
        maxWidth: "500px",
        textAlign: "center",
    };

    const headingStyle = {
        marginBottom: "20px",
        color: "#ffffff",
    };

    const inputStyle = {
        width: "100%",
        padding: "8px",
        marginBottom: "15px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#202225",
        color: "#dcddde",
    };

    const selectStyle = {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#202225",
        color: "#dcddde",
        marginTop: "5px",
    };

    const buttonStyle = {
        backgroundColor: "#7289da",
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        marginTop: "15px",
        fontSize: "16px",
    };

    const linkStyle = {
        display: "inline-block",
        marginTop: "15px",
        color: "#7289da",
        textDecoration: "none",
        fontWeight: "bold",
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={headingStyle}>Convertitore File</h1>
                <input type="file" onChange={handleFileChange} style={inputStyle} />
                <div style={{ marginBottom: "15px" }}>
                    <label htmlFor="format">Formato di conversione:</label>
                    <select id="format" value={targetFormat} onChange={handleFormatChange} style={selectStyle}>
                        <option value="png">PNG (immagine)</option>
                        <option value="jpeg">JPEG (immagine)</option>
                        <option value="tiff">TIFF (immagine)</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">DOCX</option>
                    </select>
                </div>
                <button onClick={handleUpload} style={buttonStyle}>
                    Carica e Converti File
                </button>
                <ProgressBar loading={loading} />
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
                {downloadUrl && (
                    <a href={downloadUrl} download style={linkStyle}>
                        Scarica il file convertito
                    </a>
                )}
            </div>
        </div>
    );
}
