import React from "react";

const ToolButton = ({ iconSrc, label, selected, onClick, colorIndicator }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className={[
        "h-10 w-10 rounded-md flex items-center justify-center relative",
        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400",
        selected ? "bg-gray-200 ring-1 ring-sky-300" : "bg-white",
      ].join(" ")}
    >
      <img src={iconSrc} alt="" className="h-5 w-5 pointer-events-none" />

      {/* side teardrop indicator (SVG) */}
      {colorIndicator && (
        <span
          className="absolute right-[-6px] top-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden
        >
          <svg
            width="14"
            height="18"
            viewBox="0 0 14 18"
            className="block"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}
          >
            {/* outer soft outline to separate from any bg */}
            <path
              d="M7 1 C4.2 5.2 1 8.2 1 11.2 C1 14.5 3.7 17 7 17 C10.3 17 13 14.5 13 11.2 C13 8.2 9.8 5.2 7 1 Z"
              fill="white"
              opacity="0.9"
            />
            {/* main drop fill */}
            <path
              d="M7 1 C4.2 5.2 1 8.2 1 11.2 C1 14.5 3.7 17 7 17 C10.3 17 13 14.5 13 11.2 C13 8.2 9.8 5.2 7 1 Z"
              fill={colorIndicator}
            />
            {/* hairline border for crisp edge */}
            <path
              d="M7 1 C4.2 5.2 1 8.2 1 11.2 C1 14.5 3.7 17 7 17 C10.3 17 13 14.5 13 11.2 C13 8.2 9.8 5.2 7 1 Z"
              fill="none"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1"
            />
            {/* subtle highlight */}
            <circle cx="5" cy="8" r="2" fill="white" opacity="0.25" />
          </svg>
        </span>
      )}
    </button>
  );
};

export default ToolButton;
