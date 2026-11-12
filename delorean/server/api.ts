import type { IncomingMessage, ServerResponse } from "node:http";
import { AgentRequestSchema, type AgentResponse, type EngineMode, type EngineStatus } from "../shared/schema";
import { CUSTOM_MISSION_ID, getStation } from "../shared/stations";
import { CrewError, MODEL, runCrew } from "./agent";
import { demoCrew } from "./demo";

const MAX_BODY_BYTES = 256 * 1024;

/**
 * Live when Claude credentials are configured; demo otherwise.
 * DELOREAN_LIVE=1 forces live (e.g. when using an `ant auth login` profile);
 * DELOREAN_DEMO=1 forces demo.
 */
export function engineMode(): EngineMode {
  if (process.env.DELOREAN_DEMO === "1") return "demo";
  if (process.env.DELOREAN_LIVE === "1") return "live";
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "live" : "demo";
}

/** Connect-style middleware, used by both the Vite dev server and the production server. */
export async function apiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  const path = (req.url ?? "").split("?")[0];
  if (!path.startsWith("/api/")) return next();

  try {
    if (req.method === "GET" && path === "/api/status") {
      const status: EngineStatus = { mode: engineMode(), model: MODEL };
      return send(res, 200, status);
    }

    if (req.method === "POST" && path === "/api/agent") {
      const parsed = AgentRequestSchema.safeParse(await readJson(req));
      if (!parsed.success) return send(res, 400, { error: "That request doesn't look right." });
      const request = parsed.data;

      const station = getStation(request.stationId);
      const mission = station.missions.find((m) => m.id === request.missionId);
      const isCustom = request.missionId === CUSTOM_MISSION_ID;
      if (!mission && !isCustom) return send(res, 400, { error: "Unknown mission." });
      if ((isCustom || mission?.needsInput) && !request.input.trim()) {
        return send(res, 400, { error: `${station.crew} needs some material to work with.` });
      }

      const mode = engineMode();
      const result = mode === "live" ? await runCrew(request) : await withDelay(demoCrew(request));
      const body: AgentResponse = { mode, result };
      return send(res, 200, body);
    }

    send(res, 404, { error: "Not found." });
  } catch (err) {
    if (err instanceof CrewError) return send(res, err.status, { error: err.message });
    console.error("[delorean] unexpected error", err);
    send(res, 500, { error: "Unexpected server error." });
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > MAX_BODY_BYTES) throw new CrewError("That's too much material for one mission.", 413);
    chunks.push(buf);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new CrewError("Request body must be JSON.", 400);
  }
}

/** Demo replies wait a moment so the "crew is working" animation is visible. */
function withDelay<T>(value: T, ms = 1600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
