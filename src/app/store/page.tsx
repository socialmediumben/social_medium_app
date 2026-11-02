'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  HeartHandshake,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Receipt,
  HelpCircle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { getGreetingName, StoreItem, StoreCartItem } from '@/lib/types';
import {
  fetchStoreItems,
  fetchStoreItemsFromSheet,
  updateMemberStoreBalance,
  getNeonDonationUrl,
  MAX_STORE_TAB_LIMIT,
} from '@/lib/neon';

export default function StoreAndDonatePage() {
  const { member, activeCardId, updateMember } = useAuth();
  const { isDevMode } = useDevMode();

  const [activeSection, setActiveSection] = useState<'store' | 'donate'>('store');
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSheetSynced, setIsSheetSynced] = useState(false);
  const [isRefreshingSheet, setIsRefreshingSheet] = useState(false);

  // Custom Item Form
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Load Store Items on mount (cached first, then live from Google Sheet)
  useEffect(() => {
    setStoreItems(fetchStoreItems());
    if (typeof window !== 'undefined' && localStorage.getItem('sm_store_sheet_items')) {
      setIsSheetSynced(true);
    }

    // Background sync from SM App Database Google Sheet
    fetchStoreItemsFromSheet().then((sheetItems) => {
      if (sheetItems && sheetItems.length > 0) {
        setStoreItems(sheetItems);
        setIsSheetSynced(true);
      }
    });
  }, []);

  const handleManualSheetSync = async () => {
    setIsRefreshingSheet(true);
    try {
      const items = await fetchStoreItemsFromSheet();
      if (items && items.length > 0) {
        setStoreItems(items);
        setIsSheetSynced(true);
        setCheckoutNotice({
          type: 'success',
          text: `Successfully synced ${items.length} items from Google Sheet "Store_Items"!`,
        });
      } else {
        setCheckoutNotice({
          type: 'error',
          text: 'Google Sheet "Store_Items" tab not found or has no active rows. Using standard catalog.',
        });
      }
    } catch (_) {
      setCheckoutNotice({
        type: 'error',
        text: 'Error connecting to Google Sheet. Check network connection.',
      });
    } finally {
      setIsRefreshingSheet(false);
      setTimeout(() => setCheckoutNotice(null), 4000);
    }
  };

  const balance = member?.storeBalance ?? 0;
  const isTab = balance < 0;
  const tabDebt = Math.abs(balance);
  const remainingTabAllowance = Math.max(0, MAX_STORE_TAB_LIMIT - (isTab ? tabDebt : 0));

  // Cart Computations
  const cartTotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const projectedBalance = balance - cartTotal;
  const wouldExceedTab = projectedBalance < -MAX_STORE_TAB_LIMIT;

  // Cart Modifiers
  const addToCart = (item: StoreItem) => {
    setCheckoutNotice(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as StoreCartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customItemPrice);
    if (!customItemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const custom: StoreItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      category: 'other',
      price: Math.round(priceNum * 100) / 100,
      description: 'Custom self-checkout item',
      icon: '🏷️',
    };

    addToCart(custom);
    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomModal(false);
  };

  // Perform Self-Checkout
  const handleConfirmCheckout = async () => {
    if (!member?.accountId) {
      setCheckoutNotice({
        type: 'error',
        text: 'Please sign in with your Social Medium tap card or Neon One account to complete checkout.',
      });
      return;
    }

    if (cart.length === 0) return;

    if (wouldExceedTab) {
      setCheckoutNotice({
        type: 'error',
        text: `Tab limit exceeded! Your current tab is $${tabDebt.toFixed(2)}, and adding $${cartTotal.toFixed(2)} would surpass the $${MAX_STORE_TAB_LIMIT.toFixed(2)} limit. Please settle your tab via Neon One to proceed.`,
      });
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutNotice(null);

    const itemsSummary = cart.map((i) => ({
      name: i.item.name,
      price: i.item.price,
      quantity: i.quantity,
    }));

    const res = await updateMemberStoreBalance(member.accountId, projectedBalance, itemsSummary);

    if (res.success) {
      updateMember({ storeBalance: res.newBalance });
      setCart([]);
      setCheckoutNotice({
        type: 'success',
        text: `Checkout successful! $${cartTotal.toFixed(2)} charged. New balance: $${res.newBalance.toFixed(2)}.`,
      });
    } else {
      setCheckoutNotice({
        type: 'error',
        text: res.error || 'Failed to complete checkout.',
      });
    }
    setIsProcessingCheckout(false);
  };

  const filteredItems = storeItems.filter(
    (i) => selectedCategory === 'all' || i.category === selectedCategory
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                COMMUNITY STORE & GIVING
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono text-xs">
                Zero Credit Card Storage
              </span>
            </div>
            <h1 className="font-fredoka text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Snack Shack, Supplies & Donations
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Self-checkout for snacks, drinks, art supplies, and electronics. Pay via your preloaded balance or active makerspace tab—all credit card processing happens securely through Neon One.
            </p>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-2 bg-stone-800/80 p-1.5 rounded-2xl border border-stone-700">
            <button
              type="button"
              onClick={() => setActiveSection('store')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'store'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Store Checkout</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('donate')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'donate'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>General Donations</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient glows */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-60 h-60 rounded-full bg-[#3bc0cd]/15 blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: STORE SELF-CHECKOUT                                            */}
      {/* ========================================================================= */}
      {activeSection === 'store' && (
        <div className="space-y-6">
          {/* Member Wallet Card */}
          {member ? (
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                    balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-base">
                        {getGreetingName(member)}'s Makerspace Wallet
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        balance > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : balance === 0
                          ? 'bg-stone-100 text-stone-600 border border-stone-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {balance > 0 ? 'Prepaid Credit' : balance === 0 ? 'Zero Balance' : 'Active Tab'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Tap Card: <code className="font-mono text-stone-700 font-bold">{activeCardId || 'Bound'}</code> • Max tab limit: ${MAX_STORE_TAB_LIMIT.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Balance & Action Buttons */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      {isTab ? 'Current Tab Owed' : 'Available Balance'}
                    </div>
                    <div className={`font-mono text-2xl font-bold ${
                      balance > 0 ? 'text-emerald-600' : balance === 0 ? 'text-stone-800' : 'text-amber-700'
                    }`}>
                      {balance < 0 ? `-$${tabDebt.toFixed(2)}` : `$${balance.toFixed(2)}`}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {isTab && (
                      <a
                        href={getNeonDonationUrl('tab_settle', tabDebt, member.accountId)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Settle your active tab securely through Neon One"
                      >
                        <span>Settle Tab (${tabDebt.toFixed(2)})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href={getNeonDonationUrl('top_up', 25, member.accountId)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Add $25.00 funds / buy gift card credit via Neon One"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Top Up Wallet ($25.00)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Tab Allowance Progress Bar if in debt */}
              {isTab && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-stone-600 font-medium">Tab Limit Utilization</span>
                    <span className="font-mono font-bold text-amber-800">
                      ${tabDebt.toFixed(2)} / ${MAX_STORE_TAB_LIMIT.toFixed(2)} (${remainingTabAllowance.toFixed(2)} remaining)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tabDebt > 20 ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (tabDebt / MAX_STORE_TAB_LIMIT) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-sm">
                    Sign in to use Self-Checkout & Tab
                  </h3>
                  <p className="text-xs text-amber-800">
                    Connect your Social Medium tap card or sign in with Neon One to charge purchases to your balance or tab.
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {checkoutNotice && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs ${
                checkoutNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {checkoutNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{checkoutNotice.text}</span>
            </div>
          )}

          {/* Main Store View: Category Tabs + Item Grid (Left 8 Cols) + Cart Drawer (Right 4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Catalog (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'drink', label: '🥤 Cold Drinks' },
                  { id: 'snack', label: '🥨 Snacks' },
                  { id: 'electronics', label: '🤖 Electronics' },
                  { id: 'materials', label: '🧵 Materials' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#344ea2] text-white shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomModal(true)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
              </div>

              {/* Inventory Sync Bar */}
              <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
                <span className="font-medium text-stone-600">
                  Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </span>
                {isSheetSynced ? (
                  <button
                    type="button"
                    onClick={handleManualSheetSync}
                    disabled={isRefreshingSheet}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                    title="Click to re-fetch live store items from Google Sheet"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>SM App Database Live</span>
                    <RefreshCw className={`w-3 h-3 ${isRefreshingSheet ? 'animate-spin' : ''}`} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSheetSync}
                    disabled={isRefreshingSheet}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                    title="Check Google Sheet for Store_Items tab"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingSheet ? 'animate-spin' : ''}`} />
                    <span>Sync Google Sheet</span>
                  </button>
                )}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredItems.map((item) => {
                  const inCart = cart.find((i) => i.item.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#3bc0cd] hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="text-2xl mb-1">{item.icon || '📦'}</div>
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="font-mono font-bold text-sm sm:text-base text-stone-900">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200 hover:border-emerald-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add{inCart ? ` (${inCart.quantity})` : ''}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart & Checkout Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 sticky top-20">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-fredoka text-base font-bold text-stone-900">
                      Self-Checkout Cart
                    </h3>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] font-semibold text-stone-400 hover:text-red-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 space-y-2">
                    <ShoppingBag className="w-8 h-8 mx-auto opacity-40 mb-1" />
                    <p className="text-xs">Your self-checkout cart is empty.</p>
                    <p className="text-[11px] text-stone-400">
                      Select drinks, snacks, or maker supplies on the left to add them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cart.map((cartItem) => (
                        <div
                          key={cartItem.item.id}
                          className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-800 truncate">
                              {cartItem.item.name}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              ${cartItem.item.price.toFixed(2)} each
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartItem.item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-xs w-4 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartItem.item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(cartItem.item.id)}
                              className="p-1 text-stone-400 hover:text-red-500 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals Summary */}
                    <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Items ({totalItemCount}):</span>
                        <span className="font-mono font-bold text-stone-900">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Current Wallet Balance:</span>
                        <span className={`font-mono font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {balance < 0 ? `-$${tabDebt.toFixed(2)}` : `$${balance.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-sm pt-2 border-t border-dashed border-stone-200">
                        <span>Projected Balance:</span>
                        <span className={`font-mono ${projectedBalance >= 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {projectedBalance < 0 ? `-$${Math.abs(projectedBalance).toFixed(2)}` : `$${projectedBalance.toFixed(2)}`}
                        </span>
                      </div>

                      {wouldExceedTab && (
                        <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold leading-snug">
                          ⚠️ Exceeds $25.00 tab limit! Settle tab via Neon One to proceed.
                        </div>
                      )}
                    </div>

                    {/* Checkout Button */}
                    <button
                      type="button"
                      onClick={handleConfirmCheckout}
                      disabled={isProcessingCheckout || wouldExceedTab || !member}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingCheckout ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm &amp; Deduct ${cartTotal.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-stone-400 text-center">
                      Funds deducted from your wallet/tab. No card required.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: GENERAL DONATIONS (COMMUNITY GIVING)                            */}
      {/* ========================================================================= */}
      {activeSection === 'donate' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="font-fredoka text-2xl font-bold text-stone-900">
                Support Social Medium Makerspace
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-roboto">
                Social Medium is a community non-profit makerspace. General donations fund tool maintenance, safety equipment, open workshops, and youth STEM access.
              </p>
            </div>

            {/* Quick Donation Tier Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[15, 25, 50, 100].map((amt) => (
                <a
                  key={amt}
                  href={getNeonDonationUrl('general', amt, member?.accountId)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl border border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-center group cursor-pointer shadow-xs"
                >
                  <div className="font-mono text-xl font-bold text-stone-900 group-hover:text-amber-800">
                    ${amt}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Community Gift</div>
                </a>
              ))}
            </div>

            {/* Neon One Official Checkout Notice */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-left max-w-lg mx-auto space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Secure Neon One Payment Processing</span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                All donations are processed directly through Neon One’s encrypted PCI-compliant platform. Supports Apple Pay, Google Pay, debit, and credit cards.
              </p>
            </div>

            <div>
              <a
                href={getNeonDonationUrl('general', undefined, member?.accountId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Make a Custom Donation via Neon One</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Add Custom Self-Checkout Item
            </h3>
            <p className="text-xs text-stone-500">
              Purchasing an untracked snack, component, or material from the space? Enter details below.
            </p>
            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. Copper Wire spool, Cold Brew, etc."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.25"
                  required
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  placeholder="2.50"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
