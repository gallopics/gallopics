import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Clock,
  Trash2,
  MoreVertical,
  RotateCcw,
  Save,
  Slash,
  ChevronDown,
  Plus,
  Check,
  Pencil,
  Info,
  ChevronRight,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { usePhotographer, type Photo } from '../../context/PhotographerContext';
import { RIDERS, HORSES } from '../../data/mockData';
import { PgCustomSelect } from './PgCustomSelect';
import { PgToast } from './PgToast';
import { TOAST_TOKENS } from '../../context/ToastTokens';

interface PgSelectionPanelProps {
  isOpen: boolean;
  selectedIds: Set<string>;
  allPhotos: Photo[];
  onClose: () => void;
  activeTab?: 'tags' | 'price';
  currentTab?: 'uploads' | 'published' | 'archive';
  onShowToast?: (
    msg: string,
    type: 'success' | 'moved' | 'warning' | 'danger',
    onUndo?: () => void,
  ) => void;
}

const CLASSES = [
  '1.20m Jumping',
  '1.30m Grand Prix',
  '1.10m Young Horses',
  'Dressage Int. B',
];
const BATCHES = ['Random', 'Misc', 'Uncategorised'];

const BUNDLES = {
  basic: { web: 499, high: 999, commercial: 1500, label: 'Basic' },
  standard: { web: 499, high: 999, commercial: 1500, label: 'Standard' },
  premium: { web: 499, high: 999, commercial: 1500, label: 'Premium' },
};

