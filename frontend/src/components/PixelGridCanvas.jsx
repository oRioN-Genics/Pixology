import React, { useRef, useState } from "react";

const PixelGridCanvas = ({ width, height }) => {
  const cellSize = 30;
  const grid = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ row, col }))
  );

  const containerRef = useRef(null);
  const gridRef = useRef(null); // Ref for the actual grid area
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1); // for zoom

  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setLastMousePos({ x: e.clientX, y: e.clientY });
    setTranslate((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = "default";
  };

  const handleWheel = (e) => {
    const gridRect = gridRef.current?.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Check if mouse is inside the grid area
    const isInGrid =
      gridRect &&
      mouseX >= gridRect.left &&
      mouseX <= gridRect.right &&
      mouseY >= gridRect.top &&
      mouseY <= gridRect.bottom;

    if (!isInGrid) return; // Let normal scroll happen outside grid

    e.preventDefault();

    const zoomSpeed = 0.1;
    const delta = -e.deltaY;
    setScale((prevScale) => {
      let nextScale = prevScale + (delta > 0 ? zoomSpeed : -zoomSpeed);
      return Math.min(4, Math.max(0.5, nextScale));
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        ref={gridRef}
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
