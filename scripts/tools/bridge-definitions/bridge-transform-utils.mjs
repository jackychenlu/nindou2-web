export const stripImportsAndExports = (moduleSource) => moduleSource
  .split(/\r?\n/)
  .filter((line) => !line.startsWith("import "))
  .join("\n")
  .replace(/^export\s+/gm, "");
