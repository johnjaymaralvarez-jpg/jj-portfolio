
document.addEventListener("DOMContentLoaded", () => {
  // --- EmailJS initialization (added) ---
  try {
    if (window.emailjs && typeof emailjs.init === 'function') {
      emailjs.init('Y52bSCgV5Q9webrVn'); // Public key provided
    }
  } catch (err) {
    console.warn('EmailJS init error:', err);
  }
  // --------------------------------------

  // --- Defensive polyfills & safe-proxies (added) ---
  (function(){
    function noop(){}
    function makeProxy(){
      return {
        addEventListener: noop,
        removeEventListener: noop,
        setAttribute: noop,
        getAttribute: function(){ return null; },
        querySelector: function(){ return null; },
        querySelectorAll: function(){ return []; },
        appendChild: noop,
        removeChild: noop,
        focus: noop,
        style: {},
        classList: { add: noop, remove: noop, contains: function(){return false;} }
      };
    }
    try {
      if (typeof window.contactForm === 'undefined') window.contactForm = document.querySelector('.contact-form') || document.querySelector('.contact-modal-form') || null;
      if (typeof window.contactBtn === 'undefined') window.contactBtn = document.querySelector('.contact-btn') || document.querySelector('#contactBtn') || null;
      if (typeof window.closeContact === 'undefined') {
        if (typeof closeContactModal === 'function') {
          window.closeContact = function(){ closeContactModal(); };
        } else {
          window.closeContact = function(){ console.warn('closeContact called but not defined'); };
        }
      }
      // If key modals/elements are missing, create proxies so calls don't throw and other code can continue.
      if (!document.querySelector('.contact-modal') ) window._contactModalProxy = makeProxy();
      if (!document.querySelector('.modal')) window._modalProxy = makeProxy();
      // expose a small helper to safely query and run callbacks
      window.safeQuery = function(selector, cb){
        try{
          const el = document.querySelector(selector);
          if (el && typeof cb === 'function') cb(el);
          return el;
        }catch(e){
          console.warn('safeQuery error', selector, e);
          return null;
        }
      };
    } catch (e) {
      console.warn('Defensive polyfills init failed', e);
    }
  })();
  // --------------------------------------

  // register ScrollTrigger if available
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* -------------------------
     Theme toggle & persistence
  ------------------------- */
  const themeToggle = document.getElementById("theme-toggle");
  const icon = themeToggle ? themeToggle.querySelector("i") : null;

  function applyTheme(theme) {
    document.documentElement.classList.toggle("light-theme", theme === "light");
    if (icon) {
      icon.classList.toggle("fa-sun", theme === "light");
      icon.classList.toggle("fa-moon", theme !== "light");
    }
    // adjust hero-glow opacity for visibility in each theme
    const glow = document.querySelector(".hero-glow");
    if (glow) glow.style.opacity = theme === "light" ? "0.06" : "0.12";
  }

  const saved = localStorage.getItem("theme") || "dark";
  applyTheme(saved);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.toggle("light-theme");
      const theme = isLight ? "light" : "dark";
      localStorage.setItem("theme", theme);
      applyTheme(theme);
      // small icon bounce
      if (window.gsap && icon) gsap.fromTo(icon, { scale: 0.6, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.38, ease: "back.out(1.2)" });
    });
  }

  const hamburger = document.querySelector('.header-hamburger');
  const navMenu = document.querySelector('.nav');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navMenu.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', isOpen.toString());
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (event) => {
      if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
        navMenu.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        navMenu.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -------------------------
     Init AOS (fade animations)
  ------------------------- */
  if (window.AOS) AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });

  /* -------------------------
     Ensure hero glow exists
  ------------------------- */
  const hero = document.querySelector(".hero");
  let glow = hero && hero.querySelector(".hero-glow");
  if (!glow && hero) {
    glow = document.createElement("div");
    glow.className = "hero-glow";
    hero.appendChild(glow);
  }

  // subtle mouse-follow for desktop hero glow
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    let moveTween = null;
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 100;
      const y = (e.clientY / window.innerHeight - 0.5) * 100;
      if (moveTween) moveTween.kill();
      moveTween = gsap.to(glow, { x: x * 0.5, y: y * 0.5, duration: 1.1, ease: "power3.out" });
    });
  }

  // scroll-trigger parallax for glow
  if (glow && window.ScrollTrigger) {
    gsap.to(glow, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
    });
  }

  /* -------------------------
     Hero entrance (GSAP)
  ------------------------- */
  if (window.gsap) {
    gsap.from(".hero-left h1", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" });
    gsap.from(".hero-left .role", { y: 30, opacity: 0, duration: 0.9, delay: 0.12 });
    gsap.from(".hero-left .lead", { y: 18, opacity: 0, duration: 0.9, delay: 0.24 });
    gsap.from(".hero-right .ill-placeholder", { scale: 0.98, opacity: 0, duration: 0.9, delay: 0.22 });
  }

  /* -------------------------
     Section reveal with ScrollTrigger (direction-aware)
  ------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    const sections = gsap.utils.toArray("section");
    sections.forEach((section, idx) => {
      const anim = gsap.fromTo(
        section,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          paused: true
        }
      );

      ScrollTrigger.create({
        trigger: section,
        start: "top 85%",
        end: "bottom 10%",
        onEnter: () => {
          anim.vars.duration = 0.68;
          anim.restart();
        },
        onEnterBack: () => {
          anim.vars.duration = 0.58;
          anim.restart();
        },
        once: false
      });

      anim.delay(idx * 0.04);
    });
  }

  /* -------------------------
     Projects stagger (improved trigger)
  ------------------------- */
  if (window.gsap) {
    gsap.from('.projects-list .project', { opacity: 0, y: 18, scale: 0.996, duration: 0.8, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.projects-list', start: 'top 85%' } });
  }

  /* -------------------------
     Skill cards hover interactivity
  ------------------------- */
  const skillCards = document.querySelectorAll(".skill-card");
  skillCards.forEach((card, i) => {
    // create skill-info if not present
    let info = card.querySelector(".skill-info");
    if (!info) {
      info = document.createElement("div");
      info.className = "skill-info";
      info.textContent = card.querySelector(".small") ? card.querySelector(".small").textContent : "Focus area";
      card.appendChild(info);
    }

    // initial staggered float
    if (window.gsap) {
      gsap.from(card, { y: 8, opacity: 0, duration: 0.7, delay: 0.06 * i, ease: "power2.out" });
    }

    let tiltTween = null;
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const rx = (-dy / (r.height / 2)) * 6;
      const ry = (dx / (r.width / 2)) * 6;
      if (tiltTween) tiltTween.kill();
      tiltTween = gsap.to(card, { rotationX: rx, rotationY: ry, scale: 1.03, duration: 0.36, ease: "power3.out", transformPerspective: 800 });
    };

    const icon = card.querySelector(".skill-icon");
    const label = card.querySelector(".skill-label");

    const onEnter = () => {
      gsap.to(info, { opacity: 1, y: 0, duration: 0.18 });
      card.addEventListener("mousemove", onMove);
      if (window.gsap) {
        gsap.to(icon, { y: -6, scale: 1.18, duration: 0.26, ease: "back.out(1.2)" });
        if (label) gsap.to(label, { y: -3, duration: 0.22, ease: "power2.out" });
        gsap.to(card, { boxShadow: "0 22px 60px rgba(0,0,0,0.45)", duration: 0.28 });
      }
    };

    const onLeave = () => {
      if (tiltTween) tiltTween.kill();
      card.removeEventListener("mousemove", onMove);
      if (window.gsap) {
        gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.4, ease: "power2.out" });
        gsap.to(icon, { y: 0, scale: 1, duration: 0.32, ease: "power2.out" });
        if (label) gsap.to(label, { y: 0, duration: 0.28, ease: "power2.out" });
        gsap.to(info, { opacity: 0, y: 6, duration: 0.18 });
        gsap.to(card, { boxShadow: "0 8px 30px rgba(0,0,0,0.18)", duration: 0.24 });
      }
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("focus", onEnter);
    card.addEventListener("blur", onLeave);
    card.setAttribute("tabindex", "0");
  });

  /* -------------------------
     Experience hover enhancements
  ------------------------- */
  const expCards = document.querySelectorAll(".exp-card");
  expCards.forEach((c) => {
    c.addEventListener("mouseenter", () => {
      if (window.gsap) {
        gsap.to(c, { y: -8, rotateZ: -0.3, boxShadow: "0 26px 60px rgba(0,0,0,0.45)", duration: 0.28, ease: "power2.out" });
        gsap.fromTo(c.querySelector(".exp-date"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" });
      }
    });
    c.addEventListener("mouseleave", () => {
      if (window.gsap) {
        gsap.to(c, { y: 0, rotateZ: 0, boxShadow: "0 8px 30px rgba(0,0,0,0.18)", duration: 0.28, ease: "power2.out" });
      }
    });
    c.addEventListener("focus", () => c.dispatchEvent(new Event("mouseenter")));
    c.addEventListener("blur", () => c.dispatchEvent(new Event("mouseleave")));
  });

  /* -------------------------
     Testimonials rotate
  ------------------------- */
  const tests = document.querySelectorAll(".test-card");
  if (tests.length > 0) {
    let i = 0;
    setInterval(() => {
      tests.forEach((t, idx) => gsap.to(t, { opacity: idx === i ? 1 : 0.35, duration: 0.45 }));
      i = (i + 1) % tests.length;
    }, 3600);
  }

  /* -------------------------
     Contact form behavior & messaging modal
     - sending animation: paper-plane flies upward then success modal appears
  ------------------------- */
  const form = document.querySelector(".contact-form");
  const modal = document.getElementById("message-modal");
  const modalClose = modal ? modal.querySelector(".modal-close") : null;
  const modalOk = modal ? modal.querySelector("#modal-ok") : null;
  let lastFocused = null;

  function openModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    if (window.gsap) {
      gsap.fromTo(modal.querySelector(".modal-panel"), { y: 18, autoAlpha: 0, scale: 0.98 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.38, ease: "back.out(0.9)" });
    }
    lastFocused = document.activeElement;
    if (modalOk) modalOk.focus();
    document.addEventListener("keydown", trapModal);
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    if (lastFocused) lastFocused.focus();
    document.removeEventListener("keydown", trapModal);
  }

  function trapModal(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const focusable = modal.querySelectorAll("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Create a simple paper-plane element for the sending animation
  function animateSend(onComplete) {
    const plane = document.createElement("div");
    plane.className = "send-plane";
    plane.style.position = "fixed";
    plane.style.left = "50%";
    plane.style.top = "60%";
    plane.style.transform = "translateX(-50%)";
    plane.style.zIndex = 3000;
    plane.style.pointerEvents = "none";
    plane.style.fontSize = "22px";
    plane.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    document.body.appendChild(plane);

    if (window.gsap) {
      gsap.fromTo(plane, { y: 0, opacity: 1, scale: 1 }, {
        y: -120,
        opacity: 0,
        scale: 0.9,
        duration: 0.88,
        ease: "power2.out",
        onComplete: () => {
          plane.remove();
          if (typeof onComplete === "function") onComplete();
        }
      });
    } else {
      plane.style.transition = "transform .9s ease-out, opacity .9s ease-out";
      plane.style.transform = "translateX(-50%) translateY(-120px) scale(.9)";
      plane.style.opacity = "0";
      setTimeout(() => {
        plane.remove();
        if (typeof onComplete === "function") onComplete();
      }, 920);
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // minimal validation
      const name = form.querySelector("input[name='name']");
      const email = form.querySelector("input[name='email']");
      const message = form.querySelector("textarea[name='message']");

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (window.gsap) {
          gsap.fromTo(form, { x: -6 }, { x: 6, duration: 0.08, yoyo: true, repeat: 3, ease: "power1.inOut" });
        }
        return;
      }

      // sending overlay inside form
      const sending = document.createElement("div");
      sending.className = "sending-overlay";
      sending.style.position = "absolute";
      sending.style.inset = "0";
      sending.style.display = "grid";
      sending.style.placeItems = "center";
      sending.style.borderRadius = "10px";
      sending.innerHTML = `<div class="sending-dot" aria-hidden="true"><i class="fa-solid fa-paper-plane"></i></div>`;
      form.style.position = "relative";
      form.appendChild(sending);

      // button micro feedback
      const btn = form.querySelector("button");
      if (btn && window.gsap) gsap.fromTo(btn, { scale: 1 }, { scale: 0.96, duration: 0.06, yoyo: true, repeat: 1 });

      setTimeout(() => {
        if (window.gsap) gsap.to(sending, { autoAlpha: 0, duration: 0.18, onComplete: () => sending.remove() });
        else sending.remove();

        // animate plane then show modal
        animateSend(openModal);
      }, 420);

      // reset form visually after short delay
      setTimeout(() => form.reset(), 800);
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOk) modalOk.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });


  /* -------------------------
     Contact modal (Get in Touch) behavior
  ------------------------- */
  const contactOpenBtn = document.querySelector('.contact-open');
  const contactModal = document.getElementById('contact-modal');
  const contactCloseBtns = document.querySelectorAll('.contact-close, .contact-cancel');
  const contactFormModal = document.querySelector('.contact-modal-form');

  function openContactModal() {
    if (!contactModal) return;
    contactModal.setAttribute('aria-hidden', 'false');
    if (window.gsap) {
      gsap.fromTo(contactModal.querySelector('.modal-panel'), { scale: 0.96, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.36, ease: 'back.out(0.8)' });
    }
    // focus first input
    const first = contactModal.querySelector('input[name="name"]');
    if (first) first.focus();
    lastFocused = document.activeElement;
    document.addEventListener('keydown', contactTrap);
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.setAttribute('aria-hidden', 'true');
    if (lastFocused) lastFocused.focus();
    document.removeEventListener('keydown', contactTrap);
  }

  function contactTrap(e) {
    if (e.key === 'Escape') closeContactModal();
    if (e.key === 'Tab') {
      const focusable = contactModal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (contactOpenBtn) contactOpenBtn.addEventListener('click', openContactModal);
  contactCloseBtns.forEach(btn => btn.addEventListener('click', closeContactModal));
  if (contactModal) contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeContactModal(); });

  if (contactFormModal) {
    contactFormModal.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactFormModal.querySelector('input[name="name"]');
      const email = contactFormModal.querySelector('input[name="email"]');
      const message = contactFormModal.querySelector('textarea[name="message"]');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (window.gsap) gsap.fromTo(contactFormModal, { x: -6 }, { x: 0, duration: 0.08, yoyo: true, repeat: 3, ease: 'power1.inOut' });
        return;
      }

      // show sending overlay inside modal form
      const sending = document.createElement('div');
      sending.className = 'sending-overlay';
      sending.style.position = 'absolute';
      sending.style.inset = '0';
      sending.style.display = 'grid';
      sending.style.placeItems = 'center';
      sending.style.borderRadius = '10px';
      sending.innerHTML = `<div class="sending-dot" aria-hidden="true"><i class="fa-solid fa-paper-plane"></i></div>`;
      contactFormModal.style.position = 'relative';
      contactFormModal.appendChild(sending);

      // micro feedback
      const btn = contactFormModal.querySelector('button[type="submit"]');
      if (btn && window.gsap) gsap.fromTo(btn, { scale: 1 }, { scale: 0.96, duration: 0.06, yoyo: true, repeat: 1 });

      // Prepare template params for EmailJS. If your template uses different variable names,
      // update them in EmailJS dashboard or adjust these keys accordingly.
      const templateParams = {
        from_name: name.value.trim(),
        from_email: email.value.trim(),
        message: message.value.trim()
      };

      // Send via EmailJS
      const SERVICE_ID = 'service_0e4xh7i';
      const TEMPLATE_ID = 'template_i7u8t2w';
      if (window.emailjs && typeof emailjs.send === 'function') {
        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
          .then(() => {
            // success: animate plane then show success modal
            setTimeout(() => {
              if (window.gsap) gsap.to(sending, { autoAlpha: 0, duration: 0.18, onComplete: () => sending.remove() });
              else sending.remove();
              animateSend(() => {
                closeContactModal();
                openModal(); // opens message-modal (Message Sent)
              });
            }, 420);
            setTimeout(() => contactFormModal.reset(), 800);
          }, (err) => {
            // failure: remove overlay and show an error (non-blocking)
            if (window.gsap) gsap.to(sending, { autoAlpha: 0, duration: 0.18, onComplete: () => sending.remove() });
            else sending.remove();
            console.error('EmailJS send error:', err);
            // show a lightweight error notification inside the modal
            const errEl = document.createElement('div');
            errEl.className = 'contact-error';
            errEl.textContent = 'Failed to send message. Please try again or email me directly.';
            errEl.style.marginTop = '10px';
            errEl.style.textAlign = 'center';
            contactFormModal.appendChild(errEl);
            setTimeout(() => { if (errEl) errEl.remove(); }, 5000);
          });
      } else {
        // EmailJS not loaded: fallback to simulated send (keeps UI working)
        setTimeout(() => {
          if (window.gsap) gsap.to(sending, { autoAlpha: 0, duration: 0.18, onComplete: () => sending.remove() });
          else sending.remove();
          animateSend(() => {
            closeContactModal();
            openModal();
          });
        }, 420);
        setTimeout(() => contactFormModal.reset(), 800);
      }

});

  /* -------------------------
     Accessibility: allow keyboard 'Enter' on skill cards to trigger focus hover effect
  ------------------------- */
  document.querySelectorAll('.skill-card').forEach((c) => {
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        c.click();
      }
    });
  });

  /* -------------------------
     Keep AOS & GSAP playing nicely on resize
  ------------------------- */
  window.addEventListener("resize", () => {
    if (window.AOS) AOS.refresh();
    if (window.gsap && window.ScrollTrigger) ScrollTrigger.refresh();
  });
}});

