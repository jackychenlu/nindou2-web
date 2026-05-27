import { buildModuleProbeRuntime } from "./module-probe-runtime.module.mjs";
import { installModuleProbeGlobals } from "./module-probe-global-bridge.module.mjs";
import { evaluateModuleProbeHealth } from "./module-probe-health.module.mjs";
import { createModuleProbeDiagnostics } from "./module-probe-diagnostics.module.mjs";

export function runModuleProbePipeline({
  sections,
  sectionKeys,
  warn = console.warn,
  target = globalThis,
}) {
  const runtime = buildModuleProbeRuntime({ sections });
  const runtimeKeys = runtime.meta.sectionKeys;
  const manifestMatchesRuntime = JSON.stringify(sectionKeys) === JSON.stringify(runtimeKeys);
  const health = evaluateModuleProbeHealth({ runtime, manifestMatchesRuntime });
  const diagnostics = createModuleProbeDiagnostics({ runtime, health });
  installModuleProbeGlobals({
    runtime,
    sectionKeys,
    manifestMatchesRuntime,
    health,
    diagnostics,
    warn,
    target,
  });
  return {
    runtime,
    manifestMatchesRuntime,
    health,
    diagnostics,
  };
}
