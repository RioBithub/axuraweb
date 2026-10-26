(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const services = Object.freeze({
    web: {
      title: 'Website & Digital Experience',
      icon: 'code',
      description: 'Bangun tempat yang tepat untuk memperkenalkan nilai bisnis Anda. Dari strategi konten hingga pengalaman pengguna, website dirancang agar informasi mudah dipahami dan langkah berikutnya mudah ditemukan.',
      deliverables: ['Company profile, landing page, dan katalog digital', 'Perencanaan struktur informasi dan desain UI/UX', 'Pengalaman yang responsif di desktop dan ponsel', 'Aplikasi web sesuai ruang lingkup yang dibutuhkan', 'Optimasi dasar performa dan SEO'],
    },
    systems: {
      title: 'Custom Business Systems',
      icon: 'layers',
      description: 'Aplikasi internal yang mengikuti proses perusahaan. Kita mulai dengan memetakan siapa yang mengajukan, meninjau, menyetujui, serta memantau pekerjaan, lalu merancang alur yang lebih mudah dikelola.',
      deliverables: ['Workflow pengajuan dan persetujuan', 'Ticketing, pengelolaan tugas, atau inventaris', 'Pengaturan hak akses berdasarkan peran', 'Pengelolaan dokumen dan riwayat aktivitas', 'Notifikasi serta pelaporan sesuai kebutuhan'],
    },
    data: {
      title: 'Data, Dashboard & Integration',
      icon: 'chart',
      description: 'Hubungkan informasi yang relevan dan kurangi pekerjaan berulang. Indikator, visualisasi, serta laporan disusun berdasarkan pertanyaan yang perlu dijawab oleh tim maupun manajemen.',
      deliverables: ['Perencanaan KPI dan dashboard manajemen', 'Integrasi API dan penghubung sumber data', 'Rekap, filter, serta ekspor Excel atau PDF', 'Otomasi alur kerja dan notifikasi', 'Penyusunan struktur data dan kebutuhan pelaporan'],
    },
    cloud: {
      title: 'Cloud & System Care',
      icon: 'server',
      description: 'Siapkan lingkungan yang mendukung penggunaan sistem setelah dikembangkan. Konfigurasi infrastruktur, pemeliharaan, dan dukungan operasional disesuaikan dengan karakter serta kebutuhan proyek.',
      deliverables: ['Deployment dan konfigurasi lingkungan hosting', 'Pengaturan domain, SSL, dan database', 'Perencanaan pencadangan dan pemulihan', 'Perbaikan serta pemeliharaan sesuai kesepakatan', 'Evaluasi performa dan pengembangan lanjutan'],
    },
  });

  // Navigation and document progress.
  const nav = $('#navLinks');
  const menuToggle = $('#menuToggle');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('#navLinks a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });

  const header = $('#siteHeader');
  const readingProgress = $('#readingProgress');
  let scrollQueued = false;
  function updateProgress() {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    readingProgress.style.width = `${distance > 0 ? Math.min(100, window.scrollY / distance * 100) : 0}%`;
    header.classList.toggle('scrolled', window.scrollY > 20);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  $$('details').forEach(item => item.addEventListener('toggle', updateProgress));
  updateProgress();

  // Accessible tabs; keyboard focus follows the active tab.
  const tabs = $$('[role="tab"]');
  const panels = $$('[role="tabpanel"]');
  function activateTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) {
      tab.focus({ preventScroll: true });
      tab.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    updateProgress();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activateTab(tabs[next], true);
      }
    });
  });

  // The example workspace uses local illustrative data only.
  $$('[data-demo-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.demoFilter;
    $$('[data-demo-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    $$('[data-demo-status]').forEach(row => {
      row.hidden = filter !== 'all' && row.dataset.demoStatus !== filter;
      if (!row.hidden) visible++;
    });
    $('#filterStatus').textContent = `${visible} contoh pengajuan ditampilkan. Seluruh data merupakan ilustrasi.`;
  }));

  const chartData = {
    week: {
      activity: '128', completion: '84%', pending: '20', label: 'mingguan',
      path: 'M0 123C50 130 65 80 120 89S200 117 260 68S340 80 400 41S490 80 550 37S650 61 720 22S770 30 800 9',
    },
    month: {
      activity: '456', completion: '88%', pending: '55', label: 'bulanan',
      path: 'M0 119C60 120 80 95 135 104S220 62 280 73S350 52 420 58S510 23 565 39S660 13 720 26S770 17 800 7',
    },
  };
  $$('[data-chart-period]').forEach(button => button.addEventListener('click', () => {
    const data = chartData[button.dataset.chartPeriod];
    if (!data) return;
    $$('[data-chart-period]').forEach(item => {
      const active = item === button;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('#metricActivity').textContent = data.activity;
    $('#metricCompletion').textContent = data.completion;
    $('#metricPending').textContent = data.pending;
    $('#chartPeriodLabel').textContent = `Contoh data ${data.label}`;
    $('#lineChartTitle').textContent = `Ilustrasi tren aktivitas ${data.label}, bukan data perusahaan`;
    $('#chartLine').setAttribute('d', data.path);
    $('#chartArea').setAttribute('d', `${data.path}V150H0Z`);
  }));

  // Native dialogs provide focus containment and Escape handling.
  const dialogs = $$('dialog');
  function syncDialogState() {
    document.body.classList.toggle('modal-open', dialogs.some(dialog => dialog.open));
  }
  function showDialog(dialog) {
    setMenu(false);
    if (!dialog.open) dialog.showModal();
    syncDialogState();
  }
  dialogs.forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', syncDialogState);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  $('#privacyButton').addEventListener('click', () => showDialog($('#privacyDialog')));

  let currentService = 'web';
  $$('[data-service]').forEach(button => button.addEventListener('click', () => {
    const service = services[button.dataset.service];
    if (!service) return;
    currentService = button.dataset.service;
    $('#serviceDialogTitle').textContent = service.title;
    $('#serviceDialogDescription').textContent = service.description;
    $('#serviceDialogIcon').setAttribute('href', `#${service.icon}`);
    const items = document.createDocumentFragment();
    service.deliverables.forEach(text => {
      const item = document.createElement('li');
      item.textContent = text;
      items.append(item);
    });
    $('#serviceDeliverables').replaceChildren(items);
    showDialog($('#serviceDialog'));
  }));

  const config = window.AXURA_SITE_CONFIG || {};
  const email = typeof config.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) ? config.email : '';
  const whatsapp = typeof config.whatsapp === 'string' && /^\d{8,15}$/.test(config.whatsapp) ? config.whatsapp : '';
  const companyName = config.companyName || 'PT Audev Axura Technology';
  const contactContainer = $('#directContacts');
  if (email) {
    const link = document.createElement('a');
    link.href = `mailto:${email}`;
    link.textContent = `${email} ↗`;
    contactContainer.append(link);
  }
  if (whatsapp) {
    const link = document.createElement('a');
    link.href = `https://wa.me/${whatsapp}`;
    link.textContent = 'WhatsApp perusahaan ↗';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    contactContainer.append(link);
  }
  contactContainer.hidden = !email && !whatsapp;

  const briefDialog = $('#briefDialog');
  const form = $('#briefForm');
  const formView = $('#briefFormView');
  const resultView = $('#briefResultView');
  const output = $('#briefOutput');
  let briefText = '';
  let briefFilename = 'Brief_Proyek_Axura.txt';

  function setBriefView(result) {
    formView.hidden = result;
    resultView.hidden = !result;
    briefDialog.setAttribute('aria-labelledby', result ? 'briefResultTitle' : 'briefTitle');
    $$('.brief-progress span').forEach((span, index) => span.classList.toggle('current', result ? index === 1 : index === 0));
    briefDialog.scrollTop = 0;
  }
  $('h2', resultView).id = 'briefResultTitle';
  function openBrief(interest) {
    if (services[interest]) $(`input[name="service"][value="${interest}"]`, form).checked = true;
    $('#briefError').hidden = true;
    setBriefView(false);
    showDialog(briefDialog);
  }
  $$('[data-open-brief]').forEach(button => button.addEventListener('click', () => openBrief(button.dataset.interest)));
  $('#serviceToBrief').addEventListener('click', () => {
    $('#serviceDialog').close();
    openBrief(currentService);
  });
  $('#editBrief').addEventListener('click', () => {
    setBriefView(false);
    $('#briefMessage').focus();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    $('#briefError').hidden = true;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const company = String(data.get('company') || '').trim();
    const address = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const service = services[String(data.get('service') || '')];
    if (!name || message.length < 15 || !service) {
      $('#briefError').textContent = 'Lengkapi nama, pilihan layanan, dan gambaran kebutuhan minimal 15 karakter.';
      $('#briefError').hidden = false;
      (!name ? $('#briefName') : $('#briefMessage')).focus();
      return;
    }
    briefText = [
      'BRIEF KEBUTUHAN PROYEK', `Untuk ${companyName}`, '',
      `Nama: ${name}`, `Perusahaan: ${company || 'Belum dicantumkan'}`, `Email: ${address}`, `Layanan: ${service.title}`, '',
      'TANTANGAN DAN TUJUAN', message, '',
      'Mohon informasi mengenai pendekatan solusi, ruang lingkup, estimasi biaya, dan jadwal yang sesuai.', '',
      'Disusun melalui axura.cloud. Brief ini belum dikirim secara otomatis.',
    ].join('\n');
    const safeName = (company || name).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Proyek';
    briefFilename = `Brief_Axura_${safeName}.txt`;
    output.value = briefText;
    $('#briefStatus').textContent = '';
    if (email) {
      const link = $('#briefEmailLink');
      link.href = `mailto:${email}?subject=${encodeURIComponent(`Diskusi proyek — ${company || name}`)}&body=${encodeURIComponent(briefText)}`;
      link.hidden = false;
    }
    if (whatsapp) {
      const link = $('#briefWhatsappLink');
      link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(briefText)}`;
      link.hidden = false;
    }
    setBriefView(true);
    $('#copyBrief').focus({ preventScroll: true });
  });
  $('#createBrief').disabled = false;

  $('#copyBrief').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Manual copy required');
      await navigator.clipboard.writeText(briefText);
      $('#briefStatus').textContent = 'Brief berhasil disalin. Siap ditempel ke pesan atau dokumen Anda.';
    } catch (_) {
      output.focus();
      output.select();
      $('#briefStatus').textContent = 'Teks telah dipilih. Gunakan Ctrl+C / Cmd+C, atau pilih Salin pada perangkat Anda.';
    }
  });
  $('#downloadBrief').addEventListener('click', () => {
    const blob = new Blob(['\uFEFF' + briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = briefFilename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#briefStatus').textContent = 'Unduhan brief telah disiapkan.';
  });

  $('#copyrightYear').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    if (!reducedMotion) document.documentElement.classList.add('reveal-ready');
    $$('[data-reveal]').forEach(element => revealObserver.observe(element));
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) $$('#navLinks a').forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  let printState;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = $$('details').map(item => ({ item, open: item.open }));
    printState.forEach(({ item }) => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printState.forEach(({ item, open }) => { item.open = open; });
    printState = null;
  });
})();
