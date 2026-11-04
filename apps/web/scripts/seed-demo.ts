/**
 * `pnpm seed:demo` — creates realistic demo sessions (transcripts with word timings, events) over the past
 * three weeks, then runs the Python analysis worker (scripted judge, no API keys needed) so every dashboard
 * page has real data. Idempotent: demo sessions are tagged by id prefix and replaced on re-run.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_PREFIX = "demo_";

interface Turn {
  speaker: "human" | "agent";
  text: string;
  conf?: number;
}

const SCRIPTS: Record<string, Turn[]> = {
  "interview-hr-screening": [
    {
      speaker: "agent",
      text: "Hi, this is Meera from Zephyr Labs. Thanks for making time today. To start, could you tell me a little about yourself?",
    },
    {
      speaker: "human",
      text: "Sure. Um, myself Prasad. I am working in Infosys since three years as a backend developer, basically on the payments platform. Before that I did my B.Tech from VIT Vellore.",
    },
    { speaker: "agent", text: "Nice. And what makes you want to move now?" },
    {
      speaker: "human",
      text: "I want more ownership of the product, which is why Zephyr caught my eye. In my current team I only maintain services; I would like to design them also.",
    },
    {
      speaker: "agent",
      text: "That makes sense. Can you give me an example of a problem you solved recently?",
    },
    {
      speaker: "human",
      text: "Yes. Last quarter our settlement API was timing out during peak hours. I profiled the queries, added an index and a cache, and we reduced the p95 latency by forty percent. The client was very happy.",
    },
    {
      speaker: "agent",
      text: "Great result. What's your notice period, and are you open to Bengaluru?",
    },
    {
      speaker: "human",
      text: "My notice period is sixty days but it is negotiable. Bengaluru is fine for me. Could you tell me more about the team and what the next steps would be?",
    },
    {
      speaker: "agent",
      text: "Of course. The team is twelve engineers across two pods, and the next step is a technical round next week.",
    },
  ],
  "office-daily-standup": [
    {
      speaker: "agent",
      text: "Morning, everyone. Let's keep it quick today. Okay, you're up first. What did you do yesterday?",
    },
    {
      speaker: "human",
      text: "Yesterday I finished the login bug and I have started the export feature. Actually there is one blocker, the API from the data team is not ready till Thursday.",
    },
    { speaker: "agent", text: "Thanks. What's the plan for today?" },
    {
      speaker: "human",
      text: "Today I will write the unit tests for export and I will discuss with Ramesh about the API contract, so that we are not blocked next week.",
    },
    { speaker: "agent", text: "Good. Anything you need from me?" },
    {
      speaker: "human",
      text: "No, nothing for now. I will update in the evening if the data team delays further.",
    },
  ],
  "daily-restaurant-order": [
    {
      speaker: "agent",
      text: "Good evening, welcome! Table for one? Can I get you something to drink while you decide?",
    },
    {
      speaker: "human",
      text: "Good evening. Yes, one filter coffee please. And could you tell me, what would you recommend for a vegetarian?",
    },
    {
      speaker: "agent",
      text: "The masala dosa and the bisi bele bath are both popular. Would you like one of those?",
    },
    {
      speaker: "human",
      text: "I will take the masala dosa, but not too spicy please. And one plate of idli also, on the side.",
    },
    { speaker: "agent", text: "Certainly. Here you go. Enjoy your meal." },
    {
      speaker: "human",
      text: "Excuse me, sorry, but this dosa has gone cold. Could you heat it up or bring a fresh one?",
    },
    {
      speaker: "agent",
      text: "I'm so sorry about that. I'll bring a fresh one right away, and dessert is on the house.",
    },
    {
      speaker: "human",
      text: "Thank you, that's very kind. Could we have the bill after that, please? Does it include the service charge?",
    },
  ],
  "fluency-filler-elimination": [
    { speaker: "agent", text: "Round one. Tell me about your morning routine in thirty seconds." },
    {
      speaker: "human",
      text: "So basically I wake up at six, um, then I go for a run near the lake. Actually I like running because it clears my mind, you know.",
    },
    {
      speaker: "agent",
      text: "Score: six out of ten. I heard basically, um, actually and you know. Round two: describe your favourite festival.",
    },
    {
      speaker: "human",
      text: "My favourite festival is Ganeshotsav. The whole society decorates a pandal, we sing aarti in the evening and on the last day we take the idol to the sea.",
    },
    {
      speaker: "agent",
      text: "Score: nine out of ten. Clean and vivid. Round three: why should people learn to cook?",
    },
    {
      speaker: "human",
      text: "People should learn to cook because it is healthier, cheaper and honestly it is a creative skill. Also you can impress your friends.",
    },
  ],
  "debate-structured-motion": [
    {
      speaker: "agent",
      text: "The motion is: this house believes the IPL has been good for Indian cricket. You're proposing. Your opening statement, please.",
    },
    {
      speaker: "human",
      text: "Thank you. I strongly believe the IPL has been good for Indian cricket for three reasons. First, young players from small towns get a platform. Second, the money has improved infrastructure. Third, our players now handle pressure much better in T20 World Cups.",
    },
    { speaker: "agent", text: "But hasn't the IPL hurt Test cricket and player workloads?" },
    {
      speaker: "human",
      text: "I see your point, however the board now manages workload with rotation. And interest in Test cricket has actually increased because fans follow the same stars across formats.",
    },
    { speaker: "agent", text: "Your closing statement?" },
    {
      speaker: "human",
      text: "To conclude, the IPL has widened the talent pool, strengthened the economy of the game and made our players mentally tougher. Therefore the motion stands.",
    },
  ],
  "exam-ielts-speaking-part1": [
    {
      speaker: "agent",
      text: "Good morning. My name is Jonathan Reed. Could you tell me your full name, please?",
    },
    { speaker: "human", text: "My full name is Prasad Narkhedkar." },
    { speaker: "agent", text: "Thank you. Let's talk about work. What do you do?" },
    {
      speaker: "human",
      text: "I work as a software engineer at a fintech company in Pune. I mostly build the payment services and I have been doing this for about three years.",
    },
    { speaker: "agent", text: "Do you enjoy your job?" },
    {
      speaker: "human",
      text: "Mostly yes. I enjoy solving difficult problems, although the deadlines can be stressful sometimes. If I could change one thing, it would be fewer meetings.",
    },
    { speaker: "agent", text: "Let's move on to weekends. What do you usually do at the weekend?" },
    {
      speaker: "human",
      text: "At the weekend I usually go cycling early in the morning and then I meet friends for lunch. On Sundays I prefer to stay at home and read or watch cricket.",
    },
  ],
};

const WORD_MS = 330;
const FILLERS = new Set([
  "um",
  "uh",
  "basically",
  "actually",
  "like",
  "so",
  "only",
  "itself",
  "na",
  "means",
]);

function words(text: string, startMs: number, rnd: () => number) {
  const toks = text.split(/\s+/);
  let t = startMs;
  return toks.map((w) => {
    const dur = WORD_MS + Math.round(rnd() * 160);
    const clean = w.toLowerCase().replace(/[.,!?]/g, "");
    const conf =
      clean.match(/^(v|w|th)/) && rnd() < 0.35 ? 0.45 + rnd() * 0.2 : 0.82 + rnd() * 0.18;
    const out = {
      w,
      start: t,
      end: t + dur,
      conf: Math.round(conf * 100) / 100,
      filler: FILLERS.has(clean),
    };
    t += dur + (rnd() < 0.08 ? 900 + Math.round(rnd() * 1500) : 60);
    return out;
  });
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("Run `pnpm db:seed` first (no owner user).");
  await prisma.session.deleteMany({ where: { id: { startsWith: DEMO_PREFIX } } });

  const plan: Array<{
    scenarioId: string;
    daysAgo: number;
    mode: Prisma.SessionCreateInput["coachingMode"];
    difficulty: Prisma.SessionCreateInput["difficulty"];
  }> = [
    { scenarioId: "daily-restaurant-order", daysAgo: 20, mode: "gentle", difficulty: "B1" },
    { scenarioId: "office-daily-standup", daysAgo: 18, mode: "active", difficulty: "B1" },
    { scenarioId: "interview-hr-screening", daysAgo: 15, mode: "gentle", difficulty: "B1" },
    { scenarioId: "fluency-filler-elimination", daysAgo: 12, mode: "drill", difficulty: "B1" },
    { scenarioId: "debate-structured-motion", daysAgo: 9, mode: "immersive", difficulty: "B2" },
    { scenarioId: "exam-ielts-speaking-part1", daysAgo: 6, mode: "strict", difficulty: "B2" },
    { scenarioId: "interview-hr-screening", daysAgo: 3, mode: "active", difficulty: "B2" },
    { scenarioId: "office-daily-standup", daysAgo: 1, mode: "gentle", difficulty: "B2" },
  ];

  let created = 0;
  for (const [i, p] of plan.entries()) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: p.scenarioId },
      include: { theme: true },
    });
    const script = SCRIPTS[p.scenarioId];
    if (!scenario || !script) continue;
    const rnd = mulberry32(42 + i);
    const startedAt = new Date(Date.now() - p.daysAgo * 86_400_000 - (18 - i) * 3_600_000);
    const id = `${DEMO_PREFIX}${String(i + 1).padStart(2, "0")}_${p.scenarioId.slice(0, 20)}`;
    let t = 1200;
    const utterances: Prisma.UtteranceCreateManyInput[] = [];
    const events: Prisma.SessionEventCreateManyInput[] = [];
    script.forEach((turn, seq) => {
      const ws = turn.speaker === "human" ? words(turn.text, t, rnd) : null;
      const end = ws ? (ws[ws.length - 1]?.end ?? t) : t + turn.text.split(/\s+/).length * 300;
      utterances.push({
        sessionId: id,
        seq: seq + 1,
        speaker: turn.speaker,
        text: turn.text,
        startMs: t,
        endMs: end,
        words: ws ? (ws as unknown as Prisma.InputJsonValue) : undefined,
        confidence: ws
          ? Math.round((ws.reduce((a, w) => a + w.conf, 0) / ws.length) * 100) / 100
          : null,
        fillerCount: ws ? ws.filter((w) => w.filler).length : 0,
        metrics:
          turn.speaker === "agent"
            ? {
                llm_node_ttft: 380 + Math.round(rnd() * 300),
                tts_node_ttfb: 150 + Math.round(rnd() * 200),
                e2e_latency: 700 + Math.round(rnd() * 500),
              }
            : undefined,
      });
      if (turn.speaker === "agent") {
        events.push({
          sessionId: id,
          type: "latency",
          atMs: t,
          payload: {
            turn: seq + 1,
            llm_node_ttft: 420,
            tts_node_ttfb: 190,
            e2e_latency: 850 + Math.round(rnd() * 400),
          },
        });
      }
      if (/since three years|myself Prasad/i.test(turn.text)) {
        events.push({
          sessionId: id,
          type: "correction",
          atMs: end,
          payload: {
            original: "since three years",
            corrected: "for three years",
            category: "tense",
            explanation: "Use 'for' with a duration.",
          },
        });
      }
      t = end + 900 + Math.round(rnd() * 1800);
    });
    if (p.mode !== "strict")
      events.push({
        sessionId: id,
        type: "hint",
        atMs: 30_000,
        payload: {
          phrase: scenario.usefulPhrases ? (scenario.usefulPhrases as string[])[0] : "",
          requested: true,
        },
      });
    const durationSec = Math.round(t / 1000) + 40;
    await prisma.session.create({
      data: {
        id,
        userId: user.id,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        themeSlug: scenario.theme.slug,
        difficulty: p.difficulty,
        coachingMode: p.mode,
        agentVoice: "priya",
        durationMin: 10,
        status: "analyzing",
        livekitRoomName: `demo-${id}`,
        startedAt,
        endedAt: new Date(startedAt.getTime() + durationSec * 1000),
        durationSec,
        endReason: "user_ended",
        analysisStartedAt: new Date(),
        createdAt: startedAt,
        utterances: { createMany: { data: utterances.map(({ sessionId: _s, ...u }) => u) } },
        events: { createMany: { data: events.map(({ sessionId: _s, ...e }) => e) } },
      },
    });
    created++;
  }
  console.log(`Created ${created} demo sessions. Running analysis (scripted judge)…`);

  const agentDir = path.resolve(__dirname, "../../agent");
  const res = spawnSync("uv", ["run", "analysis-worker", "--once"], {
    cwd: agentDir,
    stdio: "inherit",
    env: {
      ...process.env,
      FLUENT_FAKE_LLM: process.env.OPENAI_API_KEY ? (process.env.FLUENT_FAKE_LLM ?? "0") : "1",
    },
  });
  if (res.status !== 0)
    console.warn(
      "Analysis worker exited with",
      res.status,
      "— run `cd apps/agent && uv run analysis-worker --once` manually.",
    );

  const done = await prisma.session.count({
    where: { id: { startsWith: DEMO_PREFIX }, status: "complete" },
  });
  console.log(`Demo sessions analysed: ${done}/${created}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
