import React from 'react';
import { LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onRegister = async () => {
    try {
      const values = await form.validateFields();

      const res = await axios.post('http://localhost:8080/register', values);

      if (res.data.code === 200) {
        message.success('注册成功！');
        navigate('/');
      } else {
        message.error(res.data.msg);
      }
    } catch (err) {
      console.error(err);
      message.error('注册失败');
    }
  };

  return (
    <div style={{ width: 450, margin: '80px auto', padding: 30, boxShadow: '0 0 10px #eee' }}>
      <h2 style={{ textAlign: 'center' }}>注册</h2>
      <Form form={form} layout="vertical">
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
          <Input prefix={<UserOutlined />} />
        </Form.Item>
        <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
          <Input prefix={<PhoneOutlined />} />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}>
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item
          name="confirmPwd"
          label="确认密码"
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, v) {
                if (v === getFieldValue('password')) return Promise.resolve();
                return Promise.reject('两次密码不一致');
              },
            }),
          ]}
          
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Button type="primary" block onClick={onRegister}>注册</Button>
      </Form>
    </div>
  );
};

export default Register;