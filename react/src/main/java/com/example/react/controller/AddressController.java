package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.Address;
import com.example.react.mapper.AddressMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/address")
public class AddressController {

    @Autowired
    private AddressMapper addressMapper;

    // 查询我的地址列表
    @GetMapping("/list")
    public Result list(@RequestParam Integer userId) {
        QueryWrapper<Address> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.orderByDesc("is_default");
        List<Address> list = addressMapper.selectList(wrapper);
        return Result.success(list);
    }

    // 新增地址
    @PostMapping("/add")
    public Result add(@RequestBody Address address) {
        // 如果设为默认，先把其他默认取消
        if (address.getIsDefault() == 1) {
            QueryWrapper<Address> wrapper = new QueryWrapper<>();
            wrapper.eq("user_id", address.getUserId());
            wrapper.eq("is_default", 1);
            List<Address> list = addressMapper.selectList(wrapper);
            for (Address a : list) {
                a.setIsDefault(0);
                addressMapper.updateById(a);
            }
        }
        addressMapper.insert(address);
        return Result.success("添加成功");
    }

    // 编辑地址
    @PutMapping("/update")
    public Result update(@RequestBody Address address) {
        if (address.getIsDefault() == 1) {
            QueryWrapper<Address> wrapper = new QueryWrapper<>();
            wrapper.eq("user_id", address.getUserId());
            wrapper.eq("is_default", 1);
            List<Address> list = addressMapper.selectList(wrapper);
            for (Address a : list) {
                a.setIsDefault(0);
                addressMapper.updateById(a);
            }
        }
        addressMapper.updateById(address);
        return Result.success("修改成功");
    }

    // 删除地址
    @DeleteMapping("/delete")
    public Result delete(@RequestParam Integer id) {
        addressMapper.deleteById(id);
        return Result.success("删除成功");
    }
}