import React from 'react';
import { Download } from 'lucide-react';
import { TitleHeader } from '../../components/TitleHeader';

export const Receipts: React.FC = () => {
  const mockReceipts = [
    {
      id: 'REC-001',
      date: '2026-01-15',
      amount: '€1,250.00',
      status: 'Paid',
      description: 'Payout for Dec 2025',
    },
    {
      id: 'REC-002',
      date: '2025-12-15',
      amount: '€850.00',
      status: 'Paid',
      description: 'Payout for Nov 2025',
    },
    {
      id: 'REC-003',
      date: '2025-11-15',
      amount: '€2,100.00',
      status: 'Paid',
      description: 'Payout for Oct 2025',
    },
  ];

  return (
    <div className="w-full">
      <TitleHeader
        variant="workspace"
        title="Receipts"
        subtitle="Download and manage your payout receipts and invoices."
      />

      <div className="pg-page-body">
        {/* Receipts Table */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden max-w-[800px] mb-6 mx-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-[var(--ui-bg-subtle)]">
              <tr>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide">
                  ID
                </th>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Date
                </th>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Description
                </th>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3.5 text-[0.75rem] font-500 text-[var(--color-text-secondary)] uppercase tracking-wide text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockReceipts.map(receipt => (
                <tr
                  key={receipt.id}
                  className="border-b border-[var(--ui-bg-subtle)] last:border-0"
                >
                  <td className="px-5 py-4 text-[0.875rem] text-[var(--color-text-secondary)] font-medium">
                    {receipt.id}
                  </td>
                  <td className="px-5 py-4 text-[0.875rem] text-[var(--color-text-secondary)]">
                    {receipt.date}
                  </td>
                  <td className="px-5 py-4 text-[0.875rem] text-[var(--color-text-primary)]">
                    {receipt.description}
                  </td>
                  <td className="px-5 py-4 text-[0.875rem] text-[var(--color-text-primary)] font-semibold">
                    {receipt.amount}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[0.75rem] font-medium bg-[var(--color-success-tint)] text-[var(--color-success)]">
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="inline-flex items-center gap-1.5 text-[0.875rem] text-[var(--color-brand-primary)] font-medium bg-transparent border-0 cursor-pointer hover:opacity-75">
                      <Download size={15} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payout Details */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 max-w-[800px] mb-6 mx-auto">
          <div className="mb-3">
            <h2 className="text-[1.125rem] font-semibold text-[var(--color-text-primary)] mb-1.5">
              Payout Details
            </h2>
            <p className="text-[0.875rem] text-[var(--color-text-secondary)] leading-[1.6]">
              Payouts are processed automatically on the 15th of every month for
              the previous month's sales.
            </p>
          </div>
          <button className="pg-btn pg-btn-secondary mt-2">
            Update payout method
          </button>
        </div>
      </div>
    </div>
  );
};
