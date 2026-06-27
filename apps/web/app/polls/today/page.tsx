"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCarryBalance, getTeam, getTournament } from "../../../lib/club-data";
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

  const homeTeam = getTeam(match.homeTeamCode);
  const awayTeam = getTeam(match.awayTeamCode);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  return (
    <article
      className="poll-card"
      style={{
        background: favoriteTeam
          ? `linear-gradient(135deg, ${favoriteTeam.primary}22, ${favoriteTeam.secondary}11), rgba(7, 17, 31, 0.92)`
          : undefined
      }}
    >
      {favoriteTeam ? (
        favoriteTeam.logoPath ? (
          <img
            alt={`${favoriteTeam.name} logo watermark`}
            className="favorite-logo-watermark"
            src={favoriteTeam.logoPath}
          />
        ) : (
          <div className="favorite-watermark">{favoriteTeam.shortName}</div>
        )
      ) : null}

      <div className="match-topline">
        <span className={`status-pill status-${phase}`}>{countdown.label}</span>
        <span className="countdown-value">{countdown.value}</span>
      </div>

      <div className="match-heading">
        <div>
          <p className="eyebrow">Today&apos;s fixture</p>
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
            ? " You can switch sides until the deadline."
            : " Final teams are now locked for everyone."}
        </p>
      ) : (
        <p className="support-copy">
          Make your call before the voting window closes.
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
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const tournament = getTournament(currentTournament);

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

      const nextVotes = current.votes.filter(
        (vote) => !(vote.userId === currentUser.id && vote.matchId === matchId)
      );

      nextVotes.push({
        id: `vote-${currentUser.id}-${matchId}`,
        userId: currentUser.id,
        matchId,
        teamCode,
        updatedAt: now
      });

      return {
        ...current,
        votes: nextVotes,
        auditTrail: [
          {
            id: `audit-${Date.now()}`,
            type: "vote",
            actorName: currentUser.name,
            detail: `Backed ${teamCode} in ${match.title}.`,
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

  return (
    <main className="page-shell">
      <section
        className="panel-card panel-hero"
        style={{
          background: favoriteTeam
            ? `linear-gradient(135deg, ${favoriteTeam.primary}22, ${favoriteTeam.secondary}11), rgba(9, 23, 43, 0.8)`
            : undefined
        }}
      >
        <div className="hero-with-brand">
          <div>
            <p className="eyebrow">Today&apos;s poll room</p>
            <h1>Real daily matches. Real vote windows.</h1>
            <p className="support-copy">
              Your favorite team theme follows you across the experience, while
              {` ${tournament?.shortName ?? "the active tournament"} `}
              stays isolated with its own voting window and settlement flow.
            </p>
          </div>
          {favoriteTeam ? <TeamBrandBadge team={favoriteTeam} /> : null}
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
            <span>Favorite team</span>
            <strong>{favoriteTeam?.name}</strong>
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
        {todayMatches.map((match) => {
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
        {!loading && todayMatches.length === 0 ? (
          <section className="panel-card">
            <p className="eyebrow">No fixture today</p>
            <h2>There is no {tournament?.shortName ?? "active"} match synced for the current date.</h2>
          </section>
        ) : null}
      </section>
    </main>
  );
}
