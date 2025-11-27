// d:\HIJABINA\js\add-product-logic.js

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
        window.scrollTo(0, 0); // Scroll ke atas agar notifikasi terlihat
    }

    // Handle form submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingIndicator.style.display = 'block';
        alertBox.style.display = 'none';

        // Ambil path gambar langsung dari input dengan id="img"
        const imageUrl = document.getElementById('img').value.trim(); // Menggunakan id="img"

        try {
            // 1. Siapkan data produk untuk disimpan ke Firestore
            const productData = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value, 10),
                description: document.getElementById('desc').value, // Menggunakan id="desc"
                image: imageUrl, // Simpan path lengkap ke field 'image'
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            // Validasi data
            if (!productData.name || !productData.category || !productData.price || !productData.stock) {
                throw new Error("Field yang ditandai * wajib diisi.");
            }

            // 2. Simpan data produk ke Firestore
            await db.collection('products').add(productData);

            // 3. Tampilkan pesan sukses dan redirect
            showAlert('✅ Produk berhasil ditambahkan!', 'success');
            productForm.reset();

            setTimeout(() => {
                window.location.href = 'admin-dashboard.html#products-section';
            }, 2000);

        } catch (error) {
            console.error("Error adding product: ", error);
            showAlert(`❌ Gagal menambahkan produk: ${error.message}`, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});