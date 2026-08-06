package com.example.react.config;

import com.example.react.interceptor.TokenInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new TokenInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/login",
                        "/register",
                        "/getInfo",
                        "/updateUser",
                        "/uploadAvatar",
                        "/goods/uploadImage",
                        "/dashboard/**",
                        "/api/ai/**",
                        "/avatar/**",
                        "/goods-images/**"
                );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/avatar/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/avatar/");
        registry.addResourceHandler("/goods-images/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/goods-images/");
    }
}