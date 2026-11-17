import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./switchboard.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--s-sans", weight: "variable" });
const mono = Space_Mono({ subsets: ["latin"], variable: "--s-mono", weight: ["400", "700"] });

export default function SwitchboardLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${grotesk.variable} ${mono.variable} switchboard`}>{children}</div>;
}
