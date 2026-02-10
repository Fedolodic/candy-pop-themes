#!/usr/bin/env node

const path = require("path");

function loadEsbuild() {
  try {
    return require("esbuild");
  } catch (error) {
    console.error("Build failed: unable to load 'esbuild'.");
    console.error("Run 'npm ci' (with network access) to install dependencies, then retry.");
    process.exitCode = 1;
    return null;
  }
}

async function run() {
  const esbuild = loadEsbuild();
  if (!esbuild) {
    return;
  }

  const watch = process.argv.includes("--watch");
  const options = {
    entryPoints: [path.join("src", "extension.ts")],
    bundle: true,
    outfile: path.join("dist", "extension.js"),
    external: ["vscode"],
    format: "cjs",
    platform: "node",
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    console.log("Watching build changes...");
    return;
  }

  await esbuild.build(options);
  console.log("Build complete: dist/extension.js");
}

run().catch((error) => {
  console.error("Build failed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
