import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { CheckCircle, CreditCard, ChevronRight } from 'lucide-react';

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

                <div
                    className="flex-center mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full mb-[var(--spacing-lg)]"
                >
                    <CheckCircle size={32} />
                </div>

                <h1 className="text-primary text-[1.875rem] font-bold mb-[var(--spacing-md)]">You're ready to start</h1>
                <p className="text-secondary mb-[40px] text-[1.1rem]">
                    You can now upload galleries, manage events, and customize your storefront.
                </p>

                {/* Non-blocking Payout Card */}
                <div className="card flex relative text-left p-[var(--spacing-lg)] mb-[var(--spacing-xl)] gap-[var(--spacing-md)]">
                    <div className="flex-center flex-shrink-0 text-secondary w-10 h-10 bg-[var(--color-bg)] rounded-[var(--radius-sm)]">
                        <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[length:var(--fs-base)] font-semibold mb-1">Complete payout setup to start selling</h3>
                        <p className="text-secondary text-[length:var(--fs-sm)]">You can upload photos now, but you'll need to add banking details before you can receive payments.</p>
                    </div>
                    <button
                        onClick={() => navigate('/pg/billing')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="Set up payouts"
                    />
                    <div className="flex items-center text-brand">
                        <span className="text-[length:var(--fs-sm)] font-medium">Set up</span>
                        <ChevronRight size={16} />
                    </div>
                </div>

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
