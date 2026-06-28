"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getTeam, getTournament, TOURNAMENTS } from "../../lib/club-data";
import { useClubStore } from "../../lib/club-state";
import { NotificationCenter } from "./notification-center";
import { TeamBrandBadge } from "./team-brand-badge";

export function ClubHeader() {
  const {
    ready,
    session,
    state,
    currentTournament,
    setCurrentTournament,
    setSession
  } = useClubStore();
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const favoriteTeam = currentUser?.favoriteTeamCode
    ? getTeam(currentUser.favoriteTeamCode)
    : undefined;
  const tournament = getTournament(currentTournament);
  const roleLabel =
    currentUser?.role === "admin"
      ? currentUser.adminLevel === "super"
        ? "Super admin"
        : "Supporting admin"
      : "User";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.tournament = currentTournament;

    if (currentTournament === "FIFA") {
      root.style.setProperty("--bg-glow", "rgba(34, 197, 94, 0.2)");
      root.style.setProperty("--bg-mist", "rgba(14, 165, 233, 0.16)");
      root.style.setProperty("--bg-primary", "#051521");
      root.style.setProperty("--bg-secondary", "#0a2a1f");
      root.style.setProperty("--bg-tertiary", "#03141d");
      return;
    }

    if (currentTournament === "WT20") {
      root.style.setProperty("--bg-glow", "rgba(238, 90, 166, 0.22)");
      root.style.setProperty("--bg-mist", "rgba(255, 209, 102, 0.16)");
      root.style.setProperty("--bg-primary", "#14071f");
      root.style.setProperty("--bg-secondary", "#2d0d3d");
      root.style.setProperty("--bg-tertiary", "#1a0c28");
      return;
    }

    if (!favoriteTeam) {
      root.style.setProperty("--bg-glow", "rgba(72, 167, 255, 0.2)");
      root.style.setProperty("--bg-mist", "rgba(87, 214, 197, 0.14)");
      root.style.setProperty("--bg-primary", "#06101a");
      root.style.setProperty("--bg-secondary", "#081a2f");
      root.style.setProperty("--bg-tertiary", "#041425");
      return;
    }

    root.style.setProperty("--bg-glow", `${favoriteTeam.primary}44`);
    root.style.setProperty("--bg-mist", `${favoriteTeam.secondary}30`);
    root.style.setProperty("--bg-primary", "#04101a");
    root.style.setProperty("--bg-secondary", `${favoriteTeam.primary}20`);
    root.style.setProperty("--bg-tertiary", `${favoriteTeam.secondary}12`);
  }, [currentTournament, favoriteTeam]);

  return (
    <header
      className="club-header"
      style={{
        borderColor: favoriteTeam ? `${favoriteTeam.primary}66` : undefined,
        boxShadow: favoriteTeam
          ? `0 10px 40px ${favoriteTeam.primary}1f`
          : undefined
      }}
    >
      <div className="club-header-inner">
        <Link className="home-link" href="/">
          Match Club
        </Link>

        <nav className="club-nav">
          <Link href="/">Home</Link>
          {ready && currentUser ? <Link href="/polls/today">Polls</Link> : null}
          {ready && currentUser ? <Link href="/setup">Profile</Link> : null}
          {ready && currentUser ? <Link href="/settlements">Settlements</Link> : null}
          {ready && session?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
          {!currentUser ? <Link href="/admin">Admin</Link> : null}
        </nav>

        <div className="tournament-switch" role="tablist" aria-label="Tournament switch">
          {TOURNAMENTS.map((item) => (
            <button
              aria-selected={currentTournament === item.code}
              className={`tournament-chip ${currentTournament === item.code ? "active" : ""}`}
              key={item.code}
              onClick={() => setCurrentTournament(item.code)}
              type="button"
            >
              {item.shortName}
            </button>
          ))}
        </div>

        <div className="club-user-chip">
          {tournament ? (
            <span className="tournament-indicator">
              {tournament.shortName} live
            </span>
          ) : null}
          {currentUser ? (
            <>
              {favoriteTeam && currentTournament === "IPL" ? (
                <TeamBrandBadge compact team={favoriteTeam} />
              ) : null}
              <span>
                {currentUser.name} | {currentUser.publicId} | {roleLabel}
              </span>
              <NotificationCenter />
              <button
                className="mini-link"
                onClick={() => setSession(null)}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <span>Fresh profiles only</span>
          )}
        </div>
      </div>
    </header>
  );
}
