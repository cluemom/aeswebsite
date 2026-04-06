/* ============================================================================
   Allied Event Service — Main JS
   Big bang origin → content explodes outward → globe spins up
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Full-page constellation background (homepage only)
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) initConstellation(bgCanvas);

  const heroEl = document.getElementById('hero');

  if (heroEl) {
    // 1. Explode particles outward from center
    const particleCanvas = document.getElementById('hero-canvas');
    if (particleCanvas) initParticles(particleCanvas);

    // 2. Fire the big bang overlay (canvas flash + rings + debris)
    initBigBang(heroEl, () => {
      // Called when the bang canvas has faded — sequence the hero content
      runHeroSequence();
    });

    // 3. Start the globe immediately (it appears as part of the bang)
    const globeCanvas = document.getElementById('globe-canvas');
    if (globeCanvas) initGlobe(globeCanvas);

    // 4. Hero spotlight (mouse follow)
    const spotlight = document.getElementById('hero-spotlight');
    heroEl.addEventListener('mousemove', e => {
      if (!spotlight) return;
      const r = heroEl.getBoundingClientRect();
      spotlight.style.background =
        `radial-gradient(700px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(18,212,224,0.08) 0%, transparent 65%)`;
    });
    heroEl.addEventListener('mouseleave', () => {
      if (spotlight) spotlight.style.background = '';
    });
  }

  initScrollEffects();
  initInteractions();
});


/* ─── HERO SEQUENCE ──────────────────────────────────────────────────────────
   Fired after the big bang fades (~800ms). Elements fly up from below
   in quick succession, feeling like debris settling after the explosion.
   ─────────────────────────────────────────────────────────────────────────── */
function runHeroSequence() {
  const els = [
    [0,   '.hero-eyebrow'],
    [200, '.hero-sub'],
    [340, '.hero-ctas'],
    [500, '.hero-scroll'],
  ];
  // Globe appears earlier (during the bang)
  setTimeout(() => {
    const g = document.querySelector('.hero-globe-wrap');
    if (g) g.classList.add('hero-visible');
  }, 200);

  els.forEach(([delay, sel]) => {
    setTimeout(() => {
      const el = document.querySelector(sel);
      if (el) el.classList.add('hero-visible');
    }, delay);
  });
}


/* ─── BIG BANG ───────────────────────────────────────────────────────────────
   Full-screen canvas overlay on the hero. A blinding flash at dead center,
   three expanding shockwave rings at different speeds, and 200 debris
   particles flying outward. After ~800ms it fades and calls onComplete.
   ─────────────────────────────────────────────────────────────────────────── */
function initBigBang(container, onComplete) {
  const bang = document.createElement('canvas');
  bang.style.cssText = `
    position:absolute; inset:0; z-index:20;
    pointer-events:none; width:100%; height:100%;
  `;
  // Set actual pixel dimensions
  bang.width  = container.offsetWidth  || window.innerWidth;
  bang.height = container.offsetHeight || window.innerHeight;
  container.appendChild(bang);

  const ctx = bang.getContext('2d');
  const cx  = bang.width  / 2;
  const cy  = bang.height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) + 50;

  // 200 debris particles — random outward directions, varying speeds
  const particles = Array.from({ length: 200 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 14;
    return {
      x: cx + (Math.random() - 0.5) * 4,
      y: cy + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.008 + Math.random() * 0.02,
      r: 0.5 + Math.random() * 2.8,
      cyan: Math.random() > 0.45, // mix of white and cyan
    };
  });

  // Three shockwave rings at different speeds
  const rings = [
    { r: 0, spd: 20, alpha: 0.9,  w: 3   },
    { r: 0, spd: 13, alpha: 0.65, w: 1.8 },
    { r: 0, spd:  8, alpha: 0.5,  w: 1   },
  ];

  let frame        = 0;
  let canvasAlpha  = 1;
  let completed    = false;

  function tick() {
    frame++;
    ctx.clearRect(0, 0, bang.width, bang.height);
    ctx.globalAlpha = canvasAlpha;

    // ── Central flash: expands then collapses back to nothing ──
    if (frame <= 20) {
      // First half: burst outward. Second half: shrink back in.
      const half = 10;
      let f, flashR;
      if (frame <= half) {
        f = 1 - frame / half;           // 1 → 0 (fading)
        flashR = 10 + (frame / half) * 220; // grows outward
      } else {
        f = 0;                           // fully transparent — collapsed
        flashR = 1;
      }
      if (f > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
        g.addColorStop(0,    `rgba(255,255,255,${f * 1.0})`);
        g.addColorStop(0.08, `rgba(200,245,255,${f * 0.9})`);
        g.addColorStop(0.25, `rgba(18,212,224,${f * 0.6})`);
        g.addColorStop(0.6,  `rgba(18,212,224,${f * 0.12})`);
        g.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, bang.width, bang.height);
      }
    }

    // ── Shockwave rings ──
    rings.forEach(ring => {
      ring.r += ring.spd;
      const a = ring.alpha * Math.max(0, 1 - ring.r / (maxR * 0.8));
      if (a <= 0.005) return;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(18,212,224,${a})`;
      ctx.lineWidth = ring.w;
      ctx.stroke();
    });

    // ── Debris particles ──
    particles.forEach(p => {
      if (p.life <= 0) return;
      p.x  += p.vx;   p.y  += p.vy;
      p.vx *= 0.965;  p.vy *= 0.965;
      p.life -= p.decay;
      if (p.life <= 0) return;
      const col = p.cyan ? `rgba(18,212,224,${p.life * 0.9})` : `rgba(255,255,255,${p.life * 0.75})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * Math.sqrt(p.life), 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // ── Fade out canvas starting at frame 38 ──
    if (frame >= 38) {
      canvasAlpha = Math.max(0, 1 - (frame - 38) / 22);
    }

    // ── Trigger onComplete at frame 38 (content starts appearing as bang fades) ──
    if (frame === 38 && !completed) {
      completed = true;
      if (onComplete) onComplete();
    }

    if (canvasAlpha > 0) {
      requestAnimationFrame(tick);
    } else {
      bang.remove();
    }
  }

  requestAnimationFrame(tick);
}


