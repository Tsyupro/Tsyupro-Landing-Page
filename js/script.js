(() => {
  "use strict";

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  let theme = savedTheme || (prefersLight ? "light" : "dark");

  function applyTheme(t) {
    document.body.setAttribute("data-theme", t);
  }

  applyTheme(theme);

  themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  });

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById("preloader");

  function hidePreloader() {
    if (!preloader || preloader.classList.contains("preloader--hidden")) return;
    preloader.classList.add("preloader--hidden");
    setTimeout(() => preloader.remove(), 600);
  }

  function schedulePreloaderHide() {
    setTimeout(hidePreloader, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedulePreloaderHide);
  } else {
    schedulePreloaderHide();
  }
  setTimeout(hidePreloader, 1500);

  /* ---------- Scroll: nav, progress, to-top ---------- */
  const nav = document.getElementById("nav");
  const toTop = document.getElementById("toTop");
  const progressBar = document.getElementById("progressBar");

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("nav--scrolled", y > 30);
    toTop.classList.toggle("show", y > 500);

    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = max > 0 ? `${(y / max) * 100}%` : "0%";
  }

  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const navMask = document.getElementById("navMask");

  function setMenu(open) {
    navLinks.classList.toggle("nav__links--open", open);
    navMask.classList.toggle("show", open);
    nav.classList.toggle("nav--menu", open);
    navToggle.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
    if (open) {
      navToggle.setAttribute("aria-expanded", "true");
    } else {
      navToggle.removeAttribute("aria-expanded");
    }
  }

  navToggle.addEventListener("click", () => {
    setMenu(!navLinks.classList.contains("nav__links--open"));
  });

  navMask.addEventListener("click", () => setMenu(false));

  navLinks.addEventListener("click", (e) => {
    if (e.target.closest(".theme-toggle")) return;
    setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Counters ---------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        animateCounter(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  function animateCounter(el) {
    const target = Number(el.dataset.counter);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  document.querySelectorAll("[data-counter]").forEach((el) => counterObserver.observe(el));

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  /* ---------- Marquee (JS-driven, always fills width) ---------- */
  function initMarquee(track) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const marquee = track.closest(".marquee");
    const base = track.querySelector(".marquee__group");
    if (!marquee || !base) return;

    const speed = 60;
    let pos = 0;
    let last = performance.now();
    let gw = 0;

    function layout() {
      const vw = marquee.getBoundingClientRect().width;
      gw = base.getBoundingClientRect().width;
      if (gw <= 0) return;
      const needed = Math.ceil(vw / gw) + 2;
      while (track.children.length < needed) {
        track.appendChild(base.cloneNode(true));
      }
      while (track.children.length > needed + 1) {
        track.lastChild.remove();
      }
    }

    layout();

    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (gw <= 0) layout();
      if (gw <= 0) return;

      pos += speed * dt;
      if (pos >= gw) pos -= gw;
      track.style.transform = `translateX(${-pos}px)`;
    }

    const onResize = () => {
      layout();
      if (gw > 0) pos = pos % gw;
    };

    requestAnimationFrame(frame);
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 150);
    });
  }

  document.querySelectorAll(".marquee__track").forEach(initMarquee);

  /* ---------- Hero typing ---------- */
  const typedOut = document.getElementById("typedOut");
  const phrases = [
    "print('навчаю з інтересом')",
    "василь викладає: Python • Web • Unity • Вайб кодинг",
    "перше заняття - безкоштовно",
    "напишіть мені - і почнемо",
  ];

  if (typedOut) {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeLoop() {
      const phrase = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        typedOut.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          deleting = true;
          setTimeout(typeLoop, 2000);
          return;
        }
        setTimeout(typeLoop, 55);
      } else {
        charIndex--;
        typedOut.textContent = phrase.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(typeLoop, 400);
          return;
        }
        setTimeout(typeLoop, 25);
      }
    }

    setTimeout(typeLoop, 900);
  }

  /* ---------- Hero parallax ---------- */
  const hero = document.getElementById("hero");
  const heroOrbs = document.querySelector(".hero__orbs");
  const heroGrid = document.querySelector(".hero__grid");

  if (hero && window.matchMedia("(hover: hover)").matches) {
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      targetX = (e.clientX - r.left) / r.width - 0.5;
      targetY = (e.clientY - r.top) / r.height - 0.5;
    });

    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });

    (function parallaxLoop() {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      heroOrbs.style.transform = `translate(${curX * 34}px, ${curY * 24}px)`;
      heroGrid.style.transform = `translate(${curX * -20}px, ${curY * -14}px)`;
      requestAnimationFrame(parallaxLoop);
    })();
  }

  /* ---------- Code rain ---------- */
  const rainCanvas = document.getElementById("codeRain");

  if (rainCanvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = rainCanvas.getContext("2d");
    const tokens = ["01", "<>", "{}", "//", "def", "py", "if", "for", "()", "=>", "::", "var"];
    let W = 0;
    let H = 0;
    let drops = [];
    let visible = false;

    function initRain() {
      const rect = hero.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rainCanvas.width = W * dpr;
      rainCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = "13px Consolas, monospace";

      const cols = Math.floor(W / 26);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * 26 + 6,
        y: -20 - Math.random() * H,
        speed: 0.35 + Math.random() * 0.75,
        token: tokens[Math.floor(Math.random() * tokens.length)],
        alpha: 0.2 + Math.random() * 0.3,
      }));
    }

    function drawRain() {
      ctx.clearRect(0, 0, W, H);
      drops.forEach((d) => {
        ctx.fillStyle = `rgba(34, 211, 238, ${d.alpha})`;
        ctx.fillText(d.token, d.x, d.y);
        d.y += d.speed;
        if (d.y > H + 30) {
          d.y = -20;
          d.token = tokens[Math.floor(Math.random() * tokens.length)];
          d.alpha = 0.2 + Math.random() * 0.3;
        }
      });
    }

    function rainFrame() {
      if (visible) drawRain();
      requestAnimationFrame(rainFrame);
    }

    requestAnimationFrame(rainFrame);

    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible) requestAnimationFrame(drawRain);
        });
      },
      { threshold: 0 }
    ).observe(hero);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initRain, 150);
    });

    initRain();
  }

  /* ---------- Quiz ---------- */
  const quizQuestions = [
    {
      title: "Що тобі більше хочеться створити?",
      options: [
        { text: "Власну комп'ютерну гру", point: "unity" },
        { text: "Красивий сайт для друзів або школи", point: "web" },
        { text: "Програму, яка все рахує сама", point: "python" },
        { text: "Додаток або бота за допомогою штучного інтелекту", point: "vibe" },
        { text: "Поки не знаю, готовий(а) спробувати все", point: "python" },
      ],
    },
    {
      title: "Як тобі цікавіше навчатися?",
      options: [
        { text: "Самому(самій), у своєму темпі", point: "python" },
        { text: "Показувати результат іншим", point: "web" },
        { text: "Граючись і експериментуючи", point: "unity" },
        { text: "Творити нове разом зі штучним інтелектом", point: "vibe" },
      ],
    },
    {
      title: "Що для тебе важливіше?",
      options: [
        { text: "Відразу бачити готовий результат", point: "web" },
        { text: "Розв'язувати задачі та шукати логіку", point: "python" },
        { text: "Творити, рухатися, оживляти героїв", point: "unity" },
        { text: "Швидко перетворювати ідеї в робочі програми", point: "vibe" },
      ],
    },
    {
      title: "Скільки часу готовий(а) займатися?",
      options: [
        { text: "Раз на тиждень", point: "python" },
        { text: "Двічі на тиждень", point: "web" },
        { text: "Чим більше, тим краще", point: "unity" },
      ],
    },
  ];

  const quizResults = {
    python: {
      title: "Python",
      text: "Ідеальний старт у програмуванні: зрозумілий синтаксис, багато практики і простір для росту. Почнемо з простих програм і дійдемо до власних проєктів.",
    },
    web: {
      title: "Веб-розробка",
      text: "Тобі сподобається бачити результат відразу! Навчимось робити сайти на HTML, CSS і JavaScript: від сторінки до сайту, яким будуть користуватися інші.",
    },
    unity: {
      title: "Ігри на Unity",
      text: "Твоє покликання - створювати світи. Разом розробимо 2D-гру на Unity з C#: свій персонаж, рівні, механіки та справді грабельний результат.",
    },
    vibe: {
      title: "Вайб кодинг",
      text: "Тобі подобається творити швидко. Навчимось формулювати ідеї, писати зрозумілі запити для штучного інтелекту та перетворювати їх у справжні програми, розуміючи код.",
    },
  };

  const quizEl = document.getElementById("quizCard");
  if (quizEl) {
    const quizStepText = document.getElementById("quizStepText");
    const quizDots = document.getElementById("quizDots");
    const quizQuestion = document.getElementById("quizQuestion");
    const quizOptions = document.getElementById("quizOptions");
    const quizNav = document.querySelector(".quiz__nav");
    const quizBack = document.getElementById("quizBack");
    const quizResult = document.getElementById("quizResult");
    const quizResultTitle = document.getElementById("quizResultTitle");
    const quizResultText = document.getElementById("quizResultText");
    const quizRestart = document.getElementById("quizRestart");

    let quizState = { index: 0, scores: { python: 0, web: 0, unity: 0, vibe: 0 } };

    function renderQuiz() {
      const i = quizState.index;
      quizStepText.textContent = `${i + 1} / ${quizQuestions.length}`;
      quizQuestion.textContent = quizQuestions[i].title;
      quizNav.classList.toggle("quiz__nav--active", i > 0);
      quizResult.hidden = true;
      quizNav.hidden = false;

      quizDots.innerHTML = "";
      quizQuestions.forEach((_, d) => {
        const dot = document.createElement("i");
        if (d === i) dot.classList.add("active");
        quizDots.appendChild(dot);
      });

      quizOptions.innerHTML = "";
      quizQuestions[i].options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "quiz__option";
        btn.textContent = opt.text;
        btn.addEventListener("click", () => {
          btn.classList.add("picked");
          quizState.scores[opt.point]++;
          setTimeout(() => {
            if (quizState.index < quizQuestions.length - 1) {
              quizState.index++;
              renderQuiz();
            } else {
              showResult();
            }
          }, 250);
        });
        quizOptions.appendChild(btn);
      });
    }

    function showResult() {
      const result = Object.entries(quizState.scores).sort((a, b) => b[1] - a[1])[0][0];
      quizResultTitle.textContent = quizResults[result].title;
      quizResultText.textContent = quizResults[result].text;
      quizNav.hidden = true;
      quizResult.hidden = false;
    }

    quizBack.addEventListener("click", () => {
      if (quizState.index > 0) {
        quizState.index--;
        renderQuiz();
      }
    });

    quizRestart.addEventListener("click", () => {
      quizState = { index: 0, scores: { python: 0, web: 0, unity: 0, vibe: 0 } };
      renderQuiz();
    });

    renderQuiz();
  }

  /* ---------- Reviews carousel ---------- */
  const revTrack = document.getElementById("revTrack");
  if (revTrack) {
    const revViewport = document.querySelector(".reviews__viewport");
    const revPrev = document.getElementById("revPrev");
    const revNext = document.getElementById("revNext");
    const revDots = document.getElementById("revDots");
    const revSlides = Array.from(revTrack.children);
    let revIndex = 0;
    let slideW = 0;
    let timer = null;

    function visiblePerView() {
      const w = window.innerWidth;
      if (w >= 1100) return 3;
      if (w >= 861) return 2;
      return 1;
    }

    function rebuild() {
      slideW = revSlides.length ? revSlides[0].offsetWidth : 0;
      if (revIndex > revSlides.length - visiblePerView()) {
        revIndex = Math.max(0, revSlides.length - visiblePerView());
      }
      update();
    }

    function update() {
      const max = revSlides.length - visiblePerView();
      revIndex = Math.min(Math.max(revIndex, 0), max);
      revTrack.style.transform = `translateX(${-revIndex * slideW}px)`;

      revDots.innerHTML = "";
      for (let i = 0; i <= max; i++) {
        const dot = document.createElement("i");
        if (i === revIndex) dot.classList.add("active");
        dot.addEventListener("click", () => {
          revIndex = i;
          update();
          restartTimer();
        });
        revDots.appendChild(dot);
      }
    }

    function next() {
      revIndex++;
      if (revIndex > revSlides.length - visiblePerView()) revIndex = 0;
      update();
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    revPrev.addEventListener("click", () => {
      revIndex--;
      if (revIndex < 0) revIndex = revSlides.length - visiblePerView();
      update();
      restartTimer();
    });

    revNext.addEventListener("click", () => {
      next();
      restartTimer();
    });

    revViewport.addEventListener("mouseenter", () => {
      if (timer) clearInterval(timer);
    });
    revViewport.addEventListener("mouseleave", restartTimer);

    let revResizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(revResizeTimer);
      revResizeTimer = setTimeout(rebuild, 150);
    });

    restartTimer();
    requestAnimationFrame(rebuild);
  }

  /* ---------- Booking modal ---------- */
  const bookingModal = document.getElementById("bookingModal");

  if (bookingModal) {
    const bookForm = document.getElementById("bookForm");

    function openModal() {
      bookingModal.classList.add("open");
      bookingModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

    function closeModal() {
      bookingModal.classList.remove("open");
      bookingModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }

    document.querySelectorAll("[data-open-modal]").forEach((btn) => {
      btn.addEventListener("click", openModal);
    });

    bookingModal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    bookForm.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("input", () => field.classList.remove("invalid"));
    });

    bookForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fields = bookForm.querySelectorAll("input, select");
      let valid = true;
      fields.forEach((field) => {
        const empty = field.hasAttribute("required") && !field.value.trim();
        field.classList.toggle("invalid", empty);
        if (empty) valid = false;
      });
      if (!valid) return;

      const data = new FormData(bookForm);
      const lines = [
        "Вітаю! Хочу записатися на заняття з програмування.",
        `Ім'я: ${data.get("name")}`,
        `Вік дитини: ${data.get("age")}`,
        `Напрямок: ${data.get("direction")}`,
      ];
      const comment = (data.get("comment") || "").trim();
      if (comment) lines.push(`Коментар: ${comment}`);

      copyToClipboard(lines.join("\n"), () => {
        showToast("Повідомлення скопійовано - вставляйте в Telegram");
        window.open("https://t.me/tsyupro", "_blank", "noopener");
        closeModal();
        bookForm.reset();
      });
    });
  }

  /* ---------- Copy helper + toast ---------- */
  const toast = document.getElementById("toast");

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function copyToClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (_) {}
    document.body.removeChild(ta);
    done();
  }
})();