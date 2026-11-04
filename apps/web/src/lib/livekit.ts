import {
  AccessToken,
  AgentDispatchClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
  WebhookReceiver,
} from "livekit-server-sdk";
import { env, recordingsConfigured } from "@/lib/env";
import type { SessionDispatchMetadata } from "@fluent/shared";

/** LiveKit REST host (https) derived from the websocket URL. */
export function livekitHttpUrl(): string {
  return env.LIVEKIT_URL.replace(/^ws/, "http");
}

export const roomService = () =>
  new RoomServiceClient(livekitHttpUrl(), env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
export const dispatchClient = () =>
  new AgentDispatchClient(livekitHttpUrl(), env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
export const egressClient = () =>
  new EgressClient(livekitHttpUrl(), env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
export const webhookReceiver = () =>
  new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);

export const PARTICIPANT_IDENTITY = "learner";

/** Mints a short-lived join token for the owner. Rooms are private; nobody else ever gets a token. */
export async function mintLearnerToken(
  roomName: string,
  name: string,
  ttl = "2h",
): Promise<string> {
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: PARTICIPANT_IDENTITY,
    name,
    ttl,
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });
  return at.toJwt();
}

/** Creates the private room and explicitly dispatches the agent with the session config as metadata. */
export async function createRoomAndDispatch(roomName: string, metadata: SessionDispatchMetadata) {
  const json = JSON.stringify(metadata);
  const rs = roomService();
  await rs.createRoom({
    name: roomName,
    emptyTimeout: 120,
    departureTimeout: 20,
    maxParticipants: 2,
    metadata: json,
  });
  const dispatch = await dispatchClient().createDispatch(roomName, env.LIVEKIT_AGENT_NAME, {
    metadata: json,
  });
  return { dispatchId: dispatch.id };
}

export async function deleteRoomQuietly(roomName: string) {
  try {
    await roomService().deleteRoom(roomName);
  } catch {
    /* room may already be gone */
  }
}

/** Optional audio-only room recording to S3-compatible storage. Returns null when not configured. */
export async function startRecording(roomName: string, sessionId: string): Promise<string | null> {
  if (!recordingsConfigured) return null;
  const filepath = `sessions/${sessionId}/{time}.ogg`;
  const output = new EncodedFileOutput({
    fileType: EncodedFileType.OGG,
    filepath,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: env.S3_ACCESS_KEY!,
        secret: env.S3_SECRET_KEY!,
        region: env.S3_REGION ?? "us-east-1",
        endpoint: env.S3_ENDPOINT!,
        bucket: env.S3_BUCKET!,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
      }),
    },
  });
  const info = await egressClient().startRoomCompositeEgress(roomName, output, { audioOnly: true });
  return info.egressId;
}

export async function stopRecording(egressId: string): Promise<string | null> {
  try {
    const info = await egressClient().stopEgress(egressId);
    const file = info.fileResults?.[0];
    return file?.location || file?.filename || null;
  } catch {
    return null;
  }
}
