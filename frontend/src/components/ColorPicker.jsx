import React, { useEffect, useMemo, useRef, useState } from "react";

/** ------------ Utilities ------------ **/
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rgbToHex({ r, g, b }) {
  const to2 = (n) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
// HSV helpers (H:0-360, S/V:0-1)
function rgbToHsv({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}
function hsvToRgb({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (0 <= h && h < 60) [r1, g1, b1] = [c, x, 0];
  else if (60 <= h && h < 120) [r1, g1, b1] = [x, c, 0];
  else if (120 <= h && h < 180) [r1, g1, b1] = [0, c, x];
  else if (180 <= h && h < 240) [r1, g1, b1] = [0, x, c];
  else if (240 <= h && h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export default function ColorPicker({
  initial = "#000000",
  onChange, // live updates (hex)
  onClose, // close popover
  onApply, // final apply (hex)
  className = "",
}) {
  const [hex, setHex] = useState(initial);
  const [rgb, setRgb] = useState(() => hexToRgb(initial));
  const [hsv, setHsv] = useState(() => rgbToHsv(hexToRgb(initial)));

  // Close on outside click
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [onClose]);

  // Update chains
  const updateFromHex = (value) => {
    const rgbVal = hexToRgb(value);
    const hsvVal = rgbToHsv(rgbVal);
    setHex(value);
    setRgb(rgbVal);
    setHsv(hsvVal);
    onChange?.(value);
  };
  const updateFromRgb = (rgbVal) => {
    const hsvVal = rgbToHsv(rgbVal);
    const hx = rgbToHex(rgbVal);
    setRgb(rgbVal);
    setHsv(hsvVal);
    setHex(hx);
    onChange?.(hx);
  };
  const updateFromHsv = (hsvVal) => {
    const rgbVal = hsvToRgb(hsvVal);
    const hx = rgbToHex(rgbVal);
    setHsv(hsvVal);
    setRgb(rgbVal);
    setHex(hx);
    onChange?.(hx);
  };

  // SV panel interaction
  const svRef = useRef(null);
  const handleSV = (e) => {
    const rect = svRef.current.getBoundingClientRect();
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    updateFromHsv({ ...hsv, s, v });
  };
  const svBg = useMemo(() => {
    const { r, g, b } = hsvToRgb({ h: hsv.h, s: 1, v: 1 });
    return `rgb(${r},${g},${b})`;
  }, [hsv.h]);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[320px] ${className}`}
    >
      {/* Preview */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded border"
          style={{ backgroundColor: hex }}
        />
        <input
          value={hex}
          onChange={(e) => {
            const val = e.target.value.replace(/[^#0-9a-fA-F]/g, "");
            setHex(val);
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val))
              updateFromHex(val);
          }}
          className="w-28 border rounded px-2 py-1 text-sm"
          spellCheck={false}
        />
        <button
          className="ml-auto px-3 py-1.5 rounded bg-sky-600 text-white text-sm hover:opacity-90"
          onClick={() => onApply?.(hex)}
        >
          Apply
        </button>
      </div>

      {/* SV panel */}
      <div
        ref={svRef}
        onMouseDown={(e) => {
          handleSV(e);
          const move = (ev) => handleSV(ev);
          const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
          };
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
        className="relative h-40 rounded mb-3 cursor-crosshair"
        style={{
          background: svBg,
        }}
      >
        {/* white to transparent gradient */}
        <div
          className="absolute inset-0 rounded"
          style={{
            background: "linear-gradient(to right, #fff, rgba(255,255,255,0))",
          }}
        />
        {/* black to transparent gradient */}
        <div
          className="absolute inset-0 rounded"
          style={{
            background: "linear-gradient(to top, #000, rgba(0,0,0,0))",
          }}
        />
        {/* handle */}
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow"
          style={{
            left: `calc(${hsv.s * 100}% - 6px)`,
            top: `calc(${(1 - hsv.v) * 100}% - 6px)`,
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          onChange={(e) => updateFromHsv({ ...hsv, h: +e.target.value })}
          className="w-full"
          style={{
            background:
              "linear-gradient(90deg, red, #ff0, #0f0, #0ff, #00f, #f0f, red)",
            height: 8,
            borderRadius: 6,
            appearance: "none",
          }}
        />
      </div>

      {/* RGB sliders + number inputs */}
      <div className="grid grid-cols-3 gap-2 items-center">
        {["r", "g", "b"].map((k) => (
          <React.Fragment key={k}>
            <label className="text-xs text-gray-600 uppercase">{k}</label>
            <input
              type="range"
              min={0}
              max={255}
              value={rgb[k]}
              onChange={(e) =>
                updateFromRgb({ ...rgb, [k]: clamp(+e.target.value, 0, 255) })
              }
              className="col-span-1"
            />
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[k]}
              onChange={(e) =>
                updateFromRgb({
                  ...rgb,
                  [k]: clamp(+e.target.value || 0, 0, 255),
                })
              }
              className="w-16 border rounded px-2 py-1 text-sm"
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
