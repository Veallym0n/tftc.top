import {
  FilterBuilder,
  FilterSphereProvider,
  type FilterSchemaContext,
} from '@fn-sphere/filter';
import { getFilterModalText } from '../locale';
import { OfflineCacheFilterSchema } from '../schema';
import { filterSphereTheme } from '../theme';

type FilterModalText = ReturnType<typeof getFilterModalText>;

interface FilterBuilderSectionProps {
  text: FilterModalText;
  isLoading: boolean;
  errorMessage: string | null;
  offlineCacheCount: number;
  context: FilterSchemaContext<OfflineCacheFilterSchema>;
}

export const FilterBuilderSection = ({
  text,
  isLoading,
  errorMessage,
  offlineCacheCount,
  context,
}: FilterBuilderSectionProps) => {
  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b-2 border-memphis-dark bg-cream lg:border-b-0 lg:border-r-2">
      <div className="border-b-2 border-memphis-dark bg-white px-6 py-4">
        <div className="text-sm font-bold text-slate-800">{text.subtitle}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-white p-5 text-sm font-bold text-slate-600 shadow-memphis-sm">
            {text.loading}
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-red-50 p-5 text-sm font-bold text-red-700 shadow-memphis-sm">
            {text.error} {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && offlineCacheCount === 0 && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-white p-5 text-sm font-bold text-slate-600 shadow-memphis-sm">
            {text.empty}
          </div>
        )}

        {!isLoading && !errorMessage && offlineCacheCount > 0 && (
          <div className="filter-builder">
            <FilterSphereProvider context={context} theme={filterSphereTheme}>
              <FilterBuilder />
            </FilterSphereProvider>
          </div>
        )}
      </div>
    </section>
  );
};
