import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = localFont({
    src: "./fonts/geist-sans.woff2",
    variable: "--font-geist-sans",
    display: "swap",
});

const geistMono = localFont({
    src: "./fonts/geist-mono.woff2",
    variable: "--font-geist-mono",
    display: "swap",
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
