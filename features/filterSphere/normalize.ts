import { Geocache } from '../../types';
import {
  CacheTypeValue,
  ContainerTypeValue,
  OfflineCacheFilterItem,
  OfflineCacheFilterRecord,
} from './types';

const CACHE_TYPE_MAP: Record<number, CacheTypeValue> = {
  2: 'traditional',
  3: 'multi',
  4: 'virtual',
  5: 'letterbox',
  6: 'event',
  8: 'mystery',
  11: 'webcam',
  13: 'cito',
  66: 'wherigo',
  69: 'celebration',
  137: 'earth',
};

const CONTAINER_TYPE_MAP: Record<number, ContainerTypeValue> = {
  1: 'unknown',
  2: 'micro',
  3: 'regular',
  4: 'large',
  5: 'virtual',
  6: 'other',
  8: 'small',
};

const parseDateParts = (value: string | undefined) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return { year: 0, month: 0, day: 0 };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const normalizeOfflineCache = (
  cache: Geocache,
): OfflineCacheFilterItem => {
  const placed = parseDateParts(cache.placedDate);
  const lastFound = parseDateParts(cache.lastFoundDate);
  const hasLastFound = lastFound.year > 0;

  return {
    code: cache.code ?? '',
    name: cache.name ?? '',
    ownerUsername: cache.ownerUsername ?? '',
    cacheType: CACHE_TYPE_MAP[cache.geocacheType] ?? 'other',
    containerType: CONTAINER_TYPE_MAP[cache.containerType] ?? 'other',
    difficulty: toFiniteNumber(cache.difficulty),
    terrain: toFiniteNumber(cache.terrain),
    favoritePoints: toFiniteNumber(cache.favoritePoints),
    placedYear: placed.year,
    placedMonth: placed.month,
    placedDay: placed.day,
    hasLastFound,
    lastFoundYear: lastFound.year,
    isEventLike: cache.geocacheType === 6 || cache.geocacheType === 13 || cache.geocacheType === 69,
    isFTFLike: !hasLastFound || lastFound.year <= 1970,
  };
};

export const toOfflineCacheFilterRecord = (
  cache: Geocache,
): OfflineCacheFilterRecord => ({
  cache,
  filterItem: normalizeOfflineCache(cache),
});
