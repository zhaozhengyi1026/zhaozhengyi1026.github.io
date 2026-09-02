const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skipIntro = new URLSearchParams(window.location.search).has('preview');
const loader = document.querySelector('.experiment-loader');
const counter = document.querySelector('.loader-count');
const stage = document.querySelector('[data-rebirth-stage]');
const scene = stage?.querySelector('.rebirth-scene');
const seedField = document.querySelector('.seed-field');
const returnButton = document.querySelector('.experiment-return');

function finishLoader() {
  loader?.classList.add('is-done');
  document.body.style.overflow = '';
}

if (reducedMotion || skipIntro) {
  finishLoader();
} else {
  document.body.style.overflow = 'hidden';
  let remaining = 3;
  if (counter) counter.textContent = String(remaining);
  const countdown = window.setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      if (counter) counter.textContent = String(remaining);
      return;
    }
    window.clearInterval(countdown);
    finishLoader();
  }, 1000);
}

function updateReturnPosition() {
  const scrollingElement = document.scrollingElement;
  if (!scrollingElement || !returnButton) return;
  const canScroll = scrollingElement.scrollHeight > window.innerHeight + 2;
  const nearBottom = window.scrollY + window.innerHeight >= scrollingElement.scrollHeight - 80;
  returnButton.classList.toggle('is-at-bottom', canScroll && nearBottom);
}

window.addEventListener('scroll', updateReturnPosition, { passive: true });
window.addEventListener('resize', updateReturnPosition);
updateReturnPosition();

for (let index = 0; index < 26; index += 1) {
  const seed = document.createElement('span');
  seed.className = 'seed';
  seed.style.setProperty('--left', `${2 + Math.random() * 96}%`);
  seed.style.setProperty('--duration', `${8 + Math.random() * 9}s`);
  seed.style.setProperty('--delay', `${-Math.random() * 14}s`);
  seed.style.setProperty('--drift', `${-80 + Math.random() * 160}px`);
  seedField?.append(seed);
}

let scrollReveal = 0;
let pointerReveal = null;
let frameRequested = false;

function paintReveal() {
  if (!scene) return;
  const reveal = pointerReveal ?? scrollReveal;
  scene.style.setProperty('--reveal', `${reveal.toFixed(2)}%`);
  scene.style.setProperty('--progress', (reveal / 100).toFixed(4));
}

function updateScroll() {
  frameRequested = false;
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const distance = Math.max(1, stage.offsetHeight - window.innerHeight);
  scrollReveal = Math.min(100, Math.max(0, -rect.top / distance * 100));
  paintReveal();
}

window.addEventListener('scroll', () => {
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });

scene?.addEventListener('pointermove', (event) => {
  const rect = scene.getBoundingClientRect();
  pointerReveal = Math.min(100, Math.max(0, (event.clientX - rect.left) / rect.width * 100));
  scene.style.setProperty('--px', ((event.clientX - rect.left) / rect.width * 2 - 1).toFixed(3));
  scene.style.setProperty('--py', ((event.clientY - rect.top) / rect.height * 2 - 1).toFixed(3));
  paintReveal();
});

scene?.addEventListener('pointerleave', () => {
  pointerReveal = null;
  scene.style.setProperty('--px', '0');
  scene.style.setProperty('--py', '0');
  paintReveal();
});

updateScroll();
