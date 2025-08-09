package com.pixology.backend.project;

import com.pixology.backend.project.dto.ProjectDetailResponse;
import com.pixology.backend.project.dto.ProjectSummaryResponse;
import com.pixology.backend.project.dto.SaveProjectRequest;
import com.pixology.backend.user.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository repo;
    private final UserRepository userRepo;

    public ProjectService(ProjectRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    public ProjectDetailResponse create(String userId, SaveProjectRequest req) {
        validateUser(userId);
        validateProjectPayload(req);

        // Optional per-user unique name; comment out if you want duplicates allowed
        if (repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        Project p = new Project();
        p.setUserId(userId);
        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(req.getSelectedLayerId());
        p.setLayers(req.getLayers().stream().map(dto -> {
            ProjectLayer l = new ProjectLayer();
            l.setId(dto.getId());
            l.setName(dto.getName());
            l.setVisible(dto.isVisible());
            l.setLocked(dto.isLocked());
            l.setPixels(dto.getPixels());
            return l;
        }).toList());
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        Project saved = repo.save(p);
        return toDetail(saved);
    }

    public ProjectDetailResponse update(String projectId, String userId, SaveProjectRequest req) {
        validateUser(userId);
        validateProjectPayload(req);

        Project p = repo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        if (!p.getUserId().equals(userId)) {
            throw new IllegalStateException("forbidden");
        }

        // If you want to enforce unique name on update
        if (!p.getName().equalsIgnoreCase(req.getName().trim())
                && repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(req.getSelectedLayerId());
        p.setLayers(req.getLayers().stream().map(dto -> {
            ProjectLayer l = new ProjectLayer();
            l.setId(dto.getId());
            l.setName(dto.getName());
            l.setVisible(dto.isVisible());
            l.setLocked(dto.isLocked());
            l.setPixels(dto.getPixels());
            return l;
        }).toList());
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setUpdatedAt(Instant.now());

        return toDetail(repo.save(p));
    }

    public List<ProjectSummaryResponse> listForUser(String userId) {
        validateUser(userId);
        return repo.findAllByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(this::toSummary).toList();
    }

    public Optional<ProjectDetailResponse> getByIdForUser(String id, String userId) {
        return repo.findByIdAndUserId(id, userId).map(this::toDetail);
    }

    public void deleteForUser(String id, String userId) {
        Project p = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        repo.delete(p);
    }

    public ProjectSummaryResponse setFavorite(String id, String userId, boolean favorite) {
        Project p = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        p.setFavorite(favorite);
        p.setUpdatedAt(Instant.now());
        return toSummary(repo.save(p));
    }

    // ---------- helpers ----------
    private void validateUser(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!userRepo.existsById(userId)) {
            throw new IllegalArgumentException("user not found");
        }
    }

    private void validateProjectPayload(SaveProjectRequest req) {
        if (!StringUtils.hasText(req.getName())) {
            throw new IllegalArgumentException("name is required");
        }
        if (req.getWidth() <= 0 || req.getHeight() <= 0) {
            throw new IllegalArgumentException("invalid canvas size");
        }
        if (req.getLayers() == null || req.getLayers().isEmpty()) {
            throw new IllegalArgumentException("at least one layer is required");
        }
    }

    private String normalizeDataUrl(String s) {
        if (s == null) return null;
        String t = s.trim();
        // Keep as data URL; if you want to store only base64, strip the prefix here instead.
        return t;
    }

    private ProjectSummaryResponse toSummary(Project p) {
        return new ProjectSummaryResponse(
                p.getId(),
                p.getName(),
                p.getWidth(),
                p.getHeight(),
                p.isFavorite(),
                p.getPreviewPng(),
                p.getUpdatedAt()
        );
    }

    private ProjectDetailResponse toDetail(Project p) {
        ProjectDetailResponse r = new ProjectDetailResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setWidth(p.getWidth());
        r.setHeight(p.getHeight());
        r.setSelectedLayerId(p.getSelectedLayerId());
        r.setLayers(p.getLayers());
        r.setFavorite(p.isFavorite());
        r.setPreviewPng(p.getPreviewPng());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
