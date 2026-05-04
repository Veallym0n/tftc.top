import { z } from 'zod';
import { CACHE_TYPE_VALUES, CONTAINER_TYPE_VALUES } from './types';

export const CACHE_RATING_FILTER_INPUT = 'cacheRating';

const cacheRatingSchema = (description: string) => {
  return z.number().describe(description).meta({
    filterInput: CACHE_RATING_FILTER_INPUT,
    min: 1,
    max: 5,
    step: 0.5,
  });
};

export const offlineCacheFilterSchema = z.object({
  code: z.string().describe('filter.field.code'),
  name: z.string().describe('filter.field.name'),
  ownerUsername: z.string().describe('filter.field.owner'),
  cacheType: z.enum(CACHE_TYPE_VALUES).describe('filter.field.cacheType'),
  containerType: z.enum(CONTAINER_TYPE_VALUES).describe('filter.field.containerType'),
  difficulty: cacheRatingSchema('filter.field.difficulty'),
  terrain: cacheRatingSchema('filter.field.terrain'),
  latitude: z.number().describe('filter.field.latitude'),
  longitude: z.number().describe('filter.field.longitude'),
  favoritePoints: z.number().describe('filter.field.favoritePoints'),
  placedYear: z.number().describe('filter.field.placedYear'),
  placedMonth: z.number().describe('filter.field.placedMonth'),
  placedDay: z.number().describe('filter.field.placedDay'),
  hasLastFound: z.boolean().describe('filter.field.hasLastFound'),
  lastFoundYear: z.number().describe('filter.field.lastFoundYear'),
  isEventLike: z.boolean().describe('filter.field.isEventLike'),
  isFTFLike: z.boolean().describe('filter.field.isFTFLike'),
});

export type OfflineCacheFilterSchema = z.infer<typeof offlineCacheFilterSchema>;
