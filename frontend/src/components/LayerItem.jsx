import React from "react";
import { assets } from "../assets";

const LayerItem = ({
  layer,
  selected,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onDelete,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full text-left bg-white rounded-lg shadow-sm border",
        selected ? "border-sky-300 ring-1 ring-sky-200" : "border-gray-200",
        "hover:bg-gray-50 px-3 py-2 flex items-center justify-between",
      ].join(" ")}
    >
      {/* Left: small label */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xs text-gray-500 shrink-0">Layer</span>
        <span className="text-sm font-medium truncate">{layer.name}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          title={layer.visible ? "Hide" : "Show"}
          className="p-1 rounded hover:bg-gray-100"
        >
          <img
            className="w-4 h-5"
            src={layer.visible ? assets.Show : assets.Hide}
            alt={layer.visible ? "Show layer" : "Hide layer"}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLocked();
          }}
          title={layer.locked ? "Unlock" : "Lock"}
          className="p-1 rounded hover:bg-gray-100"
        >
          <span className="text-xs">{layer.locked ? "🔒" : "🔓"}</span>
        </button>

        <div className="relative">
          {/* simple menu: rename / delete */}
          <details className="group">
            <summary className="list-none cursor-pointer p-1 rounded hover:bg-gray-100 text-xs">
              ⋯
            </summary>
            <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-md z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRename();
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </details>
        </div>
      </div>
    </button>
  );
};

export default LayerItem;
