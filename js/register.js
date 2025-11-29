// register.js
// Logic untuk registrasi user baru

// Function untuk register customer/admin
async function registerNewUser(email, password, userData) {
    try {
        // Create Firebase Auth account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save user data to Firestore
        await db.collection('users').doc(user.uid).set({
            ...userData,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            createdAt: db.app.firebase_.firestore.FieldValue.serverTimestamp(),
            updatedAt: db.app.firebase_.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('User registered successfully:', user.uid);
        return { success: true, userId: user.uid };
        
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Function untuk membuat admin pertama kali (hanya bisa dilakukan sekali)
async function createFirstAdmin() {
    try {
        // Cek apakah sudah ada admin
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        if (!adminsSnapshot.empty) {
            console.log('Admin already exists!');
            return { success: false, message: 'Admin sudah ada!' };
        }
        
        // Data admin default
        const adminEmail = 'admin@tokohijabina.com';
        const adminPassword = 'admin123'; // GANTI PASSWORD INI!
        
        const adminData = {
            name: 'Admin Toko Hijabina',
            role: 'admin',
            phone: '081234567890'
        };
        
        const result = await registerNewUser(adminEmail, adminPassword, adminData);
        
        console.log('First admin created successfully!');
        alert('Admin pertama berhasil dibuat! Email: ' + adminEmail);
        
        return result;
        
    } catch (error) {
        console.error('Error creating first admin:', error);
        throw error;
    }
}

// Function untuk validasi password
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
        errors.push('Password minimal 6 karakter');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Function untuk validasi email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function untuk validasi nomor telepon Indonesia
function validatePhoneNumber(phone) {
    // Format: 08xx-xxxx-xxxx atau +628xx-xxxx-xxxx
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

// Function untuk cek apakah email sudah terdaftar
async function isEmailRegistered(email) {
    try {
        const methods = await auth.fetchSignInMethodsForEmail(email);
        return methods.length > 0;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

// Function untuk format error message dari Firebase
function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Email sudah terdaftar!',
        'auth/invalid-email': 'Format email tidak valid!',
        'auth/operation-not-allowed': 'Operasi tidak diizinkan!',
        'auth/weak-password': 'Password terlalu lemah! Minimal 6 karakter.',
        'auth/user-disabled': 'Akun ini telah dinonaktifkan!',
        'auth/user-not-found': 'Email tidak terdaftar!',
        'auth/wrong-password': 'Password salah!',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
        'auth/network-request-failed': 'Gagal terhubung ke server. Cek koneksi internet Anda.'
    };
    
    return errorMessages[errorCode] || 'Terjadi kesalahan. Silakan coba lagi.';
}

// Export functions untuk digunakan di halaman lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerNewUser,
        createFirstAdmin,
        validatePassword,
        validateEmail,
        validatePhoneNumber,
        isEmailRegistered,
        getFirebaseErrorMessage
    };
}