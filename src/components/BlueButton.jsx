// src/components/Button.jsx
import React from "react";
import PropTypes from "prop-types";

const BlueButton = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const base = "px-6 py-2 text-2xl rounded-[5px] font-medium";
  const styles = {
    default: "text-black bg-transparent",
    primary: "bg-[#4D9FDC] text-white",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

BlueButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "primary"]),
  className: PropTypes.string,
};

export default BlueButton;
