# TFTC Map 重构手册

> 目标：精简项目、逻辑简单、界面与功能清晰分拆。

---

## 一、目标架构

### 核心原则

1. **组件只做渲染**：不直接调 service、不做数据转换、不操作 IndexedDB——只读 store 和触发 store action。
2. **Service 是纯函数/类**：不依赖 React、不碰 Zustand——只做输入→输出的数据加工。
3. **Store 是薄薄的状态层**：只存状态 + 简单 setter，复杂操作委托给 service。
4. **扁平目录、无深层嵌套**：最多两级，干掉 `libs/`、`services/data/v1/` 这类层级。
5. **单次使用的 Hook 收回组件**：不为了"看起来干净"而拆文件。

### 目标目录结构

```
src/
├── main.tsx                    # 入口
├── App.tsx                     # 根组件，组合地图+抽屉+覆盖层
│
├── components/                 # 纯 UI，不写业务逻辑
│   ├── map/
│   │   ├── TFTCMap.tsx         # Leaflet 地图渲染（markers、聚合、坐标转换）
│   │   ├── Popups.tsx          # 藏点 Popup + 用户 Pin Popup（合并）
│   │   └── UserLocation.tsx    # 用户定位图层
│   ├── drawer/
│   │   ├── AppDrawer.tsx       # 底部抽屉容器
│   │   └── panels/
│   │       ├── Dataset.tsx     # 数据面板
│   │       ├── Tools.tsx       # 工具入口
│   │       ├── Settings.tsx    # 设置
│   │       ├── Links.tsx       # 链接
│   │       └── About.tsx       # 关于
│   ├── tools/
│   │   ├── SmartCoords.tsx     # 坐标转换器
│   │   ├── Compass.tsx         # 指南针
│   │   ├── CacheSearch.tsx     # GC码搜索藏点
│   │   └── CacheFilter.tsx     # 条件筛选
│   ├── controls/
│   │   ├── MapControls.tsx     # 地图控件（定位、图层切换等）
│   │   └── SearchBar.tsx       # 搜索栏
│   ├── modals/
│   │   ├── Modal.tsx           # 通用模态框
│   │   ├── CacheManager.tsx    # 缓存管理
│   │   └── SyncConfirm.tsx     # 同步确认
│   └── shared/
│       ├── Icons.tsx           # SVG 图标
│       └── GlobalOverlays.tsx  # Toast、Loading 等全局覆盖层
│
├── stores/                     # Zustand，薄薄的状态层
│   ├── mapStore.ts             # 地图视图：center、zoom、activeLayer
│   ├── cacheStore.ts           # 藏点数据：caches[]、userPins[]、loadingStates
│   └── appStore.ts             # 全局设置：language、coordinateFormat、drawerOpen
│
├── services/                   # 纯函数，无 React 依赖
│   ├── db.ts                   # IndexedDB CRUD（getAll、put、clear、count）
│   ├── sync.ts                 # 从网络拉取全量数据 → 写入 db → 返回结果
│   ├── strategies.ts           # 所有数据策略（byPublished、byFound、byFTF…）集中一个文件
│   ├── gpx.ts                  # GPX 解析与生成
│   ├── deeplink.ts             # URL 参数解析 → 返回 action 描述对象
│   └── geo.ts                  # 坐标转换（wgs2gcj 等）& openMap 工具
│
├── types.ts                    # 所有 TS 类型
└── config.ts                   # 从 public/config.json 加载配置的加载器（类型安全）
```

`public/config.json` — 运行时配置文件，包含地图图层、API 端点、集群样式、链接列表等。应用启动时 fetch 加载到 `appStore`，修改无需重新构建。

> `types.ts` 保留编译时常量：藏点类型枚举、容器类型枚举等不常变的结构数据。

### 数据流（单向）

```
用户操作
  ↓
组件调用 store action（如 cacheStore.loadCaches("byFTF")）
  ↓
store action 调用 service（如 strategies.byFTF(db)）
  ↓
service 从 IndexedDB/网络获取数据，转换后 return
  ↓
store action 拿到结果后 setState({ caches, loading: false })
  ↓
组件重渲染
```

**Service 永远不知道 Store 的存在。Store 是唯一能改状态的地方。**

---

## 二、现有问题 & 行动

### A. 架构与职责分层

#### A1 — 巨型 Store，当 Pub/Sub 滥用
- **问题**：`useMapStore` 塞了地图状态、藏点数据、用户 Pin、设置、加载态等一切，任何字段变化都可能导致大范围重渲染。
- **行动**：按上述设计拆成 `mapStore` / `cacheStore` / `appStore` 三个 store。所有副作用（fetch、db 操作）迁出 store action，改为调用 service 再 setState。

