import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface BubblePosition {
  right: number;
  bottom: number;
}

const STORAGE_KEY = 'nasdem_chat_bubble_pos_v1';
const SYNC_EVENT = 'nasdem_chat_bubble_pos_sync';
const DEFAULT_POS: BubblePosition = { right: 20, bottom: 20 };
const MIN_MARGIN = 12;
const DRAG_THRESHOLD_PX = 3;

function loadSavedPosition(): BubblePosition {
  if (typeof window === 'undefined') return DEFAULT_POS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POS;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.right === 'number' &&
      typeof parsed?.bottom === 'number' &&
      Number.isFinite(parsed.right) &&
      Number.isFinite(parsed.bottom)
    ) {
      return { right: parsed.right, bottom: parsed.bottom };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_POS;
}

function savePosition(pos: BubblePosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: pos }));
  } catch {
    // ignore storage errors
  }
}

export function useDraggableBubble() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<BubblePosition>(() => loadSavedPosition());
  const [isDragging, setIsDragging] = useState(false);
  const posRef = useRef<BubblePosition>(position);
  posRef.current = position;

  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    currentRight: number;
    currentBottom: number;
    width: number;
    height: number;
    winW: number;
    winH: number;
    hasDragged: boolean;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startRight: DEFAULT_POS.right,
    startBottom: DEFAULT_POS.bottom,
    currentRight: DEFAULT_POS.right,
    currentBottom: DEFAULT_POS.bottom,
    width: 56,
    height: 56,
    winW: 1024,
    winH: 768,
    hasDragged: false,
  });

  const clampCoords = useCallback(
    (right: number, bottom: number, width = 56, height = 56, winW?: number, winH?: number): BubblePosition => {
      if (typeof window === 'undefined') return { right, bottom };
      const w = winW ?? window.innerWidth;
      const h = winH ?? window.innerHeight;
      const maxRight = Math.max(MIN_MARGIN, w - width - MIN_MARGIN);
      const maxBottom = Math.max(MIN_MARGIN, h - height - MIN_MARGIN);

      return {
        right: Math.round(Math.min(Math.max(MIN_MARGIN, right), maxRight)),
        bottom: Math.round(Math.min(Math.max(MIN_MARGIN, bottom), maxBottom)),
      };
    },
    []
  );

  // Re-clamp on window resize and sync across components
  useEffect(() => {
    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 56;
      const h = rect?.height || 56;
      setPosition((prev) => clampCoords(prev.right, prev.bottom, w, h));
    };

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<BubblePosition>;
      if (custom.detail && !dragRef.current.active) {
        const rect = containerRef.current?.getBoundingClientRect();
        const w = rect?.width || 56;
        const h = rect?.height || 56;
        setPosition(clampCoords(custom.detail.right, custom.detail.bottom, w, h));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('SYNC_EVENT', handleSync);
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('SYNC_EVENT', handleSync);
      window.removeEventListener(SYNC_EVENT, handleSync);
    };
  }, [clampCoords]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const width = rect.width || 56;
      const height = rect.height || 56;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRight: posRef.current.right,
        startBottom: posRef.current.bottom,
        currentRight: posRef.current.right,
        currentBottom: posRef.current.bottom,
        width,
        height,
        winW,
        winH,
        hasDragged: false,
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const state = dragRef.current;
        if (!state.active) return;

        const rawDx = moveEvent.clientX - state.startX;
        const rawDy = moveEvent.clientY - state.startY;

        if (!state.hasDragged) {
          if (Math.hypot(rawDx, rawDy) < DRAG_THRESHOLD_PX) return;
          state.hasDragged = true;
          setIsDragging(true);
          try {
            el.setPointerCapture(state.pointerId);
          } catch {
            // ignore if pointer capture not supported
          }
        }

        moveEvent.preventDefault();

        const next = clampCoords(
          state.startRight - rawDx,
          state.startBottom - rawDy,
          state.width,
          state.height,
          state.winW,
          state.winH
        );

        state.currentRight = next.right;
        state.currentBottom = next.bottom;

        // Direct GPU-accelerated DOM transform without React re-render
        const clampedDx = state.startRight - next.right;
        const clampedDy = state.startBottom - next.bottom;
        el.style.transform = `translate3d(${clampedDx}px, ${clampedDy}px, 0)`;
      };

      const finishDrag = () => {
        const state = dragRef.current;
        if (!state.active) return;
        state.active = false;

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', finishDrag);
        window.removeEventListener('pointercancel', finishDrag);

        try {
          if (el.hasPointerCapture(state.pointerId)) {
            el.releasePointerCapture(state.pointerId);
          }
        } catch {
          // ignore
        }

        if (state.hasDragged) {
          const finalPos = {
            right: state.currentRight,
            bottom: state.currentBottom,
          };
          // Commit synchronously to prevent any visual jump
          el.style.transform = 'translate3d(0px, 0px, 0px)';
          el.style.right = `${finalPos.right}px`;
          el.style.bottom = `${finalPos.bottom}px`;

          posRef.current = finalPos;
          setPosition(finalPos);
          setIsDragging(false);
          savePosition(finalPos);

          setTimeout(() => {
            dragRef.current.hasDragged = false;
          }, 80);
        } else {
          setIsDragging(false);
        }
      };

      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', finishDrag);
      window.addEventListener('pointercancel', finishDrag);
    },
    [clampCoords]
  );

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.hasDragged = false;
    }
  }, []);

  return {
    containerRef,
    position,
    isDragging,
    handlePointerDown,
    handleClickCapture,
  };
}
