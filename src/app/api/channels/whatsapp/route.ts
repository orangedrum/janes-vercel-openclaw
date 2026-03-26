import { createChannelAdminRouteHandlers } from "@/server/channels/admin/route-factory";
import { setWhatsAppChannelConfig } from "@/server/channels/state";
import { logInfo } from "@/server/log";

type PutWhatsAppBody = {
  enabled?: boolean;
  pluginSpec?: string;
  accountId?: string;
  dmPolicy?: "pairing" | "allowlist" | "open" | "disabled";
  allowFrom?: string[];
  groupPolicy?: "open" | "allowlist" | "disabled";
  groupAllowFrom?: string[];
  groups?: string[];
};

const VALID_DM_POLICIES = new Set(["pairing", "allowlist", "open", "disabled"]);
const VALID_GROUP_POLICIES = new Set(["open", "allowlist", "disabled"]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export const { GET, PUT, DELETE } = createChannelAdminRouteHandlers({
  channel: "whatsapp",

  selectState(fullState) {
    return fullState.whatsapp;
  },

  async put({ request, meta }) {
    const body = (await request.json()) as PutWhatsAppBody;

    const existing = meta.channels.whatsapp;
    const enabled = body.enabled ?? existing?.enabled ?? true;
    const pluginSpec = typeof body.pluginSpec === "string" ? body.pluginSpec.trim() : existing?.pluginSpec;
    const accountId = typeof body.accountId === "string" ? body.accountId.trim() : existing?.accountId;
    const dmPolicy =
      typeof body.dmPolicy === "string" && VALID_DM_POLICIES.has(body.dmPolicy)
        ? (body.dmPolicy as PutWhatsAppBody["dmPolicy"])
        : existing?.dmPolicy;
    const allowFrom = isStringArray(body.allowFrom) ? body.allowFrom : existing?.allowFrom;
    const groupPolicy =
      typeof body.groupPolicy === "string" && VALID_GROUP_POLICIES.has(body.groupPolicy)
        ? (body.groupPolicy as PutWhatsAppBody["groupPolicy"])
        : existing?.groupPolicy;
    const groupAllowFrom = isStringArray(body.groupAllowFrom) ? body.groupAllowFrom : existing?.groupAllowFrom;
    const groups = isStringArray(body.groups) ? body.groups : existing?.groups;

    await setWhatsAppChannelConfig({
      enabled,
      configuredAt: existing?.configuredAt ?? Date.now(),
      pluginSpec,
      accountId,
      dmPolicy,
      allowFrom,
      groupPolicy,
      groupAllowFrom,
      groups,
      lastKnownLinkState: existing?.lastKnownLinkState,
      linkedPhone: existing?.linkedPhone,
      displayName: existing?.displayName,
      lastError: existing?.lastError,
    });

    logInfo("channels.whatsapp_config_updated", {
      enabled,
      dmPolicy: dmPolicy ?? "pairing",
      groupPolicy: groupPolicy ?? "allowlist",
    });
  },

  async delete() {
    await setWhatsAppChannelConfig(null);
    logInfo("channels.whatsapp_config_removed", {});
  },
});
