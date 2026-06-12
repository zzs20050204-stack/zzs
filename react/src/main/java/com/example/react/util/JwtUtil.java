package com.example.react.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JwtUtil {
    // 秘钥随便改，别泄露
    private static final String SECRET_KEY = "mySecret123456";
    // 过期时间 1天
    private static final long EXPIRE_TIME = 24 * 60 * 60 * 1000;

    // 根据用户名生成token
    public static String createToken(String username){
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
                .signWith(SignatureAlgorithm.HS256,SECRET_KEY)
                .compact();
    }

    // 解析token获取用户名
    public static String getUsernameByToken(String token){
        Claims claims = Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    // 校验token是否有效
    public static boolean verifyToken(String token){
        try{
            Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }
}