package com.pixology.backend.project.dto;

import com.pixology.backend.project.AnimationFrame;
import java.time.Instant;
import java.util.List;

public class AnimationDetailResponse {
    private String id;
    private String name;
    private int width;
    private int height;
    private List<AnimationFrame> frames;
    private boolean favorite;
    private String previewPng;
    private Instant createdAt;
    private Instant updatedAt;

    public AnimationDetailResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public List<AnimationFrame> getFrames() { return frames; }
    public void setFrames(List<AnimationFrame> frames) { this.frames = frames; }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public String getPreviewPng() { return previewPng; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
