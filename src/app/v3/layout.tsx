import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders, Big_Shoulders_Stencil } from "next/font/google";
import { introScript } from "@/lib/intro-key";
import "./shipped.css";

// Stencil for anything painted on steel, its solid sibling for labels, a sturdy grotesque for reading.
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], weight: ["800", "900"], variable: "--s-stencil", adjustFontFallback: false, fallback: ["Impact", "sans-serif"] });
const shoulders = Big_Shoulders({ subsets: ["latin"], weight: ["600", "800"], variable: "--s-label", adjustFontFallback: false, fallback: ["Arial Narrow", "sans-serif"] });
const body = Archivo({ subsets: ["latin"], variable: "--s-body" });

export const metadata: Metadata = {
  title: "Orero Ozore · Shipped",
};

export const viewport: Viewport = {
  themeColor: "#0f1b33",
};

export default function ShippedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className={`${stencil.variable} ${shoulders.variable} ${body.variable} shipped`}>
      <script dangerouslySetInnerHTML={{ __html: introScript("v3") }} />
      <noscript>
        <style>{".s-intro{display:none}"}</style>
      </noscript>
      <a href="#voyage" className="s-skip">
        Skip to the work
      </a>
      {children}
    </div>
  );
}
