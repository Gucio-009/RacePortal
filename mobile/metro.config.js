const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");
const apiTypesEntry = path.resolve(monorepoRoot, "packages/api-types/src/index.ts");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.resolve(monorepoRoot, "packages/api-types")];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@raceportal/api-types": path.resolve(monorepoRoot, "packages/api-types"),
};

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@raceportal/api-types") {
    return { filePath: apiTypesEntry, type: "sourceFile" };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
