import { useRef, useState } from "react";
import ScreenWrapper from "./ScreenWrapper";
import FloatingText from "./FloatingText";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import { PRODUCTION, plotState } from "../config/production";
import { ITEMS } from "../config/items";

const setterName = (key) => `set${key[0].toUpperCase()}${key.slice(1)}`;

// The bar's animation is set up once per cycle. Re-rendering every second must not
// touch it, otherwise the browser would restart / jump the animation.
function PlotProgress({ endTime, duration }) {
  const [style] = useState(() => {
    const left = Math.max(0, endTime - Date.now());
    return { animationDuration: `${duration}ms`, animationDelay: `-${Math.max(0, duration - left)}ms` };
  });

  return (
    <span className="plot-progress" aria-hidden="true">
      <span className="plot-progress-fill" style={style} />
    </span>
  );
}

/*
  One screen for Farm, Forest, Mine and Shed. What differs (items, timings, texts)
  lives in config/production.js.
*/
export default function ProductionScreen({ id, onNavigate }) {
  const config = PRODUCTION[id];
  const game = useGame();
  const { inventory, setInventory } = game;
  const plots = game[config.plotsKey];
  const setPlots = game[setterName(config.plotsKey)];

  const [floats, setFloats] = useState([]);
  const [popIndex, setPopIndex] = useState(null);
  const floatId = useRef(0);

  useGameTick(); // re-render every second so timers count down

  const grow = config.mode === "grow";
  const supply = ITEMS[config.supply];
  const output = ITEMS[config.output];
  const supplyCount = inventory[config.supply];

  const now = Date.now();
  const states = plots.map((plot) => plotState(config, plot, now));

  const needsSupply = (state) => (grow ? state === "empty" : state === "ready");
  const startIndexes = states
    .map((s, i) => (needsSupply(s) ? i : -1))
    .filter((i) => i >= 0)
    .slice(0, Math.max(0, supplyCount));
  const collectIndexes = grow ? states.map((s, i) => (s === "ready" ? i : -1)).filter((i) => i >= 0) : [];
  const wantsSupply = states.some(needsSupply);

  const float = (text, anchor) => {
    const id = ++floatId.current;
    setFloats((prev) => [...prev, { id, text, x: anchor.x, y: anchor.y }]);
  };

  const anchorOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  };

  // kind "start": use one supply per plot | "collect": take finished output (grow mode)
  const run = (indexes, kind, anchor) => {
    const t = Date.now();
    const next = [...plots];
    let used = 0;
    let gained = 0;

    for (const i of indexes) {
      const state = plotState(config, next[i], t);

      if (kind === "collect") {
        if (grow && state === "ready") {
          next[i] = null;
          gained++;
        }
      } else if (used < inventory[config.supply] && needsSupply(state)) {
        next[i] = grow ? { endTime: t + config.duration } : { ready: false, endTime: t + config.duration };
        used++;
        if (!grow) gained++; // tools give their output straight away
      }
    }

    if (!used && !gained) return;

    setPlots(next);
    setInventory((prev) => ({
      ...prev,
      [config.supply]: prev[config.supply] - used,
      [config.output]: prev[config.output] + gained,
    }));
    if (gained) float(`+${gained} ${output.label}`, anchor);
  };

  const onTile = (i, e) => {
    const state = states[i];
    const kind = grow && state === "ready" ? "collect" : "start";
    run([i], kind, anchorOf(e.currentTarget));
    setPopIndex(i);
    setTimeout(() => setPopIndex(null), 300);
  };

  return (
    <ScreenWrapper title={`${config.icon} ${config.title}`} subtitle={config.subtitle}>
      <div className="production" style={{ "--accent": config.accent }}>
        <div className="res-row">
          <span className={`res-chip ${supplyCount <= 0 ? "low" : ""}`}>
            <span className="res-icon">{supply.icon}</span>
            {supply.label}: {supplyCount}
          </span>
          <span className="res-chip">
            <span className="res-icon">{output.icon}</span>
            {output.label}: {inventory[config.output]}
          </span>
        </div>

        {supplyCount <= 0 && wantsSupply && (
          <div className="notice with-action" role="status">
            <span>You're out of {supply.label.toLowerCase()}.</span>
            {onNavigate && (
              <button className="btn btn-gold btn-sm" onClick={() => onNavigate("shop")}>
                Open shop
              </button>
            )}
          </div>
        )}

        <div className="bulk-actions">
          <button
            className="btn btn-primary"
            disabled={startIndexes.length === 0}
            onClick={(e) => run(startIndexes, "start", anchorOf(e.currentTarget))}
          >
            {config.verbs.startAll} ({startIndexes.length})
          </button>
          {grow && (
            <button
              className="btn btn-secondary"
              disabled={collectIndexes.length === 0}
              onClick={(e) => run(collectIndexes, "collect", anchorOf(e.currentTarget))}
            >
              {config.verbs.collectAll} ({collectIndexes.length})
            </button>
          )}
        </div>

        <div className="plot-grid">
          {plots.map((plot, i) => {
            const state = states[i];
            const meta = config.tiles[state];
            const timeLeft = plot?.endTime ? plot.endTime - now : 0;
            const blocked = needsSupply(state) && supplyCount <= 0;

            let label = meta.label;
            let hint = meta.action;
            if (state === "busy") hint = formatTime(timeLeft);
            if (blocked) {
              label = `No ${supply.label.toLowerCase()}`;
              hint = "Buy in the Shop";
            }

            return (
              <button
                key={i}
                className={`plot plot-${state} ${blocked ? "is-blocked" : ""} ${popIndex === i ? "pop" : ""}`}
                disabled={state === "busy" || blocked}
                onClick={(e) => onTile(i, e)}
                aria-label={`${config.title} plot ${i + 1}: ${label}. ${hint}`}
              >
                <span className="plot-icon">{meta.icon}</span>
                <span className="plot-label">{label}</span>
                <span className="plot-hint">{hint}</span>
                {state === "busy" && <PlotProgress key={plot.endTime} endTime={plot.endTime} duration={config.duration} />}
              </button>
            );
          })}
        </div>
      </div>

      {floats.map((f) => (
        <FloatingText
          key={f.id}
          {...f}
          onDone={() => setFloats((prev) => prev.filter((x) => x.id !== f.id))}
        />
      ))}
    </ScreenWrapper>
  );
}
