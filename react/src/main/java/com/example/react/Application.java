package com.example.react;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.react.mapper") // 新增这行，扫描Mapper接口
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}