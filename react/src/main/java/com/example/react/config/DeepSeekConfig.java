package com.example.react.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DeepSeekConfig {

    @Value("${deepseek.api.key}")
    private String key;

    @Value("${deepseek.api.url}")
    private String url;

    @Value("${deepseek.api.model}")
    private String model;

    public DeepSeekConfig(){
        System.out.println("===DeepSeekConfig构造完成===");
    }

    public String getKey() {
        return key;
    }

    public String getUrl() {
        return url;
    }

    public String getModel() {
        return model;
    }
}