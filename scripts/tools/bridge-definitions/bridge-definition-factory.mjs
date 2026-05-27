import { stripImportsAndExports } from "./bridge-transform-utils.mjs";

function buildGlobalTail(globalName, exportsMap) {
  const body = Object.entries(exportsMap)
    .map(([alias, localName]) => `  ${alias}: ${localName},`)
    .join("\n");
  return `\n\nglobalThis.${globalName} = {\n${body}\n};\n`;
}

export function createGlobalBridgeDefinition({
  key,
  moduleRelativePath,
  classicRelativePath,
  runScriptName,
  globalName,
  exportsMap,
  stripImports = true,
}) {
  const tail = buildGlobalTail(globalName, exportsMap);
  return {
    key,
    moduleRelativePath,
    classicRelativePath,
    runScriptName,
    transform: (moduleSource) => {
      const normalized = stripImports
        ? stripImportsAndExports(moduleSource)
        : moduleSource.replace(/^export\s+/gm, "");
      return `${normalized}${tail}`;
    },
  };
}
