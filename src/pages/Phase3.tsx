import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FoodItem, MerchItem } from "@/store/useAppStore";
import { useAppStore } from "@/store/useAppStore";

type SubPhase = "merch" | "commute" | "concourse" | "food";
type CommuteChoice = "drive" | "shuttle";

const MERCH_TYPES = ["Scarf", "Jersey", "Hat", "Pin", "Program", "Mug", "Flag", "Jacket"];
const FOOD_TYPES = ["Hot Dog", "Beer", "Nachos", "Pretzel", "Soda", "Burger", "Fries", "Water"];

const MERCH_COUNT = 50;
const FOOD_COUNT = 50;
/** Stable keys for the silhouettes queuing on the concourse. */
const QUEUE_DOTS = Array.from({ length: 30 }, (_, index) => `queue-dot-${index}`);
const VISIBLE_ITEMS = 20;
const MERCH_SECONDS = 60;
const FOOD_STOCK_INTERVAL_MS = 2000;
const COMMUTE_TICK_MS = 500;
const CONCOURSE_TICK_MS = 500;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

/** The shopfront is restocked once per run, themed around the player's match. */
const generateMerch = (home: string, match: string): MerchItem[] =>
  Array.from({ length: MERCH_COUNT }, (_, i) => ({
    id: `merch-${i}`,
    name: `${home} ${MERCH_TYPES[i % MERCH_TYPES.length]} - ${match}`,
    price: randomInt(20, 150),
    stock: randomInt(200, 999),
    depletionRate: randomInt(10, 59),
  }));

const generateFood = (): FoodItem[] =>
  Array.from({ length: FOOD_COUNT }, (_, i) => ({
    id: `food-${i}`,
    name: `Stadium ${FOOD_TYPES[i % FOOD_TYPES.length]}`,
    price: randomInt(5, 25),
    available: true,
  }));

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Phase 3 – the gateway: merch, the commute, the concourse queue and the
 * concessions, all under a second countdown that decides whether the player
 * makes it inside before time runs out.
 */
