import { useMemo } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useFilterSphere } from '@fn-sphere/filter';
import { Modal } from '../../../libs/common/Modal';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { useMapStore } from '../../../stores/useMapStore';
import { createFlattenFilterGroup } from '../defaultRule';
import { getFilterModalText, getFilterSphereLocaleText } from '../locale';
import { normalizeOfflineCache } from '../normalize';
import { filterFnList, offlineCacheFilterSchema } from '../schema';
import { useOfflineFilterRuleStore } from '../useOfflineFilterRuleStore';
import { FilterBuilderSection } from './FilterBuilderSection';
import { FilterPreviewPanel } from './FilterPreviewPanel';
import { modalClasses } from './constants';
import { useOfflineCaches } from './useOfflineCaches';

const FilterLabModal = NiceModal.create(() => {
  const modal = useModal();
  const lang = useLanguageStore((state) => state.lang);
  const setCaches = useMapStore((state) => state.setCaches);
  const setDrawerOpen = useMapStore((state) => state.setDrawerOpen);
  const showToast = useMapStore((state) => state.showToast);
  const ruleValue = useOfflineFilterRuleStore((state) => state.ruleValue);
  const setRuleValue = useOfflineFilterRuleStore((state) => state.setRuleValue);

  const localeText = useMemo(() => getFilterSphereLocaleText(lang), [lang]);
  const text = useMemo(() => getFilterModalText(lang), [lang]);
  const { offlineCaches, isLoading, errorMessage } = useOfflineCaches(
    text.noErrorDetail,
  );

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
    showToast(text.applyToast.replace('{count}', String(nextCaches.length)));
    modal.remove();
  };

  return (
    <Modal
      {...modalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title={text.title}
      footer={null}
    >
      <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden grid-rows-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(26rem,0.95fr)] lg:grid-rows-1">
        <FilterBuilderSection
          text={text}
          isLoading={isLoading}
          errorMessage={errorMessage}
          offlineCacheCount={offlineCaches.length}
          context={context}
        />

        <FilterPreviewPanel
          text={text}
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
    </Modal>
  );
});

export default FilterLabModal;
