"use client";

import { useEffect, useState } from "react";
import { upsertMatches } from "./club-logic";
import { useClubStore } from "./club-state";
import { MatchRecord, TournamentCode } from "./club-types";

const MATCH_LOOKAHEAD_MS = 6 * 60 * 60 * 1000;
const MATCH_COMPLETED_GRACE_MS = 2 * 60 * 60 * 1000;

function filterTournamentSlate(
  matches: MatchRecord[],
  tournamentCode: TournamentCode,
  now = new Date()
) {
  const nowMs = now.getTime();
  const lookAheadCutoff = nowMs + MATCH_LOOKAHEAD_MS;

  return matches
    .filter((match) => {
      const openAt = new Date(match.pollOpenAt).getTime();
      const lockAt = new Date(match.pollLockAt).getTime();

      return (
        match.tournamentCode === tournamentCode &&
        openAt <= lookAheadCutoff &&
        lockAt >= nowMs - MATCH_COMPLETED_GRACE_MS
      );
    })
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
    );
}

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
    setTodayMatches(filterTournamentSlate(state.matches, tournamentCode));

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
            : `Could not load the current ${tournamentCode} slate.`
        );

        setTodayMatches(filterTournamentSlate(state.matches, tournamentCode));
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
