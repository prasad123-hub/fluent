# Research notes (Phase 0–1)

All LiveKit facts below were verified in this session against the **installed SDK source**, not
from memory. Every item cites where it was read.

## 0. LiveKit Agent Skills — install record

| Item | Value |
|---|---|
| Install method | `npx skills add livekit/agent-skills -a claude-code -y` (ONE method only) |
| Installed to | `.claude/skills/{building,debugging,operating,reading,running-simulations,testing,writing-scenarios}-livekit-*` + `skills-lock.json` |
| Source commit | `livekit/agent-skills` @ `e1195b497388b1aecad5dd2e9a0c9bdfbaba1878` (2026-10-21) |
| Skill hashes | see `skills-lock.json` (computedHash per skill) |
| Older skills (`livekit-agents`, `livekit-simulations`) | never installed; none present |
| LiveKit CLI | `lk` **2.19.3** built from source (`livekit/livekit-cli` clone, `go build ./cmd/lk`, needed `libasound2-dev`) → `/root/go/bin/lk`. The hosted release download (`get.livekit.io`) is blocked by the sandbox network policy. |
| Docs MCP / `lk docs` | **Unavailable in this sandbox**: `docs.livekit.io` (including `/mcp` and `llms.txt`) is denied by the network policy (`403` on CONNECT / `ENOTFOUND`). |
| Fallback docs source | The LiveKit Agents **source tree at the exact pinned version** (`livekit/agents` @ `93dd4fde98bbcdd604fca5ac033eea276dc7f311`, `livekit-agents 1.8.10`), its `examples/` (frontdesk, telephony, voice_agents) and `tests/` (fake providers), `livekit-server-sdk` 2.19.2 `.d.ts`, `@livekit/components-react` 2.9.24 `.d.ts`, and `lk --help` output. Per `reading-livekit-docs`: "a working example outranks a prose page". |

The skills ARE visible to this session (loaded after install; the `Skill` listing shows all 7).

## 1. LiveKit Agents (Python) 1.8.10 — exact API shapes used

Source: `livekit-agents/livekit/agents/**` at the commit above.

### Worker / entrypoint (`worker.py`)
```python
from livekit.agents import AgentServer, JobContext, JobProcess, cli
server = AgentServer()                       # kwargs: num_idle_processes, drain_timeout, load_threshold,
                                             # session_end_timeout=300.0, shutdown_process_timeout=10.0,
                                             # setup_fnc=prewarm (JobProcess), port, log_level ...
@server.rtc_session(agent_name="fluent-agent", on_session_end=..., on_simulation_end=...)
async def entrypoint(ctx: JobContext) -> None: ...
if __name__ == "__main__": cli.run_app(server)
```
- `agent_name` enables **explicit dispatch** (jobs only via `AgentDispatch.createDispatch` or token room config). Default from `LIVEKIT_AGENT_NAME`.
- `setup_fnc(proc: JobProcess)` = prewarm hook; `proc.userdata["vad"] = silero.VAD.load()`.
- `on_session_end(ctx)` runs after the session closes (also if it crashed); bounded by `session_end_timeout` (default 300 s). Use for analysis.
- `on_simulation_end(ctx: SimulationContext)` → `ctx.userdata()`, `ctx.fail(reason)`, `ctx.simulator_verdict`, `ctx.job_context.primary_session`.

### JobContext (`job.py`)
- `ctx.job.metadata: str` (dispatch metadata JSON), `ctx.job.room.metadata`, `ctx.room: rtc.Room`, `ctx.room.name`.
- `await ctx.connect()`; `ctx.add_shutdown_callback(cb)`; `ctx.shutdown(reason)`; `ctx.delete_room()`;
  `ctx.simulation_context()` → `SimulationContext | None`; `ctx.make_session_report()` → `SessionReport`
  (`chat_history`, `events`, `model_usage`, `duration`, `started_at`); `ctx.log_context_fields = {...}`;
  `ctx.primary_session`; `ctx.tagger.success()/fail(reason=)`; `ctx.api` (LiveKitAPI).

