/* static/js/main.js — Logika JavaScript untuk Flipcard Learning App */

"use strict";

// ──────────────────────────────────────────────────────────
// KONSTANTA & STATE GLOBAL
// ──────────────────────────────────────────────────────────
const API = {
  decks:      "/api/decks",
  createDeck: "/api/deck",
  deck:       (id) => `/api/deck/${id}`,
  cards:      (deckId) => `/api/cards/${deckId}`,
  createCard: "/api/card",
  card:       (id) => `/api/card/${id}`,
};

// ──────────────────────────────────────────────────────────
// UTILITAS: Fetch JSON
// ──────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return await res.json();
  } catch (err) {
    console.error("[API Error]", err);
    return { success: false, message: "Gagal terhubung ke server." };
  }
}

// ──────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────────────────────────
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animasi masuk
  requestAnimationFrame(() => toast.classList.add("toast-show"));

  setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

// ──────────────────────────────────────────────────────────
// MODAL HELPERS
// ──────────────────────────────────────────────────────────
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("modal-open");
    document.body.style.overflow = "";
  }
}

// Tutup modal saat klik overlay
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.closest(".modal-wrapper")?.classList.remove("modal-open");
    document.body.style.overflow = "";
  }
});

// ──────────────────────────────────────────────────────────
// HALAMAN BERANDA — Manajemen Deck
// ──────────────────────────────────────────────────────────
(function initIndexPage() {
  const deckForm = document.getElementById("form-create-deck");
  if (!deckForm) return; // Tidak di halaman index

  // Buat deck baru
  deckForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = deckForm.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    const payload = {
      name:        document.getElementById("input-deck-name").value.trim(),
      description: document.getElementById("input-deck-desc").value.trim(),
    };

    const res = await apiFetch(API.createDeck, {
      method: "POST",
      body:   JSON.stringify(payload),
    });

    btn.disabled = false;
    btn.textContent = "Simpan Deck";

    if (res.success) {
      showToast("✅ Deck berhasil dibuat!");
      closeModal("modal-create-deck");
      deckForm.reset();
      setTimeout(() => location.reload(), 800);
    } else {
      showToast(`❌ ${res.message}`, "error");
    }
  });

  // Hapus deck
  document.querySelectorAll(".btn-delete-deck").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const deckId   = btn.dataset.deckId;
      const deckName = btn.dataset.deckName;

      if (!confirm(`Hapus deck "${deckName}" dan SEMUA kartunya? Tindakan ini tidak bisa dibatalkan.`)) return;

      const res = await apiFetch(API.deck(deckId), { method: "DELETE" });
      if (res.success) {
        showToast("🗑️ Deck berhasil dihapus.");
        document.getElementById(`deck-card-${deckId}`)?.remove();
      } else {
        showToast(`❌ ${res.message}`, "error");
      }
    });
  });
})();

// ──────────────────────────────────────────────────────────
// HALAMAN DECK DETAIL — Manajemen Card
// ──────────────────────────────────────────────────────────
(function initDeckDetailPage() {
  const cardForm = document.getElementById("form-create-card");
  if (!cardForm) return; // Tidak di halaman deck detail

  const deckId = cardForm.dataset.deckId;

  // Tambah kartu baru
  cardForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = cardForm.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    const payload = {
      deck_id: parseInt(deckId),
      front:   document.getElementById("input-card-front").value.trim(),
      back:    document.getElementById("input-card-back").value.trim(),
    };

    const res = await apiFetch(API.createCard, {
      method: "POST",
      body:   JSON.stringify(payload),
    });

    btn.disabled = false;
    btn.textContent = "Simpan Kartu";

    if (res.success) {
      showToast("✅ Kartu berhasil ditambahkan!");
      closeModal("modal-create-card");
      cardForm.reset();
      setTimeout(() => location.reload(), 800);
    } else {
      showToast(`❌ ${res.message}`, "error");
    }
  });

  // Hapus kartu
  document.querySelectorAll(".btn-delete-card").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cardId = btn.dataset.cardId;
      if (!confirm("Hapus kartu ini?")) return;

      const res = await apiFetch(API.card(cardId), { method: "DELETE" });
      if (res.success) {
        showToast("🗑️ Kartu berhasil dihapus.");
        document.getElementById(`card-item-${cardId}`)?.remove();

        // Update counter kartu
        const counter = document.getElementById("card-count");
        if (counter) {
          const current = parseInt(counter.textContent) || 0;
          counter.textContent = Math.max(0, current - 1);
        }
      } else {
        showToast(`❌ ${res.message}`, "error");
      }
    });
  });
})();

// ──────────────────────────────────────────────────────────
// HALAMAN STUDY MODE — Navigasi Kartu
// ──────────────────────────────────────────────────────────
(function initStudyPage() {
  const studyContainer = document.getElementById("study-container");
  if (!studyContainer) return; // Tidak di halaman study

  const cards      = JSON.parse(studyContainer.dataset.cards || "[]");
  const totalCards = cards.length;
  let   currentIdx = 0;

  const cardFront     = document.getElementById("card-front-text");
  const cardBack      = document.getElementById("card-back-text");
  const flipCard      = document.getElementById("flip-card");
  const btnPrev       = document.getElementById("btn-prev");
  const btnNext       = document.getElementById("btn-next");
  const progressText  = document.getElementById("progress-text");
  const progressBar   = document.getElementById("progress-bar-fill");

  function updateCard(idx) {
    const card = cards[idx];
    cardFront.textContent = card.front;
    cardBack.textContent  = card.back;

    // Reset flip ke sisi depan
    flipCard.classList.remove("is-flipped");

    // Update progress
    progressText.textContent = `${idx + 1} / ${totalCards}`;
    progressBar.style.width  = `${((idx + 1) / totalCards) * 100}%`;

    // State tombol
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === totalCards - 1;

    // Ganti label Next saat kartu terakhir
    btnNext.textContent = idx === totalCards - 1 ? "Selesai 🎉" : "Berikutnya →";
  }

  // Flip kartu saat diklik
  flipCard.addEventListener("click", () => {
    flipCard.classList.toggle("is-flipped");
  });

  // Navigasi — Sebelumnya
  btnPrev.addEventListener("click", () => {
    if (currentIdx > 0) {
      currentIdx--;
      updateCard(currentIdx);
    }
  });

  // Navigasi — Berikutnya / Selesai
  btnNext.addEventListener("click", () => {
    if (currentIdx < totalCards - 1) {
      currentIdx++;
      updateCard(currentIdx);
    } else {
      // Selesai belajar
      document.getElementById("study-complete-overlay").classList.remove("hidden");
    }
  });

  // Keyboard navigation (← →, Space untuk flip)
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft"  && currentIdx > 0)              { currentIdx--; updateCard(currentIdx); }
    if (e.key === "ArrowRight" && currentIdx < totalCards - 1) { currentIdx++; updateCard(currentIdx); }
    if (e.key === " ") { e.preventDefault(); flipCard.classList.toggle("is-flipped"); }
  });

  // Inisialisasi kartu pertama
  updateCard(0);
})();
