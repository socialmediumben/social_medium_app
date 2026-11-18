'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GiveGetRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/impact?tab=give-get');
  }, [router]);

  return (
    <div className="py-20 text-center text-stone-500 font-mono text-sm">
      Forwarding to Give/Get under Impact...
    </div>
  );
}
