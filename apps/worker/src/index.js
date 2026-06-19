import dotenv from "dotenv";
import cron from "node-cron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "../../api/src/config/db.js";
import { Service } from "../../api/src/models/index.js";
import { runServiceCheck } from "../../api/src/services/monitoringService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../.env")
});

async function runChecks() {
  const services = await Service.find({}).sort({ createdAt: 1 });

  for (const service of services) {
    try {
      await runServiceCheck(service);
      console.log(`Checked ${service.name}`);
    } catch (error) {
      console.error(`Failed to check ${service.name}: ${error.message}`);
    }
  }
}

await connectDB();
await runChecks();

cron.schedule("* * * * *", runChecks);

console.log("NetPulse worker running scheduled checks every minute");
