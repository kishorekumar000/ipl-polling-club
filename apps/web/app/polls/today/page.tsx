"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCarryBalance,
  getDisplayTeam,
  getTeam,
  getTournament
} from "../../../lib/club-data";
import {
  ClubUser,
  MatchRecord,
  SettlementRecord,
  TeamCode,
  VoteRecord
} from "../../../lib/club-types";
import {
  formatClock,
  getCountdownData,
  getFinalTeams,
  getMatchPhase,
  getVoteForUser,
  getVotesForMatch
} from "../../../lib/club-logic";
import { useClubStore } from "../../../lib/club-state";
import { useDailyMatches } from "../../../lib/use-daily-matches";
import { TeamBrandBadge } from "../../components/team-brand-badge";

function hasScore(value?: number): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getScoreboardCopy(match: MatchRecord) {
  const liveState = match.liveState ?? "scheduled";
  const scoreLabel =
    hasScore(match.homeScore) && hasScore(match.awayScore)
      ? `${match.homeScore} - ${match.awayScore}`
      : "vs";
  const detail =
    match.statusDetail ??
    (liveState === "completed"
      ? "Match completed"
      : liveState === "live"
        ? "Live on the pitch"
        : liveState === "halftime"
          ? "Break in play"
          : `${formatClock(match.startsAt)} kickoff`);
  const subDetail = [match.clockLabel, match.periodLabel].filter(Boolean).join(" • ");

  return {
    liveState,
    detail,
    scoreLabel,
    subDetail,
    statusLabel:
      match.statusLabel ??
      (liveState === "completed"
        ? "Full time"
        : liveState === "live"
          ? "Live"
          : liveState === "halftime"
            ? "Half-time"
            : "Scheduled")
  };
}

