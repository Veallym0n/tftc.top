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
    <div className="grid shrink-0 grid-cols-2 gap-2 border-t-2 border-memphis-dark bg-white p-2.5 sm:flex sm:gap-3 sm:p-4">
      <button
        type="button"
        onClick={onReset}
        className="min-w-0 truncate rounded-xl border-2 border-memphis-dark bg-cream px-3 py-2.5 text-xs font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-memphis-yellow active:translate-y-0.5 sm:px-4 sm:py-3 sm:text-sm"
      >
        {text.reset}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="min-w-0 truncate rounded-xl border-2 border-memphis-dark bg-white px-3 py-2.5 text-xs font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0.5 sm:px-4 sm:py-3 sm:text-sm"
      >
        {text.close}
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={isApplyDisabled}
        className="col-span-2 min-w-0 truncate rounded-xl border-2 border-memphis-dark bg-memphis-blue px-3 py-2.5 text-xs font-bold text-white shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:bg-cyan-500 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none sm:ml-auto sm:px-4 sm:py-3 sm:text-sm"
      >
        {text.apply}
      </button>
    </div>
  );
};
