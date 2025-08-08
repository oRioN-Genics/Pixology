import React, { useState, useMemo } from "react";
import PixelGridCanvas from "../components/PixelGridCanvas";
import NavBar from "../components/NavBar";
import LeftPanel from "../components/LeftPanel";
import ToolButton from "../components/ToolButton";
import LayersPanel from "../components/LayersPanel";
import ColorPicker from "../components/ColorPicker";
import { useLocation } from "react-router-dom";
import { assets } from "../assets";

const CanvasBoard = () => {
  const location = useLocation();
  const { width, height } = location.state || { width: 16, height: 16 };

  const [selectedTool, setSelectedTool] = useState("pencil");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = useMemo(
    () => [
      { id: "hand", label: "Move", icon: assets.handIcon },
      { id: "pencil", label: "Pencil", icon: assets.pencilIcon },
      { id: "eraser", label: "Eraser", icon: assets.eraserIcon },
      { id: "fill", label: "Fill", icon: assets.fillIcon },
      { id: "picker", label: "Color Picker", icon: assets.colorPickerIcon },
      { id: "zoom", label: "Zoom", icon: assets.zoomIcon },
      { id: "undo", label: "Undo", icon: assets.undoIcon },
      { id: "redo", label: "Redo", icon: assets.redoIcon },
    ],
    []
  );

  const handleToolClick = (id) => {
    if (id === "undo" || id === "redo") {
      console.log(id);
      return;
    }
    setSelectedTool(id);

    // Open color picker when clicking Pencil or Fill
    if (id === "pencil" || id === "fill") {
      setShowColorPicker(true);
    } else if (id === "picker") {
      // We'll wire this to pick from canvas later
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  // Layers (unchanged)
  const [layers, setLayers] = useState([
    { id: "l1", name: "Layer 1", visible: true, locked: false },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");

  const addLayer = () => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `l${Date.now()}`;
    setLayers((ls) => [
      { id, name: `Layer ${ls.length + 1}`, visible: true, locked: false },
      ...ls,
    ]);
    setSelectedLayerId(id);
  };
  const toggleVisible = (id) =>
    setLayers((ls) =>
      ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  const toggleLocked = (id) =>
    setLayers((ls) =>
      ls.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  const renameLayer = (id) => {
    const current = layers.find((l) => l.id === id);
    const name = prompt("Rename layer:", current?.name ?? "");
    if (name !== null) {
      setLayers((ls) =>
        ls.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l))
      );
    }
  };
  const deleteLayer = (id) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId((ls) => layers.find((l) => l.id !== id)?.id ?? "");
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gray-100" />
      <div className="relative z-10">
        <NavBar showOnlySignUp showOnlyLogin showExportButton />

        {/* Right-edge Layers panel */}
        <div className="fixed right-4 top-28 z-20">
          <LayersPanel
            className="w-60 sm:w-64 md:w-72 max-h-[70vh] overflow-y-auto"
            layers={layers}
            selectedId={selectedLayerId}
            onSelect={setSelectedLayerId}
            onAddLayer={addLayer}
            onToggleVisible={toggleVisible}
            onToggleLocked={toggleLocked}
            onRename={renameLayer}
            onDelete={deleteLayer}
          />
        </div>

        {/* Main row (reserve space for right panel) */}
        <div className="flex gap-4 pt-20 px-1 pr-[16rem] sm:pr-[18rem] md:pr-[20rem]">
          {/* Left tools */}
          <LeftPanel className="sticky top-28 self-start">
            {tools.map((t) => (
              <ToolButton
                key={t.id}
                iconSrc={t.icon}
                label={t.label}
                selected={selectedTool === t.id}
                onClick={() => handleToolClick(t.id)}
                colorIndicator={
                  t.id === "pencil" || t.id === "fill"
                    ? currentColor
                    : undefined
                }
              />
            ))}
          </LeftPanel>

          {/* Canvas */}
          <div className="flex-1 flex items-start justify-center relative">
            <PixelGridCanvas
              width={width}
              height={height}
              selectedTool={selectedTool}
              color={currentColor} // <-- we'll use this to draw next
              activeLayerId={selectedLayerId} // <-- for later
            />

            {/* Color Picker popover (positioned near canvas) */}
            {showColorPicker && (
              <div className="absolute left-0 top-0 mt-2">
                <ColorPicker
                  initial={currentColor}
                  onChange={setCurrentColor}
                  onApply={(hex) => {
                    setCurrentColor(hex);
                    setShowColorPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasBoard;
