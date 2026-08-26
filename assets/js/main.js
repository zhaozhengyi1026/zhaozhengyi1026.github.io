const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');

const themeButton = document.querySelector('.theme-toggle');
const themeIcon = themeButton?.querySelector('span[aria-hidden="true"]');

function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // The visual setting still applies for the current page when storage is unavailable.
  }
}

function updateThemeButton(theme) {
  if (!themeButton) return;
  const isDark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
  if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
}

function setTheme(theme, remember = true) {
  document.documentElement.dataset.theme = theme;
  if (remember) savePreference('theme', theme);
  updateThemeButton(theme);
}

if (themeButton) {
  updateThemeButton(document.documentElement.dataset.theme || 'light');
  themeButton.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
systemThemeQuery.addEventListener?.('change', (event) => {
  if (!readPreference('theme')) setTheme(event.matches ? 'dark' : 'light', false);
});

const styleButton = document.querySelector('.style-toggle');
const styleIcon = styleButton?.querySelector('span[aria-hidden="true"]');

function updateStyleButton(style) {
  if (!styleButton) return;
  const isAbstract = style === 'abstract';
  const label = isAbstract ? '切换经典风格' : '切换抽象派风格';
  styleButton.setAttribute('aria-pressed', String(isAbstract));
  styleButton.setAttribute('aria-label', label);
  styleButton.title = label;
  if (styleIcon) styleIcon.textContent = isAbstract ? '▦' : '◆';
}

if (styleButton) {
  updateStyleButton(document.documentElement.dataset.style || 'classic');
  styleButton.addEventListener('click', () => {
    const nextStyle = document.documentElement.dataset.style === 'abstract' ? 'classic' : 'abstract';
    document.documentElement.dataset.style = nextStyle;
    savePreference('site-style', nextStyle);
    updateStyleButton(nextStyle);
  });
}

if (menuButton && nav) {
  function closeMenu(returnFocus = false) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '菜单';
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? '关闭' : '菜单';
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(event.target) && event.target !== menuButton) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });

  const mobileNavigationQuery = window.matchMedia('(max-width: 960px)');
  mobileNavigationQuery.addEventListener?.('change', (event) => {
    if (!event.matches) closeMenu();
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

document.documentElement.classList.add('reveal-ready');
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const hero = document.querySelector('.home-page .hero');
const finePointer = window.matchMedia('(pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (hero && finePointer && !reducedMotion) {
  const heroPortrait = hero.querySelector('.hero-portrait');
  let heroFrame;

  hero.addEventListener('pointermove', (event) => {
    window.cancelAnimationFrame(heroFrame);
    heroFrame = window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const offsetX = x - .5;
      const offsetY = y - .5;
      hero.style.setProperty('--pointer-x', `${x * 100}%`);
      hero.style.setProperty('--pointer-y', `${y * 100}%`);
      heroPortrait.style.transform = `translate3d(${-offsetX * 26}px, ${-offsetY * 26}px, 42px)`;
    });
  });

  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--pointer-x', '50%');
    hero.style.setProperty('--pointer-y', '50%');
    heroPortrait.style.transform = '';
  });

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    const label = button.querySelector('.magnetic-label');
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const moveX = ((event.clientX - rect.left) / rect.width - .5) * 18;
      const moveY = ((event.clientY - rect.top) / rect.height - .5) * 14;
      button.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      if (label) label.style.transform = `translate3d(${-moveX * .35}px, ${-moveY * .35}px, 0)`;
    });
    button.addEventListener('pointerleave', () => {
      button.style.transform = '';
      if (label) label.style.transform = '';
    });
  });
}

const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy failed');
}

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await copyText(button.dataset.copy);
      showToast('邮箱已复制');
    } catch (error) {
      showToast('复制失败，请手动复制邮箱');
    }
  });
});

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('.carousel-dots button')];
  let currentIndex = 0;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === currentIndex));
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === currentIndex;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
  }

  carousel.querySelector('.carousel-prev')?.addEventListener('click', () => showSlide(currentIndex - 1));
  carousel.querySelector('.carousel-next')?.addEventListener('click', () => showSlide(currentIndex + 1));
  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => showSlide(dotIndex)));
});

