const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');

const themeButton = document.querySelector('.theme-toggle');
const themeIcon = themeButton?.querySelector('span[aria-hidden="true"]');
const themeLabel = themeButton?.querySelector('.theme-label');

function updateThemeButton(theme) {
  if (!themeButton) return;
  const isDark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
  if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
  if (themeLabel) themeLabel.textContent = isDark ? '日间' : '夜间';
}

function setTheme(theme, remember = true) {
  document.documentElement.dataset.theme = theme;
  if (remember) localStorage.setItem('theme', theme);
  updateThemeButton(theme);
}

if (themeButton) {
  updateThemeButton(document.documentElement.dataset.theme || 'light');
  themeButton.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

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
    localStorage.setItem('site-style', nextStyle);
    updateStyleButton(nextStyle);
  });
}

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? '关闭' : '菜单';
  });

  nav.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '菜单';
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

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
