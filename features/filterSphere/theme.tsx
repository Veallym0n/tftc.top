import { createFilterTheme } from '@fn-sphere/filter';
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  OptionHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

const cx = (...values: Array<string | undefined>) => {
  return values.filter(Boolean).join(' ');
};

const ButtonPrimitive = ({
  className,
  type,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      type={type ?? 'button'}
      className={cx(
        'min-h-10 rounded-xl border-2 border-memphis-dark bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-memphis-sm transition-all hover:-translate-y-0.5 hover:bg-memphis-yellow active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
        className,
      )}
    />
  );
};

const InputPrimitive = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={cx(
        'min-h-10 min-w-[10rem] rounded-xl border-2 border-memphis-dark bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all focus:ring-4 focus:ring-memphis-pink/20 disabled:bg-slate-100',
        className,
      )}
    />
  );
};

const SelectPrimitive = ({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      {...props}
      className={cx(
        'min-h-10 min-w-[10rem] rounded-xl border-2 border-memphis-dark bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all focus:ring-4 focus:ring-memphis-blue/20 disabled:bg-slate-100',
        className,
      )}
    />
  );
};

const OptionPrimitive = ({
  className,
  ...props
}: OptionHTMLAttributes<HTMLOptionElement>) => {
  return <option {...props} className={cx('text-slate-800', className)} />;
};

export const filterSphereTheme = createFilterTheme({
  primitives: {
    button: ButtonPrimitive,
    input: InputPrimitive,
    select: SelectPrimitive,
    option: OptionPrimitive,
  },
});
