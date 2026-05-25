import './filterBuilder.css';
import { createFilterTheme } from '@fn-sphere/filter';
import { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { cacheRatingInputView } from './RatingInput';
import { MultiSelect, SingleSelect } from './SelectControls';
import { flattenTemplates } from './templates';

const cx = (...values: Array<string | undefined>) => {
  return values.filter(Boolean).join(' ');
};

const AppButton = ({
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

const AppInput = ({
  className,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onChange?: (value: string) => void;
}) => {
  return (
    <input
      {...props}
      onChange={(event) => onChange?.(event.target.value)}
      className={cx(
        'min-h-10 min-w-[10rem] rounded-xl border-2 border-memphis-dark bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all focus:ring-4 focus:ring-memphis-pink/20 disabled:bg-slate-100',
        className,
      )}
    />
  );
};

export const filterSphereTheme = createFilterTheme({
  dataInputViews: [cacheRatingInputView],
  components: {
    Button: AppButton,
    Input: AppInput,
    Select: SingleSelect,
    MultipleSelect: MultiSelect,
  },
  templates: flattenTemplates,
});
