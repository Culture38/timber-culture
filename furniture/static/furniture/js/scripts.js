// Shared Utilities
// ===============

// Preload assets with timeout for seamless loading
const preloadAssets = async (assets) => {
  try {
    await Promise.race([
      Promise.all(
        assets.map(
          (src) =>
            new Promise((resolve) => {
              const img = new Image();
              img.src = src;
              img.loading = 'eager';
              img.onload = resolve;
              img.onerror = resolve;
            })
        )
      ),
      new Promise((resolve) => setTimeout(resolve, 5000)), // 5-second timeout
    ]);
  } catch (error) {
    // Silently handle errors
  }
};

// Truncate text to a maximum word count
const truncateText = (element, maxWords) => {
  if (!element) return;
  const text = element.dataset.originalText || element.textContent.trim();
  element.dataset.originalText = text;
  const words = text.split(/\s+/);
  element.textContent =
    words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}...` : text;
};

// Apply parallax effect for sections with data-parallax="true"
const applyParallax = () => {
  if (window.innerWidth <= 768) return;
  const scrollPosition = window.pageYOffset;
  document.querySelectorAll('[data-parallax="true"]').forEach((element) => {
    element.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
  });
};

// Smooth scroll for anchor links
const setupSmoothScroll = () => {
  const listeners = [];
  document.querySelectorAll('.smooth-scroll, .hero-cta').forEach((anchor) => {
    const handler = (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (targetId.startsWith('#')) {
        document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    anchor.addEventListener('click', handler);
    listeners.push({ element: anchor, event: 'click', handler });
  });
  return listeners;
};

// Fade-in animations for items
const setupFadeInAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, threshold: 0.15 }
  );
  document
    .querySelectorAll('.process-item, .service-item, .gallery-item, .journal-item')
    .forEach((item) => observer.observe(item));
};

// Lazy load images
const setupLazyLoadImages = () => {
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    },
    { root: null, threshold: 0.15 }
  );
  document
    .querySelectorAll(
      '.benefit-card img, .collection-item img, .grid-item img, .about-image, .gallery-item img, .journal-thumbnail img'
    )
    .forEach((img) => observer.observe(img));
};

// Adjust layout on resize
const adjustLayout = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Get CSRF token from cookies
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'csrftoken') return value;
  }
  return '';
};

// Show toast notification
const showToast = (message, duration = 1738, isError = false) => {
  const toast = document.createElement('div');
  toast.textContent = DOMPurify.sanitize(message);
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; background: ${
      isError ? '#d32f2f' : '#4caf50'
    };
    color: #fff; padding: 10px 20px; border-radius: 5px; z-index: 1000; opacity: 0;
    transition: opacity 0.3s; font-family: 'Open Sans', sans-serif; font-size: 14px;
  `;
  document.body.appendChild(toast);
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Slugify text for URLs
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Throttle function to limit execution rate
const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Debounce function to delay execution
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Trap focus within a modal
const trapFocus = (modal) => {
  const focusableElements = modal.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else if (document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  };

  modal.addEventListener('keydown', handleKeyDown);
  return () => modal.removeEventListener('keydown', handleKeyDown);
};

// Cleanup event listeners
const cleanupListeners = (listeners) =>
  listeners.forEach(({ element, event, handler }) =>
    element.removeEventListener(event, handler)
  );

// Page Initializations
// ===================

// Landing Page
const initLandingPage = async () => {
  if (!document.getElementById('landing')) return;
  const listeners = [];

  const elements = {
    landingSection: document.getElementById('landing'),
    landingText: document.querySelector('.landing-text'),
    landingButton: document.getElementById('get-started'),
    subscribeForm: document.getElementById('footer-subscribe-form'),
    collectionGrid: document.getElementById('top-collection-grid'),
  };
  const assetsToPreload = [
    '/static/furniture/images/seat.webp',
    '/static/furniture/images/ny.jpeg',
    '/static/furniture/images/oak.jpeg',
    '/static/furniture/images/working.jpg',
  ];

  await preloadAssets(assetsToPreload);
  Object.values(elements).forEach((el) => el?.classList.add('loaded'));

  // Fetch and render top collection
  if (elements.collectionGrid) {
    try {
      const response = await fetch('/api/portfolio/?sort=popular&page=1', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { portfolio_items: items } = await response.json();

      elements.collectionGrid.innerHTML = items.length
        ? ''
        : '<p>No items available.</p>';
      items.slice(0, 9).forEach((item) => {
        const primaryImage = item.images.find((img) => img.is_primary) || item.images[0];
        if (!primaryImage) return;

        const itemElement = document.createElement('a');
        itemElement.className = 'collection-item';
        itemElement.href = '/portfolio/';
        itemElement.setAttribute('role', 'img');
        itemElement.setAttribute('aria-label', `${DOMPurify.sanitize(item.title)} by Timber Culture`);

        itemElement.innerHTML = `
          <img src="${primaryImage.src}" alt="${DOMPurify.sanitize(primaryImage.alt || item.title)}" loading="lazy">
          <div class="overlay">${DOMPurify.sanitize(item.title)}</div>
        `;
        elements.collectionGrid.appendChild(itemElement);
      });
    } catch (error) {
      elements.collectionGrid.innerHTML = '<p>Failed to load collection.</p>';
      showToast('Failed to load collection.', 1738, true);
    }
  }

  // Subscription form handling
  if (elements.subscribeForm) {
    const form = elements.subscribeForm;
    const button = form.querySelector('.subscribe-button');
    const input = form.querySelector('.subscribe-input');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (form.dataset.isSubmitting === 'true') return;

      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Invalid email address', 1738, true);
        return;
      }

      form.dataset.isSubmitting = 'true';
      button.disabled = true;
      button.textContent = 'Subscribing...';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'X-CSRFToken': getCsrfToken() },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        form.reset();
        showToast('Subscribed successfully!', 1738, false);
      } catch (error) {
        showToast(DOMPurify.sanitize(error.message), 1738, true);
      } finally {
        form.dataset.isSubmitting = 'false';
        button.disabled = false;
        button.textContent = 'Subscribe';
      }
    };
    form.addEventListener('submit', handleSubmit);
    listeners.push({ element: form, event: 'submit', handler: handleSubmit });

    if (input && button) {
      const inputHandler = () => {
        button.disabled =
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value) ||
          form.dataset.isSubmitting === 'true';
      };
      input.addEventListener('input', inputHandler);
      listeners.push({ element: input, event: 'input', handler: inputHandler });
    }
  }

  window.addEventListener('unload', () => cleanupListeners(listeners));
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => cleanupListeners(listeners),
  });
};

