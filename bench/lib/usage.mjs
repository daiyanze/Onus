// Token use from each runtime's machine-readable output. Every parser returns
// the same shape; a field a runtime does not report is null, never a guess.
//
//   input, output   tokens; input includes cached input where the runtime
//                   reports it that way (Codex, Claude), see `note`
//   cacheRead       cached input tokens read
//   cacheWrite      input tokens written to the cache
//   reasoning       reasoning tokens, already counted in output; null when
//                   the runtime does not report them
//   total           input + output + cache tokens as the runtime counts them
//   costUsd         the runtime's own cost estimate, or null
//   turns           model calls or turns, as the runtime counts them

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean).flatMap((l) => {
  try { return [JSON.parse(l)]; } catch { return []; }
});
const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * `claude -p --output-format json`: one result object. `modelUsage` covers
 * every model the run used, subagents included; `usage` covers the main
 * agent only. Both are client-side estimates.
 */
export function claude(stdout) {
  const objs = lines(stdout);
  const result = objs.findLast?.((o) => o.type === "result") ?? [...objs].reverse().find((o) => o.type === "result");
  if (!result) return null;
  const u = result.usage ?? {};
  const main = {
    input: n(u.input_tokens),
    output: n(u.output_tokens),
    cacheRead: n(u.cache_read_input_tokens),
    cacheWrite: n(u.cache_creation_input_tokens),
  };
  let all = null;
  if (result.modelUsage && typeof result.modelUsage === "object") {
    all = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    for (const m of Object.values(result.modelUsage)) {
      all.input += n(m.inputTokens);
      all.output += n(m.outputTokens);
      all.cacheRead += n(m.cacheReadInputTokens);
      all.cacheWrite += n(m.cacheCreationInputTokens);
    }
  }
  const t = all ?? main;
  return {
    ...t,
    reasoning: null,
    total: t.input + t.output + t.cacheRead + t.cacheWrite,
    costUsd: typeof result.total_cost_usd === "number" ? result.total_cost_usd : null,
    turns: typeof result.num_turns === "number" ? result.num_turns : null,
    note: all ? "modelUsage (all models, subagents included)" : "usage (main agent only)",
    isError: result.is_error === true,
  };
}

/**
 * `codex exec --json`: JSONL. A `turn.completed` carries the thread's running
 * total so far (codex-rs builds it from the last total), so the last one is
 * the run's use. Cached input is part of input, reasoning part of output.
 * No cost.
 */
export function codex(stdout) {
  const turns = lines(stdout).filter((o) => o.type === "turn.completed" && o.usage);
  if (turns.length === 0) return null;
  const u = turns.at(-1).usage;
  const input = n(u.input_tokens);
  const output = n(u.output_tokens);
  return {
    input, output,
    cacheRead: n(u.cached_input_tokens),
    cacheWrite: typeof u.cache_write_input_tokens === "number" ? u.cache_write_input_tokens : null,
    reasoning: typeof u.reasoning_output_tokens === "number" ? u.reasoning_output_tokens : null,
    total: input + output, costUsd: null, turns: turns.length,
    note: "last turn.completed (a running total); cacheRead is part of input, reasoning part of output",
    isError: false,
  };
}

/**
 * `pi --mode json`: JSONL events. Every assistant message carries usage on
 * its `message_end`; a tool result carries usage when the tool did nested
 * model work; a successful `compaction_end` carries the summary call's usage
 * in `result.usage`. Pi computes cost from its model table.
 */
export function pi(stdout) {
  const events = lines(stdout);
  const ends = events.filter((o) => o.type === "message_end" && o.message?.usage && ["assistant", "toolResult"].includes(o.message.role));
  const compactions = events.filter((o) => o.type === "compaction_end" && o.result?.usage);
  if (ends.length === 0) return null;
  const s = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cost: 0 };
  let reasoning = null;
  const add = (u) => {
    s.input += n(u.input);
    s.output += n(u.output);
    s.cacheRead += n(u.cacheRead);
    s.cacheWrite += n(u.cacheWrite);
    s.total += n(u.totalTokens);
    s.cost += n(u.cost?.total);
    if (typeof u.reasoning === "number") reasoning = (reasoning ?? 0) + u.reasoning;
  };
  for (const { message: m } of ends) add(m.usage);
  for (const c of compactions) add(c.result.usage);
  const calls = ends.filter((e) => e.message.role === "assistant").length;
  return {
    input: s.input, output: s.output, cacheRead: s.cacheRead, cacheWrite: s.cacheWrite, reasoning,
    total: s.total, costUsd: s.cost, turns: calls,
    note: `message_end: ${calls} assistant messages, ${ends.length - calls} tool results with nested usage; ${compactions.length} compactions`,
    isError: false,
  };
}

export const parsers = { claude, codex, pi };
