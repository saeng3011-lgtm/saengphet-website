const CATEGORY_LABELS = {
    all: 'ທັງໝົດ (All Works)',
    graphic: 'Graphic Designer',
    typing: 'ພິມເອກະສານ (ລາວ-ຈີນ-ອັງກິດ)',
    video: 'ຕັດຕໍ່ວິດີໂອ & Motion',
    web: 'ອອກແບບເວັບໄຊ້ & UI'
};

const DB_NAME = 'SaengphetPortfolioDB';
const DB_VERSION = 1;
const STORE_NAME = 'works';
const WA_STORAGE_KEY = 'saengphet_whatsapp_number';
const DEFAULT_WA_NUMBER = '8562099999999';

const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'saengphet';
const currentCat = urlParams.get('cat') || 'all';

let dbInstance = null;

function getWhatsAppNumber() {
    const saved = localStorage.getItem(WA_STORAGE_KEY);
    if (saved && saved.trim()) {
        return saved.replace(/[^0-9]/g, '');
    }
    return DEFAULT_WA_NUMBER;
}

function setWhatsAppNumber(rawPhone) {
    const cleaned = (rawPhone || '').replace(/[^0-9]/g, '');
    if (!cleaned) return false;
    localStorage.setItem(WA_STORAGE_KEY, cleaned);
    return true;
}

function buildWhatsAppOrderUrl(work) {
    const phone = getWhatsAppNumber();
    const catName = CATEGORY_LABELS[work.category] || work.category;
    const isVideo = work.fileType && work.fileType.startsWith('video/');
    const mediaTypeLabel = isVideo ? 'ວິດີໂອ (Video)' : 'ຮູບພາບ (Image)';
    const pageUrl = window.location.href;

    const message = [
        'ສະບາຍດີ ທ່ານ ແສງເພັດ ສັນສຸລິພອນໄຊ (Mr. Saengphet)',
        'ຂ້ອຍສົນໃຈຜົນງານ / ຕ້ອງການສັ່ງເຮັດແບບນີ້:',
        '----------------------------------------',
        `• ຊື່ຜົນງານ: ${work.title}`,
        `• ໝວດໝູ່: ${catName}`,
        `• ລາຄາທີ່ລະບຸ: ${work.price}`,
        `• ປະເພດໄຟລ໌: ${mediaTypeLabel}`,
        `• ລິ້ງໜ້າຜົນງານ: ${pageUrl}`,
        '----------------------------------------',
        'ກະລຸນາແຈ້ງລາຍລະອຽດເພີ່ມເຕີມໃຫ້ແດ່ครับ/ຄະ'
    ].join('\n');

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('IndexedDB Error:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function getAllWorks() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const items = request.result || [];
            items.sort((a, b) => b.createdAt - a.createdAt);
            resolve(items);
        };
        request.onerror = () => reject(request.error);
    });
}

async function addWorkItem(item) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deleteWorkItem(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function incrementInterestCount(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
            const item = getReq.result;
            if (!item) {
                reject(new Error('Work not found'));
                return;
            }
            item.interestCount = (item.interestCount || 0) + 1;
            const putReq = store.put(item);
            putReq.onsuccess = () => resolve(item.interestCount);
            putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupNavigationAndHeaders();
    setupAdminModeUI();
    setupFileInputPreview();
    setupUploadFormHandler();
    setupWaConfigFormHandler();
    await renderPortfolio();
});

function setupNavigationAndHeaders() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
        const tabCat = tab.getAttribute('data-cat');
        if (tabCat === currentCat) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }

        if (isAdmin) {
            const href = tab.getAttribute('href');
            const separator = href.includes('?') ? '&' : '?';
            tab.setAttribute('href', `${href}${separator}admin=saengphet`);
        }
    });

    const bannerTitle = document.getElementById('categoryBannerTitle');
    if (bannerTitle) {
        bannerTitle.textContent = CATEGORY_LABELS[currentCat] || CATEGORY_LABELS.graphic;
    }

    const adminCurrentCatLabel = document.getElementById('adminCurrentCatLabel');
    if (adminCurrentCatLabel) {
        adminCurrentCatLabel.textContent = CATEGORY_LABELS[currentCat] || CATEGORY_LABELS.graphic;
    }

    const backHomeBtn = document.getElementById('backHomeBtn');
    if (backHomeBtn && isAdmin) {
        backHomeBtn.setAttribute('href', 'index.html?admin=saengphet');
    }
}

function updateWaDisplays() {
    const displays = document.querySelectorAll('#currentWaDisplay');
    const waNum = getWhatsAppNumber();
    displays.forEach(el => {
        el.textContent = waNum;
    });
}

