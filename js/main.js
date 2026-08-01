/* ============================================================
   Bugatti Tourbillon · 交互脚本（原生 JS，无依赖）
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- v27 · Service Worker 注册（需 http/https，file:// 自动跳过） ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- Hero 标题逐字入场 ---------- */
  var heroTitleEl = document.querySelector('.hero__title');
  if (heroTitleEl) {
    var text = heroTitleEl.textContent;
    var letters = text.split('').map(function (ch, i) {
      if (ch === ' ') return ' ';
      return '<span style="--d:' + (0.25 + i * 0.05).toFixed(2) + 's">' + ch + '</span>';
    }).join('');
    heroTitleEl.innerHTML = letters;
  }

  /* ---------- 工具 ---------- */
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function isInView(el, margin) {
    var r = el.getBoundingClientRect();
    var m = margin || 0;
    return r.top < window.innerHeight - m && r.bottom > m;
  }

  /* ---------- 自定义光标 ---------- */
  var cursorEl = document.querySelector('.cursor');
  if (cursorEl && finePointer && !prefersReduced) {
    var cx = -100, cy = -100, tx = -100, ty = -100, cursorRaf = null;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (cursorRaf === null) {
        cursorRaf = requestAnimationFrame(function loop() {
          cx = lerp(cx, tx, 0.28);
          cy = lerp(cy, ty, 0.28);
          cursorEl.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
          if (Math.abs(cx - tx) < 0.4 && Math.abs(cy - ty) < 0.4) {
            cx = tx; cy = ty;
            cursorRaf = null;
            return;
          }
          cursorRaf = requestAnimationFrame(loop);
        });
      }
    });
    document.addEventListener('mouseenter', function () { cursorEl.classList.add('is-on'); });
    document.addEventListener('mouseleave', function () { cursorEl.classList.remove('is-on'); });
    document.querySelectorAll('a, button, .hotspot, .tcard, .dcard, .gauge, .hscroll').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorEl.classList.add('is-hot'); });
      el.addEventListener('mouseleave', function () { cursorEl.classList.remove('is-hot'); });
    });
  }

  /* ---------- 导航：滚动底色 + 进度表盘 ---------- */
  var nav = document.getElementById('nav');
  var sg = document.querySelector('.scroll-gauge');
  var sgBar = sg ? sg.querySelector('.sg__bar') : null;
  var sgNum = sg ? sg.querySelector('.sg__num') : null;
  var SG_LEN = 119.4;

  /* ---------- 章节高亮 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  /* 序幕（hero）不参与章节菜单与编号 */
  var navSections = sections.filter(function (s) { return s.id !== 'hero'; });
  var dotLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__dots a'));
  var isEN = (document.documentElement.lang || '').toLowerCase() === 'en';
  var sectionNames = isEN ? {
    story: 'Origin', design: 'Design', interior: 'Interior',
    powertrain: 'Powertrain', performance: 'Performance', aero: 'Aerodynamics', testing: 'Development',
    specs: 'Specifications', bespoke: 'Bespoke', tour: 'World Tour', conclusion: 'Epilogue'
  } : {
    story: '缘起', design: '设计', interior: '内饰',
    powertrain: '动力总成', performance: '性能', aero: '空气动力', testing: '开发与测试',
    specs: '技术规格', bespoke: '个性化', tour: '巡展足迹', conclusion: '总结'
  };
  /* 构建章节索引（桌面栏 + 移动菜单），编号从缘起 01 开始 */
  var indexNav = document.getElementById('indexNav');
  var menuNav = document.querySelector('.menu-overlay__nav');
  var navItems = [];
  var navNow = document.getElementById('navNow');
  navSections.forEach(function (s, i) {
    var name = sectionNames[s.id] || s.id;
    var idx = String(i + 1).padStart(2, '0');
    var mk = function (cls) {
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.className = cls;
      a.innerHTML = '<span class="idx">' + idx + '</span>' + name;
      return a;
    };
    if (indexNav) { var el = mk(''); indexNav.appendChild(el); navItems.push(el); }
    if (menuNav) { var el2 = mk(''); el2.innerHTML = '<span class="idx">' + idx + '</span>' + name; menuNav.appendChild(el2); }
  });
  var allNavLinks = dotLinks.concat(navItems);

  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var id = en.target.id;
        allNavLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
        document.querySelectorAll('.index-rail__nav a').forEach(function (a) {
          var m = a.textContent.replace(/^\d+/, '').trim();
          a.classList.toggle('is-active', m === (sectionNames[id] || '') && a.getAttribute('href') === '#' + id);
        });
        /* 顶部当前章节指示：序幕不显示，缘起为 01；品牌、语言与菜单按钮进入缘起后才显示 */
        if (navNow) {
          var brand = document.querySelector('.nav__brand');
          var langWrap = document.querySelector('.nav__lang');
          if (id === 'hero') {
            navNow.style.opacity = '0';
            navNow.style.pointerEvents = 'none';
            if (brand) brand.classList.add('is-hidden');
            if (langWrap) langWrap.classList.add('is-hidden');
          } else {
            navNow.style.opacity = '1';
            navNow.style.pointerEvents = 'auto';
            if (brand) brand.classList.remove('is-hidden');
            if (langWrap) langWrap.classList.remove('is-hidden');
            var idx = navSections.indexOf(en.target) + 1;
            navNow.innerHTML = '<b>' + String(idx).padStart(2, '0') + '</b> · ' + (sectionNames[id] || id);
          }
        }
      }
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach(function (s) { sectionIO.observe(s); });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var p = docH > 0 ? y / docH : 0;

    if (y > 40) nav.classList.add('is-solid'); else nav.classList.remove('is-solid');

    if (sg) {
      if (y > window.innerHeight * 0.7) sg.classList.add('is-on'); else sg.classList.remove('is-on');
      if (sgBar) sgBar.style.strokeDashoffset = String(SG_LEN * (1 - p));
      if (sgNum) sgNum.textContent = String(Math.round(p * 100)).padStart(2, '0');
    }

    /* 章节索引栏（右侧窄条：悬停展开；进度线随滚动） */
    var rail = document.querySelector('.index-rail');
    if (rail) {
      if (y > window.innerHeight * 0.9) rail.classList.add('is-on'); else rail.classList.remove('is-on');
      var railPct = document.getElementById('railPct');
      if (railPct) railPct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
      rail.style.setProperty('--rail-h', (p * 100).toFixed(1) + '%');
    }

    /* 顶部导航进度条 */
    var navBar = document.getElementById('navBar');
    if (navBar) navBar.style.width = (p * 100).toFixed(1) + '%';

    /* hero 视频淡出 + 内容缩放 */
    var hero = document.querySelector('.hero');
    if (hero) {
      var hh = hero.offsetHeight;
      var fade = clamp(1 - y / (hh * 0.75), 0, 1);
      var v = hero.querySelector('.hero__video');
      if (v) v.style.opacity = String(fade);
      var hc = hero.querySelector('.hero__content');
      if (hc) hc.style.transform = 'translateY(' + (-y * 0.12).toFixed(1) + 'px) scale(' + (1 - y * 0.0006).toFixed(4) + ')';
    }
    /* hero 蓝色生长线：随滚动进度 */
    var heroAfter = document.querySelector('.hero__content');
    if (heroAfter) {
      var hp = clamp(y / (hh * 0.6), 0, 1);
      heroAfter.style.setProperty('--line-w', (hp * 100).toFixed(1) + '%');
    }

    /* 视差 */
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var off = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = 'translate3d(0,' + (-off).toFixed(1) + 'px,0)';
    });
  }
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function () { onScroll(); scrollTicking = false; });
    }
  }, { passive: true });
  onScroll();

  /* ---------- 显现动画 ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- 数字计数 ---------- */
  function animateCount(el, to, decimals, dur) {
    var start = null;
    var d = decimals || 0;
    function step(ts) {
      if (!start) start = ts;
      var t = clamp((ts - start) / (dur || 1800), 0, 1);
      var v = to * easeOutExpo(t);
      el.textContent = d > 0 ? v.toFixed(d) : Math.round(v).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = d > 0 ? to.toFixed(d) : to.toLocaleString('en-US');
    }
    requestAnimationFrame(step);
  }

  /* ---------- 表盘（规格圆环 + 数字） ---------- */
  var G_LEN = 527.8;
  var gauges = Array.prototype.slice.call(document.querySelectorAll('.gauge'));
  var gaugeIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var g = en.target;
      gaugeIO.unobserve(g);
      var target = parseFloat(g.getAttribute('data-gauge')) || 0;
      var max = parseFloat(g.getAttribute('data-max')) || target;
      var bar = g.querySelector('.gauge__bar');
      var num = g.querySelector('figcaption b');
      var dur = 2200;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var t = clamp((ts - start) / dur, 0, 1);
        var e = easeOutExpo(t);
        if (bar) bar.style.strokeDashoffset = String(G_LEN * (1 - (target / max) * e));
        if (num) num.textContent = Math.round(target * e).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.35 });
  gauges.forEach(function (g) { gaugeIO.observe(g); });

  /* ---------- 通用计数（hero / pt / 其它 data-count） ---------- */
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      countIO.unobserve(el);
      animateCount(el, parseFloat(el.getAttribute('data-to')) || 0, parseFloat(el.getAttribute('data-decimals')) || 0);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.count').forEach(function (el) { countIO.observe(el); });

  /* ---------- 倾斜卡片 ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- 动力总成切换 ---------- */
  var ptTabs = Array.prototype.slice.call(document.querySelectorAll('.pt__tabs button'));
  var ptImgs = Array.prototype.slice.call(document.querySelectorAll('.pt__img'));
  var ptDatas = Array.prototype.slice.call(document.querySelectorAll('.pt__data'));
  var ptTag = document.getElementById('pt-tag');
  var ptNames = ['V16 发动机', '25 kWh 电池', '电机系统'];
  ptTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = parseInt(btn.getAttribute('data-pt'), 10);
      ptTabs.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      ptImgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
      ptDatas.forEach(function (d) { d.classList.toggle('is-active', d.getAttribute('data-ptd') === String(i)); });
      if (ptTag) ptTag.textContent = ptNames[i] || '';
      /* 重新触发 count */
      var counts = ptDatas[i].querySelectorAll('.count');
      counts.forEach(function (c) {
        var to = parseFloat(c.getAttribute('data-to')) || 0;
        var dec = parseFloat(c.getAttribute('data-decimals')) || 0;
        animateCount(c, to, dec, 1400);
      });
    });
  });

  /* ---------- 驾驶模式切换 ---------- */
  var modeTabs = Array.prototype.slice.call(document.querySelectorAll('.modes__tabs button'));
  var modePanel = document.querySelector('.modes__panel');
  var modeData = [
    { title: '稳定，先于一切', desc: '牵引力与稳定系统全程守护，车辆动态偏向安全包络。适合公路与长途——这台车有前备箱、有空调，为日常而造。' },
    { title: '平衡，更富表现力', desc: '车辆平衡更中性，允许更从容的滑移与更直接的响应，安全系统包络同步放开。山道与乡间公路的默认选项。' },
    { title: '扭矩后移，尽情滑移', desc: '驱动扭矩更多分配给后轴，允许更大侧滑角度——在冰雪与赛道低附着路面上，它是让车尾“活”起来的模式。' }
  ];
  modeTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = parseInt(btn.getAttribute('data-mode'), 10);
      modeTabs.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      var d = modeData[i] || modeData[0];
      var t = modePanel.querySelector('.modes__panel-title');
      var p = modePanel.querySelector('.modes__panel-desc');
      t.textContent = d.title;
      p.textContent = d.desc;
      t.style.animation = 'none'; p.style.animation = 'none';
      void t.offsetWidth;
      t.style.animation = ''; p.style.animation = '';
    });
  });

  /* ---------- 水平滚动（测试时间线） ---------- */
  /* v12 起测试卡片改为网格布局，此处保留旧逻辑兼容（无元素则跳过） */
  var hscroll = document.getElementById('hscroll');
  if (hscroll) {
    var track = hscroll.querySelector('.hscroll__track');
    var bar = hscroll.querySelector('.hscroll__bar i');
    var maxScroll = function () { return track.scrollWidth - hscroll.clientWidth; };

    function updateBar() {
      var m = maxScroll();
      if (bar && m > 0) {
        var p = hscroll.scrollLeft / m;
        bar.style.transform = 'translateX(' + (p * (hscroll.clientWidth - 120)) + 'px)';
      }
    }

    /* 滚轮 → 水平 */
    hscroll.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        hscroll.scrollLeft += e.deltaY;
        updateBar();
      }
    }, { passive: false });

    /* 拖拽 */
    var dragging = false, startX = 0, startL = 0;
    hscroll.addEventListener('mousedown', function (e) {
      dragging = true;
      startX = e.clientX;
      startL = hscroll.scrollLeft;
      hscroll.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      hscroll.scrollLeft = startL - (e.clientX - startX);
      updateBar();
    });
    window.addEventListener('mouseup', function () {
      dragging = false;
      hscroll.classList.remove('is-dragging');
    });
    hscroll.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  /* ---------- v12 · 章节分隔提示入场 ---------- */
  var cbIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        cbIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.chapter-break').forEach(function (el) { cbIO.observe(el); });

  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.footer__links a').forEach(function (a) {
      a.addEventListener('mousemove', function (e) {
        var r = a.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        a.style.transform = 'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px)';
      });
      a.addEventListener('mouseleave', function () { a.style.transform = ''; });
    });
  }

  /* ---------- 触屏热点：点击显示 ---------- */
  if (!finePointer) {
    document.querySelectorAll('.hotspot').forEach(function (h) {
      h.addEventListener('click', function () {
        document.querySelectorAll('.hotspot.is-open').forEach(function (o) {
          if (o !== h) o.classList.remove('is-open');
        });
        h.classList.toggle('is-open');
      });
    });
  }

  /* ---------- 马力对比条动画 ---------- */
  document.querySelectorAll('.compare').forEach(function (cmp) {
    cmp.querySelectorAll('.compare__track i').forEach(function (i) {
      var w = i.getAttribute('data-w');
      if (w) i.style.setProperty('--w', w + '%');
    });
  });
  var compareIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        compareIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.compare').forEach(function (c) { compareIO.observe(c); });

  /* ---------- 章节视频：轻点封面播放 ---------- */
  document.querySelectorAll('.media-block__video').forEach(function (v) {
    v.addEventListener('click', function () {
      if (v.paused) v.play();
    });
  });

  /* ---------- v6 · 鼠标光斑 ---------- */
  var glow = document.querySelector('.glow');
  if (glow && finePointer && !prefersReduced) {
    var gx = -600, gy = -600, gtx = -600, gty = -600, glowRaf = null;
    document.addEventListener('mousemove', function (e) {
      gtx = e.clientX; gty = e.clientY;
      if (glowRaf === null) {
        glowRaf = requestAnimationFrame(function loop() {
          gx = lerp(gx, gtx, 0.12);
          gy = lerp(gy, gty, 0.12);
          glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
          glowRaf = requestAnimationFrame(loop);
        });
      }
    });
    document.addEventListener('mouseenter', function () { glow.classList.add('is-on'); });
    document.addEventListener('mouseleave', function () { glow.classList.remove('is-on'); });
  }

  /* ---------- v6 · Hero 内容随鼠标微移（滚动缩放启用后禁用，避免 transform 冲突） ---------- */

  /* ---------- v24 · 图片信息浮层：从卡片标题注入 data-cap ---------- */
  document.querySelectorAll('.dcard, .tour__card, .tcard, .tl-body').forEach(function (card) {
    var h = card.querySelector('h3');
    if (h) card.setAttribute('data-cap', h.textContent.trim());
  });

  /* ---------- v24 · 菜单打开时当前章节居中 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuNavEl = document.querySelector('.menu-overlay__nav');
  function centerMenuOnActive() {
    if (!menuNavEl) return;
    var cur = document.querySelector('.index-rail__nav a.is-active');
    if (!cur) return;
    var name = cur.textContent.replace(/^\d+/, '').trim();
    menuNavEl.querySelectorAll('a').forEach(function (a) {
      if (a.textContent.replace(/^\d+/, '').trim() === name) {
        a.scrollIntoView({ block: 'center' });
      }
    });
  }
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function () {
      var open = menuOverlay.classList.contains('is-open');
      if (open) {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        menuBtn.setAttribute('aria-expanded', 'false');
      } else {
        menuOverlay.hidden = false;
        requestAnimationFrame(function () {
          menuOverlay.classList.add('is-open');
          centerMenuOnActive();
        });
        menuBtn.setAttribute('aria-expanded', 'true');
      }
    });
    menuOverlay.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- v6 · 图片进入视口缩放 ---------- */
  var zoomIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        zoomIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.zoom').forEach(function (el) { zoomIO.observe(el); });

  /* ---------- v22 · 点击波纹（全站特效） ---------- */
  document.addEventListener('click', function (e) {
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 750);
  });

  /* ---------- v22 · 设计卡片鼠标高光跟随 ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.dcard').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- v17 · 导航跳转（瞬时定位，无平滑动画干扰） ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
      window.scrollTo(0, top);
    });
  });

  /* ---------- v17 · 卡片点击：防滚动防御 + 亮度脉冲动画 ---------- */
  var tapTargets = '.hcard, .dcard, .ptcard, .modecard, .tcard, .webcard, .bstat, .accel__item, .tl-body, .compare';
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest(tapTargets) : null;
    if (!el) return;
    /* 链接与视频控件交给浏览器 */
    if (e.target.closest('a') || e.target.tagName === 'VIDEO' || e.target.closest('video')) return;
    /* 阻止任何潜在的默认行为（如焦点滚动），卡片本身不跳转 */
    e.preventDefault();
    el.classList.remove('is-tapped');
    void el.offsetWidth;
    el.classList.add('is-tapped');
    el.addEventListener('animationend', function h() {
      el.classList.remove('is-tapped');
      el.removeEventListener('animationend', h);
    }, { once: true });
  });

  /* ---------- v8 · 背景视频区：入场动画 + 视口播放 ---------- */
  var vsIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var sec = en.target;
      var v = sec.querySelector('.vsection__video');
      if (en.isIntersecting) {
        sec.classList.add('is-in');
        if (v) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      } else {
        if (v) v.pause();
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.vsection').forEach(function (el) { vsIO.observe(el); });

  /* ---------- v9 · 官网细节视频卡：进入视口播放 ---------- */
  var wcIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target.querySelector('.webcard__video');
      if (!v) return;
      if (en.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.webcard').forEach(function (el) { wcIO.observe(el); });
})();
