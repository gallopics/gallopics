import React, { useState, useEffect } from 'react';
import { PageHeader } from './PageHeader';
import { Footer } from './Footer';
import { ContactSupportModal } from './ContactSupportModal';

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children }) => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const handleContact = () => setIsContactOpen(true);
    window.addEventListener('open-contact-support', handleContact);
    return () =>
      window.removeEventListener('open-contact-support', handleContact);
  }, []);

  return (
    <div className="page-wrapper ehome-page info-page">
      <PageHeader />
      {children}
      <Footer minimal={true} noLinks={true} />
      <ContactSupportModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};
