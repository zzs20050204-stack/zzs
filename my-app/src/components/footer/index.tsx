import { Card, Typography, Carousel, Row, Col, Empty, Skeleton, Statistic } from 'antd';
import {
  NotificationOutlined,
  WarningOutlined,
  PayCircleOutlined,
  UsergroupAddOutlined,
  MessageOutlined,
  RightOutlined,
  ShopOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setMenuKey } from '../../utils/menuSlice';
import http from '../../utils/http/http';
import home1 from '../../assets/home1.jpg';
import home2 from '../../assets/home2.jpg';
import home3 from '../../assets/home3.jpg';
import './index.scss';

const { Text, Title, Paragraph } = Typography;

interface Notice {
  id: number;
  title: string;
  content: string;
  createTime: string;
}

interface HomeStats {
  userCount: number;
  orderCount: number;
  repairTotal: number;
  noticeCount: number;
}

const bannerImgs: string[] = [home1, home2, home3];

const bannerTexts = [
  { title: '欢迎来到智慧社区', desc: '提升服务品质，开启便利生活，助力智慧城市！' },
  { title: '智慧物业，贴心服务', desc: '在线报修、物业缴费，一站式社区服务体验' },
  { title: '共建美好家园', desc: '邻里互动、社区公告，让生活更便捷更温暖' },
];

const quickServices = [
  { key: '/goods', icon: <ShopOutlined />, label: '社区商超', color: '#eb2f96', bg: '#fff0f6' },
  { key: '/repair', icon: <WarningOutlined />, label: '在线报修', color: '#ff4d4f', bg: '#fff2f0' },
  { key: '/property', icon: <PayCircleOutlined />, label: '物业缴费', color: '#722ed1', bg: '#f9f0ff' },
  { key: '/visitor', icon: <UsergroupAddOutlined />, label: '访客预约', color: '#1890ff', bg: '#e6f7ff' },
  { key: '/notices', icon: <NotificationOutlined />, label: '社区公告', color: '#55c4ae', bg: '#e6fffb' },
  { key: '/suggestion', icon: <MessageOutlined />, label: '建议反馈', color: '#52c41a', bg: '#f6ffed' },
];

function Work() {
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [stats, setStats] = useState<HomeStats>({ userCount: 0, orderCount: 0, repairTotal: 0, noticeCount: 0 });
  const dispatch = useDispatch();

  useEffect(() => {
    const getNotices = async () => {
      setNoticeLoading(true);
      try {
        const res = await http.get('/notice/user/list');
        if (res.data.code === 200) {
          setNoticeList(res.data.data.slice(0, 5));
        }
      } catch {
        // 公告加载失败不影响首页展示
      } finally {
        setNoticeLoading(false);
      }
    };
    const getStats = async () => {
      try {
        const res = await http.get('/dashboard/statistics');
        if (res.data.code === 200) {
          const d = res.data.data;
          setStats({
            userCount: d.userCount || 0,
            orderCount: d.orderCount || 0,
            repairTotal: d.repairTotal || 0,
            noticeCount: d.noticeCount || 0,
          });
        }
      } catch {
        // 统计加载失败不影响首页
      }
    };
    getNotices();
    getStats();
  }, []);

  const handleServiceClick = (key: string, label: string) => {
    dispatch(setMenuKey({ key, title: label }));
  };

  const statCards = [
    { title: '社区用户', value: stats.userCount, icon: <TeamOutlined />, color: '#1890ff', bg: '#e6f7ff' },
    { title: '订单总数', value: stats.orderCount, icon: <ShopOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: '报修记录', value: stats.repairTotal, icon: <WarningOutlined />, color: '#faad14', bg: '#fffbe6' },
    { title: '社区公告', value: stats.noticeCount, icon: <NotificationOutlined />, color: '#55c4ae', bg: '#e6fffb' },
  ];

  return (
    <div className="home-wrap">
      {/* ====== 轮播区 ====== */}
      <div className="banner-section">
        <Carousel autoplay autoplaySpeed={4000} pauseOnHover effect="fade" className="banner-carousel">
          {bannerImgs.map((imgSrc: string, idx: number) => (
            <div key={idx} className="banner-slide">
              <img src={imgSrc} className="banner-img" alt="" />
              <div className="banner-overlay" />
              <div className="banner-text">
                <Title level={1} className="banner-title">{bannerTexts[idx].title}</Title>
                <Text className="banner-desc">{bannerTexts[idx].desc}</Text>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* ====== 数据统计条 ====== */}
      <div className="stats-strip">
        <div className="section-container">
          <Row gutter={[16, 16]}>
            {statCards.map((s, i) => (
              <Col xs={12} sm={6} key={i}>
                <Card variant="borderless" className="stat-card" style={{ backgroundColor: s.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: s.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {s.icon}
                    </div>
                    <Statistic title={s.title} value={s.value} styles={{ content: { fontSize: 24 } }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* ====== 快捷服务区 ====== */}
      <div className="service-section">
        <div className="section-container">
          <div className="section-header">
            <Title level={2} style={{ margin: 0 }}>快捷服务</Title>
            <Text type="secondary">一站式社区服务，让生活更便捷</Text>
          </div>
          <Row gutter={[20, 20]}>
            {quickServices.map((svc) => (
              <Col xs={12} sm={8} md={4} key={svc.key}>
                <Card
                  hoverable
                  className="service-card"
                  onClick={() => handleServiceClick(svc.key, svc.label)}
                >
                  <div className="service-icon" style={{ backgroundColor: svc.bg, color: svc.color }}>
                    {svc.icon}
                  </div>
                  <Text strong className="service-label">{svc.label}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* ====== 公告 + 介绍区 ====== */}
      <div className="info-section">
        <div className="section-container">
          <Row gutter={[24, 24]} className="info-row">
            <Col xs={24} md={14}>
              <Card
                title={
                  <span>
                    <NotificationOutlined style={{ color: '#55c4ae', marginRight: 8 }} />
                    最新社区公告
                  </span>
                }
                className="notice-card"
              >
                {noticeLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : noticeList.length === 0 ? (
                  <Empty description="暂无公告" />
                ) : (
                  <div className="notice-list">
                    {noticeList.map((item, idx) => (
                      <div key={item.id} className="notice-item">
                        <span className="notice-index">{idx + 1}</span>
                        <span className="notice-title">{item.title}</span>
                        <span className="notice-time">{item.createTime?.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} md={10}>
              <Card title="关于智慧社区" className="about-card">
                <Paragraph>
                  智慧社区管理平台致力于为居民提供便捷、高效的社区服务。
                  涵盖物业缴费、在线报修、访客预约、社区商超等功能模块，
                  让您足不出户即可享受全方位的社区生活服务。
                </Paragraph>
                <div className="about-features">
                  {['物业服务全覆盖', '报修响应更及时', '缴费管理更透明', '社区商超更便捷', '访客管理更安全'].map((f) => (
                    <div key={f} className="feature-tag">
                      <RightOutlined style={{ fontSize: 10, marginRight: 4 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

export default Work;
