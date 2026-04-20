import React, { useEffect, useMemo, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  FilterBuilder,
  FilterSphereProvider,
  useFilterSphere,
} from '@fn-sphere/filter';
import { Modal, defaultModalClasses } from '../../libs/common/Modal';
import { dbService } from '../../services/db';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useMapStore } from '../../stores/useMapStore';
import { Geocache } from '../../types';
import { getFilterModalText, getFilterSphereLocaleText } from './locale';
import { toOfflineCacheFilterRecord } from './normalize';
import { offlineCacheFilterSchema } from './schema';
import { filterSphereTheme } from './theme';

const modalClasses = {
  ...defaultModalClasses,
  contentClassName:
    'relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-2 border-memphis-dark bg-white shadow-memphis-lg animate-fade-in',
  bodyClassName: 'flex min-h-0 flex-1 overflow-hidden p-0',
};

const LocalOfflineFilterModal = NiceModal.create(() => {
  const modal = useModal();
  const lang = useLanguageStore((state) => state.lang);
  const setCaches = useMapStore((state) => state.setCaches);
  const setDrawerOpen = useMapStore((state) => state.setDrawerOpen);
  const showToast = useMapStore((state) => state.showToast);

  const [offlineCaches, setOfflineCaches] = useState<Geocache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localeText = useMemo(() => getFilterSphereLocaleText(lang), [lang]);
  const text = useMemo(() => getFilterModalText(lang), [lang]);

  const { predicate, totalRuleCount, validRuleCount, reset, context } =
    useFilterSphere({
      schema: offlineCacheFilterSchema,
      getLocaleText: localeText,
    });

  useEffect(() => {
    let isCancelled = false;

    const loadOfflineCaches = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const caches = await dbService.getOfflineCaches();
        if (isCancelled) {
          return;
        }
        setOfflineCaches(caches);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : text.noErrorDetail;
        setErrorMessage(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOfflineCaches();

    return () => {
      isCancelled = true;
    };
  }, [text.noErrorDetail]);

  const records = useMemo(() => {
    return offlineCaches.map(toOfflineCacheFilterRecord);
  }, [offlineCaches]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => predicate(record.filterItem));
  }, [predicate, records]);

  const previewRecords = useMemo(() => {
    return filteredRecords.slice(0, 24);
  }, [filteredRecords]);

  const handleApply = () => {
    const nextCaches = filteredRecords.map((record) => record.cache);
    if (nextCaches.length === 0) {
      return;
    }

    setCaches(nextCaches);
    setDrawerOpen(false);
    showToast(text.applyToast.replace('{count}', String(nextCaches.length)));
    modal.remove();
  };

  const previewSummary = text.previewSummary
    .replace('{matched}', filteredRecords.length.toLocaleString())
    .replace('{total}', offlineCaches.length.toLocaleString())
    .replace('{valid}', String(validRuleCount))
    .replace('{rules}', String(totalRuleCount));

  return (
    <Modal
      {...modalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title={text.title}
      headerActions={
        <span className="rounded-lg border-2 border-memphis-dark bg-memphis-yellow px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900">
          {text.sourceValue}
        </span>
      }
      footer={null}
    >
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(26rem,0.95fr)] lg:grid-rows-1">
        <section className="flex min-h-0 flex-col border-b-2 border-memphis-dark bg-cream lg:border-b-0 lg:border-r-2">
          <div className="border-b-2 border-memphis-dark bg-white px-6 py-4">
            <div className="text-sm font-bold text-slate-800">{text.subtitle}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">
              {text.sourceLabel}: {text.sourceValue}
            </div>
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

            {!isLoading && !errorMessage && offlineCaches.length === 0 && (
              <div className="rounded-2xl border-2 border-memphis-dark bg-white p-5 text-sm font-bold text-slate-600 shadow-memphis-sm">
                {text.empty}
              </div>
            )}

            {!isLoading && !errorMessage && offlineCaches.length > 0 && (
              <div className="overflow-auto pb-4">
                <div className="min-w-max">
                  <FilterSphereProvider
                    context={context}
                    theme={filterSphereTheme}
                  >
                    <FilterBuilder />
                  </FilterSphereProvider>
                </div>
              </div>
            )}
          </div>
        </section>

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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-3">
                {!isLoading && previewRecords.length === 0 && (
                  <div className="rounded-2xl border-2 border-memphis-dark bg-white p-4 text-sm font-bold text-slate-500 shadow-memphis-sm">
                    {text.previewEmpty}
                  </div>
                )}

                {previewRecords.map(({ cache, filterItem }) => (
                  <div
                    key={cache.code}
                    className="rounded-2xl border-2 border-memphis-dark bg-white p-3 shadow-memphis-sm"
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 border-t-2 border-memphis-dark bg-white p-4">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl border-2 border-memphis-dark bg-cream px-4 py-3 text-sm font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-memphis-yellow active:translate-y-0.5"
            >
              {text.reset}
            </button>
            <button
              type="button"
              onClick={modal.remove}
              className="rounded-xl border-2 border-memphis-dark bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0.5"
            >
              {text.close}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={filteredRecords.length === 0}
              className="ml-auto rounded-xl border-2 border-memphis-dark bg-memphis-blue px-4 py-3 text-sm font-bold text-white shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:bg-cyan-500 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {text.apply}
            </button>
          </div>
        </aside>
      </div>
    </Modal>
  );
});

export default LocalOfflineFilterModal;
