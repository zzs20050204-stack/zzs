import { useState, useEffect } from 'react';
import { Table, Button, Card, message, Tag, Typography, Modal, Input, Space } from 'antd';
import type { ColumnType  } from 'antd/es/table';
import http from '../../utils/http/http';

const { Title } = Typography;

interface AllItem {
  id: number;
  visitorName: string;
  visitorPhone: string;
  visitReason: string;
  startTime: string;
  endTime: string;
  applyStatus: number;
  rejectReason?: string;
}

const AllVisitorPage = () => {
  const [list, setList] = useState<AllItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 驳回弹窗状态
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectModalLoading, setRejectModalLoading] = useState(false);
  const [currentId, setCurrentId] = useState(0);
  const [rejectReason, setRejectReason] = useState('');
  const [passLoadingId, setPassLoadingId] = useState<number | null>(null);

  const getHeader = () => {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    return {
      headers: {
        token: token || '',
        userId: userId || ''
      }
    };
  };

  // 加载全部预约数据
  const loadAllData = async () => {
    setLoading(true);
    try {
      const res = await http.get('/api/visitor/admin/all', getHeader());
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

  // 审核通过
  const handlePass = async (id: number) => {
    setPassLoadingId(id);
    try {
      await http.put('/api/visitor/audit', { id, applyStatus: 2 }, getHeader());
      message.success('审核通过，已生成访客码');
      loadAllData();
    } catch (err) {
      message.error('操作失败，请重试');
      console.error('审核通过报错：', err);
    } finally {
      setPassLoadingId(null);
    }
  };

  // 打开驳回弹窗
  const openReject = (id: number) => {
    setCurrentId(id);
    setRejectReason('');
    setRejectModal(true);
  };

  // 确认驳回
  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setRejectModalLoading(true);
    try {
      await http.put('/api/visitor/audit',
        {
          id: currentId,
          applyStatus: 3,
          rejectReason
        },
        getHeader()
      );
      message.success('已驳回该预约');
      setRejectModal(false);
      loadAllData();
    } catch (err) {
      message.error('驳回失败，请重试');
      console.error('驳回预约报错：', err);
    } finally {
      setRejectModalLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 手动标注列类型，解决TS类型不匹配
  const columns: ColumnType<AllItem>[] = [
    {
      title: '访客姓名',
      dataIndex: 'visitorName',
      width: 120,
      align: 'center'
    },
    {
      title: '访客手机号',
      dataIndex: 'visitorPhone',
      width: 140,
      align: 'center'
    },
    {
      title: '来访事由',
      dataIndex: 'visitReason',
      ellipsis: true
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 170,
      align: 'center'
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 170,
      align: 'center'
    },
    {
      title: '状态',
      dataIndex: 'applyStatus',
      width: 180,
      align: 'center',
      render: (status: number, record: AllItem) => {
        let tagNode;
        if (status === 1) {
          tagNode = <Tag color="gold">待审核</Tag>;
        } else if (status === 2) {
          tagNode = <Tag color="green">已通过</Tag>;
        } else if (status === 3) {
          tagNode = <Tag color="red">已驳回</Tag>;
        } else {
          tagNode = <Tag>未知</Tag>;
        }

        if (status === 1) {
          return (
            <Space size={8}>
              {tagNode}
              <Button
                size="small"
                type="primary"
                loading={passLoadingId === record.id}
                onClick={() => handlePass(record.id)}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                onClick={() => openReject(record.id)}
                disabled={passLoadingId !== null}
              >
                驳回
              </Button>
            </Space>
          );
        }
        return tagNode;
      }
    },
    {
      title: '驳回原因',
      dataIndex: 'rejectReason',
      width: 220,
      ellipsis: true,
      align: 'center'
    }
  ];

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
        <Title level={4} style={{ margin: 0 }}>全部访客预约记录</Title>
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
          locale={{ emptyText: '暂无预约数据' }}
        />
      </Card>

      {/* 驳回弹窗 */}
      <Modal
        title="填写驳回原因"
        open={rejectModal}
        onOk={confirmReject}
        onCancel={() => setRejectModal(false)}
        confirmLoading={rejectModalLoading}
        maskClosable={false}
      >
        <Input.TextArea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={4}
          placeholder="请输入驳回原因（必填）"
          maxLength={200}
        />
      </Modal>
    </div>
  );
};

export default AllVisitorPage;
