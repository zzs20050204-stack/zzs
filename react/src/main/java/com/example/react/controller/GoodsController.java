package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.*;
import com.example.react.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/goods")
public class GoodsController {

    @Autowired
    private GoodsMapper goodsMapper;
    @Autowired
    private CartMapper cartMapper;
    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private OrderItemMapper orderItemMapper;
    @Autowired
    private CommentMapper commentMapper;
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AddressMapper addressMapper;

    @GetMapping("/list")
    public Result goodsList() {
        return Result.success(goodsMapper.selectList(null));
    }

    @PostMapping("/add")
    public Result addGoods(@RequestBody Goods goods) {
        goods.setCreateTime(LocalDateTime.now());
        goodsMapper.insert(goods);
        return Result.success("商品发布成功");
    }

    @PutMapping("/update")
    public Result updateGoods(@RequestBody Goods goods) {
        goodsMapper.updateById(goods);
        return Result.success("商品修改成功");
    }

    @DeleteMapping("/delete")
    public Result deleteGoods(@RequestParam Integer id) {
        goodsMapper.deleteById(id);
        return Result.success("商品删除成功");
    }

    // ================== 购物车 ==================
    @GetMapping("/cart/list")
    public Result cartList(@RequestParam Integer userId) {
        QueryWrapper<Cart> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        return Result.success(cartMapper.selectList(wrapper));
    }

    @PostMapping("/cart/add")
    public Result addCart(@RequestBody Cart cart) {
        // 同一用户同一商品，存在则数量+1，否则新增
        QueryWrapper<Cart> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", cart.getUserId()).eq("goods_id", cart.getGoodsId());
        Cart existCart = cartMapper.selectOne(wrapper);
        if (existCart != null) {
            existCart.setNum(existCart.getNum() + (cart.getNum() != null ? cart.getNum() : 1));
            cartMapper.updateById(existCart);
            return Result.success("购物车数量已更新");
        }
        if (cart.getNum() == null || cart.getNum() <= 0) {
            cart.setNum(1);
        }
        cart.setCreateTime(LocalDateTime.now());
        cartMapper.insert(cart);
        return Result.success("加入购物车成功");
    }

    @PutMapping("/cart/update")
    public Result updateCart(@RequestBody Cart cart) {
        Cart existCart = cartMapper.selectById(cart.getId());
        if (existCart == null) return Result.error("购物车记录不存在");
        existCart.setNum(cart.getNum());
        cartMapper.updateById(existCart);
        return Result.success("数量更新成功");
    }

    @DeleteMapping("/cart/delete")
    public Result deleteCart(@RequestParam Integer id) {
        cartMapper.deleteById(id);
        return Result.success("移除购物车成功");
    }

