import React from "react";
import { Star, Share2 } from "lucide-react";

/**
 * AssetTile – bigger & prettier
 * Props unchanged.
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
      title={name}
      onClick={() => onClick?.(id)}
      onDoubleClick={() => onDoubleClick?.(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(id, e);
      }}
      className={[
        "group w-[200px] select-none text-left focus:outline-none",
        "transition-transform duration-200",
        selected ? "translate-y-0" : "hover:-translate-y-[2px]",
      ].join(" ")}
    >
      {/* Card / preview */}
      <div
        className={[
          "relative aspect-square rounded-2xl border",
          "shadow-sm hover:shadow-lg",
          selected
            ? "border-sky-400 ring-2 ring-sky-300/60"
            : "border-slate-200",
          // subtle checkerboard for transparency
          "bg-[length:18px_18px]",
          "bg-[linear-gradient(45deg,#e9edf3_25%,transparent_25%),linear-gradient(-45deg,#e9edf3_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e9edf3_75%),linear-gradient(-45deg,transparent_75%,#e9edf3_75%)]",
          "bg-[position:0_0,0_9px,9px_-9px,-9px_0]",
          "overflow-hidden",
          "transition-all",
        ].join(" ")}
      >
        {/* soft radial glow on hover */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(77,159,220,0.10), transparent 60%)",
          }}
        />
        {/* preview image */}
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={name}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain p-3"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">
            No preview
          </div>
        )}

        {/* badges */}
        {isFavorite && (
          <div className="absolute left-2 top-2 rounded-full bg-white/90 backdrop-blur px-1.5 py-1 shadow-sm">
            <Star size={14} className="fill-yellow-400 stroke-yellow-500" />
          </div>
        )}
        {isShared && (
          <div className="absolute right-2 top-2 rounded-full bg-white/90 backdrop-blur px-1.5 py-1 shadow-sm">
            <Share2 size={14} className="text-sky-600" />
          </div>
        )}

        {/* size pill */}
        {sizeLabel && (
          <div className="absolute right-2 bottom-2 text-[11px] px-2 py-0.5 rounded-full bg-black/70 text-white shadow-sm">
            {sizeLabel}
          </div>
        )}

        {/* hover outline when not selected */}
        {!selected && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-sky-400/0 group-hover:ring-sky-400/35 transition" />
        )}
      </div>

      {/* name */}
      <div className="mt-3 w-full truncate text-[15px] font-semibold text-slate-900 group-hover:text-slate-800">
        {name}
      </div>
    </button>
  );
};

export default AssetTile;
