import { LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import http from '../../utils/http/http';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './index.scss';

function Register() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const res = await http.post('/register', values);
      if (res.data.code === 200) {
        message.success('注册成功！');
        navigate('/login');
      } else {
        message.error(res.data.msg || '注册失败');
      }
    } catch {
      message.error('注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-header">
          <h1>智慧社区管理系统</h1>
          <p>Smart Community Management System</p>
        </div>

        <Form form={form} className="register-form" onFinish={onRegister}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input size="large" prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="confirmPwd"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (v === getFieldValue('password')) return Promise.resolve();
                  return Promise.reject('两次密码不一致');
                },
              }),
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              {loading ? '注册中...' : '注 册'}
            </Button>
          </Form.Item>

          <div className="register-footer">
            <Link to="/login">已有账号？立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Register;
