import React from "react";
import NavBar from "../components/NavBar";

const LibraryPage = () => {
  // later you'll fetch assets for the logged-in user.
  const assets = []; // empty for now

  return (
    <div className="relative min-h-screen">
      {/* Navbar that shows only the single Favourites button on the right */}
      <NavBar showOnlyFavourites />

      {/* Page content */}
      <div className="pt-28 container mx-auto px-4">
        <h1
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ fontFamily: "ChakraPetch" }}
        >
          Assets library
        </h1>

        {/* Grid / Empty state */}
        {assets.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
            <p className="text-gray-600">
              Your library is empty. Create something on the canvas or import
              assets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-4">
            {/* map assets -> <AssetTile .../> here later */}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
