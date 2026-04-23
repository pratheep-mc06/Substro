'use client';

import { useState, useEffect } from 'react';
import HistorySheet from '@/components/HistorySheet';
import NotificationsSheet from '@/components/NotificationsSheet';
import SettingsSheet from '@/components/SettingsSheet';
import ProfileSheet from '@/components/ProfileSheet';
import { useAuth } from '@/hooks/useAuth';

export function AppShells() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      const type = e.detail;
      // Close all first to prevent backdrop stacking
      setHistoryOpen(false);
      setNotificationsOpen(false);
      setSettingsOpen(false);
      setProfileOpen(false);

      if (type === 'history') setHistoryOpen(true);
      if (type === 'notifications') setNotificationsOpen(true);
      if (type === 'settings') setSettingsOpen(true);
      if (type === 'profile') setProfileOpen(true);
    };

    window.addEventListener('substro:open', handler as EventListener);
    return () => window.removeEventListener('substro:open', handler as EventListener);
  }, []);

  return (
    <>
      <HistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <NotificationsSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </>
  );
}
