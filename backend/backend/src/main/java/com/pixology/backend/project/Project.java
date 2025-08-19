package com.pixology.backend.project;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;
import java.util.List;

@Document(collection = "Projects")
public class Project {

    @Id
    private String id;

    @Field("userId")
    private String userId;

    private String name;

    private int width;
    private int height;

    /** STATIC | ANIMATION (defaults to STATIC for old docs) */
    private ProjectKind kind = ProjectKind.STATIC;

    // ---------- STATIC fields (unchanged) ----------
    private String selectedLayerId;
    private List<ProjectLayer> layers;

    // ---------- ANIMATION fields ----------
    private List<AnimationFrame> frames;

    // ---------- Common ----------
    private String previewPng;
    private boolean favorite;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public ProjectKind getKind() { return kind; }
    public void setKind(ProjectKind kind) { this.kind = kind; }

    public String getSelectedLayerId() { return selectedLayerId; }
    public void setSelectedLayerId(String selectedLayerId) { this.selectedLayerId = selectedLayerId; }

    public List<ProjectLayer> getLayers() { return layers; }
    public void setLayers(List<ProjectLayer> layers) { this.layers = layers; }

    public List<AnimationFrame> getFrames() { return frames; }
    public void setFrames(List<AnimationFrame> frames) { this.frames = frames; }

    public String getPreviewPng() { return previewPng; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
