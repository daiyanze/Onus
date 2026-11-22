export interface Note {
  id: number;
  title: string;
  tags: string[];
  createdAt: number;
}

export const seed: Note[] = [
  { id: 1, title: "Write the quarterly report", tags: ["Work"], createdAt: 1700000400000 },
  { id: 2, title: "Buy milk", tags: ["home"], createdAt: 1700000300000 },
  { id: 3, title: "Book the team offsite", tags: ["work", "travel"], createdAt: 1700000200000 },
  { id: 4, title: "Call the plumber", tags: ["home"], createdAt: 1700000100000 },
];

/** Newest first. */
export function sorted(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt);
}

/** Notes carrying `tag`, compared without regard to case. */
export function filterByTag(notes: Note[], tag: string): Note[] {
  const wanted = tag.toLowerCase();
  return notes.filter((note) => note.tags.some((t) => t.toLowerCase() === wanted));
}

/** A new note, or a message saying why the input is not one. */
export function addNote(notes: Note[], input: unknown, now: number): Note | string {
  if (typeof input !== "object" || input === null) return "body must be an object";
  const { title, tags } = input as { title?: unknown; tags?: unknown };
  if (typeof title !== "string" || title.trim() === "") return "title is required";
  if (title.length > 120) return "title is longer than 120 characters";
  if (tags !== undefined && (!Array.isArray(tags) || tags.some((t) => typeof t !== "string"))) {
    return "tags must be a list of strings";
  }
  const id = notes.reduce((max, note) => Math.max(max, note.id), 0) + 1;
  const note: Note = { id, title: title.trim(), tags: (tags as string[]) ?? [], createdAt: now };
  notes.push(note);
  return note;
}
