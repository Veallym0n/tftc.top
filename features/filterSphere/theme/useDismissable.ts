import { useEffect, useRef } from 'react';

/**
 * Calls `onDismiss` on `Escape` and on pointer interactions outside every
 * element in `refs`. Pass refs for all elements that count as "inside": with a
 * portaled menu the trigger and the menu live in different DOM subtrees, so both
 * must be listed or selecting an option would be read as an outside click.
 *
 * Listeners use the capture phase so an open menu consumes `Escape` before the
 * surrounding modal does. The latest values are read through refs so the
 * listeners subscribe once per open/close cycle rather than on every render.
 */
export const useDismissable = (
  open: boolean,
  onDismiss: () => void,
  refs: ReadonlyArray<{ readonly current: Element | null }>,
) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isInside = refsRef.current.some(
        (ref) => ref.current?.contains(target) ?? false,
      );
      if (!isInside) {
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
};