const projectModal = document.querySelector('#project-modal');
const projectCards = [...document.querySelectorAll('[data-project]')];

function openProject(projectId) {
  if (!projectModal) return;
  const card = projectCards.find((item) => item.dataset.project === projectId);
  if (!card) return;
  const projectIndex = projectCards.indexOf(card) + 1;
  projectModal.querySelector('#modal-number').textContent = String(projectIndex).padStart(2, '0');
  projectModal.querySelector('#modal-category').textContent = card.dataset.category;
  projectModal.querySelector('#modal-title').textContent = card.dataset.title;
  projectModal.querySelector('#modal-description').textContent = card.dataset.description;
  const modalThumbnail = projectModal.querySelector('#modal-thumbnail');
  const projectScreenshot = card.querySelector('.project-screenshot');
  modalThumbnail.hidden = !projectScreenshot;
  if (projectScreenshot) {
    modalThumbnail.src = projectScreenshot.src;
    modalThumbnail.alt = `${card.dataset.title} 项目缩略图`;
  } else {
    modalThumbnail.removeAttribute('src');
    modalThumbnail.alt = '';
  }
  const tags = projectModal.querySelector('#modal-tags');
  tags.replaceChildren(...card.dataset.tags.split(',').map((tag) => {
    const item = document.createElement('li');
    item.textContent = tag;
    return item;
  }));
  const modalLink = projectModal.querySelector('.modal-link');
  const modalNote = projectModal.querySelector('.modal-note');
  const projectLink = card.dataset.link;
  modalLink.hidden = !projectLink;
  modalNote.hidden = Boolean(projectLink);
  if (projectLink) modalLink.href = projectLink;
  projectModal.showModal();
}

document.querySelectorAll('[data-open-project]').forEach((button) => {
  button.addEventListener('click', () => openProject(button.dataset.openProject));
});

projectModal?.querySelector('.modal-close')?.addEventListener('click', () => projectModal.close());
projectModal?.addEventListener('click', (event) => {
  if (event.target === projectModal) projectModal.close();
});

const journeyLine = document.querySelector('.journey-line');

