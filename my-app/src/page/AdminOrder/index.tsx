import { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Input, Space, Card, Popconfirm } from 'antd';
import { TruckOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import http from '../../utils/http/http';

const { Title } = Typography;
const { Search } = Input;

interface OrderItem {
  id: number;
  orderNo: string;
  name?: string;
  totalPrice: number;
  status: string;
  createTime: string;
  username?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
}

const AdminOrder = () => {
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  const [originList, setOriginList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { token } = useSelector((state: any) => state.auth);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const getCurrentUser = async () => {
    try {
      const res = await http.get('/getInfo');
      if (res.data.code === 200) {
        setIsAdmin(res.data.data.role === '管理员');
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadAllOrder = async () => {
    setLoading(true);
    try {
      const res = await http.get('/goods/order/all');
      const data = res.data.data || [];
      data.sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
      setOriginList(data);
      setOrderList(data);
    } catch {
      message.error('订单加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: number) => {
    await http.post('/goods/order/send', null, { params: { id } });
    message.success('发货成功');
    loadAllOrder();
  };

  const handleAgreeRefund = async (id: number) => {
    try {
      await http.post('/goods/order/agreeRefund', null, { params: { id } });
      message.success('已同意退款');
      loadAllOrder();
    } catch (err) {
      message.error('退款失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await http.delete('/goods/order/delete', { params: { id } });
      message.success('删除订单成功');
      loadAllOrder();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSearch = (value: string) => {
    if (!value.trim()) {
      setOrderList(originList);
      return;
    }
    const filterList = originList.filter((item: any) =>
      item.orderNo.includes(value) ||
      (item.name && item.name.includes(value)) ||
      (item.username && item.username.includes(value))
    );
    setOrderList(filterList);
  };

  useEffect(() => {
    getCurrentUser();
    loadAllOrder();
  }, [token]);

  const columns = [
    { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 220 },
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '订单金额', dataIndex: 'totalPrice', key: 'totalPrice', width: 120, render: (p: number) => `¥${p}` },
    { title: '下单用户', dataIndex: 'username', key: 'username', width: 140 },
    { title: '订单状态', dataIndex: 'status', key: 'status', width: 140 },
    { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 200 },

    // ========== ✅ 新增：收货地址列 ==========
    {
          title: '收货地址',
          key: 'receiverAddress',
          width: 280,
          render: (_: any, record: OrderItem) => (
            <span>{record.receiverAddress || '暂无地址'}</span>
          )
        },

    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: OrderItem) => {
        return (
          <Space size="small">
            {record.status === '已支付' && (
              <Button type="primary" size="small" icon={<TruckOutlined />} onClick={() => handleSend(record.id)}>发货</Button>
            )}
            {record.status === '申请退款中' && (
              <Popconfirm title="确认同意退款吗？" onConfirm={() => handleAgreeRefund(record.id)}>
                <Button danger size="small">同意退款</Button>
              </Popconfirm>
            )}
            {isAdmin && (
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f0f2f5', paddingBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>订单管理</Title>
        <Search placeholder="订单号 / 商品 / 用户" allowClear enterButton={<SearchOutlined />} style={{ width: 360 }} onSearch={handleSearch} />
      </div>
      <Card variant="borderless" style={{ borderRadius: 12 }} styles={{ body: { padding: '20px 24px' } }}>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={orderList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 'max-content' }} />
      </Card>
    </div>
  );
};



export default AdminOrder;