function MatchPollCard({
  match,
  currentUserId,
  favoriteTeamCode,
  onVote,
  votes,
  users,
  settlement
}: {
  match: MatchRecord;
  currentUserId: string;
  favoriteTeamCode?: TeamCode;
  onVote: (matchId: string, teamCode: TeamCode) => void;
  votes: VoteRecord[];
  users: ClubUser[];
  settlement?: SettlementRecord;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const favoriteTeam = favoriteTeamCode ? getTeam(favoriteTeamCode) : undefined;
  const countdown = getCountdownData(match, now);
  const phase = getMatchPhase(match, now);
  const currentVote = getVoteForUser(votes, currentUserId, match.id);
  const finalTeams = getFinalTeams(match, votes, users);
  const showIplFavoriteTheme = match.tournamentCode === "IPL" && favoriteTeam;
  const scoreboard = getScoreboardCopy(match);

  const homeTeam = getDisplayTeam(match.homeTeamCode, {
    tournamentCode: match.tournamentCode,
    name: match.homeTeamName,
    shortName: match.homeTeamShortName,
    logoPath: match.homeTeamLogoPath,
    primary: match.homeTeamPrimary,
    secondary: match.homeTeamSecondary,
    accent: match.homeTeamAccent
  });
  const awayTeam = getDisplayTeam(match.awayTeamCode, {
    tournamentCode: match.tournamentCode,
    name: match.awayTeamName,
    shortName: match.awayTeamShortName,
    logoPath: match.awayTeamLogoPath,
    primary: match.awayTeamPrimary,
    secondary: match.awayTeamSecondary,
    accent: match.awayTeamAccent
  });

  const isFifa = match.tournamentCode === "FIFA";
  const isWt20 = match.tournamentCode === "WT20";
  const cardClassName = `poll-card ${isFifa ? "poll-card-fifa" : ""} ${isWt20 ? "poll-card-wt20" : ""}`;

  return (
    <article
      className={cardClassName}
      style={{
        background: showIplFavoriteTheme
          ? `linear-gradient(135deg, ${showIplFavoriteTheme.primary}22, ${showIplFavoriteTheme.secondary}11), rgba(7, 17, 31, 0.92)`
          : isFifa
            ? "linear-gradient(160deg, rgba(11, 68, 46, 0.88), rgba(3, 20, 29, 0.96))"
            : isWt20
              ? "linear-gradient(160deg, rgba(66, 16, 92, 0.9), rgba(22, 6, 37, 0.96))"
              : undefined
      }}
    >
      {showIplFavoriteTheme ? (
        showIplFavoriteTheme.logoPath ? (
          <img
            alt={`${showIplFavoriteTheme.name} logo watermark`}
            className="favorite-logo-watermark"
            src={showIplFavoriteTheme.logoPath}
          />
        ) : (
          <div className="favorite-watermark">{showIplFavoriteTheme.shortName}</div>
        )
      ) : null}

      <div className="match-topline">
        <span className={`status-pill status-${phase}`}>{countdown.label}</span>
        <span className="countdown-value">{countdown.value}</span>
      </div>

      <div className="match-heading">
        <div>
          <p className="eyebrow">
            {isFifa
              ? "Today&apos;s football fixture"
              : isWt20
                ? "Today&apos;s women&apos;s cricket fixture"
                : "Today&apos;s fixture"}
          </p>
          <h2>{match.title}</h2>
          <p className="support-copy">{match.subtitle}</p>
        </div>
        <div className="match-timing-card">
          <div>
            <span>Poll opens</span>
            <strong>{formatClock(match.pollOpenAt)}</strong>
          </div>
          <div>
            <span>Vote lock</span>
            <strong>{formatClock(match.pollLockAt)}</strong>
          </div>
        </div>
      </div>

      <section className="live-scoreboard">
        <div className={`live-team-card ${match.homeTeamWinner ? "winner" : ""}`}>
          <div
            className="live-team-swatch"
            style={{
              background: `linear-gradient(160deg, ${homeTeam.primary}, ${homeTeam.secondary})`
            }}
          >
            {homeTeam.logoPath ? (
              <img alt={`${homeTeam.name} crest`} className="live-team-logo" src={homeTeam.logoPath} />
            ) : (
              <span>{homeTeam.symbol}</span>
            )}
          </div>
          <div className="live-team-meta">
            <strong>{homeTeam.shortName}</strong>
            <span>{homeTeam.name}</span>
          </div>
          <div className="live-team-score">
            {hasScore(match.homeScore) ? String(match.homeScore) : "-"}
          </div>
        </div>

        <div className="live-score-center">
          <span className={`live-state-pill state-${scoreboard.liveState}`}>
            {scoreboard.statusLabel}
          </span>
          <strong className="live-scoreline">{scoreboard.scoreLabel}</strong>
          <span className="live-score-detail">{scoreboard.detail}</span>
          {scoreboard.subDetail ? (
            <span className="live-score-subdetail">{scoreboard.subDetail}</span>
          ) : null}
        </div>

        <div className={`live-team-card ${match.awayTeamWinner ? "winner" : ""}`}>
          <div
            className="live-team-swatch"
            style={{
              background: `linear-gradient(160deg, ${awayTeam.primary}, ${awayTeam.secondary})`
            }}
          >
            {awayTeam.logoPath ? (
              <img alt={`${awayTeam.name} crest`} className="live-team-logo" src={awayTeam.logoPath} />
            ) : (
              <span>{awayTeam.symbol}</span>
            )}
          </div>
          <div className="live-team-meta">
            <strong>{awayTeam.shortName}</strong>
            <span>{awayTeam.name}</span>
          </div>
          <div className="live-team-score">
            {hasScore(match.awayScore) ? String(match.awayScore) : "-"}
          </div>
        </div>
      </section>

      <div className="poll-grid">
        {[homeTeam, awayTeam].map((team) => {
          const isSelected = currentVote?.teamCode === team.code;
          const disabled = phase !== "open";

          return (
            <button
              className={`poll-team-card ${isSelected ? "selected" : ""}`}
              key={team.code}
              onClick={() => onVote(match.id, team.code)}
              style={{
                borderColor: isSelected ? team.accent : `${team.primary}55`,
                background: `linear-gradient(160deg, ${team.primary}33, ${team.secondary}11)`
              }}
              type="button"
              disabled={disabled}
            >
              <span className="team-symbol">{team.symbol}</span>
              <span className="team-code">{team.shortName}</span>
              <strong>{team.nickname}</strong>
              <span>{team.name}</span>
              {isSelected ? (
                <span className="selection-tag">Your current pick</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {currentVote ? (
        <p className="support-copy">
          You last backed {currentVote.teamCode} at {formatClock(currentVote.updatedAt)}.
          {phase === "open"
            ? " You can switch sides until the deadline, or tap the same team again to remove your vote."
            : " Final teams are now locked for everyone."}
        </p>
      ) : (
        <p className="support-copy">
          {isFifa
            ? "Back your side before kickoff. Multiple football fixtures can stay open at the same time."
            : isWt20
              ? "Back your side before the first ball. Every live women&apos;s match keeps its own open window."
              : "Make your call before the voting window closes."}
        </p>
      )}

      {phase === "locked" ? (
        <section className="final-team-board">
          <div className="final-team-column">
            <h3>{homeTeam.shortName}</h3>
            <p className="support-copy">
              {finalTeams[match.homeTeamCode].length > 0
                ? finalTeams[match.homeTeamCode].join(", ")
                : "No locked votes"}
            </p>
          </div>
          <div className="final-team-column">
            <h3>{awayTeam.shortName}</h3>
            <p className="support-copy">
              {finalTeams[match.awayTeamCode].length > 0
                ? finalTeams[match.awayTeamCode].join(", ")
                : "No locked votes"}
            </p>
          </div>
        </section>
      ) : null}

      {settlement ? (
        <section className="settlement-strip">
          <div>
            <span>Winner</span>
            <strong>{settlement.winnerTeamCode}</strong>
          </div>
          <div>
            <span>Each winner gets</span>
            <strong>Rs {settlement.sharePerWinner}</strong>
          </div>
          <div>
            <span>Carry forward</span>
            <strong>Rs {settlement.remainder}</strong>
          </div>
          <div className="settlement-link-wrap">
            <Link className="secondary-link" href="/settlements">
              Open settlement board
            </Link>
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default function PollsTodayPage() {
  const {
    ready,
    session,
    state,
    currentTournament,
    updateState
  } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches(currentTournament);
  const [now, setNow] = useState(new Date());
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const tournament = getTournament(currentTournament);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleVote = (matchId: string, teamCode: TeamCode) => {
    if (!currentUser) {
      return;
    }

    updateState((current) => {
      const now = new Date().toISOString();
      const match = current.matches.find((item) => item.id === matchId);

      if (!match || getMatchPhase(match, new Date()) !== "open") {
        return current;
      }

      const existingVote = current.votes.find(
        (vote) => vote.userId === currentUser.id && vote.matchId === matchId
      );
      const nextVotes = current.votes.filter(
        (vote) => !(vote.userId === currentUser.id && vote.matchId === matchId)
      );
      const isRemovingVote = existingVote?.teamCode === teamCode;

      if (!isRemovingVote) {
        nextVotes.push({
          id: `vote-${currentUser.id}-${matchId}`,
          userId: currentUser.id,
          matchId,
          teamCode,
          updatedAt: now
        });
      }

      return {
        ...current,
        votes: nextVotes,
        auditTrail: [
          {
            id: `audit-${Date.now()}`,
            type: "vote",
            actorName: currentUser.name,
            detail: isRemovingVote
              ? `Removed the vote in ${match.title}.`
              : `Backed ${teamCode} in ${match.title}.`,
            createdAt: now
          },
          ...current.auditTrail
        ].slice(0, 20)
      };
    });
  };

  if (!ready) {
    return <main className="page-shell">Loading today&apos;s polling floor...</main>;
  }

  if (!session || !currentUser) {
    return (
      <main className="page-shell">
        <section className="panel-card">
          <p className="eyebrow">Profile required</p>
          <h1>Create your profile from the home page first.</h1>
          <div className="hero-actions">
            <Link className="primary-link" href="/">
              Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!currentUser.favoriteTeamCode) {
    return (
      <main className="page-shell">
        <section className="panel-card">
          <p className="eyebrow">Favorite team pending</p>
          <h1>Lock your favorite team before entering the poll room.</h1>
          <div className="hero-actions">
            <Link className="primary-link" href="/setup/team">
              Choose favorite team
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const favoriteTeam = getTeam(currentUser.favoriteTeamCode);
  const heroFavoriteTeam = currentTournament === "IPL" ? favoriteTeam : undefined;
  const isFifaTournament = currentTournament === "FIFA";
  const isWt20Tournament = currentTournament === "WT20";
  const activeMatches = todayMatches.filter(
    (match) => getMatchPhase(match, now) !== "locked"
  );
  const completedMatches = todayMatches.filter(
    (match) => getMatchPhase(match, now) === "locked"
  );

  return (
    <main className="page-shell">
      <section
        className={`panel-card panel-hero ${isFifaTournament ? "panel-hero-fifa" : ""} ${isWt20Tournament ? "panel-hero-wt20" : ""}`}
        style={{
          background: heroFavoriteTeam
            ? `linear-gradient(135deg, ${heroFavoriteTeam.primary}22, ${heroFavoriteTeam.secondary}11), rgba(9, 23, 43, 0.8)`
            : isFifaTournament
              ? "linear-gradient(145deg, rgba(9, 76, 49, 0.9), rgba(4, 22, 31, 0.96))"
              : isWt20Tournament
                ? "linear-gradient(145deg, rgba(75, 18, 108, 0.92), rgba(23, 7, 34, 0.98))"
                : undefined
        }}
      >
        <div className="hero-with-brand">
          <div>
            <p className="eyebrow">
              {isFifaTournament
                ? "Football match centre"
                : isWt20Tournament
                  ? "Women&apos;s cricket match centre"
                  : "Today&apos;s poll room"}
            </p>
            <h1>
              {isFifaTournament
                ? "Every football fixture stays in its own live voting window."
                : isWt20Tournament
                  ? "Every women&apos;s T20 match stays in its own live voting window."
                  : "Real daily matches. Real vote windows."}
            </h1>
            <p className="support-copy">
              {isFifaTournament
                ? "Football mode runs with its own fixture list, kickoff-based timers, and separate settlements. Cricket branding stays out of this view."
                : isWt20Tournament
                  ? "Women&apos;s T20 mode runs on its own published fixture list, opens exactly three hours before each match, and keeps settlements fully separate from IPL and FIFA."
                  : `Your favorite team theme follows you across the cricket experience, while ${tournament?.shortName ?? "the active tournament"} stays isolated with its own voting window and settlement flow.`}
            </p>
          </div>
          {heroFavoriteTeam ? <TeamBrandBadge team={heroFavoriteTeam} /> : null}
        </div>
        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Name</span>
            <strong>{currentUser.name}</strong>
          </div>
          <div className="profile-chip">
            <span>Unique ID</span>
            <strong>{currentUser.publicId}</strong>
          </div>
          <div className="profile-chip">
            <span>{isFifaTournament || isWt20Tournament ? "Mode" : "Favorite team"}</span>
            <strong>
              {isFifaTournament
                ? "Football theme active"
                : isWt20Tournament
                  ? "Women&apos;s cricket theme active"
                  : favoriteTeam?.name}
            </strong>
          </div>
          <div className="profile-chip">
            <span>{tournament?.shortName} carry</span>
            <strong>Rs {getCarryBalance(state, currentTournament)}</strong>
          </div>
        </div>
      </section>

      {loading ? <p className="support-copy">Syncing today&apos;s fixtures...</p> : null}
      {error ? <p className="warning-text">{error}</p> : null}

      <section className="stack-list">
        {activeMatches.map((match) => {
          const matchVotes = getVotesForMatch(state.votes, match.id);
          const settlement = state.settlements.find(
            (item) => item.matchId === match.id
          );

          return (
            <MatchPollCard
              currentUserId={currentUser.id}
              favoriteTeamCode={currentUser.favoriteTeamCode}
              key={match.id}
              match={match}
              onVote={handleVote}
              settlement={settlement}
              users={state.users}
              votes={matchVotes}
            />
          );
        })}
        {completedMatches.map((match) => (
          <section className="panel-card" key={`completed-${match.id}`}>
            <p className="eyebrow">Match completed</p>
            <h2>{match.title}</h2>
            <p className="support-copy">
              This match was completed. Only fresh live polls stay in this room now.
            </p>
          </section>
        ))}
        {!loading && activeMatches.length === 0 && completedMatches.length === 0 ? (
          <section className="panel-card">
            <p className="eyebrow">No fixture today</p>
            <h2>There is no {tournament?.shortName ?? "active"} match synced for the current date.</h2>
          </section>
        ) : null}
      </section>
    </main>
  );
}
