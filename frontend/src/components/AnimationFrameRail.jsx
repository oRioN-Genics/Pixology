import React, { useRef, useState, useEffect } from "react";
import AnimationPixelGridCanvas from "./AnimationPixelGridCanvas";

const makeId = (prefix = "id") =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
    .toString(36)
    .slice(-4)}`;

const newDefaultLayer = () => {
  const id = makeId("layer");
  return { id, name: "Layer 1", visible: true, locked: false };
};

const makeBlankFrame = (index = 0) => {
  const layer = newDefaultLayer();
  return {
    id: makeId("frame"),
    name: `Frame ${index + 1}`,
    layers: [layer],
    activeLayerId: layer.id, // default active layer
  };
};

// Deep clone layers meta
const cloneLayersMeta = (layers) => JSON.parse(JSON.stringify(layers));

const AnimationFrameRail = ({
  width = 16,
  height = 16,
  selectedTool = "pencil",
  color = "#000000",
  onPickColor = () => {},
  onRequireLayer = () => {},
  viewportHeight = "70vh",
  minScale = 0.2,
  maxScale = 3,
  zoomStep = 0.1,

  onActiveFrameMeta,
  onExposeLayerAPI,
  onFramesCountChange,

  // parent can grab a rail-level API (collect, load, undo/redo)
  onExposeRailAPI,
}) => {
  const [frames, setFrames] = useState([makeBlankFrame(0)]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Whole-viewport transform
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // refs
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // API handle per frame: Map<frameId, api>
  const frameApisRef = useRef(new Map());
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ------- Undo/Redo stacks for ANIMATION mode -------
  const undoRef = useRef([]); // entries: { type: 'pixels'|'layers', frameId, diffs? , before?/after? , selectedBefore?/selectedAfter? }
  const redoRef = useRef([]);

  const pushHistory = (entry) => {
    undoRef.current.push(entry);
    if (undoRef.current.length > 200) undoRef.current.shift();
    redoRef.current = [];
  };

  const applyEntry = (entry, direction /* 'undo'|'redo' */) => {
    if (entry.type === "pixels") {
      const api = frameApisRef.current.get(entry.frameId);
      if (!api) return;
      if (direction === "undo") api.undoPixelDiffs?.(entry.diffs);
      else api.applyPixelDiffs?.(entry.diffs);
      return;
    }
    if (entry.type === "layers") {
      setFrames((prev) => {
        const idx = prev.findIndex((f) => f.id === entry.frameId);
        if (idx === -1) return prev;
        const next = prev.slice();
        const f = next[idx];
        const payload =
          direction === "undo"
            ? {
                layers: cloneLayersMeta(entry.before),
                activeLayerId: entry.selectedBefore ?? null,
              }
            : {
                layers: cloneLayersMeta(entry.after),
                activeLayerId: entry.selectedAfter ?? null,
              };
        next[idx] = { ...f, ...payload };
        return next;
      });
      return;
    }
  };

  const undo = () => {
    const entry = undoRef.current.pop();
    if (!entry) return;
    applyEntry(entry, "undo");
    redoRef.current.push(entry);
  };

  const redo = () => {
    const entry = redoRef.current.pop();
    if (!entry) return;
    applyEntry(entry, "redo");
    undoRef.current.push(entry);
  };

  const canUndo = () => undoRef.current.length > 0;
  const canRedo = () => redoRef.current.length > 0;

  // ------- Notify parent about active frame meta -------
  useEffect(() => {
    const f = frames[activeIndex];
    if (!f) return;
    onActiveFrameMeta?.({
      frameId: f.id,
      layers: f.layers,
      selectedLayerId: f.activeLayerId ?? null,
    });
  }, [frames, activeIndex, onActiveFrameMeta]);

  // Report frames count to parent
  useEffect(() => {
    onFramesCountChange?.(frames.length);
  }, [frames.length, onFramesCountChange]);

  // ------- Layer API exposed to parent (with history) -------
  useEffect(() => {
    const getActiveFrame = (arr) => arr[activeIndexRef.current];

    const withLayerHistory = (mutator) => {
      setFrames((prev) => {
        const idx = activeIndexRef.current;
        const f = prev[idx];
        if (!f) return prev;

        const beforeLayers = cloneLayersMeta(f.layers);
        const beforeSel = f.activeLayerId ?? null;

        const next = prev.slice();
        const mutated = mutator({ ...f });
        next[idx] = mutated;

        const afterLayers = cloneLayersMeta(mutated.layers);
        const afterSel = mutated.activeLayerId ?? null;

        pushHistory({
          type: "layers",
          frameId: f.id,
          before: beforeLayers,
          after: afterLayers,
          selectedBefore: beforeSel,
          selectedAfter: afterSel,
        });

        return next;
      });
    };

    const api = {
      selectLayer: (id) => {
        withLayerHistory((f) => {
          if (f.activeLayerId === id) return f;
          return { ...f, activeLayerId: id };
        });
      },
      addLayer: () => {
        withLayerHistory((f) => {
          const id = makeId("layer");
          const newLayer = {
            id,
            name: `Layer ${f.layers.length + 1}`,
            visible: true,
            locked: false,
          };
          return {
            ...f,
            layers: [newLayer, ...f.layers],
            activeLayerId: id,
          };
        });
      },
      toggleVisible: (id) => {
        withLayerHistory((f) => ({
          ...f,
          layers: f.layers.map((l) =>
            l.id === id ? { ...l, visible: !l.visible } : l
          ),
        }));
      },
      toggleLocked: (id) => {
        withLayerHistory((f) => ({
          ...f,
          layers: f.layers.map((l) =>
            l.id === id ? { ...l, locked: !l.locked } : l
          ),
        }));
      },
      renameLayer: (id, newName) => {
        withLayerHistory((f) => ({
          ...f,
          layers: f.layers.map((l) =>
            l.id === id ? { ...l, name: newName } : l
          ),
        }));
      },
      deleteLayer: (id) => {
        withLayerHistory((f) => {
          const after = f.layers.filter((l) => l.id !== id);
          const nextActive =
            f.activeLayerId === id ? after[0]?.id ?? null : f.activeLayerId;
          return {
            ...f,
            layers: after,
            activeLayerId: nextActive,
          };
        });
      },
    };

    onExposeLayerAPI?.(api);
  }, [onExposeLayerAPI]);

  // ------- Rail-level API: collect, load, undo/redo -------
  useEffect(() => {
    if (!onExposeRailAPI) return;
    const api = {
      collectAnimationSnapshot: () => {
        const framesArr = frames.map((f) => {
          const api = frameApisRef.current.get(f.id);
          const snap = api?.makeSnapshot?.();
          return {
            id: f.id,
            name: f.name,
            selectedLayerId: snap?.selectedLayerId ?? f.activeLayerId ?? null,
            layers: snap?.layers ?? [],
            previewPng: snap?.previewPng ?? null,
          };
        });
        const projectPreview = framesArr[0]?.previewPng || null;
        return {
          width,
          height,
          fps: 12,
          frameCount: framesArr.length,
          previewPng: projectPreview,
          frames: framesArr,
        };
      },
      loadFromAnimationSnapshot: (snapshot) => {
        const safeFrames = (snapshot?.frames || []).map((f, i) => ({
          id: f.id || makeId("frame"),
          name: f.name || `Frame ${i + 1}`,
          layers: (f.layers || []).map((l) => ({
            id: l.id,
            name: l.name,
            visible: !!l.visible,
            locked: !!l.locked,
          })) || [newDefaultLayer()],
          activeLayerId: f.selectedLayerId ?? f.layers?.[0]?.id ?? null,
          seedSnapshot: {
            width: snapshot.width,
            height: snapshot.height,
            selectedLayerId: f.selectedLayerId ?? f.layers?.[0]?.id ?? null,
            layers: f.layers || [],
            previewPng: f.previewPng || null,
          },
        }));

        setFrames(safeFrames.length ? safeFrames : [makeBlankFrame(0)]);
        setActiveIndex(Math.max(0, (safeFrames.length || 1) - 1));
        // clear stacks on load
        undoRef.current = [];
        redoRef.current = [];
      },
      undo,
      redo,
      canUndo,
      canRedo,
    };
    onExposeRailAPI(api);
  }, [onExposeRailAPI, frames, width, height]);

  // ------- Add frame helpers -------
  const addFrameAtEnd = () => {
    setFrames((prev) => {
      // new frame uses previous frame's snapshot as seed for pixels (not needed for history)
      const curr = prev[prev.length - 1];
      const prevApi = frameApisRef.current.get(curr.id);
      const seed = prevApi?.makeSnapshot?.() || null;

      let metaLayers = null;
      let nextActiveLayerId = null;
      if (seed && Array.isArray(seed.layers) && seed.layers.length) {
        metaLayers = seed.layers.map((l) => ({
          id: l.id,
          name: l.name,
          visible: !!l.visible,
          locked: !!l.locked,
        }));
        nextActiveLayerId = seed.selectedLayerId || metaLayers[0]?.id || null;
      }

      const newFrame = {
        id: makeId("frame"),
        name: `Frame ${prev.length + 1}`,
        layers: metaLayers || [newDefaultLayer()],
        activeLayerId: metaLayers ? nextActiveLayerId : undefined,
        seedSnapshot: seed,
      };

      const next = prev.concat(newFrame);
      return next;
    });
    setActiveIndex((i) => i + 1);
    // Stacks remain unchanged (adding/removing frames isn't part of pixel/layer history for now)
  };

  const removeFrame = (frameId) => {
    setFrames((prev) => {
      if (prev.length <= 1) return prev; // keep at least one
      const idx = prev.findIndex((f) => f.id === frameId);
      const next = prev.filter((f) => f.id !== frameId);

      setActiveIndex((i) => {
        if (idx === i) return Math.max(0, i - 1);
        if (idx < i) return Math.max(0, i - 1);
        return i;
      });

      frameApisRef.current.delete(frameId);
      return next.map((f, i) => ({ ...f, name: `Frame ${i + 1}` }));
    });
  };

  // ------- Viewport Panning (middle mouse) -------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onMouseDown = (e) => {
      if (e.button !== 1) return; // middle
      const onCanvas = e.target.closest("[data-canvas-interactive='true']");
      if (onCanvas) return;
      e.preventDefault();
      e.stopPropagation();
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
      document.body.style.cursor = "grabbing";
    };

    const onMouseMove = (e) => {
      if (!isPanningRef.current) return;
      const { x, y, tx, ty } = panStartRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      setTranslate({ x: tx + dx, y: ty + dy });
    };

    const onMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      document.body.style.cursor = "default";
    };

    vp.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      vp.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [translate.x, translate.y]);

  // ------- Viewport Zoom (wheel) -------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e) => {
      const overCanvas = !!e.target.closest("[data-canvas-interactive='true']");
      const forceViewport = e.ctrlKey || e.metaKey;
      if (overCanvas && !forceViewport) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = vp.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = scale;
      const dir = e.deltaY < 0 ? 1 : -1; // up=in, down=out
      const newScale = clamp(
        +(oldScale + dir * zoomStep).toFixed(3),
        minScale,
        maxScale
      );
      if (newScale === oldScale) return;

      const cx = mouseX - translate.x;
      const cy = mouseY - translate.y;
      const k = newScale / oldScale;
      const newTx = mouseX - cx * k;
      const newTy = mouseY - cy * k;

      setScale(newScale);
      setTranslate({ x: newTx, y: newTy });
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [scale, translate.x, translate.y, minScale, maxScale, zoomStep]);

  return (
    <div
      ref={viewportRef}
      className="w-full overflow-hidden bg-white/40 rounded-xl border border-[#d7e5f3] shadow-inner"
      style={{ height: viewportHeight, position: "relative" }}
      title="Middle mouse to pan the whole rail. Wheel on background to zoom; Ctrl/Cmd+Wheel to zoom even over a canvas."
    >
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
          padding: "12px",
        }}
      >
        <div className="flex items-start gap-4 pb-2">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className={[
                "relative rounded-2xl border shadow-sm bg-white/70 p-3 select-none",
                index === activeIndex
                  ? "ring-2 ring-[#4D9FDC]"
                  : "ring-2 ring-transparent",
              ].join(" ")}
              onMouseDownCapture={() => setActiveIndex(index)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-[#3c638c]">
                  {frame.name}
                </div>
                <button
                  className={`px-2 py-1 text-xs rounded-md border ${
                    frames.length <= 1
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-[#ffe8e8] hover:border-[#ffbdbd]"
                  }`}
                  onClick={() => removeFrame(frame.id)}
                  disabled={frames.length <= 1}
                  title={
                    frames.length <= 1
                      ? "Keep at least one frame"
                      : "Remove frame"
                  }
                >
                  ✕
                </button>
              </div>

              <div
                className="min-w-[300px] min-h-[300px]"
                data-canvas-interactive="true"
              >
                <AnimationPixelGridCanvas
                  width={width}
                  height={height}
                  selectedTool={selectedTool}
                  color={color}
                  layers={frame.layers}
                  activeLayerId={frame.activeLayerId}
                  onRequireLayer={(msg) =>
                    onRequireLayer(`[${frame.name}] ${msg}`)
                  }
                  onPickColor={(hex) => onPickColor(hex)}
                  // Capture pixel history and add frameId
                  onPushHistory={(entry) => {
                    if (
                      !entry ||
                      entry.type !== "pixels" ||
                      !entry.diffs?.length
                    )
                      return;
                    pushHistory({
                      type: "pixels",
                      frameId: frame.id,
                      diffs: entry.diffs,
                    });
                  }}
                  onRegisterPixelAPI={(api) => {
                    frameApisRef.current.set(frame.id, api);
                    if (frame.seedSnapshot) {
                      api.loadFromSnapshot?.(frame.seedSnapshot);
                      // clear seed once applied
                      setFrames((prev) => {
                        const i = prev.findIndex((f) => f.id === frame.id);
                        if (i === -1) return prev;
                        const updated = prev.slice();
                        updated[i] = { ...prev[i], seedSnapshot: null };
                        return updated;
                      });
                    }
                  }}
                />
              </div>
            </div>
          ))}

          {/* Add frame card (append to the end) */}
          <button
            onClick={addFrameAtEnd}
            className="flex flex-col items-center justify-center min-w-[120px] min-h-[120px] h-full rounded-2xl border-2 border-dashed border-[#9ec3e6] text-[#4D9FDC] hover:bg-white/60 hover:border-[#4D9FDC] transition"
            title="Add a new frame at the end"
          >
            <div className="text-2xl leading-none">＋</div>
            <div className="text-sm mt-1">Add Frame</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimationFrameRail;
