// hooks/global-popup-context.tsx
import { GlobalPopup } from "@/components/ui/GlobalPopup";
import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from "react";

export type PopupVariant = "success" | "error" | "info";

export type PopupConfig = {
  title: string;
  description?: string;
  variant?: PopupVariant;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

type GlobalPopupContextType = {
  showPopup: (config: PopupConfig) => void;
  hidePopup: () => void;
};

const GlobalPopupContext = createContext<GlobalPopupContextType | undefined>(
  undefined
);

export function GlobalPopupProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<PopupConfig>({
    title: "",
    description: "",
    variant: "info",
  });

  const showPopup = useCallback((next: PopupConfig) => {
    setConfig({
      variant: "info",
      ...next,
    });
    setVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <GlobalPopupContext.Provider value={{ showPopup, hidePopup }}>
      {children}
      <GlobalPopup
        visible={visible}
        onClose={hidePopup}
        {...config}
      />
    </GlobalPopupContext.Provider>
  );
}

export function useGlobalPopup() {
  const ctx = useContext(GlobalPopupContext);
  if (!ctx) {
    throw new Error("useGlobalPopup must be used inside GlobalPopupProvider");
  }
  return ctx;
}
