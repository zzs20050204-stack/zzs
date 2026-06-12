package com.example.react.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.react.entity.Notice;
import com.example.react.mapper.NoticeMapper;
import com.example.react.service.NoticeService;
import org.springframework.stereotype.Service;

@Service
public class NoticeServiceImpl extends ServiceImpl<NoticeMapper, Notice> implements NoticeService {
}