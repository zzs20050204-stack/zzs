import { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input } from 'antd';
import http from '../../utils/http/http';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, setUsername, setUserId } from '../../store/login/authSlice';
import { removeToken } from '../../utils/auth';
import { setMenuKey } from '../../utils/menuSlice';
import './index.scss';

function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  removeToken();

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const res = await http.post("/login", values);

      if (res.data.code === 200) {
        const token = res.data.data.token;
        const user = res.data.data.user;

        dispatch(setToken(token));
        dispatch(setUsername(user.username));
        dispatch(setUserId(user.id));
        // login 登录成功内新增
      
        localStorage.setItem("token", token);
        localStorage.setItem("userId", String(user.id));

        navigate('/home', { replace: true });
      } else {
        alert("登录失败：" + res.data.msg);
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1>智慧社区管理系统</h1>
          <p>Smart Community Management System</p>
        </div>

        <Form form={form} className="login-form" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              size="large"
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input 
              size="large"
              prefix={<LockOutlined />} 
              type="password" 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Flex justify="space-between" align="center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a href="/">忘记密码</a>
            </Flex>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              size="large"
              block
            >
              登 录
            </Button>
          </Form.Item>

          <div className="login-footer">
            <a href="/register">立即注册账号</a>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
