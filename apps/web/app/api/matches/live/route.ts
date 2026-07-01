import { NextRequest, NextResponse } from "next/server";

const FIFA_SUMMARY_BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary";
const FIFA_SUMMARY_TIMEOUT_MS = 8000;

type GenericRecord = Record<string, any>;

function asArray<T = GenericRecord>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as GenericRecord) : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function extractEventId(matchId: string) {
  const value = matchId.replace(/^fifa-/, "").trim();
  return /^\d+$/.test(value) ? value : "";
}

function formatStatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function buildTimeLabel(play: GenericRecord) {
  const clockLabel = readString(asRecord(play.clock).displayValue);
  const periodLabel =
    readString(asRecord(play.period).displayValue) ||
    readString(asRecord(play.type).text);

  return [clockLabel, periodLabel].filter(Boolean).join(" - ");
}

function mapPlayItem(play: GenericRecord) {
  const text =
    readString(play.text) ||
    readString(play.shortText) ||
    readString(asRecord(play.type).text) ||
    "Match update";

  return {
    id: readString(play.id) || `${text}-${buildTimeLabel(play)}`,
    teamCode: readString(asRecord(play.team).abbreviation),
    text,
    timeLabel: buildTimeLabel(play)
  };
}

function extractUpdates(summary: GenericRecord) {
  return asArray(summary.plays)
    .slice(-12)
    .reverse()
    .map((play) => mapPlayItem(asRecord(play)));
}

function extractScorers(summary: GenericRecord, updates: ReturnType<typeof extractUpdates>) {
  const scoringPlays = asArray(summary.scoringPlays)
    .map((play) => mapPlayItem(asRecord(play)))
    .filter((item) => item.text);

  if (scoringPlays.length) {
    return scoringPlays.reverse();
  }

  return filterUpdates(
    updates,
    (text) =>
      text.includes("goal") ||
      text.includes("scored") ||
      text.includes("penalty") ||
      text.includes("own goal")
  );
}

function filterUpdates(
  updates: ReturnType<typeof extractUpdates>,
  matcher: (lowerText: string) => boolean
) {
  return updates.filter((item) => matcher(item.text.toLowerCase()));
}

function extractTeamStats(summary: GenericRecord) {
  return asArray(summary.boxscore?.teams).map((teamEntry) => {
    const team = asRecord(teamEntry.team);
    const statistics = asArray(teamEntry.statistics)
      .map((item) => asRecord(item))
      .filter((item) => readString(item.displayValue))
      .slice(0, 8)
      .map((item) => ({
        label: formatStatLabel(readString(item.displayName) || readString(item.name)),
        value: readString(item.displayValue)
      }));

    return {
      teamCode: readString(team.abbreviation),
      teamName: readString(team.displayName) || readString(team.shortDisplayName),
      statistics
    };
  });
}

function dedupeAthletes(athletes: GenericRecord[]) {
  const seen = new Set<string>();

  return athletes.filter((item) => {
    const athlete = asRecord(item.athlete);
    const id =
      readString(athlete.id) ||
      readString(athlete.displayName) ||
      `${readString(item.jersey)}-${readString(asRecord(item.position).abbreviation)}`;

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function extractLineups(summary: GenericRecord) {
  return asArray(summary.boxscore?.players).map((teamGroup) => {
    const group = asRecord(teamGroup);
    const team = asRecord(group.team);
    const directAthletes = asArray(group.athletes).map((item) => asRecord(item));
    const nestedAthletes = asArray(group.statistics).flatMap((statBlock) =>
      asArray(asRecord(statBlock).athletes).map((item) => asRecord(item))
    );
    const athletes = dedupeAthletes([...directAthletes, ...nestedAthletes]).map((item) => {
      const athlete = asRecord(item.athlete);
      const position = asRecord(item.position);

      return {
        name: readString(athlete.displayName) || readString(athlete.shortName),
        jersey: readString(item.jersey),
        position: readString(position.abbreviation) || readString(position.displayName),
        starter: readBoolean(item.starter),
        active: readBoolean(item.active),
        subbedIn: readBoolean(item.subbedIn),
        subbedOut: readBoolean(item.subbedOut)
      };
    });

    return {
      teamCode: readString(team.abbreviation),
      teamName: readString(team.displayName) || readString(team.shortDisplayName),
      starters: athletes.filter((item) => item.starter).slice(0, 11),
      substitutes: athletes.filter((item) => !item.starter).slice(0, 12)
    };
  });
}

function extractBroadcasts(summary: GenericRecord) {
  return asArray(summary.broadcasts)
    .map((item) => asRecord(item))
    .map((item) => readString(item.name) || readString(item.shortName))
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const tournamentCode = request.nextUrl.searchParams.get("tournament");
  const matchId = request.nextUrl.searchParams.get("matchId") ?? "";

  if (tournamentCode !== "FIFA") {
    return NextResponse.json({
      ok: true,
      detail: {
        updates: [],
        scorers: [],
        cards: [],
        substitutions: [],
        lineups: [],
        teamStats: [],
        broadcasts: [],
        note:
          "Rich live detail is currently connected for FIFA World Cup fixtures. Other tournaments still show the live slate and deadline tracking."
      }
    });
  }

  const eventId = extractEventId(matchId);

  if (!eventId) {
    return NextResponse.json({
      ok: true,
      detail: {
        updates: [],
        scorers: [],
        cards: [],
        substitutions: [],
        lineups: [],
        teamStats: [],
        broadcasts: [],
        note:
          "This football fixture is using bundled schedule data, so rich live details are not available yet."
      }
    });
  }

  try {
    const response = await fetch(`${FIFA_SUMMARY_BASE_URL}?event=${eventId}`, {
      signal: AbortSignal.timeout(FIFA_SUMMARY_TIMEOUT_MS),
      next: { revalidate: 45 }
    });

    if (!response.ok) {
      throw new Error(`Live summary request failed with ${response.status}`);
    }

    const summary = (await response.json()) as GenericRecord;
    const updates = extractUpdates(summary);
    const scorers = extractScorers(summary, updates);

    return NextResponse.json({
      ok: true,
      detail: {
        updates,
        scorers,
        cards: filterUpdates(
          updates,
          (text) => text.includes("yellow card") || text.includes("red card")
        ),
        substitutions: filterUpdates(
          updates,
          (text) => text.includes("substitution") || text.includes("subbed")
        ),
        lineups: extractLineups(summary),
        teamStats: extractTeamStats(summary),
        broadcasts: extractBroadcasts(summary),
        note: ""
      }
    });
  } catch {
    return NextResponse.json({
      ok: true,
      detail: {
        updates: [],
        scorers: [],
        cards: [],
        substitutions: [],
        lineups: [],
        teamStats: [],
        broadcasts: [],
        note:
          "The live match feed is taking a timeout right now. The scorecard will keep retrying automatically."
      }
    });
  }
}
