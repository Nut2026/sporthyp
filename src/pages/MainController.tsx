import type { ComponentType } from "react";
import { Layout } from "@/components/Layout";
import { type Phase, useAppStore } from "@/store/useAppStore";
import Phase1 from "./Phase1";
import Phase2 from "./Phase2";
import Phase3 from "./Phase3";
import Phase4 from "./Phase4";
import Phase5 from "./Phase5";
import PhaseEntry from "./PhaseEntry";

/** Each phase of the experience is a self-contained screen. */
const PHASE_COMPONENTS: Record<Phase, ComponentType> = {
  entry: PhaseEntry,
  phase1: Phase1,
  phase2: Phase2,
  phase3: Phase3,
  phase4: Phase4,
  phase5: Phase5,
};

const MainController = () => {
  const phase = useAppStore((state) => state.phase);
  const ActivePhase = PHASE_COMPONENTS[phase];

  return (
    <Layout>
      <ActivePhase />
    </Layout>
  );
};

export default MainController;
