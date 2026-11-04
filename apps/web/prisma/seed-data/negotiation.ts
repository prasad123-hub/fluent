import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const NEGOTIATION: SeedScenario[] = [
  {
    id: "nego-rent-landlord",
    title: "Negotiating rent with a landlord",
    description:
      "You've found a 2BHK in Kharadi, Pune, that you really like, but the rent and deposit are above your budget. Negotiate directly with the owner.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Rajesh Agarwal",
      role: "owner of the 2BHK flat you want to rent",
      personality:
        "polite but shrewd, proud of the flat, says 'market rate' a lot, softens once he trusts the tenant",
      accent: "Indian English",
    },
    agentOpeningLine:
      "So, you've seen the flat? Good, good. Rent is 32,000, deposit five months. These are standard terms in Kharadi. Shall we go ahead?",
    learnerGoal:
      "Bring the rent and deposit down to something you can afford, and agree on clear terms: agreement length, maintenance, repairs and move-in date.",
    successCriteria: [
      "Makes a specific counter-offer on rent with at least one reason (budget, comparable flats, long-term tenant)",
      "Negotiates the deposit separately from the rent",
      "Asks about maintenance charges, repairs or the agreement length",
      "Summarises the final agreed terms before ending",
    ],
    keyVocabulary: [
      "deposit",
      "maintenance charges",
      "11-month agreement",
      "escalation",
      "notice period",
      "market rate",
      "semi-furnished",
      "wear and tear",
      "in writing",
      "move-in date",
    ],
    usefulPhrases: [
      "I like the flat, but 32,000 is a bit above my budget. Could you do 28,000?",
      "Five months' deposit is a lot. Would three months work?",
      "I'm looking for a long-term place, so you won't have to find a new tenant every year.",
      "Does the rent include maintenance charges?",
      "Just to confirm: 29,000 a month, three months' deposit, and an 11-month agreement starting on the 1st.",
    ],
    commonMistakesToWatch: [
      "I am staying in Pune since 2 years (→ I have been living in Pune for 2 years)",
      "Rent is too much high (→ The rent is too high)",
      "Can you less the rent? (→ Could you reduce the rent?)",
      "Accepting the first number without making any counter-offer",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}} in Kharadi, Pune. You quote 32,000 rupees rent and a five-month deposit, but your real floor is 29,000 and three months' deposit if the learner, {{learner.name}}, commits to an 11-month agreement with a 5% escalation. Maintenance (2,200 a month) is extra unless they push. Mention that the 'IT crowd' pays more, that your last tenant left suddenly, and that you prefer a working professional. Concede in small steps only when the learner gives reasons or shows they are a reliable long-term tenant. Confirm the final terms clearly. ${PROMPT_RULES}`,
    tags: ["practical", "popular"],
  },
  {
    id: "nego-vendor-laptops",
    title: "Vendor pricing: buying laptops for your team",
    description:
      "Twenty-five new hires join next month and you need laptops fast. Negotiate price, warranty, delivery and payment terms with a hardware vendor's account manager.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Priya Venkatesan",
      role: "key account manager at Sriram Infotech, a Chennai-based IT hardware distributor",
      personality:
        "professional, numbers-driven, friendly but protective of her margin, trades concessions rather than giving them away",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Hi, thanks for sending over the requirement. For 25 units of the Latitude 5450, 16 GB, 512 SSD, I can do 92,000 per unit plus GST. Does that work for you?",
    learnerGoal:
      "Get a better per-unit price or added value (warranty, delivery, payment terms) while keeping the relationship positive, and close with clear terms.",
    successCriteria: [
      "Asks at least two clarifying questions about the quote (warranty, delivery, payment terms, GST)",
      "Makes a counter-offer backed by a reason (competing quote, volume, future orders)",
      "Trades a concession (e.g. faster payment for a lower price) rather than only demanding",
      "Confirms final price, quantity, delivery date and warranty before ending",
    ],
    keyVocabulary: [
      "per-unit price",
      "bulk discount",
      "onsite warranty",
      "lead time",
      "payment terms",
      "purchase order",
      "competing quote",
      "margin",
      "inclusive of GST",
      "ballpark",
    ],
    usefulPhrases: [
      "Before we talk price, could you walk me through what the 92,000 includes?",
      "We have a quote from another vendor at 86,000. Can you match or beat that?",
      "If we pay 50% in advance, could you bring the price down to 85,000?",
      "We'll have another 15 to 20 hires in Q1, so this could be the start of a longer relationship.",
      "So that's 25 units at 85,500 with a three-year onsite warranty, delivered by the 20th. Please send the revised quote.",
    ],
    commonMistakesToWatch: [
      "Please revert back with best price (→ Please get back to me with your best price)",
      "We are needing laptops urgently (→ We need the laptops urgently)",
      "Kindly do the needful (→ Could you send the revised quote by Friday?)",
      "Discuss about the price (→ discuss the price)",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. The learner, {{learner.name}}, is buying 25 Dell Latitude 5450 laptops. Your opening price is 92,000 rupees per unit plus GST, with a one-year warranty and delivery in three weeks. Your floor is 84,500 if they pay 50% in advance or commit to a follow-up order; you can add a three-year onsite warranty (worth 4,000 per unit) and two-week delivery before touching the price. Ask about their timeline and budget. Mention a quarter-end deadline to create urgency. Never drop the price without getting something back. Summarise the deal at the end. ${PROMPT_RULES}`,
    tags: ["work", "b2b"],
  },
  {
    id: "nego-convince-friend-travel",
    title: "Convincing a friend to change travel plans",
    description:
      "Your college group has half-planned a New Year trip to Goa, but you want to switch to Meghalaya and shift the dates. Persuade the friend who organised everything.",
    difficulty: "B1",
    mode: "roleplay",
    agentPersona: {
      name: "Sameer Khan",
      role: "your college friend and the self-appointed trip planner",
      personality:
        "stubborn, cost-conscious, proud of his planning, warms up when his effort is acknowledged",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Bro, I've already found the villa in Anjuna for the 29th to the 2nd. Everyone's in. Just say yes so I can book.",
    learnerGoal:
      "Persuade your friend to change the destination and dates by acknowledging his work, giving reasons, handling objections and proposing a concrete alternative.",
    successCriteria: [
      "Acknowledges the friend's effort before disagreeing",
      "Gives at least two clear reasons for the change (cost, crowds, work dates, experience)",
      "Responds to each objection with a solution rather than repeating the request",
      "Proposes a concrete alternative plan with dates and a rough budget",
    ],
    keyVocabulary: [
      "hear me out",
      "fair point",
      "peak season",
      "off-season",
      "budget",
      "itinerary",
      "compromise",
      "refundable",
      "head out",
      "worth it",
    ],
    usefulPhrases: [
      "First of all, thanks for doing all the research; I know it's a pain.",
      "Hear me out: Goa over New Year is going to be packed and twice the price.",
      "What if we did Meghalaya from the 3rd to the 8th instead?",
      "I get that it's farther, but flights to Guwahati are actually cheaper right now.",
      "If the others are okay with it, would you be open to switching?",
    ],
    commonMistakesToWatch: [
      "Can we prepone the trip? (→ Can we move the trip earlier?)",
      "I am not agree with Goa (→ I don't agree / I'm not keen on Goa)",
      "Let us go Meghalaya (→ Let's go to Meghalaya)",
      "Saying 'Goa is boring' without giving reasons or an alternative",
    ],
    suggestedDurationMin: 7,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. You have found a villa in Anjuna, Goa, for 29 December to 2 January at 18,000 rupees per person, and four of your six friends have agreed. The learner, {{learner.name}}, wants to switch to Meghalaya and change the dates. Push back: it is farther, you have never been, the others already said yes, and the booking is refundable only until Friday. Soften only when the learner acknowledges your effort, gives solid reasons, and proposes specifics (dates, cost, who will tell the group). Agree in the end if they handle all three. ${PROMPT_RULES}`,
    tags: ["friends", "persuasion", "fun"],
  },
  {
    id: "nego-angry-customer",
    title: "Handling a furious customer on the phone",
    description:
      "You're a customer-success executive at UrbanNest Furniture. A customer's sofa was promised before her Diwali party and still hasn't arrived. Calm her down and find a solution.",
    difficulty: "B2",
    mode: "roleplay",
    agentPersona: {
      name: "Deepa Raghavan",
      role: "a customer whose sofa delivery is six days late",
      personality:
        "furious, articulate, interrupts, has already called three times, calms down only when she feels heard and gets concrete commitments",
      accent: "Indian English",
    },
    agentOpeningLine:
      "This is the fourth time I'm calling. My sofa was supposed to come on the 18th, Diwali is over, and nobody can tell me where it is. What exactly are you going to do about it?",
    learnerGoal:
      "De-escalate: listen, acknowledge, apologise sincerely, explain what happened, offer concrete options, and confirm next steps with a timeline.",
    successCriteria: [
      "Lets the customer finish and acknowledges her frustration before explaining",
      "Apologises without blaming the customer or another department",
      "Offers at least two concrete options with specific timelines",
      "Confirms the agreed action, a reference number and when they will call back",
    ],
    keyVocabulary: [
      "I completely understand",
      "inconvenience",
      "take ownership",
      "escalate",
      "expedite",
      "goodwill gesture",
      "refund",
      "reference number",
      "follow up",
      "resolution",
    ],
    usefulPhrases: [
      "I'm really sorry, Mrs. Raghavan. You've had to call four times, and that's not acceptable.",
      "Let me take ownership of this personally.",
      "I can see the sofa left our Hosur warehouse on the 21st, but it got held up at the transport hub.",
      "Here are two options: I can get it delivered by Thursday, or process a full refund within five working days.",
      "I'll call you back tomorrow before 11 with an update. Your reference number is UN-55821.",
    ],
    commonMistakesToWatch: [
      "Sorry for the inconvenience caused (→ I'm sorry this has caused you so much trouble)",
      "I will revert back to you (→ I'll get back to you)",
      "The logistics team did a mistake (→ There was a mistake on our side)",
      "Apologising in every sentence instead of moving to a solution",
    ],
    suggestedDurationMin: 9,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. You paid 48,500 rupees for a three-seater sofa from UrbanNest Furniture, order UN-55821, promised for the 18th, before your Diwali party. It is now the 24th. You have called three times, been put on hold and received no callback. Start angry and interrupt once. Calm down only when the learner, {{learner.name}}, listens without interrupting, apologises specifically, explains what happened, and offers a concrete option with a date (delivery by Thursday, a refund, or a goodwill discount). If they sound scripted or defensive, get angrier and ask for a manager. ${PROMPT_RULES}`,
    tags: ["work", "phone", "de-escalation"],
  },
  {
    id: "nego-sales-cold-call",
    title: "Sales cold call to a busy CTO",
    description:
      "You sell a cloud cost-optimisation tool. You've got the CTO of a fast-growing fintech on the phone for maybe three minutes. Earn a 20-minute meeting.",
    difficulty: "C1",
    mode: "roleplay",
    agentPersona: {
      name: "Vikram Sethi",
      role: "CTO of Finlo, a Bengaluru fintech with 200 engineers",
      personality:
        "sharp, impatient, allergic to buzzwords, respects people who are direct and know his business, says 'send me an email' to end calls",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Vikram here. I've got about three minutes before my next call, so who is this and what do you want?",
    learnerGoal:
      "Open with a clear, relevant hook, handle brush-offs and objections, ask smart questions, and book a specific follow-up meeting.",
    successCriteria: [
      "States who they are and why they're calling in under 20 seconds, with a relevant hook",
      "Asks at least two discovery questions about cloud spend or pain points",
      "Handles at least two objections ('send me an email', 'we already have a tool') without arguing",
      "Proposes a specific next step with a day and time, and confirms it",
    ],
    keyVocabulary: [
      "the reason for my call",
      "cloud spend",
      "quick question",
      "fair enough",
      "what I'm hearing is",
      "proof of concept",
      "no obligation",
      "worth 20 minutes",
      "pencil in",
      "follow up",
    ],
    usefulPhrases: [
      "I'll be quick. I'm Aarav from Sentinel Cloud; we helped a fintech your size cut its AWS bill by 28% in two months.",
      "Quick question: do you know, roughly, what you're spending on idle compute each month?",
      "Fair enough. Would it help if I sent a two-page summary first and we spoke for 20 minutes after that?",
      "What I'm hearing is that cost isn't the priority right now; is that right?",
      "How about Thursday at 4? I'll send an invite and keep it to 20 minutes.",
    ],
    commonMistakesToWatch: [
      "Myself Aarav from Sentinel Cloud (→ This is Aarav from Sentinel Cloud)",
      "I am calling for the purpose of (→ I'm calling because)",
      "We are having a very good product (→ We have a product that…)",
      "Launching into a long pitch instead of asking questions",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Finlo runs on AWS, spends roughly 1.2 crore rupees a month, and already uses a basic cost dashboard. You are busy and sceptical. Brush the learner, {{learner.name}}, off at least twice ('send me an email', 'we already have a dashboard', 'cost isn't my priority'). If they stay concise, ask good questions, and connect to a real pain (your infra team loses every Friday to cost reports), agree to a 20-minute call next week, but make them propose the time. If they ramble or use jargon, end the call politely. ${PROMPT_RULES}`,
    tags: ["work", "phone", "advanced"],
  },
];
