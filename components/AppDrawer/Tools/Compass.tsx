import React, { useState, useEffect, useRef, useCallback } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';

interface CompassState {
  lat: number | null;
  lng: number | null;
  gpsAccuracy: number | null;
  error: string | null;
  permissionDenied: boolean;
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function headingToDir(h: number) {
  return DIRECTIONS[Math.round(h / 45) % 8];
}

/** 求两角之间走最短弧的差值，结果在 (-180, 180] */
function shortestAngleDelta(from: number, to: number) {
  let d = ((to - from) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

const Compass = NiceModal.create(() => {
  const modal = useModal();
  const [state, setState] = useState<CompassState>({
    lat: null, lng: null, gpsAccuracy: null, error: null, permissionDenied: false,
  });

  // 平滑角度：用 ref 驱动 rAF，避免频繁 setState
  const rawHeadingRef = useRef<number | null>(null);       // 最新原始值
  const smoothHeadingRef = useRef<number | null>(null);    // 当前插值角
  const [displayHeading, setDisplayHeading] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const deviceOrientationHandler = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // rAF 平滑循环
  const startSmoothing = useCallback(() => {
    const ALPHA = 0.12; // 越小越平滑，越大越灵敏
    const tick = () => {
      if (rawHeadingRef.current != null) {
        if (smoothHeadingRef.current == null) {
          smoothHeadingRef.current = rawHeadingRef.current;
        } else {
          const delta = shortestAngleDelta(smoothHeadingRef.current, rawHeadingRef.current);
          smoothHeadingRef.current = (smoothHeadingRef.current + delta * ALPHA + 360) % 360;
        }
        setDisplayHeading(Math.round(smoothHeadingRef.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'GPS not supported' }));
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => setState(s => ({ ...s, lat: pos.coords.latitude, lng: pos.coords.longitude, gpsAccuracy: pos.coords.accuracy })),
      err => setState(s => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // DeviceOrientation
  useEffect(() => {
    startSmoothing();
    const handler = (e: DeviceOrientationEvent) => {
      const heading =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : e.alpha != null
          ? (360 - e.alpha + 360) % 360
          : null;
      if (heading != null) rawHeadingRef.current = heading;
    };
    deviceOrientationHandler.current = handler;

    const requestPermission = async () => {
      const DOE = DeviceOrientationEvent as any;
      if (typeof DOE.requestPermission === 'function') {
        try {
          const perm = await DOE.requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', handler, true);
          } else {
            setState(s => ({ ...s, permissionDenied: true }));
          }
        } catch {
          setState(s => ({ ...s, permissionDenied: true }));
        }
      } else {
        window.addEventListener('deviceorientation', handler, true);
      }
    };
    requestPermission();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (deviceOrientationHandler.current) {
        window.removeEventListener('deviceorientation', deviceOrientationHandler.current, true);
      }
    };
  }, [startSmoothing]);

  // 复制坐标
  const [copied, setCopied] = useState(false);
  const handleCopyCoords = () => {
    const { lat, lng } = state;
    if (lat == null || lng == null) return;
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const { lat, lng, gpsAccuracy, error, permissionDenied } = state;
  const heading = displayHeading;
  const needleRotate = heading != null ? `rotate(${heading}deg)` : 'none';

  return (
    <Modal
      isOpen={modal.visible}
      onClose={() => modal.remove()}
      title="指南针"
      {...defaultModalClasses}
      bodyClassName="p-6 flex flex-col items-center gap-5"
    >
      {/* 指南针表盘 */}
      <div className="relative w-48 h-48 select-none">
        {/* 表盘背景 */}
        <div className="absolute inset-0 rounded-full border-4 border-memphis-dark bg-cream shadow-memphis-lg flex items-center justify-center">
          {/* 方位刻度文字 */}
          {['N','E','S','W'].map((d, i) => {
            const angle = i * 90;
            const rad = (angle - 90) * Math.PI / 180;
            const r = 74;
            const x = 96 + r * Math.cos(rad);
            const y = 96 + r * Math.sin(rad);
            return (
              <span
                key={d}
                className="absolute text-xs font-black text-memphis-dark"
                style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }}
              >
                {d}
              </span>
            );
          })}
          {/* 指针 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: needleRotate }}
          >
            {/* 北针（红） */}
            <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '52px solid #ef4444' }} />
            {/* 南针（灰） */}
            <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '52px solid #94a3b8' }} />
            {/* 中心圆 */}
            <div className="w-4 h-4 rounded-full bg-memphis-dark border-2 border-white z-10" />
          </div>
        </div>
      </div>

      {/* 方位角数字 */}
      <div className="text-center">
        {permissionDenied ? (
          <p className="text-xs text-red-500 font-medium">陀螺仪权限被拒绝</p>
        ) : heading != null ? (
          <>
            <div className="text-4xl font-black text-memphis-dark tabular-nums">{heading}°</div>
            <div className="text-sm font-bold text-slate-500">{headingToDir(heading)}</div>
          </>
        ) : (
          <p className="text-xs text-slate-400">等待陀螺仪数据…</p>
        )}
      </div>

      {/* GPS 坐标 */}
      <div
        className={`w-full bg-slate-50 rounded-xl border-2 border-memphis-dark px-4 py-3 text-center ${lat != null && lng != null ? 'cursor-pointer active:bg-slate-100' : ''}`}
        onClick={handleCopyCoords}
        title="点击复制坐标"
      >
        {lat != null && lng != null ? (
          <>
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
              {copied ? '✅ 已复制' : 'GPS 坐标'}
            </div>
            <div className="font-mono text-sm font-bold text-slate-800 break-all">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
            {gpsAccuracy != null && (
              <div className="text-xs text-slate-400 mt-1">精度 ±{gpsAccuracy.toFixed(0)} m</div>
            )}
          </>
        ) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-slate-400">获取 GPS 中…</p>
        )}
      </div>
    </Modal>
  );
});

export default Compass;
