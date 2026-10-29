import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { type FeedPost, generatePostMatchPosts } from "@/lib/contentGenerators";
import { useAppStore } from "@/store/useAppStore";

const FADE_DURATION_MS = 30000; // The drain, compressed for a single session.
const FADE_TICK_MS = 1000;
const POST_BASE_DELAY_MS = 1000;
const MAX_VISIBLE_POSTS = 10;

/**
 * Phase 5 – the crash: post-match reactions trickle in as the interface
 * loses its colour, until only the reset prompt is left.
 */
const Phase5 = () => {
  const resetGame = useAppStore((state) => state.resetGame);
  const homeCountry = useAppStore((state) => state.homeCountry);
  const opponentCountry = useAppStore((state) => state.opponentCountry);
  const matchName = useAppStore((state) => state.matchName);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [visiblePosts, setVisiblePosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeLevel, setFadeLevel] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  // The post scheduler reads the latest fade level without restarting itself.
  const fadeLevelRef = useRef(0);
  useEffect(() => {
    fadeLevelRef.current = fadeLevel;
  }, [fadeLevel]);

  // Load the post-match reaction batch.
  useEffect(() => {
    let cancelled = false;

    generatePostMatchPosts(homeCountry, opponentCountry, matchName).then((postMatchPosts) => {
      if (cancelled) return;
      setPosts(postMatchPosts);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [homeCountry, opponentCountry, matchName]);

  // The fade: desaturation climbs to 100% over the course of the phase.
  useEffect(() => {
    if (isLoading) return;

    const steps = FADE_DURATION_MS / FADE_TICK_MS;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setFadeLevel(Math.min(100, progress));

      if (progress >= 100) {
        clearInterval(timer);
        setIsEnded(true);
      }
    }, FADE_TICK_MS);

    return () => clearInterval(timer);
  }, [isLoading]);

  // New posts arrive more slowly the further the fade has progressed.
  // The chain lives in a single effect so timers never overlap and a post
  // can never be scheduled twice (which would duplicate React keys).
  useEffect(() => {
    if (isEnded || isLoading || posts.length === 0) return;

    let currentIndex = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const addPost = () => {
      if (currentIndex >= posts.length) return;

      const newPost = posts[currentIndex];
      setVisiblePosts((prev) =>
        prev.some((post) => post.id === newPost.id)
          ? prev
          : [newPost, ...prev].slice(0, MAX_VISIBLE_POSTS),
      );
      currentIndex++;

      timer = setTimeout(addPost, POST_BASE_DELAY_MS + fadeLevelRef.current * 50);
    };

    timer = setTimeout(addPost, POST_BASE_DELAY_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [posts, isEnded, isLoading]);

  // Engagement keeps climbing while the feed is still alive.
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

  if (isLoading || posts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <h2 className="font-heading text-4xl md:text-6xl uppercase text-primary animate-pulse mb-4">
            Loading Aftermath
          </h2>
          <p className="text-lg uppercase tracking-widest text-muted-foreground">
            The crowd is leaving...
          </p>
        </motion.div>
      </div>
    );
  }

  if (isEnded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-center"
        >
          <h1 className="font-serif text-2xl tracking-widest text-muted-foreground mb-12 uppercase">
            The high has passed.
          </h1>
          <button
            type="button"
            onClick={resetGame}
            className="bg-transparent text-white font-heading text-xl uppercase py-4 px-8 border-2 border-white hover:bg-white hover:text-black transition-colors"
          >
            Re-live the Obsession?
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col p-4 md:p-8 pt-24 bg-black relative overflow-hidden transition-all duration-1000"
      style={{ filter: `grayscale(${fadeLevel}%) opacity(${100 - fadeLevel * 0.5}%)` }}
    >
      <div className="max-w-2xl mx-auto w-full flex-1 overflow-y-auto pr-4 scrollbar-hide">
        <AnimatePresence>
          {visiblePosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              layout
              className="mb-4 border-2 border-white p-6 bg-black"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold uppercase tracking-wider text-sm">{post.user}</span>
                <span className="text-muted-foreground text-xs uppercase">{post.timeStr}</span>
              </div>
              <h3 className="font-bold text-xl mb-2">{post.title}</h3>
              <p className="text-lg mb-4">{post.content}</p>
              <div className="flex space-x-6 border-t-2 border-muted pt-3">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-xs">Reactions</span>
                  <span className="font-heading text-lg">{post.reactions}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-xs">Comments</span>
                  <span className="font-heading text-lg">{post.comments}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Phase5;
