import { motion } from "framer-motion";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

interface FormData {
  name: string;
  homeCountry: string;
  opponentCountry: string;
  matchName: string;
}

const emptyForm: FormData = {
  name: "",
  homeCountry: "",
  opponentCountry: "",
  matchName: "",
};

/** Opening screen: the player describes the match they are about to obsess over. */
const PhaseEntry = () => {
  const setUserData = useAppStore((state) => state.setUserData);
  const setPhase = useAppStore((state) => state.setPhase);

  const [formData, setFormData] = useState<FormData>(emptyForm);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.homeCountry) return;

    setUserData(formData);
    setPhase("phase1");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-black border-4 border-white p-8 md:p-12 brutal-shadow"
      >
        <h1 className="text-6xl md:text-8xl font-heading mb-8 uppercase tracking-tighter">
          Sporthyp
        </h1>
        <p className="text-xl mb-12 uppercase tracking-widest font-bold">THE HIGH STARTS NOW</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-2xl font-heading uppercase" htmlFor="name">
              Name *
            </label>
            <input
              required
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-black border-2 border-white p-4 text-xl outline-none focus:bg-white focus:text-black transition-colors"
              placeholder="e.g. Alice"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-2xl font-heading uppercase" htmlFor="homeCountry">
              Country - HOME *
            </label>
            <input
              required
              type="text"
              id="homeCountry"
              name="homeCountry"
              value={formData.homeCountry}
              onChange={handleChange}
              className="w-full bg-black border-2 border-white p-4 text-xl outline-none focus:bg-white focus:text-black transition-colors"
              placeholder="e.g. USA"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-2xl font-heading uppercase" htmlFor="opponentCountry">
              Country - AWAY (Optional)
            </label>
            <input
              type="text"
              id="opponentCountry"
              name="opponentCountry"
              value={formData.opponentCountry}
              onChange={handleChange}
              className="w-full bg-black border-2 border-white p-4 text-xl outline-none focus:bg-white focus:text-black transition-colors"
              placeholder="e.g. Brazil"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-2xl font-heading uppercase" htmlFor="matchName">
              Match Name (Optional)
            </label>
            <input
              type="text"
              id="matchName"
              name="matchName"
              value={formData.matchName}
              onChange={handleChange}
              className="w-full bg-black border-2 border-white p-4 text-xl outline-none focus:bg-white focus:text-black transition-colors"
              placeholder="e.g. World Cup 2026 Semi-Finals"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-heading text-4xl uppercase py-6 border-4 border-white hover:bg-black hover:text-white brutal-active mt-8"
          >
            Begin the Obsession
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PhaseEntry;
