import { describe, expect, it } from "vitest";
import { createNewSession, performPlayerAction } from "@/lib/game/engine";

const startSession = () => createNewSession("Test Farm");

describe("game engine", () => {
  it("allows attacking to damage enemies", () => {
    const session = startSession();
    const enemyStart = session.enemy?.health ?? 0;
    const next = performPlayerAction(session, { type: "attack" });
    const enemyEnd = next.enemy?.health ?? 0;
    expect(enemyEnd).toBeLessThan(enemyStart);
  });

  it("healing never exceeds max HP", () => {
    const session = startSession();
    session.player.health = Math.round(session.player.maxHealth * 0.5);
    const result = performPlayerAction(session, { type: "heal" });
    expect(result.player.health).toBeLessThanOrEqual(result.player.maxHealth);
  });
});
