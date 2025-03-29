"use client";
import { useState, useEffect } from "react";

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

export default function FileConverter() {
    const [file, setFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState("png");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleFormatChange = (event) => {
        setTargetFormat(event.target.value);
    };

    const handleUpload = async () => {
        if (!file) return alert("Select a file!");
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("targetFormat", targetFormat);

        try {
            const res = await fetch("/api/convert", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                setMessage("Conversion error: " + err.message);
            } else {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `converted.${targetFormat}`;
                a.click();
                URL.revokeObjectURL(url);
                setMessage("Conversion complete!");
            }
        } catch (error) {
            console.error(error);
            setMessage("Error during upload!");
        }

        setLoading(false);
    };

    return (
        <div style={{
            backgroundColor: "#36393f",
            color: "#dcddde",
            minHeight: "100vh",
            display: "flex",
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
                <h1 style={{ marginBottom: "20px", color: "#ffffff" }}>File Converter</h1>
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
                <div style={{ marginBottom: "15px" }}>
                    <label htmlFor="format">Conversion Format:</label>
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
                        <option value="png">PNG (Image)</option>
                        <option value="jpeg">JPEG (Image)</option>
                        <option value="pdf">PDF</option>
                        {/* Aggiungi altri formati se necessario */}
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
                    Upload & Convert
                </button>
                <ProgressBar loading={loading} />
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
            </div>
        </div>
    );
}