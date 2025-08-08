import React from "react";

const ToolButton = ({ iconSrc, label, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className={[
        "h-10 w-10 rounded-md flex items-center justify-center",
        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400",
        selected ? "bg-gray-200 ring-1 ring-sky-300" : "bg-white",
      ].join(" ")}
    >
      <img src={iconSrc} alt="" className="h-5 w-5 pointer-events-none" />
    </button>
  );
};

export default ToolButton;
