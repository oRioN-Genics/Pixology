package com.pixology.backend.project;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findAllByUserIdOrderByUpdatedAtDesc(String userId);
    List<Project> findAllByUserIdAndFavoriteOrderByUpdatedAtDesc(String userId, boolean favorite);
    Optional<Project> findByIdAndUserId(String id, String userId);
    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);
}
