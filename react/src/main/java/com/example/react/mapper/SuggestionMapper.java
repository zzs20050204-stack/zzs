package com.example.react.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.react.entity.Suggestion;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SuggestionMapper extends BaseMapper<Suggestion> {
}