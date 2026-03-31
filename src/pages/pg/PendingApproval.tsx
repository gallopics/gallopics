import React from 'react';
import { Clock3, ShieldCheck, RefreshCw, House } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

export const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshMessage, setRefreshMessage] = React.useState<string | null>(
    null
  );

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      if (clerkUser) {
        await clerkUser.reload();

        const publicApprovalStatus =
          typeof clerkUser.publicMetadata?.approvalStatus === 'string'
            ? clerkUser.publicMetadata.approvalStatus
            : undefined;
        const unsafeApprovalStatus =
          typeof clerkUser.unsafeMetadata?.approvalStatus === 'string'
            ? clerkUser.unsafeMetadata.approvalStatus
            : undefined;
        const approvalStatus = publicApprovalStatus ?? unsafeApprovalStatus;

        if (approvalStatus === 'approved') {
          window.location.assign('/pg/events');
          return;
        }
      }

      setRefreshMessage(
        'Approval is still pending. If you just changed Clerk metadata, wait a moment and try again.'
      );
    } catch {
      setRefreshMessage(
        'Unable to refresh approval status right now. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />

      <section className="pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_360px] gap-6 items-stretch">
            <div className="hero-card !min-h-[420px]">
              <div className="max-w-[620px] flex flex-col gap-5">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white/90 text-sm font-medium backdrop-blur">
                  <Clock3 size={16} />
                  Photographer access review
                </div>

                <div className="flex flex-col gap-4">
                  <h1 className="font-['Sora',sans-serif] text-5xl max-md:text-[2.75rem] max-[375px]:text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white m-0">
                    Approval pending
                  </h1>
                  <p className="text-white/90 text-[1.05rem] leading-[1.75] m-0 max-w-[56ch]">
                    {user?.displayName || 'Your account'} is registered and
                    ready. A Gallopics admin just needs to approve photographer
                    workspace access before you can start uploading galleries
                    and managing events.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    className="mt-0 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                  >
                    <RefreshCw size={16} />
                    {isRefreshing ? 'Checking status...' : 'Refresh status'}
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white text-[0.95rem] font-semibold text-[var(--color-text-primary)] px-6 transition-all duration-200 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => navigate('/')}
                    disabled={isRefreshing}
                  >
                    <House size={16} />
                    Back to home
                  </button>
                </div>

                {refreshMessage ? (
                  <p className="text-white/75 text-sm leading-[1.6] m-0">
                    {refreshMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <aside className="card p-6 md:p-7 flex flex-col gap-5 self-stretch">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg)] text-[var(--color-brand-primary)] flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="text-primary text-[1.25rem] font-semibold leading-[1.2] m-0">
                  What happens next
                </h2>
                <p className="text-secondary text-[0.95rem] leading-[1.65] mt-3 mb-0">
                  We review new photographer accounts before unlocking the
                  studio. Once approved by admin, your access will update after
                  a refresh or a new sign-in.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <div className="text-primary text-sm font-semibold">
                    1. Account created
                  </div>
                  <div className="text-secondary text-sm leading-[1.6] mt-1">
                    Your photographer profile is now registered in Gallopics.
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <div className="text-primary text-sm font-semibold">
                    2. Admin approval
                  </div>
                  <div className="text-secondary text-sm leading-[1.6] mt-1">
                    A Gallopics admin approves photographer access.
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <div className="text-primary text-sm font-semibold">
                    3. Studio unlocked
                  </div>
                  <div className="text-secondary text-sm leading-[1.6] mt-1">
                    Use refresh status here, or sign in again, to enter your
                    workspace.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};
