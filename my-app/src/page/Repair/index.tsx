import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, message,
  Popconfirm, Card, Space, Tag, Typography, Tooltip
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import http from '../../utils/http/http';

const { TextArea } = Input;
const { Title } = Typography;

interface Repair {
  id: number;
  content: string;
  username: string;
  phone: string;
  address: string;
  status: string;
  createTime: string;
}

function RepairPage() {
  const [form] = Form.useForm();
  const [list, setList] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentName, setCurrentName] = useState('');

  const { token } = useSelector((state: any) => state.auth);

  useEffect(() => {
    const getInfo = async () => {
      try {
        const res = await http.get('/getInfo');
        if (res.data.code === 200) {
          setCurrentName(res.data.data.username);
          setIsAdmin(res.data.data.role === '管理员');
        }
      } catch {}
    };
    getInfo();
  }, [token]);

  const getList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/repair/list');
      let data = res.data.data || [];
      if (!isAdmin) {
        data = data.filter((item: Repair) => item.username === currentName);
      }
      setList(data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, [currentName, isAdmin]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await http.post('/repair/add', values);
      message.success('提交成功');
      setVisible(false);
      form.resetFields();
      getList();
    } catch {
      message.error('提交失败');
    }
  };

  const handleStatus = async (id: number, status: string) => {
    await http.post('/repair/update', { id, status });
    message.success('状态修改成功');
    getList();
  };

  const handleDelete = async (id: number) => {
    await http.delete('/repair/delete', { params: { id } });
    message.success('删除成功');
    getList();
  };

  // 🔥 关键修复：给 columns 加类型，彻底解决 TS 报错
  const columns: any = [
    {
      title: '报修内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: '报修人',
      dataIndex: 'username',
      align: 'center',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      align: 'center',
    },
    {
      title: '住址',
      dataIndex: 'address',
      align: 'center',
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      align: 'center',
      render: (status: string, record: Repair) => {
        const color = status === '已处理' ? 'green' : 'gold';
        if (isAdmin) {
          return (
            <Space size="small">
              <Tag color={color}>{status}</Tag>
              {status === '待处理' ? (
                <Button size="small" type="primary" onClick={() => handleStatus(record.id, '已处理')}>
                  设为已处理
                </Button>
              ) : (
                <Button size="small" onClick={() => handleStatus(record.id, '待处理')}>
                  改回待处理
                </Button>
              )}
            </Space>
          );
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '报修时间',
      dataIndex: 'createTime',
      align: 'center',
    },
    {
      title: '操作',
      align: 'center',
      render: (_: any, record: Repair) => {
        const canDelete = isAdmin || record.username === currentName;
        return canDelete ? (
          <Popconfirm title="确定删除这条报修？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        ) : null;
      },
    },
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
        <Title level={4} style={{ margin: 0 }}>报修管理</Title>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            form.setFieldsValue({ username: currentName });
            setVisible(true);
          }}
        >
          我要报修
        </Button>
      </div>

      {/* 已修复 antd 废弃警告 */}
      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={visible}
        title="提交报修"
        width={500}
        onCancel={() => setVisible(false)}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="姓名">
            <Input disabled value={currentName} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="居住地址" rules={[{ required: true }]}>
            <Input placeholder="请输入详细住址" />
          </Form.Item>
          <Form.Item name="content" label="报修问题" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="请描述问题" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RepairPage;
