import React from "react";
import LayerItem from "./LayerItem";

const LayersPanel = ({
  layers,
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
        {layers.map((ly) => (
          <LayerItem
            key={ly.id}
            layer={ly}
            selected={selectedId === ly.id}
            onSelect={() => onSelect(ly.id)}
            onToggleVisible={() => onToggleVisible(ly.id)}
            onToggleLocked={() => onToggleLocked(ly.id)}
            onRename={() => onRename(ly.id)}
            onDelete={() => onDelete(ly.id)}
          />
        ))}
      </div>
    </aside>
  );
};

export default LayersPanel;
