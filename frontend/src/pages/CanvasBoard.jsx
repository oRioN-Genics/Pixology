import React, { useState, useMemo, useEffect, useRef } from "react";
import PixelGridCanvas from "../components/PixelGridCanvas";
import NavBar from "../components/NavBar";
import LeftPanel from "../components/LeftPanel";
import ToolButton from "../components/ToolButton";
import LayersPanel from "../components/LayersPanel";
import ColorPicker from "../components/ColorPicker";
import Toast from "../components/Toast";
import { useLocation } from "react-router-dom";
import { assets } from "../assets";

/**
 * Unified history (in-memory):
 *  - { type: 'pixels', diffs }
 *  - { type: 'layers', before, after, selectedBefore, selectedAfter }
 */

const MAX_HISTORY = 100;

const CanvasBoard = () => {
  const location = useLocation();
  const {
    width: initialW = 16,
    height: initialH = 16,
    projectName: initialName = "Untitled",
    projectId: initialId = null, // when opening an existing project, pass this in location.state
  } = location.state || {};

  const [width] = useState(initialW);
  const [height] = useState(initialH);
  const [projectName] = useState(initialName);
  const [projectId, setProjectId] = useState(initialId);

  const [selectedTool, setSelectedTool] = useState("pencil");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  // Layers
  const [layers, setLayers] = useState([
    { id: "l1", name: "Layer 1", visible: true, locked: false },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");

  // Pixel canvas API ref (child registers these)
  // { applyPixelDiffs, undoPixelDiffs, isEmpty, makeSnapshot }
  const pixelApiRef = useRef({});

  // ----- Unified History -----
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const pushHistory = (entry) => {
    undoStack.current.push(entry);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = [];
  };

  const doUndo = () => {
    const entry = undoStack.current.pop();
    if (!entry) return;

    if (entry.type === "pixels") {
      pixelApiRef.current.undoPixelDiffs?.(entry.diffs);
    } else if (entry.type === "layers") {
      setLayers(entry.before);
      setSelectedLayerId(entry.selectedBefore ?? null);
    }

    redoStack.current.push(entry);
  };

  const doRedo = () => {
    const entry = redoStack.current.pop();
    if (!entry) return;

    if (entry.type === "pixels") {
      pixelApiRef.current.applyPixelDiffs?.(entry.diffs);
    } else if (entry.type === "layers") {
      setLayers(entry.after);
      setSelectedLayerId(entry.selectedAfter ?? null);
    }

    undoStack.current.push(entry);
  };

  // ----- Tools -----
  const tools = useMemo(
    () => [
      { id: "hand", label: "Move", icon: assets.handIcon },
      { id: "pencil", label: "Pencil", icon: assets.pencilIcon },
      { id: "eraser", label: "Eraser", icon: assets.eraserIcon },
      { id: "fill", label: "Fill", icon: assets.fillIcon },
      { id: "picker", label: "Color Picker", icon: assets.colorPickerIcon },
      { id: "undo", label: "Undo", icon: assets.undoIcon },
      { id: "redo", label: "Redo", icon: assets.redoIcon },
    ],
    []
  );

  const handleToolClick = (id) => {
    if (id === "undo") {
      doUndo();
      return;
    }
    if (id === "redo") {
      doRedo();
      return;
    }

    setSelectedTool(id);
    if (id === "pencil" || id === "fill" || id === "picker") {
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
        return;
      }
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        doRedo();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ----- Layer ops with history -----
  const deepCloneLayers = (ls) => JSON.parse(JSON.stringify(ls));

  const addLayer = () => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `l${Date.now()}`;
    setLayers((prev) => {
      const before = deepCloneLayers(prev);
      const after = [
        { id, name: `Layer ${prev.length + 1}`, visible: true, locked: false },
        ...prev,
      ];
      pushHistory({
        type: "layers",
        before,
        after: deepCloneLayers(after),
        selectedBefore: selectedLayerId,
        selectedAfter: id,
      });
      setSelectedLayerId(id);
      return after;
    });
  };

  const toggleVisible = (id) => {
    setLayers((prev) => {
      const before = deepCloneLayers(prev);
      const after = prev.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      );
      pushHistory({
        type: "layers",
        before,
        after: deepCloneLayers(after),
        selectedBefore: selectedLayerId,
        selectedAfter: selectedLayerId,
      });
      return after;
    });
  };

  const toggleLocked = (id) => {
    setLayers((prev) => {
      const before = deepCloneLayers(prev);
      const after = prev.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      );
      pushHistory({
        type: "layers",
        before,
        after: deepCloneLayers(after),
        selectedBefore: selectedLayerId,
        selectedAfter: selectedLayerId,
      });
      return after;
    });
  };

  const renameLayer = (id) => {
    const current = layers.find((l) => l.id === id);
    const name = prompt("Rename layer:", current?.name ?? "");
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    setLayers((prev) => {
      const before = deepCloneLayers(prev);
      const after = prev.map((l) =>
        l.id === id ? { ...l, name: trimmed } : l
      );
      pushHistory({
        type: "layers",
        before,
        after: deepCloneLayers(after),
        selectedBefore: selectedLayerId,
        selectedAfter: selectedLayerId,
      });
      return after;
    });
  };

  const deleteLayer = (id) => {
    setLayers((prev) => {
      const before = deepCloneLayers(prev);
      const after = prev.filter((l) => l.id !== id);
      const nextSelected =
        selectedLayerId === id ? after[0]?.id ?? null : selectedLayerId;

      pushHistory({
        type: "layers",
        before,
        after: deepCloneLayers(after),
        selectedBefore: selectedLayerId,
        selectedAfter: nextSelected,
      });

      setSelectedLayerId(nextSelected);
      return after;
    });
  };

  // Receive pixel history entries from canvas
  const handlePushHistoryFromCanvas = (entry) => {
    pushHistory(entry); // entry = { type: 'pixels', diffs }
  };

  // ---------- SAVE (Option A: POST once, then PUT with id) ----------
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("pixology:user") || "null");
    } catch {
      return null;
    }
  };

  const buildPayload = (snapshot) => ({
    name: projectName || "Untitled",
    width,
    height,
    selectedLayerId,
    layers: snapshot.layers, // [{ id, name, visible, locked, pixels }]
    previewPng: snapshot.previewPng, // data URL (optional)
    favorite: false, // or track real value later
  });

  const saveProject = async () => {
    const user = getUser();
    if (!user) {
      setToastMsg("Please log in to save.");
      return;
    }

    if (pixelApiRef.current.isEmpty?.()) {
      setToastMsg("Nothing to save yet — draw something first.");
      return;
    }

    const snapshot = pixelApiRef.current.makeSnapshot?.();
    if (!snapshot) {
      setToastMsg("Could not read canvas state.");
      return;
    }

    const payload = buildPayload(snapshot);
    const method = projectId ? "PUT" : "POST";
    const url = projectId
      ? `/api/projects/${projectId}?userId=${user.id}`
      : `/api/projects?userId=${user.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        setToastMsg(text || "Save failed");
        return;
      }
      const data = JSON.parse(text); // { id, ... }
      if (!projectId && data.id) {
        setProjectId(data.id); // next saves become PUT
      }
      setToastMsg(projectId ? "Project updated." : "Project saved.");
    } catch (e) {
      setToastMsg("Network error while saving.");
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gray-100" />
      <div className="relative z-10">
        <NavBar
          showExportButton
          ignoreAuthForExport
          showSaveButton
          onSaveClick={saveProject}
        />

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
              color={currentColor}
              activeLayerId={selectedLayerId}
              layers={layers}
              onRequireLayer={(msg) => setToastMsg(msg)}
              onPickColor={(hex) => {
                if (hex) setCurrentColor(hex);
                setShowColorPicker(true);
              }}
              onPushHistory={handlePushHistoryFromCanvas}
              onRegisterPixelAPI={(api) => {
                pixelApiRef.current = api || {};
              }}
            />

            {/* Color Picker popover */}
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

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
};

export default CanvasBoard;
