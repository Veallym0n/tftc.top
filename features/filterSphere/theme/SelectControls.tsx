import { type CSSProperties, type ReactNode, type SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../classNames';
import { usePopover, type PopoverPosition } from './usePopover';

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

// Portaled to <body>, so it sits above the modal (z-[2000]) and is not clipped
// by the modal's overflow-auto scroll containers. Position comes from usePopover.
const menuFrameClassName =
  'z-[2100] overflow-hidden rounded-xl border-2 border-memphis-dark bg-white shadow-memphis';

const menuListClassName = 'max-h-60 overflow-auto p-1';

const optionClassName =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-memphis-blue/10';

const optionSelectedClassName = 'bg-memphis-blue/15 font-bold';

const checkboxClassName =
  'inline-flex h-4 w-4 flex-none items-center justify-center rounded border-2 border-memphis-dark text-[0.65rem] font-black leading-none';

const menuStyle = (position: PopoverPosition): CSSProperties => ({
  position: 'fixed',
  top: position.top,
  left: position.left,
  minWidth: position.minWidth,
});

export const SingleSelect = <T,>({
  value,
  options = [],
  onChange,
  disabled,
  className,
}: SingleSelectProps<T>): ReactNode => {
  const { open, setOpen, position, triggerRef, menuRef } = usePopover();

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
    <div ref={triggerRef} className={cx('inline-block', className)}>
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

      {open &&
        !disabled &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className={menuFrameClassName}
            style={menuStyle(position)}
          >
            <ul role="listbox" className={menuListClassName}>
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
          </div>,
          document.body,
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
  const { open, setOpen, position, triggerRef, menuRef } = usePopover();

  const isSelected = (option: SelectOption<T>) =>
    value.some((selected) => selected === option.value);

  const toggle = (option: SelectOption<T>) => {
    const next = isSelected(option)
      ? value.filter((selected) => selected !== option.value)
      : [...value, option.value];
    onChange?.(next);
  };

  return (
    <div ref={triggerRef} className={cx('inline-block', className)}>
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

      {open &&
        !disabled &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className={menuFrameClassName}
            style={menuStyle(position)}
          >
            <ul
              role="listbox"
              aria-multiselectable
              className={menuListClassName}
            >
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
          </div>,
          document.body,
        )}
    </div>
  );
};