// About Page
const initAboutPage = async () => {
  if (!document.getElementById('about')) return;
  const listeners = [];

  const elements = {
    aboutSection: document.getElementById('about'),
    aboutContentSection: document.getElementById('about-content'),
    aboutTitle: document.querySelector('.about-title'),
    heroCta: document.querySelector('.hero-cta'),
    galleryGrid: document.querySelector('.gallery-grid'),
  };
  const assetsToPreload = (window.galleryImages || []).map(img => img.src); // Extract src strings

  try {
    await preloadAssets(assetsToPreload);
    Object.values(elements).forEach((el) => el?.classList.add('loaded', 'visible'));

    if (elements.galleryGrid) {
      const galleryItems = elements.galleryGrid.querySelectorAll('.gallery-item');
      const isMobile = window.innerWidth <= 767;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            galleryItems.forEach((item, index) =>
              setTimeout(
                () => item.classList.add('loaded'),
                isMobile ? 0 : index * 200 // No stagger on mobile
              )
            );
            observer.unobserve(elements.galleryGrid);
          }
        },
        { root: null, threshold: 0.1 }
      );
      observer.observe(elements.galleryGrid);
    }
  } catch (error) {
    // Silently handle errors
  }

  window.addEventListener('unload', () => cleanupListeners(listeners));
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => cleanupListeners(listeners),
  });
};

