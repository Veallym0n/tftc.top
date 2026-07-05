# TFTC Map (GeomapCN) — 项目架构说明

> 一个基于 React 19 + Leaflet 的 Geocaching 离线地图 PWA，支持下载全球藏点数据、按策略筛选、坐标转换、GPX 导入导出。

---

## 一、分层架构

```
用户交互
   ↕
App.tsx（唯一控制器，组装组件 + 映射事件）  ← 无权直接操作 IndexedDB
   ↕
Zustand Store（useMapStore / useAppStore / useCacheStore）← 薄状态层
   ↕
Service（cacheService / syncService / dbService / deeplink）← 纯函数，不依赖 React
   ↕
IndexedDB（offlineCaches / userPins / gpxFiles / h3Index / settings）
```

**核心原则**：
- **组件只渲染** → 读 store，触发 store action
- **Service 是纯函数** → 不 import React / Zustand
- **Store 只是薄薄的状态 + setter** → 复杂操作委托 service

---

## 二、目录速览

```
config.ts                     # 运行时配置加载（从 /config.json），含地图图层、聚合样式等
constants.ts                  # 常量
types.ts                      # 全局类型：Geocache, UserPin, StoredGpx, MapType, MapLayerConfig
App.tsx                       # 唯一控制器：初始化、搜索、探索模式、数据加载——全部在此

stores/
  useMapStore.ts              # 地图视图状态：mapType、定位、跟随、flyTo
  useAppStore.ts              # UI 状态 + 设置持久化：drawer、toast、loading、settings
  useCacheStore.ts            # 缓存数据 + 同步状态：caches[]、userPins[]、gpxFiles[]、syncStatus

services/
  db.ts                       # IndexedDB 操作（idb 库封装），表：userPins/gpxFiles/offlineCaches/h3Index/settings
  cacheService.ts             # 数据获取（策略模式）+ 搜索 + GPX 导入导出
  syncService.ts              # 每日定时同步 + 坐标补丁 + 探索模式周边搜索（H3）
  strategies.ts               # 6 种数据获取策略（by_published / by_today / by_found / by_ftf / by_event / by_current_event） + fetch 工具
  deeplink.ts                 # 深度链接处理（?gc=GCXXX 等 URL 参数）

utils/
  geo.ts                      # 坐标转换（coordtransform 库：wgs2gcj/gcj2wgs/wgs2bd）+ openMap 工具
  gpx.ts                      # GPX 文件解析 & 生成

components/
  GlobalOverlays.tsx          # Toast、Loading 覆盖层
  Icons.tsx                   # SVG 图标
  controls/MapControls.tsx    # 左上/右上浮动按钮（定位、图层切换、搜索、探索模式）
  drawer/AppDrawer.tsx        # 底部抽屉容器
  drawer/Panel/               # 抽屉面板：Dataset / Tools / Settings / Links / About
  drawer/Tools/               # 工具面板内容：SmartCoords / Compass / SearchCache / CacheFilter
  drawer/Modals/              # 模态框：CacheManagerModal / SyncConfirmModal
  map/TFTCMap.tsx             # Leaflet 地图渲染：markers、聚合、长按插旗
  map/Popup.tsx               # 藏点 Popup（详情 + 导航按钮）
  map/PinPopup.tsx            # 用户插旗 Popup（编辑/删除）
  map/leaflet/                # Leaflet 适配层（GCMap/MarkerTemplate/UserLocation 等）

hooks/
  useIOSInputScrollLock.ts    # 唯一保留 Hook：修复 iOS Safari 输入法滚动问题
```

---

## 三、Store 职责

### useMapStore — 地图视图状态
| 字段 | 说明 |
|------|------|
| `mapType` | 当前底图（gaode/osm/satellite/googlemap/tencent/googlesat） |
| `isLocating` | 是否正在请求定位 |
| `isFollowing` | 是否跟随用户位置 |
| `flyTo(lat,lng,zoom?)` | 对外统一的地图跳转接口（递增 flySeq 触发 TFTCMap 监听） |

### useAppStore — UI 状态 + 设置
| 字段 | 说明 |
|------|------|
| `drawerOpen` | 抽屉开关 |
| `showLayerMenu` | 图层选择弹窗 |
| `loading` / `toastMsg` | 全局加载 / 提示 |
| `settings` | 6 项设置，变更自动写入 IndexedDB |
| `initSettings()` | 启动时从 IndexedDB 恢复设置 |
| `toggleSetting(key,val)` | 切换 + 联动逻辑（如 sync/自定义旗） |

### useCacheStore — 数据 + 同步
| 字段 | 说明 |
|------|------|
| `caches[]` | 当前地图显示的藏点列表 |
| `userPins[]` | 用户自定义插旗 |
| `gpxFiles[]` | 已导入的 GPX 文件列表 |
| `syncStatus` | idle / loading cache / processing cache data |
| `offlineMeta` | { lastSync, count } |
| `loadUserPins()` / `addUserPin()` / `deleteUserPin()` / `updateUserPin()` | 插旗 CRUD |
| `setCaches(updater)` | 支持函数式更新（探索模式去重合并） |

---

## 四、Service 作用速查