/* -------------------------
   Hero Role Fade Transition
------------------------- */
const dynamicText = document.querySelector(".dynamic-text");
if (dynamicText) {
  const roles = [
    "Video Editor",
    "UI/UX Designer",
   "Graphic Designer",
  ];
  let roleIndex = 0;

  setInterval(() => {
    dynamicText.style.opacity = 0;
    setTimeout(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      dynamicText.textContent = roles[roleIndex];
      dynamicText.style.opacity = 1;
    }, 800);
  }, 3000);
}




/* ======================
   Scroll-to-Top Button
====================== */
(function(){
  const scrollBtn = document.getElementById("scrollTopBtn");
  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 200) {
        scrollBtn.classList.add("show");
      } else {
        scrollBtn.classList.remove("show");
      }
    });
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();


/* Projects filtering (buttons above project list) — robust init */
function initProjectFilters(){
  const filterBar = document.querySelector('.projects-filter');
  if (!filterBar) return;
  const buttons = filterBar.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.projects-list .project');

  function setActive(button){
    buttons.forEach(b => b.classList.toggle('active', b === button));
  }

  function applyFilter(filter){
    projects.forEach(p => {
      const cat = p.getAttribute('data-category') || 'all';
      const match = filter === 'all' || cat === filter;
      if (match) {
        // make sure element is visible
        p.style.removeProperty('display');
        if (window.gsap) {
          try {
            gsap.fromTo(p, {autoAlpha:0, y:14, scale:0.996}, {autoAlpha:1, y:0, scale:1, duration:0.6, ease:'power2.out'});
          } catch(e){}
        }
      } else {
        if (window.gsap) {
          try {
            gsap.to(p, {autoAlpha:0, y:8, scale:0.994, duration:0.36, ease:'power2.in', onComplete: ()=> p.style.display='none' });
          } catch(e){ p.style.display='none'; }
        } else {
          p.style.display='none';
        }
      }
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const f = btn.getAttribute('data-filter');
      setActive(btn);
      applyFilter(f);
      // ensure the container scroll position resets so user sees top of list
      const list = document.querySelector('.projects-list');
      if (list) list.scrollTo ? list.scrollTo({ left: 0, top: 0, behavior: 'smooth' }) : list.scrollTop = 0;
    });
  });

  // ensure 'All' is applied once DOM and AOS have settled.
  // apply immediately and again after a short tick to override any race with other scripts/styles.
  applyFilter('all');
  setTimeout(()=> applyFilter('all'), 60);
  // also re-apply after AOS init completes (AOS may change visibility)
  if (window.AOS && typeof window.AOS.refresh === 'function') {
    setTimeout(()=> applyFilter('all'), 260);
  }
}

