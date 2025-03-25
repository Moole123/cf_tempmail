import React, { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import SEO from './SEO';
import { MailboxContext } from '../contexts/MailboxContext';

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const { mailbox, setMailbox, isLoading } = useContext(MailboxContext);
  const location = useLocation();
  
  // 根据当前路径设置不同的SEO信息
  const getSEOProps = () => {
    const path = location.pathname;
    
    // 默认SEO属性
    const defaultProps = {
      title: 'ZMAIL-24小时匿名邮箱',
      description: '创建临时邮箱地址，接收邮件，无需注册，保护您的隐私安全',
      keywords: '临时邮箱,匿名邮箱,一次性邮箱,隐私保护,电子邮件,ZMAIL',
    };
    
    // 如果有邮箱信息，添加到标题中
    if (mailbox) {
      return {
        ...defaultProps,
        title: `ZMAIL-24小时匿名邮箱`,
        description: `查看 ${mailbox} 的临时邮箱收件箱，接收邮件，无需注册，保护您的隐私安全`,
      };
    }
    
    return defaultProps;
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <SEO {...getSEOProps()} />
      <Header 
        mailbox={mailbox} 
        onMailboxChange={setMailbox} 
        isLoading={isLoading}
      />
      <main className="flex-1 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 