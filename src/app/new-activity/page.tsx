'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewActivityRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff?tab=activity');
  }, [router]);

  return (
    <div className="py-20 text-center text-stone-500 font-mono text-sm">
      Forwarding to Staff Operations...
    </div>
  );
}
