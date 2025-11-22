/**
 * Comprehensive Property Data Models for Enterprise Distressed Real Estate Platform
 * Covers: Land, Commercial, Residential, Tax Liens, Tax Deeds, Judgements, Entitlements
 */

// ==================== PROPERTY TYPES ====================

export const PROPERTY_TYPES = {
  RESIDENTIAL: {
    SINGLE_FAMILY: 'single_family',
    MULTI_FAMILY: 'multi_family',
    CONDO: 'condo',
    TOWNHOUSE: 'townhouse',
    MANUFACTURED: 'manufactured_home',
    VACATION: 'vacation_rental'
  },
  COMMERCIAL: {
    OFFICE: 'office',
    RETAIL: 'retail',
    INDUSTRIAL: 'industrial',
    WAREHOUSE: 'warehouse',
    MIXED_USE: 'mixed_use',
    HOTEL: 'hotel',
    RESTAURANT: 'restaurant',
    MEDICAL: 'medical_facility',
    SHOPPING_CENTER: 'shopping_center',
    STORAGE: 'self_storage'
  },
  LAND: {
    RAW_LAND: 'raw_land',
    AGRICULTURAL: 'agricultural',
    TIMBERLAND: 'timberland',
    RECREATIONAL: 'recreational',
    DEVELOPMENT: 'development_land',
    INFILL_LOT: 'infill_lot',
    WATERFRONT: 'waterfront',
    MINERAL_RIGHTS: 'mineral_rights'
  },
  SPECIAL: {
    PARKING: 'parking_structure',
    CHURCH: 'church',
    SCHOOL: 'school',
    HOSPITAL: 'hospital',
    GAS_STATION: 'gas_station',
    CAR_WASH: 'car_wash'
  }
};

// ==================== DISTRESSED ASSET TYPES ====================

export const DISTRESSED_ASSET_TYPES = {
  TAX_LIEN: 'tax_lien',
  TAX_DEED: 'tax_deed',
  REDEEMABLE_DEED: 'redeemable_deed',
  JUDGEMENT_LIEN: 'judgement_lien',
  MECHANICS_LIEN: 'mechanics_lien',
  HOA_LIEN: 'hoa_lien',
  MUNICIPAL_LIEN: 'municipal_lien',
  FORECLOSURE: 'foreclosure',
  PROBATE: 'probate',
  BANKRUPTCY: 'bankruptcy',
  CODE_VIOLATION: 'code_violation',
  SHERIFF_SALE: 'sheriff_sale',
  TRUSTEE_SALE: 'trustee_sale'
};

// ==================== LIEN TYPES ====================

export const LIEN_TYPES = {
  TAX: {
    PROPERTY_TAX: 'property_tax',
    FEDERAL_TAX: 'federal_tax_lien',
    STATE_TAX: 'state_tax_lien',
    INCOME_TAX: 'income_tax_lien'
  },
  JUDGEMENT: {
    CIVIL_JUDGEMENT: 'civil_judgement',
    MONETARY_JUDGEMENT: 'monetary_judgement',
    CHILD_SUPPORT: 'child_support_lien',
    DIVORCE_SETTLEMENT: 'divorce_settlement_lien'
  },
  MECHANICS: {
    CONSTRUCTION: 'construction_lien',
    CONTRACTOR: 'contractor_lien',
    MATERIALMAN: 'materialman_lien',
    SUBCONTRACTOR: 'subcontractor_lien'
  },
  ASSOCIATION: {
    HOA: 'hoa_lien',
    CONDO_ASSOCIATION: 'condo_association_lien',
    SPECIAL_ASSESSMENT: 'special_assessment'
  },
  MUNICIPAL: {
    UTILITY: 'utility_lien',
    SEWER: 'sewer_lien',
    WATER: 'water_lien',
    CODE_ENFORCEMENT: 'code_enforcement_lien',
    DEMOLITION: 'demolition_lien'
  },
  OTHER: {
    ENVIRONMENTAL: 'environmental_lien',
    WETLAND: 'wetland_lien',
    SUPERFUND: 'superfund_lien'
  }
};

