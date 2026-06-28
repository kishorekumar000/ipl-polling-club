import {
  AppState,
  ClubTeam,
  IplTeamCode,
  TeamCode,
  TournamentCode,
  UserRole
} from "./club-types";

export const TOURNAMENTS: Array<{
  code: TournamentCode;
  name: string;
  shortName: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}> = [
  {
    code: "IPL",
    name: "Indian Premier League",
    shortName: "IPL",
    description: "Franchise cricket daily winner polls",
    primary: "#0b1c33",
    secondary: "#1f5c9a",
    accent: "#ffcb47"
  },
  {
    code: "FIFA",
    name: "FIFA World Cup",
    shortName: "FIFA WC",
    description: "International football winner polls",
    primary: "#062349",
    secondary: "#0ea5e9",
    accent: "#7ef3d0"
  },
  {
    code: "WT20",
    name: "Women's T20 World Cup",
    shortName: "Women's T20",
    description: "International women's cricket winner polls",
    primary: "#32144f",
    secondary: "#ee5aa6",
    accent: "#ffd166"
  }
];

export const IPL_TEAMS: ClubTeam[] = [
  {
    tournamentCode: "IPL",
    code: "CSK",
    name: "Chennai Super Kings",
    shortName: "CSK",
    nickname: "Whistle Kings",
    symbol: "Lion",
    logoPath: "/team-logos/csk.jpeg",
    primary: "#f2bf27",
    secondary: "#f7df7a",
    accent: "#1f4f9a"
  },
  {
    tournamentCode: "IPL",
    code: "DC",
    name: "Delhi Capitals",
    shortName: "DC",
    nickname: "Capital Charge",
    symbol: "Tiger",
    primary: "#17479e",
    secondary: "#ef1b23",
    accent: "#7dc9ff"
  },
  {
    tournamentCode: "IPL",
    code: "GT",
    name: "Gujarat Titans",
    shortName: "GT",
    nickname: "Titans",
    symbol: "Trident",
    primary: "#1d2951",
    secondary: "#99d6ea",
    accent: "#f6c453"
  },
  {
    tournamentCode: "IPL",
    code: "KKR",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    nickname: "Knight Wave",
    symbol: "Helm",
    logoPath: "/team-logos/kkr.jpeg",
    primary: "#3d2256",
    secondary: "#d4a94d",
    accent: "#8d63c7"
  },
  {
    tournamentCode: "IPL",
    code: "LSG",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    nickname: "Sky Giants",
    symbol: "Wings",
    primary: "#0d8bd9",
    secondary: "#f6b322",
    accent: "#7ed4ff"
  },
  {
    tournamentCode: "IPL",
    code: "MI",
    name: "Mumbai Indians",
    shortName: "MI",
    nickname: "Blue Storm",
    symbol: "Wave",
    logoPath: "/team-logos/mi.jpeg",
    primary: "#005da0",
    secondary: "#52b8ff",
    accent: "#f2c94c"
  },
  {
    tournamentCode: "IPL",
    code: "PBKS",
    name: "Punjab Kings",
    shortName: "PBKS",
    nickname: "Red Brigade",
    symbol: "Shield",
    primary: "#d71920",
    secondary: "#f4b6b8",
    accent: "#ffd166"
  },
  {
    tournamentCode: "IPL",
    code: "RCB",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    nickname: "Royal Blaze",
    symbol: "Crest",
    logoPath: "/team-logos/rcb.jpeg",
    primary: "#c61b3b",
    secondary: "#111111",
    accent: "#ffd166"
  },
  {
    tournamentCode: "IPL",
    code: "RR",
    name: "Rajasthan Royals",
    shortName: "RR",
    nickname: "Royal Pink",
    symbol: "Crown",
    primary: "#ea1a85",
    secondary: "#0f5ea8",
    accent: "#ffc6e8"
  },
  {
    tournamentCode: "IPL",
    code: "SRH",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    nickname: "Orange Army",
    symbol: "Phoenix",
    primary: "#f26522",
    secondary: "#1c1c1c",
    accent: "#ffcf91"
  }
];

