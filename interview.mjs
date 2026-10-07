// Interviewer: turns a CV plus a conversation into content/profile.json.
//   node interview.mjs --cv "path/to/cv.pdf" [--out content/profile.json] [--resume]
// Type your answers. Commands: /done (write the profile), /draft (write a draft now), /skip.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Profile } from "./schema.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : []).filter(Boolean));
const OUT = typeof args.out === "string" ? args.out : "content/profile.json";
const TRANSCRIPT = "content/interview-transcript.json";
const MODEL = "claude-opus-5";

let client;
const rl = createInterface({ input: stdin, output: stdout });

const SYSTEM = `You are interviewing one person to write their story-profile: a page that tells who they are and how they work better than a CV or LinkedIn does, readable by people and by their agents.

The profile schema you are filling has these parts: identity; person (intro, 3 to 5 values, energised by, drained by, a working manual); a timeline of chapters each paired with what was going on in the world at the time; skills; projects; interests; recommendations from named people; concrete ways to meet or work together; and a short factual summary for screening agents with good-fit and poor-fit signals.

How to interview:
- One question at a time. Short. Conversational. Never a list of questions.
- Start from what the CV already tells you. Do not ask for facts you have. Ask for the story behind them: why they moved, what they learned, what the team was like, what they would tell their younger self, what was happening around them at the time.
- Dig for specifics and for the person: how they give and take feedback, what energises and drains them, how they lead, what they do outside work, what kind of people they want to meet and in which format.
- Ask about anti-fit too. A profile with no "not for me" is not credible.
- Ask for at least one non-work interest and one thing they were wrong about.
- Roughly 12 to 18 questions. When you have enough for a credible profile, say so in one line and tell them to type /done.
- Never invent facts. If something is missing at the end, it will be marked todo rather than filled in.
- Write in the language the person answers in.`;

const FINAL = `The interview is over. Write the complete profile now from the CV and everything the person said.
Rules: first person, their voice, their vocabulary; verifiable facts from the CV stay exact (names, dates, companies); interpretive lines only from what they actually said; each timeline chapter gets a "world" line grounded in the real events of those years; where you lack information set "todo": true on that item instead of inventing; recommendations only if real quotes with names were provided; no buzzwords, no adverbs, no "passionate".`;

function cvBlock() {
  if (typeof args.cv !== "string") return null;
  const buf = readFileSync(args.cv);
  if (args.cv.toLowerCase().endsWith(".pdf")) {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") }, title: "CV" };
  }
  return { type: "text", text: `CV:\n${buf.toString("utf8")}` };
}

let messages = [];
if (args.resume && existsSync(TRANSCRIPT)) {
  messages = JSON.parse(readFileSync(TRANSCRIPT, "utf8"));
  console.log(`Resumed ${messages.length} turns.\n`);
} else {
  const content = [];
  const cv = cvBlock();
  if (cv) content.push(cv);
  content.push({ type: "text", text: cv ? "Here is my CV. Start the interview." : "I have no CV to share. Start the interview from scratch: name and what I do first." });
  messages.push({ role: "user", content });
}

async function ask() {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  stdout.write("\n");
  stream.on("text", (t) => stdout.write(t));
  const final = await stream.finalMessage();
  stdout.write("\n\n");
  if (final.stop_reason === "refusal") throw new Error("The model declined this turn: " + (final.stop_details?.explanation ?? ""));
  messages.push({ role: "assistant", content: final.content });
  writeFileSync(TRANSCRIPT, JSON.stringify(messages, null, 2));
}

async function writeProfile(draft = false) {
  console.log(draft ? "\nWriting a draft profile…" : "\nWriting the profile…");
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [...messages, { role: "user", content: FINAL }],
    output_config: { format: zodOutputFormat(Profile), effort: "high" },
  });
  if (!res.parsed_output) throw new Error("The profile did not validate against the schema. Try again or /draft.");
  writeFileSync(OUT, JSON.stringify(res.parsed_output, null, 2));
  const todos = JSON.stringify(res.parsed_output).match(/"todo":true/g)?.length ?? 0;
  console.log(`Wrote ${OUT} (${todos} items marked todo). Run: node build.mjs`);
}

try {
  client = new Anthropic();
  if (messages.at(-1).role === "user") await ask();
  for (;;) {
    const line = (await rl.question("> ")).trim();
    if (!line) continue;
    if (line === "/done") { await writeProfile(); break; }
    if (line === "/draft") { await writeProfile(true); continue; }
    messages.push({ role: "user", content: line === "/skip" ? "Skip that one, next question." : line });
    await ask();
  }
} catch (e) {
  if (e instanceof Anthropic.AuthenticationError || /authentication method/i.test(e.message ?? "")) console.error("\nNo API credentials. Set ANTHROPIC_API_KEY or run `ant auth login`.");
  else console.error("\n" + (e.message ?? e));
  process.exitCode = 1;
} finally { rl.close(); }
