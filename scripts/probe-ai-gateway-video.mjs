/**
 * Probe script to discover whether the AI Gateway exposes a REST endpoint
 * for video generation.  Run with:
 *
 *   AI_GATEWAY_API_KEY=<key> node scripts/probe-ai-gateway-video.mjs
 *
 * If none of the candidate paths returns a non-404 response, the current
 * gateway surface does not support video via plain fetch() — only via the
 * AI SDK `experimental_generateVideo` helper.
 */
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function readApiKey() {
  const fromEnv = process.env.AI_GATEWAY_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const keyPath = path.join(os.homedir(), ".openclaw", ".ai-gateway-api-key");
  const fromDisk = (await readFile(keyPath, "utf8")).trim();
  if (fromDisk) return fromDisk;

  throw new Error("No AI Gateway API key found");
}

const apiKey = await readApiKey();

const baseUrl = "https://ai-gateway.vercel.sh/v1";

const body = {
  model: "google/veo-3.1-fast-generate-001",
  prompt: "A candle flickering on a desk",
  duration: 4,
};

const candidates = ["/video/generations", "/videos", "/videos/generations"];

for (const path of candidates) {
  const response = await fetch(baseUrl + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  console.log(
    JSON.stringify({
      path,
      status: response.status,
      bodyPreview: text.slice(0, 240),
    }),
  );
}
