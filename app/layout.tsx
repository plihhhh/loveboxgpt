import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoboLove",
  description: "A tiny love box dashboard for two hearts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
