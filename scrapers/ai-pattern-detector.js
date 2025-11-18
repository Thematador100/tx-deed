/**
 * AI-POWERED PATTERN DETECTOR
 *
 * Uses machine learning and heuristics to automatically detect
 * scraping patterns on county tax deed/lien websites
 *
 * Features:
 * - DOM structure analysis
 * - Table/list detection
 * - Form interaction patterns
 * - Pagination detection
 * - Data extraction rules learning
 * - Platform identification (Tyler, BS&A, etc.)
 */

import * as cheerio from 'cheerio';

export class AIPatternDetector {
    constructor() {
        // Known county software platforms and their signatures
        this.platformSignatures = {
            'Tyler Technologies': [
                /tyler.*technologies/i,
                /incode/i,
                /iasworld/i,
                /eagle.*recorder/i,
                /eagleweb/i
            ],
            'BS&A Software': [
                /bs&a/i,
                /bsasoftware/i,
                /bs_a/i
            ],
            'Aumentum': [
                /aumentum/i,
                /propertymax/i,
                /taxmax/i
            ],
            'CoreLogic': [
                /corelogic/i,
                /parcel.*quest/i,
                /realquest/i
            ],
            'Vanguard': [
                /vanguard/i,
                /justice.*web/i
            ],
            'Courthouse Technologies': [
                /courthouse.*tech/i,
                /justiceweb/i
            ],
            'SoftwareSystems Inc': [
                /softwaresystems/i,
                /ssi-/i,
                /cama.*system/i
            ],
            'Azteca Systems': [
                /azteca/i,
                /azprop/i
            ],
            'Devnet': [
                /devnet/i,
                /devnetweb/i
            ]
        };

        // Common data field patterns
        this.fieldPatterns = {
            propertyId: [
                /parcel.*id/i,
                /apn/i,
                /property.*id/i,
                /account.*number/i,
                /pin/i
            ],
            address: [
                /address/i,
                /location/i,
                /property.*address/i,
                /situs/i
            ],
            owner: [
                /owner/i,
                /taxpayer/i,
                /name/i
            ],
            assessedValue: [
                /assessed.*value/i,
                /appraised.*value/i,
                /market.*value/i,
                /taxable.*value/i
            ],
            taxAmount: [
                /tax.*due/i,
                /taxes/i,
                /amount.*due/i,
                /delinquent.*amount/i
            ],
            saleDate: [
                /sale.*date/i,
                /auction.*date/i,
                /tax.*sale/i
            ],
            openingBid: [
                /opening.*bid/i,
                /minimum.*bid/i,
                /starting.*bid/i
            ]
        };
    }

