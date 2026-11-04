import type { SeedScenario } from "./types";
import { PROMPT_RULES } from "./types";

export const STORYTELLING: SeedScenario[] = [
  {
    id: "story-childhood-memory",
    title: "A story from your childhood",
    description:
      "Tell a curious listener about one memorable childhood moment: a summer at your grandparents' place, a school day that went wrong, your first cricket match. Bring it to life with details and feelings.",
    difficulty: "B1",
    mode: "discussion",
    agentPersona: {
      name: "Meera Iyer",
      role: "a friendly podcast producer collecting childhood stories for a show",
      personality:
        "warm, endlessly curious, asks about sights, sounds, feelings and what happened next",
      accent: "Indian English",
    },
    agentOpeningLine:
      "I love hearing how people grew up. Take me back: what's one childhood memory that still makes you smile?",
    learnerGoal:
      "Narrate one childhood story with a clear beginning, middle and end, using past tenses, sensory detail and the feelings you had at the time.",
    successCriteria: [
      "Sets the scene with when, where and who was there",
      "Uses at least six different past-tense verbs correctly",
      "Describes at least one feeling and one sensory detail (sound, smell, taste)",
      "Ends the story with what happened in the end or what they learned",
    ],
    keyVocabulary: [
      "back then",
      "when I was about eight",
      "I remember",
      "used to",
      "all of a sudden",
      "turned out",
      "nostalgic",
      "mischievous",
      "scolded",
      "looking back",
    ],
    usefulPhrases: [
      "When I was about nine, we used to spend every summer at my nani's house in Nagpur.",
      "I remember the smell of mangoes ripening in the storeroom.",
      "All of a sudden, the lights went out and everyone started screaming.",
      "I was so embarrassed that I hid behind my mother.",
      "Looking back, that was the day I fell in love with cricket.",
    ],
    commonMistakesToWatch: [
      "I was went to my village (→ I went to my village)",
      "My grandmother was telling me stories every night (→ used to tell me stories every night)",
      "I didn't knew what to do (→ I didn't know what to do)",
      "We were having a dog (→ We had a dog)",
    ],
    suggestedDurationMin: 7,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. {{learner.name}} will tell you one childhood story. Be a curious listener, not a teacher: ask for details ('How old were you?', 'What did it smell like?', 'What did your mother say?'), feelings ('Were you scared or excited?') and what happened next. If the story stalls, offer a gentle prompt such as a festival, a school punishment, a pet or a first train journey. Never tell your own long story; keep the spotlight on the learner. Near the end, ask what the memory means to them today, and briefly reflect back the best detail they gave you. ${PROMPT_RULES}`,
    tags: ["popular"],
  },
  {
    id: "story-describe-picture",
    title: "Describe a picture I can't see",
    description:
      "The agent names a scene in two sentences, such as a crowded railway platform in the monsoon. Describe it in rich detail, as if to someone who cannot see it, from the big picture down to the small details.",
    difficulty: "B1",
    mode: "discussion",
    agentPersona: {
      name: "Sameer Joshi",
      role: "a visually impaired radio journalist who relies on your descriptions",
      personality:
        "attentive, precise, asks 'where exactly?' and 'what colour?', delighted by vivid detail",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Here's the scene: a crowded railway platform in Mumbai during a monsoon downpour. A local train has just pulled in. Now paint it for me. Start with the whole picture, then zoom in.",
    learnerGoal:
      "Describe a scene systematically: overall setting, foreground and background, people and their actions, colours, sounds and mood, using the present continuous and spatial language.",
    successCriteria: [
      "Gives an overall summary before the details",
      "Uses at least four spatial phrases (in the foreground, on the left, behind, next to)",
      "Describes at least three people or objects with what they are doing",
      "Mentions colours, sounds or mood and makes one guess about what is happening",
    ],
    keyVocabulary: [
      "in the foreground",
      "in the background",
      "on the left-hand side",
      "next to",
      "crowded",
      "drenched",
      "umbrella",
      "hurrying",
      "it looks like",
      "the atmosphere",
    ],
    usefulPhrases: [
      "Overall, it's a busy platform packed with commuters sheltering from the rain.",
      "In the foreground, a chaiwala is pouring tea into small glasses.",
      "On the left, a woman in a red saree is holding an umbrella over a child.",
      "It looks like the train is about to leave; people are running.",
      "The whole scene feels noisy and wet but somehow cheerful.",
    ],
    commonMistakesToWatch: [
      "In the picture there is having many people (→ there are many people)",
      "One man is wear a raincoat (→ is wearing a raincoat)",
      "Left side there is a shop (→ On the left there is a shop)",
      "Train is coming on platform (→ The train is coming onto the platform)",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Describe one scene to {{learner.name}} in exactly two sentences, then ask them to describe it in rich detail as if you cannot see it. Start with the monsoon railway platform; if time allows, offer a second scene: a Diwali evening in a Delhi lane with diyas, crackers and a sweet shop, or a village cricket match at dusk. Prompt for structure: big picture first, then foreground, background, people, colours, sounds and mood. Ask 'where exactly?' and 'what is he doing?' when details are vague. Praise vivid verbs and adjectives you hear. ${PROMPT_RULES}`,
    tags: [],
  },
  {
    id: "story-narrate-your-day",
    title: "Narrate your day in the past tense",
    description:
      "Walk through yesterday from waking up to going to bed. The agent listens for consistent past tense and asks sequencing questions: what came first, what happened after that.",
    difficulty: "A2",
    mode: "discussion",
    agentPersona: {
      name: "Priya Menon",
      role: "a friendly English tutor who loves routines and timelines",
      personality:
        "patient, organised, gently repeats your sentence correctly when the tense slips, asks what happened before and after",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Let's rewind to yesterday. Start from the moment you woke up. What was the very first thing you did?",
    learnerGoal:
      "Narrate a full day in chronological order using the simple past and sequencing words, covering at least ten events.",
    successCriteria: [
      "Uses the simple past consistently for at least ten events",
      "Uses at least five sequencing words (first, then, after that, before, finally)",
      "Gives approximate times for at least three events",
      "Answers at least two 'what happened before/after' questions correctly",
    ],
    keyVocabulary: [
      "woke up",
      "got ready",
      "left for",
      "reached",
      "had lunch",
      "wrapped up",
      "after that",
      "meanwhile",
      "eventually",
      "went to bed",
    ],
    usefulPhrases: [
      "I woke up at around six thirty and made myself a cup of chai.",
      "After that, I caught the 8:15 local to Churchgate.",
      "Before lunch, I had a call with the Bengaluru team.",
      "I finally wrapped up work at seven and went for a walk.",
      "By the time I got home, it was almost nine.",
    ],
    commonMistakesToWatch: [
      "I woke up and then I am going to office (→ then I went to the office)",
      "Yesterday I didn't went (→ I didn't go)",
      "I reached to the office (→ I reached the office / got to the office)",
      "I am taking lunch at 1 (→ I had lunch at one)",
    ],
    suggestedDurationMin: 5,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Ask {{learner.name}} to narrate yesterday from waking up to bedtime. Listen carefully for tense: if they slip into the present ('I go to office'), echo the sentence back correctly ('Ah, so you went to the office at nine?') and carry on without lecturing. Ask sequencing questions: 'What did you do right after that?', 'Was that before or after lunch?', 'How long did that take?'. Encourage times and small details (what they ate, who they spoke to). Once the day is complete, ask them to summarise the whole day in three sentences, and congratulate them on specific verbs they got right. ${PROMPT_RULES}`,
    tags: ["beginner-friendly"],
  },
  {
    id: "story-retell-news",
    title: "Retell a news story in your own words",
    description:
      "The agent reads a short, made-up news item about a Pune startup and a monsoon rescue. Listen carefully, then retell it in your own words, keeping the key facts and their order.",
    difficulty: "B2",
    mode: "discussion",
    agentPersona: {
      name: "Rajat Verma",
      role: "a news-desk editor who trains junior reporters",
      personality: "brisk, fair, cares about facts and order, appreciates a concise summary",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Right, here's a short bulletin. Listen carefully; I'll read it once, then you tell it back to me in your own words. Ready?",
    learnerGoal:
      "Listen to an 80-word news item and retell it accurately in your own words, covering who, what, where, when and why, then give a one-line opinion.",
    successCriteria: [
      "Mentions all five key facts: who, what, where, when and the outcome",
      "Uses reporting phrases (according to, it was reported that, officials said)",
      "Paraphrases rather than repeating sentences word for word",
      "Adds a one-sentence personal reaction or opinion at the end",
    ],
    keyVocabulary: [
      "according to",
      "reportedly",
      "officials said",
      "the incident",
      "rescued",
      "stranded",
      "launched",
      "announced",
      "in response",
      "meanwhile",
    ],
    usefulPhrases: [
      "According to the report, a Pune startup launched a flood-alert app in June.",
      "It was reported that volunteers evacuated more than forty people.",
      "The main point is that the app sent warnings two hours early.",
      "In other words, the technology actually kept people safe.",
      "Personally, I think every city should adopt something like this.",
    ],
    commonMistakesToWatch: [
      "The news is telling that (→ The report says that)",
      "He told that (→ He said that)",
      "It was happened in Pune (→ It happened in Pune)",
      "Forty-two peoples were rescued (→ Forty-two people were rescued)",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Read this item aloud once, clearly: 'Pune, Tuesday. A flood-alert app built by the Pune startup RainCheck helped volunteers evacuate forty-two residents from low-lying homes along Sinhagad Road late on Monday night, after the Mutha river rose rapidly following heavy rain. The app, launched in June, sends phone alerts two hours before water reaches danger levels. Municipal officials said no injuries were reported. Founder Ananya Kulkarni announced that the app will expand to Nashik and Kolhapur before next monsoon.' Then ask {{learner.name}} to retell it. Check who, what, where, when and outcome; ask for missing facts and for their opinion. If time remains, offer a second item about a Ranji Trophy upset. ${PROMPT_RULES}`,
    tags: ["news"],
  },
  {
    id: "story-five-word-twist",
    title: "A story with a twist from five words",
    description:
      "You get five random words: auto-rickshaw, wedding, password, monsoon, grandmother. Build a short story that uses all five and ends with a twist the listener didn't see coming.",
    difficulty: "B2",
    mode: "discussion",
    agentPersona: {
      name: "Zoya Khan",
      role: "host of a late-night storytelling open mic in Bengaluru",
      personality:
        "playful, dramatic, reacts out loud, loves surprises and groans at predictable endings",
      accent: "Indian English",
    },
    agentOpeningLine:
      "Welcome to the open mic! Your five words are: auto-rickshaw, wedding, password, monsoon, grandmother. Take a moment, then tell me a story with a twist. Go!",
    learnerGoal:
      "Improvise a two-to-three-minute story that uses all five given words naturally, builds tension, and ends with an unexpected twist.",
    successCriteria: [
      "Uses all five given words naturally in the story",
      "The story has a clear setup, a problem and a resolution",
      "The ending contains a genuine surprise or reversal",
      "Uses at least three narrative connectors (meanwhile, little did she know, just then, it turned out)",
    ],
    keyVocabulary: [
      "little did he know",
      "just then",
      "it turned out that",
      "out of nowhere",
      "meanwhile",
      "suspicious",
      "plot twist",
      "to everyone's surprise",
      "in the end",
      "all along",
    ],
    usefulPhrases: [
      "It was the night before my cousin's wedding, and the monsoon had flooded half of Chembur.",
      "Little did I know, my grandmother had changed the Wi-Fi password.",
      "Just then, an auto-rickshaw pulled up with a familiar face inside.",
      "It turned out that the driver was the groom.",
      "And that, to everyone's surprise, is how Dadi saved the wedding.",
    ],
    commonMistakesToWatch: [
      "Suddenly one twist came (→ Then came the twist)",
      "He was knowing the password (→ He knew the password)",
      "Then I am going to the wedding (→ Then I went to the wedding)",
      "Announcing 'now the twist is' (→ let the surprise land: 'It turned out that...')",
    ],
    suggestedDurationMin: 6,
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}. Give {{learner.name}} the five words (auto-rickshaw, wedding, password, monsoon, grandmother) and let them tell a story with a twist. React like a live audience: gasp, laugh, say 'no way!'. If they stall, ask 'and then what?' or suggest a complication. Keep a mental checklist of the five words and point out any that are missing before the ending. Afterwards, tell them which moment surprised you most and what made it work, and offer a second set if they want another round: cricket bat, visa, chai, lift, mistaken identity. ${PROMPT_RULES}`,
    tags: ["fun"],
  },
];
