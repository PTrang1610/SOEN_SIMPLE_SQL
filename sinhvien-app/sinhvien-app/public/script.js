let students = [];
let editingMaSo = null;

const el = id => document.getElementById(id);

const tbody = el('tbody');
const emptyRow = el('emptyRow');
const connBadge = el('connBadge');
const statusMsg = el('statusMsg');


// HIỂN THỊ THÔNG BÁO
function showStatus(msg, isErr = false) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
    statusMsg.classList.toggle('err', isErr);
}


// CHỐNG CHÈN HTML
function escapeHtml(s) {
    const d = document.createElement('div');
    d.innerText = s == null ? '' : s;
    return d.innerHTML;
}


// SELECT
async function selectData() {

    try {

        const { data, error } = await db
            .from('sinhvien')
            .select('*')
            .order('maso');

        if (error) {
            throw error;
        }

        students = data;

        connBadge.textContent =
            '● Đã kết nối Supabase';

        connBadge.classList.remove('offline');

        renderTable();

        showStatus(
            `✓ Đã tải ${students.length} sinh viên`
        );

    } catch (err) {

        connBadge.textContent =
            '● Mất kết nối Supabase';

        connBadge.classList.add('offline');

        showStatus(
            '✗ Không tải được dữ liệu: ' + err.message,
            true
        );

        console.error(err);
    }
}


// HIỂN THỊ BẢNG
function renderTable() {

    tbody.innerHTML = '';

    emptyRow.classList.toggle(
        'show',
        students.length === 0
    );

    students.forEach((s, i) => {

        const tr = document.createElement('tr');

        tr.dataset.maso = s.maso;

        if (s.maso === editingMaSo) {
            tr.classList.add('editing');
        }

        tr.innerHTML = `
            <td>${i + 1}</td>

            <td>${escapeHtml(s.hoten)}</td>

            <td>${escapeHtml(s.maso)}</td>

            <td>${escapeHtml(s.diachi)}</td>

            <td>

                <button
                    class="icon-btn icon-edit"
                    title="Sửa"
                    data-maso="${escapeHtml(s.maso)}">
                    ✎
                </button>

                <button
                    class="icon-btn icon-delete"
                    title="Xóa"
                    data-maso="${escapeHtml(s.maso)}">
                    🗑
                </button>

            </td>
        `;

        tbody.appendChild(tr);
    });
}


// CLICK NÚT SỬA / XÓA TRÊN BẢNG
tbody.addEventListener('click', e => {

    const editBtn =
        e.target.closest('.icon-edit');

    const delBtn =
        e.target.closest('.icon-delete');


    if (editBtn) {

        loadIntoForm(
            editBtn.dataset.maso
        );

    } else if (delBtn) {

        deleteStudent(
            delBtn.dataset.maso
        );
    }
});


// ĐƯA SINH VIÊN VÀO FORM
function loadIntoForm(maso) {

    const s = students.find(
        x => x.maso === maso
    );

    if (!s) return;

    editingMaSo = maso;

    el('fMaSo').value = s.maso;
    el('fHoTen').value = s.hoten;
    el('fDiaChi').value = s.diachi || '';

    renderTable();

    el('studentForm').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}


// XÓA FORM
function clearForm() {

    editingMaSo = null;

    el('fMaSo').value = '';
    el('fHoTen').value = '';
    el('fDiaChi').value = '';

    renderTable();
}


// INSERT
el('btnInsert').addEventListener(
    'click',
    async () => {

        const maso =
            el('fMaSo').value.trim();

        const hoten =
            el('fHoTen').value.trim();

        const diachi =
            el('fDiaChi').value.trim();


        if (!maso || !hoten || !diachi) {

            showStatus(
                '✗ Vui lòng nhập đầy đủ thông tin',
                true
            );

            return;
        }


        try {

            const { error } = await db
                .from('sinhvien')
                .insert([
                    {
                        maso: maso,
                        hoten: hoten,
                        diachi: diachi
                    }
                ]);


            if (error) {
                throw error;
            }


            showStatus(
                `✓ Đã thêm sinh viên ${maso}`
            );

            clearForm();

            await selectData();


        } catch (err) {

            showStatus(
                '✗ Lỗi INSERT: ' + err.message,
                true
            );
        }
    }
);


// UPDATE
el('btnUpdate').addEventListener(
    'click',
    async () => {

        const maso =
            el('fMaSo').value.trim();

        const hoten =
            el('fHoTen').value.trim();

        const diachi =
            el('fDiaChi').value.trim();


        if (!maso || !hoten || !diachi) {

            showStatus(
                '✗ Vui lòng nhập đầy đủ thông tin',
                true
            );

            return;
        }


        const ok = confirm(
            `Xác nhận cập nhật sinh viên ${maso}?`
        );


        if (!ok) return;


        try {

            const { error } = await db
                .from('sinhvien')
                .update({
                    hoten: hoten,
                    diachi: diachi
                })
                .eq('maso', maso);


            if (error) {
                throw error;
            }


            showStatus(
                `✓ Đã cập nhật sinh viên ${maso}`
            );

            clearForm();

            await selectData();


        } catch (err) {

            showStatus(
                '✗ Lỗi UPDATE: ' + err.message,
                true
            );
        }
    }
);


// DELETE
async function deleteStudent(maso) {

    const s = students.find(
        x => x.maso === maso
    );

    const label = s
        ? `${s.maso} — ${s.hoten}`
        : maso;


    const ok = confirm(
        `Bạn có chắc muốn xóa ${label}?`
    );


    if (!ok) return;


    try {

        const { error } = await db
            .from('sinhvien')
            .delete()
            .eq('maso', maso);


        if (error) {
            throw error;
        }


        showStatus(
            `✓ Đã xóa sinh viên ${maso}`
        );


        if (editingMaSo === maso) {
            clearForm();
        }


        await selectData();


    } catch (err) {

        showStatus(
            '✗ Lỗi DELETE: ' + err.message,
            true
        );
    }
}


// NÚT DELETE TRONG FORM
el('btnDelete').addEventListener(
    'click',
    () => {

        const maso =
            el('fMaSo').value.trim();


        if (!maso) {

            showStatus(
                '✗ Nhập hoặc chọn mã sinh viên cần xóa',
                true
            );

            return;
        }


        deleteStudent(maso);
    }
);


// NÚT SELECT
el('btnSelect').addEventListener(
    'click',
    selectData
);

// KHỞI ĐỘNG
selectData();
