import { create } from "zustand";

export type Phase = "entry" | "phase1" | "phase2" | "phase3" | "phase4" | "phase5";

/** Item added to the merch cart during phase 3. */
export interface MerchItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  depletionRate: number;
}

/** Concession item bought during phase 3. */
export interface FoodItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface UserData {
  name: string;
  homeCountry: string;
  opponentCountry: string;
  matchName: string;
}

export interface AppState extends UserData {
  // Game state
  phase: Phase;
  balance: number;
  hasTicket: boolean;
  ticketDetails: { sector: string; row: string } | null;
  merchCart: MerchItem[];
  foodPurchased: FoodItem[];
  isWithdrawModalOpen: boolean;

  // Actions
  setUserData: (data: Partial<UserData>) => void;
  setPhase: (phase: Phase) => void;
  withdrawFunds: () => void;
  deductBalance: (amount: number) => boolean;
  secureTicket: (sector: string, row: string) => void;
  addToCart: (item: MerchItem) => void;
  buyFood: (item: FoodItem) => void;
  openWithdrawModal: () => void;
  closeWithdrawModal: () => void;
  resetGame: () => void;
}

const initialState: UserData &
  Pick<
    AppState,
    | "phase"
    | "balance"
    | "hasTicket"
    | "ticketDetails"
    | "merchCart"
    | "foodPurchased"
    | "isWithdrawModalOpen"
  > = {
  name: "",
  homeCountry: "",
  opponentCountry: "",
  matchName: "",
  phase: "entry",
  balance: 2000,
  hasTicket: false,
  ticketDetails: null,
  merchCart: [],
  foodPurchased: [],
  isWithdrawModalOpen: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setUserData: (data) => set(data),

  setPhase: (phase) => set({ phase }),

  // Savings pay out a small top-up each time the player uses the ATM.
  withdrawFunds: () => set((state) => ({ balance: state.balance + 5 })),

  deductBalance: (amount) => {
    const { balance } = get();
    if (balance < amount) return false;
    set({ balance: balance - amount });
    return true;
  },

  secureTicket: (sector, row) => set({ hasTicket: true, ticketDetails: { sector, row } }),

  addToCart: (item) => set((state) => ({ merchCart: [...state.merchCart, item] })),

  buyFood: (item) => set((state) => ({ foodPurchased: [...state.foodPurchased, item] })),

  openWithdrawModal: () => set({ isWithdrawModalOpen: true }),

  closeWithdrawModal: () => set({ isWithdrawModalOpen: false }),

  resetGame: () => set({ ...initialState }),
}));
