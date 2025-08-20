// components/PreviewWindow.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

const PreviewWindow = forwardRef(
  (
    {
      frames = [],
      width = 128,
      height = 128,
      pixelPerfect = true,
      onion = {
        enabled: true,
        prev: 2,
        next: 2,
        fade: 0.5,
        mode: "alpha", // "alpha" | "tint"
        prevTint: "rgba(255,80,80,0.35)",
        nextTint: "rgba(80,255,120,0.35)",
      },
      title = "Preview",
      className = "",
      onRegisterPreviewAPI,
    },
    ref
  ) => {
    const [current, setCurrent] = useState(0);
    const [sources, setSources] = useState(frames);
    const canvasRef = useRef(null);

    // keep in sync if the prop changes (non-breaking; still ok to use setFrames from parent)
    useEffect(() => {
      setSources(frames || []);
    }, [frames]);

    const frameCount = sources?.length ?? 0;
    const cfg = useMemo(
      () => ({
        enabled: true,
        prev: 2,
        next: 2,
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
      if (!cvs || !frameCount) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, cvs.width, cvs.height);

      // prev ghosts
      if (cfg.enabled && cfg.prev > 0) {
        for (let i = cfg.prev; i >= 1; i--) {
          const idx = (index - i + frameCount) % frameCount;
          const falloff = Math.pow(1 - cfg.fade, i);
          const alpha = 0.6 * falloff;
          const tint = cfg.mode === "tint" ? cfg.prevTint : null;
          drawOne(ctx, sources[idx], cfg.mode === "alpha" ? alpha : 1, tint);
        }
      }

      // current
      drawOne(ctx, sources[index], 1, null);

      // next ghosts
      if (cfg.enabled && cfg.next > 0) {
        for (let i = 1; i <= cfg.next; i++) {
          const idx = (index + i) % frameCount;
          const falloff = Math.pow(1 - cfg.fade, i);
          const alpha = 0.6 * falloff;
          const tint = cfg.mode === "tint" ? cfg.nextTint : null;
          drawOne(ctx, sources[idx], cfg.mode === "alpha" ? alpha : 1, tint);
        }
      }
    };

    useEffect(() => {
      if (!frameCount) {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, width, height);
        return;
      }
      const clamped = ((current % frameCount) + frameCount) % frameCount;
      drawComposite(clamped);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, sources, frameCount, width, height, pixelPerfect, cfg]);

    const api = useMemo(
      () => ({
        setFrames(newFrames) {
          setSources(Array.isArray(newFrames) ? newFrames : []);
        },
        seek(index) {
          setCurrent((_) => index | 0);
        },
        step(delta) {
          setCurrent((c) => c + (delta | 0));
        },
        setOnionSkin(newCfg) {
          Object.assign(cfg, newCfg);
          drawComposite(
            ((current % (sources?.length || 1)) + (sources?.length || 1)) %
              (sources?.length || 1)
          );
        },
        resize(w, h) {
          const cvs = canvasRef.current;
          if (!cvs) return;
          cvs.width = w | 0;
          cvs.height = h | 0;
          drawComposite(current);
        },
        redraw() {
          drawComposite(current);
        },
        get count() {
          return sources?.length ?? 0;
        },
        get index() {
          return current;
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [current, sources, cfg]
    );

    useImperativeHandle(ref, () => api, [api]);
    useEffect(() => {
      onRegisterPreviewAPI?.(api);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api]);

    useEffect(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = width;
      cvs.height = height;
    }, [width, height]);

    return (
      <div
        className={[
          // light theme container
          "rounded-xl bg-white border border-[#d7e5f3] shadow-sm",
          "ring-1 ring-black/5 overflow-hidden select-none",
          className,
        ].join(" ")}
      >
        {/* Light title bar with only the title */}
        <div className="h-8 px-3 flex items-center bg-[#eaf4ff] text-[#2b4a6a] border-b border-[#d7e5f3]">
          <span className="text-sm font-semibold">{title}</span>
        </div>

        {/* Content: light gutter + checkerboard center */}
        <div className="p-2 bg-[#f5f0f7]">
          <div className="mx-auto max-w-max border-2 border-[#cfe0f1] bg-white">
            <div
              className="relative"
              style={{
                width,
                height,
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
