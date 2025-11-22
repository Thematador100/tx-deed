/**
 * Autonomous Skip Tracing Agent
 *
 * Operates 24/7 to find:
 * - Family members of property owners
 * - Contact information (emails, phones)
 * - For deceased owners - detailed estate info
 * - Property ownership chains
 *
 * Works completely autonomously once given a task.
 */

import axios from 'axios';

class SkipTracingAgent {
  constructor(dbManager, config = {}) {
    this.dbManager = dbManager;
    this.config = {
      name: 'SkipTracingAgent',
      batchSize: config.batchSize || 10,
      delayBetweenRequests: config.delayBetweenRequests || 2000,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    this.isRunning = false;
    this.queue = [];
    this.stats = {
      totalProcessed: 0,
      successfulTraces: 0,
      failedTraces: 0,
      familyMembersFound: 0,
      contactsFound: 0,
    };
  }

  /**
   * Start autonomous operation
   */
  async start() {
    console.log('[SkipTracingAgent] 🕵️ Starting autonomous skip tracing...');
    this.isRunning = true;

    // Continuously process properties that need skip tracing
    while (this.isRunning) {
      try {
        await this.processPropertiesNeedingTracing();
        await this.delay(60000); // Check every minute
      } catch (error) {
        console.error('[SkipTracingAgent] Error in main loop:', error);
        await this.delay(300000); // Wait 5 min on error
      }
    }
  }

  /**
   * Find properties that need skip tracing
   */
  async processPropertiesNeedingTracing() {
    try {
      // Get properties without skip tracing data
      const { data: properties, error } = await this.dbManager.supabase
        .from('properties')
        .select('*')
        .is('skip_trace_completed', null)
        .limit(this.config.batchSize);

      if (error) throw error;

      if (!properties || properties.length === 0) {
        console.log('[SkipTracingAgent] No properties need tracing - idle');
        return;
      }

      console.log(`[SkipTracingAgent] Found ${properties.length} properties needing tracing`);

      for (const property of properties) {
        await this.traceProperty(property);
        await this.delay(this.config.delayBetweenRequests);
      }

    } catch (error) {
      console.error('[SkipTracingAgent] Error finding properties:', error);
    }
  }

  /**
   * Trace a single property owner
   */
  async traceProperty(property) {
    console.log(`[SkipTracingAgent] 🔍 Tracing: ${property.owner} - ${property.address}`);
    this.stats.totalProcessed++;

    try {
      const traceData = {
        property_id: property.id,
        owner_name: property.owner,
        started_at: new Date().toISOString(),
      };

      // Step 1: Parse owner name
      const ownerInfo = this.parseOwnerName(property.owner);
      traceData.parsed_name = ownerInfo;

      // Step 2: Check if deceased
      const isDeceased = this.checkIfDeceased(property.owner);
      traceData.is_deceased = isDeceased;

      // Step 3: Find family members
      const familyMembers = await this.findFamilyMembers(ownerInfo, property.address);
      traceData.family_members = familyMembers;
      this.stats.familyMembersFound += familyMembers.length;

      // Step 4: Find contact information
      const contacts = await this.findContactInfo(ownerInfo, property.address);
      traceData.contacts = contacts;
      if (contacts.emails?.length > 0 || contacts.phones?.length > 0) {
        this.stats.contactsFound++;
      }

      // Step 5: If deceased, get estate info
      if (isDeceased) {
        const estateInfo = await this.getDeceasedEstateInfo(ownerInfo, property);
        traceData.estate_info = estateInfo;
      }

      // Save trace results to database
      await this.saveTraceResults(property.id, traceData);

      this.stats.successfulTraces++;
      console.log(`[SkipTracingAgent] ✅ Completed trace for ${property.owner}`);

    } catch (error) {
      this.stats.failedTraces++;
      console.error(`[SkipTracingAgent] ❌ Failed trace for ${property.owner}:`, error.message);

      // Mark as attempted even if failed
      await this.markTraceAttempted(property.id, error.message);
    }
  }

  /**
   * Parse owner name into components
   */
  parseOwnerName(ownerName) {
    if (!ownerName) return null;

    const name = ownerName.toUpperCase();

    // Check for estate/trust patterns
    const isEstate = name.includes('ESTATE') || name.includes('HEIR');
    const isTrust = name.includes('TRUST');
    const isLLC = name.includes('LLC') || name.includes('INC') || name.includes('CORP');

    // Extract individual name if present
    let firstName = null;
    let lastName = null;

    if (!isLLC && !isTrust) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
      }
    }

