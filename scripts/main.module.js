import { bootstrapRuntime } from "./runtime-bootstrap.module.mjs";

const runtimeBootstrap = await bootstrapRuntime();
globalThis.NindouRuntimeBootstrap = runtimeBootstrap;
