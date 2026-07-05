import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cacheService } from '../services/cacheService';
import type { Geocache } from '../types';

/* ================================================================
 * useSearch — 地图搜索/过滤状态机
 * 本地即时过滤 + 全局 IndexedDB 搜索
 * ================================================================ */

export function useSearch(caches: Geocache[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalResults, setGlobalResults] = useState<Geocache[] | null>(null);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => { setGlobalResults(null); }, [debouncedQuery]);

  const isFiltering = debouncedQuery.trim().length > 0;

  const displayCaches = useMemo(() => {
    if (globalResults !== null) return globalResults;
    if (!isFiltering) return caches;
    return cacheService.searchLocal(caches, debouncedQuery);
  }, [caches, debouncedQuery, isFiltering, globalResults]);

  const resultCount = isFiltering ? displayCaches.length : null;

  const runGlobalSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) return;
    setIsGlobalSearching(true);
    try {
      const results = await cacheService.searchGlobal(debouncedQuery);
      setGlobalResults(results);
    } finally {
      setIsGlobalSearching(false);
    }
  }, [debouncedQuery]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return {
    searchQuery, setSearchQuery,
    searchOpen, openSearch, closeSearch,
    displayCaches, resultCount,
    runGlobalSearch, isGlobalSearching,
  };
}
