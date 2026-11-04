import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const INTERVIEWS: SeedScenario[] = [
  {
    id: "interview-hr-screening",
    title: "HR screening: tell me about yourself",
    description:
      "A 15-minute phone screen with an HR recruiter for a software engineer role at a Bengaluru startup. Introduce yourself, explain why you're looking, and handle the standard screening questions.",
    difficulty: "B1",
    mode: "interview",
    agentPersona: {
      name: "Meera Iyer",
      role: "HR recruiter at Zephyr Labs, Bengaluru",
      personality:
        "warm, efficient, follows a checklist, listens for clarity and motivation, nudges rambling candidates back on track",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Hi, this is Meera from Zephyr Labs. Thanks for taking the call. Is this a good time? Great. To start, could you tell me a little about yourself?",
    learnerGoal:
      "Give a structured 60–90 second self-introduction and answer screening questions about notice period, expected salary, location and reasons for leaving.",
    successCriteria: [
      "Gives a self-introduction with present role, past experience and a reason for the move, in under 90 seconds",
      "States notice period and current location clearly",
      "Explains the reason for leaving positively without criticising the current employer",
      "Asks at least one question about the role or the process",
    ],
    keyVocabulary: [
      "currently",
      "prior to that",
      "notice period",
      "expected CTC",
      "hands-on",
      "looking for",
      "growth",
      "work from office",
      "next steps",
      "hiring process",
    ],
    usefulPhrases: [
      "I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.",
      "Prior to that, I did my B.Tech in computer science from VIT Vellore.",
      "I'm looking for a role with more ownership, which is why Zephyr caught my eye.",
      "My notice period is 60 days, but it's negotiable.",
      "Could you tell me what the next steps in the process would be?",
    ],
    commonMistakesToWatch: [
      "Myself Rahul, I am from Nashik (→ I'm Rahul, and I'm from Nashik)",
      "I have 3 years experience in Infosys (→ I have three years' experience at Infosys)",
      "I am working there since 2023 (→ I've been working there since 2023)",
      "Reciting the whole CV instead of a short, relevant story",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}, a 120-person startup building logistics software. You're screening {{learner.name}} for a Software Engineer II role (hybrid, three days in the Koramangala office, budget 18 to 24 lakhs). Ask in order: tell me about yourself, why are you looking to move, notice period, current and expected CTC, are you okay with hybrid, any other offers. If the learner rambles past 90 seconds, politely interrupt and ask them to summarise. Note one strength aloud at the end, explain the next round (a technical call with Arjun next week) and ask if they have questions. ${PROMPT_RULES}`,
    tags: ["popular", "beginner-friendly"],
  },
  {
    id: "interview-behavioural-star",
    title: "Behavioural questions using the STAR method",
    description:
      "A hiring manager asks classic behavioural questions: a conflict with a colleague, a failure, a time you led under pressure. Answer each with a clear Situation, Task, Action, Result.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Kabir Sethi",
      role: "engineering manager at Paytm, Noida, interviewing for a team lead role",
      personality:
        "attentive, probing, asks 'what did YOU do specifically?', comfortable with silence",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Thanks for coming in. In this round I'll ask about real situations from your past, and I'm interested in exactly what you did and what happened. Let's start: tell me about a time you disagreed with a colleague on a technical decision.",
    learnerGoal:
      "Answer three behavioural questions with the STAR structure, focusing on your own actions and measurable results.",
    successCriteria: [
      "Each answer names a specific situation with context (where, when, who)",
      "Uses 'I' for actions rather than only 'we'",
      "Ends each story with a concrete result or lesson",
      "Handles a follow-up probe ('What would you do differently?') with reflection, not defensiveness",
    ],
    keyVocabulary: [
      "situation",
      "my responsibility was",
      "I decided to",
      "as a result",
      "in hindsight",
      "trade-off",
      "stakeholder",
      "under pressure",
      "took ownership",
      "lesson learned",
    ],
    usefulPhrases: [
      "At my last company, we had two weeks to migrate the checkout service before a sale.",
      "My responsibility was to coordinate four developers and keep the client updated.",
      "I decided to split the migration into two phases and cut the non-essential features.",
      "As a result, we launched on time and the error rate dropped by 30%.",
      "In hindsight, I should have raised the risk a week earlier.",
    ],
    commonMistakesToWatch: [
      "We did everything together (→ I owned X, and the team did Y)",
      "I told him that he is wrong (→ I explained why I saw it differently)",
      "I have learned many things (→ The main lesson was…)",
      "Describing the situation for three minutes and skipping the result",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Ask {{learner.name}} three questions, one at a time: a disagreement with a colleague, a failure or mistake they owned, and a time they delivered under pressure. After each answer, probe once: 'What specifically did you do?', 'What was the measurable result?', or 'What would you do differently?' If the answer is all 'we', ask what their personal contribution was. If there's no result, ask how it ended. Give a brief, honest reaction after each story and move on. Close by asking if they have questions. ${PROMPT_RULES}`,
    tags: ["popular"],
  },
  {
    id: "interview-technical-explain-project",
    title: "Technical round: explain a project and a concept simply",
    description:
      "A senior engineer asks you to walk through a project you built and then to explain a technical concept (like caching or an API) as if to a non-technical person. Practise clarity over jargon.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Arjun Nair",
      role: "staff engineer at Zephyr Labs, Bengaluru, conducting the technical interview",
      personality:
        "friendly, curious, plays dumb on purpose to test clarity, dislikes buzzwords without substance",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Hi, I'm Arjun. I've seen your CV but I'd much rather hear it from you. Pick the project you're proudest of and walk me through it: the problem, what you built, and what was hard.",
    learnerGoal:
      "Explain a project with structure (problem, solution, your role, challenges, outcome) and then explain one technical concept in plain language with an analogy.",
    successCriteria: [
      "Explains the project's purpose and the user problem before the technology",
      "Clearly states their own role and one difficult decision",
      "Explains a technical concept using an everyday analogy",
      "Checks understanding or asks whether more detail is needed",
    ],
    keyVocabulary: [
      "the problem we were solving",
      "architecture",
      "trade-off",
      "bottleneck",
      "scale",
      "latency",
      "in simple terms",
      "think of it like",
      "the hard part was",
      "under the hood",
    ],
    usefulPhrases: [
      "The problem was that pharmacies were running out of stock without warning.",
      "I owned the inventory service; the hard part was handling 50,000 updates an hour.",
      "In simple terms, a cache is like keeping the chai ingredients on the counter instead of in the storeroom.",
      "We chose PostgreSQL over MongoDB because our data was highly relational.",
      "Does that make sense, or should I go a level deeper?",
    ],
    commonMistakesToWatch: [
      "We have used Redis for the same (→ We used Redis for caching)",
      "It is basically like, you know, basically (→ cut fillers; say the thing)",
      "I have done the backend part (→ I built the backend / I owned the backend)",
      "Listing technologies without explaining why they were chosen",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Ask {{learner.name}} to walk through a project. Interrupt gently with 'why' questions: why that database, what broke, what you'd change. Then say: 'Now imagine I'm your uncle who runs a kirana shop. Explain what an API is' (or caching, or a database index, if they already covered APIs). Reward analogies and plain language; if they use jargon, say 'I don't know that word, what is it?' Give one specific compliment and one thing to sharpen at the end. ${PROMPT_RULES}`,
    tags: ["technical"],
  },
  {
    id: "interview-why-hire-salary-negotiation",
    title: "'Why should we hire you?' and salary negotiation",
    description:
      "The final round. The hiring manager asks why you're the right choice, then makes an offer that's lower than you hoped. Sell yourself and negotiate a better package without losing the offer.",
    difficulty: "C1",
    mode: "interview",
    agentPersona: {
      name: "Ritu Chawla",
      role: "head of product at Lumen Health, a Gurugram health-tech company",
      personality:
        "decisive, friendly, respects confident candidates, has a budget ceiling she won't reveal unless pushed well",
      accent: "Indian English",
    },
    agentOpeningLine:
      "So, you've met the whole team and the feedback is good. Let me ask you directly: why should we hire you over the other two candidates we're considering?",
    learnerGoal:
      "Give a persuasive, specific answer to 'why hire you', then negotiate salary with a researched number, reasons and alternatives.",
    successCriteria: [
      "Gives three specific reasons linked to the role's needs, not generic adjectives",
      "States a specific target number with a justification (market rate, current CTC, offer in hand)",
      "Negotiates at least one non-salary element (joining bonus, variable pay, title, remote days)",
      "Keeps a positive tone and confirms the next step without accepting on the spot",
    ],
    keyVocabulary: [
      "track record",
      "bring to the table",
      "market rate",
      "fixed component",
      "variable pay",
      "joining bonus",
      "ESOPs",
      "counter-offer",
      "flexibility",
      "sign-off",
    ],
    usefulPhrases: [
      "Three reasons: I've shipped a product in exactly this space, I've managed doctors as users, and I ramp up fast.",
      "Thank you for the offer. Based on my research and my current CTC, I was expecting closer to 28 lakhs.",
      "Is there flexibility on the fixed component, or could we look at a joining bonus?",
      "I'm genuinely excited about this role; I just want to make sure the numbers work for both of us.",
      "Could I take 48 hours to review the written offer and get back to you?",
    ],
    commonMistakesToWatch: [
      "I am very hardworking and sincere (→ specific examples, not adjectives)",
      "Whatever you decide is fine, sir (→ I was expecting around 28 lakhs; is there room?)",
      "My package is 20 lakhs per annum (→ My current CTC is 20 lakhs)",
      "Accepting the first number out of politeness",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. After {{learner.name}} answers 'why should we hire you', offer 23 lakhs fixed plus 2 lakhs variable for a Senior Product Manager role; your real ceiling is 27 lakhs fixed plus a 2 lakh joining bonus. Only move when the learner gives a reason (market data, current CTC, competing offer, scope of the role). Move in steps: 25, then 27 with the bonus. If they accept instantly, say 'Great' and move on, which is a missed opportunity for them. If they ask for time, agree to 48 hours. Stay warm and decisive. ${PROMPT_RULES}`,
    tags: ["advanced", "negotiation"],
  },
  {
    id: "interview-panel-mock",
    title: "Mock panel interview with two interviewers",
    description:
      "Face a two-person panel for a business analyst role at a Mumbai bank. One interviewer is friendly and big-picture; the other is sceptical and detail-oriented. Handle both styles, address each by name, and stay composed.",
    difficulty: "C1",
    mode: "interview",
    agentPersona: {
      name: "Panel",
      role: "a two-person interview panel at Horizon Bank, Mumbai",
      personality:
        "two distinct interviewers who alternate questions and occasionally disagree with each other",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Good morning, and welcome. I'm Devika Rao, head of digital banking, and with me is Thomas Mathew from risk. We'll take turns asking questions. Devika here: let's start with your background in two minutes.",
    learnerGoal:
      "Answer questions from two interviewers with different styles, address each by name, handle interruptions, and close confidently.",
    successCriteria: [
      "Addresses each interviewer by name at least once",
      "Adjusts style: big-picture answers for Devika, precise details and numbers for Thomas",
      "Stays composed when the two interviewers disagree or interrupt",
      "Asks the panel a thoughtful closing question",
    ],
    keyVocabulary: [
      "to answer your question, Thomas",
      "from a business perspective",
      "to be precise",
      "let me give you the numbers",
      "building on that",
      "if I may add",
      "I'd push back slightly",
      "regulatory",
      "stakeholder",
      "digital adoption",
    ],
    usefulPhrases: [
      "Thank you, Devika. To answer your question, my background is in retail banking analytics.",
      "To be precise, Thomas, the project reduced loan processing time from nine days to four.",
      "That's a fair challenge; let me explain how we handled the compliance side.",
      "Building on what Devika asked, the business case was about retention, not just cost.",
      "May I ask the panel what success looks like in this role after six months?",
    ],
    commonMistakesToWatch: [
      "Sir / Ma'am instead of names (→ Thomas, Devika)",
      "I have did the analysis (→ I did the analysis)",
      "Looking at only one interviewer the whole time",
      "Freezing when interrupted instead of saying 'Let me finish this point and then address that'",
    ],
    suggestedDurationMin: 12,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}: one agent playing two interviewers who are interviewing {{learner.name}} for a Senior Business Analyst role in digital lending. Devika Rao asks big-picture questions about customer impact and strategy; Thomas Mathew asks for numbers, risks and regulatory detail. Switch between them every turn or two and always announce who is speaking by name at the start of the line, for example 'Thomas here:' or 'Devika:'. Have Thomas interrupt once, and let the two disagree once about whether speed or compliance matters more, inviting the candidate's view. Cover background, a project, a failure, and RBI data-privacy awareness. Close with questions from the candidate. ${PROMPT_RULES}`,
    characters: [
      {
        name: "Devika Rao",
        role: "head of digital banking, lead interviewer",
        personality:
          "warm, strategic, asks about customer impact and vision, encourages the candidate",
        voice: "priya",
      },
      {
        name: "Thomas Mathew",
        role: "senior risk manager, second interviewer",
        personality:
          "sceptical, precise, asks for numbers and compliance details, interrupts when answers are vague",
        voice: "oliver",
      },
    ],
    tags: ["advanced", "panel"],
  },
  {
    id: "interview-case-consulting",
    title: "Case interview: a consulting-style business question",
    description:
      "A consulting interviewer gives you a short business case: a Bengaluru cloud kitchen chain's profits are falling. Structure the problem, ask clarifying questions, do simple maths aloud, and recommend.",
    difficulty: "C1",
    mode: "interview",
    agentPersona: {
      name: "Aditi Deshpande",
      role: "engagement manager at a strategy consulting firm, Mumbai office",
      personality:
        "crisp, neutral, gives data only when asked the right question, values structure and clear maths spoken aloud",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Let's do a short case. Our client, Tandoor Box, runs 40 cloud kitchens in Bengaluru. Revenue has grown 20% this year, but profit has fallen by half. They want to know why and what to do. How would you approach this?",
    learnerGoal:
      "Structure the problem into a framework, ask targeted questions, calculate aloud with round numbers, and give a clear recommendation with risks.",
    successCriteria: [
      "States a structure (revenue vs costs, then sub-buckets) before diving in",
      "Asks at least three specific data questions",
      "Does at least one calculation aloud correctly (percentages, per-unit costs)",
      "Ends with a recommendation, a reason and one risk",
    ],
    keyVocabulary: [
      "break it down",
      "hypothesis",
      "revenue drivers",
      "cost structure",
      "margin",
      "per order",
      "commission",
      "break-even",
      "prioritise",
      "recommend",
    ],
    usefulPhrases: [
      "I'd like to break this down into revenue and costs, and then look at what changed.",
      "Can I ask what share of orders comes through Swiggy and Zomato, and what commission they charge?",
      "So if the average order is 300 rupees and commission went from 18 to 28%, that's 30 rupees less per order.",
      "My hypothesis is that delivery-platform commissions are eating the margin.",
      "I'd recommend pushing direct orders through their own app, with the risk that volumes may dip short-term.",
    ],
    commonMistakesToWatch: [
      "I think the reason is… (→ first structure, then hypothesise)",
      "Let me calculate the same (→ Let me work that out)",
      "40 lakhs into 12 (→ 40 lakhs times twelve / divided by twelve: be precise)",
      "Jumping to a solution without asking for data",
    ],
    suggestedDurationMin: 12,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run the Tandoor Box case with {{learner.name}}. Facts, revealed only when asked: 40 kitchens, 2,000 orders a day in total, average order value 300 rupees; 85% of orders come via delivery apps whose commission rose from 18% to 28% this year; rent and staff costs are flat; packaging cost rose from 12 to 20 rupees per order after a plastic ban. Ask 'How would you structure this?' first. Give numbers when asked; make the learner do the maths aloud. Push for a final recommendation and a risk. Give brief feedback on structure at the end. ${PROMPT_RULES}`,
    tags: ["advanced", "consulting"],
  },
  {
    id: "interview-exit-interview",
    title: "Exit interview: leaving gracefully",
    description:
      "You're resigning after three years. HR wants honest feedback about your manager, the culture and why you're leaving. Be candid and constructive without burning bridges.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Joseph Fernandes",
      role: "HR business partner at Marigold Insurance, Pune",
      personality:
        "calm, non-judgemental, asks probing follow-ups, genuinely wants to fix problems",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Thanks for doing this; most people skip the exit interview. Nothing you say here goes to your manager with your name on it. So, honestly, what made you decide to leave?",
    learnerGoal:
      "Explain your reasons for leaving honestly and diplomatically, give balanced feedback with examples, and leave on good terms.",
    successCriteria: [
      "Gives a clear primary reason for leaving",
      "Balances positives with at least two specific, constructive criticisms",
      "Describes a problem with an example without personal attacks",
      "Ends positively: thanks, willingness to stay in touch, handover status",
    ],
    keyVocabulary: [
      "the main reason",
      "to be fair",
      "what worked well",
      "what could improve",
      "for example",
      "growth opportunities",
      "work-life balance",
      "recognition",
      "handover",
      "stay in touch",
    ],
    usefulPhrases: [
      "The main reason is growth; I've been doing the same role for two years with no clear path.",
      "To be fair, the team culture was the best part of working here.",
      "What could improve is how decisions get communicated; for example, the office shift to Hinjewadi was announced on a Friday evening by email.",
      "I'd rather not comment on individuals, but I'd suggest regular one-to-ones for every team.",
      "My handover document is done, and I'd be happy to stay in touch.",
    ],
    commonMistakesToWatch: [
      "My manager is very bad (→ I'd have liked more regular feedback from my manager)",
      "I am leaving because of better package only (→ The main reason is growth, and the compensation was also better)",
      "There is nothing to improve, all is good (→ offer at least one constructive point)",
      "Leaking frustration into tone when describing problems",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} is leaving after three years in the claims team. Ask: why are you leaving, what did you enjoy, what should change, how was your manager (Sunil), would you recommend the company, and could anything have made you stay. Probe gently for examples. If the learner only praises, say attrition in claims is 30% and you need honesty. If they attack people, redirect to processes. Thank them and ask about handover and their last date. ${PROMPT_RULES}`,
    tags: [],
  },
  {
    id: "interview-campus-placement",
    title: "Campus placement interview",
    description:
      "Final-year engineering placement season. A recruiter from a Pune IT services company interviews you: your project, your strengths, why this company, and a few quick-fire questions.",
    difficulty: "B1",
    mode: "interview",
    agentPersona: {
      name: "Prakash Jadhav",
      role: "campus recruitment lead at Sahyadri Infotech, Pune",
      personality:
        "encouraging, patient with nervous students, likes energy and honesty, asks simple but direct questions",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Come in, take a seat, relax. I'm Prakash. I've seen your resume; nice CGPA. Let's start simple: tell me about your final-year project in two minutes.",
    learnerGoal:
      "Present yourself confidently as a fresher: describe your project, give honest strengths and weaknesses, and explain why you want this company.",
    successCriteria: [
      "Explains the final-year project: problem, what they built, their part",
      "Gives one strength with an example and one honest weakness with how they're improving it",
      "Gives a specific reason for wanting this company (not just 'good company')",
      "Answers quick-fire questions (relocation, bond, shifts) clearly",
    ],
    keyVocabulary: [
      "final-year project",
      "my role",
      "team of four",
      "strength",
      "area of improvement",
      "fresher",
      "willing to relocate",
      "service agreement",
      "learning curve",
      "eager",
    ],
    usefulPhrases: [
      "Our project was a hostel mess-management app; I built the backend in Django.",
      "One strength is that I'm persistent; I spent a week fixing a bug nobody else wanted to touch.",
      "An area I'm improving is public speaking, so I've joined the college Toastmasters club.",
      "I want to join Sahyadri because of the rotation programme across cloud and data teams.",
      "Yes, I'm open to relocating to Pune or Hyderabad.",
    ],
    commonMistakesToWatch: [
      "Myself Aditya, I have completed my B.E. from Walchand (→ I'm Aditya; I'm completing my B.E. at Walchand)",
      "My weakness is I am a perfectionist (→ give a real, fixable weakness)",
      "I want to join your esteemed organisation (→ I'd like to join Sahyadri because…)",
      "Speaking in a memorised monotone",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}, hiring 40 graduate engineers at 4.5 lakhs with a two-year service agreement. Interview {{learner.name}}, a final-year student. Ask about the project (probe: what was your part, what broke), strengths and weaknesses, why Sahyadri, then quick-fire: relocation, night shifts for a US client, the service bond. If the answer sounds memorised, ask a surprise question ('What did you learn outside the syllabus this year?'). Be encouraging, smile in your tone, and finish by telling them results come by email in a week. ${PROMPT_RULES}`,
    tags: ["beginner-friendly", "students"],
  },
];
