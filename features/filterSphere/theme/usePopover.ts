import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useDismissable } from './useDismissable';

export type PopoverPosition = {
  top: number;
  left: number;
  minWidth: number;
};

const MENU_GAP = 6; // px, matches the previous 0.375rem inline gap

/**
 * Drives a button-triggered popover menu that is portaled to `document.body` so
 * it escapes the modal's `overflow-auto` scroll containers. Tracks open state,
 * computes the menu's fixed-position rect from the trigger, keeps it attached on
 * scroll/resize, and wires Escape + outside-click dismissal (treating both the
 * trigger and the portaled menu as "inside").
 */
export const usePopover = () => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + MENU_GAP,
      left: rect.left,
      minWidth: rect.width,
    });
  }, []);

  // useLayoutEffect so the position is set before paint (no first-open flash).
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    // Capture phase so scrolling any ancestor (e.g. the modal body) repositions.
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, updatePosition]);

  useDismissable(open, () => setOpen(false), [triggerRef, menuRef]);

  return { open, setOpen, position, triggerRef, menuRef };
};
