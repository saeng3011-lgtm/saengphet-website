const DEFAULT_WHATSAPP = "8562055542701";

const DEFAULT_WORKS = [
  {
    "id": "work-1795185275800",
    "title": "ງານລ້ຽງຮຽນຈົບ.mp4",
    "category": "video",
    "price": "20000",
    "mediaType": "video",
    "mediaSrc": "./ງານລ້ຽງຮຽນຈົບ.mp4",
    "fileName": "ງານລ້ຽງຮຽນຈົບ.mp4",
    "description": "ງານລ້ຽງຮຽນຈົບ.mp4"
  }
];

// === RUNTIME_START ===";
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
function openUploadModal() {
  if (!isAdminMode()) return;
  const modal = document.getElementById("uploadModal");
  if (modal) modal.classList.remove("hidden");
}

function closeUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("uploadForm");
  if (form) form.reset();
  selectedFileData = null;
  const preview = document.getElementById("filePreviewContainer");
  if (preview) {
    preview.innerHTML = "";
    preview.classList.add("hidden");
  }
  const dropMsg = document.getElementById("fileDropMsg");
  if (dropMsg) dropMsg.classList.remove("hidden");
}

function openWaConfigModal() {
  if (!isAdminMode()) return;
  const input = document.getElementById("waPhoneInput");
  if (input) input.value = getWhatsAppNumber();
  const modal = document.getElementById("waConfigModal");
  if (modal) modal.classList.remove("hidden");
}

function closeWaConfigModal() {
  const modal = document.getElementById("waConfigModal");
  if (modal) modal.classList.add("hidden");
}

