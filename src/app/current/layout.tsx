import { Inter } from "next/font/google";

const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function CurrentLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} legacy`}>{children}</div>;
}
