package com.example.react.entity;

public class LoginRequest {
    private String username;  // 必须是这个
    private String password;  // 必须是这个

    // getter 和 setter
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
}