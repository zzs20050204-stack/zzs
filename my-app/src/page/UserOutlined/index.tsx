import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Space, Modal, Form, message,
  Popconfirm, Switch, Card, Typography
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined
} from '@ant-design/icons';
import http from '../../utils/http/http';

const { Title } = Typography;
const { Search } = Input;

interface HouseholdItem {
  id: number;
  username: string;
  password?: string;
  phone: string;
  email: string;
  status: number;
  createTime?: string;
}

function UserOutlined() {
  const [form] = Form.useForm();
  const [userList, setUserList] = useState<HouseholdItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [username, setUsername] = useState('');

  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('新增住户');
  const [userId, setUserId] = useState<number | null>(null);

  const getUserList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/household/list', {
        params: { current, pageSize, username }
      });
      if (res.data.code === 200) {
        setUserList(res.data.data.records || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserList();
  }, [current, pageSize, username]);

  const handleSearch = (value: string) => {
    setUsername(value);
    setCurrent(1);
  };

  const openModal = (record: HouseholdItem | null = null) => {
    if (record) {
      setTitle('编辑住户');
      setUserId(record.id);
      form.setFieldsValue(record);
    } else {
      setTitle('新增住户');
      setUserId(null);
      form.resetFields();
    }
    setVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!values.password) delete values.password;

      if (userId) {
        await http.put('/household/update', { id: userId, ...values });
        message.success('修改成功');
      } else {
        await http.post('/household/add', values);
        message.success('新增成功');
      }
      setVisible(false);
      getUserList();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await http.delete('/household/delete', { params: { id } });
      message.success('删除成功');
      getUserList();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleStatus = async (id: number, val: boolean) => {
    const status = val ? 1 : 0;
    try {
      await http.put('/household/updateStatus', null, { params: { id, status } });
      message.success('状态更新成功');
      getUserList();
    } catch (err) {
      message.error('状态更新失败');
    }
  };

  // ✅ 关键修复：给 columns 加 any 类型，彻底消除报错
  const columns: any = [
    {
      title: '序号',
      width: 80,
      align: 'center',
      render: (_: any, __: HouseholdItem, index: number) => (current - 1) * pageSize + index + 1
    },
    { title: '住户姓名', dataIndex: 'username', align: 'center' },
    { title: '手机号', dataIndex: 'phone', align: 'center' },
    { title: '邮箱', dataIndex: 'email', align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (s: number, r: HouseholdItem) => (
        <Switch checked={s === 1} onChange={(v) => handleStatus(r.id, v)} />
      )
    },
    {
      title: '操作',
      align: 'center',
      render: (_: any, r: HouseholdItem) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(r)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(r.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1px solid #f0f2f5',
        paddingBottom: 12
      }}>
        <Title level={4} style={{ margin: 0 }}>住户管理</Title>
        <Search
          placeholder="搜索住户姓名"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 360 }}
          onSearch={handleSearch}
        />
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => openModal()}
          >
            新增住户
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={userList}
          pagination={{
            current,
            pageSize,
            total,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        open={visible}
        title={title}
        onCancel={() => setVisible(false)}
        onOk={handleSave}
        maskClosable={false}
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
          <Form.Item name="username" label="住户姓名" rules={[{ required: true, message: '请输入住户姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={userId ? [] : [{ required: true }]}>
            <Input.Password placeholder={userId ? "不修改请留空" : "请输入密码"} />
          </Form.Item>
          <Form.Item name="phone" label="手机"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserOutlined;
