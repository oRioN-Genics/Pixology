// src/components/NavBar.jsx
import React, { useEffect, useState, useCallback } from "react";
import { assets } from "../assets";
import BlueButton from "./BlueButton";
import { useNavigate } from "react-router-dom";

const readUser = () => {
  try {
    const raw = localStorage.getItem("pixology:user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const NavBar = ({
  showOnlySignUp,
  showOnlyLogin,
  showExportButton,
  ignoreAuthForExport,
  showOnlyFavourites,
  showSaveButton,
  onSaveClick,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => readUser());
  const isAuthed = !!user;
  const canShowExport = showExportButton && (isAuthed || !!ignoreAuthForExport);

  const sync = useCallback(() => setUser(readUser()), []);
  useEffect(() => {
    window.addEventListener("storage", sync);
    window.addEventListener("auth:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:change", sync);
    };
  }, [sync]);

  const logout = () => {
    localStorage.removeItem("pixology:user");
    window.dispatchEvent(new Event("auth:change"));
    navigate("/");
  };

  return (
    <div className="absolute top-0 left-0 w-full z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center py-0 px-0 md:px-20 lg:px-2 bg-white/62 rounded-b-[20px]">
        {/* Left: logo + title */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={assets.Icon} alt="" className="h-10 w-auto md:h-20" />
          <span className="text-[#4D9FDC] text-5xl">Pixology</span>
        </div>

        {/* Right: buttons */}
        <div className="flex items-center gap-4">
          {/* Library mode: ONLY one button */}
          {showOnlyFavourites ? (
            <BlueButton
              variant="primary"
              className="px-6 py-2"
              onClick={() => navigate("/library?tab=favourites")}
            >
              Favourites
            </BlueButton>
          ) : (
            <>
              {/* SAVE (Canvas page only) */}
              {showSaveButton && (
                <BlueButton
                  variant="primary"
                  className="flex items-center gap-2 px-10 py-2"
                  onClick={onSaveClick}
                >
                  <img src={assets.SaveIcon} alt="Save" className="w-5 h-5" />
                  Save
                </BlueButton>
              )}

              {/* EXPORT (optional + auth gate if you want) */}
              {canShowExport && (
                <BlueButton
                  variant="primary"
                  className="flex items-center gap-2 px-10 py-2"
                  onClick={() => console.log("TODO: export")}
                >
                  <img
                    src={assets.ExportIcon}
                    alt="Export"
                    className="w-5 h-5"
                  />
                  Export
                </BlueButton>
              )}

              {isAuthed ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-black/80 text-lg">
                    Hi, {user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-md bg-red-400 hover:bg-red-700 text-white"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <>
                  {!showOnlyLogin && (
                    <button
                      className="hidden md:block px-6 py-2 text-2xl text-black hover:text-[#4D9FDC] transition duration-200 ease-in-out"
                      onClick={() => navigate("/signup")}
                    >
                      Sign up
                    </button>
                  )}
                  {!showOnlySignUp && (
                    <BlueButton
                      variant="primary"
                      className="px-15"
                      onClick={() => navigate("/login")}
                    >
                      Log in
                    </BlueButton>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
