"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useClubStore } from "../../lib/club-state";

export function NotificationCenter() {
  const { state, updateState } = useClubStore();
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => state.appNotifications.filter((item) => !item.read).length,
    [state.appNotifications]
  );

  const markAllRead = () => {
    updateState((current) => ({
      ...current,
      appNotifications: current.appNotifications.map((item) => ({
        ...item,
        read: true
      }))
    }));
  };

  return (
    <div className="notification-center">
      <button
        aria-label="Open notifications"
        className="notification-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>Alerts</span>
        <strong>{unreadCount}</strong>
      </button>
      {open ? (
        <div className="notification-panel">
          <div className="notification-panel-head">
            <strong>Notification Center</strong>
            <button className="mini-link" onClick={markAllRead} type="button">
              Mark all read
            </button>
          </div>
          <div className="notification-list">
            {state.appNotifications.length > 0 ? (
              state.appNotifications.slice(0, 12).map((item) => (
                <div
                  className={`notification-item ${item.read ? "is-read" : "is-unread"}`}
                  key={item.id}
                >
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <span>{new Date(item.createdAt).toLocaleString("en-IN")}</span>
                  {item.url ? (
                    <Link
                      className="secondary-link notification-link"
                      href={item.url}
                      onClick={() => setOpen(false)}
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="notification-item is-read">
                <strong>No alerts yet</strong>
                <p>Poll openings, results, and app activity will appear here.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