// ==================== ENTITLEMENTS ====================

export const ENTITLEMENT_TYPES = {
  ZONING: {
    RESIDENTIAL: 'residential_zoning',
    COMMERCIAL: 'commercial_zoning',
    INDUSTRIAL: 'industrial_zoning',
    AGRICULTURAL: 'agricultural_zoning',
    MIXED_USE: 'mixed_use_zoning',
    OVERLAY: 'overlay_district',
    PUD: 'planned_unit_development'
  },
  PERMITS: {
    BUILDING: 'building_permit',
    DEVELOPMENT: 'development_permit',
    GRADING: 'grading_permit',
    DEMOLITION: 'demolition_permit',
    SUBDIVISION: 'subdivision_approval',
    SITE_PLAN: 'site_plan_approval'
  },
  UTILITIES: {
    WATER_TAP: 'water_tap_rights',
    SEWER_TAP: 'sewer_tap_rights',
    ELECTRIC: 'electric_service',
    GAS: 'gas_service',
    FIBER: 'fiber_optic'
  },
  SPECIAL_RIGHTS: {
    WATER_RIGHTS: 'water_rights',
    MINERAL_RIGHTS: 'mineral_rights',
    AIR_RIGHTS: 'air_rights',
    DEVELOPMENT_RIGHTS: 'development_rights',
    EASEMENT: 'easement_rights',
    ACCESS: 'access_rights',
    RIPARIAN: 'riparian_rights'
  },
  VARIANCES: {
    USE_VARIANCE: 'use_variance',
    AREA_VARIANCE: 'area_variance',
    SETBACK: 'setback_variance',
    HEIGHT: 'height_variance',
    DENSITY: 'density_variance'
  },
  ENVIRONMENTAL: {
    WETLAND_PERMIT: 'wetland_permit',
    ENVIRONMENTAL_CLEARANCE: 'environmental_clearance',
    ENDANGERED_SPECIES: 'endangered_species_clearance',
    STORMWATER: 'stormwater_management'
  }
};

// ==================== PROPERTY STATUS ====================

export const PROPERTY_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  UNDER_CONTRACT: 'under_contract',
  SOLD: 'sold',
  REDEEMED: 'redeemed',
  FORECLOSED: 'foreclosed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
  WITHDRAWN: 'withdrawn'
};

// ==================== DEAL STAGES ====================

export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  DUE_DILIGENCE: 'due_diligence',
  BID_PREPARED: 'bid_prepared',
  BID_SUBMITTED: 'bid_submitted',
  WON: 'won',
  LOST: 'lost',
  REDEMPTION_PERIOD: 'redemption_period',
  OWNED: 'owned',
  REHAB: 'rehab',
  LISTED: 'listed',
  UNDER_CONTRACT: 'under_contract',
  CLOSED: 'closed'
};

// ==================== BASE PROPERTY MODEL ====================

export class BaseProperty {
  constructor(data = {}) {
    this.id = data.id || null;
    this.parcel_id = data.parcel_id || '';
    this.apn = data.apn || ''; // Assessor's Parcel Number

    // Location
    this.address = data.address || '';
    this.city = data.city || '';
    this.county = data.county || '';
    this.state = data.state || '';
    this.zip_code = data.zip_code || '';
    this.latitude = data.latitude || null;
    this.longitude = data.longitude || null;

    // Property Details
    this.property_type = data.property_type || '';
    this.property_subtype = data.property_subtype || '';
    this.legal_description = data.legal_description || '';

    // Ownership
    this.current_owner = data.current_owner || '';
    this.owner_occupied = data.owner_occupied || false;
    this.mailing_address = data.mailing_address || '';

    // Valuation
    this.assessed_value = data.assessed_value || 0;
    this.market_value = data.market_value || 0;
    this.appraised_value = data.appraised_value || 0;

    // Physical Characteristics
    this.lot_size_sqft = data.lot_size_sqft || 0;
    this.lot_size_acres = data.lot_size_acres || 0;
    this.building_sqft = data.building_sqft || 0;
    this.year_built = data.year_built || null;

    // Metadata
    this.status = data.status || PROPERTY_STATUS.ACTIVE;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }
}

