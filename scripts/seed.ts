import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import User from "../models/User";
import DepartmentConfig from "../models/DepartmentConfig";
import { DEFAULT_DEPARTMENT_DIRECTORY } from "../lib/eventProposalPresets";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ksac_office";

async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Seeding Department Directory...");
  for (const dept of DEFAULT_DEPARTMENT_DIRECTORY) {
    await DepartmentConfig.findOneAndUpdate(
      { categoryKey: dept.categoryKey },
      dept,
      { upsert: true, new: true }
    );
  }
  console.log(`Department Directory seeded (${DEFAULT_DEPARTMENT_DIRECTORY.length} departments).`);

  const passwordHash = await bcrypt.hash("Password@123", 10);
  const deanPasswordHash = await bcrypt.hash("Dean@123", 10);

  // 1. Dean KSAC
  const dean = await User.findOneAndUpdate(
    { email: "deanksac@kiit.ac.in" },
    {
      name: "Dr. Jyotin Kumar Das",
      email: "deanksac@kiit.ac.in",
      passwordHash: deanPasswordHash,
      role: "dean",
      position: "Dean KSAC",
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );
  console.log("Dean KSAC seeded:", dean.email);

  // 2. Demo Society Presidents
  const demoUsers = [
    {
      name: "Suryansh Das",
      email: "president.film@kiit.ac.in",
      rollNo: "23051959",
      role: "president",
      society: "KIIT Film Society",
      position: "President",
      societyPositions: [{ society: "KIIT Film Society", position: "President" }],
    },
    {
      name: "Sumit Deshpande",
      email: "president.intl@kiit.ac.in",
      rollNo: "25114012",
      role: "president",
      society: "KIIT Intl. Student Society",
      position: "President",
      societyPositions: [{ society: "KIIT Intl. Student Society", position: "President" }],
    },
    {
      name: "Priyanshu Kumar",
      email: "president.kalakaar@kiit.ac.in",
      rollNo: "2304106",
      role: "president",
      society: "Kalakaar",
      position: "President",
      societyPositions: [{ society: "Kalakaar", position: "President" }],
    },
    {
      name: "Shivanshu Agarwal",
      email: "vp.film@kiit.ac.in",
      rollNo: "24051050",
      role: "vice_president",
      society: "KIIT Film Society",
      position: "Vice-President",
      societyPositions: [{ society: "KIIT Film Society", position: "Vice-President" }],
    },
  ];

  for (const u of demoUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        ...u,
        passwordHash,
        tokenVersion: 0,
      },
      { upsert: true, new: true }
    );
    console.log(`User seeded: ${u.name} (${u.position} - ${u.society})`);
  }

  console.log("Seeding complete! You can login with:");
  console.log("  Dean KSAC: deanksac@kiit.ac.in / Dean@123");
  console.log("  Film Society President: president.film@kiit.ac.in / Password@123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
