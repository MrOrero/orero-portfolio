import { IBM_Plex_Mono } from "next/font/google";
import "./ledger.css";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--l-mono" });

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${mono.variable} ledger`}>{children}</div>;
}
