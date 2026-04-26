import { NextResponse } from "next/server";
import {
  buildRivalryTitle,
  getTeam,
  getTeamCodeByName
} from "../../../../lib/club-data";
import { getIstDayKey } from "../../../../lib/club-logic";
import { MatchRecord } from "../../../../lib/club-types";

const SCHEDULE_SOURCE_URL =
  "https://www.schedulefixtures.com/series/ipl-2026/511/schedule-fixtures";
const SCHEDULE_TIMEOUT_MS = 8000;

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12"
};

function toIstIso(dayKey: string, time: string) {
  return `${dayKey}T${time}:00+05:30`;
}

function parseFixtureTime(label: string) {
  const cleaned = label.replace(/\s+/g, " ").trim();
  const [monthDay, weekAndTime] = cleaned.split(",");

  if (!monthDay || !weekAndTime) {
    return null;
  }

  const [monthText, dayText] = monthDay.trim().split(" ");
  const timeText = weekAndTime.split("-")[1]?.trim();

  if (!monthText || !dayText || !timeText) {
    return null;
  }

  const month = MONTHS[monthText];

  if (!month) {
    return null;
  }

  const currentYear = getIstDayKey().slice(0, 4);
  const day = dayText.padStart(2, "0");
  const [clock, meridiem] = timeText.split(" ");
  const [hourText, minuteText] = clock.split(":");

  let hour = Number(hourText);

  if (Number.isNaN(hour)) {
    return null;
  }

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  const hourValue = String(hour).padStart(2, "0");
  const dayKey = `${currentYear}-${month}-${day}`;

  return {
    dayKey,
    startsAt: toIstIso(dayKey, `${hourValue}:${minuteText}`)
  };
}

function extractText(match: RegExpMatchArray | null, position = 1) {
  return match?.[position]?.replace(/\s+/g, " ").trim() ?? "";
}

function parseFixtures(html: string) {
  const blocks = html.split("<li>").slice(1);

  return blocks.flatMap((block) => {
    if (!block.includes(" vs ") || !block.includes("<strong>")) {
      return [];
    }

    const titleText = extractText(block.match(/<strong>([^<]+)<\/strong>/i));
    const whenText = extractText(
      block.match(
        /<a class="text-orange"[^>]*>\s*([A-Z][a-z]{2}\s+\d{1,2},\s*[A-Za-z]{3}-\d{2}:\d{2}\s+[AP]M)/i
      )
    );
    const venueText = extractText(
      block.match(/fa-location-dot[^>]*<\/i>\s*([^<]+?)\s*<\/div>/i)
    );

    if (!titleText || !whenText) {
      return [];
    }

    const matchupText = titleText.split(",")[0]?.trim();
    const [homeName, awayName] = matchupText.split(" vs ").map((item) => item.trim());

    if (!homeName || !awayName) {
      return [];
    }

    const homeTeamCode = getTeamCodeByName(homeName);
    const awayTeamCode = getTeamCodeByName(awayName);
    const startsAt = parseFixtureTime(whenText);
    const matchNumber = Number(titleText.match(/(\d+)/)?.[1] ?? 0);

    if (!homeTeamCode || !awayTeamCode || !startsAt) {
      return [];
    }

    return [
      {
        id: `${startsAt.dayKey}-${homeTeamCode.toLowerCase()}-${awayTeamCode.toLowerCase()}`,
        dayKey: startsAt.dayKey,
        title: buildRivalryTitle(homeTeamCode, awayTeamCode),
        subtitle: `${homeName} vs ${awayName}`,
        venue: venueText,
        matchNumber,
        homeTeamCode,
        awayTeamCode,
        startsAt: startsAt.startsAt,
        pollOpenAt: startsAt.startsAt,
        pollLockAt: startsAt.startsAt,
        sourceLabel: "ScheduleFixtures IPL 2026",
        sourceUrl: SCHEDULE_SOURCE_URL
      } satisfies MatchRecord
    ];
  });
}

function applyPollWindows(matches: MatchRecord[]) {
  const sorted = [...matches].sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
  );

  const hasDoubleHeader = sorted.length > 1;

  return sorted.map((match, index) => {
    const kickOff = match.startsAt.slice(11, 16);
    let openTime = "15:00";

    if (kickOff === "15:30") {
      openTime = "12:00";
    } else if (hasDoubleHeader && index === 1 && kickOff === "19:30") {
      openTime = "16:00";
    }

    return {
      ...match,
      pollOpenAt: toIstIso(match.dayKey, openTime),
      pollLockAt: match.startsAt
    };
  });
}

function buildFallbackMatches(todayKey: string) {
  const fallbackByDay: Record<string, Array<{
    homeTeamCode: MatchRecord["homeTeamCode"];
    awayTeamCode: MatchRecord["awayTeamCode"];
    venue: string;
    startsAt: string;
  }>> = {
    "2026-04-25": [
      {
        homeTeamCode: "DC",
        awayTeamCode: "PBKS",
        venue: "Arun Jaitley Stadium",
        startsAt: toIstIso("2026-04-25", "15:30")
      },
      {
        homeTeamCode: "RR",
        awayTeamCode: "SRH",
        venue: "Sawai Mansingh Stadium",
        startsAt: toIstIso("2026-04-25", "19:30")
      }
    ]
  };

  const fallbackFixtures = fallbackByDay[todayKey] ?? [];

  return applyPollWindows(
    fallbackFixtures.map((fixture, index) => {
      const homeTeam = getTeam(fixture.homeTeamCode);
      const awayTeam = getTeam(fixture.awayTeamCode);

      return {
        id: `${todayKey}-${fixture.homeTeamCode.toLowerCase()}-${fixture.awayTeamCode.toLowerCase()}`,
        dayKey: todayKey,
        title: buildRivalryTitle(fixture.homeTeamCode, fixture.awayTeamCode),
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${fixture.venue}`,
        venue: fixture.venue,
        matchNumber: index + 1,
        homeTeamCode: fixture.homeTeamCode,
        awayTeamCode: fixture.awayTeamCode,
        startsAt: fixture.startsAt,
        pollOpenAt: fixture.startsAt,
        pollLockAt: fixture.startsAt,
        sourceLabel: "Bundled fallback schedule",
        sourceUrl: SCHEDULE_SOURCE_URL
      } satisfies MatchRecord;
    })
  );
}

export async function GET() {
  const todayKey = getIstDayKey();

  try {
    const response = await fetch(SCHEDULE_SOURCE_URL, {
      signal: AbortSignal.timeout(SCHEDULE_TIMEOUT_MS),
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      throw new Error(`Schedule fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    const parsedFixtures = parseFixtures(html).filter(
      (fixture) => fixture.dayKey === todayKey
    );
    const matches = applyPollWindows(parsedFixtures).map((match) => {
      const homeTeam = getTeam(match.homeTeamCode);
      const awayTeam = getTeam(match.awayTeamCode);

      return {
        ...match,
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${match.venue}`
      };
    });

    return NextResponse.json({
      dayKey: todayKey,
      matches
    });
  } catch (caughtError) {
    return NextResponse.json(
      {
        error: (
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load today's IPL schedule."
        ),
        dayKey: todayKey,
        matches: buildFallbackMatches(todayKey)
      },
      { status: 200 }
    );
  }
}
