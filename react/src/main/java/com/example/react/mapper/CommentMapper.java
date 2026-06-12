package com.example.react.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.react.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}