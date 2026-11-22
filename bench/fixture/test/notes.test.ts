import { expect, test } from "bun:test";
import { addNote, filterByTag, seed, sorted } from "../src/notes.ts";

test("filterByTag matches without regard to case", () => {
  expect(filterByTag(seed, "work").map((n) => n.id)).toEqual([1, 3]);
  expect(filterByTag(seed, "WORK").map((n) => n.id)).toEqual([1, 3]);
  expect(filterByTag(seed, "garden")).toEqual([]);
});

test("sorted puts the newest first", () => {
  expect(sorted(seed).map((n) => n.id)).toEqual([1, 2, 3, 4]);
});

test("addNote validates the title", () => {
  const notes = [...seed];
  expect(addNote(notes, { title: "" }, 0)).toBe("title is required");
  expect(addNote(notes, { title: "x".repeat(121) }, 0)).toBe("title is longer than 120 characters");
  const note = addNote(notes, { title: " Water the plants ", tags: ["home"] }, 5);
  expect(note).toEqual({ id: 5, title: "Water the plants", tags: ["home"], createdAt: 5 });
});
