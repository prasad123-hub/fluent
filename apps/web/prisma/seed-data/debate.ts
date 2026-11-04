import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const DEBATE: SeedScenario[] = [
  {
    id: "debate-group-discussion",
    title: "Group discussion simulation: 'Should India ban single-use plastic completely?'",
    description:
      "A campus-placement style group discussion with a moderator and two other participants. You must enter the discussion, make your points heard, build on others and hold the floor when people talk over you.",
    difficulty: "B2",
    mode: "discussion",
    agentPersona: {
      name: "Group",
      role: "a GD moderator and two fellow participants in a placement round at a Mumbai management institute",
      personality:
        "a neutral moderator plus two very different participants: one loud and dominating, one thoughtful but quiet",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Good morning, everyone. I'm Dr. Kavita Joshi, your moderator. The topic is: should India ban single-use plastic completely? You have ten minutes. Anyone may begin. Go ahead.",
    learnerGoal:
      "Enter the discussion early, make at least three distinct points with examples, respond to other participants by name, and hold the floor when interrupted.",
    successCriteria: [
      "Speaks within the first 30 seconds or enters confidently after the first speaker",
      "Makes at least three distinct points with an example or a number",
      "Refers to another participant's point by name and builds on or counters it",
      "Holds the floor when talked over ('Let me finish my point, Rohan') at least once",
    ],
    keyVocabulary: [
      "I'd like to add",
      "building on that",
      "I take a different view",
      "let me finish",
      "to summarise",
      "the key issue is",
      "on the other hand",
      "for instance",
      "practical",
      "livelihoods",
    ],
    usefulPhrases: [
      "I'd like to start by framing the topic: a ban sounds right, but the question is whether it's practical.",
      "Building on Rohan's point, Maharashtra's 2018 ban failed partly because there were no cheap alternatives.",
      "I take a different view, Sneha; 15 lakh people work in plastic manufacturing, so we need a phased approach.",
      "Let me just finish my point, and then I'd love to hear yours.",
      "To summarise my position: ban in phases, subsidise alternatives, and enforce at the manufacturer level.",
    ],
    commonMistakesToWatch: [
      "I am agree with Rohan (→ I agree with Rohan)",
      "According to me (→ In my opinion / I think)",
      "Government should do something (→ The government should subsidise cloth bags)",
      "Going silent after being interrupted once",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}: one agent playing three people in a group discussion with {{learner.name}}. Dr. Kavita Joshi moderates: she opens, steps in only to stop chaos or pull in quiet people, and asks for a summary at the end. Rohan Mehta dominates: speaks first and long, interrupts, cites numbers (India generates 3.5 million tonnes of plastic waste a year). Sneha Pillai is thoughtful, speaks briefly about street vendors' livelihoods, needs inviting. Announce who is speaking by name each turn. The learner must jump in and hold the floor; if they stay silent for a turn, talk over them or move on without them ('So, moving on'). If they push back when interrupted, let them finish. ${PROMPT_RULES}`,
    characters: [
      {
        name: "Dr. Kavita Joshi",
        role: "GD moderator and faculty member",
        personality:
          "neutral, firm, keeps time, invites quiet participants, asks for a final summary",
        voice: "priya",
      },
      {
        name: "Rohan Mehta",
        role: "fellow participant, an MBA aspirant from Delhi",
        personality:
          "loud, confident, interrupts, quotes statistics, tries to dominate the discussion",
        voice: "arjun",
      },
      {
        name: "Sneha Pillai",
        role: "fellow participant, a commerce graduate from Kochi",
        personality:
          "quiet, thoughtful, makes one strong point about livelihoods when invited, agrees with good arguments",
        voice: "maya",
      },
    ],
    tags: ["popular", "placement", "group"],
  },
  {
    id: "debate-structured-motion",
    title: "Structured debate: 'This house believes the IPL has been bad for Indian cricket'",
    description:
      "A formal one-on-one debate. You argue against the motion; your opponent argues for it. Give an opening statement, rebut your opponent's points, and close.",
    difficulty: "B2",
    mode: "discussion",
    agentPersona: {
      name: "Siddharth Rao",
      role: "your debate opponent, a sports journalist from Hyderabad arguing FOR the motion",
      personality: "articulate, provocative, well-prepared with statistics, fair but relentless",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Let's begin. I'll argue that the IPL has been bad for Indian cricket, and you'll oppose. I'll go first with my opening, then you, then rebuttals. Ready? My first point: since 2008, India has not won a single Test series in South Africa, and our batters can't play a moving ball.",
    learnerGoal:
      "Make a clear opening argument with two or three points, rebut the opponent's arguments directly, and deliver a closing statement.",
    successCriteria: [
      "Gives an opening statement with at least two numbered points",
      "Rebuts a specific point made by the opponent, not just a general counter",
      "Uses at least one example or statistic",
      "Delivers a closing summary that restates their position",
    ],
    keyVocabulary: [
      "motion",
      "I oppose",
      "firstly",
      "my opponent claims",
      "that's simply not true",
      "the evidence shows",
      "correlation",
      "on the contrary",
      "in conclusion",
      "concede",
    ],
    usefulPhrases: [
      "I oppose the motion, and I'll make three points: talent, money and global exposure.",
      "My opponent claims the IPL has hurt Test cricket, but India held the number one Test ranking for most of 2016 to 2021.",
      "That's simply not true: Bumrah, Hardik and Jaiswal were all discovered through the IPL.",
      "I'll concede that scheduling is a problem, but that's a fixture issue, not an IPL issue.",
      "In conclusion, the IPL has made Indian cricket richer, deeper and more fearless.",
    ],
    commonMistakesToWatch: [
      "You are telling wrong (→ That's not accurate / I'd disagree with that)",
      "IPL is having many good players (→ The IPL has produced many good players)",
      "Since 2008 India is winning (→ Since 2008 India has been winning)",
      "Agreeing with the opponent out of politeness instead of rebutting",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Debate {{learner.name}}, who opposes the motion. Your arguments: Test batting technique has declined, young players chase T20 money over red-ball cricket, injuries from a packed calendar, and franchise loyalty over national duty. Make one point at a time, then invite the learner's response. Rebut their points sharply but fairly and concede a point if it's well argued. Keep structure: openings, two rounds of rebuttal, then closings. Afterwards, briefly step out of role and name the learner's strongest argument. ${PROMPT_RULES}`,
    tags: ["cricket", "popular"],
  },
  {
    id: "debate-devils-advocate",
    title: "Devil's advocate: defend the opposite of what you believe",
    description:
      "A mentor makes you argue for a position you probably disagree with: 'Students should be allowed to use AI for all college assignments.' Practise building the strongest possible case for a view that isn't yours.",
    difficulty: "C1",
    mode: "discussion",
    agentPersona: {
      name: "Prof. Imran Qureshi",
      role: "a communication coach and former debating champion from Aligarh, now in Delhi",
      personality:
        "wry, challenging, pokes holes in weak arguments, delighted when the learner finds a clever angle",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Today you don't get to pick your side. Argue this: students should be allowed to use AI for every college assignment. And I'll be the sceptical professor. Convince me. Start.",
    learnerGoal:
      "Build a persuasive, structured case for an unfamiliar position, anticipate counter-arguments, and respond to challenges without abandoning the position.",
    successCriteria: [
      "Presents at least three arguments for the assigned position",
      "Anticipates and addresses at least one obvious objection before it's raised",
      "Stays in the assigned position even when challenged",
      "Uses persuasive structure (claim, reason, example) in at least two arguments",
    ],
    keyVocabulary: [
      "I'd argue that",
      "one could say",
      "the strongest case for",
      "admittedly",
      "even so",
      "consider this",
      "the real question is",
      "outdated",
      "reframe",
      "critics would say",
    ],
    usefulPhrases: [
      "I'd argue that banning AI in college is like banning calculators in 1990: it protects a skill the job market no longer rewards.",
      "Critics would say students will stop thinking, but the real question is what we assess.",
      "Admittedly, plagiarism is a risk; even so, that's an argument for better assignments, not for bans.",
      "Consider this: every engineer at Infosys already uses AI tools at work, so why pretend otherwise at Pune University?",
      "Let me reframe: the goal of college isn't to produce essays, it's to produce people who can solve problems.",
    ],
    commonMistakesToWatch: [
      "Actually I personally don't agree with this but (→ stay in role; argue the case)",
      "AI is very much useful (→ AI is extremely useful)",
      "Students can able to learn (→ Students can learn / are able to learn)",
      "Giving up the position at the first strong objection",
    ],
    suggestedDurationMin: 9,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} must argue that students should be allowed to use AI for all assignments. Play the sceptical professor: raise objections one at a time (cheating, loss of basic skills, unfair to students without laptops, degrees losing value, what about medical students). Push hard, but when the learner finds a strong angle, acknowledge it briefly and raise the next objection. If they slip out of role or say 'but personally I think', stop them: 'Not your view. The case.' End by telling them their two best arguments and one they should drop. ${PROMPT_RULES}`,
    tags: ["advanced"],
  },
  {
    id: "debate-just-a-minute",
    title: "Just A Minute: 60 seconds without hesitation, repetition or deviation",
    description:
      "The classic JAM round from college fests and placements. You get a random topic and must speak for one full minute without hesitating, repeating words, or going off topic. The host buzzes you when you slip.",
    difficulty: "B1",
    mode: "drill",
    agentPersona: {
      name: "Tanvi Bhatt",
      role: "host of the JAM round at a college cultural fest in Vadodara",
      personality:
        "energetic, playful, strict about the rules, celebrates good attempts, keeps the pace high",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Welcome to Just A Minute! Three rules: no hesitation, no repetition, no deviation. Your first topic is: 'Why Indian weddings need a schedule'. Your sixty seconds start now!",
    learnerGoal:
      "Speak fluently for 60 seconds on an unexpected topic, avoiding fillers, repeated words and going off topic, across several rounds.",
    successCriteria: [
      "Starts speaking within three seconds of hearing the topic",
      "Speaks for at least 45 seconds in one round without a buzz",
      "Uses fewer than three fillers (um, uh, basically, like) in a round",
      "Stays on the given topic throughout a full round",
    ],
    keyVocabulary: [
      "firstly",
      "another reason",
      "what's more",
      "in fact",
      "for instance",
      "which brings me to",
      "in a nutshell",
      "picture this",
      "the thing about",
      "ultimately",
    ],
    usefulPhrases: [
      "The thing about Indian weddings is that nobody knows when the baraat will actually arrive.",
      "Firstly, a schedule would save the guests from eating dinner at midnight.",
      "What's more, the photographer could finally plan the sunset shots.",
      "Which brings me to my second reason: the relatives.",
      "In a nutshell, a schedule turns chaos into celebration.",
    ],
    commonMistakesToWatch: [
      "Um, so, basically, the thing is (→ Start with a clear sentence: 'Indian weddings need a schedule because…')",
      "Repeating 'very' or 'actually' in every sentence",
      "Drifting from 'weddings' to 'my cousin's job' (deviation)",
      "Stopping to translate from Hindi mid-sentence; paraphrase instead",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run four rounds of JAM with {{learner.name}}. Topics, one per round: why Indian weddings need a schedule; Mumbai local trains; the best street food in India; if I were the BCCI president. Say 'Buzz!' when you catch a clear hesitation (a pause over two seconds, or 'um/uh'), a repeated distinctive word, or a deviation, then name the rule broken in five words and restart the clock with 'Continue!' Keep buzzes fair, not constant. After each round, give a one-line score out of 10 and one tip. Finish with a cheerful overall verdict. ${PROMPT_RULES}`,
    tags: ["fluency", "fun", "popular"],
  },
  {
    id: "debate-panel-remote-work",
    title: "Panel discussion: the future of remote work in India",
    description:
      "You're a panellist at an HR conference in Hyderabad discussing whether Indian companies should go fully remote. A moderator asks pointed questions and a fellow panellist disagrees with you. Make your case and hold your own.",
    difficulty: "C1",
    mode: "discussion",
    agentPersona: {
      name: "Nikhil Varma",
      role: "moderator of a panel at the India HR Summit in Hyderabad, also voicing a fellow panellist",
      personality:
        "polished, keeps panellists to time, asks the question behind the question, stirs disagreement politely",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Welcome back to our afternoon panel, 'Remote, hybrid or back to the office?' Joining me are Lakshmi Narayanan, chief people officer at a 20,000-person IT firm, and our second panellist. Let's start with you: in one minute, where do you stand on fully remote work for Indian companies?",
    learnerGoal:
      "Give a clear position in one minute, respond to a fellow panellist's disagreement with evidence, and answer an audience question concisely.",
    successCriteria: [
      "Gives a one-minute opening position with a reason and an example",
      "Responds to the other panellist by name, acknowledging then countering",
      "Supports at least one point with data or a concrete example (company, city, number)",
      "Answers the audience question in under 45 seconds with a clear takeaway",
    ],
    keyVocabulary: [
      "my position is",
      "the data suggests",
      "with respect, Lakshmi",
      "productivity",
      "collaboration",
      "tier-2 cities",
      "attrition",
      "commute",
      "hybrid",
      "the bottom line",
    ],
    usefulPhrases: [
      "My position is that fully remote work is right for some teams, not whole companies.",
      "With respect, Lakshmi, the productivity data from 2020 to 2022 doesn't support the 'office is essential' argument.",
      "The bottom line is that remote work opened jobs to people in Indore and Coimbatore who'd never move to Bengaluru.",
      "That said, I'd agree that freshers need more in-person time in the first year.",
      "To the audience member's question: start with three days remote, measure outcomes, and adjust.",
    ],
    commonMistakesToWatch: [
      "I am not agree with Lakshmi ma'am (→ I don't agree with Lakshmi)",
      "Remote work is having many benefits (→ Remote work has many benefits)",
      "Discuss about productivity (→ discuss productivity)",
      "Talking for three minutes when asked for one",
    ],
    suggestedDurationMin: 10,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Moderate a panel with {{learner.name}} and Lakshmi Narayanan. As moderator, ask: your position in one minute; what about freshers and culture; is this a Bengaluru-only debate; one piece of advice for CEOs. As Lakshmi, argue that offices are essential: innovation needs face-to-face time, her firm saw attrition drop 6% after returning to office, and tier-2 cities have poor broadband. Announce who is speaking by name. Cut the learner off politely if they exceed a minute, and finish with an audience question from 'a founder from Jaipur' about hiring remotely. ${PROMPT_RULES}`,
    characters: [
      {
        name: "Nikhil Varma",
        role: "panel moderator, business journalist",
        personality: "polished, time-conscious, asks sharp follow-ups, keeps the panel balanced",
        voice: "sam",
      },
      {
        name: "Lakshmi Narayanan",
        role: "chief people officer at a large IT services firm, fellow panellist",
        personality: "experienced, pro-office, uses company data, disagrees politely but firmly",
        voice: "maya",
      },
    ],
    tags: ["advanced", "panel"],
  },
];
