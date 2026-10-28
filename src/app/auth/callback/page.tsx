'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authenticateWithNeonOAuth, getNeonOAuthRedirectUri } from '@/lib/neon';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { loginWithProfile } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error') || urlParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(error);
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('No authorization code was received from Neon One.');
          return;
        }

        const redirectUri = getNeonOAuthRedirectUri();
        const res = await authenticateWithNeonOAuth(code, redirectUri);

        if (res.success && res.member) {
          setMemberName(res.member.preferredName || res.member.firstName || res.member.name);
          loginWithProfile(res.member);
          setStatus('success');

          // Smooth redirect to Profile after 1.5 seconds
          setTimeout(() => {
            router.push('/profile');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage(res.error || 'Failed to authenticate member with Neon One.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
      }
    };

    handleCallback();
  }, [loginWithProfile, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-md text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#f16622] flex items-center justify-center text-white font-fredoka font-bold text-lg shadow-sm">
            SM
          </div>
          <span className="font-fredoka text-xl font-bold tracking-tight text-[#344ea2]">
            SOCIAL MEDIUM
          </span>
        </div>

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="space-y-4 py-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-[#3bc0cd]/20 border-t-[#3bc0cd] animate-spin" />
              <ShieldCheck className="w-6 h-6 text-[#344ea2] absolute inset-0 m-auto" />
            </div>
            <div>
              <h2 className="font-fredoka text-xl font-bold text-stone-900">
                Verifying Neon One Account...
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                Authenticating your credentials with Neon CRM secure Single Sign-On.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="space-y-4 py-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-fredoka text-2xl font-bold text-stone-900">
                Welcome back{memberName ? `, ${memberName}` : ''}!
              </h2>
              <p className="text-emerald-700 text-xs font-semibold mt-1">
                Authenticated securely via Neon One CRM.
              </p>
            </div>
            <div className="pt-2 text-stone-400 text-xs flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3bc0cd]" />
              <span>Redirecting to your member pass...</span>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="space-y-5 py-4 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shadow-xs">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-fredoka text-xl font-bold text-stone-900">
                Authentication Could Not Be Completed
              </h2>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs text-left">
                {errorMessage || 'Unknown error during Neon One authorization.'}
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/profile"
                className="w-full py-3 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Return to Login Screen</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
