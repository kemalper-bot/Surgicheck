// seedPhotoProtocols.js
// Run once: node seedPhotoProtocols.js
// Seeds Firestore with procedure-specific photo upload protocols and config

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ─── PHOTO PROTOCOLS (per procedure) ─────────────────────────────────────────
const photoProtocols = {
  rhinoplasty: {
    required: ["front", "right_lateral", "left_lateral"],
    recommended: ["basal"],
    optional: ["reference"],
  },
  liposuction: {
    required: ["front", "lateral", "posterior"],
    recommended: [],
    optional: ["reference"],
  },
  blepharoplasty: {
    required: ["front", "close_up"],
    recommended: ["upward_gaze"],
    optional: ["reference"],
  },
  breast_augmentation: {
    required: ["front", "right_lateral", "left_lateral"],
    recommended: [],
    optional: ["reference"],
  },
  breast_reduction: {
    required: ["front", "right_lateral", "left_lateral"],
    recommended: ["posterior"],
    optional: ["reference"],
  },
  breast_lift: {
    required: ["front", "right_lateral", "left_lateral"],
    recommended: ["posterior"],
    optional: ["reference"],
  },
  abdominoplasty: {
    required: ["front", "lateral", "posterior"],
    recommended: [],
    optional: ["reference"],
  },
  tummy_tuck: {
    required: ["front", "lateral", "posterior"],
    recommended: [],
    optional: ["reference"],
  },
  facelift: {
    required: ["front", "right_lateral", "left_lateral"],
    recommended: ["half_profile"],
    optional: ["reference"],
  },
  bbl: {
    required: ["front", "posterior", "lateral"],
    recommended: [],
    optional: ["reference"],
  },
  default: {
    required: ["front", "lateral"],
    recommended: [],
    optional: ["reference"],
  },
};

// ─── PHOTO CONFIG ─────────────────────────────────────────────────────────────
const photoLabels = {
  front: "Önden",
  right_lateral: "Sağdan",
  left_lateral: "Soldan",
  lateral: "Yandan",
  posterior: "Arkadan",
  basal: "Alttan (Basal)",
  close_up: "Yakın Çekim",
  upward_gaze: "Yukarı Bakış",
  half_profile: "Yarım Profil",
  reference: "Referans Fotoğraf",
};

const photoInstructions = {
  front: "Düz karşıya bakın, yüzünüz nötr pozisyonda olsun.",
  right_lateral: "Başınızı sola çevirin, sağ profiliniz görünsün.",
  left_lateral: "Başınızı sağa çevirin, sol profiliniz görünsün.",
  lateral: "Tam yana dönün.",
  posterior: "Tam arkaya dönün.",
  basal: "Çenenizi hafifçe yukarı kaldırın, kamera aşağıdan açıyla çeksin.",
  close_up: "Gözlerinizi açık tutun, kameraya yakın çekim yapın.",
  upward_gaze: "Hafifçe yukarı bakın.",
  half_profile: "Yaklaşık 45 derece yana dönün.",
  reference: "İstediğiniz sonuca dair bir referans fotoğraf ekleyebilirsiniz.",
};

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function main() {
  // Photo protocols
  const batch1 = db.batch();
  for (const [id, data] of Object.entries(photoProtocols)) {
    batch1.set(db.collection("photoProtocols").doc(id), data);
  }
  await batch1.commit();
  console.log("✓ photoProtocols seeded");

  // Photo config — labels and instructions
  const batch2 = db.batch();
  batch2.set(db.collection("photoConfig").doc("labels"), photoLabels);
  batch2.set(db.collection("photoConfig").doc("instructions"), photoInstructions);
  await batch2.commit();
  console.log("✓ photoConfig seeded");

  console.log("\n✅ Photo protocol data seeded.");
  process.exit(0);
}

main().catch(console.error);
