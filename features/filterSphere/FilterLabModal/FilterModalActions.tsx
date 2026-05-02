import { getFilterModalText } from '../locale';

type FilterModalText = ReturnType<typeof getFilterModalText>;

interface FilterModalActionsProps {
  text: FilterModalText;
  isApplyDisabled: boolean;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
}

export const FilterModalActions = ({
  text,
  isApplyDisabled,
  onReset,
  onClose,
  onApply,
}: FilterModalActionsProps) => {
  return (
    <div className="shrink-0 flex gap-3 border-t-2 border-memphis-dark bg-white p-4">
      <button
        type="button"
        onClick={onReset}
        className="rounded-xl border-2 border-memphis-dark bg-cream px-4 py-3 text-sm font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-memphis-yellow active:translate-y-0.5"
      >
        {text.reset}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border-2 border-memphis-dark bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0.5"
      >
        {text.close}
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={isApplyDisabled}
        className="ml-auto rounded-xl border-2 border-memphis-dark bg-memphis-blue px-4 py-3 text-sm font-bold text-white shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:bg-cyan-500 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      >
        {text.apply}
      </button>
    </div>
  );
};
