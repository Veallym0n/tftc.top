# filterSphere

The **Filter Lab** feature. A self-contained module that lets users build ad-hoc rules against the offline (IndexedDB) geocache dataset and push the matching set to the map. Built on top of [`@fn-sphere/filter`](https://www.npmjs.com/package/@fn-sphere/filter) + [Zod](https://zod.dev/).

## Filter Sphere references

- Docs site: https://lawvs.github.io/fn-sphere
- GitHub repo: https://github.com/lawvs/fn-sphere

## Architecture

```
IndexedDB (dbService)
        │  Geocache[]
        ▼
   normalize.ts ──► OfflineCacheFilterItem (flat, schema-shaped)
        │
        ▼
useFilterSphere(offlineCacheFilterSchema) ──► predicate
        │                                         ▲
        │                                         │ rule tree (FilterGroup)
        │                                         │
        ▼                                useOfflineFilterRuleStore (Zustand)
   filteredRecords
        │
        ├──► FilterPreviewPanel  (preview)
        └──► useMapStore.setCaches  (on Apply)
```

Three layers:

1. **Data** (`schema.ts`, `types.ts`, `normalize.ts`) — Zod schema describing the filterable shape, plus a normalizer that flattens raw `Geocache` rows (numeric type/container ids, ISO date strings) into that shape.
2. **State** (`useOfflineFilterRuleStore.ts`) — Zustand store that survives modal close/open by holding the active `FilterGroup`.
3. **UI** (`FilterLabModal/`, `theme/`, `locale.ts`) — `NiceModal` entry that mounts FilterSphere's `FilterBuilder` with a Memphis-styled theme and a Chinese locale. Renders a live preview list and an Apply button.

## Custom integrations with Filter Sphere

- **Theming** — `theme/index.tsx` builds a `filterSphereTheme` via `createFilterTheme`, supplying app-styled `button` / `input` / `select` / `option` primitives.
- **Flatten layout** — `theme/templates.tsx` overrides the `SingleFilter`, `FilterGroupContainer`, and `RuleJoiner` templates so every rule renders as a single row with inline `And` / `Or` / `✕` controls (no nested group chrome). The initial rule tree comes from `createFlattenFilterGroup` in `defaultRule.ts`, passed to `useFilterSphere` as `defaultRule`.
- **Custom input widget** — Difficulty/Terrain are tagged in the schema with `meta.filterInput = CACHE_RATING_FILTER_INPUT`. The `cacheRatingInputView` (a `DataInputViewSpec`) matches that marker and renders a half-star rating control instead of the default number input.
- **Localization** — `locale.ts` layers app-specific strings on top of the library's built-in `zhCN` locale and feeds them to `useFilterSphere` via `getLocaleText`.

## Extending

**Add a filterable field** — extend `offlineCacheFilterSchema` (`schema.ts`) with a Chinese `.describe()` label, add the property to `OfflineCacheFilterItem` (`types.ts`), and populate it in `normalizeOfflineCache` (`normalize.ts`). Add a `locale.ts` entry only when introducing a new enum value.

**Add a custom input widget** — tag the field with a unique `meta.filterInput` marker, implement a `DataInputViewSpec` whose `match` checks for that marker (see `theme/RatingInput.tsx`), and register it in `dataInputViews` of `filterSphereTheme`.
