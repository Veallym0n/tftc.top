
export type Language = 'en' | 'zh';

type Dictionary = {
    [key: string]: string;
};

const en: Dictionary = {
    // Tabs
    'tab.data': 'Data',
    'tab.tools': 'Tools',
    'tab.settings': 'Settings',
    'tab.links': 'Links',
    'tab.about': 'About',

    // Tools
    'tools.title': 'Utilities',
    'tools.smart.title': 'Smart Coordinate Tool',
    'tools.smart.desc': 'Convert coordinates & Launch Maps',
    'tools.search.title': 'Search Cache',
    'tools.search.desc': 'Find offline cache by GC Code',
    
    // Smart Tool
    'smart.title': 'Smart Coordinates',
    'smart.input.label': 'Input Coordinates',
    'smart.input.placeholder': 'Paste here... e.g.\nN 40 04.753 E 116 18.334\n40.0792, 116.3055',
    'smart.hint': 'Supports: DD, DMM, DMS (with or without N/S/E/W)',
    'smart.valid': 'Valid Coordinates Detected',
    'smart.waiting': 'Waiting for input...',
    'smart.btn.invalid': 'Enter valid coordinates',
    'smart.btn.amap': 'Amap',
    'smart.btn.baidu': 'Baidu Map',
    'smart.target.name': 'Target Location',

    // Search Tool
    'search.title': 'Search',
    'search.input.label': 'Code (GC / GL / TL / TB)',
    'search.input.placeholder': 'e.g. GC12345',
    'search.btn.log': 'Jump to Log',
    'search.btn.tracker': 'Jump to Trackable',
    'search.empty': 'No matching cache found.',
    'search.type_more': 'Type at least 4 chars...',

    // Settings
    'settings.lang': 'Language',
    'settings.lang.desc': 'Switch interface language',
    'settings.radius': 'Explore Radius',
    'settings.radius.desc': 'Search range when dragging map',
    'settings.cache.title': 'Cache Management',
    'settings.cache.desc': 'Manage offline map data',
    
    // Settings Menu Items
    'settings.showCircles.title': '161m Proximity Circles',
    'settings.showCircles.desc': 'Show exclusion zones around caches',
    'settings.customPinsEnabled.title': 'Custom Pins Mode',
    'settings.customPinsEnabled.desc': 'Long press map to drop temporary pins',
    'settings.autoSync.title': 'Auto Offline Sync',
    'settings.autoSync.desc': 'Download full database daily automatically',
    'settings.clusterEnabled.title': 'Marker Clustering',
    'settings.clusterEnabled.desc': 'Group nearby markers into clusters',
    
    // Dataset
    'data.gpx.title': 'My GPX Files',
    'data.disc.title': 'Discovery',
    'data.disc.published': 'Recently Published',
    'data.disc.published.desc': 'New caches in last 10 days',
    'data.disc.found': 'Found Today',
    'data.disc.found.desc': 'Caches found by others today',
    'data.disc.history': 'On This Day',
    'data.disc.history.desc': 'Historical finds on this date',
    'data.spec.title': 'Special',
    'data.spec.events': 'Events',
    'data.spec.events.desc': 'Upcoming gatherings',
    'data.spec.ftf': 'First to Find',
    'data.spec.ftf.desc': 'FTF opportunities map',
    'data.heavy.title': 'Heavy',
    'data.heavy.load': 'Load All Caches',
    'data.heavy.cached': 'cached: {date} ({count})',
    'data.heavy.loading': 'loading cache...',
    'data.heavy.processing': 'processing cache data...',
    'data.heavy.none': 'not cached - tap to download'
};

const zh: Dictionary = {
    // Tabs
    'tab.data': '数据',
    'tab.tools': '工具',
    'tab.settings': '设置',
    'tab.links': '链接',
    'tab.about': '关于',

    // Tools
    'tools.title': '实用工具',
    'tools.smart.title': '智能坐标工具',
    'tools.smart.desc': '坐标格式转换 & 启动地图 App',
    'tools.search.title': '搜索藏点',
    'tools.search.desc': '通过 GC 码搜索离线数据库',

    // Smart Tool
    'smart.title': '智能坐标转换',
    'smart.input.label': '输入坐标',
    'smart.input.placeholder': '粘贴到这里... 例如：\nN 40 04.753 E 116 18.334\n40.0792, 116.3055',
    'smart.hint': '支持：DD, DMM, DMS (包含或不包含 N/S/E/W)',
    'smart.valid': '识别到有效坐标',
    'smart.waiting': '等待输入...',
    'smart.btn.invalid': '请输入有效坐标',
    'smart.btn.amap': '高德地图',
    'smart.btn.baidu': '百度地图',
    'smart.target.name': '目标位置',

    // Search Tool
    'search.title': '搜索 / 跳转',
    'search.input.label': '编码 (GC / GL / TL / TB)',
    'search.input.placeholder': '例如 GC12345',
    'search.btn.log': '查看日志 (Coord.info)',
    'search.btn.tracker': '查看旅行虫 (Tracker)',
    'search.empty': '离线库中未找到匹配项',
    'search.type_more': '输入至少4个字符...',

    // Settings
    'settings.lang': '语言 / Language',
    'settings.lang.desc': '切换界面语言',
    'settings.radius': '探索半径',
    'settings.radius.desc': '拖动地图时的搜索范围',
    'settings.cache.title': '离线包管理',
    'settings.cache.desc': '管理离线地图数据',

    // Settings Menu Items
    'settings.showCircles.title': '展示161米范围',
    'settings.showCircles.desc': '显示藏点周边的 161米 禁置区域',
    'settings.customPinsEnabled.title': '自定义插旗模式',
    'settings.customPinsEnabled.desc': '长按地图放置临时标记',
    'settings.autoSync.title': '每日自动同步数据',
    'settings.autoSync.desc': '每天自动下载全量数据库',
    'settings.clusterEnabled.title': '标记点聚合',
    'settings.clusterEnabled.desc': '将邻近标记点自动聚合成簇',

    // Dataset
    'data.gpx.title': '我的 GPX 文件',
    'data.disc.title': '发现',
    'data.disc.published': '最新发布',
    'data.disc.published.desc': '过去 10 天新发布的藏点',
    'data.disc.found': '今日日志',
    'data.disc.found.desc': '今天被找到的藏点',
    'data.disc.history': '历史上的今天',
    'data.disc.history.desc': '历史同一天发布的藏点',
    'data.spec.title': '精选',
    'data.spec.events': '活动聚会',
    'data.spec.events.desc': '即将举办的活动',
    'data.spec.ftf': 'FTF 机会',
    'data.spec.ftf.desc': '争夺首找',
    'data.heavy.title': '大数据',
    'data.heavy.load': '加载全量数据',
    'data.heavy.cached': '已缓存: {date} ({count})',
    'data.heavy.loading': '正在下载缓存...',
    'data.heavy.processing': '正在处理数据...',
    'data.heavy.none': '未缓存 - 点击下载'
};

export const translations = { en, zh };
