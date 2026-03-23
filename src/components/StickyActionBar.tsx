import React from 'react';
import { Upload, Maximize2 } from 'lucide-react';

export type StickyActionBarVariant = 'uploads' | 'published' | 'archive';

export interface SearchResult {
    id: string;
    type: 'rider' | 'horse' | 'photo';
    title: string;
    subtitle: string;
    photoSrc?: string;
    meta?: string; // e.g. "Rider", "Horse", "ID: 123"
    groupLabel?: string;
}

interface ActionFolder {
    id: string;
    label: string;
    count: number;
    color?: string; // Optional indicator
    isDuplicate?: boolean;
    title?: string;
    badgeLabel?: string | number;
}

export interface StickyActionBarProps {
    variant: StickyActionBarVariant;
    // Folders/Buckets
    folders?: ActionFolder[];
    activeFolderId?: string;
    onFolderChange?: (id: any) => void;
    // Search
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
    searchOptions?: SearchResult[];
    onSelect?: (val: string) => void;
    searchPlaceholder?: string;
    // Actions
    onUploadClick?: () => void;
    onExpandToggle: () => void;
    isExpanded: boolean;
    // Custom Actions (Optional extra buttons)
    actions?: React.ReactNode;
}
export const StickyActionBar: React.FC<StickyActionBarProps> = ({
    variant,
    folders = [],
    activeFolderId,
    onFolderChange,
    onUploadClick,
    onExpandToggle,
    isExpanded,
    actions
}) => {
    return (
        <div className="sticky-bar-wrapper">
            <div className={`sticky-bar-container variant-${variant}`}>
                {/* Left side: Content folders/buckets */}
                <div className="sticky-bar-content">
                    {folders.length > 0 && (
                        <div className="sticky-bar-scroll-area">
                            <div className="sticky-bar-folders">
                                {folders.map((folder) => (
                                    <button
                                        key={folder.id}
                                        className={`bar-folder-pill ${activeFolderId === folder.id ? 'active' : ''} ${folder.isDuplicate ? 'is-duplicate' : ''}`}
                                        onClick={() => onFolderChange?.(folder.id)}
                                        title={folder.title}
                                    >
                                        <span className="folder-label">{folder.label}</span>
                                        <span className={`folder-badge ${folder.isDuplicate ? 'badge-red' : ''}`}>
                                            {folder.badgeLabel ?? folder.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Global Actions Cluster */}
                <div className="sticky-bar-actions">
                    <div className="sticky-bar-cluster">

                        {/* Upload Action (Only for Uploads variant) */}
                        {variant === 'uploads' && (
                            <button
                                className="bar-icon-btn upload-trigger"
                                onClick={onUploadClick}
                                title="Upload photos"
                            >
                                <Upload size={20} />
                            </button>
                        )}

                        {/* Custom Actions Slot */}
                        {actions}

                        <div className="bar-divider" />
                        {/* Expand/Shrink Action */}
                        <button
                            className="bar-icon-btn"
                            onClick={onExpandToggle}
                            title={isExpanded ? "Shrink view" : "Expand full screen"}
                        >
                            <Maximize2 size={20} style={isExpanded ? { transform: 'rotate(180deg)' } : {}} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
