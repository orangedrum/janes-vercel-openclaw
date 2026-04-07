import { logInfo, logWarn } from "@/server/log";

export interface EnvCheckResult {
  name: string;
  status: "pass" | "warn" | "missing";
  message: string;
  isCritical: boolean;
}

export interface EnvCheckerConfig {
  warnings?: string[]; // names of checks to suppress (e.g., ["MAILMETEOR_API_KEY"])
  suppressAll?: boolean; // if true, no warnings printed
}

const ENV_CHECKS: Record<string, { isCritical: boolean; message: string }> = {
  // Core requirements
  ADMIN_SECRET: {
    isCritical: true,
    message: "Admin auth password",
  },
  UPSTASH_REDIS_REST_URL: {
    isCritical: true,
    message: "Persistent state backend (Redis)",
  },
  UPSTASH_REDIS_REST_TOKEN: {
    isCritical: true,
    message: "Persistent state auth token",
  },

  // AI Gateway (recommended on Vercel)
  AI_GATEWAY_API_KEY: {
    isCritical: false,
    message: "AI Gateway static API key (or use OIDC)",
  },

  // Email validation (recommended)
  MAILMETEOR_API_KEY: {
    isCritical: false,
    message: "Mailmeteor email validation (or use heuristics)",
  },

  // Email sending domain (recommended)
  SENDING_DOMAIN: {
    isCritical: false,
    message: "Custom domain for sending emails (e.g., mail.yourdomain.com)",
  },

  // Cron security (recommended on Vercel)
  CRON_SECRET: {
    isCritical: false,
    message: "Cron watchdog authentication (or uses ADMIN_SECRET)",
  },

  // OAuth (optional for sign-in-with-vercel)
  NEXT_PUBLIC_VERCEL_APP_CLIENT_ID: {
    isCritical: false,
    message: "Vercel OAuth client ID (for sign-in-with-vercel mode)",
  },
  VERCEL_APP_CLIENT_SECRET: {
    isCritical: false,
    message: "Vercel OAuth client secret",
  },

  // Channel integrations (optional)
  SLACK_CLIENT_ID: {
    isCritical: false,
    message: "Slack app client ID (for one-click install)",
  },
  SLACK_CLIENT_SECRET: {
    isCritical: false,
    message: "Slack app client secret",
  },
  SLACK_SIGNING_SECRET: {
    isCritical: false,
    message: "Slack signing secret for webhook verification",
  },
};

/**
 * Check environment variables and return a structured report.
 */
export function checkEnvironment(config?: EnvCheckerConfig): EnvCheckResult[] {
  const suppressedChecks = config?.warnings || [];
  const suppressAll = config?.suppressAll ?? false;

  const results: EnvCheckResult[] = [];

  for (const [name, { isCritical, message }] of Object.entries(ENV_CHECKS)) {
    const value = process.env[name];
    const isSuppressed = suppressAll || suppressedChecks.includes(name);

    if (!value || value.trim === "") {
      results.push({
        name,
        status: "missing",
        message: `Missing: ${message}`,
        isCritical,
      });

      if (!isSuppressed && isCritical) {
        logWarn("env.check.critical_missing", { name, message });
      } else if (!isSuppressed && !isCritical) {
        logInfo("env.check.optional_missing", { name, message });
      }
    } else {
      results.push({
        name,
        status: "pass",
        message: `Configured: ${message}`,
        isCritical,
      });
    }
  }

  return results;
}

/**
 * Generate a startup warning report. Returns null if all critical vars are set.
 */
export function getStartupWarnings(config?: EnvCheckerConfig): {
  blockers: EnvCheckResult[];
  warnings: EnvCheckResult[];
  hasBlockers: boolean;
} {
  const results = checkEnvironment(config);

  const blockers = results.filter((r) => r.status === "missing" && r.isCritical);
  const warnings = results.filter((r) => r.status === "missing" && !r.isCritical);

  return {
    blockers,
    warnings,
    hasBlockers: blockers.length > 0,
  };
}

/**
 * Format a warning report for display.
 */
export function formatEnvWarnings(
  report: ReturnType<typeof getStartupWarnings>,
): string {
  const lines: string[] = [];

  if (report.hasBlockers) {
    lines.push("❌ CRITICAL: The following environment variables are required:");
    report.blockers.forEach((b) => {
      lines.push(`  • ${b.name}: ${b.message}`);
    });
    lines.push("");
  }

  if (report.warnings.length > 0) {
    lines.push("⚠️  OPTIONAL: Consider configuring:");
    report.warnings.forEach((w) => {
      lines.push(`  • ${w.name}: ${w.message}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
