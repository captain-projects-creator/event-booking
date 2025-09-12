package com.example.event_booking.service;

import com.example.event_booking.model.User;
import com.example.event_booking.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user) {
        if (user.getUsername() == null) throw new IllegalArgumentException("username required");
        String username = user.getUsername().trim();
        if (userRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("username already taken");
        }

        String raw = user.getPassword() == null ? "" : user.getPassword();
        user.setPassword(passwordEncoder.encode(raw));

        if (user.getRole() == null) user.setRole("USER");
        user.setUsername(username);
        return userRepo.save(user);
    }

    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        if (rawPassword == null) rawPassword = "";
        if (encodedPassword == null) return false;
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}