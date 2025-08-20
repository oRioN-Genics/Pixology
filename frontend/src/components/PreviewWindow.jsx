import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

const PreviewWindow = forwardRef(
  (
    {
      frames = [],
      width = 128,
      height = 128,
      pixelPerfect = true,
      onion = {
        enabled: false,
        prev: 0,
        next: 0,
        fade: 0.5,
        mode: "alpha",
        prevTint: "rgba(255,80,80,0.35)",
        nextTint: "rgba(80,255,120,0.35)",
      },
      title = "Preview",
      className = "",
      onRegisterPreviewAPI,
      displayScale = 6,
      fps,
      onFpsChange,
    },
    ref
  ) => {
    // no React state per-frame; render straight to canvas
    const canvasRef = useRef(null);
    const sourcesRef = useRef(Array.isArray(frames) ? frames : []);
    const currentRef = useRef(0);

    useEffect(() => {
      sourcesRef.current = Array.isArray(frames) ? frames : [];
      currentRef.current = 0;
      drawComposite(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frames]);

    const frameCount = () => sourcesRef.current.length;

    const cfg = useMemo(
      () => ({
        enabled: false,
        prev: 0,
        next: 0,
        fade: 0.5,
        mode: "alpha",
        prevTint: "rgba(255,80,80,0.35)",
        nextTint: "rgba(80,255,120,0.35)",
        ...onion,
      }),
      [onion]
    );

    const drawOne = (ctx, item, alpha = 1, tint = null) => {
      if (!item) return;
      ctx.save();
      if (pixelPerfect) {
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = "low";
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      if (typeof item === "function") {
        item(ctx, width, height);
      } else if (
        item instanceof HTMLCanvasElement ||
        (typeof ImageBitmap !== "undefined" && item instanceof ImageBitmap) ||
        item instanceof HTMLImageElement
      ) {
        ctx.drawImage(item, 0, 0, width, height);
      }

      if (tint) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
    };

    const drawComposite = (index) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const count = frameCount();
      if (!count) return;

      const idxNorm = ((index % count) + count) % count;

      // prev ghosts
      if (cfg.enabled && cfg.prev > 0) {
        for (let i = cfg.prev; i >= 1; i--) {
          const idx = (idxNorm - i + count) % count;
          const falloff = Math.pow(1 - cfg.fade, i);
          const alpha = 0.6 * falloff;
          const tint = cfg.mode === "tint" ? cfg.prevTint : null;
          drawOne(
            ctx,
            sourcesRef.current[idx],
            cfg.mode === "alpha" ? alpha : 1,
            tint
          );
        }
      }

      // current
      drawOne(ctx, sourcesRef.current[idxNorm], 1, null);

      // next ghosts
      if (cfg.enabled && cfg.next > 0) {
        for (let i = 1; i <= cfg.next; i++) {
          const idx = (idxNorm + i) % count;
          const falloff = Math.pow(1 - cfg.fade, i);
          const alpha = 0.6 * falloff;
          const tint = cfg.mode === "tint" ? cfg.nextTint : null;
          drawOne(
            ctx,
            sourcesRef.current[idx],
            cfg.mode === "alpha" ? alpha : 1,
            tint
          );
        }
      }
    };

    useEffect(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = width;
      cvs.height = height;
      drawComposite(currentRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height]);

    const api = useMemo(
      () => ({
        setFrames(newFrames) {
          sourcesRef.current = Array.isArray(newFrames) ? newFrames : [];
          currentRef.current = 0;
          drawComposite(0);
        },
        seek(index) {
          currentRef.current = index | 0;
          drawComposite(currentRef.current);
        },
        step(delta) {
          const count = frameCount() || 1;
          currentRef.current =
            (((currentRef.current + (delta | 0)) % count) + count) % count;
          drawComposite(currentRef.current);
        },
        setOnionSkin(newCfg) {
          Object.assign(cfg, newCfg);
          drawComposite(currentRef.current);
        },
        resize(w, h) {
          const cvs = canvasRef.current;
          if (!cvs) return;
          cvs.width = w | 0;
          cvs.height = h | 0;
          drawComposite(currentRef.current);
        },
        redraw() {
          drawComposite(currentRef.current);
        },
        get count() {
          return frameCount();
        },
        get index() {
          return currentRef.current;
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [cfg]
    );

    useImperativeHandle(ref, () => api, [api]);

    useEffect(() => {
      onRegisterPreviewAPI?.(api);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api]);

    const scale = Math.max(1, displayScale | 0);

    return (
      <div
        className={[
          "rounded-xl bg-white border border-[#d7e5f3] shadow-sm",
          "ring-1 ring-black/5 overflow-hidden select-none",
          className,
        ].join(" ")}
      >
        {/* Title + FPS */}
        <div className="h-9 px-3 flex items-center justify-between bg-[#eaf4ff] text-[#2b4a6a] border-b border-[#d7e5f3]">
          <span className="text-sm font-semibold">{title}</span>

          {typeof fps !== "undefined" && onFpsChange && (
            <div className="flex items-center gap-2">
              <label className="text-xs opacity-80" htmlFor="preview-fps-input">
                FPS
              </label>
              <input
                id="preview-fps-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={fps}
                onChange={(e) => {
                  const n = parseInt(e.target.value || "0", 10);
                  onFpsChange(
                    Number.isFinite(n) ? Math.max(1, Math.min(120, n)) : 1
                  );
                }}
                className="w-16 h-7 rounded-md border border-[#cfe0f1] bg-white px-2 text-sm text-[#2b4a6a] outline-none focus:ring-2 focus:ring-[#4D9FDC]"
                title="Playback frames per second"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 bg-[#f5f0f7]">
          <div className="mx-auto max-w-max border-2 border-[#cfe0f1] bg-white">
            <div
              className="relative"
              style={{
                width: width * scale,
                height: height * scale,
                backgroundSize: "16px 16px",
                backgroundImage:
                  "linear-gradient(45deg, #cfcfcf 25%, transparent 25%)," +
                  "linear-gradient(-45deg, #cfcfcf 25%, transparent 25%)," +
                  "linear-gradient(45deg, transparent 75%, #cfcfcf 75%)," +
                  "linear-gradient(-45deg, transparent 75%, #cfcfcf 75%)",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                backgroundColor: "#ededed",
              }}
            >
              <canvas
                ref={canvasRef}
                className="block w-full h-full"
                style={{ imageRendering: pixelPerfect ? "pixelated" : "auto" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PreviewWindow;
