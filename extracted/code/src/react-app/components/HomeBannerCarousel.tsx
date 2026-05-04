import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface HomeBanner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

interface HomeBannerCarouselProps {
  className?: string;
}

export default function HomeBannerCarousel({ className = '' }: HomeBannerCarouselProps) {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/home-banners', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setBanners(data);
          setError(null);
        } else {
          setError('Erro ao carregar banners');
        }
      } catch (err) {
        setError('Erro de conexão');
        console.error('Error fetching banners:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = (banner: HomeBanner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white/5 rounded-3xl h-64 flex items-center justify-center ${className}`}>
        <div className="text-white/70">Carregando banners...</div>
      </div>
    );
  }

  

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white/5 rounded-3xl h-64 flex items-center justify-center ${className}`}>
        <div className="text-white/70">Carregando banners...</div>
      </div>
    );
  }

  if (error || banners.length === 0) {
    return null; // Hide component if no banners or error
  }

  return (
    <div className={`relative bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 ${className}`}>
      {/* Main carousel container */}
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
        {/* Banner slides */}
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full h-full relative cursor-pointer group"
              onClick={() => handleBannerClick(banner)}
            >
              {/* Banner image */}
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/api/placeholder/800/400';
                }}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                <div className="max-w-2xl">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 line-clamp-2">
                    {banner.title}
                  </h3>
                  {banner.description && (
                    <p className="text-white/90 text-sm sm:text-base line-clamp-3 mb-3">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <span>Clique para saber mais</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-green-400 scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-rotation indicator */}
      {banners.length > 1 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full text-xs text-white">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Auto</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 ${className}`}>
      {/* Main carousel container */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {/* Banner slides */}
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full h-full relative cursor-pointer group"
              onClick={() => handleBannerClick(banner)}
            >
              {/* Banner image */}
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/api/placeholder/800/400';
                }}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                <div className="max-w-2xl">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 line-clamp-2">
                    {banner.title}
                  </h3>
                  {banner.description && (
                    <p className="text-white/90 text-sm sm:text-base line-clamp-3 mb-3">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <span>Clique para saber mais</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-green-400 scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-rotation indicator */}
      {banners.length > 1 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full text-xs text-white">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Auto</span>
        </div>
      )}
    </div>
  );
}
