/**
 * Stripe Integration Configuration
 * Enterprise-grade subscription and payment management
 */

import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (use environment variable in production)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// ==================== SUBSCRIPTION TIERS ====================

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free Explorer',
    price: 0,
    priceId: null,
    interval: 'month',
    features: [
      'Access to 50-state rules library',
      'Basic property search (10/month)',
      'View upcoming auctions',
      'Educational resources',
      'Community forum access'
    ],
    limits: {
      propertySearches: 10,
      savedProperties: 5,
      deals: 1,
      aiCredits: 0
    },
    cta: 'Start Free',
    popular: false
  },

  INVESTOR: {
    id: 'investor',
    name: 'Active Investor',
    price: 97,
    priceId: 'price_investor_monthly',
    interval: 'month',
    features: [
      'Unlimited property searches',
      'Save up to 50 properties',
      'Track 10 active deals',
      'Basic AI analysis (100 credits/mo)',
      'Email notifications',
      'Deal pipeline management',
      'ROI calculator',
      'Download property reports'
    ],
    limits: {
      propertySearches: -1, // unlimited
      savedProperties: 50,
      deals: 10,
      aiCredits: 100
    },
    cta: 'Start Investing',
    popular: true
  },

  PRO: {
    id: 'pro',
    name: 'Professional',
    price: 197,
    priceId: 'price_pro_monthly',
    interval: 'month',
    features: [
      'Everything in Active Investor',
      'Unlimited property tracking',
      'Unlimited deals',
      'Advanced AI analysis (500 credits/mo)',
      'Scout AI agent',
      'Automated lead sourcing',
      'Market analytics dashboard',
      'API access (1,000 calls/mo)',
      'Priority support',
      'Deal collaboration tools'
    ],
    limits: {
      propertySearches: -1,
      savedProperties: -1,
      deals: -1,
      aiCredits: 500,
      apiCalls: 1000
    },
    cta: 'Go Pro',
    popular: false
  },

  ELITE: {
    id: 'elite',
    name: 'Mentee Elite',
    price: 497,
    priceId: 'price_elite_monthly',
    interval: 'month',
    features: [
      'Everything in Professional',
      'Unlimited AI credits',
      'Multiple Scout AI agents',
      'Custom automation workflows',
      'White-label microsites',
      'Buyer matching algorithm',
      'Deal rescue engine',
      'Funding portal access',
      'Advanced API (10,000 calls/mo)',
      'Dedicated account manager',
      '1-on-1 mentorship sessions',
      'Exclusive mastermind access',
      'Early feature access'
    ],
    limits: {
      propertySearches: -1,
      savedProperties: -1,
      deals: -1,
      aiCredits: -1,
      apiCalls: 10000,
      scoutAgents: 10
    },
    cta: 'Join Elite',
    popular: false
  },

  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    priceId: null,
    interval: 'custom',
    features: [
      'Everything in Mentee Elite',
      'Unlimited everything',
      'Custom integrations',
      'Dedicated infrastructure',
      'SLA guarantees',
      'Custom training',
      'Multi-user team accounts',
      'Advanced security',
      'Custom reporting',
      'White-glove onboarding'
    ],
    limits: {
      propertySearches: -1,
      savedProperties: -1,
      deals: -1,
      aiCredits: -1,
      apiCalls: -1,
      scoutAgents: -1
    },
    cta: 'Contact Sales',
    popular: false
  }
};

// Annual pricing (20% discount)
export const ANNUAL_PRICING = {
  investor: {
    monthly: 97,
    annual: 930, // ~$77.50/mo
    savings: 234
  },
  pro: {
    monthly: 197,
    annual: 1890, // ~$157.50/mo
    savings: 474
  },
  elite: {
    monthly: 497,
    annual: 4770, // ~$397.50/mo
    savings: 1194
  }
};

// ==================== ADD-ONS ====================

export const ADDONS = {
  EXTRA_AI_CREDITS: {
    id: 'addon_ai_credits',
    name: 'Extra AI Credits',
    description: '1,000 additional AI analysis credits',
    price: 49,
    priceId: 'price_addon_ai_credits'
  },
  EXTRA_API_CALLS: {
    id: 'addon_api_calls',
    name: 'Extra API Calls',
    description: '10,000 additional API calls',
    price: 29,
    priceId: 'price_addon_api_calls'
  },
  PRIORITY_SUPPORT: {
    id: 'addon_priority_support',
    name: 'Priority Support',
    description: '24/7 priority support with 1-hour response time',
    price: 97,
    priceId: 'price_addon_priority_support'
  },
  DATA_EXPORT: {
    id: 'addon_data_export',
    name: 'Advanced Data Export',
    description: 'Bulk export to CSV/Excel with custom fields',
    price: 19,
    priceId: 'price_addon_data_export'
  }
};

// ==================== ONE-TIME PRODUCTS ====================