if (journeyLine && !reducedMotion) {
  const pacman = journeyLine.querySelector('.journey-pacman');
  const DOT_SPACING = 26;
  const LEG_DURATION = 50000;
  const TRACK_INSET = 8;
  const MIN_EATEN_BEFORE_DETOUR = 10;
  const MIN_MISSED_BEFORE_TURN = 3;
  let dots = [];
  let trackWidth = 0;
  let maxX = 0;
  let x = TRACK_INSET;
  let direction = 1;
  let phase = 'normal';
  let phaseAfterNotice = 'normal';
  let detourAfterEaten = null;
  let detourDirection = 1;
  let detourTurnAt = 0;
  let detourReturnAt = 0;
  let pauseUntil = 0;
  let previousTime = 0;
  let resizeTimer;

  function reached(position, target, travelDirection) {
    return travelDirection > 0 ? position >= target : position <= target;
  }

  function resetDots() {
    dots.forEach(({ element }) => element.classList.remove('eaten'));
  }

  function planDetour() {
    const latestSafeCount = dots.length - 7;
    if (Math.random() > .76 || latestSafeCount < MIN_MISSED_BEFORE_TURN) {
      detourAfterEaten = null;
      return;
    }
    const earliestCount = Math.min(MIN_EATEN_BEFORE_DETOUR, latestSafeCount);
    const latestCount = Math.max(earliestCount, Math.min(latestSafeCount, Math.floor(dots.length * .45)));
    detourAfterEaten = earliestCount + Math.floor(Math.random() * (latestCount - earliestCount + 1));
  }

  function eatenDotCount() {
    return dots.reduce((count, dot) => count + Number(dot.element.classList.contains('eaten')), 0);
  }

  function eatNearbyDots() {
    const mouthX = x + (direction > 0 ? 20 : 4);
    dots.forEach((dot) => {
      if (!dot.element.classList.contains('eaten') && Math.abs(dot.x - mouthX) < 9) {
        dot.element.classList.add('eaten');
      }
    });
  }

  function beginDetour() {
    const mouthX = x + (direction > 0 ? 20 : 4);
    const upcomingDots = dots
      .filter((dot) => !dot.element.classList.contains('eaten') && (direction > 0 ? dot.x > mouthX : dot.x < mouthX))
      .sort((first, second) => direction > 0 ? first.x - second.x : second.x - first.x);
    const missedDotCount = Math.min(3 + Math.floor(Math.random() * 3), upcomingDots.length);

    if (missedDotCount < MIN_MISSED_BEFORE_TURN) {
      detourAfterEaten = null;
      return;
    }

    detourDirection = direction;
    const finalMissedDot = upcomingDots[missedDotCount - 1];
    detourTurnAt = Math.max(
      TRACK_INSET,
      Math.min(maxX, finalMissedDot.x + detourDirection * 14)
    );
    detourReturnAt = x - detourDirection * 8;
    detourAfterEaten = null;
    phase = 'skipping';
  }

  function beginTurn(nextPhase, nextDirection, timestamp) {
    phase = 'noticing';
    phaseAfterNotice = nextPhase;
    direction = nextDirection;
    pauseUntil = timestamp + 650;
    pacman.classList.add('is-confused');
  }

  function renderPacman() {
    pacman.style.transform = `translate3d(${x - TRACK_INSET}px, 0, 0) scaleX(${direction})`;
  }

  function buildTrack() {
    const previousMaxX = maxX;
    const previousTravelWidth = previousMaxX - TRACK_INSET;
    const progress = previousTravelWidth > 0
      ? (x - TRACK_INSET) / previousTravelWidth
      : (direction > 0 ? 0 : 1);
    trackWidth = journeyLine.clientWidth;
    maxX = Math.max(TRACK_INSET, trackWidth - 32);
    x = Math.max(TRACK_INSET, Math.min(maxX, TRACK_INSET + progress * (maxX - TRACK_INSET)));
    journeyLine.querySelectorAll('.journey-dot').forEach((dot) => dot.remove());
    dots = [];

    for (let dotX = 39; dotX <= trackWidth - 39; dotX += DOT_SPACING) {
      const element = document.createElement('i');
      element.className = 'journey-dot';
      element.style.left = `${dotX}px`;
      journeyLine.insertBefore(element, pacman);
      dots.push({ element, x: dotX });
    }

    journeyLine.classList.add('is-scripted');
    phase = 'normal';
    pacman.classList.remove('is-confused');
    resetDots();
    planDetour();
    renderPacman();
  }

  function animateJourney(timestamp) {
    if (!previousTime) previousTime = timestamp;
    const elapsed = Math.min(50, timestamp - previousTime);
    previousTime = timestamp;

    if (phase === 'noticing') {
      if (timestamp >= pauseUntil) {
        phase = phaseAfterNotice;
        pacman.classList.remove('is-confused');
      }
    } else if (maxX > 0) {
      const speed = (maxX - TRACK_INSET) / LEG_DURATION;
      x += direction * speed * elapsed;

      if (phase === 'normal' || phase === 'returning') eatNearbyDots();

      if (phase === 'normal' && detourAfterEaten !== null && eatenDotCount() >= detourAfterEaten) {
        beginDetour();
      }

      if (phase === 'skipping' && reached(x, detourTurnAt, detourDirection)) {
        x = detourTurnAt;
        beginTurn('returning', -detourDirection, timestamp);
      } else if (phase === 'returning' && reached(x, detourReturnAt, direction)) {
        x = detourReturnAt;
        beginTurn('normal', detourDirection, timestamp);
      } else if (phase === 'normal' && (x >= maxX || x <= TRACK_INSET)) {
        x = Math.max(TRACK_INSET, Math.min(maxX, x));
        direction *= -1;
        resetDots();
        planDetour();
      }
    }

    renderPacman();
    window.requestAnimationFrame(animateJourney);
  }

  buildTrack();
  window.requestAnimationFrame(animateJourney);

  if ('ResizeObserver' in window) {
    const journeyResizeObserver = new ResizeObserver(() => {
      if (Math.abs(journeyLine.clientWidth - trackWidth) < 2) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildTrack, 120);
    });
    journeyResizeObserver.observe(journeyLine);
  }
}
