"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getTeam } from "../../lib/club-data";
import { useClubStore } from "../../lib/club-state";
import { NotificationCenter } from "./notification-center";
import { TeamBrandBadge } from "./team-brand-badge";

export function ClubHeader() {
  const { ready, session, state, setSession } = useClubStore();
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const favoriteTeam = currentUser?.favoriteTeamCode
    ? getTeam(currentUser.favoriteTeamCode)
    : undefined;
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
  }, [favoriteTeam]);

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
          IPL Home
        </Link>

        <nav className="club-nav">
          <Link href="/">Home</Link>
          {ready && currentUser ? <Link href="/polls/today">Polls</Link> : null}
          {ready && currentUser ? <Link href="/setup">Profile</Link> : null}
          {ready && currentUser ? <Link href="/settlements">Settlements</Link> : null}
          {ready && session?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
          {!currentUser ? <Link href="/admin">Admin</Link> : null}
        </nav>

        <div className="club-user-chip">
          {currentUser ? (
            <>
              {favoriteTeam ? <TeamBrandBadge compact team={favoriteTeam} /> : null}
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
