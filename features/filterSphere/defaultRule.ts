import { createFilterGroup, createSingleFilter } from '@fn-sphere/filter';

export const createFlattenFilterGroup = () =>
  createFilterGroup({
    op: 'or',
    conditions: [
      createFilterGroup({
        op: 'and',
        conditions: [createSingleFilter()],
      }),
    ],
  });
