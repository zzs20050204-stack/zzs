import { Card, Typography } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import http from '../../utils/http/http';
import homeImg from '../../assets/home.jpg';

const { Text, Title } = Typography;

interface Notice {
  id: number;
  title: string;
  content: string;
  createTime: string;
}

function Work() {
  const [noticeList, setNoticeList] = useState<Notice[]>([]);

  useEffect(() => {
    const getNotices = async () => {
      try {
        const res = await http.get('/notice/user/list');
        if (res.data.code === 200) {
          setNoticeList(res.data.data.slice(0, 10));
        }
      } catch (err) {
        console.log('获取公告失败', err);
      }
    };
    getNotices();
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '50vh',
          backgroundImage: `url(${homeImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '50px',
        }}
      >
        <div style={{ zIndex: 2 }}>
          {/* 第一行：大号字体 */}
          <Title
            level={1}
            style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '42px',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              margin: '0 0 16px 0',
            }}
          >
            欢迎来到智慧社区
          </Title>
          {/* 第二行：小号字体 */}
          <Text
            style={{
              color: '#fff',
              fontSize: '22px',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            提升服务品质，开启便利生活，助力智慧城市！
          </Text>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 1,
          }}
        />
      </div>

      <div style={{ padding: '24px' }}>
        <Card
          title="最新社区公告"
          variant="borderless"
          extra={<NotificationOutlined style={{ color: '#55c4ae' }} />}
        >
          {noticeList.length === 0 ? (
            <Text type="secondary">暂无公告</Text>
          ) : (
            noticeList.map((item) => <p key={item.id}>• {item.title}</p>)
          )}
        </Card>
      </div>
    </div>
  );
}

export default Work;