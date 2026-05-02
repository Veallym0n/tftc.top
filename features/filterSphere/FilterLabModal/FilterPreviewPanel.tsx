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
    <aside className="flex min-h-0 overflow-hidden flex-col bg-slate-50">
      <div className="shrink-0 border-b-2 border-memphis-dark bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">
            {text.previewTitle}
          </div>
          <span className="rounded-lg border-2 border-memphis-dark bg-cream px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
            {text.matched}: {filteredRecords.length.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 text-sm font-bold leading-snug text-slate-700">
          {previewSummary}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-3 p-4 pr-3">
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
