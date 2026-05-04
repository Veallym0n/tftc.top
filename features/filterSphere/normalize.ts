import { Geocache } from "../../types";
import {
  CacheTypeValue,
  ContainerTypeValue,
  OfflineCacheFilterItem,
} from "./types";

const CACHE_TYPE_MAP: Record<number, CacheTypeValue> = {
  2: "traditional",
  3: "multi",
  4: "virtual",
  5: "letterbox",
  6: "event",
  8: "mystery",
  11: "webcam",
  13: "cito",
  66: "wherigo",
  69: "celebration",
  137: "earth",
};

const CONTAINER_TYPE_MAP: Record<number, ContainerTypeValue> = {
  1: "unknown",
  2: "micro",
  3: "regular",
  4: "large",
  5: "virtual",
  6: "other",
  8: "small",
};

const makeUtcDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(year);
  return date;
};

const MISSING_PLACED_DATE = new Date(0);
const MISSING_LAST_FOUND_DATE = new Date(0);

const parseCacheDate = (value: string | undefined) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = makeUtcDate(year, month, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date;
};

export const normalizeOfflineCache = (
  cache: Geocache,
): OfflineCacheFilterItem => {
  const parsedPlaced = parseCacheDate(cache.placedDate);
  const parsedLastFound = parseCacheDate(cache.lastFoundDate);
  const placedDate = parsedPlaced ?? MISSING_PLACED_DATE;
  const lastFoundDate = parsedLastFound ?? MISSING_LAST_FOUND_DATE;
  const hasLastFound = parsedLastFound !== undefined;

  return {
    code: cache.code ?? "",
    name: cache.name ?? "",
    ownerUsername: cache.ownerUsername ?? "",
    cacheType: CACHE_TYPE_MAP[cache.geocacheType] ?? "other",
    containerType: CONTAINER_TYPE_MAP[cache.containerType] ?? "other",
    difficulty: cache.difficulty,
    terrain: cache.terrain,
    latitude: cache.latitude,
    longitude: cache.longitude,
    favoritePoints: cache.favoritePoints,
    placedDate,
    hasLastFound,
    lastFoundDate,
    isEventLike:
      cache.geocacheType === 6 ||
      cache.geocacheType === 13 ||
      cache.geocacheType === 69,
    isFTFLike: !hasLastFound || lastFoundDate.getUTCFullYear() <= 1970,
  };
};
