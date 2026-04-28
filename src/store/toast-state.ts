import { create } from "zustand";

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  type: "success",
  show: false,
  setToast: (message, type) => set({ message, type, show: true }),
  hideToast: () => set({ show: false }),
}))