// If DOM already ready, init immediately; otherwise wait.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectFilters);
} else {
  initProjectFilters();
}
/* -------------------------
   Skills hover → background logo animation + parallax motion
------------------------- */
const skillsSection = document.querySelector("#skills");
const bgIcon = skillsSection?.querySelector(".skills-bg-icon");
const skillCards = document.querySelectorAll(".skill-card");

if (bgIcon && skillCards.length > 0) {
  let moveTween = null;

  skillCards.forEach((card) => {
    const icon = card.querySelector(".skill-icon");
    if (!icon) return;

    card.addEventListener("mouseenter", () => {
      const iconClass = [...icon.classList].find(cls => cls.startsWith("fa-") || cls.startsWith("fab"));
      if (!iconClass) return;

      // Update background icon dynamically
      bgIcon.className = `skills-bg-icon ${iconClass}`;
      bgIcon.innerHTML = `<i class="${icon.className}"></i>`;
      bgIcon.classList.add("active");

      if (window.gsap) {
        gsap.fromTo(
          bgIcon,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 0.12, duration: 0.6, ease: "power3.out" }
        );
      }
    });

    card.addEventListener("mouseleave", () => {
      bgIcon.classList.remove("active");
      if (window.gsap) {
        gsap.to(bgIcon, {
          scale: 0.95,
          opacity: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
  });

  // Subtle parallax movement within the section
  if (window.gsap && window.matchMedia("(pointer: fine)").matches) {
    skillsSection.addEventListener("mousemove", (e) => {
      const rect = skillsSection.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const moveX = (relX / rect.width - 0.5) * 20; // gentle motion
      const moveY = (relY / rect.height - 0.5) * 20;

      if (moveTween) moveTween.kill();
      moveTween = gsap.to(bgIcon, {
        x: moveX,
        y: moveY,
        duration: 0.8,
        ease: "power3.out"
      });
    });
  }
}


/* -------------------------
   Section glow blobs (synchronized slow-wave parallax)
------------------------- */
(function(){
  if (!window.gsap) return;
  const container = document.querySelector('.global-bg-lights');
  if (!container) return;

  const sectionIds = ['hero','skills','experience','about','projects','contact'];
  // color sets (cool-toned) for dark mode; light-mode handled by CSS opacity
  const colors = {
    hero: ['#7fd1ff44','#a88bff33'],
    skills: ['#a88bff44','#9ec5ff33'],
    experience: ['#7fd1ff33','#8f73ff33'],
    about: ['#99ccff33','#7fd1ff22'],
    projects: ['#8f73ff22','#b099ff22'],
    contact: ['#7dcfff33','#aaddff22']
  };

  // create glow elements per section and append into section and container for global sync
  const blobs = [];
  sectionIds.forEach((id, idx) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    // create 1 blob per section
    const blob = document.createElement('div');
    blob.className = 'section-glow';
    // pick color(s)
    const col = (colors[id] && colors[id][0]) || 'rgba(255,255,255,0.08)';
    blob.style.background = `radial-gradient(circle at 30% 30%, ${col}, transparent 60%)`;
    // position blob initially (upper-right-ish for visual balance, with slight variation)
    blob.style.top = (10 + idx*6) + '%';
    blob.style.left = (60 - idx*4) + '%';
    sec.appendChild(blob);
    blobs.push({sec, blob, id});
  });

  if (blobs.length === 0) return;

  // synchronized slow wave - single master timeline controls all blobs' motion for elegant rhythm
  const master = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
  // wave parameters
  const waveSteps = 6;
  const durationPerCycle = 18; // slow waves
  for (let i = 0; i < waveSteps; i++) {
    const phase = i / waveSteps;
    master.to(blobs.map(b => b.blob), { 
      // translate each blob slightly based on step and phase (synchronized pattern)
      x: (index)=> 20 * Math.sin((index + phase) * Math.PI * 2 / waveSteps),
      y: (index)=> 12 * Math.cos((index + phase) * Math.PI * 2 / waveSteps),
      duration: durationPerCycle / waveSteps
    }, i * (durationPerCycle / waveSteps));
  }

  // subtle color shift on section intersection (keeps overall sync)
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      const found = blobs.find(b => b.id === id || b.sec.id === id);
      if (found) {
        // update backgrounds for visible section to stronger colors
        const cols = colors[id] || ['#ffffff33'];
        blobs.forEach((b, idx) => {
          const c = cols[idx % cols.length];
          b.blob.style.background = `radial-gradient(circle at 30% 30%, ${c}, transparent 60%)`;
        });
      }
    });
  }, { threshold: 0.48 });

  blobs.forEach(b => io.observe(b.sec));

  // cursor-based parallax tweak (very subtle) on pointer: fine devices
  if (window.matchMedia('(pointer: fine)').matches) {
    let px = 0, py = 0;
    document.addEventListener('mousemove', (e)=>{
      const nx = (e.clientX / window.innerWidth - 0.5) * 18;
      const ny = (e.clientY / window.innerHeight - 0.5) * 12;
      if (Math.abs(nx - px) < 0.1 && Math.abs(ny - py) < 0.1) return;
      px = nx; py = ny;
      blobs.forEach((b, idx) => {
        // blobs closer to viewport center move more
        const m = 1 + idx*0.06;
        gsap.to(b.blob, { x: `+=${nx * m}`, y: `+=${ny * m}`, duration: 0.9, ease: 'power3.out' });
      });
    });
  }

  // theme adaptation: reduce intensity on light-theme (handled by CSS opacity), but ensure colors are softer
  const observerTheme = new MutationObserver(()=>{
    const isLight = document.documentElement.classList.contains('light-theme');
    blobs.forEach((b, idx) => {
      if (isLight) b.blob.style.opacity = 0.06;
      else b.blob.style.opacity = (document.body.classList.contains('projects-page') ? 0.04 : 0.08);
    });
  });
  observerTheme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

})();



