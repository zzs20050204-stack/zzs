package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.react.common.Result;
import com.example.react.entity.Repair;
import com.example.react.service.RepairService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/repair")
public class RepairController {

    @Resource
    private RepairService repairService;

    // 列表
    @GetMapping("/list")
    public Result list() {
        LambdaQueryWrapper<Repair> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Repair::getCreateTime);
        return Result.success(repairService.list(wrapper));
    }

    // 用户提交报修
    @PostMapping("/add")
    public Result add(@RequestBody Repair repair) {
        repair.setStatus("待处理");
        repair.setCreateTime(LocalDateTime.now());
        repairService.save(repair);
        return Result.success(null);
    }

    // 管理员修改状态
    @PostMapping("/update")
    public Result update(@RequestBody Repair repair) {
        repairService.updateById(repair);
        return Result.success(null);
    }

    // 删除
    @DeleteMapping("/delete")
    public Result delete(@RequestParam Integer id) {
        repairService.removeById(id);
        return Result.success(null);
    }
}