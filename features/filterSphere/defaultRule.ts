import { createFilterGroup, createSingleFilter } from '@fn-sphere/filter';
import { filterFnList } from './schema';

const defaultFieldPath = ['name'];

const createDefaultOfflineCacheFilter = () =>
  createSingleFilter({
    path: defaultFieldPath,
    name: filterFnList[0]?.name,
  });

export const createFlattenFilterGroup = () =>
  createFilterGroup({
    op: 'or',
    conditions: [
      createFilterGroup({
        op: 'and',
        conditions: [createDefaultOfflineCacheFilter()],
      }),
    ],
  });
