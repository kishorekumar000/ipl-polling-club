"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  votes
}: {
  match: MatchRecord;
  currentUserId: string;
  favoriteTeamCode?: TeamCode;
  onVote: (matchId: string, teamCode: TeamCode) => void;
  votes: VoteRecord[];
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const phase = getMatchPhase(match, now);
  const currentVote = getVoteForUser(votes, currentUserId, match.id);
  const favoriteTeam = favoriteTeamCode ? getTeam(favoriteTeamCode) : undefined;
  const showIplFavoriteTheme = match.tournamentCode === "IPL" && favoriteTeam;

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

  return (
    <article
      className={`poll-card ${isFifa ? "poll-card-fifa" : ""} ${isWt20 ? "poll-card-wt20" : ""}`}
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
        <span className={`status-pill status-${phase}`}>
          {phase === "open" ? "Voting open" : "Queued next"}
        </span>
        <span className="countdown-value">Deadline {formatClock(match.pollLockAt)}</span>
      </div>

      <div className="match-heading">
        <div>
          <p className="eyebrow">
            {isFifa
              ? "Football poll"
              : isWt20
                ? "Women&apos;s cricket poll"
                : "Cricket poll"}
          </p>
          <h2>{match.title}</h2>
          <p className="support-copy">{match.subtitle}</p>
        </div>
        <div className="match-timing-card">
          <div>
            <span>Kickoff / start</span>
            <strong>{formatClock(match.startsAt)}</strong>
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
              disabled={phase !== "open"}
            >
              <span className="team-symbol">{team.symbol}</span>
              <span className="team-code">{team.shortName}</span>
              <strong>{team.nickname}</strong>
              <span>{team.name}</span>
              {isSelected ? <span className="selection-tag">Your current pick</span> : null}
            </button>
          );
        })}
      </div>

      <p className="support-copy">
        {currentVote
          ? `You backed ${currentVote.teamCode}. Tap the same team again to remove it, or switch sides before the deadline.`
          : phase === "open"
            ? "Choose one side before the deadline hits."
            : "This match is next in line. Voting opens automatically three hours before the start time."}
      </p>
    </article>
  );
}

function FinalTeamsCard({
  match,
  votes,
  users,
  settlement
}: {
  match: MatchRecord;
  votes: VoteRecord[];
  users: ClubUser[];
  settlement?: SettlementRecord;
}) {
  const finalTeams = getFinalTeams(match, votes, users);
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

  return (
    <article className="panel-card final-sheet-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Final team sheet</p>
          <h2>{match.title}</h2>
        </div>
        <span className="status-pill status-locked">Deadline reached</span>
      </div>

      <div className="final-team-board">
        <div className="final-team-column">
          <h3>{homeTeam.shortName}</h3>
          <p className="support-copy">
            {finalTeams[match.homeTeamCode].length
              ? finalTeams[match.homeTeamCode].join(", ")
              : "No locked votes"}
          </p>
        </div>
        <div className="final-team-column">
          <h3>{awayTeam.shortName}</h3>
          <p className="support-copy">
            {finalTeams[match.awayTeamCode].length
              ? finalTeams[match.awayTeamCode].join(", ")
              : "No locked votes"}
          </p>
        </div>
      </div>

      <p className="support-copy">
        This poll is closed now. The live scorecard stays in the separate live section.
      </p>

      {settlement ? (
        <div className="settlement-strip">
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
        </div>
      ) : null}
    </article>
  );
}

export default function PollsTodayPage() {
  const { ready, session, state, currentTournament, updateState } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches(currentTournament);
  const [now, setNow] = useState(new Date());
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const tournament = getTournament(currentTournament);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleVote = (matchId: string, teamCode: TeamCode) => {
    if (!currentUser) {
      return;
    }

    updateState((current) => {
      const createdAt = new Date().toISOString();
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
          updatedAt: createdAt
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
            createdAt
          },
          ...current.auditTrail
        ].slice(0, 20)
      };
    });
  };

  const sortedMatches = useMemo(
    () =>
      [...todayMatches].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      ),
    [todayMatches]
  );

  const freshPollMatches = sortedMatches
    .filter((match) => getMatchPhase(match, now) !== "locked")
    .slice(0, 3);
  const finalTeamMatches = sortedMatches.filter(
    (match) => getMatchPhase(match, now) === "locked"
  );

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
            <p className="eyebrow">Today&apos;s poll room</p>
            <h1>
              {isFifaTournament
                ? "Only the next football polls stay in front."
                : isWt20Tournament
                  ? "Only the next women&apos;s match polls stay in front."
                  : "Only the next cricket polls stay in front."}
            </h1>
            <p className="support-copy">
              This room now shows only the next three live poll opportunities.
              Once a match reaches its deadline, the vote card leaves the queue
              and its final team sheet appears below.
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
            <span>Active tournament</span>
            <strong>{tournament?.shortName}</strong>
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
        {freshPollMatches.length ? (
          freshPollMatches.map((match) => (
            <MatchPollCard
              currentUserId={currentUser.id}
              favoriteTeamCode={currentUser.favoriteTeamCode}
              key={match.id}
              match={match}
              onVote={handleVote}
              votes={getVotesForMatch(state.votes, match.id)}
            />
          ))
        ) : !loading ? (
          <section className="panel-card">
            <p className="eyebrow">No fresh poll in queue</p>
            <h2>There is no open or upcoming {tournament?.shortName} poll in the current slate.</h2>
          </section>
        ) : null}
      </section>

      <section className="stack-list">
        {finalTeamMatches.length ? (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Deadline reached</p>
                <h2>Final locked team sheets</h2>
              </div>
            </div>
            {finalTeamMatches.map((match) => (
              <FinalTeamsCard
                key={`final-${match.id}`}
                match={match}
                settlement={state.settlements.find((item) => item.matchId === match.id)}
                users={state.users}
                votes={getVotesForMatch(state.votes, match.id)}
              />
            ))}
          </>
        ) : null}
      </section>
    </main>
  );
}
