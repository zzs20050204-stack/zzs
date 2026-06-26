import { useState, useEffect } from 'react';
import {
  Table, Button, Card, message, Tag, Typography, Tooltip, Popconfirm, Input, Select, Space, Empty
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import http from '../../utils/http/http';

const { Title } = Typography;

interface Suggestion {
  id: number;
  userName: string;
  content: string;
  status: string;
  createTime: string;
}

export default function AdminSuggestion() {
  const [list, setList] = useState<Suggestion[]>([]);
  const [originList, setOriginList] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const { token } = useSelector((state: RootState) => state.auth);

  // 获取当前用户信息
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

  // 加载反馈列表
  const loadList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/property/suggestion/list');
      let data = res.data.data || [];
      // 普通用户仅查看自己的反馈
      if (!isAdmin) {
        data = data.filter((item: Suggestion) => item.userName === currentName);
      }
      setOriginList(data);
      setList(data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...originList];
    if (searchContent) {
      filtered = filtered.filter(item => item.content.includes(searchContent) || item.userName.includes(searchContent));
    }
    if (searchStatus) {
      filtered = filtered.filter(item => item.status === searchStatus);
    }
    setList(filtered);
  };

  const handleReset = () => {
    setSearchContent('');
    setSearchStatus('');
    setList(originList);
  };

  const [handleLoadingId, setHandleLoadingId] = useState<number | null>(null);

  // 原有处理状态功能
  const handle = async (id: number) => {
    setHandleLoadingId(id);
    try {
      await http.post('/property/suggestion/handle', { id });
      message.success('已处理');
      loadList();
    } catch {
      message.error('处理失败');
    } finally {
      setHandleLoadingId(null);
    }
  };

  // 原有删除功能
  const handleDelete = async (id: number) => {
    try {
      await http.delete('/property/suggestion/delete', { params: { id } });
      message.success('删除成功');
      loadList();
    } catch {
      message.error('删除失败');
    }
  };

  useEffect(() => {
    loadList();
  }, [currentName, isAdmin]);

  // 显式标注列类型 ColumnType<Suggestion>[] 解决align类型报错
  const columns: ColumnType<Suggestion>[] = [
    {
      title: '建议内容',
      dataIndex: 'content',
      ellipsis: true,
      // 显式标注text类型为string，消除隐式any
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    { title: '用户', dataIndex: 'userName', align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (status: string, record: Suggestion) => {
        const color = status === '待处理' ? 'red' : 'green';
        return (
          <>
            <Tag color={color}>{status}</Tag>
            {status === '待处理' && isAdmin && (
              <Button size="small" type="primary" style={{ marginLeft: 8 }} loading={handleLoadingId === record.id} onClick={() => handle(record.id)}>
                设为已处理
              </Button>
            )}
          </>
        );
      },
    },
    { title: '提交时间', dataIndex: 'createTime', align: 'center', render: (v: string) => v?.replace('T', ' ') },
    {
      title: '操作',
      align: 'center',
      render: (_: unknown, record: Suggestion) => {
        const canDelete = isAdmin || record.userName === currentName;
        return canDelete ? (
          <Popconfirm title="确定删除这条反馈？" okText="确定" cancelText="取消" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        ) : null;
      },
    },
  ];

  // 页面布局完全和报修页面一致
  return (
    <div style={{ padding: '24px 16px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1px solid #f0f2f5',
        paddingBottom: 12,
        flexWrap: 'wrap', gap: 12
      }}>
        <Title level={4} style={{ margin: 0 }}>建议反馈管理</Title>
        <Space size="small" wrap>
          <Input
            placeholder="搜索内容/用户"
            value={searchContent}
            onChange={e => setSearchContent(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="状态"
            value={searchStatus || undefined}
            onChange={val => setSearchStatus(val || '')}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="待处理">待处理</Select.Option>
            <Select.Option value="已处理">已处理</Select.Option>
          </Select>
          <Button onClick={handleSearch} type="primary">搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

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
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无建议反馈" /> }}
        />
      </Card>
    </div>
  );
}
