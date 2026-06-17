package com.example.react.constant;

public enum VisitorStatus {
    PENDING(1, "待审核"),
    PASSED(2, "已通过"),
    REJECT(3, "已驳回");

    private Integer code;
    private String desc;

    VisitorStatus(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public Integer getCode() {
        return code;
    }
}