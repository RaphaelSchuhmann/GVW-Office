package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    @Mock
    private DbService dbService;

    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void testResetPasswordShouldUpdateAndSetFlag() {
        User user = new User();
        user.setUserId("123");

        when(dbService.findByQuery(any(), any(), eq(User.class))).thenReturn(List.of(user));

        when(passwordEncoder.encode(any())).thenReturn("hashedPw");

        userService.resetPassword("123");;

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);

        verify(dbService).update(eq("users"), captor.capture());

        User updatedUser = captor.getValue();

        assertEquals("hashedPw", updatedUser.getPassword());
        assertTrue(updatedUser.getChangePassword());
    }
}
