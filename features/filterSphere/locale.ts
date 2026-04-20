import { enUS, zhCN } from '@fn-sphere/filter/locales';
import { Language } from '../../utils/i18n';

const customEn = {
  'filter.field.code': 'GC Code',
  'filter.field.name': 'Name',
  'filter.field.owner': 'Owner',
  'filter.field.cacheType': 'Cache Type',
  'filter.field.containerType': 'Container',
  'filter.field.difficulty': 'Difficulty',
  'filter.field.terrain': 'Terrain',
  'filter.field.favoritePoints': 'Favorite Points',
  'filter.field.placedYear': 'Placed Year',
  'filter.field.placedMonth': 'Placed Month',
  'filter.field.placedDay': 'Placed Day',
  'filter.field.hasLastFound': 'Has Last Found',
  'filter.field.lastFoundYear': 'Last Found Year',
  'filter.field.isEventLike': 'Event-like',
  'filter.field.isFTFLike': 'FTF-like',
  traditional: 'Traditional',
  multi: 'Multi',
  mystery: 'Mystery',
  virtual: 'Virtual',
  letterbox: 'Letterbox',
  event: 'Event',
  cito: 'CITO',
  wherigo: 'Wherigo',
  celebration: 'Celebration',
  earth: 'Earth',
  webcam: 'Webcam',
  other: 'Other',
  unknown: 'Unknown',
  micro: 'Micro',
  regular: 'Regular',
  large: 'Large',
  small: 'Small',
};

const customZh = {
  'filter.field.code': 'GC 编码',
  'filter.field.name': '名称',
  'filter.field.owner': '拥有者',
  'filter.field.cacheType': '藏点类型',
  'filter.field.containerType': '容器类型',
  'filter.field.difficulty': '难度',
  'filter.field.terrain': '地形',
  'filter.field.favoritePoints': '收藏分',
  'filter.field.placedYear': '发布时间年份',
  'filter.field.placedMonth': '发布时间月份',
  'filter.field.placedDay': '发布时间日',
  'filter.field.hasLastFound': '是否有最近发现',
  'filter.field.lastFoundYear': '最近发现年份',
  'filter.field.isEventLike': '是否活动类',
  'filter.field.isFTFLike': '是否像 FTF',
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

const filterLocaleByLanguage = {
  en: {
    ...enUS,
    ...customEn,
  },
  zh: {
    ...zhCN,
    ...customZh,
  },
} as const;

const modalTextByLanguage = {
  en: {
    title: 'Offline Filter Lab',
    subtitle: 'Build local rules against the IndexedDB offline cache, then apply the result to the map.',
    sourceLabel: 'Source',
    sourceValue: 'Offline cache only',
    loading: 'Loading offline cache data...',
    empty: 'No offline cache data found. Download the offline dataset first, then reopen this tool.',
    error: 'Failed to load offline cache data.',
    total: 'Offline items',
    matched: 'Matched',
    rules: 'Valid rules',
    previewTitle: 'Preview',
    previewSummary:
      '{matched} matched from {total} offline caches · {valid}/{rules} valid rules',
    previewEmpty: 'No caches match the current rules.',
    reset: 'Reset Rules',
    close: 'Close',
    apply: 'Apply To Map',
    applyToast: '{count} offline caches applied to the map',
    noErrorDetail: 'Unknown error',
  },
  zh: {
    title: '离线过滤工作台',
    subtitle: '基于 IndexedDB 里的离线全库构建过滤规则，然后把结果一次性应用到地图。',
    sourceLabel: '数据源',
    sourceValue: '仅离线缓存',
    loading: '正在加载离线缓存数据...',
    empty: '当前没有离线缓存数据。请先下载离线全量数据，再打开这个工具。',
    error: '加载离线缓存数据失败。',
    total: '离线总数',
    matched: '匹配结果',
    rules: '有效规则',
    previewTitle: '结果预览',
    previewSummary: '当前匹配 {matched} / {total} 个离线藏点 · 有效规则 {valid}/{rules}',
    previewEmpty: '当前规则没有匹配到任何藏点。',
    reset: '重置规则',
    close: '关闭',
    apply: '应用到地图',
    applyToast: '已将 {count} 个离线藏点应用到地图',
    noErrorDetail: '未知错误',
  },
} as const;

export const getFilterSphereLocaleText = (lang: Language) => {
  const dictionary = filterLocaleByLanguage[lang];

  return (key: string) => {
    if (key in dictionary) {
      return dictionary[key as keyof typeof dictionary];
    }
    return key;
  };
};

export const getFilterModalText = (lang: Language) => {
  return modalTextByLanguage[lang];
};
