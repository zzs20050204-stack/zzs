package com.example.react.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.react.common.Result;
import com.example.react.constant.VisitorStatus;
import com.example.react.entity.VisitorApply;
import com.example.react.mapper.VisitorApplyMapper;
import com.example.react.util.CodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import javax.annotation.Resource;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
public class VisitorApplyService {
    @Resource
    private VisitorApplyMapper visitorApplyMapper;

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    // 居民提交预约
    public Result<?> apply(VisitorApply apply) {
        if (apply.getVisitorName() == null || apply.getVisitorName().trim().isEmpty()) {
            return Result.error("访客姓名不能为空");
        }
        if (apply.getVisitorPhone() == null || !apply.getVisitorPhone().matches("^1[3-9]\\d{9}$")) {
            return Result.error("请输入正确的手机号");
        }
        if (apply.getStartTime() == null || apply.getEndTime() == null) {
            return Result.error("请选择来访时间段");
        }

        // 修复：仅拦截结束时间早于开始，相等时间允许提交
        try {
            Date startDate = sdf.parse(apply.getStartTime());
            Date endDate = sdf.parse(apply.getEndTime());
            // 修改判断条件：只拦截结束 < 开始，去掉等于拦截
            if (endDate.getTime() < startDate.getTime()) {
                return Result.error("结束时间不能早于开始时间");
            }
        } catch (ParseException e) {
            return Result.error("时间格式错误，请重新选择时间");
        }

        apply.setApplyStatus(VisitorStatus.PENDING.getCode());
        apply.setCreateTime(sdf.format(new Date()));
        visitorApplyMapper.insert(apply);
        return Result.success(null);
    }

    // 居民查询个人预约
    public Result<List<VisitorApply>> getMyList(Long residentId) {
        LambdaQueryWrapper<VisitorApply> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VisitorApply::getResidentId, residentId)
                .orderByDesc(VisitorApply::getCreateTime);
        List<VisitorApply> list = visitorApplyMapper.selectList(wrapper);
        return Result.success(list);
    }

    // 管理员待审核列表
    public Result<List<VisitorApply>> getPendingList() {
        LambdaQueryWrapper<VisitorApply> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VisitorApply::getApplyStatus, VisitorStatus.PENDING.getCode())
                .orderByDesc(VisitorApply::getCreateTime);
        List<VisitorApply> list = visitorApplyMapper.selectList(wrapper);
        return Result.success(list);
    }
    // 管理员查询所有预约记录
    public Result<List<VisitorApply>> getAllList() {
        LambdaQueryWrapper<VisitorApply> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(VisitorApply::getCreateTime);
        List<VisitorApply> list = visitorApplyMapper.selectList(wrapper);
        return Result.success(list);
    }

    // 审核：通过/驳回
    public Result<?> audit(Long id, Integer status, Long adminId, String rejectReason) {
        VisitorApply apply = visitorApplyMapper.selectById(id);
        if (apply == null) {
            return Result.error("预约记录不存在");
        }
        if (apply.getApplyStatus() != VisitorStatus.PENDING.getCode()) {
            return Result.error("该预约已被审核，无法重复操作");
        }
        String nowTime = sdf.format(new Date());
        LambdaUpdateWrapper<VisitorApply> wrapper = new LambdaUpdateWrapper<>();
        wrapper.set(VisitorApply::getApplyStatus, status)
                .set(VisitorApply::getAuditAdminId, adminId)
                .set(VisitorApply::getAuditTime, nowTime)
                .set(VisitorApply::getUpdateTime, nowTime);

        if (VisitorStatus.PASSED.getCode() == status) {
            String code = CodeUtil.generateVisitorCode();
            wrapper.set(VisitorApply::getVisitorCode, code);
        } else if (VisitorStatus.REJECT.getCode() == status) {
            wrapper.set(VisitorApply::getRejectReason, rejectReason);
        }
        wrapper.eq(VisitorApply::getId, id);
        visitorApplyMapper.update(null, wrapper);
        return Result.success(null);
    }

    // 根据ID查详情（访客码），校验归属
    public Result<VisitorApply> getById(Long id, Long userId) {
        VisitorApply apply = visitorApplyMapper.selectById(id);
        if (apply == null) {
            return Result.error("预约记录不存在");
        }
        if (!apply.getResidentId().equals(userId)) {
            return Result.error("无权查看该预约");
        }
        return Result.success(apply);
    }

    // 门禁校验访客码
    public Result<Boolean> checkCode(String code) {
        if (!StringUtils.hasText(code)) {
            return Result.error("访客码不能为空");
        }
        LambdaQueryWrapper<VisitorApply> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VisitorApply::getVisitorCode, code)
                .eq(VisitorApply::getApplyStatus, VisitorStatus.PASSED.getCode());
        VisitorApply apply = visitorApplyMapper.selectOne(wrapper);
        if (apply == null) {
            return Result.success(false);
        }
        String now = sdf.format(new Date());
        boolean valid = now.compareTo(apply.getStartTime()) > 0
                && now.compareTo(apply.getEndTime()) < 0;
        return Result.success(valid);
    }
}