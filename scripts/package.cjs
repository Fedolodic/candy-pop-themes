#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

function runBuild() {
  const buildScript = path.join(__dirname, "build.cjs");
  const result = spawnSync(process.execPath, [buildScript], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function runPackage() {
  let vsce;
  try {
    vsce = require("@vscode/vsce");
  } catch (error) {
    console.error("Package failed: unable to load '@vscode/vsce'.");
    console.error("Run 'npm ci' (with network access) to install dependencies, then retry.");
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, "..");
  const packageJson = require(path.join(projectRoot, "package.json"));
  const packagePath = `${packageJson.name}-${packageJson.version}.vsix`;
  const outputPath = path.join(projectRoot, packagePath);

  await vsce.createVSIX({
    cwd: projectRoot,
    packagePath,
  });

  console.log(`Package complete: ${outputPath}`);
}

async function main() {
  runBuild();
  await runPackage();
}

main().catch((error) => {
  console.error("Package failed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
