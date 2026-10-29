import type { ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import { WithdrawModal } from "./WithdrawModal";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Application shell: the black canvas, the funds HUD (shown once the run
 * has started), and the global scanline overlay.
 */
export const Layout = ({ children }: LayoutProps) => {
  const balance = useAppStore((state) => state.balance);
  const phase = useAppStore((state) => state.phase);
  const openWithdrawModal = useAppStore((state) => state.openWithdrawModal);

  const showHud = phase !== "entry" && phase !== "phase5";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden relative">
      {showHud && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-4 md:p-8 pointer-events-none">
          <div className="pointer-events-auto border-2 border-white bg-black brutal-shadow px-4 py-2 flex items-center space-x-4">
            <span className="font-heading text-xl uppercase">Funds</span>
            <span
              className={`font-heading text-2xl ${balance < 50 ? "text-accent" : "text-primary"}`}
            >
              ${balance}
            </span>
            <button
              type="button"
              onClick={openWithdrawModal}
              className="ml-4 bg-muted px-2 py-1 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
            >
              ATM
            </button>
          </div>
        </div>
      )}

      <main className="w-full h-full min-h-screen flex flex-col relative z-10">{children}</main>

      <WithdrawModal />

      {/* CRT-style scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-10 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0.05)_50%,rgba(0,0,0,0.1)_51%,rgba(0,0,0,0))] bg-[length:100%_4px]" />
    </div>
  );
};
