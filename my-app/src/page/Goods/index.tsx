import { useState, useEffect } from 'react';
import {
  Card, Button, Modal, Form, Input, InputNumber, Upload,
  Popconfirm, message, Space, Divider, Typography, Row, Col, Empty, Tooltip
} from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  DeleteOutlined,
  CalendarOutlined,
  PictureOutlined,
  EditOutlined,
  SearchOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload';
import http from '../../utils/http/http';
import { BASE_URL } from '../../utils/constants';

const { Paragraph, Text, Title } = Typography;

interface UserInfo {
  id: number;
  username: string;
  role: string;
}

interface GoodsItem {
  id: number;
  name: string;
  price: number;
  info: string;
  img: string;
  createTime: string;
}

interface CommentItem {
  id: number;
  goodsId: number;
  userId: number;
  content: string;
  createTime: string;
}

const Goods = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [commentForm] = Form.useForm();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [goodsList, setGoodsList] = useState<GoodsItem[]>([]);
  const [originList, setOriginList] = useState<GoodsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentGoodsId, setCurrentGoodsId] = useState<number>(0);
  const [currentEditGoods, setCurrentEditGoods] = useState<GoodsItem | null>(null);
  const [commentList, setCommentList] = useState<CommentItem[]>([]);
  const [cartLoadingId, setCartLoadingId] = useState<number | null>(null);
  const [buyLoadingId, setBuyLoadingId] = useState<number | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payOrder, setPayOrder] = useState<{ orderId: number; orderNo: string; totalPrice: number; goodsName: string } | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  // 图片上传
  const [addImageFile, setAddImageFile] = useState<UploadFile | null>(null);
  const [addImageUrl, setAddImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<UploadFile | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: RcFile): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await http.post('/goods/uploadImage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data.code === 200) {
      return BASE_URL + res.data.data;
    }
    throw new Error('上传失败');
  };

  const getUserInfo = async () => {
    try {
      const res = await http.get('/getInfo');
      if (res.data.code === 200) {
        const data = res.data.data;
        setUser(data);
        setIsAdmin(data.role === '管理员');
      }
    } catch {
      // 获取用户信息失败
    }
  };

  const getGoodsList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/goods/list');
      if (res.data.code === 200) {
        const data = res.data.data || [];
        setOriginList(data);
        setGoodsList(data);
      }
    } catch (err) {
      message.error('商品加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
    if (!value.trim()) {
      setGoodsList(originList);
    } else {
      setGoodsList(originList.filter(item => item.name.includes(value)));
    }
  };

  useEffect(() => {
    getUserInfo();
    getGoodsList();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 发布商品
  const handleAddGoods = async () => {
    try {
      const values = await form.validateFields();
      setAddLoading(true);
      await http.post('/goods/add', values);
      message.success('商品发布成功');
      setAddModalVisible(false);
      form.resetFields();
      setAddImageUrl('');
      getGoodsList();
    } catch {
      message.error('发布商品失败');
    } finally {
      setAddLoading(false);
    }
  };

  // 打开编辑弹窗
  const handleOpenEdit = (record: GoodsItem) => {
    setCurrentEditGoods(record);
    editForm.setFieldsValue(record);
    setEditImageUrl(record.img || '');
    setEditModalVisible(true);
  };

  // 保存修改
  const handleUpdateGoods = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await http.put('/goods/update', {
        id: currentEditGoods?.id,
        ...values
      });
      message.success('修改成功');
      setEditModalVisible(false);
      getGoodsList();
    } catch {
      message.error('修改失败');
    } finally {
      setEditLoading(false);
    }
  };

  // 删除商品
  const handleDeleteGoods = async (id: number) => {
    try {
      await http.delete('/goods/delete', { params: { id } });
      message.success('商品已删除');
      getGoodsList();
    } catch (err) {
      message.error('删除商品失败');
    }
  };

  // 加入购物车（后端自动去重，重复点击会叠加数量）
  const handleAddCart = async (goodsId: number) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setCartLoadingId(goodsId);
    try {
      const params = { userId: user.id, goodsId, num: 1 };
      await http.post('/goods/cart/add', params);
      message.success('已加入购物车');
    } catch (err) {
      message.error('加入购物车失败');
    } finally {
      setCartLoadingId(null);
    }
  };

  // 立即购买
  const handleBuy = async (record: GoodsItem) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setBuyLoadingId(record.id);
    try {
      const params = { userId: user.id, goodsId: record.id, num: 1 };
      const res = await http.post('/goods/order/add', params);
      if (res.data.code === 200 && res.data.data) {
        const data = res.data.data;
        setPayOrder({ orderId: data.orderId, orderNo: data.orderNo, totalPrice: data.totalPrice, goodsName: record.name });
        setPayModalVisible(true);
      } else {
        message.error('下单失败');
      }
    } catch {
      message.error('购买失败');
    } finally {
      setBuyLoadingId(null);
    }
  };

  // 支付
  const handlePay = async () => {
    if (!payOrder) return;
    setPayLoading(true);
    try {
      await http.post('/goods/order/pay', null, { params: { id: payOrder.orderId } });
      message.success('支付成功！可在【我的】查看订单');
      setPayModalVisible(false);
      setPayOrder(null);
    } catch {
      message.error('支付失败');
    } finally {
      setPayLoading(false);
    }
  };

  // 打开评价
  const openCommentModal = async (goodsId: number) => {
    setCurrentGoodsId(goodsId);
    setCommentModalVisible(true);
    try {
      const res = await http.get('/goods/comment/list', { params: { goodsId } });
      if (res.data.code === 200) {
        setCommentList(res.data.data);
      }
    } catch (err) {
      message.error('获取评价失败');
    }
  };

  // 提交评价
  const handleSubmitComment = async () => {
    if (!user) return;
    try {
      const values = await commentForm.validateFields();
      setCommentLoading(true);
      const params = { goodsId: currentGoodsId, userId: user.id, content: values.content };
      await http.post('/goods/comment/add', params);
      message.success('评价发布成功');
      commentForm.resetFields();
      const res = await http.get('/goods/comment/list', { params: { goodsId: currentGoodsId } });
      if (res.data.code === 200) {
        setCommentList(res.data.data);
      }
    } catch {
      message.error('发表评论失败');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, paddingBottom: 12, borderBottom: '1px solid #f2f2f2',
        flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>🏪 社区商圈</Title>
          <Text type="secondary">邻里好物 · 便捷交易 · 互助共享</Text>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="搜索商品名称"
            value={searchName}
            onChange={e => handleSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%', maxWidth: 260 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          {isAdmin && (
            <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
              发布商品
            </Button>
          )}
        </Space>
      </div>

      {goodsList.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="暂无商品" />
        </Card>
      ) : (
        <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
          {goodsList.map((item) => (
            <Col xs={12} sm={12} md={8} lg={6} key={item.id}>
              <Card
                hoverable
                loading={loading}
                style={{ borderRadius: isMobile ? 12 : 16, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                cover={
                  <div style={{ height: isMobile ? 120 : 180, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {item.img ? (
                      <img
                        src={item.img.startsWith('/goods-images/') ? BASE_URL + item.img : item.img}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                        <div style={{ color: '#bfbfbf', marginTop: 8, fontSize: 13 }}>暂无图片</div>
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%)', padding: '8px 12px', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <Button size="small" type="text" style={{ color: '#fff' }} icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} />
                        <Popconfirm title="确定删除？" okText="确定" cancelText="取消" onConfirm={() => handleDeleteGoods(item.id)}>
                          <Button size="small" type="text" style={{ color: '#ff7875' }} icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </div>
                    )}
                  </div>
                }
                styles={{ body: { padding: isMobile ? '10px' : '16px', flex: 1, display: 'flex', flexDirection: 'column' } }}
                actions={[
                  <Tooltip title="加入购物车" key="cart">
                    <Button type="text" size={isMobile ? 'small' : 'middle'} loading={cartLoadingId === item.id} icon={<ShoppingCartOutlined style={{ fontSize: isMobile ? 15 : 18 }} />} onClick={(e) => { e.stopPropagation(); handleAddCart(item.id); }} />
                  </Tooltip>,
                  <Tooltip title="查看评价" key="comment">
                    <Button type="text" size={isMobile ? 'small' : 'middle'} icon={<MessageOutlined style={{ fontSize: isMobile ? 15 : 18 }} />} onClick={(e) => { e.stopPropagation(); openCommentModal(item.id); }} />
                  </Tooltip>,
                  <Tooltip title="立即购买" key="buy">
                    <Button type="primary" size="small" loading={buyLoadingId === item.id} onClick={(e) => { e.stopPropagation(); handleBuy(item); }}>{isMobile ? '购买' : '立即购买'}</Button>
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={<span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#1a1a2e' }}>{item.name}</span>}
                  description={
                    <div>
                      <div style={{ color: '#ff4d4f', fontSize: isMobile ? 16 : 22, fontWeight: 700, margin: isMobile ? '4px 0 4px' : '8px 0 6px' }}>
                        ¥{item.price}
                      </div>
                      <Paragraph ellipsis={{ rows: isMobile ? 1 : 2 }} style={{ fontSize: isMobile ? 11 : 12, color: '#8c8c8c', margin: 0, lineHeight: 1.6 }}>
                        {item.info || '暂无简介'}
                      </Paragraph>
                      <div style={{ fontSize: isMobile ? 10 : 11, color: '#bfbfbf', marginTop: isMobile ? 6 : 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarOutlined /> {item.createTime?.split(' ')[0]}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="发布商品"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={handleAddGoods}
        okText="发布" cancelText="取消"
        confirmLoading={addLoading}
        centered
        destroyOnClose
        maskClosable={false}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="img" label="商品图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/*"
              beforeUpload={async (file) => {
                try {
                  setUploading(true);
                  const url = await uploadImage(file as RcFile);
                  setAddImageUrl(url);
                  form.setFieldsValue({ img: url });
                  message.success('图片上传成功');
                } catch {
                  message.error('图片上传失败');
                } finally {
                  setUploading(false);
                }
                return false;
              }}
              onRemove={() => {
                setAddImageUrl('');
                form.setFieldsValue({ img: '' });
              }}
            >
              {addImageUrl ? null : (
                <div>
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="price" label="商品价格" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="info" label="商品简介">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改商品信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateGoods}
        okText="保存" cancelText="取消"
        confirmLoading={editLoading}
        centered
        destroyOnClose
        maskClosable={false}
        width={520}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="img" label="商品图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/*"
              beforeUpload={async (file) => {
                try {
                  setUploading(true);
                  const url = await uploadImage(file as RcFile);
                  setEditImageUrl(url);
                  editForm.setFieldsValue({ img: url });
                  message.success('图片上传成功');
                } catch {
                  message.error('图片上传失败');
                } finally {
                  setUploading(false);
                }
                return false;
              }}
              onRemove={() => {
                setEditImageUrl('');
                editForm.setFieldsValue({ img: '' });
              }}
            >
              {editImageUrl ? null : (
                <div>
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="price" label="商品价格" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="info" label="商品简介">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="商品评价" open={commentModalVisible} footer={null} width={520} centered onCancel={() => setCommentModalVisible(false)}>
        <Form form={commentForm} layout="vertical">
          <Form.Item name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="写下你的评价..." />
          </Form.Item>
          <Button type="primary" block onClick={handleSubmitComment} loading={commentLoading}>发表评价</Button>
        </Form>
        <Divider />
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {commentList.length === 0 ? (
            <Empty description="暂无评价，快来发表第一条吧" />
          ) : commentList.map((item) => (
            <div key={item.id} style={{ padding: 12, backgroundColor: '#fafafa', borderRadius: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>用户 {item.userId}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.createTime?.replace('T', ' ')}</Text>
              </div>
              <div style={{ marginTop: 4 }}>{item.content}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 支付弹窗 */}
      <Modal
        title="确认支付"
        open={payModalVisible}
        onCancel={() => { setPayModalVisible(false); setPayOrder(null); }}
        centered
        width={420}
        footer={[
          <Button key="cancel" onClick={() => { setPayModalVisible(false); setPayOrder(null); }}>
            稍后支付
          </Button>,
          <Button key="pay" type="primary" loading={payLoading} onClick={handlePay}>
            确认支付 ¥{payOrder?.totalPrice}
          </Button>,
        ]}
      >
        {payOrder && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Text type="secondary">订单金额</Text>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ff4d4f' }}>¥{payOrder.totalPrice}</div>
            </div>
            <div style={{ background: '#fafafa', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">商品名称</Text>
                <Text strong>{payOrder.goodsName}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">订单编号</Text>
                <Text>{payOrder.orderNo}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">订单状态</Text>
                <Text type="warning">待支付</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Goods;
