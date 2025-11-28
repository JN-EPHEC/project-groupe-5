import type { Challenge } from "@/components/ui/defi/types";
import { usePoints } from "@/hooks/points-context";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ActiveChallenge = Challenge & {
  status: 'active' | 'pendingValidation' | 'validated';
  photoUri?: string;
  feedbackRating?: number | null;
  feedbackComment?: string | null;
  feedbackSubmitted?: boolean; // une fois l'avis envoyé, on masque la carte du défi
};

export type ChallengeHistoryEntry = {
  id: string; // unique id for history entry
  challengeId: number;
  title: string;
  description?: string;
  category: Challenge["category"];
  points: number;
  photoUri?: string;
  validatedAt: string; // ISO timestamp
};

type ChallengesContextType = {
  current: ActiveChallenge | null;
  start: (challenge: Challenge) => void;
  stop: (id?: number) => void;
  validateWithPhoto: (photoUri: string) => void; // now only submits photo -> pendingValidation
  approveCurrent: () => void; // admin/validation step
  activities: Record<string, Challenge["category"]>;
  canceledIds: number[];
  reviewRequiredCount: number;
  reviewCompleted: number;
  incrementReview: () => void;
  setFeedback: (rating: number, comment: string) => void;
  history: ChallengeHistoryEntry[];
};

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ActiveChallenge | null>(null);
  const [activities, setActivities] = useState<Record<string, Challenge["category"]>>({});
  const [canceledIds, setCanceledIds] = useState<number[]>([]);
  const [reviewCompleted, setReviewCompleted] = useState(0);
  const reviewRequiredCount = 3;
  const { addPoints } = usePoints();
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);

  const start = useCallback((challenge: Challenge) => {
    setCurrent({ ...challenge, status: 'active' });
    setReviewCompleted(0); // reset any previous gating progress
  }, []);

  const stop = useCallback((id?: number) => {
    setCurrent(null);
    const canceledId = id ?? current?.id;
    if (typeof canceledId === 'number') {
      setCanceledIds((prev) => (prev.includes(canceledId) ? prev : [...prev, canceledId]));
    }
  }, [current]);

  // user submits photo evidence -> move to pendingValidation (no points yet)
  const validateWithPhoto = useCallback((photoUri: string) => {
    if (current && current.status === 'active') {
      setCurrent({ ...current, status: 'pendingValidation', photoUri });
      setReviewCompleted(0); // begin gating phase
    }
  }, [current]);

  // approval grants points and marks validated
  const approveCurrent = useCallback(() => {
    if (current && current.status === 'pendingValidation') {
      const dateKey = new Date().toISOString().slice(0, 10);
      addPoints(current.points);
      setActivities((prev) => ({ ...prev, [dateKey]: current.category }));
      // Push into history
      setHistory((prev) => {
        const already = prev.find((h) => h.challengeId === current.id);
        if (already) return prev; // avoid duplicates
        const entry: ChallengeHistoryEntry = {
          id: `${current.id}-${Date.now()}`,
          challengeId: current.id,
          title: current.title,
          description: current.description,
          category: current.category,
          points: current.points,
          photoUri: current.photoUri,
          validatedAt: new Date().toISOString(),
        };
        return [entry, ...prev];
      });
      setCurrent({ ...current, status: 'validated' });
      setReviewCompleted(0);
    }
  }, [current, addPoints]);

  const incrementReview = useCallback(() => {
    setReviewCompleted((prev) => (prev >= reviewRequiredCount ? prev : prev + 1));
  }, [reviewRequiredCount]);

  const setFeedback = useCallback((rating: number, comment: string) => {
    setCurrent((prev) => (prev ? { ...prev, feedbackRating: rating, feedbackComment: comment, feedbackSubmitted: true } : prev));
  }, []);

  const value = useMemo(
    () => ({
      current,
      start,
      stop,
      validateWithPhoto,
      approveCurrent,
      activities,
      canceledIds,
      reviewRequiredCount,
      reviewCompleted,
      incrementReview,
      setFeedback,
      history,
    }),
    [current, start, stop, validateWithPhoto, approveCurrent, activities, canceledIds, reviewRequiredCount, reviewCompleted, incrementReview, setFeedback, history]
  );
  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
