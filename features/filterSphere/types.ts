import { Geocache } from '../../types';

export const CACHE_TYPE_VALUES = [
  'traditional',
  'multi',
  'mystery',
  'virtual',
  'letterbox',
  'event',
  'cito',
  'wherigo',
  'celebration',
  'earth',
  'webcam',
  'other',
] as const;

export const CONTAINER_TYPE_VALUES = [
  'unknown',
  'micro',
  'regular',
  'large',
  'virtual',
  'other',
  'small',
] as const;

export type CacheTypeValue = (typeof CACHE_TYPE_VALUES)[number];
export type ContainerTypeValue = (typeof CONTAINER_TYPE_VALUES)[number];

export interface OfflineCacheFilterItem {
  code: string;
  name: string;
  ownerUsername: string;
  cacheType: CacheTypeValue;
  containerType: ContainerTypeValue;
  difficulty: number;
  terrain: number;
  favoritePoints: number;
  placedYear: number;
  placedMonth: number;
  placedDay: number;
  hasLastFound: boolean;
  lastFoundYear: number;
  isEventLike: boolean;
  isFTFLike: boolean;
}

export interface OfflineCacheFilterRecord {
  cache: Geocache;
  filterItem: OfflineCacheFilterItem;
}
