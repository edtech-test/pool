const firebaseConfig = window.C_POOL_FIREBASE_CONFIG || {};
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let firestoreDb = null;
let firestoreApi = null;

function getStudentId() {
  const key = "c-pool-tutor-student-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `student-${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

async function initRemoteDb() {
  if (!hasFirebaseConfig || firestoreDb) return Boolean(firestoreDb);

  const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const app = appModule.initializeApp(firebaseConfig);
  firestoreDb = firestoreModule.getFirestore(app);
  firestoreApi = firestoreModule;
  return true;
}

async function saveRemoteAnswer(answer) {
  const ready = await initRemoteDb();
  if (!ready) return false;

  const studentId = getStudentId();
  await firestoreApi.addDoc(firestoreApi.collection(firestoreDb, "answers"), {
    ...answer,
    studentId,
    createdAt: firestoreApi.serverTimestamp()
  });
  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "students", studentId),
    {
      studentId,
      lastSeenAt: firestoreApi.serverTimestamp()
    },
    { merge: true }
  );
  return true;
}

async function saveRemoteProgress(unlockedPage) {
  const ready = await initRemoteDb();
  if (!ready) return false;

  const studentId = getStudentId();
  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "progress", studentId),
    {
      studentId,
      unlockedPage,
      updatedAt: firestoreApi.serverTimestamp()
    },
    { merge: true }
  );
  return true;
}

async function loadRemoteAnswers(limitCount = 100) {
  const ready = await initRemoteDb();
  if (!ready) return [];

  const queryRef = firestoreApi.query(
    firestoreApi.collection(firestoreDb, "answers"),
    firestoreApi.orderBy("createdAt", "desc"),
    firestoreApi.limit(limitCount)
  );
  const snapshot = await firestoreApi.getDocs(queryRef);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

window.CPoolDb = {
  hasFirebaseConfig,
  getStudentId,
  saveRemoteAnswer,
  saveRemoteProgress,
  loadRemoteAnswers
};
