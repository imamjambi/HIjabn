import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotalElem = document.getElementById('cartTotal');
    const loadingSpinner = document.createElement('div');
    const checkoutBtn = document.getElementById('checkoutBtn');
    loadingSpinner.className = 'spinner'; // Menggunakan style spinner dari style.css
    loadingSpinner.style.margin = '50px auto';

    function showLoading() {
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(loadingSpinner);
        cartSummary.style.display = 'none';
    }

    // Fungsi untuk memantau dan merender keranjang secara real-time
    function listenToCartChanges(userId) {
        const cartRef = db.collection('users').doc(userId).collection('cart');

        // onSnapshot akan berjalan setiap kali ada perubahan di keranjang
        cartRef.onSnapshot(snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCartUI(items, userId);
        }, error => {
            console.error("Gagal memantau keranjang: ", error);
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data keranjang secara real-time.</p>';
        });
    }

    function renderCartUI(items, userId) {
        cartItemsContainer.innerHTML = ''; // Selalu bersihkan tampilan sebelum render ulang

        if (!items || items.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartItemsContainer.innerHTML = emptyCartMessage.outerHTML;
            cartSummary.style.display = 'none';
            return;
        }

        emptyCartMessage.style.display = 'none';
        cartSummary.style.display = 'block';
        let total = 0;

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';

            const itemTotal = (item.price || 0) * (item.quantity || 0);
            total += itemTotal;

            itemElement.innerHTML = `
                <img src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h3>${item.name || 'Nama Produk Tidak Tersedia'}</h3>
                    <p>Jumlah: ${item.quantity}</p>
                    <p class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</p>
                </div>
                <div class="cart-item-total">
                    <h4 style="margin-bottom: 10px;">Subtotal: Rp ${itemTotal.toLocaleString('id-ID')}</h4>
                    <button class="action-btn btn-delete" data-id="${item.id}">Hapus</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        cartTotalElem.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        addRemoveButtonListeners(userId);
    }

    function addRemoveButtonListeners(userId) {
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                if (confirm('Anda yakin ingin menghapus item ini dari keranjang?')) {
                    try {
                        // Hapus dokumen produk dari sub-koleksi cart
                        await db.collection('users').doc(userId).collection('cart').doc(productId).delete();
                        console.log(`Item ${productId} dihapus dari keranjang.`);
                        // Tampilan akan otomatis terupdate karena onSnapshot
                    } catch (error) {
                        console.error("Gagal menghapus item:", error);
                        alert('Gagal menghapus item. Silakan coba lagi.');
                    }
                }
            });
        });
    }

    // Fungsi untuk proses checkout
    async function handleCheckout(userId, items) {
        if (!items || items.length === 0) {
            alert('Keranjang Anda kosong. Tidak ada yang bisa di-checkout.');
            return;
        }

        if (!confirm('Apakah Anda yakin ingin membuat pesanan dengan item di keranjang ini?')) {
            return;
        }

        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Memproses...';

        try {
            // 1. Ambil data pengguna untuk nama
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const customerName = userData.name || 'Pengguna';

            // 2. Hitung total harga
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // 3. Buat dokumen pesanan baru di koleksi 'orders'
            const orderData = {
                userId: userId,
                customerName: customerName,
                items: items, // Menyimpan semua item keranjang ke dalam pesanan
                totalAmount: totalAmount,
                status: 'pending', // Status awal: Menunggu Pembayaran/Konfirmasi
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('orders').add(orderData);

            // 4. Kosongkan keranjang pengguna setelah pesanan berhasil dibuat
            const cartRef = db.collection('users').doc(userId).collection('cart');
            const cartSnapshot = await cartRef.get();
            const batch = db.batch();
            cartSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // 5. Beri notifikasi dan arahkan ke halaman sukses (atau halaman utama)
            alert('Pesanan Anda berhasil dibuat! Admin akan segera memprosesnya.');
            window.location.href = 'user-home.html'; // Arahkan ke halaman utama setelah checkout

        } catch (error) {
            console.error("Error during checkout: ", error);
            alert('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.');
        } finally {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Buat Pesanan Sekarang';
        }
    }

    // Cek status login pengguna
    auth.onAuthStateChanged(user => {
        if (user) {
            // Pengguna login, tampilkan keranjangnya
            console.log(`User logged in: ${user.uid}. Fetching cart...`);
            showLoading();
            listenToCartChanges(user.uid); // Gunakan fungsi baru yang real-time

            // Tambahkan event listener untuk tombol checkout
            checkoutBtn.addEventListener('click', async () => {
                // Ambil data keranjang terbaru sebelum checkout
                const cartSnapshot = await db.collection('users').doc(user.uid).collection('cart').get();
                const items = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                handleCheckout(user.uid, items);
            });
        } else {
            // Pengguna tidak login, tampilkan pesan untuk login
            console.log('No user logged in.');
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h2>Anda Belum Login</h2>
                    <p>Silakan masuk untuk melihat keranjang belanja Anda.</p>
                    <a href="login-page.html" class="checkout-btn" style="margin-top: 20px;">Masuk Sekarang</a>
                </div>
            `;
            cartSummary.style.display = 'none';
        }
    });
});