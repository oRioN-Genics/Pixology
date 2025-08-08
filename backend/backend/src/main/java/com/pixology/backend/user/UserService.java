package com.pixology.backend.user;

import com.pixology.backend.user.dto.RegisterRequest;
import com.pixology.backend.user.dto.UserResponse;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public UserResponse register(RegisterRequest req) {
        final String username = safe(req.getUsername());
        final String email = safe(req.getEmail());
        final String password = req.getPassword() == null ? "" : req.getPassword();

        if (username.isBlank()) throw new IllegalArgumentException("username is required");
        if (email.isBlank())    throw new IllegalArgumentException("email is required");
        if (password.isBlank()) throw new IllegalArgumentException("password is required");

        if (repo.existsByUsername(username)) {
            throw new DuplicateKeyException("username already exists");
        }
        if (repo.existsByEmail(email)) {
            throw new DuplicateKeyException("email already exists");
        }

        final String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
        User saved = repo.save(new User(username, email.toLowerCase(), hash));

        return new UserResponse(saved.getId(), saved.getUsername(), saved.getEmail());
    }

    public Optional<User> authenticate(String email, String rawPassword) {
        final String em = safe(email).toLowerCase();
        final String pw = rawPassword == null ? "" : rawPassword;
        if (em.isBlank() || pw.isBlank()) return Optional.empty();

        return repo.findByEmail(em)
                .filter(u -> BCrypt.checkpw(pw, u.getPasswordHash()));
    }

    public Optional<UserResponse> login(String email, String rawPassword) {
        return authenticate(email, rawPassword)
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail()));
    }

    private String safe(String s) { return s == null ? "" : s.trim(); }
}
