import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novel Partners Curriculum Assistant",
  description: "AI-powered curriculum assistant for Novel Partners ELA materials",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
