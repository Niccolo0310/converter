"use client";
import Link from "next/link";

export default function Home() {
    return (
        <div className="container">
            <h1 className="title">Main Menu</h1>
            <div className="cardRow">
                <div className="card">
                    <h2 className="cardTitle">File Converter</h2>
                    <p className="cardDescription">
                        Convert documents and images into various formats.
                    </p>
                    <Link href="/file-converter" className="btn">
                        Go
                    </Link>
                </div>

                <div className="card">
                    <h2 className="cardTitle">Audio Converter</h2>
                    <p className="cardDescription">
                        Transform audio files into different formats.
                    </p>
                    <Link href="/audio-converter" className="btn">
                        Go
                    </Link>
                </div>

                <div className="card">
                    <h2 className="cardTitle">File Sharing</h2>
                    <p className="cardDescription">
                        Easily share files with others.
                    </p>
                    <Link href="/file-sharing" className="btn">
                        Go
                    </Link>
                </div>

                <div className="card">
                    <h2 className="cardTitle">Video Converter</h2>
                    <p className="cardDescription">
                        Extract audio from your videos and convert them to MP3 format.
                    </p>
                    <Link href="/video-converter" className="btn">
                        Go
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .container {
                    background-color: #23272a;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    color: #fff;
                }
                .title {
                    font-size: 26px;
                    margin-bottom: 40px;
                }
                .cardRow {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    justify-content: center;
                    width: 100%;
                    max-width: 1200px;
                }
                .card {
                    background-color: #2c2f33;
                    width: 280px;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }
                .card:hover {
                    background-color: #3b3e43;
                    transform: translateY(-2px);
                }
                .cardTitle {
                    font-size: 18px;
                    margin-bottom: 8px;
                }
                .cardDescription {
                    font-size: 14px;
                    margin-bottom: 16px;
                    color: #b9bbbe;
                    line-height: 1.4;
                }
                .btn {
                    background-color: #7289da;
                    color: #fff;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 0;
                    text-decoration: none;
                    font-weight: 500;
                    text-align: center;
                    transition: background-color 0.2s ease;
                    width: 100%;
                }
                .btn:hover {
                    background-color: #5a6ebf;
                }
            `}</style>
        </div>
    );
}