"""Pydantic mirrors of packages/shared/schemas/*.schema.json.

These models are the runtime contract between the agent and the web app. A test
validates the shared fixtures against them so the two sides cannot drift silently.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Difficulty = Literal["A2", "B1", "B2", "C1"]
ScenarioMode = Literal["roleplay", "discussion", "interview", "drill", "free_talk"]
CoachingMode = Literal["immersive", "gentle", "active", "strict", "drill"]
Cefr = Literal["A1", "A2", "B1", "B2", "C1", "C2"]
GrammarCategory = Literal[
    "tense",
    "article",
    "preposition",
    "subject_verb",
    "word_order",
    "plural",
    "modal",
    "conditional",
    "other",
]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ───────────────────────────── Scenario ─────────────────────────────


class Persona(_Strict):
    name: str
    role: str
    personality: str
    accent: str


class Character(_Strict):
    name: str
    role: str
    personality: str
    voice: str


class Scenario(_Strict):
    id: str
    themeId: str
    title: str
    description: str
    difficulty: Difficulty
    mode: ScenarioMode
    agentPersona: Persona
    agentOpeningLine: str
    learnerGoal: str
    successCriteria: list[str]
    keyVocabulary: list[str]
    usefulPhrases: list[str]
    commonMistakesToWatch: list[str]
    suggestedDurationMin: int = Field(ge=2, le=30)
    systemPromptTemplate: str
    characters: list[Character] | None = None
    tags: list[str] | None = None


# ───────────────────────────── Analysis report ─────────────────────────────


class JudgedMetric(_Strict):
    score: float = Field(ge=0, le=100)
    band: Cefr
    evidence: list[str]
    comment: str


class CommunicationMetric(JudgedMetric):
    structure: float = Field(ge=0, le=100)
    conciseness: float = Field(ge=0, le=100)
    activeListening: float = Field(ge=0, le=100)
    register: float = Field(ge=0, le=100)
    assertiveness: float = Field(ge=0, le=100)
    questionAsking: float = Field(ge=0, le=100)
    empathy: float = Field(ge=0, le=100)
    persuasiveness: float = Field(ge=0, le=100)
    hedging: float = Field(ge=0, le=100)


class InterviewMetric(_Strict):
    answerStructure: float = Field(ge=0, le=100)
    relevance: float = Field(ge=0, le=100)
    redFlags: list[str]
    hireability: float = Field(ge=0, le=100)
    reasons: str


class IeltsMetric(_Strict):
    fluencyCoherence: float
    lexicalResource: float
    grammaticalRange: float
    pronunciation: float
    overall: float


class Judged(_Strict):
    grammar: JudgedMetric
    vocabulary: JudgedMetric
    fluency: JudgedMetric
    pronunciation: JudgedMetric
    taskAchievement: JudgedMetric
    communication: CommunicationMetric
    interview: InterviewMetric | None = None
    ielts: IeltsMetric | None = None


class GrammarError(_Strict):
    quote: str
    correction: str
    category: GrammarCategory
    explanation: str
    severity: int = Field(ge=1, le=3)
    atMs: int | None = None


class WpmPoint(_Strict):
    minute: int
    wpm: float


class PauseItem(_Strict):
    atMs: int
    durationMs: int


class Pauses(_Strict):
    over500ms: int
    over1500ms: int
    over3000ms: int
    totalPauseSec: float
    list: list[PauseItem]


class FillerHit(_Strict):
    word: str
    atMs: int


class Fillers(_Strict):
    per100Words: float
    total: int
    byWord: dict[str, int]
    hits: list[FillerHit]


class Repetitions(_Strict):
    count: int
    falseStarts: int
    selfCorrections: int
    examples: list[str]


class OverusedWord(_Strict):
    word: str
    count: int


class VocabularyStats(_Strict):
    totalWords: int
    uniqueWords: int
    ttr: float
    mattr: float
    avgWordLength: float
    pctTop1k: float
    pctTop2k: float
    pctTop5k: float
    estimatedLevel: Cefr
    advancedWords: list[str]
    overusedWords: list[OverusedWord]


class SentenceStats(_Strict):
    count: int
    avgLength: float
    pctQuestions: float
    pctComplex: float


class WordFlag(_Strict):
    word: str
    confidence: float
    atMs: int
    phoneme: str | None = None


class HistogramBucket(_Strict):
    bucket: str
    count: int


class L1Flag(_Strict):
    phoneme: str
    words: list[str]


class PronunciationStats(_Strict):
    meanConfidence: float
    lowConfidenceWords: list[WordFlag]
    confidenceHistogram: list[HistogramBucket]
    l1Flags: list[L1Flag]


class CodeSwitchItem(_Strict):
    text: str
    atMs: int
    suggestion: str | None = None


class CodeSwitches(_Strict):
    count: int
    list: list[CodeSwitchItem]


class TurnTaking(_Strict):
    userTurns: int
    agentTurns: int
    avgUserTurnSec: float
    avgUserTurnWords: float
    interruptionsMade: int
    interruptionsReceived: int
    hintsUsed: int


class Deterministic(_Strict):
    speakingTimeSec: float
    agentSpeakingTimeSec: float
    talkSharePct: float
    wpm: float
    wpmSeries: list[WpmPoint]
    pauses: Pauses
    meanResponseLatencyMs: float
    fillers: Fillers
    repetitions: Repetitions
    vocabulary: VocabularyStats
    sentences: SentenceStats
    pronunciation: PronunciationStats
    codeSwitches: CodeSwitches
    turnTaking: TurnTaking


class Skills(_Strict):
    grammar: float = Field(ge=0, le=100)
    vocabulary: float = Field(ge=0, le=100)
    fluency: float = Field(ge=0, le=100)
    pronunciation: float = Field(ge=0, le=100)
    coherence: float = Field(ge=0, le=100)
    taskAchievement: float = Field(ge=0, le=100)
    communication: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=100)


class Rewrite(_Strict):
    original: str
    better: str
    why: str


class Strength(_Strict):
    title: str
    example: str


class Priority(_Strict):
    title: str
    example: str
    fix: str


class TaskCriterion(_Strict):
    criterion: str
    met: bool
    evidence: str


class RecommendedDrill(_Strict):
    scenarioId: str
    reason: str


class VocabBankEntry(_Strict):
    word: str
    definition: str
    example: str
    ipa: str | None = None
    partOfSpeech: str | None = None


class AnalysisReport(_Strict):
    sessionId: str
    overall: float = Field(ge=0, le=100)
    cefr: Cefr
    confidenceIndex: float = Field(ge=0, le=100)
    skills: Skills
    deterministic: Deterministic
    judged: Judged
    grammarErrors: list[GrammarError]
    rewrites: list[Rewrite] = Field(max_length=10)
    strengths: list[Strength] = Field(max_length=3)
    priorities: list[Priority] = Field(max_length=3)
    taskCriteria: list[TaskCriterion]
    recommendedDrills: list[RecommendedDrill] = Field(max_length=3)
    vocabBank: list[VocabBankEntry]
    summary: str
    deltas: dict[str, float] | None = None


# ───────────────────────────── Dispatch metadata ─────────────────────────────


class SessionDispatchMetadata(BaseModel):
    """What the web app sends when it dispatches the agent (mirrors shared/constants.ts)."""

    model_config = ConfigDict(extra="ignore")

    sessionId: str
    scenarioId: str | None = None
    coachingMode: CoachingMode = "gentle"
    difficulty: Difficulty = "B1"
    voice: str = "priya"
    speed: float = 1.0
    durationMin: int | None = None
    customScenario: Scenario | None = None
