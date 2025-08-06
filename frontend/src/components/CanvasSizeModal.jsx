import React, { useState } from "react";
import BlueButton from "./BlueButton";
import { useNavigate } from "react-router-dom";

const CanvasSizeModal = ({ onClose, onSubmit }) => {
  const navigate = useNavigate();
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);

  const handleSubmit = () => {
    if (width > 256 || height > 256) {
      onSubmit(null, "Maximum canvas size is 256x256 pixels.");
    } else {
      navigate("/canvas", { state: { width, height } });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
      <div className="bg-white p-6 rounded-xl shadow-md w-[300px]">
        <h2 className="text-xl font-bold mb-4">New Project</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-gray-500 hover:underline">
            Cancel
          </button>
          <BlueButton onClick={handleSubmit}>Create</BlueButton>
        </div>
      </div>
    </div>
  );
};

export default CanvasSizeModal;
