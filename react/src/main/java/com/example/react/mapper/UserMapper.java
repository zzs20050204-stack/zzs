package com.example.react.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.react.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}