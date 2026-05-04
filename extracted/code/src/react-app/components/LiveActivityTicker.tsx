import { useState, useEffect } from 'react';

interface LiveActivity {
  id: number;
  activity_type: string;
  user_name: string;
  message: string;
  amount?: number;
  level_info?: string;
  created_at: string;
}

export default function LiveActivityTicker() {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch initial activities
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/live-activities');
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Error fetching live activities:', error);
      }
    };

    fetchActivities();

    // Poll for new activities every 10 seconds
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;

    // Cycle through activities every 15 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activities.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) {
    return (
      <div className="text-white text-sm">
        Carregando atividades...
      </div>
    );
  }

  const currentActivity = activities[currentIndex];

  return (
    <div className="text-white text-sm">
      <span className="text-red-600 font-medium">● AO VIVO</span>
      {' '}
      {currentActivity.message}
    </div>
  );
}
