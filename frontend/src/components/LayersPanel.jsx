import React from "react";

const LayersPanel = ({
  layers = [],
  selectedId,
  onSelect,
  onAddLayer,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onDelete,
  className = "",
}) => {
  return (
    <aside
      className={[
        "bg-white rounded-l-xl shadow-md border border-gray-200 w-72",
        "px-3 py-3",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Layers</h2>
        <button
          type="button"
          title="Add layer"
          onClick={onAddLayer}
          className="text-sm px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          + Add
        </button>
      </div>

      {/* List (scroll if long) */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {layers.map((ly) => {
          const selected = selectedId === ly.id;
          return (
            <div
              key={ly.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(ly.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(ly.id);
                }
              }}
              className={[
                "w-full text-left bg-white rounded-lg shadow-sm border",
                selected
                  ? "border-sky-300 ring-1 ring-sky-200"
                  : "border-gray-200",
                "px-2 py-2 hover:bg-gray-50 focus:outline-none cursor-pointer",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {ly.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {ly.locked ? "Locked • " : ""}
                    {ly.visible ? "Visible" : "Hidden"}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisible?.(ly.id);
                    }}
                    title={ly.visible ? "Hide" : "Show"}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {ly.visible ? "👁️" : "🚫"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLocked?.(ly.id);
                    }}
                    title={ly.locked ? "Unlock" : "Lock"}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {ly.locked ? "🔒" : "🔓"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename?.(ly.id);
                    }}
                    title="Rename"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(ly.id);
                    }}
                    title="Delete"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default LayersPanel;
