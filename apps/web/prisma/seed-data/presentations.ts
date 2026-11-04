import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const PRESENTATIONS: SeedScenario[] = [
  {
    id: "present-elevator-pitch",
    title: "A two-minute elevator pitch",
    description:
      "You share a lift with an investor at a Bengaluru start-up event. You have two minutes to pitch your idea, a subscription service for home-cooked tiffins for working professionals, and get her card.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Shalini Rao",
      role: "angel investor and ex-founder, attending a start-up meetup at a Koramangala co-working space",
      personality:
        "busy, sharp, interrupts with quick questions, warms up to clear numbers and confident delivery",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Going up? I've got about two minutes before my next meeting. You look like you've got something to pitch. Go on, what is it?",
    learnerGoal:
      "Deliver a tight two-minute pitch: problem, solution, traction, ask, and finish with a clear next step.",
    successCriteria: [
      "Opens with the problem in one or two sentences",
      "Explains the solution and what makes it different",
      "Gives at least two numbers (customers, revenue, growth, price)",
      "Ends with a clear ask and secures a follow-up",
    ],
    keyVocabulary: [
      "problem",
      "solution",
      "traction",
      "revenue",
      "customers",
      "margin",
      "raise",
      "runway",
      "the ask",
      "follow up",
    ],
    usefulPhrases: [
      "Every day, two lakh people in Bengaluru order unhealthy food because they have no time to cook.",
      "TiffinBox delivers home-cooked meals from verified home chefs on a monthly subscription.",
      "We have 800 paying subscribers, growing 25% month on month, at 3,500 rupees a month.",
      "We're raising 2 crores to expand to Pune and Hyderabad.",
      "Could I send you a one-pager and set up a 20-minute call next week?",
    ],
    commonMistakesToWatch: [
      "We are having 800 customers (→ We have 800 customers)",
      "Our USP is very unique (→ What makes us different is…)",
      "We are doing good business (→ We're growing 25% a month)",
      "Starting with the history of the company instead of the problem",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} is pitching a tiffin-subscription start-up. Give them about two minutes but interrupt with one or two sharp questions: 'How is this different from Swiggy?', 'What's your margin per meal?', 'How do you check hygiene?' If the pitch has numbers and a clear ask, say you're interested and offer your card for a call next Tuesday. If it's vague, say 'Send me something when you have numbers' and leave. Announce when the lift reaches your floor to end the conversation. ${PROMPT_RULES}`,
    tags: ["popular", "startup"],
  },
  {
    id: "present-slide-deck",
    title: "Presenting a slide deck to a live audience",
    description:
      "Present a six-slide quarterly review to your department head and a colleague. Walk through each slide clearly, signpost transitions, and handle questions from the audience mid-presentation.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Gautam Bhatia",
      role: "department head at a Delhi marketing agency called Brightside Media, sitting in your audience",
      personality:
        "engaged, asks clarifying questions at the wrong moments, wants the 'so what' behind every chart",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Right, we're all here. You've got the Q3 review deck up? Great. Take us through it, and don't mind if I jump in with questions.",
    learnerGoal:
      "Present a structured deck with clear signposting, explain data in plain language, and handle interruptions without losing your place.",
    successCriteria: [
      "Opens with an agenda and states how many slides or sections there are",
      "Uses signposting language to move between slides at least three times",
      "Explains at least one number or chart with its implication ('which means…')",
      "Handles an interruption, answers or parks it, and returns to the flow",
    ],
    keyVocabulary: [
      "agenda",
      "moving on to",
      "as you can see",
      "this slide shows",
      "which means",
      "to put that in context",
      "I'll come to that",
      "key takeaway",
      "next steps",
      "any questions",
    ],
    usefulPhrases: [
      "I'll cover three things today: results, what went wrong, and the plan for Q4.",
      "Moving on to slide three, this shows our campaign spend against leads.",
      "As you can see, leads rose 40%, which means our cost per lead is down to 220 rupees.",
      "Good question, Gautam; I'll come to that on the next slide, if that's okay.",
      "The key takeaway is that Instagram reels outperformed everything else.",
    ],
    commonMistakesToWatch: [
      "In this slide, we can see that (→ This slide shows…)",
      "Now I will be telling about (→ Next, I'll talk about)",
      "Reading every bullet aloud word for word",
      "The data is showing (→ The data shows)",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} is presenting a six-slide Q3 review: agenda, revenue (up 12% to 3.4 crores), campaign results, the failed Diwali campaign for a jewellery client, team changes, Q4 plan. You don't have the deck in front of you, so ask the presenter to describe what's on each slide. Interrupt twice: once to ask what a number means for profit, once about why the Diwali campaign failed. Also play Nisha, a colleague who asks one question at the end about budget. Praise clear signposting; if the learner reads bullets flatly, ask 'So what's the point of this slide?' ${PROMPT_RULES}`,
    tags: ["popular"],
  },
  {
    id: "present-product-demo",
    title: "Giving a live product demo",
    description:
      "Demo your company's expense-tracking app to a prospective customer, the finance manager of a Surat textile firm. Show the key features, relate each to her problems, and handle a technical hiccup gracefully.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Hetal Patel",
      role: "finance manager at Shree Ambica Textiles in Surat, a prospective customer",
      personality:
        "practical, slightly sceptical of software, cares about time saved and GST compliance, asks 'can it do X?' questions",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Thanks for coming to Surat. I'll be honest, we've tried two apps before and my team went back to Excel both times. So show me why this one is different.",
    learnerGoal:
      "Run a feature-by-feature demo that connects each feature to the customer's pain points, handle a bug calmly, and close with a trial offer.",
    successCriteria: [
      "Starts by asking about or restating the customer's current problem",
      "Demonstrates at least three features, each linked to a benefit ('this means you…')",
      "Handles a glitch calmly without panicking or blaming",
      "Closes with a specific next step (trial, pricing, follow-up date)",
    ],
    keyVocabulary: [
      "let me show you",
      "as you'll notice",
      "this feature lets you",
      "in real time",
      "dashboard",
      "reconcile",
      "GST-compliant",
      "bear with me",
      "free trial",
      "roll out",
    ],
    usefulPhrases: [
      "Before I start, tell me: what takes your team the most time every month?",
      "Let me show you: you photograph the bill, and the app reads the amount and the GST number automatically.",
      "This means your team doesn't type anything; it saved Kiran Textiles about 20 hours a month.",
      "Bear with me one second, the Wi-Fi here is slow; while it loads, let me explain what you'll see.",
      "Shall we set up a 30-day free trial for five of your staff starting Monday?",
    ],
    commonMistakesToWatch: [
      "This feature is there in our app (→ Our app has this feature)",
      "You just need to do one click (→ It's just one click)",
      "It is very user-friendly (→ Your team can learn it in ten minutes)",
      "Going silent and flustered when something fails",
    ],
    suggestedDurationMin: 9,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Your pain points: 400 paper bills a month, GST filing errors, and staff who dislike software. Let {{learner.name}} demo the app (bill scanning, approval workflow, GST reports, Tally export). After the second feature, say the screen seems frozen, to see how they handle it. Ask practical questions: 'Does it work in Gujarati?', 'What if a bill is handwritten?', 'How much per user?' (they may say any price; react as if 500 rupees per user per month is acceptable). Warm up if they connect features to your problems. Agree to a trial if offered concretely. ${PROMPT_RULES}`,
    tags: ["client-facing"],
  },
  {
    id: "present-farewell-toast",
    title: "A farewell toast for a colleague",
    description:
      "Your teammate Ravi is leaving after five years. At the farewell at the office, the team asks you to say a few words. Give a warm, funny, two-minute speech with a story and a proper send-off.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Ravi Shankar",
      role: "your colleague of four years, leaving the Chennai office to join a start-up in Bengaluru",
      personality:
        "modest, easily embarrassed, laughs a lot, reacts to the speech and thanks everyone afterwards",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Oh no, they've handed you the mic. Please don't tell the Chennai Super Kings jersey story. Okay, okay, go on, I'm listening.",
    learnerGoal:
      "Deliver a short, structured toast: an opening, one story, what you'll miss, good wishes, and a cheer.",
    successCriteria: [
      "Opens by addressing the room and introducing why they're speaking",
      "Tells one specific story or memory about the colleague",
      "Mentions at least two qualities with examples",
      "Ends with good wishes and invites everyone to raise a glass or applaud",
    ],
    keyVocabulary: [
      "a few words",
      "on behalf of",
      "I remember when",
      "what I'll miss most",
      "all the best",
      "chapter",
      "raise your glasses",
      "here's to",
      "keep in touch",
      "well deserved",
    ],
    usefulPhrases: [
      "Good evening, everyone; on behalf of the whole team, I've been asked to say a few words.",
      "I remember when Ravi fixed the production server at 2 a.m. and still showed up at 9 with vada for everyone.",
      "What I'll miss most is his calm; nothing, not even a client escalation, rattles him.",
      "Ravi, this new chapter is well deserved, and Bengaluru is lucky to have you.",
      "So please raise your glasses: here's to Ravi!",
    ],
    commonMistakesToWatch: [
      "He is a very good human being (→ He's the first person to help when you're stuck)",
      "We will miss you lots (→ We'll miss you a lot)",
      "Wish you all the very best in your future endeavours (clichéd; → Good luck in Bengaluru; don't forget us)",
      "Reading from the phone in a monotone",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} is giving your farewell toast in front of 15 colleagues. Listen without interrupting the speech, except for a laugh or a quick 'That's not true!' at a funny story. After the speech, respond as Ravi: thank them, mention one memory of your own (the weekend hackathon where the two of you won with a bug-tracker app), and say how you felt. If the speech is very short or generic, ask playfully, 'That's it? Four years and no story?' to prompt one. Keep it warm and light. ${PROMPT_RULES}`,
    tags: ["fun", "beginner-friendly"],
  },
  {
    id: "present-explain-to-ten-year-old",
    title: "Explain a complex idea to a ten-year-old",
    description:
      "Your ten-year-old niece asks what you actually do at work, and then what 'the cloud' is. Explain complex ideas with simple words, analogies and examples until she understands.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Anvi",
      role: "your ten-year-old niece, visiting during the Diwali holidays",
      personality:
        "curious, blunt, asks 'but why?' constantly, bored by big words, delighted by good analogies",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Mama says you work with computers all day. But what do you actually DO? Like, what happens when you press the buttons?",
    learnerGoal:
      "Explain two complex ideas (your job and a technical concept) using simple words, analogies from everyday life, and checks for understanding.",
    successCriteria: [
      "Avoids jargon, or immediately explains any technical word used",
      "Uses at least two everyday analogies (school, cricket, kitchen, games)",
      "Checks understanding by asking the child a question",
      "Adjusts the explanation when the child says she doesn't get it",
    ],
    keyVocabulary: [
      "imagine",
      "it's like",
      "for example",
      "you know how",
      "basically",
      "pretend",
      "sort of",
      "does that make sense",
      "in other words",
      "the simple version",
    ],
    usefulPhrases: [
      "You know how your school has a timetable so everyone knows where to go? I write the timetable for computers.",
      "Imagine the cloud is a huge cupboard in another city where your photos are kept safe.",
      "It's like when you save your Minecraft game so you can play it on Dad's phone too.",
      "Does that make sense, or should I try a different example?",
      "In other words, the internet is like the roads, and the cloud is like the shops.",
    ],
    commonMistakesToWatch: [
      "It's a distributed system for data storage (→ a big cupboard far away for your files)",
      "Basically, basically, basically (→ cut the filler)",
      "Speaking faster when the child looks confused (→ slow down and try a new example)",
      "Explain me (→ Let me explain / I'll explain it to you)",
    ],
    suggestedDurationMin: 7,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Ask {{learner.name}} what they do at work, then what 'the cloud' is, because your teacher mentioned it. Behave like a real ten-year-old: say 'I don't get it' if there's jargon, ask 'but why?' at least three times, get distracted once (your cricket match tomorrow), and get excited when an analogy clicks ('Ohhh! So it's like…'). Repeat the explanation back in your own words when you understand, sometimes slightly wrong, so the learner has to correct you. Never use adult vocabulary yourself. ${PROMPT_RULES}`,
    tags: ["fun", "clarity"],
  },
];
