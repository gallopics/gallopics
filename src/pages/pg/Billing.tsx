import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { TitleHeader } from '../../components/TitleHeader';

export const PhotographerBilling: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'SE', // Default to Sweden
  });

  const handleSave = () => {
    // Mock save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass =
    'w-full h-11 px-4 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-base text-[var(--color-text-primary)] bg-white transition-all duration-200 focus:outline-none focus:border-[var(--color-brand-primary)] focus:shadow-[0_0_0_3px_var(--color-brand-tint)]';
  const selectClass = `${inputClass} appearance-none pr-10`;

  return (
    <div className="w-full">
      <TitleHeader variant="workspace" title="Billing Details" />

      <div className="pg-page-body">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 max-w-[800px] mb-6 mx-auto">
          <div className="mb-6">
            <h2 className="text-[1.125rem] font-semibold text-[var(--color-text-primary)] mb-2">
              Billing Address
            </h2>
            <p className="text-[0.875rem] text-[var(--color-text-secondary)] leading-[1.5]">
              This address is used for tax purposes and your invoices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 text-left col-span-2">
              <label className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">
                Street Address
              </label>
              <input
                name="street"
                className={inputClass}
                placeholder="e.g. 123 Main St, Apt 4B"
                value={formData.street}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">
                City
              </label>
              <input
                name="city"
                className={inputClass}
                placeholder="New York"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">
                State / Province
              </label>
              <input
                name="state"
                className={inputClass}
                placeholder="NY"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">
                Zip / Postal Code
              </label>
              <input
                name="zip"
                className={inputClass}
                placeholder="10001"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">
                Country
              </label>
              <div className="relative">
                <select
                  name="country"
                  className={selectClass}
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="SE">Sweden</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div className="col-span-2 mt-4 flex justify-end">
              <button className="pg-btn pg-btn-primary" onClick={handleSave}>
                {saved ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 max-w-[800px] my-6 mx-auto">
          <div className="mb-6">
            <h2 className="text-[1.125rem] font-semibold text-[var(--color-text-primary)] mb-2">
              Payout Method
            </h2>
            <p className="text-[0.875rem] text-[var(--color-text-secondary)] leading-[1.5]">
              Connect your bank account or debit card to receive earnings.
            </p>
          </div>
          <div className="p-6 bg-[var(--ui-bg-subtle)] rounded-lg text-center border border-dashed border-[var(--color-border)]">
            <p className="font-medium text-[var(--color-text-primary)]">
              Stripe Connect Integration
            </p>
            <p className="text-[0.875rem] text-[var(--color-text-secondary)] mt-1">
              This module will be implemented next.
            </p>
            <button className="pg-btn pg-btn-secondary mt-4" disabled>
              Connect Stripe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
