"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Cpu,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export function SettingsNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Tenant Profile & Regional",
      href: "/admin/settings",
      icon: Building2,
      exact: true,
      description: "Business name, taxes, currency & POS receipts",
    },
    {
      name: "Integrations Vault",
      href: "/admin/settings/integrations",
      icon: Cpu,
      description: "AES-256 encrypted payment gateways & couriers",
    },
    {
      name: "Headless Developer API",
      href: "/admin/settings/developer-api",
      icon: KeyRound,
      description: "Client IDs, API keys, webhooks & developer SDK",
    },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname?.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-inter font-semibold transition-all shrink-0 ${
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border"
            }`}
          >
            <Icon size={16} className={isActive ? "text-white" : "text-muted"} />
            <div className="flex flex-col text-left">
              <span>{tab.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
