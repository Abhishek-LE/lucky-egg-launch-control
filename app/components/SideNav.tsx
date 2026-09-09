"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Rocket } from "lucide-react";

const NAV = [
  { href: "/pre-launch", label: "Pre-Launch", icon: ListChecks },
  { href: "/post-launch", label: "Post-Launch", icon: Rocket },
];

export default function SideNav() {
  const pathname = usePathname();
  return (
    <>
      <div className="px-5 pb-4 pt-6">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">Lucky Egg</div>
        <div className="text-lg font-black tracking-tight">Launch Control</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 px-5 py-4 text-xs text-slate-500">
        V1 — live on Google Sheets
        <br />+ Supabase
      </div>
    </>
  );
}
