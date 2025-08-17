import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MailboxContext } from '../contexts/MailboxContext';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string | null) => void;
  isLoading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({ 
  emails, 
  selectedEmailId, 
  onSelectEmail,
  isLoading 
}) => {
  const { t } = useTranslation();
  const { autoRefresh, setAutoRefresh, refreshEmails, mailbox } = useContext(MailboxContext);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const calculateTimeLeft = (expiresAt: number) => {
    if (!expiresAt) return '';
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeftSeconds = expiresAt - now;
    
    if (timeLeftSeconds <= 0) {
      return t('mailbox.expired');
    }
    
    const hours = Math.floor(timeLeftSeconds / 3600);
    const minutes = Math.floor((timeLeftSeconds % 3600) / 60);
    
    if (hours > 0) {
      return t('mailbox.expiresInTime', { hours, minutes });
    } else {
      return t('mailbox.expiresInMinutes', { minutes });
    }
  };
  
  const handleRefresh = () => {
    refreshEmails();
  };
  
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };
  
  if (isLoading) {
    return (
      <div className="navi-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-navi-primary">{t('email.inbox')}</h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="navi-card h-full flex flex-col">
      <div className="flex justify-between items-center p-4 navi-divider border-b">
        <h2 className="text-lg font-semibold text-navi-primary">{t('email.inbox')}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-md hover:bg-blue-50 text-navi-primary transition-colors"
            title={t('email.refresh')}
          >
            <i className="fas fa-sync-alt text-sm"></i>
          </button>
          <button
            onClick={toggleAutoRefresh}
            className={`p-2 rounded-md transition-colors ${
              autoRefresh
                ? 'text-navi-primary bg-blue-50'
                : 'text-navi-secondary hover:bg-blue-50 hover:text-navi-primary'
            }`}
            title={autoRefresh ? t('email.autoRefreshOn') : t('email.autoRefreshOff')}
          >
            <i className="fas fa-clock text-sm"></i>
          </button>
        </div>
      </div>
      
      {mailbox && (
        <div className="px-4 py-3 bg-blue-50/50 border-b text-xs text-navi-secondary">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">{t('mailbox.created')}:</span>
            <span>{formatFullDate(mailbox.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('mailbox.expiresAt')}:</span>
            <span>{formatFullDate(mailbox.expiresAt)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-medium">{t('mailbox.timeLeft')}:</span>
            <span className="text-navi-primary font-medium">{calculateTimeLeft(mailbox.expiresAt)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-4 py-2 bg-gray-50/50 border-b">
        <span className="text-sm text-navi-secondary font-medium">
          {emails.length} {emails.length === 1 ? t('email.message') : t('email.messages')}
        </span>
        <span className={`text-xs font-medium ${autoRefresh ? 'text-green-600' : 'text-navi-muted'}`}>
          {autoRefresh ? t('email.autoRefreshOn') : t('email.autoRefreshOff')}
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {emails.length === 0 ? (
          <div className="p-6 text-center text-navi-secondary h-full flex flex-col justify-center">
            <div className="mb-4">
              <i className="fas fa-inbox text-4xl text-navi-muted"></i>
            </div>
            <p className="text-lg font-medium">{t('email.emptyInbox')}</p>
            <p className="text-sm mt-2 text-navi-muted">{t('email.waitingForEmails')}</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-2">
            <div className="space-y-1">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`email-item p-3 cursor-pointer ${
                    selectedEmailId === email.id ? 'selected' : ''
                  } ${!email.isRead ? 'unread' : ''}`}
                  onClick={() => onSelectEmail(email.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`truncate text-sm ${!email.isRead ? 'font-semibold text-navi-primary' : 'text-navi-secondary'}`}>
                      {email.fromName || email.fromAddress}
                    </span>
                    <span className="text-xs text-navi-muted whitespace-nowrap ml-2">
                      {formatDate(email.receivedAt)}
                    </span>
                  </div>
                  <div className={`text-sm truncate mb-1 ${!email.isRead ? 'font-semibold email-subject' : 'text-navi-secondary'}`}>
                    {email.subject || t('email.noSubject')}
                  </div>
                  {email.hasAttachments && (
                    <div className="flex items-center">
                      <i className="fas fa-paperclip text-xs text-navi-primary"></i>
                      <span className="text-xs text-navi-muted ml-1">{t('email.hasAttachments')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList; 