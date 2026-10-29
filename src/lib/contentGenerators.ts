import { type ChatMessage, callGroq, extractGroqContent, type GroqOptions } from "./groq";

export interface FeedPost {
  id: string;
  user: string;
  title: string;
  content: string;
  isTicketLink: boolean;
  reactions: number;
  comments: number;
  timeStr: string;
}

export interface MatchEvent {
  timestamp: string;
  commentary: string;
  homeGoals: number;
  oppGoals: number;
  homeShots: number;
  oppShots: number;
  homePossession: number;
  type: "general" | "chance" | "goal" | "card" | "var" | "sub";
}

/** Asks Groq for JSON and parses it, tolerating markdown fences. */
async function askForJson<T>(messages: ChatMessage[], options: GroqOptions): Promise<T | null> {
  try {
    const response = await callGroq(messages, options);
    const raw = extractGroqContent(response)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Groq request failed, using local fallback:", error);
    return null;
  }
}

function normalisePost(post: Partial<FeedPost>, index: number): FeedPost {
  return {
    id: `post-${index}`,
    user: post.user || "@fan",
    title: post.title || "Update",
    content: post.content || "",
    isTicketLink: Boolean(post.isTicketLink),
    reactions: Number(post.reactions) || 0,
    comments: Number(post.comments) || 0,
    timeStr: post.timeStr || "Just now",
  };
}

/* ------------------------------------------------------------------ *
 * Local fallbacks – used whenever the edge function is unreachable.
 * ------------------------------------------------------------------ */

const fallbackHeadlines = (home: string, opp: string, match: string): string[] => {
  const h = home || "Home Team";
  const o = opp || "The Opponent";
  const m = match || "The Big Match";
  const templates = [
    `BREAKING: ${h} stuns favourites!`,
    `LEGEND RETURNS: Star player back for ${m}!`,
    `TACTICAL SHOCK: Manager abandons formation against ${o}`,
    `FANS OUTRAGED: Ticket prices for ${m} soar`,
    `WEATHER WARNING: Heavy rain expected during ${h} vs ${o}`,
    `EXCLUSIVE: Inside ${h}'s training camp`,
    `INJURY FEARS: Key midfielder limps off ahead of ${m}`,
    `RIVALRY RENEWED: History of ${h} and ${o} clashes`,
    `${o} manager comments on "hostile" away crowd`,
    `RECORD BROKEN: Merchandise sales hit all-time high`,
  ];

  const results: string[] = [];
  for (let i = 0; i < 40; i++) {
    results.push(`${templates[i % templates.length]} (#${i})`);
  }
  return results.sort(() => Math.random() - 0.5);
};

const fallbackPosts = (home: string, match: string): FeedPost[] => {
  const users = [
    "@ultra_fan99",
    "@tactics_nerd",
    "@casual_watcher",
    "@angry_pundit",
    "@stats_guy",
    "@hype_train",
    "@doomer_fan",
    "@optimist_prime",
  ];
  const h = home || "Home";
  const m = match || "The Big Match";
  const templates = [
    { title: "Just got my scarf!", content: `Ready for the match. Let's go ${h}!!!` },
    { title: "Thoughts on the lineup?", content: "Honestly worried we are too attacking." },
    { title: "I cannot sleep", content: "The anxiety is real. Need this win." },
    { title: "Hot take", content: "We are going to crush them 3-0." },
    { title: "WHERE ARE THE TICKETS", content: "Portal is down again. Typical." },
  ];

  const results: FeedPost[] = [];
  for (let i = 0; i < 50; i++) {
    const user = users[i % users.length];
    const template = templates[i % templates.length];
    const isTicket = Math.random() < 0.3;
    results.push({
      id: `post-${i}`,
      user: isTicket ? "@OfficialTicketPortal" : `${user}${Math.floor(Math.random() * 1000)}`,
      title: isTicket ? "TICKETS NOW LIVE" : template.title,
      content: isTicket
        ? `Secure your seat for ${m}. Link: officialticketportal.com`
        : template.content,
      isTicketLink: isTicket,
      reactions: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 300),
      timeStr: "Just now",
    });
  }
  return results;
};

const fallbackCommentary = (home: string, opp: string): MatchEvent[] => {
  const h = home || "Home";
  const o = opp || "Opponent";
  return [
    {
      timestamp: "0'",
      commentary: "Kickoff! The atmosphere is electric.",
      homeGoals: 0,
      oppGoals: 0,
      homeShots: 0,
      oppShots: 0,
      homePossession: 50,
      type: "general",
    },
    {
      timestamp: "12'",
      commentary: `${h} dominating early possession, pressing high.`,
      homeGoals: 0,
      oppGoals: 0,
      homeShots: 1,
      oppShots: 0,
      homePossession: 65,
      type: "general",
    },
    {
      timestamp: "24'",
      commentary: `Massive chance for ${o}! Smashes the crossbar!`,
      homeGoals: 0,
      oppGoals: 0,
      homeShots: 1,
      oppShots: 2,
      homePossession: 58,
      type: "chance",
    },
    {
      timestamp: "36'",
      commentary: `GOAL! Brilliant buildup and ${h} takes the lead!`,
      homeGoals: 1,
      oppGoals: 0,
      homeShots: 3,
      oppShots: 2,
      homePossession: 60,
      type: "goal",
    },
    {
      timestamp: "45'",
      commentary: "Half time. A tense affair so far.",
      homeGoals: 1,
      oppGoals: 0,
      homeShots: 4,
      oppShots: 3,
      homePossession: 55,
      type: "general",
    },
    {
      timestamp: "55'",
      commentary: `VAR CHECK... Potential penalty for ${o}.`,
      homeGoals: 1,
      oppGoals: 0,
      homeShots: 4,
      oppShots: 4,
      homePossession: 52,
      type: "var",
    },
    {
      timestamp: "56'",
      commentary: `PENALTY GIVEN! And... SCORED! ${o} equalizes.`,
      homeGoals: 1,
      oppGoals: 1,
      homeShots: 4,
      oppShots: 5,
      homePossession: 50,
      type: "goal",
    },
    {
      timestamp: "70'",
      commentary: `Crunching tackle! Yellow card for ${h} defender.`,
      homeGoals: 1,
      oppGoals: 1,
      homeShots: 5,
      oppShots: 6,
      homePossession: 48,
      type: "card",
    },
    {
      timestamp: "82'",
      commentary: `${h} pouring forward, desperate for a winner.`,
      homeGoals: 1,
      oppGoals: 1,
      homeShots: 8,
      oppShots: 6,
      homePossession: 55,
      type: "chance",
    },
    {
      timestamp: "90+3'",
      commentary: `GOAL!!! UNBELIEVABLE! SCENES! ${h} wins it at the death!`,
      homeGoals: 2,
      oppGoals: 1,
      homeShots: 10,
      oppShots: 7,
      homePossession: 54,
      type: "goal",
    },
    {
      timestamp: "FT",
      commentary: "Full time! What a match!",
      homeGoals: 2,
      oppGoals: 1,
      homeShots: 10,
      oppShots: 7,
      homePossession: 54,
      type: "general",
    },
  ];
};

