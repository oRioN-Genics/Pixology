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
import CanvasNotch from "../components/CanvasNotch";
import AnimationFrameRail from "../components/AnimationFrameRail";

const MAX_HISTORY = 100;

const CanvasBoard = () => {
  const location = useLocation();
  const {
    width: initialW = 16,
    height: initialH = 16,
    projectName: initialName = "Untitled",
    projectId: initialId = null,
  } = location.state || {};

  const [width, setWidth] = useState(initialW);
  const [height, setHeight] = useState(initialH);
  const [projectName, setProjectName] = useState(initialName);
  const [projectId, setProjectId] = useState(initialId);

  const [selectedTool, setSelectedTool] = useState("pencil");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [mode, setMode] = useState("static"); // 'static' | 'animations'

  // Layers (static mode)
  const [layers, setLayers] = useState([
    { id: "l1", name: "Layer 1", visible: true, locked: false },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");

  // Pixel canvas API (from PixelGridCanvas)
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
    if (id === "undo" || id === "redo") {
      if (mode === "static") {
        return id === "undo" ? void doUndo() : void doRedo();
      }
      // animation-mode undo/redo to be added later
      return;
    }
    setSelectedTool(id);
    if (id === "pencil" || id === "fill" || id === "picker") {
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  // Shortcuts (limit to static mode for now)
  useEffect(() => {
    const handler = (e) => {
      if (mode !== "static") return;
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        doRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

  // Layer ops with history (static mode)
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

  // From canvas: pixel history
  const handlePushHistoryFromCanvas = (entry) => pushHistory(entry);

  // ---------- SAVE (POST then PUT) ----------
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("pixology:user") || "null");
    } catch {
      return null;
    }
  };

  const buildPayload = (snapshot, nameOverride) => ({
    name: (nameOverride ?? projectName) || "Untitled",
    width,
    height,
    selectedLayerId,
    layers: snapshot.layers,
    previewPng: snapshot.previewPng,
    favorite: false,
  });

  // Suggests "Name (1)", "Name (2)", etc.
  const suggestNextName = (base) => {
    const m = String(base || "Untitled").match(/^(.*?)(?:\s\((\d+)\))?$/);
    const stem = m && m[1] ? m[1] : base || "Untitled";
    const n = m && m[2] ? parseInt(m[2], 10) + 1 : 1;
    return `${stem} (${n})`;
  };

  const saveProject = async () => {
    const user = getUser();
    if (!user) return setToastMsg("Please log in to save.");
    if (pixelApiRef.current.isEmpty?.()) {
      return setToastMsg("Nothing to save yet — draw something first.");
    }

    const snapshot = pixelApiRef.current.makeSnapshot?.();
    if (!snapshot) return setToastMsg("Could not read canvas state.");

    const method = projectId ? "PUT" : "POST";
    const url = projectId
      ? `/api/projects/${projectId}?userId=${user.id}`
      : `/api/projects?userId=${user.id}`;

    let currentName = projectName || "Untitled";
    let attempts = 0;

    while (attempts < 5) {
      try {
        const payload = buildPayload(snapshot, currentName);
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();

        if (res.ok) {
          const data = JSON.parse(text);
          if (!projectId && data.id) setProjectId(data.id);
          setProjectName(currentName);
          setToastMsg(projectId ? "Project updated." : "Project saved.");
          return;
        }

        // Name conflict -> prompt rename and retry
        if (res.status === 409) {
          const suggested = suggestNextName(currentName);
          const next = window.prompt(
            `A project named "${currentName}" already exists.\nPlease enter a different name:`,
            suggested
          );
          if (next === null) {
            setToastMsg("Save cancelled.");
            return;
          }
          const trimmed = next.trim();
          if (!trimmed) {
            setToastMsg("Name cannot be empty.");
            attempts++;
            continue;
          }
          currentName = trimmed;
          attempts++;
          continue;
        }

        // Other errors
        setToastMsg(text || "Save failed.");
        return;
      } catch {
        setToastMsg("Network error while saving.");
        return;
      }
    }

    setToastMsg("Too many attempts. Please try a different name.");
  };

  // ---------- LOAD EXISTING PROJECT ----------
  useEffect(() => {
    const user = getUser();
    if (!user || !projectId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}?userId=${user.id}`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to load project.");
        }
        const p = await res.json();
        if (cancelled) return;

        setProjectName(p.name || "Untitled");
        setWidth(p.width);
        setHeight(p.height);
        setSelectedLayerId(p.selectedLayerId || null);

        const meta = (p.layers || []).map((l) => ({
          id: l.id,
          name: l.name,
          visible: !!l.visible,
          locked: !!l.locked,
        }));
        setLayers(meta);

        setTimeout(() => {
          pixelApiRef.current.loadFromSnapshot?.({
            width: p.width,
            height: p.height,
            selectedLayerId: p.selectedLayerId,
            layers: p.layers,
            previewPng: p.previewPng,
          });
        }, 0);
      } catch (e) {
        setToastMsg(e.message || "Could not open project.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ---------- EXPORT (PNG/JPEG download) ----------
  const renderSnapshotToDataURL = (
    snapshot,
    format = "png",
    scale = 4,
    jpegQuality = 0.92
  ) => {
    if (!snapshot) return null;
    const { width: w, height: h } = snapshot;
    const layersArr = Array.isArray(snapshot.layers) ? snapshot.layers : [];

    const cvs = document.createElement("canvas");
    cvs.width = w * scale;
    cvs.height = h * scale;
    const ctx = cvs.getContext("2d");

    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }

    // Draw bottom -> top (your stored order is top-first)
    const ordered = [...layersArr].reverse();
    for (const ly of ordered) {
      if (ly.visible === false) continue;
      const px = ly.pixels || [];
      for (let r = 0; r < h; r++) {
        const row = px[r] || [];
        for (let c = 0; c < w; c++) {
          const hex = row[c];
          if (!hex) continue;
          ctx.fillStyle = hex;
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }

    return format === "jpeg"
      ? cvs.toDataURL("image/jpeg", jpegQuality)
      : cvs.toDataURL("image/png");
  };

  const triggerDownload = (dataUrl, fmt) => {
    if (!dataUrl) return setToastMsg("Failed to export image.");
    const safeName =
      (projectName || "pixology").replace(/[^\w.-]+/g, "_").slice(0, 60) ||
      "pixology";
    const ext = fmt === "jpeg" ? "jpg" : "png";

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${safeName}_${width}x${height}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExportPick = (fmt /* 'png' | 'jpeg' */) => {
    if (mode === "animations") {
      setToastMsg("Export for animations will be added soon.");
      return;
    }
    if (pixelApiRef.current?.isEmpty?.()) {
      setToastMsg("Nothing in the canvas to export.");
      return;
    }
    const snapshot = pixelApiRef.current?.makeSnapshot?.();
    if (!snapshot) {
      setToastMsg("Could not read canvas state.");
      return;
    }
    const dataUrl = renderSnapshotToDataURL(snapshot, fmt, 4, 0.92);
    triggerDownload(dataUrl, fmt);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gray-100" />
      <div className="relative z-10">
        <NavBar
          // ...props unchanged...
          underNotch={<CanvasNotch mode={mode} onModeChange={setMode} />}
        />

        {/* Right-edge Layers panel (static mode only) */}
        {mode === "static" && (
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
        )}

        {/* Main row */}
        <div
          className={`flex gap-4 pt-24 px-1 ${
            mode === "static" ? "pr-[16rem] sm:pr-[18rem] md:pr-[20rem]" : ""
          }`}
        >
          {/* Left tools: now always visible (same panel for both modes) */}
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

          {/* Canvas / Animation rail area */}
          <div className="flex-1 flex items-start justify-center relative">
            {mode === "static" ? (
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
            ) : (
              <div className="w-full">
                <AnimationFrameRail
                  width={width}
                  height={height}
                  selectedTool={selectedTool}
                  color={currentColor}
                  onRequireLayer={(msg) => setToastMsg(msg)}
                  onPickColor={(hex) => {
                    if (hex) {
                      setCurrentColor(hex);
                      setShowColorPicker(true);
                    }
                  }}
                />
              </div>
            )}

            {/* Color Picker popover (now for both modes) */}
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
