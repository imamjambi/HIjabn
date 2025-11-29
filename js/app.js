/*
 * app.js - Logika Utama untuk Panel Admin Hijabina
 * Versi ini menggabungkan navigasi, pemuatan data dari Firebase, dan fungsionalitas lainnya
 * untuk menjadi satu-satunya skrip yang mengontrol dashboard.
 */

// Impor fungsi yang diperlukan dari Firebase SDK
import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Ambil semua elemen penting dari halaman
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.querySelector('.main-content');
    const contentSections = document.querySelectorAll('.content-section');
    const headerTitle = document.getElementById('pageTitle');
    const loaderOverlay = document.getElementById('loader-overlay');

    // Cek status login pengguna
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login-page.html';
        }
    });

    // --- Fungsi untuk mengelola tampilan Loader (Spinner) ---

    /**
     * Menampilkan overlay loading spinner.
     */
    const showLoader = () => {
        if (loaderOverlay) {
            loaderOverlay.style.display = 'flex';
        }
    };

    /**
     * Menyembunyikan overlay loading spinner.
     */
    const hideLoader = () => {
        if (loaderOverlay) {
            loaderOverlay.style.display = 'none';
        }
    };

    // --- Fungsi untuk mengelola tampilan Konten ---

    /**
     * Menampilkan section konten yang dipilih dan menyembunyikan yang lain.
     * @param {string} sectionId - ID dari elemen section yang akan ditampilkan.
     */
    const showSection = async (sectionId) => {
        let sectionFound = false;
        // Sembunyikan semua section terlebih dahulu
        contentSections.forEach(section => {
            section.classList.remove('active');
        });

        // Cari dan tampilkan section yang sesuai
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
            // Perbarui judul di header sesuai dengan judul section
            if (headerTitle) {
                headerTitle.textContent = activeSection.getAttribute('data-title') || 'Dashboard';
            }
            // Muat data yang relevan untuk section tersebut
            await loadSectionData(sectionId);
            sectionFound = true;
        }

        // Jika section tidak ditemukan, tampilkan pesan error
        if (!sectionFound) {
            console.error(`Error: Section dengan id "${sectionId}" tidak ditemukan.`);
            mainContent.querySelector('.header').insertAdjacentHTML('afterend', '<p>Konten yang Anda minta tidak dapat ditemukan.</p>');
        }
    };

    // --- Fungsi untuk memuat data dinamis ---
    const loadSectionData = async (sectionId) => {
        switch (sectionId) {
            case 'dashboard':
                await loadDashboardStats();
                break;
            case 'products':
                await loadProductsData();
                break;
            case 'orders':
                await loadOrdersData();
                break;
            case 'customers':
                await loadCustomersData();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'settings':
                await loadSettings();
                break;
        }
    };

    // --- Logika Navigasi Utama ---

    // Tambahkan event listener untuk setiap item menu di sidebar
    // Juga, tambahkan event listener untuk memuat laporan saat tab diklik
    const reportTab = document.querySelector('.nav-item[data-section="reports"]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah perilaku default link

            const sectionId = item.getAttribute('data-section');
            if (!sectionId) return;

            // Tandai item menu yang sedang aktif
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            showLoader();

            // Jika tab laporan diklik, panggil fungsi loadReports
            if (sectionId === 'reports') {
                setTimeout(() => window.loadReports(), 50);
            }

            // Tampilkan section dan muat datanya.
            // `showSection` sekarang bersifat async dan akan memanggil `loadSectionData`.
            showSection(sectionId).finally(() => {
                // Sembunyikan loader setelah semuanya selesai, baik berhasil maupun gagal.
                setTimeout(hideLoader, 200); // Beri sedikit jeda agar tidak terasa instan
            });
        });
    });

    // --- Logika Tombol Logout ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                auth.signOut().then(() => {
                    window.location.href = 'login-page.html';
                }).catch(error => {
                    console.error('Logout Error:', error);
                });
            }
        });
    }

    // --- Logika Pemuatan Awal Halaman ---
    // Cek hash di URL (#) untuk menentukan section mana yang akan ditampilkan pertama kali.
    // Ini memungkinkan kita membuat link langsung ke tab tertentu, misal: index.html#products
    const initialSectionId = window.location.hash.substring(1) || 'dashboard';

    // Tandai item navigasi yang sesuai sebagai aktif
    const initialNavItem = document.querySelector(`.nav-item[data-section="${initialSectionId}"]`);
    if (initialNavItem) {
        navItems.forEach(nav => nav.classList.remove('active'));
        initialNavItem.classList.add('active');
    }

    // Tampilkan section yang sesuai berdasarkan URL atau default ke 'dashboard'
    showSection(initialSectionId).finally(() => {
        if (initialSectionId === 'reports') {
            window.loadReports();
        }
    });

    // --- Fungsi-fungsi Pemuatan Data dari Firebase ---

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID') : '-';
    const getStatusText = (status) => ({ pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan' }[status] || status);

    async function loadDashboardStats() {
        try {
            const ordersSnapshot = await db.collection('orders').get();
            const productsSnapshot = await db.collection('products').get();
            const usersSnapshot = await db.collection('users').where('role', '==', 'customer').get();

            let totalRevenue = 0;
            ordersSnapshot.forEach(doc => {
                if (doc.data().status === 'completed') {
                    totalRevenue += doc.data().total || 0;
                }
            });

            document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
            document.getElementById('totalOrders').textContent = ordersSnapshot.size;
            document.getElementById('totalProducts').textContent = productsSnapshot.size;
            document.getElementById('totalCustomers').textContent = usersSnapshot.size;

            await loadRecentOrders(ordersSnapshot);

        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        }
    }

    async function loadRecentOrders(ordersSnapshot) {
        const tableBody = document.querySelector('#recentOrdersTable tbody');
        tableBody.innerHTML = '';

        // Ambil 5 pesanan terbaru dari snapshot yang sudah ada (jika ada) atau query baru
        let recentOrders = [];
        if (ordersSnapshot) {
            const sortedDocs = ordersSnapshot.docs.sort((a, b) => b.data().createdAt.seconds - a.data().createdAt.seconds);
            recentOrders = sortedDocs.slice(0, 5);
        } else {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();
            recentOrders = snapshot.docs;
        }

        if (recentOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 Belum ada pesanan</td></tr>';
            return;
        }

        recentOrders.forEach(doc => {
            const order = doc.data();
            const row = `
                <tr>
                    <td>#${doc.id.substring(0, 8)}</td>
                    <td>${order.customerName || 'N/A'}</td>
                    <td>${formatCurrency(order.total)}</td>
                    <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                    <td>${formatDate(order.createdAt)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    async function loadProductsData() {
        try {
            const productsSnapshot = await db.collection('products').get();
            const tableBody = document.querySelector('#productsTable tbody');
            tableBody.innerHTML = '';

            if (productsSnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">📦 Belum ada produk</td></tr>';
                return;
            }

            productsSnapshot.forEach(doc => {
                const product = doc.data();
                const row = `
                    <tr>
                        <td>
                            <img src="${product.imageUrl || 'https://via.placeholder.com/60'}" 
                                 alt="${product.name}" 
                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" 
                                 onerror="this.onerror=null;this.src='https://via.placeholder.com/60';">
                        </td>
                        <td>${product.name}</td>
                        <td>${product.category || 'N/A'}</td>
                        <td>${formatCurrency(product.price)}</td>
                        <td>${product.stock || 0}</td>
                        <td>
                            <button class="action-btn btn-edit" title="Edit Produk" onclick="window.location.href='admin-edit-product.html?id=${doc.id}'">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
                            </button>
                            <button class="action-btn btn-delete" title="Hapus Produk" onclick="window.deleteProduct('${doc.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error loading products:", error);
        }
    }

    async function loadOrdersData() {
        try {
            const ordersSnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            const tableBody = document.querySelector('#ordersTable tbody');
            tableBody.innerHTML = '';

            if (ordersSnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">📦 Belum ada pesanan</td></tr>';
                return;
            }

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                const row = `
                    <tr>
                        <td>#${doc.id.substring(0, 8)}...</td>
                        <td>${order.customerName || 'N/A'}</td>
                        <td>${formatCurrency(order.total)}</td>
                        <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                        <td>${formatDate(order.createdAt)}</td>
                        <td>
                            <button class="action-btn btn-view" title="Lihat Detail" onclick="window.location.href='manage-orders.html?id=${doc.id}'">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.878 1.48-2.242 2.657-4.03 3.438C8.807 12.332 7.115 12.5 5.5 12.5c-1.615 0-3.307-.168-4.832-.814A13.133 13.133 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>
                            </button>
                            <button class="action-btn btn-complete" title="Selesaikan Pesanan" onclick="window.markOrderAsCompleted('${doc.id}', this)" ${order.status === 'completed' ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error loading orders:", error);
        }
    }

    async function loadCustomersData() {
        try {
            const customersSnapshot = await db.collection('users').where('role', '==', 'customer').get();
            const tableBody = document.querySelector('#customersTable tbody');
            tableBody.innerHTML = '';

            if (customersSnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">👥 Belum ada pelanggan</td></tr>';
                return;
            }

            // Ambil semua pesanan untuk menghitung total pesanan per pelanggan
            const ordersSnapshot = await db.collection('orders').get();
            const orderCountByUserId = {};
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.userId) {
                    orderCountByUserId[order.userId] = (orderCountByUserId[order.userId] || 0) + 1;
                }
            });

            customersSnapshot.forEach(doc => {
                const customer = doc.data();
                const orderCount = orderCountByUserId[doc.id] || 0;
                const row = `
                    <tr>
                        <td>${customer.name || 'N/A'}</td>
                        <td>${customer.email || 'N/A'}</td>
                        <td>${customer.phone || 'N/A'}</td>
                        <td>${orderCount} pesanan</td>
                        <td>${formatDate(customer.createdAt)}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error loading customers:", error);
        }
    }

    async function loadSettings() {
        try {
            const doc = await db.collection('settings').doc('store').get();
            if (doc.exists) {
                const settings = doc.data();
                document.getElementById('storeName').value = settings.name || '';
                document.getElementById('storeEmail').value = settings.email || '';
                document.getElementById('storePhone').value = settings.phone || '';
                document.getElementById('storeAddress').value = settings.address || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const storeName = document.getElementById('storeName').value;
            const storeEmail = document.getElementById('storeEmail').value;
            const storePhone = document.getElementById('storePhone').value;
            const storeAddress = document.getElementById('storeAddress').value;

            try {
                await db.collection('settings').doc('store').set({
                    name: storeName,
                    email: storeEmail,
                    phone: storePhone,
                    address: storeAddress,
                }, { merge: true });
                alert('Pengaturan berhasil disimpan!');
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('Gagal menyimpan pengaturan.');
            }
        });
    }

    // --- FUNGSI UNTUK LAPORAN ---
    window.loadReports = async function() {
        const period = document.getElementById('reportPeriod').value;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                const firstDayOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.setDate(firstDayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const salesDetailBody = document.getElementById('salesDetailTableBody');
        salesDetailBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">⏳ Memuat data laporan...</td></tr>`;

        try {
            const ordersSnapshot = await db.collection('orders')
                .where('createdAt', '>=', startDate)
                .orderBy('createdAt', 'desc')
                .get();

            salesDetailBody.innerHTML = '';

            if (ordersSnapshot.empty) {
                salesDetailBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">Tidak ada data penjualan untuk periode ini.</td></tr>`;
            } else {
                ordersSnapshot.forEach(doc => {
                    const order = doc.data();
                    let totalAmount = order.total || 0;
                    if (!totalAmount && order.items) {
                        totalAmount = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                    }
                    const itemCount = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                    const row = `
                        <tr>
                            <td>${formatDate(order.createdAt)}</td>
                            <td>#${doc.id.substring(0, 8)}...</td>
                            <td>${order.customerName || 'N/A'}</td>
                            <td class="text-center">${itemCount}</td>
                            <td class="text-right">${formatCurrency(totalAmount)}</td>
                            <td class="text-center"><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                        </tr>
                    `;
                    salesDetailBody.innerHTML += row;
                });
            }
        } catch (error) {
            console.error("Error loading reports: ", error);
            salesDetailBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px; color: red;">Gagal memuat data laporan.</td></tr>`;
        }
    }

    window.printReport = function() {
        window.loadReports().then(() => {
            setTimeout(() => {
                window.print();
            }, 250);
        });
    }

    // Jadikan fungsi deleteProduct global agar bisa diakses dari HTML
    window.deleteProduct = async (productId) => {
        if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            try {
                await db.collection('products').doc(productId).delete();
                alert('Produk berhasil dihapus.');
                loadProductsData(); // Muat ulang data produk
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Gagal menghapus produk.');
            }
        }
    };

    // --- Logika untuk Modal Detail Pesanan (jika masih ingin digunakan di halaman ini) ---
    window.viewOrderDetails = async (orderId) => {
        const modal = document.getElementById('orderDetailModal');
        modal.style.display = 'flex';
        // ... (logika untuk mengisi modal bisa ditambahkan di sini jika perlu) ...
    };

    // Tutup modal saat area luar diklik
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Jadikan fungsi markOrderAsCompleted global
window.markOrderAsCompleted = async function(orderId, button) {
    if (!confirm(`Apakah Anda yakin ingin menandai pesanan #${orderId.substring(0,8)}... sebagai 'Selesai'?`)) {
        return;
    }

    if (button) {
        button.disabled = true; // Nonaktifkan tombol untuk mencegah klik ganda
    }

    try {
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Status pesanan berhasil diubah menjadi Selesai.');
        loadOrdersData(); // Muat ulang data pesanan untuk refresh tabel
    } catch (error) {
        console.error("Error updating order status: ", error);
        alert('Gagal memperbarui status pesanan.');
        if (button) button.disabled = false; // Aktifkan kembali jika gagal
    }
}
});