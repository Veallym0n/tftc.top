import { zhCN } from '@fn-sphere/filter/locales';

const customZh = {
  'filter.field.code': 'GC 编码',
  'filter.field.name': '名称',
  'filter.field.owner': '拥有者',
  'filter.field.cacheType': '藏点类型',
  'filter.field.containerType': '容器类型',
  'filter.field.difficulty': '难度',
  'filter.field.terrain': '地形',
  'filter.field.latitude': '纬度',
  'filter.field.longitude': '经度',
  'filter.field.favoritePoints': '收藏分',
  'filter.field.placedDate': '发布日期',
  'filter.field.hasLastFound': '是否有最近发现',
  'filter.field.lastFoundDate': '最近发现日期',
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

const filterLocale = {
  ...zhCN,
  ...customZh,
} as const;

const modalText = {
  title: '离线过滤工作台',
  subtitle: '基于 IndexedDB 里的离线全库构建过滤规则，然后把结果一次性应用到地图。',
  loading: '正在加载离线缓存数据...',
  empty: '当前没有离线缓存数据。请先下载离线全量数据，再打开这个工具。',
  error: '加载离线缓存数据失败。',
  total: '离线总数',
  matched: '匹配结果',
  rules: '有效规则',
  previewTitle: '结果预览',
  tabBuilder: '规则',
  tabPreview: '预览',
  previewSummary: '当前匹配 {matched} / {total} 个离线藏点 · 有效规则 {valid}/{rules}',
  previewEmpty: '当前规则没有匹配到任何藏点。',
  reset: '重置规则',
  close: '关闭',
  apply: '应用到地图',
  applyToast: '已将 {count} 个离线藏点应用到地图',
  noErrorDetail: '未知错误',
} as const;

export const getFilterSphereLocaleText = () => {
  return (key: string) => {
    if (key in filterLocale) {
      return filterLocale[key as keyof typeof filterLocale];
    }
    return key;
  };
};

export const getFilterModalText = () => {
  return modalText;
};
