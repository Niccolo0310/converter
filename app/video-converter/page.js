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

const linkStyle = {
    color: "#7289da",
    textDecoration: "none",
    fontWeight: "bold",
};

export default function VideoConverter() {
    const [videoUrl, setVideoUrl] = useState("");
    const [message, setMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Nuovo stato per gestire il nome desiderato del file
    const [desiredFileName, setDesiredFileName] = useState("");

    const handleConvert = async () => {
        if (!videoUrl) {
            alert("Please enter a video URL!");
            return;
        }
        setLoading(true);
        setMessage("");
        setDownloadUrl("");

        try {
            // Chiamata API al tuo endpoint /api/video-converter
            const res = await fetch("/api/video-converter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl }),
            });

            if (!res.ok) {
                const err = await res.json();
                setMessage("Conversion error: " + err.message);
            } else {
                // Riceviamo il file come blob e generiamo un URL temporaneo
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);

                setMessage("Conversion complete! Click the link below to download the file.");
            }
        } catch (error) {
            console.error(error);
            setMessage("Error during conversion!");
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
                <h1 style={{ marginBottom: "20px", color: "#ffffff" }}>Video to MP3 Converter</h1>

                {/* Input per l'URL del video */}
                <input
                    type="text"
                    placeholder="Enter your video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
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

                {/* Input per il nome desiderato del file (senza estensione) */}
                <input
                    type="text"
                    placeholder="Desired file name (optional)"
                    value={desiredFileName}
                    onChange={(e) => setDesiredFileName(e.target.value)}
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

                <button onClick={handleConvert} style={{
                    backgroundColor: "#7289da",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    marginTop: "15px",
                    fontSize: "16px"
                }}>
                    Convert Video to MP3
                </button>

                <ProgressBar loading={loading} />

                {message && <p style={{ marginTop: "15px" }}>{message}</p>}

                {downloadUrl && (
                    <div style={{ marginTop: "15px" }}>
                        <a
                            href={downloadUrl}
                            // Se l'utente non inserisce un nome, usiamo "converted.mp3"
                            download={desiredFileName ? `${desiredFileName}.mp3` : "converted.mp3"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={linkStyle}
                        >
                            Download converted MP3
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}