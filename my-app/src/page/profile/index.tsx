import React, { useState } from 'react';
import { Avatar, Modal, Descriptions, Button, Form, Input, Upload, message } from 'antd';
import { UserOutlined, CameraOutlined, EditOutlined } from '@ant-design/icons';
import http from '../../utils/http/http';
import { BASE_URL } from '../../utils/constants';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
}

const ProfileModal = ({ visible, onClose, user }: ProfileModalProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [form] = Form.useForm();

  if (!user) return null;

  const avatarUrl = user.avatar
    ? `${BASE_URL}${user.avatar}?time=${new Date().getTime()}`
    : '';

  const openEdit = () => {
    form.setFieldsValue({
      username: user.username,
      phone: user.phone || '',
      email: user.email || '',
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    setEditLoading(true);
    try {
      const values = await form.validateFields();
      await http.post('/updateUser', values);
      message.success('资料更新成功');
      setEditOpen(false);
      onClose();
    } catch {
      message.error('更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    setUploadLoading(true);
    try {
      await http.post('/uploadAvatar', fd);
      message.success('头像更新成功');
      onClose();
    } catch {
      message.error('上传失败');
    } finally {
      setUploadLoading(false);
    }
    return false;
  };

  return (
    <>
      <Modal
        title="个人中心"
        open={visible}
        onCancel={onClose}
        width={520}
        centered
        footer={[
          <Button key="close" onClick={onClose}>关闭</Button>,
          <Button key="edit" icon={<EditOutlined />} onClick={openEdit}>编辑资料</Button>,
          <Upload key="upload" showUploadList={false} beforeUpload={uploadAvatar}>
            <Button type="primary" icon={<CameraOutlined />} loading={uploadLoading}>
              {uploadLoading ? '上传中...' : '更换头像'}
            </Button>
          </Upload>,
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Avatar
            size={100}
            src={avatarUrl}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#fff', color: '#55c4ae', border: '4px solid #55c4ae' }}
          />
          <h3>{user.username}</h3>
          <p style={{ color: '#666' }}>{user.email || '暂无邮箱'}</p>
        </div>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="手机号">{user.phone || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role || '管理员'}</Descriptions.Item>
          <Descriptions.Item label="状态"><span style={{ color: '#52c41a' }}>正常</span></Descriptions.Item>
          <Descriptions.Item label="创建时间">{user.createTime?.replace('T', ' ') || '未知'}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal
        title="编辑资料"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={submitEdit}
        okText="保存" cancelText="取消"
        confirmLoading={editLoading}
        centered
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户名" name="username"><Input disabled /></Form.Item>
          <Form.Item label="手机号" name="phone"><Input placeholder="请输入手机号" /></Form.Item>
          <Form.Item label="邮箱" name="email"><Input placeholder="请输入邮箱" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProfileModal;
