import { Big_Shoulders, JetBrains_Mono } from "next/font/google";
import "./departures.css";

const display = Big_Shoulders({ subsets: ["latin"], variable: "--d-display", weight: "variable" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--d-mono", weight: ["400", "600"] });

export default function DeparturesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable} departures`}>{children}</div>;
}
