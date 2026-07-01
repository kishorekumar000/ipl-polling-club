"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDisplayTeam, getTournament } from "../../lib/club-data";
import { formatClock } from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";
import { MatchRecord } from "../../lib/club-types";
import { useDailyMatches } from "../../lib/use-daily-matches";

type LiveUpdate = {
  id: string;
  teamCode?: string;
  text: string;
  timeLabel?: string;
};

type LiveLineupGroup = {
  teamCode: string;
  teamName: string;
  starters: Array<{
    name: string;
    jersey: string;
    position: string;
    starter: boolean;
    active: boolean;
    subbedIn: boolean;
    subbedOut: boolean;
  }>;
  substitutes: Array<{
    name: string;
    jersey: string;
    position: string;
    starter: boolean;
    active: boolean;
    subbedIn: boolean;
    subbedOut: boolean;
  }>;
};

type LiveStatGroup = {
  teamCode: string;
  teamName: string;
  statistics: Array<{
    label: string;
    value: string;
  }>;
};

type LiveDetailPayload = {
  updates: LiveUpdate[];
  scorers: LiveUpdate[];
  cards: LiveUpdate[];
  substitutions: LiveUpdate[];
  lineups: LiveLineupGroup[];
  teamStats: LiveStatGroup[];
  broadcasts: string[];
  note?: string;
};

function hasScore(value?: number): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getStatusCopy(match: MatchRecord) {
  if (match.liveState === "completed") {
    return match.statusLabel ?? "Completed";
  }

  if (match.liveState === "live") {
    return match.statusLabel ?? "Live";
  }

  if (match.liveState === "halftime") {
    return match.statusLabel ?? "Half-time";
  }

  return match.statusLabel ?? "Scheduled";
}

