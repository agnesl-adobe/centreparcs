/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroNotificationParser from './parsers/hero-notification.js';
import columnsOfferParser from './parsers/columns-offer.js';
import heroVideoParser from './parsers/hero-video.js';
import tabsVillageParser from './parsers/tabs-village.js';
import carouselLodgesParser from './parsers/carousel-lodges.js';
import columnsIntroParser from './parsers/columns-intro.js';
import cardsExpandParser from './parsers/cards-expand.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import carouselActivityParser from './parsers/carousel-activity.js';
import columnsPromoParser from './parsers/columns-promo.js';
import accordionFaqParser from './parsers/accordion-faq.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/centerparcs-cleanup.js';
import sectionsTransformer from './transformers/centerparcs-sections.js';
import dmImagesTransformer from './transformers/centerparcs-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-notification': heroNotificationParser,
  'columns-offer': columnsOfferParser,
  'hero-video': heroVideoParser,
  'tabs-village': tabsVillageParser,
  'carousel-lodges': carouselLodgesParser,
  'columns-intro': columnsIntroParser,
  'cards-expand': cardsExpandParser,
  'cards-feature': cardsFeatureParser,
  'carousel-activity': carouselActivityParser,
  'columns-promo': columnsPromoParser,
  'accordion-faq': accordionFaqParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "Center Parcs UK homepage",
  "urls": [
    "https://www.centerparcs.co.uk/"
  ],
  "blocks": [
    {
      "name": "hero-notification",
      "instances": [
        ".notifications .notification"
      ]
    },
    {
      "name": "columns-offer",
      "instances": [
        ".teaser.cmp-teaser--extras-enabled"
      ]
    },
    {
      "name": "hero-video",
      "instances": [
        ".cmp-reservation-hero"
      ]
    },
    {
      "name": "tabs-village",
      "instances": [
        ".village-location .cmp-village-location"
      ]
    },
    {
      "name": "carousel-lodges",
      "instances": [
        ".accommodation-gallery-carousel"
      ]
    },
    {
      "name": "columns-intro",
      "instances": [
        ".teaser.teaser-text:not(.cmp-teaser--extras-enabled):has(.cmp-teaser__description)"
      ]
    },
    {
      "name": "cards-expand",
      "instances": [
        ".expandable-cross-sell"
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
      "name": "accordion-faq",
      "instances": [
        ".tabs-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Notification bar",
      "selector": [
        ".notifications"
      ],
      "style": null,
      "blocks": [
        "hero-notification"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Page intro + time-limited offer",
      "selector": [
        ".teaser.cmp-teaser--extras-enabled"
      ],
      "style": "grey",
      "blocks": [
        "columns-offer"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Video hero with booking search",
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
      "id": "4",
      "name": "Villages map",
      "selector": [
        ".village-location"
      ],
      "style": "green",
      "blocks": [
        "tabs-village"
      ],
      "defaultContent": [
        ".village-location__content"
      ]
    },
    {
      "id": "5",
      "name": "Accommodation gallery",
      "selector": [
        ".accommodation-gallery-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel-lodges"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "Things to do",
      "selector": [
        ".teaser.teaser-text:has(+ .expandable-cross-sell)"
      ],
      "style": null,
      "blocks": [
        "columns-intro",
        "cards-expand"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "Seasonal breaks",
      "selector": [
        ".teaser.teaser-text:has(.cmp-teaser__description):has(+ .cmp-centralized)"
      ],
      "style": null,
      "blocks": [
        "columns-intro",
        "cards-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "Activities",
      "selector": [
        ".teaser.teaser-text:has(+ .cp-carousel-v2)"
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
      "id": "9",
      "name": "Discover more",
      "selector": [
        ".teaser.teaser-text:not(.cmp-teaser--extras-enabled):not(:has(.cmp-teaser__description))"
      ],
      "style": null,
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": [
        ".teaser.teaser-text:not(.cmp-teaser--extras-enabled):not(:has(.cmp-teaser__description)) .cmp-teaser__title"
      ]
    },
    {
      "id": "10",
      "name": "FAQ",
      "selector": [
        ".cmp-container > .layout-container.responsivegrid:not(.aem-GridColumn):has(.tabs-container)"
      ],
      "style": null,
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        ".cmp-container > .layout-container.responsivegrid:not(.aem-GridColumn):has(.tabs-container) .text-core h2"
      ]
    },
    {
      "id": "11",
      "name": "Terms & Conditions",
      "selector": [
        ".aem-GridColumn > .cmp-container > .text-core.text:has(+ .tabs-container)"
      ],
      "style": null,
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        ".aem-GridColumn > .cmp-container > .text-core.text:has(+ .tabs-container) .cmp-text"
      ]
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
   * Scroll through the page so lazy-rendered components (village explorer,
   * carousels) mount before transform, then wait for the village markup.
   */
  onLoad: async ({ document }) => {
    const win = document.defaultView || window;
    const step = Math.max(400, Math.floor(win.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      win.scrollTo(0, y);
      await sleep(250);
    }
    const start = Date.now();
    while (!document.querySelector('.village-location .cmp-village-location .village-location-teaser') && Date.now() - start < 15000) {
      const village = document.querySelector('.village-location');
      if (village) village.scrollIntoView();
      await sleep(500);
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
