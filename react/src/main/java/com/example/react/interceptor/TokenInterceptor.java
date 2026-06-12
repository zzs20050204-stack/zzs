package com.example.react.interceptor;

import com.example.react.util.JwtUtil;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class TokenInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 从请求头拿token
        String token = request.getHeader("token");

        // 无token 或 token无效
        if(token == null || !JwtUtil.verifyToken(token)){
            // 401 未授权
            response.setStatus(401);
            return false;
        }
        return true;
    }
}