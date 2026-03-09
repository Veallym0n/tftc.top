# 🗺️ GeoMapCN-UIExtra (TFTC Map Tool)

欢迎来到 **GeoMapCN-UIExtra**！这是一个专为中国地理藏宝（Geocaching）玩家打造的现代化 Web 工具。我们拒绝沉闷的传统地图应用，采用充满活力的 **Memphis (孟菲斯)** 设计风格，为你带来流畅、轻快且赏心悦目的寻宝体验！

## 🌟 核心特性 (Core Features)

*   **🎨 孟菲斯美学 (Memphis UI)**：高饱和度配色、硬边框、硬阴影，告别“AI味”的渐变色，界面大气美观且极具个性。
*   **📡 离线优先 (Offline First)**：基于 `IndexedDB` 存储海量藏点数据，支持离线高速过滤（Today, Event, Found, FTF 等策略）。
*   **🗺️ 智能坐标纠偏**：自动处理 WGS84 与 GCJ02/BD09 之间的坐标转换，精准定位不偏移。
*   **⚡ 极简状态管理**：使用 `Zustand` 进行全局状态管理，轻量且高效。
*   **🧩 插件化架构**：高度抽象的 `services` 和 `components`，数据获取策略（v1在线/v2离线）与 UI 完美解耦。

---

## ✨ 核心引擎：`libs/tftc` 库特别介绍

为了彻底解决地图操作中繁琐的 DOM 交互和深层嵌套的 `try-catch`，我们专门为 React 打造了 **`libs/tftc` (Thanks For The Cache)** 地图组件库。

它将底层的 Leaflet 实例进行了高度的声明式封装，让你能像搭积木一样构建复杂的地理藏宝地图应用。

### 📦 核心组件

*   **`<GCMap>`**: 地图的根容器。内置了 `MapErrorBoundary`，在顶层统一捕获并处理地图渲染异常，**彻底消灭深层 try-catch**。它通过 Context 向下层提供地图实例。
*   **`<MapLayer>`**: 声明式的图层管理组件，轻松切换高德、OSM 等不同底图。
*   **`<GCData>`**: 声明式的单点组件。适用于渲染独立的高亮图钉、用户位置等，支持自定义 Icon 和冲突圈（Conflict Radius，粉色虚线圈 🎀）。
*   **`<MarkerTemplate>`**: 专为海量藏点设计的模板化渲染组件，底层结合聚合算法，保证万级数据下的丝滑体验。
*   **`useMapContext()`**: 极简的 Hook，让任何子组件都能随时获取底层的 `map` 实例。

### 💻 极简使用示例

得益于代码洁癖和紧凑的设计理念，使用 `libs/tftc` 构建地图极其优雅：

```tsx
import { GCMap, MapLayer, GCData, useMapContext } from '@/libs/tftc';
import { constants } from '@/constants';

const MyTreasureMap = () => {
  return (
    <GCMap center={constants.DEFAULT_CENTER} zoom={14} className="rounded-2xl shadow-memphis border-2 border-black">
      {/* 1. 声明底图 */}
      <MapLayer url={constants.MAP_TILES.GAODE} />
      
      {/* 2. 声明单点（例如：选中的藏点） */}
      <GCData 
        data={{ latitude: 31.2304, longitude: 121.4737 }} 
        conflictRadius={161} // 161米冲突圈
        icon={<div className="bg-pink-400 rounded-full w-4 h-4 border-2 border-black shadow-memphis-sm" />}
      />
      
      {/* 3. 渲染海量藏点 */}
      {/* <MarkerTemplate data={offlineCaches} /> */}
    </GCMap>
  );
};
```

---

## 🏗️ 项目架构 (Architecture)

项目遵循**逻辑与视图分离**、**功能插件化**的原则，结构紧凑且易于持续迭代：

```text
/
├── components/        # 纯 UI 组件 (Memphis 风格, 原子化设计)
├── libs/tftc/         # 🗺️ 核心地图引擎库 (高度封装的 React-Leaflet)
├── services/          # 业务逻辑与数据层
│   ├── data/          # 数据获取策略 (v1: 在线获取, v2: 纯离线 IndexedDB 过滤)
│   ├── cacheService.ts# 藏点数据门面服务
│   └── dbService.ts   # IndexedDB 数据库服务
├── stores/            # Zustand 状态管理 (UI 状态、缓存状态)
├── utils/             # 纯函数工具库 (坐标转换等)
├── constants.ts       # 全局统一配置入口
└── types.ts           # 全局类型定义
```

### 💡 架构亮点
1. **统一异常处理**：我们憎恨深层次的 `try-catch` 嵌套。所有的网络请求和数据库操作异常都会抛出到上层，由 UI 层的 ErrorBoundary 或全局 Toast 统一拦截和展示。
2. **策略模式数据层**：`services/data` 下区分了 `v1`（网络回源）和 `v2`（纯本地离线过滤）。新增过滤规则只需新增一个策略类，无需修改核心逻辑，完全符合开闭原则。
3. **常量统一管理**：提供全局的 `constants.ts`，无论是 UI 配色、默认坐标还是 API 接口，都在一处管理，拒绝魔法字符串。

