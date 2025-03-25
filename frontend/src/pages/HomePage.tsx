import React, { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import EmailList from '../components/EmailList';
import { MailboxContext } from '../contexts/MailboxContext';
import Container from '../components/Container';

// 添加结构化数据组件
const StructuredData: React.FC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ZMAIL-24小时匿名邮箱",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "description": "创建临时邮箱地址，接收邮件，无需注册，保护您的隐私安全",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1024"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { 
    mailbox, 
    isLoading, 
    emails, 
    selectedEmail, 
    setSelectedEmail, 
    isEmailsLoading
  } = useContext(MailboxContext);
  
  // 使用ref来跟踪是否已经处理过404错误
  const handlingNotFoundRef = useRef(false);
  
  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <StructuredData />
      <EmailList 
        emails={emails} 
        selectedEmailId={selectedEmail}
        onSelectEmail={setSelectedEmail}
        isLoading={isEmailsLoading}
      />
    </Container>
  );
};

export default HomePage; 