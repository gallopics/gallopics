import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { CheckCircle } from 'lucide-react';

export const OnboardingReady: React.FC = () => {
  const navigate = useNavigate();

  const handleFinish = () => {
    // User is already signed in from previous steps
    navigate('/pg'); // Go to Workspace
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <div className="w-full max-w-[520px] mx-auto px-5 text-center pt-[80px] pb-[60px]">
        <div className="flex-center mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full mb-[var(--spacing-lg)]">
          <CheckCircle size={32} />
        </div>

        <h1 className="text-primary text-[1.875rem] font-bold mb-[var(--spacing-md)]">
          You're ready to start
        </h1>
        <p className="text-secondary mb-[40px] text-[1.1rem]">
          You can now upload galleries, manage events, and customize your
          storefront.
        </p>

        <button
          className="auth-btn-primary mx-auto max-w-[320px]"
          onClick={handleFinish}
        >
          Go to Workspace
        </button>
      </div>
    </div>
  );
};
