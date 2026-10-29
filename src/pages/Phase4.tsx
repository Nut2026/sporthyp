import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { generateMatchEvents, type MatchEvent } from "@/lib/contentGenerators";
import { useAppStore } from "@/store/useAppStore";

const EVENT_MIN_DELAY_MS = 3000;
const EVENT_MAX_DELAY_MS = 8000;
const VAR_FREEZE_MS = 3000;
const GOAL_SHAKE_MS = 500;
const VICTORY_SHAKE_MS = 3000;
const MATCH_OVER_DELAY_MS = 5000;
const FEED_WINDOW = 5;

const CONFETTI_COLORS = ["#ff0000", "#ffff00", "#ffffff", "#00ff00", "#00ffff"];

/**
 * Phase 4 – the match: a generated commentary feed with a live scoreboard,
 * VAR freezes, goal flashes and a full-time confetti burst.
 */
const Phase4 = () => {
  const homeCountry = useAppStore((state) => state.homeCountry);
  const opponentCountry = useAppStore((state) => state.opponentCountry);
  const setPhase = useAppStore((state) => state.setPhase);

  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isVarFreeze, setIsVarFreeze] = useState(false);
  const [isMatchOver, setIsMatchOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    let cancelled = false;

    generateMatchEvents(homeCountry, opponentCountry).then((matchEvents) => {
      if (cancelled) return;
      setEvents(matchEvents);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [homeCountry, opponentCountry]);

  // Full-time celebration.
  useEffect(() => {
    if (!isMatchOver) return;

    const end = Date.now() + 2000;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: CONFETTI_COLORS,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [isMatchOver]);

  // Advance through the generated events with a natural rhythm.
  useEffect(() => {
    // While a VAR check is frozen on screen, its own timeout advances the
    // timeline — scheduling another timer here would fire twice and skip events.
    if (events.length === 0 || isMatchOver || isVarFreeze) return;

    const playNextEvent = () => {
      if (currentEventIndex >= events.length) {
        setIsMatchOver(true);
        setShake(true);
        setTimeout(() => setShake(false), VICTORY_SHAKE_MS);
        setTimeout(() => setPhase("phase5"), MATCH_OVER_DELAY_MS);
        return;
      }

      const event = events[currentEventIndex];

      if (event.type === "var") {
        setIsVarFreeze(true);
        setTimeout(() => {
          setIsVarFreeze(false);
          setCurrentEventIndex((prev) => prev + 1);
        }, VAR_FREEZE_MS);
        return;
      }

      if (event.type === "goal") {
        setShake(true);
        setTimeout(() => setShake(false), GOAL_SHAKE_MS);
      }
      setCurrentEventIndex((prev) => prev + 1);
    };

    const delay = Math.random() * (EVENT_MAX_DELAY_MS - EVENT_MIN_DELAY_MS) + EVENT_MIN_DELAY_MS;
    const timer = setTimeout(playNextEvent, delay);

    return () => clearTimeout(timer);
  }, [currentEventIndex, events, isVarFreeze, isMatchOver, setPhase]);

  if (isLoading || events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <h2 className="font-heading text-4xl md:text-6xl uppercase text-primary animate-pulse mb-4">
            Loading Match
          </h2>
          <p className="text-lg uppercase tracking-widest text-muted-foreground">
            Teams are warming up...
          </p>
        </motion.div>
      </div>
    );
  }

  const currentEvent = events[Math.min(currentEventIndex, events.length - 1)];
  const feedStart = Math.max(0, currentEventIndex - FEED_WINDOW);
  const visibleEvents = events
    .slice(feedStart, currentEventIndex + 1)
    // Tag each entry with its position on the timeline so React can key it stably.
    .map((event, index) => ({ ...event, timelineIndex: feedStart + index }))
    .reverse();

  return (
    <div
      className={`flex-1 flex flex-col bg-black relative overflow-hidden transition-transform duration-75 ${
        shake ? "translate-x-2 translate-y-2" : ""
      }`}
    >
      {/* VAR freeze */}
      {isVarFreeze && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <h1 className="font-heading text-8xl md:text-[12rem] text-white uppercase tracking-tighter animate-pulse">
            VAR CHECK
          </h1>
        </div>
      )}

      {/* Full time */}
      {isMatchOver && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <h2 className="font-heading text-6xl md:text-8xl uppercase text-primary mb-4">
              Full Time
            </h2>
            <p className="text-2xl font-bold uppercase tracking-widest">
              {homeCountry || "HOME"} {currentEvent.homeGoals} - {currentEvent.oppGoals}{" "}
              {opponentCountry || "OPP"}
            </p>
          </motion.div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="h-32 border-b-4 border-white flex items-stretch">
        <div className="flex-1 flex items-center justify-center border-r-4 border-white">
          <span className="font-heading text-5xl uppercase truncate px-4">
            {homeCountry || "HOME"}
          </span>
        </div>
        <div className="w-48 bg-white text-black flex items-center justify-center flex-col">
          <span className="font-heading text-6xl">
            {currentEvent.homeGoals} - {currentEvent.oppGoals}
          </span>
          <span className="font-bold text-sm uppercase">{currentEvent.timestamp}</span>
        </div>
        <div className="flex-1 flex items-center justify-center border-l-4 border-white">
          <span className="font-heading text-5xl uppercase truncate px-4">
            {opponentCountry || "OPP"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Commentary */}
        <div className="flex-1 border-b-4 md:border-b-0 md:border-r-4 border-white p-4 overflow-hidden flex flex-col">
          <h2 className="font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Live Feed
          </h2>
          <div className="flex-1 overflow-y-auto space-y-6">
            <AnimatePresence>
              {visibleEvents.map((event, index) => (
                <motion.div
                  key={event.timelineIndex}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-l-4 pl-4 ${
                    index === 0 ? "border-white opacity-100" : "border-muted opacity-50"
                  }`}
                >
                  <span className="font-heading text-2xl mr-4">{event.timestamp}</span>
                  <span
                    className={`text-xl md:text-2xl ${
                      event.type === "goal" ? "text-accent font-bold uppercase" : "text-white"
                    }`}
                  >
                    {event.commentary}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats and cheerboard */}
        <div className="w-full md:w-96 flex flex-col">
          <div className="p-6 border-b-4 border-white flex-1">
            <h2 className="font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Match Stats
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold uppercase mb-1">
                  <span>{currentEvent.homePossession}%</span>
                  <span>Possession</span>
                  <span>{100 - currentEvent.homePossession}%</span>
                </div>
                <div className="h-4 flex border-2 border-white">
                  <div className="bg-white" style={{ width: `${currentEvent.homePossession}%` }} />
                  <div className="bg-muted flex-1" />
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b-2 border-muted">
                <span className="font-heading text-3xl">{currentEvent.homeShots}</span>
                <span className="font-bold uppercase text-sm">Shots</span>
                <span className="font-heading text-3xl">{currentEvent.oppShots}</span>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2 h-64">
            {["ROAR", "CHANT", "BOO", "GASP"].map((action) => (
              <button
                type="button"
                key={action}
                className="bg-black border-4 border-white text-white font-heading text-2xl md:text-3xl uppercase brutal-shadow-sm hover:bg-white hover:text-black brutal-active"
              >
                {action}
              </button>
            ))}
            <button
              type="button"
              className="col-span-2 bg-black border-4 border-white text-white font-heading text-3xl uppercase brutal-shadow-sm hover:bg-white hover:text-black brutal-active"
            >
              GROAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase4;
