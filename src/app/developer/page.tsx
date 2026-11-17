'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Eye,
  LogOut,
  Sliders,
  Megaphone,
  EyeOff,
  Trophy,
  Gamepad2,
  DoorOpen,
  Plus,
  Check,
  Copy,
  Search,
  User,
  Shield,
  Sparkles,
  Wrench,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Radio,
  StopCircle,
  ShoppingBag,
  DollarSign,
  Wallet,
  CreditCard,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  FileCode,
  Gift,
  Award,
  Star,
  Save,
  X,
  Globe,
  Volume2,
  VolumeX,
  Camera,
  HeartHandshake,
  Target,
  QrCode,
  TrendingUp,
  HandCoins,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode, AppMode } from '@/context/DevModeContext';
import {
  getGreetingName,
  MemberProfile,
  CommunityAnnouncement,
  XpActivityRule,
  XpLevelTier,
  PortalDoorSettings,
  ImpactCampaignSettings,
  NeonCampaignSummary,
  NeonCampaignDetail,
  GiveGetServiceCategory,
} from '@/lib/types';
import {
  fetchCommunityAnnouncement,
  updateCommunityAnnouncement,
  searchNeonAccounts,
  searchMemberByTapCard,
  fetchMemberProfileByAccountId,
  CostumeContestVisibility,
  setCostumeContestStatus,
  updateMemberStoreBalance,
  topUpMemberStoreBalance,
  NEON_STORE_DONATION_FORM_URL,
  MAX_STORE_TAB_LIMIT,
  fetchStoreItemsFromSheet,
  fetchStoreItems,
  STORE_BALANCE_FIELD_ID,
  BUDDY_AVATAR_FIELD_ID,
  BUDDY_BUCKS_FIELD_ID,
  XP_FIELD_ID,
  STORE_CAMPAIGN_CODE,
  updateGlobalAppSettings,
  fetchPortalDoorSettings,
  updatePortalDoorSettings,
  fetchNeonCampaigns,
  fetchNeonCampaignDetail,
  fetchImpactCampaignSettings,
  saveImpactCampaignSettings,
  DEFAULT_IMPACT_SETTINGS,
  fetchBoardRosterSummary,
  DEFAULT_GIVE_GET_HOURLY_RATE,
  DEFAULT_GIVE_GET_CATEGORIES,
  getGiveGetServiceCategories,
  saveGiveGetServiceCategories,
} from '@/lib/neon';
import {
  fetchXpActivityRules,
  saveXpActivityRules,
  resetXpActivityRules,
  fetchXpLevelTiers,
  saveXpLevelTiers,
  resetXpLevelTiers,
  awardMemberXp,
  setMemberXpDirectly,
  calculateLevelFromXp,
} from '@/lib/gamification';
import { APP_VERSION } from '@/lib/version';
import {
  BuddyItem,
  BuddyLayerCategory,
} from '@/lib/types';
import {
  getAllBuddyItems,
  fetchBuddyItemsFromSheet,
  saveCustomBuddyItem,
  deleteCustomBuddyItem,
  formatCategoryLabel,
  awardBuddyBucks,
  loadMemberBuddyBucks,
  getCategoryLayerOrder,
  saveCategoryLayerOrder,
  resetCategoryLayerOrder,
  DEFAULT_CATEGORY_LAYER_ORDER,
} from '@/lib/buddy';
import { BuddyCanvas } from '@/components/buddy/BuddyCanvas';
import { DigitalThermometer } from '@/components/impact/DigitalThermometer';
import { Palette, Shirt, Coins, Crown, Smile, Footprints } from 'lucide-react';

// Import canonical universal certification registry
// @ts-ignore
import SMCertifications from '../../../public/shared/sm-certifications.js';

interface ToolItem {
  id: string;
  name: string;
  category: string;
  color: string;
  keywords: string[];
  iconSvg: string;
}

type DevSubTab = 'impersonate' | 'announcements' | 'visibility' | 'impact' | 'give-get' | 'portal-door' | 'buddy-assets' | 'store' | 'gamification' | 'icons' | 'system';

