import { DIFFICULTIES, type DifficultyLevel } from "@fluent/shared";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { scenarioSchema, type ScenarioInput } from "@/lib/schemas";

/**
 * Generates a full Scenario from a plain-English situation.
 * Provider order: OpenAI (JSON-schema structured output) → Anthropic (tool use) → deterministic template.
 * Every path ends in `scenarioSchema` validation, so callers always get a valid object.
 */

export const PROMPT_RULES =
  "Speak only English. Keep each turn under 45 words unless you are explaining something the learner asked for. Ask one question at a time. Stay natural and warm; never lecture.";

export interface GenerateScenarioInput {
  prompt: string;
  difficulty: DifficultyLevel;
  learnerName?: string;
}

export type GeneratorSource = "openai" | "anthropic" | "template";

export interface GeneratedScenario {
  scenario: ScenarioInput;
  source: GeneratorSource;
}

const MODES = ["roleplay", "discussion", "interview", "drill", "free_talk"] as const;
type Mode = (typeof MODES)[number];

/** Fields the model fills in. id / themeId / tags are stamped by us afterwards. */
type DraftScenario = Omit<ScenarioInput, "id" | "themeId" | "tags" | "characters">;

// ───────────────────────────── JSON schema (shared by both providers) ─────────────────────────────

const stringList = (minItems: number, maxItems: number, description: string) => ({
  type: "array",
  description,
  items: { type: "string" },
  minItems,
  maxItems,
});

const DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short, specific title (max 60 characters)." },
    description: {
      type: "string",
      description:
        "Two sentences, second person, describing the situation and what the learner must do.",
    },
    difficulty: { type: "string", enum: [...DIFFICULTIES] },
    mode: { type: "string", enum: [...MODES] },
    agentPersona: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Full name of the character the coach plays." },
        role: {
          type: "string",
          description: "Who they are relative to the learner, e.g. 'your CEO, Meera Nair'.",
        },
        personality: { type: "string", description: "Three or four comma-separated traits." },
        accent: {
          type: "string",
          description: "Accent hint for the voice, e.g. 'Indian English' or 'neutral'.",
        },
      },
      required: ["name", "role", "personality", "accent"],
    },
    agentOpeningLine: {
      type: "string",
      description: "The first thing the character says, in character, under 35 words.",
    },
    learnerGoal: { type: "string", description: "One sentence: what the learner must achieve." },
    successCriteria: stringList(4, 5, "Observable things the learner should do."),
    keyVocabulary: stringList(8, 10, "Words or short collocations worth using."),
    usefulPhrases: stringList(5, 6, "Full sentences the learner can borrow."),
    commonMistakesToWatch: stringList(
      4,
      5,
      "Typical Indian-English slips for this situation, formatted 'wrong (→ right)'.",
    ),
    suggestedDurationMin: { type: "integer", minimum: 4, maximum: 20 },
    systemPromptTemplate: {
      type: "string",
      description:
        "Instructions for the coach. Start with 'You are {{persona.name}}, {{persona.role}}.' Refer to the learner as {{learner.name}}. Describe the scene, how to run the conversation and when to end it. End with the exact rules sentence provided.",
    },
  },
  required: [
    "title",
    "description",
    "difficulty",
    "mode",
    "agentPersona",
    "agentOpeningLine",
    "learnerGoal",
    "successCriteria",
    "keyVocabulary",
    "usefulPhrases",
    "commonMistakesToWatch",
    "suggestedDurationMin",
    "systemPromptTemplate",
  ],
} as const;

function systemPrompt(difficulty: DifficultyLevel) {
  return [
    "You design spoken-English practice scenarios for Fluent, a voice coaching app for Indian English speakers.",
    "Turn the learner's situation into one realistic, specific scenario. Use believable Indian names, companies and places without stereotypes.",
    `Target CEFR level ${difficulty}: ${LEVEL_HINT[difficulty]}`,
    "The coach is a single voice agent playing one character; write the systemPromptTemplate for that agent.",
    `The systemPromptTemplate must end with this exact sentence: "${PROMPT_RULES}"`,
    "Return only the structured object.",
  ].join("\n");
}

