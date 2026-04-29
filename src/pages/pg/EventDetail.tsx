import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePhotographer, type Photo } from '../../context/PhotographerContext';
import { MasonryGrid } from '../../components/MasonryGrid';
import { PhotoCard } from '../../components/PhotoCard';
import { PgSelectionPanel } from './PgSelectionPanel';
import { PgToast } from './PgToast';
import { TOAST_TOKENS } from '../../context/ToastTokens';
import { TitleHeader } from '../../components/TitleHeader';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  X,
  Check,
  Trash2,
  Pencil,
  AlertCircle,
  RotateCcw,
  Info,
  ImageOff,
  Globe,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import { ScopedSearchBar } from '../../components/ScopedSearchBar';
import {
  ActionCluster,
  //   MoreMenu,
  //   ActionSeparator,
} from '../../components/HeaderActions';
import { InfoChip } from '../../components/InfoChip';
import { PHOTOGRAPHERS } from '../../data/mockData';
import { FilterChip } from '../../components/FilterChip';
import { StickyActionBar } from '../../components/StickyActionBar';
import { assetUrl } from '../../lib/utils';

// Tab type
type TabType = 'uploads' | 'published' | 'archive';

// Folder type
type FolderType = 'random' | 'misc' | 'uncategorised' | 'duplicates';
type PublishedFolderType = 'selling_photos' | 'unsold';