    /**
     * Analyze a webpage and detect scraping patterns
     */
    async detectPatterns(html, url) {
        const $ = cheerio.load(html);
        const detectedPlatform = this.detectPlatform(html, $);

        console.log(`🔍 Analyzing ${url}`);
        console.log(`   Platform detected: ${detectedPlatform || 'Unknown'}`);

        const patterns = {
            platform: detectedPlatform,
            type: null,
            selectors: {},
            extractionRules: {},
            pagination: null,
            requiresAuth: false,
            requiresJS: false
        };

        // Detect if page requires authentication
        patterns.requiresAuth = this.detectAuthRequired($);

        // Detect if page requires JavaScript
        patterns.requiresJS = this.detectJSRequired($);

        // Detect primary content structure (table, list, cards, etc.)
        const contentStructure = this.detectContentStructure($);
        patterns.type = contentStructure.type;

        // Extract selectors based on detected structure
        if (contentStructure.type === 'table') {
            patterns.selectors = this.extractTableSelectors($, contentStructure.element);
        } else if (contentStructure.type === 'list') {
            patterns.selectors = this.extractListSelectors($, contentStructure.element);
        } else if (contentStructure.type === 'cards') {
            patterns.selectors = this.extractCardSelectors($, contentStructure.element);
        } else if (contentStructure.type === 'api') {
            patterns.selectors = this.detectAPIPatterns($);
        }

        // Detect pagination
        patterns.pagination = this.detectPagination($);

        // Create extraction rules
        patterns.extractionRules = this.createExtractionRules($);

        // Calculate confidence score
        const confidence = this.calculateConfidence(patterns);

        console.log(`   Pattern type: ${patterns.type}`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

        return {
            ...patterns,
            confidence,
            discoveredAt: new Date().toISOString(),
            url
        };
    }

    /**
     * Detect which platform/software the county is using
     */
    detectPlatform(html, $) {
        const htmlLower = html.toLowerCase();

        for (const [platform, patterns] of Object.entries(this.platformSignatures)) {
            for (const pattern of patterns) {
                if (pattern.test(htmlLower)) {
                    return platform;
                }
            }
        }

        // Check meta tags
        const generator = $('meta[name="generator"]').attr('content');
        if (generator) {
            for (const [platform, patterns] of Object.entries(this.platformSignatures)) {
                for (const pattern of patterns) {
                    if (pattern.test(generator)) {
                        return platform;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Detect if authentication is required
     */
    detectAuthRequired($) {
        const indicators = [
            'input[type="password"]',
            'form[action*="login"]',
            'a[href*="login"]',
            '.login-required',
            '#login-form'
        ];

        return indicators.some(selector => $(selector).length > 0);
    }

    /**
     * Detect if JavaScript is required to load content
     */
    detectJSRequired($) {
        // Check for React, Vue, Angular, or other SPA frameworks
        const jsFrameworks = [
            '#root',
            '#app',
            '[data-reactroot]',
            '[ng-app]',
            '[v-app]',
            'div[data-react-class]'
        ];

        const hasFramework = jsFrameworks.some(selector => $(selector).length > 0);

        // Check if content is very minimal (suggests client-side rendering)
        const textContent = $('body').text().trim();
        const isMinimalContent = textContent.length < 500;

        // Check for lazy loading indicators
        const hasLazyLoading = $('[data-lazy]').length > 0 || $('.lazy-load').length > 0;

        return hasFramework || (isMinimalContent && $('script').length > 5) || hasLazyLoading;
    }

    /**
     * Detect the primary content structure on the page
     */
    detectContentStructure($) {
        // Look for data tables
        const tables = $('table');
        let bestTable = null;
        let maxRows = 0;

        tables.each((i, table) => {
            const rows = $(table).find('tr').length;
            if (rows > maxRows && rows > 2) { // At least header + 2 data rows
                maxRows = rows;
                bestTable = table;
            }
        });

        if (bestTable && maxRows >= 3) {
            return { type: 'table', element: bestTable };
        }

        // Look for lists
        const lists = $('ul, ol').filter((i, list) => {
            return $(list).find('li').length >= 5;
        });

        if (lists.length > 0) {
            return { type: 'list', element: lists.first()[0] };
        }

        // Look for card-based layouts
        const cardContainers = $('.card, .property-card, [class*="card"]').parent();
        if (cardContainers.length > 0 && cardContainers.children().length >= 3) {
            return { type: 'cards', element: cardContainers[0] };
        }

        // Check for API/JSON responses
        if (this.detectAPIPatterns($)) {
            return { type: 'api', element: null };
        }

        return { type: 'unknown', element: null };
    }

    /**
     * Extract selectors from a data table
     */
    extractTableSelectors($, table) {
        const $table = $(table);
        const selectors = {};

        // Find header row
        const headerRow = $table.find('thead tr, tr').first();
        const headers = [];

        headerRow.find('th, td').each((i, cell) => {
            headers.push($(cell).text().trim().toLowerCase());
        });

        // Map headers to field types
        headers.forEach((header, index) => {
            for (const [fieldType, patterns] of Object.entries(this.fieldPatterns)) {
                for (const pattern of patterns) {
                    if (pattern.test(header)) {
                        // Generate CSS selector for this column
                        selectors[fieldType] = `tr td:nth-child(${index + 1})`;
                        break;
                    }
                }
            }
        });

        // Add table row selector
        selectors.rowSelector = `${this.getUniqueSelector($, table)} tbody tr`;

        return selectors;
    }

    /**
     * Extract selectors from a list structure
     */
    extractListSelectors($, list) {
        const $list = $(list);
        const selectors = {};
        const firstItem = $list.find('li').first();

        // Analyze first list item to find data patterns
        for (const [fieldType, patterns] of Object.entries(this.fieldPatterns)) {
            const matchingElement = firstItem.find('*').filter((i, el) => {
                const text = $(el).text().toLowerCase();
                return patterns.some(pattern => pattern.test(text));
            }).first();

            if (matchingElement.length > 0) {
                selectors[fieldType] = this.getRelativeSelector($, firstItem[0], matchingElement[0]);
            }
        }

        selectors.itemSelector = `${this.getUniqueSelector($, list)} li`;

        return selectors;
    }

    /**
     * Extract selectors from a card-based layout
     */
    extractCardSelectors($, container) {
        const $container = $(container);
        const selectors = {};
        const firstCard = $container.children().first();

        // Analyze first card to find data patterns
        for (const [fieldType, patterns] of Object.entries(this.fieldPatterns)) {
            const matchingElement = firstCard.find('*').filter((i, el) => {
                const text = $(el).text().toLowerCase();
                const classes = $(el).attr('class') || '';
                const id = $(el).attr('id') || '';

                return patterns.some(pattern =>
                    pattern.test(text) || pattern.test(classes) || pattern.test(id)
                );
            }).first();

            if (matchingElement.length > 0) {
                selectors[fieldType] = this.getRelativeSelector($, firstCard[0], matchingElement[0]);
            }
        }

        selectors.cardSelector = `${this.getUniqueSelector($, container)} > *`;

        return selectors;
    }

    /**
     * Detect if page uses API/AJAX for data loading
     */
    detectAPIPatterns($) {
        // Look for API endpoint hints in scripts
        const scripts = $('script').map((i, script) => $(script).html()).get().join('\n');

        const apiPatterns = [
            /fetch\(['"](.*?api.*?)['"]/gi,
            /axios\.(get|post)\(['"](.*?)['"]/gi,
            /\$\.ajax\({.*?url:.*?['"](.*?)['"]/gi,
            /XMLHttpRequest.*?open\(['"]\w+['"],\s*['"](.*?)['"]/gi
        ];

        const endpoints = [];
        for (const pattern of apiPatterns) {
            const matches = scripts.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) endpoints.push(match[1]);
            }
        }

        return endpoints.length > 0 ? { endpoints } : null;
    }

    /**
     * Detect pagination patterns
     */
    detectPagination($) {
        const paginationPatterns = [
            { selector: 'a[rel="next"], .next, .pagination-next', type: 'link' },
            { selector: 'button[onclick*="next"], button[class*="next"]', type: 'button' },
            { selector: '.page-item, .pagination li', type: 'numbered' },
            { selector: '[class*="load-more"]', type: 'load_more' }
        ];

        for (const pattern of paginationPatterns) {
            const elements = $(pattern.selector);
            if (elements.length > 0) {
                return {
                    type: pattern.type,
                    selector: pattern.selector,
                    maxPages: 100 // Default limit
                };
            }
        }

        return null;
    }

    /**
     * Create extraction rules for data formatting
     */
    createExtractionRules($) {
        return {
            dateFormat: this.detectDateFormat($),
            priceFormat: this.detectPriceFormat($),
            trimWhitespace: true,
            removeNewlines: true
        };
    }

    /**
     * Detect date format used on the page
     */
    detectDateFormat($) {
        const datePatterns = [
            { regex: /\d{1,2}\/\d{1,2}\/\d{4}/, format: 'MM/DD/YYYY' },
            { regex: /\d{4}-\d{2}-\d{2}/, format: 'YYYY-MM-DD' },
            { regex: /\d{1,2}-\d{1,2}-\d{4}/, format: 'MM-DD-YYYY' },
            { regex: /\w+\s+\d{1,2},\s+\d{4}/, format: 'MMMM D, YYYY' }
        ];

        const bodyText = $('body').text();

        for (const pattern of datePatterns) {
            if (pattern.regex.test(bodyText)) {
                return pattern.format;
            }
        }

        return 'MM/DD/YYYY'; // Default
    }

    /**
     * Detect price/currency format used on the page
     */
    detectPriceFormat($) {
        const bodyText = $('body').text();

        if (/\$[\d,]+\.\d{2}/.test(bodyText)) {
            return { currency: 'USD', format: '$#,###.##' };
        } else if (/[\d,]+\.\d{2}/.test(bodyText)) {
            return { currency: 'USD', format: '#,###.##' };
        }

        return { currency: 'USD', format: '$#,###.##' };
    }

    /**
     * Get a unique CSS selector for an element
     */
    getUniqueSelector($, element) {
        const $el = $(element);

        // Check for ID
        const id = $el.attr('id');
        if (id) return `#${id}`;

        // Check for unique class
        const classes = $el.attr('class');
        if (classes) {
            const classList = classes.split(' ').filter(c => c.trim());
            for (const cls of classList) {
                if ($(`.${cls}`).length === 1) {
                    return `.${cls}`;
                }
            }
        }

        // Build path selector
        const path = [];
        let current = element;

        while (current && current.tagName) {
            const tag = current.tagName.toLowerCase();
            const parent = current.parentElement;

            if (parent) {
                const siblings = Array.from(parent.children).filter(el => el.tagName === current.tagName);
                const index = siblings.indexOf(current);
                path.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index + 1})` : tag);
            } else {
                path.unshift(tag);
            }

            current = parent;
        }

        return path.join(' > ');
    }

    /**
     * Get a relative selector from parent to child
     */
    getRelativeSelector($, parent, child) {
        const $child = $(child);
        const classes = $child.attr('class');

        if (classes) {
            const classList = classes.split(' ').filter(c => c.trim())[0];
            return `.${classList}`;
        }

        const tag = child.tagName.toLowerCase();
        return tag;
    }

    /**
     * Calculate confidence score for detected patterns
     */
    calculateConfidence(patterns) {
        let score = 0;
        let maxScore = 0;

        // Platform detected (+20%)
        maxScore += 20;
        if (patterns.platform) score += 20;

        // Content structure detected (+20%)
        maxScore += 20;
        if (patterns.type && patterns.type !== 'unknown') score += 20;

        // Selectors found (+40%, weighted by number of fields)
        maxScore += 40;
        const selectorCount = Object.keys(patterns.selectors).length;
        score += Math.min(selectorCount * 5, 40);

        // Pagination detected (+10%)
        maxScore += 10;
        if (patterns.pagination) score += 10;

        // Extraction rules created (+10%)
        maxScore += 10;
        if (patterns.extractionRules) score += 10;

        return score / maxScore;
    }
}

export default AIPatternDetector;
