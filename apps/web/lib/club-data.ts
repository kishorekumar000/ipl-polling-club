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

export const ALL_TEAMS: ClubTeam[] = [...IPL_TEAMS, ...FIFA_TEAMS];

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

export const TEAM_NAME_TO_CODE: Record<string, TeamCode> = Object.fromEntries(
  ALL_TEAMS.map((team) => [team.name, team.code])
) as Record<string, TeamCode>;

export function getTournament(tournamentCode: TournamentCode) {
  return TOURNAMENTS.find((tournament) => tournament.code === tournamentCode);
}

export function getTeamsByTournament(tournamentCode: TournamentCode) {
  return ALL_TEAMS.filter((team) => team.tournamentCode === tournamentCode);
}

export function getTeam(teamCode: TeamCode) {
  return ALL_TEAMS.find((team) => team.code === teamCode);
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
    tournamentCode === "FIFA" ? FIFA_RIVALRY_TITLES : IPL_RIVALRY_TITLES;

  return (
    rivalries[directKey] ??
    rivalries[reverseKey] ??
    `${homeTeamCode} vs ${awayTeamCode} Showdown`
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
      FIFA: 0
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
