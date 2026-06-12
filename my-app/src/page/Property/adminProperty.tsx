import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Select, Table, Space, DatePicker, Modal } from 'antd';
import http from '../../utils/http/http';
import dayjs from 'dayjs';

const { Option } = Select;

interface BillItem {
  id: number;
  userId: number | string;
  payType: string;
  money: string;
  status: string;
  deadline: string;
  remark: string;
}

export default function AdminProperty() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<BillItem[]>([]);
  const [originList, setOriginList] = useState<BillItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    userId: '',
    payType: '',
    status: ''
  });

  // 加载全部数据
  const loadList = async () => {
    try {
      const res = await http.get('/property/bill/list/all');
      if (res.data.code === 200) {
        setOriginList(res.data.data);
        setList(res.data.data);
        setSearchParams({ userId: '', payType: '', status: '' });
      }
    } catch {
      message.error('加载失败');
    }
  };

  // 多条件搜索
  const handleSearch = () => {
    let filterData = [...originList];
    const { userId, payType, status } = searchParams;

    if (userId) {
      filterData = filterData.filter(item => String(item.userId).includes(userId));
    }
    if (payType) {
      filterData = filterData.filter(item => item.payType === payType);
    }
    if (status) {
      filterData = filterData.filter(item => item.status === status);
    }

    setList(filterData);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({ userId: '', payType: '', status: '' });
    setList(originList);
  };

  // 新增账单提交
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        userId: values.userId,
        payType: values.payType,
        money: values.money,
        deadline: values.deadline.format('YYYY-MM-DD HH:mm:ss'),
        remark: values.remark || ''
      };
      const res = await http.post('/property/bill/add', data);
      if (res.data.code === 200) {
        message.success('下发成功');
        setModalVisible(false);
        form.resetFields();
        loadList();
      } else {
        message.error(res.data.msg);
      }
    } catch {
      message.error('下发失败');
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="缴费账单管理"
        extra={
          <Space size="middle">
            <Input
              placeholder="搜索用户ID"
              value={searchParams.userId}
              onChange={e => setSearchParams({ ...searchParams, userId: e.target.value })}
              style={{ width: 160 }}
              allowClear
            />
            <Select
              placeholder="选择费用类型"
              value={searchParams.payType || undefined}
              onChange={val => setSearchParams({ ...searchParams, payType: val || '' })}
              style={{ width: 140 }}
              allowClear
            >
              <Option value="物业费">物业费</Option>
              <Option value="水费">水费</Option>
              <Option value="电费">电费</Option>
              <Option value="停车费">停车费</Option>
            </Select>
            <Select
              placeholder="选择缴费状态"
              value={searchParams.status || undefined}
              onChange={val => setSearchParams({ ...searchParams, status: val || '' })}
              style={{ width: 140 }}
              allowClear
            >
              <Option value="待缴费">待缴费</Option>
              <Option value="已缴费">已缴费</Option>
            </Select>
            <Button onClick={handleSearch} type="primary">搜索</Button>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={() => setModalVisible(true)}>新增缴费单</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={list}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '用户ID', dataIndex: 'userId' },
            { title: '类型', dataIndex: 'payType' },
            { title: '金额', dataIndex: 'money' },
            { title: '状态', dataIndex: 'status' },
            { title: '截止时间', dataIndex: 'deadline' },
            { title: '备注', dataIndex: 'remark' },
          ]}
        />
      </Card>

      {/* 新增弹窗 */}
      <Modal
        title="新增缴费单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleAdd}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>

          <Form.Item name="payType" label="费用类型" rules={[{ required: true }]}>
            <Select style={{ width: '100%' }}>
              <Option value="物业费">物业费</Option>
              <Option value="水费">水费</Option>
              <Option value="电费">电费</Option>
              <Option value="停车费">停车费</Option>
            </Select>
          </Form.Item>

          <Form.Item name="money" label="金额" rules={[{ required: true }]}>
            <Input type="number" placeholder="请输入金额" />
          </Form.Item>

          <Form.Item name="deadline" label="截止时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input placeholder="选填内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}