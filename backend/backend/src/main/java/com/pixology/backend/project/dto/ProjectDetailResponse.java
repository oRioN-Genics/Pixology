package com.pixology.backend.project.dto;

import com.pixology.backend.project.ProjectLayer;

import java.time.Instant;
import java.util.List;

public class ProjectDetailResponse {
    private String id;
    private String name;
    private int width;
    private int height;
    private String selectedLayerId;
    private List<ProjectLayer> layers;
    private boolean favorite;
    private String previewPng;
    private Instant createdAt;
    private Instant updatedAt;

    public ProjectDetailResponse() {}

    // getters/setters
    public String getId() { return id; }
    public String getName() { return name; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public String getSelectedLayerId() { return selectedLayerId; }
    public List<ProjectLayer> getLayers() { return layers; }
    public boolean isFavorite() { return favorite; }
    public String getPreviewPng() { return previewPng; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setSelectedLayerId(String selectedLayerId) { this.selectedLayerId = selectedLayerId; }
    public void setLayers(List<ProjectLayer> layers) { this.layers = layers; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