function setupAdminModeUI() {
    const adminControlPanel = document.getElementById('adminControlPanel');
    const adminBadgeContainer = document.getElementById('adminBadgeContainer');
    const adminToggleLink = document.getElementById('adminToggleLink');
    const emptySubtext = document.getElementById('emptySubtext');

    updateWaDisplays();

    if (isAdmin) {
        if (adminControlPanel) adminControlPanel.classList.remove('hidden');
        if (adminBadgeContainer) {
            adminBadgeContainer.innerHTML = `<span class="admin-status-pill">🔑 Admin: Saengphet</span>`;
        }
        if (adminToggleLink) {
            const cleanUrl = window.location.pathname + (currentCat !== 'all' ? `?cat=${currentCat}` : '');
            adminToggleLink.innerHTML = `<a href="${cleanUrl}" class="footer-admin-link">ອອກຈາກໂໝດແອັດມິນ (View as Customer)</a>`;
        }
        if (emptySubtext) {
            emptySubtext.textContent = 'ກົດປຸ່ມ "+ Upload ຜົນງານໃໝ່" ດ້ານເທິງເພື່ອເພີ່ມຮູບພາບ ຫຼື ວິດີໂອ';
        }
    } else {
        if (adminControlPanel) adminControlPanel.classList.add('hidden');
        if (adminToggleLink) {
            const adminUrl = window.location.pathname + (currentCat !== 'all' ? `?cat=${currentCat}&admin=saengphet` : '?admin=saengphet');
            adminToggleLink.innerHTML = `<a href="${adminUrl}" class="footer-admin-link">Admin Login</a>`;
        }
    }
}

async function renderPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    try {
        const allWorks = await getAllWorks();
        const filteredWorks = currentCat === 'all'
            ? allWorks
            : allWorks.filter(w => w.category === currentCat);

        grid.innerHTML = '';

        if (filteredWorks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        filteredWorks.forEach(work => {
            const card = createWorkCardElement(work);
            grid.appendChild(card);
        });
    } catch (err) {
        console.error('Error rendering portfolio:', err);
    }
}

function createWorkCardElement(work) {
    const card = document.createElement('article');
    card.className = 'work-card';
    card.dataset.id = work.id;

    const mediaUrl = URL.createObjectURL(work.fileBlob);
    const isVideo = work.fileType && work.fileType.startsWith('video/');

    if (isAdmin) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete-work';
        delBtn.title = 'ລົບຜົນງານນີ້';
        delBtn.textContent = '✕';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteWork(work.id, work.title);
        };
        card.appendChild(delBtn);
    }

    const catBadge = document.createElement('span');
    catBadge.className = 'work-cat-badge';
    catBadge.textContent = CATEGORY_LABELS[work.category] || work.category;
    card.appendChild(catBadge);

    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'work-media-wrapper';
    mediaWrapper.onclick = () => openViewModal(work, mediaUrl);

    if (isVideo) {
        const videoEl = document.createElement('video');
        videoEl.src = mediaUrl;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = 'metadata';
        mediaWrapper.appendChild(videoEl);

        const vidTag = document.createElement('span');
        vidTag.className = 'video-indicator';
        vidTag.textContent = '▶ ວິດີໂອ (ກົດເບິ່ງ)';
        mediaWrapper.appendChild(vidTag);
    } else {
        const imgEl = document.createElement('img');
        imgEl.src = mediaUrl;
        imgEl.alt = work.title;
        imgEl.loading = 'lazy';
        mediaWrapper.appendChild(imgEl);
    }
    card.appendChild(mediaWrapper);

    const infoRow = document.createElement('div');
    infoRow.className = 'work-info-row';

    const titleEl = document.createElement('div');
    titleEl.className = 'work-title';
    titleEl.textContent = work.title;
    titleEl.title = work.title;

    const priceEl = document.createElement('div');
    priceEl.className = 'work-price-tag';
    priceEl.textContent = `ລາຄາ: ${work.price}`;

    infoRow.appendChild(titleEl);
    infoRow.appendChild(priceEl);
    card.appendChild(infoRow);

    const interestBtn = document.createElement('button');
    interestBtn.type = 'button';
    interestBtn.className = 'btn-interest-bar';
    const count = work.interestCount || 0;
    interestBtn.innerHTML = `<span>ສົນໃຈ / ກົດສັ່ງແບບນີ້ (WhatsApp)</span> <span class="interest-count-badge">${count} ຄັ້ງ</span>`;

    interestBtn.onclick = async () => {
        const waUrl = buildWhatsAppOrderUrl(work);
        // Open WhatsApp immediately so popup blockers don't block customer navigation
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        try {
            const newCount = await incrementInterestCount(work.id);
            work.interestCount = newCount;
            interestBtn.innerHTML = `<span>ສົນໃຈ / ກົດສັ່ງແບບນີ້ (WhatsApp)</span> <span class="interest-count-badge">${newCount} ຄັ້ງ</span>`;
        } catch (err) {
            console.error('Failed to update interest:', err);
        }
    };

    card.appendChild(interestBtn);
    return card;
}

function openWaConfigModal() {
    if (!isAdmin) return;
    const modal = document.getElementById('waConfigModal');
    const input = document.getElementById('waPhoneInput');
    if (input) input.value = getWhatsAppNumber();
    if (modal) modal.classList.remove('hidden');
}

