export type SectorId =
  | "fintech"
  | "health"
  | "commerce"
  | "telecom"
  | "enterprise"
  | "ai-web3"
  | "events"
  | "consumer";

export type Sector = {
  id: SectorId;
  label: string;
  /** Three-letter code used as gate / jack labels. */
  code: string;
};

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  link: string;
  sector: SectorId;
  /** Who the work was for. */
  client: string;
  /** Approximate years. TODO confirm with Orero. */
  start: number;
  end: number;
  featured: boolean;
  /** A short, factual impact line, only where the source content states one. */
  impact?: string;
};

export type Person = {
  name: string;
  first: string;
  last: string;
  role: string;
  short: string;
  bio: string;
  email: string;
  links: { label: string; href: string }[];
  stack: string[];
  sectors: string[];
  /** Figures stated in the bio; nothing invented. */
  stats: { id: string; label: string; value: number; prefix?: string; suffix?: string }[];
};
