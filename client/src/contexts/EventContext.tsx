/**
 * EventContext — Global state for the Job Fair Financial Planner
 *
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * Manages all event planning data across the multi-step wizard and dashboard.
 */

import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  type EventInfo,
  type BoothType,
  type SponsorTier,
  type ExpenseCategory,
  type EventPlanData,
  createDefaultEventInfo,
  createDefaultBoothTypes,
  createDefaultSponsorTiers,
  createDefaultExpenses,
} from "@/lib/financialPlanner";

interface EventState {
  currentStep: number;
  eventInfo: EventInfo;
  boothTypes: BoothType[];
  interviewBooths: number;
  sponsorTiers: SponsorTier[];
  expenses: ExpenseCategory[];
  fillRate: number;
  contingencyPercent: number;
  targetProfitMargin: number;
  isComplete: boolean;
}

type EventAction =
  | { type: "SET_STEP"; step: number }
  | { type: "UPDATE_EVENT_INFO"; info: Partial<EventInfo> }
  | { type: "SET_BOOTH_TYPES"; boothTypes: BoothType[] }
  | { type: "UPDATE_BOOTH_TYPE"; id: string; updates: Partial<BoothType> }
  | { type: "ADD_BOOTH_TYPE"; boothType: BoothType }
  | { type: "REMOVE_BOOTH_TYPE"; id: string }
  | { type: "SET_INTERVIEW_BOOTHS"; count: number }
  | { type: "SET_SPONSOR_TIERS"; tiers: SponsorTier[] }
  | { type: "UPDATE_SPONSOR_TIER"; id: string; updates: Partial<SponsorTier> }
  | { type: "ADD_SPONSOR_TIER"; tier: SponsorTier }
  | { type: "REMOVE_SPONSOR_TIER"; id: string }
  | { type: "SET_EXPENSES"; expenses: ExpenseCategory[] }
  | { type: "UPDATE_EXPENSE_ITEM"; categoryId: string; itemId: string; updates: Partial<import("@/lib/financialPlanner").ExpenseItem> }
  | { type: "ADD_EXPENSE_ITEM"; categoryId: string; item: import("@/lib/financialPlanner").ExpenseItem }
  | { type: "REMOVE_EXPENSE_ITEM"; categoryId: string; itemId: string }
  | { type: "SET_FILL_RATE"; rate: number }
  | { type: "SET_CONTINGENCY"; percent: number }
  | { type: "SET_TARGET_MARGIN"; margin: number }
  | { type: "MARK_COMPLETE" }
  | { type: "RESET" }
  | { type: "LOAD_STATE"; state: EventState };

const initialState: EventState = {
  currentStep: 0,
  eventInfo: createDefaultEventInfo(),
  boothTypes: createDefaultBoothTypes(),
  interviewBooths: 10,
  sponsorTiers: createDefaultSponsorTiers(),
  expenses: createDefaultExpenses(2),
  fillRate: 85,
  contingencyPercent: 7,
  targetProfitMargin: 20,
  isComplete: false,
};

function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "UPDATE_EVENT_INFO": {
      const newInfo = { ...state.eventInfo, ...action.info };
      // If duration changed, update expense frequencies
      if (action.info.eventDuration && action.info.eventDuration !== state.eventInfo.eventDuration) {
        const newExpenses = state.expenses.map((cat) => ({
          ...cat,
          items: cat.items.map((item) => ({
            ...item,
            frequency: item.frequencyUnit === "day" ? action.info.eventDuration! : item.frequency,
          })),
        }));
        return { ...state, eventInfo: newInfo, expenses: newExpenses };
      }
      return { ...state, eventInfo: newInfo };
    }

    case "SET_BOOTH_TYPES":
      return { ...state, boothTypes: action.boothTypes };

    case "UPDATE_BOOTH_TYPE":
      return {
        ...state,
        boothTypes: state.boothTypes.map((bt) =>
          bt.id === action.id ? { ...bt, ...action.updates } : bt
        ),
      };

    case "ADD_BOOTH_TYPE":
      return { ...state, boothTypes: [...state.boothTypes, action.boothType] };

    case "REMOVE_BOOTH_TYPE":
      return { ...state, boothTypes: state.boothTypes.filter((bt) => bt.id !== action.id) };

    case "SET_INTERVIEW_BOOTHS":
      return { ...state, interviewBooths: action.count };

    case "SET_SPONSOR_TIERS":
      return { ...state, sponsorTiers: action.tiers };

    case "UPDATE_SPONSOR_TIER":
      return {
        ...state,
        sponsorTiers: state.sponsorTiers.map((t) =>
          t.id === action.id ? { ...t, ...action.updates } : t
        ),
      };

    case "ADD_SPONSOR_TIER":
      return { ...state, sponsorTiers: [...state.sponsorTiers, action.tier] };

    case "REMOVE_SPONSOR_TIER":
      return { ...state, sponsorTiers: state.sponsorTiers.filter((t) => t.id !== action.id) };

    case "SET_EXPENSES":
      return { ...state, expenses: action.expenses };

    case "UPDATE_EXPENSE_ITEM":
      return {
        ...state,
        expenses: state.expenses.map((cat) =>
          cat.id === action.categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === action.itemId ? { ...item, ...action.updates } : item
                ),
              }
            : cat
        ),
      };

    case "ADD_EXPENSE_ITEM":
      return {
        ...state,
        expenses: state.expenses.map((cat) =>
          cat.id === action.categoryId
            ? { ...cat, items: [...cat.items, action.item] }
            : cat
        ),
      };

    case "REMOVE_EXPENSE_ITEM":
      return {
        ...state,
        expenses: state.expenses.map((cat) =>
          cat.id === action.categoryId
            ? { ...cat, items: cat.items.filter((item) => item.id !== action.itemId) }
            : cat
        ),
      };

    case "SET_FILL_RATE":
      return { ...state, fillRate: action.rate };

    case "SET_CONTINGENCY":
      return { ...state, contingencyPercent: action.percent };

    case "SET_TARGET_MARGIN":
      return { ...state, targetProfitMargin: action.margin };

    case "MARK_COMPLETE":
      return { ...state, isComplete: true };

    case "RESET":
      return initialState;

    case "LOAD_STATE":
      return action.state;

    default:
      return state;
  }
}

interface EventContextValue {
  state: EventState;
  dispatch: React.Dispatch<EventAction>;
  getPlanData: () => EventPlanData;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  const getPlanData = (): EventPlanData => ({
    eventInfo: state.eventInfo,
    boothTypes: state.boothTypes,
    interviewBooths: state.interviewBooths,
    sponsorTiers: state.sponsorTiers,
    expenses: state.expenses,
    fillRate: state.fillRate,
    contingencyPercent: state.contingencyPercent,
    targetProfitMargin: state.targetProfitMargin,
  });

  return (
    <EventContext.Provider value={{ state, dispatch, getPlanData }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
