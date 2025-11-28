"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { SKILL_LIBRARY } from "@/lib/game/data";
import { PlayerAction } from "@/lib/game/types";
import { useGameStore } from "@/lib/store/gameStore";

const buttonClasses =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-white/30";

export const CommandPanel = () => {
  const { session, act } = useGameStore((state) => ({ session: state.session, act: state.act }));
  const [nameInput, setNameInput] = useState("");
  const start = useGameStore((state) => state.start);

  const disabled =
    session.status !== "running" || !!session.pendingDecision || !session.enemy || session.player.health <= 0;

  const trigger = (action: PlayerAction) => {
    if (disabled) return;
    act(action);
  };

  useHotkeys(
    "a",
    () => trigger({ type: "attack" }),
    { enableOnFormTags: ["INPUT"] },
    [disabled],
  );
  useHotkeys(
    "h",
    () => trigger({ type: "heal" }),
    { enableOnFormTags: ["INPUT"] },
    [disabled],
  );
  useHotkeys(
    "s",
    () => trigger({ type: "skip" }),
    { enableOnFormTags: ["INPUT"] },
    [disabled],
  );

  const skillButtons = useMemo(
    () =>
      session.player.skills.map((skill, index) => ({
        skill,
        index,
        def: SKILL_LIBRARY[skill.id],
      })),
    [session.player.skills],
  );

  useHotkeys(
    "1,2,3,4,5,6,7,8,9",
    (_, event) => {
      if (!event) return;
      const index = Number(event.keys) - 1;
      const target = session.player.skills[index];
      if (!target || target.remainingCooldown > 0) return;
      trigger({ type: "skill", skillId: target.id });
    },
    { enableOnFormTags: ["INPUT"] },
    [disabled, session.player.skills],
  );

  if (session.status === "idle") {
    return (
      <section className="rounded-3xl border border-white/10 bg-black/70 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">New Campaign</p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            start(nameInput);
            setNameInput("");
          }}
        >
          <input
            value={nameInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setNameInput(event.target.value)}
            placeholder="Farm name"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-400/60 focus:outline-none"
          />
          <button type="submit" className={buttonClasses}>
            Begin Defense
          </button>
        </form>
        <p className="mt-3 text-sm text-white/60">Hotkeys unlock after the first battle starts.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/70 p-6 text-white">
      <div className="flex flex-wrap gap-2">
        <button className={buttonClasses} onClick={() => trigger({ type: "attack" })} disabled={disabled}>
          <span className="mr-2 rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">A</span>
          Attack
        </button>
        <button className={buttonClasses} onClick={() => trigger({ type: "heal" })} disabled={disabled}>
          <span className="mr-2 rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">H</span>
          Heal
        </button>
        <button className={buttonClasses} onClick={() => trigger({ type: "skip" })} disabled={disabled}>
          <span className="mr-2 rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">S</span>
          Skip
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Skills</p>
        {skillButtons.length === 0 && <p className="text-sm text-white/50">No skills unlocked yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {skillButtons.map(({ skill, def }) => (
            <button
              key={skill.id}
              disabled={disabled || skill.remainingCooldown > 0}
              className={buttonClasses}
              onClick={() => trigger({ type: "skill", skillId: skill.id })}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{def?.name ?? "Unknown Skill"}</p>
                  <p className="text-xs text-white/60">{def?.description}</p>
                </div>
                <span className="text-xs text-white/50">
                  {skill.remainingCooldown > 0 ? `CD ${skill.remainingCooldown}` : "Ready"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
