"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { getTournament } from "../../lib/club-data";
import { formatLongDate } from "../../lib/club-logic";
import { useClubStore } from "../../lib/club-state";

export default function ClubhousePage() {
  const { ready, session, state, currentTournament, updateState } = useClubStore();
  const [chatDraft, setChatDraft] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const tournament = getTournament(currentTournament);
  const currentUser = state.users.find((user) => user.id === session?.userId);
  const isAdmin = currentUser?.role === "admin";

  const tournamentAnnouncements = useMemo(
    () =>
      state.announcements
        .filter((item) => item.tournamentCode === currentTournament)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        ),
    [currentTournament, state.announcements]
  );

  const tournamentChat = useMemo(
    () =>
      state.chatMessages
        .filter((item) => item.tournamentCode === currentTournament)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
        .slice(0, 40),
    [currentTournament, state.chatMessages]
  );

  const handleSendChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser || !chatDraft.trim()) {
      return;
    }

    const createdAt = new Date().toISOString();
    const body = chatDraft.trim();

    updateState((current) => ({
      ...current,
      chatMessages: [
        {
          id: `chat-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          role: currentUser.role,
          adminLevel: currentUser.adminLevel,
          tournamentCode: currentTournament,
          body,
          createdAt
        },
        ...current.chatMessages
      ].slice(0, 200),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "chat",
          actorName: currentUser.name,
          detail: `Posted a ${currentTournament} clubhouse message.`,
          createdAt
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    setChatDraft("");
  };

  const handlePostAnnouncement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser || !isAdmin || !announcementTitle.trim() || !announcementBody.trim()) {
      return;
    }

    const createdAt = new Date().toISOString();

    updateState((current) => ({
      ...current,
      announcements: [
        {
          id: `announcement-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          tournamentCode: currentTournament,
          title: announcementTitle.trim(),
          body: announcementBody.trim(),
          createdAt
        },
        ...current.announcements
      ].slice(0, 100),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "announcement",
          actorName: currentUser.name,
          detail: `Published a ${currentTournament} admin announcement.`,
          createdAt
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));

    setAnnouncementTitle("");
    setAnnouncementBody("");
  };

  const handleDeleteChat = (messageId: string) => {
    if (!currentUser || !isAdmin) {
      return;
    }

    const targetMessage = state.chatMessages.find((item) => item.id === messageId);

    if (!targetMessage) {
      return;
    }

    const createdAt = new Date().toISOString();

    updateState((current) => ({
      ...current,
      chatMessages: current.chatMessages.filter((item) => item.id !== messageId),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "chat-remove",
          actorName: currentUser.name,
          detail: `Removed a clubhouse message from ${targetMessage.userName}.`,
          createdAt
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    if (!currentUser || !isAdmin) {
      return;
    }

    const createdAt = new Date().toISOString();

    updateState((current) => ({
      ...current,
      announcements: current.announcements.filter((item) => item.id !== announcementId),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          type: "announcement-remove",
          actorName: currentUser.name,
          detail: `Removed an admin announcement from the ${currentTournament} clubhouse.`,
          createdAt
        },
        ...current.auditTrail
      ].slice(0, 20)
    }));
  };

  if (!ready) {
    return <main className="page-shell">Loading clubhouse...</main>;
  }

  if (!session || !currentUser) {
    return (
      <main className="page-shell">
        <section className="panel-card">
          <p className="eyebrow">Member access required</p>
          <h1>Enter with your profile before opening the clubhouse.</h1>
          <div className="hero-actions">
            <Link className="primary-link" href="/">
              Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="panel-card panel-hero clubhouse-hero">
        <div>
          <p className="eyebrow">Club room</p>
          <h1>{tournament?.shortName} chat and announcements stay together here.</h1>
          <p className="support-copy">
            Members can chat in the current tournament room. Admins can broadcast
            notices and moderate anything that needs cleanup.
          </p>
        </div>
        <div className="profile-chip-grid">
          <div className="profile-chip">
            <span>Room</span>
            <strong>{tournament?.shortName}</strong>
          </div>
          <div className="profile-chip">
            <span>Announcements</span>
            <strong>{tournamentAnnouncements.length}</strong>
          </div>
          <div className="profile-chip">
            <span>Chat messages</span>
            <strong>{tournamentChat.length}</strong>
          </div>
          <div className="profile-chip">
            <span>Your role</span>
            <strong>{isAdmin ? "Admin" : "User"}</strong>
          </div>
        </div>
      </section>

      <section className="clubhouse-grid">
        <article className="panel-card clubhouse-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin announcements</p>
              <h2>Broadcast the important stuff once.</h2>
            </div>
          </div>

          {isAdmin ? (
            <form className="clubhouse-form" onSubmit={handlePostAnnouncement}>
              <input
                className="text-input"
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder={`${tournament?.shortName} headline`}
                value={announcementTitle}
              />
              <textarea
                className="text-area"
                onChange={(event) => setAnnouncementBody(event.target.value)}
                placeholder="Share the official update, deadline note, or match-day announcement."
                rows={4}
                value={announcementBody}
              />
              <div className="hero-actions">
                <button className="primary-link button-link" type="submit">
                  Post announcement
                </button>
              </div>
            </form>
          ) : (
            <p className="support-copy">
              Only admins can post announcements, but every member can read them.
            </p>
          )}

          <div className="clubhouse-feed">
            {tournamentAnnouncements.length > 0 ? (
              tournamentAnnouncements.map((item) => (
                <article className="announcement-card" key={item.id}>
                  <div className="announcement-head">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.authorName} • {formatLongDate(item.createdAt)}</span>
                    </div>
                    {isAdmin ? (
                      <button
                        className="mini-link danger-link"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p>{item.body}</p>
                </article>
              ))
            ) : (
              <p className="support-copy">
                No admin announcement has been posted for the {tournament?.shortName} room yet.
              </p>
            )}
          </div>
        </article>

        <article className="panel-card clubhouse-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Member chat</p>
              <h2>Keep the banter inside the current tournament lane.</h2>
            </div>
          </div>

          <form className="clubhouse-form" onSubmit={handleSendChat}>
            <textarea
              className="text-area"
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder={`Talk to the ${tournament?.shortName} room.`}
              rows={3}
              value={chatDraft}
            />
            <div className="hero-actions">
              <button className="primary-link button-link" type="submit">
                Send message
              </button>
            </div>
          </form>

          <div className="clubhouse-feed">
            {tournamentChat.length > 0 ? (
              tournamentChat.map((message) => (
                <article className="chat-card" key={message.id}>
                  <div className="chat-head">
                    <div>
                      <strong>{message.userName}</strong>
                      <span>
                        {message.role === "admin"
                          ? message.adminLevel === "super"
                            ? "Super admin"
                            : "Admin"
                          : "Member"}
                        {" • "}
                        {formatLongDate(message.createdAt)}
                      </span>
                    </div>
                    {isAdmin ? (
                      <button
                        className="mini-link danger-link"
                        onClick={() => handleDeleteChat(message.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <p>{message.body}</p>
                </article>
              ))
            ) : (
              <p className="support-copy">
                No one has posted in the {tournament?.shortName} room yet.
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
