import { useState, useEffect } from 'react';
import {
  Table, Button, Card, Popconfirm, message,
  Space, Tag, Typography, Empty, Input, Select
} from 'antd';
import {
  DeleteOutlined, UserOutlined, ReloadOutlined, SearchOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import http from '../../utils/http/http';

const { Title } = Typography;

interface User {
  id: number;
  username: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
}

function UserManage() {
  const [list, setList] = useState<User[]>([]);
  const [originList, setOriginList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchRole, setSearchRole] = useState('');

  // 获取用户列表
  const getList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/user/list');
      if (res.data.code === 200) {
        const data = res.data.data || [];
        setOriginList(data);
        setList(data);
      }
    } catch (e) {
      message.error('用户列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...originList];
    if (searchName) {
      filtered = filtered.filter(item => item.username.includes(searchName) || item.phone.includes(searchName));
    }
    if (searchRole) {
      filtered = filtered.filter(item => item.role === searchRole);
    }
    setList(filtered);
  };

  const handleReset = () => {
    setSearchName('');
    setSearchRole('');
    setList(originList);
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await http.delete('/user/delete', { params: { id } });
      message.success('删除成功');
      getList();
    } catch {
      message.error('删除失败');
    }
  };

  // 表格列 —— 完全修复TS类型
  const columns: ColumnType<User>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      width: 90,
      align: 'center',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 140,
      render: (name: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 110,
      align: 'center',
      render: (r: string) => (
        <Tag color={r === '管理员' ? 'blue' : 'green'}>{r}</Tag>
      ),
    },
    {
      title: '账号状态',
      dataIndex: 'status',
      width: 110,
      align: 'center',
      render: (s: string) => (
        <Tag color={s === '正常' ? 'green' : 'red'}>{s}</Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      align: 'center',
      render: (r: User) => (
        <Space>
          <Popconfirm
            title="提示"
            description="确定要删除该用户吗？此操作不可恢复！"
            onConfirm={() => handleDelete(r.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    getList();
  }, []);

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* 顶部标题卡片 */}
      <Card
        variant="borderless"
        style={{ marginBottom: 20, borderRadius: 12 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              用户管理
            </Title>
            <p style={{ margin: '4px 0 0', color: '#999', fontSize: 12 }}>
              管理平台所有用户信息、角色与状态
            </p>
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={getList}
            loading={loading}
          >
            刷新列表
          </Button>
        </div>
        <Space style={{ marginTop: 12 }}>
          <Input
            placeholder="搜索用户名/手机号"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="角色"
            value={searchRole || undefined}
            onChange={val => setSearchRole(val || '')}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="管理员">管理员</Select.Option>
            <Select.Option value="普通用户">普通用户</Select.Option>
          </Select>
          <Button onClick={handleSearch} type="primary">搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 表格内容卡片 */}
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
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 名用户`,
          }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="暂无用户数据" /> }}
        />
      </Card>
    </div>
  );
}


export default UserManage;