/* ------------------------------------------------------------------ *
 * Generators
 * ------------------------------------------------------------------ */

/** 40 headlines, generated once per session. */
export async function generateHeadlines(
  home: string,
  opp: string,
  match: string,
): Promise<string[]> {
  const h = home || "Home Team";
  const o = opp || "The Opponent";
  const m = match || "The Big Match";

  const parsed = await askForJson<string[]>(
    [
      {
        role: "system",
        content:
          "You are a sports-news headline generator. Return ONLY a valid JSON array of 40 short, punchy headline strings. No markdown, no explanation.",
      },
      {
        role: "user",
        content: `Generate 40 unique sports headlines for the match ${h} vs ${o} (${m}). Mix breaking news, fan outrage, tactical takes, weather warnings, injury news, and hype.`,
      },
    ],
    { response_format: { type: "json_object" } },
  );

  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return fallbackHeadlines(h, o, m);
}

/** 50 social posts for the hype feed. */
export async function generatePosts(home: string, opp: string, match: string): Promise<FeedPost[]> {
  const h = home || "Home";
  const o = opp || "Opponent";
  const m = match || "The Big Match";

  const parsed = await askForJson<FeedPost[]>(
    [
      {
        role: "system",
        content:
          'You are a social-media feed generator for sports fans. Return ONLY a valid JSON array of 50 objects with keys: user (string, username starting with @), title (string, short), content (string, 1-2 sentences), isTicketLink (boolean, true for ~15% of posts), reactions (number, 0-500), comments (number, 0-300), timeStr (string, "Just now"). No markdown, no explanation.',
      },
      {
        role: "user",
        content: `Generate 50 social media posts for ${h} vs ${o} (${m}). Include fan memes, hot takes, ticket portal links, anxiety, and hype.`,
      },
    ],
    { response_format: { type: "json_object" } },
  );

  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((post, index) => normalisePost(post, index));
  }
  return fallbackPosts(h, m);
}

/** 20–35 commentary events covering the whole match. */
export async function generateMatchEvents(home: string, opp: string): Promise<MatchEvent[]> {
  const h = home || "Home";
  const o = opp || "Opponent";

  const parsed = await askForJson<{ events?: MatchEvent[] }>(
    [
      {
        role: "system",
        content:
          'You are a football match-commentary generator. Return ONLY valid JSON in this exact shape: { events: array of { timestamp: string (e.g. "12\'", "HT", "FT", "ET1", "ET2", "PEN"), commentary: string (1-2 dramatic sentences), homeGoals: number, oppGoals: number, homeShots: number, oppShots: number, homePossession: number (0-100), type: one of general|chance|goal|card|var|sub } }. 20-35 events, 0-90+extra time/penalties if tied. 2-4 goals, natural ebb and flow. No markdown, no explanation.',
      },
      {
        role: "user",
        content: `Generate dramatic match commentary for ${h} vs ${o}. Include VAR, goals, cards, and tension.`,
      },
    ],
    { response_format: { type: "json_object" } },
  );

  const events = parsed?.events;
  if (Array.isArray(events) && events.length > 0) {
    return events.map((event) => ({ ...event, type: event.type || "general" }));
  }
  return fallbackCommentary(h, o);
}

/** 30 post-match reactions for the comedown feed. */
export async function generatePostMatchPosts(
  home: string,
  opp: string,
  match: string,
): Promise<FeedPost[]> {
  const h = home || "Home";
  const o = opp || "Opponent";
  const m = match || "The Big Match";

  const parsed = await askForJson<FeedPost[]>(
    [
      {
        role: "system",
        content:
          'You are a social-media post-match reaction generator. Return ONLY a valid JSON array of 30 objects with keys: user (string, username starting with @), title (string, short), content (string, 1-2 sentences), reactions (number, 0-5000), comments (number, 0-2000), timeStr (string, "Just now"). No markdown, no explanation.',
      },
      {
        role: "user",
        content: `Generate 30 post-match social media reactions for ${h} vs ${o} (${m}). Include memes, analysis, outrage, and celebration.`,
      },
    ],
    { response_format: { type: "json_object" } },
  );

  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((post, index) => ({ ...normalisePost(post, index), isTicketLink: false }));
  }

  return fallbackPosts(h, m).map((post) => ({
    ...post,
    title: "Post-Match Take",
    content: "Unbelievable match. I have no words.",
  }));
}
