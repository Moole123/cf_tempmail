import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import MailboxInfo from '../components/MailboxInfo';
import { API_BASE_URL } from '../config';
import { MailboxContext } from '../contexts/MailboxContext';

const MailboxPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    emails, 
    isEmailsLoading, 
    autoRefresh, 
    setAutoRefresh 
  } = useContext(MailboxContext);
  
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  
  // 清除提示的定时器
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);
  
  // 获取邮箱信息
  useEffect(() => {
    if (!address) return;
    
    const fetchMailbox = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/mailboxes/${address}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMessage(t('mailbox.invalidAddress'));
            
            // 3秒后导航到首页
            if (errorTimeoutRef.current) {
              window.clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = window.setTimeout(() => {
              navigate('/');
            }, 3000);
            return;
          }
          throw new Error('Failed to fetch mailbox');
        }
        
        const data = await response.json();
        if (data.success) {
          setMailbox(data.mailbox);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error) {
        setErrorMessage(String(error));
        
        // 3秒后清除错误信息
        if (errorTimeoutRef.current) {
          window.clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = window.setTimeout(() => {
          setErrorMessage(null);
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMailbox();
  }, [address, navigate, t]);
  
  // 处理删除邮箱
  const handleDeleteMailbox = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/mailboxes/${address}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete mailbox');
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(t('mailbox.deleteSuccess'));
        
        // 2秒后导航到首页
        if (successTimeoutRef.current) {
          window.clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = window.setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      setErrorMessage(t('mailbox.deleteFailed'));
      
      // 3秒后清除错误信息
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = window.setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    }
  };
  
  return (
    <div className="flex flex-col space-y-6">
      {/* 错误和成功提示 */}
      {(errorMessage || successMessage) && (
        <div className={`p-3 rounded-md ${errorMessage ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {errorMessage || successMessage}
        </div>
      )}
      
      {mailbox && (
        <MailboxInfo 
          mailbox={mailbox} 
          onDelete={handleDeleteMailbox}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <EmailList 
            emails={emails} 
            selectedEmailId={selectedEmail}
            onSelectEmail={setSelectedEmail}
            isLoading={isLoading}
          />
        </div>
        <div className="md:col-span-2">
          {selectedEmail ? (
            <EmailDetail 
              emailId={selectedEmail} 
              onClose={() => setSelectedEmail(null)}
            />
          ) : (
            <div className="border rounded-lg p-6 h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                {emails.length > 0 
                  ? t('email.selectEmailPrompt') 
                  : t('email.emptyInbox')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailboxPage; 