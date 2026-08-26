import { describe, expect, it } from "vitest";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REDIRECT_URI = "https://instafunnel-lphz3bum.manus.space/api/youtube/oauth/callback";

describe("YouTube OAuth client credentials", () => {
  it("are accepted by Google's token endpoint without exposing the credentials", async () => {
    const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        code: "invalid-code-used-only-to-validate-client-authentication",
      }),
    });
    const body = await response.json() as { error?: string };

    // Invalid grant confirms the client itself was accepted; invalid_client would
    // indicate bad client credentials. The deliberately invalid code is never usable.
    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_grant");
  }, 15_000);
});
