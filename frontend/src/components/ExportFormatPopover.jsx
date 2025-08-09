import React, { useEffect, useRef } from "react";
import BlueButton from "./BlueButton";

const ExportFormatPopover = ({ onSelect, onClose }) => {
  const popRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onClickAway = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [onClose]);

  return (
    <div
      ref={popRef}
      className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50"
    >
      {/* little arrow */}
      <div className="absolute -top-2 right-6 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200" />

      <h3
        className="text-sm font-semibold text-black/80 mb-2"
        style={{ fontFamily: "ChakraPetch" }}
      >
        Export as…
      </h3>
      <div className="flex gap-2">
        <BlueButton
          variant="primary"
          className="flex-1 py-1.5 text-base"
          onClick={() => onSelect?.("png")}
        >
          PNG
        </BlueButton>
        <BlueButton
          variant="primary"
          className="flex-1 py-1.5 text-base"
          onClick={() => onSelect?.("jpeg")}
        >
          JPG
        </BlueButton>
      </div>
    </div>
  );
};

export default ExportFormatPopover;
