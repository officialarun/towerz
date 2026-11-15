'use client';
import { useLayoutEffect } from 'react';
import { Check } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { LeasingDialogs } from '@/components/leasing/LeasingDialogs';
export function Provider({ children }: { children: React.ReactNode }) {
  const toast = useExplorer((s) => s.toast);
  useLayoutEffect(() => {
    void useExplorer.persist.rehydrate();
  }, []);
  return (
    <>
      {children}
      <LeasingDialogs />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}
