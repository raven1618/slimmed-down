import type { AgentRequest, AgentResult, Deliverable, Handoff, StationId } from "../shared/schema";
import { CUSTOM_MISSION_ID, getStation } from "../shared/stations";

/**
 * Demo mode: canned but brand-aware output so the world is playable without an API key.
 * Every result says it's a demo, so nobody mistakes it for real crew work.
 */
export function demoCrew(req: AgentRequest): AgentResult {
  const station = getStation(req.stationId);
  const mission = station.missions.find((m) => m.id === req.missionId);
  const label = req.missionId === CUSTOM_MISSION_ID || !mission ? "your request" : mission.label.toLowerCase();
  const b = req.brand;
  const name = b.businessName;
  const goal = b.goal || "grow steadily this month";
  const audience = b.audience || "your best customers";
  const edge = b.differentiator || "what makes you different";
  const channel = firstChannel(b.channels);

  const decks: Record<StationId, () => { deliverables: Deliverable[]; flags: string[]; next: Handoff[] }> = {
    garage: () => ({
      deliverables: [
        d("Positioning statement", "Positioning", "Internal",
          `For ${audience}, ${name} is the one choice that offers ${edge}. Unlike the usual alternatives, we make it feel personal, every single time.`,
          "A single sentence every crew can check their work against."),
        d("Voice rules", "Guidelines", "Internal",
          `1. Sound like a friend who knows the craft.\n   Do: "We tested this 12 times so you don't have to."\n   Don't: "We are committed to excellence."\n2. Short sentences. One idea each.\n3. Specific beats clever: name the ingredient, the hour, the person.\n4. Invite, never pressure.\n5. Every post ends with one clear next step.`,
          "Clear rules keep the voice consistent across every crew."),
      ],
      flags: ["Demo output. Connect Claude for a real critique of your Brand Core."],
      next: [h("studio", "Write a week of posts using the new voice rules"), h("market", "Turn the positioning into a sales pitch")],
    }),
    studio: () => ({
      deliverables: [
        d("Behind the scenes", "Short video", channel,
          `HOOK: "Nobody sees this part of ${name}…"\nSHOT 1: Close-up of hands at work.\nSHOT 2: The finished product, slow pan.\nON-SCREEN: ${edge}\nCTA: "Come see it for yourself. Link in bio."`,
          "Process content builds trust and is easy to film on a phone."),
        d("The why post", "Single image", channel,
          `We started ${name} for one reason: ${audience} deserved better.\n\nToday's goal: ${goal}.\n\nTell us in the comments: what should we make next?`,
          "Origin stories plus a question invite replies, which boosts reach."),
        d("Customer favourite", "Carousel outline", channel,
          `Slide 1: "Our most-loved thing (and why)"\nSlide 2: What it is\nSlide 3: How we make it\nSlide 4: What people say (add a real quote)\nSlide 5: How to get yours this week`,
          "Carousels get saved and shared; social proof does the selling."),
      ],
      flags: ["Demo output. Add a real customer quote to slide 4 before publishing."],
      next: [h("tower", "Turn the best post into a paid ad"), h("square", "Prepare replies for comments on this week's posts")],
    }),
    tower: () => ({
      deliverables: [
        d("Two-week campaign", "Campaign plan", "Multi-channel",
          `Big idea: "${name}, the obvious choice for ${audience}."\nWeek 1: Awareness. 3 posts, 1 short video, 1 email.\nWeek 2: Conversion. Offer reveal, reminder, last-chance story.\nSuccess metric: progress toward "${goal}".`,
          "A short, focused push is easier to execute and measure."),
        d("Ad: pain angle", "Paid ad", channel,
          `Headline: Tired of settling?\nText: ${audience} deserve ${edge}. ${name} makes it easy.\nCTA: Learn more`,
          "Leading with the problem filters for people who feel it."),
      ],
      flags: ["Demo output. Set a budget before running ads."],
      next: [h("studio", "Produce the creative for the campaign"), h("vault", "Set a campaign budget and track spend")],
    }),
    market: () => ({
      deliverables: [
        d("Warm outreach", "Direct message", channel,
          `Hi! I run ${name}. I noticed you care about the same things our customers do. We'd love to send you something to try, no strings attached. Interested?`,
          "Leading with a gift and a question feels personal, not salesy."),
        d("Follow-up", "Direct message", channel,
          `Just bumping this in case it got buried! Happy to share more about ${name} whenever suits you.`,
          "One friendly follow-up doubles replies without being pushy."),
      ],
      flags: ["Demo output. Personalise each message with something specific about the recipient."],
      next: [h("square", "Welcome new customers with a thank-you message"), h("vault", "Check the margin on the offer before promoting it")],
    }),
    square: () => ({
      deliverables: [
        d("Reply to a happy customer", "Reply", channel,
          `This made our day! Thank you for choosing ${name}. See you again soon.`,
          "Fast, warm replies turn customers into regulars."),
        d("Reply to a complaint", "Reply", channel,
          `We're really sorry about this, it's not the experience we want for you. Could you send us a DM so we can make it right?`,
          "Owning the problem publicly and solving it privately protects trust."),
      ],
      flags: ["Demo output. Paste real comments to get tailored replies."],
      next: [h("studio", "Turn a happy review into a post"), h("garage", "Add common complaints to the Brand Core")],
    }),
    vault: () => ({
      deliverables: [
        d("Cash snapshot", "Summary", "Internal",
          `Here's how to read your numbers each week:\n1. Money in (sales)\n2. Money out (supplies, rent, tools, ads)\n3. What's left = profit before tax\nPaste your transactions and Penny will sort them into these buckets.`,
          "A simple weekly ritual beats a perfect spreadsheet you never open."),
      ],
      flags: ["Demo output. Penny needs real numbers to calculate anything.", "Not tax advice."],
      next: [h("observatory", "Run a health check on last month's numbers")],
    }),
    archive: () => ({
      deliverables: [
        d("Policies you likely need", "Checklist", "Website",
          `1. Terms of sale: payment, delivery, cancellations\n2. Refund/returns policy\n3. Privacy policy: what data you collect and why\n4. Cookie notice (if your site uses tracking)\n5. Social media and giveaway rules (if you run contests)`,
          "Covering the basics prevents most disputes before they start."),
      ],
      flags: ["Demo output. Not legal advice. Have a local lawyer review before publishing."],
      next: [h("square", "Add the refund policy to the FAQ")],
    }),
    observatory: () => ({
      deliverables: [
        d("90-day focus", "Plan", "Internal",
          `Priority 1: ${goal}.\nPriority 2: Show up consistently on ${channel} (3x a week).\nPriority 3: Know your numbers weekly.\nStop doing: anything that doesn't move priority 1.`,
          "Three priorities is the most a busy owner can actually execute."),
      ],
      flags: ["Demo output. Share real numbers for a real diagnosis.", "General guidance, not financial advice."],
      next: [h("tower", "Plan a campaign for priority 1"), h("vault", "Set up a weekly numbers check")],
    }),
  };

  const deck = decks[req.stationId]();
  return {
    summary: `Demo run of ${label} for ${name}. Add a Claude API key on the server to get real, tailored work from ${station.crew}.`,
    deliverables: deck.deliverables,
    review_flags: deck.flags,
    next_steps: deck.next,
  };
}

function d(title: string, kind: string, channel: string, body: string, why: string): Deliverable {
  return { title, kind, channel, body, why };
}

function h(station: StationId, mission: string): Handoff {
  return { station, mission };
}

function firstChannel(channels: string): string {
  const first = channels.split(/[,;/]|\band\b/)[0]?.trim();
  return first || "Instagram";
}
