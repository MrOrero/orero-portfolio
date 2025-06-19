import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cabinet = localFont({
  variable: "--font-cabinet-grotesk",
  src: [
    {
      path: "cabinet-font/CabinetGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "cabinet-font/CabinetGrotesk-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "cabinet-font/CabinetGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orero Ozore - Portfolio",
  description: "Senior Software Engineer with experience across multiple industries including Web3, AI, Fintech, Telecommunication, and Manufacturing industries.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cabinet.variable}  antialiased`}>
        {children}
      </body>
    </html>
  );
}
