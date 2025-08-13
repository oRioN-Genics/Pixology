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
    layers: [layer], // topmost first
    activeLayerId: layer.id, // default active layer
  };
};

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

  // APIs per frame (future use)
  const frameApisRef = useRef(new Map());

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ------- Frame ops -------
  const addFrameRight = () => {
    setFrames((prev) => [...prev, makeBlankFrame(prev.length)]);
    setActiveIndex((prev) => prev + 1);
  };

  const removeFrame = (frameId) => {
    setFrames((prev) => {
      if (prev.length <= 1) return prev; // keep at least one
      const idx = prev.findIndex((f) => f.id === frameId);
      const next = prev.filter((f) => f.id !== frameId);

      // adjust active index
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
      // If inside a canvas, let the canvas handle its own pan
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

      // If the wheel is over a canvas and Ctrl/Cmd is NOT held,
      // let the canvas handle its own wheel zoom.
      if (overCanvas && !forceViewport) return;

      // Otherwise, zoom the viewport (background or Ctrl/Cmd over canvas)
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

      // Keep the point under the cursor fixed by adjusting translate
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

              {/* Canvas area is marked interactive so viewport doesn't hijack its wheel */}
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
                  onPushHistory={() => {}}
                  onRegisterPixelAPI={(api) => {
                    frameApisRef.current.set(frame.id, api);
                  }}
                />
              </div>
            </div>
          ))}

          {/* Add frame card */}
          <button
            onClick={addFrameRight}
            className="flex flex-col items-center justify-center min-w-[120px] min-h-[120px] h-full rounded-2xl border-2 border-dashed border-[#9ec3e6] text-[#4D9FDC] hover:bg-white/60 hover:border-[#4D9FDC] transition"
            title="Add a new frame to the right"
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
