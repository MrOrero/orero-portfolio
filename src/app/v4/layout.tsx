import type { Metadata, Viewport } from "next";
import { Anybody, Azeret_Mono } from "next/font/google";
import { introScript } from "@/lib/intro-key";
import "./load.css";

// A grotesque with a width axis, used at fixed widths only; a mono for every reading.
const display = Anybody({ subsets: ["latin"], variable: "--l-display", axes: ["wdth"] });
const mono = Azeret_Mono({ subsets: ["latin"], variable: "--l-mono" });

export const metadata: Metadata = {
  title: "Orero Ozore · Load",
};

export const viewport: Viewport = {
  themeColor: "#1c2bd6",
};

export default function LoadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className={`${display.variable} ${mono.variable} load`}>
      <script dangerouslySetInnerHTML={{ __html: introScript("v4") }} />
      <noscript>
        <style>{".l-intro{display:none}"}</style>
      </noscript>
      <a href="#results" className="l-skip">
        Skip to the work
      </a>
      {children}
    </div>
  );
}
