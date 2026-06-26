import { useState, useEffect } from 'react';
import { Card, Table, Button, message, Space, Select, Typography, Empty, Popconfirm } from 'antd';
import { PayCircleOutlined } from '@ant-design/icons';
import http from '../../utils/http/http';

const { Title, Text } = Typography;

interface BillItem {
  id: number;
  userId: string;
  payType: string;
  money: string;
  status: string;
  deadline: string;
  remark: string;
}

export default function Property() {
  const [list, setList] = useState<BillItem[]>([]);
  const [originList, setOriginList] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPayType, setSearchPayType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const username = sessionStorage.getItem('username');
      if (!username) {
        message.error('未获取到用户信息');
        setLoading(false);
        return;
      }
      const res = await http.get(`/property/bill/list/user?userId=${username}`);
      if (res.data.code === 200) {
        const data = res.data.data || [];
        setOriginList(data);
        setList(data);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...originList];
    if (searchPayType) {
      filtered = filtered.filter(item => item.payType === searchPayType);
    }
    if (searchStatus) {
      filtered = filtered.filter(item => item.status === searchStatus);
    }
    setList(filtered);
  };

  const handleReset = () => {
    setSearchPayType('');
    setSearchStatus('');
    setList(originList);
  };

  const pay = async (id: number) => {
    setPayingId(id);
    try {
      await http.post('/property/bill/pay', { id });
      message.success('缴费成功');
      loadList();
    } catch {
      message.error('缴费失败');
    } finally {
      setPayingId(null);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const columns = [
    { title: '费用类型', dataIndex: 'payType', width: 100 },
    { title: '金额', dataIndex: 'money', width: 100, render: (v: string) => `¥${v}` },
    { title: '状态', dataIndex: 'status', width: 100 },
    { title: '截止时间', dataIndex: 'deadline', width: 140, render: (v: string) => v?.replace('T', ' ') },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, r: BillItem) =>
        r.status === '待缴费' ? (
          <Popconfirm title="确认缴费？" okText="确定" cancelText="取消" onConfirm={() => pay(r.id)}>
            <Button type="primary" size="small" loading={payingId === r.id}>
              立即缴费
            </Button>
          </Popconfirm>
        ) : (
          <Text type="success">已完成</Text>
        ),
    },
  ];

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1px solid #f0f2f5',
        paddingBottom: 12,
        flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>物业缴费</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>查看和缴纳物业管理相关费用</Text>
        </div>
        <Space size="small" wrap>
          <Select
            placeholder="费用类型"
            value={searchPayType || undefined}
            onChange={val => setSearchPayType(val || '')}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="物业费">物业费</Select.Option>
            <Select.Option value="水费">水费</Select.Option>
            <Select.Option value="电费">电费</Select.Option>
            <Select.Option value="停车费">停车费</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            value={searchStatus || undefined}
            onChange={val => setSearchStatus(val || '')}
            style={{ width: 110 }}
            allowClear
          >
            <Select.Option value="待缴费">待缴费</Select.Option>
            <Select.Option value="已缴费">已缴费</Select.Option>
          </Select>
          <Button onClick={handleSearch} type="primary">搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Card variant="borderless" style={{ borderRadius: 12 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="暂无缴费记录">
              <PayCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            </Empty>
          }}
        />
      </Card>
    </div>
  );
}
