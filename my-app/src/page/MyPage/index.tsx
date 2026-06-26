import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, message, Typography, Row, Col, Empty, Space, Modal,
  Avatar, Tag, Spin, Form, Input, Checkbox, Upload, List, Radio, Popconfirm
} from 'antd';
import {
  ShoppingCartOutlined, OrderedListOutlined, NotificationOutlined,
  UserOutlined, EditOutlined, WarningOutlined,
  PayCircleOutlined, MessageOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import http from '../../utils/http/http';
import { BASE_URL } from '../../utils/constants';
import { setMenuKey } from '../../utils/menuSlice';

const { Title, Text, Paragraph } = Typography;

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
      console.error('加载商品失败', err);
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

  // 购物车数量增减
  const updateCartNum = async (id: number, num: number) => {
    if (num <= 0) {
      delCart(id);
      return;
    }
    try {
      await http.put('/goods/cart/update', { id, num });
      setCartList(prev => prev.map(item => item.id === id ? { ...item, num } : item));
    } catch {
      message.error('更新失败');
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
    if (key === 'dashboard') {
      dispatch(setMenuKey({ key: '/dashboard', title: '数据看板' }));
      navigate('/');
      return;
    }
    setActiveTab(key);
    setExpandOrderId(null);
  };

  const avatarUrl = user?.avatar
    ? `${BASE_URL}${user.avatar}?t=${Date.now()}`
    : null;

  const serviceCards = [
    { key: 'cart', icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />, title: '购物车', count: cartList.length, bg: '#e6f7ff' },
    { key: 'order', icon: <OrderedListOutlined style={{ fontSize: 32, color: '#52c41a' }} />, title: '我的订单', count: orderList.length, bg: '#f6ffed' },
    { key: 'notice', icon: <NotificationOutlined style={{ fontSize: 32, color: '#faad14' }} />, title: '我的公告', count: noticeList.length, bg: '#fffbe6' },
    { key: 'repair', icon: <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />, title: '报修记录', count: repairList.length, bg: '#fff2f0' },
    { key: 'property', icon: <PayCircleOutlined style={{ fontSize: 32, color: '#722ed1' }} />, title: '物业缴费', count: propertyList.length, bg: '#f9f0ff' },
    { key: 'suggestion', icon: <MessageOutlined style={{ fontSize: 32, color: '#13c2c2' }} />, title: '建议反馈', count: suggestionList.length, bg: '#e6fffb' },
    { key: 'dashboard', icon: <BarChartOutlined style={{ fontSize: 32, color: '#eb2f96' }} />, title: '数据看板', count: null, bg: '#fff0f6' },
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
              <div style={{ fontSize: 20, marginTop: 4 }}>{card.count !== null ? card.count : ''}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card variant="borderless" style={{ borderRadius: 12 }} tabList={tabList} activeTabKey={activeTab} onTabChange={handleTabChange}>
        <Spin spinning={loading}>
          {activeTab === 'cart' && (
            cartList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="购物车空空如也，去商城逛逛吧" />
            ) : (
              <>
                {/* 地址选择 */}
                <div style={{ marginBottom: 20, padding: '16px 20px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                  <Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>收货地址</Text>
                  {addressList.length === 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <Button type="link" onClick={() => { setAddressModalVisible(true); setCurrentAddress(null); addressForm.resetFields(); }} icon={<PlusOutlined />}>添加收货地址</Button>
                    </div>
                  ) : (
                    <Radio.Group value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} style={{ marginTop: 10, width: '100%' }}>
                      <Row gutter={[12, 8]}>
                        {addressList.map(a => (
                          <Col xs={24} sm={12} key={a.id}>
                            <Radio value={a.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                              <div style={{ marginLeft: 4 }}>
                                <Text strong>{a.receiverName}</Text>
                                <Text type="secondary" style={{ marginLeft: 8 }}>{a.receiverPhone}</Text>
                                {a.isDefault === 1 && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10, lineHeight: '18px' }}>默认</Tag>}
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{a.receiverAddress}</Text>
                              </div>
                            </Radio>
                          </Col>
                        ))}
                      </Row>
                    </Radio.Group>
                  )}
                </div>

                {/* 底部结算栏 */}
                <div style={{
                  marginBottom: 20, padding: '12px 16px',
                  background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)',
                  borderRadius: 12, border: '1px solid #ffe0e0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: 8
                }}>
                  <div>
                    <Checkbox
                      checked={selectedCartIds.length === cartList.length && cartList.length > 0}
                      indeterminate={selectedCartIds.length > 0 && selectedCartIds.length < cartList.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    >全选</Checkbox>
                    <Text style={{ marginLeft: 16, fontSize: 14 }}>
                      已选 <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{selectedCartIds.length}</Text> 件
                    </Text>
                    <span style={{ fontSize: 14, marginLeft: 24 }}>
                      合计：<span style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 700 }}>¥{totalAmount.toFixed(2)}</span>
                    </span>
                  </div>
                  <Button type="primary" size="large" loading={paying} disabled={selectedCartIds.length === 0 || !selectedAddressId} onClick={batchCheckout}
                    style={{ borderRadius: 8, height: 42, padding: '0 32px', fontSize: 15 }}>
                    去结算
                  </Button>
                </div>

                {/* 购物车列表 */}
                {cartList.map(item => {
                  const itemTotal = (item.price || 0) * item.num;
                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      style={{ marginBottom: 12, borderRadius: 12, border: selectedCartIds.includes(item.id) ? '1px solid #ff4d4f' : '1px solid #f0f0f0' }}
                    >
                      <Row align="middle" gutter={16}>
                        <Col flex="32px">
                          <Checkbox checked={selectedCartIds.includes(item.id)} onChange={(e) => toggleCartSelect(item.id, e.target.checked)} />
                        </Col>
                        <Col flex="auto">
                          <div>
                            <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
                            <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>{item.spec || '默认规格'}</Text>
                          </div>
                        </Col>
                        <Col>
                          <Text style={{ fontSize: 16, fontWeight: 600, color: '#ff4d4f' }}>¥{item.price}</Text>
                        </Col>
                        <Col>
                          <Space size={4}>
                            <Button size="small" icon={<MinusOutlined />} onClick={() => updateCartNum(item.id, item.num! - 1)}
                              style={{ borderRadius: 6, width: 28, height: 28 }} />
                            <span style={{ display: 'inline-block', minWidth: 32, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
                              {item.num}
                            </span>
                            <Button size="small" icon={<PlusOutlined />} onClick={() => updateCartNum(item.id, item.num! + 1)}
                              style={{ borderRadius: 6, width: 28, height: 28 }} />
                          </Space>
                        </Col>
                        <Col>
                          <Text strong style={{ fontSize: 15, color: '#ff4d4f' }}>¥{itemTotal.toFixed(2)}</Text>
                        </Col>
                        <Col>
                          <Popconfirm title="确定移除此商品？" okText="确定" cancelText="取消" onConfirm={() => delCart(item.id)}>
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </>
            )
          )}

          {activeTab === 'order' && (
            orderList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="还没有订单，去商城下单吧" />
            ) : (
              <div>
                {orderList.map(item => {
                  const st = orderStatusMap[item.status] || { color: 'default' };
                  const isExpand = expandOrderId === item.id;
                  const details = item.details || [];
                  const realTotalPrice = details.length > 0
                    ? details.reduce((sum, g) => sum + (g.goodsPrice * g.num), 0)
                    : item.totalPrice;

                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
                    >
                      {/* 订单头部 */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingBottom: 12, marginBottom: 12,
                        borderBottom: '1px dashed #f0f0f0'
                      }}>
                        <Space size={16}>
                          <Text strong style={{ fontSize: 14, color: '#333' }}>
                            订单号：{item.orderNo}
                          </Text>
                          <Tag color={st.color} style={{ borderRadius: 6, fontSize: 12 }}>{item.status}</Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.createTime?.replace?.('T', ' ')}</Text>
                      </div>

                      {/* 订单商品明细 */}
                      <div style={{ marginBottom: 12 }}>
                        {details.length > 0 ? (
                          isExpand ? (
                            details.map(g => (
                              <div key={g.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px', marginBottom: 8,
                                background: '#f9fafb', borderRadius: 10
                              }}>
                                <Space size={12}>
                                  <div style={{
                                    width: 48, height: 48, borderRadius: 8,
                                    background: '#e8e8e8', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    <ShoppingCartOutlined style={{ color: '#999' }} />
                                  </div>
                                  <div>
                                    <Text strong style={{ fontSize: 14 }}>{g.goodsName}</Text><br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {g.spec || '默认'} × {g.num}
                                    </Text>
                                  </div>
                                </Space>
                                <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>
                                  ¥{(g.goodsPrice * g.num).toFixed(2)}
                                </Text>
                              </div>
                            ))
                          ) : (
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px', background: '#f9fafb', borderRadius: 10
                            }}>
                              <Space size={12}>
                                <div style={{
                                  width: 48, height: 48, borderRadius: 8,
                                  background: '#e8e8e8', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <ShoppingCartOutlined style={{ color: '#999' }} />
                                </div>
                                <div>
                                  <Text strong style={{ fontSize: 14 }}>{details[0].goodsName}</Text>
                                  {details.length > 1 && (
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                                      等 {details.length} 件商品
                                    </Text>
                                  )}
                                </div>
                              </Space>
                              <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>
                                ¥{realTotalPrice.toFixed(2)}
                              </Text>
                            </div>
                          )
                        ) : (
                          <Text type="secondary">商品信息加载中...</Text>
                        )}
                      </div>

                      {/* 底部：展开 + 操作 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          {details.length > 1 && (
                            <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => toggleOrderDetail(item.id)}>
                              {isExpand ? '收起商品明细 ▲' : '查看全部明细 ▼'}
                            </Button>
                          )}
                        </div>
                        <Space size={8}>
                          {item.status === '待支付' && <Button size="small" type="primary" style={{ borderRadius: 6 }} onClick={() => handlePay(item.id)}>立即支付</Button>}
                          {item.status === '已发货' && <Button size="small" style={{ borderRadius: 6, color: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleReceiveGoods(item.id)}>确认收货</Button>}
                          {(item.status === '已支付' || item.status === '已发货') && <Button size="small" danger style={{ borderRadius: 6 }} onClick={() => handleApplyRefund(item.id)}>申请退款</Button>}
                          <Popconfirm title="确定删除此订单？" okText="确定" cancelText="取消" onConfirm={() => deleteOrder(item.id)}>
                            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'notice' && (
            noticeList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="你还没有发布过公告" />
            ) : (
              <div>
                {noticeList.map((item, idx) => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    style={{ marginBottom: 14, borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        width: 4, minHeight: '100%',
                        background: `linear-gradient(180deg, #${['55c4ae', '5b8def', 'f0a05d', 'eb6f92'][idx % 4]} 0%, transparent 100%)`,
                      }} />
                      <div style={{ flex: 1, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>{item.title}</Text>
                            <Paragraph
                              ellipsis={{ rows: 3 }}
                              style={{ margin: '8px 0 0', color: '#666', fontSize: 13, lineHeight: 1.7 }}
                            >
                              {item.content.replace('||ANON||', '')}
                            </Paragraph>
                          </div>
                          <Popconfirm title="确定删除此公告？" okText="确定" cancelText="取消" onConfirm={() => deleteNotice(item.id)}>
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} style={{ flexShrink: 0, marginLeft: 12 }} />
                          </Popconfirm>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
                          {item.createTime?.replace('T', ' ')}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {activeTab === 'repair' && (
            repairList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="还没有报修记录" />
            ) : (
              <div>
                {repairList.map(item => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    style={{ marginBottom: 14, borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        width: 4, minHeight: '100%',
                        background: item.status === '已处理' ? 'linear-gradient(180deg, #52c41a, transparent)' : 'linear-gradient(180deg, #faad14, transparent)',
                      }} />
                      <div style={{ flex: 1, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Space size={8}>
                              <WarningOutlined style={{ color: item.status === '已处理' ? '#52c41a' : '#faad14', fontSize: 16 }} />
                              <Text strong style={{ fontSize: 15 }}>{item.content}</Text>
                            </Space>
                          </div>
                          <Tag color={item.status === '已处理' ? 'green' : 'orange'} style={{ borderRadius: 6 }}>{item.status}</Tag>
                        </div>
                        <div style={{ marginTop: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 }}>
                          <Space size={20}>
                            <span><Text type="secondary" style={{ fontSize: 12 }}>地址</Text> <Text style={{ fontSize: 13 }}>{item.address}</Text></span>
                            <span><Text type="secondary" style={{ fontSize: 12 }}>电话</Text> <Text style={{ fontSize: 13 }}>{item.phone}</Text></span>
                          </Space>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 10, display: 'block' }}>
                          {item.createTime?.replace('T', ' ')}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {activeTab === 'property' && (
            propertyList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="暂无物业缴费单" />
            ) : (
              <div>
                {propertyList.map(item => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    style={{ marginBottom: 14, borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        width: 4, minHeight: '100%',
                        background: item.status === '已缴费' ? 'linear-gradient(180deg, #52c41a, transparent)' : 'linear-gradient(180deg, #faad14, transparent)',
                      }} />
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Space size={8}>
                            <PayCircleOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                            <Text strong style={{ fontSize: 15 }}>{item.payType}</Text>
                            <Tag color={item.status === '已缴费' ? 'green' : 'orange'} style={{ borderRadius: 6 }}>{item.status}</Tag>
                          </Space>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>截止日期：{item.deadline?.replace('T', ' ')}</Text>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 700 }}>¥{item.money}</div>
                          {item.status === '待缴费' && (
                            <Button type="primary" size="small" style={{ borderRadius: 6, marginTop: 6 }} onClick={() => handlePayBill(item.id)}>立即缴费</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {activeTab === 'suggestion' && (
            suggestionList.length === 0 ? (
              <Empty style={{ padding: 60 }} description="还没有提交过建议" />
            ) : (
              <div>
                {suggestionList.map((item, idx) => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    style={{ marginBottom: 14, borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        width: 4, minHeight: '100%',
                        background: `linear-gradient(180deg, #${['13c2c2', '1890ff', '722ed1', 'eb2f96'][idx % 4]} 0%, transparent 100%)`,
                      }} />
                      <div style={{ flex: 1, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Space size={8}>
                            <MessageOutlined style={{ color: '#13c2c2', fontSize: 16 }} />
                            <Text style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{item.content}</Text>
                          </Space>
                          <Tag color={item.status === '已处理' ? 'green' : 'orange'} style={{ borderRadius: 6, flexShrink: 0, marginLeft: 12 }}>{item.status}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
                          {item.createTime?.replace('T', ' ')}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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
        width={480}
        centered
        destroyOnClose
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

      <Modal open={editOpen} onCancel={() => setEditOpen(false)} onOk={submitEdit} title="编辑资料" okText="保存" cancelText="取消" centered destroyOnClose maskClosable={false}>
        <Form form={form} layout="vertical">
          <Form.Item label="用户名" name="username"><Input disabled /></Form.Item>
          <Form.Item label="手机号" name="phone"><Input /></Form.Item>
          <Form.Item label="邮箱" name="email"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyPage;
