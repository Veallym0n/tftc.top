import { useEffect } from 'react';

/**
 * iOS Safari 输入框键盘弹起时的滚动锁定修复
 *
 * 原理：
 * iOS Safari 在输入框聚焦后会将 Visual Viewport 上移，同时对
 * Layout Viewport 做滚动，导致 position:fixed 元素错位、底部留白。
 * 解决方案：在 focusin 时将 body 切换到 position:fixed 并记录当前
 * scrollY，阻止系统默认的滚屏行为；在 focusout 时恢复，并用
 * window.scrollTo 还原滚动位置，做到无感切换。
 */
export function useIOSInputScrollLock() {
  useEffect(() => {
    // 仅在 iOS Safari 上启用（其他平台不需要此 hack）
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      // iPad OS 13+ userAgent 与桌面 Safari 相同，需要额外判断
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isIOS) return;

    let scrollY = 0;

    const lock = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      )
        return;

      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    };

    const unlock = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      )
        return;

      // 检查焦点是否转移到另一个输入框 —— 若是则不解锁
      // 用 setTimeout 让 focusin 先触发（如果有的话）
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          active &&
          (active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.isContentEditable)
        ) {
          // 焦点在另一个输入框，不恢复，仅更新 scrollY
          return;
        }

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      }, 50);
    };

    document.addEventListener('focusin', lock, true);
    document.addEventListener('focusout', unlock, true);

    return () => {
      document.removeEventListener('focusin', lock, true);
      document.removeEventListener('focusout', unlock, true);
      // 清理防止卸载时 body 样式残留
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
    };
  }, []);
}