const LEVEL_HINT: Record<DifficultyLevel, string> = {
  A2: "simple, everyday language; short exchanges; the character is patient and slow.",
  B1: "clear everyday language with some workplace vocabulary; natural pace.",
  B2: "confident, nuanced language; the character pushes back and asks follow-ups.",
  C1: "precise, idiomatic language; the character is demanding and fast-paced.",
};

function userPrompt(input: GenerateScenarioInput) {
  const name = input.learnerName ? ` The learner's name is ${input.learnerName}.` : "";
  return `Situation: ${input.prompt.trim()}\nDifficulty: ${input.difficulty}.${name}`;
}

// ───────────────────────────── Providers ─────────────────────────────

async function viaOpenAI(input: GenerateScenarioInput, apiKey: string): Promise<DraftScenario> {
  const model = env.FLUENT_LLM_PROVIDER === "openai" ? env.FLUENT_LLM_MODEL : "gpt-4.1";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt(input.difficulty) },
        { role: "user", content: userPrompt(input) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "fluent_scenario", strict: true, schema: DRAFT_JSON_SCHEMA },
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok)
    throw new Error(`OpenAI responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
  };
  const message = body.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  if (!message?.content) throw new Error("OpenAI returned no content");
  return JSON.parse(message.content) as DraftScenario;
}

async function viaAnthropic(input: GenerateScenarioInput, apiKey: string): Promise<DraftScenario> {
  const model =
    env.FLUENT_LLM_PROVIDER === "anthropic" && env.FLUENT_LLM_MODEL.startsWith("claude")
      ? env.FLUENT_LLM_MODEL
      : "claude-sonnet-4-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt(input.difficulty),
      messages: [{ role: "user", content: userPrompt(input) }],
      tools: [
        {
          name: "create_scenario",
          description: "Save the generated practice scenario.",
          input_schema: DRAFT_JSON_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "create_scenario" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok)
    throw new Error(`Anthropic responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as {
    content?: Array<{ type: string; name?: string; input?: unknown }>;
  };
  const tool = body.content?.find((c) => c.type === "tool_use" && c.name === "create_scenario");
  if (!tool?.input) throw new Error("Anthropic returned no tool call");
  return tool.input as DraftScenario;
}

// ───────────────────────────── Deterministic template ─────────────────────────────

const PERSONAS = [
  { name: "Meera Nair", accent: "Indian English" },
  { name: "Arjun Mehta", accent: "Indian English" },
  { name: "Kavya Iyer", accent: "Indian English" },
  { name: "Rahul Bansal", accent: "Indian English" },
  { name: "Sneha Kulkarni", accent: "Indian English" },
  { name: "Vikram Reddy", accent: "Indian English" },
  { name: "Emily Carter", accent: "neutral" },
  { name: "Daniel Okafor", accent: "neutral" },
] as const;

interface RoleHint {
  pattern: RegExp;
  role: string;
  personality: string;
  mode: Mode;
  setting: string;
  /** First line, in character. `{name}` is replaced with the persona's first name. */
  opening: string;
  vocabulary: string[];
  phrases: string[];
}

