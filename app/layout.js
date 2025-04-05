import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Free File Converter & Sharing Tool | Convert PDF, Word, PNG, DOCX Online",
    description:
        "Convert and share files online for free. Convert PDF to Word, DOCX to PDF, images to PDF and more. Quick file sharing without sign-up.",
    openGraph: {
        title: "Free File Converter & Sharing Tool",
        description:
            "Convert and share files online for free. No account needed. Try our online tool now!",
        url: "https://yourdomain.com",
        siteName: "YourSiteName",
        images: [
            {
                url: "https://yourdomain.com/og-image.jpg",
                width: 800,
                height: 600,
                alt: "Free File Converter",
            },
        ],
        locale: "en_US",
        type: "website",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            {/* AdSense Code */}
            <script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9509760910019071"
                crossOrigin="anonymous"
            ></script>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
        </html>
    );
}