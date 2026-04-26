"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { IPL_TEAMS, countUsersByRole, getTeam } from "../../lib/club-data";
import {
  createPublicId,
  formatAmount,
  formatClock,
  getFinalTeams,
  getVotesForMatch,
  isNameTaken,
  normalizeName
} from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";
import { useDailyMatches } from "../../lib/use-daily-matches";
import { TeamCode, UserRole } from "../../lib/club-types";
import { TeamBrandBadge } from "../components/team-brand-badge";

const SUPER_ADMIN_PASSWORD = "Kishore001@";

export default function AdminPage() {
  const { ready, session, state, updateState, setSession } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches();
  const [adminName, setAdminName] = useState("");
  const [favoriteTeamCode, setFavoriteTeamCode] = useState<TeamCode | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [formError, setFormError] = useState("");
  const adminProfiles = state.users.filter((user) => user.role === "admin");
  const adminUser = state.users.find((user) => user.id === session?.userId);
  const adminFavoriteTeam =
    adminUser?.favoriteTeamCode ? getTeam(adminUser.favoriteTeamCode) : undefined;
  const isSuperAdmin = adminUser?.adminLevel === "super";

  const metrics = useMemo(
    () => ({
      users: countUsersByRole(state, "user"),
      admins: countUsersByRole(state, "admin"),
      profiles: state.users.length,
      votes: state.votes.length,
      carry: state.carryBalance
    }),
    [state]
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
              password:
                nextRole === "admin"
                  ? user.adminLevel === "super"
                    ? user.password
                    : undefined
                  : undefined,
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

  const handleAdminSetup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = adminName.trim();

    if (!trimmedName) {
      setFormError("Enter your admin name first.");
      return;
    }

    if (isNameTaken(state.users, trimmedName)) {
      setFormError("That admin name already exists. Choose another.");
      return;
    }

    if (!favoriteTeamCode) {
      setFormError("Choose your favorite team for the admin profile.");
      return;
    }

    const now = new Date().toISOString();
    const nextAdminId = `admin-${Date.now()}`;
    const publicId = createPublicId(adminProfiles.length, "admin");

    updateState((current) => ({
      ...current,
      users: [
        ...current.users,
        {
          id: nextAdminId,
          publicId,
          name: trimmedName,
          normalizedName: normalizeName(trimmedName),
          role: "admin",
          adminLevel: "super",
          password: SUPER_ADMIN_PASSWORD,
          favoriteTeamCode,
          renameCount: 0,
          createdAt: now,
          updatedAt: now
        }
      ],
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "admin-setup",
          actorName: trimmedName,
          detail: `Created the super admin profile ${publicId} with fixed password ${SUPER_ADMIN_PASSWORD}.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    setSession({
      userId: nextAdminId,
      role: "admin"
    });
    setFormError("");
  };

  const handleAdminLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeName(loginName);
    const matchingAdmin = adminProfiles.find(
      (profile) =>
        profile.normalizedName === normalized && profile.adminLevel === "super"
    );

    if (!matchingAdmin || matchingAdmin.password !== loginPassword) {
      setFormError("Super admin name or password is not correct.");
      return;
    }

    setSession({
      userId: matchingAdmin.id,
      role: "admin"
    });
    setFormError("");
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
    return <main className="page-shell">Loading admin arena...</main>;
  }

  if (adminProfiles.length === 0) {
    return (
      <main className="page-shell">
        <section className="panel-card panel-hero">
          <div>
            <p className="eyebrow">Admin setup</p>
            <h1>Create your own admin profile.</h1>
            <p className="support-copy">
              The first admin becomes the super admin with full control. That
              account can also vote as a participant in match polls. The super
              admin password is fixed as {SUPER_ADMIN_PASSWORD}.
            </p>
          </div>
        </section>

        <section className="panel-card">
          <form className="stack-form" onSubmit={handleAdminSetup}>
            <div className="field-block">
              <label htmlFor="admin-name">Admin name</label>
              <input
                className="text-input"
                id="admin-name"
                onChange={(event) => setAdminName(event.target.value)}
                placeholder="Enter your admin name"
                type="text"
                value={adminName}
              />
            </div>
            <div className="field-block">
              <span>Favorite team</span>
              <div className="team-grid">
                {IPL_TEAMS.map((team) => (
                  <button
                    className={`team-tile team-tile-detailed ${favoriteTeamCode === team.code ? "is-picked" : ""}`}
                    key={team.code}
                    onClick={() => setFavoriteTeamCode(team.code)}
                    style={{
                      borderColor: `${team.primary}88`,
                      background: `linear-gradient(160deg, ${team.primary}2f, ${team.secondary}10)`
                    }}
                    type="button"
                  >
                    <strong>{team.shortName}</strong>
                    <span>{team.nickname}</span>
                    <small>{team.name}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-actions">
              <button className="primary-link button-link" type="submit">
                Create admin profile
              </button>
              <Link className="secondary-link" href="/">
                Back to home
              </Link>
            </div>
            {formError ? <p className="warning-text">{formError}</p> : null}
            <p className="support-copy">
              Fixed super admin password: {SUPER_ADMIN_PASSWORD}
            </p>
          </form>
        </section>
      </main>
    );
  }

  if (!session || session.role !== "admin" || !adminUser) {
    return (
      <main className="page-shell">
        <section className="panel-card panel-hero">
          <div>
            <p className="eyebrow">Super admin login</p>
            <h1>Admin controls stay separate from normal user pages.</h1>
            <p className="support-copy">
              Only the super admin logs in here. Supporting admins become active
              automatically after promotion when they use their normal profile.
            </p>
          </div>
        </section>

        <section className="panel-card">
          <form className="stack-form" onSubmit={handleAdminLogin}>
            <div className="field-block">
              <label htmlFor="login-name">Admin name</label>
              <input
                className="text-input"
                id="login-name"
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Enter admin name"
                type="text"
                value={loginName}
              />
            </div>
            <div className="field-block">
              <label htmlFor="login-password">Password</label>
              <input
                className="text-input"
                id="login-password"
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder={SUPER_ADMIN_PASSWORD}
                type="password"
                value={loginPassword}
              />
            </div>
            <div className="hero-actions">
              <button className="primary-link button-link" type="submit">
                Enter admin dashboard
              </button>
              <Link className="secondary-link" href="/">
                Back to home
              </Link>
            </div>
            {formError ? <p className="warning-text">{formError}</p> : null}
          </form>
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
            : undefined
        }}
      >
        <div className="hero-with-brand">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>Control the league and still vote as a participant.</h1>
            <p className="support-copy">
              {isSuperAdmin
                ? "You are the super admin, so you can edit the league and choose supporting admins."
                : "You are a supporting admin. You can access the admin area and join polls, but final control stays with the super admin."}
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
            <span>Total profiles</span>
            <strong>{metrics.profiles}</strong>
          </div>
        </div>
      </section>

      <nav className="quick-links">
        <Link className="secondary-link" href="/polls/today">
          Join polls as participant
        </Link>
        <Link className="secondary-link" href="/settlements">
          Public settlement board
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
            <strong>Carry balance</strong>
            <p className="support-copy">Rs {metrics.carry}</p>
          </div>
          <div className="feature-card">
            <strong>Votes recorded</strong>
            <p className="support-copy">{metrics.votes}</p>
          </div>
        </div>
      </section>

      <section className="stack-list">
        {loading ? <p className="support-copy">Loading today&apos;s fixtures...</p> : null}
        {error ? <p className="warning-text">{error}</p> : null}
        {todayMatches.map((match) => {
          const homeTeam = getTeam(match.homeTeamCode);
          const awayTeam = getTeam(match.awayTeamCode);
          const matchVotes = getVotesForMatch(state.votes, match.id);
          const finalTeams = getFinalTeams(match, matchVotes, state.users);
          const settlement = state.settlements.find(
            (item) => item.matchId === match.id
          );

          return (
            <article className="panel-card" key={match.id}>
              <div className="match-heading">
                <div>
                  <p className="eyebrow">Today&apos;s match control</p>
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
                  <strong>{homeTeam?.shortName}</strong>
                  <p className="support-copy">
                    {finalTeams[match.homeTeamCode].join(", ") || "No votes yet"}
                  </p>
                </div>
                <div className="feature-card">
                  <strong>{awayTeam?.shortName}</strong>
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
                    ? "Winner not declared yet, so the settlement board is still waiting."
                    : "Winner not declared yet. Only the super admin can publish the final result."}
                </p>
              )}
            </article>
          );
        })}
      </section>

      <section className="panel-card">
        <p className="eyebrow">Admin authority</p>
        <h2>One top admin. Extra admins only by promotion.</h2>
        <p className="support-copy">
          Supporting admins can join the admin area, but only the super admin can
          promote, demote, and publish match winners.
        </p>
        <div className="admin-list">
          {state.users.map((user) => {
            const authorityLabel =
              user.role === "admin"
                ? user.adminLevel === "super"
                  ? "SUPER ADMIN"
                  : "SUPPORTING ADMIN"
                : "USER";

            const canPromote = isSuperAdmin && user.role === "user";
            const canDemote =
              isSuperAdmin &&
              user.role === "admin" &&
              user.adminLevel !== "super" &&
              user.id !== adminUser.id;

            return (
              <div className="admin-list-item" key={user.id}>
                <strong>
                  {user.name} | {user.publicId}
                </strong>
                <p className="support-copy">
                  {authorityLabel} | Favorite team: {user.favoriteTeamCode ?? "Not chosen"}
                </p>
                {canPromote ? (
                  <div className="hero-actions">
                    <button
                      className="secondary-link button-link"
                      onClick={() => handleAdminRoleChange(user.id, "admin")}
                      type="button"
                    >
                      Make supporting admin
                    </button>
                  </div>
                ) : null}
                {canDemote ? (
                  <div className="hero-actions">
                    <button
                      className="secondary-link button-link"
                      onClick={() => handleAdminRoleChange(user.id, "user")}
                      type="button"
                    >
                      Remove admin access
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-card">
        <p className="eyebrow">Profiles created so far</p>
        <div className="admin-list">
          {state.users.map((user) => (
            <div className="admin-list-item" key={user.id}>
              <strong>
                {user.name} | {user.publicId}
              </strong>
              <p className="support-copy">
                {user.role === "admin"
                  ? user.adminLevel === "super"
                    ? "SUPER ADMIN"
                    : "SUPPORTING ADMIN"
                  : "USER"}{" "}
                | Favorite team: {user.favoriteTeamCode ?? "Not chosen"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