const ROLE_HINTS: RoleHint[] = [
  {
    pattern:
      /\b(store|shop|showroom|return|refund|replacement|warranty|customer (care|support|service)|helpline|complaint)\b/i,
    role: "the customer-service executive handling your request",
    personality: "polite, procedural, a little hurried, helpful once you are clear and firm",
    mode: "roleplay",
    setting: "a customer-service conversation",
    opening:
      "Hi, welcome. I'm {name} from the service desk. How can I help you today? Do you have the bill or order number with you?",
    vocabulary: ["receipt", "warranty", "replacement", "refund", "escalate", "reference number"],
    phrases: [
      "I bought this last month and it stopped working within a week.",
      "I'd like a replacement rather than a repair, please.",
      "Could I have a reference number for this complaint?",
    ],
  },
  {
    pattern: /\b(hotel|airport|immigration|flight|visa|check[- ]?in|luggage|baggage|embassy)\b/i,
    role: "the officer at the counter",
    personality: "formal, efficient, asks direct questions, polite when you are clear",
    mode: "roleplay",
    setting: "a conversation at a counter while travelling",
    opening:
      "Good afternoon. Passport and documents, please. What's the purpose of your visit, and how long are you staying?",
    vocabulary: ["itinerary", "booking reference", "purpose of visit", "duration", "confirmation"],
    phrases: [
      "I'm here for a two-week work assignment with our Dublin office.",
      "My booking reference is on this email.",
      "Could you tell me where I should go next?",
    ],
  },
  {
    pattern: /\b(ceo|founder|director|vp|head of|senior leader|leadership)\b/i,
    role: "the CEO of your company",
    personality: "sharp, warm, time-pressed, genuinely curious about people",
    mode: "roleplay",
    setting: "a short, informal conversation with a senior leader",
    opening:
      "Hi, I'm {name}. I don't think we've met properly yet. Which team are you on, and how's the offsite treating you so far?",
    vocabulary: ["impact", "ownership", "priorities", "roadmap", "take the lead on"],
    phrases: [
      "It's great to finally meet you in person.",
      "I've been leading the payments integration for the last two quarters.",
      "One thing I'd love your perspective on is…",
    ],
  },
  {
    pattern: /\b(interview|interviewer|hiring|recruiter|hr round|placement)\b/i,
    role: "the hiring manager interviewing you",
    personality: "professional, probing, encouraging, listens closely",
    mode: "interview",
    setting: "a job interview",
    opening:
      "Thanks for joining, I'm {name}. Let's start simple: tell me a little about yourself and what you're working on right now.",
    vocabulary: ["strengths", "achievement", "responsibility", "challenge", "outcome"],
    phrases: [
      "Thank you for having me. I'm a backend engineer with four years of experience.",
      "The biggest challenge in that project was…",
      "Could I ask what the team's main priority is this year?",
    ],
  },
  {
    pattern: /\b(manager|boss|team lead|reporting manager|supervisor)\b/i,
    role: "your reporting manager",
    personality: "fair, direct, busy, appreciates clarity",
    mode: "roleplay",
    setting: "a one-to-one conversation with your manager",
    opening:
      "Hey, come in. I've got about ten minutes before my next call. What did you want to talk about?",
    vocabulary: ["deadline", "bandwidth", "blocker", "deliverable", "heads-up"],
    phrases: [
      "I wanted to give you a heads-up about…",
      "Here's where we are and what I need from you.",
      "Would it be possible to…?",
    ],
  },
  {
    pattern: /\b(client|customer|stakeholder|vendor|supplier)\b/i,
    role: "a client you work with",
    personality: "polite but demanding, expects straight answers, respects honesty",
    mode: "roleplay",
    setting: "a professional conversation with a client",
    opening:
      "Hi, {name} here. I'll be honest, I was expecting an update yesterday. Where do things stand?",
    vocabulary: ["timeline", "scope", "expectations", "follow up", "resolve"],
    phrases: [
      "I completely understand the concern, and here's what we're doing about it.",
      "Let me walk you through the timeline.",
      "I'll follow up by email with the details.",
    ],
  },
  {
    pattern: /\b(landlord|rent|flat owner|broker)\b/i,
    role: "your landlord",
    personality: "practical, slightly stubborn, softens when treated respectfully",
    mode: "roleplay",
    setting: "a negotiation about your flat",
    opening: "Hello, hello. You wanted to talk about the flat? Tell me, what's the issue?",
    vocabulary: ["deposit", "maintenance", "agreement", "reasonable", "compromise"],
    phrases: [
      "I've been a reliable tenant for two years, so I was hoping we could discuss…",
      "Would you consider…?",
      "That works for me if we can agree on…",
    ],
  },
  {
    pattern: /\b(doctor|clinic|hospital|dentist|pharmacist)\b/i,
    role: "the doctor seeing you",
    personality: "calm, precise, kind, asks clarifying questions",
    mode: "roleplay",
    setting: "a medical appointment",
    opening: "Good morning, please have a seat. I'm Dr. {name}. What brings you in today?",
    vocabulary: ["symptoms", "since when", "prescription", "dosage", "side effects"],
    phrases: [
      "I've had this for about a week now.",
      "It gets worse when…",
      "Should I avoid anything while taking this?",
    ],
  },
  {
    pattern: /\b(friend|flatmate|roommate|cousin|neighbour|neighbor|colleague|coworker)\b/i,
    role: "a close friend",
    personality: "easygoing, funny, honest, asks follow-up questions",
    mode: "roleplay",
    setting: "a casual conversation",
    opening: "Hey! Finally. I feel like we haven't caught up in ages. So, what's going on?",
    vocabulary: ["catch up", "honestly", "plan", "the thing is", "what do you think"],
    phrases: [
      "Honestly, I've been meaning to tell you about this.",
      "What would you do in my place?",
      "Let's figure it out together.",
    ],
  },
  {
    pattern: /\b(debate|discussion|argue|opinion|group discussion|gd)\b/i,
    role: "the moderator of a group discussion",
    personality: "neutral, crisp, keeps time, challenges weak arguments",
    mode: "discussion",
    setting: "a structured discussion",
    opening:
      "Welcome, everyone. I'm {name}, your moderator. We have ten minutes on today's topic. Who'd like to open?",
    vocabulary: ["I'd argue that", "on the other hand", "evidence", "trade-off", "to sum up"],
    phrases: [
      "I'd like to build on that point.",
      "I see it differently, and here's why.",
      "To sum up my position…",
    ],
  },
  {
    pattern: /\b(present|presentation|pitch|demo|speech|talk)\b/i,
    role: "a senior audience member",
    personality: "attentive, asks sharp follow-up questions, appreciates structure",
    mode: "discussion",
    setting: "a short presentation followed by questions",
    opening:
      "Thanks for coming in. I'm {name}. We've got a short slot, so whenever you're ready, take it away.",
    vocabulary: ["key takeaway", "in summary", "the data shows", "next steps", "to recap"],
    phrases: [
      "Today I'll cover three things.",
      "The key takeaway here is…",
      "Happy to take questions on that.",
    ],
  },
];

