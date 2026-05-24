"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LayoutDashboard, FileText, Briefcase } from "lucide-react";

const navLinks = [
  { href: "/", label: "Applications", icon: LayoutDashboard },
  { href: "/cv", label: "My CV", icon: FileText },
  { href: "/jobs/match", label: "Job Match", icon: Briefcase },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-800/60 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4.5 h-4.5 text-white animate-pulse-slow" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:text-white transition-colors duration-200">
            CV Copilot
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-white bg-slate-900/80 shadow-inner border border-slate-800"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="hidden sm:inline">{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
