"use client";

import { useEffect, useState } from "react";
import { createEmptyState } from "./club-data";
import { recomputeSettlements } from "./club-logic";
import { AppState, ClubUser, Session, TournamentCode } from "./club-types";

const STATE_KEY = "ipl-club-state-v4";
const SESSION_KEY = "ipl-club-session-v3";
const TOURNAMENT_KEY = "ipl-club-tournament-v1";
const SHARED_STATE_ENDPOINT = "/api/shared-state";
const STATE_SYNC_EVENT = "ipl-club:state-sync";
const SESSION_SYNC_EVENT = "ipl-club:session-sync";
const TOURNAMENT_SYNC_EVENT = "ipl-club:tournament-sync";

function normalizeUsers(users: ClubUser[]): ClubUser[] {
  const adminUsers = users.filter((user) => user.role === "admin");
  const hasSuperAdmin = adminUsers.some((user) => user.adminLevel === "super");
  const firstAdminIndex = users.findIndex((item) => item.role === "admin");

  return users.map((user, index) => {
    const baseUser = {
      ...user,
      password: user.password?.trim() ? user.password : user.publicId
    };

    if (user.role !== "admin") {
      return baseUser;
    }

    if (user.adminLevel) {
      return baseUser;
    }

    return {
      ...baseUser,
      adminLevel:
        !hasSuperAdmin && index === firstAdminIndex ? "super" : "standard"
    };
  });
}

function normalizeState(state: AppState) {
  return {
    ...state,
    users: normalizeUsers(state.users),
    matches: state.matches.map((match) => ({
      ...match,
      tournamentCode: match.tournamentCode ?? "IPL"
    })),
    settlements: state.settlements.map((settlement) => ({
      ...settlement,
      tournamentCode: settlement.tournamentCode ?? "IPL"
    })),
    carryBalances: {
      IPL: state.carryBalances?.IPL ?? (state as AppState & { carryBalance?: number }).carryBalance ?? 0,
      FIFA: state.carryBalances?.FIFA ?? 0,
      WT20: state.carryBalances?.WT20 ?? 0
    },
    appNotifications: state.appNotifications ?? [],
    chatMessages: state.chatMessages ?? [],
    announcements: state.announcements ?? []
  };
}

async function fetchRemoteState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch(SHARED_STATE_ENDPOINT, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Remote state request failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      ok: boolean;
      state?: AppState;
    };

    return payload.state ? recomputeSettlements(normalizeState(payload.state)) : null;
  } catch {
    return null;
  }
}

async function saveRemoteState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch(SHARED_STATE_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(state)
    });
  } catch {
    // Local cache remains the fallback when the shared API is unavailable.
  }
}

function broadcastState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AppState>(STATE_SYNC_EVENT, {
      detail: state
    })
  );
}

function broadcastSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<Session | null>(SESSION_SYNC_EVENT, {
      detail: session
    })
  );
}

function broadcastTournament(tournament: TournamentCode) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TournamentCode>(TOURNAMENT_SYNC_EVENT, {
      detail: tournament
    })
  );
}

function readState() {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  const raw = window.localStorage.getItem(STATE_KEY);

  if (!raw) {
    const seeded = createEmptyState();
    window.localStorage.setItem(STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return recomputeSettlements(normalizeState(JSON.parse(raw) as AppState));
  } catch {
    const fallback = createEmptyState();
    window.localStorage.setItem(STATE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function readTournamentPreference() {
  if (typeof window === "undefined") {
    return "IPL" satisfies TournamentCode;
  }

  const raw = window.localStorage.getItem(TOURNAMENT_KEY);

  if (raw === "IPL" || raw === "FIFA" || raw === "WT20") {
    return raw;
  }

  return "IPL" satisfies TournamentCode;
}

export function useClubStore() {
  const [state, setState] = useState<AppState>(createEmptyState());
  const [session, setSessionState] = useState<Session | null>(null);
  const [currentTournament, setCurrentTournamentState] =
    useState<TournamentCode>("IPL");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextState = readState();
    const nextSession = readSession();
    const nextTournament = readTournamentPreference();

    setState(nextState);
    setSessionState(nextSession);
    setCurrentTournamentState(nextTournament);
    setReady(true);

    void fetchRemoteState().then((remoteState) => {
      if (!remoteState || typeof window === "undefined") {
        return;
      }

      setState(remoteState);
      window.localStorage.setItem(STATE_KEY, JSON.stringify(remoteState));
      broadcastState(remoteState);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStateSync = (event: Event) => {
      const nextState = (event as CustomEvent<AppState>).detail;

      if (!nextState) {
        return;
      }

      setState(recomputeSettlements(normalizeState(nextState)));
    };

    const handleSessionSync = (event: Event) => {
      setSessionState((event as CustomEvent<Session | null>).detail ?? null);
    };

    const handleTournamentSync = (event: Event) => {
      const nextTournament = (event as CustomEvent<TournamentCode>).detail;

      if (nextTournament === "IPL" || nextTournament === "FIFA" || nextTournament === "WT20") {
        setCurrentTournamentState(nextTournament);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STATE_KEY && event.newValue) {
        try {
          setState(
            recomputeSettlements(normalizeState(JSON.parse(event.newValue) as AppState))
          );
        } catch {
          // Ignore malformed cached state and keep the current in-memory copy.
        }
      }

      if (event.key === SESSION_KEY) {
        if (!event.newValue) {
          setSessionState(null);
          return;
        }

        try {
          setSessionState(JSON.parse(event.newValue) as Session);
        } catch {
          setSessionState(null);
        }
      }

      if (event.key === TOURNAMENT_KEY) {
        const nextTournament = event.newValue;

        if (nextTournament === "IPL" || nextTournament === "FIFA" || nextTournament === "WT20") {
          setCurrentTournamentState(nextTournament);
        }
      }
    };

    window.addEventListener(STATE_SYNC_EVENT, handleStateSync as EventListener);
    window.addEventListener(SESSION_SYNC_EVENT, handleSessionSync as EventListener);
    window.addEventListener(TOURNAMENT_SYNC_EVENT, handleTournamentSync as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(STATE_SYNC_EVENT, handleStateSync as EventListener);
      window.removeEventListener(SESSION_SYNC_EVENT, handleSessionSync as EventListener);
      window.removeEventListener(
        TOURNAMENT_SYNC_EVENT,
        handleTournamentSync as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    const refreshFromRemote = async () => {
      const remoteState = await fetchRemoteState();

      if (!remoteState) {
        return;
      }

      setState(remoteState);
      window.localStorage.setItem(STATE_KEY, JSON.stringify(remoteState));
      broadcastState(remoteState);
    };

    const intervalId = window.setInterval(() => {
      void refreshFromRemote();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshFromRemote();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ready]);

  const updateState = (updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = recomputeSettlements(normalizeState(updater(current)));

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STATE_KEY, JSON.stringify(next));
        void saveRemoteState(next);
        broadcastState(next);
      }

      return next;
    });
  };

  const setSession = (nextSession: Session | null) => {
    setSessionState(nextSession);

    if (typeof window === "undefined") {
      return;
    }

    if (!nextSession) {
      window.localStorage.removeItem(SESSION_KEY);
      broadcastSession(null);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    broadcastSession(nextSession);
  };

  const setCurrentTournament = (nextTournament: TournamentCode) => {
    setCurrentTournamentState(nextTournament);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TOURNAMENT_KEY, nextTournament);
    broadcastTournament(nextTournament);
  };

  return {
    state,
    session,
    currentTournament,
    ready,
    updateState,
    setSession,
    setCurrentTournament
  };
}
