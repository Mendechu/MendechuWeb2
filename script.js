/* ============================================================
   Alvi Chowdhury — Portfolio Runtime (Complete Build)
   ============================================================ */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger);

const MQ_MOBILE = window.matchMedia('(max-width: 900px)');
const MQ_TOUCH  = window.matchMedia('(hover: none)');
const REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile = () => MQ_MOBILE.matches;
const isTouch  = () => MQ_TOUCH.matches;
const lerp     = (a, b, t) => a + (b - a) * t;

function module(name, fn) {
  try { fn(); }
  catch (err) { console.error(`[${name}] failed:`, err); }
}

window.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

  /* ---------------------------------------------------------
     VANTA.JS SUBTLE AMBIENT FLUID SHADER
  --------------------------------------------------------- */
  module('vanta', () => {
    if (typeof VANTA !== 'undefined' && typeof THREE !== 'undefined' && !REDUCED) {
      VANTA.FOG({
        el: "#vanta-canvas",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0x00f0ff,
        midtoneColor: 0x140a28,
        lowlightColor: 0x06070b,
        baseColor: 0x06070b,
        blurFactor: 0.75,
        speed: 0.65,
        zoom: 0.85
      });
    }
  });

  /* ---------------------------------------------------------
     MASTER BACKGROUND DRIFT
  --------------------------------------------------------- */
  module('masterBgDrift', () => {
    const masterImg = document.getElementById('master-bg-img');
    if (!masterImg || REDUCED) return;

    gsap.to(masterImg, {
      yPercent: -6,
      scale: 1.12,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5
      }
    });
  });

  /* ---------------------------------------------------------
     SECTION 1 — HERO
  --------------------------------------------------------- */
  module('hero', () => {
    const heroEl       = document.getElementById('hero');
    const canvas       = document.getElementById('hero-canvas');
    const canvasWrap   = document.getElementById('hero-canvas-wrap');
    if (!heroEl || !canvas) return;

    const ctx          = canvas.getContext('2d');
    const heroContent1 = document.getElementById('hero-content-1');
    const heroContent2 = document.getElementById('hero-content-2');
    const surrealNav   = document.getElementById('surreal-nav');
    const indicator    = document.getElementById('scroll-indicator');
    const loader       = document.getElementById('hero-loader');

    const TOTAL_FRAMES = 480;
    const STEP    = isMobile() ? 3 : 1;
    const indices = [];
    for (let i = 0; i < TOTAL_FRAMES; i += STEP) indices.push(i);

    const images = new Map();
    const seq    = { frame: 0 };
    let lastDrawnIndex = -1;

    const framePath = i => `./3dHero/webb${String(i).padStart(3, '0')}.png`;

    let cw = 0, ch = 0, ratio = 1, offX = 0, offY = 0;

    function fitCanvas() {
      cw = canvas.width  = window.innerWidth;
      ch = canvas.height = window.innerHeight;
      const sample = images.get(0);
      if (sample && sample.naturalWidth > 0) {
        ratio = Math.max(cw / sample.naturalWidth, ch / sample.naturalHeight);
        offX  = (cw - sample.naturalWidth  * ratio) / 2;
        offY  = (ch - sample.naturalHeight * ratio) / 2;
      }
    }

    function nearestLoaded(target) {
      if (images.has(target)) return images.get(target);
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        if (images.has(target - d)) return images.get(target - d);
        if (images.has(target + d)) return images.get(target + d);
      }
      return null;
    }

    function drawFrame(frameNumber) {
      const snapped = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(frameNumber / STEP) * STEP));
      if (snapped === lastDrawnIndex && lastDrawnIndex !== -1) return;

      const img = nearestLoaded(snapped);
      if (!img) return;

      lastDrawnIndex = snapped;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, offX, offY, img.naturalWidth * ratio, img.naturalHeight * ratio);
    }

    const CONCURRENCY = 8;
    let cursor = 0, loaded = 0, refreshedOnce = false;

    function loadOne() {
      if (cursor >= indices.length) return;
      const idx = indices[cursor++];
      const img = new Image();
      img.decoding = 'async';
      img.src = framePath(idx);

      const done = () => {
        loaded++;
        if (loader) {
          const pct = Math.round((loaded / indices.length) * 100);
          loader.textContent = pct < 100 ? `Loading ${pct}%` : '';
          if (pct >= 100) loader.classList.add('is-done');
        }
        if (!refreshedOnce && images.has(0)) {
          refreshedOnce = true;
          fitCanvas();
          lastDrawnIndex = -1;
          drawFrame(0);
          ScrollTrigger.refresh();
        }
        loadOne();
      };

      img.onload  = () => { images.set(idx, img); done(); };
      img.onerror = () => { done(); };
    }

    const first = new Image();
    first.src = framePath(0);
    first.onload = () => {
      images.set(0, first);
      fitCanvas();
      lastDrawnIndex = -1;
      drawFrame(0);
      for (let i = 0; i < CONCURRENCY; i++) loadOne();
    };

    let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
    let scrollStarted = false;

    if (!isTouch() && !REDUCED) {
      heroEl.addEventListener('mousemove', e => {
        if (scrollStarted) return;
        const r = heroEl.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        targetTiltY = nx * 3.5;
        targetTiltX = -ny * 3.5;
      });
      heroEl.addEventListener('mouseleave', () => { targetTiltX = 0; targetTiltY = 0; });
    }

    function tick() {
      requestAnimationFrame(tick);
      drawFrame(seq.frame);

      if (seq.frame > 0.5) scrollStarted = true;
      else scrollStarted = false;
      if (scrollStarted) { targetTiltX = 0; targetTiltY = 0; }

      if (canvasWrap && !isTouch() && !REDUCED) {
        tiltX = lerp(tiltX, targetTiltX, 0.025);
        tiltY = lerp(tiltY, targetTiltY, 0.025);
        canvasWrap.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`;
      }
    }
    tick();

    if (REDUCED) {
      gsap.set([heroContent1, heroContent2], { autoAlpha: 1, y: 0 });
      gsap.set(surrealNav, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set([heroContent1, heroContent2], { y: 120, autoAlpha: 0 });

    const HERO_SCROLL = isMobile() ? '+=1200%' : '+=2200%';
    const SCRUB        = 1.5;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: HERO_SCROLL,
        scrub: SCRUB,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          if (!indicator) return;
          gsap.to(indicator, { opacity: self.progress > 0.015 ? 0 : 1, duration: 0.3, overwrite: 'auto' });
        }
      }
    });

    tl.to(seq, { frame: TOTAL_FRAMES - 1, ease: 'none', duration: 100 }, 0);

    tl.to(heroContent1, { autoAlpha: 1, y: 0, duration: 12.0, ease: 'power1.out' }, 46.0)
      .to(heroContent1, { autoAlpha: 0, y: -140, duration: 8.0, ease: 'power1.in' }, 64.0);

    tl.to(heroContent2, { autoAlpha: 1, y: 0, duration: 12.0, ease: 'power1.out' }, 72.0)
      .to(heroContent2, { autoAlpha: 0, y: -140, duration: 8.0, ease: 'power1.in' }, 88.0);

    tl.to(surrealNav, { autoAlpha: 1, y: 0, duration: 4.0, ease: 'power2.out' }, 92.0);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { fitCanvas(); lastDrawnIndex = -1; fitCanvas(); ScrollTrigger.refresh(); }, 150);
    });
  });

  /* ---------------------------------------------------------
     STARDUST ENGINE
  --------------------------------------------------------- */
  module('stardust', () => {
    const cv = document.getElementById('starfield-canvas');
    if (!cv || REDUCED) return;

    const ctx = cv.getContext('2d');
    let w = cv.width  = window.innerWidth;
    let h = cv.height = window.innerHeight;

    const COUNT = isMobile() ? 30 : 60;
    const dust  = [];
    const mouse = { x: -9999, y: -9999 };
    let running = true;
    let shooting = null;

    if (!isTouch()) {
      window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    }

    for (let i = 0; i < COUNT; i++) {
      let px;
      if (Math.random() < 0.6) {
        px = Math.random() < 0.5 ? Math.random() * (w * 0.3) : w - Math.random() * (w * 0.3);
      } else {
        px = Math.random() * w;
      }

      dust.push({
        x: px, 
        y: Math.random() * h,
        r: Math.random() * 0.9 + 0.3,
        vx: (Math.random() - 0.5) * 0.07,
        vy: (Math.random() - 0.5) * 0.07,
        rx: 0, ry: 0,
        a: Math.random() * 0.6 + 0.2
      });
    }

    function scheduleShootingStar() {
      shooting = {
        x: Math.random() * w, y: 0,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 13 + 7,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        opacity: 0.9
      };
      setTimeout(scheduleShootingStar, Math.random() * 8000 + 4000);
    }
    setTimeout(scheduleShootingStar, 2500);

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(render);
    });

    function render() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const p of dust) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          const force = (1 - dist / 130) * 5;
          const ang = Math.atan2(dy, dx);
          p.rx += Math.cos(ang) * force;
          p.ry += Math.sin(ang) * force;
        }
        p.rx *= 0.88; p.ry *= 0.88;
        p.x += p.vx + p.rx;
        p.y += p.vy + p.ry;

        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      }

      if (shooting) {
        shooting.x += Math.cos(shooting.angle) * shooting.speed;
        shooting.y += Math.sin(shooting.angle) * shooting.speed;
        shooting.opacity -= 0.015;

        const tailX = shooting.x - Math.cos(shooting.angle) * shooting.len;
        const tailY = shooting.y - Math.sin(shooting.angle) * shooting.len;
        const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
        grad.addColorStop(0, `rgba(0,240,255,${Math.max(0, shooting.opacity)})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (shooting.opacity <= 0 || shooting.y > h) shooting = null;
      }

      requestAnimationFrame(render);
    }
    render();

    window.addEventListener('resize', () => {
      w = cv.width  = window.innerWidth;
      h = cv.height = window.innerHeight;
    });
  });

  /* ---------------------------------------------------------
     SECTION 2 — STAGED INTRO
  --------------------------------------------------------- */
  module('section-2', () => {
    const el = document.getElementById('section-2');
    if (!el) return;

    const target   = document.getElementById('s2-text1');
    const fullText = 'Hi, I am Alvi,';
    const typing   = { length: 0 };
    const writeText = () => { if (target) target.textContent = fullText.substring(0, Math.floor(typing.length)); };

    if (REDUCED) {
      typing.length = fullText.length; writeText();
      gsap.set(['#s2-text2', '#s2-p', '#bustReveal', '#s2-bottom'], { opacity: 1, y: 0 });
      return;
    }

    const mobile = isMobile();

    const tl = gsap.timeline({
      scrollTrigger: mobile
        ? { trigger: el, start: 'top 65%', once: true }
        : { trigger: el, start: 'top top', end: '+=600%', pin: true, scrub: 2.5, invalidateOnRefresh: true }
    });

    tl.to(typing, { length: fullText.length, duration: 3.0, ease: 'none', onUpdate: writeText })
      .to({}, { duration: mobile ? 0.2 : 2.5 })
      .to('#s2-text2',   { opacity: 1, y: 0, duration: 3.0, ease: 'sine.out' })
      .to({}, { duration: mobile ? 0.2 : 2.5 })
      .to('#s2-p',       { opacity: 1, y: 0, duration: 3.0, ease: 'sine.out' })
      .to({}, { duration: mobile ? 0.2 : 2.5 })
      .to('#bustReveal', { opacity: 1, y: 0, duration: 3.0, ease: 'sine.out' })
      .to({}, { duration: mobile ? 0.2 : 2.5 })
      .to('#s2-bottom',  { opacity: 1, y: 0, duration: 3.0, ease: 'sine.out' })
      .to({}, { duration: mobile ? 0 : 3.0 });
  });

  /* ---------------------------------------------------------
     SECTION 3 — THE SWITCH
  --------------------------------------------------------- */
  module('section-3', () => {
    const el = document.getElementById('section-3');
    if (!el || isMobile() || REDUCED) return;

    gsap.set('#s3-tag, #s3-title, #s3-desc, #s3-frame', { opacity: 0, y: 40 });

    gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top top', end: '+=300%', pin: true, scrub: 2.2, invalidateOnRefresh: true }
    })
    .to('#s3-tag',   { opacity: 1, y: 0, duration: 2.0, ease: 'sine.out' })
    .to('#s3-title', { opacity: 1, y: 0, duration: 2.0, ease: 'sine.out' }, '-=0.8')
    .to('#s3-desc',  { opacity: 1, y: 0, duration: 2.0, ease: 'sine.out' }, '-=0.8')
    .to('#s3-frame', { opacity: 1, y: 0, duration: 2.2, ease: 'sine.out' }, '-=0.6')
    .to({}, { duration: 2.0 });
  });

  /* ---------------------------------------------------------
     VISUAL NARRATIVES — 3D CAROUSEL
  --------------------------------------------------------- */
  module('narratives', () => {
    const stage = document.getElementById('ring-stage');
    const ring  = document.getElementById('ring-carousel');
    const modal = document.getElementById('lightbox-modal');
    const modalContent = document.getElementById('modal-content');
    const modalClose   = document.getElementById('modal-close');
    const sec   = document.getElementById('narratives');
    if (!stage || !ring || !sec) return;

    const items = Array.from(ring.querySelectorAll('.ring-item'));
    if (!items.length) return;

    const RADIUS = 360;
    const step = 360 / items.length;
    items.forEach((el, i) => {
      el.style.transform = `rotateY(${i * step}deg) translateZ(${RADIUS}px)`;
    });

    let angle = 0;
    let isDragging = false;
    let startX = 0;
    let dragVelocity = 0;
    let scrollVelocity = 0;
    let autoSpeed = 0.045;

    stage.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      dragVelocity = deltaX * 0.15;
      angle += dragVelocity;
      startX = e.clientX;
      ring.style.transform = `rotateY(${angle}deg)`;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    stage.addEventListener('touchstart', e => {
      isDragging = true;
      startX = e.touches[0].clientX;
    });
    window.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX;
      dragVelocity = deltaX * 0.15;
      angle += dragVelocity;
      startX = e.touches[0].clientX;
      ring.style.transform = `rotateY(${angle}deg)`;
    });
    window.addEventListener('touchend', () => { isDragging = false; });

    if (!isMobile() && !REDUCED) {
      ScrollTrigger.create({
        trigger: sec,
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: 1.5,
        onUpdate: self => {
          scrollVelocity = self.getVelocity() * 0.0035;
        }
      });
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!isDragging) {
        dragVelocity *= 0.95;
        scrollVelocity *= 0.92;
        angle += autoSpeed + dragVelocity + scrollVelocity;
        ring.style.transform = `rotateY(${angle}deg)`;
      }
    }
    tick();

    items.forEach(item => {
      item.addEventListener('click', () => {
        const src = item.getAttribute('data-src');
        if (!src) return;
        modalContent.innerHTML = `<img src="${src}" class="w-full h-auto max-h-[80vh] object-contain rounded-lg" />`;
        modal.classList.add('active');
      });
    });

    function closeModal() {
      modal.classList.remove('active');
      modalContent.innerHTML = '';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  });

  /* ---------------------------------------------------------
     TIMELINE
  --------------------------------------------------------- */
  module('timeline', () => {
    const container = document.getElementById('timeline-container');
    const section   = document.getElementById('section-experience');
    const rail      = document.getElementById('timeline-rail');
    const closer    = document.getElementById('timeline-closer');
    if (!container || !section) return;

    function alignRail() {
      if (!rail || !closer || isMobile()) return;
      const containerRect = container.getBoundingClientRect();
      const closerRect    = closer.getBoundingClientRect();
      const startX = 96;
      const endX   = closerRect.left - containerRect.left;
      rail.style.left  = `${startX}px`;
      rail.style.width = `${Math.max(0, endX - startX)}px`;
    }

    alignRail();
    window.addEventListener('resize', alignRail);

    if (isMobile() || REDUCED) {
      section.classList.add('timeline-stacked');
      return;
    }

    const distance = () => -(container.scrollWidth - window.innerWidth + 80);
    const tween = gsap.to(container, { x: distance, ease: 'none' });

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.abs(distance()) * 2.2}`,
      pin: true,
      animation: tween,
      scrub: 1.8,
      invalidateOnRefresh: true,
      onUpdate: alignRail
    });
  });

  /* ---------------------------------------------------------
     MAGNETIC FOOTER BUTTON
  --------------------------------------------------------- */
  module('magnetic', () => {
    const btn = document.getElementById('magnetic-btn');
    if (!btn || isTouch() || REDUCED) return;

    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width  / 2) * 0.3,
        y: (e.clientY - r.top  - r.height / 2) * 0.3,
        duration: 0.3, ease: 'power3.out'
      });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
    });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  ScrollTrigger.refresh();
});