import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AgentResultSchema, type AgentRequest, type AgentResult } from "../shared/schema";
import { getStation } from "../shared/stations";
import { buildSystemPrompt, buildUserMessage } from "./prompt";

export const MODEL = process.env.DELOREAN_MODEL || "claude-opus-5-5";

/** An error whose message is safe to show to the owner. */
export class CrewError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Credentials resolve from the environment (ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
  // or an `ant auth login` profile). Keys never reach the browser.
  client ??= new Anthropic({ maxRetries: 2, timeout: 180_000 });
  return client;
}

export async function runCrew(req: AgentRequest): Promise<AgentResult> {
  const station = getStation(req.stationId);

  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // If the model declines for policy reasons, retry server-side on Anthropic's
      // recommended fallback model instead of failing the mission.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(AgentResultSchema),
      },
      system: buildSystemPrompt(station, req.brand),
      messages: [{ role: "user", content: buildUserMessage(station, req.missionId, req.input) }],
    });
  } catch (err) {
    throw toCrewError(err);
  }

  if (response.stop_reason === "refusal") {
    throw new CrewError(
      `${station.crew} can't take this one on. Try rephrasing the request or giving more context.`,
      422,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new CrewError(`${station.crew} ran out of room mid-task. Try asking for fewer items.`, 502);
  }
  if (!response.parsed_output) {
    throw new CrewError(`${station.crew} came back with something unreadable. Please try again.`, 502);
  }
  return response.parsed_output;
}

function toCrewError(err: unknown): CrewError {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new CrewError("Claude credentials are missing or invalid on the server.", 401);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new CrewError("The crews are busy (rate limited). Try again in a minute.", 429);
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new CrewError(`Claude rejected the request: ${err.message}`, 400);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new CrewError("Couldn't reach Claude. Check the server's network connection.", 503);
  }
  if (err instanceof Anthropic.APIError) {
    return new CrewError(`Claude API error (${err.status ?? "unknown"}). Please try again.`, 502);
  }
  if (err instanceof Error && /auth|api key|credential/i.test(err.message)) {
    return new CrewError("No Claude credentials found on the server. Set ANTHROPIC_API_KEY.", 401);
  }
  return new CrewError("Something went wrong while the crew was working.", 500);
}
