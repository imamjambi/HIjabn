// firebase-config.js
// Konfigurasi Firebase untuk Toko Hijabina

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyCcKPeGQCng6zm8t0PEshsELi_ryE4aS-A",
      authDomain: "hijabina-78702.firebaseapp.com",
      projectId: "hijabina-78702",
      storageBucket: "hijabina-78702.appspot.com", // Menggunakan .appspot.com untuk storage
      messagingSenderId: "184147464108",
      appId: "1:184147464108:web:85740584c85de5579df409",
      measurementId: "G-R133YG5RMJ"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase berhasil diinisialisasi!');
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };