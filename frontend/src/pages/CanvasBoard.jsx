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
import TimelinePanel from "../components/TimelinePanel";
import { api } from "../api";

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
  const [framesCount, setFramesCount] = useState(0);

  // AUTO-DISMISS TOASTS (2.5s)
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(""), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ===== Static-mode layers =====
  const [layers, setLayers] = useState([
    { id: "l1", name: "Layer 1", visible: true, locked: false },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");

  // ===== Animations-mode layer bridge =====
  const [animLayers, setAnimLayers] = useState([]);
  const [animSelectedLayerId, setAnimSelectedLayerId] = useState(null);
  const animLayerApiRef = useRef(null);
  const animRailApiRef = useRef(null);
  const pendingAnimSnapshotRef = useRef(null);

  // ===== Timeline bridge =====
  const timelineApiRef = useRef(null);
  const timelineSeededRef = useRef(false);
  const [initialTimelineAnims, setInitialTimelineAnims] = useState(null);
  const memoInitialTimelineAnims = useMemo(
    () => initialTimelineAnims || [],
    [initialTimelineAnims]
  );

  // ===== Preview frames for Timeline =====
  const [animPreviewFrames, setAnimPreviewFrames] = useState([]);

  // Pixel canvas API
  const pixelApiRef = useRef({});

  // ----- Static-mode history -----
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const pushHistory = (entry) => {
    undoStack.current.push(entry);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = [];
  };

  const doUndoStatic = () => {
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

  const doRedoStatic = () => {
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
        return id === "undo" ? void doUndoStatic() : void doRedoStatic();
      }
      const rail = animRailApiRef.current;
      if (!rail) return;
      if (id === "undo") rail.undo?.();
      else rail.redo?.();
      return;
    }
    setSelectedTool(id);
    if (id === "pencil" || id === "fill" || id === "picker") {
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  // Shortcuts
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (mode === "static") doUndoStatic();
        else animRailApiRef.current?.undo?.();
        return;
      }

      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        if (mode === "static") doRedoStatic();
        else animRailApiRef.current?.redo?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

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

  const handlePushHistoryFromCanvas = (entry) => pushHistory(entry);

  // ---------- SAVE ----------
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
        const res = await api(url, {
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

        setToastMsg(text || "Save failed.");
        return;
      } catch {
        setToastMsg("Network error while saving.");
        return;
      }
    }

    setToastMsg("Too many attempts. Please try a different name.");
  };

  const anyPixelsInFrames = (frames = []) => {
    for (const f of frames) {
      for (const l of f.layers || []) {
        const rows = l.pixels || [];
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            if (row[c]) return true;
          }
        }
      }
    }
    return false;
  };

  const saveAnimationProject = async () => {
    const user = getUser();
    if (!user) return setToastMsg("Please log in to save.");
    const rail = animRailApiRef.current;
    if (!rail?.collectAnimationSnapshot) {
      return setToastMsg("Animation rail not ready.");
    }

    const animSnap = rail.collectAnimationSnapshot();
    if (!animSnap?.frames?.length) {
      return setToastMsg(
        "Nothing to save yet — add a frame and draw something first."
      );
    }
    if (!anyPixelsInFrames(animSnap.frames)) {
      return setToastMsg("Nothing to save yet — draw something first.");
    }

    const timeline = timelineApiRef.current?.collectTimelineSnapshot?.() || [];

    const method = projectId ? "PUT" : "POST";
    const url = projectId
      ? `/api/projects/animations/${projectId}?userId=${user.id}`
      : `/api/projects/animations?userId=${user.id}`;

    let currentName = projectName || "Untitled";
    let attempts = 0;

    const buildAnimPayload = (snap, nameOverride) => ({
      name: (nameOverride ?? projectName) || "Untitled",
      width: snap.width,
      height: snap.height,
      frames: (snap.frames || []).map((f) => ({
        id: f.id,
        name: f.name,
        selectedLayerId: f.selectedLayerId ?? null,
        layers: f.layers,
      })),
      animations: timeline.map((a) => ({
        id: a.id,
        name: a.name,
        frames: a.frames || [],
        loopMode: a.loopMode || "forward",
      })),
      previewPng: snap.previewPng || null,
      favorite: false,
    });

    while (attempts < 5) {
      try {
        const payload = buildAnimPayload(animSnap, currentName);
        const res = await api(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();

        if (res.ok) {
          const data = JSON.parse(text);
          if (!projectId && data.id) setProjectId(data.id);
          setProjectName(currentName);
          setToastMsg(projectId ? "Animation updated." : "Animation saved.");
          return;
        }

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
        const res = await api(`/api/projects/${projectId}?userId=${user.id}`);
        if (res.ok) {
          const p = await res.json();
          if (cancelled) return;

          setMode("static");
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
          return;
        }

        if (res.status === 404) {
          const resAnim = await api(
            `/api/projects/animations/${projectId}?userId=${user.id}`
          );
          if (!resAnim.ok) {
            const t = await resAnim.text();
            throw new Error(t || "Failed to load project.");
          }
          const pa = await resAnim.json();
          if (cancelled) return;

          setMode("animations");
          setProjectName(pa.name || "Untitled");
          setWidth(pa.width);
          setHeight(pa.height);

          const snapshot = {
            width: pa.width,
            height: pa.height,
            frames: (pa.frames || []).map((f) => ({
              id: f.id,
              name: f.name,
              selectedLayerId: f.selectedLayerId ?? null,
              layers: f.layers,
            })),
            previewPng: pa.previewPng || null,
          };

          setInitialTimelineAnims(pa.animations || []);

          if (animRailApiRef.current?.loadFromAnimationSnapshot) {
            animRailApiRef.current.loadFromAnimationSnapshot(snapshot);
          } else {
            pendingAnimSnapshotRef.current = snapshot;
          }
          return;
        }

        const t = await res.text();
        throw new Error(t || "Failed to load project.");
      } catch (e) {
        if (!cancelled) setToastMsg(e.message || "Could not open project.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleExposeRailAPI = (api) => {
    animRailApiRef.current = api || null;
    if (api && pendingAnimSnapshotRef.current) {
      api.loadFromAnimationSnapshot?.(pendingAnimSnapshotRef.current);
      pendingAnimSnapshotRef.current = null;
    }
    rebuildAnimPreviewFrames();
  };

  // ===== Build preview frames for Timeline/Preview (transparent background) =====
  const renderLayersToCtx = (ctx, layersArr, w, h, dx, dy, scale, opaqueBG) => {
    if (opaqueBG) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(dx, dy, w * scale, h * scale);
    }
    const ordered = [...(layersArr || [])].reverse();
    for (const ly of ordered) {
      if (ly.visible === false) continue;
      const px = ly.pixels || [];
      for (let r = 0; r < h; r++) {
        const row = px[r] || [];
        for (let c = 0; c < w; c++) {
          const hex = row[c];
          if (!hex) continue;
          ctx.fillStyle = hex;
          ctx.fillRect(dx + c * scale, dy + r * scale, scale, scale);
        }
      }
    }
  };

  const rebuildAnimPreviewFrames = () => {
    const rail = animRailApiRef.current;
    if (!rail?.collectAnimationSnapshot) return;

    const snap = rail.collectAnimationSnapshot();
    const frames = Array.isArray(snap?.frames) ? snap.frames : [];

    const fns = frames.map((f) => {
      const layersArr = f.layers || [];
      return (ctx, previewW, previewH) => {
        const scaleX = previewW / width;
        const scaleY = previewH / height;
        const scale = Math.min(scaleX, scaleY) || 1;
        const dx = Math.max(0, Math.floor((previewW - width * scale) / 2));
        const dy = Math.max(0, Math.floor((previewH - height * scale) / 2));

        renderLayersToCtx(ctx, layersArr, width, height, dx, dy, scale, false);
      };
    });

    setAnimPreviewFrames(fns);
  };

  useEffect(() => {
    if (mode !== "animations") return;
    rebuildAnimPreviewFrames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framesCount, width, height, mode]);

  useEffect(() => {
    if (mode !== "animations") return;
    rebuildAnimPreviewFrames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animLayers, animSelectedLayerId, mode]);

  // ---------- EXPORT ----------
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

  const renderSpriteSheetDataURL = (
    animSnap,
    format = "png",
    scale = 4,
    jpegQuality = 0.92,
    maxPerRow = 10
  ) => {
    if (!animSnap || !Array.isArray(animSnap.frames) || !animSnap.frames.length)
      return null;

    const w = animSnap.width;
    const h = animSnap.height;
    const frames = animSnap.frames;

    const cols = Math.min(maxPerRow, frames.length);
    const rows = Math.ceil(frames.length / cols);

    const sheetW = cols * w * scale;
    const sheetH = rows * h * scale;

    const cvs = document.createElement("canvas");
    cvs.width = sheetW;
    cvs.height = sheetH;
    const ctx = cvs.getContext("2d");

    const opaqueBG = format === "jpeg";
    if (opaqueBG) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sheetW, sheetH);
    }

    frames.forEach((f, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const dx = c * w * scale;
      const dy = r * h * scale;

      const ordered = [...(f.layers || [])].reverse();
      for (const ly of ordered) {
        if (ly.visible === false) continue;
        const px = ly.pixels || [];
        for (let rr = 0; rr < h; rr++) {
          const row = px[rr] || [];
          for (let cc = 0; cc < w; cc++) {
            const hex = row[cc];
            if (!hex) continue;
            ctx.fillStyle = hex;
            ctx.fillRect(dx + cc * scale, dy + rr * scale, scale, scale);
          }
        }
      }
    });

    return format === "jpeg"
      ? cvs.toDataURL("image/jpeg", jpegQuality)
      : cvs.toDataURL("image/png");
  };

  const triggerDownload = (dataUrl, fmt, extra = "") => {
    if (!dataUrl) return setToastMsg("Failed to export image.");
    const safeName =
      (projectName || "pixology").replace(/[^\w\.-]+/g, "_").slice(0, 60) ||
      "pixology";
    const ext = fmt === "jpeg" ? "jpg" : "png";

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${safeName}_${width}x${height}${extra}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExportPick = (fmt /* 'png' | 'jpeg' */) => {
    if (mode === "static") {
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
      return;
    }

    const rail = animRailApiRef.current;
    if (!rail?.collectAnimationSnapshot) {
      setToastMsg("Animation rail not ready.");
      return;
    }
    const animSnap = rail.collectAnimationSnapshot();
    if (!animSnap?.frames?.length) {
      setToastMsg("No frames to export.");
      return;
    }
    if (!anyPixelsInFrames(animSnap.frames)) {
      setToastMsg("Nothing to export — draw something first.");
      return;
    }

    const cols = Math.min(10, animSnap.frames.length);
    const rows = Math.ceil(animSnap.frames.length / cols);
    const dataUrl = renderSpriteSheetDataURL(animSnap, fmt, 4, 0.92, 10);
    triggerDownload(dataUrl, fmt, `_spritesheet_${cols}x${rows}`);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gray-100" />
      <div className="relative z-10">
        <NavBar
          showLibraryButton
          showExportButton
          ignoreAuthForExport
          showSaveButton
          onSaveClick={() => {
            if (mode === "animations") {
              saveAnimationProject();
              return;
            }
            saveProject();
          }}
          onBeforeExportClick={() => {
            if (mode === "animations") {
              const rail = animRailApiRef.current;
              if (!rail?.collectAnimationSnapshot)
                return "Animation rail not ready.";
              const animSnap = rail.collectAnimationSnapshot();
              if (!animSnap?.frames?.length) return "No frames to export.";
              if (!anyPixelsInFrames(animSnap.frames))
                return "Nothing to export — draw something first.";
              return true;
            }
            if (pixelApiRef.current?.isEmpty?.())
              return "Nothing in the canvas to export.";
            return true;
          }}
          onExportBlocked={(reason) => setToastMsg(reason)}
          onExportPick={handleExportPick}
          underNotch={<CanvasNotch mode={mode} onModeChange={setMode} />}
        />

        {/* Right-edge Layers panel (both modes) */}
        <div className="fixed right-4 top-28 z-20">
          <LayersPanel
            className="w-60 sm:w-64 md:w-72 max-h-[70vh] overflow-y-auto"
            layers={mode === "static" ? layers : animLayers}
            selectedId={
              mode === "static" ? selectedLayerId : animSelectedLayerId
            }
            onSelect={(id) => {
              if (mode === "static") setSelectedLayerId(id);
              else animLayerApiRef.current?.selectLayer?.(id);
            }}
            onAddLayer={() => {
              if (mode === "static") addLayer();
              else animLayerApiRef.current?.addLayer?.();
            }}
            onToggleVisible={(id) => {
              if (mode === "static") toggleVisible(id);
              else animLayerApiRef.current?.toggleVisible?.(id);
            }}
            onToggleLocked={(id) => {
              if (mode === "static") toggleLocked(id);
              else animLayerApiRef.current?.toggleLocked?.(id);
            }}
            onRename={(id) => {
              if (mode === "static") return renameLayer(id);
              const current = (animLayers || []).find((l) => l.id === id);
              const name = prompt("Rename layer:", current?.name ?? "");
              if (name === null) return;
              const trimmed = name.trim();
              if (!trimmed) return;
              animLayerApiRef.current?.renameLayer?.(id, trimmed);
            }}
            onDelete={(id) => {
              if (mode === "static") deleteLayer(id);
              else animLayerApiRef.current?.deleteLayer?.(id);
            }}
          />
        </div>

        {/* Main row */}
        <div
          className={`flex gap-4 pt-24 px-1 ${
            mode === "animations" ? "pb-28" : ""
          }`}
        >
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
                  onActiveFrameMeta={({ layers, selectedLayerId }) => {
                    setAnimLayers(layers || []);
                    setAnimSelectedLayerId(selectedLayerId ?? null);
                  }}
                  onExposeLayerAPI={(api) => {
                    animLayerApiRef.current = api || null;
                  }}
                  onFramesCountChange={(n) => setFramesCount(n)}
                  onExposeRailAPI={(api) => {
                    handleExposeRailAPI(api);
                  }}
                />
              </div>
            )}

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

      {/* Bottom Timeline (animation mode only) */}
      {mode === "animations" && (
        <TimelinePanel
          framesCount={framesCount}
          onToast={(msg) => setToastMsg(msg)}
          initialAnimations={memoInitialTimelineAnims}
          // supply rendered frame functions to Preview (transparent background)
          previewFrames={animPreviewFrames}
          previewWidth={width}
          previewHeight={height}
          onExposeTimelineAPI={(api) => {
            timelineApiRef.current = api || null;
            if (
              api &&
              !timelineSeededRef.current &&
              Array.isArray(initialTimelineAnims)
            ) {
              api.loadFromTimelineSnapshot?.(initialTimelineAnims);
              timelineSeededRef.current = true;
            }
          }}
        />
      )}
    </div>
  );
};

export default CanvasBoard;
