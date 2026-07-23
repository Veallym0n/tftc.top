import { create } from 'zustand';
import type { FilterGroup } from '@fn-sphere/filter';

interface OfflineFilterRuleState {
  ruleValue: FilterGroup | undefined;
  setRuleValue: (ruleValue: FilterGroup) => void;
  clearRuleValue: () => void;
}

export const useOfflineFilterRuleStore = create<OfflineFilterRuleState>((set) => ({
  ruleValue: undefined,
  setRuleValue: (ruleValue) => set({ ruleValue }),
  clearRuleValue: () => set({ ruleValue: undefined }),
}));
