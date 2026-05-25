import { useEffect, useRef } from 'react';

/**
 * Closes an open popover on `Escape` and on pointer interactions outside the
 * container. Attach the returned ref to the element that wraps BOTH the trigger
 * and the menu so clicks on either are treated as "inside".
 *
 * Listeners are attached in the capture phase: while the menu is open, `Escape`
 * is consumed here (stopPropagation) so the surrounding modal does not also
 * close. The latest `onDismiss` is read through a ref so listeners subscribe
 * once per open/close cycle rather than on every render.
 */
export const useDismissable = <T extends HTMLElement>(
  open: boolean,
  onDismiss: () => void,
) => {
  const containerRef = useRef<T>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) {
        onDismissRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismissRef.current();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  return containerRef;
};
