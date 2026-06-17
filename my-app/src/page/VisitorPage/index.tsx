import { useState, useEffect } from 'react';
import {
  Form, Input, Button, DatePicker, Table, Modal, Tag, message, Space, Spin
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import moment from 'moment';
import http from '../../utils/http/http';

const { RangePicker } = DatePicker;

interface VisitorItem {
  id: number;
  visitorName: string;
  visitorPhone: string;
  visitReason: string;
  startTime: string;
  endTime: string;
  applyStatus: number;
  rejectReason?: string;
  visitorCode?: string;
}

const VisitorPage = () => {
  const [form] = Form.useForm();
  const [list, setList] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [codeModal, setCodeModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<VisitorItem | null>(null);

  // 每次发请求前单独创建配置，强制携带header，避开defaults缓存问题
  const getHttpConfig = () => {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    return {
      headers: {
        token: token || '',
        userId: userId || ''
      }
    };
  };
  

  // 加载我的预约列表
  const loadList = async () => {
    setLoading(true);
    try {
      // 手动传入headers配置，强制带上
      const res = await http.get('/api/visitor/my/list', getHttpConfig());
      if (res.data.code === 200) {
        setList(res.data.data || []);
      } else {
        message.warning(res.data.msg || '数据加载失败');
      }
    } catch (err) {
      message.error('网络异常，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // 提交访客预约
const submitApply = async (values: any) => {
  const [start, end] = values.timeRange;

  // 前端时间戳预校验：只拦截结束 < 开始，相等允许通过
  const startTs = moment(start).valueOf();
  const endTs = moment(end).valueOf();
  if (endTs < startTs) {
    message.warning('结束时间不能早于开始时间');
    return;
  }

  const params = {
    visitorName: values.visitorName,
    visitorPhone: values.visitorPhone,
    visitReason: values.visitReason || '',
    startTime: moment(start).format('YYYY-MM-DD HH:mm:ss'),
    endTime: moment(end).format('YYYY-MM-DD HH:mm:ss')
  };

  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(params.visitorPhone)) {
    message.warning('请输入正确的手机号');
    return;
  }

  setSubmitLoading(true);
  try {
    const res = await http.post('/api/visitor/apply', params, getHttpConfig());
    console.log('后端返回结果：', res.data);
    if (res.data.code === 200) {
      message.success('预约提交成功，等待审核');
      setAddModal(false);
      form.resetFields();
      loadList();
    } else {
      message.warning(res.data.msg);
    }
  } catch (err) {
    message.error('提交预约失败，请重试');
    console.error(err);
  } finally {
    setSubmitLoading(false);
  }
};
  // 查看访客码详情
  const viewCode = async (id: number) => {
    setDetailLoadingId(id);
    try {
      const res = await http.get(`/api/visitor/detail/${id}`, getHttpConfig());
      setCurrentItem(res.data.data);
      setCodeModal(true);
    } catch (err) {
      message.error('获取访客码失败');
      console.error(err);
    } finally {
      setDetailLoadingId(null);
    }
  };

  // 状态标签渲染
  const renderStatus = (status: number) => {
    switch (status) {
      case 1: return <Tag color="gold">待审核</Tag>;
      case 2: return <Tag color="green">已通过</Tag>;
      case 3: return <Tag color="red">已驳回</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  const columns = [
    { title: '访客姓名', dataIndex: 'visitorName', width: 120 },
    { title: '访客手机号', dataIndex: 'visitorPhone', width: 140 },
    { title: '来访开始时间', dataIndex: 'startTime', width: 180 },
    { title: '来访结束时间', dataIndex: 'endTime', width: 180 },
    { title: '状态', dataIndex: 'applyStatus', render: renderStatus, width: 100 },
    {
      title: '操作',
      width: 220,
      render: (_: any, record: VisitorItem) => (
        <Space size="middle">
          {record.applyStatus === 2 && (
            <Button type="link" loading={detailLoadingId === record.id} onClick={() => viewCode(record.id)}>
              查看访客码
            </Button>
          )}
          {record.applyStatus === 3 && record.rejectReason && (
            <span style={{ color: '#999' }}>驳回原因：{record.rejectReason}</span>
          )}
        </Space>
      )
    }
  ];

  const handleCloseAddModal = () => {
    setAddModal(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>我的访客预约</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
          新增预约
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无预约记录' }}
        />
      </Spin>

      {/* 新增预约弹窗 */}
      <Modal
        title="访客预约申请"
        open={addModal}
        onCancel={handleCloseAddModal}
        footer={null}
        maskClosable={false}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={submitApply}>
          <Form.Item
            name="visitorName"
            label="访客姓名"
            rules={[{ required: true, message: '请输入访客姓名' }]}
          >
            <Input placeholder="请输入访客姓名" maxLength={20} />
          </Form.Item>

          <Form.Item
            name="visitorPhone"
            label="访客手机号"
            rules={[{ required: true, message: '请输入访客手机号' }]}
          >
            <Input placeholder="请输入11位手机号" maxLength={11} />
          </Form.Item>

          <Form.Item name="visitReason" label="来访事由">
            <Input.TextArea placeholder="选填，请简要描述来访事由" rows={3} maxLength={200} />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="来访时间段"
            rules={[{ required: true, message: '请选择来访时间段' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitLoading}>
              提交预约
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 访客二维码弹窗 */}
      <Modal
        title="访客通行码"
        open={codeModal}
        onCancel={() => setCodeModal(false)}
        footer={null}
        width={360}
        maskClosable={false}
      >
        {currentItem && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 'bold', margin: '0 0 12px' }}>
              访客码：{currentItem.visitorCode}
            </p>
            <div style={{ margin: '20px auto' }}>
              <QRCodeSVG value={currentItem.visitorCode || ''} size={180} />
            </div>
            <p style={{ color: '#666' }}>
              有效时间：{currentItem.startTime} ~ {currentItem.endTime}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VisitorPage;