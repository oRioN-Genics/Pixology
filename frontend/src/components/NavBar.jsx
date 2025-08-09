// src/components/NavBar.jsx
import React, { useEffect, useState, useCallback } from "react";
import { assets } from "../assets";
import BlueButton from "./BlueButton";
import ExportFormatPopover from "./ExportFormatPopover";
import { useNavigate, useLocation } from "react-router-dom";

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
  // NEW: show Library on canvas
  showLibraryButton,
  // Export hooks
  onBeforeExportClick, // () => true | string
  onExportBlocked, // (reason: string) => void
  onExportPick, // (fmt: 'png' | 'jpeg') => void
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // detect if we are currently viewing favourites
  const search = new URLSearchParams(location.search);
  const atLibrary = location.pathname === "/library";
  const atFavourites = atLibrary && search.get("tab") === "favourites";

  const [user, setUser] = useState(() => readUser());
  const [showExportPop, setShowExportPop] = useState(false);

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

  const handleExportClick = () => {
    const ok = onBeforeExportClick?.();
    if (ok === true || ok === undefined) {
      setShowExportPop((v) => !v);
    } else if (typeof ok === "string") {
      onExportBlocked?.(ok);
      setShowExportPop(false);
    }
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
          {showOnlyFavourites ? (
            // SINGLE TOGGLING BUTTON
            <BlueButton
              variant="primary"
              className="px-6 py-2"
              onClick={
                () =>
                  atFavourites
                    ? navigate("/library") // go back to all
                    : navigate("/library?tab=favourites") // go to favourites
              }
            >
              {atFavourites ? "Library" : "Favourites"}
            </BlueButton>
          ) : (
            <>
              {/* LIBRARY (Canvas page only) */}
              {showLibraryButton && (
                <BlueButton
                  variant="primary"
                  className="flex items-center px-8 py-2 gap-2"
                  onClick={() => navigate("/library")}
                >
                  <img
                    src={assets.LibraryIcon}
                    alt="Library"
                    className="w-5 h-5"
                  />
                  Library
                </BlueButton>
              )}

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

              {/* EXPORT + Popover */}
              {canShowExport && (
                <div className="relative">
                  <BlueButton
                    variant="primary"
                    className="flex items-center gap-2 px-10 py-2"
                    onClick={handleExportClick}
                  >
                    <img
                      src={assets.ExportIcon}
                      alt="Export"
                      className="w-5 h-5"
                    />
                    Export
                  </BlueButton>

                  {showExportPop && (
                    <ExportFormatPopover
                      onSelect={(fmt) => {
                        onExportPick?.(fmt);
                        setShowExportPop(false);
                      }}
                      onClose={() => setShowExportPop(false)}
                    />
                  )}
                </div>
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
