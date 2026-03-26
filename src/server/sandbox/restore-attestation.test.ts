import assert from "node:assert/strict";
import test from "node:test";

import {
  computeGatewayConfigHash,
  toWhatsAppGatewayConfig,
} from "@/server/openclaw/config";
import { buildRestoreAssetManifest } from "@/server/openclaw/restore-assets";
import { buildRestoreTargetAttestation } from "@/server/sandbox/restore-attestation";
import { createDefaultMeta } from "@/shared/types";

test("buildRestoreTargetAttestation includes whatsapp config in desiredDynamicConfigHash", () => {
  const base = createDefaultMeta(Date.now(), "gw-token");
  const whatsapp = {
    enabled: true,
    configuredAt: Date.now(),
    pluginSpec: "@openclaw/whatsapp",
    dmPolicy: "allowlist" as const,
    allowFrom: ["15551234567"],
    groupPolicy: "allowlist" as const,
    groupAllowFrom: ["15557654321"],
    groups: ["team-chat"],
  };

  const meta = {
    ...base,
    channels: {
      ...base.channels,
      whatsapp,
    },
  };

  const attestation = buildRestoreTargetAttestation(meta);
  const withWhatsapp = computeGatewayConfigHash({
    whatsappConfig: toWhatsAppGatewayConfig(whatsapp),
  });
  const withoutWhatsapp = computeGatewayConfigHash({});

  assert.equal(attestation.desiredDynamicConfigHash, withWhatsapp);
  assert.notEqual(attestation.desiredDynamicConfigHash, withoutWhatsapp);
});

test("buildRestoreTargetAttestation separates runtime-fresh from snapshot-stale", () => {
  const base = createDefaultMeta(Date.now(), "gw-token");
  const desiredConfigHash = computeGatewayConfigHash({});
  const desiredAssetSha256 = buildRestoreAssetManifest().sha256;

  const attestation = buildRestoreTargetAttestation({
    ...base,
    runtimeDynamicConfigHash: desiredConfigHash,
    snapshotDynamicConfigHash: "stale-snapshot-hash",
    runtimeAssetSha256: desiredAssetSha256,
    snapshotAssetSha256: desiredAssetSha256,
    restorePreparedStatus: "dirty",
    restorePreparedReason: "dynamic-config-changed",
    restorePreparedAt: 123,
  });

  assert.equal(attestation.runtimeConfigFresh, true);
  assert.equal(attestation.snapshotConfigFresh, false);
  assert.equal(attestation.runtimeAssetsFresh, true);
  assert.equal(attestation.snapshotAssetsFresh, true);
  assert.equal(attestation.reusable, false);
  assert.equal(attestation.needsPrepare, true);
  assert.deepEqual(attestation.reasons, [
    "snapshot-config-stale",
    "restore-target-dirty",
  ]);
});

test("buildRestoreTargetAttestation returns null freshness when hash is absent", () => {
  const base = createDefaultMeta(Date.now(), "gw-token");

  const attestation = buildRestoreTargetAttestation({
    ...base,
    runtimeDynamicConfigHash: null,
    snapshotDynamicConfigHash: null,
    runtimeAssetSha256: null,
    snapshotAssetSha256: null,
    restorePreparedStatus: "unknown",
    restorePreparedReason: null,
    restorePreparedAt: null,
  });

  assert.equal(attestation.runtimeConfigFresh, null);
  assert.equal(attestation.snapshotConfigFresh, null);
  assert.equal(attestation.runtimeAssetsFresh, null);
  assert.equal(attestation.snapshotAssetsFresh, null);
  assert.equal(attestation.reusable, false);
  assert.equal(attestation.needsPrepare, true);
  assert.ok(attestation.reasons.includes("snapshot-config-unknown"));
  assert.ok(attestation.reasons.includes("snapshot-assets-unknown"));
  assert.ok(attestation.reasons.includes("restore-target-unknown"));
});

test("buildRestoreTargetAttestation reports reusable when snapshot is fresh and ready", () => {
  const base = createDefaultMeta(Date.now(), "gw-token");
  const desiredConfigHash = computeGatewayConfigHash({});
  const desiredAssetSha256 = buildRestoreAssetManifest().sha256;

  const attestation = buildRestoreTargetAttestation({
    ...base,
    snapshotDynamicConfigHash: desiredConfigHash,
    runtimeDynamicConfigHash: desiredConfigHash,
    snapshotAssetSha256: desiredAssetSha256,
    runtimeAssetSha256: desiredAssetSha256,
    restorePreparedStatus: "ready",
    restorePreparedReason: "prepared",
    restorePreparedAt: Date.now(),
  });

  assert.equal(attestation.reusable, true);
  assert.equal(attestation.needsPrepare, false);
  assert.deepEqual(attestation.reasons, []);
});