// ==================== RESIDENTIAL PROPERTY ====================

export class ResidentialProperty extends BaseProperty {
  constructor(data = {}) {
    super(data);

    this.bedrooms = data.bedrooms || 0;
    this.bathrooms = data.bathrooms || 0;
    this.half_baths = data.half_baths || 0;
    this.garage_spaces = data.garage_spaces || 0;
    this.parking_spaces = data.parking_spaces || 0;

    this.stories = data.stories || 1;
    this.basement = data.basement || false;
    this.basement_finished = data.basement_finished || false;
    this.pool = data.pool || false;
    this.fireplace_count = data.fireplace_count || 0;

    this.construction_type = data.construction_type || '';
    this.roof_type = data.roof_type || '';
    this.exterior_material = data.exterior_material || '';
    this.foundation_type = data.foundation_type || '';

    this.hvac_type = data.hvac_type || '';
    this.heating_type = data.heating_type || '';
    this.cooling_type = data.cooling_type || '';

    this.school_district = data.school_district || '';
    this.hoa_name = data.hoa_name || '';
    this.hoa_fees_monthly = data.hoa_fees_monthly || 0;
  }
}

// ==================== COMMERCIAL PROPERTY ====================

export class CommercialProperty extends BaseProperty {
  constructor(data = {}) {
    super(data);

    this.total_units = data.total_units || 1;
    this.rentable_sqft = data.rentable_sqft || 0;
    this.office_sqft = data.office_sqft || 0;
    this.warehouse_sqft = data.warehouse_sqft || 0;
    this.retail_sqft = data.retail_sqft || 0;

    this.zoning = data.zoning || '';
    this.zoning_description = data.zoning_description || '';
    this.occupancy_rate = data.occupancy_rate || 0;
    this.occupancy_type = data.occupancy_type || '';

    this.parking_ratio = data.parking_ratio || 0;
    this.parking_spaces = data.parking_spaces || 0;
    this.loading_docks = data.loading_docks || 0;

    this.ceiling_height = data.ceiling_height || 0;
    this.hvac_type = data.hvac_type || '';
    this.electrical_capacity = data.electrical_capacity || '';

    this.tenants = data.tenants || [];
    this.lease_type = data.lease_type || '';
    this.noi = data.noi || 0; // Net Operating Income
    this.cap_rate = data.cap_rate || 0;
    this.gross_income = data.gross_income || 0;
  }
}

// ==================== LAND PROPERTY ====================

export class LandProperty extends BaseProperty {
  constructor(data = {}) {
    super(data);

    this.zoning = data.zoning || '';
    this.zoning_description = data.zoning_description || '';
    this.land_use = data.land_use || '';
    this.topography = data.topography || '';

    this.utilities_available = data.utilities_available || [];
    this.road_access = data.road_access || '';
    this.road_frontage_ft = data.road_frontage_ft || 0;

    this.water_source = data.water_source || '';
    this.sewer_type = data.sewer_type || '';
    this.electric_available = data.electric_available || false;
    this.gas_available = data.gas_available || false;

    this.environmental_concerns = data.environmental_concerns || [];
    this.wetlands = data.wetlands || false;
    this.floodplain = data.floodplain || false;
    this.flood_zone = data.flood_zone || '';

    this.subdivision_potential = data.subdivision_potential || false;
    this.max_density = data.max_density || 0;
    this.buildable_acres = data.buildable_acres || 0;

    this.mineral_rights = data.mineral_rights || 'unknown';
    this.water_rights = data.water_rights || [];
    this.timber_value = data.timber_value || 0;
    this.agricultural_use = data.agricultural_use || '';
  }
}

