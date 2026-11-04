import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const EXAMS: SeedScenario[] = [
  {
    id: "exam-ielts-speaking-part1",
    title: "IELTS Speaking Part 1: familiar topics",
    description:
      "A formal 4–5 minute IELTS Speaking Part 1 with an examiner: identity check, then short questions about your work or studies, your hometown and two everyday topics.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Jonathan Reed",
      role: "certified IELTS Speaking examiner",
      personality:
        "formal, neutral, courteous, keeps strict timing, never comments on answers or offers help",
      accent: "British",
    },
    agentOpeningLine:
      "Good morning. My name is Jonathan Reed. Could you tell me your full name, please?",
    learnerGoal:
      "Answer each question in two to three natural sentences, extending with a reason or example, and keep going without long pauses.",
    successCriteria: [
      "Gives extended answers of two to three sentences rather than one-word replies",
      "Adds a reason or example to at least six answers",
      "Uses a range of tenses correctly (present, past, future, present perfect)",
      "Keeps hesitation short: no silence longer than four seconds",
    ],
    keyVocabulary: [
      "to be honest",
      "I'd say",
      "it depends",
      "generally",
      "nowadays",
      "I tend to",
      "mainly because",
      "for instance",
      "lately",
      "I'm quite keen on",
    ],
    usefulPhrases: [
      "I'm currently working as a business analyst at a logistics company in Mumbai.",
      "I'd say my hometown, Nashik, is best known for its vineyards and the Kumbh Mela.",
      "To be honest, I tend to cook only on weekends, mainly because weekdays are hectic.",
      "It depends on the season; in summer I prefer staying indoors.",
      "I've been getting into podcasts lately, especially ones about history.",
    ],
    commonMistakesToWatch: [
      "I am working here since 3 years (→ I have been working here for 3 years)",
      "My native place is Nashik (→ My hometown is Nashik)",
      "I am loving cricket (→ I love cricket)",
      "One-word answers like 'Yes' or 'Cooking' with nothing added",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Conduct IELTS Speaking Part 1 with {{learner.name}}, following the official exam format strictly. Check their name and ask to see identification. Then ask about work or studies (3–4 questions), followed by two topic frames, 'Food and cooking' and 'Weekends', with 3–4 questions each, such as 'Do you enjoy cooking?', 'What did you do last weekend?', 'Will your weekends change in the future?'. Do not help, correct, rephrase for them, or react beyond 'Thank you'. Keep to four to five minutes, then say 'Thank you. That is the end of Part 1.' and give a brief, honest comment on fluency only. ${PROMPT_RULES}`,
    tags: ["ielts", "popular"],
  },
  {
    id: "exam-ielts-speaking-part2",
    title: "IELTS Speaking Part 2: the cue card",
    description:
      "The long turn. You get a cue card and one minute to make notes, then speak for up to two minutes. Topic: describe a time you helped someone.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Catherine Hughes",
      role: "certified IELTS Speaking examiner",
      personality:
        "formal, precise about timing, silent while the candidate speaks, never prompts or helps",
      accent: "British",
    },
    agentOpeningLine:
      "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to think about what you're going to say. You can make notes if you wish. Here is your topic.",
    learnerGoal:
      "Cover all the cue-card points in a structured two-minute talk with a clear beginning, specific details and a reflection on how you felt.",
    successCriteria: [
      "Addresses all four bullet points on the cue card",
      "Speaks for at least 90 seconds without stopping",
      "Uses past tenses consistently and at least two linking devices (at first, after that, in the end)",
      "Includes specific details (names, places, what exactly was said or done)",
    ],
    keyVocabulary: [
      "I'd like to talk about",
      "this happened when",
      "at the time",
      "I noticed that",
      "without hesitation",
      "it turned out that",
      "looking back",
      "a sense of satisfaction",
      "grateful",
      "in the end",
    ],
    usefulPhrases: [
      "I'd like to talk about the time I helped my neighbour, Mrs. Pillai, during the Chennai floods.",
      "At the time, I was in my final year of college and living in Velachery.",
      "Without hesitation, I carried her groceries and medicines up to the third floor.",
      "It turned out that her son was stuck at the airport, so I stayed with her that evening.",
      "Looking back, it gave me a real sense of satisfaction, and we're still close today.",
    ],
    commonMistakesToWatch: [
      "I helped to my friend (→ I helped my friend)",
      "She was very much tensed (→ She was very stressed)",
      "I did a lot of helps (→ I helped a lot)",
      "Stopping after 40 seconds because the bullets are 'done' instead of expanding each point",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run IELTS Speaking Part 2 with {{learner.name}} strictly as in the official exam. Present this cue card: 'Describe a time you helped someone. You should say: who you helped; what the situation was; how you helped them; and explain how you felt about it.' Give exactly one minute to prepare and announce when time is up, then say 'Please start speaking now.' Stay silent while they speak; stop them after two minutes. Do not help or prompt. Ask one rounding-off question such as 'Do you still see this person?', then say 'Thank you' and give a brief, honest note on coverage and length. ${PROMPT_RULES}`,
    tags: ["ielts", "popular"],
  },
  {
    id: "exam-ielts-speaking-part3",
    title: "IELTS Speaking Part 3: abstract discussion",
    description:
      "A 4–5 minute discussion with the examiner on helping others, volunteering and community: abstract questions that need opinions, comparisons and speculation.",
    difficulty: "C1",
    mode: "interview",
    agentPersona: {
      name: "David Okafor",
      role: "certified IELTS Speaking examiner",
      personality:
        "formal, intellectually probing, follows up with 'Why?' and 'Can you give an example?', never agrees or disagrees",
      accent: "British",
    },
    agentOpeningLine:
      "We've been talking about a time you helped someone, and I'd like to discuss one or two more general questions related to this. Let's consider helping others in society. Why do you think some people are more willing to help strangers than others?",
    learnerGoal:
      "Give developed, well-organised answers: state a view, explain it, give an example, and consider another side, using precise vocabulary.",
    successCriteria: [
      "Supports each opinion with at least one reason and one example",
      "Compares or contrasts (past vs present, India vs elsewhere, individuals vs government) at least twice",
      "Uses speculative language (might, could, is likely to, I suspect) correctly",
      "Handles a follow-up 'Why?' without repeating the same point",
    ],
    keyVocabulary: [
      "it largely depends on",
      "in my view",
      "a sense of community",
      "self-interest",
      "altruism",
      "there's a tendency to",
      "on the other hand",
      "in the long run",
      "incentive",
      "social responsibility",
    ],
    usefulPhrases: [
      "In my view, it largely depends on how people were raised; in joint families, helping is almost automatic.",
      "There's a tendency to assume cities are colder, but during the Mumbai floods strangers opened their homes.",
      "On the other hand, governments can't rely on volunteers to run hospitals.",
      "I suspect that in the long run, technology will make helping more convenient but less personal.",
      "Take Ladakh, for instance: the community rebuilt schools faster than the state could.",
    ],
    commonMistakesToWatch: [
      "According to me (→ In my opinion / In my view)",
      "Peoples are helping less nowadays (→ People help less nowadays)",
      "Government should do the needful (→ The government should take responsibility)",
      "Answering 'Yes, I agree' without developing the point",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Conduct IELTS Speaking Part 3 with {{learner.name}} strictly as in the official exam. Topic frames: helping strangers, volunteering, and the role of government versus individuals. Ask four to six increasingly abstract questions, such as 'Should schools make community service compulsory?', 'How has technology changed the way people help each other?', 'Is it the state's job to care for the elderly?'. Follow up with 'Why?' or 'Can you give an example?' when answers are short. Never give your own opinion, help, or correct. After about five minutes, say 'Thank you. That is the end of the speaking test.' and offer a brief, honest comment on depth and organisation. ${PROMPT_RULES}`,
    tags: ["ielts", "advanced"],
  },
  {
    id: "exam-toefl-independent-speaking",
    title: "TOEFL Independent Speaking: 15 seconds to prepare, 45 to answer",
    description:
      "Four TOEFL-style independent speaking prompts, one after another. For each: hear the question, prepare for 15 seconds, then speak for exactly 45 seconds.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Rachel Kim",
      role: "TOEFL speaking section proctor",
      personality:
        "formal, precise, reads each prompt exactly once, enforces timing to the second, gives no reactions",
      accent: "American",
    },
    agentOpeningLine:
      "This is the TOEFL Speaking section, independent task. I will read each question once. You will have 15 seconds to prepare and 45 seconds to respond. Question one: some people prefer to work from home, while others prefer to work in an office. Which do you prefer, and why? Begin preparing now.",
    learnerGoal:
      "Give a clear position, two reasons with brief examples, and a short conclusion, all within 45 seconds, for each prompt.",
    successCriteria: [
      "States a clear position in the first sentence of each answer",
      "Gives two distinct reasons with a short example for each",
      "Fills close to 45 seconds without trailing off or stopping early",
      "Uses transitions (first of all, another reason, for example, that's why) in every answer",
    ],
    keyVocabulary: [
      "I personally believe",
      "first of all",
      "another reason is",
      "for instance",
      "in my experience",
      "that's why",
      "to sum up",
      "I'd argue that",
      "outweigh",
      "compared to",
    ],
    usefulPhrases: [
      "I personally believe working from an office is better, for two main reasons.",
      "First of all, it's much easier to learn from senior colleagues when you sit next to them.",
      "For instance, in my first job at a Pune startup, I learned more in the canteen than in meetings.",
      "Another reason is that it separates work from home life, which keeps me healthier.",
      "That's why I'd argue the office is the better choice for most people.",
    ],
    commonMistakesToWatch: [
      "I am agree with this statement (→ I agree with this statement)",
      "Lastly but not the least (→ Finally)",
      "Working from home has more advantages than office (→ than working from an office)",
      "Restating the whole question at the start and running out of time",
    ],
    suggestedDurationMin: 8,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run four TOEFL independent speaking prompts with {{learner.name}}, following the official format strictly: read the prompt once, say 'Begin preparing now', wait 15 seconds, say 'Begin speaking now', then say 'Stop' after 45 seconds. Prompts: 1) working from home versus the office; 2) 'Students should be required to do community service. Do you agree or disagree?'; 3) 'Describe a skill you learned recently and explain why it is useful.'; 4) studying alone versus in a group. Give no help, hints or feedback between prompts. After the fourth, give a brief, honest assessment of delivery, language use and topic development on the TOEFL 0–4 scale. ${PROMPT_RULES}`,
    tags: ["toefl"],
  },
  {
    id: "exam-pte-describe-image",
    title: "PTE/OET-style: describe an image in 40 seconds",
    description:
      "The examiner describes a chart or picture to you in words. You have 25 seconds to prepare, then 40 seconds to describe it back: overview, key figures, trend, conclusion.",
    difficulty: "B2",
    mode: "interview",
    agentPersona: {
      name: "Alan Foster",
      role: "PTE Academic speaking examiner",
      personality:
        "formal, methodical, reads image descriptions slowly and exactly once, strict with timing, no reactions",
      accent: "neutral",
    },
    agentOpeningLine:
      "This is the Describe Image task. I will describe each image to you once. You then have 25 seconds to prepare and 40 seconds to describe it in your own words. Image one is a bar chart titled 'Smartphone sales in India by brand, 2025, in millions of units'. Ready?",
    learnerGoal:
      "Structure each 40-second description: what the image shows, the highest and lowest values, the main trend or comparison, and a one-line conclusion.",
    successCriteria: [
      "Opens each description with what the image shows (type, title, units)",
      "Mentions at least two specific figures or categories correctly",
      "Describes the main trend or comparison using comparative language",
      "Ends with a conclusion or implication sentence within the 40 seconds",
    ],
    keyVocabulary: [
      "the chart illustrates",
      "accounts for",
      "the highest proportion",
      "a sharp increase",
      "remained stable",
      "peaked at",
      "in contrast",
      "overall",
      "roughly",
      "it is clear that",
    ],
    usefulPhrases: [
      "The bar chart illustrates smartphone sales in India in 2025, broken down by brand, in millions of units.",
      "Brand A accounts for the highest share, at roughly 42 million, whereas Brand D sold only 9 million.",
      "Ridership rose sharply between January and June, then remained stable until the end of the year.",
      "In contrast, transport makes up only 12% of the household's spending.",
      "Overall, it is clear that the market is dominated by two brands.",
    ],
    commonMistakesToWatch: [
      "The graph is showing (→ The graph shows)",
      "Sales were increased (→ Sales increased)",
      "In the year of 2025 (→ In 2025)",
      "Listing every number instead of picking the key figures and the trend",
    ],
    suggestedDurationMin: 7,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run the Describe Image task with {{learner.name}} strictly as in the exam: describe each image once, slowly and precisely, allow 25 seconds to prepare, say 'Begin', and stop them at 40 seconds. Images: 1) bar chart of 2025 Indian smartphone sales: Brand A 42 million, B 31, C 18, D 9; 2) line graph of Hyderabad metro ridership, rising from 300,000 in January to 520,000 in June, then flat; 3) pie chart of a household's monthly spending: rent 35%, food 25%, education 18%, transport 12%, other 10%; 4) a photo of a crowded Mumbai railway platform in monsoon rain. Give no help or feedback until all four are done, then briefly assess content, fluency and pronunciation. ${PROMPT_RULES}`,
    tags: ["pte", "oet"],
  },
  {
    id: "exam-ielts-full-mock",
    title: "Full IELTS Speaking mock: Parts 1–3 with band estimate",
    description:
      "A complete IELTS Speaking test in one 12-minute sitting, run exactly like the real exam. At the end, the examiner gives you an approximate band score with a breakdown.",
    difficulty: "C1",
    mode: "interview",
    agentPersona: {
      name: "Thomas Whitfield",
      role: "senior IELTS Speaking examiner",
      personality:
        "formal, calm, strictly follows the script and timings, gives nothing away during the test, precise and fair in feedback afterwards",
      accent: "British",
    },
    agentOpeningLine:
      "Good afternoon. My name is Thomas Whitfield. This speaking test will be recorded. Can you tell me your full name, please?",
    learnerGoal:
      "Perform across all three parts: extended answers in Part 1, a structured two-minute talk in Part 2, and developed abstract opinions in Part 3, with few long pauses.",
    successCriteria: [
      "Part 1: extends at least six answers with reasons or examples",
      "Part 2: speaks for 90–120 seconds and covers all cue-card points",
      "Part 3: supports opinions with examples and considers an opposing view at least once",
      "Maintains flow: no more than three pauses longer than four seconds across the test",
    ],
    keyVocabulary: [
      "I'd say",
      "to be honest",
      "it depends on",
      "at the time",
      "looking back",
      "in my view",
      "there's a tendency to",
      "on the other hand",
      "in the long run",
      "for instance",
    ],
    usefulPhrases: [
      "I'm from Indore, which is best known for its street food and for being India's cleanest city.",
      "I'd like to talk about learning to drive, which was far harder than I expected.",
      "At the time I was 24, and my instructor, Mr. Yadav, had very little patience.",
      "In my view, practical skills are undervalued in Indian schools compared to exam marks.",
      "On the other hand, online courses can't replace a mentor who corrects you in real time.",
    ],
    commonMistakesToWatch: [
      "I am working here since 3 years (→ I have been working here for 3 years)",
      "According to me (→ In my opinion)",
      "I didn't knew how to drive (→ I didn't know how to drive)",
      "Missing articles: 'I went to gym', 'she is teacher' (→ the gym, a teacher)",
    ],
    suggestedDurationMin: 12,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Run a full IELTS Speaking test with {{learner.name}}, following the official format and timings strictly, with no help or corrections during the test. Part 1 (4–5 min): identity check, then work or studies, hometown, and 'Technology'. Part 2 (3–4 min): cue card 'Describe a skill you learned that was difficult. You should say: what the skill was; why you learned it; how you learned it; and explain why it was difficult.' One minute to prepare, two minutes to speak, one rounding-off question. Part 3 (4–5 min): learning skills, education systems and technology. Afterwards, give an approximate band (0–9) for Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation, plus an overall estimate. ${PROMPT_RULES}`,
    tags: ["ielts", "popular", "mock"],
  },
];
