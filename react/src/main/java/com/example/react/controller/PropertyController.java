package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.PropertyBill;
import com.example.react.entity.Suggestion;
import com.example.react.mapper.PropertyBillMapper;
import com.example.react.mapper.SuggestionMapper;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/property")
public class PropertyController {

    private final PropertyBillMapper billMapper;
    private final SuggestionMapper suggestionMapper;

    public PropertyController(PropertyBillMapper billMapper, SuggestionMapper suggestionMapper) {
        this.billMapper = billMapper;
        this.suggestionMapper = suggestionMapper;
    }

    // ==================== 缴费单功能 ====================
    @PostMapping("/bill/add")
    public Result add(@RequestBody Map<String, Object> map) {
        try {
            String userId = map.get("userId").toString();
            String payType = (String) map.get("payType");
            String moneyStr = (String) map.get("money");
            String deadlineStr = (String) map.get("deadline");
            String remark = (String) map.get("remark");

            DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            PropertyBill bill = new PropertyBill();
            bill.setUserId(userId);
            bill.setPayType(payType);
            bill.setMoney(new BigDecimal(moneyStr));
            bill.setDeadline(LocalDateTime.parse(deadlineStr, format));
            bill.setRemark(remark);
            bill.setStatus("待缴费");
            bill.setCreateTime(LocalDateTime.now());

            billMapper.insert(bill);
            return Result.success("下发成功");

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("失败：" + e.getMessage());
        }
    }

    @GetMapping("/bill/list/all")
    public Result listAll() {
        return Result.success(billMapper.selectList(null));
    }

    @GetMapping("/bill/list/user")
    public Result listUser(@RequestParam String userId) {
        QueryWrapper<PropertyBill> qw = new QueryWrapper<>();
        qw.eq("user_id", userId);
        qw.orderByDesc("id");
        return Result.success(billMapper.selectList(qw));
    }

    @PostMapping("/bill/pay")
    public Result pay(@RequestBody Map<String, Integer> params) {
        PropertyBill bill = billMapper.selectById(params.get("id"));
        if (bill == null) return Result.error("账单不存在");
        if ("已缴费".equals(bill.getStatus())) return Result.error("已缴费");

        bill.setStatus("已缴费");
        bill.setPayTime(LocalDateTime.now());
        billMapper.updateById(bill);
        return Result.success("缴费成功");
    }

    // ==================== 建议反馈功能 ====================
    @PostMapping("/suggestion/add")
    public Result addSuggestion(@RequestBody Map<String, Object> map) {
        try {
            String username = (String) map.get("username");
            String content = (String) map.get("content");

            Suggestion s = new Suggestion();
            s.setUserName(username);
            s.setContent(content);
            s.setStatus("待处理");
            s.setCreateTime(LocalDateTime.now());

            suggestionMapper.insert(s);
            return Result.success("提交成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("提交失败");
        }
    }

    @GetMapping("/suggestion/list")
    public Result listSuggestion() {
        QueryWrapper<Suggestion> qw = new QueryWrapper<>();
        qw.orderByDesc("id");
        return Result.success(suggestionMapper.selectList(qw));
    }

    @PostMapping("/suggestion/handle")
    public Result handleSuggestion(@RequestBody Map<String, Integer> map) {
        Suggestion s = suggestionMapper.selectById(map.get("id"));
        if (s == null) return Result.error("记录不存在");
        s.setStatus("已处理");
        suggestionMapper.updateById(s);
        return Result.success("操作成功");
    }
    @GetMapping("/suggestion/myList")
    public Result myList(@RequestParam String username) {
        QueryWrapper<Suggestion> qw = new QueryWrapper<>();
        qw.eq("user_name", username);
        qw.orderByDesc("id");
        return Result.success(suggestionMapper.selectList(qw));
    }
}