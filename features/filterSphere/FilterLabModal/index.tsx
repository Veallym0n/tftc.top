import { useMemo, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useFilterSphere } from '@fn-sphere/filter';
import { Modal } from '../../../components/modals/Modal';
import { useAppStore } from '../../../stores/useAppStore';
import { useCacheStore } from '../../../stores/useCacheStore';
import { createFlattenFilterGroup } from '../defaultRule';
import { getFilterSphereLocaleText } from '../locale';
import { normalizeOfflineCache } from '../normalize';
import { filterFnList, offlineCacheFilterSchema } from '../schema';
import { useOfflineFilterRuleStore } from '../useOfflineFilterRuleStore';
import { cx } from '../classNames';
import { FilterBuilderSection } from './FilterBuilderSection';
import { FilterModalActions } from './FilterModalActions';
import { FilterPreviewPanel } from './FilterPreviewPanel';
import { modalClasses } from './constants';
import { useOfflineCaches } from './useOfflineCaches';

const FilterLabModal = NiceModal.create(() => {
  const modal = useModal();
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const setCaches = useCacheStore((state) => state.setCaches);
  const setDrawerOpen = useAppStore((state) => state.setDrawerOpen);
  const showToast = useAppStore((state) => state.showToast);
  const ruleValue = useOfflineFilterRuleStore((state) => state.ruleValue);
  const setRuleValue = useOfflineFilterRuleStore((state) => state.setRuleValue);

  const localeText = useMemo(() => getFilterSphereLocaleText(), []);
  const { offlineCaches, isLoading, errorMessage } =
    useOfflineCaches('未知错误');

  const { predicate, totalRuleCount, validRuleCount, reset, context } =
    useFilterSphere({
      schema: offlineCacheFilterSchema,
      filterFnList,
      getLocaleText: localeText,
      ruleValue,
      defaultRule: createFlattenFilterGroup,
      onRuleChange: ({ filterRule }) => {
        setRuleValue(filterRule);
      },
    });

  const records = useMemo(() => {
    return offlineCaches.map((cache) => ({
      cache,
      filterItem: normalizeOfflineCache(cache),
    }));
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
    showToast(`已将 ${nextCaches.length} 个离线藏点应用到地图`);
    modal.remove();
  };

  return (
    <Modal
      {...modalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title="离线过滤工作台"
      footer={null}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Tab bar — narrow only */}
        <div
          role="tablist"
          className="flex gap-2 border-b-2 border-memphis-dark bg-white px-3 py-2 lg:hidden"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'builder'}
            onClick={() => setActiveTab('builder')}
            className={cx(
              'flex-1 rounded-lg border-2 border-memphis-dark px-3 py-1.5 text-sm font-bold transition-colors',
              activeTab === 'builder'
                ? 'bg-memphis-yellow text-slate-900'
                : 'bg-white text-slate-500',
            )}
          >
            规则
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            className={cx(
              'flex-1 rounded-lg border-2 border-memphis-dark px-3 py-1.5 text-sm font-bold transition-colors',
              activeTab === 'preview'
                ? 'bg-memphis-yellow text-slate-900'
                : 'bg-white text-slate-500',
            )}
          >
            预览
            <span className="ml-1 rounded-md bg-memphis-dark/10 px-1.5 py-0.5 text-xs tabular-nums">
              {filteredRecords.length.toLocaleString()}
            </span>
          </button>
        </div>

        {/* Content region: active panel on narrow, two columns at lg */}
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-1 overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(26rem,0.95fr)]">
          <div
            className={cx(
              'min-h-0 min-w-0 overflow-hidden',
              activeTab === 'builder' ? 'grid' : 'hidden',
              'lg:grid',
            )}
          >
            <FilterBuilderSection
              isLoading={isLoading}
              errorMessage={errorMessage}
              offlineCacheCount={offlineCaches.length}
              context={context}
            />
          </div>

          <div
            className={cx(
              'min-h-0 min-w-0 overflow-hidden',
              activeTab === 'preview' ? 'grid' : 'hidden',
              'lg:grid',
            )}
          >
            <FilterPreviewPanel
              localeText={localeText}
              filteredRecords={filteredRecords}
              previewRecords={previewRecords}
              offlineCacheCount={offlineCaches.length}
              isLoading={isLoading}
              validRuleCount={validRuleCount}
              totalRuleCount={totalRuleCount}
              onReset={() => reset()}
              onClose={modal.remove}
              onApply={handleApply}
            />
          </div>
        </div>

        {/* Pinned action footer — narrow only */}
        <div className="lg:hidden">
          <FilterModalActions
            isApplyDisabled={filteredRecords.length === 0}
            showReset={false}
            onReset={() => reset()}
            onClose={modal.remove}
            onApply={handleApply}
          />
        </div>
      </div>
    </Modal>
  );
});

export default FilterLabModal;
