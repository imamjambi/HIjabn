import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js";

// Fungsi ini dipanggil dari admin-dashboard.html
async function loadMembers() {
    const membersTableBody = document.querySelector('#membersTable tbody');
    if (!membersTableBody) return;

    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        if (querySnapshot.empty) {
            membersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">⭐ Belum ada member</td></tr>`;
            return;
        }

        let membersHTML = '';
        querySnapshot.forEach((doc) => {
            const member = doc.data();
            const joinDate = member.joinDate.toDate().toLocaleDateString('id-ID');
            membersHTML += `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.email}</td>
                    <td>${member.type}</td>
                    <td>${member.points}</td>
                    <td>${joinDate}</td>
                    <td><button class="btn-sm-edit">Edit</button> <button class="btn-sm-delete">Hapus</button></td>
                </tr>
            `;
        });
        membersTableBody.innerHTML = membersHTML;
    } catch (error) {
        console.error("Error loading members: ", error);
        membersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat data member.</td></tr>`;
    }
}

// Logika untuk halaman add-member.html
if (document.getElementById('addMemberForm')) {
    const form = document.getElementById('addMemberForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const memberName = document.getElementById('memberName').value;
        const memberEmail = document.getElementById('memberEmail').value;

        try {
            await addDoc(collection(db, "members"), {
                name: memberName,
                email: memberEmail,
                type: 'Bronze', // Default type
                points: 0, // Default points
                joinDate: new Date() // Tanggal bergabung saat ini
            });
            alert('Member baru berhasil ditambahkan!');
            window.location.href = 'admin-dashboard.html#members-section';
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Gagal menambahkan member. Silakan coba lagi.');
        }
    });
}

// Export fungsi agar bisa diimpor di file lain
window.loadMembers = loadMembers;