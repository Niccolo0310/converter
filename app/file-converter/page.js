"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MainMenu() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");

    // Naviga alla pagina file-sharing con eventuale room code
    const goToFileSharing = () => {
        if (roomCode.trim()) {
            router.push(`/file-sharing?room=${roomCode}`);
        } else {
            router.push("/file-sharing");
        }
    };

    return (
        <div style={containerStyle}>
            <h1 style={headingStyle}>Main Menu</h1>
            <div style={cardContainerStyle}>
                {/* Card: File Converter */}
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>File Converter</h2>
                    <p style={cardDescriptionStyle}>
                        Convert documents and images into various formats.
                    </p>
                    <button style={buttonStyle} onClick={() => router.push("/file-converter")}>
                        Go
                    </button>
                </div>

                {/* Card: Audio Converter */}
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>Audio Converter</h2>
                    <p style={cardDescriptionStyle}>
                        Transform audio files into different formats.
                    </p>
                    <button style={buttonStyle} onClick={() => router.push("/audio-converter")}>
                        Go
                    </button>
                </div>

                {/* Card: File Sharing */}
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>File Sharing</h2>
                    <p style={cardDescriptionStyle}>
                        Easily share files with others.
                    </p>
                    <div style={{ marginBottom: "10px", textAlign: "left" }}>
                        <label style={labelStyle}>Room Code:</label>
                        <input
                            type="text"
                            placeholder="e.g., 4378"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <button style={buttonStyle} onClick={goToFileSharing}>
                        Go
                    </button>
                </div>
            </div>
            <style jsx>{`
        /* Puoi aggiungere qui ulteriori stili globali se necessario */
      `}</style>
        </div>
    );
}

const containerStyle = {
    backgroundColor: "#23272a",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: "#fff",
};

const headingStyle = {
    fontSize: "26px",
    marginBottom: "40px",
};

const cardContainerStyle = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: "1200px",
};

const cardStyle = {
    backgroundColor: "#2c2f33",
    width: "280px",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    transition: "background-color 0.2s ease, transform 0.2s ease",
};

const cardTitleStyle = {
    fontSize: "18px",
    marginBottom: "8px",
};

const cardDescriptionStyle = {
    fontSize: "14px",
    marginBottom: "16px",
    color: "#b9bbbe",
    lineHeight: "1.4",
};

const buttonStyle = {
    backgroundColor: "#7289da",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "0", // Pulsante squadrato
    textDecoration: "none",
    fontWeight: "500",
    textAlign: "center",
    transition: "background-color 0.2s ease",
    width: "100%",
    cursor: "pointer",
};

const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
};

const inputStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#202225",
    color: "#dcddde",
};