package com.example.react.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.react.entity.Household;
import com.example.react.common.Result;
import com.example.react.service.HouseholdService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/household")
@CrossOrigin(origins = "*") // ✅ 我已经帮你加上了！解决跨域！
public class HouseholdController {

    private final HouseholdService householdService;

    public HouseholdController(HouseholdService householdService) {
        this.householdService = householdService;
    }

    // 分页列表
    @GetMapping("/list")
    public Result<Page<Household>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String username
    ) {
        LambdaQueryWrapper<Household> wrapper = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            wrapper.like(Household::getUsername, username);
        }
        Page<Household> page = householdService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(page);
    }

    // 新增
    @PostMapping("/add")
    public Result<?> add(@RequestBody Household household) {
        householdService.save(household);
        return Result.success(null);
    }

    // 修改
    @PutMapping("/update")
    public Result<?> update(@RequestBody Household household) {
        householdService.updateById(household);
        return Result.success(null);
    }

    // 删除
    @DeleteMapping("/delete")
    public Result<?> delete(@RequestParam Integer id) {
        householdService.removeById(id);
        return Result.success(null);
    }

    // 修改状态
    @PutMapping("/updateStatus")
    public Result<?> updateStatus(@RequestParam Integer id, @RequestParam Integer status) {
        Household household = new Household();
        household.setId(id);
        household.setStatus(status);
        householdService.updateById(household);
        return Result.success(null);
    }
}