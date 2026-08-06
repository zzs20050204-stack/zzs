import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Work from '../../components/footer';
import TopMenu from '../../components/navLeft';
import FloatingAI from '../../components/FloatingAI';

import { componentMap } from '../../router/routerMap';

const { Header, Content, Footer } = Layout;

function Home() {
  const { currentKey, currentTitle } = useSelector((state: RootState) => state.menu);

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const currentYear = new Date().getFullYear();

  const renderPage = () => {
    if (currentKey === '1') return <Work />;
    return componentMap[currentKey as string] || <div>🚧 页面开发中...</div>;
  };

  return (
    <Layout style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* 导航栏 - 全屏铺满，无任何内边距 */}
      <Header 
        style={{ 
          padding: 0, 
          margin: 0, 
          height: 'auto', 
          lineHeight: 0,
          border: 0,
        }}
      >
        <TopMenu />
      </Header>

      {/* 内容区域 - 全屏无间距 */}
      <Content 
        style={{ 
          margin: 0, 
          padding: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            height: '100%',
            minHeight: 'calc(100vh - 180px)',
            padding: 0,
            margin: 0,
            background: 'transparent',
          }}
        >
          {renderPage()}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', margin: 0, padding: '16px 0' }}>
        智慧社区 ©{currentYear}
      </Footer>

      {/* 浮动AI助手小人 - 所有页面可见 */}
      <FloatingAI />
    </Layout>
  );
};

export default Home;