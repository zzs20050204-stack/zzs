import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, message, Typography, Row, Col, Empty, Space, Modal,
  Avatar, Tag, Spin, Form, Input, Checkbox, Upload, List, Radio
} from 'antd';
import {
  ShoppingCartOutlined, OrderedListOutlined, NotificationOutlined,
  UserOutlined, EditOutlined, WarningOutlined,
  PayCircleOutlined, MessageOutlined, PlusOutlined, DeleteOutlined
} from '@ant-design/icons';
import http from '../../utils/http/http';

const { Title, Text } = Typography;

interface UserInfo {
  id: number;
  username: string;
  role: string;
  phone?: string;
  email?: string;
  avatar?: string;
  createTime?: string;
}

interface CartItem {
  id: number;
  userId: number;
  goodsId: number;
  num: number;
  createTime: string;
  name?: string;
  price?: number;
  spec?: string;
}

interface OrderItem {
  id: number;
  orderNo: string;
  userId: number;
  totalPrice: number;
  status: string;
  createTime: string;
  details?: OrderDetailItem[];
}

interface OrderDetailItem {
  id: number;
  goodsId: number;
  goodsName: string;
  goodsPrice: number;
  num: number;
  spec: string;
}

interface GoodsItem {
  id: number;
  name: string;
  price: number;
}

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  userId: number;
  createTime?: string;
}

interface RepairItem {
  id: number;
  content: string;
  username: string;
  phone: string;
  address: string;
  status: string;
  createTime: string;
}

interface BillItem {
  id: number;
  payType: string;
  money: string;
  status: string;
  deadline: string;
  remark: string;
}

interface SuggestionItem {
  id: number;
  userName: string;
  content: string;
  status: string;
  createTime: string;
}

interface AddressItem {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  isDefault: number;
}

const orderStatusMap: Record<string, { color: string }> = {
  '待支付': { color: 'orange' },
  '已支付': { color: 'blue' },
  '已发货': { color: 'cyan' },
  '已完成': { color: 'green' },
  '已退款': { color: 'red' },
  '申请退款中': { color: 'gold' },
};

