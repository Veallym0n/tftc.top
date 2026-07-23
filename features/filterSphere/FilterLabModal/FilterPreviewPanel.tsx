import { getFilterSphereLocaleText } from '../locale';
import { OfflineCacheFilterRecord } from '../types';
import { FilterModalActions } from './FilterModalActions';
import { PreviewCacheCard } from './PreviewCacheCard';

type FilterSphereLocaleText = ReturnType<typeof getFilterSphereLocaleText>;

interface FilterPreviewPanelProps {
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
  matchedCount: number;
  previewSummary: string;
}

const FilterPreviewPanelHeader = ({
  matchedCount,
  previewSummary,
}: FilterPreviewPanelHeaderProps) => {
  return (
    <div className="min-w-0 border-b-2 border-memphis-dark bg-white px-3 py-2 sm:px-4 sm:py-4">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-slate-400">
          结果预览
        </div>
        <span className="shrink-0 truncate text-right text-[10px] font-black uppercase tracking-wide text-slate-500 sm:max-w-[60%] sm:rounded-lg sm:border-2 sm:border-memphis-dark sm:bg-cream sm:px-2 sm:py-1 sm:text-slate-700">
          匹配结果: {matchedCount.toLocaleString()}
        </span>
      </div>
      <p className="mt-2 hidden break-words text-sm font-bold leading-snug text-slate-700 sm:block">
        {previewSummary}
      </p>
    </div>
  );
};

export const FilterPreviewPanel = ({
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
  const previewSummary =
    `当前匹配 ${filteredRecords.length.toLocaleString()} / ` +
    `${offlineCacheCount.toLocaleString()} 个离线藏点 · ` +
    `有效规则 ${validRuleCount}/${totalRuleCount}`;

  return (
    <aside className="flex min-h-0 min-w-0 overflow-hidden flex-col bg-slate-50">
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <FilterPreviewPanelHeader
          matchedCount={filteredRecords.length}
          previewSummary={previewSummary}
        />

        <div className="grid gap-2 p-2.5 sm:gap-3 sm:p-4 sm:pr-3">
          {!isLoading && previewRecords.length === 0 && (
            <div className="rounded-2xl border-2 border-memphis-dark bg-white p-4 text-sm font-bold text-slate-500 shadow-memphis-sm">
              当前规则没有匹配到任何藏点。
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

      <div className="hidden lg:block">
        <FilterModalActions
          isApplyDisabled={filteredRecords.length === 0}
          onReset={onReset}
          onClose={onClose}
          onApply={onApply}
        />
      </div>
    </aside>
  );
};
