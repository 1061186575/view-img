import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({ children }) {
    return (
        <html lang="zh">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <ToastProvider>
            {children}
        </ToastProvider>
        </body>
        </html>
    );
}
