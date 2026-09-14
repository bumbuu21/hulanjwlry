"use client";
import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { initialStones, isCharm, type Stone } from "@/lib/catalog";

export function CharmIcon({ material, size = 54 }: { material: Stone; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const silver = material.id === "charm-silver-ring" || material.id === "charm-moon";
  const metal = silver ? "#aeb9b7" : "#c3a366";
  const shine = silver ? "#ffffff" : "#fff2cb";
  return (
    <svg
      className="charm-icon"
      width={size}
      height={size}
      x={-size / 2}
      y={-size / 2}
      viewBox="0 0 64 64"
      role="img"
      aria-label={material.name}
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={shine} />
          <stop offset=".42" stopColor={metal} />
          <stop offset=".72" stopColor={shine} />
          <stop offset="1" stopColor={metal} />
        </linearGradient>
      </defs>
      {material.id.endsWith("ring") ? (
        <>
          <ellipse cx="32" cy="33" rx="19" ry="17" fill="none" stroke={metal} strokeWidth="10" />
          <ellipse
            cx="32"
            cy="33"
            rx="19"
            ry="17"
            fill="none"
            stroke={`url(#${uid}-metal)`}
            strokeWidth="6"
          />
          <path d="M18 21c8-6 19-7 28-1" fill="none" stroke="#fff9" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="32" cy="9" r="5" fill="none" stroke={metal} strokeWidth="3" />
          {material.id === "charm-moon" && (
            <path
              d="M38 17a20 20 0 1 0 13 33 22 22 0 0 1-13-33Z"
              fill={`url(#${uid}-metal)`}
              stroke={metal}
              strokeWidth="1.5"
            />
          )}
          {material.id === "charm-heart" && (
            <path
              d="M32 54 12 33C3 22 15 14 24 21l8 8 8-8c9-7 21 1 12 12Z"
              fill={material.color}
              stroke={`url(#${uid}-metal)`}
              strokeWidth="4"
            />
          )}
          {material.id === "charm-star" && (
            <path
              d="m32 15 6.5 12.5 14 2-10 9.8L45 53l-13-6.5L19 53l2.5-13.7-10-9.8 14-2Z"
              fill={`url(#${uid}-metal)`}
              stroke={metal}
              strokeWidth="1.5"
            />
          )}
          {material.id === "charm-sun" && (
            <>
              <circle
                cx="32"
                cy="35"
                r="12"
                fill={`url(#${uid}-metal)`}
                stroke={metal}
                strokeWidth="2"
              />
              <path
                d="M32 15v6m0 28v6M12 35h7m26 0h7M18 21l5 5m18 18 5 5m0-28-5 5M23 44l-5 5"
                stroke={metal}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </>
          )}
        </>
      )}
    </svg>
  );
}

export function Bracelet({
  beads,
  stones = initialStones,
  selected = -1,
  onSelect,
  onSwap,
  className = "",
  tilt = false,
  slots,
}: {
  beads: string[];
  stones?: Stone[];
  selected?: number;
  onSelect?: (index: number) => void;
  onSwap?: (from: number, to: number) => void;
  className?: string;
  tilt?: boolean;
  slots?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    index: number;
    startX: number;
    startY: number;
    moving: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState<{
    index: number;
    dx: number;
    dy: number;
    target: number;
  } | null>(null);
  const radius = 119;
  const beadRadius = Math.min(17, ((Math.PI * radius) / Math.max(beads.length, 1)) * 0.96);
  const positionCount = Math.max(slots ?? beads.length, beads.length, 1);
  function localPoint(event: ReactPointerEvent<SVGGElement>) {
    const matrix = svgRef.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
      : null;
  }
  function dragTarget(x: number, y: number) {
    const distance = Math.hypot(x - 180, y - 172);
    if (distance < radius - 45 || distance > radius + 45) return -1;
    const angle = (Math.atan2(y - 172, x - 180) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    const target = Math.round((angle / (Math.PI * 2)) * positionCount) % positionCount;
    return target < beads.length ? target : -1;
  }
  function pointerDown(event: ReactPointerEvent<SVGGElement>, index: number) {
    if (!onSwap || (event.pointerType === "mouse" && event.button !== 0) || !event.isPrimary)
      return;
    const point = localPoint(event);
    if (!point) return;
    dragRef.current = {
      pointerId: event.pointerId,
      index,
      startX: point.x,
      startY: point.y,
      moving: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: ReactPointerEvent<SVGGElement>) {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const point = localPoint(event);
    if (!point) return;
    const dx = point.x - active.startX,
      dy = point.y - active.startY;
    if (!active.moving && Math.hypot(dx, dy) < 5) return;
    active.moving = true;
    setDrag({ index: active.index, dx, dy, target: dragTarget(point.x, point.y) });
  }
  function pointerEnd(event: ReactPointerEvent<SVGGElement>, cancelled = false) {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (active.moving) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);
      if (!cancelled) {
        const point = localPoint(event);
        const target = point ? dragTarget(point.x, point.y) : -1;
        if (target >= 0 && target !== active.index) onSwap?.(active.index, target);
      }
    }
    dragRef.current = null;
    setDrag(null);
  }
  return (
    <svg
      ref={svgRef}
      className={`bracelet-svg ${className}`}
      viewBox="0 0 360 360"
      role={onSelect ? "group" : "img"}
      aria-label={
        onSelect ? "Бугуйвчны чулуу сонгох" : `${beads.length} чулуутай бугуйвчны дүрслэл`
      }
    >
      <defs>
        <filter id={`${uid}-shadow`} x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow
            dx="1.5"
            dy="4.5"
            stdDeviation="2.8"
            floodColor="#3b4039"
            floodOpacity=".29"
          />
        </filter>
        <filter id={`${uid}-glint`}>
          <feGaussianBlur stdDeviation=".8" />
        </filter>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
        {stones.map((s) => (
          <radialGradient
            id={`${uid}-${s.id}`}
            key={s.id}
            cx="30%"
            cy="22%"
            r="82%"
            fx="25%"
            fy="19%"
          >
            <stop offset="0" stopColor="#fffdfa" />
            <stop offset=".18" stopColor={s.light} />
            <stop offset=".46" stopColor={s.color} />
            <stop offset=".78" stopColor={s.color} />
            <stop offset="1" stopColor="#424942" stopOpacity=".84" />
          </radialGradient>
        ))}
        <radialGradient id={`${uid}-shine`} cx="35%" cy="20%" r="65%">
          <stop offset="0" stopColor="white" stopOpacity=".48" />
          <stop offset=".36" stopColor="white" stopOpacity=".06" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-gold`} cx="30%" cy="20%">
          <stop stopColor="#fff4ce" />
          <stop offset=".45" stopColor="#d4b778" />
          <stop offset="1" stopColor="#92784b" />
        </radialGradient>
      </defs>
      <ellipse
        cx="180"
        cy="286"
        rx="108"
        ry="16"
        fill="#655f50"
        opacity=".09"
        filter={`url(#${uid}-blur)`}
      />
      <g
        transform={
          tilt
            ? "translate(0 24) translate(180 156) rotate(-22) scale(1 .83) translate(-180 -156)"
            : undefined
        }
      >
        <circle cx="180" cy="172" r={radius} fill="none" stroke="#c5b391" strokeWidth="1.3" />
        {beads.map((id, i) => {
          const angle = (i / positionCount) * Math.PI * 2 - Math.PI / 2;
          const x = (180 + Math.cos(angle) * radius).toFixed(3),
            y = (172 + Math.sin(angle) * radius).toFixed(3);
          const stone = stones.find((s) => s.id === id) ?? initialStones[0];
          const activeDrag = drag?.index === i;
          return (
            <g
              key={i}
              className={
                onSelect
                  ? `interactive-bead${activeDrag ? " dragging" : ""}${drag?.target === i && !activeDrag ? " drag-target" : ""}`
                  : ""
              }
              transform={`translate(${Number(x) + (activeDrag ? drag.dx : 0)} ${Number(y) + (activeDrag ? drag.dy : 0)})${activeDrag ? " scale(1.12)" : ""}`}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={onSelect ? `${i + 1}. ${stone.name}` : undefined}
              aria-pressed={onSelect ? selected === i : undefined}
              onClick={
                onSelect
                  ? () => {
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      onSelect(i);
                    }
                  : undefined
              }
              onPointerDown={onSwap ? (event) => pointerDown(event, i) : undefined}
              onPointerMove={onSwap ? pointerMove : undefined}
              onPointerUp={onSwap ? pointerEnd : undefined}
              onPointerCancel={onSwap ? (event) => pointerEnd(event, true) : undefined}
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(i);
                      }
                    }
                  : undefined
              }
            >
              <circle
                r={beadRadius + 5}
                fill="transparent"
                stroke={drag?.target === i ? "#5d8d67" : selected === i ? "#3f5549" : "transparent"}
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
              {isCharm(stone) ? (
                <CharmIcon material={stone} size={beadRadius * 2.4} />
              ) : (
                <>
                  <circle
                    r={beadRadius}
                    fill={`url(#${uid}-${stone.id})`}
                    filter={`url(#${uid}-shadow)`}
                  />
                  <circle r={beadRadius * 0.98} fill={`url(#${uid}-shine)`} pointerEvents="none" />
                  <circle
                    r={beadRadius - 0.45}
                    fill="none"
                    stroke="white"
                    strokeOpacity=".18"
                    strokeWidth=".7"
                    pointerEvents="none"
                  />
                  <path
                    d={`M ${-beadRadius * 0.65} ${beadRadius * 0.12} Q 0 ${-beadRadius * 0.7} ${beadRadius * 0.65} ${beadRadius * 0.24} M ${-beadRadius * 0.3} ${beadRadius * 0.75} Q ${beadRadius * 0.55} 0 ${beadRadius * 0.3} ${-beadRadius * 0.7}`}
                    fill="none"
                    stroke={stone.light}
                    strokeWidth="1.7"
                    opacity={i % 3 === 0 ? ".48" : ".22"}
                  />
                  <ellipse
                    cx={-beadRadius * 0.3}
                    cy={-beadRadius * 0.4}
                    rx={beadRadius * 0.3}
                    ry={beadRadius * 0.16}
                    fill="white"
                    opacity=".68"
                    transform="rotate(-35)"
                    filter={`url(#${uid}-glint)`}
                  />
                  <circle
                    cx={-beadRadius * 0.43}
                    cy={-beadRadius * 0.48}
                    r={beadRadius * 0.075}
                    fill="white"
                    opacity=".68"
                    pointerEvents="none"
                  />
                </>
              )}
            </g>
          );
        })}
        {beads.length > 0 && (
          <g transform="translate(180 304)">
            <path d="M0 -9 v10" stroke="#b49a66" strokeWidth="2" />
            <rect x="-7" y="1" width="14" height="17" rx="5" fill={`url(#${uid}-gold)`} />
            <path d="M-2 6 v7 M2 6 v7 M-2 9 h4" stroke="#8d754d" strokeWidth=".9" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function StoneOrb({ stone, small = false }: { stone: Stone; small?: boolean }) {
  return (
    <span
      className={`stone-orb ${small ? "small" : ""}`}
      style={{ "--stone": stone.color, "--stone-light": stone.light } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}
