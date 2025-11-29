import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotalElem = document.getElementById('cartTotal');
    const loadingSpinner = document.createElement('div');
    const checkoutBtn = document.getElementById('checkoutBtn');
    loadingSpinner.className = 'spinner';
    loadingSpinner.style.margin = '50px auto';

    function showLoading() {
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(loadingSpinner);
        cartSummary.style.display = 'none';
    }

    function listenToCartChanges(userId) {
        const cartRef = db.collection('users').doc(userId).collection('cart');

        cartRef.onSnapshot(snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCartUI(items, userId);
        }, error => {
            console.error("Gagal memantau keranjang: ", error);
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data keranjang secara real-time.</p>';
        });
    }

    function renderCartUI(items, userId) {
        cartItemsContainer.innerHTML = '';

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

            // PERBAIKAN: Gunakan imageUrl, bukan image
            // Cek beberapa kemungkinan nama field
            const imageSource = item.imageUrl || item.image || 'assets/images/placeholder.png';

            itemElement.innerHTML = `
                <img src="${imageSource}" 
                     alt="${item.name}" 
                     class="cart-item-img"
                     onerror="this.src='assets/images/placeholder.png'">
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
                        await db.collection('users').doc(userId).collection('cart').doc(productId).delete();
                        console.log(`Item ${productId} dihapus dari keranjang.`);
                    } catch (error) {
                        console.error("Gagal menghapus item:", error);
                        alert('Gagal menghapus item. Silakan coba lagi.');
                    }
                }
            });
        });
    }

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
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const customerName = userData.name || 'Pengguna';

            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const orderData = {
                userId: userId,
                customerName: customerName,
                items: items,
                totalAmount: totalAmount,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: db.app.firebase_.firestore.FieldValue.serverTimestamp(),
                updatedAt: db.app.firebase_.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('orders').add(orderData);

            const cartRef = db.collection('users').doc(userId).collection('cart');
            const cartSnapshot = await cartRef.get();
            const batch = db.batch();
            cartSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            alert('Pesanan Anda berhasil dibuat! Admin akan segera memprosesnya.');
            window.location.href = 'user-home.html';

        } catch (error) {
            console.error("Error during checkout: ", error);
            alert('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.');
        } finally {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Buat Pesanan Sekarang';
        }
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log(`User logged in: ${user.uid}. Fetching cart...`);
            showLoading();
            listenToCartChanges(user.uid);

            checkoutBtn.addEventListener('click', async () => {
                const cartSnapshot = await db.collection('users').doc(user.uid).collection('cart').get();
                const items = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                handleCheckout(user.uid, items);
            });
        } else {
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