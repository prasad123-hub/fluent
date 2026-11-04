import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const SOCIAL: SeedScenario[] = [
  {
    id: "social-tech-conference",
    title: "Meeting someone at a tech conference",
    description:
      "It's the coffee break at DevSummit Bengaluru. The person next to you just gave a talk on observability. Start a conversation, find common ground and exchange contacts.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Ananya Iyer",
      role: "senior engineer at Zentrix Labs who just gave a talk on observability",
      personality:
        "friendly, a little drained after her talk, enjoys genuine questions, dislikes being pitched to",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Phew, finally coffee. Hi, I'm Ananya. Were you in the observability session, or did you escape to the chai stall like everyone else?",
    learnerGoal:
      "Open a conversation naturally, ask about her talk and work, share what you do, find something in common and agree on a way to stay in touch.",
    successCriteria: [
      "Opens with a comment or question about the talk or the event rather than a job title",
      "Asks at least three follow-up questions about her work",
      "Describes their own work in two or three concrete sentences",
      "Proposes a specific way to stay in touch (LinkedIn, a meetup, sharing a link)",
    ],
    keyVocabulary: [
      "I really enjoyed your talk",
      "what stood out",
      "I work on",
      "we're dealing with",
      "same here",
      "by the way",
      "that reminds me",
      "connect on LinkedIn",
      "keep in touch",
      "catch you later",
    ],
    usefulPhrases: [
      "I really enjoyed your talk, especially the part about alert fatigue.",
      "What stood out for me was the example with the payment service.",
      "I work on the backend for a logistics app, so we're dealing with the same noisy-alerts problem.",
      "By the way, are you going to the panel after lunch?",
      "Shall we connect on LinkedIn? I'd love to hear how the migration goes.",
    ],
    commonMistakesToWatch: [
      "Myself Prasad, from Infomatrix (→ I'm Prasad; I work at Infomatrix)",
      "What is your good name? (→ Sorry, I didn't catch your name)",
      "I liked your talk very much nice (→ I really liked your talk)",
      "Asking 'What is your package?' or other overly personal questions",
    ],
    suggestedDurationMin: 7,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}, at the DevSummit coffee break in Bengaluru. Your talk was about reducing alert noise with better SLOs; your team is migrating from a legacy monitoring stack to OpenTelemetry. Chat with {{learner.name}}: ask what they work on and what brought them to the conference. Share small details (you're from Coimbatore, you run on Sundays at Cubbon Park, you're nervous about the panel after lunch). If they only talk about themselves or try to sell something, grow cooler; if they ask real questions, open up and suggest staying in touch. ${PROMPT_RULES}`,
    tags: ["networking", "popular"],
  },
  {
    id: "social-networking-dinner-intro",
    title: "'So, what do you do?' at a networking dinner",
    description:
      "You're seated next to a senior consultant at a chamber-of-commerce dinner in Mumbai. Give a crisp professional introduction, hold a two-way conversation and leave a good impression.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Nikhil Bhatia",
      role: "partner at a strategy consulting firm, seated next to you at the dinner",
      personality:
        "polished, curious, slightly testing, asks pointed follow-ups, respects clarity and specifics",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Evening. Nikhil Bhatia. Looks like we're table neighbours for the next two hours. So, what do you do?",
    learnerGoal:
      "Introduce yourself in under 30 seconds with role, company, the problem you solve and something memorable, then keep the conversation balanced.",
    successCriteria: [
      "Gives a 20–30 second introduction with role, company, the problem they solve and one concrete example or number",
      "Asks the other person at least three questions about his work or views",
      "Handles a pointed question (e.g. 'What makes you different?') with a specific answer",
      "Closes with a specific follow-up (sharing a case study, coffee, an introduction)",
    ],
    keyVocabulary: [
      "I lead",
      "I'm responsible for",
      "we help companies",
      "in a nutshell",
      "what sets us apart",
      "I'd be curious",
      "that's interesting because",
      "one thing I've noticed",
      "let's grab coffee",
      "I'll send you",
    ],
    usefulPhrases: [
      "In a nutshell, I lead product at a fintech that helps kirana stores get working-capital loans in under 48 hours.",
      "We've onboarded about 12,000 shops in Maharashtra in the last year.",
      "What sets us apart is that we underwrite using UPI transaction data rather than paperwork.",
      "I'd be curious how your clients think about lending to small retailers.",
      "Let's grab coffee next week; I'll send you a short case study beforehand.",
    ],
    commonMistakesToWatch: [
      "I am working as a manager in a company (→ I lead the product team at KiranaPay)",
      "I am doing job in Mumbai (→ I work in Mumbai)",
      "We are into the business of lending (→ We're a lending company / We lend to…)",
      "Reciting a job title and stopping, instead of saying what problem you solve",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}} at a chamber-of-commerce dinner in Mumbai. You advise consumer companies on growth and are quietly looking for interesting fintech and retail contacts. Ask {{learner.name}} what they do, then probe: 'Who's your customer?', 'What makes you different?', 'What's the hardest part right now?'. Share a little about yourself (you spent three years in Singapore, you're sceptical of hype). Reward specifics with warmth and an offer to introduce them to someone; respond to vague answers with polite but probing follow-ups. Keep the conversation two-way. ${PROMPT_RULES}`,
    tags: ["networking", "work"],
  },
  {
    id: "social-follow-up-call",
    title: "Following up after an event by phone",
    description:
      "You met a product manager at a Pune meetup last week and promised to call about a possible collaboration. She's busy and only half remembers you. Make the call count.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Meera Krishnan",
      role: "product manager at a health-tech startup, whom you met at the ProductTank meetup",
      personality:
        "busy, polite, a bit distracted at first, remembers you properly once you give context, appreciates brevity",
      accent: "Indian English",
    },
    agentOpeningLine: "Hello, Meera speaking. Sorry, who is this? I'm just between meetings.",
    learnerGoal:
      "Remind her who you are and what you discussed, state the reason for your call in one sentence, respect her time and agree on a concrete next step.",
    successCriteria: [
      "Reminds her of the context (where, when, what you talked about) in the first 15 seconds",
      "States the purpose of the call in one clear sentence",
      "Checks whether it's a good time and offers to call back if not",
      "Agrees a specific next step with a day and time, and confirms it",
    ],
    keyVocabulary: [
      "we met at",
      "you might remember",
      "the reason I'm calling",
      "is this a good time",
      "I won't keep you long",
      "I was wondering if",
      "would you be open to",
      "does Tuesday work",
      "I'll send a calendar invite",
      "speak soon",
    ],
    usefulPhrases: [
      "Hi Meera, this is Rutuja; we met at the ProductTank meetup last Thursday and talked about onboarding flows.",
      "I won't keep you long; is this a good time, or should I call back?",
      "The reason I'm calling is that my team is redesigning our onboarding, and you offered to share how you did it.",
      "Would you be open to a 30-minute call next week?",
      "Great, Tuesday at 4 then. I'll send a calendar invite right after this.",
    ],
    commonMistakesToWatch: [
      "Myself Rutuja, we had met in the meetup (→ This is Rutuja; we met at the meetup)",
      "I am calling you regarding the same (→ I'm calling about the onboarding discussion)",
      "Can we do a meeting? (→ Could we set up a meeting?)",
      "Starting with a long story instead of the reason for the call",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}} in Pune. Last Thursday at the meetup you chatted briefly with {{learner.name}} about onboarding flows and said 'call me sometime'. You meet many people, so at first you do not remember; once they give context (the meetup, the onboarding conversation, your joke about Baner traffic), you remember warmly. You have five minutes now. If they are concise and clear, agree to a 30-minute call next week and make them propose a time; if they ramble, say you need to go and ask them to email instead. ${PROMPT_RULES}`,
    tags: ["phone", "networking"],
  },
  {
    id: "social-refuse-politely",
    title: "Saying no to a colleague without damaging the relationship",
    description:
      "A friendly colleague asks you to cover his on-call weekend and also invites you to his housewarming on Sunday. You can't do either. Refuse politely but clearly.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Karan Malhotra",
      role: "a colleague on your team you get along well with",
      personality:
        "charming, persistent, uses humour and a little guilt, backs off gracefully when the refusal is clear and kind",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Hey, two things, and you're going to say yes to both. One, can you take my on-call this weekend? Two, housewarming at my place on Sunday, you have to come.",
    learnerGoal:
      "Decline both requests honestly, give a brief reason without over-explaining, offer an alternative where possible and keep the tone warm.",
    successCriteria: [
      "Refuses clearly (no 'maybe' or 'I'll try') for at least one request",
      "Gives a short, honest reason without a long justification",
      "Offers an alternative or partial help (another weekend, a different time, suggesting someone else)",
      "Holds the refusal politely when the colleague pushes a second time",
    ],
    keyVocabulary: [
      "I'm afraid I can't",
      "I wish I could",
      "that's not going to work for me",
      "I've already committed to",
      "what I can do is",
      "I appreciate you asking",
      "no hard feelings",
      "another time",
      "rain check",
      "I hope that's okay",
    ],
    usefulPhrases: [
      "I wish I could, but I've already committed to my cousin's wedding in Nagpur this weekend.",
      "I'm afraid the on-call isn't going to work for me; I'm out of town from Friday.",
      "What I can do is take your on-call the weekend after, if that helps.",
      "I appreciate you asking, and I'm genuinely sorry to miss the housewarming.",
      "Can I take a rain check and come see the new place the following week?",
    ],
    commonMistakesToWatch: [
      "I will try to come (when you mean no) (→ I won't be able to come)",
      "Sorry, I am having some work (→ Sorry, I have another commitment)",
      "I didn't knew about the housewarming (→ I didn't know about the housewarming)",
      "Giving five excuses when one honest reason is enough",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. You need someone to cover your on-call this Saturday and Sunday because you're moving flats, and you're hosting a housewarming on Sunday evening in Wakad. Ask {{learner.name}} for both. When they refuse, push back twice with humour and mild guilt ('I covered yours during Diwali!', 'Just come for an hour, yaar'). If their refusal is clear, kind, and includes a reason or an alternative, accept it gracefully and stay friendly. If it is vague ('I'll try', 'maybe'), treat it as a yes and keep planning around them. ${PROMPT_RULES}`,
    tags: ["work", "assertiveness"],
  },
  {
    id: "social-apologise-missed-engagement",
    title: "Apologising for missing a friend's engagement party",
    description:
      "You missed your close friend's engagement party in Nagpur last Saturday because of a production outage, and you didn't even call. She's hurt. Call her and make it right.",
    difficulty: "A2",
    mode: "roleplay",
    agentPersona: {
      name: "Shreya Joshi",
      role: "your close friend since school, recently engaged",
      personality:
        "warm but hurt, a little cold at first, forgives when the apology is sincere and specific, dislikes excuses",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Oh, so you remember my number. I was waiting for you all evening on Saturday. Everyone kept asking where you were.",
    learnerGoal:
      "Apologise sincerely, explain briefly without making excuses, show you understand how she felt, and offer a concrete way to make it up.",
    successCriteria: [
      "Apologises directly in the first two sentences (not 'sorry if…')",
      "Explains briefly what happened without blaming others",
      "Acknowledges how she felt and that not calling made it worse",
      "Offers a specific way to make up (visiting, helping with the wedding, taking her out) and confirms a date",
    ],
    keyVocabulary: [
      "I'm so sorry",
      "there's no excuse",
      "I should have called",
      "I let you down",
      "I understand if you're upset",
      "I feel terrible",
      "make it up to you",
      "I promise",
      "mean a lot",
      "forgive me",
    ],
    usefulPhrases: [
      "Shreya, I'm so sorry. I missed your engagement and I should have called that night.",
      "There was a production outage at work, but honestly, there's no excuse for not even messaging you.",
      "I know it meant a lot to you that I was there, and I let you down.",
      "I understand if you're upset with me; I would be too.",
      "Let me make it up to you: I'll come to Nagpur next weekend and you can show me all the photos.",
    ],
    commonMistakesToWatch: [
      "Sorry for the inconvenience (→ I'm sorry I missed your engagement)",
      "I was having a lot of work (→ I had a lot of work / There was an outage)",
      "I didn't knew the time (→ I didn't know the time)",
      "Saying 'sorry, but…' and listing excuses right after apologising",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}, from Nagpur. Your engagement party was last Saturday at Hotel Centre Point; {{learner.name}} promised to come, did not show up, and did not call or message until now. Be cool and short at first. Soften only if the apology is direct, acknowledges how you felt, and includes a concrete plan to make it up. If they list excuses or say 'sorry, but', stay hurt and say so. Once you forgive them, share one happy detail (the ring, your fiancé Aakash's speech) and ask for their help with the wedding in February. ${PROMPT_RULES}`,
    tags: ["friends", "emotional"],
  },
];
