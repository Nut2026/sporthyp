import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { type FeedPost, generateHeadlines, generatePosts } from "@/lib/contentGenerators";
import { useAppStore } from "@/store/useAppStore";

const MAX_NOTIFICATIONS = 5;
const MAX_FEED_POSTS = 20;
const MIN_HYPE_SECONDS = 240; // 4:00
const MAX_HYPE_SECONDS = 480; // 8:00

/** Randomises the countdown window for the hype cycle. */
const randomHypeDuration = () =>
  Math.floor(Math.random() * (MAX_HYPE_SECONDS - MIN_HYPE_SECONDS + 1) + MIN_HYPE_SECONDS);

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Phase 1 – the bombardment: a live feed of hype, push notifications and a
 * countdown that closes the ticket window. Missing it restarts the cycle.
 */
const Phase1 = () => {
  const homeCountry = useAppStore((state) => state.homeCountry);
  const opponentCountry = useAppStore((state) => state.opponentCountry);
  const matchName = useAppStore((state) => state.matchName);
  const setPhase = useAppStore((state) => state.setPhase);

  const [headlines, setHeadlines] = useState<string[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<{ id: number; text: string }[]>(
    [],
  );
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [visiblePosts, setVisiblePosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const notifIdRef = useRef(0);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    const [newHeadlines, newPosts] = await Promise.all([
      generateHeadlines(homeCountry, opponentCountry, matchName),
      generatePosts(homeCountry, opponentCountry, matchName),
    ]);
    setHeadlines(newHeadlines);
    setPosts(newPosts);
    setIsLoading(false);
  }, [homeCountry, opponentCountry, matchName]);

  const resetPhase1 = useCallback(() => {
    setTimeLeft(randomHypeDuration());
    setVisiblePosts([]);
    setActiveNotifications([]);
    void loadContent();
  }, [loadContent]);

  // Load the session's content and start the countdown window.
  useEffect(() => {
    void loadContent();
    setTimeLeft(randomHypeDuration());
  }, [loadContent]);

  // Countdown – running out of time restarts the hype cycle.
  useEffect(() => {
    if (timeLeft <= 0 && posts.length > 0) {
      resetPhase1();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, posts.length, resetPhase1]);

  // Push notifications drop in every 1.5s, newest five only.
  useEffect(() => {
    if (headlines.length === 0) return;

    const timer = setInterval(() => {
      const headline = headlines[Math.floor(Math.random() * headlines.length)];
      const id = notifIdRef.current++;
      setActiveNotifications((prev) => {
        const next = [...prev, { id, text: headline }];
        if (next.length > MAX_NOTIFICATIONS) next.shift();
        return next;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [headlines]);

  // Feed reveals one post every 2s until the batch runs out.
  useEffect(() => {
    if (posts.length === 0) return;

    let currentIndex = 0;
    const timer = setInterval(() => {
      const nextPost = posts[currentIndex];
      if (nextPost) {
        setVisiblePosts((prev) => [nextPost, ...prev].slice(0, MAX_FEED_POSTS));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [posts]);

  // Ages the timestamps of everything on screen ("Just now" → "1m ago" → …).
  useEffect(() => {
    const timer = setInterval(() => {
      setVisiblePosts((prev) =>
        prev
          .filter((post) => post != null)
          .map((post) => {
            if (post.timeStr === "Just now") return { ...post, timeStr: "1m ago" };
            if (post.timeStr === "1m ago") return { ...post, timeStr: "2m ago" };
            if (post.timeStr.endsWith("m ago")) {
              const minutes = Number.parseInt(post.timeStr, 10);
              return { ...post, timeStr: `${minutes + 1}m ago` };
            }
            return post;
          }),
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Engagement keeps ticking upward while posts are visible.
  useEffect(() => {
    if (visiblePosts.length === 0) return;

    const timer = setInterval(() => {
      setVisiblePosts((prev) =>
        prev.map((post) => ({
          ...post,
          reactions: post.reactions + Math.floor(Math.random() * 3),
          comments: post.comments + Math.floor(Math.random() * 5),
        })),
      );
    }, 1500);

    return () => clearInterval(timer);
  }, [visiblePosts.length]);

  const handleReactionClick = (id: string) => {
    setVisiblePosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, reactions: post.reactions + 1 } : post)),
    );
  };

  if (isLoading || posts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black h-screen">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <h2 className="font-heading text-4xl md:text-6xl uppercase text-primary animate-pulse mb-4">
            Loading Feed
          </h2>
          <p className="text-lg uppercase tracking-widest text-muted-foreground">
            Summoning the hype...
          </p>
        </motion.div>
      </div>
    );
  }

  if (timeLeft <= 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h2 className="font-heading text-5xl md:text-7xl uppercase text-accent animate-pulse mb-6">
            Hype Window Closed
          </h2>
          <p className="text-xl uppercase tracking-widest">Restarting the feed...</p>
        </motion.div>
      </div>
    );
  }

  const isUrgent = timeLeft <= 50;
  const isCritical = timeLeft <= 20;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-24 overflow-hidden h-screen bg-black relative">
      {/* Countdown clock */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div
          className={`font-heading text-6xl md:text-8xl brutal-shadow px-8 py-2 bg-black border-4 ${
            isCritical
              ? "text-accent border-accent animate-pulse"
              : isUrgent
                ? "text-secondary border-secondary"
                : "text-white border-white"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Push notifications */}
      <div className="fixed right-4 md:right-8 top-32 w-64 md:w-80 z-40 pointer-events-none space-y-4">
        <AnimatePresence>
          {activeNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-black border-2 border-white p-3 brutal-shadow-sm pointer-events-auto"
            >
              <p className="text-xs text-secondary mb-1 uppercase font-bold">Push Notification</p>
              <p className="text-sm font-bold">{notification.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Media feed */}
      <div className="max-w-2xl mx-auto w-full flex-1 overflow-y-auto mt-16 pr-4 pb-32 scrollbar-hide">
        <AnimatePresence>
          {visiblePosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              layout
              className={`mb-6 border-4 p-6 bg-black brutal-shadow ${
                post.isTicketLink ? "border-accent" : "border-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-heading text-xl uppercase">{post.user}</span>
                <span className="text-muted-foreground text-sm uppercase">{post.timeStr}</span>
              </div>
              <h3 className="font-bold text-2xl mb-2">{post.title}</h3>

              {post.isTicketLink ? (
                <div className="mt-4">
                  <p className="mb-4 text-accent font-bold text-lg uppercase">{post.content}</p>
                  <button
                    type="button"
                    onClick={() => setPhase("phase2")}
                    className="w-full bg-accent text-white font-heading text-2xl uppercase py-4 border-2 border-white hover:bg-white hover:text-black brutal-active"
                  >
                    Enter Portal
                  </button>
                </div>
              ) : (
                <p className="text-lg">{post.content}</p>
              )}

              <div className="mt-6 flex space-x-6 border-t-2 border-muted pt-4">
                <button
                  type="button"
                  onClick={() => handleReactionClick(post.id)}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span className="font-bold uppercase tracking-wider text-sm">React</span>
                  <span className="font-heading text-xl">{post.reactions}</span>
                </button>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-sm">Comments</span>
                  <span className="font-heading text-xl">{post.comments}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Phase1;
