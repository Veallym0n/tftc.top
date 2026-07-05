export const TFTC_CONSTANTS = {
    DEFAULT_CENTER: [35.8617, 104.1954] as [number, number], // 默认中国中心点
    DEFAULT_ZOOM: 4,
    DEFAULT_CONFLICT_RADIUS: 161, // 161米冲突圈
    LAYER_OSM: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

let customConstants = { ...TFTC_CONSTANTS };

export const getConstants = () => customConstants;

// 暴露给外部的配置覆盖方法（插件化入口）
export const overrideConstants = (overrides: Partial<typeof TFTC_CONSTANTS>) => {
    customConstants = { ...customConstants, ...overrides };
};
