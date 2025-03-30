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

export default function FileSharing() {
    const [file, setFile] = useState(null);
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [shareUrl, setShareUrl] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const uploadFile = async () => {
        if (!file || !room) {
            alert("Inserisci sia un file che il codice stanza!");
            return;
        }
        setLoading(true);
        setMessage("");
        setShareUrl("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("room", room);

        try {
            const res = await fetch("/api/share", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setMessage(data.message);
            if (data.fileUrl) {
                setShareUrl(data.fileUrl);
            }
        } catch (error) {
            console.error("Errore nel caricamento:", error);
            setMessage("Errore durante il caricamento!");
        }
        setLoading(false);
    };

    const fetchFiles = async () => {
        if (!room) {
            alert("Inserisci il codice stanza per vedere i file!");
            return;
        }
        try {
            const res = await fetch("/api/share", {
                method: "PUT",
                body: JSON.stringify({ room }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error("Errore nel recupero dei file:", error);
            setMessage("Errore nel recupero dei file!");
        }
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
                <h1 style={{ color: "#ffffff", marginBottom: "20px" }}>Condivisione File</h1>
                <div style={{ marginBottom: "15px", textAlign: "left" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                        Codice Stanza:
                    </label>
                    <input
                        type="text"
                        placeholder="Inserisci il codice della stanza (es. 4378)"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "#202225",
                            color: "#dcddde"
                        }}
                    />
                </div>
                <p>Carica un file per ottenere un link condivisibile:</p>
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
                <button onClick={uploadFile} style={{
                    backgroundColor: "#7289da",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    marginTop: "15px",
                    fontSize: "16px"
                }}>
                    Carica e Condividi
                </button>
                <button onClick={fetchFiles} style={{
                    backgroundColor: "#7289da",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    marginTop: "15px",
                    fontSize: "16px",
                    marginLeft: "10px"
                }}>
                    Vedi file della stanza
                </button>
                <ProgressBar loading={loading} />
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
                {shareUrl && (
                    <div style={{ marginTop: "15px" }}>
                        <p>Link per condividere il file:</p>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: "#7289da",
                                textDecoration: "none",
                                fontWeight: "bold"
                            }}
                        >
                            {shareUrl}
                        </a>
                    </div>
                )}
                {files.length > 0 && (
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        <p>File nella stanza:</p>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {files.map((f, idx) => (
                                <li key={idx}>
                                    <a
                                        href={`/api/share?room=${room}&file=${f}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#7289da", textDecoration: "none" }}
                                    >
                                        {f}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}