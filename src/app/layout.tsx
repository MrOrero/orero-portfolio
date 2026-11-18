import type { Metadata } from "next";
import localFont from "next/font/local";
import VersionSwitcher from "@/components/VersionSwitcher";
import "./globals.css";

const cabinet = localFont({
  variable: "--font-cabinet-grotesk",
  src: [
    { path: "cabinet-font/CabinetGrotesk-Regular.otf", weight: "400", style: "normal" },
    { path: "cabinet-font/CabinetGrotesk-Medium.otf", weight: "500", style: "normal" },
    { path: "cabinet-font/CabinetGrotesk-Bold.otf", weight: "700", style: "normal" },
    { path: "cabinet-font/CabinetGrotesk-Extrabold.otf", weight: "800", style: "normal" },
    { path: "cabinet-font/CabinetGrotesk-Black.otf", weight: "900", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orero Ozore | Portfolio",
  description:
    "Senior Software Engineer building full stack products in TypeScript, Node.js, React and Next.js across fintech, healthtech, AI and Web3.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Each version's inline script may mark <html> (intro already seen) before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className={`${cabinet.variable} antialiased`}>
        {children}
        <VersionSwitcher />
      </body>
    </html>
  );
}
