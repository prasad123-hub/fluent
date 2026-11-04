import { SCENARIOS, THEMES } from "../../../prisma/seed-data";

/** Landing-page facts derived from the seed library so the numbers never drift. */
export const THEME_COUNT = THEMES.length;
export const SCENARIO_COUNT = SCENARIOS.length;
export const THEME_LIST = THEMES.map((t) => ({ id: t.id, title: t.title, icon: t.icon }));

export const SKILLS_TRACKED = 8;
export const LATENCY_LABEL = "<1.2s";

export const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does it understand Hinglish?",
    a: 'Yes. The coach knows you\'re an Indian English speaker. When you slip into Hindi ("ki", "matlab", "na") it keeps the conversation going, flags the switch in the live captions, and shows the English alternative in your report. Common Indian-English patterns like "prepone", "do the needful" or "revert back" are coached without judgement, and in Immersive mode nothing interrupts you at all.',
  },
  {
    q: "How long is a session?",
    a: "You choose: 5, 10, 15 or 20 minutes, or leave it open-ended. Most people do ten minutes a day. The scenario's character wraps up naturally when the time is reached, and the full analysis is ready about a minute after you end.",
  },
  {
    q: "Are my recordings stored? Who can hear them?",
    a: "Fluent is a single-owner app: your transcripts and scores live in your own database. Audio recording is off by default. When you switch it on, recordings go to your own S3-compatible bucket, are only ever played back inside your session report, and can be deleted from Settings at any time, along with everything else.",
  },
  {
    q: "Which providers does it use?",
    a: "Real-time audio runs on LiveKit. Speech-to-text uses Deepgram with word-level confidence, the coaching voice uses Cartesia (ElevenLabs and OpenAI voices are available too), and the conversation, analysis and scenario generation use OpenAI by default with Anthropic as an env-switchable alternative. You bring your own keys, so cost and data handling stay under your control.",
  },
  {
    q: "Does it work on phones?",
    a: "Yes. The practice page is designed for a phone in one hand: a tap-to-talk button, captions right under the orb, and the controls in a bottom bar. It works in Chrome and Safari on iOS and Android. Headphones help the coach hear only you.",
  },
];
