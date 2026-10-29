import { useAppStore } from "@/store/useAppStore";

/**
 * "Insufficient balance" modal. Opened by the ATM in the HUD or by any
 * purchase that costs more than the current balance.
 */
export const WithdrawModal = () => {
  const isOpen = useAppStore((state) => state.isWithdrawModalOpen);
  const closeModal = useAppStore((state) => state.closeWithdrawModal);
  const withdrawFunds = useAppStore((state) => state.withdrawFunds);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-black border-4 border-accent p-8 max-w-md w-full brutal-shadow-red relative">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-2 right-4 text-white text-2xl font-bold hover:text-accent"
        >
          X
        </button>
        <h2 className="font-heading text-4xl uppercase text-accent mb-4">Insufficient Balance</h2>
        <p className="text-lg mb-8">You need more funds to proceed. Withdraw $5 from savings?</p>

        <button
          type="button"
          onClick={withdrawFunds}
          className="w-full bg-white text-black font-heading text-2xl uppercase py-4 border-2 border-white hover:bg-accent hover:text-white hover:border-accent brutal-active"
        >
          Withdraw $5
        </button>
      </div>
    </div>
  );
};
