// Impor instance Firebase dari file konfigurasi
import { db, auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const loadingIndicator = document.getElementById('loading');
    const alertBox = document.getElementById('alert');

    // Cek otentikasi admin
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert('Anda harus login sebagai admin untuk mengakses halaman ini.');
            window.location.href = 'login-page.html';
            return;
        }
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            alert('Akses ditolak. Hanya admin yang dapat mengelola produk.');
            window.location.href = 'index.html';
        }
    });

    // Fungsi untuk menampilkan notifikasi
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        window.scrollTo(0, 0);
    }

    // Handle form submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('=== FORM SUBMIT STARTED ===');
        
        loadingIndicator.style.display = 'block';
        alertBox.style.display = 'none';

        // Ambil path gambar dari input
        const imageUrl = document.getElementById('productImage').value.trim();
        console.log('1. Image URL:', imageUrl);

        try {
            // 1. Siapkan data produk untuk disimpan ke Firestore
            const productData = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: Number(document.getElementById('productPrice').value),
                stock: Number(document.getElementById('productStock').value),
                description: document.getElementById('desc').value,
                imageUrl: imageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            console.log('2. Product Data:', productData);

            // Validasi data
            if (!productData.name || !productData.category || !productData.price || !productData.stock) {
                throw new Error("Semua field yang ditandai * wajib diisi.");
            }

            console.log('3. Validation passed');

            // 2. Simpan data produk ke Firestore
            console.log('4. Attempting to save to Firestore...');
            const docRef = await db.collection('products').add(productData);
            console.log('5. Successfully saved! Doc ID:', docRef.id);

            // 3. Tampilkan pesan sukses dan redirect
            showAlert('✅ Produk berhasil ditambahkan!', 'success');
            productForm.reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error('❌ ERROR:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            showAlert(`❌ Gagal menambahkan produk: ${error.message}`, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});