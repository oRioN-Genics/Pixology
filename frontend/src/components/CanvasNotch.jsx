import React from "react";

const CanvasNotch = ({ mode = "static", onModeChange = () => {} }) => {
  const isStatic = mode === "static";
  const isAnim = mode === "animations";

  return (
    <div className="inline-flex items-center rounded-full border border-black/5 bg-white/62 backdrop-blur px-1 py-1 shadow-md">
      <div
        role="tablist"
        aria-label="Canvas mode"
        className="inline-flex gap-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isStatic}
          className={[
            "px-3 md:px-4 py-1.5 rounded-full text-sm md:text-base font-medium transition",
            isStatic
              ? "bg-[#4D9FDC] text-white shadow"
              : "text-black/80 hover:bg-black/5",
          ].join(" ")}
          onClick={() => onModeChange("static")}
        >
          Static
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isAnim}
          className={[
            "px-3 md:px-4 py-1.5 rounded-full text-sm md:text-base font-medium transition",
            isAnim
              ? "bg-[#4D9FDC] text-white shadow"
              : "text-black/80 hover:bg-black/5",
          ].join(" ")}
          onClick={() => onModeChange("animations")}
        >
          Animations
        </button>
      </div>
    </div>
  );
};

export default CanvasNotch;
