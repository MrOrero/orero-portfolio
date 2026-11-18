import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders, Big_Shoulders_Stencil } from "next/font/google";
import { person } from "@/content";
import { introScript } from "@/lib/intro-key";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Stencil for anything painted on steel, its solid sibling for labels, a sturdy grotesque for reading.
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], weight: ["800", "900"], variable: "--s-stencil", adjustFontFallback: false, fallback: ["Impact", "sans-serif"] });
const shoulders = Big_Shoulders({ subsets: ["latin"], weight: ["600", "800"], variable: "--s-label", adjustFontFallback: false, fallback: ["Arial Narrow", "sans-serif"] });
const body = Archivo({ subsets: ["latin"], variable: "--s-body" });

const title = `${person.name} · ${person.role}`;
const description =
  "Senior Software Engineer building full stack products in TypeScript, Node.js, React and Next.js across fintech, healthtech, AI and Web3.";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: { type: "website", url: "/", title, description, siteName: person.name },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0f1b33",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The inline script may mark <html> (intro already seen) before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div id="top" className={`${stencil.variable} ${shoulders.variable} ${body.variable} shipped`}>
          <script dangerouslySetInnerHTML={{ __html: introScript("home") }} />
          <noscript>
            <style>{".s-intro{display:none}"}</style>
          </noscript>
          <a href="#voyage" className="s-skip">
            Skip to the work
          </a>
          {children}
        </div>
      </body>
    </html>
  );
}
