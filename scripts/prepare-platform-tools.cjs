#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const platform = process.platform;
const toolsDir = path.join(__dirname, "../src-tauri/tools");
const targetScrcpyDir = path.join(toolsDir, "scrcpy");

console.log("================================================");
console.log("Preparing scrcpy resources for platform:", platform);
console.log("================================================");

// 1. Clean up old extracted directory
if (fs.existsSync(targetScrcpyDir)) {
  console.log("Cleaning up old scrcpy directory...");
  fs.rmSync(targetScrcpyDir, { recursive: true, force: true });
}
fs.mkdirSync(targetScrcpyDir, { recursive: true });

// 2. Extract specific platform archive
try {
  if (platform === "win32") {
    const zipPath = path.join(toolsDir, "scrcpy-win64-v3.3.3.zip");
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Windows scrcpy archive not found: ${zipPath}`);
    }
    console.log(`Extracting Windows scrcpy: ${zipPath}`);
    // Windows 10+ natively includes tar handling zip or powershell Expand-Archive
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetScrcpyDir}' -Force"`,
      { stdio: "inherit" },
    );
  } else if (platform === "linux") {
    const tarPath = path.join(toolsDir, "scrcpy-linux-x86_64-v3.3.3.tar.gz");
    if (!fs.existsSync(tarPath)) {
      throw new Error(`Linux scrcpy archive not found: ${tarPath}`);
    }
    console.log(`Extracting Linux scrcpy: ${tarPath}`);
    execSync(`tar -xzf "${tarPath}" -C "${targetScrcpyDir}"`, {
      stdio: "inherit",
    });
  } else {
    console.log(`Platform ${platform} is skipped for scrcpy auto-extraction.`);
    process.exit(0);
  }

  // 3. Flatten directory if it extracted a single folder (e.g., scrcpy-win64-v3.3.3 inside targetScrcpyDir)
  const extractedItems = fs.readdirSync(targetScrcpyDir);
  if (extractedItems.length === 1) {
    const innerDirPath = path.join(targetScrcpyDir, extractedItems[0]);
    if (fs.statSync(innerDirPath).isDirectory()) {
      console.log(`Flattening inner directory: ${extractedItems[0]}`);
      const innerFiles = fs.readdirSync(innerDirPath);
      for (const file of innerFiles) {
        fs.renameSync(
          path.join(innerDirPath, file),
          path.join(targetScrcpyDir, file),
        );
      }
      fs.rmdirSync(innerDirPath);
    }
  }

  // -- ADB EXCLUSIVE PACKAGING --
  const targetAdbDir = path.join(toolsDir, 'adb-bin');
  if (fs.existsSync(targetAdbDir)) {
      console.log('Cleaning up old adb-bin directory...');
      fs.rmSync(targetAdbDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetAdbDir, { recursive: true });

  const sourceAdbDir = platform === 'win32' ? path.join(toolsDir, 'adb', 'windows') : path.join(toolsDir, 'adb', 'linux');
  if (!fs.existsSync(sourceAdbDir)) {
      console.warn(`Source ADB directory missing: ${sourceAdbDir}`);
  } else {
      console.log(`Copying ADB tools from ${sourceAdbDir} to ${targetAdbDir}`);
      const files = fs.readdirSync(sourceAdbDir);
      for (const file of files) {
          fs.copyFileSync(path.join(sourceAdbDir, file), path.join(targetAdbDir, file));
      }
  }

  console.log('✅ Scrcpy and ADB tools prepared successfully!');
} catch (error) {
  console.error("❌ Failed to prepare scrcpy tools:", error.message);
  process.exit(1);
}
