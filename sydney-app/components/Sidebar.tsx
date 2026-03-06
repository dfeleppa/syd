"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Network, CalendarDays, NotebookPen, Utensils, Users, FileText, Brain } from "lucide-react";

function NavIcon({ name }: { name: string }) {
  const size = 18;
  switch (name) {
    case "mission":
      return <Gauge size={size} className="text-emerald-300" />;
    case "mindmap":
      return <Network size={size} className="text-purple-300" />;
    case "planner":
      return <CalendarDays size={size} className="text-sky-300" />;
    case "notes":
      return <NotebookPen size={size} className="text-emerald-300" />;
    case "nutrition":
      return <Utensils size={size} className="text-pink-300" />;
    case "calendar":
      return <CalendarDays size={size} className="text-amber-300" />;
    case "agents":
      return <Users size={size} className="text-cyan-300" />;
    case "content":
      return <FileText size={size} className="text-fuchsia-300" />;
    case "memory":
      return <Brain size={size} className="text-emerald-300" />;
    case "docs":
      return <FileText size={size} className="text-indigo-300" />;
    default:
      return <Gauge size={size} className="text-zinc-400" />;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 640 : false));



  const navLink = (
    href: string,
    label: string,
    icon: string,
    opts: { group: "mission" | "personal" | "work" | "knowledge"; soon?: boolean }
  ) => {
    const active = href !== "#" && pathname.startsWith(href);
    return (
      <Link
        href={href === "#" ? pathname || "/" : href}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-zinc-900 text-zinc-50"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
        }`}
      >
        <NavIcon name={icon} />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && opts.soon && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
            Soon
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`flex h-screen border-r border-zinc-900 bg-zinc-950/95 px-4 py-6 text-sm ${
        collapsed ? "w-16 sm:w-16 lg:w-20" : "w-56 sm:w-56 lg:w-64"
      }`}
    >
      <nav className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Business
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-200"
            aria-label="Toggle sidebar"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-zinc-300" />
              <span className="h-0.5 w-4 rounded-full bg-zinc-300" />
              <span className="h-0.5 w-4 rounded-full bg-zinc-300" />
            </span>
          </button>
        </div>

        <div>
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Business
            </p>
          )}
          {navLink("/", "Daniel's Dashboard", "mission", { group: "mission" })}
        </div>

        <div className="space-y-1">
          {collapsed ? (
            <div className="my-1 h-px w-full bg-zinc-800" />
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Personal
            </p>
          )}
          {navLink("/mindmap", "Mindmap", "mindmap", { group: "personal" })}
          {navLink("#", "Planner", "planner", { group: "personal", soon: true })}
          {navLink("/notes", "Notes", "notes", { group: "personal" })}
          {navLink("/nutrition", "Nutrition", "nutrition", { group: "personal" })}
          {navLink("#", "Calendar", "calendar", { group: "personal", soon: true })}
        </div>

        <div className="space-y-1">
          {collapsed ? (
            <div className="my-1 h-px w-full bg-zinc-800" />
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Work
            </p>
          )}
          {navLink("/agents", "Agents", "agents", { group: "work" })}
          {navLink("#", "Content", "content", { group: "work", soon: true })}
        </div>

        <div className="space-y-1">
          {collapsed ? (
            <div className="my-1 h-px w-full bg-zinc-800" />
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Knowledge
            </p>
          )}
          {navLink("#", "Memory", "memory", { group: "knowledge", soon: true })}
          {navLink("#", "Docs", "docs", { group: "knowledge", soon: true })}
        </div>

        <div className="mt-auto space-y-1">
          {collapsed ? (
            <div className="my-1 h-px w-full bg-zinc-800" />
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Team
            </p>
          )}
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[11px] text-zinc-500">
            <span>You · Syd · Olivia · Elon</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
