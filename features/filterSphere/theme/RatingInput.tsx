import { useRef, useState, type KeyboardEvent } from 'react';
import { type DataInputViewSpec } from '@fn-sphere/filter';
import { z } from 'zod';
import { type $ZodTuple, type $ZodType, type $ZodTypes } from 'zod/v4/core';
import { CACHE_RATING_FILTER_INPUT } from '../schema';

const RATING_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const cx = (...values: Array<string | false | undefined>) => {
  return values.filter(Boolean).join(' ');
};

const toRatingValue = (value: unknown) => {
  if (typeof value !== 'number') {
    return undefined;
  }
  return RATING_VALUES.find((ratingValue) => ratingValue === value);
};

const isSingleNumberArgument = (parameterSchemas: $ZodTuple) => {
  const items = parameterSchemas._zod.def.items;
  if (items.length !== 1) {
    return false;
  }

  const onlyItem = items[0] as $ZodTypes | undefined;
  return onlyItem?._zod.def.type === 'number';
};

const isCacheRatingField = (fieldSchema?: $ZodType) => {
  if (!fieldSchema) {
    return false;
  }

  const meta = z.globalRegistry.get(fieldSchema);
  return meta?.filterInput === CACHE_RATING_FILTER_INPUT;
};

interface RatingInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export const RatingInput = ({ value, onChange }: RatingInputProps) => {
  const [hoveredValue, setHoveredValue] = useState<number | undefined>();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedValue = toRatingValue(value);
  const displayValue = hoveredValue ?? selectedValue ?? 0;
  const activeValue = selectedValue ?? RATING_VALUES[0];

  const selectByKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = RATING_VALUES.findIndex(
      (ratingValue) => ratingValue === activeValue,
    );
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextIndex = Math.min(RATING_VALUES.length - 1, currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = RATING_VALUES.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextValue = RATING_VALUES[nextIndex];
    onChange(nextValue);
    buttonRefs.current[nextIndex]?.focus();
  };

  const renderHitArea = (ratingValue: number, className: string) => {
    const valueIndex = RATING_VALUES.findIndex((item) => item === ratingValue);

    return (
      <button
        key={ratingValue}
        ref={(node) => {
          buttonRefs.current[valueIndex] = node;
        }}
        type="button"
        role="radio"
        aria-checked={selectedValue === ratingValue}
        aria-label={`${ratingValue} stars`}
        tabIndex={activeValue === ratingValue ? 0 : -1}
        className={cx(
          'absolute top-0 h-full outline-none focus-visible:ring-4 focus-visible:ring-memphis-pink/25',
          className,
        )}
        onClick={() => onChange(ratingValue)}
        onBlur={() => setHoveredValue(undefined)}
        onMouseEnter={() => setHoveredValue(ratingValue)}
        onKeyDown={selectByKeyboard}
      />
    );
  };

  return (
    <div
      role="radiogroup"
      aria-label="Cache rating"
      className="inline-flex min-h-10 items-center rounded-xl border-2 border-memphis-dark bg-white px-3 py-1.5 shadow-memphis-sm"
      onMouseLeave={() => setHoveredValue(undefined)}
    >
      <div className="flex items-center gap-0.5">
        {STAR_VALUES.map((starValue) => {
          const fillPercent =
            displayValue >= starValue
              ? 100
              : displayValue >= starValue - 0.5
                ? 50
                : 0;

          return (
            <span
              key={starValue}
              className="relative inline-flex h-8 w-7 items-center justify-center text-2xl leading-none"
            >
              <span className="pointer-events-none text-slate-200">★</span>
              <span
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 overflow-hidden text-memphis-yellow drop-shadow-[1px_1px_0_rgba(30,41,59,0.65)]"
                style={{ width: `${fillPercent}%` }}
              >
                <span className="inline-flex h-8 w-7 items-center justify-center">
                  ★
                </span>
              </span>

              {starValue === 1
                ? renderHitArea(1, 'left-0 w-full rounded-lg')
                : (
                  <>
                    {renderHitArea(starValue - 0.5, 'left-0 w-1/2 rounded-l-lg')}
                    {renderHitArea(starValue, 'right-0 w-1/2 rounded-r-lg')}
                  </>
                )}
            </span>
          );
        })}
      </div>

      <span className="ml-2 min-w-8 rounded-lg bg-cream px-2 py-1 text-center text-xs font-black tabular-nums text-slate-700">
        {selectedValue?.toFixed(1) ?? '--'}
      </span>
    </div>
  );
};

export const cacheRatingInputView: DataInputViewSpec = {
  name: 'cache rating',
  match: (parameterSchemas, fieldSchema) => {
    return (
      isSingleNumberArgument(parameterSchemas) &&
      isCacheRatingField(fieldSchema)
    );
  },
  view: function CacheRatingInputView({ rule, updateInput }) {
    return (
      <RatingInput
        value={rule.args[0] as number | undefined}
        onChange={(nextValue) => updateInput(nextValue)}
      />
    );
  },
};
