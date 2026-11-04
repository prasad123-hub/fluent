# Scoring

Every session produces an `AnalysisReport` (schema: `packages/shared/schemas/analysis-report.schema.json`).
Scores are 0–100; bands are CEFR. The pipeline is a **hybrid**: deterministic metrics computed in
Python from word timestamps/text (`analysis/metrics.py`, unit-tested) and LLM-judged metrics with a
strict JSON schema and evidence quotes (`analysis/rubric.py`, temperature 0). Composition lives in
`analysis/scoring.py`.

## 1. Eight core skills

| Skill           | Formula                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| grammar         | judge.grammar.score                                                                                                                                                                        |
| vocabulary      | 0.7 × judge.vocabulary + 0.3 × (40 + 1.5 × % words beyond top-2k)                                                                                                                          |
| fluency         | 0.5 × judge.fluency + 0.5 × deterministic fluency, where deterministic = 0.5 × pace + 0.5 × (100 − filler penalty − pause penalty); pace = 100 − 0.8 ×                                     | WPM − 140 | (capped at −60); filler penalty = min(45, 4.5 × fillers/100 words); pause penalty = min(30, 2 × pauses>1.5 s + 4 × pauses>3 s) |
| pronunciation   | 0.6 × judge.pronunciation + 0.4 × (100 × mean STT confidence − 0.8 × low-confidence words, capped)                                                                                         |
| coherence       | 0.6 × judge.fluency + 0.4 × judge.communication.structure + min(15, 0.4 × % complex sentences) − min(10, repetitions)                                                                      |
| taskAchievement | judge.taskAchievement (per-criterion ✓/✗ with evidence)                                                                                                                                    |
| communication   | judge.communication.score (structure, conciseness, active listening, register, assertiveness, question-asking, empathy, persuasiveness, hedging)                                           |
| confidence      | 0.4 × hedging score + 0.3 × assertiveness + 30 − 40 × hedge ratio − latency penalty (max 20, for mean response latency > 1.5 s) − min(15, 1.5 × fillers/100) + 10 if talk share is 45–70 % |

## 2. Overall score

`overall = Σ weight × skill − code-switch penalty`

| grammar | vocabulary | fluency | pronunciation | coherence | task | communication | confidence |
| ------- | ---------- | ------- | ------------- | --------- | ---- | ------------- | ---------- |
| 0.18    | 0.14       | 0.18    | 0.12          | 0.10      | 0.12 | 0.10          | 0.06       |

Code-switch penalty: 1 point per Hindi/Hinglish switch, max 6 (a nudge, never a punishment).

## 3. CEFR

Score bands: ≥88 C2 · ≥76 C1 · ≥62 B2 · ≥46 B1 · ≥28 A2 · else A1, then nudged **at most one step**
towards the judge's holistic `overallCefr`. Vocabulary level (`deterministic.vocabulary.estimatedLevel`)
is a separate coarse estimate from the share of speech beyond the 2,000 most common words plus the
count of advanced (Zipf < 4.0) words, using the `wordfreq` English list.

## 4. Deterministic metrics (all unit-tested)

- Speaking time / talk share from utterance spans; WPM overall and per session minute (spoken seconds only).
- Pauses: word-gap ≥0.5 s / ≥1.5 s / ≥3 s inside learner turns; mean response latency = agent end → learner start.
- Fillers per 100 words: um/uh/like/you know/basically/actually/so/I mean/kind of/right + Indian-English _only, itself, na, means, the thing is_; ambiguous words (so, right, only, like, actually, means) count only in filler positions.
- Repetitions (adjacent/bigram), false starts, self-corrections.
- Vocabulary: tokens, unique, TTR, MATTR (window 50), avg word length, % top-1k/2k/5k, advanced and overused words.
- Sentences: count, average length, % questions, % complex (subordinator present).
- Pronunciation: mean word confidence, words < 0.6 confidence, histogram, L1 flags (v/w, th, ee/i, ʒ, long-word stress).
- Code-switches (lexicon + model-detected events), turn-taking (turns, lengths, interruptions, hints).

## 5. Learner profile update (after every analysed session)

Rolling averages use an exponential moving average (α = 0.3) per metric; recurring error categories are
cumulative counts; filler and vocabulary trends append one point per session; streak counts consecutive
practice days; `priorities`/`strengths` are copied from the latest report. The profile is injected into
the next session's prompt (`prompt.profile_block`).

## 6. Deltas

`deltas` compares this session with the mean of the previous five completed sessions for: overall,
each skill, WPM, fillers per 100, long pauses, mean response latency, talk share.

## 7. Offline / scripted mode

Without an LLM key (or with `FLUENT_FAKE_LLM=1`) `rubric.scripted_judgement` produces a deterministic,
schema-valid judgement from rule-based error detection and the deterministic stats, so the complete
pipeline, the dashboard and the tests run without network access. Real sessions use the model judge.
