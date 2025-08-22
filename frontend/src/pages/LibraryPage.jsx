import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import AssetTile from "../components/AssetTile";
import Toast from "../components/Toast";
import { api } from "../api";

const readUser = () => {
  try {
    const raw = localStorage.getItem("pixology:user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const Skeleton = () => (
  <div className="w-[200px]">
    <div className="animate-pulse aspect-square rounded-2xl bg-gray-200" />
    <div className="h-3 mt-3 rounded bg-gray-200 w-28" />
  </div>
);

const LibraryPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]); // [{ id, name, width, height, previewPng, favorite, updatedAt }]
  const [selectedId, setSelectedId] = useState(null);

  const user = useMemo(readUser, []);
  const tab = (params.get("tab") || "recents").toLowerCase();
  const isFavTab = tab === "favourites" || tab === "favorites";

  // Single list endpoint: backend returns both STATIC and ANIMATION summaries.
  useEffect(() => {
    if (!user) {
      setToastMsg("Please log in to view your library.");
      navigate("/login", { replace: true });
      return;
    }

    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const q = new URLSearchParams({ userId: user.id });
        if (isFavTab) q.set("favorite", "true");

        const res = await api(`/api/projects?${q.toString()}`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to fetch projects.");
        }
        const list = await res.json();
        const normalized = (Array.isArray(list) ? list : []).sort((a, b) => {
          const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return tb - ta;
        });
        if (!ignore) setProjects(normalized);
      } catch (e) {
        if (!ignore) setToastMsg(e.message || "Network error.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user, navigate, isFavTab]);

  const openProject = (p) => {
    navigate("/canvas", {
      state: {
        width: p.width,
        height: p.height,
        projectName: p.name,
        projectId: p.id,
      },
    });
  };

  // Toggle favorite (generic endpoint works for both kinds)
  const toggleFavorite = async (id, next) => {
    if (!user) {
      setToastMsg("Please log in to change favorites.");
      return;
    }

    const snapshot = projects;

    if (isFavTab && !next) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, favorite: next } : p))
      );
    }

    try {
      const res = await api(
        `/api/projects/${id}/favorite?userId=${encodeURIComponent(user.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorite: next }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      setProjects(snapshot);
      setToastMsg(e.message || "Could not update favorite.");
    }
  };

  // Delete (generic endpoint works for both kinds)
  const confirmDelete = async (id) => {
    if (!user) {
      setToastMsg("Please log in to delete projects.");
      return;
    }
    const proj = projects.find((p) => p.id === id);
    const label = proj?.name ? `“${proj.name}”` : "this project";
    const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!ok) return;

    const snapshot = projects;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);

    try {
      const res = await api(
        `/api/projects/${id}?userId=${encodeURIComponent(user.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      setToastMsg("Project deleted.");
    } catch (e) {
      setProjects(snapshot);
      setToastMsg(e.message || "Could not delete project.");
    }
  };

  return (
    <div className="relative min-h-screen">
      <NavBar showOnlyFavourites />

      <div className="pt-28 container mx-auto px-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: "ChakraPetch" }}
          >
            {isFavTab ? "Favourite assets" : "Assets library"}
          </h1>
          <div className="hidden md:block text-sm text-black/60 mb-4 mr-1" />
        </div>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
            <p className="text-gray-600">
              {isFavTab
                ? "No favourites yet. Click the star on a project to add it here."
                : "Your library is empty. Create something on the canvas or import assets."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-6">
            {projects.map((p) => (
              <AssetTile
                key={p.id}
                id={p.id}
                name={p.name || "Untitled"}
                previewSrc={p.previewPng || ""}
                sizeLabel={`${p.width}×${p.height}`}
                isFavorite={!!p.favorite}
                selected={selectedId === p.id}
                onClick={setSelectedId}
                onDoubleClick={() => openProject(p)}
                onContextMenu={(id, e) => console.log("Context menu:", id)}
                onToggleFavorite={toggleFavorite}
                onDelete={confirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
};

export default LibraryPage;
