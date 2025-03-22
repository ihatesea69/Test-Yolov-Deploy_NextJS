import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nhận Diện Đối Tượng với YOLOv8",
  description:
    "Ứng dụng demo nhận diện người và đồ vật sử dụng YOLOv8 và NextJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        style={{
          background: "linear-gradient(to bottom, #ebf5ff, #ffffff)",
          color: "#333",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
        }}
      >
        {children}
      </body>
    </html>
  );
}
