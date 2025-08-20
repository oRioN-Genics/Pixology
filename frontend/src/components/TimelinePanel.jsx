import React, { useRef, useState, useEffect, useMemo } from "react";
import { assets } from "../assets";
import PreviewWindow from "../components/PreviewWindow";

const makeId = (p = "anim") =>
  `${p}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
    .toString(36)
    .slice(-4)}`;

const LOOP_MODES = ["forward", "backward", "pingpong"];
const nextLoopMode = (m) => {
  const i = LOOP_MODES.indexOf(m);
  return LOOP_MODES[(i + 1) % LOOP_MODES.length];
};

const DEFAULT_FPS = 8;
const PREVIEW_SIZE = 160; // fixed preview box

const TimelinePanel = ({
  className = "",
  framesCount = 0,
  onToast = () => {},
  initialAnimations = [],
  onExposeTimelineAPI,

  // preview props (provided from CanvasBoard)
  previewFrames = [],
  previewWidth = 128,
  previewHeight = 128,
  onRegisterPreviewAPI,
}) => {
  const [anims, setAnims] = useState([]);
  const animsRef = useRef(anims);
  useEffect(() => {
    animsRef.current = anims;
  }, [anims]);

  const [untitledIdx, setUntitledIdx] = useState(1);
  const [selectedAnimId, setSelectedAnimId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef(null);

  const dragInfo = useRef(null);
  const [selection, setSelection] = useState(null);
  const isPromptOpenRef = useRef(false);

  const previewRef = useRef(null);

  const chipRefs = useRef(new Map());
  const lastPlayingChipRef = useRef(null);

  // --- highlight helpers ---
  const applyPlayingStyle = (el) => {
    if (!el) return;
    el.style.outline = "3px solid #f8b84c";
    el.style.outlineOffset = "2px";
    el.style.transition = "outline 80ms linear";
  };
  const clearPlayingStyle = (el) => {
    if (!el) return;
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.transition = "";
  };
  const setChipRef = (animId, posIdx, el) => {
    const arr = chipRefs.current.get(animId) || [];
    arr[posIdx] = el || null;
    chipRefs.current.set(animId, arr);
  };
  // IMPORTANT: updatePlayingHighlight now uses the unified sequence to resolve the chip position
  const updatePlayingHighlight = (seqIndex) => {
    const animId = selectedAnimId;
    if (!animId) return;

    const order = unifiedSeqRef.current.order || [];
    const chipPos = order[seqIndex]; // chip index inside anim.frames
    const list = chipRefs.current.get(animId) || [];
    const el = typeof chipPos === "number" ? list[chipPos] : null;

    if (lastPlayingChipRef.current && lastPlayingChipRef.current !== el) {
      clearPlayingStyle(lastPlayingChipRef.current);
    }
    if (el && lastPlayingChipRef.current !== el) {
      applyPlayingStyle(el);
    }
    lastPlayingChipRef.current = el || null;
  };
  const clearAnyPlayingHighlight = () => {
    if (lastPlayingChipRef.current) {
      clearPlayingStyle(lastPlayingChipRef.current);
      lastPlayingChipRef.current = null;
    }
  };

  const didSeedRef = useRef(false);
  useEffect(() => {
    if (didSeedRef.current) return;
    if (!Array.isArray(initialAnimations)) return;

    const seeded = (initialAnimations || []).map((a) => ({
      id: a.id || makeId(),
      name: a.name || "untitled animation",
      frames: Array.isArray(a.frames) ? a.frames.slice() : [],
      loopMode: a.loopMode || "forward",
    }));
    setAnims(seeded);

    const untitledNums = seeded
      .map((a) => a.name?.match(/^untitled animation\s+(\d+)$/i)?.[1])
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n));
    const next = untitledNums.length ? Math.max(...untitledNums) + 1 : 1;
    setUntitledIdx(next);

    didSeedRef.current = true;
  }, [initialAnimations]);

  useEffect(() => {
    if (!onExposeTimelineAPI) return;
    const api = {
      collectTimelineSnapshot: () =>
        (animsRef.current || []).map((a) => ({
          id: a.id,
          name: a.name,
          frames: a.frames.slice(),
          loopMode: a.loopMode || "forward",
        })),
      loadFromTimelineSnapshot: (arr) => {
        const next = (Array.isArray(arr) ? arr : []).map((a) => ({
          id: a.id || makeId(),
          name: a.name || "untitled animation",
          frames: Array.isArray(a.frames) ? a.frames.slice() : [],
          loopMode: a.loopMode || "forward",
        }));
        setAnims(next);

        const untitledNums = next
          .map((a) => a.name?.match(/^untitled animation\s+(\d+)$/i)?.[1])
          .filter(Boolean)
          .map((s) => parseInt(s, 10))
          .filter((n) => Number.isFinite(n));
        setUntitledIdx(untitledNums.length ? Math.max(...untitledNums) + 1 : 1);
      },
      getPreviewAPI: () => previewRef.current || null,
    };
    onExposeTimelineAPI(api);
  }, [onExposeTimelineAPI]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!selectedAnimId && isPlaying) setIsPlaying(false);
  }, [selectedAnimId, isPlaying]);

  useEffect(() => {
    if (anims.length === 0) {
      setUntitledIdx(1);
      setSelectedAnimId(null);
      setSelection(null);
      clearAnyPlayingHighlight();
    }
  }, [anims.length]);

  const occurrenceIndex = (frames, n, idx) => {
    let count = 0;
    for (let i = 0; i <= idx; i++) if (frames[i] === n) count++;
    return count - 1;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (isPromptOpenRef.current) return;
      if (editingId) return;
      if (!selection) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const { animId, frameNum, _idx } = selection;
        setAnims((prev) =>
          prev.map((a) => {
            if (a.id !== animId) return a;
            const cur = a.frames.slice();
            let seen = -1;
            for (let i = 0; i < cur.length; i++) {
              if (cur[i] === frameNum) {
                seen++;
                if (seen === _idx) {
                  cur.splice(i, 1);
                  break;
                }
              }
            }
            return { ...a, frames: cur };
          })
        );
        setSelection(null);
      } else if (e.key === "Escape") {
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, editingId]);

  const handleBackgroundMouseDown = (e) => {
    const onChip = e.target.closest('[data-frame-chip="1"]');
    const onTitle = e.target.closest('[data-anim-title="1"]');
    const onAddFrame = e.target.closest('[data-add-frame="1"]');
    const onDeleteAnim = e.target.closest('[data-del-anim="1"]');
    const onAnimCard = e.target.closest('[data-anim-card="1"]');
    if (!onChip && !onTitle && !onAddFrame && !onDeleteAnim && !onAnimCard) {
      setSelection(null);
    }
  };

  const addAnimation = () => {
    const id = makeId();
    const name = `untitled animation ${untitledIdx}`;
    setUntitledIdx((i) => i + 1);
    setAnims((prev) => [
      ...prev,
      { id, name, frames: [], loopMode: "forward" },
    ]);
  };

  const removeAnimation = (animId) => {
    setAnims((prev) => prev.filter((a) => a.id !== animId));
    if (editingId === animId) {
      setEditingId(null);
      setEditingText("");
    }
    if (selection?.animId === animId) setSelection(null);
    if (selectedAnimId === animId) {
      setSelectedAnimId(null);
      clearAnyPlayingHighlight();
    }
  };

  const startEditName = (anim) => {
    setEditingId(anim.id);
    setEditingText(anim.name);
  };

  const commitEditName = () => {
    const text = (editingText || "").trim();
    if (!editingId) return;
    setAnims((prev) =>
      prev.map((a) => (a.id === editingId ? { ...a, name: text || a.name } : a))
    );
    setEditingId(null);
    setEditingText("");
  };

  const promptAddFrame = (animId) => {
    try {
      isPromptOpenRef.current = true;
      const raw = window.prompt("Enter frame number to add:");
      if (raw === null) return false;

      const num = parseInt(String(raw).trim(), 10);
      if (!Number.isFinite(num) || num < 1) {
        onToast("Please enter a valid frame number (>= 1).");
        return false;
      }

      const maxFrames = Number(framesCount) || 0;
      if (num > maxFrames) {
        onToast(
          `There are only ${maxFrames} frame${
            maxFrames === 1 ? "" : "s"
          } in the rail.`
        );
        return false;
      }

      setAnims((prev) =>
        prev.map((a) => {
          if (a.id !== animId) return a;
          return { ...a, frames: [...a.frames, num] };
        })
      );
      return true;
    } finally {
      isPromptOpenRef.current = false;
    }
  };

  const onFrameDragStart = (e, anim, frameNum, idxInArray) => {
    dragInfo.current = { animId: anim.id, frameNum };
    e.dataTransfer.setData("text/plain", `${anim.id}:${frameNum}`);
    e.dataTransfer.effectAllowed = "move";

    const occIdx = occurrenceIndex(anim.frames, frameNum, idxInArray);
    setSelection({ animId: anim.id, frameNum, _idx: occIdx });
    setSelectedAnimId(anim.id);
  };

  const onFrameDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onFrameDropOnChip = (e, targetAnimId, targetFrameNum) => {
    e.preventDefault();
    const info = dragInfo.current;
    dragInfo.current = null;
    if (!info) return;
    if (info.animId !== targetAnimId) return;

    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== targetAnimId) return a;

        const cur = a.frames.slice();
        const fromIdx = cur.indexOf(info.frameNum);
        const toIdx = cur.indexOf(targetFrameNum);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return a;

        const [moved] = cur.splice(fromIdx, 1);
        cur.splice(toIdx, 0, moved);
        return { ...a, frames: cur };
      })
    );
  };

  const onFrameDropAtEnd = (e, targetAnimId) => {
    e.preventDefault();
    const info = dragInfo.current;
    dragInfo.current = null;
    if (!info) return;
    if (info.animId !== targetAnimId) return;

    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== targetAnimId) return a;
        const cur = a.frames.slice();
        const fromIdx = cur.indexOf(info.frameNum);
        if (fromIdx === -1) return a;
        const [moved] = cur.splice(fromIdx, 1);
        cur.push(moved);
        return { ...a, frames: cur };
      })
    );
  };

  const toggleLoopMode = (animId) => {
    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== animId) return a;
        const cur = a.loopMode || "forward";
        return { ...a, loopMode: nextLoopMode(cur) };
      })
    );
  };

  // Feed preview only when a block is selected; otherwise clear it.
  useEffect(() => {
    if (!previewRef.current) return;
    if (!selectedAnimId) {
      previewRef.current.setFrames([]);
      previewRef.current.redraw?.(); // clear
      clearAnyPlayingHighlight();
      return;
    }
    previewRef.current.setFrames(previewFrames || []);
    previewRef.current.redraw?.();
  }, [previewFrames, selectedAnimId]);

  useEffect(() => {
    if (onRegisterPreviewAPI) onRegisterPreviewAPI(previewRef.current || null);
  }, [onRegisterPreviewAPI]);

  // ======================
  //   UNIFIED SEQUENCER
  // ======================

  // Build 0..L-1 then L-2..1 (no double-hit of endpoints)
  const makePingPongOrder = (L) => {
    if (L <= 1) return [0];
    const forward = Array.from({ length: L }, (_, i) => i);
    const back = Array.from(
      { length: Math.max(0, L - 2) },
      (_, i) => L - 2 - i
    );
    return forward.concat(back);
  };

  // One source of truth for both playback and highlight:
  // sequence is over CHIP POSITIONS (indices into anim.frames), not global frames.
  const buildUnifiedSequence = useMemo(() => {
    return (anim, totalFrames) => {
      if (!anim || !Array.isArray(anim.frames) || !anim.frames.length) {
        return { entries: [], order: [] };
      }

      // entries: per-chip
      //  - pos: chip index
      //  - n:   frame number (1-based in UI)
      //  - gi:  global preview index (0-based) or null if invalid
      const entries = anim.frames.map((n, pos) => {
        const gi = Number.isFinite(n) ? (n | 0) - 1 : -1;
        const valid = gi >= 0 && gi < (totalFrames | 0);
        return { pos, n, gi: valid ? gi : null };
      });

      // Keep only valid positions for playback/highlight
      const validPositions = entries
        .map((e, i) => (e.gi === null ? null : i))
        .filter((i) => i !== null);

      if (!validPositions.length) return { entries: [], order: [] };

      const mode = anim.loopMode || "forward";
      let order = [];
      if (mode === "forward") {
        order = validPositions;
      } else if (mode === "backward") {
        order = [...validPositions].reverse();
      } else {
        // pingpong
        const K = validPositions.length;
        const pp = makePingPongOrder(K); // over compacted 0..K-1
        order = pp.map((k) => validPositions[k]); // map back to chip positions
      }

      return { entries, order };
    };
  }, []);

  const unifiedSeqRef = useRef({ entries: [], order: [] }); // {entries, order}
  const playIdxRef = useRef(0); // index inside 'order' array
  const rafIdRef = useRef(null);
  const lastTsRef = useRef(0);
  const accRef = useRef(0);

  const stopPlayback = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const ensureSequence = () => {
    const anim = anims.find((a) => a.id === selectedAnimId);
    const total = previewRef.current?.count ?? (previewFrames?.length || 0);
    const pack = buildUnifiedSequence(anim, total); // {entries, order}
    unifiedSeqRef.current = pack;

    if (pack.order.length) {
      // clamp and seek
      playIdxRef.current = Math.min(playIdxRef.current, pack.order.length - 1);
      const pos = pack.order[playIdxRef.current];
      const gi = pack.entries[pos]?.gi ?? 0;
      previewRef.current?.seek?.(gi);
      previewRef.current?.redraw?.();

      // sync chip highlight
      setTimeout(() => updatePlayingHighlight(playIdxRef.current), 0);
    } else {
      clearAnyPlayingHighlight();
    }
    return pack.order;
  };

  useEffect(() => {
    ensureSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnimId, anims, previewFrames]);

  useEffect(() => {
    stopPlayback();
    if (!isPlaying) return;

    const order = ensureSequence();
    if (!order.length) {
      onToast("No frames in the selected animation.");
      setIsPlaying(false);
      return;
    }

    lastTsRef.current = 0;
    accRef.current = 0;

    const loop = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      const msPerFrame = Math.max(1, Math.round(1000 / Math.max(1, fps)));
      accRef.current += dt;

      let advanced = false;
      while (accRef.current >= msPerFrame) {
        const L = unifiedSeqRef.current.order.length;
        playIdxRef.current = (playIdxRef.current + 1) % L;

        const pos = unifiedSeqRef.current.order[playIdxRef.current];
        const gi = unifiedSeqRef.current.entries[pos]?.gi ?? 0;

        previewRef.current?.seek?.(gi);
        accRef.current -= msPerFrame;
        advanced = true;
      }

      previewRef.current?.redraw?.();
      if (advanced) updatePlayingHighlight(playIdxRef.current);

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return stopPlayback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, fps]);

  useEffect(() => stopPlayback, []);

  // --------- transport over unified sequence (kept compatible with your code) ---------
  const goFirst = () => {
    const order = ensureSequence();
    if (!order.length) return;
    playIdxRef.current = 0;
    const pos = order[0];
    const gi = unifiedSeqRef.current.entries[pos]?.gi ?? 0;
    previewRef.current?.seek?.(gi);
    previewRef.current?.redraw?.();
    updatePlayingHighlight(playIdxRef.current);
  };
  const goPrev = () => {
    const order = ensureSequence();
    if (!order.length) return;
    playIdxRef.current = (playIdxRef.current - 1 + order.length) % order.length;
    const pos = order[playIdxRef.current];
    const gi = unifiedSeqRef.current.entries[pos]?.gi ?? 0;
    previewRef.current?.seek?.(gi);
    previewRef.current?.redraw?.();
    updatePlayingHighlight(playIdxRef.current);
  };
  const goNext = () => {
    const order = ensureSequence();
    if (!order.length) return;
    playIdxRef.current = (playIdxRef.current + 1) % order.length;
    const pos = order[playIdxRef.current];
    const gi = unifiedSeqRef.current.entries[pos]?.gi ?? 0;
    previewRef.current?.seek?.(gi);
    previewRef.current?.redraw?.();
    updatePlayingHighlight(playIdxRef.current);
  };
  const goLast = () => {
    const order = ensureSequence();
    if (!order.length) return;
    playIdxRef.current = order.length - 1;
    const pos = order[order.length - 1];
    const gi = unifiedSeqRef.current.entries[pos]?.gi ?? 0;
    previewRef.current?.seek?.(gi);
    previewRef.current?.redraw?.();
    updatePlayingHighlight(playIdxRef.current);
  };

  // --------- NEW: animation-transport (wired to buttons) ---------
  const selectAnimByIndex = (index) => {
    if (!anims.length) return;
    const clamped = Math.max(0, Math.min(anims.length - 1, index));
    const id = anims[clamped]?.id;
    if (!id) return;
    setSelectedAnimId(id);
    setSelection(null);
    // refresh the highlight after selection switch/layout
    setTimeout(() => updatePlayingHighlight(playIdxRef.current), 0);
  };

  const goFirstAnim = () => {
    selectAnimByIndex(0);
  };

  const goLastAnim = () => {
    selectAnimByIndex(anims.length - 1);
  };

  const goPrevAnim = () => {
    if (!selectedAnimId) return;
    const idx = anims.findIndex((a) => a.id === selectedAnimId);
    if (idx < 0) return;
    selectAnimByIndex(Math.max(0, idx - 1));
  };

  const goNextAnim = () => {
    if (!selectedAnimId) return;
    const idx = anims.findIndex((a) => a.id === selectedAnimId);
    if (idx < 0) return;
    selectAnimByIndex(Math.min(anims.length - 1, idx + 1));
  };

  const transportDisabled = !selectedAnimId;

  return (
    <div
      className={[
        "fixed bottom-0 left-0 w-full z-10",
        "backdrop-blur bg-white/75 border-t border-[#d7e5f3] shadow-[0_-8px_20px_rgba(0,0,0,0.05)]",
        className,
      ].join(" ")}
      onMouseDownCapture={handleBackgroundMouseDown}
    >
      <div className="container mx-auto px-2 md:px-6 py-2 relative">
        {/* Min/Max */}
        <button
          aria-label={collapsed ? "Maximize timeline" : "Minimize timeline"}
          title={collapsed ? "Maximize" : "Minimize"}
          className="absolute right-2 top-2 w-7 h-7 rounded-md border border-[#cfe0f1] bg-white flex items-center justify-center hover:bg-[#eef6ff]"
          onClick={() => {
            setCollapsed((v) => !v);
            // keep the highlight consistent after layout changes
            setTimeout(() => updatePlayingHighlight(playIdxRef.current), 0);
          }}
        >
          <span className="text-sm leading-none select-none">
            {collapsed ? "▴" : "▾"}
          </span>
        </button>

        {collapsed ? (
          <div className="h-6 flex items-center justify-center text-xs text-[#3c638c]">
            Timeline (collapsed)
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* LEFT */}
            <div className="col-span-3 min-w-0">
              {/* Transport */}
              <div className="w-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {[
                    {
                      key: "first",
                      icon: assets.firstFrameIcon,
                      title: "Go to first animation",
                      onClick: goFirstAnim,
                    },
                    {
                      key: "prev",
                      icon: assets.prevFrameIcon,
                      title: "Go to previous animation",
                      onClick: goPrevAnim,
                    },
                    {
                      key: "play",
                      icon: isPlaying ? assets.stopIcon : assets.playIcon,
                      title: isPlaying ? "Stop" : "Play",
                      onClick: () => {
                        setIsPlaying((p) => !p);
                        setTimeout(
                          () => updatePlayingHighlight(playIdxRef.current),
                          0
                        );
                      },
                    },
                    {
                      key: "next",
                      icon: assets.nextFrameIcon,
                      title: "Go to next animation",
                      onClick: goNextAnim,
                    },
                    {
                      key: "last",
                      icon: assets.lastFrameIcon,
                      title: "Go to last animation",
                      onClick: goLastAnim,
                    },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      className={[
                        "w-8 h-8 rounded border border-[#cfe0f1] bg-white flex items-center justify-center",
                        btn.key === "play"
                          ? "hover:bg-[#eef6ff]"
                          : transportDisabled
                          ? "opacity-45 cursor-not-allowed"
                          : "hover:bg-[#eef6ff]",
                      ].join(" ")}
                      title={btn.title}
                      disabled={btn.key !== "play" && transportDisabled}
                      onClick={() =>
                        (btn.key === "play" || !transportDisabled) &&
                        btn.onClick()
                      }
                    >
                      <img
                        src={btn.icon}
                        alt=""
                        className="w-4 h-4 pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls + animations rail */}
              <div className="mt-3 grid grid-cols-[auto,1fr] gap-4 items-start">
                <div className="shrink-0">
                  <button
                    onClick={addAnimation}
                    className="px-3 py-1.5 rounded-md bg-[#4D9FDC] text-white text-sm hover:bg-[#3e8dcb] transition"
                  >
                    Add animation
                  </button>
                </div>

                <div className="overflow-x-auto pb-3">
                  <div className="flex gap-4">
                    {anims.map((anim) => {
                      // reset refs array for this card before mapping its chips
                      chipRefs.current.set(anim.id, []);
                      const isSelected = selectedAnimId === anim.id;
                      return (
                        <div
                          key={anim.id}
                          data-anim-card="1"
                          className={[
                            "min-w=[320px] max-w-[90vw] bg-white/80 rounded-2xl border border-[#d7e5f3] shadow-sm px-3 py-2 cursor-pointer",
                            isSelected ? "ring-2 ring-[#4D9FDC]" : "",
                          ].join(" ")}
                          onClick={(e) => {
                            const clickedBtn =
                              e.target.closest("button, input");
                            if (!clickedBtn) {
                              setSelectedAnimId(anim.id);
                              // refresh highlight after selection switch
                              setTimeout(
                                () =>
                                  updatePlayingHighlight(playIdxRef.current),
                                0
                              );
                            }
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              {editingId === anim.id ? (
                                <input
                                  ref={inputRef}
                                  className="w-full bg-white border border-[#cfe0f1] rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#4D9FDC]"
                                  value={editingText}
                                  onChange={(e) =>
                                    setEditingText(e.target.value)
                                  }
                                  onBlur={commitEditName}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEditName();
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <button
                                  data-anim-title="1"
                                  className="text-sm font-medium text-[#3c638c] hover:underline text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditName(anim);
                                  }}
                                  title="Click to rename"
                                >
                                  {anim.name}
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                data-add-frame="1"
                                className="px-1.5 py-0.5 text[11px] leading-none rounded-md border border-[#cfe0f1] hover:bg-[#eef6ff] whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const added = promptAddFrame(anim.id);
                                  if (added) setSelectedAnimId(anim.id);
                                  setSelection(null);
                                  setTimeout(
                                    () =>
                                      updatePlayingHighlight(
                                        playIdxRef.current
                                      ),
                                    0
                                  );
                                }}
                                title="Add frame by number"
                              >
                                Add frame
                              </button>

                              <button
                                aria-label="Toggle loop mode"
                                className="w-6 h-6 rounded-md border border-[#cfe0f1] bg-white flex items-center justify-center hover:bg-[#eef6ff]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLoopMode(anim.id);
                                  setTimeout(
                                    () =>
                                      updatePlayingHighlight(
                                        playIdxRef.current
                                      ),
                                    0
                                  );
                                }}
                                title={
                                  anim.loopMode === "backward"
                                    ? "Loop: Backward"
                                    : anim.loopMode === "pingpong"
                                    ? "Loop: Ping-Pong"
                                    : "Loop: Forward"
                                }
                              >
                                <img
                                  src={
                                    anim.loopMode === "backward"
                                      ? assets.backwardLoopIcon
                                      : anim.loopMode === "pingpong"
                                      ? assets.pingPongLoopIcon
                                      : assets.forwardLoopIcon
                                  }
                                  alt=""
                                  className="w-3.5 h-3.5 pointer-events-none"
                                />
                              </button>

                              <button
                                data-del-anim="1"
                                aria-label="Delete animation"
                                className="w-6 h-6 rounded-md border flex items-center justify-center hover:bg-[#ffe8e8] hover:border-[#ffbdbd]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAnimation(anim.id);
                                }}
                                title="Delete animation"
                              >
                                <img
                                  src={assets.Delete}
                                  alt=""
                                  className="w-3.5 h-3.5 pointer-events-none"
                                />
                              </button>
                            </div>
                          </div>

                          {/* Frames row */}
                          <div
                            className="mt-2 flex items-center gap-2 overflow-x-auto"
                            onDragOver={onFrameDragOver}
                            onDrop={(e) => onFrameDropAtEnd(e, anim.id)}
                            onClick={() => setSelectedAnimId(anim.id)}
                          >
                            {anim.frames.map((n, idx) => {
                              const isChipSelected =
                                selection &&
                                selection.animId === anim.id &&
                                selection.frameNum === n &&
                                selection._idx ===
                                  occurrenceIndex(anim.frames, n, idx);

                              return (
                                <div
                                  key={`${n}-${idx}`}
                                  data-frame-chip="1"
                                  ref={(el) => setChipRef(anim.id, idx, el)}
                                  className={[
                                    "relative select-none cursor-grab active:cursor-grabbing outline-none",
                                    isChipSelected
                                      ? "ring-2 ring-[#4D9FDC] rounded-lg"
                                      : "",
                                  ].join(" ")}
                                  draggable
                                  onDragStart={(e) =>
                                    onFrameDragStart(e, anim, n, idx)
                                  }
                                  onDragOver={onFrameDragOver}
                                  onDrop={(e) =>
                                    onFrameDropOnChip(e, anim.id, n)
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAnimId(anim.id);
                                    const occIdx = occurrenceIndex(
                                      anim.frames,
                                      n,
                                      idx
                                    );
                                    setSelection({
                                      animId: anim.id,
                                      frameNum: n,
                                      _idx: occIdx,
                                    });
                                    // re-assert current highlight
                                    setTimeout(
                                      () =>
                                        updatePlayingHighlight(
                                          playIdxRef.current
                                        ),
                                      0
                                    );
                                  }}
                                  title={`Frame ${n} (click to select, Delete to remove)`}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedAnimId(anim.id);
                                      const occIdx = occurrenceIndex(
                                        anim.frames,
                                        n,
                                        idx
                                      );
                                      setSelection({
                                        animId: anim.id,
                                        frameNum: n,
                                        _idx: occIdx,
                                      });
                                      setTimeout(
                                        () =>
                                          updatePlayingHighlight(
                                            playIdxRef.current
                                          ),
                                        0
                                      );
                                    }
                                  }}
                                >
                                  <div className="w-10 h-10 rounded-lg border border-[#cfe0f1] bg-white flex items-center justify-center text-sm text-[#3c638c] shadow-xs">
                                    {n}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="w-6 h-10" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: fixed-size Preview */}
            <div className="col-span-1 min-w-0">
              <PreviewWindow
                ref={previewRef}
                frames={[]}
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                title="Preview"
                onion={{ enabled: false }}
                displayScale={1}
                fps={fps}
                onFpsChange={(v) => setFps(Math.max(1, Math.min(120, v | 0)))}
                className=""
                onRegisterPreviewAPI={onRegisterPreviewAPI}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePanel;
