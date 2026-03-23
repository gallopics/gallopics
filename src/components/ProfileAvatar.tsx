import React from 'react';
import { User, Camera } from 'lucide-react';
import { RiderIcon } from './icons/RiderIcon';
import { HorseIcon } from './icons/HorseIcon';

export interface ProfileAvatarProps {
    variant?: 'rider' | 'horse' | 'photographer' | 'default';
    url?: string;
    name?: string;
    size?: number;
    className?: string;
}

const variantClasses: Record<string, string> = {
    rider: 'text-[#7c3aed] bg-[rgba(124,58,237,0.15)] border-[rgba(124,58,237,0.2)]',
    horse: 'text-[#ea580c] bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.2)]',
    photographer: 'text-[var(--color-text-secondary)] bg-[var(--ui-bg-subtle)] border-[rgba(0,0,0,0.04)]',
    default: 'text-[var(--color-text-secondary)] bg-[var(--ui-bg-subtle)] border-[rgba(0,0,0,0.04)]',
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    variant = 'default',
    url,
    name,
    size = 40,
    className = ''
}) => {
    const [imgError, setImgError] = React.useState(false);

    const renderContent = () => {
        if (url && !imgError) {
            return (
                <img
                    src={url}
                    alt={name || ''}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                />
            );
        }

        switch (variant) {
            case 'rider':
                return <RiderIcon size={size * 0.65} />;
            case 'horse':
                return <HorseIcon size={size * 0.65} />;
            case 'photographer':
                return <Camera size={size * 0.6} />;
            default:
                return <User size={size * 0.6} />;
        }
    };

    return (
        <div
            className={[
                'flex items-center justify-center rounded-full overflow-hidden',
                'flex-shrink-0 border transition-all duration-200 ease-in-out',
                variantClasses[variant] || variantClasses.default,
                className,
            ].join(' ')}
            style={{ width: size, height: size }}
        >
            {renderContent()}
        </div>
    );
};