    return {
      full_name: ownerName,
      first_name: firstName,
      last_name: lastName,
      is_estate: isEstate,
      is_trust: isTrust,
      is_business: isLLC,
      is_individual: !isLLC && !isTrust && !isEstate,
    };
  }

  /**
   * Check if owner is deceased
   */
  checkIfDeceased(ownerName) {
    if (!ownerName) return false;

    const name = ownerName.toUpperCase();
    const deceasedIndicators = [
      'ESTATE OF',
      'HEIRS OF',
      'DECEASED',
      'DEC\'D',
      'IN REM',
    ];

    return deceasedIndicators.some(indicator => name.includes(indicator));
  }

  /**
   * Find family members
   * In production, integrate with:
   * - TruePeopleSearch API
   * - FastPeopleSearch API
   * - BeenVerified API
   * - Spokeo API
   */
  async findFamilyMembers(ownerInfo, address) {
    const familyMembers = [];

    if (!ownerInfo || !ownerInfo.is_individual) {
      return familyMembers;
    }

    try {
      // Strategy 1: Check same address for family members
      const sameAddressFamily = await this.searchSameAddress(address);
      familyMembers.push(...sameAddressFamily);

      // Strategy 2: Use name to find relatives
      // This would integrate with skip tracing APIs
      const relativesByName = await this.searchRelativesByName(ownerInfo);
      familyMembers.push(...relativesByName);

      // Strategy 3: Court records for estate cases
      if (ownerInfo.is_estate) {
        const estateRelatives = await this.searchEstateRecords(ownerInfo);
        familyMembers.push(...estateRelatives);
      }

      // Remove duplicates
      return this.deduplicateFamilyMembers(familyMembers);

    } catch (error) {
      console.error('[SkipTracingAgent] Error finding family:', error);
      return familyMembers;
    }
  }

  /**
   * Search same address for family members
   */
  async searchSameAddress(address) {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('properties')
        .select('owner')
        .ilike('address', `%${address.split(',')[0]}%`)
        .limit(10);

      if (error || !data) return [];

      return data.map(p => ({
        name: p.owner,
        relationship: 'Same Address',
        source: 'Database',
      }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Search relatives by name
   * Placeholder for API integration
   */
  async searchRelativesByName(ownerInfo) {
    // In production, integrate with:
    // - TruePeopleSearch: https://www.truepeoplesearch.com/api
    // - FastPeopleSearch: https://www.fastpeoplesearch.com/
    // - BeenVerified: https://www.beenverified.com/api

    // For now, return mock data structure
    return [
      // {
      //   name: 'John Doe',
      //   relationship: 'Spouse',
      //   age: 45,
      //   source: 'TruePeopleSearch'
      // }
    ];
  }

  /**
   * Search estate records
   */
  async searchEstateRecords(ownerInfo) {
    // Integrate with court records APIs
    // - CourtListener: https://www.courtlistener.com/api/
    // - PACER: https://pacer.uscourts.gov/

    return [];
  }

  /**
   * Find contact information
   */
  async findContactInfo(ownerInfo, address) {
    const contacts = {
      emails: [],
      phones: [],
      addresses: [address],
    };

    if (!ownerInfo || !ownerInfo.is_individual) {
      return contacts;
    }

    try {
      // Strategy 1: Email pattern generation
      if (ownerInfo.first_name && ownerInfo.last_name) {
        const generatedEmails = this.generateEmailPatterns(
          ownerInfo.first_name,
          ownerInfo.last_name
        );
        contacts.emails.push(...generatedEmails);
      }

      // Strategy 2: Phone lookup APIs
      // Integrate with:
      // - Twilio Lookup API
      // - NumVerify API
      // - Whitepages API
      const phones = await this.lookupPhones(ownerInfo, address);
      contacts.phones.push(...phones);

      // Strategy 3: Verify emails
      const verifiedEmails = await this.verifyEmails(contacts.emails);
      contacts.emails = verifiedEmails;

      return contacts;

    } catch (error) {
      console.error('[SkipTracingAgent] Error finding contacts:', error);
      return contacts;
    }
  }

  /**
   * Generate common email patterns
   */
  generateEmailPatterns(firstName, lastName) {
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

    const patterns = [];

    commonDomains.forEach(domain => {
      patterns.push({
        email: `${first}.${last}@${domain}`,
        status: 'generated',
        confidence: 0.3,
      });
      patterns.push({
        email: `${first}${last}@${domain}`,
        status: 'generated',
        confidence: 0.2,
      });
      patterns.push({
        email: `${first.charAt(0)}${last}@${domain}`,
        status: 'generated',
        confidence: 0.2,
      });
    });

    return patterns;
  }

  /**
   * Lookup phone numbers
   * Placeholder for API integration
   */
  async lookupPhones(ownerInfo, address) {
    // Integrate with:
    // - Twilio Lookup: https://www.twilio.com/docs/lookup/api
    // - NumVerify: https://numverify.com/
    // - Whitepages: https://pro.whitepages.com/

    return [];
  }

  /**
   * Verify email addresses
   * Placeholder for API integration
   */
  async verifyEmails(emails) {
    // Integrate with:
    // - Hunter.io: https://hunter.io/api
    // - NeverBounce: https://neverbounce.com/
    // - ZeroBounce: https://www.zerobounce.net/

    // For now, just mark as unverified
    return emails.map(email => ({
      ...email,
      verified: false,
      verification_attempted: true,
    }));
  }

  /**
   * Get deceased estate information
   */
  async getDeceasedEstateInfo(ownerInfo, property) {
    const estateInfo = {
      death_date: null,
      probate_case: null,
      executor: null,
      heirs: [],
      estate_value: null,
    };

    try {
      // Strategy 1: Search obituaries
      // Integrate with: Legacy.com, Obituary Daily Times

      // Strategy 2: Court probate records
      // Integrate with: CourtListener, state probate courts

      // Strategy 3: Public records
      // Integrate with: County clerk records

      console.log(`[SkipTracingAgent] 💀 Researching deceased owner: ${ownerInfo.full_name}`);

      // Mock structure for now
      estateInfo.notes = 'Estate research required - integrate with probate APIs';

      return estateInfo;

    } catch (error) {
      console.error('[SkipTracingAgent] Error getting estate info:', error);
      return estateInfo;
    }
  }

  /**
   * Deduplicate family members
   */
  deduplicateFamilyMembers(familyMembers) {
    const seen = new Set();
    return familyMembers.filter(member => {
      const key = member.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Save trace results to database
   */
  async saveTraceResults(propertyId, traceData) {
    try {
      // Update property with skip trace data
      const { error } = await this.dbManager.supabase
        .from('properties')
        .update({
          skip_trace_completed: true,
          skip_trace_data: traceData,
          skip_traced_at: new Date().toISOString(),
          owner_parsed: traceData.parsed_name,
          is_deceased: traceData.is_deceased,
          family_members: traceData.family_members,
          contact_info: traceData.contacts,
          estate_info: traceData.estate_info,
        })
        .eq('id', propertyId);

      if (error) throw error;

      console.log(`[SkipTracingAgent] 💾 Saved trace results for property ${propertyId}`);

    } catch (error) {
      console.error('[SkipTracingAgent] Error saving trace results:', error);
      throw error;
    }
  }

  /**
   * Mark trace as attempted (even if failed)
   */
  async markTraceAttempted(propertyId, errorMessage) {
    try {
      await this.dbManager.supabase
        .from('properties')
        .update({
          skip_trace_attempted: true,
          skip_trace_error: errorMessage,
          skip_traced_at: new Date().toISOString(),
        })
        .eq('id', propertyId);

    } catch (error) {
      console.error('[SkipTracingAgent] Error marking attempt:', error);
    }
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      queueLength: this.queue.length,
    };
  }

  /**
   * Stop agent
   */
  async stop() {
    console.log('[SkipTracingAgent] Stopping...');
    this.isRunning = false;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SkipTracingAgent;
