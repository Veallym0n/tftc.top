import { useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import { useDismissable } from './useDismissable';

const cx = (...values: Array<string | false | undefined>) => {
  return values.filter(Boolean).join(' ');
};

type SelectOption<T> = { value: T; label: string };

// Structural mirror of the (non-exported) library types so our components are
// assignable to `components.Select` / `components.MultipleSelect`. The native
// `<select>`-only attributes are accepted but unused; only `disabled` and
// `className` are honoured.
type SingleSelectProps<T> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange' | 'children' | 'multiple'
> & {
  value?: T | undefined;
  options?: SelectOption<T>[] | undefined;
  onChange?: (value: T) => void;
};

type MultiSelectProps<T> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange' | 'children' | 'multiple'
> & {
  value?: T[] | undefined;
  options?: SelectOption<T>[] | undefined;
  onChange?: (value: T[]) => void;
};

const triggerClassName =
  'inline-flex min-h-10 min-w-[10rem] items-center justify-between rounded-xl border-2 border-memphis-dark bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all hover:bg-memphis-yellow focus:ring-4 focus:ring-memphis-blue/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

const menuClassName =
  'absolute left-0 top-[calc(100%+0.375rem)] z-50 max-h-60 min-w-full overflow-auto rounded-xl border-2 border-memphis-dark bg-white p-1 shadow-memphis';

const optionClassName =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-memphis-blue/10';

const optionSelectedClassName = 'bg-memphis-blue/15 font-bold';

const checkboxClassName =
  'inline-flex h-4 w-4 flex-none items-center justify-center rounded border-2 border-memphis-dark text-[0.65rem] font-black leading-none';

export const SingleSelect = <T,>({
  value,
  options = [],
  onChange,
  disabled,
  className,
}: SingleSelectProps<T>): ReactNode => {
  const [open, setOpen] = useState(false);
  const containerRef = useDismissable<HTMLDivElement>(open, () =>
    setOpen(false),
  );

  // Map by array position via strict-equality lookup; never stringify values
  // (they may be FilterField / fn-schema objects compared by reference).
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption =
    selectedIndex === -1 ? undefined : options[selectedIndex];

  const handleSelect = (option: SelectOption<T>) => {
    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cx('relative inline-block', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClassName}
      >
        <span className={cx('truncate', !selectedOption && 'text-slate-400')}>
          {selectedOption ? selectedOption.label : '—'}
        </span>
        <span aria-hidden className="ml-2 text-xs">
          ▾
        </span>
      </button>

      {open && !disabled && (
        <ul role="listbox" className={menuClassName}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li key={index} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cx(
                    optionClassName,
                    isSelected && optionSelectedClassName,
                  )}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const MultiSelect = <T,>({
  value = [],
  options = [],
  onChange,
  disabled,
  className,
}: MultiSelectProps<T>): ReactNode => {
  const [open, setOpen] = useState(false);
  const containerRef = useDismissable<HTMLDivElement>(open, () =>
    setOpen(false),
  );

  const isSelected = (option: SelectOption<T>) =>
    value.some((selected) => selected === option.value);

  const toggle = (option: SelectOption<T>) => {
    const next = isSelected(option)
      ? value.filter((selected) => selected !== option.value)
      : [...value, option.value];
    onChange?.(next);
  };

  return (
    <div ref={containerRef} className={cx('relative inline-block', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClassName}
      >
        <span className="tabular-nums">
          {value.length} / {options.length}
        </span>
        <span aria-hidden className="ml-2 text-xs">
          ▾
        </span>
      </button>

      {open && !disabled && (
        <ul role="listbox" aria-multiselectable className={menuClassName}>
          {options.map((option, index) => {
            const checked = isSelected(option);
            return (
              <li key={index} role="option" aria-selected={checked}>
                <button
                  type="button"
                  onClick={() => toggle(option)}
                  className={cx(
                    optionClassName,
                    checked && optionSelectedClassName,
                  )}
                >
                  <span className={checkboxClassName} aria-hidden>
                    {checked ? '✓' : ''}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
