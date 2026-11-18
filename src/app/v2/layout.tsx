import type { Metadata, Viewport } from "next";
import { Gloock, Instrument_Sans } from "next/font/google";
import { introScript } from "@/lib/intro-key";
import { rosetteUrl, waveUrl } from "./_components/Guilloche";
import "./foil.css";

// An engraved, high-contrast display face for anything that would be embossed on a card.
const display = Gloock({ subsets: ["latin"], weight: "400", variable: "--f-display" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--f-sans", axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Orero Ozore · Foil",
};

export const viewport: Viewport = {
  themeColor: "#0c0e1c",
};

export default function FoilLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${sans.variable} foil`}
      // The engraved patterns every card wears, generated once on the server.
      style={
        {
          "--rosette": rosetteUrl("rgba(236,234,242,0.22)"),
          "--rosette-ink": rosetteUrl("rgba(12,14,28,0.22)"),
          "--waves": waveUrl("rgba(236,234,242,0.12)"),
        } as React.CSSProperties
      }
    >
      <script dangerouslySetInnerHTML={{ __html: introScript("v2") }} />
      <noscript>
        <style>{".f-intro{display:none}"}</style>
      </noscript>
      <a href="#deal" className="f-skip">
        Skip to the work
      </a>
      {children}
    </div>
  );
}
