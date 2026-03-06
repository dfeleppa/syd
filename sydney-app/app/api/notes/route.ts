import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const NOTES_PATH = path.join(process.cwd(), "notes.json");

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

async function readNotes(): Promise<Note[]> {
  try {
    const raw = await fs.readFile(NOTES_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeNotes(notes: Note[]) {
  await fs.writeFile(NOTES_PATH, JSON.stringify(notes, null, 2), "utf8");
}

export async function GET() {
  const notes = await readNotes();
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, title = "", content = "" } = body || {};
  const notes = await readNotes();

  let note: Note;
  if (id) {
    const idx = notes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notes[idx] = {
        ...notes[idx],
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      note = notes[idx];
    } else {
      note = {
        id,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      notes.push(note);
    }
  } else {
    note = {
      id: Math.random().toString(36).slice(2),
      title,
      content,
      updatedAt: new Date().toISOString(),
    };
    notes.push(note);
  }

  await writeNotes(notes);
  return NextResponse.json({ ok: true, id: note.id, notes });
}