const Phase3 = () => {
  const homeCountry = useAppStore((state) => state.homeCountry);
  const matchName = useAppStore((state) => state.matchName);
  const deductBalance = useAppStore((state) => state.deductBalance);
  const addToCart = useAppStore((state) => state.addToCart);
  const buyFood = useAppStore((state) => state.buyFood);
  const merchCart = useAppStore((state) => state.merchCart);
  const foodPurchased = useAppStore((state) => state.foodPurchased);
  const setPhase = useAppStore((state) => state.setPhase);
  const openWithdrawModal = useAppStore((state) => state.openWithdrawModal);

  const [subPhase, setSubPhase] = useState<SubPhase>("merch");
  const [countdownMerch, setCountdownMerch] = useState(MERCH_SECONDS);
  const [countdownMain, setCountdownMain] = useState(randomInt(40, 60));

  // Merch
  const [merchItems, setMerchItems] = useState<MerchItem[]>(() =>
    generateMerch(homeCountry, matchName),
  );

  // Commute
  const [commuteProgress, setCommuteProgress] = useState(0);
  const [commuteChoice, setCommuteChoice] = useState<CommuteChoice | null>(null);

  // Concourse
  const [concourseProgress, setConcourseProgress] = useState(0);
  const [ticketVerified, setTicketVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

  // Concessions
  const [foodItems, setFoodItems] = useState<FoodItem[]>(generateFood);

  // Global countdown: merch timer first, then the race to the stands.
  useEffect(() => {
    const timer = setInterval(() => {
      if (subPhase === "merch") {
        setCountdownMerch((prev) => {
          if (prev <= 1) {
            setSubPhase("commute");
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      setCountdownMain((prev) => {
        if (prev <= 1) {
          if (!ticketVerified) {
            // Too late to get in: the run is over.
            setVerificationFailed(true);
            setTimeout(() => setPhase("phase1"), 3000);
          } else {
            setPhase("phase4");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [subPhase, ticketVerified, setPhase]);

  // Merch stock drains every second while the shop is open.
  useEffect(() => {
    if (subPhase !== "merch") return;

    const timer = setInterval(() => {
      setMerchItems((prev) =>
        prev.map((item) => ({
          ...item,
          stock: Math.max(0, item.stock - item.depletionRate),
        })),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [subPhase]);

  // Journey: the dedicated lane is quicker than sitting in traffic.
  useEffect(() => {
    if (subPhase !== "commute" || !commuteChoice) return;

    const speed = commuteChoice === "shuttle" ? 5 : 2;
    const timer = setInterval(() => {
      setCommuteProgress((prev) => {
        if (prev >= 100) {
          setSubPhase("concourse");
          return 100;
        }
        return prev + speed;
      });
    }, COMMUTE_TICK_MS);

    return () => clearInterval(timer);
  }, [subPhase, commuteChoice]);

  // Concourse queue moves steadily towards the scanner.
  useEffect(() => {
    if (subPhase !== "concourse") return;

    const timer = setInterval(() => {
      setConcourseProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 5;
      });
    }, CONCOURSE_TICK_MS);

    return () => clearInterval(timer);
  }, [subPhase]);

  // Concessions sell out one item at a time.
  useEffect(() => {
    if (subPhase !== "food") return;

    const timer = setInterval(() => {
      setFoodItems((prev) => {
        const available = prev.filter((item) => item.available);
        if (available.length === 0) return prev;

        const soldOut = available[Math.floor(Math.random() * available.length)];
        return prev.map((item) => (item.id === soldOut.id ? { ...item, available: false } : item));
      });
    }, FOOD_STOCK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [subPhase]);

  const handleBuyMerch = (item: MerchItem) => {
    if (item.stock <= 0) return;
    if (!deductBalance(item.price)) {
      openWithdrawModal();
      return;
    }
    addToCart(item);
  };

  const handleCommuteSelect = (choice: CommuteChoice) => {
    const cost = choice === "shuttle" ? 150 : 50;
    if (!deductBalance(cost)) {
      openWithdrawModal();
      return;
    }
    setCommuteChoice(choice);
  };

  const handleVerifyTicket = () => {
    setTicketVerified(true);
    setTimeout(() => {
      setSubPhase("food");
    }, 1500);
  };

  const handleBuyFood = (item: FoodItem) => {
    if (!item.available) return;
    // Concessions never open the ATM: no funds, no food.
    if (!deductBalance(item.price)) return;
    buyFood(item);
  };

  if (verificationFailed) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <h1 className="text-6xl md:text-9xl text-accent font-heading uppercase text-center animate-pulse">
          Banned From Entry
        </h1>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-24 bg-black relative">
      {/* Global phase timer */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div
          className={`font-heading text-4xl md:text-6xl brutal-shadow px-6 py-2 bg-black border-4 ${
            countdownMain <= 20 && subPhase !== "merch"
              ? "text-accent border-accent animate-pulse"
              : "text-white border-white"
          }`}
        >
          {subPhase === "merch" ? formatTime(countdownMerch) : formatTime(countdownMain)}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Merch */}
        {subPhase === "merch" && (
          <motion.div
            key="merch"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-end mb-8 border-b-4 border-white pb-4">
              <h2 className="font-heading text-4xl md:text-6xl uppercase">Official Merchandise</h2>
              <div className="border-2 border-secondary px-4 py-2 bg-black brutal-shadow-yellow">
                <span className="font-bold uppercase tracking-wider text-sm text-secondary">
                  Equipped
                </span>
                <span className="font-heading text-2xl ml-2">{merchCart.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pb-32">
              {merchItems.slice(0, VISIBLE_ITEMS).map((item) => (
                <div
                  key={item.id}
                  className={`border-4 p-4 flex flex-col justify-between ${
                    item.stock <= 0
                      ? "border-muted opacity-50"
                      : "border-white bg-black brutal-shadow"
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-2">{item.name}</h3>
                    <p className="text-2xl font-heading">${item.price}</p>
                  </div>
                  <div className="mt-4">
                    <p
                      className={`text-sm font-bold uppercase mb-2 ${
                        item.stock < 100 ? "text-accent" : "text-white"
                      }`}
                    >
                      Stock: {item.stock}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBuyMerch(item)}
                      disabled={item.stock <= 0}
                      className="w-full bg-white text-black font-bold uppercase py-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-white transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent"
                    >
                      {item.stock > 0 ? "Equip now" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Commute */}
        {subPhase === "commute" && (
          <motion.div
            key="commute"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full"
          >
            <h2 className="font-heading text-4xl md:text-6xl uppercase mb-12 text-center">
              Commute to Stadium
            </h2>

            {!commuteChoice ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <button
                  type="button"
                  onClick={() => handleCommuteSelect("drive")}
                  className="bg-black border-4 border-white p-8 brutal-shadow hover:bg-white hover:text-black transition-colors text-left group"
                >
                  <h3 className="font-heading text-4xl uppercase mb-2 group-hover:text-black">
                    Self-Drive
                  </h3>
                  <p className="text-2xl font-bold mb-4">$50</p>
                  <p className="text-lg uppercase text-muted-foreground group-hover:text-black/70">
                    ETA: High Traffic (Slow)
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCommuteSelect("shuttle")}
                  className="bg-black border-4 border-secondary p-8 brutal-shadow-yellow hover:bg-secondary hover:text-black transition-colors text-left group"
                >
                  <h3 className="font-heading text-4xl uppercase mb-2 text-secondary group-hover:text-black">
                    Official Shuttle
                  </h3>
                  <p className="text-2xl font-bold mb-4">$150</p>
                  <p className="text-lg uppercase text-muted-foreground group-hover:text-black/70">
                    ETA: Dedicated Lane (Fast)
                  </p>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-8">
                <div className="h-4 bg-muted relative border-2 border-white">
                  <motion.div
                    className={`absolute top-0 bottom-0 left-0 ${
                      commuteChoice === "shuttle" ? "bg-secondary" : "bg-white"
                    }`}
                    style={{ width: `${commuteProgress}%` }}
                  />
                  {/* Vehicle marker */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 bg-accent border-2 border-white brutal-shadow-sm"
                    style={{ left: `${commuteProgress}%` }}
                  />
                </div>
                <p className="text-center font-heading text-2xl uppercase animate-pulse">
                  Navigating traffic...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Concourse */}
        {subPhase === "concourse" && (
          <motion.div
            key="concourse"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full"
          >
            <h2 className="font-heading text-4xl md:text-6xl uppercase mb-12 text-center">
              Stadium Concourse
            </h2>

            {concourseProgress < 100 ? (
              <div className="w-full space-y-8">
                <div className="flex justify-between items-center px-4">
                  <span className="font-bold uppercase tracking-widest">Queue Position</span>
                  <span className="font-heading text-2xl">{100 - concourseProgress} ahead</span>
                </div>
                {/* People shuffling forward in line */}
                <div className="h-16 border-4 border-white flex items-center px-4 overflow-hidden relative bg-black">
                  <motion.div
                    className="flex space-x-4 absolute"
                    animate={{ x: [0, -20] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                  >
                    {QUEUE_DOTS.map((dot) => (
                      <div key={dot} className="w-8 h-8 rounded-none bg-white opacity-50" />
                    ))}
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-8">
                {!ticketVerified ? (
                  <button
                    type="button"
                    className="w-64 h-32 border-4 border-secondary bg-black flex items-center justify-center brutal-shadow-yellow relative overflow-hidden group cursor-pointer"
                    onClick={handleVerifyTicket}
                  >
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-accent transform -translate-x-1/2 pointer-events-none" />
                    <span className="font-heading text-2xl uppercase group-hover:hidden">
                      Align Ticket Here
                    </span>
                    <span className="font-heading text-2xl uppercase hidden group-hover:block text-secondary">
                      Click to Scan
                    </span>
                  </button>
                ) : (
                  <h2 className="font-heading text-6xl text-primary animate-pulse uppercase">
                    Verified!
                  </h2>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Concessions */}
        {subPhase === "food" && (
          <motion.div
            key="food"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-end mb-8 border-b-4 border-white pb-4">
              <h2 className="font-heading text-4xl md:text-6xl uppercase">Concession Stands</h2>
              <div className="border-2 border-secondary px-4 py-2 bg-black brutal-shadow-yellow">
                <span className="font-bold uppercase tracking-wider text-sm text-secondary">
                  Stocked
                </span>
                <span className="font-heading text-2xl ml-2">{foodPurchased.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pb-32">
              {foodItems.slice(0, VISIBLE_ITEMS).map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleBuyFood(item)}
                  disabled={!item.available}
                  className={`border-4 p-4 flex flex-col justify-between text-left transition-colors ${
                    !item.available
                      ? "border-muted opacity-50 bg-black"
                      : "border-white bg-black brutal-shadow hover:bg-white hover:text-black group"
                  }`}
                >
                  <h3 className="font-bold text-lg leading-tight mb-4">{item.name}</h3>
                  <p className="text-3xl font-heading mb-2">${item.price}</p>
                  <span
                    className={`text-xs uppercase font-bold ${
                      !item.available ? "text-accent" : "text-secondary group-hover:text-black"
                    }`}
                  >
                    {!item.available ? "Sold Out" : "Buy Now"}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Phase3;
