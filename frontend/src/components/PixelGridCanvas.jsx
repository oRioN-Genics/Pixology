import React, { useRef, useState, useEffect, useMemo } from "react";

const MAX_HISTORY = 100; // cap actions in memory

const PixelGridCanvas = ({
  width,
  height,
  selectedTool,
  color,
  activeLayerId,
  layers = [],
  onRequireLayer,
  onPickColor,
  undoTick,
  redoTick,
}) => {
  const cellSize = 30;

  const FILL = { tolerance: 0, contiguous: true, sampleAllLayers: false };

  // ---- Color helpers ----
  const hexToRgb = (hex) => {
    if (!hex) return null;
    let h = hex.replace("#", "");
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };
  const rgbDistSq = (a, b) => {
    const dr = a.r - b.r,
      dg = a.g - b.g,
      db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  };
  const matchesColor = (targetHex, candidateHex, tolerance) => {
    // Transparent: equal only if both null when tolerance=0
    if (targetHex === null || candidateHex === null) {
      return tolerance === 0 ? targetHex === candidateHex : false;
    }
    if (tolerance <= 0)
      return targetHex.toLowerCase() === candidateHex.toLowerCase();
    const t = hexToRgb(targetHex);
    const c = hexToRgb(candidateHex);
    if (!t || !c) return false;
    const tSq = tolerance * tolerance;
    return rgbDistSq(t, c) <= tSq;
  };

  // static cell refs
  const grid = useMemo(
    () =>
      Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => ({ row, col }))
      ),
    [width, height]
  );

  const containerRef = useRef(null);
  const gridRef = useRef(null);

  // ------ pan/zoom state ------
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState(null); // 'hand' | 'middle' | null
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPointerInside, setIsPointerInside] = useState(false);

  const handlePointerEnter = () => setIsPointerInside(true);
  const handlePointerLeave = () => setIsPointerInside(false);

  // ------ per-layer pixel buffers ------
  // Map<layerId, string[][]> hex or null
  const [buffers, setBuffers] = useState(() => new Map());
  const makeBlank = () =>
    Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );

  useEffect(() => {
    setBuffers((prev) => {
      const next = new Map(prev);
      // create buffers for new layers
      layers.forEach((ly) => {
        if (!next.has(ly.id)) next.set(ly.id, makeBlank());
      });
      // drop buffers for removed layers
      for (const id of Array.from(next.keys())) {
        if (!layers.some((ly) => ly.id === id)) next.delete(id);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, width, height]);

  // composite visible layers: first non-null from topmost (layers[0] is top)
  const compositeAt = (row, col) => {
    for (const ly of layers) {
      if (!ly.visible) continue;
      const buf = buffers.get(ly.id);
      const px = buf?.[row]?.[col];
      if (px) return px;
    }
    return null;
  };

  // -------- History (diff-based) --------
  // A "diff" = { layerId, row, col, prev, next }
  const undoStack = useRef([]); // array of diffs arrays
  const redoStack = useRef([]); // array of diffs arrays
  const currentStroke = useRef(null); // Map key->diff for active drag

  const recordPixelChangeInStroke = (layerId, row, col, prev, next) => {
    if (!currentStroke.current) return;
    const key = `${layerId}:${row}:${col}`;
    const existing = currentStroke.current.get(key);
    if (existing) {
      existing.next = next; // preserve original prev, update next
    } else {
      currentStroke.current.set(key, { layerId, row, col, prev, next });
    }
  };

  const pushHistory = (diffs) => {
    if (!diffs || diffs.length === 0) return;
    undoStack.current.push(diffs);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    // new action invalidates redo stack
    redoStack.current = [];
  };

  const applyDiffs = (diffs, direction = "apply") => {
    setBuffers((prev) => {
      const next = new Map(prev);
      // group by layer, pre-copy affected rows
      const rowsToCopy = new Map(); // layerId -> Set(row)

      for (const d of diffs) {
        if (!rowsToCopy.has(d.layerId)) rowsToCopy.set(d.layerId, new Set());
        rowsToCopy.get(d.layerId).add(d.row);
      }

      for (const [layerId, rows] of rowsToCopy.entries()) {
        const buf = next.get(layerId);
        if (!buf) continue;
        const newLayer = buf.slice();
        for (const r of rows) newLayer[r] = buf[r].slice();
        next.set(layerId, newLayer);
      }

      for (const d of diffs) {
        const layer = next.get(d.layerId);
        if (!layer) continue;
        const use = direction === "undo" ? d.prev : d.next;
        layer[d.row][d.col] = use;
      }

      return next;
    });
  };

  // external undo/redo triggers
  const lastUndoTick = useRef(undoTick);
  const lastRedoTick = useRef(redoTick);

  useEffect(() => {
    if (undoTick === lastUndoTick.current) return;
    lastUndoTick.current = undoTick;

    const diffs = undoStack.current.pop();
    if (!diffs) return;
    applyDiffs(diffs, "undo");
    redoStack.current.push(diffs);
  }, [undoTick]);

  useEffect(() => {
    if (redoTick === lastRedoTick.current) return;
    lastRedoTick.current = redoTick;

    const diffs = redoStack.current.pop();
    if (!diffs) return;
    applyDiffs(diffs, "redo");
    undoStack.current.push(diffs);
  }, [redoTick]);

  // write + record into current stroke
  const setPixelWithHistory = (layerId, row, col, next) => {
    const prev = buffers.get(layerId)?.[row]?.[col] ?? null;
    if (prev === next) return;

    // apply immediate
    setBuffers((prevBuf) => {
      const nextBuf = new Map(prevBuf);
      const layer = nextBuf.get(layerId);
      if (!layer) return prevBuf;
      const rowCopy = layer[row].slice();
      rowCopy[col] = next;
      const newLayer = layer.slice();
      newLayer[row] = rowCopy;
      nextBuf.set(layerId, newLayer);
      return nextBuf;
    });

    // record
    recordPixelChangeInStroke(layerId, row, col, prev, next);
  };

  // Flood fill returning diffs (for history), then apply + push
  const floodFillApply = (
    layerId,
    startRow,
    startCol,
    newHex,
    { tolerance, contiguous, sampleAllLayers }
  ) => {
    const lyBuf = buffers.get(layerId);
    if (!lyBuf) return;

    const getAt = (r, c) =>
      sampleAllLayers ? compositeAt(r, c) : lyBuf?.[r]?.[c] ?? null;
    const targetHex = getAt(startRow, startCol);
    if (matchesColor(targetHex, newHex, tolerance)) return;

    const visited = new Uint8Array(width * height);
    const mark = (r, c) => {
      visited[r * width + c] = 1;
    };
    const seen = (r, c) => visited[r * width + c] === 1;

    const q = [[startRow, startCol]];
    mark(startRow, startCol);

    const diffs = [];
    const tryPush = (r, c) => {
      if (r < 0 || c < 0 || r >= height || c >= width) return;
      if (seen(r, c)) return;
      const cand = getAt(r, c);
      if (matchesColor(targetHex, cand, tolerance)) {
        mark(r, c);
        q.push([r, c]);
      }
    };

    while (q.length) {
      const [r, c] = q.pop();
      const prev = lyBuf[r][c] ?? null;
      diffs.push({ layerId, row: r, col: c, prev, next: newHex });

      if (contiguous) {
        tryPush(r + 1, c);
        tryPush(r - 1, c);
        tryPush(r, c + 1);
        tryPush(r, c - 1);
      }
    }

    applyDiffs(diffs, "apply");
    pushHistory(diffs);
  };

  // ------ drawing guard ------
  const ensureDrawableLayer = () => {
    const ly = layers.find((l) => l.id === activeLayerId);
    if (!activeLayerId || !ly) {
      onRequireLayer?.("Select a layer to draw.");
      return null;
    }
    if (ly.locked) {
      onRequireLayer?.("Selected layer is locked.");
      return null;
    }
    if (!ly.visible) {
      onRequireLayer?.("Selected layer is hidden.");
      return null;
    }
    return ly;
  };

  // ------ interactions ------
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = (e) => {
    // middle mouse panning
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragSource("middle");
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = "grabbing";
      return;
    }
    // left mouse panning (hand)
    if (e.button === 0 && selectedTool === "hand") {
      e.preventDefault();
      setIsDragging(true);
      setDragSource("hand");
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = "grabbing";
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragSource(null);
    setIsDrawing(false);

    // finalize stroke → push history
    if (currentStroke.current && currentStroke.current.size > 0) {
      pushHistory(Array.from(currentStroke.current.values()));
      currentStroke.current = null;
    }

    document.body.style.cursor = "default";
  };

  // wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (!isPointerInside) return;
      e.preventDefault();
      const zoomSpeed = 0.1;
      const delta = -e.deltaY;
      setScale((prev) => {
        let next = prev + (delta > 0 ? zoomSpeed : -zoomSpeed);
        return Math.min(4, Math.max(0.5, next));
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isPointerInside]);

  // cursor
  const cursorStyle =
    selectedTool === "hand"
      ? isDragging
        ? "grabbing"
        : "grab"
      : isDragging && dragSource === "middle"
      ? "grabbing"
      : selectedTool === "picker"
      ? "crosshair"
      : "crosshair";

  // cell handlers (pencil / eraser / fill / picker)
  const onCellMouseDown = (row, col) => (e) => {
    if (e.button !== 0) return;

    // Eyedropper: sample composited color, no layer required
    if (selectedTool === "picker") {
      e.preventDefault();
      const sampled = compositeAt(row, col);
      if (sampled) {
        onPickColor?.(sampled);
      } else {
        onRequireLayer?.("No color at this pixel (transparent).");
      }
      return;
    }

    // Drawing tools require valid active layer
    if (
      selectedTool === "pencil" ||
      selectedTool === "eraser" ||
      selectedTool === "fill"
    ) {
      const ly = ensureDrawableLayer();
      if (!ly) return;

      e.preventDefault();

      if (selectedTool === "fill") {
        floodFillApply(
          ly.id,
          row,
          col,
          color || "#000000",
          FILL // { tolerance, contiguous, sampleAllLayers }
        );
        return;
      }

      // start a stroke for pencil/eraser (diffs batched)
      currentStroke.current = new Map();
      setIsDrawing(true);

      const next = selectedTool === "pencil" ? color || "#000000" : null;
      setPixelWithHistory(ly.id, row, col, next);
    }
  };

  const onCellMouseEnter = (row, col) => () => {
    if (!isDrawing) return;
    const ly = ensureDrawableLayer();
    if (!ly) return;

    const next = selectedTool === "pencil" ? color || "#000000" : null;
    setPixelWithHistory(ly.id, row, col, next);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: cursorStyle }}
    >
      <div
        ref={gridRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          border: "2px solid #7ab1daff",
          boxShadow: "0 0 30px rgba(0,0,0,0.2)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map(({ row, col }) => {
              const px = compositeAt(row, col); // composited preview
              const isLight = (row + col) % 2 === 0;
              const baseColor = isLight ? "#e6f0ff" : "#dfe9f5";

              return (
                <div
                  key={`${row}-${col}`}
                  className="transition-colors duration-75 ease-in-out"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: px ?? baseColor,
                  }}
                  onMouseDown={onCellMouseDown(row, col)}
                  onMouseEnter={onCellMouseEnter(row, col)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PixelGridCanvas;