// Portfolio Page
const initPortfolioPage = async () => {
  if (!document.getElementById('portfolio-gallery')) return;
  const listeners = [];

  const elements = {
    portfolioHero: document.getElementById('portfolio-hero'),
    portfolioSection: document.getElementById('portfolio-gallery'),
    searchFilterSection: document.getElementById('search-filter'),
    heroText: document.querySelector('.hero-text'),
    searchInput: document.getElementById('search-input'),
    sortFilter: document.getElementById('sort-filter'),
    searchBtn: document.querySelector('.search-btn'),
    galleryGrid: document.querySelector('.gallery-grid'),
    infiniteLoading: document.querySelector('.infinite-loading'),
    modal: document.getElementById('image-modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.querySelector('.modal-close'),
    thumbnailStrip: document.querySelector('.thumbnail-strip'),
  };
  const assetsToPreload = [
    '/static/furniture/images/seat.webp',
    '/static/furniture/images/fallback.png',
  ];

  if (!elements.sortFilter) return;

  let portfolioItems = [];
  let likedItems = new Set(JSON.parse(localStorage.getItem('likedItems') || '[]'));
  let lastFocusedElement = null;
  let currentPage = 1;
  let hasNextPage = true;
  let isLoading = false;
  let trapFocusCleanup = null;

  await preloadAssets(assetsToPreload);
  Object.values(elements).forEach((el) => el?.classList.add('loaded', 'visible'));

  const fetchPortfolio = async (page = 1, reset = false) => {
    if (isLoading || (!hasNextPage && !reset)) return;
    isLoading = true;
    elements.infiniteLoading?.classList.add('active');
    elements.infiniteLoading?.setAttribute('aria-hidden', 'false');

    try {
      const response = await fetch(
        `/api/portfolio/?page=${page}&sort=${elements.sortFilter.value}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      portfolioItems = reset
        ? data.portfolio_items || []
        : [...portfolioItems, ...(data.portfolio_items || [])];
      hasNextPage = data.has_next || false;
      currentPage = page;
      renderGallery();
    } catch (error) {
      elements.galleryGrid.innerHTML =
        '<p class="empty-message" role="alert">Error loading portfolio.</p>';
      elements.galleryGrid.classList.add('empty');
      showToast('Failed to load portfolio.', 1738, true);
    } finally {
      isLoading = false;
      elements.infiniteLoading?.classList.remove('active');
      elements.infiniteLoading?.setAttribute('aria-hidden', 'true');
    }
  };

  const filterItems = () => {
    const searchTerm = elements.searchInput?.value.toLowerCase().trim() || '';
    return searchTerm
      ? portfolioItems.filter(
          (item) =>
            item.title?.toLowerCase().includes(searchTerm) ||
            item.location?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        )
      : portfolioItems;
  };

  const renderGallery = () => {
    if (!elements.galleryGrid) return;
    elements.galleryGrid.innerHTML = '';
    const filteredItems = filterItems();
    if (!filteredItems.length) {
      elements.galleryGrid.classList.add('empty');
      elements.galleryGrid.innerHTML =
        '<p class="empty-message" role="alert">No portfolio items found.</p>';
      return;
    }
    elements.galleryGrid.classList.remove('empty');

    filteredItems.forEach((item, index) => {
      const primaryImage = item.images?.find((img) => img.is_primary) || item.images?.[0] || {};
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');
      galleryItem.dataset.popularity = item.popularity || 0;
      galleryItem.dataset.projectId = item.id;
      galleryItem.innerHTML = `
        <div class="octagon">
          <img src="${primaryImage.src || '/static/furniture/images/fallback.png'}" 
               alt="${DOMPurify.sanitize(primaryImage.alt || 'Portfolio item')}" 
               loading="lazy" 
               role="button" 
               aria-controls="image-modal" 
               tabindex="0"
               onerror="this.src='/static/furniture/images/fallback.png'">
          <button class="heart-icon" data-project-id="${item.id}" aria-label="Favorite ${DOMPurify.sanitize(item.title || 'Untitled')}">
            <i class="${likedItems.has(item.id) ? 'fas fa-heart liked' : 'far fa-heart'}"></i>
          </button>
        </div>
        <h3>${DOMPurify.sanitize(item.title || 'Untitled')}</h3>
        <p>${DOMPurify.sanitize(item.location || 'Unknown location')}</p>
      `;
      galleryItem.style.animationDelay = `${index * 0.1}s`;
      galleryItem.classList.add('fade-in');
      elements.galleryGrid.appendChild(galleryItem);
    });

    attachEventListeners();
  };

  const handleLike = async (event) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const projectId = parseInt(button.dataset.projectId);
    const isLiked = likedItems.has(projectId);

    try {
      const response = await fetch(`/api/portfolio/${projectId}/like/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ liked: !isLiked }),
      });
      const data = await response.json();
      if (response.ok) {
        if (!isLiked) {
          likedItems.add(projectId);
          button.querySelector('i').classList.replace('far', 'fas');
          button.querySelector('i').classList.add('liked');
        } else {
          likedItems.delete(projectId);
          button.querySelector('i').classList.replace('fas', 'far');
          button.querySelector('i').classList.remove('liked');
        }
        localStorage.setItem('likedItems', JSON.stringify([...likedItems]));
        fetchPortfolio(1, true);
      } else {
        throw new Error(data.error || 'Failed to update like');
      }
    } catch (error) {
      showToast('Failed to update favorite.', 1738, true);
    }
  };

  const openModal = (itemId, imageSrc, triggeringElement) => {
    const item = portfolioItems.find((i) => i.id === itemId);
    if (!item || !elements.modal) return;

    lastFocusedElement = triggeringElement;
    elements.modalImage.src = imageSrc;
    elements.modalImage.alt =
      item.images.find((img) => img.src === imageSrc)?.alt || 'Portfolio image';
    document.getElementById('project-description').textContent = DOMPurify.sanitize(
      item.description || 'No description available.'
    );

    if (elements.thumbnailStrip) {
      elements.thumbnailStrip.innerHTML = '';
      item.images.forEach((img) => {
        const thumbnail = document.createElement('button');
        thumbnail.classList.add('thumbnail-item');
        thumbnail.setAttribute('role', 'tab');
        thumbnail.setAttribute('aria-selected', img.src === imageSrc);
        thumbnail.setAttribute('aria-controls', 'modal-image');
        thumbnail.dataset.image = img.src;
        thumbnail.dataset.alt = img.alt || 'Portfolio image';
        thumbnail.innerHTML = `<img src="${img.src}" alt="${DOMPurify.sanitize(img.alt || 'Thumbnail')}" loading="lazy">`;
        thumbnail.addEventListener('click', () => {
          elements.modalImage.src = img.src;
          elements.modalImage.alt = img.alt || 'Portfolio image';
          elements.thumbnailStrip
            .querySelectorAll('.thumbnail-item')
            .forEach((t) => t.setAttribute('aria-selected', 'false'));
          thumbnail.setAttribute('aria-selected', 'true');
        });
        elements.thumbnailStrip.appendChild(thumbnail);
      });
    }

    elements.modal.setAttribute('data-state', 'open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    trapFocusCleanup = trapFocus(elements.modal);
    setTimeout(() => elements.modalClose?.focus(), 300);
  };

  const closeModal = () => {
    if (!elements.modal) return;
    elements.modal.setAttribute('data-state', 'closed');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (trapFocusCleanup) {
      trapFocusCleanup();
      trapFocusCleanup = null;
    }
    lastFocusedElement?.focus();
    lastFocusedElement = null;
  };

  const attachEventListeners = () => {
    document.querySelectorAll('.octagon img').forEach((img) => {
      const galleryItem = img.closest('.gallery-item');
      const handler = (e) =>
        openModal(parseInt(galleryItem.dataset.projectId), img.src, img);
      img.addEventListener('click', handler);
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler(e);
        }
      });
      listeners.push({ element: img, event: 'click', handler });
      listeners.push({
        element: img,
        event: 'keydown',
        handler: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler(e);
          }
        },
      });
    });

    document.querySelectorAll('.heart-icon').forEach((button) => {
      button.addEventListener('click', handleLike);
      listeners.push({ element: button, event: 'click', handler: handleLike });
    });
  };

  const handleInfiniteScroll = throttle(() => {
    if (isLoading || !hasNextPage) return;
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.offsetHeight - 1000
    ) {
      fetchPortfolio(++currentPage);
    }
  }, 100);

  const debouncedSearch = debounce(renderGallery, 300);
  const debouncedSort = debounce(() => fetchPortfolio(1, true), 300);

  elements.searchBtn?.addEventListener('click', () => {
    elements.searchBtn.classList.add('loading');
    elements.searchBtn.setAttribute('aria-busy', 'true');
    setTimeout(() => {
      elements.searchBtn.classList.remove('loading');
      elements.searchBtn.removeAttribute('aria-busy');
      renderGallery();
    }, 500);
  });
  elements.searchInput?.addEventListener('input', debouncedSearch);
  elements.sortFilter?.addEventListener('change', debouncedSort);
  window.addEventListener('scroll', handleInfiniteScroll);
  elements.modalClose?.addEventListener('click', closeModal);
  elements.modal?.addEventListener('click', (e) => {
    if (e.target === elements.modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal?.getAttribute('data-state') === 'open')
      closeModal();
  });

  listeners.push(
    { element: elements.searchBtn, event: 'click', handler: () => {} },
    { element: elements.searchInput, event: 'input', handler: debouncedSearch },
    { element: elements.sortFilter, event: 'change', handler: debouncedSort },
    { element: window, event: 'scroll', handler: handleInfiniteScroll },
    { element: elements.modalClose, event: 'click', handler: closeModal },
    {
      element: elements.modal,
      event: 'click',
      handler: (e) => {
        if (e.target === elements.modal) closeModal();
      },
    },
    {
      element: document,
      event: 'keydown',
      handler: (e) => {
        if (
          e.key === 'Escape' &&
          elements.modal?.getAttribute('data-state') === 'open'
        )
          closeModal();
      },
    }
  );

  fetchPortfolio();

  window.addEventListener('unload', () => {
    cleanupListeners(listeners);
    if (trapFocusCleanup) trapFocusCleanup();
  });
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => {
      cleanupListeners(listeners);
      if (trapFocusCleanup) trapFocusCleanup();
    },
  });
};

