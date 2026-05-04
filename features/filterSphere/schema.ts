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
  name: z.string().describe('filter.field.name'),
  ownerUsername: z.string().describe('filter.field.owner'),
  cacheType: z.enum(CACHE_TYPE_VALUES).describe('filter.field.cacheType'),
  containerType: z.enum(CONTAINER_TYPE_VALUES).describe('filter.field.containerType'),
  difficulty: cacheRatingSchema('filter.field.difficulty'),
  terrain: cacheRatingSchema('filter.field.terrain'),
  favoritePoints: z.number().describe('filter.field.favoritePoints'),
  placedDate: z.date().describe('filter.field.placedDate'),
  lastFoundDate: z.date().describe('filter.field.lastFoundDate'),
  code: z.string().describe('filter.field.code'),
  latitude: z.number().describe('filter.field.latitude'),
  longitude: z.number().describe('filter.field.longitude'),

  hasLastFound: z.boolean().describe('filter.field.hasLastFound'),
  isEventLike: z.boolean().describe('filter.field.isEventLike'),
  isFTFLike: z.boolean().describe('filter.field.isFTFLike'),
});

export type OfflineCacheFilterSchema = z.infer<typeof offlineCacheFilterSchema>;
