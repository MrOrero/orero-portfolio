import type { Metadata, Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import { introScript } from "@/lib/intro-key";
import "./receipt.css";

// Martian Mono's width axis gives the double-width lines a receipt printer uses for headers.
const mono = Martian_Mono({ subsets: ["latin"], variable: "--r-mono", axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Orero Ozore · Receipt",
};

export const viewport: Viewport = {
  themeColor: "#f2efe6",
};

export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${mono.variable} receipt`}>
      {/* Before first paint: hide the intro if it already ran in this tab. */}
      <script dangerouslySetInnerHTML={{ __html: introScript("v1") }} />
      <noscript>
        <style>{".r-intro{display:none}"}</style>
      </noscript>
      <a href="#work" className="r-skip">
        Skip to the work
      </a>
      {children}
    </div>
  );
}