// ==================== DISTRESSED ASSET ====================

export class DistressedAsset {
  constructor(data = {}) {
    this.id = data.id || null;
    this.property_id = data.property_id || null;
    this.asset_type = data.asset_type || '';

    // Financial Details
    this.amount_owed = data.amount_owed || 0;
    this.penalties = data.penalties || 0;
    this.interest = data.interest || 0;
    this.fees = data.fees || 0;
    this.total_due = data.total_due || 0;

    // Dates
    this.delinquent_date = data.delinquent_date || null;
    this.sale_date = data.sale_date || null;
    this.redemption_deadline = data.redemption_deadline || null;
    this.filed_date = data.filed_date || null;

    // Sale Information
    this.minimum_bid = data.minimum_bid || 0;
    this.opening_bid = data.opening_bid || 0;
    this.winning_bid = data.winning_bid || null;
    this.sale_location = data.sale_location || '';
    this.sale_type = data.sale_type || '';

    // Status
    this.status = data.status || PROPERTY_STATUS.ACTIVE;
    this.redemption_period_days = data.redemption_period_days || 0;
    this.redeemed = data.redeemed || false;

    // Investment Analysis
    this.estimated_value = data.estimated_value || 0;
    this.potential_roi = data.potential_roi || 0;
    this.opportunity_score = data.opportunity_score || 0;
    this.risk_score = data.risk_score || 0;

    // Due Diligence
    this.title_issues = data.title_issues || [];
    this.prior_liens = data.prior_liens || [];
    this.environmental_issues = data.environmental_issues || [];
    this.code_violations = data.code_violations || [];

    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }
}

// ==================== TAX LIEN ====================

export class TaxLien extends DistressedAsset {
  constructor(data = {}) {
    super(data);
    this.asset_type = DISTRESSED_ASSET_TYPES.TAX_LIEN;

    this.certificate_number = data.certificate_number || '';
    this.tax_year = data.tax_year || new Date().getFullYear();
    this.interest_rate = data.interest_rate || 0;
    this.penalty_rate = data.penalty_rate || 0;

    this.subsequent_taxes = data.subsequent_taxes || [];
    this.subsequent_total = data.subsequent_total || 0;

    this.foreclosure_eligible_date = data.foreclosure_eligible_date || null;
    this.can_foreclose = data.can_foreclose || false;
  }
}

// ==================== TAX DEED ====================

export class TaxDeed extends DistressedAsset {
  constructor(data = {}) {
    super(data);
    this.asset_type = DISTRESSED_ASSET_TYPES.TAX_DEED;

    this.deed_type = data.deed_type || '';
    this.redemption_allowed = data.redemption_allowed || true;
    this.redemption_rate = data.redemption_rate || 0;

    this.possession_date = data.possession_date || null;
    this.clear_title_date = data.clear_title_date || null;
  }
}

// ==================== JUDGEMENT LIEN ====================

export class JudgementLien extends DistressedAsset {
  constructor(data = {}) {
    super(data);
    this.asset_type = DISTRESSED_ASSET_TYPES.JUDGEMENT_LIEN;

    this.judgement_type = data.judgement_type || '';
    this.case_number = data.case_number || '';
    this.court = data.court || '';
    this.plaintiff = data.plaintiff || '';
    this.defendant = data.defendant || '';

    this.judgement_date = data.judgement_date || null;
    this.expiration_date = data.expiration_date || null;
    this.renewable = data.renewable || false;
  }
}

// ==================== ENTITLEMENT ====================

