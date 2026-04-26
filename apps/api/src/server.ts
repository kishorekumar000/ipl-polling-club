import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT || 4000);
const dataDirectory = path.join(process.cwd(), "data");
const stateFile = path.join(dataDirectory, "shared-state.json");

app.use(cors());
app.use(express.json());

function createEmptyState() {
  return {
    users: [],
    matches: [],
    votes: [],
    settlements: [],
    carryBalance: 0,
    auditTrail: [],
    appNotifications: []
  };
}

function normalizeState(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return createEmptyState();
  }

  const candidate = payload as Record<string, unknown>;

  return {
    users: Array.isArray(candidate.users) ? candidate.users : [],
    matches: Array.isArray(candidate.matches) ? candidate.matches : [],
    votes: Array.isArray(candidate.votes) ? candidate.votes : [],
    settlements: Array.isArray(candidate.settlements) ? candidate.settlements : [],
    carryBalance:
      typeof candidate.carryBalance === "number" ? candidate.carryBalance : 0,
    auditTrail: Array.isArray(candidate.auditTrail) ? candidate.auditTrail : [],
    appNotifications: Array.isArray(candidate.appNotifications)
      ? candidate.appNotifications
      : []
  };
}

async function ensureStateFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(stateFile);
  } catch {
    await fs.writeFile(
      stateFile,
      JSON.stringify(createEmptyState(), null, 2),
      "utf-8"
    );
  }
}

async function readSharedState() {
  await ensureStateFile();
  const raw = await fs.readFile(stateFile, "utf-8");
  return normalizeState(JSON.parse(raw));
}

async function writeSharedState(payload: unknown) {
  const nextState = normalizeState(payload);
  await ensureStateFile();
  await fs.writeFile(stateFile, JSON.stringify(nextState, null, 2), "utf-8");
  return nextState;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ipl-api",
    message: "API scaffold is ready for auth, matches, voting, and settlements."
  });
});

app.get("/state", async (_req, res) => {
  try {
    const state = await readSharedState();
    res.json({
      ok: true,
      state
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not read shared state."
    });
  }
});

app.put("/state", async (req, res) => {
  try {
    const state = await writeSharedState(req.body);
    res.json({
      ok: true,
      state
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not write shared state."
    });
  }
});

app.listen(port, () => {
  console.log(`IPL API listening on http://localhost:${port}`);
});