// Journal Page
let isJournalPageInitialized = false;

const initJournalPage = async () => {
  if (!document.getElementById('journal') || isJournalPageInitialized) return;
  isJournalPageInitialized = true;
  const listeners = [];

  const elements = {
    journalHero: document.getElementById('journal-hero'),
    heroText: document.querySelector('.hero-text'),
    journalQuote: document.querySelector('.journal-quote'),
    heroCta: document.querySelector('.hero-cta'),
    journalSection: document.getElementById('journal'),
    searchFilterSection: document.getElementById('search-filter'),
    modal: document.getElementById('reading-modal'),
    backBtn: document.querySelector('.modal-header .back-btn'),
    modalTitle: document.getElementById('modal-title'),
    modalDate: document.getElementById('modal-date'),
    modalImage: document.getElementById('modal-image'),
    modalToc: document.querySelector('.table-of-contents ul'),
    modalContent: document.getElementById('modal-content'),
    shareBtn: document.querySelector('.share-btn'),
    searchInput: document.getElementById('search-input'),
    categoryFilter: document.getElementById('category-filter'),
    journalTimeline: document.querySelector('.journal-timeline'),
    loadingSpinner: document.querySelector('.journal-timeline .infinite-loading'),
  };
  let sideCounter = 0; // Reset sideCounter to avoid duplication
  let isLoading = false;
  let trapFocusCleanup = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (
    !elements.journalSection ||
    !elements.modal ||
    !elements.journalTimeline ||
    !elements.loadingSpinner
  ) {
    return;
  }

  elements.journalTimeline.dataset.page = '1';
  elements.journalTimeline.dataset.hasMore = 'true';

  // Clear any existing entries in the timeline to prevent duplication
  elements.journalTimeline.innerHTML = '';
  elements.journalTimeline.appendChild(elements.loadingSpinner);

  // Preload images, excluding invalid ones
  const journalItems = document.querySelectorAll('.journal-item'); // Should be empty after clearing
  await preloadAssets(
    Array.from(journalItems)
      .map((item) => item.querySelector('img')?.getAttribute('data-src'))
      .filter((src) => src && !src.includes('picsum.photos'))
  );

  // Add loaded and visible classes
  elements.journalHero?.classList.add('loaded');
  elements.heroText?.classList.add('loaded');
  setTimeout(() => elements.heroCta?.classList.add('loaded'), 400);
  elements.journalSection.classList.add('loaded', 'visible');
  elements.searchFilterSection?.classList.add('visible');

  // Smooth scroll for anchors
  document.querySelectorAll('.smooth-scroll').forEach((anchor) => {
    const handler = (e) => {
      e.preventDefault();
      document
        .getElementById(anchor.getAttribute('href').substring(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    anchor.addEventListener('click', handler);
    listeners.push({ element: anchor, event: 'click', handler });
  });

  // Typing effect for journal quote
  if (elements.journalQuote) {
    const quoteElement = elements.journalQuote.querySelector('p') || elements.journalQuote;
    const quoteText =
      'In the vast code of the cosmos, every query sparks a new adventure—seek truth, embrace wonder, and debug the universe one question at a time ~ Grok.';
    const typingSpeed = prefersReducedMotion ? 20 : 80;

    const typeQuote = (text, element, callback) => {
      let index = 0;
      element.textContent = '';
      elements.journalQuote.classList.add('loaded', 'typing');
      const typeNextChar = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index++);
          setTimeout(() => requestAnimationFrame(typeNextChar), typingSpeed);
        } else {
          elements.journalQuote.classList.remove('typing');
          callback?.();
        }
      };
      setTimeout(() => requestAnimationFrame(typeNextChar), 800);
    };

    const reverseTypeQuote = (element) => {
      let text = element.textContent;
      let index = text.length;
      const removeNextChar = () => {
        if (index > 0) {
          element.textContent = text.slice(0, --index);
          setTimeout(() => requestAnimationFrame(removeNextChar), typingSpeed);
        } else {
          elements.journalQuote.classList.add('no-cursor');
          elements.journalQuote.style.display = 'none';
        }
      };
      setTimeout(() => requestAnimationFrame(removeNextChar), typingSpeed);
    };

    typeQuote(quoteText, quoteElement, () => reverseTypeQuote(quoteElement));
  }

  const fetchEntries = async (page, category, search) => {
    if (isLoading) return { journal_entries: [], has_next: false, page };
    isLoading = true;
    elements.loadingSpinner.classList.add('active');

    const params = new URLSearchParams({ page });
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    try {
      const response = await fetch(`/journal-api/?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      showToast('Failed to load entries.', 1738, true);
      return { journal_entries: [], has_next: false, page };
    } finally {
      isLoading = false;
      elements.loadingSpinner.classList.remove('active');
    }
  };

  const renderEntries = (entries, append = true) => {
    if (!append) {
      // Clear the timeline except for the loading spinner
      elements.journalTimeline.innerHTML = '';
      elements.journalTimeline.appendChild(elements.loadingSpinner);
      sideCounter = 0; // Reset sideCounter for fresh render
    }

    if (entries.length && elements.journalTimeline.querySelector('.no-entries')) {
      elements.journalTimeline.querySelector('.no-entries').remove();
    }

    if (!entries.length && !append) {
      elements.journalTimeline.innerHTML = `
        <p class="no-entries">No journal entries found.</p>
      `;
      elements.journalTimeline.appendChild(elements.loadingSpinner);
      return;
    }

    entries.forEach((entry) => {
      const side = sideCounter++ % 2 ? 'right' : 'left';
      const article = document.createElement('article');
      article.className = 'journal-item';
      article.dataset.category = entry.category;
      article.dataset.id = entry.id;
      article.dataset.slug = entry.slug || slugify(entry.title) || `journal-entry-${entry.id}`;
      article.innerHTML = `
        <div class="journal-marker"></div>
        <div class="journal-content ${side}">
          <div class="journal-thumbnail">
            <img src="${entry.image || '/static/furniture/images/fallback.png'}"
                 alt="${DOMPurify.sanitize(entry.title || 'No title')}"
                 data-src="${entry.image || '/static/furniture/images/fallback.png'}"
                 loading="lazy">
          </div>
          <h3 class="journal-item-title">${DOMPurify.sanitize(entry.title || 'No title')}</h3>
          <p class="journal-excerpt" data-original-text="${DOMPurify.sanitize(entry.excerpt || 'No excerpt')}">${DOMPurify.sanitize(entry.excerpt || 'No excerpt')}</p>
          <a href="/journal/${entry.id}/${entry.slug || slugify(entry.title) || `journal-entry-${entry.id}`}/" class="read-more" data-id="${entry.id}" data-slug="${entry.slug || slugify(entry.title) || `journal-entry-${entry.id}`}">Read More</a>
        </div>
      `;
      elements.journalTimeline.insertBefore(article, elements.loadingSpinner);

      const excerpt = article.querySelector('.journal-excerpt');
      truncateText(excerpt, window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 15 : 20);

      const readMoreLink = article.querySelector('.read-more');
      readMoreLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadJournalEntry(
          entry.id,
          entry.slug || slugify(entry.title) || `journal-entry-${entry.id}`,
          article
        );
        window.history.replaceState({}, '', '/journal/');
      });
      listeners.push({
        element: readMoreLink,
        event: 'click',
        handler: async (e) => {
          e.preventDefault();
          await loadJournalEntry(
            entry.id,
            entry.slug || slugify(entry.title) || `journal-entry-${entry.id}`,
            article
          );
          window.history.replaceState({}, '', '/journal/');
        },
      });

      setTimeout(() => article.classList.add('fade-in'), 100);
    });
  };

  const handleScroll = throttle(() => {
    if (
      document.documentElement.scrollTop + document.documentElement.clientHeight >=
        document.documentElement.scrollHeight - 300 &&
      !isLoading &&
      elements.journalTimeline.dataset.hasMore === 'true'
    ) {
      const page = parseInt(elements.journalTimeline.dataset.page) + 1;
      fetchEntries(page, elements.categoryFilter?.value || 'all', elements.searchInput?.value || '').then((data) => {
        if (data.journal_entries.length) {
          renderEntries(data.journal_entries, true); // Append for infinite scroll
          elements.journalTimeline.dataset.page = data.page;
          elements.journalTimeline.dataset.hasMore = data.has_next.toString();
        } else {
          elements.journalTimeline.dataset.hasMore = 'false';
        }
      });
    }
  }, 100);

  const reloadEntries = () => {
    elements.journalTimeline.dataset.page = '1';
    elements.journalTimeline.dataset.hasMore = 'true';
    const category = elements.categoryFilter?.value || 'all';
    const search = elements.searchInput?.value || '';
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    window.history.pushState(
      {},
      '',
      params.toString() ? `/journal/?${params.toString()}` : '/journal/'
    );

    fetchEntries(1, category, search).then((data) => {
      renderEntries(data.journal_entries, false); // Replace entries
      elements.journalTimeline.dataset.page = data.page;
      elements.journalTimeline.dataset.hasMore = data.has_next.toString();
      elements.journalTimeline.classList.toggle('empty', !data.journal_entries.length);
    });
  };

  elements.searchInput?.addEventListener('input', () => {
    clearTimeout(elements.searchInput.dataset.timeout);
    elements.searchInput.dataset.timeout = setTimeout(reloadEntries, 500);
  });
  elements.searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') reloadEntries();
  });
  elements.categoryFilter?.addEventListener('change', reloadEntries);
  window.addEventListener('scroll', handleScroll);

  listeners.push(
    {
      element: elements.searchInput,
      event: 'input',
      handler: () => {
        clearTimeout(elements.searchInput.dataset.timeout);
        elements.searchInput.dataset.timeout = setTimeout(reloadEntries, 500);
      },
    },
    {
      element: elements.searchInput,
      event: 'keypress',
      handler: (e) => {
        if (e.key === 'Enter') reloadEntries();
      },
    },
    { element: elements.categoryFilter, event: 'change', handler: reloadEntries },
    { element: window, event: 'scroll', handler: handleScroll }
  );

  const updateTruncation = () => {
    const maxWords = window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 15 : 20;
    document.querySelectorAll('.journal-excerpt').forEach((excerpt) => truncateText(excerpt, maxWords));
  };
  updateTruncation();
  window.addEventListener('resize', debounce(updateTruncation, 200));
  listeners.push({
    element: window,
    event: 'resize',
    handler: debounce(updateTruncation, 200),
  });

  const loadJournalEntry = async (entryId, slug, journalItem = null) => {
    try {
      const response = await fetch(`/journal-api/?id=${entryId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const entry = data.journal_entries.find((e) => e.id == entryId);
      if (!entry) throw new Error('Entry not found');

      elements.modal.dataset.entryId = entryId;
      elements.modal.dataset.slug = entry.slug || slugify(entry.title) || `journal-entry-${entryId}`;
      elements.modalTitle.textContent = DOMPurify.sanitize(entry.title || 'No title');
      elements.modalDate.textContent = DOMPurify.sanitize(entry.date || 'No date');
      elements.modalImage.src = entry.image || '/static/furniture/images/fallback.png';
      elements.modalImage.alt = `Image for ${DOMPurify.sanitize(entry.title || 'journal entry')}`;
      elements.modalContent.innerHTML = entry.full_content?.trim()
        ? DOMPurify.sanitize(entry.full_content)
        : '<p>No content available.</p>';

      elements.modalToc.innerHTML = '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(entry.full_content || '', 'text/html');
      const headings = doc.querySelectorAll('h2, h3');
      if (!headings.length) {
        elements.modalToc.innerHTML = '<li>No table of contents available.</li>';
      } else {
        headings.forEach((heading, index) => {
          const id = `toc-${index}`;
          const targetHeading = elements.modalContent.querySelector(
            `h${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`
          );
          if (targetHeading) targetHeading.id = id;
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${id}`;
          a.textContent = DOMPurify.sanitize(heading.textContent);
          if (heading.tagName === 'H3') li.style.paddingLeft = '1rem';
          li.appendChild(a);
          elements.modalToc.appendChild(li);
          a.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          listeners.push({
            element: a,
            event: 'click',
            handler: (e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
          });
        });
      }

      let canonicalLink = document.querySelector('link[rel="canonical"]') || document.createElement('link');
      if (!canonicalLink.parentElement) {
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `${window.location.origin}/journal/${entryId}/${entry.slug || slugify(entry.title) || `journal-entry-${entryId}`}/`;

      elements.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        elements.modal.removeAttribute('aria-hidden');
        trapFocusCleanup = trapFocus(elements.modal);
        elements.backBtn?.focus();
      }, 800);

      if (journalItem) {
        document.querySelectorAll('.journal-item').forEach((item) => item.classList.remove('active'));
        journalItem.classList.add('active');
      }
    } catch (error) {
      console.error('Failed to load journal entry:', error);
      elements.modalTitle.textContent = 'Error';
      elements.modalContent.innerHTML = '<p>Unable to load journal entry.</p>';
      elements.modalToc.innerHTML = '<li>Error loading TOC.</li>';
      elements.modal.dataset.entryId = '';
      elements.modal.dataset.slug = '';
      elements.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        elements.modal.removeAttribute('aria-hidden');
        trapFocusCleanup = trapFocus(elements.modal);
        elements.backBtn?.focus();
      }, 800);
      showToast('Failed to load journal entry.', 1738, true);
    }
  };

  // Skip attaching listeners to pre-existing items since timeline is cleared
  // Load specific entry if URL or window.journalEntry specifies one
  if (window.journalEntry) {
    const { id, slug } = window.journalEntry;
    await loadJournalEntry(id, slug);
    window.history.replaceState({}, '', '/journal/');
  } else if (window.location.pathname.match(/^\/journal\/(\d+)\/([^/]+)\/?$/)) {
    const [, entryId, slug] = window.location.pathname.match(/^\/journal\/(\d+)\/([^/]+)\/?$/);
    await loadJournalEntry(entryId, slug);
    window.history.replaceState({}, '', '/journal/');
  }

  const closeModal = () => {
    elements.modal.classList.remove('active');
    setTimeout(() => {
      elements.modal.dataset.entryId = '';
      elements.modal.dataset.slug = '';
      if (trapFocusCleanup) {
        trapFocusCleanup();
        trapFocusCleanup = null;
      }
      document.body.style.overflow = '';
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.href = `${window.location.origin}/journal/`;
      if (window.location.pathname !== '/journal/') {
        window.history.replaceState({}, '', '/journal/');
      }
      elements.modal.setAttribute('aria-hidden', 'true');
    }, 800);
  };

  elements.backBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal?.classList.contains('active')) closeModal();
  });
  listeners.push(
    { element: elements.backBtn, event: 'click', handler: closeModal },
    {
      element: document,
      event: 'keydown',
      handler: (e) => {
        if (e.key === 'Escape' && elements.modal?.classList.contains('active'))
          closeModal();
      },
    }
  );

  if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      let { entryId, slug } = elements.modal.dataset;
      let journalTitle = elements.modalTitle?.textContent || 'Journal Entry';

      if (!entryId) {
        showToast('No journal entry selected.', 1738, true);
        return;
      }

      if (!slug) {
        try {
          const response = await fetch(`/journal-api/?id=${entryId}`);
          if (!response.ok) throw new Error('Network response');
          const data = await response.json();
          const entry = data.journal_entries.find((e) => e.id == entryId);
          slug = entry?.slug || slugify(entry.title) || `journal-entry-${entryId}`;
          journalTitle = entry?.title || journalTitle;
          elements.modal.dataset.slug = slug;
        } catch (error) {
          slug = `journal-entry-${entryId}`;
        }
      }

      slug = slugify(slug);
      const websiteName =
        document.querySelector('meta[name="site-name"]')?.content || document.title || 'Timber Culture';
      const shareUrl = `${window.location.origin}/journal/${entryId}/${slug}/`;
      const shareText = `Check out "${journalTitle}" on ${websiteName}`;
      const shareData = { title: journalTitle, text: shareText, url: shareUrl };

      try {
        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          showToast('Link copied to clipboard!', 1738, false);
        }
      } catch (err) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showToast('Failed to share. Link copied!', 1738, true);
      }
    });
    elements.shareBtn.style.cssText = 'display: flex; opacity: 1; visibility: visible;';
  }

  // Fetch initial entries
  fetchEntries(1, 'all', '').then((data) => {
    renderEntries(data.journal_entries, false); // Replace entries on initial load
    elements.journalTimeline.dataset.page = data.page;
    elements.journalTimeline.dataset.hasMore = data.has_next.toString();
    elements.journalTimeline.classList.toggle('empty', !data.journal_entries.length);
  });

  window.addEventListener('unload', () => {
    cleanupListeners(listeners);
    if (trapFocusCleanup) trapFocusCleanup();
  });
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => {
      cleanupListeners(listeners);
      if (trapFocusCleanup) trapFocusCleanup();
    },
  });
};

// Get Started Page
const addLocalBusinessSchema = () => {
  const contactDetails = document.querySelector('.contact-details');
  if (!contactDetails) return;

  const businessName = document.querySelector('.logo-full')?.textContent.trim() || 'Timber Culture';
  const addressElement = contactDetails.querySelector('p:nth-of-type(1)')?.textContent.replace('Address:', '').trim() || '';
  const addressParts = addressElement.split(',').map((part) => part.trim());
  const phone = contactDetails.querySelector('p:nth-of-type(2)')?.textContent.replace('Phone:', '').trim() || '';
  const email = contactDetails.querySelector('a[href^="mailto:"]')?.textContent.trim() || '';
  const socialLinks = Array.from(contactDetails.querySelectorAll('.social-links a'))
    .map((a) => a.href)
    .filter((href) => !href.includes('wa.me'));
  const favicon = document.querySelector('link[rel="icon"]')?.href || `${window.location.origin}/static/furniture/images/seat.webp`;
  const description = document.querySelector('meta[name="description"]')?.content || '';

  let geo = {};
  const mapIframe = document.querySelector('.contact-map iframe');
  if (mapIframe) {
    const src = mapIframe.src;
    const latLongMatch = src.match(/!3d(-?\d+\.\d+)!2d(\d+\.\d+)/);
    if (latLongMatch) {
      geo = {
        '@type': 'GeoCoordinates',
        latitude: parseFloat(latLongMatch[1]),
        longitude: parseFloat(latLongMatch[2]),
      };
    }
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: addressParts[0] || 'Nairobi',
      addressCountry: addressParts[1] || 'KE',
    },
    telephone: phone,
    email,
    url: window.location.origin,
    image: favicon,
    sameAs: socialLinks.length ? socialLinks : undefined,
    description: description || undefined,
    geo: Object.keys(geo).length ? geo : undefined,
  };

  Object.keys(schema).forEach((key) => {
    if (schema[key] === undefined) delete schema[key];
  });

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};

const initGetStartedPage = async () => {
  if (!document.getElementById('get-started-hero')) return;
  const listeners = [];

  const elements = {
    hero: document.getElementById('get-started-hero'),
    heroText: document.querySelector('.hero-text'),
    contactInfo: document.getElementById('contact-info'),
    inquiry: document.getElementById('inquiry'),
    form: document.getElementById('project-form'),
    projectTypeSelect: document.getElementById('project-type'),
    otherProjectGroup: document.getElementById('other-project-group'),
    otherProjectInput: document.getElementById('other-project'),
    submitButton: document.getElementById('project-form')?.querySelector('.submit-button'),
    successMessage: document.getElementById('project-form')?.querySelector('.form-success'),
  };
  const assetsToPreload = ['/static/furniture/images/seat.webp'];
  let isSubmitting = false;

  addLocalBusinessSchema();
  await preloadAssets(assetsToPreload);
  elements.hero?.classList.add('loaded');
  elements.heroText?.classList.add('loaded');
  elements.contactInfo?.classList.add('visible');
  elements.inquiry?.classList.add('visible');

  if (elements.form) {
    const validators = {
      'full-name': (value) => value.trim().length >= 2,
      phone: (value) => {
      const cleaned = value.replace(/[\s-]/g, '');
      return /^(0[17]\d{8}|254[17]\d{8}|\+254[17]\d{8})$/.test(cleaned);
    },
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'project-type': (value) => value !== '',
      'other-project': (value) =>
        !elements.otherProjectGroup.classList.contains('hidden')
          ? value.trim().length > 0
          : true,
      'project-description': (value) => value.trim().length >= 10,
      'project-image': (file) => {
        if (!file) return true;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
      },
    };

    const validateInput = (input) => {
      const value = input.type === 'file' ? input.files[0] : input.value;
      const isValid = validators[input.id](value);
      const validationIcon = input.parentElement.querySelector('.validation-icon');
      const errorMessage =
        input.parentElement.querySelector(`#${input.id}-error`) || document.createElement('span');
      errorMessage.id = `${input.id}-error`;
      errorMessage.className = 'error-message';
      errorMessage.textContent = isValid ? '' : `Invalid ${input.name.replace('_', ' ')}`;
      errorMessage.setAttribute('aria-live', 'polite');
      if (!errorMessage.parentElement) input.parentElement.appendChild(errorMessage);
      if (validationIcon) {
        validationIcon.classList.toggle('valid', isValid);
        validationIcon.classList.toggle('invalid', !isValid && (input.type === 'file' ? value : value !== ''));
      }
      input.setAttribute('aria-describedby', `${input.id}-error`);
      return isValid;
    };

    const checkFormValidity = () => {
      const requiredInputs = elements.form.querySelectorAll('input[required], select[required], textarea[required]');
      const optionalImageInput = document.getElementById('project-image');
      let isFormValid = Array.from(requiredInputs).every((input) => validateInput(input));

      if (optionalImageInput && !validateInput(optionalImageInput)) isFormValid = false;

      elements.submitButton.disabled = !isFormValid || isSubmitting;
    };

    const clearErrors = () => {
      elements.form.querySelectorAll('.error-message').forEach((error) => error.remove());
    };

    const displayErrors = (errors) => {
      clearErrors();
      Object.keys(errors).forEach((field) => {
        const input = elements.form.querySelector(`#${field.replace('_', '-')}`);
        if (input) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = DOMPurify.sanitize(errors[field]);
          input.parentElement.appendChild(errorDiv);
        }
      });
    };

    elements.projectTypeSelect?.addEventListener('change', () => {
      const isOther = elements.projectTypeSelect.value === 'other';
      elements.otherProjectGroup.classList.toggle('hidden', !isOther);
      elements.otherProjectInput.required = isOther;
      checkFormValidity();
    });

    elements.form.querySelectorAll('input, select, textarea').forEach((input) => {
      const eventType = input.type === 'file' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        validateInput(input);
        checkFormValidity();
        clearErrors();
      });
      listeners.push({
        element: input,
        event: eventType,
        handler: () => {
          validateInput(input);
          checkFormValidity();
          clearErrors();
        },
      });
    });

    elements.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;
      elements.submitButton.disabled = true;
      elements.submitButton.textContent = 'Submitting...';

      try {
        const response = await fetch(elements.form.action, {
          method: 'POST',
          body: new FormData(elements.form),
          headers: { 'X-CSRFToken': elements.form.querySelector('[name=csrfmiddlewaretoken]').value },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        clearErrors();
        elements.form.reset();
        elements.form.querySelectorAll('.validation-icon').forEach((icon) => {
          icon.classList.remove('valid', 'invalid');
        });
        elements.successMessage.classList.remove('hidden');
        setTimeout(() => {
          elements.successMessage.classList.add('hidden');
          elements.submitButton.textContent = 'Submit';
          isSubmitting = false;
          checkFormValidity();
        }, 3000);
      } catch (error) {
        let errors = { general: 'An unexpected error occurred.' };
        try {
          errors = JSON.parse(error.message);
        } catch (e) {
          // Handle parsing error
        }
        displayErrors(errors);
        elements.submitButton.textContent = 'Submit';
        isSubmitting = false;
        checkFormValidity();
      }
    });

    listeners.push({
      element: elements.projectTypeSelect,
      event: 'change',
      handler: () => {
        const isOther = elements.projectTypeSelect.value === 'other';
        elements.otherProjectGroup.classList.toggle('hidden', !isOther);
        elements.otherProjectInput.required = isOther;
        checkFormValidity();
      },
    });
    listeners.push({
      element: elements.form,
      event: 'submit',
      handler: async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        elements.submitButton.disabled = true;
        elements.submitButton.textContent = 'Submitting...';

        try {
          const response = await fetch(elements.form.action, {
            method: 'POST',
            body: new FormData(elements.form),
            headers: { 'X-CSRFToken': elements.form.querySelector('[name=csrfmiddlewaretoken]').value },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(JSON.stringify(data));
          clearErrors();
          elements.form.reset();
          elements.form.querySelectorAll('.validation-icon').forEach((icon) => {
            icon.classList.remove('valid', 'invalid');
          });
          elements.successMessage.classList.remove('hidden');
          setTimeout(() => {
            elements.successMessage.classList.add('hidden');
            elements.submitButton.textContent = 'Submit';
            isSubmitting = false;
            checkFormValidity();
          }, 3000);
        } catch (error) {
          let errors = { general: 'An unexpected error occurred.' };
          try {
            errors = JSON.parse(error.message);
          } catch (e) {
            // Handle parsing error
          }
          displayErrors(errors);
          elements.submitButton.textContent = 'Submit';
          isSubmitting = false;
          checkFormValidity();
        }
      },
    });

    checkFormValidity();
  }

  window.addEventListener('unload', () => cleanupListeners(listeners));
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => cleanupListeners(listeners),
  });
};

// Scroll-based Visibility
const handleScrollVisibility = () => {
  const scrollPosition = window.scrollY;
  const triggerPoint = window.innerHeight * 0.1;
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.classList.toggle('visible', scrollPosition > triggerPoint);
  }

  const pages = {
    landing: !!document.getElementById('landing'),
    about: !!document.getElementById('about'),
    portfolio: !!document.getElementById('portfolio-gallery'),
    getStarted: !!document.getElementById('get-started-hero'),
    journal: !!document.getElementById('journal'),
  };

  if (pages.landing) {
    // Homepage: Sections fade in after scrolling past triggerPoint
    ['about-preview', 'top-collection', 'footer'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.toggle('visible', scrollPosition > triggerPoint);
      }
    });
  } else {
    // Non-homepage: Sections are visible at top and when scrolling past triggerPoint
    const sectionIds = [];
    if (pages.about) {
      sectionIds.push('about', 'about-content');
    }
    if (pages.portfolio) {
      sectionIds.push('portfolio-gallery', 'search-filter');
    }
    if (pages.getStarted) {
      sectionIds.push('contact-info', 'inquiry');
    }
    if (pages.journal) {
      sectionIds.push('journal', 'search-filter');
    }

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('visible');
      }
    });

    // Ensure main sections are visible
    document.querySelectorAll('.main-section').forEach((section) => {
      section.classList.add('visible');
    });
  }
};

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
  const listeners = [];

  document.addEventListener('scroll', applyParallax);
  window.addEventListener('scroll', handleScrollVisibility);
  window.addEventListener('resize', adjustLayout);
  listeners.push(
    { element: document, event: 'scroll', handler: applyParallax },
    { element: window, event: 'scroll', handler: handleScrollVisibility },
    { element: window, event: 'resize', handler: adjustLayout }
  );

  listeners.push(...setupSmoothScroll());
  setupFadeInAnimations();
  setupLazyLoadImages();
  adjustLayout();
  handleScrollVisibility();
  document.querySelector('.hero-cta')?.classList.add('loaded');

  await Promise.all([
    initLandingPage(),
    initAboutPage(),
    initPortfolioPage(),
    initJournalPage(),
    initGetStartedPage(),
  ]);

  window.addEventListener('unload', () => cleanupListeners(listeners));
  listeners.push({
    element: window,
    event: 'unload',
    handler: () => cleanupListeners(listeners),
  });
});