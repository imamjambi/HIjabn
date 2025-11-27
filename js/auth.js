// =========================================================
// LOGIKA LOGIN ADMIN FIREBASE (REAL V8 MODE)
// Asumsi: window.auth dan window.db sudah didefinisikan di HTML
// =========================================================

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!window.auth || !window.db) {
        alert("KONEKSI FIREBASE GAGAL: Konfigurasi belum dimuat. Coba refresh.");
        return;
    }

    try {
        // 1. OTOENTIKASI: Mencoba Login ke Firebase Auth
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. AMBIL DATA PROFILE & ROLE DARI FIRESTORE
        const docRef = window.db.collection("users").doc(user.uid);
        const doc = await docRef.get();

        if (doc.exists) {
            const userData = doc.data();
            const role = userData.role;

            // 3. VERIFIKASI ROLE (Hanya Admin yang diizinkan)
            if (role === 'admin' || role === 'petugas') {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                localStorage.setItem('userName', userData.fullName || 'Admin');
                
                alert(`Login Berhasil! Selamat datang, ${userData.fullName || 'Admin'}.`);
                window.location.href = 'admin-dashboard.html'; 
            } else {
                // User terautentikasi, tapi rolenya bukan Admin
                await window.auth.signOut(); // Wajib di-logout
                alert("Akses Ditolak: Akun ini tidak memiliki hak akses Admin.");
            }
        } else {
            // User ada di Auth, tapi data profil tidak ada di Firestore
            await window.auth.signOut(); // Wajib di-logout
            alert("Login Gagal: Data profile Admin/Staf tidak ditemukan di database. Hubungi Administrator.");
        }

    } catch (error) {
        console.error("Firebase Login Error:", error);
        let errorMessage = "Login Gagal: Terjadi kesalahan yang tidak diketahui.";

        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Email atau password salah.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Format email tidak valid.";
        }

        alert(errorMessage);
    }
});

// Fungsi Logout (tetap sama)
window.logoutUser = function() {
    if (window.auth) {
        window.auth.signOut();
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html'; 
}