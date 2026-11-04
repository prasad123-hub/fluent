-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('A2', 'B1', 'B2', 'C1');

-- CreateEnum
CREATE TYPE "ScenarioMode" AS ENUM ('roleplay', 'discussion', 'interview', 'drill', 'free_talk');

-- CreateEnum
CREATE TYPE "CoachingMode" AS ENUM ('immersive', 'gentle', 'active', 'strict', 'drill');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('starting', 'live', 'ended', 'analyzing', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "Speaker" AS ENUM ('human', 'agent');

-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('hint', 'correction', 'code_switch', 'interruption', 'tool_call', 'latency', 'good_phrase', 'silence', 'drill_score', 'persona_switch', 'system');

-- CreateEnum
CREATE TYPE "GrammarCategory" AS ENUM ('tense', 'article', 'preposition', 'subject_verb', 'word_order', 'plural', 'modal', 'conditional', 'other');

-- CreateEnum
CREATE TYPE "VocabStatus" AS ENUM ('new', 'learning', 'mastered');

-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('weekly_minutes', 'weekly_sessions', 'target_cefr');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "firstLanguage" TEXT NOT NULL DEFAULT 'Hindi',
    "defaultScenarioId" TEXT,
    "defaultMode" "CoachingMode" NOT NULL DEFAULT 'gentle',
    "defaultDifficulty" "Difficulty" NOT NULL DEFAULT 'B1',
    "defaultVoice" TEXT NOT NULL DEFAULT 'priya',
    "defaultSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defaultDurationMin" INTEGER NOT NULL DEFAULT 10,
    "captionsOn" BOOLEAN NOT NULL DEFAULT true,
    "keyPhrasesOn" BOOLEAN NOT NULL DEFAULT true,
    "pushToTalk" BOOLEAN NOT NULL DEFAULT false,
    "noiseSuppression" BOOLEAN NOT NULL DEFAULT true,
    "recordSessions" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "preflightDone" BOOLEAN NOT NULL DEFAULT false,
    "micDeviceId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "cefr" TEXT NOT NULL DEFAULT 'B1',
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceIndex" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rollingMetrics" JSONB NOT NULL DEFAULT '{}',
    "recurringErrors" JSONB NOT NULL DEFAULT '{}',
    "fillerTrend" JSONB NOT NULL DEFAULT '[]',
    "vocabTrend" JSONB NOT NULL DEFAULT '[]',
    "weakPhonemes" JSONB NOT NULL DEFAULT '[]',
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "priorities" JSONB NOT NULL DEFAULT '[]',
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedOn" TIMESTAMP(3),
    "totalMinutesSpoken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "mode" "ScenarioMode" NOT NULL,
    "personaName" TEXT NOT NULL,
    "personaRole" TEXT NOT NULL,
    "personaPersonality" TEXT NOT NULL,
    "personaAccent" TEXT NOT NULL,
    "agentOpeningLine" TEXT NOT NULL,
    "learnerGoal" TEXT NOT NULL,
    "successCriteria" JSONB NOT NULL,
    "keyVocabulary" JSONB NOT NULL,
    "usefulPhrases" JSONB NOT NULL,
    "commonMistakesToWatch" JSONB NOT NULL,
    "suggestedDurationMin" INTEGER NOT NULL,
    "systemPromptTemplate" TEXT NOT NULL,
    "characters" JSONB,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "scenario" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favourite" (
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("userId","scenarioId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "customScenario" JSONB,
    "scenarioTitle" TEXT NOT NULL,
    "themeSlug" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "coachingMode" "CoachingMode" NOT NULL,
    "agentVoice" TEXT NOT NULL,
    "agentSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "durationMin" INTEGER,
    "status" "SessionStatus" NOT NULL DEFAULT 'starting',
    "livekitRoomName" TEXT NOT NULL,
    "dispatchId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "recordingUrl" TEXT,
    "egressId" TEXT,
    "endReason" TEXT,
    "failureReason" TEXT,
    "analysisAttempts" INTEGER NOT NULL DEFAULT 0,
    "analysisStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utterance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "speaker" "Speaker" NOT NULL,
    "agentCharacter" TEXT,
    "text" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "words" JSONB,
    "confidence" DOUBLE PRECISION,
    "fillerCount" INTEGER NOT NULL DEFAULT 0,
    "interrupted" BOOLEAN NOT NULL DEFAULT false,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utterance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "SessionEventType" NOT NULL,
    "atMs" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL,
    "cefr" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL,
    "errors" JSONB NOT NULL,
    "rewrites" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "priorities" JSONB NOT NULL,
    "taskCriteria" JSONB NOT NULL,
    "drills" JSONB NOT NULL,
    "vocab" JSONB NOT NULL,
    "deltas" JSONB,
    "summary" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricPoint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarError" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" "GrammarCategory" NOT NULL,
    "quote" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "atMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "ipa" TEXT,
    "partOfSpeech" TEXT,
    "source" TEXT,
    "status" "VocabStatus" NOT NULL DEFAULT 'new',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "GoalKind" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "targetCefr" TEXT,
    "dueDate" TIMESTAMP(3),
    "remindByEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "provider" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "characters" INTEGER NOT NULL DEFAULT 0,
    "audioSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE INDEX "Scenario_themeId_idx" ON "Scenario"("themeId");

-- CreateIndex
CREATE INDEX "Scenario_difficulty_idx" ON "Scenario"("difficulty");

-- CreateIndex
CREATE INDEX "CustomScenario_userId_createdAt_idx" ON "CustomScenario"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_livekitRoomName_key" ON "Session"("livekitRoomName");

-- CreateIndex
CREATE INDEX "Session_userId_createdAt_idx" ON "Session"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Session_userId_status_idx" ON "Session"("userId", "status");

-- CreateIndex
CREATE INDEX "Session_scenarioId_idx" ON "Session"("scenarioId");

-- CreateIndex
CREATE INDEX "Utterance_sessionId_startMs_idx" ON "Utterance"("sessionId", "startMs");

-- CreateIndex
CREATE UNIQUE INDEX "Utterance_sessionId_seq_key" ON "Utterance"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "SessionEvent_sessionId_atMs_idx" ON "SessionEvent"("sessionId", "atMs");

-- CreateIndex
CREATE INDEX "SessionEvent_type_idx" ON "SessionEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisReport_sessionId_key" ON "AnalysisReport"("sessionId");

-- CreateIndex
CREATE INDEX "MetricPoint_metricKey_at_idx" ON "MetricPoint"("metricKey", "at");

-- CreateIndex
CREATE INDEX "MetricPoint_sessionId_idx" ON "MetricPoint"("sessionId");

-- CreateIndex
CREATE INDEX "GrammarError_category_createdAt_idx" ON "GrammarError"("category", "createdAt");

-- CreateIndex
CREATE INDEX "GrammarError_sessionId_idx" ON "GrammarError"("sessionId");

-- CreateIndex
CREATE INDEX "VocabEntry_userId_nextReviewAt_idx" ON "VocabEntry"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "VocabEntry_userId_status_idx" ON "VocabEntry"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VocabEntry_userId_word_key" ON "VocabEntry"("userId", "word");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_userId_kind_key" ON "Goal"("userId", "kind");

-- CreateIndex
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_sessionId_idx" ON "UsageLog"("sessionId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomScenario" ADD CONSTRAINT "CustomScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utterance" ADD CONSTRAINT "Utterance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisReport" ADD CONSTRAINT "AnalysisReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricPoint" ADD CONSTRAINT "MetricPoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarError" ADD CONSTRAINT "GrammarError_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabEntry" ADD CONSTRAINT "VocabEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
