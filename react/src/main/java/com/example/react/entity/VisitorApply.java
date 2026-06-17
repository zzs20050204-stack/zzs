package com.example.react.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("visitor_apply")
public class VisitorApply {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long residentId;
    private String visitorName;
    private String visitorPhone;
    private String visitReason;
    private String startTime;
    private String endTime;
    private Integer applyStatus;
    private Long auditAdminId;
    private String auditTime;
    private String rejectReason;
    private String visitorCode;
    private String createTime;
    private String updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }
    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    public String getVisitorPhone() { return visitorPhone; }
    public void setVisitorPhone(String visitorPhone) { this.visitorPhone = visitorPhone; }
    public String getVisitReason() { return visitReason; }
    public void setVisitReason(String visitReason) { this.visitReason = visitReason; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Integer getApplyStatus() { return applyStatus; }
    public void setApplyStatus(Integer applyStatus) { this.applyStatus = applyStatus; }
    public Long getAuditAdminId() { return auditAdminId; }
    public void setAuditAdminId(Long auditAdminId) { this.auditAdminId = auditAdminId; }
    public String getAuditTime() { return auditTime; }
    public void setAuditTime(String auditTime) { this.auditTime = auditTime; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
    public String getVisitorCode() { return visitorCode; }
    public void setVisitorCode(String visitorCode) { this.visitorCode = visitorCode; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }
}