package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.*;
import com.example.react.mapper.*;
import com.example.react.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RepairMapper repairMapper;
    @Autowired
    private VisitorApplyMapper visitorApplyMapper;
    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private PropertyBillMapper propertyBillMapper;
    @Autowired
    private SuggestionMapper suggestionMapper;
    @Autowired
    private NoticeMapper noticeMapper;

    private String fmtTime(Object time) {
        if (time == null) return "";
        if (time instanceof LocalDateTime) {
            return ((LocalDateTime) time).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
        String s = time.toString();
        if (s.contains("T")) s = s.replace("T", " ");
        if (s.length() > 19) s = s.substring(0, 19);
        return s;
    }

    @GetMapping("/list")
    public Result getNotifications(HttpServletRequest request) {
        try {
            String token = request.getHeader("token");
            if (token == null || token.isEmpty()) {
                return Result.error("未登录");
            }
            String username = JwtUtil.getUsernameByToken(token);
            User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
            if (user == null) return Result.error("用户不存在");

            Long userId = user.getId();
            boolean isAdmin = "管理员".equals(user.getRole());
            List<Map<String, Object>> list = new ArrayList<>();

            if (isAdmin) {
                // 管理员：只看待处理数量
                long repairPending = repairMapper.selectCount(
                        new QueryWrapper<Repair>().eq("status", "待处理"));
                long visitorPending = visitorApplyMapper.selectCount(
                        new QueryWrapper<VisitorApply>().eq("apply_status", 1));
                long orderPending = orderMapper.selectCount(
                        new QueryWrapper<Order>().eq("status", "待支付"));
                long propertyPending = propertyBillMapper.selectCount(
                        new QueryWrapper<PropertyBill>().eq("status", "待缴费"));
                long suggestionPending = suggestionMapper.selectCount(
                        new QueryWrapper<Suggestion>().eq("status", "待处理"));

                if (repairPending > 0) {
                    list.add(makePendingItem("pending-repair", "repair", "repair",
                            "报修工单", "有 " + repairPending + " 条报修待处理"));
                }
                if (visitorPending > 0) {
                    list.add(makePendingItem("pending-visitor", "visitor", "visitor",
                            "访客预约", "有 " + visitorPending + " 条访客预约待审核"));
                }
                if (orderPending > 0) {
                    list.add(makePendingItem("pending-order", "order", "order",
                            "订单动态", "有 " + orderPending + " 条订单待支付"));
                }
                if (propertyPending > 0) {
                    list.add(makePendingItem("pending-property", "property", "property",
                            "物业缴费", "有 " + propertyPending + " 条账单待缴费"));
                }
                if (suggestionPending > 0) {
                    list.add(makePendingItem("pending-suggestion", "suggestion", "suggestion",
                            "建议反馈", "有 " + suggestionPending + " 条建议待处理"));
                }

                // 公告也展示给管理员
                QueryWrapper<Notice> noticeQ = new QueryWrapper<>();
                noticeQ.orderByDesc("create_time");
                List<Notice> notices = noticeMapper.selectList(noticeQ);
                for (Notice n : notices) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "notice-" + n.getId());
                    item.put("content", n.getTitle());
                    item.put("time", fmtTime(n.getCreateTime()));
                    item.put("status", "");
                    addItem(list, "notice", "notice", "社区公告", item);
                }

            } else {
                // 用户：只看已处理的通知（管理员处理后的一次性消息）

                // ===== 报修：状态不是"待处理"的通知 =====
                QueryWrapper<Repair> repairQ = new QueryWrapper<>();
                repairQ.eq("username", username);
                repairQ.ne("status", "待处理");
                repairQ.orderByDesc("create_time");
                List<Repair> repairs = repairMapper.selectList(repairQ);
                for (Repair r : repairs) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "repair-done-" + r.getId());
                    item.put("content", "您的报修「" + r.getContent() + "」已处理，状态：" + r.getStatus());
                    item.put("time", fmtTime(r.getCreateTime()));
                    item.put("status", r.getStatus());
                    addItem(list, "repair", "repair", "报修工单", item);
                }

                // ===== 访客：已审核的通知 =====
                QueryWrapper<VisitorApply> visitorQ = new QueryWrapper<>();
                visitorQ.eq("resident_id", userId);
                visitorQ.in("apply_status", 2, 3);
                visitorQ.orderByDesc("audit_time");
                List<VisitorApply> visitors = visitorApplyMapper.selectList(visitorQ);
                for (VisitorApply v : visitors) {
                    String st = v.getApplyStatus() == 2 ? "已通过" : "已驳回";
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "visitor-done-" + v.getId());
                    item.put("content", "您的访客「" + v.getVisitorName() + "」预约" + st);
                    item.put("time", fmtTime(v.getAuditTime()));
                    item.put("status", st);
                    addItem(list, "visitor", "visitor", "访客预约", item);
                }

                // ===== 订单：已处理的（非待支付） =====
                QueryWrapper<Order> orderQ = new QueryWrapper<>();
                orderQ.eq("user_id", userId);
                orderQ.ne("status", "待支付");
                orderQ.orderByDesc("create_time");
                List<Order> orders = orderMapper.selectList(orderQ);
                for (Order o : orders) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "order-done-" + o.getId());
                    item.put("content", "您的订单 " + o.getOrderNo() + " 状态：" + o.getStatus());
                    item.put("time", fmtTime(o.getPayTime() != null ? o.getPayTime() : o.getCreateTime()));
                    item.put("status", o.getStatus());
                    addItem(list, "order", "order", "订单动态", item);
                }

                // ===== 物业：已缴费的 =====
                QueryWrapper<PropertyBill> billQ = new QueryWrapper<>();
                billQ.eq("user_id", username);
                billQ.ne("status", "待缴费");
                billQ.orderByDesc("create_time");
                List<PropertyBill> bills = propertyBillMapper.selectList(billQ);
                for (PropertyBill b : bills) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "property-done-" + b.getId());
                    item.put("content", b.getPayType() + " ¥" + b.getMoney() + " 已缴费");
                    item.put("time", fmtTime(b.getPayTime() != null ? b.getPayTime() : b.getCreateTime()));
                    item.put("status", b.getStatus());
                    addItem(list, "property", "property", "物业缴费", item);
                }

                // ===== 建议：已处理的 =====
                QueryWrapper<Suggestion> sugQ = new QueryWrapper<>();
                sugQ.eq("user_name", username);
                sugQ.ne("status", "待处理");
                sugQ.orderByDesc("create_time");
                List<Suggestion> suggestions = suggestionMapper.selectList(sugQ);
                for (Suggestion s : suggestions) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "suggestion-done-" + s.getId());
                    item.put("content", "您的建议「" + s.getContent() + "」已处理，状态：" + s.getStatus());
                    item.put("time", fmtTime(s.getCreateTime()));
                    item.put("status", s.getStatus());
                    addItem(list, "suggestion", "suggestion", "建议反馈", item);
                }

                // ===== 公告 =====
                QueryWrapper<Notice> noticeQ = new QueryWrapper<>();
                noticeQ.orderByDesc("create_time");
                List<Notice> notices = noticeMapper.selectList(noticeQ);
                for (Notice n : notices) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "notice-" + n.getId());
                    item.put("content", n.getTitle());
                    item.put("time", fmtTime(n.getCreateTime()));
                    item.put("status", "");
                    addItem(list, "notice", "notice", "社区公告", item);
                }
            }

            // 按时间排序，取最近 30 条
            list.sort((a, b) -> String.valueOf(b.get("time")).compareTo(String.valueOf(a.get("time"))));
            if (list.size() > 30) list = list.subList(0, 30);

            return Result.success(list);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取通知失败: " + e.getMessage());
        }
    }

    private Map<String, Object> makePendingItem(String id, String type, String icon, String title, String content) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("type", type);
        item.put("icon", icon);
        item.put("title", title);
        item.put("content", content);
        item.put("time", fmtTime(LocalDateTime.now()));
        item.put("status", "待处理");
        return item;
    }

    private void addItem(List<Map<String, Object>> list, String type, String icon, String title, Map<String, Object> base) {
        base.put("type", type);
        base.put("icon", icon);
        base.put("title", title);
        list.add(base);
    }
}
