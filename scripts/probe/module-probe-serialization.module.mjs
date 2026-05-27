export function toStableJson(value) {
  return JSON.stringify(value, null, 2);
}

export function createModuleProbeSnapshotJson(snapshot) {
  return toStableJson(snapshot);
}
