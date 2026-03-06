"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notes || []);
      if (!selectedId && data.notes && data.notes.length > 0) {
        selectNote(data.notes[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        const saved = data.notes.find((n: Note) => n.id === data.id) as Note | undefined;
        if (saved) selectNote(saved);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleNew() {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Work
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Notes
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Fast scratchpad for ideas, todos, and working notes. Click a note
              on the left to edit it, or create a new one.
            </p>
          </div>
          <button
            onClick={handleNew}
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            + New note
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,2fr)]">
          {/* Notes list */}
          <aside className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-3 sm:p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Notes
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[60vh]">
              {notes.length === 0 && (
                <p className="px-2 py-3 text-xs text-zinc-500">
                  No notes yet. Click &quot;New note&quot; to create one.
                </p>
              )}
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === note.id
                      ? "bg-zinc-800 text-zinc-50"
                      : "bg-transparent text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{note.title || "Untitled"}</span>
                    <span className="text-[10px] text-zinc-500">
                      {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                      {note.content}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Editor */}
          <section className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <input
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                disabled={loading}
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            <textarea
              className="mt-3 h-[46vh] w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

