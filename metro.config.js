const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Workaround: Metro resolves @sentry/core to ESM, which fails on './tracing/utils.js'.
// Force resolution to the CJS build.
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform, ...rest) => {
  if (moduleName === "@sentry/core") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/@sentry/core/build/cjs/index.js"
      ),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform, ...rest);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
