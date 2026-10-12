/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-activities.js
  var import_activities_exports = {};
  __export(import_activities_exports, {
    default: () => import_activities_default
  });

  // tools/importer/parsers/columns-intro.js
  function isBlank(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4") || teaser.querySelector("h1, h2, h3");
    const col1 = [];
    if (heading) col1.push(heading);
    const strapline = teaser.querySelector(".cmp-teaser__strapline");
    if (strapline && !isBlank(strapline)) {
      const p = document2.createElement("p");
      p.innerHTML = strapline.innerHTML;
      col1.push(p);
    }
    const desc = teaser.querySelector(".cmp-teaser__description");
    const col2 = [];
    if (desc) {
      const kids = Array.from(desc.children).filter((c) => !isBlank(c));
      if (kids.length) {
        col2.push(...kids);
      } else if (!isBlank(desc)) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML;
        col2.push(p);
      }
    }
    teaser.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      col2.push(p);
    });
    if (!col1.length && !col2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[col1, col2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", variants: ["intro"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-video.js
  var S7_HOST = "https://centerparcs.scene7.com";
  function getVideoUrl(element) {
    const direct = Array.from(element.querySelectorAll("video[src], video source[src]")).map((v) => v.getAttribute("src")).find((src) => src && !src.startsWith("blob:"));
    if (direct) return direct;
    const holder = element.querySelector("[data-video-asset]");
    const asset = holder ? (holder.getAttribute("data-video-asset") || "").trim() : "";
    if (!asset) return "";
    if (/^https?:\/\//i.test(asset)) return asset;
    const mp4Asset = /-AVS$/i.test(asset) ? asset.replace(/-AVS$/i, "-0x720-4000k") : asset;
    return `${S7_HOST}/is/content/${mp4Asset.split("/").map((s) => encodeURIComponent(s)).join("/")}`;
  }
  function parse2(element, { document: document2 }) {
    const poster = element.querySelector(".cmp-teaser__image img.cmp-image__image") || element.querySelector('.cmp-image img, .cmp-teaser__image img:not([src*="s7viewers"])');
    const content = element.querySelector(".cmp-teaser__content");
    const textEls = content ? Array.from(content.querySelectorAll("h1, h2, h3, h4, h5, h6, p")).filter((e) => e.textContent.trim()) : [];
    const videoUrl = getVideoUrl(element);
    if (!poster && !videoUrl && !textEls.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (poster) {
      const img = document2.createElement("img");
      img.src = poster.getAttribute("src");
      img.alt = poster.getAttribute("alt") || "";
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:image "));
      frag.appendChild(img);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    if (videoUrl) {
      const a = document2.createElement("a");
      a.href = videoUrl;
      a.textContent = videoUrl;
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:video "));
      frag.appendChild(a);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    if (textEls.length) {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:text "));
      textEls.forEach((e) => frag.appendChild(e));
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function isBlank2(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse3(element, { document: document2 }) {
    const signposts = Array.from(element.querySelectorAll(".cmp-signpost"));
    const headings = [];
    if (signposts.length) {
      element.querySelectorAll(".teaser.teaser-text").forEach((t) => {
        if (t.closest(".cmp-signpost")) return;
        const h = t.querySelector("h1, h2, h3, h4, h5, h6");
        if (h) headings.push(h);
        t.remove();
      });
    }
    let teasers = signposts.length ? signposts.map((s) => s.querySelector(".cmp-teaser") || s) : Array.from(element.querySelectorAll(".cmp-teaser"));
    if (!teasers.length) teasers = Array.from(element.querySelectorAll(".cmp-signpost, .teaser"));
    const cells = [];
    teasers.forEach((teaser) => {
      const img = teaser.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img");
      const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4") || teaser.querySelector("h2, h3, h4");
      const desc = teaser.querySelector(".cmp-teaser__description");
      const links = Array.from(teaser.querySelectorAll(".cmp-teaser__action-container a[href]"));
      if (!img && !heading && !desc) return;
      const imageCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || "";
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const content = [];
      if (heading) content.push(heading);
      if (desc) {
        const kids = Array.from(desc.children).filter((c) => !isBlank2(c));
        if (kids.length) content.push(...kids);
        else if (!isBlank2(desc)) {
          const p = document2.createElement("p");
          p.innerHTML = desc.innerHTML;
          content.push(p);
        }
      }
      links.forEach((a) => {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = a.textContent.trim();
        const p = document2.createElement("p");
        p.append(link);
        content.push(p);
      });
      const textCell = document2.createDocumentFragment();
      if (content.length) {
        textCell.appendChild(document2.createComment(" field:text "));
        content.forEach((c) => textCell.appendChild(c));
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...headings, ...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-feature", cells });
    element.replaceWith(...headings, block);
  }

  // tools/importer/parsers/carousel-activity.js
  function clean(t) {
    return (t || "").replace(/[\s ]+/g, " ").trim();
  }
  function parse4(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".cmp-carousel__item:not(.swiper-slide-duplicate)"));
    if (!items.length) items = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    items.forEach((item) => {
      var _a;
      const img = item.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img");
      const cta = item.querySelector(".cmp-teaser__action-container a[href], a.cmp-teaser__action-link[href], a[href]");
      const title = clean((_a = item.querySelector(".cmp-teaser__title")) == null ? void 0 : _a.textContent);
      if (!img && !cta) return;
      const imageCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || "";
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const linkCell = document2.createDocumentFragment();
      if (cta) {
        const a = document2.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = clean(cta.textContent) || title;
        linkCell.appendChild(document2.createComment(" field:link "));
        linkCell.appendChild(a);
      }
      cells.push([imageCell, linkCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-activity", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function isBlank3(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse5(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const imgSrc = teaser.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img");
    const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3") || teaser.querySelector("h2, h3");
    const desc = teaser.querySelector(".cmp-teaser__description");
    let imageCol = "";
    if (imgSrc) {
      const img = document2.createElement("img");
      img.src = imgSrc.getAttribute("src");
      img.alt = imgSrc.getAttribute("alt") || "";
      imageCol = img;
    }
    const headingCol = heading ? [heading] : "";
    const textCol = [];
    if (desc) {
      const kids = Array.from(desc.children).filter((c) => !isBlank3(c));
      if (kids.length) textCol.push(...kids);
      else if (!isBlank3(desc)) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML;
        textCol.push(p);
      }
    }
    teaser.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      textCol.push(p);
    });
    if (!imgSrc && !heading && !textCol.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[imageCol, headingCol, textCol.length ? textCol : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", variants: ["promo"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-spotlight.js
  function clean2(t) {
    return (t || "").replace(/[\s ]+/g, " ").trim();
  }
  function isBlank4(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse6(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".multi-text-image-carousel-main-visual .cmp-carousel__item:not(.swiper-slide-duplicate)"));
    if (!slides.length) slides = Array.from(element.querySelectorAll(".cmp-carousel__item:not(.swiper-slide-duplicate)"));
    if (!slides.length) slides = [element.querySelector(".multi-text-image-carousel-layout") || element];
    const panel = element.querySelector(".multi-text-image-carousel-text__inner");
    const cells = [];
    slides.forEach((slide) => {
      const teaser = slide.querySelector(".cmp-teaser") || slide;
      const img = teaser.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img") || slide.querySelector("img");
      const textSrc = teaser.querySelector(".cmp-teaser__title, .cmp-teaser__description") ? teaser : panel || teaser;
      const heading = textSrc.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title");
      const pretitle = textSrc.querySelector(".cmp-teaser__pretitle");
      const desc = textSrc.querySelector(".cmp-teaser__description");
      const links = Array.from(textSrc.querySelectorAll(".cmp-teaser__action-container a[href]"));
      if (!img && !heading) return;
      const mediaCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || "";
        mediaCell.appendChild(document2.createComment(" field:media_image "));
        mediaCell.appendChild(image);
      }
      const content = [];
      if (heading && clean2(heading.textContent)) {
        const h2 = document2.createElement("h2");
        h2.textContent = clean2(heading.textContent);
        content.push(h2);
      }
      if (pretitle && clean2(pretitle.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean2(pretitle.textContent);
        content.push(p);
      }
      if (desc) {
        const kids = Array.from(desc.children).filter((c) => !isBlank4(c));
        if (kids.length) content.push(...kids);
        else if (!isBlank4(desc)) {
          const p = document2.createElement("p");
          p.innerHTML = desc.innerHTML;
          content.push(p);
        }
      }
      links.forEach((a) => {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = clean2(a.textContent);
        const p = document2.createElement("p");
        p.append(link);
        content.push(p);
      });
      const contentCell = document2.createDocumentFragment();
      if (content.length) {
        contentCell.appendChild(document2.createComment(" field:content_text "));
        content.forEach((c) => contentCell.appendChild(c));
      }
      cells.push([mediaCell, contentCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-spotlight", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/centerparcs-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function isBlank5(el) {
    if (el.querySelector("img, picture, video, iframe, a[href], table")) return false;
    return el.textContent.replace(/[\s ]+/g, "") === "";
  }
  var TRACKING_PIXEL_PATTERN = /(bidr\.io|bat\.bing\.com|bing\.com\/action|doubleclick\.net|googleadservices\.com|google\.[a-z.]+\/pagead|googlesyndication\.com|google-analytics\.com|googletagmanager\.com|analytics\.google\.com|facebook\.com\/tr|facebook\.net|connect\.facebook|linkedin\.com\/px|px\.ads\.linkedin|ads\.linkedin|t\.co\/i\/adsct|analytics\.twitter\.com|ads-twitter\.com|analytics\.tiktok\.com|pinterest\.com\/v3|ct\.pinterest|adsrvr\.org|criteo\.(com|net)|taboola\.com|outbrain\.com|quantserve\.com|scorecardresearch\.com|demdex\.net|everesttech\.net|omtrdc\.net|2o7\.net|adnxs\.com|rlcdn\.com|clarity\.ms|hotjar\.com|snapchat\.com|sc-static\.net|yahoo\.com\/(p|sync)|\/pixel(\.gif|\.png)?([/?]|$)|\/beacon([/?.]|$))/i;
  function isTrackingPixel(img) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (TRACKING_PIXEL_PATTERN.test(src)) return true;
    const w = (img.getAttribute("width") || "").trim();
    const h = (img.getAttribute("height") || "").trim();
    const isTiny = /^[01](px)?$/.test(w) && /^[01](px)?$/.test(h);
    const style = (img.getAttribute("style") || "").replace(/\s+/g, "").toLowerCase();
    const isHidden = style.includes("display:none") || style.includes("visibility:hidden");
    const styleTiny = /(^|;)width:[01]px/.test(style) && /(^|;)height:[01]px/.test(style);
    return isTiny || styleTiny || isHidden && /^https?:/i.test(src) && !/scene7\.com|centerparcs\.co\.uk/i.test(src);
  }
  function flattenTitleHeadings(element) {
    element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      var _a;
      if (h.querySelector("a, img, picture")) return;
      const table = h.closest("table");
      const level = Number(h.tagName[1]);
      const runs = [...h.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
      const singleRun = runs.length === 1 && runs[0].nodeType === 1 && /^(STRONG|B|EM|I|SPAN)$/.test(runs[0].tagName);
      const blockName = table ? (((_a = table.querySelector("tr")) == null ? void 0 : _a.textContent) || "").trim() : "";
      const inColumns = /^columns\b/i.test(blockName);
      if (!table && level <= 2 || inColumns && singleRun) {
        h.textContent = h.textContent.replace(/\s+/g, " ").trim();
      }
    });
  }
  function removeTrackingPixels(element) {
    element.querySelectorAll("img").forEach((img) => {
      if (!isTrackingPixel(img)) return;
      const parent = img.parentElement;
      img.remove();
      if (parent && parent !== element && /^(A|SPAN|P|NOSCRIPT|PICTURE)$/.test(parent.tagName) && !parent.children.length && parent.textContent.trim() === "") {
        parent.remove();
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      removeTrackingPixels(element);
      WebImporter.DOMUtils.remove(element, [
        // OneTrust cookie consent banner + preference centre: <div id="onetrust-consent-sdk">
        "#onetrust-consent-sdk",
        // CXone chat widget: <div id="cxone-guide-container" class="svelte-g3ommg">
        "#cxone-guide-container",
        // Chat widget storage iframe: <iframe src="https://web-modules-de-uk1.niceincontact.com/...">
        'iframe[src*="niceincontact.com"]',
        // Activity itinerary modal iframe (inside header): <iframe id="itineraryIframe">
        "#itineraryIframe",
        // Booking search widget inside the hero (live app): <div class="searchbar parbase">
        ".cmp-reservation-hero .searchbar",
        // Scene7 video viewer chrome inside the hero (sprites, share panel, controls, play/pause)
        ".cmp-reservation-hero .s7socialshare",
        ".cmp-reservation-hero .s7controlbar",
        ".cmp-reservation-hero #discover-button-container",
        // Loading skeleton placeholders: <div class="village-location-skeleton">
        ".village-location-skeleton"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global header wrapper: <div class="header aem-GridColumn ..."> containing <header class="header">
        ".header.aem-GridColumn",
        "header.header",
        // Basket flyout (Vue template) that follows the header: <div class="header__basket">
        ".header__basket",
        "#v-basket-bundle",
        "#v-basket-expiry",
        // Skip-link anchor: <a id="maincontent">
        "a#maincontent",
        // Global footer experience fragment: <div class="experiencefragment uxp-component cmp-container--footer ...">
        ".experiencefragment.cmp-container--footer",
        // Hidden JSON config blob and login template
        "#important-data",
        "template",
        // DoubleClick Floodlight tracking iframes and Google ActiveView elements
        'iframe[src*="doubleclick.net"]',
        ".GoogleActiveViewElement",
        // Scene7 viewer placeholder spans: <span id="s7classic_0">
        'span[id^="s7classic_"]',
        // OneTrust leftovers (if re-injected)
        "#onetrust-consent-sdk",
        "#cxone-guide-container",
        // Safe generic removals
        "iframe",
        "link",
        "noscript",
        "script",
        "style"
      ]);
      removeTrackingPixels(element);
      flattenTitleHeadings(element);
      element.querySelectorAll(".text-core").forEach((tc) => {
        if (isBlank5(tc)) tc.remove();
      });
      element.querySelectorAll(".cmp-text > p, .cmp-text > h1, .cmp-text > h2, .cmp-text > h3, .cmp-text > h4, .cmp-text > h5, .cmp-text > h6").forEach((el) => {
        if (isBlank5(el)) el.remove();
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-cmp-") || n.startsWith("on") || n.startsWith("v-") || n.startsWith(":") || n.startsWith("@")) {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/centerparcs-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/transformers/centerparcs-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    if (typeof urlStr !== "string") return false;
    if (!/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-activities.js
  var parsers = {
    "columns-intro": parse,
    "hero-video": parse2,
    "cards-feature": parse3,
    "carousel-activity": parse4,
    "columns-promo": parse5,
    "carousel-spotlight": parse6
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
  var import_activities_default = {
    /**
     * Scroll through the page so lazy-rendered components (carousels, gallery
     * images) mount before transform.
     */
    onLoad: (_0) => __async(void 0, [_0], function* ({ document: document2 }) {
      const win = document2.defaultView || window;
      const step = Math.max(400, Math.floor(win.innerHeight * 0.8));
      for (let y = 0; y < document2.body.scrollHeight; y += step) {
        win.scrollTo(0, y);
        yield sleep(250);
      }
      win.scrollTo(0, 0);
      yield sleep(500);
    }),
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_activities_exports);
})();