const DEFAULT_HINT: RoleHint = {
  pattern: /./,
  role: "the person you are speaking with in this situation",
  personality: "friendly, curious, natural, gently keeps the conversation moving",
  mode: "roleplay",
  setting: "a realistic conversation",
  opening:
    "Hi, I'm {name}. Good to meet you. So, tell me a little about what brings you here today?",
  vocabulary: ["actually", "to be honest", "could you", "I'd like to", "that makes sense"],
  phrases: [
    "Could you give me a moment to explain?",
    "What I mean is…",
    "That makes sense. Let me think about it.",
  ],
};

const MISTAKES_BY_LEVEL: Record<DifficultyLevel, string[]> = {
  A2: [
    "Myself Prasad (→ I'm Prasad)",
    "I am having a doubt (→ I have a question)",
    "He is not knowing (→ He doesn't know)",
    "Yesterday I go (→ Yesterday I went)",
  ],
  B1: [
    "I am working here since 2021 (→ I have been working here since 2021)",
    "Please do the needful (→ Could you take care of this?)",
    "Discuss about the plan (→ discuss the plan)",
    "I didn't went (→ I didn't go)",
  ],
  B2: [
    "Revert back to you (→ get back to you)",
    "One of my colleague (→ one of my colleagues)",
    "Prepone the meeting (→ move the meeting earlier)",
    "Can you able to join? (→ Are you able to join?)",
  ],
  C1: [
    "Kindly do the needful (→ Could you please handle this?)",
    "Out of station (→ out of town / travelling)",
    "Good name? (→ May I have your name?)",
    "We'll discuss on it (→ We'll discuss it)",
  ],
};

const DURATION_BY_LEVEL: Record<DifficultyLevel, number> = { A2: 6, B1: 8, B2: 10, C1: 12 };

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sentenceCase(text: string) {
  const t = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function titleFrom(prompt: string) {
  const t = sentenceCase(prompt).replace(/^(i am|i'm|i want to|i need to|i have to)\s+/i, "");
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return capped.length <= 60 ? capped : `${capped.slice(0, 57).trimEnd()}…`;
}

function keywords(prompt: string) {
  const stop = new Set(
    "i im i'm a an the my me to for at in on of with and or is are am be was were it this that first time about want need have has meeting meet".split(
      " ",
    ),
  );
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stop.has(w)),
    ),
  );
}

