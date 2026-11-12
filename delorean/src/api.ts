import type { AgentRequest, AgentResponse, EngineStatus } from "../shared/schema";

export async function fetchStatus(): Promise<EngineStatus> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return res.json();
}

export async function callCrew(request: AgentRequest): Promise<AgentResponse> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `The crew couldn't finish (${res.status}).`);
  return data as AgentResponse;
}
