import { getFilterSphereLocaleText } from '../locale';
import { OfflineCacheFilterRecord } from '../types';

type FilterSphereLocaleText = ReturnType<typeof getFilterSphereLocaleText>;

interface PreviewCacheCardProps {
  record: OfflineCacheFilterRecord;
  localeText: FilterSphereLocaleText;
}

export const PreviewCacheCard = ({
  record,
  localeText,
}: PreviewCacheCardProps) => {
  const { cache, filterItem } = record;
  const cacheTypeLabel = localeText(filterItem.cacheType);
  const containerTypeLabel = localeText(filterItem.containerType);
  const statChipClass =
    'block min-w-0 max-w-full truncate rounded-full bg-cream px-2 py-0.5 text-center sm:inline-block';

  return (
    <a
      href={`https://www.geocaching.com/geocache/${cache.code}`}
      target="_blank"
      rel="noreferrer"
      className="block w-full min-w-0 rounded-xl border-2 border-memphis-dark bg-white p-2.5 shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:shadow-memphis focus:outline-none focus:ring-4 focus:ring-memphis-blue/20 active:translate-y-0.5 active:shadow-memphis-sm sm:rounded-2xl sm:p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="max-w-[48%] shrink-0 truncate rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white">
          {cache.code}
        </span>
        <span
          className="min-w-0 flex-1 truncate text-right text-[10px] font-black uppercase tracking-wide text-slate-400"
          title={cacheTypeLabel}
        >
          {cacheTypeLabel}
        </span>
      </div>

      <div className="mt-2 break-words line-clamp-2 text-[15px] font-bold leading-tight text-slate-800">
        {cache.name}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:flex sm:flex-wrap sm:gap-2">
        <span className={statChipClass} title={`D ${filterItem.difficulty}`}>
          D {filterItem.difficulty}
        </span>
        <span className={statChipClass} title={`T ${filterItem.terrain}`}>
          T {filterItem.terrain}
        </span>
        <span className={statChipClass} title={containerTypeLabel}>
          {containerTypeLabel}
        </span>
        <span
          className={statChipClass}
          title={`FP ${filterItem.favoritePoints}`}
        >
          FP {filterItem.favoritePoints}
        </span>
      </div>
    </a>
  );
};