### AgentSession (`voice/agent_session.py`)
```python
AgentSession(stt=..., vad=..., llm=..., tts=...,
  turn_handling=TurnHandlingOptions(  # TypedDict, all optional (voice/turn.py)
     turn_detection=<"stt"|"vad"|"manual"|TurnDetector instance|None>,
     endpointing={"mode":"fixed","min_delay":0.5,"max_delay":3.0},
     interruption={"enabled":True,"mode":"adaptive"|"vad","min_duration":0.5,"min_words":0,
                   "resume_false_interruption":True,"false_interruption_timeout":...},
     preemptive_generation={"enabled":True,"preemptive_tts":False},
  ),
  tools=[...], max_tool_steps=3, userdata=..., user_away_timeout=15.0,
  tts_text_transforms=["filter_markdown","filter_emoji"], aec_warmup_duration=3.0)
await session.start(agent, room=ctx.room, room_options=room_io.RoomOptions(...), record=...)
session.say(text, allow_interruptions=..., add_to_chat_ctx=True) -> SpeechHandle
session.generate_reply(user_input=..., instructions=..., tool_choice=..., allow_interruptions=...) -> SpeechHandle
session.interrupt(force=False); session.history: ChatContext; session.usage: AgentSessionUsage(model_usage)
session.current_agent; session.update_agent(agent); session.userdata; session.agent_state / user_state
await session.aclose(); session.run(user_input=...) -> RunResult  (tests)
```
Events (`voice/events.py`): `user_state_changed`, `agent_state_changed`, `user_input_transcribed`
(`transcript`, `is_final`, `language`), `conversation_item_added` (`item: ChatMessage|AgentHandoff`),
`function_tools_executed` (`function_calls`, `function_call_outputs`, `.zipped()`),
`metrics_collected` (`metrics: LLMMetrics|STTMetrics|TTSMetrics|EOUMetrics`), `session_usage_updated`,
`agent_false_interruption`, `error`, `close`.
States: user `speaking|listening|away`; agent `initializing|idle|listening|thinking|speaking`.

Per-turn latency: `ChatMessage.metrics: MetricsReport` (TypedDict) with
`transcription_delay`, `end_of_turn_delay`, `on_user_turn_completed_delay` (user msgs) and
`llm_node_ttft`, `llm_node_ttfs`, `tts_node_ttfb`, `e2e_latency`, `playback_latency` (assistant msgs).
`EOUMetrics.end_of_utterance_delay / transcription_delay`, `LLMMetrics.ttft/duration/prompt_tokens/completion_tokens`,
`TTSMetrics.ttfb/characters_count/audio_duration`, `STTMetrics.audio_duration`.

### Agent (`voice/agent.py`)
```python
class Agent: __init__(*, instructions: str, id=None, chat_ctx=NOT_GIVEN, tools=None, stt=, vad=, llm=, tts=, turn_handling=)
  async def on_enter(self); async def on_exit(self)
  async def on_user_turn_completed(self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage)  # edit before LLM
  def stt_node(self, audio, model_settings) -> AsyncIterable[stt.SpeechEvent|str]   # override to tap word timings
  async def update_instructions(str); async def update_tools(list); async def update_chat_ctx(ctx)
  self.session -> AgentSession; self.chat_ctx; self.tts / self.llm / self.stt
```
- Tools: `@function_tool async def name(self, context: RunContext, arg: str) -> str` (docstring = description, `Args:` section).
  Raise `ToolError("msg")` for model-visible failures; raise `StopResponse()` to suppress a reply.
- **Handoff**: a tool may `return OtherAgent()` (or `(OtherAgent(), "message")`) → session switches agent and emits
  `AgentHandoff` (`voice/generation.py:1232 isinstance(fnc_out, Agent)`). Carry context with
  `chat_ctx=self.chat_ctx.copy(exclude_instructions=True, exclude_function_call=True)` (examples/telephony).
