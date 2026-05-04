import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';

interface Announcement {
  id: number;
  title: string;
  content: string;
  target_new_users: boolean;
  target_all_users: boolean;
  priority: number;
  expires_at?: string;
  is_active: boolean;
  created_by_admin_name: string;
  created_at: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnnouncements();
    }
  }, [isOpen]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/announcements', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(Array.isArray(data) ? data : []);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (announcementId: number) => {
    try {
      await fetch(`/api/announcements/${announcementId}/view`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
    }
  };

  

  const handleClose = async () => {
    // Mark current announcement as viewed
    if (announcements[currentIndex]) {
      await markAsViewed(announcements[currentIndex].id);
    }
    onClose();
  };

  if (!isOpen || loading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  // const isLastAnnouncement = currentIndex === announcements.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full shadow-2xl animate-fade-in-up overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-center relative">
          <h2 className="text-lg font-bold text-white">
            {currentAnnouncement.title}
          </h2>
          
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-white hover:bg-gray-700/30 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-white whitespace-pre-wrap leading-relaxed text-sm">
            {currentAnnouncement.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center">
          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full py-3 font-medium"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
