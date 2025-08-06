import React, { useRef, useState, useEffect } from "react";

const PixelGridCanvas = ({ width, height }) => {
  const cellSize = 30;
  const grid = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ row, col }))
  );

  const containerRef = useRef(null);
  const gridRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPointerInside, setIsPointerInside] = useState(false);

  // Track if pointer is over the grid
  const handlePointerEnter = () => setIsPointerInside(true);
  const handlePointerLeave = () => setIsPointerInside(false);

  // Drag start
  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = "grabbing";
    }
  };

  // Drag move
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  // Drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = "default";
  };

  // Attach wheel event with passive: false to override default scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (!isPointerInside) return; // Let normal scroll work outside
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const baseColor = isLight ? "#e6f0ff" : "#dfe9f5";
              const hoverColor = isLight ? "#d0e4ff" : "#ccdceb";

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="transition-all duration-100 ease-in-out"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: baseColor,
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = hoverColor)
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = baseColor)
                  }
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
