package com.gvw.gvwbackend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gvw.gvwbackend.dto.request.UpdateUserRequestDTO;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.model.Member;
import com.gvw.gvwbackend.model.Role;
import com.gvw.gvwbackend.model.User;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
  @Mock private DbService dbService;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private MemberService memberService;
  @Mock private MailService mailService;

  @InjectMocks private UserService userService;

  @Test
  void testUpdateUserShouldUpdateUserData() {
    User user = new User();
    user.setUserId("123");
    user.setMemberId("321");
    user.setEmail("email");
    user.setAddress("address");
    user.setPhone("phone");

    Member member = new Member();
    member.setId("321");
    member.setEmail("original@mail.com");
    member.setAddress("address");
    member.setPhone("phone");

    when(dbService.findByQuery(any(), any(), eq(User.class))).thenReturn(List.of(user));
    when(memberService.getMemberById("321")).thenReturn(member);

    UpdateUserRequestDTO request =
        new UpdateUserRequestDTO("new@mail.com", "newPhone", "newAddress");

    userService.updateUser("123", request);

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    ArgumentCaptor<Member> memberCaptor = ArgumentCaptor.forClass(Member.class);

    verify(dbService).update(eq("users"), userCaptor.capture());
    verify(dbService).update(eq("members"), memberCaptor.capture());

    User updatedUser = userCaptor.getValue();
    Member updatedMember = memberCaptor.getValue();

    assertEquals("new@mail.com", updatedMember.getEmail());
    assertEquals("newPhone", updatedMember.getPhone());
    assertEquals("newAddress", updatedMember.getAddress());

    assertEquals("new@mail.com", updatedUser.getEmail());
    assertEquals("newPhone", updatedUser.getPhone());
    assertEquals("newAddress", updatedUser.getAddress());
  }

  @Test
  void testUpdateUserShouldThrowInvalidCredentialsWhenDifferentUserId() {
    User user = new User();
    user.setUserId("123");
    user.setMemberId("321");
    user.setEmail("email");
    user.setAddress("address");
    user.setPhone("phone");

    Member member = new Member();
    member.setId("321");
    member.setEmail("original@mail.com");
    member.setAddress("address");
    member.setPhone("phone");

    when(dbService.findByQuery(any(), any(), eq(User.class))).thenReturn(List.of(user));
    when(memberService.getMemberById("321")).thenReturn(member);

    UpdateUserRequestDTO request =
        new UpdateUserRequestDTO("new@mail.com", "newPhone", "newAddress");

    assertThrows(InvalidCredentialsException.class, () -> userService.updateUser("421", request));
  }

  @Test
  void testResetPasswordShouldUpdateAndSetFlag() {
    User user = new User();
    user.setEmail("test@mail.com");
    user.setUserId("123");
    user.setRole(Role.BOARD_MEMBER);

    when(dbService.findByQuery(any(), any(), eq(User.class)))
        .thenReturn(List.of(user))
        .thenReturn(List.of(user));

    when(passwordEncoder.encode(any())).thenReturn("hashedPw");

    userService.resetPassword("123");

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);

    verify(dbService).update(eq("users"), captor.capture());

    User updatedUser = captor.getValue();

    assertEquals("hashedPw", updatedUser.getPassword());
    assertTrue(updatedUser.getChangePassword());

    verify(mailService)
        .sendMail(
            eq("test@mail.com"),
            contains("GVW-Office: Passwort zurückgesetzt"),
            eq("resetPassword"),
            argThat(vars -> vars.containsKey("tempPassword")));
  }

  @Test
  void testResetPasswordShouldInvalidCredentialsIfInvalidRole() {
    User user = new User();
    user.setUserId("123");
    user.setRole(Role.MEMBER);

    when(dbService.findByQuery(any(), any(), eq(User.class))).thenReturn(List.of(user));

    assertThrows(
        InvalidCredentialsException.class,
        () -> {
          userService.resetPassword("123");
        });
  }
}
