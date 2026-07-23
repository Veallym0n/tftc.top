import {
  FilterBuilder,
  FilterSphereProvider,
  type FilterSchemaContext,
} from '@fn-sphere/filter';
import { OfflineCacheFilterSchema } from '../schema';
import { filterSphereTheme } from '../theme';

interface FilterBuilderSectionProps {
  isLoading: boolean;
  errorMessage: string | null;
  offlineCacheCount: number;
  context: FilterSchemaContext<OfflineCacheFilterSchema>;
}

export const FilterBuilderSection = ({
  isLoading,
  errorMessage,
  offlineCacheCount,
  context,
}: FilterBuilderSectionProps) => {
  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b-2 border-memphis-dark bg-cream lg:border-b-0 lg:border-r-2">
      <div className="hidden border-b-2 border-memphis-dark bg-white px-6 py-4 lg:block">
        <div className="text-sm font-bold text-slate-800">
          基于 IndexedDB 里的离线全库构建过滤规则，然后把结果一次性应用到地图。
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-white p-5 text-sm font-bold text-slate-600 shadow-memphis-sm">
            正在加载离线缓存数据...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-red-50 p-5 text-sm font-bold text-red-700 shadow-memphis-sm">
            加载离线缓存数据失败。 {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && offlineCacheCount === 0 && (
          <div className="rounded-2xl border-2 border-memphis-dark bg-white p-5 text-sm font-bold text-slate-600 shadow-memphis-sm">
            当前没有离线缓存数据。请先下载离线全量数据，再打开这个工具。
          </div>
        )}

        {!isLoading && !errorMessage && offlineCacheCount > 0 && (
          <FilterSphereProvider context={context} theme={filterSphereTheme}>
            <FilterBuilder />
          </FilterSphereProvider>
        )}
      </div>
    </section>
  );
};
