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

const containerStyle = {
    backgroundColor: "#36393f",
    color: "#dcddde",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
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

export default function VideoToMp4() {
    const [videoUrl, setVideoUrl] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConvert = async () => {
        if (!videoUrl) {
            alert("Please enter a video URL.");
            return;
        }
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/video-to-mp4", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                setMessage("Error: " + errorData.message);
            } else {
                // Create a temporary URL and trigger download
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "downloaded-video.mp4";
                a.click();
                URL.revokeObjectURL(url);
                setMessage("Download started!");
            }
        } catch (error) {
            console.error("Error converting video:", error);
            setMessage("Unexpected error occurred.");
        }
        setLoading(false);
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={headingStyle}>Video to MP4 Converter</h1>
                <input
                    type="text"
                    placeholder="Enter video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    style={inputStyle}
                />
                <button onClick={handleConvert} style={buttonStyle}>
                    Convert & Download MP4
                </button>
                <ProgressBar loading={loading} />
                {message && <p style={{ marginTop: "15px" }}>{message}</p>}
            </div>
        </div>
    );
}