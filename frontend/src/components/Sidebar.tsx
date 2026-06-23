"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Terminal, 
  BarChart3, 
  GitFork, 
  Layers, 
  Sparkles,
  Home
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home Page", icon: Home },
    { href: "/dashboard", label: "Ticket Queue", icon: LayoutDashboard },
    { href: "/workspace", label: "Analysis Workspace", icon: Terminal },
    { href: "/analytics", label: "Analytics Reports", icon: BarChart3 },
    { href: "/pipeline", label: "Pipeline Visualizer", icon: GitFork },
  ];

  if (pathname === "/") {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-600 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm shadow-blue-500/10">
          <Layers size={18} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">Smart Support</h1>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Triage Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-slate-100 text-slate-950 font-bold border-l-2 border-blue-600 pl-2 rounded-l-none"
                  : "hover:bg-slate-50 hover:text-slate-900 text-slate-500"
              }`}
            >
              <Icon size={16} className={isActive ? "text-blue-600" : "text-slate-400"} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-150 shadow-sm">
          <div className="bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-700">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate">Enterprise Support</p>
            <p className="text-[9px] text-slate-500 truncate">Support Operations</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        </div>
      </div>
    </aside>
  );
}
