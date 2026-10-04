"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import TravelPlannerQuizModal from "@/components/TravelPlannerQuizModal";

interface TravelPlannerQuizContextValue {
  isOpen: boolean;
  source: string;
  openTravelPlannerQuiz: (source?: string) => void;
  closeTravelPlannerQuiz: () => void;
}

const TravelPlannerQuizContext = createContext<TravelPlannerQuizContextValue | undefined>(undefined);

export function TravelPlannerQuizProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<string>("home");

  const openTravelPlannerQuiz = useCallback((newSource: string = "home") => {
    setSource(newSource);
    setIsOpen(true);
  }, []);

  const closeTravelPlannerQuiz = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <TravelPlannerQuizContext.Provider
      value={{
        isOpen,
        source,
        openTravelPlannerQuiz,
        closeTravelPlannerQuiz,
      }}
    >
      {children}
      <TravelPlannerQuizModal
        isOpen={isOpen}
        onClose={closeTravelPlannerQuiz}
        source={source}
      />
    </TravelPlannerQuizContext.Provider>
  );
}

export function useTravelPlannerQuiz() {
  const context = useContext(TravelPlannerQuizContext);
  if (!context) {
    throw new Error("useTravelPlannerQuiz deve ser utilizado dentro de um TravelPlannerQuizProvider.");
  }
  return context;
}
