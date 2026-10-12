/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsIntroParser from './parsers/columns-intro.js';
import heroVideoParser from './parsers/hero-video.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import carouselActivityParser from './parsers/carousel-activity.js';
import columnsPromoParser from './parsers/columns-promo.js';
import carouselSpotlightParser from './parsers/carousel-spotlight.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/centerparcs-cleanup.js';
import sectionsTransformer from './transformers/centerparcs-sections.js';
import dmImagesTransformer from './transformers/centerparcs-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'columns-intro': columnsIntroParser,
  'hero-video': heroVideoParser,
  'cards-feature': cardsFeatureParser,
  'carousel-activity': carouselActivityParser,
  'columns-promo': columnsPromoParser,
  'carousel-spotlight': carouselSpotlightParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "activities",
  "description": "Activity category landing page (e.g. Outdoor activities): intro, video hero, activity signpost cards, age-group activity carousel, promo panel, spotlight carousel",
  "urls": [
    "https://www.centerparcs.co.uk/discover-center-parcs/activities/outdoor-activities.html"
  ],
  "blocks": [
    {
      "name": "columns-intro",
      "instances": [
        ".teaser.teaser-text:not(.cmp-teaser--extras-enabled):has(.cmp-teaser__description)"
      ]
    },
    {
      "name": "hero-video",
      "instances": [
        ".cmp-reservation-hero"
      ]
    },
    {
      "name": "cards-feature",
      "instances": [
        ".layout-container.cmp-centralized"
      ]
    },
    {
      "name": "carousel-activity",
      "instances": [
        ".cp-carousel-v2"
      ]
    },
    {
      "name": "columns-promo",
      "instances": [
        ".teaser.teaser-offer-block"
      ]
    },
    {
      "name": "carousel-spotlight",
      "instances": [
        ".multi-text-image-carousel"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Page intro",
      "selector": [
        ".teaser.teaser-text:has(h1)"
      ],
      "style": null,
      "blocks": [
        "columns-intro"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Video hero",
      "selector": [
        ".cmp-reservation-hero"
      ],
      "style": null,
      "blocks": [
        "hero-video"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Explore popular outdoor activities",
      "selector": [
        ".layout-container.responsivegrid:has(> .cmp-container > .teaser.teaser-text + .layout-container.cmp-centralized)",
        ".aem-GridColumn--default--12 > .cmp-container > .layout-container.responsivegrid:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": [
        ".teaser.teaser-text:not(:has(.cmp-teaser__description)) h2"
      ]
    },
    {
      "id": "4",
      "name": "Perfect activity by age + activity packages promo",
      "selector": [
        ".teaser.teaser-text:has(.cmp-teaser__description):has(h2)"
      ],
      "style": null,
      "blocks": [
        "columns-intro",
        "carousel-activity",
        "columns-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Included at no extra cost",
      "selector": [
        ".layout-container.cmp-centralized:has(.teaser.teaser-text)",
        ".aem-GridColumn--default--12 > .cmp-container > .layout-container.responsivegrid:nth-of-type(7)"
      ],
      "style": null,
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": [
        ".cmp-centralized .teaser.teaser-text h2"
      ]
    },
    {
      "id": "6",
      "name": "Forest Summer Social feature",
      "selector": [
        ".multi-text-image-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel-spotlight"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "Even more to explore",
      "selector": [
        ".aem-GridColumn--default--12 > .cmp-container > .layout-container.responsivegrid:nth-of-type(9)"
      ],
      "style": null,
      "blocks": [
        "columns-intro",
        "cards-feature"
      ],
      "defaultContent": []
    }
  ]
};


// TRANSFORMER REGISTRY - cleanup first, then sections, DM image rewrite last
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

export default {
  /**
   * Scroll through the page so lazy-rendered components (carousels, gallery
   * images) mount before transform.
   */
  onLoad: async ({ document }) => {
    const win = document.defaultView || window;
    const step = Math.max(400, Math.floor(win.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      win.scrollTo(0, y);
      await sleep(250);
    }
    win.scrollTo(0, 0);
    await sleep(500);
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced/detached)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup, section metadata, DM images)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path - the root URL maps to the index page
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