export const FIFA_TEAMS: ClubTeam[] = [
  {
    tournamentCode: "FIFA",
    code: "ARG",
    name: "Argentina",
    shortName: "ARG",
    nickname: "Sky Champions",
    symbol: "Sun Crest",
    primary: "#7cc9f5",
    secondary: "#ffffff",
    accent: "#f2c84b"
  },
  {
    tournamentCode: "FIFA",
    code: "AUS",
    name: "Australia",
    shortName: "AUS",
    nickname: "Socceroos",
    symbol: "Southern Crest",
    primary: "#f7c948",
    secondary: "#0f6f3c",
    accent: "#fff1a6"
  },
  {
    tournamentCode: "FIFA",
    code: "AUT",
    name: "Austria",
    shortName: "AUT",
    nickname: "Alpine Pulse",
    symbol: "Mountain Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#7cc6fe"
  },
  {
    tournamentCode: "FIFA",
    code: "BEL",
    name: "Belgium",
    shortName: "BEL",
    nickname: "Red Devils",
    symbol: "Devil Crest",
    primary: "#c1121f",
    secondary: "#111111",
    accent: "#f4c542"
  },
  {
    tournamentCode: "FIFA",
    code: "BRA",
    name: "Brazil",
    shortName: "BRA",
    nickname: "Samba Gold",
    symbol: "Star Shield",
    primary: "#159947",
    secondary: "#f5d547",
    accent: "#2d5df5"
  },
  {
    tournamentCode: "FIFA",
    code: "CAN",
    name: "Canada",
    shortName: "CAN",
    nickname: "Maple Charge",
    symbol: "Maple Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#1d3557"
  },
  {
    tournamentCode: "FIFA",
    code: "CHI",
    name: "Chile",
    shortName: "CHI",
    nickname: "Andes Flame",
    symbol: "Condor Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  },
  {
    tournamentCode: "FIFA",
    code: "COL",
    name: "Colombia",
    shortName: "COL",
    nickname: "Cafeteros Gold",
    symbol: "Condor Mark",
    primary: "#f4c542",
    secondary: "#0b3d91",
    accent: "#d62828"
  },
  {
    tournamentCode: "FIFA",
    code: "CRC",
    name: "Costa Rica",
    shortName: "CRC",
    nickname: "Tico Surge",
    symbol: "Wave Crest",
    primary: "#b91c1c",
    secondary: "#ffffff",
    accent: "#0b3d91"
  },
  {
    tournamentCode: "FIFA",
    code: "ENG",
    name: "England",
    shortName: "ENG",
    nickname: "Three Lions",
    symbol: "Lion Crest",
    primary: "#ffffff",
    secondary: "#d71920",
    accent: "#00247d"
  },
  {
    tournamentCode: "FIFA",
    code: "DEN",
    name: "Denmark",
    shortName: "DEN",
    nickname: "Nordic Red",
    symbol: "Cross Crest",
    primary: "#c1121f",
    secondary: "#ffffff",
    accent: "#87ceeb"
  },
  {
    tournamentCode: "FIFA",
    code: "ECU",
    name: "Ecuador",
    shortName: "ECU",
    nickname: "Condor Gold",
    symbol: "Condor Crest",
    primary: "#f4c542",
    secondary: "#0b3d91",
    accent: "#d62828"
  },
  {
    tournamentCode: "FIFA",
    code: "EGY",
    name: "Egypt",
    shortName: "EGY",
    nickname: "Pharaohs",
    symbol: "Falcon Crest",
    primary: "#c1121f",
    secondary: "#111111",
    accent: "#f4c542"
  },
  {
    tournamentCode: "FIFA",
    code: "ESP",
    name: "Spain",
    shortName: "ESP",
    nickname: "La Roja",
    symbol: "Crown Flame",
    primary: "#c1121f",
    secondary: "#fcbf49",
    accent: "#780000"
  },
  {
    tournamentCode: "FIFA",
    code: "FRA",
    name: "France",
    shortName: "FRA",
    nickname: "Blue Roar",
    symbol: "Rooster Crest",
    primary: "#0b3d91",
    secondary: "#ffffff",
    accent: "#ef233c"
  },
  {
    tournamentCode: "FIFA",
    code: "GHA",
    name: "Ghana",
    shortName: "GHA",
    nickname: "Black Stars",
    symbol: "Star Crest",
    primary: "#111111",
    secondary: "#d62828",
    accent: "#f4c542"
  },
  {
    tournamentCode: "FIFA",
    code: "GER",
    name: "Germany",
    shortName: "GER",
    nickname: "Eagle Line",
    symbol: "Eagle Mark",
    primary: "#111111",
    secondary: "#ffffff",
    accent: "#dd1c1a"
  },
  {
    tournamentCode: "FIFA",
    code: "IRN",
    name: "Iran",
    shortName: "IRN",
    nickname: "Persian Charge",
    symbol: "Lion Crest",
    primary: "#00843d",
    secondary: "#ffffff",
    accent: "#d62828"
  },
  {
    tournamentCode: "FIFA",
    code: "ITA",
    name: "Italy",
    shortName: "ITA",
    nickname: "Azzurri Tide",
    symbol: "Shield Line",
    primary: "#0057b8",
    secondary: "#ffffff",
    accent: "#1db954"
  },
  {
    tournamentCode: "FIFA",
    code: "KOR",
    name: "South Korea",
    shortName: "KOR",
    nickname: "Taeguk Tigers",
    symbol: "Tiger Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  },
  {
    tournamentCode: "FIFA",
    code: "MAR",
    name: "Morocco",
    shortName: "MAR",
    nickname: "Atlas Charge",
    symbol: "Atlas Star",
    primary: "#b91c1c",
    secondary: "#0f5132",
    accent: "#f6e05e"
  },
  {
    tournamentCode: "FIFA",
    code: "MEX",
    name: "Mexico",
    shortName: "MEX",
    nickname: "Aztec Wave",
    symbol: "Eagle Sun",
    primary: "#006847",
    secondary: "#ffffff",
    accent: "#ce1126"
  },
  {
    tournamentCode: "FIFA",
    code: "NGA",
    name: "Nigeria",
    shortName: "NGA",
    nickname: "Super Eagles",
    symbol: "Eagle Crest",
    primary: "#008751",
    secondary: "#ffffff",
    accent: "#9be564"
  },
  {
    tournamentCode: "FIFA",
    code: "NED",
    name: "Netherlands",
    shortName: "NED",
    nickname: "Orange Storm",
    symbol: "Lion Banner",
    primary: "#f97316",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  },
  {
    tournamentCode: "FIFA",
    code: "NZL",
    name: "New Zealand",
    shortName: "NZL",
    nickname: "All Whites",
    symbol: "Silver Fern",
    primary: "#111111",
    secondary: "#ffffff",
    accent: "#8fe3cf"
  },
  {
    tournamentCode: "FIFA",
    code: "PAR",
    name: "Paraguay",
    shortName: "PAR",
    nickname: "Guarani Charge",
    symbol: "Striped Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  },
  {
    tournamentCode: "FIFA",
    code: "POL",
    name: "Poland",
    shortName: "POL",
    nickname: "White Eagles",
    symbol: "Eagle Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#9fd3ff"
  },
  {
    tournamentCode: "FIFA",
    code: "POR",
    name: "Portugal",
    shortName: "POR",
    nickname: "Navigator Fire",
    symbol: "Cross Crest",
    primary: "#046a38",
    secondary: "#da291c",
    accent: "#f6c453"
  },
  {
    tournamentCode: "FIFA",
    code: "RSA",
    name: "South Africa",
    shortName: "RSA",
    nickname: "Bafana Bafana",
    symbol: "Protea Crest",
    primary: "#0c562e",
    secondary: "#ffb81c",
    accent: "#ffffff"
  },
  {
    tournamentCode: "FIFA",
    code: "SEN",
    name: "Senegal",
    shortName: "SEN",
    nickname: "Teranga Lions",
    symbol: "Lion Star",
    primary: "#00853f",
    secondary: "#fdef42",
    accent: "#e31b23"
  },
  {
    tournamentCode: "FIFA",
    code: "SRB",
    name: "Serbia",
    shortName: "SRB",
    nickname: "White Eagles",
    symbol: "Cross Shield",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#0b3d91"
  },
  {
    tournamentCode: "FIFA",
    code: "SUI",
    name: "Switzerland",
    shortName: "SUI",
    nickname: "Alpine Reds",
    symbol: "Cross Crest",
    primary: "#d62828",
    secondary: "#ffffff",
    accent: "#87ceeb"
  },
  {
    tournamentCode: "FIFA",
    code: "TUN",
    name: "Tunisia",
    shortName: "TUN",
    nickname: "Carthage Eagles",
    symbol: "Eagle Crest",
    primary: "#c1121f",
    secondary: "#ffffff",
    accent: "#111111"
  },
  {
    tournamentCode: "FIFA",
    code: "TUR",
    name: "Turkey",
    shortName: "TUR",
    nickname: "Crescent Charge",
    symbol: "Crescent Crest",
    primary: "#c1121f",
    secondary: "#ffffff",
    accent: "#9fd3ff"
  },
  {
    tournamentCode: "FIFA",
    code: "UKR",
    name: "Ukraine",
    shortName: "UKR",
    nickname: "Blue Sun",
    symbol: "Falcon Crest",
    primary: "#0057b7",
    secondary: "#ffd700",
    accent: "#9fd3ff"
  },
  {
    tournamentCode: "FIFA",
    code: "USA",
    name: "United States",
    shortName: "USA",
    nickname: "Stars and Stripes",
    symbol: "Star Banner",
    primary: "#3c3b6e",
    secondary: "#ffffff",
    accent: "#b22234"
  },
  {
    tournamentCode: "FIFA",
    code: "URU",
    name: "Uruguay",
    shortName: "URU",
    nickname: "Celeste Spirit",
    symbol: "Sun Banner",
    primary: "#6ec6ff",
    secondary: "#ffffff",
    accent: "#f2c84b"
  },
  {
    tournamentCode: "FIFA",
    code: "WAL",
    name: "Wales",
    shortName: "WAL",
    nickname: "Dragon Charge",
    symbol: "Dragon Crest",
    primary: "#c1121f",
    secondary: "#ffffff",
    accent: "#0f766e"
  },
  {
    tournamentCode: "FIFA",
    code: "JPN",
    name: "Japan",
    shortName: "JPN",
    nickname: "Blue Samurai",
    symbol: "Sun Blade",
    primary: "#1d4ed8",
    secondary: "#ffffff",
    accent: "#dc2626"
  },
  {
    tournamentCode: "FIFA",
    code: "CRO",
    name: "Croatia",
    shortName: "CRO",
    nickname: "Checkered Fire",
    symbol: "Check Crest",
    primary: "#dc2626",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  }
];

export const WT20_TEAMS: ClubTeam[] = [
  {
    tournamentCode: "WT20",
    code: "AUS",
    name: "Australia Women",
    shortName: "AUS-W",
    nickname: "Southern Gold",
    symbol: "Starlight",
    primary: "#f0c33c",
    secondary: "#0a6b3a",
    accent: "#fff2a6"
  },
  {
    tournamentCode: "WT20",
    code: "BAN",
    name: "Bangladesh Women",
    shortName: "BAN-W",
    nickname: "Tigresses",
    symbol: "Stripe Crest",
    primary: "#0a7a46",
    secondary: "#b91c1c",
    accent: "#f7d86c"
  },
  {
    tournamentCode: "WT20",
    code: "ENG",
    name: "England Women",
    shortName: "ENG-W",
    nickname: "Rose Charge",
    symbol: "Rose Crest",
    primary: "#ffffff",
    secondary: "#cf163f",
    accent: "#123a8f"
  },
  {
    tournamentCode: "WT20",
    code: "IND",
    name: "India Women",
    shortName: "IND-W",
    nickname: "Blue Sparks",
    symbol: "Star Crest",
    primary: "#17479e",
    secondary: "#51b8ff",
    accent: "#ffb703"
  },
  {
    tournamentCode: "WT20",
    code: "IRE",
    name: "Ireland Women",
    shortName: "IRE-W",
    nickname: "Emerald Charge",
    symbol: "Clover Crest",
    primary: "#0a7a46",
    secondary: "#ffffff",
    accent: "#f29f05"
  },
  {
    tournamentCode: "WT20",
    code: "NED",
    name: "Netherlands Women",
    shortName: "NED-W",
    nickname: "Orange Tide",
    symbol: "Lion Crest",
    primary: "#f97316",
    secondary: "#ffffff",
    accent: "#1d4ed8"
  },
  {
    tournamentCode: "WT20",
    code: "NZ",
    name: "New Zealand Women",
    shortName: "NZ-W",
    nickname: "White Ferns",
    symbol: "Fern Crest",
    primary: "#111111",
    secondary: "#ffffff",
    accent: "#91f2d8"
  },
  {
    tournamentCode: "WT20",
    code: "PAK",
    name: "Pakistan Women",
    shortName: "PAK-W",
    nickname: "Green Pulse",
    symbol: "Star Stripe",
    primary: "#0c7a43",
    secondary: "#ffffff",
    accent: "#d1f577"
  },
  {
    tournamentCode: "WT20",
    code: "SA",
    name: "South Africa Women",
    shortName: "SA-W",
    nickname: "Proteas",
    symbol: "Protea Crest",
    primary: "#0c562e",
    secondary: "#ffb81c",
    accent: "#ffffff"
  },
  {
    tournamentCode: "WT20",
    code: "SCO",
    name: "Scotland Women",
    shortName: "SCO-W",
    nickname: "Thistle Line",
    symbol: "Thistle Crest",
    primary: "#4c6ef5",
    secondary: "#ffffff",
    accent: "#d0bfff"
  },
  {
    tournamentCode: "WT20",
    code: "SL",
    name: "Sri Lanka Women",
    shortName: "SL-W",
    nickname: "Island Flame",
    symbol: "Lion Crest",
    primary: "#0f3d91",
    secondary: "#f6c453",
    accent: "#7cc9f5"
  },
  {
    tournamentCode: "WT20",
    code: "WI",
    name: "West Indies Women",
    shortName: "WI-W",
    nickname: "Maroon Storm",
    symbol: "Palm Crest",
    primary: "#7b1e3b",
    secondary: "#f6c453",
    accent: "#ffcad4"
  }
];

export const ALL_TEAMS: ClubTeam[] = [...IPL_TEAMS, ...FIFA_TEAMS, ...WT20_TEAMS];

const IPL_RIVALRY_TITLES: Record<string, string> = {
  "CSK-MI": "Southern Derby",
  "GT-RR": "Titans vs Royals Clash",
  "PBKS-DC": "Capital Kings Collision",
  "RR-SRH": "Desert Phoenix Duel",
  "KKR-RCB": "Crown and Knight Collision",
  "RCB-CSK": "Royal Furnace",
  "MI-PBKS": "Arabian Sea Ambush",
  "SRH-RCB": "Deccan Heatwave"
};

const FIFA_RIVALRY_TITLES: Record<string, string> = {
  "ARG-BRA": "South American Superclasico",
  "ENG-FRA": "Channel Clash",
  "ESP-GER": "Continental Crown Duel",
  "POR-ESP": "Iberian Firestorm",
  "NED-GER": "Lowlands Lightning",
  "USA-MEX": "North American Derby",
  "CRO-FRA": "Final Rematch Spotlight",
  "BRA-URU": "Copa Legacy Collision"
};

const WT20_RIVALRY_TITLES: Record<string, string> = {
  "IND-AUS": "Heavyweights Under Lights",
  "ENG-AUS": "Pace and Power Spotlight",
  "IND-ENG": "Blue Fire Collision",
  "NZ-WI": "Oceanic Storm Clash",
  "SA-SL": "Protea Island Duel"
};

export const TEAM_NAME_TO_CODE: Record<string, TeamCode> = Object.fromEntries(
  ALL_TEAMS.map((team) => [team.name, team.code])
) as Record<string, TeamCode>;

export function getTournament(tournamentCode: TournamentCode) {
  return TOURNAMENTS.find((tournament) => tournament.code === tournamentCode);
}

export function getTeamsByTournament(tournamentCode: TournamentCode) {
  return ALL_TEAMS.filter((team) => team.tournamentCode === tournamentCode);
}

export function getTeam(teamCode: TeamCode, tournamentCode?: TournamentCode) {
  if (tournamentCode) {
    const tournamentTeam = ALL_TEAMS.find(
      (team) => team.code === teamCode && team.tournamentCode === tournamentCode
    );

    if (tournamentTeam) {
      return tournamentTeam;
    }
  }

  return ALL_TEAMS.find((team) => team.code === teamCode);
}

const FIFA_FALLBACK_PALETTES = [
  { primary: "#115e59", secondary: "#0f172a", accent: "#99f6e4" },
  { primary: "#14532d", secondary: "#082f49", accent: "#86efac" },
  { primary: "#0f766e", secondary: "#164e63", accent: "#67e8f9" },
  { primary: "#166534", secondary: "#1e293b", accent: "#bef264" }
];

const WT20_FALLBACK_PALETTES = [
  { primary: "#6d28d9", secondary: "#1f1147", accent: "#f9a8d4" },
  { primary: "#c0267d", secondary: "#3b0764", accent: "#fcd34d" },
  { primary: "#7c3aed", secondary: "#111827", accent: "#fda4af" },
  { primary: "#9d174d", secondary: "#2e1065", accent: "#fde68a" }
];

function pickFallbackPalette(seed: string, tournamentCode: TournamentCode) {
  const palettes =
    tournamentCode === "WT20" ? WT20_FALLBACK_PALETTES : FIFA_FALLBACK_PALETTES;
  const index =
    seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    palettes.length;

  return palettes[index];
}

export function getDisplayTeam(
  teamCode: TeamCode,
  options?: Partial<ClubTeam> & {
    tournamentCode?: TournamentCode;
    name?: string;
    shortName?: string;
    logoPath?: string;
  }
) {
  const tournamentCode = options?.tournamentCode ?? "FIFA";
  const staticTeam = getTeam(teamCode, tournamentCode);

  if (staticTeam) {
    return staticTeam;
  }

  const palette = pickFallbackPalette(String(teamCode), tournamentCode);

  return {
    tournamentCode,
    code: teamCode,
    name: options?.name ?? String(teamCode),
    shortName: options?.shortName ?? String(teamCode),
    nickname: options?.nickname ?? `${options?.shortName ?? teamCode} Squad`,
    symbol: options?.symbol ?? "Match Crest",
    logoPath: options?.logoPath,
    primary: options?.primary ?? palette.primary,
    secondary: options?.secondary ?? palette.secondary,
    accent: options?.accent ?? palette.accent
  } satisfies ClubTeam;
}

export function getTeamCodeByName(name: string) {
  return TEAM_NAME_TO_CODE[name.trim()];
}

export function buildRivalryTitle(
  tournamentCode: TournamentCode,
  homeTeamCode: TeamCode,
  awayTeamCode: TeamCode
) {
  const directKey = `${homeTeamCode}-${awayTeamCode}`;
  const reverseKey = `${awayTeamCode}-${homeTeamCode}`;
  const rivalries =
    tournamentCode === "FIFA"
      ? FIFA_RIVALRY_TITLES
      : tournamentCode === "WT20"
        ? WT20_RIVALRY_TITLES
        : IPL_RIVALRY_TITLES;
  const homeTeam = getTeam(homeTeamCode, tournamentCode);
  const awayTeam = getTeam(awayTeamCode, tournamentCode);

  return (
    rivalries[directKey] ??
    rivalries[reverseKey] ??
    `${homeTeam?.shortName ?? homeTeamCode} vs ${awayTeam?.shortName ?? awayTeamCode} Showdown`
  );
}

export function createEmptyState(): AppState {
  return {
    users: [],
    matches: [],
    votes: [],
    settlements: [],
    carryBalances: {
      IPL: 0,
      FIFA: 0,
      WT20: 0
    },
    auditTrail: [],
    appNotifications: []
  };
}

export function countUsersByRole(state: AppState, role: UserRole) {
  return state.users.filter((user) => user.role === role).length;
}

export function getCarryBalance(state: AppState, tournamentCode: TournamentCode) {
  return state.carryBalances[tournamentCode] ?? 0;
}

export function isIplTeamCode(teamCode: TeamCode): teamCode is IplTeamCode {
  return IPL_TEAMS.some((team) => team.code === teamCode);
}