export default function LiveScorecardPage() {
  const { ready, session, state, currentTournament } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches(currentTournament);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [detail, setDetail] = useState<LiveDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const tournament = getTournament(currentTournament);
  const currentUser = state.users.find((user) => user.id === session?.userId);

  const liveSlate = useMemo(
    () =>
      [...todayMatches].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      ),
    [todayMatches]
  );

  const selectedMatch =
    liveSlate.find((match) => match.id === selectedMatchId) ?? liveSlate[0];

  useEffect(() => {
    if (!liveSlate.length) {
      setSelectedMatchId("");
      return;
    }

    if (!selectedMatchId || !liveSlate.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(liveSlate[0].id);
    }
  }, [liveSlate, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatch) {
      setDetail(null);
      return;
    }

    let isCancelled = false;

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await fetch(
          `/api/matches/live?tournament=${selectedMatch.tournamentCode}&matchId=${selectedMatch.id}`,
          {
            cache: "no-store"
          }
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          detail?: LiveDetailPayload;
        };

        if (isCancelled) {
          return;
        }

        setDetail(payload.detail ?? null);
      } catch {
        if (!isCancelled) {
          setDetail(null);
        }
      } finally {
        if (!isCancelled) {
          setDetailLoading(false);
        }
      }
    };

    void loadDetail();
    const intervalId = window.setInterval(() => {
      void loadDetail();
    }, 45000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedMatch]);

  if (!ready) {
    return <main className="page-shell">Loading live scorecards...</main>;
  }

  if (!session || !currentUser) {
    return (
      <main className="page-shell">
        <section className="panel-card">
          <p className="eyebrow">Profile required</p>
          <h1>Open the live scorecard after entering as a club member.</h1>
          <div className="hero-actions">
            <Link className="primary-link" href="/">
              Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="panel-card panel-hero live-hero">
        <div>
          <p className="eyebrow">Live scorecard</p>
          <h1>{tournament?.shortName} live score centre</h1>
          <p className="support-copy">
            Open any match here to follow the score, match status, events, lineups,
            and available team stats in one clean place.
          </p>
        </div>
      </section>

      {loading ? <p className="support-copy">Refreshing live slate...</p> : null}
      {error ? <p className="warning-text">{error}</p> : null}

      {liveSlate.length === 0 ? (
        <section className="panel-card">
          <p className="eyebrow">No live slate</p>
          <h2>There is no synced {tournament?.shortName} match in the current window.</h2>
        </section>
      ) : (
        <section className="live-layout">
          <aside className="live-sidebar">
            {liveSlate.map((match) => {
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
                <button
                  className={`live-list-card ${selectedMatch?.id === match.id ? "selected" : ""}`}
                  key={match.id}
                  onClick={() => setSelectedMatchId(match.id)}
                  type="button"
                >
                  <div className="live-list-head">
                    <span className={`live-state-pill state-${match.liveState ?? "scheduled"}`}>
                      {getStatusCopy(match)}
                    </span>
                    <span className="timestamp-line">
                      {match.clockLabel || formatClock(match.startsAt)}
                    </span>
                  </div>

                  <div className="live-list-row">
                    <div className="live-list-team">
                      <strong>{homeTeam.shortName}</strong>
                      <span>{homeTeam.name}</span>
                    </div>
                    <strong className="live-list-score">
                      {hasScore(match.homeScore) ? match.homeScore : "-"}
                    </strong>
                  </div>

                  <div className="live-list-row">
                    <div className="live-list-team">
                      <strong>{awayTeam.shortName}</strong>
                      <span>{awayTeam.name}</span>
                    </div>
                    <strong className="live-list-score">
                      {hasScore(match.awayScore) ? match.awayScore : "-"}
                    </strong>
                  </div>

                  <p className="timestamp-line">
                    {match.statusDetail || match.subtitle}
                  </p>
                </button>
              );
            })}
          </aside>

          {selectedMatch ? (
            <article className="panel-card live-detail-panel">
              {(() => {
                const homeTeam = getDisplayTeam(selectedMatch.homeTeamCode, {
                  tournamentCode: selectedMatch.tournamentCode,
                  name: selectedMatch.homeTeamName,
                  shortName: selectedMatch.homeTeamShortName,
                  logoPath: selectedMatch.homeTeamLogoPath,
                  primary: selectedMatch.homeTeamPrimary,
                  secondary: selectedMatch.homeTeamSecondary,
                  accent: selectedMatch.homeTeamAccent
                });
                const awayTeam = getDisplayTeam(selectedMatch.awayTeamCode, {
                  tournamentCode: selectedMatch.tournamentCode,
                  name: selectedMatch.awayTeamName,
                  shortName: selectedMatch.awayTeamShortName,
                  logoPath: selectedMatch.awayTeamLogoPath,
                  primary: selectedMatch.awayTeamPrimary,
                  secondary: selectedMatch.awayTeamSecondary,
                  accent: selectedMatch.awayTeamAccent
                });

                return (
                  <>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Match centre</p>
                        <h2>{selectedMatch.title}</h2>
                        <p className="support-copy">{selectedMatch.subtitle}</p>
                      </div>
                      <span className={`live-state-pill state-${selectedMatch.liveState ?? "scheduled"}`}>
                        {getStatusCopy(selectedMatch)}
                      </span>
                    </div>

                    <section className="live-big-scorecard">
                      <div className="live-big-team">
                        <strong>{homeTeam.name}</strong>
                        <span>{homeTeam.shortName}</span>
                      </div>
                      <div className="live-big-center">
                        <strong className="live-big-score">
                          {hasScore(selectedMatch.homeScore) ? selectedMatch.homeScore : "-"} :{" "}
                          {hasScore(selectedMatch.awayScore) ? selectedMatch.awayScore : "-"}
                        </strong>
                        <span>{selectedMatch.statusDetail || formatClock(selectedMatch.startsAt)}</span>
                        <span>{selectedMatch.clockLabel || selectedMatch.periodLabel || selectedMatch.venue}</span>
                      </div>
                      <div className="live-big-team align-right">
                        <strong>{awayTeam.name}</strong>
                        <span>{awayTeam.shortName}</span>
                      </div>
                    </section>

                    {detailLoading ? (
                      <p className="support-copy">Refreshing live match detail...</p>
                    ) : null}

                    {detail?.note ? <p className="support-copy">{detail.note}</p> : null}

                    {(() => {
                      const matchEvents = [
                        ...(detail?.scorers ?? []),
                        ...(detail?.cards ?? []),
                        ...(detail?.substitutions ?? []),
                        ...(detail?.updates ?? [])
                      ].reduce<LiveUpdate[]>((items, event) => {
                        if (items.some((item) => item.id === event.id && item.text === event.text)) {
                          return items;
                        }

                        items.push(event);
                        return items;
                      }, []);

                      return (
                        <>
                          {matchEvents.length ? (
                            <section className="feature-card">
                              <strong>Match events</strong>
                              <div className="match-detail-list">
                                {matchEvents.slice(0, 14).map((item) => (
                                  <div className="match-detail-item" key={`event-${item.id}`}>
                                    <span>{item.timeLabel || item.teamCode || "Event"}</span>
                                    <strong>{item.text}</strong>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ) : null}

                          {detail?.lineups?.length ? (
                            <section className="feature-card">
                              <strong>Lineups</strong>
                              <div className="lineup-grid">
                                {detail.lineups.map((group) => (
                                  <article className="lineup-card" key={group.teamCode}>
                                    <h3>{group.teamName || group.teamCode}</h3>
                                    <p className="timestamp-line">Starting XI</p>
                                    <div className="lineup-list">
                                      {group.starters.map((player) => (
                                        <div className="lineup-item" key={`${group.teamCode}-${player.name}`}>
                                          <strong>{player.name}</strong>
                                          <span>
                                            {player.jersey ? `#${player.jersey}` : "No."} {player.position}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>
                          ) : null}

                          {detail?.teamStats?.length || detail?.broadcasts?.length ? (
                            <section className="feature-card">
                              <strong>Team stats</strong>
                              <div className="lineup-grid">
                                {detail?.teamStats?.map((group) => (
                                  <article className="lineup-card" key={`stat-${group.teamCode}`}>
                                    <h3>{group.teamName || group.teamCode}</h3>
                                    <div className="match-detail-list">
                                      {group.statistics.map((item) => (
                                        <div className="match-detail-item" key={`${group.teamCode}-${item.label}`}>
                                          <span>{item.label}</span>
                                          <strong>{item.value}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  </article>
                                ))}
                              </div>
                              {detail?.broadcasts?.length ? (
                                <p className="support-copy">Broadcasts: {detail.broadcasts.join(", ")}</p>
                              ) : null}
                            </section>
                          ) : null}
                        </>
                      );
                    })()}
                  </>
                );
              })()}
            </article>
          ) : null}
        </section>
      )}
    </main>
  );
}
