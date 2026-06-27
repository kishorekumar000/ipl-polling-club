import {
  AppState,
  ClubUser,
  MatchRecord,
  SettlementEntry,
  SettlementRecord,
  TeamCode,
  TournamentCode,
  VoteRecord
} from "./club-types";

const TOURNAMENT_ORDER: TournamentCode[] = ["IPL", "FIFA"];

export function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function formatClock(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(value));
}

export function getIstDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

export function createPublicId(totalProfilesForRole: number, role: "user" | "admin") {
  const prefix = role === "admin" ? "ADM" : "USR";
  return `${prefix}-${String(totalProfilesForRole + 1).padStart(3, "0")}`;
}

export function isNameTaken(
  users: ClubUser[],
  name: string,
  excludeUserId?: string
) {
  const normalized = normalizeName(name);
  return users.some(
    (user) =>
      user.id !== excludeUserId && user.normalizedName === normalized
  );
}

export function getMatchPhase(match: MatchRecord, now: Date) {
  const openAt = new Date(match.pollOpenAt).getTime();
  const lockAt = new Date(match.pollLockAt).getTime();
  const current = now.getTime();

  if (current < openAt) {
    return "upcoming";
  }

  if (current < lockAt) {
    return "open";
  }

  return "locked";
}

export function getCountdownData(match: MatchRecord, now: Date) {
  const phase = getMatchPhase(match, now);
  const target =
    phase === "upcoming"
      ? new Date(match.pollOpenAt).getTime()
      : phase === "open"
        ? new Date(match.pollLockAt).getTime()
        : 0;

  if (phase === "locked") {
    return {
      phase,
      label: match.winnerTeamCode ? "Result published" : "Voting locked",
      value: match.winnerTeamCode ? "Settlement ready" : "Final teams locked"
    };
  }

  const distance = Math.max(0, target - now.getTime());
  const totalSeconds = Math.floor(distance / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    phase,
    label: phase === "upcoming" ? "Poll opens in" : "Voting closes in",
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`
  };
}

export function getVoteForUser(
  votes: VoteRecord[],
  userId: string,
  matchId: string
) {
  return votes.find((vote) => vote.userId === userId && vote.matchId === matchId);
}

export function getVotesForMatch(votes: VoteRecord[], matchId: string) {
  return votes.filter((vote) => vote.matchId === matchId);
}

export function getFinalTeams(
  match: MatchRecord,
  votes: VoteRecord[],
  users: ClubUser[]
) {
  const matchVotes = getVotesForMatch(votes, match.id);

  const mapUsers = (teamCode: TeamCode) =>
    matchVotes
      .filter((vote) => vote.teamCode === teamCode)
      .map((vote) => users.find((user) => user.id === vote.userId)?.name)
      .filter((name): name is string => Boolean(name));

  return {
    [match.homeTeamCode]: mapUsers(match.homeTeamCode),
    [match.awayTeamCode]: mapUsers(match.awayTeamCode)
  };
}

function compareMatches(a: MatchRecord, b: MatchRecord) {
  const tournamentGap =
    TOURNAMENT_ORDER.indexOf(a.tournamentCode) -
    TOURNAMENT_ORDER.indexOf(b.tournamentCode);

  if (tournamentGap !== 0) {
    return tournamentGap;
  }

  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

function buildSettlementEntries(
  votes: VoteRecord[],
  users: ClubUser[],
  winnerTeamCode: TeamCode,
  sharePerWinner: number
) {
  const entries: SettlementEntry[] = [];

  votes.forEach((vote) => {
    const user = users.find((item) => item.id === vote.userId);

    if (!user) {
      return;
    }

    const amount = vote.teamCode === winnerTeamCode ? sharePerWinner : -5;

    entries.push({
      userId: user.id,
      userName: user.name,
      teamCode: vote.teamCode,
      amount,
      kind: vote.teamCode === winnerTeamCode ? "win" : "loss"
    });
  });

  return entries.sort((left, right) => right.amount - left.amount);
}

export function upsertMatches(
  existingMatches: MatchRecord[],
  incomingMatches: MatchRecord[]
) {
  const merged = [...existingMatches];

  incomingMatches.forEach((incoming) => {
    const existing = merged.find((match) => match.id === incoming.id);

    if (!existing) {
      merged.push(incoming);
      return;
    }

    Object.assign(existing, {
      ...incoming,
      winnerTeamCode: existing.winnerTeamCode,
      resultDeclaredAt: existing.resultDeclaredAt,
      resultDeclaredBy: existing.resultDeclaredBy
    });
  });

  return merged.sort(compareMatches);
}

export function recomputeSettlements(state: AppState): AppState {
  const matches = [...state.matches].sort(compareMatches);
  const carryBalances: AppState["carryBalances"] = {
    IPL: state.carryBalances.IPL ?? 0,
    FIFA: state.carryBalances.FIFA ?? 0
  };

  const settlements: SettlementRecord[] = matches.flatMap((match) => {
    if (!match.winnerTeamCode) {
      return [];
    }

    const votes = getVotesForMatch(state.votes, match.id).filter((vote) =>
      state.users.some((user) => user.id === vote.userId)
    );
    const winnerVotes = votes.filter(
      (vote) => vote.teamCode === match.winnerTeamCode
    );
    const loserVotes = votes.filter(
      (vote) => vote.teamCode !== match.winnerTeamCode
    );

    const carryIn = carryBalances[match.tournamentCode] ?? 0;
    const totalPool = loserVotes.length * 5 + carryIn;
    const sharePerWinner =
      winnerVotes.length > 0 ? Math.floor(totalPool / winnerVotes.length) : 0;
    const remainder =
      winnerVotes.length > 0 ? totalPool % winnerVotes.length : totalPool;

    carryBalances[match.tournamentCode] = remainder;

    return [
      {
        tournamentCode: match.tournamentCode,
        matchId: match.id,
        matchTitle: match.title,
        winnerTeamCode: match.winnerTeamCode,
        carryIn,
        totalPool,
        loserCount: loserVotes.length,
        winnerCount: winnerVotes.length,
        sharePerWinner,
        remainder,
        publishedAt: match.resultDeclaredAt ?? new Date().toISOString(),
        entries: buildSettlementEntries(
          votes,
          state.users,
          match.winnerTeamCode,
          sharePerWinner
        )
      }
    ];
  });

  return {
    ...state,
    settlements,
    carryBalances
  };
}

export function formatAmount(amount: number) {
  if (amount > 0) {
    return `+${amount}`;
  }

  return `${amount}`;
}
