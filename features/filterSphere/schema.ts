import { presetFilter, type FnSchema } from '@fn-sphere/filter';
import { z } from 'zod';
import { CACHE_TYPE_VALUES, CONTAINER_TYPE_VALUES } from './types';


const filterPriority = [
  'contains',
  'notContains',
  'startsWith',
  'notStartsWith',
];

export const filterFnList: FnSchema[] = presetFilter
  .filter((fn) => !['isEmpty', 'isNotEmpty'].includes(fn.name))
  .sort((a, b) => {
    const indexA = filterPriority.indexOf(a.name);
    const indexB = filterPriority.indexOf(b.name);
    return (
      (indexA === -1 ? Infinity : indexA) -
      (indexB === -1 ? Infinity : indexB)
    );
  });

export const CACHE_RATING_FILTER_INPUT = 'cacheRating';

const cacheRatingSchema = (description: string) => {
  return z
    .number()
    .min(1)
    .max(5)
    .multipleOf(0.5)
    .describe(description)
    .meta({
      filterInput: CACHE_RATING_FILTER_INPUT,
    });
};

export const offlineCacheFilterSchema = z.object({
  name: z.string().describe('名称'),
  ownerUsername: z.string().describe('拥有者'),
  cacheType: z.enum(CACHE_TYPE_VALUES).describe('藏点类型'),
  containerType: z.enum(CONTAINER_TYPE_VALUES).describe('容器类型'),
  difficulty: cacheRatingSchema('难度'),
  terrain: cacheRatingSchema('地形'),
  favoritePoints: z.number().describe('收藏分'),
  placedDate: z.date().describe('发布日期'),
  lastFoundDate: z.date().describe('最近发现日期'),
  code: z.string().describe('GC 编码'),
  latitude: z.number().describe('纬度'),
  longitude: z.number().describe('经度'),

  hasLastFound: z.boolean().describe('是否有最近发现'),
  isEventLike: z.boolean().describe('是否活动类'),
  isFTFLike: z.boolean().describe('是否像 FTF'),
});

export type OfflineCacheFilterSchema = z.infer<typeof offlineCacheFilterSchema>;
