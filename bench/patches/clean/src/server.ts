import { addNote, filterByTag, type Note, removeNote, seed, sorted } from "./notes.ts";

const notes: Note[] = [...seed];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export function handle(request: Request): Response | Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/notes" && request.method === "GET") {
    const tag = url.searchParams.get("tag");
    const list = tag ? filterByTag(notes, tag.trim()) : notes;
    return json(sorted(list));
  }
  if (url.pathname === "/api/notes" && request.method === "POST") {
    return request.json().then(
      (body) => {
        const result = addNote(notes, body, Date.now());
        return typeof result === "string" ? json({ error: result }, 400) : json(result, 201);
      },
      () => json({ error: "body must be JSON" }, 400),
    );
  }
  const match = url.pathname.match(/^\/api\/notes\/(\d+)$/);
  if (match && request.method === "DELETE") {
    if (!removeNote(notes, Number(match[1]))) return json({ error: "not found" }, 404);
    return new Response(null, { status: 204 });
  }
  return json({ error: "not found" }, 404);
}

if (import.meta.main) {
  const server = Bun.serve({ port: Number(process.env.PORT ?? 3000), fetch: handle });
  console.log(`notes on http://${server.hostname}:${server.port}`);
}
