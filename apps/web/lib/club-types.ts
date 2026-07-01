export type UserRole = "user" | "admin";
export type AdminLevel = "super" | "standard";
export type TournamentCode = "IPL" | "FIFA" | "WT20";

export type IplTeamCode =
  | "CSK"
  | "DC"
  | "GT"
  | "KKR"
  | "LSG"
  | "MI"
  | "PBKS"
  | "RCB"
  | "RR"
  | "SRH";

export type FifaTeamCode =
  | "ARG"
  | "AUS"
  | "AUT"
  | "BEL"
  | "BRA"
  | "CAN"
  | "CHI"
  | "COL"
  | "CRC"
  | "CRO"
  | "DEN"
  | "ECU"
  | "EGY"
  | "ENG"
  | "ESP"
  | "FRA"
  | "GER"
  | "GHA"
  | "IRN"
  | "ITA"
  | "JPN"
  | "KOR"
  | "MAR"
  | "MEX"
  | "NED"
  | "NGA"
  | "NZL"
  | "PAR"
  | "POL"
  | "POR"
  | "RSA"
  | "SEN"
  | "SRB"
  | "SUI"
  | "TUN"
  | "TUR"
  | "UKR"
  | "URU"
  | "USA"
  | "WAL"
  | string;

export type Wt20TeamCode =
  | "AUS"
  | "BAN"
  | "ENG"
  | "IND"
  | "IRE"
  | "NED"
  | "NZ"
  | "PAK"
  | "SA"
  | "SCO"
  | "SL"
  | "WI"
  | string;

export type TeamCode = IplTeamCode | FifaTeamCode | Wt20TeamCode;

export type ClubTeam = {
  tournamentCode: TournamentCode;
  code: TeamCode;
  name: string;
  shortName: string;
  nickname: string;
  symbol: string;
  logoPath?: string;
  primary: string;
  secondary: string;
  accent: string;
};

export type ClubUser = {
  id: string;
  publicId: string;
  name: string;
  normalizedName: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  password?: string;
  favoriteTeamCode?: TeamCode;
  renameCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MatchRecord = {
  id: string;
  tournamentCode: TournamentCode;
  dayKey: string;
  title: string;
  subtitle: string;
  venue: string;
  matchNumber: number;
  homeTeamCode: TeamCode;
  awayTeamCode: TeamCode;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamShortName?: string;
  awayTeamShortName?: string;
  homeTeamLogoPath?: string;
  awayTeamLogoPath?: string;
  homeTeamPrimary?: string;
  awayTeamPrimary?: string;
  homeTeamSecondary?: string;
  awayTeamSecondary?: string;
  homeTeamAccent?: string;
  awayTeamAccent?: string;
  startsAt: string;
  pollOpenAt: string;
  pollLockAt: string;
  sourceLabel?: string;
  sourceUrl?: string;
  liveState?: "scheduled" | "live" | "halftime" | "completed";
  statusLabel?: string;
  statusDetail?: string;
  clockLabel?: string;
  periodLabel?: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamWinner?: boolean;
  awayTeamWinner?: boolean;
  winnerTeamCode?: TeamCode;
  resultDeclaredAt?: string;
  resultDeclaredBy?: string;
};

export type VoteRecord = {
  id: string;
  userId: string;
  matchId: string;
  teamCode: TeamCode;
  updatedAt: string;
};

export type SettlementEntry = {
  userId: string;
  userName: string;
  teamCode: TeamCode;
  amount: number;
  kind: "win" | "loss";
};

export type SettlementRecord = {
  tournamentCode: TournamentCode;
  matchId: string;
  matchTitle: string;
  winnerTeamCode: TeamCode;
  carryIn: number;
  totalPool: number;
  loserCount: number;
  winnerCount: number;
  sharePerWinner: number;
  remainder: number;
  publishedAt: string;
  entries: SettlementEntry[];
};

export type AuditEvent = {
  id: string;
  type: string;
  actorName: string;
  detail: string;
  createdAt: string;
};

export type AppNotificationKind =
  | "system"
  | "poll-open"
  | "poll-closing"
  | "poll-locked"
  | "vote"
  | "result"
  | "admin"
  | "profile";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: AppNotificationKind;
  tournamentCode?: TournamentCode;
  url?: string;
};

export type ClubChatMessage = {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  tournamentCode: TournamentCode;
  body: string;
  createdAt: string;
};

export type ClubAnnouncement = {
  id: string;
  authorId: string;
  authorName: string;
  tournamentCode: TournamentCode;
  title: string;
  body: string;
  createdAt: string;
};

export type AppState = {
  users: ClubUser[];
  matches: MatchRecord[];
  votes: VoteRecord[];
  settlements: SettlementRecord[];
  carryBalances: Record<TournamentCode, number>;
  auditTrail: AuditEvent[];
  appNotifications: AppNotification[];
  chatMessages: ClubChatMessage[];
  announcements: ClubAnnouncement[];
};

export type Session = {
  userId: string;
  role: UserRole;
};