- `AgentTask` (awaitable, returns result) is available for scoped sub-dialogs.

### STT word timings
`stt.SpeechEvent(type=FINAL_TRANSCRIPT, alternatives=[SpeechData(text, start_time, end_time, confidence,
words: list[TimedString])])`; `TimedString(str)` has `.start_time`, `.end_time`, `.confidence`
(`types.py:189`). Deepgram fills `words` from `alt["words"]` (`deepgram/stt.py:1016-1034`).
Fluent taps them by overriding `Agent.stt_node` and iterating `Agent.default.stt_node(...)`.

### Plugins (constructor signatures verified)
- `deepgram.STT(model="nova-3", language="en-US", interim_results=True, punctuate=True, smart_format=False,
  filler_words=True, endpointing_ms=25, keyterm=[...], api_key=...)` (`livekit-plugins-deepgram/stt.py:84`).
- `openai.LLM(model="gpt-4.1", temperature=..., parallel_tool_calls=..., api_key=...)` (`openai/llm.py:95`).
  `openai.TTS(model=..., voice=..., speed=1.0, instructions=...)` (`openai/tts.py:84`). `openai.STT` exists for Whisper fallback.
- `anthropic.LLM(model="claude-sonnet-4-6", temperature=..., max_tokens=...)` (`anthropic/llm.py:73`).
- `cartesia.TTS(model="sonic-3", language="en", voice="<id>", speed: "fastest"|"fast"|"normal"|"slow"|"slowest"|float, emotion=..., sample_rate=24000)`;
  `tts.update_options(voice=, speed=, emotion=...)` (`cartesia/tts.py:89,266`). Default voice id `f786b574-daa5-4673-aa0c-cbe3e8534c02` (Katie).
- `elevenlabs.TTS(voice_id=..., model="eleven_turbo_v2_5", voice_settings=VoiceSettings(...), language=...)` (`elevenlabs/tts.py:104`).
- `silero.VAD.load(min_speech_duration=0.05, min_silence_duration=0.55, prefix_padding_duration=0.5, activation_threshold=0.5)` (`silero/vad.py:60`) — blocking, call in prewarm.
- Turn detection: `livekit.plugins.turn_detector` is **deprecated** (emits DeprecationWarning). Use
  `livekit.agents.inference.TurnDetector(version="v1-mini"|"v1", unlikely_threshold=..., local_fallback=True)`
  (`inference/eot/detector.py:35`). `v1-mini` runs locally (default outside LiveKit Cloud), `v1` uses the
  cloud gateway with local fallback. Pass it as `turn_handling={"turn_detection": TurnDetector(...)}`.
- Noise cancellation: `room_io.AudioInputOptions(noise_cancellation=...)` accepts `rtc.NoiseCancellationOptions`
  (LiveKit Cloud Krisp) — optional, Cloud-only.

### room_io (`voice/room_io/types.py`)
`RoomOptions(text_input=bool|TextInputOptions, audio_input=bool|AudioInputOptions(noise_cancellation=...),
audio_output=..., text_output=bool|TextOutputOptions(sync_transcription=...), participant_identity=...,
close_on_disconnect=True, delete_room_on_close=False)`. Transcriptions are published on text stream topic
`lk.transcription`; text chat input on `lk.chat`.

