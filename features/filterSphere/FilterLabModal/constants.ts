import { defaultModalClasses } from '../../../components/modals/Modal';

export const modalClasses = {
  ...defaultModalClasses,
  contentClassName:
    'relative flex h-[min(44rem,88vh)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-2 border-memphis-dark bg-white shadow-memphis-lg animate-fade-in',
  bodyClassName: 'flex min-h-0 flex-1 overflow-hidden p-0',
};
