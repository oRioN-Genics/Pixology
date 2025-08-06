import React from "react";

const PixelGridCanvas = ({ width, height }) => {
  const gridSize = 20; // each pixel block size in px
  const canvasWidth = width * gridSize;
  const canvasHeight = height * gridSize;

  const pixels = Array.from({ length: width * height });

  return (
    <div
      className="grid border border-gray-400"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        gridTemplateColumns: `repeat(${width}, ${gridSize}px)`,
        gridTemplateRows: `repeat(${height}, ${gridSize}px)`,
      }}
    >
      {pixels.map((_, idx) => (
        <div
          key={idx}
          className="border border-gray-200 hover:bg-gray-300 transition-colors"
          style={{ width: gridSize, height: gridSize }}
        />
      ))}
    </div>
  );
};

export default PixelGridCanvas;
