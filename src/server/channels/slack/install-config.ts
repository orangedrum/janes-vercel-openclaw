/**
 * Reads Slack OAuth app credentials from environment variables.
 * These are optional — when all three are set, the admin panel offers
 * a one-click "Install to Slack" OAuth flow instead of manual credential entry.
 */

export type SlackInstallConfig = {
  clientId: string | null;
  clientSecret: string | null;
  signingSecret: string | null;
  /** True when all three credentials are present. */
  enabled: boolean;
};

export function getSlackInstallConfig(): SlackInstallConfig {
  const clientId = process.env.SLACK_CLIENT_ID?.trim() || null;
  const clientSecret = process.env.SLACK_CLIENT_SECRET?.trim() || null;
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim() || null;

  return {
    clientId,
    clientSecret,
    signingSecret,
    enabled: Boolean(clientId && clientSecret && signingSecret),
  };
}
