"use client";

import { usePathname } from "next/navigation";

const versions = [
  { href: "/", label: "1", name: "Ledger" },
  { href: "/v2", label: "2", name: "Departures" },
  { href: "/v3", label: "3", name: "Trace" },
  { href: "/v4", label: "4", name: "Contract" },
  { href: "/v5", label: "5", name: "Switchboard" },
  { href: "/current", label: "0", name: "Current site" },
];

/** Plain <a> links on purpose: each version loads fresh and stays independent. */
export default function VersionSwitcher() {
  const path = usePathname();
  return (
    <nav aria-label="Design versions" className="vswitch">
      {versions.map((v) => {
        const active = path === v.href;
        return (
          <a key={v.href} href={v.href} aria-current={active ? "page" : undefined} title={v.name}>
            <span aria-hidden="true">{v.label === "0" ? "old" : `v${v.label}`}</span>
            <span className="sr-only">{v.name}</span>
          </a>
        );
      })}
    </nav>
  );
}
