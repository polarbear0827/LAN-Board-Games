import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LAN Board Game Platform",
  description: "A minimalist, modern, and lively local network board game platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={cn(inter.className, "transition-colors duration-300")}>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
