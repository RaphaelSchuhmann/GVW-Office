package com.gvw.gvwbackend.mapper;

import com.gvw.gvwbackend.dto.request.UpdateMemberRequestDTO;
import com.gvw.gvwbackend.model.Member;
import com.gvw.gvwbackend.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface MemberMapper {

    void updateMemberFromDto(UpdateMemberRequestDTO dto, @MappingTarget Member member);

    @Mapping(target = "name", expression = "java(dto.name() + \" \" + dto.surname())")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rev", ignore = true)
    void updateUserFromDto(UpdateMemberRequestDTO dto, @MappingTarget User user);
}