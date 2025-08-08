import React, { useState } from "react";
import BlueButton from "./BlueButton";
import { useNavigate } from "react-router-dom";

const CanvasSizeModal = ({ onClose, onSubmit }) => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = () => {
    setErrorMsg("");

    if (!projectName.trim()) {
      setErrorMsg("Project name is required.");
      return;
    }
    if (width > 256 || height > 256) {
      onSubmit?.(null, "Maximum canvas size is 256x256 pixels.");
      return;
    }

    navigate("/canvas", { state: { projectName, width, height } });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
      <div className="bg-white p-6 rounded-xl shadow-md w-[300px]">
        <h2 className="text-xl font-bold mb-4">New Project</h2>

        {/* Project Name */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="My Pixel Art"
          />
        </div>

        {/* Width */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full border border-gray-300 p-2 rounded"
            min={1}
            max={256}
          />
        </div>

        {/* Height */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full border border-gray-300 p-2 rounded"
            min={1}
            max={256}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="text-sm text-red-600 mb-2">{errorMsg}</div>
        )}

        {/* Actions */}
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
