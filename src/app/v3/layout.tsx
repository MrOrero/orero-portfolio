import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./trace.css";

const mono = Geist_Mono({ subsets: ["latin"], variable: "--t-mono" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--t-sans", weight: "variable" });

export default function TraceLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${mono.variable} ${sans.variable} trace`}>{children}</div>;
}