function openViewModal(work) {
  currentViewingWorkId = work.id;
  const modal = document.getElementById("viewModal");
  if (!modal) return;

  const titleEl = document.getElementById("viewModalTitle");
  const catEl = document.getElementById("viewModalCat");
  const priceEl = document.getElementById("viewModalPrice");
  const mediaBox = document.getElementById("viewMediaContainer");
  const interestBtn = document.getElementById("viewModalInterestBtn");

  const counts = getInterestCounts();
  const count = counts[work.id] || 0;
  const safeSrc = resolveSafeMediaSrc(work.mediaSrc);

  if (titleEl) titleEl.textContent = work.title;
  if (catEl) catEl.textContent = CATEGORY_LABELS[work.category] || work.category;
  if (priceEl) priceEl.textContent = work.price ? `ລາຄາ: ${work.price}` : "";

  if (mediaBox) {
    if (work.mediaType === "video") {
      mediaBox.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;">
          <video src="${safeSrc}" controls autoplay playsinline preload="metadata" style="max-width:100%;max-height:58vh;"></video>
          <a href="${safeSrc}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;font-size:0.85rem;text-decoration:underline;">
            ເປີດໄຟລ໌ວິດີໂອໃນແທັບໃໝ່
          </a>
        </div>
      `;
    } else {
      mediaBox.innerHTML = `<img src="${safeSrc}" alt="${work.title}">`;
    }
  }

  if (interestBtn) {
    interestBtn.textContent = `💬 ສົນໃຈແບບນີ້ / ສົ່ງໄປ WhatsApp (${count} ຄັ້ງ)`;
    interestBtn.onclick = () => triggerInterest(work);
  }

  modal.classList.remove("hidden");
}

function closeViewModal() {
  currentViewingWorkId = null;
  const modal = document.getElementById("viewModal");
  if (modal) modal.classList.add("hidden");
  const mediaBox = document.getElementById("viewMediaContainer");
  if (mediaBox) mediaBox.innerHTML = "";
}

function updateAdminUI(adminMode) {
  const panel = document.getElementById("adminControlPanel");
  const badgeContainer = document.getElementById("adminBadgeContainer");
  const waDisplay = document.getElementById("currentWaDisplay");
  const toggleLinkContainer = document.getElementById("adminToggleLink");

  if (waDisplay) {
    waDisplay.textContent = getWhatsAppNumber();
  }

  if (adminMode) {
    if (panel) {
      panel.classList.remove("hidden");
      const actionsGroup = panel.querySelector(".admin-actions-group");
      if (actionsGroup && !document.getElementById("publishAppJsBtn")) {
        const publishBtn = document.createElement("button");
        publishBtn.type = "button";
        publishBtn.id = "publishAppJsBtn";
        publishBtn.className = "btn-wa-config";
        publishBtn.textContent = "⬇ ດາວໂຫຼດ app.js ອັບຂຶ້ນ GitHub";
        publishBtn.onclick = downloadUpdatedAppJs;
        actionsGroup.appendChild(publishBtn);
      }
    }
    if (badgeContainer) {
      badgeContainer.innerHTML = `<span class="admin-status-pill">● ໂໝດແອັດມິນ (Admin Mode)</span>`;
    }
    if (toggleLinkContainer) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("admin");
      toggleLinkContainer.innerHTML = `<a href="${cleanUrl.toString()}" class="footer-admin-link">ອອກຈາກໂໝດແອັດມິນ</a>`;
    }
  } else {
    if (panel) panel.classList.add("hidden");
    if (badgeContainer) badgeContainer.innerHTML = "";
    if (toggleLinkContainer) {
      const adminUrl = new URL(window.location.href);
      adminUrl.searchParams.set("admin", "saengphet");
      toggleLinkContainer.innerHTML = `<a href="${adminUrl.toString()}" class="footer-admin-link">Admin Login</a>`;
    }
  }
}

async function renderPortfolio() {
  const adminMode = isAdminMode();
  const activeCat = getActiveCategoryFromUrl();
  const grid = document.getElementById("portfolioGrid");
  const emptyState = document.getElementById("emptyState");
  const sectionTitle = document.querySelector(".section-title");
  const categoryTitleBox = document.getElementById("categoryTitleBox");

  if (sectionTitle) {
    sectionTitle.textContent = activeCat === "all"
      ? "ຜົນງານທັງໝົດ (All Works)"
      : (CATEGORY_LABELS[activeCat] || "ຜົນງານ");
  }
  if (categoryTitleBox) {
    categoryTitleBox.textContent = CATEGORY_LABELS[activeCat] || "ທັງໝົດ (All)";
  }

  document.querySelectorAll("#categoryTabs .cat-tab").forEach((tab) => {
    const tabCat = tab.getAttribute("data-cat");
    tab.classList.toggle("active", tabCat === activeCat);
  });

  if (!grid) return;

  const allWorks = await getAllWorks();
  const filtered = activeCat === "all"
    ? allWorks
    : allWorks.filter((w) => w.category === activeCat);

  const counts = getInterestCounts();
  grid.innerHTML = "";

  if (!filtered || filtered.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  filtered.forEach((work) => {
    const card = document.createElement("article");
    card.className = "work-card";

    const catLabel = CATEGORY_LABELS[work.category] || work.category;
    const count = counts[work.id] || 0;
    const safeSrc = resolveSafeMediaSrc(work.mediaSrc);

    const deleteBtnHtml = adminMode
      ? `<button type="button" class="btn-delete-work" title="ລົບຜົນງານ" aria-label="ລົບຜົນງານ">✕</button>`
      : "";

    const videoBadgeHtml = work.mediaType === "video"
      ? `<span class="video-indicator">▶ ວິດີໂອ</span>`
      : "";

    const mediaHtml = work.mediaType === "video"
      ? `<video src="${safeSrc}" muted playsinline preload="metadata"></video>${videoBadgeHtml}`
      : `<img src="${safeSrc}" alt="${work.title}" loading="lazy">`;

    card.innerHTML = `
      <span class="work-cat-badge">${catLabel}</span>
      ${deleteBtnHtml}
      <div class="work-media-wrapper">${mediaHtml}</div>
      <div class="work-info-row">
        <div class="work-title" title="${work.title}">${work.title}</div>
        ${work.price ? `<span class="work-price-tag">${work.price}</span>` : ""}
      </div>
      <button type="button" class="btn-interest-bar">
        <span>ສົນໃຈ / ກົດສັ່ງແບບນີ້</span>
        <span class="interest-count-badge">${count}</span>
      </button>
    `;

    const mediaWrapper = card.querySelector(".work-media-wrapper");
    if (mediaWrapper) {
      mediaWrapper.addEventListener("click", () => openViewModal(work));
    }

    const interestBtn = card.querySelector(".btn-interest-bar");
    if (interestBtn) {
      interestBtn.addEventListener("click", () => triggerInterest(work));
    }

    if (adminMode) {
      const delBtn = card.querySelector(".btn-delete-work");
      if (delBtn) {
        delBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm(`ຕ້ອງການລົບຜົນງານ "${work.title}" ແທ້ບໍ່?`)) {
            await deleteWork(work.id);
            await renderPortfolio();
          }
        });
      }
    }

    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const adminMode = isAdminMode();
  updateAdminUI(adminMode);

  const fileInput = document.getElementById("workFile");
  const previewContainer = document.getElementById("filePreviewContainer");
  const dropMsg = document.getElementById("fileDropMsg");

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        selectedFileData = null;
        return;
      }

      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = () => {
        selectedFileData = {
          fileName: file.name,
          mediaType: isVideo ? "video" : "image",
          mediaSrc: reader.result
        };

        if (previewContainer) {
          previewContainer.classList.remove("hidden");
          previewContainer.innerHTML = isVideo
            ? `<video src="${reader.result}" controls></video>`
            : `<img src="${reader.result}" alt="Preview">`;
        }
        if (dropMsg) dropMsg.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    });
  }

  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAdminMode()) return;

      const catSelect = document.getElementById("workCategory");
      const titleInput = document.getElementById("workTitle");
      const priceInput = document.getElementById("workPrice");

      const category = catSelect ? catSelect.value : "video";
      const title = titleInput ? titleInput.value.trim() : "";
      const price = priceInput ? priceInput.value.trim() : "";

      if (!title || !selectedFileData) {
        alert("ກະລຸນາປ້ອນຊື່ຜົນງານ ແລະ ເລືອກໄຟລ໌ຮູບພາບ ຫຼື ວິດີໂອ");
        return;
      }

      const newWork = {
        id: "work-" + Date.now(),
        title,
        category,
        price,
        fileName: selectedFileData.fileName,
        mediaType: selectedFileData.mediaType,
        mediaSrc: selectedFileData.mediaSrc,
        description: title
      };

      await saveWorkToLocal(newWork);
      closeUploadModal();
      await renderPortfolio();
      alert(
        "ເພີ່ມຜົນງານລົງໜ້າແອັດມິນແລ້ວ!\n" +
        "ໃຫ້ອັບໂຫຼດໄຟລ໌ '" + newWork.fileName + "' ຂຶ້ນ GitHub Repository 'saengphet-website'\n" +
        "ແລ້ວກົດປຸ່ມ '⬇ ດາວໂຫຼດ app.js ອັບຂຶ້ນ GitHub' ໄປວາງທັບໃນ GitHub ເພື່ອໃຫ້ລູກຄ້າທຸກຄົນເຫັນ."
      );
    });
  }

  const waForm = document.getElementById("waConfigForm");
  if (waForm) {
    waForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isAdminMode()) return;
      const input = document.getElementById("waPhoneInput");
      if (input && input.value.trim()) {
        setWhatsAppNumber(input.value.trim());
        updateAdminUI(true);
        closeWaConfigModal();
        alert("ບັນທຶກເບີ WhatsApp ຮຽບຮ້ອຍແລ້ວ! ກົດປຸ່ມ '⬇ ດາວໂຫຼດ app.js ອັບຂຶ້ນ GitHub' ເພື່ອໃຫ້ລູກຄ້າທຸກຄົນໃຊ້ເບີໃໝ່ນີ້.");
      }
    });
  }

  renderPortfolio();
});