const MyPage = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [allGoods, setAllGoods] = useState<GoodsItem[]>([]);

  const [cartList, setCartList] = useState<CartItem[]>([]);
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [repairList, setRepairList] = useState<RepairItem[]>([]);
  const [propertyList, setPropertyList] = useState<BillItem[]>([]);
  const [suggestionList, setSuggestionList] = useState<SuggestionItem[]>([]);

  // ========== 收货地址 ==========
  const [addressList, setAddressList] = useState<AddressItem[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressItem | null>(null);
  const [addressForm] = Form.useForm();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<string>('cart');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  const [selectedCartIds, setSelectedCartIds] = useState<number[]>([]);
  const [paying, setPaying] = useState<boolean>(false);
  const [expandOrderId, setExpandOrderId] = useState<number | null>(null);

  const totalAmount = cartList
    .filter(item => selectedCartIds.includes(item.id))
    .reduce((sum, item) => sum + ((item.price || 0) * item.num), 0);

  const loadAllGoods = useCallback(async () => {
    try {
      const res = await http.get('/goods/list');
      setAllGoods(res.data.data || []);
    } catch (err) {
      console.log('加载商品失败', err);
    }
  }, []);

  const getUserInfo = useCallback(async () => {
    try {
      const res = await http.get('/getInfo');
      if (res.data.code === 200) setUser(res.data.data);
    } catch (err: any) {
      message.error('获取用户信息失败');
    }
  }, []);

  // ========== 加载地址 ==========
  const loadAddress = async () => {
    if (!user) return;
    try {
      const res = await http.get('/address/list?userId=' + user.id);
      setAddressList(res.data.data || []);
    } catch (err) {
      message.error('地址加载失败');
    }
  };

  // ========== 保存地址 ==========
  const saveAddress = async () => {
    const values = addressForm.getFieldsValue();
    values.userId = user!.id;
    try {
      if (currentAddress) {
        await http.put('/address/update', { ...currentAddress, ...values });
      } else {
        await http.post('/address/add', values);
      }
      message.success('保存成功');
      setAddressModalVisible(false);
      loadAddress();
    } catch (err) {
      message.error('保存失败');
    }
  };

  // ========== 删除地址 ==========
  const deleteAddress = async (id: number) => {
    try {
      await http.delete('/address/delete?id=' + id);
      message.success('删除成功');
      loadAddress();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get('/goods/cart/list', { params: { userId: user.id } });
      const list: CartItem[] = res.data.data || [];
      for (const item of list) {
        const goods = allGoods.find(g => g.id === item.goodsId);
        item.name = goods?.name || '未知商品';
        item.price = goods?.price || 0;
      }
      setCartList(list);
      setSelectedCartIds([]);
    } catch (err: any) {
      message.error('购物车加载失败');
    }
    setLoading(false);
  };

  const loadOrder = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get('/goods/order/list', { params: { userId: user.id } });
      const orders: OrderItem[] = res.data.data || [];

      for (const order of orders) {
        const detailRes = await http.get('/goods/order/item/list', { params: { orderId: order.id } });
        let items = detailRes.data.data || [];
        items = items.map((item: any) => {
          const goods = allGoods.find(g => g.id === item.goodsId);
          return {
            ...item,
            goodsName: goods?.name || '未知商品',
            goodsPrice: goods?.price || 0,
          };
        });
        order.details = items;
      }
      setOrderList(orders);
    } catch (err: any) {
      message.error('订单加载失败');
    }
    setLoading(false);
  };

  const loadNotice = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get('/notice/user/list');
      const list = (res.data.data || []).filter((n: NoticeItem) => n.userId === user.id);
      setNoticeList(list);
    } catch (err: any) {
      message.error('公告加载失败');
    }
    setLoading(false);
  };

  const loadRepair = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get('/repair/list');
      const list = (res.data.data || []).filter((r: RepairItem) => r.username === user.username);
      setRepairList(list);
    } catch (err: any) {
      message.error('报修记录加载失败');
    }
    setLoading(false);
  };

  const loadProperty = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get(`/property/bill/list/user?userId=${user.username}`);
      if (res.data.code === 200) setPropertyList(res.data.data || []);
    } catch (err: any) {
      message.error('缴费记录加载失败');
    }
    setLoading(false);
  };

  const loadSuggestion = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await http.get(`/property/suggestion/myList?username=${user.username}`);
      setSuggestionList(res.data.data || []);
    } catch (err: any) {
      message.error('建议记录加载失败');
    }
    setLoading(false);
  };

  const delCart = async (id: number) => {
    try {
      await http.delete('/goods/cart/delete', { params: { id } });
      message.success('移除成功');
      loadCart();
    } catch (err: any) {
      message.error('移除失败');
    }
  };

  // ========== 下单自动传 addressId ==========
  const batchCheckout = async () => {
    if (selectedCartIds.length === 0) {
      message.warning('请选择商品');
      return;
    }
    if (!selectedAddressId) {
      message.warning('请选择收货地址');
      return;
    }
    if (!user) return;
    setPaying(true);
    try {
      await http.post('/goods/order/add', {
        userId: user.id,
        cartIds: selectedCartIds,
        addressId: selectedAddressId
      });
      message.success('下单成功！');
      loadCart();
      loadOrder();
    } catch (err: any) {
      console.error(err);
      message.error('下单失败');
    }
    setPaying(false);
  };

  const toggleCartSelect = (id: number, checked: boolean) => {
    setSelectedCartIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedCartIds(checked ? cartList.map(item => item.id) : []);
  };

  const handlePay = async (id: number) => {
    try {
      await http.post('/goods/order/pay', null, { params: { id } });
      message.success('支付成功');
      loadOrder();
    } catch (err: any) {
      message.error('支付失败');
    }
  };

  const handleReceiveGoods = async (id: number) => {
    try {
      await http.post('/goods/order/receive', null, { params: { id } });
      message.success('确认收货');
      loadOrder();
    } catch (err: any) {
      message.error('操作失败');
    }
  };

  const handleApplyRefund = async (id: number) => {
    try {
      await http.post('/goods/order/applyRefund', null, { params: { id } });
      message.success('已申请退款');
      loadOrder();
    } catch (err: any) {
      message.error('操作失败');
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      await http.delete('/goods/order/delete', { params: { id } });
      message.success('订单已删除');
      loadOrder();
    } catch (err: any) {
      message.error('删除失败');
    }
  };

  const toggleOrderDetail = (orderId: number) => {
    setExpandOrderId(expandOrderId === orderId ? null : orderId);
  };

  const deleteNotice = async (id: number) => {
    try {
      await http.delete('/notice/admin/delete', { params: { id } });
      message.success('删除成功');
      loadNotice();
    } catch (err: any) {
      message.error('删除失败');
    }
  };

  const handlePayBill = async (id: number) => {
    try {
      await http.post('/property/bill/pay', null, { params: { id } });
      message.success('缴费成功');
      loadProperty();
    } catch (err: any) {
      message.error('缴费失败');
    }
  };

  const openEdit = () => {
    form.setFieldsValue({
      username: user?.username,
      phone: user?.phone,
      email: user?.email
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const values = await form.validateFields();
      await http.post('/updateUser', values);
      message.success('更新成功');
      setEditOpen(false);
      getUserInfo();
    } catch (err: any) { }
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await http.post('/uploadAvatar', fd);
      message.success('头像更新成功');
      getUserInfo();
    } catch (err: any) {
      message.error('上传失败');
    }
    return false;
  };

  useEffect(() => {
    loadAllGoods();
    getUserInfo();
  }, [getUserInfo, loadAllGoods]);

  useEffect(() => {
    if (user) {
      loadCart();
      loadOrder();
      loadNotice();
      loadRepair();
      loadProperty();
      loadSuggestion();
      loadAddress();
    }
  }, [user]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setExpandOrderId(null);
  };

  const avatarUrl = user?.avatar
    ? `http://localhost:8080${user.avatar}?t=${Date.now()}`
    : null;

  const serviceCards = [
    { key: 'cart', icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />, title: '购物车', count: cartList.length, bg: '#e6f7ff' },
    { key: 'order', icon: <OrderedListOutlined style={{ fontSize: 32, color: '#52c41a' }} />, title: '我的订单', count: orderList.length, bg: '#f6ffed' },
    { key: 'notice', icon: <NotificationOutlined style={{ fontSize: 32, color: '#faad14' }} />, title: '我的公告', count: noticeList.length, bg: '#fffbe6' },
    { key: 'repair', icon: <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />, title: '报修记录', count: repairList.length, bg: '#fff2f0' },
    { key: 'property', icon: <PayCircleOutlined style={{ fontSize: 32, color: '#722ed1' }} />, title: '物业缴费', count: propertyList.length, bg: '#f9f0ff' },
    { key: 'suggestion', icon: <MessageOutlined style={{ fontSize: 32, color: '#13c2c2' }} />, title: '建议反馈', count: suggestionList.length, bg: '#e6fffb' },
  ];

  const tabList = [
    { key: 'cart', label: `购物车 (${cartList.length})` },
    { key: 'order', label: `我的订单 (${orderList.length})` },
    { key: 'notice', label: `我的公告 (${noticeList.length})` },
    { key: 'repair', label: `报修记录 (${repairList.length})` },
    { key: 'property', label: `物业缴费 (${propertyList.length})` },
    { key: 'suggestion', label: `建议反馈 (${suggestionList.length})` },
  ];

  
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Card variant="borderless" style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Row align="middle" gutter={24} wrap>
          <Col>
            <Upload showUploadList={false} beforeUpload={uploadAvatar}>
              <Avatar
                size={80}
                src={avatarUrl}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#55c4ae', border: '3px solid #f0f0f0' }}
              />
            </Upload>
          </Col>
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>{user?.username}</Title>
            <Space size="middle" style={{ marginTop: 8 }} wrap>
              <Tag color="blue">{user?.role}</Tag>
              <Text type="secondary">{user?.phone || '未填手机'}</Text>
              <Text type="secondary">{user?.email || '未填邮箱'}</Text>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<EditOutlined />} onClick={openEdit}>编辑资料</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => {
              setCurrentAddress(null);
              addressForm.resetFields();
              setAddressModalVisible(true);
            }}>收货地址</Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {serviceCards.map(card => (
          <Col xs={12} sm={8} md={4} key={card.key}>
            <Card
              variant="borderless"
              hoverable
              style={{ borderRadius: 12, textAlign: 'center', backgroundColor: activeTab === card.key ? card.bg : '#fff' }}
              onClick={() => handleTabChange(card.key)}
            >
              {card.icon}
              <div style={{ marginTop: 8 }}>{card.title}</div>
              <div style={{ fontSize: 20, marginTop: 4 }}>{card.count}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card variant="borderless" style={{ borderRadius: 12 }} tabList={tabList} activeTabKey={activeTab} onTabChange={handleTabChange}>
        <Spin spinning={loading}>
          {activeTab === 'cart' && (
            cartList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {/* 地址选择 */}
                <div style={{ marginBottom: 16, padding: 12, background: '#f7f8fa' }}>
                  <Text strong>选择收货地址：</Text>
                  {addressList.length === 0 ? (
                    <div style={{ marginTop: 8 }}>
                      <Button type="link" onClick={() => {
                        setAddressModalVisible(true);
                      }}>请添加收货地址</Button>
                    </div>
                  ) : (
                    <Radio.Group
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      style={{ marginTop: 8, display: 'block' }}
                    >
                      {addressList.map(a => (
                        <Radio value={a.id} key={a.id} style={{ display: 'block', marginBottom: 4 }}>
                          {a.receiverName} {a.receiverPhone} {a.receiverAddress}
                          {a.isDefault === 1 && <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>}
                        </Radio>
                      ))}
                    </Radio.Group>
                  )}
                </div>

                <Row justify="space-between" align="middle" style={{ marginBottom: 16, padding: 8, background: '#fafafa' }}>
                  <Col>
                    <Checkbox
                      checked={selectedCartIds.length === cartList.length && cartList.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    >全选</Checkbox>
                    <Text style={{ marginLeft: 16 }}>已选 {selectedCartIds.length} 件 合计：¥{totalAmount}</Text>
                  </Col>
                  <Col>
                    <Button type="primary" loading={paying} disabled={selectedCartIds.length === 0 || !selectedAddressId} onClick={batchCheckout}>
                      去支付
                    </Button>
                  </Col>
                </Row>

                {cartList.map(item => (
                  <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                    <Row justify="space-between" align="middle">
                      <Col flex="auto">
                        <Space>
                          <Checkbox checked={selectedCartIds.includes(item.id)} onChange={(e) => toggleCartSelect(item.id, e.target.checked)} />
                          <div>
                            <Text strong>{item.name}</Text><br />

                            <Text type="secondary">规格：{item.spec || '默认'} 数量：{item.num} 单价：¥{item.price}</Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Button danger size="small" onClick={() => delCart(item.id)}>删除</Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )
          )}

          {activeTab === 'order' && (
            orderList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {orderList.map(item => {
                  const st = orderStatusMap[item.status] || { color: 'default' };
                  const isExpand = expandOrderId === item.id;
                  const details = item.details || [];
                  const realTotalPrice = details.reduce((sum, g) => sum + (g.goodsPrice * g.num), 0);

                  return (
                    <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                      <Row justify="space-between" align="middle">
                        <Col flex="auto">
                          <Text strong>订单号：{item.orderNo}</Text><br />
                          <Text type="secondary">总价：¥{realTotalPrice} 时间：{item.createTime}</Text><br />
                          <Tag color={st.color}>{item.status}</Tag>
                          <Button type="link" size="small" onClick={() => toggleOrderDetail(item.id)}>
                            {isExpand ? '收起明细' : '查看商品明细'}
                          </Button>
                        </Col>
                        <Col>
                          <Space wrap>
                            {item.status === '待支付' && <Button size="small" type="primary" onClick={() => handlePay(item.id)}>支付</Button>}
                            {item.status === '已发货' && <Button size="small" onClick={() => handleReceiveGoods(item.id)}>确认收货</Button>}
                            {(item.status === '已支付' || item.status === '已发货') && <Button size="small" danger onClick={() => handleApplyRefund(item.id)}>退款</Button>}
                            <Button size="small" danger onClick={() => deleteOrder(item.id)}>删除</Button>
                          </Space>
                        </Col>
                      </Row>

                      {isExpand && (
                        <div style={{ padding: 10 }}>
                          <Text strong>订单商品：</Text>
                          {details.map(g => (
                            <Card key={g.id} variant="outlined" size="small" style={{ marginTop: 8, background: '#fafafa' }}>
                              <Text>{g.goodsName}</Text><br />
                              <Text type="secondary">单价：¥{g.goodsPrice} 数量：{g.num} 规格：{g.spec || '默认'}</Text>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </>
            )
          )}

          {activeTab === 'notice' && (
            noticeList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {noticeList.map(item => (
                  <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                    <Row justify="space-between">
                      <Col flex="auto">
                        <Text strong>{item.title}</Text><br />
                        <Text>{item.content.replace('||ANON||', '')}</Text><br />
                        <Text type="secondary">{item.createTime}</Text>
                      </Col>
                      <Col><Button danger size="small" onClick={() => deleteNotice(item.id)}>删除</Button></Col>
                    </Row>
                  </Card>
                ))}
              </>
            )
          )}

          {activeTab === 'repair' && (
            repairList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {repairList.map(item => (
                  <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                    <Text strong>{item.content}</Text><br />
                    <Text type="secondary">地址：{item.address} 电话：{item.phone}</Text><br />
                    <Tag color={item.status === '已处理' ? 'green' : 'orange'}>{item.status}</Tag>
                  </Card>
                ))}
              </>
            )
          )}

          {activeTab === 'property' && (
            propertyList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {propertyList.map(item => (
                  <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                    <Row justify="space-between">
                      <Col flex="auto">
                        <Text strong>{item.payType}</Text><br />
                        <Text type="secondary">截止：{item.deadline}</Text><br />
                        <Tag color={item.status === '已缴费' ? 'green' : 'orange'}>{item.status}</Tag>
                      </Col>
                      <Col>
                        <Text strong>¥{item.money}</Text><br />
                        {item.status === '待缴费' && <Button size="small" type="primary" onClick={() => handlePayBill(item.id)}>缴费</Button>}
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )
          )}

          {activeTab === 'suggestion' && (
            suggestionList.length === 0 ? (
              <Empty style={{ padding: 60 }} />
            ) : (
              <>
                {suggestionList.map(item => (
                  <Card key={item.id} variant="outlined" size="small" style={{ marginBottom: 12 }}>
                    <Text>{item.content}</Text><br />
                    <Tag color={item.status === '已处理' ? 'green' : 'orange'}>{item.status}</Tag>
                  </Card>
                ))}
              </>
            )
          )}
        </Spin>
      </Card>

      {/* 地址弹窗 */}
      <Modal
        title="收货地址"
        open={addressModalVisible}
        onCancel={() => setAddressModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={addressForm} layout="vertical">
          <Form.Item label="收货人" name="receiverName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="receiverPhone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="详细地址" name="receiverAddress" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="默认地址" name="isDefault">
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right' }}>
          <Button onClick={() => setAddressModalVisible(false)}>取消</Button>
          <Button type="primary" style={{ marginLeft: 8 }} onClick={saveAddress}>保存</Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Text strong>已保存地址</Text>
          <List
            dataSource={addressList}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button size="small" danger onClick={() => deleteAddress(item.id)}>删除</Button>
                ]}
              >
                {item.receiverName} {item.receiverPhone} {item.receiverAddress}
                {item.isDefault === 1 && <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>}
              </List.Item>
            )}
          />
        </div>
      </Modal>

      <Modal open={editOpen} onCancel={() => setEditOpen(false)} onOk={submitEdit} title="编辑资料">
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 17 }}>
          <Form.Item label="用户名" name="username"><Input disabled /></Form.Item>
          <Form.Item label="手机号" name="phone"><Input /></Form.Item>
          <Form.Item label="邮箱" name="email"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyPage;
