import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { Trash2, ArrowLeft, ShoppingBag, Check, Eye } from 'lucide-react';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { photos as mockPhotos, COMPETITIONS } from '../data/mockData';
import { PhotoCard } from '../components/PhotoCard';
import { QUALITY_TIERS } from '../constants/qualityTiers';

export function Cart() {
  const { cart, addToCart, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddToCart = (photo: any) => {
    // Default to high quality tier
    const tier = QUALITY_TIERS.find(t => t.id === 'high') || QUALITY_TIERS[1];
    const exists = cart.some(
      item => item.photoId === photo.id && item.quality === tier.id,
    );

    if (exists) {
      setToast({ message: 'Already in cart' });
    } else {
      addToCart(photo, tier.id, tier.label, tier.price);
      setToast({ message: 'Added to cart' });
    }
  };

  const fromPath = searchParams.get('from');

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [];

    if (fromPath) {
      const decoded = decodeURIComponent(fromPath);
      // Handle /event/:id
      if (decoded.includes('/event/')) {
        const eventId = decoded.split('/event/')[1]?.split('?')[0];
        const event = COMPETITIONS.find(c => c.id === eventId);
        if (event) {
          items.push({ label: event.name, onClick: () => navigate(decoded) });
        } else {
          items.push({ label: 'Events', onClick: () => navigate('/') });
        }
      }
      // Handle /photo/:id
      else if (decoded.includes('/photo/')) {
        const photoId = decoded.split('/photo/')[1]?.split('?')[0];
        const photo = mockPhotos.find(p => p.id === photoId);
        if (photo) {
          const event = COMPETITIONS.find(c => c.id === photo.eventId);
          if (event) {
            items.push({
              label: event.name,
              onClick: () => navigate(`/event/${event.id}`),
            });
            items.push({
              label: 'Photo detail',
              onClick: () => navigate(decoded),
            });
          } else {
            items.push({
              label: 'Photo detail',
              onClick: () => navigate(decoded),
            });
          }
        } else {
          items.push({ label: 'Events', onClick: () => navigate('/') });
        }
      }
      // Handle /photographer/:id
      else if (decoded.includes('/photographer/')) {
        items.push({ label: 'Photographer', onClick: () => navigate(decoded) });
      } else {
        items.push({ label: 'Events', onClick: () => navigate('/') });
      }
    } else {
      items.push({ label: 'Events', onClick: () => navigate('/') });
    }

    items.push({ label: 'Cart', active: true });
    return items;
  }, [fromPath, navigate]);

  const handlePay = () => {
    setIsSuccess(true);
    clearCart();
  };

  const recentPhotos = useMemo(() => {
    const saved = localStorage.getItem('gallopics_recent');
    const ids: string[] = saved ? JSON.parse(saved) : [];
    return ids
      .map(id => mockPhotos.find(p => p.id === id))
      .filter((p): p is (typeof mockPhotos)[0] => !!p);
  }, []);

  return (
    <div className="page-wrapper">
      <Header />

      <div className="cart-header-group">
        <Breadcrumbs items={breadcrumbs} />
        {!isSuccess && (
          <div className="bg-[var(--color-surface)] pb-6 max-md:pb-5 border-b border-[var(--color-border)]">
            <div className="container">
              <h1 className="text-[1.75rem] max-md:text-[1.375rem] font-extrabold mb-0 text-[var(--color-text-primary)] leading-[1.2]">
                Cart
              </h1>
            </div>
          </div>
        )}
      </div>

      <main className="pt-10 pb-20 max-md:pt-6 max-md:pb-[60px] flex-1">
        <div className="container">
          {isSuccess ? (
            <div className="flex flex-col gap-[60px]">
              <div className="flex justify-center py-[60px]">
                <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] px-10 py-[60px] max-w-[500px] w-full text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                  <div className="w-[100px] h-[100px] bg-[var(--color-success-tint)] text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-8">
                    <Check size={64} />
                  </div>
                  <h1 className="text-[2rem] font-extrabold mb-4">
                    Payment Successful!
                  </h1>
                  <p className="text-[var(--color-text-secondary)] leading-[1.6] mb-10">
                    Thank you for your purchase. We've sent a delivery email
                    with your download links to your inbox.
                  </p>

                  <div className="flex flex-col gap-4">
                    <button
                      className="py-[14px] px-8 bg-black text-white border-none rounded-[var(--radius-full)] font-semibold cursor-pointer transition-all duration-200 ease-in-out hover:bg-[var(--color-text-primary)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                      onClick={() => navigate('/')}
                    >
                      Continue browsing
                    </button>
                    <p className="text-[0.8125rem] text-[var(--color-text-secondary)] opacity-70">
                      Download links are active for 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {recentPhotos.length > 0 && (
                <div className="mt-8 border-t border-black/[0.06] pt-6 hidden md:block">
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <Eye
                        size={20}
                        className="text-[var(--color-text-secondary)] opacity-70 w-[18px] h-[18px]"
                      />
                      <h2 className="text-[0.875rem] font-semibold text-[var(--color-text-secondary)] m-0 tracking-[0.02em]">
                        Recently viewed
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {recentPhotos.map((photo: any) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onClick={() =>
                          navigate(
                            `/photo/${photo.id}?from=cart&eventId=${photo.eventId}`,
                          )
                        }
                        onAddToCart={() => handleAddToCart(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col gap-[60px]">
              <div className="text-center py-24 max-w-[480px] mx-auto">
                <div className="flex justify-center text-[var(--color-border)] mb-6">
                  <ShoppingBag size={52} />
                </div>
                <h2 className="text-[1.5rem] font-bold mb-3 text-[var(--color-text-primary)]">
                  Your cart is empty
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                  Browse our events to find your best moments captured on
                  camera.
                </p>
                <button
                  className="py-[14px] px-8 bg-[var(--color-brand-primary)] text-white border-none rounded-[var(--radius-full)] font-semibold cursor-pointer transition-all duration-200 ease-in-out hover:bg-[var(--color-brand-hover)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(27,58,236,0.25)]"
                  onClick={() => navigate('/')}
                >
                  Start browsing
                </button>
              </div>

              {recentPhotos.length > 0 && (
                <div className="mt-8 border-t border-black/[0.06] pt-6 hidden md:block">
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <Eye
                        size={20}
                        className="text-[var(--color-text-secondary)] opacity-70 w-[18px] h-[18px]"
                      />
                      <h2 className="text-[0.875rem] font-semibold text-[var(--color-text-secondary)] m-0 tracking-[0.02em]">
                        Recently viewed
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {recentPhotos.map((photo: any) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onClick={() =>
                          navigate(
                            `/photo/${photo.id}?from=cart&eventId=${photo.eventId}`,
                          )
                        }
                        onAddToCart={() => handleAddToCart(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 max-lg:grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
              <div className="cart-items-section">
                <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden mb-6">
                  {cart.map(item => (
                    <div
                      key={item.cartId}
                      className="flex max-sm:flex-col gap-6 max-sm:gap-4 p-6 border-b border-[var(--color-border)] transition-all duration-200 cursor-pointer last:border-b-0 hover:bg-[var(--ui-bg-subtle)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:z-[1] hover:border-transparent"
                      onClick={() =>
                        navigate(
                          `/photo/${item.photoId}?from=cart&eventId=${item.photo.eventId}`,
                        )
                      }
                    >
                      <div className="w-[120px] max-sm:w-full h-[90px] max-sm:h-[180px] rounded-[var(--radius-md)] overflow-hidden flex-shrink-0 bg-[var(--ui-bg-subtle)]">
                        <img
                          src={item.photo.src}
                          alt={item.photo.rider}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex max-sm:flex-col justify-between max-sm:gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-[0.75rem] font-bold text-[var(--color-text-secondary)] tracking-[0.05em]">
                            #{item.photoId.toUpperCase()}
                          </div>
                          <h3 className="text-[1rem] font-bold text-[var(--color-text-primary)] m-0">
                            {item.photo.rider} / {item.photo.horse}
                          </h3>
                          <div className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                            {item.photo.event}
                          </div>
                          <div className="text-[0.75rem] text-[var(--color-text-secondary)] bg-[var(--ui-bg-subtle)] px-2 py-0.5 rounded-[4px] inline-block w-fit mt-1">
                            {item.qualityLabel}
                          </div>
                        </div>
                        <div
                          className="flex flex-col max-sm:flex-row items-end max-sm:items-center justify-between"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="text-[1.125rem] font-bold text-[var(--color-text-primary)]">
                            {item.price} SEK
                          </div>
                          <button
                            className="bg-none border-none text-[var(--color-danger)] cursor-pointer p-2 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)]"
                            onClick={() => removeFromCart(item.cartId)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="bg-none border-none flex items-center gap-2 text-[0.875rem] font-semibold text-[var(--color-text-secondary)] cursor-pointer py-2 px-0 transition-colors duration-200 ease-in-out hover:text-[var(--color-text-primary)]"
                  onClick={() =>
                    fromPath
                      ? navigate(decodeURIComponent(fromPath))
                      : navigate(-1)
                  }
                >
                  <ArrowLeft size={18} />
                  Continue browsing
                </button>

                {recentPhotos.length > 0 && (
                  <div className="mt-8 border-t border-black/[0.06] pt-6 hidden md:block">
                    <div className="mb-5">
                      <div className="flex items-center gap-2">
                        <Eye
                          size={20}
                          className="text-[var(--color-text-secondary)] opacity-70 w-[18px] h-[18px]"
                        />
                        <h2 className="text-[0.875rem] font-semibold text-[var(--color-text-secondary)] m-0 tracking-[0.02em]">
                          Recently viewed
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {recentPhotos.map((photo: any) => (
                        <PhotoCard
                          key={photo.id}
                          photo={photo}
                          onClick={() =>
                            navigate(
                              `/photo/${photo.id}?from=cart&eventId=${photo.eventId}`,
                            )
                          }
                          onAddToCart={() => handleAddToCart(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="cart-summary-section max-lg:order-2 max-lg:mt-6 max-md:order-[2] max-md:mt-6 max-md:mb-0">
                <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 max-lg:static sticky top-[100px]">
                  <CheckoutPanel total={total} onPay={handlePay} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-text-primary)] text-white px-6 py-3 rounded-[99px] flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000] animate-[fadeUp_0.3s_ease-out]">
          <span>{toast.message}</span>
        </div>
      )}

      <Footer minimal={true} />
    </div>
  );
}
