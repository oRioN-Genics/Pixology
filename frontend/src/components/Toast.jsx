import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed top-5 right-5 bg-red-500 text-white px-4 py-2 rounded shadow-md z-50 shake flex items-center justify-between gap-2"
      style={{ fontFamily: "ChakraPetch" }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 font-bold hover:text-black transition-colors"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
