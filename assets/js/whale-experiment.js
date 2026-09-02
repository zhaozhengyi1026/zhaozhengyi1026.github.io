const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pageParams = new URLSearchParams(window.location.search);
const skipIntro = pageParams.has('preview');
const loader = document.querySelector('.experiment-loader');
const counter = document.querySelector('.loader-count');
const stage = document.querySelector('[data-whale-stage]');
const scene = stage?.querySelector('.experiment-scene');
const video = document.querySelector('.whale-video');
const bubbles = document.querySelector('.bubble-field');
const previewTime = Number(pageParams.get('time'));
const returnButton = document.querySelector('.experiment-return');

video?.pause();
if (video && !pageParams.has('time')) video.currentTime = 0;

if (pageParams.has('time') && Number.isFinite(previewTime)) {
  video?.addEventListener('loadedmetadata', () => {
    video.pause();
    video.currentTime = Math.min(Math.max(0, previewTime), Math.max(0, video.duration - .05));
  }, { once: true });
}

function finishLoader() {
  loader?.classList.add('is-done');
  document.body.style.overflow = '';
  if (pageParams.has('time') || !video) return;

  const playFromStart = () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  if (video.readyState >= 1) playFromStart();
  else video.addEventListener('loadedmetadata', playFromStart, { once: true });
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

for (let index = 0; index < 18; index += 1) {
  const bubble = document.createElement('span');
  bubble.className = 'bubble';
  bubble.style.left = `${4 + Math.random() * 92}%`;
  bubble.style.setProperty('--size', `${5 + Math.random() * 20}px`);
  bubble.style.setProperty('--duration', `${7 + Math.random() * 8}s`);
  bubble.style.setProperty('--delay', `${-Math.random() * 12}s`);
  bubble.style.setProperty('--drift', `${-55 + Math.random() * 110}px`);
  bubbles?.append(bubble);
}

scene?.addEventListener('pointermove', (event) => {
  const rect = scene.getBoundingClientRect();
  scene.style.setProperty('--px', ((event.clientX - rect.left) / rect.width * 2 - 1).toFixed(3));
  scene.style.setProperty('--py', ((event.clientY - rect.top) / rect.height * 2 - 1).toFixed(3));
});

scene?.addEventListener('pointerleave', () => {
  scene.style.setProperty('--px', '0');
  scene.style.setProperty('--py', '0');
});

scene?.addEventListener('pointerdown', (event) => {
  const ripple = document.createElement('span');
  ripple.className = 'water-ripple';
  ripple.style.left = `${event.clientX}px`;
  ripple.style.top = `${event.clientY}px`;
  document.body.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
});
