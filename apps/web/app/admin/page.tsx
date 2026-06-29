"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  countUsersByRole,
  getCarryBalance,
  getDisplayTeam,
  getTeam,
  getTournament
} from "../../lib/club-data";
import {
  formatAmount,
  formatClock,
  formatLongDate,
  getFinalTeams,
  getVotesForMatch
} from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";
import { useDailyMatches } from "../../lib/use-daily-matches";
import { TeamCode, UserRole } from "../../lib/club-types";
import { TeamBrandBadge } from "../components/team-brand-badge";

export default function AdminPage() {
  const {
    ready,
    session,
    state,
    currentTournament,
    updateState
  } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches(currentTournament);
  const tournament = getTournament(currentTournament);
  const adminUser = state.users.find((user) => user.id === session?.userId);
  const isAdmin = adminUser?.role === "admin";
  const isSuperAdmin = adminUser?.adminLevel === "super";
  const adminFavoriteTeam =
    adminUser?.favoriteTeamCode && currentTournament === "IPL"
      ? getDisplayTeam(adminUser.favoriteTeamCode, {
          tournamentCode: "IPL"
        })
      : undefined;

  const metrics = useMemo(
    () => ({
      users: countUsersByRole(state, "user"),
      admins: countUsersByRole(state, "admin"),
      profiles: state.users.length,
      votes: state.votes.length,
      carry: getCarryBalance(state, currentTournament)
    }),
    [currentTournament, state]
  );

  const handleAdminRoleChange = (targetUserId: string, nextRole: UserRole) => {
    if (!adminUser || !isSuperAdmin) {
      return;
    }

    const targetUser = state.users.find((user) => user.id === targetUserId);

    if (!targetUser || targetUser.id === adminUser.id) {
      return;
    }

    const now = new Date().toISOString();
    const detail =
      nextRole === "admin"
        ? `Promoted ${targetUser.name} to supporting admin access.`
        : `Returned ${targetUser.name} to normal user access.`;

    updateState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === targetUserId
          ? {
              ...user,
              role: nextRole,
              adminLevel: nextRole === "admin" ? "standard" : undefined,
              updatedAt: now
            }
          : user
      ),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: nextRole === "admin" ? "admin-promote" : "admin-demote",
          actorName: adminUser.name,
          detail,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));
  };

  const handleRemoveUser = (targetUserId: string) => {
    if (!adminUser || !isSuperAdmin) {
      return;
    }

    const targetUser = state.users.find((user) => user.id === targetUserId);

    if (
      !targetUser ||
      targetUser.id === adminUser.id ||
      targetUser.adminLevel === "super"
    ) {
      return;
    }

    const now = new Date().toISOString();

    updateState((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== targetUserId),
      votes: current.votes.filter((vote) => vote.userId !== targetUserId),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "user-remove",
          actorName: adminUser.name,
          detail: `Removed ${targetUser.name} from the club.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));
  };

  const handleDeclareWinner = (matchId: string, winnerTeamCode: TeamCode) => {
    if (!adminUser || !isSuperAdmin) {
      return;
    }

    const now = new Date().toISOString();

    updateState((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              winnerTeamCode,
              resultDeclaredAt: now,
              resultDeclaredBy: adminUser.name
            }
          : match
      ),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "result",
          actorName: adminUser.name,
          detail: `Declared ${winnerTeamCode} as the winner for ${matchId}.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));
  };

  if (!ready) {
    return <main className="page-shell">Loading admin workspace...</main>;
  }

  if (!session || !adminUser) {
    return (
      <main className="page-shell">
        <section className="panel-card panel-hero">
          <div>
            <p className="eyebrow">Admin area</p>
            <h1>Sign in with your normal member profile first.</h1>
            <p className="support-copy">
              The first registered member becomes super admin. Supporting admins
              are normal users who were later promoted by the super admin.
            </p>
          </div>
        </section>

        <section className="panel-card">
          <div className="hero-actions">
            <Link className="primary-link" href="/">
              Go to home login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="page-shell">
        <section className="panel-card panel-hero">
          <div>
            <p className="eyebrow">Admin access required</p>
            <h1>This profile is still a normal user.</h1>
            <p className="support-copy">
              Only the super admin can promote a normal member into supporting
              admin access.
            </p>
          </div>
        </section>

        <section className="panel-card">
          <div className="hero-actions">
            <Link className="primary-link" href="/polls/today">
              Back to polls
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section
        className="panel-card panel-hero"
        style={{
          background: adminFavoriteTeam
            ? `linear-gradient(135deg, ${adminFavoriteTeam.primary}22, ${adminFavoriteTeam.secondary}11), rgba(9, 23, 43, 0.8)`
            : currentTournament === "FIFA"
              ? "linear-gradient(145deg, rgba(9, 76, 49, 0.9), rgba(4, 22, 31, 0.96))"
              : currentTournament === "WT20"
                ? "linear-gradient(145deg, rgba(100, 29, 120, 0.92), rgba(26, 8, 36, 0.98))"
                : undefined
        }}
      >
        <div className="hero-with-brand">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>
              {isSuperAdmin
                ? "You control the full club and every manual override."
                : "You are a supporting admin with read-heavy access."}
            </h1>
            <p className="support-copy">
              {isSuperAdmin
                ? "Automatic match sync stays active, but you can still manually declare winners, promote admins, remove users, and inspect every joined member."
                : "You can inspect the live club data and join polls as a normal participant, while super admin powers stay protected."}
            </p>
          </div>
          {adminFavoriteTeam ? <TeamBrandBadge team={adminFavoriteTeam} /> : null}
        </div>
        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Admin</span>
            <strong>{adminUser.name}</strong>
          </div>
          <div className="profile-chip">
            <span>Authority</span>
            <strong>{isSuperAdmin ? "Super admin" : "Supporting admin"}</strong>
          </div>
          <div className="profile-chip">
            <span>Admin ID</span>
            <strong>{adminUser.publicId}</strong>
          </div>
          <div className="profile-chip">
            <span>Active tournament</span>
            <strong>{tournament?.shortName}</strong>
          </div>
        </div>
      </section>

      <nav className="quick-links">
        <Link className="secondary-link" href="/polls/today">
          Join polls as participant
        </Link>
        <Link className="secondary-link" href="/setup">
          Open your profile
        </Link>
        <Link className="secondary-link" href="/settlements">
          Open settlement board
        </Link>
      </nav>

      <section className="panel-card">
        <p className="eyebrow">League metrics</p>
        <div className="timeline-grid">
          <div className="feature-card">
            <strong>User profiles</strong>
            <p className="support-copy">{metrics.users}</p>
          </div>
          <div className="feature-card">
            <strong>Admin profiles</strong>
            <p className="support-copy">{metrics.admins}</p>
          </div>
          <div className="feature-card">
            <strong>Total profiles</strong>
            <p className="support-copy">{metrics.profiles}</p>
          </div>
          <div className="feature-card">
            <strong>{tournament?.shortName} carry balance</strong>
            <p className="support-copy">Rs {metrics.carry}</p>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <p className="eyebrow">Manual control room</p>
        <h2>Super admin controls stay above all automated flows.</h2>
        <div className="timeline-grid">
          <div className="feature-card">
            <strong>Automatic fixture sync</strong>
            <p className="support-copy">
              Real fixtures still load automatically for each tournament.
            </p>
          </div>
          <div className="feature-card">
            <strong>Manual winner declaration</strong>
            <p className="support-copy">
              {isSuperAdmin
                ? "You can manually publish the winner for any synced match below."
                : "Only the super admin can publish the winner manually."}
            </p>
          </div>
          <div className="feature-card">
            <strong>Admin promotion</strong>
            <p className="support-copy">
              {isSuperAdmin
                ? "You can promote a normal user into supporting admin access."
                : "Supporting admins cannot change roles."}
            </p>
          </div>
          <div className="feature-card">
            <strong>User removal</strong>
            <p className="support-copy">
              {isSuperAdmin
                ? "You can remove any non-super-admin member and clear their votes."
                : "Only the super admin can remove members."}
            </p>
          </div>
        </div>
      </section>

      <section className="stack-list">
        {loading ? <p className="support-copy">Loading today&apos;s fixtures...</p> : null}
        {error ? <p className="warning-text">{error}</p> : null}
        {todayMatches.map((match) => {
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
          const matchVotes = getVotesForMatch(state.votes, match.id);
          const finalTeams = getFinalTeams(match, matchVotes, state.users);
          const settlement = state.settlements.find((item) => item.matchId === match.id);

          return (
            <article className="panel-card" key={match.id}>
              <div className="match-heading">
                <div>
                  <p className="eyebrow">Today&apos;s {tournament?.shortName} match control</p>
                  <h2>{match.title}</h2>
                  <p className="support-copy">
                    {match.subtitle} | Opens {formatClock(match.pollOpenAt)} | Locks{" "}
                    {formatClock(match.pollLockAt)}
                  </p>
                </div>
                <div className="hero-actions">
                  {[match.homeTeamCode, match.awayTeamCode].map((teamCode) => (
                    <button
                      className="secondary-link button-link"
                      disabled={!isSuperAdmin}
                      key={teamCode}
                      onClick={() => handleDeclareWinner(match.id, teamCode)}
                      type="button"
                    >
                      {isSuperAdmin ? `Declare ${teamCode}` : `Super admin declares ${teamCode}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-snapshot-grid">
                <div className="feature-card">
                  <strong>{homeTeam.shortName}</strong>
                  <p className="support-copy">
                    {finalTeams[match.homeTeamCode].join(", ") || "No votes yet"}
                  </p>
                </div>
                <div className="feature-card">
                  <strong>{awayTeam.shortName}</strong>
                  <p className="support-copy">
                    {finalTeams[match.awayTeamCode].join(", ") || "No votes yet"}
                  </p>
                </div>
                <div className="feature-card">
                  <strong>Entries</strong>
                  <p className="support-copy">
                    {matchVotes.length} total votes recorded for this match.
                  </p>
                </div>
              </div>

              {settlement ? (
                <div className="settlement-entry-grid compact-grid">
                  {settlement.entries.map((entry) => (
                    <div
                      className={`settlement-entry ${entry.amount > 0 ? "win" : "loss"}`}
                      key={`${match.id}-${entry.userId}`}
                    >
                      <strong>{entry.userName}</strong>
                      <span>
                        {entry.teamCode} ({formatAmount(entry.amount)})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="support-copy">
                  {isSuperAdmin
                    ? `Winner not declared yet, so the ${tournament?.shortName} settlement board is still waiting.`
                    : "Winner not declared yet. Only the super admin can publish the final result."}
                </p>
              )}
            </article>
          );
        })}
      </section>

      <section className="panel-card">
        <p className="eyebrow">Joined users table</p>
        <h2>See every member who has joined the club.</h2>
        <div className="joined-user-table-wrap">
          <table className="joined-user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Role</th>
                <th>Favorite team</th>
                <th>Joined date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((user) => {
                const favoriteTeam = user.favoriteTeamCode
                  ? getTeam(user.favoriteTeamCode)?.shortName ?? user.favoriteTeamCode
                  : "Not set";
                const roleLabel =
                  user.role === "admin"
                    ? user.adminLevel === "super"
                      ? "Super admin"
                      : "Supporting admin"
                    : "User";
                const canPromote = isSuperAdmin && user.role === "user";
                const canDemote =
                  isSuperAdmin &&
                  user.role === "admin" &&
                  user.adminLevel !== "super" &&
                  user.id !== adminUser.id;
                const canRemove =
                  isSuperAdmin &&
                  user.id !== adminUser.id &&
                  user.adminLevel !== "super";

                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.publicId}</td>
                    <td>{roleLabel}</td>
                    <td>{favoriteTeam}</td>
                    <td>{formatLongDate(user.createdAt)}</td>
                    <td>Active</td>
                    <td>
                      <div className="table-actions">
                        {canPromote ? (
                          <button
                            className="mini-link"
                            onClick={() => handleAdminRoleChange(user.id, "admin")}
                            type="button"
                          >
                            Promote
                          </button>
                        ) : null}
                        {canDemote ? (
                          <button
                            className="mini-link"
                            onClick={() => handleAdminRoleChange(user.id, "user")}
                            type="button"
                          >
                            Demote
                          </button>
                        ) : null}
                        {canRemove ? (
                          <button
                            className="mini-link danger-link"
                            onClick={() => handleRemoveUser(user.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                        {!canPromote && !canDemote && !canRemove ? (
                          <span className="timestamp-line">View only</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
