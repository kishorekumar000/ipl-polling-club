"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { countUsersByRole, getTournament } from "../lib/club-data";
import { createPublicId, isNameTaken, normalizeName } from "../lib/club-logic";
import { useClubStore } from "../lib/club-state";
import { useDailyMatches } from "../lib/use-daily-matches";

export default function HomePage() {
  const router = useRouter();
  const {
    ready,
    session,
    state,
    currentTournament,
    updateState,
    setSession
  } = useClubStore();
  const { todayMatches, loading, error } = useDailyMatches(currentTournament);
  const [name, setName] = useState("");
  const [loginKey, setLoginKey] = useState("");
  const [joinError, setJoinError] = useState("");
  const [loginError, setLoginError] = useState("");
  const tournament = getTournament(currentTournament);
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const playerProfiles = state.users.filter((user) => user.role === "user");

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setJoinError("Enter your name to create your profile.");
      return;
    }

    if (isNameTaken(state.users, trimmedName)) {
      setJoinError("That name already exists. Please choose another name.");
      return;
    }

    const now = new Date().toISOString();
    const nextUserId = `user-${Date.now()}`;
    const publicId = createPublicId(playerProfiles.length, "user");

    updateState((current) => ({
      ...current,
      users: [
        ...current.users,
        {
          id: nextUserId,
          publicId,
          name: trimmedName,
          normalizedName: normalizeName(trimmedName),
          role: "user",
          renameCount: 0,
          createdAt: now,
          updatedAt: now
        }
      ],
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "join",
          actorName: trimmedName,
          detail: `Created profile ${publicId}.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    setSession({
      userId: nextUserId,
      role: "user"
    });
    setJoinError("");
    setLoginError("");
    router.push("/setup/team");
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedKey = loginKey.trim();

    if (!trimmedKey) {
      setLoginError("Enter your profile name or unique ID.");
      return;
    }

    const normalizedKey = normalizeName(trimmedKey);
    const matchedUser = playerProfiles.find(
      (user) =>
        user.normalizedName === normalizedKey ||
        user.publicId.toLowerCase() === trimmedKey.toLowerCase()
    );

    if (!matchedUser) {
      setLoginError("No user profile matched that name or ID.");
      return;
    }

    setSession({
      userId: matchedUser.id,
      role: matchedUser.role
    });
    setJoinError("");
    setLoginError("");
  };

  if (!ready) {
    return <main className="page-shell">Loading the pavilion...</main>;
  }

  return (
    <main className="page-shell">
      <section className="panel-card panel-hero">
        <div>
          <p className="eyebrow">User entrance</p>
          <h1>Join the match club with your own profile.</h1>
          <p className="support-copy">
            Create your profile with your name, get a unique ID, then lock your
            favorite IPL team on the next page. Then switch between {tournament?.shortName ?? "tournaments"}
            without mixing settlements. Admin controls stay separate.
          </p>
        </div>

        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Total user profiles</span>
            <strong>{countUsersByRole(state, "user")}</strong>
          </div>
          <div className="profile-chip">
            <span>Admin profiles</span>
            <strong>{countUsersByRole(state, "admin")}</strong>
          </div>
          <div className="profile-chip">
            <span>{tournament?.shortName} today</span>
            <strong>{todayMatches.length}</strong>
          </div>
        </div>
      </section>

      {!currentUser ? (
        <>
          <section className="panel-card">
            <p className="eyebrow">Create profile</p>
            <h2>Start with your name</h2>
            <form className="stack-form" onSubmit={handleJoin}>
              <div className="field-block">
                <label htmlFor="name">Display name</label>
                <input
                  className="text-input"
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  type="text"
                  value={name}
                />
              </div>
              <div className="hero-actions">
                <button className="primary-link button-link" type="submit">
                  Create profile
                </button>
                <Link className="secondary-link" href="/admin">
                  Admin setup / login
                </Link>
              </div>
              {joinError ? <p className="warning-text">{joinError}</p> : null}
              <p className="support-copy">
                Names are checked case-insensitively, so `Kishore` and `KISHORE`
                cannot both exist.
              </p>
            </form>
          </section>

          {playerProfiles.length > 0 ? (
            <section className="panel-card">
              <p className="eyebrow">Returning user</p>
              <h2>Sign back in without creating a duplicate profile.</h2>
              <form className="stack-form" onSubmit={handleLogin}>
                <div className="field-block">
                  <label htmlFor="login-key">Name or unique ID</label>
                  <input
                    className="text-input"
                    id="login-key"
                    onChange={(event) => setLoginKey(event.target.value)}
                    placeholder="Enter your name or USR-001"
                    type="text"
                    value={loginKey}
                  />
                </div>
                <div className="hero-actions">
                  <button className="secondary-link button-link" type="submit">
                    Open profile
                  </button>
                </div>
                {loginError ? <p className="warning-text">{loginError}</p> : null}
              </form>
            </section>
          ) : null}
        </>
      ) : (
        <section className="panel-card">
          <p className="eyebrow">Welcome back</p>
          <h2>{currentUser.name}</h2>
          <p className="support-copy">
            Your unique ID is {currentUser.publicId}.
            {currentUser.favoriteTeamCode
              ? " Your favorite team is already locked, so you can head straight to today's polls."
              : " Your favorite team still needs to be locked on the next page."}
          </p>
          <div className="hero-actions">
            {!currentUser.favoriteTeamCode ? (
              <Link className="primary-link" href="/setup/team">
                Choose favorite team
              </Link>
            ) : (
              <Link className="primary-link" href="/polls/today">
                Go to today&apos;s polls
              </Link>
            )}
            <Link className="secondary-link" href="/setup">
              Open profile
            </Link>
            {currentUser.role === "admin" ? (
              <Link className="secondary-link" href="/admin">
                Open admin dashboard
              </Link>
            ) : null}
          </div>
        </section>
      )}

      <section className="panel-card">
        <p className="eyebrow">Today&apos;s active tournament slate</p>
        <h2>{tournament?.name ?? "Tournament"} polls stay on their own lane.</h2>
        {loading ? (
          <p className="support-copy">Syncing today&apos;s schedule...</p>
        ) : null}
        {error ? <p className="warning-text">{error}</p> : null}
        <div className="timeline-grid">
          {todayMatches.map((match) => (
            <div className="feature-card" key={match.id}>
              <strong>{match.title}</strong>
              <p className="support-copy">{match.subtitle}</p>
              <p className="support-copy">
                Opens at {match.pollOpenAt.slice(11, 16)} and locks at{" "}
                {match.pollLockAt.slice(11, 16)}.
              </p>
            </div>
          ))}
          {!loading && todayMatches.length === 0 ? (
            <div className="feature-card">
              <strong>No {tournament?.shortName ?? "tournament"} match found for today</strong>
              <p className="support-copy">
                Switch tournaments from the header any time. Each one keeps its
                own fixtures, votes, and settlement flow separate.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
