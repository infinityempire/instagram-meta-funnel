import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Readable } from "node:stream";
import * as db from "../db";
import { logSafe, safeErrorMessage } from "../meta/safeLog";
import { decryptRefreshToken } from "./crypto";
import { getYouTubeOAuthConfig, getYouTubeTokenEncryptionKey } from "./config";
import type { PrivateUploadMetadata } from "./uploadPolicy";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const YOUTUBE_RESUMABLE_ENDPOINT = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const YOUTUBE_VIDEO_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";

export type PrivateUploadRequest = {
  ownerOpenId: string;
  filePath: string;
  metadata: PrivateUploadMetadata;
};

export type PrivateUploadResult = {
  videoId: string;
  privacyStatus: "private";
};

export type UploadedVideoStatus = {
  videoId: string;
  privacyStatus: string;
  madeForKids: boolean;
  selfDeclaredMadeForKids: boolean;
};

export function logPrivateUploadFailure(filePath: string, error: unknown): void {
  logSafe("error", "Private YouTube upload failed", {
    file: basename(filePath),
    error: safeErrorMessage(error),
  });
}

export function logPrivateUploadSuccess(filePath: string, result: PrivateUploadResult): void {
  logSafe("info", "Private YouTube upload completed", {
    file: basename(filePath),
    videoId: result.videoId,
    privacyStatus: result.privacyStatus,
  });
}

function validatePrivateMetadata(metadata: PrivateUploadMetadata): void {
  if (
    metadata.status.privacyStatus !== "private" ||
    metadata.status.selfDeclaredMadeForKids !== true ||
    metadata.status.containsSyntheticMedia !== true
  ) {
    throw new Error("Only private, made-for-kids uploads with AI disclosure are allowed");
  }
}

export async function getYouTubeAccessToken(ownerOpenId: string): Promise<string> {
  const connection = await db.getYouTubeConnection(ownerOpenId);
  if (!connection) throw new Error("YouTube is not connected for this owner");

  const refreshToken = decryptRefreshToken(connection.refreshTokenCiphertext, getYouTubeTokenEncryptionKey());
  const config = getYouTubeOAuthConfig();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google refresh-token exchange failed with HTTP ${response.status}`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error("Google did not return an access token");
  return body.access_token;
}

async function startResumableUpload(accessToken: string, metadata: PrivateUploadMetadata, fileSize: number): Promise<string> {
  const response = await fetch(YOUTUBE_RESUMABLE_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": "video/mp4",
      "x-upload-content-length": String(fileSize),
    },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error(`YouTube resumable session creation failed with HTTP ${response.status}`);
  const uploadUrl = response.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube did not return a resumable upload location");
  return uploadUrl;
}

async function sendVideoBytes(uploadUrl: string, filePath: string, fileSize: number): Promise<PrivateUploadResult> {
  const stream = Readable.toWeb(createReadStream(filePath));
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": "video/mp4",
      "content-length": String(fileSize),
    },
    body: stream as unknown as BodyInit,
    duplex: "half",
  } as RequestInit);
  if (!response.ok) throw new Error(`YouTube video transfer failed with HTTP ${response.status}`);
  const body = await response.json() as { id?: string; status?: { privacyStatus?: string } };
  if (!body.id || body.status?.privacyStatus !== "private") {
    throw new Error("YouTube did not confirm a private uploaded video");
  }
  return { videoId: body.id, privacyStatus: "private" };
}

/** Uploads only a locally stored, AI-disclosed, child-directed video as private. */
export async function uploadPrivateYouTubeVideo(request: PrivateUploadRequest): Promise<PrivateUploadResult> {
  try {
    validatePrivateMetadata(request.metadata);
    if (!request.filePath.toLowerCase().endsWith(".mp4")) throw new Error("Only MP4 upload files are allowed");
    const file = await stat(request.filePath);
    if (!file.isFile() || file.size === 0) throw new Error("The upload file is unavailable or empty");

    const accessToken = await getYouTubeAccessToken(request.ownerOpenId);
    const uploadUrl = await startResumableUpload(accessToken, request.metadata, file.size);
    const result = await sendVideoBytes(uploadUrl, request.filePath, file.size);
    logPrivateUploadSuccess(request.filePath, result);
    return result;
  } catch (error) {
    logPrivateUploadFailure(request.filePath, error);
    throw error;
  }
}

export async function getUploadedVideoStatus(ownerOpenId: string, videoId: string): Promise<UploadedVideoStatus> {
  const accessToken = await getYouTubeAccessToken(ownerOpenId);
  const url = new URL(YOUTUBE_VIDEO_ENDPOINT);
  url.searchParams.set("part", "status");
  url.searchParams.set("id", videoId);
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`YouTube video verification failed with HTTP ${response.status}`);
  const body = await response.json() as {
    items?: Array<{ id?: string; status?: { privacyStatus?: string; madeForKids?: boolean; selfDeclaredMadeForKids?: boolean } }>;
  };
  const item = body.items?.[0];
  if (!item?.id || !item.status?.privacyStatus) throw new Error("YouTube did not return the uploaded video status");
  return {
    videoId: item.id,
    privacyStatus: item.status.privacyStatus,
    madeForKids: item.status.madeForKids === true,
    selfDeclaredMadeForKids: item.status.selfDeclaredMadeForKids === true,
  };
}
