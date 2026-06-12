package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.Notice;
import com.example.react.service.NoticeService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/notice")
public class NoticeController {

    @Resource
    private NoticeService noticeService;

    // 用户 + 管理员都能看公告列表
    @GetMapping("/user/list")
    public Result userList() {
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Notice::getCreateTime);
        return Result.success(noticeService.list(wrapper));
    }

    // 用户发布公告
    @PostMapping("/user/add")
    public Result add(@RequestBody Notice notice, @RequestParam Integer userId) {
        notice.setUserId(userId);
        notice.setCreateTime(LocalDateTime.now());
        noticeService.save(notice);
        return Result.success(null);
    }

    // 管理员删除任意公告
    @DeleteMapping("/admin/delete")
    public Result adminDelete(@RequestParam Integer id) {
        noticeService.removeById(id);
        return Result.success("删除成功");
    }

    // 用户只能删除自己的公告
    @DeleteMapping("/user/delete")
    public Result userDelete(@RequestParam Integer id, @RequestParam Integer loginUserId) {
        if (loginUserId == null || loginUserId == 0) {
            return Result.error("用户未登录");
        }

        Notice notice = noticeService.getById(id);
        if (notice == null) {
            return Result.error("公告不存在");
        }

        if (!notice.getUserId().equals(loginUserId)) {
            return Result.error("你只能删除自己发布的公告");
        }

        noticeService.removeById(id);
        return Result.success("删除成功");
    }

}