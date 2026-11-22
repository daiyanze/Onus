# Notes

A small notes service. It keeps notes in memory and serves them over HTTP.

## Run it

```sh
bun run start          # http://localhost:3000, or set PORT
bun run check          # the tests
```

## API

| Method and path | What it does |
| --- | --- |
| `GET /api/notes` | All notes, newest first |
| `GET /api/notes?tag=<tag>` | Notes with that tag. Tags match without regard to case |
| `POST /api/notes` | Add a note. Body: `{"title": "...", "tags": ["..."]}` |
| `DELETE /api/notes/:id` | Remove a note. 204 when removed, 404 when no note has that id |

Every response is JSON. A note looks like
`{"id": 1, "title": "Buy milk", "tags": ["home"], "createdAt": 1700000000000}`.