### dbService
> 唯一的 IndexedDB 访问入口。`db.ts` 使用 [idb](https://github.com/jakearchibald/idb) 库封装，提供类型安全的 Promise API。所有写入 IndexedDB 的操作必须经由此层。

### cacheService
> 藏点数据获取 + 搜索 + 周边查询(H3) + GPX。

| 方法 | 说明 |
|------|------|
| `fetchData(type)` | 按策略 ID 获取数据（委托 strategies.ts） |
| `getCacheDetail(code)` | 按 GC 码查单个藏点（先本地后服务器） |
| `searchLocal(caches, query)` | 客户端过滤：匹配 code/name/owner |
| `searchGlobal(query)` | 全局搜索：查 IndexedDB 全量 + searchLocal |
| `searchOfflineCachesByPrefix(prefix)` | IDB 前缀查询（SearchCache 组件用） |
| `getNearbyCaches(lat,lng,radius)` | 探索模式：H3 六边形查找周边藏点 |
| `loadOfflineCaches()` | 读取 IndexedDB 中全部离线藏点 |
| `exportOfflineGpx()` | 导出 GPX 文件 |
| `getGpxList()` / `deleteGpx()` | GPX 管理 |

### syncService
> 数据同步：从 CDN 下载 & 写 IndexedDB。

| 方法 | 说明 |
|------|------|
| `syncAllData()` | 从 CDN 下载 .gz 藏点数据库 → 坐标补丁 → 写 IndexedDB + H3 索引 |
| `initDailySync(bool)` | 每日后台同步（检查是否已是最新） |
| `getCacheStatus()` | 更新 offlineMeta |
| `clearOfflineData()` | 清空离线数据库 |

### deeplink
> 处理 `?gc=GCXXX` 或 `?lat=...&lng=...` 等 URL 参数，触发地图跳转和临时标记。

---

## 五、数据流向

### 启动流程
```
App.tsx useEffect
  → loadConfig()            加载 /config.json（地图图层、API 地址等）
  → initSettings()          恢复用户设置（IndexedDB → useAppStore）
  → loadUserPins()          恢复插旗（IndexedDB → useCacheStore.userPins）
  → loadGpxList()           恢复 GPX 列表
  → getCacheStatus()        读取同步状态（useCacheStore.offlineMeta）
  → performFetch('by_published')  默认加载最新发布的藏点
  → deepLink.process()      如果有 URL 参数则跳转
```

### 藏点显示流
```
用户选择数据源 (by_published / by_today / by_found / ...)
  → App.fetchData(type)
    → cacheService.fetchData(type)
      → strategies[type].fetch()
        → 网络请求 / IndexedDB 过滤
    → useCacheStore.setCaches(data)
      → TFTCMap 订阅 caches → 渲染 markers
```

### 探索模式流
```
用户开启探索模式 → isExploreMode = true
  用户拖拽地图
    → handleMapMoveEnd() [debounce 400ms]
      → cacheService.getNearbyCaches(lat, lng, radius)
        → h3-js: latLngToCell + gridDisk
        → dbService.getOfflineCachesByH3(rings)
      → setCaches(prev => [...prev, ...uniqueNew])  // 增量合并
```

### 搜索流
```
用户输入搜索词 [debounce 500ms]
  → displayCaches = cacheService.searchLocal(caches, query)   // 本地过滤
  用户点击"全局搜索"
    → cacheService.searchGlobal(query)
      → dbService.getOfflineCaches() → searchLocal(all, query)
```

### 同步流
```
手动同步 / 每日定时
  → syncService.syncAllData()
    → fetch(.gz URL) → DecompressionStream
    → getCoordPatch() → 修正 premium 藏点坐标
    → dbService.saveOfflineCaches()  // 清空旧 → 批量写入
    → dbService.saveH3Index()        // 清空旧 → 批量写入 H3 → GC codes 映射
    → useCacheStore.setSyncStatus / setOfflineMeta
```

---

## 六、关键设计决策

### 为什么 App.tsx 这么「胖」
所有跨组件协调逻辑（初始化、数据加载、探索模式、搜索）全部集中在 App.tsx，而不是散落在多个 Hook 里。这遵循「单次使用的 Hook 收回组件」原则，只需在 App.tsx 这一个文件中即可看到所有数据流，无需跳转多个文件追踪逻辑。

### 为什么 `cacheService.searchLocal` 不走 IndexedDB
searchLocal 是**客户端即时过滤**，作用于内存中已有的 `caches[]`（最多 ~5000 条），无需任何 I/O。searchGlobal 是**全库搜索**，走 IndexedDB 拉全量（~几万条）再 filter。两种场景分开。

### flyTo 模式：为什么不用 eventService
之前用 Pub/Sub 跨组件通信 `MAP_FLY_TO` 事件，现在改用 `useMapStore.flyTo()` 递增 `flySeq`，`TFTCMap` 用 `useEffect` 监听 `flySeq` 变化执行 `setView`。单向数据流，可追踪、可预测。

### 坐标转换：为什么保留 [lat, lng] 而非 [lng, lat]
项目最初内部统一 [lat, lng]，`coordtransform` 使用 [lng, lat]。`utils/geo.ts` 作为适配层，对外 [lat, lng] 不变，内部转换为库格式。

### H3 六边形索引
每个藏点写入 IndexedDB 时计算 `h3hash`（resolution 9），建一张 `h3Index` 表（key=h3, value=codes[]）。探索模式只需 `gridDisk(centerH3, k)` 拿相邻六边形，再从 `h3Index` 查 GC codes，避免全表遍历。

---

## 七、当前状态 & 待办

| 状态 | 事项 |
|------|------|
| ✅ | Store 精简为 3 个 |
| ✅ | eventService Pub/Sub 已移除 |
| ✅ | useCacheSearch / useAppController / useSyncStore 已删除 |
| ✅ | db.ts 用 idb 库重写（354→140 行） |
| ✅ | geo.ts 用 coordtransform 重写（手写算法→库） |
| 🔲 | Leaflet / Tailwind 从 CDN 切换为 npm |
| 🔲 | Marker 增量更新（当前全量 setCaches 触发重渲染） |
| 🔲 | Error Boundary 包裹 AppDrawer |
| 🔲 | Deep link 添加 zod 校验 |
