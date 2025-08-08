import React, { useRef, useState, useEffect, useMemo } from "react";

const PixelGridCanvas = ({ width, height, selectedTool, color }) => {
  const cellSize = 30;

  const grid = useMemo(
    () =>
      Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => ({ row, col }))
      ),
    [width, height]
  );

  const containerRef = useRef(null);
  const gridRef = useRef(null);

  // --- pan/zoom state ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState(null); // 'hand' | 'middle' | null
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPointerInside, setIsPointerInside] = useState(false);

  const handlePointerEnter = () => setIsPointerInside(true);
  const handlePointerLeave = () => setIsPointerInside(false);

  // --- pixel color buffer ---
  const [pixels, setPixels] = useState(() =>
    Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    )
  );
  useEffect(() => {
    setPixels(
      Array.from({ length: height }, () =>
        Array.from({ length: width }, () => null)
      )
    );
  }, [width, height]);

  const paintAt = (row, col, hexOrNull) => {
    if (row < 0 || col < 0 || row >= height || col >= width) return;
    setPixels((prev) => {
      const next = prev.map((r) => r.slice());
      next[row][col] = hexOrNull; // null = clear
      return next;
    });
  };

  const [isDrawing, setIsDrawing] = useState(false);

  // Mouse down on container (for panning)
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
    setIsDrawing(false); // stop drawing/erasing drags
    document.body.style.cursor = "default";
  };

  // Wheel zoom
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

  // Cursor: hand shows grab/grabbing; otherwise crosshair while drawing tools are active
  const cursorStyle =
    selectedTool === "hand"
      ? isDragging
        ? "grabbing"
        : "grab"
      : isDragging && dragSource === "middle"
      ? "grabbing"
      : "crosshair";

  // --- Cell handlers: pencil + eraser ---
  const onCellMouseDown = (row, col) => (e) => {
    if (e.button !== 0) return; // left only
    if (selectedTool === "pencil") {
      e.preventDefault();
      paintAt(row, col, color || "#000000");
      setIsDrawing(true);
    } else if (selectedTool === "eraser") {
      // NEW
      e.preventDefault();
      paintAt(row, col, null); // NEW (clear pixel)
      setIsDrawing(true); // NEW (drag to keep erasing)
    }
    // (fill/picker to be added later)
  };

  const onCellMouseEnter = (row, col) => (e) => {
    if (!isDrawing) return;
    if (selectedTool === "pencil") {
      paintAt(row, col, color || "#000000");
    } else if (selectedTool === "eraser") {
      // NEW
      paintAt(row, col, null); // NEW
    }
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
              const isLight = (row + col) % 2 === 0;
              const baseColor = isLight ? "#e6f0ff" : "#dfe9f5";
              const pixel = pixels[row][col];
              return (
                <div
                  key={`${row}-${col}`}
                  className="transition-colors duration-75 ease-in-out"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: pixel ?? baseColor,
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
