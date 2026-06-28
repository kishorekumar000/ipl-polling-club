"use client";

import { getCarryBalance, getDisplayTeam, getTournament } from "../../lib/club-data";
import { formatAmount } from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";

export default function SettlementsPage() {
  const { ready, state, currentTournament } = useClubStore();

  if (!ready) {
    return <main className="page-shell">Loading settlements...</main>;
  }

  const tournament = getTournament(currentTournament);
  const settlements = state.settlements
    .filter((item) => item.tournamentCode === currentTournament)
    .sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );
  const latestSettlement = settlements[0];

  return (
    <main className="page-shell">
      <section className={`panel-card panel-hero ${currentTournament === "FIFA" ? "panel-hero-fifa" : ""}`}>
        <div>
          <p className="eyebrow">Settlement board</p>
          <h1>{tournament?.shortName ?? "Tournament"} settlements stay separate and visible.</h1>
          <p className="support-copy">
            Admins decide the winner, then the carry-forward math and user list
            become visible here for all participants without mixing with the
            other tournament.
          </p>
        </div>
        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Visible settlement</span>
            <strong>{latestSettlement ? 1 : 0}</strong>
          </div>
          <div className="profile-chip">
            <span>{tournament?.shortName} carry waiting</span>
            <strong>Rs {getCarryBalance(state, currentTournament)}</strong>
          </div>
        </div>
      </section>

      <section className="stack-list">
        {latestSettlement ? (() => {
          const winner = getDisplayTeam(latestSettlement.winnerTeamCode, {
            tournamentCode: latestSettlement.tournamentCode
          });

          return (
            <article className="panel-card" key={latestSettlement.matchId}>
              <div className="match-heading">
                <div>
                  <p className="eyebrow">Latest final settlement</p>
                  <h2>{latestSettlement.matchTitle}</h2>
                  <p className="support-copy">
                    Winner: {winner?.name ?? latestSettlement.winnerTeamCode}
                  </p>
                </div>
                <div className="match-timing-card">
                  <div>
                    <span>Losers</span>
                    <strong>{latestSettlement.loserCount}</strong>
                  </div>
                  <div>
                    <span>Winners</span>
                    <strong>{latestSettlement.winnerCount}</strong>
                  </div>
                  <div>
                    <span>Each winner</span>
                    <strong>Rs {latestSettlement.sharePerWinner}</strong>
                  </div>
                  <div>
                    <span>Carry out</span>
                    <strong>Rs {latestSettlement.remainder}</strong>
                  </div>
                </div>
              </div>

              <section className="final-settlement-list">
                <p className="eyebrow">Final settlement list</p>
                <div className="final-settlement-single-card">
                  {latestSettlement.entries.map((entry) => (
                    <div
                      className={`final-settlement-row ${entry.amount > 0 ? "win" : "loss"}`}
                      key={`final-${latestSettlement.matchId}-${entry.userId}`}
                    >
                      <span>{entry.userName}</span>
                      <strong>{formatAmount(entry.amount)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          );
        })() : (
          <section className="panel-card">
            <p className="eyebrow">No settlement yet</p>
            <h2>The board will populate after an admin declares a result.</h2>
          </section>
        )}
      </section>
    </main>
  );
}
