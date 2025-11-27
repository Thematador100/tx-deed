import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({
  title = 'Win With Deeds - AI-Powered Tax Deed Investment Platform',
  description = 'The premier AI-powered platform for discovering, analyzing, and acquiring tax deed properties. Find high-equity deals, match with buyers, and automate your disposition with cutting-edge AI tools.',
  keywords = 'tax deed, tax lien, property investment, real estate investing, AI real estate, property analysis, buyer matching, deal analysis, redeemable deeds, tax deed auction',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : 'https://winwithdeeds.com',
  type = 'website',
  author = 'Win With Deeds',
  canonical,
  noindex = false
}) => {
  const siteTitle = 'Win With Deeds';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Win With Deeds',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': description,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '127'
    }
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Win With Deeds',
    'url': 'https://winwithdeeds.com',
    'logo': 'https://winwithdeeds.com/logo.png',
    'description': description,
    'sameAs': [
      'https://twitter.com/winwithdeeds',
      'https://facebook.com/winwithdeeds',
      'https://linkedin.com/company/winwithdeeds'
    ]
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content="@winwithdeeds" />

      {/* Additional SEO Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
};

export default SEO;

// Pre-configured SEO for common pages
export const HomeSEO = () => (
  <SEO
    title="Win With Deeds - AI-Powered Tax Deed Investment Platform"
    description="Discover, analyze, and acquire tax deed properties with AI-powered tools. Get buyer matching, deal analysis, automated outreach, and more."
    keywords="tax deed investment, tax lien investing, real estate AI, property analysis, buyer matching, deal dossier"
  />
);

export const PropertiesSEO = () => (
  <SEO
    title="Tax Deed Properties - Browse Upcoming Auctions"
    description="Browse thousands of tax deed properties and upcoming auctions. Filter by location, price, ROI, and property type. Get instant AI analysis."
    keywords="tax deed properties, tax deed auctions, property listings, tax sale properties"
  />
);

export const PlatformTourSEO = () => (
  <SEO
    title="Platform Tour - See How Win With Deeds Works"
    description="Explore the complete Win With Deeds platform. From AI property analysis to buyer matching, automated outreach, and deal management."
    keywords="real estate platform, investment tools, AI real estate software"
  />
);

export const BuyerMatchSEO = () => (
  <SEO
    title="Buyer-Match Graph - Find Perfect Buyers for Your Deals"
    description="AI-powered buyer matching that connects your properties with investors who have purchased similar deals. Get ranked matches with contact info."
    keywords="buyer matching, real estate buyers, property wholesaling, investor network"
  />
);

export const DealDossierSEO = () => (
  <SEO
    title="AI Deal Dossier - Comprehensive Property Due Diligence"
    description="Get instant property due diligence reports with AI. Check title status, liens, court records, and red flags before you invest."
    keywords="property due diligence, title search, lien search, property analysis, investment research"
  />
);

export const DispoSEO = () => (
  <SEO
    title="AI Dispo Copilot - Automate Your Property Disposition"
    description="Generate price recommendations, professional microsites, and compliant outreach campaigns with AI assistance."
    keywords="property disposition, real estate marketing, microsite generator, outreach automation"
  />
);