export const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const location = useLocation();
  const fromTab = (location.state as any)?.fromTab;
  const { basePath, isAdmin } = useWorkspace();
  const { getEvent, getPhotosByEvent, resolveDuplicate } = usePhotographer();

  const event = eventId ? getEvent(eventId) : undefined;
  const allPhotos = eventId ? getPhotosByEvent(eventId) : [];

  // State
  const [activeTab, setActiveTab] = useState<TabType>('uploads');
  const [activeFolder, setActiveFolder] = useState<FolderType>('random');
  const [activePublishedFolder, setActivePublishedFolder] =
    useState<PublishedFolderType>('selling_photos');
  const [activeChip, setActiveChip] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const processedDupIds = React.useRef<Set<string>>(new Set());

  // Deep link effect: Scroll to duplicate group
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dupId = params.get('dup');

    if (dupId && !processedDupIds.current.has(dupId)) {
      processedDupIds.current.add(dupId);

      // Force switch to duplicate view
      if (activeTab !== 'uploads') setActiveTab('uploads');
      if (activeFolder !== 'duplicates') setActiveFolder('duplicates');

      // Wait for render/transition
      setTimeout(() => {
        const el = document.getElementById(`dup-group-${dupId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-duplicate-group');
          setTimeout(() => {
            el.classList.remove('highlight-duplicate-group');
            // Clear the param after highlight so navigation isn't locked
            // We use the current location to avoid stale closures, but params are from render
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.delete('dup');
            navigate({ search: currentParams.toString() }, { replace: true });
          }, 2000);
        }
      }, 300);
    }
  }, [location.search, activeFolder, activeTab, navigate]);

  // Reset active chip to 'all' when switching folders/buckets
  React.useEffect(() => {
    setActiveChip('all');
  }, [activeFolder]);

  // Reset selection when switching tabs
  React.useEffect(() => {
    setSelectedIds(new Set());
    setIsPanelOpen(false);
    setActiveChip('all');
  }, [activeTab]);

  // Photos by tab
  const uploadPhotos = useMemo(
    () =>
      allPhotos.filter(p =>
        [
          'uploading',
          'processing',
          'needsReview',
          'uploadedUnpublished',
        ].includes(p.status)
      ),
    [allPhotos]
  );

  const publishedPhotosRaw = useMemo(() => {
    return allPhotos.filter(p => p.status === 'published');
  }, [allPhotos]);

  const publishedPhotosByBucket = useMemo(() => {
    if (activePublishedFolder === 'selling_photos') {
      return publishedPhotosRaw.filter(p => p.soldCount > 0);
    }
    return publishedPhotosRaw.filter(p => p.soldCount === 0);
  }, [publishedPhotosRaw, activePublishedFolder]);

  const publishedFolderCounts = useMemo(() => {
    const selling = publishedPhotosRaw.filter(p => p.soldCount > 0);
    return {
      selling_photos: selling.length,
      totalSales: selling.reduce((sum, p) => sum + p.soldCount, 0),
      unsold: publishedPhotosRaw.filter(p => p.soldCount === 0).length,
    };
  }, [publishedPhotosRaw]);

  const publishedChips = useMemo(() => {
    const photos = publishedPhotosByBucket;

    const allChips = [
      { id: 'all', label: 'All', count: photos.length, filterFn: () => true },
      {
        id: 'generic',
        label: 'Generic',
        count: photos.filter(p => p.isGeneric).length,
        filterFn: (p: Photo) => p.isGeneric,
      },
      {
        id: 'basic',
        label: 'Basic',
        color: 'var(--color-text-secondary)',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
      {
        id: 'standard',
        label: 'Standard',
        color: '#f97316',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
      {
        id: 'premium',
        label: 'Premium',
        color: '#a855f7',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
    ];

    return allChips;
  }, [publishedPhotosByBucket]);

  const filteredPublishedPhotos = useMemo(() => {
    let photos = publishedPhotosByBucket;

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      photos = photos.filter(p => {
        const clientEmail =
          (p as any).clientEmail || `client_${p.id.slice(0, 4)}@example.com`;
        return (
          p.fileName?.toLowerCase().includes(term) ||
          p.photoCode?.toLowerCase().includes(term) ||
          p.id?.toLowerCase().includes(term) ||
          clientEmail.toLowerCase().includes(term)
        );
      });
    }

    const chip = publishedChips.find(c => c.id === activeChip);
    if (!chip || activeChip === 'all') return photos;
    return photos.filter(chip.filterFn);
  }, [publishedPhotosByBucket, activeChip, publishedChips, searchTerm]);

  const archivedPhotosRaw = useMemo(() => {
    return allPhotos.filter(p => p.status === 'archived');
  }, [allPhotos]);

  const archivedPhotosByBucket = useMemo(() => {
    if (activePublishedFolder === 'selling_photos') {
      return archivedPhotosRaw.filter(p => p.soldCount > 0);
    }
    return archivedPhotosRaw.filter(p => p.soldCount === 0);
  }, [archivedPhotosRaw, activePublishedFolder]);

  const archivedFolderCounts = useMemo(() => {
    const selling = archivedPhotosRaw.filter(p => p.soldCount > 0);
    return {
      selling_photos: selling.length,
      totalSales: selling.reduce((sum, p) => sum + p.soldCount, 0),
      unsold: archivedPhotosRaw.filter(p => p.soldCount === 0).length,
    };
  }, [archivedPhotosRaw]);

  const archivedChips = useMemo(() => {
    const photos = archivedPhotosByBucket;

    const allChips = [
      { id: 'all', label: 'All', count: photos.length, filterFn: () => true },
      {
        id: 'generic',
        label: 'Generic',
        count: photos.filter(p => p.isGeneric).length,
        filterFn: (p: Photo) => p.isGeneric,
      },
      {
        id: 'basic',
        label: 'Basic',
        color: 'var(--color-text-secondary)',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
      {
        id: 'standard',
        label: 'Standard',
        color: '#f97316',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
      {
        id: 'premium',
        label: 'Premium',
        color: '#a855f7',
        count: photos.filter(
          p =>
            p.priceStandard === 499 &&
            p.priceHigh === 999 &&
            p.priceCommercial === 1500
        ).length,
        filterFn: (p: Photo) =>
          p.priceStandard === 499 &&
          p.priceHigh === 999 &&
          p.priceCommercial === 1500,
      },
    ];

    return allChips;
  }, [archivedPhotosByBucket]);

  const filteredArchivedPhotos = useMemo(() => {
    let photos = archivedPhotosByBucket;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      photos = photos.filter(
        p =>
          p.fileName?.toLowerCase().includes(term) ||
          p.photoCode?.toLowerCase().includes(term) ||
          p.id?.toLowerCase().includes(term) ||
          p.rider?.toLowerCase().includes(term) ||
          p.horse?.toLowerCase().includes(term)
      );
    }

    const chip = archivedChips.find(c => c.id === activeChip);
    if (!chip || activeChip === 'all') return photos;
    return photos.filter(chip.filterFn);
  }, [archivedPhotosByBucket, activeChip, archivedChips, searchTerm]);

  const tabCounts = useMemo(() => {
    return {
      uploads: uploadPhotos.length,
      published: allPhotos.filter(p => p.status === 'published').length,
      archive: allPhotos.filter(p => p.status === 'archived').length,
    };
  }, [uploadPhotos, allPhotos]);

  // Compute valid duplicates (Cross-reference all uploads)
  // Only groups with 2+ instances are considered valid duplicates
  const validDuplicateIds = useMemo(() => {
    const groups = new Map<string, Photo[]>();
    uploadPhotos.forEach(p => {
      if (p.isDuplicate && !p.duplicateResolved) {
        const key = p.duplicateGroupId || p.url;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
      }
    });

    const validIds = new Set<string>();
    for (const photos of groups.values()) {
      if (photos.length >= 2) {
        photos.forEach(p => validIds.add(p.id));
      }
    }
    return validIds;
  }, [uploadPhotos]);

  // Folder counts
  const folderCounts = useMemo(
    () => ({
      random: uploadPhotos.filter(p => p.batch === 'Random').length,
      misc: uploadPhotos.filter(p => p.batch === 'Misc').length,
      uncategorised: uploadPhotos.filter(
        p => !p.batch || p.batch === '' || p.batch === 'Uncategorised'
      ).length,
      duplicates: validDuplicateIds.size,
    }),
    [uploadPhotos, validDuplicateIds]
  );

  // Photos in current folder
  const folderPhotos = useMemo(() => {
    let photos: Photo[] = [];
    switch (activeFolder) {
      case 'random':
        photos = uploadPhotos.filter(p => p.batch === 'Random');
        break;
      case 'misc':
        photos = uploadPhotos.filter(p => p.batch === 'Misc');
        break;
      case 'uncategorised':
        photos = uploadPhotos.filter(
          p => !p.batch || p.batch === '' || p.batch === 'Uncategorised'
        );
        break;
      case 'duplicates':
        // Show validated duplicates
        photos = uploadPhotos.filter(p => validDuplicateIds.has(p.id));
        break;
      default:
        photos = [];
    }

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      photos = photos.filter(
        p =>
          p.fileName?.toLowerCase().includes(term) ||
          p.photoCode?.toLowerCase().includes(term) ||
          p.id?.toLowerCase().includes(term)
      );
    }

    return photos;
  }, [uploadPhotos, activeFolder, searchTerm]);

  // Determine if we're in duplicates folder
  const isDuplicatesFolder = activeFolder === 'duplicates';

  // Build chips for inside folder (NOT for duplicates folder)
  const folderChips = useMemo(() => {
    if (isDuplicatesFolder) return [];

    // Dynamically extract unique tags from currently displayed folder photos
    const uniqueClasses = Array.from(
      new Set(folderPhotos.map(p => p.className).filter(Boolean))
    ) as string[];
    const uniqueRiders = Array.from(
      new Set(folderPhotos.map(p => p.rider).filter(r => r && r !== 'None'))
    ) as string[];
    const uniqueHorses = Array.from(
      new Set(folderPhotos.map(p => p.horse).filter(h => h && h !== 'None'))
    ) as string[];

    const allChips: any[] = [
      {
        id: 'all',
        label: 'All',
        count: folderPhotos.length,
        filterFn: () => true,
      },
    ];

    // Add dynamic Class chips
    uniqueClasses.sort().forEach(cls => {
      allChips.push({
        id: `class-${cls}`,
        label: cls,
        count: folderPhotos.filter(p => p.className === cls).length,
        filterFn: (p: Photo) => p.className === cls,
      });
    });

    // Add dynamic Rider chips
    uniqueRiders.sort().forEach(rider => {
      allChips.push({
        id: `rider-${rider}`,
        label: rider.toUpperCase(),
        count: folderPhotos.filter(p => p.rider === rider).length,
        filterFn: (p: Photo) => p.rider === rider,
      });
    });

    // Add dynamic Horse chips
    uniqueHorses.sort().forEach(horse => {
      allChips.push({
        id: `horse-${horse}`,
        label: horse,
        count: folderPhotos.filter(p => p.horse === horse).length,
        filterFn: (p: Photo) => p.horse === horse,
      });
    });

    // Missing Tags logic - check ALL metadata fields
    allChips.push({
      id: 'missing-tags',
      label: 'Missing tags',
      count: folderPhotos.filter(
        p =>
          (!p.rider || p.rider === 'None') &&
          (!p.horse || p.horse === 'None') &&
          (!p.className || p.className === 'None') &&
          (!p.isGeneric || !p.title)
      ).length,
      filterFn: (p: Photo) =>
        (!p.rider || p.rider === 'None') &&
        (!p.horse || p.horse === 'None') &&
        (!p.className || p.className === 'None') &&
        (!p.isGeneric || !p.title),
    });

    return allChips;
  }, [folderPhotos, isDuplicatesFolder]);

  // Search Options for Autocomplete
  const searchOptions = useMemo(() => {
    if (!allPhotos.length) return [];
    const options: any[] = [];
    const uniqueRiders = new Set<string>();
    const uniqueHorses = new Set<string>();

    allPhotos.forEach(p => {
      if (p.rider && p.rider !== 'None' && !uniqueRiders.has(p.rider)) {
        uniqueRiders.add(p.rider);
        options.push({
          label: p.rider,
          value: p.rider,
          type: 'rider',
          subtitle: p.horse,
        });
      }
      if (p.horse && p.horse !== 'None' && !uniqueHorses.has(p.horse)) {
        uniqueHorses.add(p.horse);
        options.push({
          label: p.horse,
          value: p.horse,
          type: 'horse',
          subtitle: p.rider,
        });
      }

      // ADDED: Photo Search Functionality (Search by ID/Code)
      if (p.photoCode) {
        options.push({
          label: `#${p.photoCode}`,
          value: p.photoCode,
          type: 'photo',
          // Format: "IMG_2024.jpg • Rider Name"
          subtitle: `${p.fileName}${p.rider ? ` • ${p.rider}` : ''}`,
        });
      }
    });
    return options;
  }, [allPhotos]);

  // Get filtered photos based on active chip AND search term
  const filteredFolderPhotos = useMemo(() => {
    // Base: Folder photos
    let photos = folderPhotos;

    // 1. Filter by Search Term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      photos = photos.filter(
        p =>
          (p.rider && p.rider.toLowerCase().includes(lower)) ||
          (p.horse && p.horse.toLowerCase().includes(lower)) ||
          (p.fileName && p.fileName.toLowerCase().includes(lower)) ||
          (p.id && p.id.toLowerCase().includes(lower))
      );
    }

    // Duplicates folder shows all duplicates (no chip filtering)
    if (isDuplicatesFolder) return photos;

    // 2. Filter by Chip
    const chip = folderChips.find(c => c.id === activeChip);
    if (!chip || activeChip === 'all') return photos;

    return photos.filter(chip.filterFn);
  }, [folderPhotos, activeChip, folderChips, isDuplicatesFolder, searchTerm]);

  // Get display photos based on current tab
  const displayedPhotos = useMemo(() => {
    if (activeTab === 'uploads') return filteredFolderPhotos;
    if (activeTab === 'published') return filteredPublishedPhotos;
    if (activeTab === 'archive') return filteredArchivedPhotos;
    return [];
  }, [
    activeTab,
    filteredFolderPhotos,
    filteredPublishedPhotos,
    filteredArchivedPhotos,
  ]);

  // Group duplicates by duplicateGroupId (or URL if missing)
  const duplicateGroups = useMemo(() => {
    if (!isDuplicatesFolder) return new Map<string, Photo[]>();

    const groups = new Map<string, Photo[]>();
    displayedPhotos.forEach(p => {
      const key = p.duplicateGroupId || p.url;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    // Logic already filtered by strict validDuplicateIds, but grouping here ensures structure
    // No extra filtering needed for size < 2 if validDuplicateIds already enforces it,
    // but keeping the loop or just relying on validDuplicateIds is fine.
    // We'll trust validDuplicateIds.
    return groups;
  }, [displayedPhotos, isDuplicatesFolder]);

  // Compute "Also in" for duplicates - ONLY batch or Uncategorised (no class/rider/horse)
  // Reset chip selection when folder changes
  React.useEffect(() => {
    setActiveChip('all');
  }, [activeFolder]);

  // Event Info modal: ESC handling + scroll lock to match EditProfile modal behavior
  React.useEffect(() => {
    if (!showInfoModal) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInfoModal(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [showInfoModal]);

  // Selection handlers
  const handleToggleSelect = (photo: Photo, multiSelect: boolean) => {
    const newSelected = new Set(multiSelect ? selectedIds : []);

    if (multiSelect) {
      if (newSelected.has(photo.id)) newSelected.delete(photo.id);
      else newSelected.add(photo.id);
    } else {
      if (newSelected.has(photo.id) && newSelected.size === 1) {
        newSelected.clear();
      } else {
        newSelected.clear();
        newSelected.add(photo.id);
      }
    }

    setSelectedIds(newSelected);

    if (newSelected.size === 0) {
      // Panel closed logic handled manually or by clear
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsPanelOpen(false);
  };

  // Duplicate actions
  const handleRemove = (photoId: string) => {
    resolveDuplicate(photoId, 'remove');
  };

  // Legacy handler for MasonryGrid fallback
  const handleKeep = (photoId: string) => {
    resolveDuplicate(photoId, 'keep');
  };

  // Handle bucket switching safely
  const handleFolderChange = (folder: FolderType) => {
    setActiveFolder(folder);
    // Clear dup param if present to ensure clean state
    if (location.search.includes('dup=')) {
      const params = new URLSearchParams(location.search);
      params.delete('dup');
      navigate({ search: params.toString() }, { replace: true });
    }
  };

  // Manage handler for cards in other views
  const handleManageDuplicate = (groupId?: string) => {
    if (!groupId) return;
    navigate(`?dup=${groupId}`, { replace: true });
  };

  // Map PG Photo to UI Photo for PhotoCard
  const mapToUiPhoto = (photo: Photo) => ({
    id: photo.id,
    src: photo.url,
    rider: photo.rider || 'Unknown',
    house: photo.horse || 'Unknown',
    horse: photo.horse || 'Unknown', // Fix typo fallback
    event: event?.title || 'Event',
    eventId: photo.eventId,
    date: photo.uploadDate || new Date().toISOString(),
    time: photo.timestamp || '12:00',
    city: event?.city || 'Location',
    countryCode: 'SE',
    width: photo.width,
    height: photo.height,
    className: photo.className || 'photo-grid-item',
    arena: event?.venueName || 'Arena 1',
    isDuplicate: validDuplicateIds.has(photo.id),
    duplicateGroupId: photo.duplicateGroupId,
    priceStandard: photo.priceStandard,
    priceHigh: photo.priceHigh,
  });

  // Selection Helpers
  const isAllSelected =
    displayedPhotos.length > 0 &&
    displayedPhotos.every(p => selectedIds.has(p.id));

  const handleSelectAll = () => {
    const newSet = new Set(selectedIds);
    displayedPhotos.forEach(p => newSet.add(p.id));
    setSelectedIds(newSet);
  };

  const handleEditPhoto = (photo: Photo) => {
    // Exclusive select + Open Panel
    setSelectedIds(new Set([photo.id]));
    setIsPanelOpen(true);
  };

  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'info' | 'danger';
    onUndo?: () => void;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'delete' | 'publish' | 'unpublish';
    isOpen: boolean;
  }>({ type: 'delete', isOpen: false });
  const [activePanelTab, setActivePanelTab] = useState<'tags' | 'price'>(
    'tags'
  );

  const undoSelectionRef = useRef<Set<string>>(new Set());
  const actionBarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!actionBarRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = Math.max((entry.target as HTMLElement).offsetHeight, 64);
        document.documentElement.style.setProperty(
          '--bucketBarH',
          `${height}px`
        );
      }
    });
    ro.observe(actionBarRef.current);
    return () => ro.disconnect();
  }, []);

  const handleEditPrice = (photo: Photo) => {
    setSelectedIds(new Set([photo.id]));
    setActivePanelTab('price');
    setIsPanelOpen(true);
  };

  const handleDeleteSelection = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ type: 'delete', isOpen: true });
  };

  const handleUnpublishSelection = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ type: 'unpublish', isOpen: true });
  };

  const handlePublishSelection = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ type: 'publish', isOpen: true });
  };

  const handleUndoDelete = () => {
    setSelectedIds(new Set(undoSelectionRef.current));
    setToast(null);
  };

  const handleConfirmAction = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setIsPanelOpen(false); // Close panel on confirmation (delete/publish/unpublish)

    if (confirmModal.type === 'delete') {
      undoSelectionRef.current = new Set(selectedIds);
      setToast({
        msg: `${selectedIds.size} photo${
          selectedIds.size > 1 ? 's' : ''
        } deleted`,
        type: TOAST_TOKENS.DELETE.type,
        onUndo: handleUndoDelete,
      });
      setSelectedIds(new Set());
      setTimeout(() => setToast(null), 3000);
    } else if (confirmModal.type === 'publish') {
      setToast({
        msg:
          activeTab === 'archive'
            ? 'Republished successfully'
            : 'Published successfully',
        type: TOAST_TOKENS.PUBLISH.type,
      });
      setSelectedIds(new Set());
      setTimeout(() => setToast(null), 3000);
    } else if (confirmModal.type === 'unpublish') {
      // Mock move to archive
      undoSelectionRef.current = new Set(selectedIds);
      setToast({
        msg: `${selectedIds.size} photo${
          selectedIds.size > 1 ? 's' : ''
        } moved to Archive`,
        type: TOAST_TOKENS.DELETE.type, // Use delete type for red accent or similar
        onUndo: () => {
          // Undo logic
          setToast({ msg: 'Unpublish undone', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        },
      });
      setSelectedIds(new Set());
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Override edit photo to default to tags
  const handleEditPhotoOverride = (photo: Photo) => {
    handleEditPhoto(photo);
    setActivePanelTab('tags');
  };

  // Tab styles

  const renderContent = () => {
    return (
      <>
        {/* Grey Content Section */}
        <div
          className={`bg-[var(--color-bg)] relative ${
            isExpanded
              ? 'flex-1 overflow-y-auto pt-0 pb-[100px] min-h-0'
              : 'pt-0'
          }`}
          ref={scrollContainerRef}
        >
          {/* Tabs Row (Inside scroll container for expanded autohide/stick behavior) */}
          <div
            className={`bg-white/95 backdrop-blur-[8px] border-b border-[var(--color-border)] ${
              isExpanded
                ? 'sticky top-0 z-20 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
                : ''
            }`}
            style={undefined}
          >
            <div className="container flex gap-0 items-center">
              <button
                className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
                onClick={() => setActiveTab('uploads')}
              >
                Uploads
                <span className="tab-badge">{tabCounts.uploads}</span>
              </button>
              <button
                className={`tab-btn ${
                  activeTab === 'published' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('published')}
              >
                Published
                <span className="tab-badge">{tabCounts.published}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
                onClick={() => setActiveTab('archive')}
              >
                Archive
                <span className="tab-badge">{tabCounts.archive}</span>
              </button>

              {isExpanded && (
                <div className="ml-auto flex items-center gap-2.5">
                  <img
                    src={event!.logo}
                    alt=""
                    className="w-6 h-6 rounded-[4px] object-cover"
                  />
                  <span
                    title={event!.title}
                    className="text-[0.875rem] font-semibold text-[var(--color-text-primary)] max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {event!.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col min-h-full">
            <div className={`container pt-6`}>
              {/* Filter Bar (On Grey Surface) */}
              <div className="pg-split-layout flex items-start gap-8">
                {/* LEFT SIDEBAR: Tags (Conditional) */}
                {((activeTab === 'uploads' &&
                  !isDuplicatesFolder &&
                  (folderChips.length > 1 || searchTerm)) ||
                  (activeTab === 'published' && publishedChips.length > 0) ||
                  (activeTab === 'archive' && archivedChips.length > 0)) && (
                  <div className="pg-filter-sidebar pg-sticky-sidebar w-[190px] shrink-0 pt-3">
                    <div className="pg-chips-scroll-container flex flex-col gap-2 items-start w-full pr-2">
                      {(activeTab === 'uploads'
                        ? folderChips
                        : activeTab === 'published'
                        ? publishedChips
                        : archivedChips
                      ).map((chip: any, index) => (
                        <FilterChip
                          key={chip.id}
                          label={
                            <div className="flex items-center gap-1.5">
                              {chip.color && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: chip.color }}
                                />
                              )}
                              {chip.label}
                            </div>
                          }
                          isActive={activeChip === chip.id}
                          onClick={() => setActiveChip(chip.id)}
                          variant="filterCount"
                          accent={
                            chip.id === 'missing-tags' ? 'red' : undefined
                          }
                          count={chip.count}
                          className={
                            index === 0 && activeChip === 'all' ? '' : ''
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* RIGHT CONTENT COLUMN */}
                <div className="pg-main-content-col flex-1 min-w-0">
                  {/* TOP: Search & Actions (Conditional matches sidebar) */}
                  {((activeTab === 'uploads' &&
                    !isDuplicatesFolder &&
                    (folderChips.length > 1 || searchTerm)) ||
                    (activeTab === 'published' && publishedChips.length > 0) ||
                    (activeTab === 'archive' && archivedChips.length > 0)) && (
                    <div className="search-actions-row flex items-center justify-between gap-6 mb-3 pt-3 pb-3">
                      {/* Search */}
                      <div className="search-group flex-1 max-w-[600px]">
                        <ScopedSearchBar
                          placeholder="Search riders, horses, photo ID..."
                          options={searchOptions}
                          currentValue={searchTerm}
                          onSelect={val =>
                            setSearchTerm(val === 'All' ? '' : val)
                          }
                          onSearchChange={val => setSearchTerm(val)}
                          variant="v2"
                        />
                      </div>

                      {/* Actions Cluster */}
                      <div className="pg-events-filter-right flex items-center">
                        {selectedIds.size > 0 ? (
                          // SELECTION MODE ACTIONS
                          <div className="flex items-center gap-2">
                            <span className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)] whitespace-nowrap mr-4">
                              {selectedIds.size} selected
                            </span>

                            {/* Edit Action */}
                            <button
                              className={`${roundBtnBase} ${roundBtnLg}`}
                              onClick={() => setIsPanelOpen(true)}
                              title="Edit selection"
                            >
                              <Pencil size={18} />
                            </button>

                            {activeTab === 'uploads' ||
                            activeTab === 'archive' ? (
                              <>
                                <button
                                  className={`${roundBtnDelete} ${roundBtnLg}`}
                                  onClick={handleDeleteSelection}
                                  title="Delete selection"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button
                                  className={`${chipBtnPrimary} ${chipBtnLg} ml-2`}
                                  onClick={handlePublishSelection}
                                >
                                  {activeTab === 'archive'
                                    ? 'Republish'
                                    : 'Publish'}
                                </button>
                              </>
                            ) : activeTab === 'published' ? (
                              <button
                                className={`${roundBtnDelete} ${roundBtnLg}`}
                                onClick={handleUnpublishSelection}
                                title="Unpublish"
                              >
                                <RotateCcw size={18} />
                              </button>
                            ) : null}

                            {/* Single consistent separator */}
                            <div className="w-px h-6 bg-black/10 mx-2 ml-4" />

                            <button
                              className={`${chipBtnGhost} text-secondary`}
                              onClick={handleClearSelection}
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          // DEFAULT MODE ACTIONS
                          <>
                            <div className="mr-4 h-6 flex items-center text-[var(--color-text-secondary)] text-[0.875rem] font-medium">
                              Showing {displayedPhotos.length} photos
                            </div>

                            <div className="flex items-center">
                              <div className="flex items-center gap-2 ml-auto pl-4 border-l border-black/10 shrink-0">
                                {isAllSelected ? (
                                  <button
                                    className={chipBtnGhost}
                                    onClick={() => setSelectedIds(new Set())}
                                  >
                                    <X size={14} />
                                    Clear
                                  </button>
                                ) : (
                                  <button
                                    className={chipBtnGhost}
                                    onClick={handleSelectAll}
                                  >
                                    Select all
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Split: Grid/Groups + Inspector */}
                  <div className="pg-content-split">
                    <div className="pg-photos-grid flex-1">
                      {activeTab === 'uploads' && isDuplicatesFolder ? (
                        // DUPLICATES VIEW (GROUPED)
                        <div className="pg-duplicates-list pb-[100px]">
                          {Array.from(duplicateGroups.entries()).map(
                            ([groupId, photos]) => {
                              const firstPhoto = photos[0];
                              const count = photos.length;

                              return (
                                <div
                                  key={groupId}
                                  id={`dup-group-${groupId}`}
                                  className="mb-8 bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-2 border-transparent transition-all duration-500 ease-in-out"
                                >
                                  <div className="pg-duplicate-header flex items-center justify-between mb-4">
                                    <div className="pg-dup-title font-semibold text-base flex items-center gap-2">
                                      Duplicate: {firstPhoto.fileName}{' '}
                                      <span className="text-[var(--color-text-secondary)] font-normal">
                                        ({count} instances)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="pg-duplicate-row flex gap-4 overflow-x-auto pb-2">
                                    {photos.map(photo => {
                                      const uiPhoto = mapToUiPhoto(photo);
                                      const isSelected = selectedIds.has(
                                        photo.id
                                      );

                                      return (
                                        <div
                                          key={photo.id}
                                          className="w-[260px] shrink-0 relative"
                                        >
                                          <div
                                            className={`group relative cursor-pointer transition-[box-shadow] duration-200 ${
                                              isSelected
                                                ? 'pg-card-selected shadow-[0_0_0_2px_rgba(27,58,236,0.4)] z-[5] rounded-[var(--radius-md,8px)]'
                                                : ''
                                            }`}
                                            onClick={e =>
                                              handleToggleSelect(
                                                photo,
                                                e.shiftKey ||
                                                  e.metaKey ||
                                                  e.ctrlKey
                                              )
                                            }
                                          >
                                            <PhotoCard
                                              photo={uiPhoto}
                                              onClick={() => {}}
                                              variant="pgDuplicate"
                                              pgMeta={{
                                                fileName: photo.fileName,
                                                photoCode: photo.photoCode,
                                                uploadDate: photo.uploadDate,
                                                timestamp: photo.timestamp,
                                                storedLocation:
                                                  photo.storedLocation,
                                              }}
                                              onKeep={() =>
                                                handleKeep(photo.id)
                                              }
                                              onRemove={() =>
                                                handleRemove(photo.id)
                                              }
                                            />
                                            {/* Selection Overlay with Checkbox */}
                                            <div
                                              className={`absolute top-[10px] left-[10px] z-50 transition-opacity duration-200 group-hover:opacity-100 ${
                                                isSelected
                                                  ? 'opacity-100'
                                                  : 'opacity-0'
                                              }`}
                                              onClick={e => {
                                                e.stopPropagation();
                                                handleToggleSelect(photo, true);
                                              }}
                                            >
                                              <div
                                                className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
                                                  isSelected
                                                    ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]'
                                                    : 'bg-white/90 border-white/60'
                                                }`}
                                              >
                                                {isSelected && (
                                                  <Check
                                                    size={14}
                                                    strokeWidth={3}
                                                    color="#fff"
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                          {duplicateGroups.size === 0 && (
                            <div className="py-16 text-center text-[var(--color-text-secondary)] text-[0.875rem]">
                              No duplicates found.
                            </div>
                          )}
                        </div>
                      ) : (
                        <MasonryGrid isLoading={false}>
                          {displayedPhotos.map(photo => {
                            const uiPhoto = mapToUiPhoto(photo);
                            const isSelected = selectedIds.has(photo.id);

                            // Determine card variant
                            let cardVariant:
                              | 'pgUpload'
                              | 'pgDuplicate'
                              | 'pgPublished'
                              | 'pgArchived'
                              | 'default' = 'default';
                            if (activeTab === 'uploads') {
                              cardVariant = isDuplicatesFolder
                                ? 'pgDuplicate'
                                : 'pgUpload';
                            } else if (activeTab === 'published') {
                              cardVariant = 'pgPublished';
                            } else if (activeTab === 'archive') {
                              cardVariant = 'pgArchived';
                            }

                            return (
                              <div
                                key={photo.id}
                                id={`photo-${photo.id}`}
                                className={`group relative cursor-pointer transition-[box-shadow] duration-200 ${
                                  isSelected
                                    ? 'pg-card-selected shadow-[0_0_0_2px_rgba(27,58,236,0.4)] z-[5] rounded-[var(--radius-md,8px)]'
                                    : ''
                                }`}
                                onClick={e =>
                                  handleToggleSelect(
                                    photo,
                                    e.shiftKey || e.metaKey || e.ctrlKey
                                  )
                                }
                              >
                                <PhotoCard
                                  photo={uiPhoto}
                                  onClick={() => {}}
                                  variant={cardVariant}
                                  pgMeta={
                                    activeTab === 'uploads' ||
                                    activeTab === 'published' ||
                                    activeTab === 'archive'
                                      ? {
                                          fileName: photo.fileName,
                                          photoCode: photo.photoCode,
                                          uploadDate: photo.uploadDate,
                                          timestamp: photo.timestamp,
                                          priceStandard: isDuplicatesFolder
                                            ? undefined
                                            : photo.priceStandard,
                                          priceHigh: isDuplicatesFolder
                                            ? undefined
                                            : photo.priceHigh,
                                          storedLocation: photo.storedLocation,
                                          soldCount:
                                            activeTab === 'published' ||
                                            activeTab === 'archive'
                                              ? photo.soldCount
                                              : 0,
                                          totalBucketSales:
                                            activeTab === 'published' &&
                                            activePublishedFolder ===
                                              'selling_photos'
                                              ? publishedFolderCounts.totalSales
                                              : 0,
                                        }
                                      : undefined
                                  }
                                  onKeep={
                                    isDuplicatesFolder
                                      ? () => handleKeep(photo.id)
                                      : undefined
                                  }
                                  onRemove={() => {
                                    if (isDuplicatesFolder) {
                                      handleRemove(photo.id);
                                    } else if (activeTab === 'published') {
                                      setSelectedIds(new Set([photo.id]));
                                      setConfirmModal({
                                        type: 'unpublish',
                                        isOpen: true,
                                      });
                                    } else {
                                      setSelectedIds(new Set([photo.id]));
                                      setConfirmModal({
                                        type: 'delete',
                                        isOpen: true,
                                      });
                                    }
                                  }}
                                  onManageDuplicate={() =>
                                    handleManageDuplicate(
                                      photo.duplicateGroupId
                                    )
                                  }
                                  onEdit={() => handleEditPhotoOverride(photo)}
                                  onEditPrice={() => handleEditPrice(photo)}
                                  onPreview={() => setPreviewPhoto(uiPhoto)}
                                />

                                {/* Selection Overlay with Checkbox */}
                                <div
                                  className={`absolute top-[10px] left-[10px] z-50 transition-opacity duration-200 group-hover:opacity-100 ${
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  }`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleSelect(photo, true);
                                  }}
                                >
                                  <div
                                    className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]'
                                        : 'bg-white/90 border-white/60'
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check
                                        size={14}
                                        strokeWidth={3}
                                        color="#fff"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </MasonryGrid>
                      )}
                      {activeTab === 'uploads' &&
                        !isDuplicatesFolder &&
                        displayedPhotos.length === 0 && (
                          <div className="pg-empty-state">
                            <div className="pg-empty-icon">
                              <ImageOff size={24} />
                            </div>
                            <h3>
                              {searchTerm
                                ? 'No results found'
                                : 'No photos here'}
                            </h3>
                            <p>
                              {searchTerm
                                ? `No photos match "${searchTerm}"`
                                : 'This folder is empty. Upload photos to get started.'}
                            </p>
                          </div>
                        )}
                      {activeTab === 'published' &&
                        displayedPhotos.length === 0 && (
                          <div className="pg-empty-state">
                            <div className="pg-empty-icon">
                              <Globe size={24} />
                            </div>
                            <h3>
                              {searchTerm
                                ? 'No results found'
                                : 'Nothing published yet'}
                            </h3>
                            <p>
                              {searchTerm
                                ? `No published photos match "${searchTerm}"`
                                : 'Publish photos from the Uploads tab to make them available for buyers.'}
                            </p>
                          </div>
                        )}
                      {activeTab === 'archive' &&
                        displayedPhotos.length === 0 && (
                          <div className="pg-empty-state">
                            <div className="pg-empty-icon">
                              <Archive size={24} />
                            </div>
                            <h3>
                              {searchTerm
                                ? 'No results found'
                                : 'Archive is empty'}
                            </h3>
                            <p>
                              {searchTerm
                                ? `No archived photos match "${searchTerm}"`
                                : 'Unpublished photos will appear here.'}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Selection Panel - Always mounted for animation */}
                    <PgSelectionPanel
                      isOpen={isPanelOpen}
                      selectedIds={selectedIds}
                      allPhotos={allPhotos}
                      activeTab={activePanelTab}
                      currentTab={
                        activeTab === 'published'
                          ? 'published'
                          : activeTab === 'archive'
                          ? 'archive'
                          : 'uploads'
                      }
                      onClose={() => setIsPanelOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar (StickyActionBar) */}
        <StickyActionBar
          variant={activeTab}
          activeFolderId={
            activeTab === 'uploads' ? activeFolder : activePublishedFolder
          }
          onFolderChange={id => {
            if (activeTab === 'uploads') handleFolderChange(id);
            else setActivePublishedFolder(id);
          }}
          folders={
            activeTab === 'uploads'
              ? [
                  { id: 'random', label: 'Random', count: folderCounts.random },
                  { id: 'misc', label: 'Misc', count: folderCounts.misc },
                  {
                    id: 'uncategorised',
                    label: 'Uncategorised',
                    count: folderCounts.uncategorised,
                  },
                  {
                    id: 'duplicates',
                    label: 'Duplicates',
                    count: folderCounts.duplicates,
                    isDuplicate: true,
                  },
                ]
              : activeTab === 'published' || activeTab === 'archive'
              ? [
                  {
                    id: 'selling_photos',
                    label: activeTab === 'archive' ? 'Sold' : 'Selling',
                    count:
                      activeTab === 'published'
                        ? publishedFolderCounts.selling_photos
                        : archivedFolderCounts.selling_photos,
                    badgeLabel:
                      activeTab === 'published'
                        ? `${publishedFolderCounts.selling_photos}/${publishedFolderCounts.totalSales}`
                        : `${archivedFolderCounts.selling_photos}/${archivedFolderCounts.totalSales}`,
                    title: 'Photos/total sales',
                  },
                  {
                    id: 'unsold',
                    label: 'Unsold',
                    count:
                      activeTab === 'published'
                        ? publishedFolderCounts.unsold
                        : archivedFolderCounts.unsold,
                  },
                ]
              : []
          }
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelect={setSearchTerm}
          searchPlaceholder={
            activeTab === 'published'
              ? 'Search photo ID or client email...'
              : 'Search riders, horses, photo ID...'
          }
          searchOptions={searchOptions.map((opt: any) => ({
            id: opt.value,
            type: opt.type,
            title: opt.label,
            subtitle: opt.subtitle,
            groupLabel: opt.type === 'rider' ? 'Riders' : 'Horses',
          }))}
          onUploadClick={() =>
            navigate(`${basePath}/upload?eventId=${event!.id}&from=event`)
          }
          onExpandToggle={() => setIsExpanded(!isExpanded)}
          isExpanded={isExpanded}
        />
      </>
    );
  };

  const eventPhotographer = useMemo(() => {
    if (!eventId) return null;
    return (
      PHOTOGRAPHERS.find(p => p.primaryEventId === eventId) || PHOTOGRAPHERS[0]
    );
  }, [eventId]);

  // Guard after all hooks — safe to return early now
  if (!event) return <div>Event not found</div>;

  const chipBtnPrimary =
    'h-8 px-4 rounded-full bg-[var(--color-brand-primary)] text-white border-transparent text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-[0_2px_6px_rgba(27,58,236,0.25)] hover:bg-[var(--color-brand-primary-hover)] hover:-translate-y-px';
  const chipBtnGhost =
    'h-8 px-3 rounded-full border-transparent bg-transparent text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap hover:bg-[var(--ui-bg-subtle)]';
  const chipBtnLg = '!h-10 !px-5 !text-[0.875rem]';
  const roundBtnBase =
    'w-8 h-8 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer text-[var(--color-text-secondary)] transition-all duration-200 flex-shrink-0 hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]';
  const roundBtnDelete =
    'w-8 h-8 rounded-full border border-[rgba(239,68,68,0.2)] bg-[var(--color-danger-tint)] flex items-center justify-center cursor-pointer text-[var(--color-danger)] transition-all duration-200 flex-shrink-0 hover:bg-[var(--color-danger-tint)] hover:border-[var(--color-danger)]';
  const roundBtnLg = '!w-10 !h-10';

  return (
    <div
      className={`pb-0 transition-all duration-[400ms] ease-[cubic-bezier(0.2,0,0.2,1)] ${
        isExpanded
          ? 'fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden'
          : ''
      }`}
    >
      <style>{`
                @keyframes modalPop {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .highlight-duplicate-group {
                    border-color: var(--color-brand-primary) !important;
                    box-shadow: 0 0 0 4px rgba(27,58,236,0.15) !important;
                    background-color: var(--color-surface) !important;
                }
            `}</style>
      {/* Title Header - Compact V2 (Only non-expanded) */}
      {!isExpanded && (
        <TitleHeader
          className="no-border pg-compact-header"
          variant="workspace"
          title={
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`${basePath}/events`, { state: { tab: fromTab } })
                }
                className="p-1 flex items-center rounded-full transition-[background] duration-200 text-[var(--color-text-secondary)] hover:bg-black/5"
                title="Back to events"
              >
                <ArrowLeft size={18} />
              </button>
              {event.title}
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1 flex items-center rounded-full transition-[background] duration-200 text-[var(--color-text-secondary)] hover:bg-black/5"
              >
                <Info size={18} />
              </button>
            </div>
          }
          topSubtitle={event.dateRange}
          avatar={event.logo}
          avatarShape="square"
          // subtitle removed to save space
          rightContent={
            <ActionCluster>
              {/* Stats Chips (Persistent in header) */}
              <div className="flex items-center gap-2">
                <div className="inline-flex flex-col items-start justify-center gap-0 px-4 py-2 rounded-xl bg-[var(--ui-bg-subtle)] text-secondary whitespace-nowrap text-left">
                  <span className="text-[0.6875rem] font-semibold leading-[1.2] opacity-80">
                    Published
                  </span>
                  <span className="text-[0.875rem] font-bold leading-[1.2] text-primary">
                    {event.publishedCount ?? 0}
                  </span>
                </div>
                {/* <div className="inline-flex flex-col items-start justify-center gap-0 px-4 py-2 rounded-xl bg-[var(--color-success-tint)] text-[var(--color-success)] whitespace-nowrap text-left">
                  <span className="text-[0.6875rem] font-semibold leading-[1.2] opacity-80">
                    Sales
                  </span>
                  <span className="text-[0.875rem] font-bold leading-[1.2]">
                    {event.soldCount ?? 0}/{event.photosCount ?? 40}
                  </span>
                </div> */}
                {isAdmin ? (
                  <>
                    {/* <div className="inline-flex flex-col items-start justify-center gap-0 px-4 py-2 rounded-xl bg-[var(--color-revenue-bg)] text-[var(--color-revenue-text)] whitespace-nowrap text-left">
                                            <span className="text-[0.6875rem] font-semibold leading-[1.2] opacity-80">PG Earnings</span>
                                            <span className="text-[0.875rem] font-bold leading-[1.2] text-[var(--color-revenue-value)]">SEK {((event.soldCount ?? 0) * 450).toLocaleString().replace(/,/g, ' ')}</span>
                                        </div>
                                        <div className="inline-flex flex-col items-start justify-center gap-0 px-4 py-2 rounded-xl whitespace-nowrap text-left bg-[var(--color-gallop-bg)] text-[var(--color-gallop-text)]">
                                            <span className="text-[0.6875rem] font-semibold leading-[1.2] opacity-80">Gallop Earnings</span>
                                            <span className="text-[0.875rem] font-bold leading-[1.2] text-[var(--color-gallop-value)]">SEK {((event.soldCount ?? 0) * 4500).toLocaleString().replace(/,/g, ' ')}</span>
                                        </div> */}
                  </>
                ) : (
                  <></>
                  //   <div className="inline-flex flex-col items-start justify-center gap-0 px-4 py-2 rounded-xl bg-[var(--color-revenue-bg)] text-[var(--color-revenue-text)] whitespace-nowrap text-left">
                  //     <span className="text-[0.6875rem] font-semibold leading-[1.2] opacity-80">
                  //       Earning
                  //     </span>
                  //     <span className="text-[0.875rem] font-bold leading-[1.2] text-[var(--color-revenue-value)]">
                  //       SEK{' '}
                  //       {((event.soldCount ?? 0) * 450)
                  //         .toLocaleString()
                  //         .replace(/,/g, ' ')}
                  //     </span>
                  //   </div>
                )}
              </div>

              {/* <ActionSeparator /> */}

              {isAdmin && eventPhotographer && (
                <>
                  <InfoChip
                    label="Photographer"
                    name={`${eventPhotographer.firstName} ${eventPhotographer.lastName}`}
                    variant="photographer"
                    avatarUrl={assetUrl(
                      `images/${eventPhotographer.firstName} ${eventPhotographer.lastName}.jpg`
                    )}
                  />
                  {/* <ActionSeparator /> */}
                </>
              )}
              {/* <MoreMenu
                actions={[
                  {
                    label: 'Cancel registration',
                    onClick: () => {
                      console.log('Cancel registration clicked')
                    },
                    variant: 'destructive',
                  },
                ]}
              /> */}
            </ActionCluster>
          }
        />
      )}

      {renderContent()}

      {/* Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto.src}
            alt=""
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 bg-white/10 text-white rounded-full w-11 h-11 flex items-center justify-center backdrop-blur-[10px] transition-[background] duration-200"
            onClick={() => setPreviewPhoto(null)}
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="pg-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="pg-modal-card">
            <div className="flex gap-4 items-start">
              <div
                className={`pg-alert-icon ${
                  confirmModal.type === 'delete' ||
                  confirmModal.type === 'unpublish'
                    ? 'danger'
                    : 'info'
                }`}
              >
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mt-0 text-[1.125rem] font-bold text-primary mb-2">
                  {confirmModal.type === 'delete'
                    ? `Delete photo${selectedIds.size > 1 ? 's' : ''}?`
                    : confirmModal.type === 'unpublish'
                    ? `Unpublish photo${selectedIds.size > 1 ? 's' : ''}?`
                    : 'Publish photos?'}
                </h3>
                <p className="m-0 text-secondary text-[0.875rem] leading-[1.5]">
                  {confirmModal.type === 'delete'
                    ? 'This will remove the selected photo(s) from the event. This action cannot be undone.'
                    : confirmModal.type === 'unpublish'
                    ? 'This will move photos to the Archive tab.'
                    : Array.from(selectedIds).some(id =>
                        validDuplicateIds.has(id)
                      )
                    ? `Warning: ${
                        Array.from(selectedIds).filter(id =>
                          validDuplicateIds.has(id)
                        ).length
                      } duplicates found. Fix duplicates before publishing.`
                    : 'This will move photos to Published.'}
                </p>
                <div className="modal-footer-actions">
                  <button
                    className="modal-btn-cancel"
                    onClick={() =>
                      setConfirmModal({ ...confirmModal, isOpen: false })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className={
                      confirmModal.type === 'delete' ||
                      confirmModal.type === 'unpublish'
                        ? 'modal-btn-danger'
                        : 'modal-btn-save'
                    }
                    onClick={handleConfirmAction}
                    disabled={
                      confirmModal.type === 'publish' &&
                      Array.from(selectedIds).some(id =>
                        validDuplicateIds.has(id)
                      )
                    }
                  >
                    {confirmModal.type === 'delete'
                      ? 'Delete'
                      : confirmModal.type === 'unpublish'
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Info Modal (Read Only) - Reuses Edit Profile modal shell */}
      {showInfoModal && (
        <div
          className="auth-modal-overlay !z-[2100] !items-center"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="edit-profile-modal-container event-details-modal-container"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-details-title"
          >
            {/* Header */}
            <div className="modal-header-standard">
              <h2 id="event-details-title" className="modal-title">
                Event details
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowInfoModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="modal-body-standard">
              {/* Read Only Fields */}
              <div className="flex flex-col gap-5">
                {/* Identity */}
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-black/[0.08]">
                    <img
                      src={event.logo}
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <div className="event-info-title">{event.title}</div>
                    <div className="text-[0.875rem] text-[var(--color-text-secondary)]">
                      {event.dateRange}
                    </div>
                  </div>
                </div>

                {/* Organiser (Text Only) */}
                <div>
                  <label className="event-info-label">Organiser</label>
                  <div className="event-info-value font-medium">
                    EquiSport Events AB
                  </div>
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="event-info-label">City</label>
                    <div className="event-info-value">{event.city}</div>
                  </div>
                  <div>
                    <label className="event-info-label">Venue</label>
                    <div className="event-info-value">{event.venueName}</div>
                  </div>
                  <div>
                    <label className="event-info-label">County</label>
                    <div className="event-info-value">Stockholm County</div>
                  </div>
                  <div>
                    <label className="event-info-label">Country</label>
                    <div className="event-info-value">Sweden</div>
                  </div>
                </div>

                {/* Disciplines */}
                <div>
                  <label className="event-info-label">Disciplines</label>
                  <div className="flex flex-wrap gap-2">
                    {(event.disciplines || []).map(d => (
                      <span key={d} className="event-info-tag">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photographer */}
                <div>
                  <label className="event-info-label">Photographer</label>
                  <div className="event-info-person-chip">
                    <img
                      src={
                        eventPhotographer
                          ? assetUrl(
                              `images/${eventPhotographer.firstName} ${eventPhotographer.lastName}.jpg`
                            )
                          : assetUrl('images/ida.jpg')
                      }
                      alt=""
                      className="w-6 h-6 rounded-full object-cover bg-[var(--color-border)]"
                    />
                    <span className="event-info-person-name">
                      {eventPhotographer
                        ? `${eventPhotographer.firstName} ${eventPhotographer.lastName}`
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer-actions">
              <button
                className="modal-btn-save"
                onClick={() => setShowInfoModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Level Toast (Portal to Body) */}
      {toast &&
        createPortal(
          <div className="pg-toast-portal-wrapper">
            <PgToast
              type={toast.type}
              message={toast.msg}
              onUndo={toast.onUndo}
              className="!pointer-events-auto !relative !transform-none !bottom-auto !left-auto !right-auto"
            />
          </div>,
          document.body
        )}
    </div>
  );
};
