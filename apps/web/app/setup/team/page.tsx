"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IPL_TEAMS, getTeam } from "../../../lib/club-data";
import { useClubStore } from "../../../lib/club-state";
import { TeamBrandBadge } from "../../components/team-brand-badge";

export default function TeamSetupPage() {
  const router = useRouter();
  const { ready, session, state, updateState } = useClubStore();
  const currentUser = state.users.find((user) => user.id === session?.userId);

  if (!ready) {
    return <main className="page-shell">Loading favorite-team board...</main>;
  }

  if (!currentUser) {
    return (
      <main className="page-shell">
        <section className="panel-card">
          <p className="eyebrow">No active profile</p>
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

  const lockedTeam = currentUser.favoriteTeamCode
    ? getTeam(currentUser.favoriteTeamCode)
    : undefined;

  const handleTeamLock = (teamCode: (typeof IPL_TEAMS)[number]["code"]) => {
    if (!currentUser || currentUser.favoriteTeamCode) {
      return;
    }

    const now = new Date().toISOString();

    updateState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              favoriteTeamCode: teamCode,
              updatedAt: now
            }
          : user
      ),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "favorite-team",
          actorName: currentUser.name,
          detail: `Locked favorite team as ${teamCode}.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    router.push("/polls/today");
  };

  return (
    <main className="page-shell">
      <section
        className="panel-card panel-hero"
        style={{
          background: lockedTeam
            ? `linear-gradient(135deg, ${lockedTeam.primary}22, ${lockedTeam.secondary}11), rgba(9, 23, 43, 0.8)`
            : undefined
        }}
      >
        <div className="hero-with-brand">
          <div>
            <p className="eyebrow">Favorite team setup</p>
            <h1>Choose one team for your full experience.</h1>
            <p className="support-copy">
              Once you choose, the team theme stays locked forever and will tint
              your pages.
            </p>
          </div>
          {lockedTeam ? <TeamBrandBadge team={lockedTeam} /> : null}
        </div>
        {lockedTeam ? (
          <div className="profile-chip-grid">
            <div className="profile-chip">
              <span>Locked team</span>
              <strong>{lockedTeam.name}</strong>
            </div>
          </div>
        ) : null}
      </section>

      {!lockedTeam ? (
        <section className="panel-card">
          <div className="team-grid team-grid-detailed">
            {IPL_TEAMS.map((team) => (
              <button
                className="team-tile team-tile-detailed"
                key={team.code}
                onClick={() => handleTeamLock(team.code)}
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
        </section>
      ) : (
        <section className="panel-card">
          <p className="eyebrow">Favorite team locked</p>
          <h2>{lockedTeam.name}</h2>
          <p className="support-copy">
            This choice is permanent for the current profile.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/polls/today">
              Go to polls
            </Link>
            <Link className="secondary-link" href="/setup">
              Back to profile
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
