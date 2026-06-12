package com.example.react.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.react.entity.Household;
import com.example.react.mapper.HouseholdMapper;
import com.example.react.service.HouseholdService;
import org.springframework.stereotype.Service;

@Service
public class HouseholdServiceImpl extends ServiceImpl<HouseholdMapper, Household> implements HouseholdService {
}