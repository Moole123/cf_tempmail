import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import HeaderMailbox from './HeaderMailbox';
import Container from './Container';
import { EMAIL_DOMAIN } from '../config';

interface HeaderProps {
  mailbox: Mailbox | null;
  onMailboxChange?: (mailbox: Mailbox) => void;
  isLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  mailbox = null, 
  onMailboxChange = () => {}, 
  isLoading = false 
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="border-b">
      <Container>
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="text-2xl font-bold">
            {t('app.title')}
          </Link>
          
          {mailbox && (
            <div className="flex items-center bg-muted/70 rounded-md px-3 py-1.5">
              <HeaderMailbox 
                mailbox={mailbox} 
                onMailboxChange={onMailboxChange}
                domain={EMAIL_DOMAIN}
                isLoading={isLoading}
              />
              <div className="ml-3 pl-3 border-l border-muted-foreground/20 flex items-center">
                <LanguageSwitcher />
                <a
                  href="https://github.com/zaunist/zmail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-primary/20 hover:text-primary hover:scale-110 ml-1"
                  aria-label="GitHub"
                  title="GitHub"
                >
                  <i className="fab fa-github text-base"></i>
                </a>
              </div>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
};

export default Header; 