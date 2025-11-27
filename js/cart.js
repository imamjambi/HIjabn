// Impor auth dan db dari firebase-config
import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Fungsi untuk merender UI keranjang dari data yang diberikan
    function renderCartUI(items, userId) {
        if (!items || items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>🛒 Keranjang Anda masih kosong.</p>
                </div>`;
            cartSummary.style.display = 'none';
            return;
        }

        cartItemsContainer.innerHTML = ''; // Selalu bersihkan tampilan sebelum render ulang
        let totalPrice = 0;

        items.forEach(item => {
            const itemTotalPrice = (item.price || 0) * (item.quantity || 0);
            totalPrice += itemTotalPrice;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name || 'Produk'}">
                <div class="cart-item-details">
                    <h4>${item.name || 'Nama Produk Tidak Tersedia'}</h4>
                    <p>Harga: Rp ${(item.price || 0).toLocaleString('id-ID')}</p>
                    <p>Jumlah: ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <p><strong>Rp ${itemTotalPrice.toLocaleString('id-ID')}</strong></p>
                    <a href="#" class="remove-item-btn" data-id="${item.id}">Hapus</a>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        cartTotalPriceElement.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
        cartSummary.style.display = 'block';
        addRemoveButtonListeners(userId);
    }

    // Fungsi untuk menghapus item dari keranjang di Firestore
    function addRemoveButtonListeners(userId) {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = e.target.dataset.id;
                if (confirm('Anda yakin ingin menghapus item ini dari keranjang?')) {
                    try {
                        await db.collection('users').doc(userId).collection('cart').doc(productId).delete();
                        // Tampilan akan otomatis terupdate karena onSnapshot
                        alert('Item telah dihapus dari keranjang.');
                    } catch (error) {
                        console.error("Gagal menghapus item:", error);
                        alert('Gagal menghapus item. Silakan coba lagi.');
                    }
                }
            });
        });
    }

    // Cek status login pengguna
    auth.onAuthStateChanged(user => {
        if (user) {
            // Pengguna login, pantau keranjangnya dari Firestore
            const cartRef = db.collection('users').doc(user.uid).collection('cart');
            cartRef.onSnapshot(snapshot => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderCartUI(items, user.uid);
            }, error => {
                console.error("Gagal memantau keranjang: ", error);
                cartItemsContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data keranjang.</p>';
            });
        } else {
            // Pengguna tidak login, tampilkan pesan untuk login
            cartItemsContainer.innerHTML = `
                <div class="empty-cart" style="padding: 50px; text-align: center;">
                    <h2>Anda Belum Login</h2>
                    <p>Silakan masuk untuk melihat keranjang belanja Anda.</p>
                    <a href="login-page.html" class="btn-checkout" style="text-decoration: none; display: inline-block; margin-top: 20px;">Masuk Sekarang</a>
                </div>`;
            cartSummary.style.display = 'none';
        }
    });

});