package com.pixology.backend.controller;

import com.pixology.backend.model.User;
import com.pixology.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;


import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }
        return ResponseEntity.ok(userRepository.save(user));
    }


    @PostMapping("/login")
    public String loginUser(@RequestBody User login) {
        Optional<User> found = userRepository.findByEmail(login.getEmail());
        if (found.isPresent() && found.get().getPassword().equals(login.getPassword())) {
            return "Login successful";
        } else {
            return "Invalid credentials";
        }
    }
}
