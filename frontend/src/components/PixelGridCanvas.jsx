import React, { useRef, useState, useEffect, useMemo } from "react";

const PixelGridCanvas = ({
  width,
  height,
  selectedTool,
  color,
  activeLayerId,
  layers = [],
  onRequireLayer,
  onPickColor,
  onPushHistory,
  onRegisterPixelAPI,
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
  const [dragSource, setDragSource] = useState(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const handlePointerEnter = () => setIsPointerInside(true);
  const handlePointerLeave = () => setIsPointerInside(false);

  // ------ per-layer pixel buffers ------
  // Map<layerId, string|null[][]>
  const [buffers, setBuffers] = useState(() => new Map());
  const makeBlank = () =>
    Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );

  // Keep buffers in sync with layers and size (create/drop maps)
  useEffect(() => {
    setBuffers((prev) => {
      const next = new Map(prev);
      layers.forEach((ly) => {
        if (!next.has(ly.id)) next.set(ly.id, makeBlank());
      });
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

  // --------- API helpers ----------
  const applyPixelDiffs = (diffs) => {
    setBuffers((prev) => {
      const next = new Map(prev);
      const perLayerRows = new Map();
      for (const d of diffs) {
        if (!perLayerRows.has(d.layerId))
          perLayerRows.set(d.layerId, new Set());
        perLayerRows.get(d.layerId).add(d.row);
      }
      for (const [layerId, rows] of perLayerRows.entries()) {
        const buf = next.get(layerId);
        if (!buf) continue;
        const newLayer = buf.slice();
        for (const r of rows) newLayer[r] = buf[r].slice();
        next.set(layerId, newLayer);
      }
      for (const d of diffs) {
        const layer = next.get(d.layerId);
        if (!layer) continue;
        layer[d.row][d.col] = d.next;
      }
      return next;
    });
  };

  const undoPixelDiffs = (diffs) => {
    setBuffers((prev) => {
      const next = new Map(prev);
      const perLayerRows = new Map();
      for (const d of diffs) {
        if (!perLayerRows.has(d.layerId))
          perLayerRows.set(d.layerId, new Set());
        perLayerRows.get(d.layerId).add(d.row);
      }
      for (const [layerId, rows] of perLayerRows.entries()) {
        const buf = next.get(layerId);
        if (!buf) continue;
        const newLayer = buf.slice();
        for (const r of rows) newLayer[r] = buf[r].slice();
        next.set(layerId, newLayer);
      }
      for (const d of diffs) {
        const layer = next.get(d.layerId);
        if (!layer) continue;
        layer[d.row][d.col] = d.prev;
      }
      return next;
    });
  };

  const hasAnyPixel = () => {
    for (const ly of layers) {
      const buf = buffers.get(ly.id);
      if (!buf) continue;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (buf[r][c]) return true;
        }
      }
    }
    return false;
  };

  const generatePreviewPng = () => {
    try {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const hex = compositeAt(r, c);
          if (!hex) continue;
          ctx.fillStyle = hex;
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  const makeSnapshot = () => ({
    width,
    height,
    selectedLayerId: activeLayerId || null,
    layers: layers.map((l) => ({
      id: l.id,
      name: l.name,
      visible: !!l.visible,
      locked: !!l.locked,
      pixels: buffers.get(l.id) || makeBlank(),
    })),
    previewPng: generatePreviewPng(),
  });

  // allow parent to seed buffers from a backend snapshot
  const loadFromSnapshot = (snapshot) => {
    if (!snapshot || !Array.isArray(snapshot.layers)) return;
    // Build a new buffers Map using the snapshot pixels
    setBuffers(() => {
      const next = new Map();
      snapshot.layers.forEach((l) => {
        const src = Array.isArray(l.pixels) ? l.pixels : makeBlank();
        // copy rows defensively
        const copy = src.map((row) => row.slice());
        next.set(l.id, copy);
      });
      return next;
    });
  };

  // Register API with parent
  useEffect(() => {
    onRegisterPixelAPI?.({
      applyPixelDiffs,
      undoPixelDiffs,
      isEmpty: () => (!hasAnyPixel() ? true : false),
      makeSnapshot,
      loadFromSnapshot,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterPixelAPI, buffers, layers, width, height, activeLayerId]);

  // ------ layer guard ------
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
  const currentStroke = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragSource("middle");
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = "grabbing";
      return;
    }
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

    if (currentStroke.current && currentStroke.current.size > 0) {
      const diffs = Array.from(currentStroke.current.values());
      onPushHistory?.({ type: "pixels", diffs });
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

  const cursorStyle =
    selectedTool === "hand"
      ? isDragging
        ? "grabbing"
        : "grab"
      : isDragging && dragSource === "middle"
      ? "grabbing"
      : "crosshair";

  // ---- diff writers ----
  const setPixelImmediateWithDiff = (layerId, row, col, next) => {
    const prev = buffers.get(layerId)?.[row]?.[col] ?? null;
    if (prev === next) return;

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

    if (currentStroke.current) {
      const key = `${layerId}:${row}:${col}`;
      const existing = currentStroke.current.get(key);
      if (existing) {
        existing.next = next;
      } else {
        currentStroke.current.set(key, { layerId, row, col, prev, next });
      }
    }
  };

  const applyFillAndReturnDiffs = (
    layerId,
    startRow,
    startCol,
    newHex,
    { tolerance, contiguous, sampleAllLayers }
  ) => {
    const lyBuf = buffers.get(layerId);
    if (!lyBuf) return [];

    const getAt = (r, c) =>
      sampleAllLayers ? compositeAt(r, c) : lyBuf?.[r]?.[c] ?? null;
    const targetHex = getAt(startRow, startCol);
    if (matchesColor(targetHex, newHex, tolerance)) return [];

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

    applyPixelDiffs(diffs);
    return diffs;
  };

  // ---- cell handlers ----
  const onCellMouseDown = (row, col) => (e) => {
    if (e.button !== 0) return;

    if (selectedTool === "picker") {
      e.preventDefault();
      const sampled = compositeAt(row, col);
      if (sampled) onPickColor?.(sampled);
      else onRequireLayer?.("No color at this pixel (transparent).");
      return;
    }

    if (
      selectedTool === "pencil" ||
      selectedTool === "eraser" ||
      selectedTool === "fill"
    ) {
      const ly = ensureDrawableLayer();
      if (!ly) return;

      e.preventDefault();

      if (selectedTool === "fill") {
        const diffs = applyFillAndReturnDiffs(
          ly.id,
          row,
          col,
          color || "#000000",
          FILL
        );
        if (diffs.length) onPushHistory?.({ type: "pixels", diffs });
        return;
      }

      currentStroke.current = new Map();
      setIsDrawing(true);

      const next = selectedTool === "pencil" ? color || "#000000" : null;
      setPixelImmediateWithDiff(ly.id, row, col, next);
    }
  };

  const onCellMouseEnter = (row, col) => () => {
    if (!isDrawing) return;
    const ly = ensureDrawableLayer();
    if (!ly) return;
    const next = selectedTool === "pencil" ? color || "#000000" : null;
    setPixelImmediateWithDiff(ly.id, row, col, next);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor:
          selectedTool === "hand"
            ? isDragging
              ? "grabbing"
              : "grab"
            : isDragging && dragSource === "middle"
            ? "grabbing"
            : "crosshair",
      }}
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
              const px = compositeAt(row, col);
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
