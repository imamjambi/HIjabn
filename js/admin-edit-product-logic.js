// d:/HIJABINA/js/admin-edit-product-logic.js

import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Script admin-edit-product-logic.js BERHASIL dimuat!");

    const editForm = document.getElementById('editProductForm');
    const loadingIndicator = document.getElementById('loading');
    const alertBox = document.getElementById('alert');
    const imagePathInput = document.getElementById('productImagePath');

    // Dapatkan ID produk dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showAlert('ID Produk tidak ditemukan!', 'error');
        return;
    }

    // Fungsi untuk menampilkan notifikasi
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        window.scrollTo(0, 0);
    }

    // Muat data produk yang ada
    async function loadProductData() {
        loadingIndicator.style.display = 'block';
        try {
            const docRef = db.collection('products').doc(productId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const product = docSnap.data();
                // Isi form dengan data yang ada
                document.getElementById('productName').value = product.name || '';
                document.getElementById('productCategory').value = product.category || '';
                document.getElementById('productPrice').value = product.price || 0;
                document.getElementById('productStock').value = product.stock || 0;
                document.getElementById('productDescription').value = product.description || '';
                
                // Isi input path gambar dengan path yang ada
                imagePathInput.value = product.image || '';

            } else {
                showAlert('Produk tidak ditemukan di database.', 'error');
            }
        } catch (error) {
            console.error("Error loading product:", error);
            showAlert('Gagal memuat data produk.', 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // Handle form submission untuk update
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingIndicator.style.display = 'block';

        // Ambil path gambar langsung dari input
        const newImageUrl = document.getElementById('productImagePath').value.trim();

        try {
            const productDataToUpdate = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value, 10),
                description: document.getElementById('productDescription').value,
                image: newImageUrl, // Simpan path lengkap yang baru
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            // Update dokumen di Firestore
            await db.collection('products').doc(productId).update(productDataToUpdate);

            showAlert('✅ Produk berhasil diperbarui!', 'success');

            setTimeout(() => {
                window.location.href = 'admin-dashboard.html#products-section';
            }, 2000);

        } catch (error) {
            console.error("Error updating product: ", error);
            showAlert(`❌ Gagal memperbarui produk: ${error.message}`, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    // Panggil fungsi untuk memuat data saat halaman dibuka
    loadProductData();
});