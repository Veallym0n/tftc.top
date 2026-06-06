import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Geocache } from '../types';
import { cacheSearchService } from '../services/cacheSearchService';
import { eventService } from '../services/eventService';

export interface UseCacheSearchResult {
  /** Current search query (for controlled input) */
  query: string;
  setQuery: (q: string) => void;
  /** Whether the search bar is visible */
  isOpen: boolean;
  /** Open search bar (also subscribes to OPEN_SEARCH event) */
  openSearch: () => void;
  /** Close and reset */
  closeSearch: () => void;
  /** Caches to display on the map (filtered when query is non-empty, full list otherwise) */
  displayCaches: Geocache[];
  /** True when a non-empty query is active */
  isFiltering: boolean;
  /** Number of matched caches (null when not filtering) */
  resultCount: number | null;
  /** Whether a global (IndexedDB) search is in progress */
  isGlobalSearching: boolean;
  /** Trigger a global IndexedDB search with the current query */
  runGlobalSearch: () => void;
}

const DEBOUNCE_MS = 500;

export function useCacheSearch(caches: Geocache[]): UseCacheSearchResult {
  const [query, setQuery] = useState('');
  /** Debounced query — only updates 500ms after the user stops typing */
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [globalResults, setGlobalResults] = useState<Geocache[] | null>(null);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce query -> debouncedQuery
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    // query intentionally kept — filter persists after closing the bar
  }, []);

  // Reset global results when debounced query changes
  useEffect(() => { setGlobalResults(null); }, [debouncedQuery]);

  // Listen for the OPEN_SEARCH event
  useEffect(() => {
    eventService.on('OPEN_SEARCH', openSearch);
    return () => eventService.off('OPEN_SEARCH', openSearch);
  }, [openSearch]);

  const runGlobalSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) return;
    setIsGlobalSearching(true);
    try {
      const results = await cacheSearchService.searchGlobal(debouncedQuery);
      setGlobalResults(results);
    } finally {
      setIsGlobalSearching(false);
    }
  }, [debouncedQuery]);

  // Filter is active as long as debouncedQuery is non-empty (bar open or not)
  const isFiltering = debouncedQuery.trim().length > 0;

  const displayCaches = useMemo(() => {
    if (globalResults !== null) return globalResults;
    if (!isFiltering) return caches;
    return cacheSearchService.search(caches, debouncedQuery);
  }, [caches, debouncedQuery, isFiltering, globalResults]);

  const resultCount = isFiltering ? displayCaches.length : null;

  return { query, setQuery, isOpen, openSearch, closeSearch, displayCaches, isFiltering, resultCount, isGlobalSearching, runGlobalSearch };
}
