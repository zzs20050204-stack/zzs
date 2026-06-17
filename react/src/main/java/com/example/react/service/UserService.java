package com.example.react.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.User;
import com.example.react.mapper.UserMapper;
import org.springframework.stereotype.Service;
import javax.annotation.Resource;

@Service
public class UserService {
    @Resource
    private UserMapper userMapper;

    public Result<User> login(String username, String password) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username)
                .eq(User::getPassword, password);
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            return Result.error("账号或密码错误");
        }
        if (!"正常".equals(user.getStatus())) {
            return Result.error("账号已禁用");
        }
        return Result.success(user);
    }
}