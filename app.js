// ==========================================
// ຂໍ້ມູນກາງສຳລັບລູກຄ້າທຸກຄົນ (ອັບເດດອັດຕະໂນມັດເມື່ອດາວໂຫຼດ app.js ຈາກໂໝດແອັດມິນ)
// ==========================================
const DEFAULT_WHATSAPP = "8562055542701";

const DEFAULT_WORKS = [
  {
    id: "work-graduation-party",
    title: "ງານລ້ຽງຮຽນຈົບ",
    category: "video",
    price: "20,000 ກີບ",
    mediaType: "video",
    mediaSrc: "./ງານລ້ຽງຮຽນຈົບ.mp4",
    description: "ຜົນງານຕັດຕໍ່ວິດີໂອງານລ້ຽງຮຽນຈົບ"
  }
];

const CATEGORY_LABELS = {
  all: "ທັງໝົດ (All)",
  graphic: "Graphic Designer",
  typing: "ພິມເອກະສານ (ລາວ-ຈີນ-ອັງກິດ)",
  video: "ຕັດຕໍ່ວິດີໂອ & Motion",
  web: "ອອກແບບເວັບໄຊ້ & UI"
};

const DB_NAME = "SaengphetPortfolioDB";
const DB_VERSION = 1;
const STORE_NAME = "works";

function isAdminMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "saengphet";
}

function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("020") && digits.length === 11) {
    return "85620" + digits.slice(3);
  }
  if (digits.startsWith("20") && digits.length === 10) {
    return "856" + digits;
  }
  return digits || DEFAULT_WHATSAPP;
}

function getWhatsAppNumber() {
  const saved = localStorage.getItem("saengphet_whatsapp");
  return normalizePhone((saved && saved.trim()) ? saved.trim() : DEFAULT_WHATSAPP);
}

function setWhatsAppNumber(num) {
  const normalized = normalizePhone(num);
  if (normalized) {
    localStorage.setItem("saengphet_whatsapp", normalized);
  }
}

function getHiddenDefaultIds() {
  try {
    return JSON.parse(localStorage.getItem("saengphet_hidden_defaults") || "[]");
  } catch (e) {
    return [];
  }
}

function hideDefaultWork(id) {
  const hidden = getHiddenDefaultIds();
  if (!hidden.includes(id)) {
    hidden.push(id);
    localStorage.setItem("saengphet_hidden_defaults", JSON.stringify(hidden));
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getLocalWorks() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return [];
  }
}

async function getAllWorks() {
  const hiddenIds = getHiddenDefaultIds();
  const visibleDefaults = DEFAULT_WORKS.filter((w) => !hiddenIds.includes(w.id));
  const localWorks = await getLocalWorks();
  const merged = [...visibleDefaults];

  for (const item of localWorks) {
    const idx = merged.findIndex((w) => w.id === item.id);
    if (idx >= 0) {
      merged[idx] = item;
    } else {
      merged.unshift(item);
    }
  }
  return merged;
}

async function saveWorkToLocal(work) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(work);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteWork(id) {
  if (id.startsWith("work-")) {
    hideDefaultWork(id);
  }
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // ignore if not in IndexedDB
  }
}