/* ─── SCROLL EFFECTS ─────────────────────────────────────────────────────── */
function initScrollEffects() {
  // Progress bar
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  // Nav glass
  const nav = document.getElementById('site-nav');
  if (nav) {
    const u = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', u, { passive: true });
    u();
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => ro.observe(el));
  }

  // Counters
  const counters = document.querySelectorAll('.count[data-target]');
  if (counters.length) {
    const ease = t => 1 - Math.pow(1 - t, 3);
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target, tgt = +el.dataset.target, t0 = performance.now();
        const tick = now => {
          const p = Math.min((now - t0) / 1800, 1);
          el.textContent = Math.round(ease(p) * tgt);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => co.observe(el));
  }

  // Scramble on scroll (section headings)
  document.querySelectorAll('[data-scramble-scroll]').forEach(el => {
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        so.unobserve(e.target);
        scrambleText(e.target);
      });
    }, { threshold: 0.4 });
    so.observe(el);
  });
}


/* ─── INTERACTIONS ───────────────────────────────────────────────────────── */
function initInteractions() {
  // Magnetic buttons
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    // 3D card tilt
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
        const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
        card.style.transform = `perspective(900px) rotateY(${dx * 7}deg) rotateX(${-dy * 5}deg) translateZ(6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // Mobile hamburger
  const hamburger = document.getElementById('nav-hamburger');
  const navMobile = document.getElementById('nav-mobile');
  if (hamburger && navMobile) {
    hamburger.addEventListener('click', () => {
      const open = navMobile.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navMobile.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navMobile.classList.contains('open')) {
        navMobile.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Contact accordion
  document.querySelectorAll('.contact-block-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const b = hdr.closest('.contact-block'), was = b.classList.contains('open');
      document.querySelectorAll('.contact-block').forEach(x => x.classList.remove('open'));
      if (!was) b.classList.add('open');
    });
  });

  // Quote form
  const qf = document.getElementById('quoteForm');
  if (qf) {
    const fi = document.getElementById('fileUpload');
    if (fi) fi.addEventListener('change', () => {
      const l = document.getElementById('fileName');
      if (l) l.textContent = fi.files[0]?.name || '';
    });
    qf.addEventListener('submit', e => {
      let ok = true;
      qf.querySelectorAll('[required]').forEach(f => {
        const v = f.value.trim() !== '';
        f.style.borderColor = v ? '' : '#f87171';
        if (!v) ok = false;
      });
      if (!ok) {
        e.preventDefault();
        const m = document.getElementById('quoteMsg');
        if (m) { m.textContent = 'Please fill in all required fields.'; m.className = 'form-msg error'; }
      }
    });
  }

  // View Transitions
  if (document.startViewTransition) {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
      e.preventDefault();
      document.startViewTransition(() => { window.location.href = href; });
    });
  }
}


/* ============================================================================
   3D WIREFRAME GLOBE
   Orthographic projection with Y-axis rotation. Meridians + parallels +
   vertex dots. Depth-based opacity — front face bright, back face dim.
   AES logo is a separate HTML element positioned on top.
   ============================================================================ */
function initGlobe(canvas) {
  const ctx  = canvas.getContext('2d');
  let   rot  = 0;

  function resize() {
    const wrap = canvas.parentElement;
    canvas.width  = wrap.offsetWidth  || 460;
    canvas.height = wrap.offsetHeight || 460;
  }

  function project(x3, y3, z3) {
    // Rotate around Y axis
    const c = Math.cos(rot), s = Math.sin(rot);
    const rx =  x3 * c + z3 * s;
    const ry =  y3;
    const rz = -x3 * s + z3 * c;

    // Tilt slightly on X so we see the top of the globe
    const tilt = 0.28;
    const tc   = Math.cos(tilt), ts = Math.sin(tilt);
    const ty   =  ry * tc - rz * ts;
    const tz   =  ry * ts + rz * tc;

    const R = Math.min(canvas.width, canvas.height) * 0.42;
    return {
      px: rx * R + canvas.width  / 2,
      py: ty * R + canvas.height / 2,
      depth: tz, // -1 (back) to +1 (front)
    };
  }

  function drawGlobe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const R  = Math.min(canvas.width, canvas.height) * 0.42;

    // ── Outer atmospheric halo ──
    const halo = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.25);
    halo.addColorStop(0,   'rgba(18,212,224,0.00)');
    halo.addColorStop(0.3, 'rgba(18,212,224,0.06)');
    halo.addColorStop(0.7, 'rgba(18,212,224,0.03)');
    halo.addColorStop(1,   'rgba(18,212,224,0.00)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // ── Sphere base fill (dark center, slight cyan edge) ──
    const sphere = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, 0, cx, cy, R);
    sphere.addColorStop(0,   'rgba(18,212,224,0.07)');
    sphere.addColorStop(0.5, 'rgba(10,14,22,0.35)');
    sphere.addColorStop(1,   'rgba(6,8,15,0.7)');
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Clip all wireframe drawing to the sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // ── Longitude lines (meridians) ──
    const lonStep = 20, latStep = 3;
    for (let lon = 0; lon < 360; lon += lonStep) {
      const theta = lon * Math.PI / 180;
      ctx.beginPath();
      let penDown = false;
      for (let lat = -90; lat <= 90; lat += latStep) {
        const phi = lat * Math.PI / 180;
        const p   = project(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
        const a   = Math.max(0, (p.depth + 1) / 2);
        if (a < 0.04) { penDown = false; continue; }
        penDown ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py);
        penDown = true;
      }
      ctx.strokeStyle = 'rgba(18,212,224,0.28)';
      ctx.lineWidth   = 0.55;
      ctx.stroke();
    }

    // ── Latitude lines (parallels) ──
    for (let lat = -80; lat <= 80; lat += 20) {
      const phi      = lat * Math.PI / 180;
      const isEquator = lat === 0;
      ctx.beginPath();
      let penDown = false;
      for (let lon = 0; lon <= 360; lon += 2) {
        const theta = lon * Math.PI / 180;
        const p     = project(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
        const a     = Math.max(0, (p.depth + 1) / 2);
        if (a < 0.04) { penDown = false; continue; }
        penDown ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py);
        penDown = true;
      }
      ctx.strokeStyle = isEquator ? 'rgba(18,212,224,0.7)' : 'rgba(18,212,224,0.25)';
      ctx.lineWidth   = isEquator ? 1.1 : 0.55;
      ctx.stroke();
    }

    // ── Vertex dots at grid intersections ──
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = 0; lon < 360; lon += 20) {
        const phi   = lat * Math.PI / 180;
        const theta = lon * Math.PI / 180;
        const p     = project(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
        if (p.depth < 0) continue; // only front face
        const brightness = (p.depth + 1) / 2;
        ctx.beginPath();
        ctx.arc(p.px, p.py, 1.6 * brightness, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(18,212,224,${brightness * 0.85})`;
        ctx.fill();
      }
    }

    ctx.restore();

    // ── Edge ring ──
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(18,212,224,0.22)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    // ── Secondary inner glow ring ──
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(18,212,224,0.06)';
    ctx.lineWidth   = 4;
    ctx.stroke();

    rot += 0.004; // slow, steady rotation
    requestAnimationFrame(drawGlobe);
  }

  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  drawGlobe();
}


