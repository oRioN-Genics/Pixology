import React from "react";
import PixelGridCanvas from "../components/PixelGridCanvas";
import { useLocation } from "react-router-dom";

const CanvasBoard = () => {
  const location = useLocation();
  const { width, height } = location.state || { width: 16, height: 16 };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <PixelGridCanvas width={width} height={height} />
    </div>
  );
};

export default CanvasBoard;
