"use client";

import { useEffect, useState } from "react";
import { getIstDayKey, upsertMatches } from "./club-logic";
import { useClubStore } from "./club-state";
import { MatchRecord, TournamentCode } from "./club-types";

export function useDailyMatches(tournamentCode: TournamentCode) {
  const { ready, state, updateState } = useClubStore();
  const [todayMatches, setTodayMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }

    let isCancelled = false;
    const todayKey = getIstDayKey();

    setTodayMatches(
      state.matches.filter(
        (match) =>
          match.dayKey === todayKey && match.tournamentCode === tournamentCode
      )
    );

    async function syncMatches() {
      try {
        setLoading(true);
        const response = await fetch(`/api/matches/today?tournament=${tournamentCode}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          error?: string;
          matches?: MatchRecord[];
        };

        if (!response.ok || !payload.matches) {
          throw new Error(payload.error ?? `Could not load today's ${tournamentCode} schedule.`);
        }

        if (isCancelled) {
          return;
        }

        setTodayMatches(payload.matches);
        updateState((current) => ({
          ...current,
          matches: upsertMatches(current.matches, payload.matches ?? [])
        }));
        setError("");
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : `Could not load today's ${tournamentCode} schedule.`
        );

        setTodayMatches(
          state.matches.filter(
            (match) =>
              match.dayKey === todayKey && match.tournamentCode === tournamentCode
          )
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void syncMatches();

    return () => {
      isCancelled = true;
    };
  }, [ready, tournamentCode]);

  return {
    todayMatches,
    loading,
    error
  };
}
