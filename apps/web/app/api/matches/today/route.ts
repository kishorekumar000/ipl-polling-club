import { NextRequest, NextResponse } from "next/server";
import {
  buildRivalryTitle,
  getTeam,
  getTeamCodeByName
} from "../../../../lib/club-data";
import { getIstDayKey } from "../../../../lib/club-logic";
import { MatchRecord, TeamCode, TournamentCode } from "../../../../lib/club-types";

const IPL_SCHEDULE_SOURCE_URL =
  "https://www.schedulefixtures.com/series/ipl-2026/511/schedule-fixtures";
const IPL_SCHEDULE_TIMEOUT_MS = 8000;

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

const FIFA_FALLBACK_FIXTURES: Record<
  string,
  Array<{
    homeTeamCode: TeamCode;
    awayTeamCode: TeamCode;
    venue: string;
    startsAt: string;
  }>
> = {
  "2026-06-27": [
    {
      homeTeamCode: "ARG",
      awayTeamCode: "MEX",
      venue: "Estadio Azteca",
      startsAt: "2026-06-27T21:00:00+05:30"
    },
    {
      homeTeamCode: "FRA",
      awayTeamCode: "USA",
      venue: "MetLife Stadium",
      startsAt: "2026-06-27T23:30:00+05:30"
    }
  ],
  "2026-06-28": [
    {
      homeTeamCode: "BRA",
      awayTeamCode: "POR",
      venue: "SoFi Stadium",
      startsAt: "2026-06-28T20:30:00+05:30"
    },
    {
      homeTeamCode: "ENG",
      awayTeamCode: "GER",
      venue: "AT&T Stadium",
      startsAt: "2026-06-28T23:30:00+05:30"
    }
  ],
  "2026-06-29": [
    {
      homeTeamCode: "ESP",
      awayTeamCode: "NED",
      venue: "BC Place",
      startsAt: "2026-06-29T20:30:00+05:30"
    },
    {
      homeTeamCode: "URU",
      awayTeamCode: "CRO",
      venue: "Hard Rock Stadium",
      startsAt: "2026-06-29T23:30:00+05:30"
    }
  ]
};

function toIstIso(dayKey: string, time: string) {
  return `${dayKey}T${time}:00+05:30`;
}

function dateToIstIso(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:${minute}:00+05:30`;
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

function parseIplFixtures(html: string) {
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
        id: `ipl-${startsAt.dayKey}-${homeTeamCode.toLowerCase()}-${awayTeamCode.toLowerCase()}`,
        tournamentCode: "IPL",
        dayKey: startsAt.dayKey,
        title: buildRivalryTitle("IPL", homeTeamCode, awayTeamCode),
        subtitle: `${homeName} vs ${awayName}`,
        venue: venueText,
        matchNumber,
        homeTeamCode,
        awayTeamCode,
        startsAt: startsAt.startsAt,
        pollOpenAt: startsAt.startsAt,
        pollLockAt: startsAt.startsAt,
        sourceLabel: "ScheduleFixtures IPL 2026",
        sourceUrl: IPL_SCHEDULE_SOURCE_URL
      } satisfies MatchRecord
    ];
  });
}

function applyIplPollWindows(matches: MatchRecord[]) {
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

function applyFifaPollWindows(matches: MatchRecord[]) {
  return matches.map((match) => {
    const kickOff = new Date(match.startsAt).getTime();
    const openAt = new Date(kickOff - 3 * 60 * 60 * 1000);

    return {
      ...match,
      pollOpenAt: dateToIstIso(openAt),
      pollLockAt: match.startsAt
    };
  });
}

function buildIplFallbackMatches(todayKey: string) {
  const fallbackByDay: Record<
    string,
    Array<{
      homeTeamCode: MatchRecord["homeTeamCode"];
      awayTeamCode: MatchRecord["awayTeamCode"];
      venue: string;
      startsAt: string;
    }>
  > = {
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

  return applyIplPollWindows(
    fallbackFixtures.map((fixture, index) => {
      const homeTeam = getTeam(fixture.homeTeamCode);
      const awayTeam = getTeam(fixture.awayTeamCode);

      return {
        id: `ipl-${todayKey}-${fixture.homeTeamCode.toLowerCase()}-${fixture.awayTeamCode.toLowerCase()}`,
        tournamentCode: "IPL",
        dayKey: todayKey,
        title: buildRivalryTitle("IPL", fixture.homeTeamCode, fixture.awayTeamCode),
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${fixture.venue}`,
        venue: fixture.venue,
        matchNumber: index + 1,
        homeTeamCode: fixture.homeTeamCode,
        awayTeamCode: fixture.awayTeamCode,
        startsAt: fixture.startsAt,
        pollOpenAt: fixture.startsAt,
        pollLockAt: fixture.startsAt,
        sourceLabel: "Bundled fallback schedule",
        sourceUrl: IPL_SCHEDULE_SOURCE_URL
      } satisfies MatchRecord;
    })
  );
}

function buildFifaFallbackMatches(todayKey: string) {
  const fixtures = FIFA_FALLBACK_FIXTURES[todayKey] ?? [];

  return applyFifaPollWindows(
    fixtures.map((fixture, index) => {
      const homeTeam = getTeam(fixture.homeTeamCode);
      const awayTeam = getTeam(fixture.awayTeamCode);

      return {
        id: `fifa-${todayKey}-${fixture.homeTeamCode.toLowerCase()}-${fixture.awayTeamCode.toLowerCase()}`,
        tournamentCode: "FIFA",
        dayKey: todayKey,
        title: buildRivalryTitle("FIFA", fixture.homeTeamCode, fixture.awayTeamCode),
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${fixture.venue}`,
        venue: fixture.venue,
        matchNumber: index + 1,
        homeTeamCode: fixture.homeTeamCode,
        awayTeamCode: fixture.awayTeamCode,
        startsAt: fixture.startsAt,
        pollOpenAt: fixture.startsAt,
        pollLockAt: fixture.startsAt,
        sourceLabel: "Bundled FIFA World Cup showcase slate"
      } satisfies MatchRecord;
    })
  );
}

async function getIplMatches(todayKey: string) {
  try {
    const response = await fetch(IPL_SCHEDULE_SOURCE_URL, {
      signal: AbortSignal.timeout(IPL_SCHEDULE_TIMEOUT_MS),
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      throw new Error(`Schedule fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    const parsedFixtures = parseIplFixtures(html).filter(
      (fixture) => fixture.dayKey === todayKey
    );

    return applyIplPollWindows(parsedFixtures).map((match) => {
      const homeTeam = getTeam(match.homeTeamCode);
      const awayTeam = getTeam(match.awayTeamCode);

      return {
        ...match,
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${match.venue}`
      };
    });
  } catch {
    return buildIplFallbackMatches(todayKey);
  }
}

function getFifaMatches(todayKey: string) {
  return buildFifaFallbackMatches(todayKey);
}

export async function GET(request: NextRequest) {
  const todayKey = getIstDayKey();
  const tournamentParam = request.nextUrl.searchParams.get("tournament");
  const tournamentCode: TournamentCode =
    tournamentParam === "FIFA" ? "FIFA" : "IPL";

  const matches =
    tournamentCode === "FIFA"
      ? getFifaMatches(todayKey)
      : await getIplMatches(todayKey);

  return NextResponse.json({
    tournamentCode,
    dayKey: todayKey,
    matches
  });
}
