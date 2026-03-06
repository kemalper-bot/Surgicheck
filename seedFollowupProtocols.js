// seedFollowupProtocols.js
// Run once: node seedFollowupProtocols.js
// Seeds Firestore with postop follow-up schedules and question templates

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ─── FOLLOW-UP SCHEDULES (per procedure) ─────────────────────────────────────
// days: when to send (relative to discharge date)
const followupSchedules = {
  rhinoplasty: {
    procedureName_tr: "Rinoplasti",
    days: [1, 3, 7, 14, 30],
    alertThresholds: {
      pain: 7,         // NRS ≥7 → alert
      fever: true,     // any fever → alert
      bleeding: true,  // any bleeding → alert
    },
  },
  liposuction: {
    procedureName_tr: "Liposakşın",
    days: [1, 3, 7, 14, 30],
    alertThresholds: { pain: 7, fever: true, bleeding: true, swelling: 4 },
  },
  blepharoplasty: {
    procedureName_tr: "Blefaroplasti",
    days: [1, 3, 7, 30],
    alertThresholds: { pain: 6, fever: true, bleeding: true, vision_change: true },
  },
  breast_augmentation: {
    procedureName_tr: "Meme Augmentasyonu",
    days: [1, 3, 7, 14, 30, 90],
    alertThresholds: { pain: 7, fever: true, bleeding: true, swelling: 4 },
  },
  abdominoplasty: {
    procedureName_tr: "Abdominoplasti",
    days: [1, 3, 7, 14, 30],
    alertThresholds: { pain: 8, fever: true, bleeding: true, swelling: 4 },
  },
};

// ─── QUESTION SETS (per day bucket) ──────────────────────────────────────────
// day_1_3: first 72h — critical early complications
// day_7_14: wound healing phase
// day_30_plus: outcomes and satisfaction

const questionSets = {
  day_1_3: {
    label: "İlk 72 Saat Takibi",
    questions: [
      {
        id: "pain",
        type: "scale",       // 0–10 NRS
        text: "Ağrı düzeyinizi 0–10 arasında puanlayın (0: ağrı yok, 10: dayanılmaz)",
        alertIfAbove: 7,
      },
      {
        id: "fever",
        type: "boolean",
        text: "38°C üzerinde ateşiniz var mı?",
        alertIfTrue: true,
      },
      {
        id: "bleeding",
        type: "boolean",
        text: "Yara bölgesinde anormal kanama veya akıntı var mı?",
        alertIfTrue: true,
      },
      {
        id: "swelling",
        type: "scale",       // 0–5 subjective
        text: "Şişlik düzeyini değerlendirin (0: yok, 5: çok fazla)",
        alertIfAbove: 4,
      },
      {
        id: "medication_compliance",
        type: "boolean",
        text: "Taburculuk ilaçlarınızı düzenli kullanıyor musunuz?",
        alertIfFalse: true,
      },
      {
        id: "photo_upload",
        type: "photo",
        text: "Mümkünse ameliyat bölgesinin fotoğrafını ekleyin (isteğe bağlı)",
        alertIfFilled: false,
      },
      {
        id: "free_text",
        type: "text",
        text: "Eklemek istediğiniz şikayetiniz var mı?",
        alertIfFilled: false,  // logged but no auto-alert
      },
    ],
  },

  day_7_14: {
    label: "Yara İyileşme Takibi",
    questions: [
      {
        id: "pain",
        type: "scale",
        text: "Güncel ağrı düzeyinizi puanlayın (0–10)",
        alertIfAbove: 5,
      },
      {
        id: "wound_appearance",
        type: "select",
        text: "Yara görünümü nasıl?",
        options: ["Normal iyileşiyor", "Hafif kızarıklık var", "Akıntı var", "Açılma var"],
        alertIfSelected: ["Akıntı var", "Açılma var"],
      },
      {
        id: "fever",
        type: "boolean",
        text: "Son 48 saatte ateş yaşadınız mı?",
        alertIfTrue: true,
      },
      {
        id: "activity",
        type: "select",
        text: "Günlük aktivite düzeyiniz nasıl?",
        options: ["Yatakta dinleniyorum", "Evde hafif hareket edebiliyorum", "Normal aktivite"],
        alertIfSelected: [],
      },
      {
        id: "photo_upload",
        type: "photo",
        text: "Mümkünse yara bölgesinin fotoğrafını ekleyin (isteğe bağlı)",
        alertIfFilled: false,
      },
      {
        id: "free_text",
        type: "text",
        text: "Eklemek istediğiniz şikayetiniz var mı?",
        alertIfFilled: false,
      },
    ],
  },

  day_30_plus: {
    label: "Sonuç ve Memnuniyet Değerlendirmesi",
    questions: [
      {
        id: "overall_satisfaction",
        type: "scale",
        text: "Genel memnuniyetinizi puanlayın (0–10)",
        alertIfBelow: 4,
      },
      {
        id: "result_meets_expectation",
        type: "boolean",
        text: "Ameliyat sonucu beklentilerinizi karşıladı mı?",
        alertIfFalse: false,  // log only
      },
      {
        id: "pain",
        type: "scale",
        text: "Hâlâ ağrınız var mı? (0: yok, 10: şiddetli)",
        alertIfAbove: 4,
      },
      {
        id: "complication",
        type: "boolean",
        text: "Herhangi bir komplikasyon yaşadınız mı?",
        alertIfTrue: true,
      },
      {
        id: "recommend",
        type: "boolean",
        text: "Kliniğimizi başkalarına önerir misiniz?",
        alertIfFalse: false,  // log for NPS
      },
      {
        id: "photo_upload",
        type: "photo",
        text: "Sonuç fotoğrafı eklemek ister misiniz? (isteğe bağlı)",
        alertIfFilled: false,
      },
      {
        id: "free_text",
        type: "text",
        text: "Görüş ve önerileriniz",
        alertIfFilled: false,
      },
    ],
  },
};

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function main() {
  // Schedules
  const batch1 = db.batch();
  for (const [id, data] of Object.entries(followupSchedules)) {
    batch1.set(db.collection("followupSchedules").doc(id), data);
  }
  await batch1.commit();
  console.log("✓ followupSchedules seeded");

  // Question sets
  const batch2 = db.batch();
  for (const [id, data] of Object.entries(questionSets)) {
    batch2.set(db.collection("followupQuestions").doc(id), data);
  }
  await batch2.commit();
  console.log("✓ followupQuestions seeded");

  console.log("\n✅ Postop follow-up data seeded.");
  process.exit(0);
}

main().catch(console.error);
