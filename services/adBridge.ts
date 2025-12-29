// services/adBridge.ts

export type AdScenario = "start_challenge" | "claim_reward" | "claim_points";

type AdRequest = {
  scenario: AdScenario;
  onDone?: () => void;
};

type Listener = (req: AdRequest) => void;

const listeners = new Set<Listener>();

export function requestAd(req: AdRequest) {
  listeners.forEach((l) => l(req));
}

export function subscribeToAdRequests(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}