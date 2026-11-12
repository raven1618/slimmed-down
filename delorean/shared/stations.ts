import type { Resource, StationId } from "./schema";

export interface Mission {
  id: string;
  label: string;
  /** Shown on the mission card. */
  blurb: string;
  /** What the crew is asked to do. Sent to the model. */
  brief: string;
  /** Placeholder for the notes box. */
  inputHint: string;
  /** If true, the mission cannot run without owner-provided material. */
  needsInput?: boolean;
}

export interface Station {
  id: StationId;
  name: string;
  department: string;
  crew: string;
  tagline: string;
  color: string;
  /** Which momentum meter approved work from this building feeds. */
  resource: Resource | null;
  /** The crew's job description. Becomes part of the system prompt. */
  role: string;
  /** Shown in the panel and added to the system prompt for sensitive areas. */
  caution?: string;
  /** Status line while the crew is working. */
  workingLine: string;
  missions: Mission[];
}

export const CUSTOM_MISSION_ID = "custom";

export const STATIONS: Station[] = [
  {
    id: "garage",
    name: "The Garage",
    department: "Brand Core",
    crew: "Gauge",
    tagline: "Where the crews learn who you are.",
    color: "#ff7a45",
    resource: null,
    role:
      "You are the brand strategist. You sharpen positioning, define voice rules, and make sure every other crew understands the business deeply.",
    workingLine: "Gauge is tuning your Brand Core…",
    missions: [
      {
        id: "sharpen",
        label: "Sharpen my brand",
        blurb: "A positioning statement, voice rules and taglines.",
        brief:
          "Critique the Brand Core honestly, then deliver: (1) a one-sentence positioning statement, (2) 5 voice rules with a do/don't example each, (3) 5 tagline options.",
        inputHint: "Anything the crews keep getting wrong about you? (optional)",
      },
      {
        id: "personas",
        label: "Meet my customers",
        blurb: "Three buyer personas with real motivations.",
        brief:
          "Write 3 distinct customer personas for this business. For each: who they are, what they want, what stops them from buying, where to reach them, and the one message that would move them.",
        inputHint: "Describe a few real customers you love (optional)",
      },
      {
        id: "competitors",
        label: "Find my edge",
        blurb: "Where you win against the alternatives.",
        brief:
          "Analyse the competitive angle. Identify the realistic alternatives a customer has, where this business wins and loses, and 3 positioning moves to own a clear space.",
        inputHint: "Name competitors or alternatives your customers consider",
      },
    ],
  },
  {
    id: "studio",
    name: "Content Studio",
    department: "Content",
    crew: "Pixel",
    tagline: "Posts, scripts and captions, made to your voice.",
    color: "#ff4f9a",
    resource: "reach",
    role:
      "You are the content producer. You write scroll-stopping social posts, short video scripts and captions with a strong hook, a clear point and one call to action.",
    workingLine: "Pixel is storyboarding…",
    missions: [
      {
        id: "week",
        label: "A week of posts",
        blurb: "5 posts with hooks, mixed formats.",
        brief:
          "Create 5 social posts for this week that push the current goal. Mix formats (carousel outline, short video, single image, story). Each needs a hook in the first line, the body, and one call to action.",
        inputHint: "Anything happening this week? Launches, events, stock… (optional)",
      },
      {
        id: "video",
        label: "Short video scripts",
        blurb: "2 vertical videos, shot by shot.",
        brief:
          "Write 2 short vertical video scripts (20–40 seconds). For each: the hook (first 2 seconds), shot-by-shot directions a phone can film, on-screen text and the spoken lines.",
        inputHint: "Topic or product to feature (optional)",
      },
      {
        id: "repurpose",
        label: "Repurpose this",
        blurb: "Turn one idea into three formats.",
        brief:
          "Repurpose the owner's material into 3 formats: an Instagram caption, a longer LinkedIn/Facebook post, and a short email blurb. Keep the core idea, adapt the shape.",
        inputHint: "Paste an idea, announcement, article or voice-note transcript",
        needsInput: true,
      },
    ],
  },
  {
    id: "tower",
    name: "Signal Tower",
    department: "Marketing",
    crew: "Echo",
    tagline: "Campaigns, ads and emails that reach the right people.",
    color: "#7a5cff",
    resource: "reach",
    role:
      "You are the marketing strategist. You plan focused campaigns, write ad variations that test different angles, and build email sequences that move people toward a purchase.",
    workingLine: "Echo is tuning the frequencies…",
    missions: [
      {
        id: "campaign",
        label: "Plan a campaign",
        blurb: "A 2-week plan toward your goal.",
        brief:
          "Design a 2-week campaign toward the current goal: the big idea, key message, channel plan, a day-by-day calendar, the budget split if any, and the one metric that says it worked.",
        inputHint: "Budget, dates, or an offer to push (optional)",
      },
      {
        id: "ads",
        label: "Ad variations",
        blurb: "4 ads, each testing a different angle.",
        brief:
          "Write 4 paid-ad variations, each testing a different angle (pain, desire, proof, urgency). For each: headline, primary text, call to action, and an image/video idea.",
        inputHint: "Platform and offer (optional)",
      },
      {
        id: "emails",
        label: "Email sequence",
        blurb: "A 3-email nurture series.",
        brief:
          "Write a 3-email nurture sequence for new subscribers or leads: welcome and story, value and proof, offer with a reason to act now. Include subject lines and preview text.",
        inputHint: "Who receives this and what should they buy? (optional)",
      },
    ],
  },
  {
    id: "market",
    name: "The Market",
    department: "Sales",
    crew: "Barker",
    tagline: "Leads, offers and follow-ups that close.",
    color: "#ffb020",
    resource: "leads",
    role:
      "You are the sales lead. You write personal outreach that doesn't sound like spam, design honest offers people want, and handle objections with empathy.",
    workingLine: "Barker is warming up the stall…",
    missions: [
      {
        id: "outreach",
        label: "Outreach messages",
        blurb: "3 openers and 2 follow-ups.",
        brief:
          "Write 3 personal outreach messages (DM or email) for ideal customers or partners, plus 2 polite follow-ups. Short, specific, no hard sell, one clear ask each.",
        inputHint: "Who are you reaching out to? (optional)",
      },
      {
        id: "offer",
        label: "Build an offer",
        blurb: "A package people want to say yes to.",
        brief:
          "Design an offer or bundle that is attractive and honest: what's included, the price logic, a bonus, a guarantee or risk-reducer, and the pitch in 3 sentences.",
        inputHint: "Products, prices and costs you're working with (optional)",
      },
      {
        id: "objections",
        label: "Handle objections",
        blurb: "Replies to the top 5 “no”s.",
        brief:
          "List the 5 most likely objections customers raise for this business and write a short, empathetic reply for each that a person could send as-is.",
        inputHint: "Objections you hear most (optional)",
      },
    ],
  },
  {
    id: "square",
    name: "Town Square",
    department: "Community",
    crew: "Hearth",
    tagline: "Replies, reviews and a community that sticks around.",
    color: "#14c3b0",
    resource: "trust",
    role:
      "You are the community manager. You reply to comments and reviews with warmth and speed, spark conversations, and turn customers into regulars.",
    workingLine: "Hearth is listening to the crowd…",
    missions: [
      {
        id: "replies",
        label: "Reply to comments",
        blurb: "Drafts for comments, DMs and reviews.",
        brief:
          "Draft a reply for each comment, message or review the owner pasted. Match the brand voice, be human, fix problems publicly but move details to private messages.",
        inputHint: "Paste the comments, DMs or reviews you need to answer",
        needsInput: true,
      },
      {
        id: "spark",
        label: "Spark conversation",
        blurb: "5 posts that invite replies.",
        brief:
          "Write 5 community posts designed to get replies (questions, polls, this-or-that, behind the scenes, customer spotlight). Include the exact text.",
        inputHint: "Topics your community cares about (optional)",
      },
      {
        id: "faq",
        label: "Write the FAQ",
        blurb: "Answers to the questions you get daily.",
        brief:
          "Write the 8 questions customers most likely ask this business, with clear, friendly answers. Flag any answer that depends on facts you don't have.",
        inputHint: "Questions you get all the time (optional)",
      },
    ],
  },
  {
    id: "vault",
    name: "The Vault",
    department: "Accounting",
    crew: "Penny",
    tagline: "Expenses, invoices and margins, kept tidy.",
    color: "#2fb36d",
    resource: "cash",
    role:
      "You are the bookkeeper. You categorise transactions, draft invoices, and make margins and cash flow understandable to someone who hates spreadsheets. You show your arithmetic.",
    caution:
      "Bookkeeping help, not certified accounting or tax advice. Confirm tax and filing questions with a qualified accountant.",
    workingLine: "Penny is counting coins…",
    missions: [
      {
        id: "expenses",
        label: "Sort my expenses",
        blurb: "Categories, totals and anything odd.",
        brief:
          "Categorise the transactions the owner pasted, give totals per category, and flag anything unusual, duplicated or likely personal.",
        inputHint: "Paste transactions (date, description, amount) from your bank or app",
        needsInput: true,
      },
      {
        id: "invoice",
        label: "Draft an invoice",
        blurb: "Clean invoice text with payment terms.",
        brief:
          "Draft a professional invoice from the details given: line items, subtotal, taxes if specified, total, payment terms and a friendly payment note.",
        inputHint: "Client, items, quantities, prices, tax rate, due date",
        needsInput: true,
      },
      {
        id: "margins",
        label: "Check my margins",
        blurb: "Is each product actually making money?",
        brief:
          "Calculate the unit margin and margin percentage for each product from the numbers given, show the arithmetic, and suggest price or cost moves.",
        inputHint: "For each product: price, cost of materials, time or other costs",
        needsInput: true,
      },
    ],
  },
  {
    id: "archive",
    name: "The Archive",
    department: "Legal",
    crew: "Quill",
    tagline: "Plain-language prep before you see a lawyer.",
    color: "#c9824a",
    resource: "trust",
    role:
      "You are the legal prep clerk. You explain contracts in plain language, outline the policies a small business typically needs, and prepare sharp questions for a licensed lawyer. You never present yourself as a lawyer.",
    caution:
      "Not legal advice. Use this to prepare, then have a licensed lawyer in your jurisdiction review anything you sign or publish.",
    workingLine: "Quill is reading the fine print…",
    missions: [
      {
        id: "contract",
        label: "Explain a contract",
        blurb: "Plain-language summary and red flags.",
        brief:
          "Explain the contract or clause the owner pasted in plain language: what it commits them to, red flags, missing protections, and the questions to ask a lawyer.",
        inputHint: "Paste the contract or clause",
        needsInput: true,
      },
      {
        id: "policies",
        label: "Policies checklist",
        blurb: "What your terms and privacy policy must cover.",
        brief:
          "Outline the policies this business likely needs (terms, privacy, refunds, cookies, etc.), what each should cover, and which points depend on local law.",
        inputHint: "Where do you operate, and do you sell online? (optional)",
      },
      {
        id: "claims",
        label: "Check my marketing claims",
        blurb: "Spot risky promises before they go out.",
        brief:
          "Review the marketing text for risky claims (health, earnings, guarantees, comparisons, testimonials, discounts) and suggest safer wording.",
        inputHint: "Paste ad copy, posts or website text",
        needsInput: true,
      },
    ],
  },
  {
    id: "observatory",
    name: "Observatory",
    department: "Advisor",
    crew: "Vega",
    tagline: "See where the business is heading, and what to do next.",
    color: "#3d8bff",
    resource: null,
    role:
      "You are the business advisor. You read the numbers, explain what they mean in plain words, and recommend the few moves that matter most. You are candid about uncertainty.",
    caution:
      "General business guidance, not regulated financial or investment advice.",
    workingLine: "Vega is reading the stars…",
    missions: [
      {
        id: "health",
        label: "Health check",
        blurb: "What your numbers are really saying.",
        brief:
          "Diagnose the business from the numbers given: what's healthy, what's worrying, the 3 metrics to watch, and the single most important fix.",
        inputHint: "Monthly revenue, costs, customers, anything you track",
        needsInput: true,
      },
      {
        id: "plan",
        label: "90-day plan",
        blurb: "Priorities for the next quarter.",
        brief:
          "Build a focused 90-day plan toward the goal: 3 priorities, weekly milestones, what to stop doing, and how each crew on the island should help.",
        inputHint: "Constraints: time, budget, team (optional)",
      },
      {
        id: "whatif",
        label: "What if…?",
        blurb: "Think through a decision before you make it.",
        brief:
          "Reason through the scenario the owner describes: likely outcomes, best/base/worst case with rough numbers where possible, risks, and a recommendation.",
        inputHint: "e.g. What if I raise prices 10%? Hire a part-timer? Open on Sundays?",
        needsInput: true,
      },
    ],
  },
];

export const STATIONS_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s])) as Record<
  StationId,
  Station
>;

export function getStation(id: StationId): Station {
  return STATIONS_BY_ID[id];
}

export const RESOURCE_LABELS: Record<Resource, string> = {
  reach: "Reach",
  leads: "Leads",
  cash: "Cash",
  trust: "Trust",
};
