import { useEffect, useState } from 'react';
import { WeatherWidget } from '../../components/WeatherWidget';
import { WeatherModal } from '../../components/WeatherModal';
import { Breadcrumb } from '../../components/Breadcrumb';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);
  
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return (
    <>
      <header className="bg-cream w-full px-6">
        <div className="flex items-center justify-between w-full max-w-full">
          {/* Logo and Breadcrumb */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-charcoal tracking-tight">
              KitchenSync
            </h1>
            <Breadcrumb />
          </div>
          
          
          
          <div className="flex items-center gap-8">
            {/* Weather Widget */}
            <WeatherWidget onClick={() => setIsWeatherModalOpen(true)} />
            {/* Date Display */}
            <div className="text-2xl font-bold text-charcoal tracking-tight">
              {formattedDate}
            </div>
            
            {/* Time Display */}
            <div className="text-2xl font-bold text-charcoal tabular-nums tracking-tighter">
              {formattedTime}
            </div>
          </div>
        </div>
      </header>
      
      {/* Weather Modal */}
      <WeatherModal 
        isOpen={isWeatherModalOpen} 
        onClose={() => setIsWeatherModalOpen(false)} 
      />
    </>
  );
};

