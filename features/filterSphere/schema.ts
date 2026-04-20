import { z } from 'zod';
import { CACHE_TYPE_VALUES, CONTAINER_TYPE_VALUES } from './types';

export const offlineCacheFilterSchema = z.object({
  code: z.string().describe('filter.field.code'),
  name: z.string().describe('filter.field.name'),
  ownerUsername: z.string().describe('filter.field.owner'),
  cacheType: z.enum(CACHE_TYPE_VALUES).describe('filter.field.cacheType'),
  containerType: z.enum(CONTAINER_TYPE_VALUES).describe('filter.field.containerType'),
  difficulty: z.number().describe('filter.field.difficulty'),
  terrain: z.number().describe('filter.field.terrain'),
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
