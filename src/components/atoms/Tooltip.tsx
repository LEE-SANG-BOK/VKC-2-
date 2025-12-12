'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipPlacement = 'top' | 'below' | 'right' | 'bottom-right' | 'top-left';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPlacement;
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = ''
}: TooltipProps) {
  const tooltipId = useId();
  const targetRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; placement: TooltipPlacement } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: none)');
    const update = () => setTouchMode(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setCoords(null);
  }, []);

  const openTooltip = useCallback(() => {
    setOpen(true);
    setCoords((prev) => prev ?? { x: 0, y: 0, placement: position });
  }, [position]);

  const computePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const pad = 8;
    const gap = 10;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const placementsToTry: TooltipPlacement[] =
      position === 'top'
        ? ['top', 'below', 'right']
        : position === 'below'
          ? ['below', 'top', 'right']
          : position === 'right'
            ? ['right', 'top', 'below']
            : position === 'bottom-right'
              ? ['bottom-right', 'below', 'top', 'right']
              : ['top-left', 'top', 'below', 'right'];

    const computeFor = (placement: TooltipPlacement) => {
      if (placement === 'top') {
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          y: targetRect.top - gap - tooltipRect.height,
        };
      }
      if (placement === 'below') {
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          y: targetRect.bottom + gap,
        };
      }
      if (placement === 'right') {
        return {
          x: targetRect.right + gap,
          y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
        };
      }
      if (placement === 'bottom-right') {
        return {
          x: targetRect.right + gap,
          y: targetRect.bottom + gap,
        };
      }
      return {
        x: targetRect.left,
        y: targetRect.top - gap - tooltipRect.height,
      };
    };

    const fits = (x: number, y: number) =>
      x >= pad &&
      y >= pad &&
      x + tooltipRect.width <= viewportW - pad &&
      y + tooltipRect.height <= viewportH - pad;

    let chosen = placementsToTry[0];
    let point = computeFor(chosen);

    for (const candidate of placementsToTry) {
      const candidatePoint = computeFor(candidate);
      if (fits(candidatePoint.x, candidatePoint.y)) {
        chosen = candidate;
        point = candidatePoint;
        break;
      }
    }

    const x = clamp(point.x, pad, viewportW - pad - tooltipRect.width);
    const y = clamp(point.y, pad, viewportH - pad - tooltipRect.height);

    setCoords({ x, y, placement: chosen });
  }, [position]);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
  }, [open, computePosition, content]);

  useEffect(() => {
    if (!open) return;

    const handleScroll = () => computePosition();
    const handleResize = () => computePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open || !touchMode) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = targetRef.current;
      if (!target) return;
      if (target.contains(event.target as Node)) return;
      close();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('orientationchange', close);
    window.addEventListener('scroll', close, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('orientationchange', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, touchMode, close]);

  return (
    <>
      <span
        ref={targetRef}
        className={`vk-tooltip-target inline-flex items-center ${className}`}
        onMouseEnter={() => {
          if (touchMode) return;
          openTooltip();
        }}
        onMouseLeave={() => {
          if (touchMode) return;
          close();
        }}
        onFocus={() => {
          if (touchMode) return;
          openTooltip();
        }}
        onBlur={() => {
          if (touchMode) return;
          close();
        }}
        onClick={() => {
          if (!touchMode) return;
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setCoords({ x: 0, y: 0, placement: position });
            } else {
              setCoords(null);
            }
            return next;
          });
        }}
        aria-describedby={open ? tooltipId : undefined}
      >
        {children}
      </span>
      {mounted && open && coords
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className={className.includes('vk-tooltip-brand') ? 'vk-tooltip-portal vk-tooltip-portal--brand' : 'vk-tooltip-portal'}
              data-position={coords.placement}
              style={
                {
                  '--vk-tooltip-x': `${coords.x}px`,
                  '--vk-tooltip-y': `${coords.y}px`,
                } as React.CSSProperties
              }
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
