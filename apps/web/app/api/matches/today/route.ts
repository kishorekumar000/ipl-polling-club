import { NextRequest, NextResponse } from "next/server";
import {
  buildRivalryTitle,
  getDisplayTeam,
  getTeam,
  getTeamCodeByName
} from "../../../../lib/club-data";
import { getIstDayKey } from "../../../../lib/club-logic";
import { MatchRecord, TeamCode, TournamentCode } from "../../../../lib/club-types";

const IPL_SCHEDULE_SOURCE_URL =
  "https://www.schedulefixtures.com/series/ipl-2026/511/schedule-fixtures";
const IPL_SCHEDULE_TIMEOUT_MS = 8000;

const FIFA_SCOREBOARD_BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const FIFA_SCOREBOARD_TIMEOUT_MS = 8000;

const WT20_WIKIPEDIA_PAGE_URL =
  "https://en.wikipedia.org/wiki/2026_Women%27s_T20_World_Cup";
const WT20_WIKIPEDIA_RAW_URL =
  "https://en.wikipedia.org/w/index.php?title=2026_Women%27s_T20_World_Cup&action=raw";
const WT20_SCHEDULE_TIMEOUT_MS = 8000;
const MATCH_LOOKAHEAD_MS = 6 * 60 * 60 * 1000;
const MATCH_COMPLETED_GRACE_MS = 2 * 60 * 60 * 1000;

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

const WT20_FALLBACK_FIXTURES: Record<
  string,
  Array<{
    homeTeamCode: TeamCode;
    awayTeamCode: TeamCode;
    venue: string;
    startsAt: string;
  }>
> = {
  "2026-06-28": [
    {
      homeTeamCode: "BAN",
      awayTeamCode: "SA",
      venue: "Lord's, London",
      startsAt: "2026-06-28T15:00:00+05:30"
    },
    {
      homeTeamCode: "IND",
      awayTeamCode: "AUS",
      venue: "Lord's, London",
      startsAt: "2026-06-28T19:00:00+05:30"
    }
  ]
};

function toIstIso(dayKey: string, time: string) {
  return `${dayKey}T${time}:00+05:30`;
}

