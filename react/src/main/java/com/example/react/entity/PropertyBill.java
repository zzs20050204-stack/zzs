package com.example.react.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("property_bill")
public class PropertyBill {

    @TableId(type = IdType.AUTO)
    private Integer id;

    @TableField("user_id")
    private String userId;  // 这里是 String，存用户名 1234

    @TableField("pay_type")
    private String payType;

    private BigDecimal money;
    private String status;
    private LocalDateTime deadline;
    private LocalDateTime createTime;
    private LocalDateTime payTime;
    private String remark;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPayType() { return payType; }
    public void setPayType(String payType) { this.payType = payType; }

    public BigDecimal getMoney() { return money; }
    public void setMoney(BigDecimal money) { this.money = money; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public LocalDateTime getPayTime() { return payTime; }
    public void setPayTime(LocalDateTime payTime) { this.payTime = payTime; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}