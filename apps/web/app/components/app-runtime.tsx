"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMatchPhase } from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";
import { useDailyMatches } from "../../lib/use-daily-matches";
import { AppNotification, AuditEvent } from "../../lib/club-types";

const SCHEDULED_NOTIFICATION_KEY = "ipl-club-notified-scheduled";

function readScheduledNotifications() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SCHEDULED_NOTIFICATION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeScheduledNotifications(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SCHEDULED_NOTIFICATION_KEY, JSON.stringify(ids));
}

function buildNotificationFromAudit(event: AuditEvent): Omit<AppNotification, "read"> | null {
  const common = {
    id: `audit-note-${event.id}`,
    createdAt: event.createdAt
  };

  switch (event.type) {
    case "join":
      return {
        ...common,
        kind: "profile",
        title: "New member joined",
        body: `${event.actorName} entered the IPL club.`,
        url: "/"
      };
    case "favorite-team":
      return {
        ...common,
        kind: "profile",
        title: "Favorite team locked",
        body: event.detail,
        url: "/setup"
      };
    case "vote":
      return {
        ...common,
        kind: "vote",
        title: "Vote updated",
        body: event.detail,
        url: "/polls/today"
      };
    case "result":
      return {
        ...common,
        kind: "result",
        title: "Match result published",
        body: event.detail,
        url: "/settlements"
      };
    case "admin-promote":
    case "admin-demote":
    case "admin-setup":
      return {
        ...common,
        kind: "admin",
        title: "Admin update",
        body: event.detail,
        url: "/admin"
      };
    case "rename":
      return {
        ...common,
        kind: "profile",
        title: "Profile updated",
        body: event.detail,
        url: "/setup"
      };
    default:
      return {
        ...common,
        kind: "system",
        title: "Club activity",
        body: event.detail,
        url: "/"
      };
  }
}

export function AppRuntime() {
  const { ready, state, updateState } = useClubStore();
  const { todayMatches } = useDailyMatches();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const scheduledTimeouts = useRef<number[]>([]);
  const processedAuditIds = useRef<Set<string>>(new Set());
  const scheduledKeys = useRef<Set<string>>(new Set());
  const initializedAuditRef = useRef(false);

  const unreadCount = useMemo(
    () => state.appNotifications.filter((item) => !item.read).length,
    [state.appNotifications]
  );

  const pushNotification = async (notification: AppNotification, browser = true) => {
    updateState((current) => {
      if (current.appNotifications.some((item) => item.id === notification.id)) {
        return current;
      }

      return {
        ...current,
        appNotifications: [notification, ...current.appNotifications].slice(0, 40)
      };
    });

    if (!browser || typeof window === "undefined" || permission !== "granted") {
      return;
    }

    const options = {
      body: notification.body,
      icon: "/app-icon.svg",
      badge: "/app-icon-maskable.svg",
      data: { url: notification.url ?? "/" }
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, options);
      return;
    }

    new Notification(notification.title, { body: notification.body });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    scheduledKeys.current = new Set(readScheduledNotifications());

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    return () => {
      scheduledTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      scheduledTimeouts.current = [];
    };
  }, []);

  useEffect(() => {
    if (!ready || initializedAuditRef.current) {
      return;
    }

    processedAuditIds.current = new Set(state.auditTrail.map((item) => item.id));
    initializedAuditRef.current = true;
  }, [ready, state.auditTrail]);

  useEffect(() => {
    if (!ready || !initializedAuditRef.current) {
      return;
    }

    const newEvents = state.auditTrail.filter(
      (event) => !processedAuditIds.current.has(event.id)
    );

    if (newEvents.length === 0) {
      return;
    }

    newEvents
      .slice()
      .reverse()
      .forEach((event) => {
        processedAuditIds.current.add(event.id);
        const notification = buildNotificationFromAudit(event);

        if (!notification) {
          return;
        }

        void pushNotification({
          ...notification,
          read: false
        });
      });
  }, [ready, state.auditTrail]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    scheduledTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    scheduledTimeouts.current = [];

    const now = Date.now();

    const scheduleEvent = (
      uniqueKey: string,
      when: number,
      title: string,
      body: string,
      kind: AppNotification["kind"],
      url: string
    ) => {
      if (scheduledKeys.current.has(uniqueKey)) {
        return;
      }

      const fire = () => {
        scheduledKeys.current.add(uniqueKey);
        writeScheduledNotifications(Array.from(scheduledKeys.current));

        void pushNotification(
          {
            id: uniqueKey,
            title,
            body,
            kind,
            url,
            createdAt: new Date().toISOString(),
            read: false
          },
          true
        );
      };

      if (when <= now) {
        fire();
        return;
      }

      const timeoutId = window.setTimeout(fire, when - now);
      scheduledTimeouts.current.push(timeoutId);
    };

    todayMatches.forEach((match) => {
      const openAt = new Date(match.pollOpenAt).getTime();
      const lockAt = new Date(match.pollLockAt).getTime();
      const phase = getMatchPhase(match, new Date());

      scheduleEvent(
        `scheduled-${match.id}-open`,
        openAt,
        "Poll is now open",
        `${match.title} is live. Place or change your vote before the lock time.`,
        "poll-open",
        "/polls/today"
      );

      if (phase === "open" || openAt > now) {
        scheduleEvent(
          `scheduled-${match.id}-closing`,
          Math.max(openAt, lockAt - 15 * 60 * 1000),
          "Voting closes soon",
          `${match.title} closes in 15 minutes. Lock your side now.`,
          "poll-closing",
          "/polls/today"
        );
      }

      scheduleEvent(
        `scheduled-${match.id}-locked`,
        lockAt,
        "Voting locked",
        `${match.title} is now locked. Final team lists are ready.`,
        "poll-locked",
        "/polls/today"
      );
    });
  }, [ready, todayMatches, permission]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      void pushNotification(
        {
          id: `system-enabled-${Date.now()}`,
          title: "Notifications enabled",
          body: "You will now receive IPL club alerts on this device.",
          kind: "system",
          url: "/",
          createdAt: new Date().toISOString(),
          read: false
        },
        false
      );
    }
  };

  if (permission === "granted") {
    return null;
  }

  return (
    <div className="runtime-banner-shell">
      <div className="runtime-banner">
        <div>
          <strong>Turn on website alerts</strong>
          <p>
            Allow browser notifications for poll openings, vote deadlines,
            results, and club activity. Your unread alerts are still tracked
            inside the website header too.
          </p>
        </div>
        <div className="hero-actions runtime-actions">
          <button
            className="primary-link button-link"
            onClick={requestNotifications}
            type="button"
          >
            Allow browser alerts
          </button>
        </div>
      </div>
    </div>
  );
}