#### A2 — Service 层双向耦合
- **问题**：service 直接调 `useMapStore.getState().setXxx()`，组件又通过 store 调 service，形成环。
- **行动**：切断 service → store 的箭头，service 只做输入→输出，store action 负责调 service 并 setState。

#### A3 — Hooks 过度抽象
- **问题**：`useLongPressMap`、`useCacheSearch`、`useAppController` 等 Hook 仅被一处使用，徒增文件跳转。
- **行动**：将单调用 Hook 的逻辑内联回组件。`hooks/` 目录可以删掉。

#### A4 — `libs/` 目录多余
- **问题**：`libs/tftc` 和 `libs/common` 只有一两个文件，没必要单独成库。
- **行动**：`Modal.tsx` 移入 `components/modals/`，Leaflet 封装组件移入 `components/map/`，删除 `libs/`。

#### A5 — 配置硬编码在 `constants.ts`，修改需重新构建
- **问题**：地图图层、API 端点、集群样式、链接列表、关于文案全部写在 `constants.ts` 里编译进 bundle。每次改链接、调样式、加图层都要重新 `build` + 部署，无法热修改。
- **行动**：将可配置项抽到 `public/config.json`，应用启动时 `fetch('/config.json')` 加载到 `appStore.config`。仅保留藏点类型枚举、容器类型枚举等不常变的结构数据在 `types.ts`。`config.ts` 作为加载器 + 类型守卫。

#### B1 — CDN 引入 Leaflet & Tailwind
- **问题**：`index.html` 里用 `<link>`/`<script>` 加载，无法 tree-shaking，版本不可控，阻塞首屏。
- **行动**：`pnpm add leaflet @tailwindcss/vite tailwindcss`，从 ES import 引入，Vite 打包。`public/app.css` 里的全局样式原样保留。

#### B2 — Marker 暴力重建
- **问题**：数据更新时 `removeLayer` + 全量重建，几千条数据时明显卡顿。
- **行动**：改用增量更新（`addLayers`/`removeLayers`）；考虑用 `L.divIcon` 减少 DOM 碎片。

#### B3 — IndexedDB 无限增长
- **问题**：全量同步只 `put` 不清，长期使用可能超配额。
- **行动**：全量同步前 `db.clear('geocaches')`；对 Pin/GPX 设上限（如 200 条）；用 `navigator.storage.estimate()` 监控并在 UI 提示。

---

### C. 安全与健壮性

#### C1 — 深链接 XSS/SSRF 风险
- **问题**：`?datasource=<url>` 直接 fetch 并渲染，恶意 JSON 可注入 popup 内容。
- **行动**：对加载的 JSON 做 schema 校验（`zod`）；只允许 `https` 协议；popup 内容禁止 `dangerouslySetInnerHTML`。

#### C2 — 缺少错误边界
- **问题**：地图挂了 → 整页白屏。
- **行动**：给 `TFTCMap` 和 `AppDrawer` 包一层 Error Boundary，提供 fallback UI。

#### C3 — 坐标转换公式无人维护
- **问题**：硬编码的 WGS-84 ↔ GCJ-02 公式，参数来源不可考，出错难排查。
- **行动**：换成熟库（如 `coordtransform`），手动验证几个已知坐标点。

---

### D. 可维护性

#### D1 — `window.openMap` 全局暴露
- **问题**：引用组件实例，卸载后成野指针。
- **行动**：改为纯工具函数，只操作 store。

#### D2 — React 19 兼容性
- **问题**：部分库 peer dependency 可能不兼容。
- **行动**：`pnpm ls react` 检查版本一致性；必要时退回 React 18。

---

## 三、重构顺序（建议）

### 第一阶段：清理结构（风险低，收益大）

1. 删除 `hooks/`，逻辑收回组件
2. 删除 `libs/`，文件迁入 `components/`
3. 重命名目录，统一小写命名（`components/Map/` → `components/map/`）
4. `services/data/v1/`、`services/data/v2/` 的策略文件合并到 `services/strategies.ts`
5. 将 `constants.ts` 中的可配置项抽到 `public/config.json`，保留类型枚举在 `types.ts`

### 第二阶段：解除耦合（核心重构）

6. 拆分 `useMapStore` → `mapStore` / `cacheStore` / `appStore`
7. 切断 service → store 的调用，改为 store action → service → setState
8. 组件改为精准 selector 订阅，不允许 `useXxxStore()` 全量订阅

### 第三阶段：基础设施升级

9. Leaflet & Tailwind 改为 npm 依赖 + Vite 构建
10. IndexedDB 加清理策略
11. 深链接加安全校验
12. 加 Error Boundary

### 第四阶段：优化细节

13. Marker 增量更新
14. 坐标转换库替换
15. `window.openMap` 清理
16. 依赖版本审计
