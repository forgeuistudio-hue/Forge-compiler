import { ForgeTestRunner } from "../runner";
import { GOLDEN_TEST_SUITE } from "../golden";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is required. Please set it in your environment or .env file.");
    process.exit(1);
  }

  const runner = new ForgeTestRunner(apiKey);
  const updateMode = process.argv.includes("--update");
  const snapshotsDir = path.join(__dirname, "../snapshots");

  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  console.log(`🚀 Running Forge Golden Suite (${updateMode ? "UPDATE" : "STRICT"} mode)...`);

  const results = await runner.runSuite(GOLDEN_TEST_SUITE);

  let allPassed = true;

  for (const result of results) {
    const snapshotPath = path.join(snapshotsDir, `${result.name.toLowerCase().replace(/\s+/g, "-")}.jsx`);
    
    if (updateMode) {
      if (result.status === "pass" || result.status === "fail") {
        if (result.jsx) {
          fs.writeFileSync(snapshotPath, result.jsx);
          console.log(`✅ Updated snapshot for: ${result.name}`);
        }
      } else {
        console.error(`❌ Error generating snapshot for ${result.name}: ${result.message}`);
        allPassed = false;
      }
    } else {
      if (result.status !== "pass") {
        console.error(`❌ Test FAILED: ${result.name}`);
        console.error(`   Reason: ${result.message}`);
        allPassed = false;
      } else {
        // If it passed, we still need to check against the snapshot if it exists
        if (fs.existsSync(snapshotPath)) {
          const snapshot = fs.readFileSync(snapshotPath, "utf-8");
          if (snapshot !== result.jsx) {
            console.error(`❌ Snapshot MISMATCH: ${result.name}`);
            allPassed = false;
          } else {
            console.log(`✅ Test PASSED: ${result.name}`);
          }
        } else {
          console.warn(`⚠️ No snapshot found for: ${result.name}. Run with --update to generate.`);
          allPassed = false;
        }
      }
    }
  }

  if (!allPassed) {
    process.exit(1);
  }

  console.log("\n✨ All tests completed successfully!");
}

main().catch(console.error);
