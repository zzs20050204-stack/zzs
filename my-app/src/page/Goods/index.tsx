import { useState, useEffect } from 'react';
import {
  Card, Button, Modal, Form, Input, InputNumber,
  Popconfirm, message, Space, Divider, Typography, Row, Col, Empty, Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  ShoppingCartOutlined, 
  ShoppingOutlined, 
  MessageOutlined, 
  DeleteOutlined,
  CalendarOutlined,
  PictureOutlined,
  EditOutlined
} from '@ant-design/icons';
import http from '../../utils/http/http';

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
  const [goodsList, setGoodsList] = useState<GoodsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentGoodsId, setCurrentGoodsId] = useState<number>(0);
  const [currentEditGoods, setCurrentEditGoods] = useState<GoodsItem | null>(null);
  const [commentList, setCommentList] = useState<CommentItem[]>([]);

  const getUserInfo = async () => {
    try {
      const res = await http.get('/getInfo');
      if (res.data.code === 200) {
        const data = res.data.data;
        setUser(data);
        setIsAdmin(data.role === '管理员');
      }
    } catch (err) {
      console.error('获取用户信息失败', err);
    }
  };

  const getGoodsList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/goods/list');
      if (res.data.code === 200) {
        setGoodsList(res.data.data);
      }
    } catch (err) {
      message.error('商品加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
    getGoodsList();
  }, []);

  // 发布商品
  const handleAddGoods = async () => {
    try {
      const values = await form.validateFields();
      await http.post('/goods/add', values);
      message.success('商品发布成功');
      setAddModalVisible(false);
      form.resetFields();
      getGoodsList();
    } catch (err) {
      console.error('发布商品失败', err);
    }
  };

  // 打开编辑弹窗
  const handleOpenEdit = (record: GoodsItem) => {
    setCurrentEditGoods(record);
    editForm.setFieldsValue(record);
    setEditModalVisible(true);
  };

  // 保存修改
  const handleUpdateGoods = async () => {
    try {
      const values = await editForm.validateFields();
      await http.put('/goods/update', {
        id: currentEditGoods?.id,
        ...values
      });
      message.success('修改成功');
      setEditModalVisible(false);
      getGoodsList();
    } catch (err) {
      console.error('修改失败', err);
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

  // 加入购物车
  const handleAddCart = async (goodsId: number) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      const params = { userId: user.id, goodsId, num: 1 };
      await http.post('/goods/cart/add', params);
      message.success('已加入购物车');
    } catch (err) {
      message.error('加入购物车失败');
    }
  };

  // ======================
  // 🔥 修复：立即购买（正确传参，生成订单）
  // ======================
 const handleBuy = async (record: GoodsItem) => {
  if (!user) {
    message.warning('请先登录');
    return;
  }
  try {
    // ✅ 正确传参，现在后端支持了
    const params = {
      userId: user.id,
      goodsId: record.id,
      num: 1
    };
    await http.post('/goods/order/add', params);
    message.success('下单成功，请前往【我的】查看订单');
  } catch (err) {
    message.error('购买失败');
    console.error(err);
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
      const params = { goodsId: currentGoodsId, userId: user.id, content: values.content };
      await http.post('/goods/comment/add', params);
      message.success('评价发布成功');
      commentForm.resetFields();
      
      const res = await http.get('/goods/comment/list', { params: { goodsId: currentGoodsId } });
      if (res.data.code === 200) {
        setCommentList(res.data.data);
      }
    } catch (err) {
      console.error('发表评论失败', err);
    }
  };

  return (
    <div style={{ padding: '30px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, paddingBottom: 12, borderBottom: '1px solid #f2f2f2'
      }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>🏪 社区商圈</Title>
          <Text type="secondary">邻里好物 · 便捷交易 · 互助共享</Text>
        </div>
        {isAdmin && (
          <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            发布商品
          </Button>
        )}
      </div>

      {goodsList.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="暂无商品" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {goodsList.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card
                hoverable
                loading={loading}
                style={{ borderRadius: 12, overflow: 'hidden' }}
                cover={
                  <div style={{ height: 160, backgroundColor: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.img ? (
                      <img src={item.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PictureOutlined style={{ fontSize: 48, color: '#ddd' }} />
                    )}
                  </div>
                }
                actions={[
                  <Tooltip title="加入购物车"><ShoppingCartOutlined onClick={() => handleAddCart(item.id)} /></Tooltip>,
                  <Tooltip title="评价"><MessageOutlined onClick={() => openCommentModal(item.id)} /></Tooltip>,
                  <span style={{ color: '#ff4d4f', fontWeight: 500 }} onClick={() => handleBuy(item)}>立即购买</span>
                ]}
              >
                {isAdmin && (
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 4 }}>
                    <Tooltip title="编辑">
                      <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(item)} />
                    </Tooltip>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDeleteGoods(item.id)}>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                )}

                <Card.Meta
                  title={<span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>}
                  description={
                    <div>
                      <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold', margin: '6px 0' }}>
                        ￥{item.price}
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: '#666' }}>
                        {item.info || '暂无简介'}
                      </Paragraph>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
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
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="img" label="商品图片链接">
            <Input placeholder="输入网络图片地址，例如：https://xxx.jpg" />
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
        width={520}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="img" label="商品图片链接">
            <Input placeholder="输入网络图片地址" />
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

      <Modal title="商品评价" open={commentModalVisible} footer={null} width={580} onCancel={() => setCommentModalVisible(false)}>
        <Form form={commentForm} layout="vertical">
          <Form.Item name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="写下你的评价..." />
          </Form.Item>
          <Button type="primary" block onClick={handleSubmitComment}>发表评价</Button>
        </Form>
        <Divider />
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {commentList.map((item) => (
            <div key={item.id} style={{ padding: 12, backgroundColor: '#fafafa', borderRadius: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>用户 {item.userId}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.createTime}</Text>
              </div>
              <div style={{ marginTop: 4 }}>{item.content}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Goods;