export const ONE_TIME_PRODUCTS = {
  STATE_GUIDE: {
    id: 'product_state_guide',
    name: 'Complete State Investment Guide',
    description: 'Comprehensive PDF guide for your target state',
    price: 97,
    priceId: 'price_state_guide'
  },
  TRAINING_COURSE: {
    id: 'product_training',
    name: 'Tax Lien/Deed Mastery Course',
    description: '8-week video course with templates',
    price: 497,
    priceId: 'price_training_course'
  },
  DUE_DILIGENCE_TEMPLATE: {
    id: 'product_dd_template',
    name: 'Due Diligence Checklist Pack',
    description: 'Professional templates and checklists',
    price: 47,
    priceId: 'price_dd_template'
  },
  LEGAL_FORMS: {
    id: 'product_legal_forms',
    name: 'Legal Forms Library',
    description: 'State-specific legal forms and contracts',
    price: 197,
    priceId: 'price_legal_forms'
  }
};

// ==================== STRIPE FUNCTIONS ====================

/**
 * Get Stripe instance
 */
export const getStripe = () => stripePromise;

/**
 * Create checkout session
 */
export const createCheckoutSession = async ({
  priceId,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata = {},
  mode = 'subscription'
}) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
        customerEmail,
        metadata,
        mode
      }),
    });

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (sessionId) => {
  const stripe = await getStripe();
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Stripe redirect error:', error);
    throw error;
  }
};

/**
 * Create subscription checkout
 */
export const createSubscriptionCheckout = async ({
  tier,
  isAnnual = false,
  customerEmail,
  userId
}) => {
  const tierConfig = SUBSCRIPTION_TIERS[tier.toUpperCase()];
  if (!tierConfig || !tierConfig.priceId) {
    throw new Error('Invalid subscription tier');
  }

  const priceId = isAnnual
    ? `${tierConfig.priceId}_annual`
    : tierConfig.priceId;

  const session = await createCheckoutSession({
    priceId,
    successUrl: `${window.location.origin}/member-dashboard?subscription=success`,
    cancelUrl: `${window.location.origin}/membership?subscription=cancelled`,
    customerEmail,
    metadata: {
      userId,
      tier: tierConfig.id,
      billingInterval: isAnnual ? 'annual' : 'monthly'
    },
    mode: 'subscription'
  });

  return session;
};

/**
 * Create one-time payment checkout
 */
export const createOneTimeCheckout = async ({
  productId,
  customerEmail,
  userId
}) => {
  const product = Object.values(ONE_TIME_PRODUCTS).find(p => p.id === productId);
  if (!product) {
    throw new Error('Invalid product');
  }

  const session = await createCheckoutSession({
    priceId: product.priceId,
    successUrl: `${window.location.origin}/member-dashboard?purchase=success`,
    cancelUrl: `${window.location.origin}/membership?purchase=cancelled`,
    customerEmail,
    metadata: {
      userId,
      productId: product.id
    },
    mode: 'payment'
  });

  return session;
};

/**
 * Manage subscription (customer portal)
 */
export const openCustomerPortal = async (customerId) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/profile`
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error opening customer portal:', error);
    throw error;
  }
};

/**
 * Check if user has access to feature
 */
export const hasFeatureAccess = (userTier, feature) => {
  const tier = SUBSCRIPTION_TIERS[userTier?.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;

  // Check limits
  if (feature.type === 'limit') {
    const limit = tier.limits[feature.name];
    return limit === -1 || feature.current < limit;
  }

  // For boolean features, check tier hierarchy
  const tierHierarchy = ['FREE', 'INVESTOR', 'PRO', 'ELITE', 'ENTERPRISE'];
  const userTierIndex = tierHierarchy.indexOf(userTier?.toUpperCase() || 'FREE');
  const requiredTierIndex = tierHierarchy.indexOf(feature.requiredTier?.toUpperCase() || 'FREE');

  return userTierIndex >= requiredTierIndex;
};

/**
 * Calculate usage percentage
 */
export const getUsagePercentage = (userTier, limitName, currentUsage) => {
  const tier = SUBSCRIPTION_TIERS[userTier?.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
  const limit = tier.limits[limitName];

  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100; // No access

  return Math.min(100, (currentUsage / limit) * 100);
};

/**
 * Get recommended upgrade
 */
export const getRecommendedUpgrade = (currentTier, reason) => {
  const tierHierarchy = ['FREE', 'INVESTOR', 'PRO', 'ELITE', 'ENTERPRISE'];
  const currentIndex = tierHierarchy.indexOf(currentTier?.toUpperCase() || 'FREE');

  // If at max tier, return null
  if (currentIndex >= tierHierarchy.length - 1) return null;

  return SUBSCRIPTION_TIERS[tierHierarchy[currentIndex + 1]];
};

export default {
  SUBSCRIPTION_TIERS,
  ANNUAL_PRICING,
  ADDONS,
  ONE_TIME_PRODUCTS,
  getStripe,
  createCheckoutSession,
  redirectToCheckout,
  createSubscriptionCheckout,
  createOneTimeCheckout,
  openCustomerPortal,
  hasFeatureAccess,
  getUsagePercentage,
  getRecommendedUpgrade
};
