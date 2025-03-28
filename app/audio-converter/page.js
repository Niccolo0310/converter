"use client";
import { useState } from "react";

function ProgressBar({ loading }) {
    return (
        loading && (
            <div style={progressContainerStyle}>
                <div className="progress-bar"></div>
                <style jsx>{`
          @keyframes progressAnimation {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
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

export default function AudioConverter() {
    const [file, setFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState("mp3");
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
        if (!file) return alert("Seleziona un file audio!");
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("targetFormat", targetFormat);

        const response = await fetch("/api/audio", {
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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        color: "#dcddde",
    };

    const cardStyle = {
        backgroundColor: "#2f3136",
        borderRadius: "8px",
        padding: "30px",
        width: "100%",
        maxWidth: "500px",
        textAlign: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    };

    const headingStyle = { marginBottom: "20px", color: "#ffffff" };
    const inputStyle = {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#202225",
        marginBottom: "15px",
        color: "#dcddde",
    };
    const selectStyle = {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#202225",
        marginBottom: "15px",
        color: "#dcddde",
    };
    const buttonStyle = {
        backgroundColor: "#7289da",
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    };
    const linkStyle = {
        marginTop: "15px",
        color: "#7289da",
        textDecoration: "none",
        fontWeight: "bold",
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={headingStyle}>Convertitore Audio</h1>
                <input type="file" accept="audio/*" onChange={handleFileChange} style={inputStyle} />
                <div>
                    <label htmlFor="format">Formato di conversione:</label>
                    <select id="format" value={targetFormat} onChange={handleFormatChange} style={selectStyle}>
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="aac">AAC</option>
                        <option value="flac">FLAC</option>
                        <option value="ogg">OGG</option>
                    </select>
                </div>
                <button onClick={handleUpload} style={buttonStyle}>
                    Carica e Converti Audio
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
