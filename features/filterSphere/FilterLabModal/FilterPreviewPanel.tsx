import { getFilterModalText, getFilterSphereLocaleText } from '../locale';
import { OfflineCacheFilterRecord } from '../types';
import { FilterModalActions } from './FilterModalActions';
import { PreviewCacheCard } from './PreviewCacheCard';

type FilterModalText = ReturnType<typeof getFilterModalText>;
type FilterSphereLocaleText = ReturnType<typeof getFilterSphereLocaleText>;

interface FilterPreviewPanelProps {
  text: FilterModalText;
  localeText: FilterSphereLocaleText;
  filteredRecords: OfflineCacheFilterRecord[];
  previewRecords: OfflineCacheFilterRecord[];
  offlineCacheCount: number;
  isLoading: boolean;
  validRuleCount: number;
  totalRuleCount: number;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
}

interface FilterPreviewPanelHeaderProps {
  text: FilterModalText;
  matchedCount: number;
  previewSummary: string;
}

const FilterPreviewPanelHeader = ({
  text,
  matchedCount,
  previewSummary,
}: FilterPreviewPanelHeaderProps) => {
  return (
    <div className="min-w-0 shrink-0 border-b-2 border-memphis-dark bg-white px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-slate-400">
          {text.previewTitle}
        </div>
        <span className="max-w-[60%] shrink-0 truncate rounded-lg border-2 border-memphis-dark bg-cream px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
          {text.matched}: {matchedCount.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 break-words text-sm font-bold leading-snug text-slate-700">
        {previewSummary}
      </div>
    </div>
  );
};

export const FilterPreviewPanel = ({
  text,
  localeText,
  filteredRecords,
  previewRecords,
  offlineCacheCount,
  isLoading,
  validRuleCount,
  totalRuleCount,
  onReset,
  onClose,
  onApply,
}: FilterPreviewPanelProps) => {
  const previewSummary = text.previewSummary
    .replace('{matched}', filteredRecords.length.toLocaleString())
    .replace('{total}', offlineCacheCount.toLocaleString())
    .replace('{valid}', String(validRuleCount))
    .replace('{rules}', String(totalRuleCount));

  return (
    <aside className="flex min-h-0 min-w-0 overflow-hidden flex-col bg-slate-50">
      <FilterPreviewPanelHeader
        text={text}
        matchedCount={filteredRecords.length}
        previewSummary={previewSummary}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="grid gap-2 p-2.5 sm:gap-3 sm:p-4 sm:pr-3">
          {!isLoading && previewRecords.length === 0 && (
            <div className="rounded-2xl border-2 border-memphis-dark bg-white p-4 text-sm font-bold text-slate-500 shadow-memphis-sm">
              {text.previewEmpty}
            </div>
          )}

          {previewRecords.map((record) => (
            <PreviewCacheCard
              key={record.cache.code}
              record={record}
              localeText={localeText}
            />
          ))}
        </div>
      </div>

      <FilterModalActions
        text={text}
        isApplyDisabled={filteredRecords.length === 0}
        onReset={onReset}
        onClose={onClose}
        onApply={onApply}
      />
    </aside>
  );
};
