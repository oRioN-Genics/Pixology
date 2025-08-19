import React from "react";
import { Share2 } from "lucide-react";
import { assets } from "../assets";

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
  onToggleFavorite,
  onDelete,
}) => {
  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(id, !isFavorite);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      title={name}
      onClick={() => onClick?.(id)}
      onDoubleClick={() => onDoubleClick?.(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(id, e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onDoubleClick?.(id);
      }}
      className={[
        "group w-[200px] select-none text-left focus:outline-none",
        "transition-transform duration-200 cursor-pointer",
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
          "bg-[length:18px_18px]",
          "bg-[linear-gradient(45deg,#e9edf3_25%,transparent_25%),linear-gradient(-45deg,#e9edf3_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e9edf3_75%),linear-gradient(-45deg,transparent_75%,#e9edf3_75%)]",
          "bg-[position:0_0,0_9px,9px_-9px,-9px_0]",
          "overflow-hidden",
          "transition-all",
        ].join(" ")}
      >
        {/* soft hover glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(77,159,220,0.10), transparent 60%)",
          }}
        />

        {/* Preview image */}
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

        {/* Favorite */}
        <button
          type="button"
          onClick={handleFavClick}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          title={isFavorite ? "Unfavorite" : "Favorite"}
          className="absolute right-2 top-2 rounded-full bg-white/95 backdrop-blur p-1 shadow hover:scale-105 transition"
        >
          <img
            src={isFavorite ? assets.Star : assets.EmptyStar}
            alt=""
            className="w-5 h-5"
            draggable={false}
          />
        </button>

        {/* Delete (under favorite) */}
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label="Delete"
          title="Delete"
          className="absolute right-2 top-10 rounded-full bg-white/95 backdrop-blur p-1 shadow hover:scale-105 transition"
        >
          {assets.DeleteIcon ? (
            <img
              src={assets.DeleteIcon}
              alt=""
              className="w-5 h-5"
              draggable={false}
            />
          ) : (
            <img
              src={assets.Delete}
              alt=""
              className="w-5 h-5"
              draggable={false}
            />
          )}
        </button>

        {/* Shared badge */}
        {isShared && (
          <div className="absolute left-2 top-2 rounded-full bg-white/90 backdrop-blur px-1.5 py-1 shadow-sm">
            <Share2 size={14} className="text-sky-600" />
          </div>
        )}

        {/* Size pill */}
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
      <div
        className="mt-3 w-full truncate text-[15px] font-semibold text-slate-900 group-hover:text-slate-800"
        style={{ fontFamily: "ChakraPetch" }}
      >
        {name}
      </div>
    </div>
  );
};

export default AssetTile;
