"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

interface Props<T> {
  items: T[];
  getKey: (item: T) => string;
  /** height / width of the tile. */
  getRatio: (item: T) => number;
  render: (item: T) => React.ReactNode;
  minColumnWidth?: number;
  maxColumns?: number;
  gap?: number;
}

/**
 * Shortest-column masonry. Unlike CSS columns (which fill top-to-bottom and leave
 * ragged, empty bottoms), each tile goes into the currently shortest column, so
 * column bottoms stay level and new items append without reshuffling.
 */
export function Masonry<T>({ items, getKey, getRatio, render, minColumnWidth = 240, maxColumns = 5, gap = 12 }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);
  const [width, setWidth] = useState(1200);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setWidth(w);
      setCols(Math.max(2, Math.min(maxColumns, Math.floor((w + gap) / (minColumnWidth + gap)))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minColumnWidth, maxColumns, gap]);

  const columns = useMemo(() => {
    const out: T[][] = Array.from({ length: cols }, () => []);
    const heights = new Array(cols).fill(0);
    // Heights in column-width units; the gap below each tile counts too.
    const colWidth = Math.max(1, (width - gap * (cols - 1)) / cols);
    const gapUnits = gap / colWidth;
    for (const item of items) {
      let target = 0;
      for (let c = 1; c < cols; c++) if (heights[c] < heights[target] - 1e-6) target = c;
      out[target].push(item);
      heights[target] += getRatio(item) + gapUnits;
    }
    return out;
  }, [items, cols, getRatio, width, gap]);

  return (
    <div ref={ref} className="flex items-stretch" style={{ gap }}>
      {columns.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
          {col.map((item, j) => (
            // The last tile in each column grows to the tallest column's bottom, so the
            // grid ends on a level edge (tiles use object-cover, so it crops, not stretches).
            <div key={getKey(item)} className={j === col.length - 1 ? "flex flex-1 flex-col [&>*]:flex-1" : undefined}>
              {render(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
