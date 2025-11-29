// Impor instance database (db) dari file konfigurasi pusat.
// Ini adalah cara yang benar agar tidak perlu inisialisasi berulang kali.
import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addProductForm');
    const loader = document.getElementById('loader-overlay');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'flex';

        const productName = document.getElementById('productName').value;
        const productCategory = document.getElementById('productCategory').value;
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productStock = parseInt(document.getElementById('productStock').value);
        const productImage = document.getElementById('productImage').value;
        const productDescription = document.getElementById('productDescription').value; // Ambil nilai deskripsi

        try {
            await db.collection('products').add({
                name: productName,
                category: productCategory,
                price: productPrice,
                stock: productStock,
                imageUrl: productImage, // Standarisasi nama field menjadi 'imageUrl'
                description: productDescription, // Standarisasi nama field menjadi 'description'
                createdAt: db.app.firebase_.firestore.FieldValue.serverTimestamp()
            });

            alert('Produk berhasil ditambahkan!');
            window.location.href = 'index.html#products'; // Kembali ke halaman utama dan buka tab produk

        } catch (error) {
            console.error("Error adding product: ", error);
            alert('Gagal menambahkan produk. Silakan coba lagi.');
        } finally {
            loader.style.display = 'none';
        }
    });
});