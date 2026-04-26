import type { CSSProperties } from "react";
import { ClubTeam } from "../../lib/club-types";

export function TeamBrandBadge({
  team,
  compact = false
}: {
  team: ClubTeam;
  compact?: boolean;
}) {
  return (
    <div
      className={`team-brand-badge ${compact ? "compact" : ""}`}
      style={
        {
          "--brand-primary": team.primary,
          "--brand-secondary": team.secondary,
          "--brand-accent": team.accent
        } as CSSProperties
      }
    >
      <div className="team-brand-core">
        {team.logoPath ? (
          <img
            alt={`${team.name} logo`}
            className="team-brand-image"
            src={team.logoPath}
          />
        ) : (
          <>
            <span className="team-brand-code">{team.shortName}</span>
            <span className="team-brand-symbol">{team.symbol}</span>
          </>
        )}
      </div>
      <div className="team-brand-meta">
        <strong>{team.name}</strong>
        <span>{team.nickname}</span>
      </div>
    </div>
  );
}
