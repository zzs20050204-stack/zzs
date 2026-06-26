package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.*;
import com.example.react.mapper.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Resource private UserMapper userMapper;
    @Resource private OrderMapper orderMapper;
    @Resource private PropertyBillMapper propertyBillMapper;
    @Resource private RepairMapper repairMapper;
    @Resource private SuggestionMapper suggestionMapper;
    @Resource private VisitorApplyMapper visitorApplyMapper;
    @Resource private NoticeMapper noticeMapper;
    @Resource private GoodsMapper goodsMapper;

    @GetMapping("/statistics")
    public Result<Map<String, Object>> statistics() {
        Map<String, Object> data = new HashMap<>();

        // 用户总数
        List<User> users = userMapper.selectList(null);
        data.put("userCount", users.size());

        // 订单统计
        List<Order> orders = orderMapper.selectList(null);
        data.put("orderCount", orders.size());
        Map<String, Integer> orderStatusStats = new HashMap<>();
        for (Order o : orders) {
            orderStatusStats.merge(o.getStatus(), 1, Integer::sum);
        }
        data.put("orderStatusStats", orderStatusStats);

        // 物业费统计
        List<PropertyBill> bills = propertyBillMapper.selectList(null);
        long paidBills = bills.stream().filter(b -> "已缴费".equals(b.getStatus())).count();
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal paidAmount = BigDecimal.ZERO;
        for (PropertyBill b : bills) {
            if (b.getMoney() != null) {
                totalAmount = totalAmount.add(b.getMoney());
                if ("已缴费".equals(b.getStatus())) {
                    paidAmount = paidAmount.add(b.getMoney());
                }
            }
        }
        data.put("propertyTotalBills", bills.size());
        data.put("propertyPaidBills", (int) paidBills);
        data.put("propertyUnpaidBills", bills.size() - (int) paidBills);
        data.put("propertyTotalAmount", totalAmount);
        data.put("propertyPaidAmount", paidAmount);

        // 报修统计
        List<Repair> repairs = repairMapper.selectList(null);
        Map<String, Integer> repairStatusStats = new HashMap<>();
        for (Repair r : repairs) {
            repairStatusStats.merge(r.getStatus(), 1, Integer::sum);
        }
        data.put("repairTotal", repairs.size());
        data.put("repairStatusStats", repairStatusStats);

        // 建议统计
        List<Suggestion> suggestions = suggestionMapper.selectList(null);
        Map<String, Integer> suggestionStatusStats = new HashMap<>();
        for (Suggestion s : suggestions) {
            suggestionStatusStats.merge(s.getStatus(), 1, Integer::sum);
        }
        data.put("suggestionTotal", suggestions.size());
        data.put("suggestionStatusStats", suggestionStatusStats);

        // 访客统计
        List<VisitorApply> visitors = visitorApplyMapper.selectList(null);
        Map<String, Integer> visitorStatusStats = new LinkedHashMap<>();
        visitorStatusStats.put("待审核", 0);
        visitorStatusStats.put("已通过", 0);
        visitorStatusStats.put("已驳回", 0);
        for (VisitorApply v : visitors) {
            if (v.getApplyStatus() == 1) visitorStatusStats.merge("待审核", 1, Integer::sum);
            else if (v.getApplyStatus() == 2) visitorStatusStats.merge("已通过", 1, Integer::sum);
            else if (v.getApplyStatus() == 3) visitorStatusStats.merge("已驳回", 1, Integer::sum);
        }
        data.put("visitorTotal", visitors.size());
        data.put("visitorStatusStats", visitorStatusStats);

        // 公告和商品
        data.put("noticeCount", noticeMapper.selectCount(null));
        data.put("goodsCount", goodsMapper.selectCount(null));

        // 最近 5 条订单
        QueryWrapper<Order> orderWrapper = new QueryWrapper<>();
        orderWrapper.orderByDesc("id").last("LIMIT 5");
        List<Order> recentOrders = orderMapper.selectList(orderWrapper);
        List<Map<String, Object>> recentOrderList = new ArrayList<>();
        for (Order o : recentOrders) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("orderNo", o.getOrderNo());
            orderMap.put("status", o.getStatus());
            orderMap.put("totalPrice", o.getTotalPrice());
            User u = userMapper.selectById(o.getUserId());
            orderMap.put("username", u != null ? u.getUsername() : "未知");
            recentOrderList.add(orderMap);
        }
        data.put("recentOrders", recentOrderList);

        return Result.success(data);
    }
}
