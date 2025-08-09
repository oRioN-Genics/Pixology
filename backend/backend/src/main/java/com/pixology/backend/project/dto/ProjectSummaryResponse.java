package com.pixology.backend.project.dto;

import java.time.Instant;

public class ProjectSummaryResponse {
    private String id;
    private String name;
    private int width;
    private int height;
    private boolean favorite;
    private String previewPng; // small data URL for quick thumbnails
    private Instant updatedAt;

    public ProjectSummaryResponse() {}

    public ProjectSummaryResponse(String id, String name, int width, int height,
                                  boolean favorite, String previewPng, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.width = width;
        this.height = height;
        this.favorite = favorite;
        this.previewPng = previewPng;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public boolean isFavorite() { return favorite; }
    public String getPreviewPng() { return previewPng; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
