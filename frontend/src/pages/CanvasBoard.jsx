import React from "react";
import PixelGridCanvas from "../components/PixelGridCanvas";
import NavBar from "../components/NavBar";
import { useLocation } from "react-router-dom";

const CanvasBoard = () => {
  const location = useLocation();
  const { width, height } = location.state || { width: 16, height: 16 };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-gray-100" />

      {/* Foreground content */}
      <div className="relative z-10">
        <NavBar
          showOnlySignUp={true}
          showOnlyLogin={true}
          showExportButton={true}
        />
        <div className="flex items-center justify-center h-full px-4 pt-20">
          <PixelGridCanvas width={width} height={height} />
        </div>
      </div>
    </div>
  );
};

export default CanvasBoard;
