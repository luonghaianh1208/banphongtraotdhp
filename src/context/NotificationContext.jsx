// NotificationContext — quản lý thông báo realtime
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToNotifications, markNotificationRead, markNotificationUnread, markAllNotificationsRead } from '../firebase/firestore';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications phải dùng trong NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    }, (err) => {
      console.error('[NotificationContext] Lỗi realtime:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (notifId) => {
    await markNotificationRead(notifId);
  };

  const markUnread = async (notifId) => {
    await markNotificationUnread(notifId);
  };

  const markAllRead = async () => {
    await markAllNotificationsRead(notifications);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markUnread, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
