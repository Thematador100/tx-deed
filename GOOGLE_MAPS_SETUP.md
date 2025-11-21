# Google Maps Integration Setup Guide

This guide will help you configure Google Maps Platform APIs for the Win With Deeds application to display property images, Street View, and interactive maps.

## Features Implemented

✅ **Property Details Page**
- Interactive Google Maps with property markers
- Street View images
- Property photo gallery with toggle between photos, Street View, and map
- Coordinate display

✅ **Property Listing Cards**
- Automatic Street View fallback for properties without photos
- Hover-to-toggle between property photo and Street View
- Smart fallback system when Street View is unavailable

## Prerequisites

- Google Cloud Platform account
- Credit card (required for Google Maps Platform, but free tier includes $200/month credit)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "Win With Deeds Maps")
4. Click "Create"

## Step 2: Enable Required APIs

Navigate to [APIs & Services > Library](https://console.cloud.google.com/apis/library) and enable these APIs:

1. **Maps JavaScript API** - For interactive maps
2. **Places API** - For location data and autocomplete
3. **Street View Static API** - For Street View images
4. **Maps Static API** - For static map images
5. **Geocoding API** (Optional) - For address to coordinates conversion

## Step 3: Create API Key

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy your API key immediately

### Secure Your API Key (Recommended)

1. Click on your newly created API key to edit it
2. Under "Application restrictions":
   - For development: Select "None" (temporarily)
   - For production: Select "HTTP referrers" and add your domain(s):
     - `https://yourdomain.com/*`
     - `http://localhost:3000/*` (for local development)
3. Under "API restrictions":
   - Select "Restrict key"
   - Check only the APIs you enabled above
4. Click "Save"

## Step 4: Configure Environment Variables

1. Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Google Maps API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Important**: Never commit your `.env` file to version control!

## Step 5: Verify Installation

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to any property detail page
3. You should see:
   - Interactive map with property marker
   - Street View option in the media gallery
   - Map view option in the media gallery

## Usage in Your Application

### Configuration Check

The application automatically detects if Google Maps is configured:

```javascript
import { isGoogleMapsConfigured } from '@/lib/googleMapsConfig';

if (isGoogleMapsConfigured()) {
  // Show Google Maps features
} else {
  // Show fallback content
}
```

### Components Available

#### 1. PropertyMap - Interactive Map
```jsx
import { PropertyMap } from '@/components/maps';

<PropertyMap
  latitude={32.7767}
  longitude={-96.7970}
  address="123 Main St, Dallas, TX"
  zoom={15}
  className="w-full h-96"
/>
```

#### 2. StreetViewImage - Street View Static Image
```jsx
import { StreetViewImage } from '@/components/maps';

<StreetViewImage
  latitude={32.7767}
  longitude={-96.7970}
  address="123 Main St, Dallas, TX"
  width={800}
  height={400}
  fallbackUrl="/path/to/fallback.jpg"
  className="w-full h-full"
/>
```

#### 3. StaticMapImage - Static Map (Lightweight)
```jsx
import { StaticMapImage } from '@/components/maps';

<StaticMapImage
  latitude={32.7767}
  longitude={-96.7970}
  address="123 Main St, Dallas, TX"
  width={400}
  height={300}
  zoom={15}
  className="w-full rounded-lg"
/>
```

#### 4. PropertyMediaGallery - Complete Gallery
```jsx
import { PropertyMediaGallery } from '@/components/maps';

<PropertyMediaGallery
  latitude={32.7767}
  longitude={-96.7970}
  address="123 Main St, Dallas, TX"
  imageUrl="/property-photo.jpg"
  additionalImages={['/photo2.jpg', '/photo3.jpg']}
  className="w-full aspect-video"
/>
```

## Cost Optimization

### Free Tier
Google Maps Platform provides **$200 free credit per month**, which covers approximately:
- **28,000** Static Street View image loads
- **28,000** Static Map image loads
- **28,000** interactive map loads
- **40,000** Geocoding API calls

### Best Practices to Minimize Costs

1. **Use Static Images When Possible**
   - PropertyCard uses static Street View images (cheaper than interactive maps)
   - Static images are cached by browsers

2. **Implement Caching**
   - Browser caching is automatic for static images
   - Consider storing frequently accessed images in your CDN

3. **Use Fallback Images**
   - The implementation automatically falls back to property photos when Street View isn't available
   - No API calls are made for invalid coordinates

4. **Monitor Usage**
   - Set up billing alerts in Google Cloud Console
   - Monitor your usage at [Google Cloud Console > APIs & Services > Dashboard](https://console.cloud.google.com/apis/dashboard)

## Troubleshooting

### Maps Not Showing

1. **Check API Key Configuration**
   ```bash
   # Verify .env file exists and contains the key
   cat .env | grep VITE_GOOGLE_MAPS_API_KEY
   ```

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for Google Maps API errors
   - Common errors:
     - "API key not valid" → Check API key in Google Cloud Console
     - "RefererNotAllowedMapError" → Add your domain to API key restrictions
     - "ApiNotActivatedMapError" → Enable required APIs in Google Cloud Console

3. **Verify APIs Are Enabled**
   - Go to [Google Cloud Console > APIs & Services > Dashboard](https://console.cloud.google.com/apis/dashboard)
   - Confirm all required APIs show as "Enabled"

### Street View Shows "Unavailable"

This is normal behavior when:
- Street View imagery doesn't exist for that location
- The coordinates are invalid
- The location is in a rural/private area

The application will automatically show a fallback image in these cases.

### CORS Errors

If you see CORS errors:
1. Make sure your domain is added to API key restrictions
2. For local development, add `http://localhost:3000/*`

## Support

For Google Maps Platform support:
- [Documentation](https://developers.google.com/maps/documentation)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-maps)
- [Google Maps Platform Support](https://developers.google.com/maps/support)

## Next Steps

Consider adding:
1. **Geocoding** - Convert addresses to coordinates automatically
2. **Places Autocomplete** - Enhanced address search
3. **Directions API** - Route planning to properties
4. **Nearby Search** - Find amenities near properties (schools, hospitals, etc.)
