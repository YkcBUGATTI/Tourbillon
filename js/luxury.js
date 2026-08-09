/* ============================================================
   Bugatti Tourbillon · Luxury 增强层脚本
   叠加于 js/main.js 之后执行；只做视觉增强，
   不触碰 main.js 已占用的属性（.hero__content 的 transform、
   .hero__video 的 opacity、.tilt 的 inline transform 等）。
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. Hero 滚动视差：媒体下沉 + 内容淡出 ----------
     只写 .hero__media 的 transform 与 .hero__content 的 opacity，
     与 main.js 的 onScroll（hero content 缩放 / video 淡出）互不冲突。 */
  var heroMedia = document.querySelector('.hero__media');
  var heroContent = document.querySelector('.hero__content');
  if (!prefersReduced && heroMedia) {
    var hero = heroMedia.closest('.hero');
    var ticking = false;
    function luxOnScroll() {
      ticking = false;
      var y = window.pageYOffset || window.scrollY || 0;
      /* 位移幅度随 hero 出视口衰减（与 main.js 的视频淡出同步），避免滚动中段露出媒体边缘 */
      var hh = hero ? hero.offsetHeight : window.innerHeight;
      var k = Math.max(0, 1 - y / (hh * 0.75));
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.28 * k).toFixed(1) + 'px,0)';
      if (heroContent) {
        var fade = Math.max(0, 1 - y / (window.innerHeight * 0.9));
        heroContent.style.opacity = String(fade);
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(luxOnScroll);
      }
    }, { passive: true });
    luxOnScroll();
  }

  /* ---------- 2. 补充滚动显现 ----------
     只观察未被 main.js 处理的元素（已带 .reveal 的自动排除），
     复用 is-in 机制与 .lux-reveal 过渡类。 */
  var LUX_SELECTORS = [
    '.footer__portal',
    '.footer__contact',
    '.story__note:not(.reveal)',
    '.bigstats:not(.reveal)',
    '.webcards:not(.reveal)',
    '.accel:not(.reveal)',
    '.pt__grid:not(.reveal)',
    '.tl-body:not(.reveal)'
  ].join(', ');
  var luxEls = Array.prototype.slice.call(document.querySelectorAll(LUX_SELECTORS));
  if (luxEls.length) {
    if ('IntersectionObserver' in window) {
      var luxIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            luxIO.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      luxEls.forEach(function (el) { el.classList.add('lux-reveal'); luxIO.observe(el); });
    } else {
      /* 无 IO 环境直接显示 */
      luxEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- 3. 卡片蓝色径向光跟随鼠标 ----------
     .dcard 已由 main.js 写入 --mx/--my，这里为其余大卡片补写；
     写入的是 CSS 变量，不产生 transform 冲突。 */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.hcard, .bstat, .modes__panel, .ptcard, .tour__card, .dcard2').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- 4. 懒加载兜底（防御性）：未来新增图片自动补属性 ---------- */
  document.querySelectorAll('img:not([loading])').forEach(function (img) {
    var r = img.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.6) img.setAttribute('loading', 'lazy');
  });
})();
