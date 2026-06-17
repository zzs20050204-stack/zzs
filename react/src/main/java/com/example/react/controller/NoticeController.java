package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.Notice;
import com.example.react.service.NoticeService;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/notice")
public class NoticeController {

    @Resource
    private NoticeService noticeService;

    // 查询所有公告（不过滤过期，只排序）
    @GetMapping("/user/list")
    public Result userList() {
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Notice::getIsTop, Notice::getCreateTime);
        return Result.success(noticeService.list(wrapper));
    }

    // 发布公告
    @PostMapping("/user/add")
    public Result add(@RequestBody Map<String, Object> params, @RequestParam Integer userId) {
        Notice notice = new Notice();
        notice.setUserId(userId);
        notice.setCreateTime(LocalDateTime.now());
        notice.setIsTop(0);

        if (params.get("title") != null) {
            notice.setTitle(params.get("title").toString());
        }
        if (params.get("content") != null) {
            notice.setContent(params.get("content").toString());
        }

        if (params.get("isTop") != null) {
            try {
                notice.setIsTop(Integer.parseInt(params.get("isTop").toString()));
            } catch (Exception e) {
                notice.setIsTop(0);
            }
        }

        String expireTimeStr = params.get("expireTime") == null ? "" : params.get("expireTime").toString();
        if (StringUtils.hasText(expireTimeStr)) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                notice.setExpireTime(LocalDateTime.parse(expireTimeStr, formatter));
            } catch (Exception e) {
                notice.setExpireTime(null);
            }
        }

        noticeService.save(notice);
        return Result.success(null);
    }

    // 【新增】切换置顶状态：1=置顶 0=取消置顶
    @PutMapping("/toggleTop")
    public Result toggleTop(@RequestParam Integer id, @RequestParam Integer isTop) {
        Notice notice = noticeService.getById(id);
        if (notice == null) {
            return Result.error("公告不存在");
        }
        notice.setIsTop(isTop);
        noticeService.updateById(notice);
        return Result.success("操作成功");
    }

    // 管理员删除
    @DeleteMapping("/admin/delete")
    public Result adminDelete(@RequestParam Integer id) {
        noticeService.removeById(id);
        return Result.success("删除成功");
    }

    // 普通用户删除自己公告
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