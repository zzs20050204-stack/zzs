package com.example.react.controller;

import com.example.react.common.Result;
import com.example.react.entity.VisitorApply;
import com.example.react.service.VisitorApplyService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/visitor")
@CrossOrigin
public class VisitorApplyController {
    @Resource
    private VisitorApplyService visitorApplyService;

    /**
     * 从请求头读取 userId，转为Long用户ID
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        String userIdStr = request.getHeader("userId");
        if (userIdStr == null || userIdStr.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(userIdStr.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // 居民提交预约
    @PostMapping("/apply")
    public Result<?> apply(@RequestBody VisitorApply apply, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return Result.error("请先登录");
        }
        apply.setResidentId(userId);
        return visitorApplyService.apply(apply);
    }

    // 居民-我的预约列表
    @GetMapping("/my/list")
    public Result<List<VisitorApply>> myList(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return Result.error("请先登录");
        }
        return visitorApplyService.getMyList(userId);
    }

    // 预约详情（访客码）
    @GetMapping("/detail/{id}")
    public Result<VisitorApply> detail(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return Result.error("请先登录");
        }
        return visitorApplyService.getById(id, userId);
    }

    // 管理员-待审核列表（新增登录校验）
    @GetMapping("/admin/pending")
    public Result<List<VisitorApply>> pendingList(HttpServletRequest request) {
        Long adminId = getCurrentUserId(request);
        if (adminId == null) {
            return Result.error("请先登录");
        }
        return visitorApplyService.getPendingList();
    }
    // 管理员-全部预约记录
    @GetMapping("/admin/all")
    public Result<List<VisitorApply>> allList(HttpServletRequest request) {
        Long adminId = getCurrentUserId(request);
        if (adminId == null) {
            return Result.error("请先登录");
        }
        return visitorApplyService.getAllList();
    }

    // 管理员审核操作
    @PutMapping("/audit")
    public Result<?> audit(@RequestBody VisitorApply dto, HttpServletRequest request) {
        Long adminId = getCurrentUserId(request);
        if (adminId == null) {
            return Result.error("请先登录");
        }
        return visitorApplyService.audit(dto.getId(), dto.getApplyStatus(), adminId, dto.getRejectReason());
    }

    // 门禁校验访客码
    @GetMapping("/check")
    public Result<Boolean> checkCode(@RequestParam String code) {
        return visitorApplyService.checkCode(code);
    }
}