### Testing (`voice/run_result.py`, `tests/`, `examples/frontdesk/test_agent.py`)
```python
async with AgentSession(llm=my_llm) as sess:
    await sess.start(MyAgent())                      # or sess.start(agent, capture_run=True)
    r = await sess.run(user_input="...")
    r.expect.next_event().is_function_call(name="x", arguments={...})
    r.expect.next_event().is_function_call_output(output="...")
    r.expect.next_event().is_message(role="assistant")   # .judge(llm, intent="...") (needs real LLM)
    r.expect.next_event().is_agent_handoff(new_agent_type=Other)
    r.expect.skip_next_event_if(type="message", role="assistant"); r.expect.no_more_events()
    r.expect.contains_function_call(name=...)
with mock_tools(MyAgent, {"tool": fn}): ...    /  mock_tools(MyAgent, mocks, session=session)  # session-scoped
```
Scripted LLM for key-free tests: subclass `llm.LLM` + `LLMStream` emitting `ChatChunk(id, delta=ChoiceDelta(role,
content, tool_calls=[FunctionToolCall(name, arguments, call_id)]))` (pattern from `tests/fake_llm.py`).
Judges (`livekit.agents.evals`): `JudgeGroup(llm=..., judges=[task_completion_judge(), accuracy_judge(),
safety_judge(), relevancy_judge(), coherence_judge(), conciseness_judge(), tool_use_judge(), handoff_judge()])`.

### Simulations (`lk agent simulate --help`, `examples/frontdesk/scenarios.yaml`)
Scenario file: `name: <set>` + `scenarios: [{label, instructions: |-, agent_expectations, tags: {feature: ...}, userdata: {...}}]`
(the CLI adds stable `id`s with `--yes`). Run: `lk agent simulate text --scenarios file.yaml [-y]` from the
agent dir; `--agent-name` to target a deployed agent; `list|view|export|cancel`. **Runs on LiveKit Cloud**
(needs `LIVEKIT_URL/API_KEY/API_SECRET`). Agent side: `if sim := ctx.simulation_context(): seed from
sim.userdata(); mock_tools(..., session=session)`; grade in `on_simulation_end` with `ctx.fail(reason)`.

### Debugger (`lk agent debugger --help`)
`lk agent debugger start [entrypoint.py]` (text mode, STT/TTS off, needs only the LLM key) → `say "..."`
→ `logs --last N`, `chat-history`, `events`, `restart`, `stop --chat-history`; `--json` for machine output;
`--audio` speaks turns via LiveKit Inference TTS (needs Cloud project).

## 2. LiveKit server SDK (Node) 2.19.2 — used by `apps/web`
```ts
import { AccessToken, RoomServiceClient, AgentDispatchClient, WebhookReceiver, EgressClient,
         EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";
const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "1h", metadata });
at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
const jwt = await at.toJwt();                                   // async
await new RoomServiceClient(host, key, secret).createRoom({ name, emptyTimeout, departureTimeout, maxParticipants: 2, metadata });
await new AgentDispatchClient(host, key, secret).createDispatch(roomName, "fluent-agent", { metadata: JSON.stringify(payload) });
const ev = await new WebhookReceiver(key, secret).receive(rawBody, req.headers.get("authorization"));  // ev.event, ev.room
await new EgressClient(host, key, secret).startRoomCompositeEgress(room,
  new EncodedFileOutput({ fileType: EncodedFileType.OGG, filepath: "...", output: { case: "s3", value: new S3Upload({ accessKey, secret, region, endpoint, bucket, forcePathStyle }) } }),
  { audioOnly: true });
```
Types read from `livekit-server-sdk/dist/*.d.ts` and `@livekit/protocol/dist/index.d.ts`.

## 3. `@livekit/components-react` 2.9.24 / `livekit-client` 2.23.0
- `RoomContext.Provider value={room}` with `new Room()` from `livekit-client`; `RoomAudioRenderer`.
- `useVoiceAssistant()` → `{ agent, state: AgentState, audioTrack, agentTranscriptions, agentAttributes }`;
  `AgentState = 'disconnected'|'connecting'|'pre-connect-buffering'|'failed'|'initializing'|'idle'|'listening'|'thinking'|'speaking'`.
- `useTranscriptions({room?, participantIdentities?})` → `TextStreamData[] { text, participantInfo.identity, streamInfo }`
  (topic `lk.transcription`); `useTextStream(topic)`.
