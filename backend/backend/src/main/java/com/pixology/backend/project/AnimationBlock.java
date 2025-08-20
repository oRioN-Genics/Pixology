package com.pixology.backend.project;

import java.util.List;

public class AnimationBlock {
    private String id;
    private String name;
    private List<Integer> frames;


    private String loopMode;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Integer> getFrames() { return frames; }
    public void setFrames(List<Integer> frames) { this.frames = frames; }

    public String getLoopMode() { return loopMode; }
    public void setLoopMode(String loopMode) { this.loopMode = loopMode; }
}
