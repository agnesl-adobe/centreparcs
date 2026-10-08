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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-notification.js
  function parse(element, { document: document2 }) {
    const copy = element.querySelector(".notification__copy") || element;
    let paragraphs = Array.from(copy.querySelectorAll(":scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > ul, :scope > ol"));
    if (!paragraphs.length) {
      const text = copy.textContent.replace(/\s+/g, " ").trim();
      if (text) {
        const p = document2.createElement("p");
        p.append(...Array.from(copy.childNodes).filter((n) => !(n.nodeType === 1 && n.matches("button, .notification__icon, .notification__dismiss"))));
        paragraphs = [p];
      }
    }
    if (!paragraphs.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textCell = document2.createDocumentFragment();
    textCell.appendChild(document2.createComment(" field:text "));
    paragraphs.forEach((p) => textCell.appendChild(p));
    const cells = [[textCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-notification", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-offer.js
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function getEndDate(countdown) {
    if (!countdown) return "";
    const raw = countdown.getAttribute("data-target-date") || countdown.getAttribute("data-end-date") || countdown.getAttribute("data-date") || "";
    const m = raw.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (m) return `${m[1]}T${m[2]}`;
    const d = raw.match(/\d{4}-\d{2}-\d{2}/);
    if (d) return `${d[0]}T23:59`;
    const units = {};
    countdown.querySelectorAll(".cmp-countdown__unit").forEach((u) => {
      var _a, _b;
      const label = (((_a = u.querySelector(".cmp-countdown__unit-label")) == null ? void 0 : _a.textContent) || "").trim().toLowerCase();
      const value = parseInt(((_b = u.querySelector(".cmp-countdown__value")) == null ? void 0 : _b.textContent) || "", 10);
      if (label && !Number.isNaN(value)) units[label] = value;
    });
    if (!Object.keys(units).length) return "";
    const ms = ((units.days || 0) * 86400 + (units.hours || 0) * 3600 + (units.minutes || 0) * 60 + (units.seconds || 0)) * 1e3;
    const end = new Date(Date.now() + ms);
    return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }
  function isBlank(el) {
    return !el.querySelector("img, a") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse2(element, { document: document2 }) {
    var _a;
    const headline = element.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title") || element.querySelector("h1, h2");
    const col1 = [];
    if (headline) col1.push(headline);
    const strapline = element.querySelector(".cmp-teaser__strapline");
    if (strapline && !isBlank(strapline)) col1.push(...strapline.children);
    const countdown = element.querySelector(".cmp-countdown");
    const col2 = [];
    if (countdown) {
      const title = countdown.querySelector(".cmp-countdown__title");
      if (title) {
        Array.from(title.children).forEach((c) => {
          if (!isBlank(c)) col2.push(c);
        });
      }
      const desc = countdown.querySelector(".cmp-countdown__description");
      if (desc) {
        Array.from(desc.children).forEach((c) => {
          if (!isBlank(c)) col2.push(c);
        });
      }
      const endDate = getEndDate(countdown);
      if (endDate) {
        const labelText = (((_a = countdown.querySelector(".cmp-countdown__remaining-label")) == null ? void 0 : _a.textContent) || "Offer ends").trim();
        const p = document2.createElement("p");
        p.textContent = `${labelText} ${endDate}`;
        col2.push(p);
      }
      const ctas = Array.from(countdown.querySelectorAll(".cmp-countdown__actions a[href]"));
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        col2.push(p);
      });
      const terms = Array.from(countdown.querySelectorAll(".cmp-countdown__terms_and_conditions a[href]"));
      terms.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        col2.push(p);
      });
    } else {
      const extras = element.querySelector(".cmp-teaser__extras");
      if (extras) col2.push(...Array.from(extras.querySelectorAll("h2, h3, h4, p, a[href]")).filter((e) => !isBlank(e) && !e.closest("p")));
    }
    col2.forEach((e, i) => {
      if (/^H[3-6]$/.test(e.tagName)) {
        const h2 = document2.createElement("h2");
        h2.innerHTML = e.innerHTML;
        col2[i] = h2;
      }
    });
    if (!col1.length && !col2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[col1, col2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", variants: ["offer"], cells });
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
  function parse3(element, { document: document2 }) {
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

  // tools/importer/parsers/tabs-village.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  var SITE_ORIGIN = "https://www.centerparcs.co.uk";
  var JCR_PREFIX = "/content/centerparcs/uk/en";
  function publicUrl(href) {
    if (!href) return href;
    let url;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch (e) {
      return href;
    }
    if (!url.pathname.startsWith(`${JCR_PREFIX}/`) && url.pathname !== JCR_PREFIX) return href;
    let path = url.pathname.slice(JCR_PREFIX.length) || "/";
    if (path !== "/" && !/\.[a-z0-9]+$/i.test(path)) path = `${path.replace(/\/$/, "")}.html`;
    return `${SITE_ORIGIN}${path}${url.search}${url.hash}`;
  }
  function isBlank2(el) {
    return !el.querySelector("img, a[href]") && clean(el.textContent.replace(/ /g, " ")) === "";
  }
  function htmlToNodes(document2, html) {
    const div = document2.createElement("div");
    div.innerHTML = html;
    return Array.from(div.childNodes).filter((n) => n.nodeType === 1 || clean(n.textContent));
  }
  function buildIntro(element, document2) {
    const nodes = [];
    const intro = element.querySelector(".village-location__content");
    const wrapper = element.closest("[data-block-title]");
    let headingSrc = null;
    if (intro) {
      const hs = Array.from(intro.querySelectorAll("h1, h2, h3")).filter((h) => clean(h.textContent));
      headingSrc = hs.find((h) => !h.querySelector("h1, h2, h3")) || hs[0] || null;
    }
    if (headingSrc) {
      const h2 = document2.createElement("h2");
      h2.innerHTML = headingSrc.innerHTML;
      nodes.push(h2);
    } else if (wrapper && wrapper.getAttribute("data-block-title")) {
      const parsed = htmlToNodes(document2, wrapper.getAttribute("data-block-title"));
      const h = parsed.find((n) => n.nodeType === 1 && /^H\d$/.test(n.tagName));
      if (h) {
        const h2 = document2.createElement("h2");
        h2.innerHTML = h.innerHTML;
        nodes.push(h2);
      }
    }
    let paras = intro ? Array.from(intro.querySelectorAll("p")).filter((p) => !p.querySelector("p") && !isBlank2(p)) : [];
    if (!paras.length && wrapper && wrapper.getAttribute("data-block-description")) {
      paras = htmlToNodes(document2, wrapper.getAttribute("data-block-description")).filter((n) => n.nodeType === 1 && !isBlank2(n));
    }
    nodes.push(...paras);
    let cta = intro ? intro.querySelector("a.village-location__button[href], a[href]") : null;
    if (!cta && wrapper && wrapper.getAttribute("data-block-cta-link")) {
      cta = document2.createElement("a");
      cta.href = wrapper.getAttribute("data-block-cta-link");
      cta.textContent = wrapper.getAttribute("data-block-cta-label") || "Explore all villages";
    }
    if (cta) {
      const a = document2.createElement("a");
      a.href = publicUrl(cta.getAttribute("href"));
      a.textContent = clean(cta.textContent);
      const p = document2.createElement("p");
      p.append(a);
      nodes.push(p);
    }
    const note = element.querySelector(".village-location__notification");
    if (note) {
      const title = note.querySelector(".village-location__notification-title, h3, h4, h5");
      if (title && clean(title.textContent)) {
        const h3 = document2.createElement("h3");
        h3.textContent = clean(title.textContent);
        nodes.push(h3);
      }
      Array.from(note.querySelectorAll("p")).filter((p) => !isBlank2(p) && !p.matches(".village-location__notification-title")).forEach((p) => nodes.push(p));
    } else if (wrapper && wrapper.getAttribute("data-block-notification-label")) {
      const h3 = document2.createElement("h3");
      h3.textContent = clean(wrapper.getAttribute("data-block-notification-label"));
      nodes.push(h3);
      const desc = wrapper.getAttribute("data-block-notification-description");
      if (desc) nodes.push(...htmlToNodes(document2, desc).filter((n) => n.nodeType === 1 && !isBlank2(n)));
    }
    return nodes;
  }
  function parse4(element, { document: document2 }) {
    const introNodes = buildIntro(element, document2);
    let items = Array.from(element.querySelectorAll(".village-location-teaser__item"));
    if (!items.length) items = Array.from(element.querySelectorAll(".cmp-signpost, .village-location-teaser .cmp-teaser"));
    const cells = [];
    items.forEach((item) => {
      var _a, _b;
      const name = clean((_a = item.querySelector(".cmp-teaser__title, h3, h4")) == null ? void 0 : _a.textContent);
      const location = clean((_b = item.querySelector(".cmp-teaser__location-text, .cmp-teaser__location")) == null ? void 0 : _b.textContent);
      const descEl = item.querySelector(".cmp-teaser__description");
      const img = item.querySelector(".cmp-teaser__image img, img");
      const cta = item.querySelector("a.cmp-teaser__action-link[href]") || Array.from(item.querySelectorAll("a[href]")).find((a) => !a.classList.contains("village-location__button"));
      if (!name && !descEl && !img) return;
      const labelCell = document2.createDocumentFragment();
      labelCell.appendChild(document2.createComment(" field:title "));
      const pName = document2.createElement("p");
      pName.textContent = name;
      labelCell.appendChild(pName);
      if (location) {
        const pLoc = document2.createElement("p");
        pLoc.textContent = location;
        labelCell.appendChild(pLoc);
      }
      const panelCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || name;
        panelCell.appendChild(document2.createComment(" field:content_image "));
        panelCell.appendChild(image);
      }
      if (name) {
        const h3 = document2.createElement("h3");
        h3.textContent = name;
        panelCell.appendChild(document2.createComment(" field:content_heading "));
        panelCell.appendChild(h3);
      }
      const rich = [];
      if (location) {
        const p = document2.createElement("p");
        p.textContent = location;
        rich.push(p);
      }
      if (descEl && clean(descEl.textContent)) {
        const p = document2.createElement("p");
        p.innerHTML = descEl.innerHTML.trim();
        rich.push(p);
      }
      if (cta) {
        const a = document2.createElement("a");
        a.href = publicUrl(cta.getAttribute("href"));
        a.textContent = clean(cta.textContent);
        const p = document2.createElement("p");
        p.append(a);
        rich.push(p);
      }
      if (rich.length) {
        panelCell.appendChild(document2.createComment(" field:content_richtext "));
        rich.forEach((r) => panelCell.appendChild(r));
      }
      cells.push([labelCell, panelCell]);
    });
    if (!cells.length) {
      if (introNodes.length) element.replaceWith(...introNodes);
      else element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-village", cells });
    if (introNodes.length) element.before(...introNodes);
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-lodges.js
  function clean2(t) {
    return (t || "").replace(/[\s ]+/g, " ").trim();
  }
  function parse5(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item:not(.swiper-slide-duplicate)"));
    if (!slides.length) slides = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    slides.forEach((slide) => {
      const teaser = slide.querySelector(".cmp-teaser") || slide;
      const img = teaser.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img");
      const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title");
      const pretitle = teaser.querySelector(".cmp-teaser__pretitle");
      const tags = Array.from(teaser.querySelectorAll(".cmp-teaser__tags-item, .cp-feature-icons__item"));
      const descEls = Array.from(teaser.querySelectorAll(".cmp-teaser__description > p, .cmp-teaser__description > ul"));
      const desc = teaser.querySelector(".cmp-teaser__description");
      const links = Array.from(teaser.querySelectorAll(".cmp-teaser__action-container a[href]"));
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
      if (heading) {
        const h2 = document2.createElement("h2");
        h2.textContent = clean2(heading.textContent);
        content.push(h2);
      }
      if (pretitle && clean2(pretitle.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean2(pretitle.textContent);
        content.push(p);
      }
      if (tags.length) {
        const ul = document2.createElement("ul");
        tags.forEach((t) => {
          const label = clean2((t.querySelector(".cmp-teaser__tags-title, .cp-feature-icons__title") || t).textContent);
          if (!label) return;
          const li = document2.createElement("li");
          const icon = t.querySelector("img.cmp-teaser__tags-icon, img.cp-feature-icons__img, img");
          const iconSrc = icon && (icon.getAttribute("src") || icon.getAttribute("data-src"));
          if (iconSrc) {
            const iconLink = document2.createElement("a");
            iconLink.href = iconSrc;
            iconLink.textContent = label;
            li.append(iconLink);
          } else {
            li.append(label);
          }
          ul.append(li);
        });
        if (ul.children.length) content.push(ul);
      }
      if (descEls.length) {
        descEls.filter((e) => clean2(e.textContent)).forEach((e) => content.push(e));
      } else if (desc && clean2(desc.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean2(desc.textContent);
        content.push(p);
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-lodges", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-intro.js
  function isBlank3(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse6(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4") || teaser.querySelector("h1, h2, h3");
    const col1 = [];
    if (heading) col1.push(heading);
    const strapline = teaser.querySelector(".cmp-teaser__strapline");
    if (strapline && !isBlank3(strapline)) {
      const p = document2.createElement("p");
      p.innerHTML = strapline.innerHTML;
      col1.push(p);
    }
    const desc = teaser.querySelector(".cmp-teaser__description");
    const col2 = [];
    if (desc) {
      const kids = Array.from(desc.children).filter((c) => !isBlank3(c));
      if (kids.length) {
        col2.push(...kids);
      } else if (!isBlank3(desc)) {
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

  // tools/importer/parsers/cards-expand.js
  function isBlank4(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse7(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!items.length) items = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    items.forEach((item) => {
      const teaser = item.querySelector(".cmp-teaser") || item;
      const img = teaser.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img");
      const heading = teaser.querySelector(".cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4");
      const titleBox = teaser.querySelector(".cmp-teaser__title");
      const desc = teaser.querySelector(".cmp-teaser__description");
      const links = Array.from(teaser.querySelectorAll(".cmp-teaser__action-container a[href]"));
      if (!img && !heading && !titleBox) return;
      const imageCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || "";
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const content = [];
      if (heading) {
        content.push(heading);
      } else if (titleBox && !isBlank4(titleBox)) {
        const h3 = document2.createElement("h3");
        h3.textContent = titleBox.textContent.trim();
        content.push(h3);
      }
      const strap = teaser.querySelector(".cmp-teaser__strapline");
      if (strap && !isBlank4(strap)) {
        const p = document2.createElement("p");
        p.innerHTML = strap.innerHTML;
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
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-expand", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function isBlank5(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse8(element, { document: document2 }) {
    let teasers = Array.from(element.querySelectorAll(".cmp-teaser"));
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
        const kids = Array.from(desc.children).filter((c) => !isBlank5(c));
        if (kids.length) content.push(...kids);
        else if (!isBlank5(desc)) {
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
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-activity.js
  function clean3(t) {
    return (t || "").replace(/[\s ]+/g, " ").trim();
  }
  function parse9(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".cmp-carousel__item:not(.swiper-slide-duplicate)"));
    if (!items.length) items = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    items.forEach((item) => {
      var _a;
      const img = item.querySelector(".cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img");
      const cta = item.querySelector(".cmp-teaser__action-container a[href], a.cmp-teaser__action-link[href], a[href]");
      const title = clean3((_a = item.querySelector(".cmp-teaser__title")) == null ? void 0 : _a.textContent);
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
        a.textContent = clean3(cta.textContent) || title;
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
  function isBlank6(el) {
    return !el.querySelector("img, a[href]") && el.textContent.replace(/[\s ]+/g, "") === "";
  }
  function parse10(element, { document: document2 }) {
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
      const kids = Array.from(desc.children).filter((c) => !isBlank6(c));
      if (kids.length) textCol.push(...kids);
      else if (!isBlank6(desc)) {
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

  // tools/importer/parsers/accordion-faq.js
  function clean4(t) {
    return (t || "").replace(/[\s ]+/g, " ").trim();
  }
  function isBlank7(el) {
    return !el.querySelector('img, a[href]:not([href="#"]), table') && clean4(el.textContent) === "";
  }
  var CONTENT_SEL = "p, ul, ol, h2, h3, h4, h5, h6, table, blockquote";
  function answerNodes(content, document2) {
    if (!content) return [];
    const containers = Array.from(content.querySelectorAll(".cmp-text"));
    const roots = containers.length ? containers : [content];
    const nodes = [];
    roots.forEach((root) => {
      Array.from(root.querySelectorAll(CONTENT_SEL)).filter((el) => {
        const ancestor = el.parentElement.closest(CONTENT_SEL);
        return !ancestor || !root.contains(ancestor);
      }).filter((el) => !isBlank7(el)).forEach((el) => nodes.push(el));
    });
    if (!nodes.length && clean4(content.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean4(content.textContent);
      nodes.push(p);
    }
    return nodes;
  }
  function parse11(element, { document: document2 }) {
    const pairs = [];
    const controls = Array.from(element.querySelectorAll(".tabs-container__accordion-control"));
    controls.forEach((ctrl) => {
      let content = ctrl.nextElementSibling;
      while (content && !content.matches(".tabs-container__content") && !content.matches(".tabs-container__accordion-control")) {
        content = content.nextElementSibling;
      }
      if (content && !content.matches(".tabs-container__content")) content = null;
      const question = clean4((ctrl.querySelector(".tabs-container__tab-title") || ctrl).textContent);
      pairs.push({ question, content });
    });
    if (!pairs.length) {
      const tabs = Array.from(element.querySelectorAll(".tabs-container__tab-control"));
      const contents = Array.from(element.querySelectorAll(".tabs-container__content"));
      tabs.forEach((tab, i) => pairs.push({ question: clean4(tab.textContent), content: contents[i] || null }));
    }
    const cells = [];
    pairs.forEach(({ question, content }) => {
      const answers = answerNodes(content, document2);
      if (!question && !answers.length) return;
      const summaryCell = document2.createDocumentFragment();
      if (question) {
        summaryCell.appendChild(document2.createComment(" field:summary "));
        summaryCell.appendChild(document2.createTextNode(question));
      }
      const textCell = document2.createDocumentFragment();
      if (answers.length) {
        textCell.appendChild(document2.createComment(" field:text "));
        answers.forEach((n) => textCell.appendChild(n));
      }
      cells.push([summaryCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/centerparcs-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function isBlank8(el) {
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
        if (isBlank8(tc)) tc.remove();
      });
      element.querySelectorAll(".cmp-text > p, .cmp-text > h1, .cmp-text > h2, .cmp-text > h3, .cmp-text > h4, .cmp-text > h5, .cmp-text > h6").forEach((el) => {
        if (isBlank8(el)) el.remove();
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

  // tools/importer/import-home.js
  var parsers = {
    "hero-notification": parse,
    "columns-offer": parse2,
    "hero-video": parse3,
    "tabs-village": parse4,
    "carousel-lodges": parse5,
    "columns-intro": parse6,
    "cards-expand": parse7,
    "cards-feature": parse8,
    "carousel-activity": parse9,
    "columns-promo": parse10,
    "accordion-faq": parse11
  };
  var PAGE_TEMPLATE = {
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
  var import_home_default = {
    /**
     * Scroll through the page so lazy-rendered components (village explorer,
     * carousels) mount before transform, then wait for the village markup.
     */
    onLoad: (_0) => __async(void 0, [_0], function* ({ document: document2 }) {
      const win = document2.defaultView || window;
      const step = Math.max(400, Math.floor(win.innerHeight * 0.8));
      for (let y = 0; y < document2.body.scrollHeight; y += step) {
        win.scrollTo(0, y);
        yield sleep(250);
      }
      const start = Date.now();
      while (!document2.querySelector(".village-location .cmp-village-location .village-location-teaser") && Date.now() - start < 15e3) {
        const village = document2.querySelector(".village-location");
        if (village) village.scrollIntoView();
        yield sleep(500);
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
  return __toCommonJS(import_home_exports);
})();
