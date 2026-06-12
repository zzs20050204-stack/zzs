import { useState, useEffect } from 'react';
import {
  Table, Button, Card, message, Tag, Typography, Tooltip, Popconfirm
} from 'antd';
import { useSelector } from 'react-redux';
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
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentName, setCurrentName] = useState('');

  const { token } = useSelector((state: any) => state.auth);

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
      setList(data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 原有处理状态功能
  const handle = async (id: number) => {
    try {
      await http.post('/property/suggestion/handle', { id });
      message.success('已处理');
      loadList();
    } catch {
      message.error('处理失败');
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

  // 表格列 对标报修页面样式，保留原有所有操作
  const columns = [
    {
      title: '建议内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (text) => (
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
              <Button size="small" type="primary" style={{ marginLeft: 8 }} onClick={() => handle(record.id)}>
                设为已处理
              </Button>
            )}
          </>
        );
      },
    },
    { title: '提交时间', dataIndex: 'createTime', align: 'center' },
    {
      title: '操作',
      align: 'center',
      render: (_: unknown, record: Suggestion) => {
        const canDelete = isAdmin || record.userName === currentName;
        return canDelete ? (
          <Popconfirm title="确定删除这条反馈？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        ) : null;
      },
    },
  ];

  // 页面布局完全和报修页面一致
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
        <Title level={4} style={{ margin: 0 }}>建议反馈管理</Title>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}