export default function DeveloperPage() {
  const {
    member,
    activeCardId,
    updateMember,
    isImpersonating,
    originalDeveloperUser,
    impersonateUser,
    stopImpersonating,
  } = useAuth();

  const {
    mode,
    setMode,
    isDevMode,
    canAccessDev,
    openChangelog,
    contestVisibility,
    setContestVisibility,
    impactVisibility,
    setImpactVisibility,
    brandLogo,
    setBrandLogo,
    isBoardMemberPreviewEnabled,
    setIsBoardMemberPreviewEnabled,
  } = useDevMode();

  const [activeTab, setActiveTab] = useState<DevSubTab>('impersonate');
  // ==========================================
  // GIVE/GET & BOARD MEMBER DEVELOPER STATE
  // ==========================================
  const [giveGetHourlyRate, setGiveGetHourlyRate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sm_give_get_hourly_rate') || '10';
    }
    return '10';
  });
  const [boardRoster, setBoardRoster] = useState<any[]>([]);
  const [isLoadingBoardRoster, setIsLoadingBoardRoster] = useState(false);
  const [hasLoadedBoardRoster, setHasLoadedBoardRoster] = useState(false);
  const [giveGetNotice, setGiveGetNotice] = useState<string | null>(null);

  const handleSaveHourlyRate = () => {
    const val = parseFloat(giveGetHourlyRate);
    if (isNaN(val) || val <= 0) {
      setGiveGetNotice('Hourly rate must be a positive number.');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('sm_give_get_hourly_rate', String(val));
    }
    setGiveGetNotice(`Saved volunteer credit rate: $${val.toFixed(2)}/hour`);
    setTimeout(() => setGiveGetNotice(null), 4000);
  };

  const handleLoadBoardRoster = async () => {
    setIsLoadingBoardRoster(true);
    try {
      const roster = await fetchBoardRosterSummary();
      setBoardRoster(roster);
      setHasLoadedBoardRoster(true);
      setGiveGetNotice(`Loaded ${roster.length} board member(s) from Neon One CRM.`);
      setTimeout(() => setGiveGetNotice(null), 4000);
    } catch (_) {
      setGiveGetNotice('Failed to connect to Neon One CRM.');
      setTimeout(() => setGiveGetNotice(null), 4000);
    } finally {
      setIsLoadingBoardRoster(false);
    }
  };

  const [giveGetCategories, setGiveGetCategories] = useState<GiveGetServiceCategory[]>(() => {
    return getGiveGetServiceCategories();
  });
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🤝');
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  const handleSetDefaultCategory = (catId: string) => {
    setGiveGetCategories((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === catId,
      }))
    );
  };

  const handleDeleteCategory = (catId: string) => {
    if (giveGetCategories.length <= 1) {
      setGiveGetNotice('You must keep at least one category.');
      setTimeout(() => setGiveGetNotice(null), 3000);
      return;
    }
    const cat = giveGetCategories.find((c) => c.id === catId);
    if (!cat) return;
    const remaining = giveGetCategories.filter((c) => c.id !== catId);
    if (cat.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    setGiveGetCategories(remaining);
  };

  const handleAddCategory = () => {
    const trimmed = newCatLabel.trim();
    if (!trimmed) return;
    const newId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (giveGetCategories.some((c) => c.id === newId || c.label.toLowerCase() === trimmed.toLowerCase())) {
      setGiveGetNotice('Category already exists.');
      setTimeout(() => setGiveGetNotice(null), 3000);
      return;
    }
    const newCat: GiveGetServiceCategory = {
      id: newId,
      label: trimmed,
      icon: newCatIcon.trim() || '🤝',
      isDefault: giveGetCategories.length === 0,
    };
    setGiveGetCategories((prev) => [...prev, newCat]);
    setNewCatLabel('');
    setNewCatIcon('🤝');
  };

  const handleResetCategoriesToDefault = async () => {
    setGiveGetCategories(DEFAULT_GIVE_GET_CATEGORIES);
    await saveGiveGetServiceCategories(DEFAULT_GIVE_GET_CATEGORIES);
    setGiveGetNotice('Service categories reset to defaults.');
    setTimeout(() => setGiveGetNotice(null), 4000);
  };

  const handleSaveCategories = async () => {
    setIsSavingCategories(true);
    try {
      await saveGiveGetServiceCategories(giveGetCategories);
      setGiveGetNotice('Service categories and default saved successfully!');
      setTimeout(() => setGiveGetNotice(null), 4000);
    } catch (_) {
      setGiveGetNotice('Failed to save service categories.');
      setTimeout(() => setGiveGetNotice(null), 4000);
    } finally {
      setIsSavingCategories(false);
    }
  };
  // ==========================================
  // PORTAL DOOR REMOTE SETTINGS STATE & HANDLERS
  // ==========================================
  const [portalSettings, setPortalSettings] = useState<PortalDoorSettings>({
    contestMode: false,
    digitalBackground: true,
    sound: true,
    photoboothMode: false,
    impactMode: false,
  });
  const [isUpdatingPortalSetting, setIsUpdatingPortalSetting] = useState<string | null>(null);
  const [isRefreshingPortal, setIsRefreshingPortal] = useState(false);
  const [portalNotice, setPortalNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ==========================================
  // BUDDY BUILDER ASSETS & NEON FIELDS STATE
  // ==========================================
  const [buddyCatalog, setBuddyCatalog] = useState<BuddyItem[]>([]);
  const [buddyCategoryFilter, setBuddyCategoryFilter] = useState<string>('all');

  const devCategories = React.useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    buddyCatalog.forEach((item) => {
      const cat = item.category || 'other';
      if (!map.has(cat)) {
        map.set(cat, {
          id: cat,
          label: formatCategoryLabel(cat),
          count: 0,
        });
      }
      map.get(cat)!.count++;
    });
    return Array.from(map.values());
  }, [buddyCatalog]);
  const [newBuddyName, setNewBuddyName] = useState('');
  const [newBuddyCategory, setNewBuddyCategory] = useState<BuddyLayerCategory>('tops');
  const [newBuddyPrice, setNewBuddyPrice] = useState<number>(25);
  const [newBuddyZIndex, setNewBuddyZIndex] = useState<number>(60);
  const [newBuddyAssetUrl, setNewBuddyAssetUrl] = useState('');
  const [newBuddyDescription, setNewBuddyDescription] = useState('');
  const [newBuddyColorPicker, setNewBuddyColorPicker] = useState(false);
  const [isSavingBuddyAsset, setIsSavingBuddyAsset] = useState(false);
  const [isSyncingBuddySheet, setIsSyncingBuddySheet] = useState(false);

  const handleSyncBuddySheet = async () => {
    setIsSyncingBuddySheet(true);
    try {
      const items = await fetchBuddyItemsFromSheet();
      setBuddyCatalog(getAllBuddyItems());
      if (items.length > 0) {
        setBuddyAssetNotice({
          message: `Successfully synced ${items.length} items from Google Sheet tab "Buddy_Items"!`,
          type: 'success',
        });
      } else {
        setBuddyAssetNotice({
          message: 'Google Sheet returned 0 items. Make sure a tab named "Buddy_Items" is added to the Google Sheet with columns: Name, Category, Price, Asset_URL, Z_Index, Description, Active.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setBuddyAssetNotice({ message: err.message || 'Failed to sync Google Sheet.', type: 'error' });
    } finally {
      setIsSyncingBuddySheet(false);
    }
  };
  const [buddyAssetNotice, setBuddyAssetNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Neon One Custom Field IDs for Buddy
  const [buddyAvatarFieldId, setBuddyAvatarFieldId] = useState<string>('');
  const [buddyBucksFieldId, setBuddyBucksFieldId] = useState<string>('');
  const [isSavingBuddyFields, setIsSavingBuddyFields] = useState(false);
  const [buddyFieldsNotice, setBuddyFieldsNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Category Layer Z-Index Stack Order State
  const [categoryLayers, setCategoryLayers] = useState<Record<string, number>>(() => getCategoryLayerOrder());
  const [isSavingLayers, setIsSavingLayers] = useState(false);
  const [layerNotice, setLayerNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryZ, setNewCategoryZ] = useState(50);

  const handleUpdateCategoryZ = (cat: string, newZ: number) => {
    setCategoryLayers((prev) => ({
      ...prev,
      [cat]: newZ,
    }));
  };

  const handleSaveCategoryLayers = async () => {
    setIsSavingLayers(true);
    setLayerNotice(null);
    try {
      saveCategoryLayerOrder(categoryLayers);
      setBuddyCatalog(getAllBuddyItems());
      setLayerNotice({
        message: 'Category layer stack order saved and published globally! All items now reflect these Z-Index values.',
        type: 'success',
      });
    } catch (err: any) {
      setLayerNotice({ message: err.message || 'Failed to save layer order.', type: 'error' });
    } finally {
      setIsSavingLayers(false);
      setTimeout(() => setLayerNotice(null), 5000);
    }
  };

  const handleResetCategoryLayers = () => {
    const defaults = resetCategoryLayerOrder();
    setCategoryLayers(defaults);
    setBuddyCatalog(getAllBuddyItems());
    setLayerNotice({
      message: 'Category layer stack order reset to standard makerspace defaults.',
      type: 'success',
    });
    setTimeout(() => setLayerNotice(null), 4000);
  };

  const handleAddCustomCategory = () => {
    const cleanSlug = newCategorySlug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (!cleanSlug) {
      setLayerNotice({ message: 'Please enter a valid category name.', type: 'error' });
      return;
    }
    const updated = {
      ...categoryLayers,
      [cleanSlug]: newCategoryZ,
    };
    setCategoryLayers(updated);
    saveCategoryLayerOrder(updated);
    setNewCategorySlug('');
    setLayerNotice({
      message: `Added custom category "${cleanSlug}" with Z-Index ${newCategoryZ}.`,
      type: 'success',
    });
    setTimeout(() => setLayerNotice(null), 4000);
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = { ...categoryLayers };
    delete updated[cat];
    setCategoryLayers(updated);
    saveCategoryLayerOrder(updated);
    setLayerNotice({
      message: `Removed category "${cat}" from layer configuration.`,
      type: 'success',
    });
    setTimeout(() => setLayerNotice(null), 4000);
  };

  useEffect(() => {
    setBuddyCatalog(getAllBuddyItems());
    setCategoryLayers(getCategoryLayerOrder());
    if (typeof window !== 'undefined') {
      setBuddyAvatarFieldId(localStorage.getItem('sm_neon_buddy_avatar_field_id') || BUDDY_AVATAR_FIELD_ID);
      setBuddyBucksFieldId(localStorage.getItem('sm_neon_buddy_bucks_field_id') || BUDDY_BUCKS_FIELD_ID);
    }
    const handleCatalogUpdate = () => {
      setBuddyCatalog(getAllBuddyItems());
      setCategoryLayers(getCategoryLayerOrder());
    };
    window.addEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
  }, []);

  const handleBuddyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('svg') && !file.type.includes('webp')) {
      setBuddyAssetNotice({
        message: 'Please select a PNG, WebP, or SVG file with transparent background.',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewBuddyAssetUrl(dataUrl);
      if (!newBuddyName) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setNewBuddyName(cleanName);
      }
      setBuddyAssetNotice({
        message: `Asset "${file.name}" loaded ready for publishing!`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePublishBuddyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuddyName.trim()) {
      setBuddyAssetNotice({ message: 'Please provide an item name.', type: 'error' });
      return;
    }
    if (!newBuddyAssetUrl.trim()) {
      setBuddyAssetNotice({ message: 'Please upload an image asset file or enter a valid URL.', type: 'error' });
      return;
    }

    setIsSavingBuddyAsset(true);
    try {
      const newItemId = `custom_${Date.now()}_${newBuddyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const newItem: BuddyItem = {
        id: newItemId,
        name: newBuddyName.trim(),
        category: newBuddyCategory,
        assetUrl: newBuddyAssetUrl.trim(),
        zIndex: categoryLayers[newBuddyCategory] !== undefined ? categoryLayers[newBuddyCategory] : 50,
        price: Math.max(0, Number(newBuddyPrice) || 0),
        description: newBuddyDescription.trim() || undefined,
        isCustom: true,
        colorPicker: newBuddyColorPicker,
      };

      const updated = saveCustomBuddyItem(newItem);
      setBuddyCatalog(updated);

      // Reset form
      setNewBuddyName('');
      setNewBuddyAssetUrl('');
      setNewBuddyDescription('');
      setNewBuddyColorPicker(false);
      setNewBuddyPrice(25);
      setBuddyAssetNotice({
        message: `"${newItem.name}" published successfully! Available to all members in Buddy Builder.`,
        type: 'success',
      });
    } catch (err: any) {
      setBuddyAssetNotice({
        message: err.message || 'Failed to save accessory.',
        type: 'error',
      });
    } finally {
      setIsSavingBuddyAsset(false);
    }
  };

  const handleDeleteBuddyItem = (itemId: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete the accessory "${itemName}"?`)) {
      return;
    }
    const updated = deleteCustomBuddyItem(itemId);
    setBuddyCatalog(updated);
    setBuddyAssetNotice({
      message: `Deleted accessory "${itemName}".`,
      type: 'success',
    });
  };

  const handleSaveBuddyFields = async () => {
    setIsSavingBuddyFields(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sm_neon_buddy_avatar_field_id', buddyAvatarFieldId.trim());
        localStorage.setItem('sm_neon_buddy_bucks_field_id', buddyBucksFieldId.trim());
      }
      await updateGlobalAppSettings({
        buddyAvatarFieldId: buddyAvatarFieldId.trim(),
        buddyBucksFieldId: buddyBucksFieldId.trim(),
      });
      setBuddyFieldsNotice({
        message: 'Neon One Buddy Custom Field IDs updated and synchronized across all users!',
        type: 'success',
      });
    } catch (err: any) {
      setBuddyFieldsNotice({
        message: err.message || 'Failed to save Neon custom field IDs.',
        type: 'error',
      });
    } finally {
      setIsSavingBuddyFields(false);
    }
  };

  const handleGrantTestBuddyBucks = async (amount: number) => {
    if (!member?.accountId) return;
    await awardBuddyBucks(member.accountId, amount, 'Developer Test Grant');
    setBuddyAssetNotice({
      message: `Granted +${amount} Buddy Bucks to your test account!`,
      type: 'success',
    });
  };

  // Poll live settings from Portal Door installation
  useEffect(() => {
    let isMounted = true;
    const loadPortal = async () => {
      const res = await fetchPortalDoorSettings();
      if (res && isMounted) {
        setPortalSettings(res);
      }
    };
    loadPortal();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadPortal();
      }
    }, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTogglePortalSetting = async (key: keyof PortalDoorSettings, nextVal: boolean) => {
    setIsUpdatingPortalSetting(key);
    setPortalSettings((prev) => ({ ...prev, [key]: nextVal }));
    try {
      const res = await updatePortalDoorSettings({ [key]: nextVal });
      if (res.success && res.settings) {
        setPortalSettings(res.settings);
        setPortalNotice({
          message: `Portal Door ${key} set to ${nextVal ? "ON" : "OFF"}! Synchronized with the physical door.`,
          type: "success",
        });
      } else {
        setPortalNotice({
          message: res.error || "Failed to update Portal Door setting.",
          type: "error",
        });
      }
    } catch (e: any) {
      setPortalNotice({ message: e.message || "Network error updating Portal Door.", type: "error" });
    } finally {
      setIsUpdatingPortalSetting(null);
      setTimeout(() => setPortalNotice(null), 3500);
    }
  };

  const handleManualPortalRefresh = async () => {
    setIsRefreshingPortal(true);
    try {
      const res = await fetchPortalDoorSettings();
      if (res) {
        setPortalSettings(res);
        setPortalNotice({
          message: "Successfully refreshed settings from Portal Door!",
          type: "success",
        });
      }
    } catch (_) {
      setPortalNotice({ message: "Error checking Portal Door.", type: "error" });
    } finally {
      setIsRefreshingPortal(false);
      setTimeout(() => setPortalNotice(null), 3000);
    }
  };


  // ==========================================
  // 1. IMPERSONATION STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ accountId: string; name: string; email?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualCardId, setManualCardId] = useState('');
  const [impersonateNotice, setImpersonateNotice] = useState<string | null>(null);
  const [isImpersonatingLoading, setIsImpersonatingLoading] = useState(false);

  // Search Neon One accounts debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchNeonAccounts(q);
        setSearchResults(results);
      } catch (_) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleImpersonateAccount = async (accountId: string) => {
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    try {
      const ok = await impersonateUser(accountId);
      if (ok) {
        setImpersonateNotice(`Successfully switched perspective to Account #${accountId}`);
      } else {
        setImpersonateNotice(`Could not load profile for Account #${accountId}`);
      }
    } catch (e: any) {
      setImpersonateNotice(`Error: ${e.message}`);
    }
    setIsImpersonatingLoading(false);
  };

  const handleImpersonateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = manualCardId.trim();
    if (!card) return;
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    try {
      const ok = await impersonateUser(card);
      if (ok) {
        setImpersonateNotice(`Successfully switched perspective to Tap Card ${card}`);
        setManualCardId('');
      } else {
        setImpersonateNotice(`No member found matching Tap Card ${card}`);
      }
    } catch (e: any) {
      setImpersonateNotice(`Error: ${e.message}`);
    }
    setIsImpersonatingLoading(false);
  };

  // Sample quick personas
  const handleQuickPersona = async (persona: { name: string; cardId: string; isDev?: boolean }) => {
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    const ok = await impersonateUser(persona.cardId);
    if (ok) {
      setImpersonateNotice(`Switched perspective to ${persona.name} (${persona.cardId})`);
    } else {
      setImpersonateNotice(`Could not load ${persona.name}`);
    }
    setIsImpersonatingLoading(false);
  };

  // ==========================================
  // 2. COMMUNITY ANNOUNCEMENT STATE
  // ==========================================
  const [announcement, setAnnouncement] = useState<CommunityAnnouncement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annAuthor, setAnnAuthor] = useState('');
  const [annActive, setAnnActive] = useState(true);
  const [isSavingAnn, setIsSavingAnn] = useState(false);
  const [annSaveMsg, setAnnSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadAnn = async () => {
      try {
        const live = await fetchCommunityAnnouncement();
        if (live) {
          setAnnouncement(live);
          setAnnTitle(live.title || '');
          setAnnMessage(live.message || '');
          setAnnAuthor(live.author || '');
          setAnnActive(live.active !== false);
        }
      } catch (_) {}
    };
    loadAnn();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      setAnnSaveMsg({ type: 'error', text: 'Title and message cannot be empty.' });
      return;
    }
    setIsSavingAnn(true);
    setAnnSaveMsg(null);
    try {
      const res = await updateCommunityAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        author: annAuthor.trim() || getGreetingName(originalDeveloperUser || member),
        active: annActive,
      });
      if (res.success && res.announcement) {
        setAnnouncement(res.announcement);
        setAnnSaveMsg({ type: 'success', text: 'Announcement updated and published live!' });
        try {
          localStorage.setItem('sm_community_announcement', JSON.stringify(res.announcement));
        } catch (_) {}
      } else {
        setAnnSaveMsg({ type: 'error', text: res.error || 'Failed to save announcement' });
      }
    } catch (e: any) {
      setAnnSaveMsg({ type: 'error', text: e.message || 'Error saving announcement' });
    }
    setIsSavingAnn(false);
  };

  // ==========================================
  // 3. MODULE VISIBILITY STATE
  // ==========================================
  const [isUpdatingVis, setIsUpdatingVis] = useState(false);
  const [visNotice, setVisNotice] = useState<string | null>(null);

  const handleContestVisibilityChange = async (vis: CostumeContestVisibility) => {
    setIsUpdatingVis(true);
    setVisNotice(null);
    try {
      const ok = await setContestVisibility(vis);
      if (ok) {
        setVisNotice(`Contest module visibility set to: ${vis.toUpperCase()}`);
      } else {
        setVisNotice(`Failed to save visibility change.`);
      }
    } catch (e: any) {
      setVisNotice(`Error: ${e.message}`);
    }
    setIsUpdatingVis(false);
    setTimeout(() => setVisNotice(null), 4000);
  };

  const handleImpactVisibilityChange = async (vis: 'all' | 'staff' | 'none') => {
    setIsUpdatingVis(true);
    setVisNotice(null);
    try {
      const ok = await setImpactVisibility(vis);
      if (ok) {
        setVisNotice(`Impact module visibility set to: ${vis.toUpperCase()}`);
      } else {
        setVisNotice(`Failed to save Impact visibility change.`);
      }
    } catch (e: any) {
      setVisNotice(`Error: ${e.message}`);
    }
    setIsUpdatingVis(false);
    setTimeout(() => setVisNotice(null), 4000);
  };

  const handleStopAllGameRoomMirrors = async () => {
    try {
      await fetch('https://192.168.12.108:8088/api/mirror/stop-all', { method: 'POST' });
      setVisNotice('Issued remote STOP-ALL mirrors command to Game Room Mini PC.');
    } catch (_) {
      setVisNotice('Remote command dispatched to Game Room network.');
    }
    setTimeout(() => setVisNotice(null), 4000);
  };

  // ==========================================
  // IMPACT & FUNDRAISING CAMPAIGN STATE
  // ==========================================
  const [impactSettings, setImpactSettings] = useState<ImpactCampaignSettings>(DEFAULT_IMPACT_SETTINGS);
  const [availableCampaigns, setAvailableCampaigns] = useState<NeonCampaignSummary[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isSavingImpact, setIsSavingImpact] = useState(false);
  const [impactNotice, setImpactNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadImpact() {
      setIsLoadingCampaigns(true);
      try {
        const [settings, campaigns] = await Promise.all([
          fetchImpactCampaignSettings(),
          fetchNeonCampaigns(),
        ]);
        if (isMounted) {
          if (settings) {
            let finalSettings = settings;
            if (settings.campaignId && settings.autoSyncNeon !== false) {
              try {
                const detail = await fetchNeonCampaignDetail(settings.campaignId);
                if (detail) {
                  finalSettings = {
                    ...settings,
                    raisedAmount: Number(detail.statistics?.grandTotal ?? detail.statistics?.donationAmount ?? settings.raisedAmount),
                    donorCount: Number(detail.statistics?.donationCount ?? settings.donorCount ?? 0),
                    goalAmount: (typeof detail.goal === 'number' && detail.goal > 0) ? detail.goal : settings.goalAmount,
                  };
                }
              } catch (_) {}
            }
            setImpactSettings(finalSettings);
          }
          if (campaigns && campaigns.length > 0) setAvailableCampaigns(campaigns);
        }
      } catch (err) {
        console.error('Failed to load initial impact settings:', err);
      } finally {
        if (isMounted) setIsLoadingCampaigns(false);
      }
    }
    loadImpact();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCampaign = async (campaignId: string) => {
    if (!campaignId) return;
    setIsLoadingCampaigns(true);
    setImpactNotice(null);
    try {
      const detail = await fetchNeonCampaignDetail(campaignId);
      if (detail) {
        setImpactSettings((prev) => ({
          ...prev,
          campaignId: detail.id,
          campaignName: detail.name,
          goalAmount: (typeof detail.goal === 'number' && detail.goal > 0) ? detail.goal : prev.goalAmount,
          raisedAmount: detail.statistics?.grandTotal || detail.statistics?.donationAmount || 0,
          donorCount: detail.statistics?.donationCount || 0,
          donationFormUrl: detail.donationFormUrl || prev.donationFormUrl,
        }));
        setImpactNotice({
          message: `Loaded details for "${detail.name}" (Goal: $${(detail.goal ?? 0).toLocaleString()}, Raised: $${(detail.statistics?.grandTotal || 0).toLocaleString()})`,
          type: 'success',
        });
      } else {
        const summary = availableCampaigns.find((c) => c.id === campaignId);
        if (summary) {
          setImpactSettings((prev) => ({
            ...prev,
            campaignId: summary.id,
            campaignName: summary.name,
          }));
        }
      }
    } catch (err: any) {
      setImpactNotice({
        message: `Failed to load campaign: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleSaveImpact = async () => {
    setIsSavingImpact(true);
    setImpactNotice(null);
    try {
      const res = await saveImpactCampaignSettings(impactSettings);
      if (res.success) {
        setImpactNotice({
          message: 'Fundraising campaign and thermometer settings saved successfully across all platforms!',
          type: 'success',
        });
      } else {
        setImpactNotice({
          message: res.error || 'Failed to save impact settings',
          type: 'error',
        });
      }
    } catch (err: any) {
      setImpactNotice({
        message: err.message || 'Error saving impact settings',
        type: 'error',
      });
    } finally {
      setIsSavingImpact(false);
    }
  };

  // ==========================================
  // STORE & WALLET DEV CONFIGURATION STATE
  // ==========================================
  const [balanceFieldId, setBalanceFieldId] = useState('');
  const [donationBaseUrl, setDonationBaseUrl] = useState('');
  const [customBalanceInput, setCustomBalanceInput] = useState('');
  const [storeConfigSaved, setStoreConfigSaved] = useState(false);
  const [isUpdatingTestBalance, setIsUpdatingTestBalance] = useState(false);
  const [balanceNotice, setBalanceNotice] = useState<string | null>(null);
  const [sheetItemCount, setSheetItemCount] = useState<number | null>(null);
  const [isSyncingSheetDev, setIsSyncingSheetDev] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBalanceFieldId(localStorage.getItem('sm_neon_balance_field_id') || STORE_BALANCE_FIELD_ID);
      setDonationBaseUrl(
        localStorage.getItem('sm_neon_store_donation_form_url') ||
        localStorage.getItem('sm_neon_donation_base_url') ||
        NEON_STORE_DONATION_FORM_URL
      );
      const fromSheet = localStorage.getItem('sm_store_sheet_items');
      if (fromSheet) {
        try {
          const parsed = JSON.parse(fromSheet);
          if (Array.isArray(parsed)) setSheetItemCount(parsed.length);
        } catch (_) {}
      }
    }
  }, []);

  const handleDevSyncSheet = async () => {
    setIsSyncingSheetDev(true);
    setBalanceNotice(null);
    try {
      const items = await fetchStoreItemsFromSheet();
      if (items && items.length > 0) {
        setSheetItemCount(items.length);
        setBalanceNotice(`Successfully synced ${items.length} items from Google Sheet "Store_Items"!`);
      } else {
        setBalanceNotice('Google Sheet tab "Store_Items" not found or has no active rows. Add tab to SM App Database.');
      }
    } catch (e: any) {
      setBalanceNotice(`Error syncing sheet: ${e.message}`);
    } finally {
      setIsSyncingSheetDev(false);
      setTimeout(() => setBalanceNotice(null), 4000);
    }
  };

  const [devTopUpAmount, setDevTopUpAmount] = useState('25');
  const [isApplyingDevTopUp, setIsApplyingDevTopUp] = useState(false);

  const handleSaveStoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (balanceFieldId.trim()) {
        localStorage.setItem('sm_neon_balance_field_id', balanceFieldId.trim());
      } else {
        localStorage.removeItem('sm_neon_balance_field_id');
      }
      if (donationBaseUrl.trim()) {
        localStorage.setItem('sm_neon_store_donation_form_url', donationBaseUrl.trim());
        localStorage.setItem('sm_neon_donation_base_url', donationBaseUrl.trim());
      }
    }
    // Synchronize store configuration across all users globally
    updateGlobalAppSettings({
      storeSettings: {
        donationFormUrl: donationBaseUrl.trim(),
        balanceFieldId: balanceFieldId.trim(),
        xpFieldId: neonXpFieldId.trim(),
      },
    }).catch(() => {});

    setStoreConfigSaved(true);
    setTimeout(() => setStoreConfigSaved(false), 3000);
  };

  const handleDevTopUp = async (amount: number) => {
    if (!member || !member.accountId || amount <= 0) {
      setBalanceNotice('No active member profile with account ID found to test top-up.');
      return;
    }
    setIsApplyingDevTopUp(true);
    setBalanceNotice(null);
    try {
      const res = await topUpMemberStoreBalance(member.accountId, amount);
      if (res.success) {
        updateMember({ storeBalance: res.newBalance });
        setBalanceNotice(
          res.debtCleared > 0
            ? `Top-Up successful! $${res.debtCleared.toFixed(2)} tab debt cancelled first. New available balance: $${res.newBalance.toFixed(2)}`
            : `Top-Up successful! Added $${amount.toFixed(2)}. New available balance: $${res.newBalance.toFixed(2)}`
        );
      } else {
        setBalanceNotice(res.error || 'Failed to apply top-up');
      }
    } catch (err: any) {
      setBalanceNotice(err.message || 'Error applying top-up');
    } finally {
      setIsApplyingDevTopUp(false);
      setTimeout(() => setBalanceNotice(null), 5000);
    }
  };

  const handleSetTestBalance = async (newAmount: number) => {
    if (!member || !member.accountId) {
      setBalanceNotice('No active member profile with account ID found to test.');
      return;
    }
    setIsUpdatingTestBalance(true);
    setBalanceNotice(null);
    try {
      const res = await updateMemberStoreBalance(member.accountId, newAmount, [
        {
          name: 'Dev Balance Adjustment',
          price: 0,
          quantity: 1,
        },
      ]);
      if (res.success) {
        updateMember({ storeBalance: res.newBalance });
        setBalanceNotice(`Balance updated to ${res.newBalance >= 0 ? '+' : ''}$${res.newBalance.toFixed(2)}`);
      } else {
        setBalanceNotice(res.error || 'Failed to update balance');
      }
    } catch (err: any) {
      setBalanceNotice(err.message || 'Error updating balance');
    } finally {
      setIsUpdatingTestBalance(false);
      setTimeout(() => setBalanceNotice(null), 4000);
    }
  };

  // ==========================================
  // 4. CERTIFICATION & ICON REGISTRY STATE
  // ==========================================
  // Brand Logo Customization State
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url' | 'svg'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoSvgInput, setLogoSvgInput] = useState('');
  const [logoDraft, setLogoDraft] = useState<string | null>(brandLogo);
  const [logoFeedback, setLogoFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLogoDraft(brandLogo);
  }, [brandLogo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
      setLogoFeedback('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // For SVG vectors, read directly
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setLogoDraft(text.trim());
          setLogoFeedback(null);
        }
      };
      reader.onerror = () => setLogoFeedback('Failed to read SVG file.');
      reader.readAsText(file);
      return;
    }

    // For bitmap images (PNG, JPG, WebP), auto-resize & compress to optimal header size
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          // Standard max dimensions for navigation header logo
          const MAX_WIDTH = 480;
          const MAX_HEIGHT = 140;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export crisp optimized PNG (under ~30KB)
            const optimized = canvas.toDataURL('image/png');
            setLogoDraft(optimized);
            setLogoFeedback(null);
          } else {
            setLogoDraft(rawDataUrl);
            setLogoFeedback(null);
          }
        } catch (_) {
          setLogoDraft(rawDataUrl);
          setLogoFeedback(null);
        }
      };
      img.onerror = () => {
        setLogoDraft(rawDataUrl);
        setLogoFeedback(null);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setLogoFeedback('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (logoUrlInput.trim()) {
      setLogoDraft(logoUrlInput.trim());
      setLogoFeedback(null);
    }
  };

  const handleApplyLogoSvg = (e: React.FormEvent) => {
    e.preventDefault();
    if (logoSvgInput.trim()) {
      setLogoDraft(logoSvgInput.trim());
      setLogoFeedback(null);
    }
  };

  const handleSaveBrandLogo = () => {
    setBrandLogo(logoDraft);
    setLogoFeedback(logoDraft ? 'Brand logo applied to top-left header!' : 'Brand logo reset to default SM badge.');
    setTimeout(() => setLogoFeedback(null), 4000);
  };

  const handleResetBrandLogo = () => {
    setLogoDraft(null);
    setLogoUrlInput('');
    setLogoSvgInput('');
    setBrandLogo(null);
    setLogoFeedback('Reset to default Social Medium badge.');
    setTimeout(() => setLogoFeedback(null), 4000);
  };

  const [tools, setTools] = useState<Record<string, ToolItem>>(SMCertifications.TOOLS || {});
  const [selectedToolId, setSelectedToolId] = useState<string | null>('3d-printing');
  const [testInput, setTestInput] = useState('3D Printing (Advanced)');
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Tool form fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newId, setNewId] = useState('');

  useEffect(() => {
    if (selectedToolId && tools[selectedToolId]) {
      const t = tools[selectedToolId];
      setEditName(t.name);
      setEditCategory(t.category);
      setEditColor(t.color);
      setEditKeywords((t.keywords || []).join(', '));
      setIsAddingNew(false);
    }
  }, [selectedToolId, tools]);

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    const id = isAddingNew ? newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : selectedToolId;
    if (!id) return;

    const updated: ToolItem = {
      id,
      name: editName.trim(),
      category: editCategory.trim() || 'General',
      color: editColor.trim() || '#3bc0cd',
      keywords: editKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      iconSvg: isAddingNew
        ? SMCertifications.SVG_ICONS['tool-generic']
        : tools[id]?.iconSvg || SMCertifications.SVG_ICONS['tool-generic'],
    };

    const newTools = { ...tools, [id]: updated };
    setTools(newTools);
    setSelectedToolId(id);
    setIsAddingNew(false);
    try {
      localStorage.setItem('sm_custom_tool_mappings', JSON.stringify(newTools));
      window.dispatchEvent(new CustomEvent('sm_tools_updated'));
      // Sync tool mapping globally so all members see updated tools
      updateGlobalAppSettings({ toolMappings: Object.values(newTools) }).catch(() => {});
    } catch (_) {}
  };

  const handleCopyJSON = () => {
    const jsonOutput = JSON.stringify({ tools }, null, 2);
    navigator.clipboard.writeText(jsonOutput);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  // ==========================================
  // 6. GAMIFICATION & XP STATE & HANDLERS
  // ==========================================
  const [xpRules, setXpRules] = useState<XpActivityRule[]>([]);
  const [xpTiers, setXpTiers] = useState<XpLevelTier[]>([]);
  const [neonXpFieldId, setNeonXpFieldId] = useState('');
  const [xpNotice, setXpNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [testManualXp, setTestManualXp] = useState('');
  const [isSimulatingXp, setIsSimulatingXp] = useState(false);

  useEffect(() => {
    setXpRules(fetchXpActivityRules());
    setXpTiers(fetchXpLevelTiers());
    if (typeof window !== 'undefined') {
      setNeonXpFieldId(localStorage.getItem('sm_neon_xp_field_id') || XP_FIELD_ID);
    }
  }, []);

  const handleSaveNeonXpFieldId = () => {
    if (typeof window !== 'undefined') {
      const clean = neonXpFieldId.trim();
      if (clean) {
        localStorage.setItem('sm_neon_xp_field_id', clean);
      } else {
        localStorage.removeItem('sm_neon_xp_field_id');
      }
      updateGlobalAppSettings({
        storeSettings: {
          xpFieldId: clean || XP_FIELD_ID,
        },
      }).catch(() => {});
      setXpNotice({ message: 'Neon One XP Custom Field ID updated and synced globally!', type: 'success' });
      setTimeout(() => setXpNotice(null), 3000);
    }
  };

  const handleUpdateRulePoint = (id: string, newPoints: number) => {
    setXpRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, xpReward: Math.max(0, newPoints) } : r))
    );
  };

  const handleUpdateRuleCooldown = (id: string, cooldown: 'once' | 'daily' | 'unlimited') => {
    setXpRules((prev) => prev.map((r) => (r.id === id ? { ...r, cooldown } : r)));
  };

  const handleToggleRuleEnabled = (id: string) => {
    setXpRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleSaveXpRules = () => {
    saveXpActivityRules(xpRules);
    setXpNotice({ message: 'Activity Points Mapping Matrix saved successfully!', type: 'success' });
    setTimeout(() => setXpNotice(null), 3000);
  };

  const handleResetXpRules = () => {
    const defaults = resetXpActivityRules();
    setXpRules(defaults);
    setXpNotice({ message: 'Activity rules restored to default values!', type: 'success' });
    setTimeout(() => setXpNotice(null), 3000);
  };

  const handleUpdateTierField = (level: number, field: keyof XpLevelTier, value: any) => {
    setXpTiers((prev) =>
      prev.map((t) => (t.level === level ? { ...t, [field]: value } : t))
    );
  };

  const handleSaveXpTiers = () => {
    saveXpLevelTiers(xpTiers);
    setXpNotice({ message: 'Level progression & rewards saved successfully!', type: 'success' });
    setTimeout(() => setXpNotice(null), 3000);
  };

  const handleResetXpTiers = () => {
    const defaults = resetXpLevelTiers();
    setXpTiers(defaults);
    setXpNotice({ message: 'Level tiers & rewards restored to defaults!', type: 'success' });
    setTimeout(() => setXpNotice(null), 3000);
  };

  const handleSimulateAward = async (ruleId: string, multiplier: number = 0, note?: string) => {
    if (!member?.accountId) {
      setXpNotice({ message: 'Please sign in or impersonate an account first to test XP.', type: 'error' });
      return;
    }
    setIsSimulatingXp(true);
    try {
      const res = await awardMemberXp({
        accountId: member.accountId,
        ruleId,
        customMultiplier: multiplier,
        note: note || 'Developer Test Simulation',
        force: true, // Bypass cooldown for developer testing
      });
      if (res.success) {
        updateMember({
          xp: res.newTotalXp,
          level: res.newLevel,
          levelTitle: res.tier.title,
          levelBadge: res.tier.badgeEmoji,
          levelReward: res.tier.reward,
        });
        setXpNotice({
          message: `Awarded +${res.xpEarned} XP! New Total: ${res.newTotalXp} XP (Level ${res.newLevel})`,
          type: 'success',
        });
      } else {
        setXpNotice({ message: res.error || 'Failed to award XP', type: 'error' });
      }
    } catch (e: any) {
      setXpNotice({ message: e.message || 'Error simulating XP award', type: 'error' });
    }
    setIsSimulatingXp(false);
    setTimeout(() => setXpNotice(null), 4000);
  };

  const handleDirectSetMemberXp = async (targetXp: number) => {
    if (!member?.accountId) {
      setXpNotice({ message: 'Please sign in or impersonate an account first to set XP.', type: 'error' });
      return;
    }
    setIsSimulatingXp(true);
    try {
      const res = await setMemberXpDirectly(member.accountId, targetXp, 'Developer manual set');
      updateMember({
        xp: res.newTotalXp,
        level: res.level,
        levelTitle: res.title,
        levelBadge: res.badgeEmoji,
        levelReward: res.reward,
      });
      setXpNotice({
        message: `Set member XP to ${res.newTotalXp} (Level ${res.level}: ${res.title})`,
        type: 'success',
      });
    } catch (e: any) {
      setXpNotice({ message: e.message || 'Error setting XP', type: 'error' });
    }
    setIsSimulatingXp(false);
    setTimeout(() => setXpNotice(null), 4000);
  };

  const resolvedTest = SMCertifications.resolve(testInput);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                DEVELOPER COMMAND CENTER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono text-xs">
                v{APP_VERSION}
              </span>
            </div>
            <h1 className="font-fredoka text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Social Medium Developer Studio
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Unified console for user impersonation, live community announcements, module visibility, and SSOT certification icon mappings.
            </p>
          </div>

          {/* Quick Session Status Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isImpersonating ? (
              <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    Active Impersonation
                  </span>
                </div>
                <div className="font-bold text-sm text-white">
                  {getGreetingName(member)}
                  <span className="text-xs font-mono text-purple-200 ml-1.5">({activeCardId})</span>
                </div>
                <button
                  type="button"
                  onClick={stopImpersonating}
                  className="mt-2 w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit Impersonation
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Authenticated Developer
                </div>
                <div className="font-bold text-sm text-amber-300">
                  {getGreetingName(member)}
                </div>
                <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                  Tap Card: {activeCardId || 'Not Bound'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-[#f16622]/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-60 h-60 rounded-full bg-[#3bc0cd]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Global Configuration Sync Info Pill */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Global Sync Active:</strong> Changes made here (Module Visibility, Logo, XP Point Values, Level Titles & Rewards, Tool Certifications, and Announcements) automatically synchronize across all users and devices in the makerspace.
          </span>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-100 font-mono text-[10px] font-bold text-indigo-800 shrink-0">
          Sync Engine Live
        </span>
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('impersonate')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'impersonate'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Impersonation</span>
          {isImpersonating && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Announcements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visibility')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'visibility'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Module Visibility</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('impact')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>Impact & Fundraising</span>
          {impactSettings.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Fundraising Campaign Active" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('give-get')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'give-get'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <HandCoins className="w-4 h-4 text-emerald-500" />
          <span>Give/Get (Board)</span>
          {isBoardMemberPreviewEnabled && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" title="Board Member Preview Enabled" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portal-door')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'portal-door'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <DoorOpen className="w-4 h-4 text-purple-400" />
          <span>Portal Door</span>
          {portalSettings.contestMode && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" title="Contest Mode Active on Door" />
          )}
          {portalSettings.impactMode && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Impact Mode Active on Door" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buddy-assets')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'buddy-assets'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Palette className="w-4 h-4 text-pink-400" />
          <span>Buddy Assets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'store'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>Store & Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gamification')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'gamification'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Gamification & XP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('icons')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'icons'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Icons & SSOT Registry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>System & Cache</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: IMPERSONATION & USER PERSPECTIVE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'impersonate' && (
        <div className="space-y-6">
          {/* Active Impersonation Alert Banner */}
          {isImpersonating && (
            <div className="p-5 rounded-3xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-purple-950 text-sm">
                    Currently Viewing As: {getGreetingName(member)} ({member?.email || 'No email'})
                  </div>
                  <div className="text-xs text-purple-700">
                    Tap Card: <code className="font-mono font-bold bg-purple-100 px-1.5 py-0.5 rounded">{activeCardId}</code> • Certifications: {member?.certifications?.length || 0} tool(s)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Home as User
                </Link>
                <button
                  type="button"
                  onClick={stopImpersonating}
                  className="px-4 py-2 rounded-xl bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  Exit Impersonation
                </button>
              </div>
            </div>
          )}

          {impersonateNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{impersonateNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Search & Select Member */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Search Any Member in Neon One
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Type a member name or account ID to load their exact account permissions, certifications, and portal media.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type name (e.g. Ben, Sarah) or Account ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-sm bg-stone-50 focus:bg-white focus:border-[#3bc0cd] transition-all"
                  />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 text-stone-400 animate-spin absolute right-3.5 top-3" />
                  )}
                </div>

                {/* Search Results Dropdown / List */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Matching Neon One Accounts ({searchResults.length})
                    </span>
                    {searchResults.map((acc) => (
                      <div
                        key={acc.accountId}
                        className="p-3 rounded-2xl border border-stone-200 hover:border-[#3bc0cd] bg-stone-50/60 hover:bg-white flex items-center justify-between gap-3 transition-all"
                      >
                        <div>
                          <div className="font-bold text-sm text-stone-900">{acc.name}</div>
                          <div className="text-xs text-stone-500 font-mono">
                            ID: {acc.accountId} {acc.email && `• ${acc.email}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImpersonateAccount(acc.accountId)}
                          disabled={isImpersonatingLoading}
                          className="px-3 py-1.5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Impersonate</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Tap Card Lookup */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Manual NFC Tap Card ID Lookup
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Enter the exact Tap Card number (e.g. 1423631962, 1234, or a test badge) to view the app as the assigned cardholder.
                  </p>
                </div>

                <form onSubmit={handleImpersonateCard} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCardId}
                    onChange={(e) => setManualCardId(e.target.value)}
                    placeholder="Enter Tap Card ID (e.g. 1423631962)..."
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-stone-200 text-sm bg-stone-50 focus:bg-white focus:border-[#3bc0cd] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isImpersonatingLoading || !manualCardId.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[#3bc0cd] hover:bg-[#32a8b5] text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Card</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right 5 Cols: Quick Persona Shortcuts */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Quick Persona Presets
                  </h3>
                  <p className="text-stone-500 text-xs">
                    One-click switches to test different user journeys and membership tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Persona 1: Developer Account (Self) */}
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
                        💻
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Developer (Self)</div>
                        <div className="text-[11px] text-stone-500">Master dev permissions & studio</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={stopImpersonating}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Reset Self
                    </button>
                  </div>

                  {/* Persona 2: Active Cardholder Ben */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#344ea2]/15 text-[#344ea2] flex items-center justify-center font-bold shrink-0">
                        🛠️
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Ben Braunstein (Card: 1423631962)</div>
                        <div className="text-[11px] text-stone-500">Active member with photobooth media</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickPersona({ name: 'Ben', cardId: '1423631962' })}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>

                  {/* Persona 3: Test Card 1234 */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        🌱
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Test Member (Card: 1234)</div>
                        <div className="text-[11px] text-stone-500">Standard user persona for QA testing</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickPersona({ name: 'Test Member', cardId: '1234' })}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>

                  {/* Persona 4: Clean Slate User */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center font-bold shrink-0">
                        👤
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Unregistered Visitor</div>
                        <div className="text-[11px] text-stone-500">No card connected / Onboarding state</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        impersonateUser({
                          tapCard: '',
                          firstName: 'Guest',
                          lastName: 'Visitor',
                          name: 'Guest Visitor',
                          email: '',
                          phone: '',
                          membershipTier: 'Visitor',
                          certifications: [],
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMUNITY ANNOUNCEMENT MANAGER                                     */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Announcement Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Home Page Community Announcement
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Broadcast updates, hours, machinery notices, or events to all members right on the Home tab.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {annActive ? '● Published' : '○ Draft / Inactive'}
                </span>
              </div>

              {annSaveMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    annSaveMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {annSaveMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{annSaveMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Welcome to Social Medium Makerspace!"
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-sm font-bold bg-stone-50 focus:bg-white focus:border-[#3bc0cd]"
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">Message Body</label>
                  <textarea
                    rows={5}
                    required
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Write the community notice here..."
                    className="w-full p-4 rounded-2xl border border-stone-200 text-xs leading-relaxed bg-stone-50 focus:bg-white focus:border-[#3bc0cd]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Author Byline</label>
                    <input
                      type="text"
                      value={annAuthor}
                      onChange={(e) => setAnnAuthor(e.target.value)}
                      placeholder="e.g. Ben Braunstein"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Status</label>
                    <button
                      type="button"
                      onClick={() => setAnnActive(!annActive)}
                      className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        annActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${annActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      <span>{annActive ? 'Visible on Home Page' : 'Hidden / Disabled'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingAnn}
                    className="w-full py-3 rounded-2xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAnn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing to App...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save & Publish Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right 5 Cols: Live User-Facing Preview */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Live Home Tab Preview
            </span>
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#3bc0cd]/10 to-[#344ea2]/15 border border-[#3bc0cd]/30 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#f16622] text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#344ea2]">
                  Community Announcement
                </span>
              </div>
              <h4 className="font-fredoka text-lg font-bold text-stone-900 leading-snug">
                {annTitle || 'Your Announcement Title'}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                {annMessage || 'The message you write on the left will appear in this card on the Home page for all members.'}
              </p>
              <div className="pt-2 text-[10px] text-stone-500 font-medium border-t border-stone-200/60 flex items-center justify-between">
                <span>By {annAuthor || 'Social Medium Staff'}</span>
                <span>Preview Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MODULE VISIBILITY & FEATURE TOGGLES                                */}
      {/* ========================================================================= */}
      {activeTab === 'visibility' && (
        <div className="space-y-6">
          {visNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{visNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Costume Contest Visibility */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Costume Contest Module
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Controls whether the Costume Contest appears in the navigation and on the Home page.
                  </p>
                </div>
              </div>

              {/* 3-Way Visibility Radio Toggle */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('all')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'all'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold">Visible to All Users (Public)</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Appears in top navigation and Home page for all visitors & members
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'all' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('staff')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'staff'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">Staff & Developers Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Hidden from general members; visible only to staff and developers
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'staff' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('none')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'none'
                      ? 'bg-red-50 border-red-400 text-red-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div>
                      <div className="text-xs font-bold">Disabled / Dev Mode Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Completely removed from navigation and hidden from all users & staff
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'none' && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                </button>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <Link
                  href="/costume-contest"
                  className="text-xs font-bold text-[#344ea2] hover:text-[#2a3f85] flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Contest Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[10px] font-mono text-stone-400">Database: Neon CRM</span>
              </div>
            </div>

            {/* Card 2: Game Room Chamber & Projector Remote */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Game Room & Controller
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Overhead table projector, 53" window TV, picture frame, and smart lighting.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Physical Mini PC:</span>
                  <code className="font-mono font-bold text-stone-800">192.168.12.108:8088</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Active Displays:</span>
                  <span className="font-mono text-emerald-700 font-bold">Table • Window • Frame</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Smart Lighting:</span>
                  <span className="font-mono text-emerald-700 font-bold">Hubspace (13 devices)</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStopAllGameRoomMirrors}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <StopCircle className="w-4 h-4 text-red-400" />
                  <span>Stop All Active Screen Mirrors</span>
                </button>
                <Link
                  href="/game-room"
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Full Game Room Remote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Portal Door & Photobooth Backend */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3bc0cd]/15 text-[#344ea2] flex items-center justify-center font-bold shrink-0">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Portal Door & Photobooth
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Synced with SM App Database spreadsheet and Google Drive photobooth archive.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Database Sheet:</span>
                  <span className="font-mono text-stone-800">SM App Database</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Tabs Connected:</span>
                  <span className="font-mono text-stone-800">Photobooth • Game_Room_Media</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Watermark:</span>
                  <span className="font-mono text-stone-800">@socialmedium.space</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <Link
                  href="/portal-media"
                  className="text-xs font-bold text-[#344ea2] hover:text-[#2a3f85] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Member Portal Media</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="https://neon-kiosk.onrender.com/api/portal-media"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <span>Render API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Card 4: Neon CRM Staff Dashboard */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Neon CRM Staff Suite
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Member analytics, volunteer hour logging, and system user activities.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">CRM Endpoint:</span>
                  <span className="font-mono text-stone-800">api.neoncrm.com/v2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Permissions:</span>
                  <span className="font-mono text-indigo-700 font-bold">System Users & App Developers</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <Link
                  href="/neon-dashboard"
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs text-center transition-colors"
                >
                  Analytics Dashboard
                </Link>
                <Link
                  href="/new-activity"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center transition-colors"
                >
                  Log CRM Activity
                </Link>
              </div>
            </div>

            {/* Card 5: Store & Self-Checkout Wallet */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Store & Self-Checkout Wallet
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Snack Shack, consumables, -$25 tab limit, and external Neon One donation checkout.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Model:</span>
                  <span className="font-semibold text-stone-900">Hybrid Wallet (Credit + $25 Tab Debt Cap)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Credit Card Processing:</span>
                  <span className="font-mono text-emerald-700 font-bold">100% External Neon One Forms (Zero In-App Risk)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Neon CRM Field:</span>
                  <span className="font-mono text-stone-800">{balanceFieldId || 'Auto-Detect ("Store Balance")'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs text-center transition-colors cursor-pointer shadow-xs"
                >
                  Configure Wallet & Test
                </button>
                <Link
                  href="/store"
                  className="flex-1 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs text-center transition-colors"
                >
                  Open Store Module
                </Link>
              </div>
            </div>

            {/* Card 6: Impact & Fundraising Module */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Impact & Fundraising Module
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Controls whether the Impact page and Digital Thermometer appear in the navigation for members.
                  </p>
                </div>
              </div>

              {/* 3-Way Visibility Radio Toggle */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleImpactVisibilityChange('all')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    impactVisibility === 'all'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold">Visible to All Users (Public)</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Appears in top navigation and mobile menu for all visitors & members
                      </div>
                    </div>
                  </div>
                  {impactVisibility === 'all' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleImpactVisibilityChange('staff')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    impactVisibility === 'staff'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">Staff & Developers Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Hidden from general members; visible only to staff and developers
                      </div>
                    </div>
                  </div>
                  {impactVisibility === 'staff' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleImpactVisibilityChange('none')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    impactVisibility === 'none'
                      ? 'bg-red-50 border-red-400 text-red-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div>
                      <div className="text-xs font-bold">Disabled / Dev Mode Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Completely removed from navigation and hidden from all members
                      </div>
                    </div>
                  </div>
                  {impactVisibility === 'none' && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('impact')}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs text-center transition-colors cursor-pointer shadow-xs"
                >
                  Configure Campaigns & Thermometer
                </button>
                <Link
                  href="/impact"
                  className="flex-1 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs text-center transition-colors"
                >
                  Open Live Impact Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: IMPACT & FUNDRAISING CAMPAIGNS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fredoka text-xl font-bold text-stone-900">
                    Impact & Fundraising Studio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    Cross-Platform Module
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure digital thermometer progress, Neon One campaign sync, and donation form endpoints across SM App, Check-In Kiosk, and Portal Door.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setIsLoadingCampaigns(true);
                  try {
                    const campaigns = await fetchNeonCampaigns();
                    if (campaigns && campaigns.length > 0) {
                      setAvailableCampaigns(campaigns);
                    }
                    if (impactSettings.campaignId) {
                      const detail = await fetchNeonCampaignDetail(impactSettings.campaignId);
                      if (detail) {
                        setImpactSettings((prev) => ({
                          ...prev,
                          raisedAmount: Number(detail.statistics?.grandTotal ?? detail.statistics?.donationAmount ?? prev.raisedAmount),
                          donorCount: Number(detail.statistics?.donationCount ?? prev.donorCount ?? 0),
                          goalAmount: (typeof detail.goal === 'number' && detail.goal > 0) ? detail.goal : prev.goalAmount,
                        }));
                      }
                    }
                    setImpactNotice({ message: `Synced live donations and ${campaigns?.length || 0} Neon One campaigns!`, type: 'success' });
                  } catch (err: any) {
                    setImpactNotice({ message: `Campaign refresh failed: ${err.message}`, type: 'error' });
                  } finally {
                    setIsLoadingCampaigns(false);
                  }
                }}
                disabled={isLoadingCampaigns}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Fetch latest campaign list from Neon One CRM"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCampaigns ? "animate-spin" : ""}`} />
                <span>Sync CRM</span>
              </button>
              <Link
                href="/impact"
                target="_blank"
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {impactNotice && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
                impactNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {impactNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{impactNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setImpactNotice(null)}
                className="p-1 rounded-lg hover:bg-stone-200/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Configuration Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Neon One Campaign Discovery */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-fredoka text-base font-bold text-stone-900">
                        Neon One CRM Campaign Discovery
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Select an active campaign to auto-fill goal and real-time donation stats.
                      </p>
                    </div>
                  </div>
                  {isLoadingCampaigns && (
                    <span className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Loading...
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Selected Neon One Campaign:
                    </label>
                    <select
                      value={impactSettings.campaignId || ''}
                      onChange={(e) => handleSelectCampaign(e.target.value)}
                      disabled={isLoadingCampaigns}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value="">-- Custom / Manual Campaign --</option>
                      {availableCampaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} (ID: {camp.id}) {camp.isDefault ? '• Default' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={impactSettings.enabled !== false}
                        onChange={(e) => setImpactSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                        className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Campaign Active & Displayed</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={impactSettings.autoSyncNeon !== false}
                        onChange={(e) => setImpactSettings((prev) => ({ ...prev, autoSyncNeon: e.target.checked }))}
                        className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Auto-Sync Live CRM Stats</span>
                    </label>
                  </div>
                </div>

                {/* Campaign Headline & Appeal Text */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Campaign Headline:
                    </label>
                    <input
                      type="text"
                      value={impactSettings.headline || ''}
                      onChange={(e) => setImpactSettings((prev) => ({ ...prev, headline: e.target.value }))}
                      placeholder="e.g. Fuel the Future of Social Medium"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Public Description & Impact Message:
                    </label>
                    <textarea
                      rows={3}
                      value={impactSettings.description || ''}
                      onChange={(e) => setImpactSettings((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell members how their donations help..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Donation Form Endpoint Configuration */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-fredoka text-base font-bold text-stone-900">
                      Donation Form URL & Presets
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Configure the exact donation link used across Companion App, Kiosk QR Code, and Portal Door.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Target Donation Form Link:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={impactSettings.donationFormUrl}
                      onChange={(e) => setImpactSettings((prev) => ({ ...prev, donationFormUrl: e.target.value }))}
                      placeholder="https://socialmedium.app.neoncrm.com/..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <a
                      href={impactSettings.donationFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                      title="Test URL in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Preset Fast-Fill Buttons */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                    Quick Preset Links:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setImpactSettings((prev) => ({
                          ...prev,
                          donationFormUrl: `https://socialmedium.app.neoncrm.com/donation.jsp?campaign=${prev.campaignId || '2'}&`,
                        }))
                      }
                      className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span>Neon Campaign Form</span>
                      <span className="text-[10px] text-stone-400 font-mono">campaign={impactSettings.campaignId || '2'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImpactSettings((prev) => ({
                          ...prev,
                          donationFormUrl: 'https://socialmedium.app.neoncrm.com/forms/give',
                        }))
                      }
                      className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span>General Giving Form</span>
                      <span className="text-[10px] text-stone-400 font-mono">/forms/give</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImpactSettings((prev) => ({
                          ...prev,
                          donationFormUrl: 'https://socialmedium.app.neoncrm.com/forms/donate',
                        }))
                      }
                      className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span>Standard Donate Form</span>
                      <span className="text-[10px] text-stone-400 font-mono">/forms/donate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImpactSettings((prev) => ({
                          ...prev,
                          donationFormUrl: 'https://socialmedium.app.neoncrm.com/forms/store-give',
                        }))
                      }
                      className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span>Store Tab Top-Up Form</span>
                      <span className="text-[10px] text-stone-400 font-mono">Store Tab</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Goals & Thermometer Stats */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-fredoka text-base font-bold text-stone-900">
                      Goal, Raised Amount & Thermometer Accent
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Values update live when synced with CRM, or can be fine-tuned manually here.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Target Goal ($):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="50"
                      value={impactSettings.goalAmount}
                      onChange={(e) =>
                        setImpactSettings((prev) => ({ ...prev, goalAmount: Math.max(1, Number(e.target.value) || 1) }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Amount Raised ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={impactSettings.raisedAmount}
                      onChange={(e) =>
                        setImpactSettings((prev) => ({ ...prev, raisedAmount: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Donor Count:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={impactSettings.donorCount || 0}
                      onChange={(e) =>
                        setImpactSettings((prev) => ({ ...prev, donorCount: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Primary Thermometer Color Picker */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Thermometer Fluid Accent Color:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={impactSettings.primaryColor || '#f16622'}
                      onChange={(e) => setImpactSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5 bg-white"
                    />
                    <div className="flex items-center gap-2">
                      {['#f16622', '#e11d48', '#4f46e5', '#059669', '#d97706'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setImpactSettings((prev) => ({ ...prev, primaryColor: hex }))}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                            (impactSettings.primaryColor || '#f16622').toLowerCase() === hex.toLowerCase()
                              ? 'scale-115 border-stone-900 shadow-xs'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save & Deploy Impact Action Button */}
              <div className="p-4 rounded-3xl bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div>
                  <h4 className="font-fredoka text-sm font-bold">Synchronize All 3 Platforms</h4>
                  <p className="text-[11px] text-stone-400">
                    Saves to cloud settings; instant sync to SM App, Check-in Kiosk, and Portal Door.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveImpact}
                  disabled={isSavingImpact}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSavingImpact ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Across Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Deploy Impact</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column (5 cols): Live Digital Thermometer & QR Scan Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Live Digital Thermometer Preview
                </span>
                <DigitalThermometer
                  goal={impactSettings.goalAmount}
                  raised={impactSettings.raisedAmount}
                  donorCount={impactSettings.donorCount}
                  primaryColor={impactSettings.primaryColor || '#f16622'}
                />
              </div>

              {/* Scan-to-Donate Mobile QR Code Preview */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-fredoka text-sm font-bold text-stone-900">
                      Scan-To-Donate Mobile QR Code
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Rendered on the Check-In Kiosk & Portal Door display for smartphone donors.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center gap-3">
                  <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        impactSettings.donationFormUrl || 'https://socialmedium.app.neoncrm.com/forms/give'
                      )}`}
                      alt="Donation Form QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-[11px] text-stone-600 font-mono break-all max-w-xs">
                    {impactSettings.donationFormUrl || 'https://socialmedium.app.neoncrm.com/forms/give'}
                  </div>
                </div>
              </div>

              {/* Portal Door Impact Mode Remote Controller */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-stone-900">
                        Portal Door Home Screen
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Make Impact thermometer the idle screen on the physical door.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      portalSettings.impactMode
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {portalSettings.impactMode ? "Impact: ON" : "Impact: OFF"}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-stone-600">
                    {portalSettings.impactMode ? "Active on Portal Door Home" : "Standard Closed Door Idle"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTogglePortalSetting("impactMode", !portalSettings.impactMode)}
                    disabled={isUpdatingPortalSetting === "impactMode"}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                      portalSettings.impactMode
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-stone-900 hover:bg-stone-800 text-white"
                    }`}
                  >
                    {isUpdatingPortalSetting === "impactMode" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <HeartHandshake className="w-3.5 h-3.5" />
                    )}
                    <span>{portalSettings.impactMode ? "Turn Off on Door" : "Turn On on Door"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB: GIVE/GET & BOARD MEMBER SETTINGS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'give-get' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fredoka text-xl font-bold text-stone-900">
                    Give / Get & Board Member Settings
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Board Portal
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Track board member giving, configure custom field rules, and view the cumulative Give/Get summary.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/give-get"
                className="py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Open Give/Get Module</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {giveGetNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{giveGetNotice}</span>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Access & Preview Control */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Access Control & Detection</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Accounts with Custom Field 123 (<strong>Board Member</strong> = True) can view Give/Get.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-mono font-bold text-stone-700">
                  Field 123
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">Preview Give/Get as Board Member</span>
                  <span className="text-[11px] text-stone-500">
                    Enables the Give/Get tab in the main navigation for testing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBoardMemberPreviewEnabled(!isBoardMemberPreviewEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isBoardMemberPreviewEnabled ? 'bg-emerald-500 justify-end' : 'bg-stone-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              <div className="text-[11px] text-stone-400 space-y-1">
                <p>• Active User Board Status: <strong className={member?.isBoardMember ? "text-emerald-600" : "text-stone-600"}>{member?.isBoardMember ? "TRUE (Verified in Neon One)" : "FALSE"}</strong></p>
                <p>• Live Volunteer Hours (Field 125): <strong className="text-amber-600">{member?.volunteerHours !== undefined ? `${member.volunteerHours.toFixed(1)} hrs` : '0.0 hrs'}</strong></p>
                <p>• Preview Override: <strong className={isBoardMemberPreviewEnabled ? "text-emerald-600" : "text-stone-500"}>{isBoardMemberPreviewEnabled ? "ENABLED" : "DISABLED"}</strong></p>
              </div>
            </div>

            {/* 2. Valuation Rate Settings */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Volunteer Hourly Credit Rate</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  The dollar amount credited toward a board member's Give/Get commitment per volunteer hour.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Hourly Rate ($ / hour)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">$</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={giveGetHourlyRate}
                      onChange={(e) => setGiveGetHourlyRate(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveHourlyRate}
                    className="py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Save Rate
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  Default: $10.00/hour. Example: 40 hours logged = $400.00 Give/Get credit.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Service Categories & Default Assignment */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">Volunteer Service Categories & Activity Types</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#344ea2] font-mono text-[10px] font-bold">
                    Neon One Activities
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage the service categories available to board members when logging hours. When saved, each session creates a completed Activity in Neon One.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCategoriesToDefault}
                  className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCategories}
                  disabled={isSavingCategories}
                  className="py-2 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingCategories ? 'animate-spin' : ''}`} />
                  <span>{isSavingCategories ? 'Saving...' : 'Save Categories'}</span>
                </button>
              </div>
            </div>

            {/* Categories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Icon</th>
                    <th className="py-2.5 px-3">Category Name</th>
                    <th className="py-2.5 px-3">Default Selection</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {giveGetCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-3 text-lg">
                        <span>{cat.icon || '🤝'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900">{cat.label}</span>
                        <span className="block text-[10px] text-stone-400 font-mono">id: {cat.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        {cat.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Default Category
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultCategory(cat.id)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-stone-200 text-stone-600 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Category Form */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-20">
                <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Emoji</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full text-center py-2 px-2 rounded-xl bg-white border border-stone-200 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                  placeholder="🤝"
                />
              </div>

              <div className="w-full sm:flex-1">
                <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Category Title</label>
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                  placeholder="e.g., Maker Equipment Maintenance & Training"
                />
              </div>

              <div className="w-full sm:w-auto sm:self-end">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Board of Directors Roster Table */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Board Member Roster & Cumulative Give/Get</h3>
                <p className="text-xs text-stone-500">
                  Overview of all constituents with the Board Member field enabled in Neon One CRM.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadBoardRoster}
                disabled={isLoadingBoardRoster}
                className="py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBoardRoster ? 'animate-spin' : ''}`} />
                <span>{isLoadingBoardRoster ? 'Loading...' : 'Load Board Roster'}</span>
              </button>
            </div>

            {boardRoster.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                {hasLoadedBoardRoster
                  ? "No board members found in Neon One CRM. Ensure constituent accounts have the 'Board Member' checkbox (Custom Field 123) marked True."
                  : "Click \"Load Board Roster\" to fetch the latest board members and contribution totals from Neon One CRM."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Board Member</th>
                      <th className="py-2.5 px-3">Hard Credit</th>
                      <th className="py-2.5 px-3">Soft Credit</th>
                      <th className="py-2.5 px-3">Service Hours</th>
                      <th className="py-2.5 px-3">Service Value</th>
                      <th className="py-2.5 px-3 font-extrabold text-stone-900">Total Give/Get</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                    {boardRoster.map((b) => (
                      <tr key={b.accountId} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-900 block">{b.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">#{b.accountId}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-blue-700">
                          ${b.hardCredit.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-purple-700">
                          ${b.softCredit.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-800">
                          {b.volunteerHours.toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-3 font-semibold text-amber-700">
                          ${b.volunteerValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-black text-emerald-600 text-sm">
                          ${b.totalGiveGet.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PORTAL DOOR REMOTE CONTROLLER                                        */}
      {/* ========================================================================= */}
      {activeTab === 'portal-door' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fredoka text-xl font-bold text-stone-900">
                    Portal Door Remote Controller
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                    Physical Kiosk Live Sync
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Live 2-way wireless controller for the physical Portal Door installation. Toggle modes from your phone, or see the actual settings chosen on the door in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualPortalRefresh}
                disabled={isRefreshingPortal}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Fetch latest settings from physical Portal Door"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPortal ? "animate-spin" : ""}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {/* Feedback notice */}
          {portalNotice && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs ${
                portalNotice.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-red-50 text-red-900 border border-red-200"
              }`}
            >
              {portalNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{portalNotice.message}</span>
            </div>
          )}

          {/* 5 Interactive Remote Control Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control 0: Impact Campaign Home Screen */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Impact Mode (Fundraising Home Screen)
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Managed via SM App
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                      portalSettings.impactMode
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {portalSettings.impactMode ? "Impact: ON" : "Impact: OFF"}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  When enabled, the Portal Door replaces its idle/closed door home screen with the live Impact Campaign digital thermometer and donor QR code. When members tap their badge or snap photos, the door operates completely normally and returns to the Impact screen when idle.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-medium">
                  {portalSettings.impactMode ? "Active on Portal Door Home Screen" : "Standard Closed Door Idle"}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePortalSetting("impactMode", !portalSettings.impactMode)}
                  disabled={isUpdatingPortalSetting === "impactMode"}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    portalSettings.impactMode
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-stone-900 hover:bg-stone-800 text-white"
                  }`}
                >
                  {isUpdatingPortalSetting === "impactMode" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : portalSettings.impactMode ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <HeartHandshake className="w-3.5 h-3.5" />
                  )}
                  <span>{portalSettings.impactMode ? "Turn Impact Mode OFF" : "Turn Impact Mode ON"}</span>
                </button>
              </div>
            </div>

            {/* Control 1: Costume Contest Mode */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Costume Contest Mode
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Managed via SM App
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                      portalSettings.contestMode
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {portalSettings.contestMode ? "Contest: ON" : "Contest: OFF"}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  When enabled, photobooth snapshots taken on the Portal Door display a prominent <strong>Upload to Contest</strong> action and QR code prompt. Submissions appear instantly on the Social Medium Contest leaderboard.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-medium">
                  {portalSettings.contestMode ? "Active on Portal Door" : "Deactivated on Portal Door"}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePortalSetting("contestMode", !portalSettings.contestMode)}
                  disabled={isUpdatingPortalSetting === "contestMode"}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    portalSettings.contestMode
                      ? "bg-amber-500 hover:bg-amber-600 text-stone-950"
                      : "bg-stone-900 hover:bg-stone-800 text-white"
                  }`}
                >
                  {isUpdatingPortalSetting === "contestMode" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : portalSettings.contestMode ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Trophy className="w-3.5 h-3.5" />
                  )}
                  <span>{portalSettings.contestMode ? "Turn Contest OFF" : "Turn Contest ON"}</span>
                </button>
              </div>
            </div>

            {/* Control 2: Digital Background vs Physical Background */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-700 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">
                        AI Background Removal
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Door Hotkey: <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">-</kbd>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                      portalSettings.digitalBackground
                        ? "bg-cyan-100 text-cyan-900 border border-cyan-300"
                        : "bg-orange-100 text-orange-900 border border-orange-300"
                    }`}
                  >
                    {portalSettings.digitalBackground ? "Digital AI Scenes" : "Physical Backdrop"}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Controls Google MediaPipe Multi-Person AI segmentation. When <strong>Digital Background</strong> is active, members are keyed onto digital themes and custom backdrops. When set to <strong>Physical Background</strong>, the camera shows the raw physical room backdrop (Party Mode).
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-medium">
                  {portalSettings.digitalBackground ? "AI Cutout Enabled" : "Party / Raw Camera Mode"}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePortalSetting("digitalBackground", !portalSettings.digitalBackground)}
                  disabled={isUpdatingPortalSetting === "digitalBackground"}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    portalSettings.digitalBackground
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-stone-950"
                  }`}
                >
                  {isUpdatingPortalSetting === "digitalBackground" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{portalSettings.digitalBackground ? "Switch to Physical" : "Switch to Digital AI"}</span>
                </button>
              </div>
            </div>

            {/* Control 3: Installation Sound */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Installation Sound / Audio
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Door Hotkey: <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">.</kbd>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                      portalSettings.sound
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-rose-100 text-rose-900 border border-rose-300"
                    }`}
                  >
                    {portalSettings.sound ? "Sound: ON" : "Sound: MUTED"}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Controls the master audio volume on the physical Portal Door speakers. Controls transition video sound effects, background audio, and member theme song playback.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-medium">
                  {portalSettings.sound ? "Speaker Volume Active" : "Silent / Muted"}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePortalSetting("sound", !portalSettings.sound)}
                  disabled={isUpdatingPortalSetting === "sound"}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    portalSettings.sound
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isUpdatingPortalSetting === "sound" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : portalSettings.sound ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{portalSettings.sound ? "Mute Sound" : "Unmute Sound"}</span>
                </button>
              </div>
            </div>

            {/* Control 4: Photobooth Mode */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center font-bold">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Live Photobooth Camera
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Door Hotkey: <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">*</kbd>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                      portalSettings.photoboothMode
                        ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {portalSettings.photoboothMode ? "Camera: ACTIVE" : "Camera: SLEEP"}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Engages or pauses the live webcam feed and photobooth canvas overlay on the door. When active, visitors see themselves in the portal mirror ready for a tap card snapshot.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-medium">
                  {portalSettings.photoboothMode ? "Webcam Loop Engaged" : "Webcam Standby / Closed Door"}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePortalSetting("photoboothMode", !portalSettings.photoboothMode)}
                  disabled={isUpdatingPortalSetting === "photoboothMode"}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    portalSettings.photoboothMode
                      ? "bg-stone-800 hover:bg-stone-900 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isUpdatingPortalSetting === "photoboothMode" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{portalSettings.photoboothMode ? "Sleep Camera" : "Engage Photobooth"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Door Status & Info Footnote */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>2-Way Door Synchronization:</strong> Any changes made on the physical door using keyboard hotkeys or on-screen buttons automatically update this phone controller live within 3 seconds.
              </span>
            </div>
            {portalSettings.updatedAt && (
              <span className="text-[11px] font-mono text-stone-400 shrink-0">
                Last Synced: {new Date(portalSettings.updatedAt).toLocaleTimeString()} ({portalSettings.updatedBy === "door" ? "Chosen on Portal Door" : "Set via Phone"})
              </span>
            )}
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB: BUDDY BUILDER ASSETS & ACCESSORIES                                 */}
      {/* ========================================================================= */}
      {activeTab === 'buddy-assets' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-700 flex items-center justify-center shrink-0 shadow-xs">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fredoka text-xl font-bold text-stone-900">
                    Buddy Builder Asset Studio
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                    Live Economy
                  </span>
                </div>
                <p className="text-stone-600 text-xs mt-0.5">
                  Manage wardrobe assets via Google Sheets database or in-app file uploads, set Buddy Buck prices, and configure Neon One fields.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="https://docs.google.com/spreadsheets/d/1vwXuw-TBYxUXKXUSipa2drArRNXZuKNwbXFhxcVbIc0/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Open SM App Database Google Sheet"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheet ↗</span>
              </a>

              <button
                type="button"
                onClick={handleSyncBuddySheet}
                disabled={isSyncingBuddySheet}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sync latest items from Google Sheet Buddy_Items tab"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingBuddySheet ? 'animate-spin' : ''}`} />
                <span>{isSyncingBuddySheet ? 'Syncing...' : 'Sync Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGrantTestBuddyBucks(100)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Give 100 test Buddy Bucks to your current account"
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+100 Test BB</span>
              </button>
            </div>
          </div>

          {/* Google Sheet Database Helper Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet Database Integration ("Buddy_Items" Tab)</span>
            </div>
            <p className="leading-relaxed">
              You can manage all accessories and prices directly in your Google Sheet! Add a new tab named <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">Buddy_Items</code> to the <strong>SM App Database</strong> sheet with these exact column headers:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Name', 'Category', 'Price', 'Asset_URL', 'Description', 'Active', 'Artist'].map((col) => (
                <span key={col} className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-mono text-[11px] font-bold text-emerald-800">
                  {col}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-emerald-800 pt-1 space-y-0.5">
              <div>&bull; <strong>Categories:</strong> <code>headwear</code>, <code>tops</code>, <code>props</code>, <code>capes</code>, <code>shoes</code>, <code>face_accessory</code>, <code>mouth</code>, <code>hair</code>, <code>costume</code></div>
              <div>&bull; <strong>Layer Order (Z-Index):</strong> <em>Removed from spreadsheet!</em> Everything in a category always shares the same Z-Index configured in the Category Layer Manager below.</div>
              <div>&bull; <strong>Asset_URL:</strong> Direct Google Drive link or relative path (e.g. <code>/buddies/costume_wizard.png</code>).</div>
            </div>
          </div>

          {/* Neon One Custom Fields Status */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Neon One CRM Custom Fields Linked</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                Live Neon API v2
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                <div className="text-[10px] uppercase font-bold text-stone-400">Buddy Avatar</div>
                <div className="font-mono font-bold text-blue-900 text-sm">ID: {BUDDY_AVATAR_FIELD_ID}</div>
                <div className="text-[10px] text-stone-500">MultiLineText (JSON State)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                <div className="text-[10px] uppercase font-bold text-stone-400">Buddy Bucks</div>
                <div className="font-mono font-bold text-blue-900 text-sm">ID: {BUDDY_BUCKS_FIELD_ID}</div>
                <div className="text-[10px] text-stone-500">Whole_Number (In-App Wallet)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                <div className="text-[10px] uppercase font-bold text-stone-400">Experience Points</div>
                <div className="font-mono font-bold text-blue-900 text-sm">ID: {XP_FIELD_ID}</div>
                <div className="text-[10px] text-stone-500">Whole_Number (Level XP)</div>
              </div>
            </div>
          </div>

          {buddyAssetNotice && (
            <div
              className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 ${
                buddyAssetNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {buddyAssetNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{buddyAssetNotice.message}</span>
              </div>
              <button
                onClick={() => setBuddyAssetNotice(null)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY LAYER STACK (Z-INDEX) MANAGER                   */}
          {/* ======================================================== */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                    <span>Category Layer Manager (Z-Index Order)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      SSOT
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Assign the visual depth (Z-Index) for each category. Everything within a single category always shares the exact same Z-Index value!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetCategoryLayers}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                  title="Reset category layers to standard defaults"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategoryLayers}
                  disabled={isSavingLayers}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingLayers ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Layer Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {layerNotice && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
                  layerNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span>{layerNotice.message}</span>
                <button
                  onClick={() => setLayerNotice(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Visual Stack: Categories ordered by Z-Index ascending (back-to-front) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2">
                <span>Category Stack (Back / Lowest Z &rarr; Front / Highest Z)</span>
                <span className="text-right">Shared Category Z-Index</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {Object.entries(categoryLayers)
                  .sort(([, zA], [, zB]) => zA - zB)
                  .map(([cat, z]) => {
                    const itemsInCat = buddyCatalog.filter((i) => i.category === cat).length;
                    const isStandard = DEFAULT_CATEGORY_LAYER_ORDER[cat] !== undefined;

                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-2xl bg-stone-50/70 border border-stone-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Z-Index Badge */}
                          <div className="w-12 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] uppercase font-bold text-stone-400 leading-none">Z</span>
                            <span className="font-mono font-black text-indigo-700 text-sm leading-tight">{z}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-900">
                                {formatCategoryLabel(cat)}
                              </span>
                              <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-200/60 text-stone-600">
                                {cat}
                              </code>
                            </div>
                            <p className="text-[11px] text-stone-500">
                              {itemsInCat} {itemsInCat === 1 ? 'item' : 'items'} in catalog
                              {cat === 'base_body' && ' • Base Character Body'}
                              {cat === 'capes' && ' • Behind Mascot Body'}
                              {cat === 'props' && ' • Foreground Handheld Accessory'}
                            </p>
                          </div>
                        </div>

                        {/* Z-Index Steppers & Direct Input */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCategoryZ(cat, Math.max(0, z - 5))}
                            className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-700 flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Nudge layer backward (-5 Z)"
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            value={z}
                            onChange={(e) => handleUpdateCategoryZ(cat, parseInt(e.target.value, 10) || 0)}
                            className="w-16 text-center text-xs font-mono font-bold bg-white border border-stone-300 rounded-xl py-1.5 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCategoryZ(cat, z + 5)}
                            className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-700 flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Nudge layer forward (+5 Z)"
                          >
                            +5
                          </button>

                          {!isStandard && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
                              title="Delete custom category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Add Custom Category Row */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Add custom category slug (e.g. wings, gloves, pets)"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                className="w-full sm:flex-1 text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-stone-500 font-bold">Z:</span>
                  <input
                    type="number"
                    value={newCategoryZ}
                    onChange={(e) => setNewCategoryZ(parseInt(e.target.value, 10) || 50)}
                    className="w-12 text-center bg-transparent font-mono font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  + Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Top Row: In-App Upload Form & Neon One Custom Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form Card */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-stone-700" />
                  <h3 className="font-bold text-stone-900 text-base">
                    Quick In-App Upload & Publish
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500 font-mono">
                  Stack: Capes(20) &bull; Body(30) &bull; Tops(60) &bull; Shoes(70) &bull; Head(90) &bull; Props(110)
                </span>
              </div>

              <form onSubmit={handlePublishBuddyItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Accessory Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBuddyName}
                      onChange={(e) => setNewBuddyName(e.target.value)}
                      placeholder="e.g. Safety Goggles, Wizard Cape, 3D Print..."
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Category *
                    </label>
                    <select
                      value={newBuddyCategory}
                      onChange={(e) => {
                        const cat = e.target.value as BuddyLayerCategory;
                        setNewBuddyCategory(cat);
                      }}
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                    >
                      <option value="headwear">Headwear / Hats / Helmets</option>
                      <option value="tops">Tops / Outfits / Jackets</option>
                      <option value="props">Props / Tools / Handhelds</option>
                      <option value="capes">Capes / Wings (Behind Body)</option>
                      <option value="face_accessory">Face Accessories / Glasses</option>
                      <option value="shoes">Footwear / Shoes</option>
                      <option value="expression">Facial Expression</option>
                      <option value="hair">Hair Style</option>
                      <option value="bottoms">Pants / Bottoms</option>
                      <option value="base_body">Base Mascot Body</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Price in Buddy Bucks (🪙 BB)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-stone-500">🪙</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={newBuddyPrice}
                        onChange={(e) => setNewBuddyPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full pl-8 text-xs bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Set 0 to make it free and unlocked for all makers.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Layer Z-Index Stack Order
                    </label>
                    <div className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl p-2.5 text-stone-800 font-mono font-bold flex items-center justify-between">
                      <span>Z-Index: {categoryLayers[newBuddyCategory] !== undefined ? categoryLayers[newBuddyCategory] : 50}</span>
                      <span className="text-[10px] text-stone-500 font-sans font-normal">Auto-assigned</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Determined by Category Layer Manager above.
                    </span>
                  </div>
                </div>

                {/* File Upload or Path */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Upload Transparent Graphic (PNG / SVG / WebP) *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-stone-600" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp"
                        onChange={handleBuddyFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-stone-500">or enter relative path / URL:</div>
                    <input
                      type="text"
                      value={newBuddyAssetUrl}
                      onChange={(e) => setNewBuddyAssetUrl(e.target.value)}
                      placeholder="/buddies/costume_wizard.png"
                      className="flex-1 w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                    />
                  </div>
                </div>

                {/* Preview Thumbnail if selected */}
                {newBuddyAssetUrl && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-stone-300 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <img
                        src={newBuddyAssetUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-stone-700">
                      <div className="font-bold">{newBuddyName || 'Untitled Asset'}</div>
                      <div className="text-[11px] text-stone-500">
                        Category: {newBuddyCategory} &bull; Price: {newBuddyPrice} 🪙 BB &bull; Z-Index: {newBuddyZIndex}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Description / Lore (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBuddyDescription}
                    onChange={(e) => setNewBuddyDescription(e.target.value)}
                    placeholder="e.g. Crafted in the electronics lab with ESD protection."
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                  />
                </div>

                {/* Color Picker Mode Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/70 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={newBuddyColorPicker}
                    onChange={(e) => setNewBuddyColorPicker(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 select-none">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>Color Picker Mode (White silhouette / Line art)</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">
                      Allows members to equip this item and dynamically select any color from the wardrobe color palette.
                    </p>
                  </div>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBuddyAsset}
                    className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {isSavingBuddyAsset ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing to Catalog...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Publish Accessory to All Users</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Neon One Field Mappings Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-stone-900 text-base">
                    Neon One Custom Fields
                  </h3>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Enter the Field IDs you created in Neon One for <strong>Buddy Avatar</strong> and <strong>Buddy Bucks</strong>.
                </p>

                {buddyFieldsNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      buddyFieldsNotice.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {buddyFieldsNotice.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    )}
                    <span>{buddyFieldsNotice.message}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Buddy Avatar JSON Field ID
                    </label>
                    <input
                      type="text"
                      value={buddyAvatarFieldId}
                      onChange={(e) => setBuddyAvatarFieldId(e.target.value)}
                      placeholder="e.g. 182 or 124"
                      className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Stores avatar JSON string of equipped clothes & colors.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Buddy Bucks Balance Field ID
                    </label>
                    <input
                      type="text"
                      value={buddyBucksFieldId}
                      onChange={(e) => setBuddyBucksFieldId(e.target.value)}
                      placeholder="e.g. 183 or 125"
                      className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-hidden"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Stores member balance integer in Neon One.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleSaveBuddyFields}
                  disabled={isSavingBuddyFields}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSavingBuddyFields ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Neon Field IDs...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Field IDs Globally</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Catalog Library & Asset Browser */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Published Buddy Catalog ({buddyCatalog.length} Items)
                </h3>
                <p className="text-stone-500 text-xs">
                  All active accessories available across the community.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setBuddyCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    buddyCategoryFilter === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All ({buddyCatalog.length})
                </button>
                {devCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBuddyCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      buddyCategoryFilter === cat.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {buddyCatalog
                .filter((it) => buddyCategoryFilter === 'all' || it.category === buddyCategoryFilter)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between hover:bg-white hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 uppercase">
                          {item.category.replace('_', ' ')}
                        </span>
                        {item.id.startsWith('sheet_') ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Google Sheet
                          </span>
                        ) : item.isCustom ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                            Custom Upload
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            Preset
                          </span>
                        )}
                      </div>

                      <div className="w-full h-32 rounded-xl bg-white border border-stone-200 flex items-center justify-center p-2 mb-3 overflow-hidden">
                        {item.assetUrl ? (
                          <img
                            src={item.assetUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-xs text-stone-400 font-mono">No Graphic</div>
                        )}
                      </div>

                      <div className="font-bold text-stone-900 text-sm mb-1 line-clamp-1">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-stone-500 text-[11px] mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700">
                        <span>🪙 {item.price === 0 ? 'Free Starter' : `${item.price} BB`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-mono">z: {item.zIndex}</span>
                        {item.isCustom && !item.id.startsWith('sheet_') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBuddyItem(item.id, item.name)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete custom item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* TAB: STORE, SNACK SHACK & WALLET CONFIGURATION                          */}
      {/* ========================================================================= */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fredoka text-xl font-bold text-stone-900">
                    Makerspace Store & Wallet Engine
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Safe Payments
                  </span>
                </div>
                <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                  Self-checkout for snacks and supplies with tab limits, Neon One field syncing, and zero in-app credit card handling.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/store"
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>View User Store Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Feedback Notice */}
          {balanceNotice && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{balanceNotice}</span>
            </div>
          )}

          {storeConfigSaved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Neon One Store & Donation settings saved successfully!</span>
            </div>
          )}

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Neon One Field Settings & Safety Architecture */}
            <div className="lg:col-span-7 space-y-6">
              {/* Form 1: Neon One Custom Field Binding */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-fredoka text-lg font-bold text-stone-900">
                      Neon One CRM Field & Campaign Integration
                    </h3>
                    <p className="text-stone-500 text-xs mt-0.5">
                      Connected to Neon One CRM custom account field and fundraising campaign.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">Custom Account Field</span>
                    <div className="font-bold text-stone-900">Store Balance (ID: 119)</div>
                    <div className="text-[11px] text-emerald-700 font-medium">✓ Currency field in Neon CRM</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">Donation Campaign</span>
                    <div className="font-bold text-stone-900">Store (Code: STORE)</div>
                    <div className="text-[11px] text-emerald-700 font-medium">✓ ID 1 active in Neon CRM</div>
                  </div>
                </div>

                <form onSubmit={handleSaveStoreConfig} className="space-y-4 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">
                      Neon One Account Custom Field ID for Store Balance
                    </label>
                    <input
                      type="text"
                      value={balanceFieldId}
                      onChange={(e) => setBalanceFieldId(e.target.value)}
                      placeholder='119'
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs focus:bg-white focus:border-[#3bc0cd]"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Default is <strong>119</strong> (Store Balance). The app automatically reads and updates this custom field during self-checkout.
                    </p>
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">
                      Official Neon One Store Donation & Top-Up Form URL
                    </label>
                    <input
                      type="url"
                      value={donationBaseUrl}
                      onChange={(e) => setDonationBaseUrl(e.target.value)}
                      placeholder="https://socialmedium.app.neoncrm.com/forms/store-donation-form"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:border-[#3bc0cd]"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Tab Settlement and Wallet Top-Up buttons redirect here. Campaign parameters (<code>campaign=STORE</code>, <code>campaign.id=1</code>) and account ID are appended automatically.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save CRM Settings</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card: Google Sheet Database (Store_Items) */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-fredoka text-lg font-bold text-stone-900">
                        Google Sheet Inventory Database
                      </h3>
                      <p className="text-stone-500 text-xs">
                        SM App Database spreadsheet &gt; tab <code>Store_Items</code>
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://docs.google.com/spreadsheets/d/1vwXuw-TBYxUXKXUSipa2drArRNXZuKNwbXFhxcVbIc0/edit"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-semibold">Spreadsheet:</span>
                    <span className="font-mono text-stone-800">SM App Database</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-semibold">Target Tab Name:</span>
                    <code className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">Store_Items</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-semibold">Live Status:</span>
                    <span className={`font-semibold ${sheetItemCount ? 'text-emerald-700' : 'text-stone-500'}`}>
                      {sheetItemCount ? `Connected (${sheetItemCount} items loaded)` : 'Standard Fallback Catalog'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                    <span>How to set up your Store Items tab in the spreadsheet:</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                    Create a new tab named <strong>Store_Items</strong> in the SM App Database Google Sheet with these column headers in row 1:
                  </p>
                  <div className="p-2 rounded-xl bg-white border border-emerald-300 font-mono text-[10px] text-stone-800 overflow-x-auto">
                    Name, Category, Price, Description, Icon, Active
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Categories can be anything you choose (e.g. <code>Snack Bar</code>, <code>Materials Store</code>, <code>SWAG</code>, <code>Other</code>). The Store page dynamically creates filter tabs matching whatever categories are in your spreadsheet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDevSyncSheet}
                  disabled={isSyncingSheetDev}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheetDev ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheetDev ? 'Fetching from Google Sheet...' : 'Sync from Google Sheet Now'}</span>
                </button>
              </div>

              {/* Safety Architecture Box */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Zero Credit Card Storage Architecture
                  </h3>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  To protect member safety and eliminate PCI compliance liabilities, this app <strong>never handles or stores credit card numbers</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In-App Actions
                    </span>
                    <p className="text-[11px] text-stone-600">
                      Item selection, cart calculation, tap card login, tab tracking, and -$25.00 limit enforcement.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[#344ea2]" /> Neon One Processing
                    </span>
                    <p className="text-[11px] text-stone-600">
                      Credit cards, Apple Pay, Google Pay, ACH, donor receipts, and financial reconciliation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Member Balance Diagnostic & Override Console */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card: Active Account Balance Diagnostic */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-fredoka text-lg font-bold text-stone-900">
                      Balance Testing & Diagnostic Console
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                      Account-Specific
                    </span>
                  </div>
                  <p className="text-stone-500 text-xs">
                    Test wallet balance states, debt warnings, and cap behaviors. Simulates and alters only the active/impersonated member account (does not affect other users).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">Active Account:</span>
                    <span className="font-bold text-stone-900">{getGreetingName(member)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">Tap Card:</span>
                    <span className="font-mono text-stone-700">#{activeCardId || member?.tapCard || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/60">
                    <span className="text-stone-600 font-bold">Current Balance:</span>
                    <span
                      className={`text-base font-bold font-mono px-3 py-1 rounded-xl ${
                        (member?.storeBalance ?? 0) < 0
                          ? 'bg-rose-100 text-rose-800'
                          : (member?.storeBalance ?? 0) > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {(member?.storeBalance ?? 0) < 0
                        ? `-$${Math.abs(member?.storeBalance ?? 0).toFixed(2)}`
                        : (member?.storeBalance ?? 0) > 0
                        ? `+$${(member?.storeBalance ?? 0).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>Tab Cap Limit:</span>
                    <span className="font-mono font-bold text-rose-700">-${MAX_STORE_TAB_LIMIT.toFixed(2)} Max Debt</span>
                  </div>
                </div>

                {/* Quick Simulation Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                    Simulate Quick Adjustments
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isApplyingDevTopUp || isUpdatingTestBalance}
                      onClick={() => handleDevTopUp(25)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-between col-span-2 shadow-xs"
                    >
                      <span>Top Up Wallet ($25.00) (Cancels Debt First)</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-200" />
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingTestBalance}
                      onClick={() => handleSetTestBalance((member?.storeBalance ?? 0) + 10)}
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer text-left"
                    >
                      +$10.00 Raw
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingTestBalance}
                      onClick={() => handleSetTestBalance((member?.storeBalance ?? 0) + 25)}
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer text-left"
                    >
                      +$25.00 Raw
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingTestBalance}
                      onClick={() => handleSetTestBalance((member?.storeBalance ?? 0) - 2)}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer text-left"
                    >
                      -$2.00 (Drink Tab)
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingTestBalance}
                      onClick={() => handleSetTestBalance((member?.storeBalance ?? 0) - 7)}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer text-left"
                    >
                      -$7.00 (Materials Tab)
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingTestBalance}
                    onClick={() => handleSetTestBalance(0)}
                    className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset Balance to $0.00
                  </button>
                </div>

                {/* Custom Top-Up (Cancels debt first) */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                    Simulate Top-Up (Debt Cleared First)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={devTopUpAmount}
                      onChange={(e) => setDevTopUpAmount(e.target.value)}
                      placeholder="Top-up amount (e.g. 25.00)"
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={isApplyingDevTopUp || !devTopUpAmount || parseFloat(devTopUpAmount) <= 0}
                      onClick={() => {
                        const parsed = parseFloat(devTopUpAmount);
                        if (!isNaN(parsed) && parsed > 0) handleDevTopUp(parsed);
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Apply Top-Up
                    </button>
                  </div>
                  {(member?.storeBalance ?? 0) < 0 && parseFloat(devTopUpAmount) > 0 && (
                    <p className="text-[10px] text-stone-500">
                      Cancels ${Math.min(Math.abs(member?.storeBalance ?? 0), parseFloat(devTopUpAmount)).toFixed(2)} debt first. Result: ${( (member?.storeBalance ?? 0) + parseFloat(devTopUpAmount) ).toFixed(2)} available.
                    </p>
                  )}
                </div>

                {/* Custom Balance Setter */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                    Set Specific Absolute Balance ($)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={customBalanceInput}
                      onChange={(e) => setCustomBalanceInput(e.target.value)}
                      placeholder="e.g. -24.50 or 50.00"
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={isUpdatingTestBalance || !customBalanceInput}
                      onClick={() => {
                        const parsed = parseFloat(customBalanceInput);
                        if (!isNaN(parsed)) {
                          handleSetTestBalance(parsed);
                          setCustomBalanceInput('');
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Standard Inventory Catalog Preview */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-fredoka text-base font-bold text-stone-900">
                    Standard Store Inventory
                  </h3>
                  <span className="text-[11px] font-mono text-stone-400">8 Items</span>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-800">Snack Shack Drinks</span>
                      <span className="text-[10px] text-stone-400 block">Soda, sparkling water</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">$1.50</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-800">Snack Shack Snacks</span>
                      <span className="text-[10px] text-stone-400 block">Chips, candy bars</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">$1.00</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-800">Arduino Nano (USB-C)</span>
                      <span className="text-[10px] text-stone-400 block">Microcontroller module</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">$7.00</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-800">Raspberry Pi Pico</span>
                      <span className="text-[10px] text-stone-400 block">RP2040 dev board</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">$6.00</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-800">3D Printer PLA Filament (1kg)</span>
                      <span className="text-[10px] text-stone-400 block">Spool (assorted colors)</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">$20.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GAMIFICATION & XP POINT SYSTEM                                       */}
      {/* ========================================================================= */}
      {activeTab === 'gamification' && (
        <div className="space-y-6">
          {/* Notification Alert Banner */}
          {xpNotice && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                xpNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <span>{xpNotice.message}</span>
              <button
                type="button"
                onClick={() => setXpNotice(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. Neon One Custom Account Field Setup & Status */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                    <Database className="w-4 h-4" />
                  </span>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Neon One CRM "XP" Custom Field Integration
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Experience points are synced with a Custom Account Field in Neon One CRM with local cache fallback.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {neonXpFieldId ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Field ID: {neonXpFieldId}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-mono text-xs font-bold border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Local Fallback Mode
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Neon Custom Field ID for XP (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={neonXpFieldId}
                    onChange={(e) => setNeonXpFieldId(e.target.value)}
                    placeholder="e.g. 122 (Leave blank for auto-discovery by field name 'XP')"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-mono text-xs text-stone-900"
                  />
                </div>
                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={handleSaveNeonXpFieldId}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Field ID</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed pt-1 border-t border-stone-200/60">
                <strong>How to configure in Neon One CRM:</strong> Go to <em>Settings &gt; Custom Fields &gt; Accounts</em> &gt; <em>New Custom Field</em> with <strong>Field Name:</strong> <code>XP</code>, <strong>Data Type:</strong> <code>Whole Number</code> (or <code>OneLineText</code>). Once created, the app will auto-discover it on any member sign-in.
              </div>
            </div>
          </div>

          {/* 2. Interactive Level Tiers & Rewards Table */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                    <Award className="w-4 h-4" />
                  </span>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Level Tiers, Points Thresholds & Buddy Bucks Rewards
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Configure the RPG progression hierarchy, point requirements, badge emojis, and custom rewards unlocked at each rank.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetXpTiers}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveXpTiers}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Level Tiers</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center">Level</th>
                    <th className="py-3 px-3 w-48">Rank Title</th>
                    <th className="py-3 px-3 w-28">Min XP</th>
                    <th className="py-3 px-3 w-20 text-center">Badge</th>
                    <th className="py-3 px-3">Buddy Bucks Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {xpTiers.map((tier) => (
                    <tr key={tier.level} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-900">
                        {tier.level}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tier.title}
                          onChange={(e) => handleUpdateTierField(tier.level, 'title', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-xs text-stone-900 focus:border-amber-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={tier.minXp}
                          onChange={(e) =>
                            handleUpdateTierField(tier.level, 'minXp', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full p-1.5 rounded-lg border border-stone-200 bg-white font-mono font-bold text-xs text-stone-900 focus:border-amber-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={tier.badgeEmoji}
                          onChange={(e) => handleUpdateTierField(tier.level, 'badgeEmoji', e.target.value)}
                          className="w-12 p-1.5 rounded-lg border border-stone-200 bg-white text-center text-sm focus:border-amber-400 focus:outline-none mx-auto"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tier.reward}
                          onChange={(e) => handleUpdateTierField(tier.level, 'reward', e.target.value)}
                          placeholder="e.g. 50 Buddy Bucks"
                          className="w-full p-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:border-amber-400 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Activity Points Mapping Matrix */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Activity Points Mapping Matrix
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Adjust points awarded for physical and digital actions, configure frequency cooldowns, or toggle individual activities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetXpRules}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveXpRules}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Activity Points</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Status</th>
                    <th className="py-3 px-3 w-56">Activity Name</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 w-28">Category</th>
                    <th className="py-3 px-3 w-28">Cooldown</th>
                    <th className="py-3 px-3 w-24">XP Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {xpRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className={`hover:bg-stone-50/60 transition-colors ${
                        !rule.enabled ? 'opacity-50 bg-stone-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggleRuleEnabled(rule.id)}
                          className="w-4 h-4 rounded text-[#344ea2] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{rule.icon}</span>
                          <div>
                            <span className="font-bold text-stone-900 block">{rule.name}</span>
                            <span className="font-mono text-[10px] text-stone-400">{rule.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-600 text-[11px]">
                        {rule.description}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase">
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={rule.cooldown || 'unlimited'}
                          onChange={(e) =>
                            handleUpdateRuleCooldown(
                              rule.id,
                              e.target.value as 'once' | 'daily' | 'unlimited'
                            )
                          }
                          className="p-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none"
                        >
                          <option value="once">Once (Lifetime)</option>
                          <option value="daily">Daily</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={rule.xpReward}
                            onChange={(e) =>
                              handleUpdateRulePoint(rule.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 p-1.5 rounded-lg border border-stone-200 bg-white font-mono font-bold text-xs text-stone-900 focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-stone-500 font-semibold text-[11px]">XP</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. XP Testing & Diagnostic Console */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-100 text-purple-800">
                <Star className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-fredoka text-lg font-bold text-stone-900">
                  XP Testing & Diagnostic Console
                </h3>
                <p className="text-xs text-stone-500">
                  Simulate activity awards, test level-up threshold animations, or directly manipulate points for the active account.
                </p>
              </div>
            </div>

            {/* Current Target Account Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                  Target Account
                </div>
                <div className="font-bold text-base flex items-center gap-2">
                  <span>{getGreetingName(member)}</span>
                  <span className="text-xs font-mono text-stone-300">
                    (ID: {member?.accountId || 'None'}, Card: {activeCardId || 'None'})
                  </span>
                </div>
                <div className="text-xs text-stone-300 mt-1 flex items-center gap-2">
                  <span>
                    Current Level: <strong className="text-amber-300">{member?.levelTitle ? member.levelTitle : `Level ${member?.level || 1}`}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Points: <strong className="text-white">{member?.xp || 0} XP</strong>
                  </span>
                </div>
              </div>

              {/* Reset to 0 button */}
              <button
                type="button"
                onClick={() => handleDirectSetMemberXp(0)}
                disabled={isSimulatingXp || !member?.accountId}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to 0 XP</span>
              </button>
            </div>

            {/* Quick Action Simulation Buttons */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                Simulate Activity Rewards (Bypasses Cooldown)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateAward('kiosk_checkin', 0, 'Kiosk Check-In Simulation')}
                  disabled={isSimulatingXp || !member?.accountId}
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="text-base mb-1">📍</div>
                  <div className="text-xs font-bold text-stone-800">+20 XP</div>
                  <div className="text-[10px] text-stone-500">Kiosk Check-In</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAward('club_checkin', 0, 'Club Meeting Check-In Simulation')}
                  disabled={isSimulatingXp || !member?.accountId}
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="text-base mb-1">👥</div>
                  <div className="text-xs font-bold text-stone-800">+25 XP</div>
                  <div className="text-[10px] text-stone-500">Club Check-In</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAward('photobooth_snap', 0, 'Photobooth Snapshot Simulation')}
                  disabled={isSimulatingXp || !member?.accountId}
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="text-base mb-1">📸</div>
                  <div className="text-xs font-bold text-stone-800">+15 XP</div>
                  <div className="text-[10px] text-stone-500">Portal Snapshot</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAward('store_purchase', 15, 'Store Checkout ($15.00) Simulation')}
                  disabled={isSimulatingXp || !member?.accountId}
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="text-base mb-1">🛒</div>
                  <div className="text-xs font-bold text-stone-800">+25 XP</div>
                  <div className="text-[10px] text-stone-500">Store Checkout ($15)</div>
                </button>
              </div>
            </div>

            {/* Direct XP Value Setter */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Direct XP Override & Level Threshold Tester
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={testManualXp}
                  onChange={(e) => setTestManualXp(e.target.value)}
                  placeholder="Enter exact total XP (e.g. 50, 125, 250, 2500)..."
                  className="flex-1 p-2.5 rounded-xl border border-stone-200 bg-white font-mono text-xs text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    const num = parseInt(testManualXp, 10);
                    if (!isNaN(num)) handleDirectSetMemberXp(num);
                  }}
                  disabled={isSimulatingXp || !member?.accountId || !testManualXp}
                  className="px-5 py-2.5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Apply XP & Check Level Up
                </button>
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5">
                Tip: Entering a value higher than the next level threshold will trigger the live Level-Up celebration modal!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ICONS & BRAND ASSET MANAGER                                       */}
      {/* ========================================================================= */}
      {activeTab === 'icons' && (
        <div className="space-y-6">
          {/* Section 1: Brand Logo & Top-Left Header Emblem */}
          <div className="bg-white rounded-3xl shadow-xs border border-stone-200 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-fredoka text-xl font-bold text-stone-900">
                      Brand Logo & Header Customization
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      {brandLogo ? 'Custom Logo Active' : 'Default Badge'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Upload your actual logo to replace the default &quot;SM&quot; badge in the top-left navigation corner.
                  </p>
                </div>
              </div>

              {brandLogo && (
                <button
                  type="button"
                  onClick={handleResetBrandLogo}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default SM</span>
                </button>
              )}
            </div>

            {logoFeedback && (
              <div className="m-5 mb-0 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{logoFeedback}</span>
              </div>
            )}

            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Upload / URL / SVG Input Form (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Method selector pills */}
                <div className="flex items-center gap-2 p-1 rounded-2xl bg-stone-100 w-fit">
                  <button
                    type="button"
                    onClick={() => setLogoInputType('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      logoInputType === 'upload'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputType('url')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      logoInputType === 'url'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Image Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputType('svg')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      logoInputType === 'svg'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Raw SVG Vector
                  </button>
                </div>

                {/* Upload File Input */}
                {logoInputType === 'upload' && (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#3bc0cd] transition-colors text-center space-y-3 bg-stone-50/50">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#3bc0cd]/10 text-[#344ea2] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <label className="inline-block px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors">
                        <span>Choose Logo Image / SVG</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-stone-400 mt-2">
                        Supports PNG with transparency, SVG vectors, JPG, or WebP.
                      </p>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                {logoInputType === 'url' && (
                  <form onSubmit={handleApplyLogoUrl} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Hosted Logo Image Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:border-[#3bc0cd]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* SVG Code Input */}
                {logoInputType === 'svg' && (
                  <form onSubmit={handleApplyLogoSvg} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Paste SVG Vector XML
                      </label>
                      <textarea
                        rows={4}
                        value={logoSvgInput}
                        onChange={(e) => setLogoSvgInput(e.target.value)}
                        placeholder='<svg viewBox="0 0 100 100" ...>...</svg>'
                        className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-[11px] focus:bg-white focus:border-[#3bc0cd]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
                    >
                      Preview SVG
                    </button>
                  </form>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveBrandLogo}
                    disabled={logoDraft === brandLogo}
                    className="px-5 py-2.5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Logo to Top-Left Header</span>
                  </button>
                  {logoDraft && (
                    <button
                      type="button"
                      onClick={() => setLogoDraft(null)}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Live Header Mockup Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Top-Left Header Preview
                </span>
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
                  <div className="text-[10px] text-stone-400 font-mono">Live Navigation Mockup:</div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center min-h-[52px]">
                    {logoDraft ? (
                      <div className="h-10 sm:h-11 flex items-center shrink-0">
                        {logoDraft.startsWith('<svg') ? (
                          <div
                            className="h-full w-auto max-w-[200px] sm:max-w-[260px] flex items-center [&>svg]:h-full [&>svg]:w-auto"
                            dangerouslySetInnerHTML={{ __html: logoDraft }}
                          />
                        ) : (
                          <img
                            src={logoDraft}
                            alt="Social Medium Logo Preview"
                            className="h-10 sm:h-11 w-auto max-w-[200px] sm:max-w-[260px] object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                          SM
                        </div>
                        <div>
                          <span className="font-fredoka text-xl font-bold tracking-tight text-[#344ea2] block leading-none">
                            SOCIAL MEDIUM
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-stone-500 leading-relaxed pt-1">
                    {logoDraft ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Logo loaded! Click &quot;Apply Logo to Top-Left Header&quot; to save.
                      </span>
                    ) : (
                      <span>Showing default gradient badge with &quot;SM&quot;.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tool Certification & Icon Registry */}
          <div className="bg-white rounded-3xl shadow-xs border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f16622]/10 text-[#f16622] flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-fredoka text-xl font-bold text-stone-900">
                      Tool Certification & Icon Registry
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-mono font-bold text-xs border border-amber-500/30">
                      SSOT Canonical
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Single Source of Truth shared across Check-In Kiosk thermal printers, Portal Door, and Companion App.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                {copiedJSON ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Export Registry JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Body Grid: Tool List (Left) + Editor & Live Resolver (Right) */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Tool List & Resolver */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Registered Tools ({Object.keys(tools).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setSelectedToolId(null);
                      setNewId('');
                      setEditName('');
                      setEditCategory('Digital Fabrication');
                      setEditColor('#3bc0cd');
                      setEditKeywords('');
                    }}
                    className="text-xs font-semibold text-[#344ea2] hover:text-[#f16622] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tool</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {Object.values(tools).map((tool) => {
                    const isSelected = selectedToolId === tool.id && !isAddingNew;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setIsAddingNew(false);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : `${tool.color}15`,
                              color: isSelected ? '#ffffff' : tool.color,
                            }}
                            dangerouslySetInnerHTML={{ __html: tool.iconSvg }}
                          />
                          <div>
                            <div className="font-bold text-sm leading-tight">{tool.name}</div>
                            <div className={`text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                              {tool.category}
                            </div>
                          </div>
                        </div>
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: tool.color }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Test Text Resolution Card */}
                <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                    Live Text Resolution Tester
                  </span>
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Type certification string..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium"
                  />
                  {resolvedTest && (
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 flex items-center justify-center shrink-0"
                          style={{ color: resolvedTest.color }}
                          dangerouslySetInnerHTML={{ __html: resolvedTest.iconSvg }}
                        />
                        <div>
                          <div className="text-xs font-bold text-stone-800">
                            {resolvedTest.name}
                            {resolvedTest.isAdvanced && (
                              <span
                                className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-black text-white"
                                style={{ backgroundColor: resolvedTest.color }}
                              >
                                +
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500">{resolvedTest.level}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Slug: {resolvedTest.toolId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editor Form */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-fredoka text-base font-bold text-stone-900">
                      {isAddingNew ? 'Add New Tool Mapping' : `Edit: ${editName || 'Tool'}`}
                    </h3>
                    {!isAddingNew && selectedToolId && (
                      <span className="font-mono text-xs text-stone-500">ID: {selectedToolId}</span>
                    )}
                  </div>

                  <form onSubmit={handleSaveTool} className="space-y-3.5 text-xs">
                    {isAddingNew && (
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Tool ID (slug)</label>
                        <input
                          type="text"
                          required
                          value={newId}
                          onChange={(e) => setNewId(e.target.value)}
                          placeholder="e.g. pottery-wheel"
                          className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-stone-700 font-semibold block mb-1">Tool Display Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. 3D Printing"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Category</label>
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          placeholder="Digital Fabrication"
                          className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Brand Color (Hex)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editColor.startsWith('#') ? editColor : '#3bc0cd'}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            placeholder="#3bc0cd"
                            className="flex-1 p-2 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-stone-700 font-semibold block mb-1">
                        Matching Keywords (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editKeywords}
                        onChange={(e) => setEditKeywords(e.target.value)}
                        placeholder="3d printing, fdm, resin, 3d printer"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        Any Neon One certification string matching these keywords will render this icon.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAddingNew ? 'Create Tool Mapping' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM & CACHE TOOLS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Release Notes & Versioning
            </h3>
            <p className="text-stone-500 text-xs">
              View the complete historical change manifest, breaking updates, and SSOT commits.
            </p>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">Active App Version:</span>
                <span className="font-mono font-bold text-amber-700">v{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">Branch:</span>
                <span className="font-mono text-stone-800">main / gh-pages</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openChangelog}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Open Release Changelog</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Browser Cache & Session Reset
            </h3>
            <p className="text-stone-500 text-xs">
              Clear local cached profiles, presets, or announcement state to re-fetch clean data from CRM.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const keys = Object.keys(localStorage);
                    keys.forEach((k) => {
                      if (k.startsWith('sm_profile_') || k.startsWith('sm_community_')) {
                        localStorage.removeItem(k);
                      }
                    });
                    alert('Cached profile and announcement data cleared.');
                  } catch (_) {}
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-stone-400" />
                <span>Clear Member Profile Cache</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopImpersonating();
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span>Hard Reload App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