export function templateScenario(input: GenerateScenarioInput): DraftScenario {
  const prompt = sentenceCase(input.prompt);
  const hint = ROLE_HINTS.find((h) => h.pattern.test(prompt)) ?? DEFAULT_HINT;
  const persona = PERSONAS[hash(prompt) % PERSONAS.length] ?? PERSONAS[0];
  const words = keywords(prompt);
  const topic = words.slice(0, 3).join(", ") || "the situation";
  const vocabulary = Array.from(
    new Set([...hint.vocabulary, ...words.slice(0, 4), "to be honest", "let me explain"]),
  ).slice(0, 9);

  return {
    title: titleFrom(prompt),
    description: `${prompt}. Handle ${hint.setting} with confidence: say what you mean clearly, listen, and respond naturally when the conversation changes direction.`,
    difficulty: input.difficulty,
    mode: hint.mode,
    agentPersona: {
      name: persona.name,
      role: hint.role,
      personality: hint.personality,
      accent: persona.accent,
    },
    agentOpeningLine: hint.opening.replace("{name}", persona.name.split(" ")[0] ?? persona.name),
    learnerGoal: `Your situation: ${prompt}. Make your point clearly, ask at least one good question, and close the conversation politely with a next step.`,
    successCriteria: [
      "Opens the conversation confidently and sets the context in one or two sentences",
      `Explains their side of the situation (${topic}) with specific details`,
      "Asks at least two relevant questions and responds to the answers",
      "Closes the conversation politely with a clear next step",
    ],
    keyVocabulary: vocabulary,
    usefulPhrases: [
      ...hint.phrases,
      "Just to make sure I understood you correctly…",
      "Thanks for your time. Shall we take it from there?",
    ].slice(0, 5),
    commonMistakesToWatch: MISTAKES_BY_LEVEL[input.difficulty],
    suggestedDurationMin: DURATION_BY_LEVEL[input.difficulty],
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. The learner, {{learner.name}}, is in this situation: ${prompt}. Play ${hint.setting} realistically: react to what they say, ask natural follow-up questions, and introduce one small complication midway so they have to adapt. Wrap up on your own once the goal is reached or after about {{duration}} minutes. ${PROMPT_RULES}`,
  };
}

// ───────────────────────────── Orchestration ─────────────────────────────

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "scenario"
  );
}

function finalize(draft: DraftScenario, input: GenerateScenarioInput): ScenarioInput {
  const template = draft.systemPromptTemplate?.trim() ?? "";
  const random = Math.random().toString(36).slice(2, 8);
  const candidate = {
    ...draft,
    id: `custom-${slugify(draft.title ?? input.prompt)}-${random}`,
    themeId: "custom",
    difficulty: input.difficulty,
    suggestedDurationMin: Math.round(Number(draft.suggestedDurationMin)),
    systemPromptTemplate: template.includes("Speak only English")
      ? template
      : `${template} ${PROMPT_RULES}`.trim(),
    tags: ["custom"],
  };
  return scenarioSchema.parse(candidate);
}

export async function generateScenario(input: GenerateScenarioInput): Promise<GeneratedScenario> {
  const attempts: Array<{ source: GeneratorSource; run: () => Promise<DraftScenario> }> = [];
  const openai = env.OPENAI_API_KEY;
  const anthropic = env.ANTHROPIC_API_KEY;
  if (env.FLUENT_LLM_PROVIDER === "anthropic" && anthropic)
    attempts.push({ source: "anthropic", run: () => viaAnthropic(input, anthropic) });
  if (openai) attempts.push({ source: "openai", run: () => viaOpenAI(input, openai) });
  if (anthropic && !attempts.some((a) => a.source === "anthropic"))
    attempts.push({ source: "anthropic", run: () => viaAnthropic(input, anthropic) });

  for (const attempt of attempts) {
    try {
      const draft = await attempt.run();
      return { scenario: finalize(draft, input), source: attempt.source };
    } catch (err) {
      logger.warn({ err, source: attempt.source }, "scenario generation failed; trying next");
    }
  }
  return { scenario: finalize(templateScenario(input), input), source: "template" };
}
