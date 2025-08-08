import React from "react";

const LeftPanel = ({ children, className = "" }) => {
  return (
    <aside
      className={`flex flex-col items-center gap-2 bg-white rounded-r-xl shadow-md p-2 w-12 ${className}`}
    >
      {children}
    </aside>
  );
};

export default LeftPanel;
