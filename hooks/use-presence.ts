import { useEffect } from "react";
import { AppState } from "react-native";
import { setUserOffline, setUserOnline } from "@/services/presence";

export function usePresence() {
  useEffect(() => {
    let mounted = true;

    const markOnline = async () => {
      if (!mounted) return;
      await setUserOnline();
    };

    const markOffline = async () => {
      if (!mounted) return;
      await setUserOffline();
    };

    markOnline();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        markOnline();
      } else if (state === "background" || state === "inactive") {
        markOffline();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
      setUserOffline();
    };
  }, []);
}
