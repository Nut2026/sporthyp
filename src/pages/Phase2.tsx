import { AnimatePresence, motion } from "framer-motion";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

interface Seat {
  id: number;
  status: "available" | "taken";
  price: number;
}

interface InfoModal {
  open: boolean;
  title: string;
  message: string;
  action?: () => void;
}

const closedInfoModal: InfoModal = { open: false, title: "", message: "" };

const TOTAL_SEATS = 100;
const CAPTCHA_SECONDS = 10;
const QUEUE_DURATION_MS = 3000;
const SERVER_ERROR_CHANCE = 0.5;
const SEAT_FILL_INTERVAL_MS = 500;

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCaptcha = () => {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }
  return code;
};

const seatPrice = () => Math.floor(Math.random() * (500 - 60 + 1) + 60);

const seatLabel = (seatId: number) => ({
  sector: `Sector ${Math.floor(seatId / 10) + 1}`,
  row: `Row ${(seatId % 10) + 1}`,
});

/**
 * Phase 2 – the ticket war: seats disappear in real time, every click runs a
 * bot check, the queue may throw a server error, and only half of the
 * accepted purchases actually go through.
 */
const Phase2 = () => {
  const deductBalance = useAppStore((state) => state.deductBalance);
  const secureTicket = useAppStore((state) => state.secureTicket);
  const setPhase = useAppStore((state) => state.setPhase);
  const openWithdrawModal = useAppStore((state) => state.openWithdrawModal);

  // Seat map
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // Overlays
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [infoModal, setInfoModal] = useState<InfoModal>(closedInfoModal);

  // Bot check
  const [captchaTime, setCaptchaTime] = useState(CAPTCHA_SECONDS);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const captchaInputRef = useRef<HTMLInputElement>(null);

  const mapFillTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Seat map: initialise, then let other buyers take 1–3 seats every 500ms.
  useEffect(() => {
    setSeats(
      Array.from({ length: TOTAL_SEATS }, (_, id) => ({
        id,
        status: "available" as const,
        price: seatPrice(),
      })),
    );

    mapFillTimer.current = setInterval(() => {
      setSeats((prev) => {
        const available = prev.filter((seat) => seat.status === "available");
        if (available.length === 0) {
          if (mapFillTimer.current) clearInterval(mapFillTimer.current);
          setInfoModal({
            open: true,
            title: "SOLD OUT",
            message: "Tickets for this venue are sold out. Better luck next time!",
            action: () => setPhase("phase1"),
          });
          return prev;
        }

        const next = [...prev];
        const toTake = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < toTake; i++) {
          const freeSeats = next.filter((seat) => seat.status === "available");
          if (freeSeats.length === 0) break;
          const pick = freeSeats[Math.floor(Math.random() * freeSeats.length)];
          next[pick.id].status = "taken";
        }
        return next;
      });
    }, SEAT_FILL_INTERVAL_MS);

    return () => {
      if (mapFillTimer.current) clearInterval(mapFillTimer.current);
    };
  }, [setPhase]);

  // Bot check countdown: expire it and the seat is released.
  useEffect(() => {
    if (!showCaptcha) return;

    setCaptchaTime(CAPTCHA_SECONDS);
    const timer = setInterval(() => {
      setCaptchaTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCaptcha(false);
          setInfoModal({
            open: true,
            title: "TOO SLOW",
            message: "The bot check expired before you could respond. Pick another seat.",
            action: () => setSelectedSeat(null),
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCaptcha]);

  // Focus the field as soon as the bot check appears.
  useEffect(() => {
    if (showCaptcha) captchaInputRef.current?.focus();
  }, [showCaptcha]);

  const handleSeatClick = (id: number) => {
    if (seats[id].status === "taken") return;

    setSelectedSeat(id);
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setShowCaptcha(true);
  };

  const processPurchase = () => {
    if (selectedSeat === null) return;
    const seat = seats[selectedSeat];

    // Overloaded server: the request fails, so the player is never charged.
    if (Math.random() < SERVER_ERROR_CHANCE) {
      setShowError(true);
      return;
    }

    if (!deductBalance(seat.price)) {
      openWithdrawModal();
      return;
    }

    const { sector, row } = seatLabel(selectedSeat);
    setShowSuccess(true);
    secureTicket(sector, row);

    setTimeout(() => {
      setPhase("phase3");
    }, 3000);
  };

  const handleCaptchaSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (captchaInput.toUpperCase() !== captchaCode) return;

    setShowCaptcha(false);
    setShowQueue(true);

    setTimeout(() => {
      setShowQueue(false);
      processPurchase();
    }, QUEUE_DURATION_MS);
  };

  const handleCaptchaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCaptchaInput(event.target.value);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-24 bg-black relative">
      <h1 className="font-heading text-4xl md:text-6xl uppercase text-white mb-8 border-b-4 border-white pb-4">
        Ticket Portal
      </h1>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-10 gap-2 md:gap-4 max-w-4xl mx-auto p-4 border-4 border-white brutal-shadow">
          {seats.map((seat) => (
            <button
              type="button"
              key={seat.id}
              onClick={() => handleSeatClick(seat.id)}
              disabled={seat.status === "taken"}
              className={`aspect-square border-2 border-black flex items-center justify-center text-xs font-bold transition-all ${
                seat.status === "taken"
                  ? "bg-accent opacity-50 cursor-not-allowed"
                  : selectedSeat === seat.id
                    ? "bg-secondary animate-pulse"
                    : "bg-white hover:bg-secondary cursor-pointer"
              }`}
            >
              {seat.status === "available" ? `$${seat.price}` : "X"}
            </button>
          ))}
        </div>
      </div>

      {/* Bot check */}
      <AnimatePresence>
        {showCaptcha && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border-4 border-white p-8 max-w-md w-full brutal-shadow"
            >
              <h2 className="font-heading text-3xl uppercase mb-4 text-accent animate-pulse">
                Verify Human
              </h2>
              <div className="flex justify-between items-center mb-6">
                <span className="font-heading text-4xl tracking-[0.5em] bg-white text-black p-4 inline-block transform -skew-x-12">
                  {captchaCode}
                </span>
                <span className="font-heading text-4xl text-accent">{captchaTime}s</span>
              </div>

              <form onSubmit={handleCaptchaSubmit}>
                <input
                  ref={captchaInputRef}
                  type="text"
                  value={captchaInput}
                  onChange={handleCaptchaChange}
                  className="w-full bg-black border-2 border-white p-4 text-xl outline-none focus:bg-white focus:text-black transition-colors uppercase mb-4"
                  placeholder="ENTER CODE"
                />
                <button
                  type="submit"
                  className="w-full bg-white text-black font-heading text-2xl uppercase py-4 border-2 border-white hover:bg-black hover:text-white brutal-active"
                >
                  Submit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue */}
      {showQueue && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border-4 border-secondary p-8 max-w-md w-full brutal-shadow-yellow text-center">
            <h2 className="font-heading text-4xl uppercase mb-4 text-secondary animate-pulse">
              Loading Queue
            </h2>
            <p className="text-xl font-bold uppercase tracking-widest">Do not refresh</p>
          </div>
        </div>
      )}

      {/* Server error */}
      <AnimatePresence>
        {showError && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border-4 border-accent p-8 max-w-md w-full brutal-shadow-red text-center"
            >
              <h2 className="font-heading text-4xl uppercase mb-4 text-accent">
                Server Overloaded
              </h2>
              <p className="text-xl mb-8">Our servers are experiencing intense traffic.</p>
              <button
                type="button"
                onClick={() => setShowError(false)}
                className="w-full bg-accent text-white font-heading text-2xl uppercase py-4 border-2 border-white hover:bg-white hover:text-accent brutal-active"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success */}
      {showSuccess && selectedSeat !== null && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <h2 className="font-heading text-6xl md:text-8xl uppercase mb-4 text-primary animate-pulse">
              Ticket Secured
            </h2>
            <p className="text-2xl font-bold uppercase tracking-widest bg-white text-black p-4 inline-block brutal-shadow">
              {seatLabel(selectedSeat).sector}, {seatLabel(selectedSeat).row}
            </p>
          </motion.div>
        </div>
      )}

      {/* Sold out / bot check expired */}
      <AnimatePresence>
        {infoModal.open && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border-4 border-white p-8 max-w-md w-full brutal-shadow text-center"
            >
              <h2 className="font-heading text-4xl uppercase mb-4 text-accent">
                {infoModal.title}
              </h2>
              <p className="text-xl mb-8">{infoModal.message}</p>
              <button
                type="button"
                onClick={() => {
                  infoModal.action?.();
                  setInfoModal(closedInfoModal);
                }}
                className="w-full bg-white text-black font-heading text-2xl uppercase py-4 border-2 border-white hover:bg-black hover:text-white brutal-active"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Phase2;
