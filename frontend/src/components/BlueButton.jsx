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
    default: "text-black bg-transparent hover:text-[#4D9FDC]",
    primary:
      "bg-[#4D9FDC] text-white hover:bg-[#3483c2] translation duration-200 ease-in-out hover:scale-102 hover:shadow-lg",
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
