package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.entity.User;
import com.example.react.mapper.UserMapper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
public class RegisterController {

    @Resource
    private UserMapper userMapper;

    public static class RegisterParam {
        public String username;
        public String password;
        public String phone;
        public String confirmPwd;

        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public String getPhone() { return phone; }
        public String getConfirmPwd() { return confirmPwd; }
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterParam param) {
        Map<String, Object> res = new HashMap<>();

        if (!param.getPassword().equals(param.getConfirmPwd())) {
            res.put("code", 500);
            res.put("msg", "两次密码不一致");
            return res;
        }

        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", param.getUsername());
        User exist = userMapper.selectOne(wrapper);
        if (exist != null) {
            res.put("code", 500);
            res.put("msg", "用户名已存在");
            return res;
        }

        // 保存用户（✅ 已自动添加 createTime / role / status）
        User user = new User();
        user.setUsername(param.getUsername());
        user.setPassword(param.getPassword());
        user.setPhone(param.getPhone());

        // ✅ 自动设置创建时间
        user.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        // ✅ 默认角色
        user.setRole("普通用户");
        // ✅ 默认状态
        user.setStatus("正常");

        userMapper.insert(user);

        res.put("code", 200);
        res.put("msg", "注册成功");
        return res;
    }
}