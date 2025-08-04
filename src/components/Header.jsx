import React from "react";
import NavBar from "./NavBar";
import HeroSection from "./HeroSection";

const Header = () => {
  return (
    <div
      className="relative min-h-screen mb-4 w-full overflow-hidden"
      id="Header"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/header_img.png')", opacity: 0.8 }}
      ></div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-col items-center h-full w-full pt-28">
        <NavBar />
        <HeroSection />
      </div>
    </div>
  );
};

export default Header;
