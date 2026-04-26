import { AppState, ClubTeam, TeamCode, UserRole } from "./club-types";

export const IPL_TEAMS: ClubTeam[] = [
  {
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

const RIVALRY_TITLES: Record<string, string> = {
  "CSK-MI": "Southern Derby",
  "GT-RR": "Titans vs Royals Clash",
  "PBKS-DC": "Capital Kings Collision",
  "RR-SRH": "Desert Phoenix Duel",
  "KKR-RCB": "Crown and Knight Collision",
  "RCB-CSK": "Royal Furnace",
  "MI-PBKS": "Arabian Sea Ambush",
  "SRH-RCB": "Deccan Heatwave"
};

export const TEAM_NAME_TO_CODE: Record<string, TeamCode> = Object.fromEntries(
  IPL_TEAMS.map((team) => [team.name, team.code])
) as Record<string, TeamCode>;

export function getTeam(teamCode: TeamCode) {
  return IPL_TEAMS.find((team) => team.code === teamCode);
}

export function getTeamCodeByName(name: string) {
  return TEAM_NAME_TO_CODE[name.trim()];
}

export function buildRivalryTitle(
  homeTeamCode: TeamCode,
  awayTeamCode: TeamCode
) {
  const directKey = `${homeTeamCode}-${awayTeamCode}`;
  const reverseKey = `${awayTeamCode}-${homeTeamCode}`;

  return (
    RIVALRY_TITLES[directKey] ??
    RIVALRY_TITLES[reverseKey] ??
    `${homeTeamCode} vs ${awayTeamCode} Showdown`
  );
}

export function createEmptyState(): AppState {
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

export function countUsersByRole(state: AppState, role: UserRole) {
  return state.users.filter((user) => user.role === role).length;
}
