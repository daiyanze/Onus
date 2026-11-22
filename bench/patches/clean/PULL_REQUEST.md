# Delete a note

Adds `DELETE /api/notes/:id`. It answers 204 when the note was removed and
404 when no note has that id.

- `removeNote` in `src/notes.ts`, with a test.
- The route in `src/server.ts`, and its row in `README.md`.

Verification: `bun run check` passes.