function buildWhatsAppLink(work) {
  const phone = getWhatsAppNumber();
  const catLabel = CATEGORY_LABELS[work.category] || work.category;
  const priceText = work.price ? `ລາຄາ: ${work.price}` : "";
  const message = [
    "ສະບາຍດີครับ/ຄະ ສົນໃຈສັ່ງງານແບບນີ້:",
    `• ຊື່ຜົນງານ: ${work.title}`,
    `• ໝວດໝູ່: ${catLabel}`,
    priceText ? `• ${priceText}` : ""
  ].filter(Boolean).join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ສ້າງໄຟລ໌ app.js ໃໝ່ໃຫ້ແອັດມິນດາວໂຫຼດໄປອັບໂຫຼດຂຶ້ນ GitHub ໄດ້ເອງ
async function downloadUpdatedAppJs() {
  const works = await getAllWorks();
  const waNumber = getWhatsAppNumber();

  // ແນະນຳໃຫ້ໄຟລ໌ມີເດຍຢູ່ໃນ GitHub Repository ເຊັ່ນ ./ຊື່ໄຟລ໌.mp4
  const cleanWorksForPublish = works.map((w) => {
    const isDataUrl = typeof w.mediaSrc === "string" && w.mediaSrc.startsWith("data:");
    return {
      id: w.id,
      title: w.title,
      category: w.category,
      price: w.price || "",
      mediaType: w.mediaType || "image",
      mediaSrc: isDataUrl
        ? `./${w.fileName || "uploaded-media.mp4"}`
        : w.mediaSrc,
      description: w.description || ""
    };
  });

  const currentScriptEl = document.currentScript || Array.from(document.scripts).find((s) => s.src && s.src.includes("app.js"));
  let tailCode = "";
  if (currentScriptEl && currentScriptEl.src) {
    try {
      const res = await fetch(currentScriptEl.src + "?t=" + Date.now());
      const fullText = await res.text();
      const marker = "// === RUNTIME_START ===";
      const idx = fullText.indexOf(marker);
      if (idx !== -1) {
        tailCode = fullText.slice(idx);
      }
    } catch (e) {
      tailCode = "";
    }
  }

  const headerCode = `const DEFAULT_WHATSAPP = ${JSON.stringify(waNumber)};\n\nconst DEFAULT_WORKS = ${JSON.stringify(cleanWorksForPublish, null, 2)};\n\n`;
  const finalContent = tailCode ? (headerCode + tailCode) : null;

  if (!finalContent) {
    alert("ກະລຸນາກັອບປີ້ຂໍ້ມູນນີ້ໄປໃສ່ໃນ DEFAULT_WORKS:\n" + JSON.stringify(cleanWorksForPublish, null, 2));
    return;
  }

  const blob = new Blob([finalContent], { type: "application/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "app.js";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  alert(
    "ດາວໂຫຼດໄຟລ໌ app.js ທີ່ອັບເດດແລ້ວສຳເລັດ!\n" +
    "1. ຫາກມີໄຟລ໌ຮູບ/ວິດີໂອໃໝ່ ໃຫ້ອັບໂຫຼດໄຟລ໌ນັ້ນຂຶ້ນ GitHub Repository 'saengphet-website' ພ້ອມກັນ\n" +
    "2. ອັບໂຫຼດໄຟລ໌ app.js ນີ້ໄປວາງທັບໃນ GitHub Repository 'saengphet-website'\n" +
    "3. ລໍຖ້າ 1-2 ນາທີ ລູກຄ້າທຸກເຄື່ອງຈະເຫັນທັນທີ!"
  );
}

// === RUNTIME_START ===
function renderWorksGrid(container, works, adminMode) {
  if (!container) return;
  container.innerHTML = "";

  if (!works || works.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>ຍັງບໍ່ທັນມີຜົນງານໃນໝວດນີ້</h3>
        <p>ກະລຸນາລໍຖ້າການອັບເດດຜົນງານຈາກຜູ້ໃຫ້ບໍລິການ</p>
      </div>
    `;
    return;
  }

  works.forEach((work) => {
    const card = document.createElement("div");
    card.className = "work-card";

    let mediaHtml = "";
    if (work.mediaType === "video") {
      mediaHtml = `
        <video controls playsinline preload="metadata" class="work-media">
          <source src="${work.mediaSrc}" type="video/mp4">
          ບໍ່ສາມາດຫຼິ້ນວິດີໂອໄດ້
        </video>
      `;
    } else if (work.mediaSrc) {
      mediaHtml = `<img src="${work.mediaSrc}" alt="${work.title}" class="work-media" loading="lazy">`;
    }

    const waLink = buildWhatsAppLink(work);
    const catLabel = CATEGORY_LABELS[work.category] || work.category;

    const deleteBtnHtml = adminMode
      ? `<button type="button" class="btn-delete" data-id="${work.id}">ລົບ</button>`
      : "";

    card.innerHTML = `
      <div class="work-media-wrap">${mediaHtml}</div>
      <div class="work-body">
        <span class="work-category">${catLabel}</span>
        <h3 class="work-title">${work.title}</h3>
        ${work.price ? `<p class="work-price">${work.price}</p>` : ""}
        <div class="work-actions">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
            ສົນໃຈ / ກົດສັ່ງແບບນີ້ (WhatsApp)
          </a>
          ${deleteBtnHtml}
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (adminMode) {
    container.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await deleteWork(id);
        window.dispatchEvent(new Event("saengphet:works-updated"));
      });
    });
  }
}

