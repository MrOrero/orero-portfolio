import { Mrs_Saint_Delafield, Newsreader } from "next/font/google";
import "./contract.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--c-serif", axes: ["opsz"], style: ["normal", "italic"] });
const script = Mrs_Saint_Delafield({ subsets: ["latin"], variable: "--c-script", weight: "400" });

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${script.variable} contract`}>{children}</div>;
}
