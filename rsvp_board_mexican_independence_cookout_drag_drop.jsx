import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Undo2, Download } from "lucide-react";

/**
 * RSVP Kanban-style board with drag-and-drop between four lists.
 * Counts update live. Data persists to localStorage.
 */

// Initial lists from your latest merged + adjusted state
const INITIAL_DATA: Record<string, string[]> = {
  "Yes": [
    "Kasey","Abby","Joe","Izzy","Addi","Dylan","Paige","Jonah","Liv","Sua","Alyssa","Emma","Lexi","Cate","Kaylee","Rayyan","Henry","Grace","Ashley","Annika","Jenna","Leah","John","Connor","Marie","Mary","Brayde","Taylor","Julia"
  ],
  "Maybe": ["Sloan","Megan","Keziah"],
  "No": ["Ruthie","Lucy","Tessa","Maria","Julia Mercer"],
  "No Response": [
    "Ashlyn","Bri","Syd","Maggie","Ellen","Ella","Laurel","Sarah","Hana","Anna","Brett","Ben","Sriya","Liron","Cole","Jessie"
  ],
};

const STORAGE_KEY = "rsvp-board-state-v1";

export default function RSVPBoard() {
  const [lists, setLists] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  const counts = useMemo(() => ({
    yes: lists["Yes"].length,
    maybe: lists["Maybe"].length,
    no: lists["No"].length,
    noresp: lists["No Response"].length,
    total: Object.values(lists).reduce((a, b) => a + b.length, 0),
  }), [lists]);

  function onDragStart(e: React.DragEvent, name: string, from: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ name, from }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, to: string) {
    e.preventDefault();
    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;
    const { name, from } = JSON.parse(txt) as { name: string; from: string };
    if (!name || from === to) return;

    setLists((prev) => {
      // Remove from original
      const next = { ...prev };
      next[from] = next[from].filter((n) => n !== name);
      // Add to destination (avoid dupes)
      if (!next[to].includes(name)) next[to] = [name, ...next[to]];
      return next;
    });
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function reset() {
    setLists(INITIAL_DATA);
  }

  function downloadCSV() {
    const rows: string[] = ["Name,Status"]; // header
    Object.entries(lists).forEach(([status, names]) => {
      names.forEach((n) => rows.push(`${escapeCSV(n)},${escapeCSV(status)}`));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp_board_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 to-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">RSVP Board — Mexican Independence Cookout</h1>
            <p className="text-sm text-muted-foreground">Drag names between boards. Counts update automatically. (Auto-saved)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={downloadCSV} className="gap-2"><Download className="h-4 w-4"/>Export CSV</Button>
            <Button variant="outline" onClick={reset} className="gap-2"><Undo2 className="h-4 w-4"/>Reset</Button>
          </div>
        </header>

        <StatsBar counts={counts} />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["Yes","Maybe","No","No Response"] as const).map((col) => (
            <Column
              key={col}
              title={col}
              names={lists[col]}
              onDrop={(e) => onDrop(e, col)}
              onDragOver={onDragOver}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Column({ title, names, onDrop, onDragOver }: {
  title: string;
  names: string[];
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  const theme = useMemo(() => columnTheme(title), [title]);
  return (
    <Card
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`border-2 ${theme.border} bg-white/60 backdrop-blur-sm shadow-sm`}
    >
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center justify-between ${theme.title}`}>
          <span className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${theme.dot}`} />
            {title}
          </span>
          <span className="text-base font-medium text-muted-foreground">{names.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {names.map((name) => (
            <Tack key={name} name={name} from={title} />
          ))}
          {names.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Drop names here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Tack({ name, from }: { name: string; from: string }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStartInner(e, name, from)}
      className="group relative cursor-grab active:cursor-grabbing rounded-2xl border bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
    >
      <div className="pointer-events-none absolute -top-2 left-2 rotate-12 opacity-80 transition group-hover:opacity-100">
        <Pin className="h-4 w-4" />
      </div>
      <div className="pl-5 text-sm font-medium tracking-tight">{name}</div>
    </div>
  );
}

function onDragStartInner(e: React.DragEvent, name: string, from: string) {
  e.dataTransfer.setData("text/plain", JSON.stringify({ name, from }));
  e.dataTransfer.effectAllowed = "move";
}

function StatsBar({ counts }: { counts: { yes: number; maybe: number; no: number; noresp: number; total: number } }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Stat label="Total" value={counts.total} subtle />
      <Stat label="Yes" value={counts.yes} accent="yes" />
      <Stat label="Maybe" value={counts.maybe} accent="maybe" />
      <Stat label="No" value={counts.no} accent="no" />
      <Stat label="No Response" value={counts.noresp} />
    </div>
  );
}

function Stat({ label, value, accent, subtle }: { label: string; value: number; accent?: "yes"|"maybe"|"no"; subtle?: boolean }) {
  const accentCls = accent === "yes" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : accent === "maybe" ? "bg-amber-100 text-amber-700 border-amber-200"
    : accent === "no" ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-white/70 text-slate-700 border-slate-200";
  return (
    <div className={`rounded-xl border p-3 ${subtle ? "bg-white/70" : accentCls}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function columnTheme(title: string) {
  switch (title) {
    case "Yes":
      return { border: "border-emerald-200", dot: "bg-emerald-500", title: "text-emerald-700" };
    case "Maybe":
      return { border: "border-amber-200", dot: "bg-amber-500", title: "text-amber-700" };
    case "No":
      return { border: "border-rose-200", dot: "bg-rose-500", title: "text-rose-700" };
    default:
      return { border: "border-slate-200", dot: "bg-slate-400", title: "text-slate-700" };
  }
}

function escapeCSV(s: string) {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}
