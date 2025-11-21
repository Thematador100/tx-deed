import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StreetViewImage from './StreetViewImage';
import StaticMapImage from './StaticMapImage';
import { isGoogleMapsConfigured, FALLBACK_PROPERTY_IMAGE } from '@/lib/googleMapsConfig';

/**
 * Property Media Gallery with Street View, Map, and Property Images
 * @param {Object} props
 * @param {number} props.latitude - Property latitude
 * @param {number} props.longitude - Property longitude
 * @param {string} props.address - Property address
 * @param {string} props.imageUrl - Primary property image URL
 * @param {Array<string>} props.additionalImages - Additional property images
 * @param {string} props.className - Additional CSS classes
 */
const PropertyMediaGallery = ({
  latitude,
  longitude,
  address,
  imageUrl,
  additionalImages = [],
  className = '',
}) => {
  const [activeView, setActiveView] = useState('property'); // 'property', 'street', 'map'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasGoogleMaps = isGoogleMapsConfigured();

  // Combine primary image with additional images
  const propertyImages = imageUrl
    ? [imageUrl, ...additionalImages]
    : additionalImages.length > 0
    ? additionalImages
    : [FALLBACK_PROPERTY_IMAGE];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  return (
    <div className={`relative ${className}`}>
      {/* View Toggle Buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant={activeView === 'property' ? 'default' : 'secondary'}
          onClick={() => setActiveView('property')}
          className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
        >
          <ImageIcon className="w-4 h-4 mr-1" />
          Photos
        </Button>
        {hasGoogleMaps && (
          <>
            <Button
              size="sm"
              variant={activeView === 'street' ? 'default' : 'secondary'}
              onClick={() => setActiveView('street')}
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Street View
            </Button>
            <Button
              size="sm"
              variant={activeView === 'map' ? 'default' : 'secondary'}
              onClick={() => setActiveView('map')}
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Map
            </Button>
          </>
        )}
      </div>

      {/* Image Counter (only for property photos) */}
      {activeView === 'property' && propertyImages.length > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {propertyImages.length}
        </div>
      )}

      {/* Navigation Arrows (only for property photos with multiple images) */}
      {activeView === 'property' && propertyImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Media Display */}
      <div className="relative w-full h-full overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {activeView === 'property' && (
            <motion.div
              key={`property-${currentImageIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <img
                src={propertyImages[currentImageIndex]}
                alt={`${address} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {activeView === 'street' && (
            <motion.div
              key="street"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <StreetViewImage
                latitude={latitude}
                longitude={longitude}
                address={address}
                width={1200}
                height={600}
                fallbackUrl={propertyImages[0]}
                className="w-full h-full"
              />
            </motion.div>
          )}

          {activeView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <StaticMapImage
                latitude={latitude}
                longitude={longitude}
                address={address}
                width={1200}
                height={600}
                zoom={16}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PropertyMediaGallery;