function closeWaConfigModal() {
    const modal = document.getElementById('waConfigModal');
    if (modal) modal.classList.add('hidden');
}

function setupWaConfigFormHandler() {
    const form = document.getElementById('waConfigForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const phoneVal = document.getElementById('waPhoneInput').value;
        if (!setWhatsAppNumber(phoneVal)) {
            alert('ກະລຸນາປ້ອນເບີ WhatsApp ໃຫ້ຖືກຕ້ອງ');
            return;
        }
        updateWaDisplays();
        closeWaConfigModal();
        alert('ບັນທຶກເບີ WhatsApp ຮຽບຮ້ອຍແລ້ວ!');
    });
}

function openUploadModal() {
    if (!isAdmin) return;
    const modal = document.getElementById('uploadModal');
    const catSelect = document.getElementById('workCategory');
    if (catSelect && currentCat !== 'all') {
        catSelect.value = currentCat;
    }
    modal.classList.remove('hidden');
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    const form = document.getElementById('uploadForm');
    const preview = document.getElementById('filePreviewContainer');
    modal.classList.add('hidden');
    if (form) form.reset();
    if (preview) {
        preview.innerHTML = '';
        preview.classList.add('hidden');
    }
}

function setupFileInputPreview() {
    const fileInput = document.getElementById('workFile');
    const preview = document.getElementById('filePreviewContainer');
    if (!fileInput || !preview) return;

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) {
            preview.innerHTML = '';
            preview.classList.add('hidden');
            return;
        }

        const tempUrl = URL.createObjectURL(file);
        preview.innerHTML = '';
        preview.classList.remove('hidden');

        if (file.type.startsWith('video/')) {
            const vid = document.createElement('video');
            vid.src = tempUrl;
            vid.controls = true;
            preview.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = tempUrl;
            preview.appendChild(img);
        }
    });
}

function setupUploadFormHandler() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const category = document.getElementById('workCategory').value;
        const title = document.getElementById('workTitle').value.trim();
        const price = document.getElementById('workPrice').value.trim();
        const fileInput = document.getElementById('workFile');
        const file = fileInput.files[0];

        if (!file || !title || !price) {
            alert('ກະລຸນາປ້ອນຂໍ້ມູນ ແລະ ເລືອກໄຟລ໌ໃຫ້ຄົບຖ້ວນ');
            return;
        }

        const submitBtn = document.getElementById('submitUploadBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'ກຳລັງບັນທຶກ...';

        try {
            const newWork = {
                id: 'work_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                category: category,
                title: title,
                price: price,
                fileType: file.type,
                fileName: file.name,
                fileBlob: file,
                interestCount: 0,
                createdAt: Date.now()
            };

            await addWorkItem(newWork);
            closeUploadModal();
            await renderPortfolio();
        } catch (err) {
            console.error('Upload error:', err);
            alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໄຟລ໌ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ບັນທຶກ ແລະ ອັບໂຫຼດ';
        }
    });
}

async function handleDeleteWork(id, title) {
    if (!isAdmin) return;
    const confirmed = confirm(`ທ່ານຕ້ອງການລົບຜົນງານ "${title}" ແທ້ບໍ່?`);
    if (!confirmed) return;

    try {
        await deleteWorkItem(id);
        await renderPortfolio();
    } catch (err) {
        console.error('Delete error:', err);
        alert('ບໍ່ສາມາດລົບຜົນງານໄດ້');
    }
}

function openViewModal(work, mediaUrl) {
    const modal = document.getElementById('viewModal');
    const titleEl = document.getElementById('viewModalTitle');
    const mediaBox = document.getElementById('viewMediaContainer');
    const catEl = document.getElementById('viewModalCat');
    const priceEl = document.getElementById('viewModalPrice');
    const interestBtn = document.getElementById('viewModalInterestBtn');

    titleEl.textContent = work.title;
    catEl.textContent = CATEGORY_LABELS[work.category] || work.category;
    priceEl.textContent = `ລາຄາ: ${work.price}`;

    mediaBox.innerHTML = '';
    if (work.fileType && work.fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = true;
        video.autoplay = true;
        mediaBox.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.alt = work.title;
        mediaBox.appendChild(img);
    }

    const count = work.interestCount || 0;
    interestBtn.textContent = `💬 ສົນໃຈແບບນີ້ / ສົ່ງໄປ WhatsApp (${count} ຄັ້ງ)`;
    interestBtn.onclick = async () => {
        const waUrl = buildWhatsAppOrderUrl(work);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        const updatedCount = await incrementInterestCount(work.id);
        work.interestCount = updatedCount;
        interestBtn.textContent = `💬 ສົນໃຈແບບນີ້ / ສົ່ງໄປ WhatsApp (${updatedCount} ຄັ້ງ)`;
        await renderPortfolio();
    };

    modal.classList.remove('hidden');
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    const mediaBox = document.getElementById('viewMediaContainer');
    modal.classList.add('hidden');
    if (mediaBox) mediaBox.innerHTML = '';
}
