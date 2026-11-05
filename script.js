const dots = [...document.querySelectorAll('#dots a')];
const secs = [...document.querySelectorAll('section')];
const box = document.getElementById('dots');

// penanda kotak di kiri ikut berganti saat scroll
secs.forEach((sec, i) => {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      dots.forEach((d, j) => d.classList.toggle('on', i === j));
      box.classList.toggle('terang', sec.dataset.terang === '1');
    });
  }, { threshold: 0.55 }).observe(sec);
});
dots[0].classList.add('on');

// ===== Galeri poster: carousel, poster aktif di tengah =====
const gal = document.getElementById('gal');
const cards = [...gal.querySelectorAll('.pcard')];
const pcount = document.getElementById('pcount');
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const n = cards.length;
let idx = 0, dragging = false, startX = 0, dx = 0, moved = 0;
const prevO = new Array(n).fill(null);

function layout() {
  cards.forEach((el, i) => {
    const o = ((i - idx + Math.floor(n / 2)) % n + n) % n - Math.floor(n / 2);
    const jump = prevO[i] !== null && Math.abs(o - prevO[i]) > 1.5;
    if (jump) el.style.transition = 'none';          // kartu yang "berputar" pindah tanpa terbang melintas
    el.style.setProperty('--o', o);
    el.classList.toggle('side', Math.abs(o) === 1);
    el.classList.toggle('hide', Math.abs(o) > 1);
    el.tabIndex = o === 0 ? 0 : -1;
    if (jump) { el.offsetWidth; el.style.transition = ''; }
    prevO[i] = o;
  });
  pcount.textContent = `${idx + 1} / ${n}`;
}
const go = d => { idx = ((idx + d) % n + n) % n; layout(); };

document.getElementById('prev').addEventListener('click', () => go(-1));
document.getElementById('next').addEventListener('click', () => go(1));
gal.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') go(-1);
  if (e.key === 'ArrowRight') go(1);
});

// geser dengan mouse atau jari
gal.addEventListener('pointerdown', e => {
  dragging = true; startX = e.clientX; dx = 0; moved = 0; gal.classList.add('drag');
});
addEventListener('pointermove', e => {
  if (!dragging) return;
  dx = e.clientX - startX; moved = Math.abs(dx);
  gal.style.setProperty('--dx', dx + 'px');
  cards.forEach(c => c.style.setProperty('--dx', dx + 'px'));
});
function endDrag() {
  if (!dragging) return;
  dragging = false; gal.classList.remove('drag');
  cards.forEach(c => c.style.setProperty('--dx', '0px'));
  if (dx > 60) go(-1); else if (dx < -60) go(1);
}
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);

gal.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) { go(e.deltaX > 0 ? 1 : -1); e.preventDefault(); }
}, { passive: false });

// klik poster tengah untuk memperbesar; klik poster samping untuk memajukannya ke tengah
cards.forEach((card, i) => card.addEventListener('click', () => {
  if (moved > 6) return;
  const o = Number(card.style.getPropertyValue('--o'));
  if (o !== 0) { go(o); return; }
  const img = card.querySelector('img');
  lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('on');
}));
lb.addEventListener('click', () => lb.classList.remove('on'));
addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('on'); });

layout();

// ===== Efek pindah bagian =====
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1) elemen muncul saat bagian masuk layar, dan diulang tiap kembali ke bagian itu
secs.forEach(sec => {
  const els = [...sec.querySelectorAll('[data-r]')];
  new IntersectionObserver(([e]) => {
    if (e.intersectionRatio >= 0.3) els.forEach(el => el.classList.add('in'));
    else if (e.intersectionRatio === 0) els.forEach(el => el.classList.remove('in'));
  }, { threshold: [0, 0.3] }).observe(sec);
});

// 2) garis progres di atas + latar bergerak lebih lambat (parallax)
const bar = document.getElementById('progress');
const bgs = secs.map(s => s.querySelector('.bg')).filter(Boolean);
let ticking = false;
function onScroll() {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (reduce) return;
  bgs.forEach(bg => {
    const r = bg.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    bg.style.transform = `translate3d(0,${-r.top * 0.12}px,0)`;
  });
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();