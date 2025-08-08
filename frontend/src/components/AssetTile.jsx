import React from "react";
import { Star, Share2 } from "lucide-react"; // optional; remove if not using lucide

/**
 * AssetTile
 * A small, square preview card for an asset.
 *
 * Props:
 * - id: string
 * - name: string
 * - previewSrc: string (img url or data URL). If absent, shows a checkerboard + placeholder.
 * - sizeLabel?: string (e.g., "32×32")
 * - selected?: boolean
 * - isFavorite?: boolean
 * - isShared?: boolean
 * - onClick?: (id) => void
 * - onDoubleClick?: (id) => void
 * - onContextMenu?: (id, event) => void
 */
const AssetTile = ({
  id,
  name,
  previewSrc,
  sizeLabel,
  selected = false,
  isFavorite = false,
  isShared = false,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      onDoubleClick={() => onDoubleClick?.(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(id, e);
      }}
      title={name}
      className={["group w-[140px] select-none", "focus:outline-none"].join(
        " "
      )}
    >
      {/* Preview box */}
      <div
        className={[
          "relative aspect-square rounded-lg border shadow-sm",
          "bg-[length:16px_16px] bg-[linear-gradient(45deg,#e6e9ef_25%,transparent_25%),linear-gradient(-45deg,#e6e9ef_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e6e9ef_75%),linear-gradient(-45deg,transparent_75%,#e6e9ef_75%)]",
          "bg-[position:0_0,0_8px,8px_-8px,-8px_0]",
          selected ? "border-sky-500 ring-2 ring-sky-300" : "border-gray-200",
          "overflow-hidden",
          "transition-all",
          "hover:shadow-md",
        ].join(" ")}
      >
        {/* Image */}
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={name}
            className="absolute inset-0 w-full h-full object-contain p-2"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">
            No preview
          </div>
        )}

        {/* Favorite star */}
        {isFavorite && (
          <div className="absolute left-1 top-1 rounded-full bg-white/90 p-1 shadow">
            {/* swap for your asset star if you prefer */}
            <Star size={14} className="fill-yellow-400 stroke-yellow-500" />
          </div>
        )}

        {/* Shared badge */}
        {isShared && (
          <div className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow">
            <Share2 size={14} className="text-sky-600" />
          </div>
        )}

        {/* Size pill */}
        {sizeLabel && (
          <div className="absolute right-1 bottom-1 text-[11px] px-1.5 py-0.5 rounded bg-black/70 text-white">
            {sizeLabel}
          </div>
        )}

        {/* Selection outline on hover (when not selected) */}
        {!selected && (
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-sky-400/0 group-hover:ring-sky-400/40 transition" />
        )}
      </div>

      {/* Name */}
      <div className="mt-2 w-full text-left truncate text-sm font-medium text-gray-900">
        {name}
      </div>
    </button>
  );
};

export default AssetTile;