- `useMultibandTrackVolume(trackRef, { bands, updateInterval })` → `number[]`; `useTrackVolume(trackRef)`.
- `useLocalParticipant()` → `{ isMicrophoneEnabled, microphoneTrack, localParticipant, lastMicrophoneError }`.
- `useMediaDeviceSelect({ kind: "audioinput", room, requestPermissions })` → `{ devices, activeDeviceId, setActiveMediaDevice }`.
- `BarVisualizer({ state, barCount, trackRef })` (we build a custom orb; BarVisualizer kept as fallback).
- Krisp (Cloud only): `@livekit/krisp-noise-filter` 0.4.5 — optional, feature-flagged.

## 4. Other stacks (versions confirmed on the npm/PyPI registries on 2026-11-04)
Registry is reachable; most vendor doc sites are **not** (blocked by sandbox policy): `vercel.com`,
`developers.deepgram.com`, `platform.openai.com`, `docs.cartesia.ai`, `authjs.dev`, `prisma.io`, `tailwindcss.com`.
Where docs were unreachable, API shapes were taken from the installed packages' type definitions / source.

| Package | Pinned | Why |
|---|---|---|
| `next` | 15.5.29 | Spec says Next 15. 16.x exists (breaking: `proxy.ts`, Turbopack-only) but could not be verified against docs offline. |
| `react`/`react-dom` | 19.1.x (Next 15 peer) | |
| `typescript` | 5.9.3 | 7.x is the native-preview line; tooling compat unverifiable. |
| `tailwindcss`/`@tailwindcss/postcss` | 4.3.4 | v4 CSS-first config (`@theme`, `@custom-variant dark`). |
| `prisma`/`@prisma/client` | 6.19.3 | 7.x requires driver adapters + `prisma.config.ts`; docs unreachable. |
| `next-auth` | 5.0.0-beta.32 (Auth.js v5) | App-Router native (`auth()`, `handlers`, `middleware`); v4 "latest" is pages-router era. |
| `zod` | 3.25.76 | boring; v4 error API differs. |
| `recharts` | 2.15.4 | known API; React 19 peer ok. |
| `@tanstack/react-table` | 8.21.3 | |
| `motion` | 14.9.1 (`motion/react`) | successor of framer-motion. |
| `cmdk` 1.1.1 · `sonner` 2.0.8 · `lucide-react` 1.68.0 · `next-themes` 0.4.6 · `geist` 1.9.1 | | |
| `livekit-server-sdk` 2.19.2 · `livekit-client` 2.23.0 · `@livekit/components-react` 2.9.24 | | |
| `vitest` 5.1.0 · `@playwright/test` 1.64.1 · `eslint` 9.39.5 · `eslint-config-next` 15.5.29 · `prettier` 3.9.10 | | |
| Python: `livekit-agents[deepgram,openai,cartesia,elevenlabs,silero,anthropic]==1.8.10`, `livekit-api==1.2.2`, `asyncpg`, `pydantic`, `structlog`, `pytest`, `pytest-asyncio`, `ruff`, `mypy` | | |

`geist` fonts: `import { GeistSans } from "geist/font/sans"; import { GeistMono } from "geist/font/mono";`
→ `GeistSans.variable` = `--font-geist-sans` (verified in `geist/dist/sans.js`).

Official Geist React components: `@vercel/geistcn` is referenced by Vercel docs but is **not published on npm**
(registry returns no versions on 2026-11-04). Community `@geist-ui/core` is not Vercel's. → Rebuild Geist on
shadcn/ui + Tailwind (see `docs/DESIGN_SYSTEM.md`).

Deepgram word timestamps / filler words / confidence: provided by the LiveKit Deepgram plugin
(`filler_words=True` default; `words[].start/end/confidence` parsed) — no direct Deepgram API calls needed.