    // ================== 下单（支持地址 + 立即购买 + 购物车） ==================
    @PostMapping("/order/add")
    @Transactional
    public Result addOrder(@RequestBody Map<String, Object> params) {
        Integer userId = (Integer) params.get("userId");
        Integer addressId = (Integer) params.get("addressId");

        if (userId == null) {
            return Result.error("用户ID不能为空");
        }

        Address address = null;
        if (addressId != null) {
            address = addressMapper.selectById(addressId);
        }

        // 1. 立即购买
        if (params.containsKey("goodsId")) {
            Integer goodsId = (Integer) params.get("goodsId");
            Integer num = (Integer) params.getOrDefault("num", 1);

            Goods goods = goodsMapper.selectById(goodsId);
            if (goods == null) {
                return Result.error("商品不存在");
            }

            BigDecimal price = new BigDecimal(goods.getPrice());
            BigDecimal totalPrice = price.multiply(new BigDecimal(num));

            Order order = new Order();
            order.setUserId(userId);
            order.setTotalPrice(totalPrice);
            order.setStatus("待支付");

            if (address != null) {
                order.setReceiverName(address.getReceiverName());
                order.setReceiverPhone(address.getReceiverPhone());
                order.setReceiverAddress(address.getReceiverAddress());
            } else {
                order.setReceiverName("匿名用户");
                order.setReceiverPhone("13800000000");
                order.setReceiverAddress("暂无地址");
            }

            order.setCreateTime(LocalDateTime.now());
            order.setOrderNo("OD" + System.currentTimeMillis());
            orderMapper.insert(order);

            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setGoodsId(goodsId);
            item.setGoodsName(goods.getName());
            item.setPrice(price);
            item.setNum(num);
            item.setSpec("默认");
            item.setCreateTime(LocalDateTime.now());
            orderItemMapper.insert(item);

            return Result.success("下单成功");
        }

        // 2. 购物车
        List<Integer> cartIds = (List<Integer>) params.get("cartIds");
        if (cartIds == null || cartIds.isEmpty()) {
            return Result.error("请选择商品");
        }

        List<Cart> cartList = cartMapper.selectBatchIds(cartIds);
        if (cartList.isEmpty()) {
            return Result.error("未找到商品");
        }

        BigDecimal totalPrice = BigDecimal.ZERO;
        for (Cart cart : cartList) {
            BigDecimal price = cart.getPrice() != null ? cart.getPrice() : BigDecimal.ZERO;
            totalPrice = totalPrice.add(price.multiply(new BigDecimal(cart.getNum())));
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setTotalPrice(totalPrice);
        order.setStatus("待支付");

        if (address != null) {
            order.setReceiverName(address.getReceiverName());
            order.setReceiverPhone(address.getReceiverPhone());
            order.setReceiverAddress(address.getReceiverAddress());
        } else {
            order.setReceiverName("匿名用户");
            order.setReceiverPhone("13800000000");
            order.setReceiverAddress("暂无地址");
        }

        order.setCreateTime(LocalDateTime.now());
        order.setOrderNo("OD" + System.currentTimeMillis());
        orderMapper.insert(order);

        for (Cart cart : cartList) {
            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setGoodsId(cart.getGoodsId());
            item.setGoodsName(cart.getName() != null ? cart.getName() : "商品");
            item.setPrice(cart.getPrice() != null ? cart.getPrice() : BigDecimal.ZERO);
            item.setNum(cart.getNum());
            item.setSpec(cart.getSpec());
            item.setCreateTime(LocalDateTime.now());
            orderItemMapper.insert(item);
        }

        cartMapper.deleteBatchIds(cartIds);
        return Result.success("下单成功");
    }

    // ================== 订单明细 ==================
    @GetMapping("/order/item/list")
    public Result getOrderItems(@RequestParam Integer orderId) {
        QueryWrapper<OrderItem> wrapper = new QueryWrapper<>();
        wrapper.eq("order_id", orderId);
        return Result.success(orderItemMapper.selectList(wrapper));
    }

    @GetMapping("/order/list")
    public Result orderList(@RequestParam Integer userId) {
        QueryWrapper<Order> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        return Result.success(orderMapper.selectList(wrapper));
    }

    // ================== 管理员订单列表（支持多商品 + 用户名 + 地址） ==================
    @GetMapping("/order/all")
    public Result orderAll() {
        List<Order> orderList = orderMapper.selectList(null);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Order order : orderList) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("orderNo", order.getOrderNo());
            map.put("userId", order.getUserId());
            map.put("status", order.getStatus());
            map.put("createTime", order.getCreateTime());
            map.put("totalPrice", order.getTotalPrice());

            map.put("receiverName", order.getReceiverName());
            map.put("receiverPhone", order.getReceiverPhone());
            map.put("receiverAddress", order.getReceiverAddress());

            User user = userMapper.selectById(order.getUserId());
            map.put("username", user != null ? user.getUsername() : "未知用户");

            QueryWrapper<OrderItem> wrapper = new QueryWrapper<>();
            wrapper.eq("order_id", order.getId());
            List<OrderItem> itemList = orderItemMapper.selectList(wrapper);

            StringBuilder goodsNameSb = new StringBuilder();
            if (!itemList.isEmpty()) {
                for (int i = 0; i < itemList.size(); i++) {
                    goodsNameSb.append(itemList.get(i).getGoodsName());
                    if (i != itemList.size() - 1) {
                        goodsNameSb.append("、");
                    }
                }
            } else {
                goodsNameSb.append("未知商品");
            }
            map.put("name", goodsNameSb.toString());

            result.add(map);
        }
        return Result.success(result);
    }

    @PostMapping("/order/pay")
    public Result orderPay(@RequestParam Integer id) {
        Order order = orderMapper.selectById(id);
        if (order == null) return Result.error("订单不存在");
        if (!"待支付".equals(order.getStatus())) return Result.error("只有待支付订单可以支付");
        order.setStatus("已支付");
        orderMapper.updateById(order);
        return Result.success("支付成功");
    }

    @PostMapping("/order/send")
    public Result orderSend(@RequestParam Integer id) {
        Order order = orderMapper.selectById(id);
        if (order == null) return Result.error("订单不存在");
        if (!"已支付".equals(order.getStatus())) return Result.error("只有已支付订单才能发货");
        order.setStatus("已发货");
        orderMapper.updateById(order);
        return Result.success("发货成功");
    }

    @PostMapping("/order/receive")
    public Result orderReceive(@RequestParam Integer id) {
        Order order = orderMapper.selectById(id);
        if (order == null) return Result.error("订单不存在");
        if (!"已发货".equals(order.getStatus())) return Result.error("只能确认收货已发货订单");
        order.setStatus("已完成");
        orderMapper.updateById(order);
        return Result.success("确认收货成功");
    }

    @PostMapping("/order/applyRefund")
    public Result applyRefund(@RequestParam Integer id) {
        Order order = orderMapper.selectById(id);
        if (order == null) return Result.error("订单不存在");
        if (!"已支付".equals(order.getStatus()) && !"已发货".equals(order.getStatus())) {
            return Result.error("只有已支付/已发货可申请退款");
        }
        order.setStatus("申请退款中");
        orderMapper.updateById(order);
        return Result.success("已申请退款，请等待管理员审核");
    }

    @PostMapping("/order/agreeRefund")
    public Result agreeRefund(@RequestParam Integer id) {
        Order order = orderMapper.selectById(id);
        if (order == null) return Result.error("订单不存在");
        if (!"申请退款中".equals(order.getStatus())) return Result.error("该订单未申请退款");
        order.setStatus("已退款");
        orderMapper.updateById(order);
        return Result.success("退款成功");
    }

    @DeleteMapping("/order/delete")
    public Result deleteOrder(@RequestParam Integer id) {
        orderMapper.deleteById(id);
        QueryWrapper<OrderItem> wrapper = new QueryWrapper<>();
        wrapper.eq("order_id", id);
        orderItemMapper.delete(wrapper);
        return Result.success("订单已删除");
    }

    // ================== 评价 ==================
    @GetMapping("/comment/list")
    public Result commentList(@RequestParam Integer goodsId) {
        QueryWrapper<Comment> wrapper = new QueryWrapper<>();
        wrapper.eq("goods_id", goodsId);
        return Result.success(commentMapper.selectList(wrapper));
    }

    @PostMapping("/comment/add")
    public Result addComment(@RequestBody Comment comment) {
        comment.setCreateTime(LocalDateTime.now());
        commentMapper.insert(comment);
        return Result.success("评价成功");
    }

    @DeleteMapping("/comment/delete")
    public Result deleteComment(@RequestParam Integer id) {
        commentMapper.deleteById(id);
        return Result.success("删除成功");
    }

    // 商品图片上传
    @PostMapping("/uploadImage")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String uploadPath = System.getProperty("user.dir") + "/goods-images/";
            File dir = new File(uploadPath);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : ".png";
            String filename = UUID.randomUUID() + ext;
            File dest = new File(uploadPath + filename);
            file.transferTo(dest);

            return Result.success("/goods-images/" + filename);
        } catch (Exception e) {
            return Result.error("图片上传失败");
        }
    }
}