export class Entitlement {
  constructor(data = {}) {
    this.id = data.id || null;
    this.property_id = data.property_id || null;
    this.entitlement_type = data.entitlement_type || '';

    this.permit_number = data.permit_number || '';
    this.permit_name = data.permit_name || '';
    this.description = data.description || '';

    this.status = data.status || 'pending';
    this.application_date = data.application_date || null;
    this.approval_date = data.approval_date || null;
    this.expiration_date = data.expiration_date || null;

    this.conditions = data.conditions || [];
    this.restrictions = data.restrictions || [];

    this.approved_units = data.approved_units || 0;
    this.approved_sqft = data.approved_sqft || 0;
    this.approved_density = data.approved_density || 0;

    this.transferable = data.transferable || false;
    this.value_estimate = data.value_estimate || 0;

    this.issuing_authority = data.issuing_authority || '';
    this.contact_person = data.contact_person || '';
    this.contact_phone = data.contact_phone || '';

    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }
}

// ==================== DEAL ====================

export class Deal {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.property_id = data.property_id || null;
    this.distressed_asset_id = data.distressed_asset_id || null;

    this.deal_name = data.deal_name || '';
    this.stage = data.stage || DEAL_STAGES.LEAD;

    // Financial
    this.purchase_price = data.purchase_price || 0;
    this.closing_costs = data.closing_costs || 0;
    this.rehab_budget = data.rehab_budget || 0;
    this.total_investment = data.total_investment || 0;

    this.arv = data.arv || 0; // After Repair Value
    this.projected_profit = data.projected_profit || 0;
    this.projected_roi = data.projected_roi || 0;

    // Timeline
    this.acquisition_date = data.acquisition_date || null;
    this.projected_sale_date = data.projected_sale_date || null;
    this.actual_sale_date = data.actual_sale_date || null;

    // Strategy
    this.exit_strategy = data.exit_strategy || ''; // flip, rental, wholesale, etc.
    this.holding_period_months = data.holding_period_months || 0;

    // Team
    this.assigned_to = data.assigned_to || [];
    this.partners = data.partners || [];

    // Documents
    this.documents = data.documents || [];
    this.photos = data.photos || [];
    this.notes = data.notes || '';

    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const calculateROI = (profit, investment) => {
  if (investment === 0) return 0;
  return ((profit / investment) * 100).toFixed(2);
};

export const calculateOpportunityScore = (property, distressedAsset) => {
  // Scoring algorithm: 0-100
  let score = 0;

  // Equity spread (40 points max)
  const equity = distressedAsset.estimated_value - distressedAsset.total_due;
  const equityPercent = (equity / distressedAsset.estimated_value) * 100;
  score += Math.min(40, (equityPercent / 100) * 40);

  // Location quality (20 points max)
  // This would integrate with real location data
  score += 15;

  // Property condition (20 points max)
  score += 15;

  // Competition level (10 points max)
  score += 8;

  // Market trends (10 points max)
  score += 7;

  return Math.round(Math.min(100, score));
};

export const calculateRiskScore = (distressedAsset) => {
  // Risk scoring: 0-100 (higher = riskier)
  let risk = 0;

  if (distressedAsset.title_issues.length > 0) risk += 30;
  if (distressedAsset.environmental_issues.length > 0) risk += 25;
  if (distressedAsset.prior_liens.length > 0) risk += 20;
  if (distressedAsset.code_violations.length > 0) risk += 15;
  if (!distressedAsset.property_id) risk += 10;

  return Math.min(100, risk);
};

export default {
  PROPERTY_TYPES,
  DISTRESSED_ASSET_TYPES,
  LIEN_TYPES,
  ENTITLEMENT_TYPES,
  PROPERTY_STATUS,
  DEAL_STAGES,
  BaseProperty,
  ResidentialProperty,
  CommercialProperty,
  LandProperty,
  DistressedAsset,
  TaxLien,
  TaxDeed,
  JudgementLien,
  Entitlement,
  Deal,
  calculateROI,
  calculateOpportunityScore,
  calculateRiskScore
};