/* -------------------------
   Synchronized parallax section glow blobs (added)
   - Creates one glow blob per section (if section has id)
   - Blobs move in synchronized, slow waves for a rhythmic effect.
   - Adapts to light/dark theme and reduces opacity on projects page.
------------------------- */
(function () {
  function initSectionGlows() {
    const container = document.querySelector('.global-bg-lights');
    if (!container) return;
    // Only run if GSAP exists (we use GSAP for smooth, low-cost animations)
    if (!window.gsap) return;

    // Section color sets (cool-toned, adapted for light/dark via CSS variables)
    const sectionColorsDark = {
      hero: ['#7fd1ff44', '#a88bff44'],
      skills: ['#a88bff44', '#9ec5ff33'],
      about: ['#99ccff33', '#7fd1ff22'],
      projects: ['#8f73ff33', '#b099ff22'],
      contact: ['#7dcfff33', '#aaddff22'],
      experience: ['#9ec5ff33', '#7fd1ff22']
    };

    const sectionColorsLight = {
      hero: ['#e6f7ff33', '#efe8ff33'],
      skills: ['#f0eaff33', '#e6f7ff33'],
      about: ['#fff3e633', '#fff8ee33'],
      projects: ['#f3eaff22', '#efe6ff22'],
      contact: ['#eafff433', '#e6fff033'],
      experience: ['#eef7ff33', '#f3f0ff33']
    };

    // Determine which page we are on to reduce intensity on projects page
    const isProjectsPage = document.body.classList.contains('projects-page') || location.href.includes('projects.html') || document.body.dataset.page === 'projects';

    // Create one glow per visible section (by id)
    const sections = Array.from(document.querySelectorAll('section[id]'));
    sections.forEach((sec, idx) => {
      // create glow element
      const glow = document.createElement('div');
      glow.className = 'section-glow';
      // set data for reference
      glow.dataset.section = sec.id;
      // append into section (so it sits visually behind content)
      sec.appendChild(glow);

      // initial color based on theme
      const colors = (document.documentElement.classList.contains('light-theme') ? sectionColorsLight : sectionColorsDark)[sec.id] || ['#a88bff33', '#9ec5ff33'];
      glow.style.background = `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 40%), radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 55%)`;

      // slightly tweak opacity for projects page
      if (isProjectsPage) {
        glow.style.opacity = '0.04';
      }
    });

    // synchronized slow wave animation: move all glows together along paths with phase offsets
    const allGlows = Array.from(document.querySelectorAll('.section-glow'));
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });

    // Build gentle wave - translate X and Y with different amplitudes and periods
    allGlows.forEach((g, i) => {
      const ampX = 20 + (i % 3) * 8; // amplitude variation
      const ampY = 12 + (i % 2) * 8;
      const dur = 10 + (i % 3) * 2;
      // create a repeating yoyo tween per glow
      tl.to(g, { x: ampX, y: ampY, duration: dur, repeat: 1, yoyo: true }, 0);
      tl.to(g, { x: -ampX, y: -ampY, duration: dur, repeat: 1, yoyo: true }, dur);
    });

    // subtle parallax on mouse move for desktop
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      let raf = null;
      document.addEventListener('mousemove', (e) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nx = (e.clientX / vw - 0.5) * 30; // normalized offset
        const ny = (e.clientY / vh - 0.5) * 30;
        allGlows.forEach((g, i) => {
          const mul = 0.12 + (i % 3) * 0.06; // depth multiplier per glow
          gsap.to(g, { x: `+=${nx * mul}`, y: `+=${ny * mul}`, duration: 0.9, ease: 'power3.out' });
        });
        document.body.style.setProperty('--mouse-x', (e.clientX / vw) * 100 + '%');
        document.body.style.setProperty('--mouse-y', (e.clientY / vh) * 100 + '%');
        document.body.classList.add('mouse-light');
      });
    }

    // Update colors on theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.contains('light-theme');
        allGlows.forEach((g) => {
          const sec = g.dataset.section;
          const colors = (isLight ? sectionColorsLight : sectionColorsDark)[sec] || ['#a88bff33', '#9ec5ff33'];
          g.style.background = `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 40%), radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 55%)`;
        });
      });
    }

    // Clean-up: If a section is removed, stop animating its glow (rare in static site but safe)
    const observer = new MutationObserver(() => {
      const updated = Array.from(document.querySelectorAll('.section-glow'));
      if (updated.length !== allGlows.length) {
        // kill timeline and re-init to avoid orphaned tweens
        tl.kill();
        // re-run initialization (debounced)
        setTimeout(() => {
          document.querySelectorAll('.section-glow').forEach(n => n.remove());
          initSectionGlows();
        }, 80);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize safely when DOM is ready and GSAP is present
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSectionGlows, 120);
  } else {
    document.addEventListener('DOMContentLoaded', initSectionGlows);
  }
})();

 

