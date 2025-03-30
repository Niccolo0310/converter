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
            alert("Please provide both a file and the room code!");
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
            console.error("Error during upload:", error);
            setMessage("Error during upload!");
        }
        setLoading(false);
    };

    const fetchFiles = async () => {
        if (!room) {
            alert("Enter the room code to view the files!");
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
            console.error("Error retrieving files:", error);
            setMessage("Error retrieving files:!");
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
                <h1 style={{ color: "#ffffff", marginBottom: "20px" }}>File Sharing</h1>
                <div style={{ marginBottom: "15px", textAlign: "left" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                        Room Code:
                    </label>
                    <input
                        type="text"
                        placeholder="Enter the room code (e.g., 4378)"
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
                <p>Upload a file to get a shareable link:</p>
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
                    View room files
                </button>
                <ProgressBar loading={loading} />
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
                {shareUrl && (
                    <div style={{ marginTop: "15px" }}>
                        <p>Link to share the file:</p>
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
                        <p>Files in the room:</p>
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