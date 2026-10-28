'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Wrench,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  NeonEvent,
  fetchUpcomingEvents,
  fetchAccountRegistrations,
  rsvpForEvent,
  isWorkshopEvent,
  formatEventDate,
  formatEventTime,
  getEventRegistrationUrl,
  EVENTS_LIST_FALLBACK_URL,
} from '@/lib/events';

type FilterTab = 'all' | 'free' | 'workshops' | 'registered';

export default function EventsPage() {
  const { member, activeCardId } = useAuth();

  const [events, setEvents] = useState<NeonEvent[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Determine membership status
  const isMember = useMemo(() => {
    if (!member) return false;
    const status = (member.membershipStatus || member.membershipTier || '').toLowerCase();
    return status.includes('active');
  }, [member]);

  // Load events and member registrations
  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [allEvents, userRegs] = await Promise.all([
        fetchUpcomingEvents(),
        member?.accountId ? fetchAccountRegistrations(member.accountId) : Promise.resolve([]),
      ]);

      setEvents(allEvents);
      setRegisteredIds(userRegs);
    } catch (err) {
      console.error('Failed to load events data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [member?.accountId]);

  // Handle Free Member RSVP
  const handleRsvp = async (event: NeonEvent) => {
    if (!member?.accountId) {
      window.open(getEventRegistrationUrl(event), '_blank', 'noopener,noreferrer');
      return;
    }

    setRsvpLoadingId(event.id);
    setStatusMessage(null);

    const result = await rsvpForEvent(event, member.accountId);
    setRsvpLoadingId(null);

    if (result.success) {
      setRegisteredIds((prev) => [...prev, String(event.id)]);
      setStatusMessage({
        type: 'success',
        text: `You have successfully RSVP'd for "${event.name}"!`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      if (result.fallbackUrl) {
        window.open(result.fallbackUrl, '_blank', 'noopener,noreferrer');
      }
      setStatusMessage({
        type: 'info',
        text: result.error || 'Opening event registration page on Neon One...',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const isRegistered = registeredIds.includes(String(e.id));
      const isWorkshop = isWorkshopEvent(e);

      if (activeTab === 'registered') {
        return isRegistered;
      }
      if (activeTab === 'free') {
        return !isWorkshop;
      }
      if (activeTab === 'workshops') {
        return isWorkshop;
      }
      return true;
    });
  }, [events, registeredIds, searchQuery, activeTab]);

  const registeredCount = useMemo(() => {
    return events.filter((e) => registeredIds.includes(String(e.id))).length;
  }, [events, registeredIds]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-[#3bc0cd]">
              <Calendar className="w-3.5 h-3.5 text-[#f16622]" />
              Makerspace Events & Workshops
            </div>
            <h1 className="font-fredoka text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Upcoming Events
            </h1>
            <p className="text-stone-200 text-xs sm:text-sm max-w-xl leading-relaxed">
              RSVP for community nights, project showcases, and skill shares. Active Members receive
              free admission to general events!
            </p>
          </div>

          {/* Member Status Badge */}
          <div className="p-4 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#3bc0cd]" />
                {member ? member.name : 'Guest User'}
              </span>
              {isMember ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Member
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Guest
                </span>
              )}
            </div>
            <div className="text-xs text-stone-300 font-medium">
              {isMember ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free RSVP Enabled
                </span>
              ) : (
                <span className="text-stone-300">
                  Workshops & guest tickets register on Neon One.
                </span>
              )}
            </div>
            {registeredCount > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-[#3bc0cd] font-semibold">
                You are RSVP&apos;d for {registeredCount} upcoming {registeredCount === 1 ? 'event' : 'events'}.
              </div>
            )}
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#3bc0cd]/20 blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#f16622]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Guest Login Callout (if not connected) */}
      {!activeCardId && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Are you a Social Medium member?</strong> Connect your physical Tap Card on the{' '}
              <Link href="/profile" className="underline font-bold hover:text-amber-950">
                Profile page
              </Link>{' '}
              to unlock one-click free RSVPs!
            </span>
          </div>
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 text-center"
          >
            Connect Tap Card
          </Link>
        </div>
      )}

      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Controls: Search & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search upcoming events..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#3bc0cd] text-xs outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#344ea2] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'free'
                ? 'bg-[#3bc0cd] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Free with Membership
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workshops')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'workshops'
                ? 'bg-[#f16622] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Workshops
          </button>
          {registeredCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('registered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'registered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>My RSVPs</span>
              <span className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[10px] font-bold">
                {registeredCount}
              </span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            title="Refresh events list"
            disabled={isRefreshing}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Events List Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3bc0cd]" />
          <div>Loading events from Neon One CRM...</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-stone-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-1" />
          <h3 className="font-fredoka text-base font-bold text-stone-800">
            No events found matching your filter
          </h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed">
            {activeTab === 'registered'
              ? 'You have not RSVP’d for any upcoming events yet.'
              : 'Try clearing your search query or selecting a different category tab.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => {
            const isWorkshop = isWorkshopEvent(event);
            const isAlreadyReg = registeredIds.includes(String(event.id));
            const regUrl = getEventRegistrationUrl(event);
            const isRsvping = rsvpLoadingId === event.id;

            return (
              <div
                key={event.id}
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isAlreadyReg
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isWorkshop
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-stone-200 hover:border-[#3bc0cd]'
                }`}
              >
                <div>
                  {/* Card Header: Category Chip & Date Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isWorkshop ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <Wrench className="w-3 h-3 text-amber-700" />
                          Workshop
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3bc0cd]/15 text-[#24818a] border border-[#3bc0cd]/30">
                          <Sparkles className="w-3 h-3 text-[#3bc0cd]" />
                          Free with Membership
                        </span>
                      )}
                      {isAlreadyReg && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          RSVP Confirmed
                        </span>
                      )}
                    </div>

                    {/* Date Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {formatEventDate(event.startDate)}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-fredoka text-lg font-bold text-stone-900 mb-1.5 leading-snug">
                    {event.name}
                  </h3>

                  {/* Meta: Time & Location */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mb-3">
                    {event.startTime && (
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {formatEventTime(event.startTime)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {event.addressLine1 || 'Social Medium West Hills'}
                    </span>
                  </div>

                  {/* Description preview */}
                  {event.description && (
                    <div
                      className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4 prose prose-xs"
                      dangerouslySetInnerHTML={{
                        __html: event.description.replace(/<[^>]+>/g, ' ').slice(0, 160) + '...',
                      }}
                    />
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 mt-2">
                  <a
                    href={event.detailsUrl || regUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Action Button: RSVP Free vs. Neon One Storefront */}
                  <div>
                    {isAlreadyReg ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-semibold text-xs inline-flex items-center gap-1.5 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        RSVP&apos;d
                      </span>
                    ) : isMember && !isWorkshop ? (
                      <button
                        type="button"
                        onClick={() => handleRsvp(event)}
                        disabled={isRsvping}
                        className="px-4 py-2 rounded-xl bg-[#3bc0cd] hover:bg-[#32a8b5] text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isRsvping ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>RSVP (Free)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <a
                        href={regUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isWorkshop ? 'Register Workshop' : 'Register on Neon One'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External Calendar Direct Link Footer */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 text-center space-y-1 text-xs text-stone-500">
        <div>
          Looking for past events or private calendar bookings?
        </div>
        <div>
          <a
            href={EVENTS_LIST_FALLBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#344ea2] hover:text-[#f16622] font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>View Complete Neon One Event Calendar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
