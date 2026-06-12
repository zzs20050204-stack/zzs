package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.entity.LoginRequest;
import com.example.react.common.Result;
import com.example.react.entity.User;
import com.example.react.mapper.UserMapper;
import com.example.react.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
public class LoginController {

    @Autowired
    private UserMapper userMapper;

    // 登录
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username);
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            return Result.error("用户不存在");
        }
        if (!user.getPassword().equals(password)) {
            return Result.error("密码错误");
        }

        String token = JwtUtil.createToken(user.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);

        return Result.success(data);
    }

    // 获取当前登录用户信息
    @GetMapping("/getInfo")
    public Result<User> getInfo(HttpServletRequest request) {
        String token = request.getHeader("token");
        if (token == null || !JwtUtil.verifyToken(token)) {
            return Result.error(401, "未登录");
        }

        String username = JwtUtil.getUsernameByToken(token);
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));

        return Result.success(user);
    }

    // 修改资料
    @PostMapping("/updateUser")
    public Result<String> updateUser(@RequestBody User user, HttpServletRequest request){
        String token = request.getHeader("token");
        String username = JwtUtil.getUsernameByToken(token);
        User oldUser = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        oldUser.setPhone(user.getPhone());
        oldUser.setEmail(user.getEmail());
        userMapper.updateById(oldUser);
        return Result.success("修改成功");
    }

    // 头像上传
    @PostMapping("/uploadAvatar")
    public Result<String> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        try {
            String token = request.getHeader("token");
            String username = JwtUtil.getUsernameByToken(token);
            User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));

            String uploadPath = System.getProperty("user.dir") + "/avatar/";
            File dir = new File(uploadPath);
            if (!dir.exists()) dir.mkdirs();

            String filename = UUID.randomUUID() + ".png";
            File dest = new File(uploadPath + filename);
            file.transferTo(dest);

            user.setAvatar("/avatar/" + filename);
            userMapper.updateById(user);

            return Result.success("/avatar/" + filename);

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("上传失败");
        }
    }

    // ================== 【用户管理接口】 ==================
    // 获取所有用户列表
    @GetMapping("/user/list")
    public Result list() {
        return Result.success(userMapper.selectList(null));
    }

    // 删除用户
    @DeleteMapping("/user/delete")
    public Result delete(@RequestParam Integer id) {
        userMapper.deleteById(id);
        return Result.success("删除成功");
    }

}