function getDateCandidates(dayKey: string) {
  const base = new Date(`${dayKey}T00:00:00+05:30`);

  return [-1, 0, 1].map((offset) => {
    const next = new Date(base.getTime() + offset * 24 * 60 * 60 * 1000);
    return getIstDayKey(next).replaceAll("-", "");
  });
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

function applyThreeHourPollWindows(matches: MatchRecord[]) {
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

function filterSlateMatches(matches: MatchRecord[], now = new Date()) {
  const nowMs = now.getTime();
  const lookAheadCutoff = nowMs + MATCH_LOOKAHEAD_MS;

  return matches
    .filter((match) => {
      const openAt = new Date(match.pollOpenAt).getTime();
      const lockAt = new Date(match.pollLockAt).getTime();

      return (
        openAt <= lookAheadCutoff &&
        lockAt >= nowMs - MATCH_COMPLETED_GRACE_MS
      );
    })
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
    );
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
      const homeTeam = getTeam(fixture.homeTeamCode, "IPL");
      const awayTeam = getTeam(fixture.awayTeamCode, "IPL");

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

  return applyThreeHourPollWindows(
    fixtures.map((fixture, index) => {
      const homeTeam = getDisplayTeam(fixture.homeTeamCode, {
        tournamentCode: "FIFA"
      });
      const awayTeam = getDisplayTeam(fixture.awayTeamCode, {
        tournamentCode: "FIFA"
      });

      return {
        id: `fifa-${todayKey}-${fixture.homeTeamCode.toLowerCase()}-${fixture.awayTeamCode.toLowerCase()}`,
        tournamentCode: "FIFA",
        dayKey: todayKey,
        title: buildRivalryTitle("FIFA", fixture.homeTeamCode, fixture.awayTeamCode),
        subtitle: `${homeTeam.shortName} vs ${awayTeam.shortName} at ${fixture.venue}`,
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

function buildWt20FallbackMatches(todayKey: string) {
  const fixtures = WT20_FALLBACK_FIXTURES[todayKey] ?? [];

  return applyThreeHourPollWindows(
    fixtures.map((fixture, index) => {
      const homeTeam = getDisplayTeam(fixture.homeTeamCode, {
        tournamentCode: "WT20"
      });
      const awayTeam = getDisplayTeam(fixture.awayTeamCode, {
        tournamentCode: "WT20"
      });

      return {
        id: `wt20-${todayKey}-${fixture.homeTeamCode.toLowerCase()}-${fixture.awayTeamCode.toLowerCase()}`,
        tournamentCode: "WT20",
        dayKey: todayKey,
        title: buildRivalryTitle("WT20", fixture.homeTeamCode, fixture.awayTeamCode),
        subtitle: `${homeTeam.name} vs ${awayTeam.name} at ${fixture.venue}`,
        venue: fixture.venue,
        matchNumber: index + 1,
        homeTeamCode: fixture.homeTeamCode,
        awayTeamCode: fixture.awayTeamCode,
        startsAt: fixture.startsAt,
        pollOpenAt: fixture.startsAt,
        pollLockAt: fixture.startsAt,
        sourceLabel: "Published Women's T20 World Cup schedule",
        sourceUrl: WT20_WIKIPEDIA_PAGE_URL
      } satisfies MatchRecord;
    })
  );
}

function toHexColor(value?: string, fallback = "#115e59") {
  if (!value) {
    return fallback;
  }

  return value.startsWith("#") ? value : `#${value}`;
}

type EspnCompetitor = {
  homeAway?: "home" | "away";
  team?: {
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    color?: string;
    alternateColor?: string;
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  competitions?: Array<{
    venue?: { fullName?: string };
    competitors?: EspnCompetitor[];
  }>;
};

function mapFifaEventToMatch(
  event: EspnEvent,
  index: number
): MatchRecord | null {
  const competition = event.competitions?.[0];
  const homeCompetitor = competition?.competitors?.find(
    (competitor) => competitor.homeAway === "home"
  );
  const awayCompetitor = competition?.competitors?.find(
    (competitor) => competitor.homeAway === "away"
  );

  const homeTeamCode = homeCompetitor?.team?.abbreviation?.toUpperCase();
  const awayTeamCode = awayCompetitor?.team?.abbreviation?.toUpperCase();
  const startsAt = event.date ? dateToIstIso(new Date(event.date)) : undefined;
  const dayKey = startsAt?.slice(0, 10);

  if (!homeTeamCode || !awayTeamCode || !startsAt || !dayKey) {
    return null;
  }

  const homeTeamName = homeCompetitor?.team?.displayName ?? homeTeamCode;
  const awayTeamName = awayCompetitor?.team?.displayName ?? awayTeamCode;

  return {
    id: `fifa-${event.id ?? `${dayKey}-${homeTeamCode}-${awayTeamCode}`}`,
    tournamentCode: "FIFA",
    dayKey,
    title: buildRivalryTitle("FIFA", homeTeamCode, awayTeamCode),
    subtitle: `${homeTeamName} vs ${awayTeamName}${competition?.venue?.fullName ? ` at ${competition.venue.fullName}` : ""}`,
    venue: competition?.venue?.fullName ?? "World Cup venue",
    matchNumber: index + 1,
    homeTeamCode,
    awayTeamCode,
    homeTeamName,
    awayTeamName,
    homeTeamShortName:
      homeCompetitor?.team?.shortDisplayName ?? homeCompetitor?.team?.abbreviation ?? homeTeamCode,
    awayTeamShortName:
      awayCompetitor?.team?.shortDisplayName ?? awayCompetitor?.team?.abbreviation ?? awayTeamCode,
    homeTeamLogoPath: homeCompetitor?.team?.logo,
    awayTeamLogoPath: awayCompetitor?.team?.logo,
    homeTeamPrimary: toHexColor(homeCompetitor?.team?.color, "#14532d"),
    awayTeamPrimary: toHexColor(awayCompetitor?.team?.color, "#14532d"),
    homeTeamSecondary: toHexColor(homeCompetitor?.team?.alternateColor, "#082f49"),
    awayTeamSecondary: toHexColor(awayCompetitor?.team?.alternateColor, "#082f49"),
    homeTeamAccent: "#99f6e4",
    awayTeamAccent: "#99f6e4",
    startsAt,
    pollOpenAt: startsAt,
    pollLockAt: startsAt,
    sourceLabel: "ESPN public FIFA World Cup scoreboard",
    sourceUrl: `${FIFA_SCOREBOARD_BASE_URL}?dates=${startsAt.slice(0, 10).replaceAll("-", "")}`
  } satisfies MatchRecord;
}

function cleanWikiMarkup(value: string) {
  return value
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''+/g, "")
    .replace(/''/g, "")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/\{\{[^{}]+\|([^{}|]+)\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWikiOffset(value: string) {
  const match = value.trim().match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");

  return sign * (hours * 60 + minutes);
}

function parseWt20StartsAt(
  year: string,
  month: string,
  day: string,
  timeText: string,
  offsetText: string
) {
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    !year ||
    !month ||
    !day ||
    !offsetText
  ) {
    return null;
  }

  const utcMinutes =
    hour * 60 + minute - parseWikiOffset(offsetText);
  const utcDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      0,
      utcMinutes
    )
  );

  return dateToIstIso(utcDate);
}

function parseWt20Fixtures(raw: string) {
  const blocks = raw.split("{{Single-innings cricket match").slice(1);

  return blocks.flatMap((block) => {
    const year = extractText(
      block.match(/\|\s*date\s*=\s*\{\{Start date\|df=y\|(\d{4})\|\d{2}\|\d{2}\}\}/i)
    );
    const month = extractText(
      block.match(/\|\s*date\s*=\s*\{\{Start date\|df=y\|\d{4}\|(\d{2})\|\d{2}\}\}/i)
    );
    const day = extractText(
      block.match(/\|\s*date\s*=\s*\{\{Start date\|df=y\|\d{4}\|\d{2}\|(\d{2})\}\}/i)
    );
    const timeText = extractText(
      block.match(/\|\s*time\s*=\s*\{\{UTZ\|(\d{1,2}:\d{2})\|[+-]\d{1,2}(?::\d{2})?\}\}/i)
    );
    const offsetText = extractText(
      block.match(/\|\s*time\s*=\s*\{\{UTZ\|\d{1,2}:\d{2}\|([+-]\d{1,2}(?::\d{2})?)\}\}/i)
    );
    const homeTeamCode = extractText(
      block.match(/\|\s*team1\s*=\s*\{\{crw(?:-rt)?\|([A-Z]+)\}\}/i)
    ).toUpperCase();
    const awayTeamCode = extractText(
      block.match(/\|\s*team2\s*=\s*\{\{crw(?:-rt)?\|([A-Z]+)\}\}/i)
    ).toUpperCase();
    const venue = cleanWikiMarkup(
      extractText(block.match(/\|\s*venue\s*=\s*([^\n]+)/i))
    );
    const reportUrl = extractText(block.match(/\|\s*report\s*=\s*\[([^\s\]]+)/i));
    const matchNumber = Number(extractText(block.match(/\|\s*round\s*=.*?(\d+)/i)) ?? 0);
    const startsAt = parseWt20StartsAt(year, month, day, timeText, offsetText);

    if (!homeTeamCode || !awayTeamCode || !startsAt) {
      return [];
    }

    const dayKey = startsAt.slice(0, 10);
    const homeTeam = getDisplayTeam(homeTeamCode, { tournamentCode: "WT20" });
    const awayTeam = getDisplayTeam(awayTeamCode, { tournamentCode: "WT20" });

    return [
      {
        id: `wt20-${dayKey}-${homeTeamCode.toLowerCase()}-${awayTeamCode.toLowerCase()}-${matchNumber || "fixture"}`,
        tournamentCode: "WT20",
        dayKey,
        title: buildRivalryTitle("WT20", homeTeamCode, awayTeamCode),
        subtitle: `${homeTeam.name} vs ${awayTeam.name}${venue ? ` at ${venue}` : ""}`,
        venue: venue || "Women's T20 World Cup venue",
        matchNumber,
        homeTeamCode,
        awayTeamCode,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeTeamShortName: homeTeam.shortName,
        awayTeamShortName: awayTeam.shortName,
        homeTeamPrimary: homeTeam.primary,
        awayTeamPrimary: awayTeam.primary,
        homeTeamSecondary: homeTeam.secondary,
        awayTeamSecondary: awayTeam.secondary,
        homeTeamAccent: homeTeam.accent,
        awayTeamAccent: awayTeam.accent,
        startsAt,
        pollOpenAt: startsAt,
        pollLockAt: startsAt,
        sourceLabel: "Published Women's T20 World Cup schedule",
        sourceUrl: reportUrl || WT20_WIKIPEDIA_PAGE_URL
      } satisfies MatchRecord
    ];
  });
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
    const parsedFixtures = parseIplFixtures(html);

    const matches = applyIplPollWindows(parsedFixtures).map((match) => {
      const homeTeam = getTeam(match.homeTeamCode, "IPL");
      const awayTeam = getTeam(match.awayTeamCode, "IPL");

      return {
        ...match,
        subtitle: `${homeTeam?.shortName} vs ${awayTeam?.shortName} at ${match.venue}`
      };
    });

    return filterSlateMatches(matches);
  } catch {
    return filterSlateMatches(buildIplFallbackMatches(todayKey));
  }
}

async function getFifaMatches(todayKey: string) {
  try {
    const scheduleDates = getDateCandidates(todayKey);
    const responses = await Promise.all(
      scheduleDates.map((scheduleDate) =>
        fetch(`${FIFA_SCOREBOARD_BASE_URL}?dates=${scheduleDate}`, {
          signal: AbortSignal.timeout(FIFA_SCOREBOARD_TIMEOUT_MS),
          next: { revalidate: 600 }
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(`FIFA schedule fetch failed with status ${response.status}`);
          }

          return (await response.json()) as {
            events?: EspnEvent[];
          };
        })
      )
    );

    const events = responses.flatMap((response) => response.events ?? []);
    const seenMatchIds = new Set<string>();

    const matches = events
      .map((event, index) => mapFifaEventToMatch(event, index))
      .filter((match): match is MatchRecord => Boolean(match))
      .filter((match) => {
        if (seenMatchIds.has(match.id)) {
          return false;
        }

        seenMatchIds.add(match.id);
        return true;
      })
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      )
      .map((match, index) => ({
        ...match,
        matchNumber: index + 1
      }));

    if (matches.length === 0) {
      return filterSlateMatches(buildFifaFallbackMatches(todayKey));
    }

    return filterSlateMatches(applyThreeHourPollWindows(matches));
  } catch {
    return filterSlateMatches(buildFifaFallbackMatches(todayKey));
  }
}

async function getWt20Matches(todayKey: string) {
  try {
    const response = await fetch(WT20_WIKIPEDIA_RAW_URL, {
      signal: AbortSignal.timeout(WT20_SCHEDULE_TIMEOUT_MS),
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`WT20 schedule fetch failed with status ${response.status}`);
    }

    const raw = await response.text();
    const matches = parseWt20Fixtures(raw)
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      )
      .map((match, index) => ({
        ...match,
        matchNumber: index + 1
      }));

    if (matches.length === 0) {
      return filterSlateMatches(buildWt20FallbackMatches(todayKey));
    }

    return filterSlateMatches(applyThreeHourPollWindows(matches));
  } catch {
    return filterSlateMatches(buildWt20FallbackMatches(todayKey));
  }
}

export async function GET(request: NextRequest) {
  const todayKey = getIstDayKey();
  const tournamentParam = request.nextUrl.searchParams.get("tournament");

  let tournamentCode: TournamentCode = "IPL";

  if (tournamentParam === "FIFA") {
    tournamentCode = "FIFA";
  } else if (tournamentParam === "WT20") {
    tournamentCode = "WT20";
  }

  const matches =
    tournamentCode === "FIFA"
      ? await getFifaMatches(todayKey)
      : tournamentCode === "WT20"
        ? await getWt20Matches(todayKey)
        : await getIplMatches(todayKey);

  return NextResponse.json({
    tournamentCode,
    dayKey: todayKey,
    matches
  });
}
