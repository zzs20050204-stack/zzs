package com.example.react.util;

import java.util.Random;

public class CodeUtil {
    public static String generateVisitorCode() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}