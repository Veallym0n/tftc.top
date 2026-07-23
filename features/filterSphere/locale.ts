import { zhCN } from '@fn-sphere/filter/locales';

const customZh = {
  traditional: '传统',
  multi: '多步',
  mystery: '谜题',
  virtual: '虚拟',
  letterbox: '信箱',
  event: '活动',
  cito: 'CITO',
  wherigo: 'Wherigo',
  celebration: 'Celebration',
  earth: '地球',
  webcam: 'Webcam',
  other: '其他',
  unknown: '未知',
  micro: 'Micro',
  regular: 'Regular',
  large: 'Large',
  small: 'Small',
};

const filterLocale = {
  ...zhCN,
  ...customZh,
} as const;

export const getFilterSphereLocaleText = () => {
  return (key: string) => {
    if (key in filterLocale) {
      return filterLocale[key as keyof typeof filterLocale];
    }
    return key;
  };
};
