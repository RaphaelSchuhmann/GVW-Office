package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.UserUpdateRequestDTO;
import com.gvw.gvwbackend.dto.response.UserResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserService {
    private final DbService dbService;
    private final PasswordEncoder passwordEncoder;

    public UserService(DbService dbService, PasswordEncoder passwordEncoder) {
        this.dbService = dbService;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDTO getUser(String userId) {
        if (userId == null || userId.isEmpty()) {
            throw new InvalidCredentialsException("Unauthorized");
        }

        User user = getUserByUserId(userId);

        return new UserResponseDTO(user.getEmail(), user.getRole(), user.getName(), user.getAddress(), user.getPhone());
    }


    // TODO: Note that this method cannot be properly tested yet as it also is working with member data
    public void updateUser(String userId, UserUpdateRequestDTO requestDTO) {
        if (userId == null || userId.isEmpty()) {
            throw new InvalidCredentialsException("Unauthorized");
        }

        if (requestDTO == null || requestDTO.email().isEmpty() || requestDTO.phone().isEmpty() || requestDTO.address().isEmpty()) {
            throw new BadRequestException("InvalidData");
        }

        User user = getUserByUserId(userId);

        user.setEmail(requestDTO.email());
        user.setPhone(requestDTO.phone());
        user.setAddress(requestDTO.address());

        dbService.update("users", user);

        // TODO: Add member data update here
        // TODO: Add member db update here

        // member.setEmail(requestDTO.email());
        // member.setPhone(requestDTO.phone());
        // member.setAddress(requestDTO.address());

        // dbService.update("members", member);
    }

    // TODO: Note that this method cannot be properly tested yet as it is working with a mailer
    public void resetPassword(String requesterUserId, String memberId) {
        if (requesterUserId == null || requesterUserId.isEmpty()) {
            throw new InvalidCredentialsException("Unauthorized");
        }

        if (memberId == null || memberId.isEmpty()) {
            throw new BadRequestException("InvalidData");
        }

        User requesterUser = getUserByUserId(requesterUserId);
        String requesterUserRole = requesterUser.getRole();
        if (!requesterUserRole.equals("admin") && !requesterUserRole.equals("vorstand")) {
            throw new InvalidCredentialsException("Unauthorized");
        }

        User user = getUserByUserId(memberId);

        String temporaryPassword = AuthService.generatePassword(3, 2);

        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setChangePassword(true);
        dbService.update("users", user);

        // TODO: Add mailer send mail
        /* Implementation in old api
        const html = await loadTemplate("newUser", { tempPassword: temporaryPassword });

        await sendMail({
            to: user.email,
            subject: "Passwort zurückgesetzt",
            content: html
        });
         */
    }

    private User getUserByMemberId(String memberId) {
        Map<String, Object> query = Map.of("selector", Map.of("memberId", memberId), "limit", 1);
        List<User> users = dbService.findByQuery("users", query, User.class);

        if (users == null || users.isEmpty()) throw new NotFoundException("UserNotFound");

        return users.getFirst();
    }

    private User getUserByUserId(String userId) {
        Map<String, Object> query = Map.of("selector", Map.of("userId", userId), "limit", 1);
        List<User> users = dbService.findByQuery("users", query, User.class);

        if (users == null || users.isEmpty()) throw new NotFoundException("UserNotFound");

        return users.getFirst();
    }
}
