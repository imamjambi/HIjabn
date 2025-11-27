// user-auth.js - Authentication and user management

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Check if user is authenticated
export function checkAuth(redirectTo = 'user-login.html') {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                window.location.href = redirectTo;
                reject('User not authenticated');
            }
        });
    });
}

// Register new user
export async function registerUser(email, password, userData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, {
            displayName: userData.name
        });

        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: userData.name,
            email: email,
            phone: userData.phone || '',
            createdAt: new Date().toISOString(),
            role: 'user',
            address: userData.address || []
        });

        return {
            success: true,
            user: user,
            message: 'Pendaftaran berhasil!'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error.code,
            message: getErrorMessage(error.code)
        };
    }
}

// Login user
export async function loginUser(email, password, rememberMe = false) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save to localStorage if remember me
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('userEmail', email);
        }

        // Save user info
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userName', user.displayName || '');

        return {
            success: true,
            user: user,
            message: 'Login berhasil!'
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.code,
            message: getErrorMessage(error.code)
        };
    }
}

// Logout user
export async function logoutUser() {
    try {
        await signOut(auth);
        
        // Clear localStorage except rememberMe
        const rememberMe = localStorage.getItem('rememberMe');
        const savedEmail = localStorage.getItem('userEmail');
        
        localStorage.clear();
        
        if (rememberMe === 'true') {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('userEmail', savedEmail);
        }

        return {
            success: true,
            message: 'Logout berhasil'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            message: 'Logout gagal'
        };
    }
}

// Get current user data
export async function getCurrentUserData() {
    const user = auth.currentUser;
    
    if (!user) {
        return null;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                ...userDoc.data()
            };
        }
        
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Update user profile
export async function updateUserProfile(userData) {
    const user = auth.currentUser;
    
    if (!user) {
        return {
            success: false,
            message: 'User tidak ditemukan'
        };
    }

    try {
        // Update auth profile
        if (userData.displayName) {
            await updateProfile(user, {
                displayName: userData.displayName
            });
        }

        // Update Firestore
        const updateData = {};
        if (userData.name) updateData.name = userData.name;
        if (userData.phone) updateData.phone = userData.phone;
        if (userData.address) updateData.address = userData.address;
        
        updateData.updatedAt = new Date().toISOString();

        await updateDoc(doc(db, 'users', user.uid), updateData);

        return {
            success: true,
            message: 'Profil berhasil diperbarui'
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        return {
            success: false,
            message: 'Gagal memperbarui profil'
        };
    }
}

// Reset password
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Email reset password telah dikirim'
        };
    } catch (error) {
        console.error('Reset password error:', error);
        return {
            success: false,
            message: getErrorMessage(error.code)
        };
    }
}

// Get user orders
export async function getUserOrders(userId) {
    try {
        // Implementasi mengambil orders dari Firestore
        // Contoh struktur: orders collection dengan userId field
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return orders;
    } catch (error) {
        console.error('Error getting orders:', error);
        return [];
    }
}

// Error message helper
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Email sudah terdaftar',
        'auth/invalid-email': 'Email tidak valid',
        'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
        'auth/user-not-found': 'Akun tidak ditemukan',
        'auth/wrong-password': 'Password salah',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti',
        'auth/network-request-failed': 'Koneksi internet bermasalah',
        'auth/requires-recent-login': 'Silakan login ulang untuk melakukan tindakan ini'
    };

    return errorMessages[errorCode] || 'Terjadi kesalahan. Silakan coba lagi';
}

// Initialize auth state listener
export function initAuthListener(callbacks = {}) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (callbacks.onLogin) {
                callbacks.onLogin(user);
            }
        } else {
            if (callbacks.onLogout) {
                callbacks.onLogout();
            }
        }
    });
}

// Check if email exists
export async function checkEmailExists(email) {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

// Validate password strength
export function validatePassword(password) {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z\d]/.test(password);

    let strength = 0;
    if (minLength) strength++;
    if (hasUpperCase && hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;

    return {
        isValid: minLength,
        strength: strength,
        label: ['Lemah', 'Cukup', 'Baik', 'Kuat', 'Sangat Kuat'][Math.min(strength, 4)],
        requirements: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecial
        }
    };
}

// Export auth instance for direct use
export { auth };