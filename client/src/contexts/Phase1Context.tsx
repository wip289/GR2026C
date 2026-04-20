import React, { createContext, useContext, useReducer } from 'react';
import { Phase1State, ClientIntakeData, Venue, LayoutSuggestion, ProposalCustomization, ProposalDocument } from '@/lib/phase1Types';

type Phase1Action =
  | { type: 'SET_STEP'; payload: Phase1State['currentStep'] }
  | { type: 'SET_CLIENT_INTAKE'; payload: ClientIntakeData }
  | { type: 'SET_VENUE'; payload: Venue }
  | { type: 'SET_VENUE_COST'; payload: { costPerDay: number; isFree: boolean } }
  | { type: 'SET_LAYOUT'; payload: LayoutSuggestion }
  | { type: 'SET_PROPOSAL_CUSTOMIZATION'; payload: ProposalCustomization }
  | { type: 'SET_EMPLOYER_PROPOSAL'; payload: ProposalDocument }
  | { type: 'SET_SPONSOR_PROPOSAL'; payload: ProposalDocument }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

const initialState: Phase1State = {
  currentStep: 'intake',
  clientIntake: null,
  selectedVenue: null,
  venueCostPerDay: 0,
  venueIsFree: true,
  layoutSuggestion: null,
  proposalCustomization: null,
  employerProposal: null,
  sponsorProposal: null,
  isLoading: false,
  error: null,
};

function phase1Reducer(state: Phase1State, action: Phase1Action): Phase1State {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CLIENT_INTAKE':
      return { ...state, clientIntake: action.payload };
    case 'SET_VENUE':
      return { ...state, selectedVenue: action.payload };
    case 'SET_VENUE_COST':
      return { ...state, venueCostPerDay: action.payload.costPerDay, venueIsFree: action.payload.isFree };
    case 'SET_LAYOUT':
      return { ...state, layoutSuggestion: action.payload };
    case 'SET_PROPOSAL_CUSTOMIZATION':
      return { ...state, proposalCustomization: action.payload };
    case 'SET_EMPLOYER_PROPOSAL':
      return { ...state, employerProposal: action.payload };
    case 'SET_SPONSOR_PROPOSAL':
      return { ...state, sponsorProposal: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface Phase1ContextType {
  state: Phase1State;
  dispatch: React.Dispatch<Phase1Action>;
}

const Phase1Context = createContext<Phase1ContextType | undefined>(undefined);

export function Phase1Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(phase1Reducer, initialState);

  return (
    <Phase1Context.Provider value={{ state, dispatch }}>
      {children}
    </Phase1Context.Provider>
  );
}

export function usePhase1() {
  const context = useContext(Phase1Context);
  if (!context) {
    throw new Error('usePhase1 must be used within Phase1Provider');
  }
  return context;
}
