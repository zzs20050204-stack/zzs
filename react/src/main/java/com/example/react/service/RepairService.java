package com.example.react.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.react.entity.Repair;
import com.example.react.mapper.RepairMapper;
import org.springframework.stereotype.Service;

@Service
public class RepairService extends ServiceImpl<RepairMapper, Repair> {
}