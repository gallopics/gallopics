import { ShieldCheck, LayoutDashboard, Settings } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
    const benefits = [
        {
            icon: <LayoutDashboard size={24} />,
            title: "Easy to find your photos",
            body: "Search by competition and browse galleries smoothly."
        },
        {
            icon: <ShieldCheck size={24} />,
            title: "Secure payment & instant delivery",
            body: "Pay online and download your images immediately."
        },
        {
            icon: <Settings size={24} />,
            title: "All-in-one for photographers",
            body: "Bookings, uploads, orders and receipts in one place."
        }
    ];

    return (
        <section className="pb-6 bg-transparent">
            <div className="container">
                <div className="grid grid-cols-3 gap-6 items-stretch max-lg:grid-cols-2 max-lg:gap-5 max-[640px]:hidden">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="group flex items-center gap-5 p-6 max-[640px]:p-5 max-[640px]:gap-4 bg-white border border-black/[0.05] rounded-[32px] max-[640px]:rounded-3xl transition-[translate,box-shadow] duration-300 ease-in-out shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                            <div className="w-11 h-11 rounded-[99px] bg-[var(--ui-bg-subtle)] text-[var(--color-text-primary)] flex items-center justify-center flex-shrink-0 border border-black/[0.02] transition-[background-color,color,border-color] duration-300 ease-in-out group-hover:bg-[var(--color-text-primary)] group-hover:text-white group-hover:border-[var(--color-text-primary)]">
                                {benefit.icon}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="font-['Sora',sans-serif] text-[1.0625rem] font-semibold text-[var(--color-text-primary)] m-0 leading-[1.2]">{benefit.title}</h3>
                                <p className="text-[0.875rem] leading-[1.4] text-[var(--color-text-secondary)] m-0 line-clamp-2">{benefit.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden"></div>
            </div>
        </section>
    );
};