/* === Neon dynamic synchronized glows + intensity toggle === */
(function () {
  // guard
  if (!window.gsap) return;

  function applyGlowSetup() {
    // create glows inside each section if missing
    const sections = Array.from(document.querySelectorAll('section[id]'));
    sections.forEach((sec) => {
      if (!sec.querySelector('.section-glow')) {
        const glow = document.createElement('div');
        glow.className = 'section-glow';
        glow.dataset.section = sec.id;
        sec.appendChild(glow);
      }
    });

    const allGlows = Array.from(document.querySelectorAll('.section-glow'));
    if (allGlows.length === 0) return;

    // color sets (cool-toned cyan -> violet)
    const darkColors = {
      hero: ['#00f6ffcc', '#8b00ffcc'],
      skills: ['#00eaffcc', '#9a2fffcc'],
      about: ['#00f6ffcc', '#8b00ffcc'],
      projects: ['#00eaffcc', '#7f00ffcc'],
      contact: ['#00f6ffcc', '#8b00ffcc'],
      experience: ['#00d8ffcc', '#a800ffcc']
    };
    const lightColors = {
      hero: ['#aeeeff88', '#d9c6ff88'],
      skills: ['#cfefff88', '#e6d4ff88'],
      about: ['#e6f7ff88', '#f0e8ff88'],
      projects: ['#e3f4ff88', '#e6dfff88'],
      contact: ['#d1fff688', '#e6fff088'],
      experience: ['#dff4ff88', '#e9e0ff88']
    };

    const isProjectsPage = document.body.classList.contains('projects-page') || document.body.dataset.page === 'projects' || location.href.includes('projects.html');

    // apply initial colors and opacity based on theme and page
    const isLight = document.documentElement.classList.contains('light-theme');
    allGlows.forEach((g) => {
      const id = g.dataset.section;
      const colors = (isLight ? lightColors : darkColors)[id] || ['#00eaff88', '#8b00ff88'];
      g.style.background = `radial-gradient(circle at 40% 40%, ${colors[0]}, transparent 40%), radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 55%)`;
      g.style.opacity = isProjectsPage ? '0.16' : '0.35';
      // small random phase for animation
      g.dataset.phase = (Math.random() * 0.6).toFixed(2);
    });

    // synchronized slow wave timeline (slightly faster)
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
    allGlows.forEach((g, i) => {
      const ampX = 25 + (i % 3) * 10;
      const ampY = 18 + (i % 2) * 8;
      const dur = 8 + (i % 3);
      const phase = parseFloat(g.dataset.phase) || 0;
      tl.to(g, { x: ampX, y: ampY, duration: dur, repeat: 1, yoyo: true }, phase);
      tl.to(g, { x: -ampX, y: -ampY, duration: dur, repeat: 1, yoyo: true }, dur + phase);
    });

    // neon pulse - dynamic faster pulses with slight phase offsets
    allGlows.forEach((g, i) => {
      const base = parseFloat(g.style.opacity) || (isProjectsPage ? 0.16 : 0.35);
      const extra = 0.12; // pulse amplitude
      const delay = (i % 4) * 0.18;
      gsap.to(g, {
        opacity: base + extra,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay
      });
    });

    // subtle mouse parallax for desktop
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mousemove', (e) => {
        const vw = window.innerWidth, vh = window.innerHeight;
        const nx = (e.clientX / vw - 0.5) * 30;
        const ny = (e.clientY / vh - 0.5) * 30;
        allGlows.forEach((g, i) => {
          const mul = 0.12 + (i % 3) * 0.06;
          gsap.to(g, { x: `+=${nx * mul}`, y: `+=${ny * mul}`, duration: 0.9, ease: 'power3.out' });
        });
        document.body.style.setProperty('--mouse-x', (e.clientX / vw) * 100 + '%');
        document.body.style.setProperty('--mouse-y', (e.clientY / vh) * 100 + '%');
        document.body.classList.add('mouse-light');
      });
    }

    // update colors on theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isLightNow = document.documentElement.classList.contains('light-theme');
        allGlows.forEach((g) => {
          const id = g.dataset.section;
          const colors = (isLightNow ? lightColors : darkColors)[id] || ['#00eaff88', '#8b00ff88'];
          g.style.background = `radial-gradient(circle at 40% 40%, ${colors[0]}, transparent 40%), radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 55%)`;
        });
      });
    }

    // intensity toggle: persistence via localStorage
    const toggleBtn = document.getElementById('glow-intensity-toggle');
    if (toggleBtn) {
      const levels = ['high', 'medium', 'off'];
      const stored = localStorage.getItem('glow-level') || 'high';
      let current = levels.indexOf(stored);
      if (current < 0) current = 0;

      const applyLevel = (lvl) => {
        const map = { high: isProjectsPage ? 0.16 : 0.35, medium: isProjectsPage ? 0.08 : 0.18, off: 0 };
        allGlows.forEach((g) => gsap.to(g, { opacity: map[lvl], duration: 0.6, ease: 'sine.inOut' }));
        toggleBtn.title = `Glow: ${lvl}`;
        localStorage.setItem('glow-level', lvl);
      };

      // initialize
      applyLevel(levels[current]);

      toggleBtn.addEventListener('click', () => {
        current = (current + 1) % levels.length;
        applyLevel(levels[current]);
        // small bounce
        gsap.fromTo(toggleBtn, { scale: 0.82 }, { scale: 1, duration: 0.28, ease: 'back.out(1.2)' });
      });
    }
  } // end applyGlowSetup

  // initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGlowSetup);
  } else {
    applyGlowSetup();
  }
})();



/* --- Header Scroll Animation --- */
const headerEl = document.querySelector('header');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  if (window.scrollY > 10 && !headerEl.classList.contains('header-scrolled')) {
    headerEl.classList.add('header-scrolled');
  } else if (window.scrollY <= 10 && headerEl.classList.contains('header-scrolled')) {
    headerEl.classList.remove('header-scrolled');
  }
});


/* -------------------------
   Projects Hover-Lift (GSAP micro-interaction)
------------------------- */
document.querySelectorAll('.project').forEach(card => {
  card.addEventListener('mouseenter', () => {
    if (window.gsap)
      gsap.to(card, { y: -8, scale: 1.02, duration: 0.4, ease: "power3.out" });
  });
  card.addEventListener('mouseleave', () => {
    if (window.gsap)
      gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power3.inOut" });
  });
});

