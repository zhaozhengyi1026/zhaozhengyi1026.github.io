const bottleStage = document.querySelector('#bottle-stage');

if (bottleStage) {
  const STORAGE_KEY = 'repeat-bottle-flip-v1';
  const DOUBLE_TALENT_COST = 40;
  const HOVER_TALENT_COST = 90;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultState = {
    money: 0,
    bottles: 1,
    tosses: 0,
    upright: 0,
    inverted: 0,
    side: 0,
    combo: 0,
    doubleIncome: false,
    hoverThrow: false
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== 'object') return { ...defaultState };
      return {
        ...defaultState,
        ...saved,
        money: Math.max(0, Math.round((Number(saved.money) || 0) * 10) / 10),
        bottles: Math.min(30, Math.max(1, Math.floor(Number(saved.bottles) || 1))),
        tosses: Math.max(0, Math.floor(Number(saved.tosses) || 0)),
        upright: Math.max(0, Math.floor(Number(saved.upright) || 0)),
        inverted: Math.max(0, Math.floor(Number(saved.inverted) || 0)),
        side: Math.max(0, Math.floor(Number(saved.side) || 0)),
        combo: Math.max(0, Math.floor(Number(saved.combo) || 0)),
        doubleIncome: Boolean(saved.doubleIncome),
        hoverThrow: Boolean(saved.hoverThrow)
      };
    } catch (error) {
      return { ...defaultState };
    }
  }

  let state = loadState();
  delete state.lastResult;
  let landingSlots = [];
  let layoutWidth = 0;
  let layoutHeight = 0;
  let gameRevision = 0;
  let resizeTimer;
  let storageWarningShown = false;
  const activeAnimations = new Set();

  const moneyNode = document.querySelector('[data-money]');
  const bottleCountNode = document.querySelector('[data-bottle-count]');
  const tossCountNode = document.querySelector('[data-toss-count]');
  const bottlePriceNode = document.querySelector('[data-bottle-price]');
  const uprightCountNode = document.querySelector('[data-upright-count]');
  const invertedCountNode = document.querySelector('[data-inverted-count]');
  const sideCountNode = document.querySelector('[data-side-count]');
  const comboCountNode = document.querySelector('[data-combo-count]');
  const comboMultiplierNode = document.querySelector('[data-combo-multiplier]');
  const comboStat = document.querySelector('[data-combo-stat]');
  const throwHint = document.querySelector('[data-throw-hint]');
  const announcement = document.querySelector('#game-announcement');
  const buyBottleButton = document.querySelector('[data-buy-bottle]');
  const talentButtons = document.querySelectorAll('[data-buy-talent]');
  const resetButton = document.querySelector('[data-reset-game]');

  function bottlePrice() {
    return Math.round(10 * (1.72 ** (state.bottles - 1)));
  }

  function formatAmount(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function comboMultiplier(combo) {
    if (combo >= 10) return 2;
    if (combo >= 6) return 1.5;
    if (combo >= 3) return 1.2;
    return 1;
  }

  function comboTier(combo) {
    if (combo >= 10) return 3;
    if (combo >= 6) return 2;
    if (combo >= 3) return 1;
    return 0;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showGameToast('当前浏览器无法保存游戏进度');
      }
      return false;
    }
  }

  function clearSavedState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showGameToast('当前浏览器无法清除游戏进度');
      }
    }
  }

  function trackAnimation(animation) {
    activeAnimations.add(animation);
    const removeAnimation = () => activeAnimations.delete(animation);
    animation.addEventListener('finish', removeAnimation, { once: true });
    animation.addEventListener('cancel', removeAnimation, { once: true });
    return animation;
  }

  function cancelActiveTosses() {
    gameRevision += 1;
    activeAnimations.forEach((animation) => animation.cancel());
    activeAnimations.clear();
  }

  function setAnnouncement(message) {
    announcement.textContent = message;
  }

  function showGameToast(message) {
    if (typeof showToast === 'function') showToast(message);
  }

  function playTalentUnlock(name) {
    const card = document.querySelector(`[data-talent-card="${name}"]`);
    if (!card) return;
    card.classList.remove('just-unlocked');
    void card.offsetWidth;
    card.classList.add('just-unlocked');
    window.setTimeout(() => card.classList.remove('just-unlocked'), 1100);
  }

  function updateTalentCard(name, unlocked, cost) {
    const card = document.querySelector(`[data-talent-card="${name}"]`);
    const button = document.querySelector(`[data-buy-talent="${name}"]`);
    if (!card || !button) return;
    card.classList.toggle('unlocked', unlocked);
    button.disabled = unlocked || state.money < cost;
    button.textContent = unlocked ? '已解锁' : `¥${cost} 解锁`;
  }

  function updateUI() {
    const nextBottlePrice = bottlePrice();
    const streakMultiplier = comboMultiplier(state.combo);
    moneyNode.textContent = formatAmount(state.money);
    bottleCountNode.textContent = state.bottles;
    tossCountNode.textContent = state.tosses;
    bottlePriceNode.textContent = nextBottlePrice;
    uprightCountNode.textContent = state.upright;
    invertedCountNode.textContent = state.inverted;
    sideCountNode.textContent = state.side;
    comboCountNode.textContent = state.combo;
    comboMultiplierNode.textContent = `×${formatAmount(streakMultiplier)}`;
    comboStat.dataset.tier = comboTier(state.combo);
    buyBottleButton.disabled = state.money < nextBottlePrice || state.bottles >= 30;
    buyBottleButton.querySelector('span').textContent = state.bottles >= 30 ? '奶瓶已满' : '再买一只';
    throwHint.textContent = state.hoverThrow ? '点击或用鼠标划过任意奶瓶，把它抛起来。' : '点击任意奶瓶，把它抛起来。';
    updateTalentCard('double', state.doubleIncome, DOUBLE_TALENT_COST);
    updateTalentCard('hover', state.hoverThrow, HOVER_TALENT_COST);
  }

  function chooseOutcome() {
    const roll = Math.random();
    if (roll < .52) return { key: 'upright', angle: 0, baseReward: 1 };
    if (roll < .66) return { key: 'inverted', angle: 180, baseReward: 6 };
    return { key: 'side', angle: Math.random() > .5 ? 90 : -90, baseReward: 0 };
  }

  function finishToss(button, bottleObject, outcome) {
    const successfulLanding = outcome.baseReward > 0;
    state.combo = successfulLanding ? state.combo + 1 : 0;
    const multiplier = (state.doubleIncome ? 2 : 1) * comboMultiplier(state.combo);
    const reward = Math.round(outcome.baseReward * multiplier * 10) / 10;
    state.money = Math.round((state.money + reward) * 10) / 10;
    state.tosses += 1;
    state[outcome.key] += 1;
    button.dataset.angle = outcome.angle;
    bottleObject.style.transform = `rotate(${outcome.angle}deg)`;
    button.classList.remove('is-tossing');
    button.classList.add(`landed-${outcome.key}`);
    button.setAttribute('aria-busy', 'false');

    const earning = button.querySelector('.bottle-earning');
    earning.textContent = reward ? `+¥${formatAmount(reward)}` : '';
    earning.dataset.outcome = outcome.key;
    earning.classList.remove('show');
    if (reward) {
      void earning.offsetWidth;
      earning.classList.add('show');
    }

    setAnnouncement(reward ? `+¥${formatAmount(reward)}` : '');
    saveState();
    updateUI();
  }

  function tossBottle(button) {
    if (button.classList.contains('is-tossing')) return;
    button.classList.remove('landed-upright', 'landed-inverted', 'landed-side');
    button.classList.add('is-tossing');
    button.setAttribute('aria-busy', 'true');
    const bottleObject = button.querySelector('.bottle-object');
    const tossRevision = gameRevision;
    const currentAngle = Number(button.dataset.angle) || 0;
    const outcome = chooseOutcome();
    const turns = (2 + Math.floor(Math.random() * 3)) * 360;
    const startX = Number(button.dataset.x);
    const startY = Number(button.dataset.y);
    const occupiedSlots = new Set(
      [...bottleStage.querySelectorAll('.bottle-button')]
        .filter((item) => item !== button)
        .map((item) => Number(item.dataset.slot))
    );
    const availableSlots = landingSlots.filter((slot) => !occupiedSlots.has(slot.id) && slot.id !== Number(button.dataset.slot));
    const nearbySlots = [...availableSlots]
      .sort((first, second) => (
        Math.hypot(first.x - startX, first.y - startY) - Math.hypot(second.x - startX, second.y - startY)
      ))
      .slice(0, Math.min(4, availableSlots.length));
    const landing = nearbySlots[Math.floor(Math.random() * nearbySlots.length)] || landingSlots[Number(button.dataset.slot)];
    const landingX = landing.x;
    const landingY = landing.y;
    const travelDistance = Math.hypot(landingX - startX, landingY - startY);
    const duration = prefersReducedMotion ? 1 : 760 + Math.min(320, travelDistance * 1.45);
    const arcHeight = Math.min(118, Math.max(54, Math.min(startY, landingY) - 8));
    button.dataset.slot = landing.id;
    button.dataset.x = landingX;
    button.dataset.y = landingY;
    button.style.left = `${landingX}px`;
    button.style.top = `${landingY}px`;
    const trajectory = Array.from({ length: 9 }, (_, index) => {
      const progress = index / 8;
      const x = startX + (landingX - startX) * progress;
      const linearY = startY + (landingY - startY) * progress;
      const y = linearY - arcHeight * 4 * progress * (1 - progress);
      return { left: `${x}px`, top: `${y}px`, offset: progress };
    });
    trackAnimation(button.animate(trajectory, { duration, easing: 'linear', fill: 'none' }));
    const animation = trackAnimation(bottleObject.animate([
      { transform: `rotate(${currentAngle}deg)`, offset: 0 },
      { transform: `rotate(${outcome.angle + turns}deg)`, offset: 1 }
    ], { duration, easing: 'linear', fill: 'none' }));
    animation.addEventListener('finish', () => {
      if (tossRevision !== gameRevision || !button.isConnected) return;
      finishToss(button, bottleObject, outcome);
    }, { once: true });
  }

  function createBottle(index, slot) {
    const button = document.createElement('button');
    button.className = 'bottle-button';
    button.type = 'button';
    button.dataset.bottle = index;
    button.dataset.angle = '0';
    button.dataset.slot = slot.id;
    button.dataset.x = slot.x;
    button.dataset.y = slot.y;
    button.style.left = `${slot.x}px`;
    button.style.top = `${slot.y}px`;
    button.setAttribute('aria-label', '抛起奶瓶');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = `
      <span class="bottle-earning" aria-hidden="true"></span>
      <span class="bottle-object" aria-hidden="true">
        <span class="bottle-nipple"></span>
        <span class="bottle-ring"></span>
        <span class="bottle-body"><span class="bottle-milk"></span><span class="bottle-marks"></span></span>
      </span>`;
    button.addEventListener('click', () => tossBottle(button));
    button.addEventListener('pointerenter', (event) => {
      if (state.hoverThrow && event.pointerType !== 'touch') tossBottle(button);
    });
    return button;
  }

  function buildLandingSlots() {
    const stageWidth = bottleStage.clientWidth || 720;
    const compact = stageWidth < 520;
    const horizontalPadding = compact ? 10 : 14;
    const topPadding = compact ? 72 : 86;
    const bottomPadding = compact ? 10 : 14;
    const cellWidth = compact ? 62 : 76;
    const cellHeight = compact ? 100 : 118;
    const columns = Math.max(1, Math.floor((stageWidth - horizontalPadding * 2) / cellWidth));
    const requiredSlots = state.bottles + Math.max(4, Math.ceil(state.bottles * .25));
    const minimumHeight = compact ? 430 : 540;
    const visibleRows = Math.max(1, Math.floor((minimumHeight - topPadding - bottomPadding) / cellHeight));
    const rows = Math.max(visibleRows, Math.ceil(requiredSlots / columns));
    const stageHeight = Math.max(minimumHeight, topPadding + bottomPadding + rows * cellHeight);
    const usedWidth = columns * cellWidth;
    const leftEdge = (stageWidth - usedWidth) / 2;
    bottleStage.style.minHeight = `${stageHeight}px`;
    layoutWidth = stageWidth;
    layoutHeight = stageHeight;

    const slots = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const slotId = slots.length;
        const xNoise = Math.sin((slotId + 1) * 12.9898) * 43758.5453;
        const yNoise = Math.sin((slotId + 101) * 78.233) * 43758.5453;
        slots.push({
          id: slotId,
          x: leftEdge + column * cellWidth + cellWidth / 2 + (xNoise - Math.floor(xNoise) - .5) * (compact ? 4 : 8),
          y: topPadding + row * cellHeight + (yNoise - Math.floor(yNoise) - .5) * (compact ? 2 : 6)
        });
      }
    }
    return slots;
  }

  function shuffledSlots(slots) {
    const shuffled = [...slots];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function renderBottles() {
    landingSlots = buildLandingSlots();
    const startingSlots = shuffledSlots(landingSlots);
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < state.bottles; index += 1) fragment.appendChild(createBottle(index, startingSlots[index]));
    bottleStage.replaceChildren(fragment);
  }

  function moveBottleToSlot(button, slot) {
    button.dataset.slot = slot.id;
    button.dataset.x = slot.x;
    button.dataset.y = slot.y;
    button.style.left = `${slot.x}px`;
    button.style.top = `${slot.y}px`;
  }

  function reflowBottles() {
    const bottles = [...bottleStage.querySelectorAll('.bottle-button')];
    if (!bottles.length) return;
    if (bottles.some((button) => button.classList.contains('is-tossing'))) {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(reflowBottles, 160);
      return;
    }

    const previousWidth = layoutWidth || bottleStage.clientWidth || 1;
    const previousHeight = layoutHeight || bottleStage.clientHeight || 1;
    const positions = bottles.map((button) => ({
      button,
      xRatio: Math.max(0, Math.min(1, Number(button.dataset.x) / previousWidth)),
      yRatio: Math.max(0, Math.min(1, Number(button.dataset.y) / previousHeight))
    }));

    landingSlots = buildLandingSlots();
    const availableSlots = [...landingSlots];
    bottleStage.classList.add('is-reflowing');

    positions.forEach(({ button, xRatio, yRatio }) => {
      const targetX = xRatio * layoutWidth;
      const targetY = yRatio * layoutHeight;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      availableSlots.forEach((slot, index) => {
        const distance = Math.hypot(slot.x - targetX, slot.y - targetY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const [slot] = availableSlots.splice(nearestIndex, 1);
      moveBottleToSlot(button, slot);
    });

    window.setTimeout(() => bottleStage.classList.remove('is-reflowing'), 280);
  }

  buyBottleButton.addEventListener('click', () => {
    const price = bottlePrice();
    if (state.money < price || state.bottles >= 30) return;
    const newBottleIndex = state.bottles;
    state.money -= price;
    state.bottles += 1;
    landingSlots = buildLandingSlots();
    const occupiedSlots = new Set(
      [...bottleStage.querySelectorAll('.bottle-button')].map((button) => Number(button.dataset.slot))
    );
    const availableSlots = landingSlots.filter((slot) => !occupiedSlots.has(slot.id));
    const newBottleSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    bottleStage.appendChild(createBottle(newBottleIndex, newBottleSlot));
    setAnnouncement(`花费 ${price} 元，新的奶瓶已经加入场地。`);
    saveState();
    updateUI();
    showGameToast(`已购买奶瓶，花费 ¥${price}`);
  });

  talentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const talent = button.dataset.buyTalent;
      const isDouble = talent === 'double';
      const cost = isDouble ? DOUBLE_TALENT_COST : HOVER_TALENT_COST;
      const alreadyUnlocked = isDouble ? state.doubleIncome : state.hoverThrow;
      if (alreadyUnlocked || state.money < cost) return;
      state.money -= cost;
      if (isDouble) state.doubleIncome = true;
      else state.hoverThrow = true;
      setAnnouncement(isDouble ? '双倍收益已生效：正立 2 元，倒立 12 元。' : '掠过即抛已生效：鼠标划过奶瓶就会自动抛起。');
      saveState();
      updateUI();
      playTalentUnlock(talent);
      showGameToast(isDouble ? '双倍收益已解锁' : '掠过即抛已解锁');
    });
  });

  resetButton.addEventListener('click', () => {
    if (!window.confirm('确定重新开始吗？资金、奶瓶和天赋都会重置。')) return;
    cancelActiveTosses();
    state = { ...defaultState };
    clearSavedState();
    renderBottles();
    updateUI();
    setAnnouncement('游戏已重新开始。准备好就抛一次。');
  });

  renderBottles();
  updateUI();

  if ('ResizeObserver' in window) {
    let observedWidth = bottleStage.clientWidth;
    const stageResizeObserver = new ResizeObserver(() => {
      const nextWidth = bottleStage.clientWidth;
      if (Math.abs(nextWidth - observedWidth) < 2) return;
      observedWidth = nextWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(reflowBottles, 120);
    });
    stageResizeObserver.observe(bottleStage);
  }
}