/* ============================================================================
   PARTICLE CANVAS
   All nodes spawn at the hero center with outward velocity (big bang).
   They drift apart naturally as speed decays. Pulse rings emanate randomly.
   ============================================================================ */
function initParticles(canvas) {
  const ctx  = canvas.getContext('2d');
  let nodes  = [];
  let pulses = [];
  let frameN = 0;
  let mX = -9999, mY = -9999;

  const CFG = {
    count:       110,
    connectDist: 170,
    mouseRange:  130,
    maxSpeed:    1.4,
    friction:    0.983,
    pulseEvery:  90,
  };

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  function buildNodes() {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    // Spread threshold: nodes stay invisible until this far from center.
    // This kills the blob — particles only appear once they've scattered.
    const minDist = Math.min(canvas.width, canvas.height) * 0.22;
    nodes = Array.from({ length: CFG.count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 11; // explosive spread
      return {
        x:  cx + (Math.random() - 0.5) * 6,
        y:  cy + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  0.9 + Math.random() * 2,
        maxOpacity: 0.38 + Math.random() * 0.42,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        minDist, // won't show until past this radius
        cx, cy,
      };
    });
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameN++;

    // Pulse rings
    if (frameN % CFG.pulseEvery === 0 && nodes.length) {
      const src = nodes[Math.floor(Math.random() * nodes.length)];
      pulses.push({ x: src.x, y: src.y, r: 0, alpha: 0.5 });
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += 2; p.alpha *= 0.92;
      if (p.alpha < 0.005) { pulses.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(18,212,224,${p.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Update nodes
    const t = Date.now() * 0.001;
    nodes.forEach(n => {
      // Only fade in once the node has cleared the center blob radius
      const dx0 = n.x - n.cx, dy0 = n.y - n.cy;
      const distC = Math.sqrt(dx0 * dx0 + dy0 * dy0);
      if (distC > n.minDist && n.opacity < n.maxOpacity) {
        n.opacity = Math.min(n.opacity + 0.018, n.maxOpacity);
      }

      // Mouse attraction
      const dx = mX - n.x, dy = mY - n.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < CFG.mouseRange && d > 1) {
        const s = ((CFG.mouseRange - d) / CFG.mouseRange) * 0.015;
        n.vx += dx * s; n.vy += dy * s;
      }

      n.vx *= CFG.friction; n.vy *= CFG.friction;
      const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (spd > CFG.maxSpeed) { n.vx = n.vx / spd * CFG.maxSpeed; n.vy = n.vy / spd * CFG.maxSpeed; }

      n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = canvas.width  + 10;
      if (n.x > canvas.width  + 10) n.x = -10;
      if (n.y < -10) n.y = canvas.height + 10;
      if (n.y > canvas.height + 10) n.y = -10;
    });

    // Connections — only between nodes that have faded in (kills the center blob)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (a.opacity <= 0 || b.opacity <= 0) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CFG.connectDist * CFG.connectDist) {
          const vis = Math.min(a.opacity / a.maxOpacity, b.opacity / b.maxOpacity);
          const alpha = (1 - Math.sqrt(d2) / CFG.connectDist) * 0.32 * vis;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(18,212,224,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach(n => {
      const b = n.opacity + Math.sin(t * 0.9 + n.phase) * (n.maxOpacity * 0.22);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(18,212,224,${Math.max(0, b)})`;
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }

  const hero = canvas.closest('.hero') || document.body;
  hero.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mX = e.clientX - r.left; mY = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mX = -9999; mY = -9999; });

  new ResizeObserver(() => { resize(); buildNodes(); }).observe(canvas.parentElement || document.body);
  resize();
  buildNodes();
  tick();
}


/* ============================================================================
   FULL-PAGE CONSTELLATION BACKGROUND
   Nodes spread randomly across the viewport. Mouse repels nearby nodes.
   Connecting lines between close pairs. Nodes twinkle. Pulse rings fire
   from random nodes. Runs behind all page content (z-index 0).
   ============================================================================ */
function initConstellation(canvas) {
  const ctx = canvas.getContext('2d');
  let nodes = [], pulses = [], frameN = 0;
  let mX = -9999, mY = -9999;

  const CFG = {
    count:       140,
    connectDist: 160,
    mouseRange:  150,
    repulse:     0.045,
    maxSpeed:    1.2,
    friction:    0.96,
    pulseEvery:  80,
  };

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function buildNodes() {
    const w = canvas.width, h = canvas.height;
    const area = w * h;
    // ~1 node per 11 000px² on desktop; fewer on small screens
    const count = Math.round(Math.min(Math.max(area / 11000, 30), 140));
    // Shorter connect distance on small viewports so lines don't flood
    CFG.connectDist = Math.min(160, w * 0.18);
    nodes = Array.from({ length: count }, () => ({
      x:          Math.random() * w,
      y:          Math.random() * h,
      vx:         (Math.random() - 0.5) * 0.4,
      vy:         (Math.random() - 0.5) * 0.4,
      r:          0.8 + Math.random() * 1.8,
      maxOpacity: 0.3 + Math.random() * 0.45,
      opacity:    0,
      phase:      Math.random() * Math.PI * 2,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameN++;
    const t = Date.now() * 0.001;

    // Pulse rings
    if (frameN % CFG.pulseEvery === 0 && nodes.length) {
      const src = nodes[Math.floor(Math.random() * nodes.length)];
      if (src.opacity > 0.1) pulses.push({ x: src.x, y: src.y, r: 0, alpha: 0.45 });
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += 1.8; p.alpha *= 0.93;
      if (p.alpha < 0.005) { pulses.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(18,212,224,${p.alpha * 0.6})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // Update nodes
    nodes.forEach(n => {
      // Fade in gradually
      if (n.opacity < n.maxOpacity) n.opacity = Math.min(n.opacity + 0.004, n.maxOpacity);

      // Mouse repulsion
      const dx = n.x - mX, dy = n.y - mY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < CFG.mouseRange && d > 1) {
        const force = ((CFG.mouseRange - d) / CFG.mouseRange) * CFG.repulse;
        n.vx += (dx / d) * force;
        n.vy += (dy / d) * force;
      }

      n.vx *= CFG.friction; n.vy *= CFG.friction;
      const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (spd > CFG.maxSpeed) { n.vx = n.vx / spd * CFG.maxSpeed; n.vy = n.vy / spd * CFG.maxSpeed; }

      n.x += n.vx; n.y += n.vy;

      // Wrap edges
      if (n.x < -10) n.x = canvas.width  + 10;
      if (n.x > canvas.width  + 10) n.x = -10;
      if (n.y < -10) n.y = canvas.height + 10;
      if (n.y > canvas.height + 10) n.y = -10;
    });

    // Connection lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (a.opacity <= 0 || b.opacity <= 0) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CFG.connectDist * CFG.connectDist) {
          const vis   = Math.min(a.opacity / a.maxOpacity, b.opacity / b.maxOpacity);
          const alpha = (1 - Math.sqrt(d2) / CFG.connectDist) * 0.28 * vis;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(18,212,224,${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // Nodes (twinkling)
    nodes.forEach(n => {
      const twinkle = n.opacity + Math.sin(t * 1.1 + n.phase) * (n.maxOpacity * 0.28);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(18,212,224,${Math.max(0, twinkle)})`;
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; });
  window.addEventListener('mouseleave', () => { mX = -9999; mY = -9999; });
  window.addEventListener('resize', () => { resize(); buildNodes(); });

  resize();
  buildNodes();
  tick();
}


/* ============================================================================
   TEXT SCRAMBLE  (scroll-triggered section headings only)
   ============================================================================ */
function scrambleText(el) {
  if (!el || el.dataset.scrambled) return;
  el.dataset.scrambled = '1';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&';
  const FRAME_MS = 38, RESOLVE_PER = 2;

  const segments = [];
  el.childNodes.forEach(n => {
    if (n.nodeType === Node.TEXT_NODE) segments.push({ node: n, orig: n.textContent });
  });
  if (!segments.length) return;

  el.classList.add('scrambling');
  let frame = 0;
  const total = segments.reduce((s, g) => s + g.orig.replace(/\s/g, '').length, 0);
  const maxFrames = Math.ceil(total / RESOLVE_PER) + 5;

  const iv = setInterval(() => {
    segments.forEach(seg => {
      let out = '', nsb = 0;
      for (let i = 0; i < seg.orig.length; i++) {
        const ch = seg.orig[i];
        if (/\s/.test(ch)) { out += ch; continue; }
        out += nsb < frame * RESOLVE_PER
          ? ch
          : CHARS[Math.floor(Math.random() * CHARS.length)];
        nsb++;
      }
      seg.node.textContent = out;
    });
    frame++;
    if (frame > maxFrames) {
      clearInterval(iv);
      segments.forEach(s => { s.node.textContent = s.orig; });
      el.classList.remove('scrambling');
    }
  }, FRAME_MS);
}
