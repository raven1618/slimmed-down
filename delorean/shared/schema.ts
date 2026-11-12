import { z } from "zod";

/** Every building on the island. The Garage is the hub; the rest are crews. */
export const STATION_IDS = [
  "garage",
  "studio",
  "tower",
  "market",
  "square",
  "vault",
  "archive",
  "observatory",
] as const;
export type StationId = (typeof STATION_IDS)[number];

/** Momentum meters shown in the HUD. Simulated until real accounts are connected. */
export const RESOURCES = ["reach", "leads", "cash", "trust"] as const;
export type Resource = (typeof RESOURCES)[number];

/**
 * The Brand Core is the shared context every crew reads before doing anything.
 * Filling it in is the "teach the AI about my business" step, turned into onboarding.
 */
export const BrandCoreSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  offering: z.string().trim().max(1000),
  audience: z.string().trim().max(1000),
  differentiator: z.string().trim().max(1000),
  voice: z.string().trim().max(500),
  goal: z.string().trim().max(500),
  channels: z.string().trim().max(500),
});
export type BrandCore = z.infer<typeof BrandCoreSchema>;

export const DeliverableSchema = z.object({
  title: z.string().describe("Short name for this piece of work"),
  kind: z
    .string()
    .describe("What it is, e.g. Instagram carousel, Video script, Email, Reply, Checklist, Forecast"),
  channel: z
    .string()
    .describe("Where it will be used, e.g. Instagram, Email, Website, Internal. Empty string if not applicable"),
  body: z
    .string()
    .describe("The complete, ready-to-use content. Plain text with line breaks. No markdown headings or bold"),
  why: z.string().describe("One sentence on why this should work for this specific business"),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

export const HandoffSchema = z.object({
  station: z.enum(STATION_IDS).describe("The crew best suited to do this next"),
  mission: z.string().describe("The follow-up mission as an imperative, under 12 words"),
});
export type Handoff = z.infer<typeof HandoffSchema>;

/** What every crew returns. One shape for all buildings keeps the world simple. */
export const AgentResultSchema = z.object({
  summary: z.string().describe("One or two sentences on what the crew delivered"),
  deliverables: z.array(DeliverableSchema),
  review_flags: z
    .array(z.string())
    .describe("Things the owner must verify before using this work. Empty if none"),
  next_steps: z.array(HandoffSchema).describe("2 to 4 follow-up missions, each routed to the best crew"),
});
export type AgentResult = z.infer<typeof AgentResultSchema>;

export const AgentRequestSchema = z.object({
  stationId: z.enum(STATION_IDS),
  missionId: z.string().min(1).max(64),
  input: z.string().max(20000),
  brand: BrandCoreSchema,
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export type EngineMode = "live" | "demo";

export interface AgentResponse {
  mode: EngineMode;
  result: AgentResult;
}

export interface EngineStatus {
  mode: EngineMode;
  model: string;
}
