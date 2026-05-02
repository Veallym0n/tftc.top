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

  return (
    <a
      href={`https://www.geocaching.com/geocache/${cache.code}`}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border-2 border-memphis-dark bg-white p-3 shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:shadow-memphis focus:outline-none focus:ring-4 focus:ring-memphis-blue/20 active:translate-y-0.5 active:shadow-memphis-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white">
          {cache.code}
        </span>
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          {localeText(filterItem.cacheType)}
        </span>
      </div>

      <div className="mt-2 line-clamp-2 text-[15px] font-bold leading-tight text-slate-800">
        {cache.name}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-cream px-2 py-0.5">
          D {filterItem.difficulty}
        </span>
        <span className="rounded-full bg-cream px-2 py-0.5">
          T {filterItem.terrain}
        </span>
        <span className="rounded-full bg-cream px-2 py-0.5">
          {localeText(filterItem.containerType)}
        </span>
        <span className="rounded-full bg-cream px-2 py-0.5">
          FP {filterItem.favoritePoints}
        </span>
      </div>
    </a>
  );
};