function injectAdminPublishButton() {
  const targetParent =
    document.getElementById("setWhatsAppBtn")?.parentElement ||
    document.getElementById("uploadForm")?.parentElement ||
    document.querySelector(".admin-controls, .admin-bar, header, main");

  if (!targetParent || document.getElementById("publishAppJsBtn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "publishAppJsBtn";
  btn.className = "btn-publish-github";
  btn.textContent = "⬇ ດາວໂຫຼດ app.js ເພື່ອອັບຂຶ້ນ GitHub";
  btn.style.cssText = "margin: 8px 4px; padding: 10px 14px; background: #198754; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;";
  btn.addEventListener("click", downloadUpdatedAppJs);

  targetParent.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", () => {
  const adminMode = isAdminMode();
  const gridEl =
    document.getElementById("worksGrid") ||
    document.getElementById("portfolioGrid") ||
    document.querySelector(".works-grid, .portfolio-grid");

  let activeCategory = "all";

  if (adminMode) {
    injectAdminPublishButton();
  }

  async function refreshView() {
    const allWorks = await getAllWorks();
    const filtered = activeCategory === "all"
      ? allWorks
      : allWorks.filter((w) => w.category === activeCategory);
    renderWorksGrid(gridEl, filtered, adminMode);
  }

  document.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-category") || "all";
      document.querySelectorAll("[data-category]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      refreshView();
    });
  });

  const waBtn = document.getElementById("setWhatsAppBtn") || document.querySelector("[data-action='set-whatsapp']");
  if (waBtn && adminMode) {
    waBtn.style.display = "";
    waBtn.addEventListener("click", () => {
      const current = getWhatsAppNumber();
      const input = prompt("ໃສ່ເບີ WhatsApp (ເຊັ່ນ 8562055542701):", current);
      if (input !== null && input.trim()) {
        setWhatsAppNumber(input.trim());
        refreshView();
        alert("ບັນທຶກເບີ WhatsApp ຮຽບຮ້ອຍແລ້ວ! ກົດປຸ່ມ 'ດາວໂຫຼດ app.js' ແລ້ວອັບຂຶ້ນ GitHub ເພື່ອໃຫ້ລູກຄ້າທຸກຄົນໃຊ້ເບີໃໝ່ໄດ້ທັນທີ.");
      }
    });
  }

  const uploadForm = document.getElementById("uploadForm") || document.getElementById("addWorkForm");
  if (uploadForm && adminMode) {
    uploadForm.style.display = "";
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const titleInput = uploadForm.querySelector("[name='title'], #workTitle");
      const catInput = uploadForm.querySelector("[name='category'], #workCategory");
      const priceInput = uploadForm.querySelector("[name='price'], #workPrice");
      const fileInput = uploadForm.querySelector("input[type='file']");

      const title = titleInput ? titleInput.value.trim() : "";
      const category = catInput ? catInput.value : "video";
      const price = priceInput ? priceInput.value.trim() : "";
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;

      if (!title || !file) {
        alert("ກະລຸນາປ້ອນຊື່ຜົນງານ ແລະ ເລືອກໄຟລ໌");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const work = {
          id: "local-" + Date.now(),
          title,
          category,
          price,
          fileName: file.name,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          mediaSrc: reader.result
        };
        await saveWorkToLocal(work);
        uploadForm.reset();
        await refreshView();
        alert(
          "ເພີ່ມຜົນງານລົງໜ້າແອັດມິນແລ້ວ!\n" +
          "ໃຫ້ອັບໂຫຼດໄຟລ໌ '" + file.name + "' ຂຶ້ນ GitHub Repository ແລ້ວກົດປຸ່ມ 'ດາວໂຫຼດ app.js' ໄປວາງທັບໃນ GitHub ដើម្បីໃຫ້ລູກຄ້າທຸກຄົນເຫັນ."
        );
      };
      reader.readAsDataURL(file);
    });
  }

  window.addEventListener("saengphet:works-updated", refreshView);
  refreshView();
});
