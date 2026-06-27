"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getTeam, getTournament } from "../../lib/club-data";
import { isNameTaken, normalizeName } from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";
import { TeamBrandBadge } from "../components/team-brand-badge";

export default function SetupPage() {
  const { ready, session, state, currentTournament, updateState } = useClubStore();
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const tournament = getTournament(currentTournament);

  if (!ready) {
    return <main className="page-shell">Loading profile studio...</main>;
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

  const favoriteTeam = currentUser.favoriteTeamCode
    ? getTeam(currentUser.favoriteTeamCode)
    : undefined;
  const hasRenameLeft = currentUser.renameCount < 2;
  const isFinalRename = currentUser.renameCount === 1;
  const roleLabel =
    currentUser.role === "admin"
      ? currentUser.adminLevel === "super"
        ? "SUPER ADMIN"
        : "SUPPORTING ADMIN"
      : "USER";

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = renameValue.trim();

    if (!hasRenameLeft) {
      setError("You already used both allowed name changes.");
      return;
    }

    if (!trimmedName) {
      setError("Enter a new name first.");
      return;
    }

    if (isNameTaken(state.users, trimmedName, currentUser.id)) {
      setError("That name already exists. Please choose another name.");
      return;
    }

    const now = new Date().toISOString();

    updateState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              name: trimmedName,
              normalizedName: normalizeName(trimmedName),
              renameCount: user.renameCount + 1,
              updatedAt: now
            }
          : user
      ),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "rename",
          actorName: currentUser.name,
          detail: `Renamed profile to ${trimmedName}.`,
          createdAt: now
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    setRenameValue("");
    setError("");
  };

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
            <p className="eyebrow">Profile setup</p>
            <h1>{currentUser.name}</h1>
            <p className="support-copy">
              Your profile is saved locally with unique ID {currentUser.publicId}.
            </p>
          </div>
          {favoriteTeam ? <TeamBrandBadge team={favoriteTeam} /> : null}
        </div>
        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className="profile-chip">
            <span>Theme team</span>
            <strong>{favoriteTeam?.name ?? "Not locked yet"}</strong>
          </div>
          <div className="profile-chip">
            <span>Name changes left</span>
            <strong>{Math.max(0, 2 - currentUser.renameCount)}</strong>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <p className="eyebrow">Rename controls</p>
        <h2>Names can be changed only twice.</h2>
        {hasRenameLeft ? (
          <form className="stack-form" onSubmit={handleRename}>
            <div className="field-block">
              <label htmlFor="rename">New display name</label>
              <input
                className="text-input"
                id="rename"
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder="Enter a new display name"
                type="text"
                value={renameValue}
              />
            </div>
            {isFinalRename ? (
              <p className="warning-text">
                Warning: this will use your final allowed rename.
              </p>
            ) : null}
            <button className="secondary-link button-link" type="submit">
              Save new name
            </button>
          </form>
        ) : (
          <p className="warning-text">
            Your two allowed name changes are already used.
          </p>
        )}
        {error ? <p className="warning-text">{error}</p> : null}
      </section>

      <section className="panel-card">
        <p className="eyebrow">Favorite team</p>
        <h2>Team theme stays locked forever.</h2>
        <p className="support-copy">
          That favorite IPL team powers the visuals across both IPL and {tournament?.shortName ?? "FIFA"} pages.
        </p>
        <div className="hero-actions">
          {!favoriteTeam ? (
            <Link className="primary-link" href="/setup/team">
              Choose favorite team
            </Link>
          ) : (
            <Link className="secondary-link" href="/setup/team">
              View locked team
            </Link>
          )}
          <Link className="secondary-link" href="/polls/today">
            Open today&apos;s polls
          </Link>
        </div>
      </section>
    </main>
  );
}