export const PgSelectionPanel: React.FC<PgSelectionPanelProps> = ({
  isOpen,
  selectedIds,
  allPhotos,
  onClose: propsOnClose,
  activeTab: activeTabProp,
  currentTab,
  onShowToast,
}) => {
  const {
    updatePhotoMetadata,
    deletePhotos,
    updatePhotoStatus,
    restorePhotos,
    republishPhoto,
  } = usePhotographer();

  // Derived Selection
  const selectedPhotos = useMemo(() => {
    return allPhotos.filter(p => selectedIds.has(p.id));
  }, [selectedIds, allPhotos]);

  const isSingle = selectedPhotos.length === 1;
  const count = selectedPhotos.length;
  const firstPhoto = selectedPhotos[0];

  // State for Edits (Tags)
  const [rider, setRider] = useState<string>('');
  const [horse, setHorse] = useState<string>('');
  const [cls, setCls] = useState<string>('');
  const [isGeneric, setIsGeneric] = useState(false);
  const [cachedSelections, setCachedSelections] = useState<{
    rider: string;
    horse: string;
    cls: string;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'summary'>('edit');
  const [editFromSummary, setEditFromSummary] = useState(false);

  // State for Edits (Price)
  const [priceBundle, setPriceBundle] = useState<
    'basic' | 'standard' | 'premium' | 'custom'
  >('standard');
  const [customPriceWeb, setCustomPriceWeb] = useState<string>('');
  const [customPriceHigh, setCustomPriceHigh] = useState<string>('');
  const [customPriceCommercial, setCustomPriceCommercial] =
    useState<string>('');

  // Panel Tab State
  const [panelTab, setPanelTab] = useState<'tags' | 'price'>('tags');

  // Info Panel State
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Original State for dirty check (stores VALUES for price)
  const [originalState, setOriginalState] = useState<{
    rider: string;
    horse: string;
    cls: string;
    isGeneric: boolean;
    title: string;
    description: string;
    priceWeb: number;
    priceHigh: number;
    priceCommercial: number;
    priceBundle: string;
  } | null>(null);

  // Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetBatch, setTargetBatch] = useState<string>('');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    type: 'delete' | 'refresh' | 'close' | 'publish' | 'unpublish';
    isOpen: boolean;
  }>({ type: 'close', isOpen: false });

  const isArchived = useMemo(
    () =>
      selectedPhotos.length > 0 &&
      selectedPhotos.every(p => p.status === 'archived'),
    [selectedPhotos],
  );

  // Filter Logic
  const availableHorses = useMemo(() => {
    return HORSES;
  }, []);

  // Toast State
  const [toast, setToast] = useState<{
    msg: string;
    undo?: () => void;
    type: 'success' | 'moved' | 'warning' | 'danger';
    context: 'global' | 'panel';
  } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (
    msg: string,
    type: 'success' | 'moved' | 'warning' | 'danger',
    context: 'global' | 'panel',
    undo?: () => void,
  ) => {
    if (context === 'global' && onShowToast) {
      onShowToast(msg, type, undo);
      return;
    }
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, undo, type, context });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 6000);
  };

  // Helper to get effective current price based on selection
  const getEffectivePrice = () => {
    if (priceBundle === 'custom') {
      return {
        web: Number(customPriceWeb) || 0,
        high: Number(customPriceHigh) || 0,
        commercial: Number(customPriceCommercial) || 0,
      };
    } else {
      const b = BUNDLES[priceBundle];
      return {
        web: b.web,
        high: b.high,
        commercial: b.commercial,
      };
    }
  };

  // Sync State on Selection Change
  useEffect(() => {
    if (isOpen && activeTabProp) {
      setPanelTab(activeTabProp);
    }
  }, [isOpen, activeTabProp]);

  useEffect(() => {
    if (selectedPhotos.length > 0) {
      const p = selectedPhotos[0];
      const inMissingBucket = !p.batch || p.batch === 'Uncategorised';

      // Metadata State
      const displayTitle = /^Photo \d+$/.test(p.title || '')
        ? ''
        : p.title || '';

      // Price State (Multi: take first)
      const pWeb = p.priceStandard || 499;
      const pHigh = p.priceHigh || 999;
      const pComm = p.priceCommercial || 1500;

      let bundle: 'basic' | 'standard' | 'premium' | 'custom' = 'custom';
      if (
        pWeb === BUNDLES.basic.web &&
        pHigh === BUNDLES.basic.high &&
        pComm === BUNDLES.basic.commercial
      )
        bundle = 'basic';
      else if (
        pWeb === BUNDLES.standard.web &&
        pHigh === BUNDLES.standard.high &&
        pComm === BUNDLES.standard.commercial
      )
        bundle = 'standard';
      else if (
        pWeb === BUNDLES.premium.web &&
        pHigh === BUNDLES.premium.high &&
        pComm === BUNDLES.premium.commercial
      )
        bundle = 'premium';

      // Special case logic for Multi selection:
      if (selectedPhotos.length > 1) {
        setRider('');
        setHorse('');
        setCls('');
        setIsGeneric(false);
        setTitle('');
        setDescription('');

        setPriceBundle(bundle);
        // If custom bundle, pre-fill custom inputs. If standard bundle, empty.
        if (bundle === 'custom') {
          setCustomPriceWeb(pWeb.toString());
          setCustomPriceHigh(pHigh.toString());
          setCustomPriceCommercial(pComm.toString());
        } else {
          setCustomPriceWeb('');
          setCustomPriceHigh('');
          setCustomPriceCommercial('');
        }

        setOriginalState({
          rider: '',
          horse: '',
          cls: '',
          isGeneric: false,
          title: '',
          description: '',
          priceWeb: pWeb,
          priceHigh: pHigh,
          priceCommercial: pComm,
          priceBundle: bundle,
        });
        setViewMode('edit');
      } else {
        // Single
        setRider(p.rider || (inMissingBucket ? 'None' : ''));
        setHorse(p.horse || (inMissingBucket ? 'None' : ''));
        setCls(p.className || (inMissingBucket ? 'None' : ''));
        setIsGeneric(p.isGeneric || false);
        setTitle(displayTitle);
        setDescription(p.description || '');
        setCachedSelections(null);

        setPriceBundle(bundle);
        if (bundle === 'custom') {
          setCustomPriceWeb(pWeb.toString());
          setCustomPriceHigh(pHigh.toString());
          setCustomPriceCommercial(pComm.toString());
        } else {
          setCustomPriceWeb('');
          setCustomPriceHigh('');
          setCustomPriceCommercial('');
        }

        setOriginalState({
          rider: p.rider || (inMissingBucket ? 'None' : ''),
          horse: p.horse || (inMissingBucket ? 'None' : ''),
          cls: p.className || (inMissingBucket ? 'None' : ''),
          isGeneric: p.isGeneric || false,
          title: displayTitle,
          description: p.description || '',
          priceWeb: pWeb,
          priceHigh: pHigh,
          priceCommercial: pComm,
          priceBundle: bundle,
        });

        if (p.isGeneric && (displayTitle || p.description)) {
          setViewMode('summary');
        } else {
          setViewMode('edit');
        }
      }
    }
  }, [selectedPhotos]);

  // Computed Dirty
  const [touched, setTouched] = useState(false);

  const isDirty = useMemo(() => {
    if (!originalState) return false;

    // Price check
    const currentPrice = getEffectivePrice();
    const priceDirty =
      priceBundle !== originalState.priceBundle ||
      currentPrice.web !== originalState.priceWeb ||
      currentPrice.high !== originalState.priceHigh ||
      currentPrice.commercial !== originalState.priceCommercial;

    // Tags and Mode check
    let tagsDirty = false;
    let modeDirty = false;

    if (isSingle) {
      tagsDirty =
        rider !== originalState.rider ||
        horse !== originalState.horse ||
        cls !== originalState.cls;
      modeDirty = isGeneric !== originalState.isGeneric;
      if (isGeneric) {
        // If currently generic, check title/description
        tagsDirty =
          tagsDirty ||
          title !== originalState.title ||
          description !== originalState.description;
      }
    } else {
      // For multi-selection, we rely on the 'touched' state for tags.
      // If any tag field was edited, 'touched' would be true.
      // If the current values are different from the original (which would be empty for multi-edit), it's dirty.
      // This is a simplified check for multi-select tags.
      tagsDirty = touched && (!!rider || !!horse || !!cls || isGeneric);
    }

    return tagsDirty || modeDirty || priceDirty;
  }, [
    rider,
    horse,
    cls,
    isGeneric,
    title,
    description,
    priceBundle,
    customPriceWeb,
    customPriceHigh,
    customPriceCommercial,
    originalState,
    isSingle,
    touched,
    description,
  ]);

  const canReset = useMemo(() => {
    return (
      (!!rider && rider !== 'None') ||
      (!!horse && horse !== 'None') ||
      (!!cls && cls !== 'None') ||
      isGeneric ||
      !!title ||
      !!description
    );
  }, [rider, horse, cls, isGeneric, title, description]);

  // Handlers
  const handleChange = (field: string, value: string) => {
    setTouched(true);
    if (field === 'rider') setRider(value);
    if (field === 'horse') setHorse(value);
    if (field === 'cls') setCls(value);
    if (field === 'title') setTitle(value);
    if (field === 'description') setDescription(value);

    if (field === 'customPriceWeb') {
      setCustomPriceWeb(value);
      setCustomPriceHigh(value);
      setCustomPriceCommercial(value);
      setPriceBundle('custom');
    }
  };

  const handleBundleSelect = (
    bundle: 'basic' | 'standard' | 'premium' | 'custom',
  ) => {
    setTouched(true);
    setPriceBundle(bundle);
    // Do NOT overwrite custom inputs from bundle values
  };

  const toggleGeneric = () => {
    setTouched(true);
    const willBeGeneric = !isGeneric;
    setIsGeneric(willBeGeneric);
    if (willBeGeneric) {
      setCachedSelections({ rider, horse, cls });
      setRider('None');
      setHorse('None');
      setCls('None');
    } else {
      if (cachedSelections) {
        setRider(cachedSelections.rider);
        setHorse(cachedSelections.horse);
        setCls(cachedSelections.cls);
      }
    }
  };

  const enterEditMode = () => {
    setViewMode('edit');
    setEditFromSummary(true);
  };

  const handleReset = () => {
    if (!canReset) return;
    setConfirmModal({ type: 'refresh', isOpen: true });
  };

  const confirmRefresh = () => {
    const undoSnapshot = {
      rider: rider === 'None' ? '' : rider,
      horse: horse === 'None' ? '' : horse,
      className: cls === 'None' ? '' : cls,
      isGeneric,
      title,
      description,
    };
    // Price reset logic: Not resetting prices on tag refresh

    setRider('');
    setHorse('');
    setCls('');
    setIsGeneric(false);
    setTitle('');
    setDescription('');
    setTouched(true);

    const ids = selectedPhotos.map(p => p.id);
    const updates = {
      rider: '',
      horse: '',
      className: '',
      isGeneric: false,
      title: '',
      description: '',
    };
    updatePhotoMetadata(ids, updates);

    // Preserve Price in "Original State" reset if we treat Refresh as a Tag Reset only?
    // Prompt implies Refresh only affects tags.
    // So we should Update Original State for Tags BUT Keep Price?
    // Or essentially, we are committing standard Tag state.

    setOriginalState(prev =>
      prev
        ? {
            ...prev,
            rider: '',
            horse: '',
            cls: '',
            isGeneric: false,
            title: '',
            description: '',
          }
        : null,
    );

    setTouched(false);
    setViewMode('edit');

    triggerToast('Tags refreshed', 'warning', 'panel', () => {
      updatePhotoMetadata(ids, undoSnapshot);
    });
    setConfirmModal({ type: 'refresh', isOpen: false });
  };

  const onCloseSafe = () => {
    if (isDirty) {
      setConfirmModal({ type: 'close', isOpen: true });
    } else {
      propsOnClose();
    }
  };

  const confirmCloseDiscard = () => {
    setTouched(false);
    setConfirmModal({ type: 'close', isOpen: false });
    propsOnClose();
  };

  const handleSave = () => {
    const ids = selectedPhotos.map(p => p.id);
    const prevMetadata = selectedPhotos.map(p => ({
      id: p.id,
      rider: p.rider,
      horse: p.horse,
      className: p.className,
      isGeneric: p.isGeneric,
      title: p.title,
      description: (p as any).description,
      priceStandard: p.priceStandard,
      priceHigh: p.priceHigh,
      priceCommercial: p.priceCommercial,
    }));

    const updates: Partial<Photo> & {
      description?: string;
      isGeneric?: boolean;
    } = {};

    // Tag Updates
    if (isSingle) {
      updates.rider = rider === 'None' ? '' : rider;
      updates.horse = horse === 'None' ? '' : horse;
      updates.className = cls === 'None' ? '' : cls;
      updates.isGeneric = isGeneric;
      if (isGeneric) {
        updates.title = title;
        updates.description = description;
      }
    } else {
      if (rider) updates.rider = rider === 'None' ? '' : rider;
      if (horse) updates.horse = horse === 'None' ? '' : horse;
      if (cls) updates.className = cls === 'None' ? '' : cls;
      if (isGeneric) {
        updates.isGeneric = true;
        updates.rider = '';
        updates.horse = '';
        updates.className = '';
      }
    }

    // Price Updates
    const finalPrice = getEffectivePrice();
    updates.priceStandard = finalPrice.web;
    updates.priceHigh = finalPrice.high;
    updates.priceCommercial = finalPrice.commercial;

    updatePhotoMetadata(ids, updates);

    triggerToast('Changes saved', 'success', 'panel', () => {
      prevMetadata.forEach(meta => {
        updatePhotoMetadata([meta.id], {
          rider: meta.rider,
          horse: meta.horse,
          className: meta.className,
          isGeneric: meta.isGeneric,
          title: meta.title || '',
          description: meta.description || '',
          priceStandard: meta.priceStandard,
          priceHigh: meta.priceHigh,
          priceCommercial: meta.priceCommercial,
        });
      });
    });

    setOriginalState({
      rider,
      horse,
      cls,
      isGeneric,
      title,
      description,
      priceWeb: finalPrice.web,
      priceHigh: finalPrice.high,
      priceCommercial: finalPrice.commercial,
      priceBundle,
    });
    setTouched(false);

    if (isSingle && isGeneric && (title || description)) {
      setViewMode('summary');
    }
    setEditFromSummary(false);
  };

  const handleCancel = () => {
    if (originalState) {
      setRider(originalState.rider);
      setHorse(originalState.horse);
      setCls(originalState.cls);
      setIsGeneric(originalState.isGeneric);
      setTitle(originalState.title);
      setDescription(originalState.description);

      // Re-calc bundle from original state
      const pWeb = originalState.priceWeb;
      const pHigh = originalState.priceHigh;
      const pComm = originalState.priceCommercial;

      let bundle: 'basic' | 'standard' | 'premium' | 'custom' = 'custom';
      if (
        pWeb === BUNDLES.basic.web &&
        pHigh === BUNDLES.basic.high &&
        pComm === BUNDLES.basic.commercial
      )
        bundle = 'basic';
      else if (
        pWeb === BUNDLES.standard.web &&
        pHigh === BUNDLES.standard.high &&
        pComm === BUNDLES.standard.commercial
      )
        bundle = 'standard';
      else if (
        pWeb === BUNDLES.premium.web &&
        pHigh === BUNDLES.premium.high &&
        pComm === BUNDLES.premium.commercial
      )
        bundle = 'premium';

      setPriceBundle(bundle);
      if (bundle === 'custom') {
        setCustomPriceWeb(pWeb.toString());
        setCustomPriceHigh(pHigh.toString());
        setCustomPriceCommercial(pComm.toString());
      } else {
        setCustomPriceWeb('');
        setCustomPriceHigh('');
        setCustomPriceCommercial('');
      }
      // Ensure inputs are reset if we were in custom mode editing but then cancelled to a bundle?
      // "If user typed custom values, switching away... preserve custom values internally... switching back restores".
      // If I Cancel, I should restore the *Saved* state.
      // My implementation clears custom inputs if restored state is Bundle. Correct.
      // If restored state was Custom, it restores custom inputs. Correct.

      setTouched(false);
      if (
        originalState.isGeneric &&
        (originalState.title || originalState.description)
      ) {
        setViewMode('summary');
      } else {
        setViewMode('edit');
      }
      setEditFromSummary(false);
    }
  };

  const handlePublish = () => {
    setConfirmModal({ type: 'publish', isOpen: true });
  };

  const confirmPublish = () => {
    const ids = selectedPhotos.map(p => p.id);
    const undoSnapshot = [...selectedPhotos];

    if (isArchived) {
      ids.forEach(id => republishPhoto(id));
      triggerToast('Photo republished', 'success', 'panel', () => {
        restorePhotos(undoSnapshot);
        triggerToast('Republish undone (Original restored)', 'moved', 'panel');
      });
    } else {
      updatePhotoStatus(ids, 'published');
      triggerToast('Photos published', 'success', 'panel', () => {
        undoSnapshot.forEach(p => {
          updatePhotoStatus([p.id], p.status);
        });
        triggerToast('Publish undone', 'moved', 'panel');
      });
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
    propsOnClose();
  };

  const handleUnpublish = () => {
    setConfirmModal({ type: 'unpublish', isOpen: true });
  };

  const confirmUnpublish = () => {
    const ids = selectedPhotos.map(p => p.id);
    const undoSnapshot = [...selectedPhotos];

    updatePhotoStatus(ids, 'archived');
    triggerToast(
      `${count} photo${count > 1 ? 's' : ''} moved to Archive`,
      'danger',
      'panel',
      () => {
        undoSnapshot.forEach(p => {
          updatePhotoStatus([p.id], p.status);
        });
        triggerToast('Unpublish undone', 'moved', 'panel');
      },
    );
    setConfirmModal({ ...confirmModal, isOpen: false });
    propsOnClose();
  };

  const handleDeleteInit = () => {
    setConfirmModal({ type: 'delete', isOpen: true });
  };

  const confirmDelete = () => {
    const ids = selectedPhotos.map(p => p.id);
    const undoSnapshot = [...selectedPhotos];

    deletePhotos(ids);
    setConfirmModal({ type: 'delete', isOpen: false });
    propsOnClose();

    triggerToast('Photo deleted', TOAST_TOKENS.DELETE.type, 'global', () => {
      restorePhotos(undoSnapshot);
      triggerToast('Delete undone', 'moved', 'global');
    });
  };

  const handleMoveInit = () => {
    setIsMoveModalOpen(true);
    setTargetBatch('');
    setIsCreatingBatch(false);
    setIsDropdownOpen(false);
  };

  const handleMoveConfirm = () => {
    const finalBatch = isCreatingBatch ? newBatchName : targetBatch;
    if (!finalBatch) return;

    const ids = selectedPhotos.map(p => p.id);
    const prevMetadata = selectedPhotos.map(p => ({
      id: p.id,
      batch: p.batch || 'Uncategorised',
      storedLocation: p.storedLocation,
    }));

    updatePhotoMetadata(ids, {
      batch: finalBatch,
      storedLocation: (['Random', 'Misc', 'Uncategorised'].includes(finalBatch)
        ? finalBatch
        : 'Misc') as any,
    });

    const undoAction = () => {
      const batches = new Set(prevMetadata.map(p => p.batch));
      batches.forEach(b => {
        const idsForBatch = prevMetadata
          .filter(p => p.batch === b)
          .map(p => p.id);
        const loc = (
          ['Random', 'Misc', 'Uncategorised'].includes(b) ? b : 'Misc'
        ) as any;
        updatePhotoMetadata(idsForBatch, {
          batch: b === 'Uncategorised' ? '' : b,
          storedLocation: loc,
        });
      });
      triggerToast('Move undone', 'moved', 'global');
    };

    triggerToast(
      `Moved ${isSingle ? 'photo' : `${count} photos`} to ${finalBatch}`,
      'moved',
      'global',
      undoAction,
    );

    setIsMoveModalOpen(false);
    propsOnClose();
  };

  const currentBatch = useMemo(() => {
    if (selectedPhotos.length === 0) return null;
    const first = selectedPhotos[0].batch || 'Uncategorised';
    const allMatch = selectedPhotos.every(
      p => (p.batch || 'Uncategorised') === first,
    );
    return allMatch ? first : null;
  }, [selectedPhotos]);

  return (
    <>
      <div className={`pg-selection-panel ${isOpen ? 'is-open' : ''}`}>
        <div className="pg-panel-header">
          <span className="pg-panel-title">Selection details</span>
          <button
            className="pg-panel-close"
            onClick={onCloseSafe}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="pg-panel-scroll-area relative">
          {!isSingle && count > 0 && (
            <div className="pg-panel-section">
              <div className="pg-panel-label mb-4">
                Multiple selection ({count})
              </div>
            </div>
          )}

          {isSingle && firstPhoto && (
            <div className="pg-panel-meta-block">
              <img src={firstPhoto.url} alt="" className="pg-panel-thumb" />
              <div className="pg-meta-info">
                <div className="pg-meta-filename" title={firstPhoto.fileName}>
                  {firstPhoto.fileName}
                </div>
                <div className="pg-meta-id">
                  {firstPhoto.photoCode || firstPhoto.id}
                </div>
                <div className="pg-meta-date">
                  <Clock size={14} />
                  <span>
                    {firstPhoto.uploadDate} • {firstPhoto.timestamp}
                  </span>
                </div>
              </div>
            </div>
          )}

          {(isSingle || count > 0) && (
            <div className="pg-panel-section">
              {/* COMPACT TABS */}
              <div className="pg-panel-compact-tabs">
                <button
                  className={`pg-panel-compact-tab ${panelTab === 'tags' ? 'active' : ''}`}
                  onClick={() => setPanelTab('tags')}
                >
                  Tags
                </button>
                <button
                  className={`pg-panel-compact-tab ${panelTab === 'price' ? 'active' : ''}`}
                  onClick={() => setPanelTab('price')}
                >
                  Price
                </button>
              </div>

              {/* TAGS TAB CONTENT */}
              {panelTab === 'tags' && (
                <>
                  <div className="pg-panel-section-header">
                    <span className="pg-panel-label">
                      What do you see in the image
                    </span>
                    <button
                      className="reset-btn"
                      onClick={handleReset}
                      title={canReset ? 'Refresh tags' : 'Nothing to reset'}
                      disabled={!canReset}
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>

                  {/* EDIT MODE */}
                  {viewMode === 'edit' ? (
                    <>
                      {!isGeneric ? (
                        <>
                          <div className="pg-form-group">
                            <Label text="Rider" />
                            <div className="pg-form-row">
                              <PgCustomSelect
                                value={rider}
                                onChange={val => handleChange('rider', val)}
                                options={[
                                  { label: 'None', value: 'None' },
                                  ...RIDERS.map(r => ({
                                    label: `${r.firstName} ${r.lastName}`,
                                    value: `${r.firstName} ${r.lastName}`,
                                  })),
                                ]}
                                placeholder={
                                  isSingle
                                    ? 'Select Rider...'
                                    : rider
                                      ? 'Mixed (Overwriting)'
                                      : 'Mixed (Keep existing)'
                                }
                              />
                            </div>
                          </div>

                          <div className="pg-form-group">
                            <Label text="Horse" />
                            <div className="pg-form-row">
                              <PgCustomSelect
                                value={horse}
                                onChange={val => handleChange('horse', val)}
                                options={[
                                  { label: 'None', value: 'None' },
                                  ...availableHorses.map(h => ({
                                    label: h.name,
                                    value: h.name,
                                  })),
                                ]}
                                placeholder={
                                  isSingle
                                    ? 'Select Horse...'
                                    : 'Mixed (Keep existing)'
                                }
                              />
                            </div>
                          </div>

                          <div className="pg-form-group">
                            <Label text="Class" />
                            <div className="pg-form-row">
                              <PgCustomSelect
                                value={cls}
                                onChange={val => handleChange('cls', val)}
                                options={[
                                  { label: 'None', value: 'None' },
                                  ...CLASSES.map(c => ({ label: c, value: c })),
                                ]}
                                placeholder={
                                  isSingle
                                    ? 'Select Class...'
                                    : 'Mixed (Keep existing)'
                                }
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mb-6 py-3 text-[var(--color-border)] text-[0.75rem] italic">
                          No rider, horse, or class info.
                        </div>
                      )}

                      {/* OR Separator */}
                      {!isGeneric && (
                        <div className="pg-tags-or-separator flex items-center my-4 gap-3">
                          <div className="flex-1 h-px bg-[var(--color-border)]" />
                          <span className="text-[0.625rem] font-bold text-[var(--color-text-tertiary)] tracking-[0.05em]">
                            OR
                          </span>
                          <div className="flex-1 h-px bg-[var(--color-border)]" />
                        </div>
                      )}

                      {/* Generic Option — available for single and multi-select */}
                      <div
                        className={`pg-form-group${isGeneric ? '' : ' mt-4'}`}
                      >
                        <div
                          className="pg-scan-checkbox-row flex items-center gap-[10px] cursor-pointer"
                          onClick={toggleGeneric}
                        >
                          <div
                            className={`pg-new-checkbox ${isGeneric ? 'checked' : ''}`}
                          >
                            {isGeneric && (
                              <Check size={12} color="#fff" strokeWidth={3} />
                            )}
                          </div>
                          <span className="text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
                            {isSingle
                              ? 'Mark this as a generic photo'
                              : `Mark all ${count} photos as generic`}
                          </span>
                        </div>
                        {!isSingle && isGeneric && (
                          <p className="text-[0.75rem] text-[var(--color-text-secondary)] mt-2 ml-[26px] leading-[1.4]">
                            Rider, horse, and class tags will be cleared for all
                            selected photos.
                          </p>
                        )}
                      </div>

                      {/* Specific Fields (Generic Only) */}
                      {isGeneric && (
                        <div className="mt-4 p-4 bg-[var(--ui-bg-subtle)] rounded-lg">
                          <div className="pg-form-group">
                            <Label text="Title" />
                            <input
                              className="pg-panel-input"
                              value={title}
                              onChange={e =>
                                handleChange('title', e.target.value)
                              }
                              maxLength={20}
                              placeholder="Pricing ceremony"
                            />
                          </div>
                          <div className="pg-form-group">
                            <Label text="Description" />
                            <textarea
                              className="pg-panel-textarea"
                              value={description}
                              onChange={e =>
                                handleChange('description', e.target.value)
                              }
                              maxLength={30}
                              placeholder=""
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* SUMMARY MODE (Generic Saved) */
                    <div className="mt-4 p-4 bg-[var(--ui-bg-subtle)] rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          Generic photo
                        </div>
                        <button
                          onClick={enterEditMode}
                          className="bg-transparent border-none cursor-pointer p-1 text-[var(--color-border)] hover:text-[var(--color-text-secondary)]"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      {title && (
                        <div className="text-[0.875rem] font-medium text-[var(--color-text-primary)] mb-1">
                          {title}
                        </div>
                      )}
                      {description && (
                        <div className="text-[0.8125rem] text-[var(--color-text-secondary)] leading-[1.4]">
                          {description}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* PRICE TAB CONTENT */}
              {panelTab === 'price' && (
                <div>
                  <div className="pg-panel-section-header">
                    <span className="pg-panel-label">Pricing bundle</span>
                    <button
                      className="reset-btn"
                      onClick={() => setIsInfoOpen(!isInfoOpen)}
                      title="Pricing Info"
                    >
                      <Info size={18} />
                    </button>
                  </div>

                  <div className="pg-price-bundle-list flex flex-col gap-3 mb-6">
                    {(Object.keys(BUNDLES) as Array<keyof typeof BUNDLES>).map(
                      key => {
                        const b = BUNDLES[key];
                        const isSelected = priceBundle === key;
                        // Bundle Colors: Basic=Grey, Standard=Orange, Premium=Purple
                        const colors = {
                          basic: {
                            dot: 'var(--color-text-secondary)',
                            bg: 'var(--ui-bg-subtle)',
                            border: 'var(--color-border)',
                          },
                          standard: {
                            dot: '#f97316',
                            bg: '#ffedd5',
                            border: '#fed7aa',
                          },
                          premium: {
                            dot: '#a855f7',
                            bg: '#f3e8ff',
                            border: '#e9d5ff',
                          },
                        };
                        const c = (colors as any)[key] || colors.basic;

                        const info = {
                          basic: {
                            subtitle: 'Web quality',
                            support: 'Best for social media and screen use.',
                            primaryPrice: b.web,
                            others: `High ${b.high} / Comm. ${b.commercial}`,
                          },
                          standard: {
                            subtitle: 'High quality',
                            support: 'Best for printing and large displays.',
                            primaryPrice: b.high,
                            others: `Web ${b.web} / Comm. ${b.commercial}`,
                          },
                          premium: {
                            subtitle: 'Commercial use',
                            support: 'Best for printing and large displays.',
                            primaryPrice: b.commercial,
                            others: `Web ${b.web} / High ${b.high}`,
                          },
                        }[key];

                        return (
                          <div
                            key={key}
                            onClick={() => handleBundleSelect(key)}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              padding: '12px 12px 12px 16px',
                              border: `1px solid ${isSelected ? c.dot : 'var(--color-border)'}`,
                              borderRadius: 8,
                              background: isSelected ? c.bg : '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            {/* Left Accent Bar */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1"
                              style={{ background: c.dot }}
                            />
                            <div
                              className="w-4 h-4 rounded-full bg-white mt-0.5 flex items-center justify-center shrink-0"
                              style={{
                                border: `1px solid ${isSelected ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                              }}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <div className="text-[0.8125rem] font-medium text-primary">
                                  {b.label}
                                </div>
                                <div className="text-[0.8125rem] font-normal text-secondary">
                                  {info.primaryPrice} SEK
                                </div>
                              </div>
                              <div className="text-[0.75rem] text-[var(--color-text-secondary)] mb-0.5">
                                {info.subtitle}
                              </div>
                              <div className="text-[0.75rem] text-secondary leading-[1.4]">
                                {info.support}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                    {/* Custom Bundle Card */}
                    <div
                      onClick={() => handleBundleSelect('custom')}
                      style={{
                        padding: 12,
                        border: `1px solid ${priceBundle === 'custom' ? '#facc15' : 'var(--color-border)'}`,
                        borderRadius: 8,
                        background:
                          priceBundle === 'custom' ? '#fef9c3' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full bg-white mt-0.5 flex items-center justify-center"
                          style={{
                            border: `1px solid ${priceBundle === 'custom' ? '#facc15' : 'var(--color-border)'}`,
                          }}
                        >
                          {priceBundle === 'custom' && (
                            <div className="w-2 h-2 rounded-full bg-[#facc15]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[0.8125rem] font-medium text-primary">
                            Custom
                          </div>
                          {priceBundle !== 'custom' && (
                            <div className="text-[0.75rem] text-secondary">
                              Set your own price for all levels
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Inputs for Custom */}
                      {priceBundle === 'custom' && (
                        <div className="pg-form-group mt-3 ml-7">
                          <div className="text-[var(--fs-xs)] text-secondary mb-1">
                            Price (SEK)
                          </div>
                          <input
                            className="pg-panel-input w-1/2"
                            type="text"
                            inputMode="numeric"
                            value={customPriceWeb}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleChange('customPriceWeb', val);
                            }}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`pg-panel-footer ${isDirty || editFromSummary ? 'dirty-state' : ''}`}
        >
          {isDirty || editFromSummary ? (
            <>
              <button className="pg-panel-btn secondary" onClick={handleCancel}>
                <Slash size={16} /> Cancel
              </button>
              <button className="pg-panel-btn primary" onClick={handleSave}>
                <Save size={16} /> Save changes
              </button>
            </>
          ) : (
            <>
              {currentTab === 'published' ? (
                <button
                  className="pg-panel-btn destructive"
                  onClick={handleUnpublish}
                >
                  Unpublish
                </button>
              ) : (
                <button
                  className="pg-panel-btn primary"
                  onClick={handlePublish}
                >
                  {isArchived ? 'Republish' : 'Publish'}
                </button>
              )}
              <div className="flex gap-2">
                {currentTab !== 'published' && (
                  <button
                    className="pg-panel-btn icon-only secondary delete-action"
                    title="Delete"
                    onClick={handleDeleteInit}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  className="pg-panel-btn icon-only secondary"
                  title="Move to..."
                  onClick={handleMoveInit}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Confirm Modals etc ... same as before */}
        {isMoveModalOpen && (
          <div
            className="pg-panel-confirm-overlay"
            onClick={() => setIsMoveModalOpen(false)}
          >
            <div
              className="pg-panel-confirm-card"
              onClick={e => e.stopPropagation()}
            >
              <h3>Move to other folder</h3>
              <div className="pg-modal-body mb-6">
                {!isCreatingBatch ? (
                  <>
                    <div className="text-[0.8125rem] font-semibold text-secondary mb-2">
                      Select Folder
                    </div>
                    <div
                      className="pg-custom-select-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>{targetBatch || 'Select folder...'}</span>
                      <ChevronDown
                        size={16}
                        color="var(--color-text-secondary)"
                      />
                      {isDropdownOpen && (
                        <div
                          className="pg-custom-select-list"
                          onClick={e => e.stopPropagation()}
                        >
                          {BATCHES.map(b => {
                            const isDisabled = b === currentBatch;
                            return (
                              <div
                                key={b}
                                className={`pg-select-option ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setTargetBatch(b);
                                    setIsDropdownOpen(false);
                                  }
                                }}
                              >
                                {b}
                                {isDisabled && (
                                  <span className="text-[var(--fs-xs)] text-[var(--color-text-secondary)]">
                                    Current folder
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          <div
                            className="pg-select-option create-new"
                            onClick={() => {
                              setIsCreatingBatch(true);
                              setTargetBatch('');
                              setIsDropdownOpen(false);
                            }}
                          >
                            <Plus size={14} className="mr-1.5" />
                            Create new folder...
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="pg-form-group">
                    <div className="text-[0.8125rem] font-semibold text-secondary mb-2">
                      New Folder Name
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="pg-panel-input"
                        placeholder="Enter name..."
                        value={newBatchName}
                        onChange={e => setNewBatchName(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="pg-panel-btn secondary icon-only"
                        onClick={() => setIsCreatingBatch(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="pg-panel-confirm-actions">
                <button
                  className="pg-panel-btn secondary"
                  onClick={() => setIsMoveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="pg-panel-btn primary"
                  onClick={handleMoveConfirm}
                  disabled={!isCreatingBatch ? !targetBatch : !newBatchName}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unified Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="pg-panel-confirm-overlay">
            <div className="pg-panel-confirm-card">
              <h3>
                {confirmModal.type === 'delete' && 'Delete photo?'}
                {confirmModal.type === 'refresh' && 'Refresh tags?'}
                {confirmModal.type === 'close' && 'Discard changes?'}
                {confirmModal.type === 'publish' &&
                  (isArchived ? 'Republish photo?' : 'Publish photo?')}
                {confirmModal.type === 'unpublish' && 'Unpublish photo?'}
              </h3>
              <p>
                {confirmModal.type === 'delete' &&
                  'This will remove the photo from this event. You can undo right after deleting.'}
                {confirmModal.type === 'refresh' &&
                  'This will revert tags to organiser data and remove your custom title/description.'}
                {confirmModal.type === 'close' &&
                  'You have unsaved changes. Are you sure you want to discard them?'}
                {confirmModal.type === 'publish' &&
                  'This will make the photo available for buyers.'}
                {confirmModal.type === 'unpublish' &&
                  'This will move the photo to the Archive tab.'}
              </p>
              <div className="pg-panel-confirm-actions">
                <button
                  className="pg-panel-btn secondary"
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, isOpen: false })
                  }
                >
                  Cancel
                </button>
                {confirmModal.type === 'delete' && (
                  <button
                    className="pg-panel-btn destructive"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                )}
                {confirmModal.type === 'refresh' && (
                  <button
                    className="pg-panel-btn primary"
                    onClick={confirmRefresh}
                  >
                    Refresh
                  </button>
                )}
                {confirmModal.type === 'close' && (
                  <button
                    className="pg-panel-btn destructive"
                    onClick={confirmCloseDiscard}
                  >
                    Discard
                  </button>
                )}
                {confirmModal.type === 'publish' && (
                  <button
                    className="pg-panel-btn primary"
                    onClick={confirmPublish}
                  >
                    {isArchived ? 'Republish' : 'Publish'}
                  </button>
                )}
                {confirmModal.type === 'unpublish' && (
                  <button
                    className="pg-panel-btn destructive"
                    onClick={confirmUnpublish}
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Panel Overlay (Covering entire panel) */}
        {isInfoOpen && (
          <div className="absolute inset-0 bg-[var(--color-surface)] z-[2000] flex flex-col [animation:fadeIn_0.2s_ease-out]">
            {/* Header: Back + Info + Close */}
            <div className="pg-panel-header justify-between pr-6 pl-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="bg-transparent border-none cursor-pointer p-2 -m-2 flex items-center justify-center text-primary"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="pg-panel-title">Info</span>
              </div>
              <button
                className="pg-panel-close"
                onClick={onCloseSafe}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="pg-panel-scroll-area p-6">
              {/* Quality Info */}
              <div className="mb-6">
                <div className="text-[0.875rem] font-semibold text-primary mb-4">
                  Quality info
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[0.875rem] font-medium text-primary mb-0.5">
                      Web quality
                    </div>
                    <div className="text-[0.8125rem] text-secondary">
                      Best for screen and social media.
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.875rem] font-medium text-primary mb-0.5">
                      High quality
                    </div>
                    <div className="text-[0.8125rem] text-secondary">
                      Best for print and large displays.
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.875rem] font-medium text-primary mb-0.5">
                      Commercial use
                    </div>
                    <div className="text-[0.8125rem] text-secondary">
                      Best for print and large displays.
                    </div>
                  </div>
                  <div className="text-[0.75rem] text-[var(--ui-icon-muted)] leading-[1.5]">
                    Gallopics automatically delivers the right resolution—no
                    extra prep needed.
                  </div>
                </div>
              </div>

              <div className="border-b border-[var(--ui-bg-subtle)] mb-6" />

              {/* Earnings Split */}
              <div className="mb-6">
                <div className="text-[0.875rem] font-semibold text-primary mb-4">
                  Earnings split
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[0.875rem]">
                    <span className="text-secondary">Photographer</span>
                    <span className="font-semibold text-primary">75%</span>
                  </div>
                  <div className="flex justify-between text-[0.875rem]">
                    <span className="text-secondary">Gallopics</span>
                    <span className="font-semibold text-primary">15%</span>
                  </div>
                  <div className="flex justify-between text-[0.875rem]">
                    <span className="text-secondary">Organiser</span>
                    <span className="font-semibold text-primary">10%</span>
                  </div>
                  <div className="text-[0.8125rem] text-[var(--ui-icon-muted)] mt-2 leading-[1.5]">
                    Taxes depend on your status (freelancer vs business).
                    Receipts are generated automatically.
                  </div>
                </div>
              </div>

              <div className="border-b border-[var(--ui-bg-subtle)] mb-6" />

              {/* Links */}
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Terms of Service',
                    icon: (
                      <ChevronRight size={15} color="var(--color-border)" />
                    ),
                  },
                  {
                    label: 'Privacy Policy',
                    icon: (
                      <ChevronRight size={15} color="var(--color-border)" />
                    ),
                  },
                  {
                    label: 'FAQ',
                    icon: <HelpCircle size={15} color="var(--color-border)" />,
                  },
                ].map(({ label, icon }) => (
                  <a
                    key={label}
                    href="#"
                    className="no-underline flex items-center justify-between py-1"
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-primary)',
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.color =
                        'var(--color-brand-primary)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.color =
                        'var(--color-text-primary)')
                    }
                  >
                    {label} {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {toast && toast.context === 'panel' && (
          <PgToast
            type={
              toast.type === 'moved'
                ? 'success'
                : toast.type === 'warning'
                  ? 'info'
                  : toast.type === 'danger'
                    ? 'danger'
                    : 'success'
            }
            message={toast.msg}
            onUndo={toast.undo}
            className="bottom-[84px] left-6 right-6 w-auto min-w-[200px]"
          />
        )}
      </div>
    </>
  );
};

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      fontSize: '0.75rem',
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      marginBottom: 6,
    }}
  >
    {text}
  </div>
);
