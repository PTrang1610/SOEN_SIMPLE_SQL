require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---------- Cấu hình kết nối SQL Server ----------
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    trustServerCertificate: (process.env.DB_TRUST_SERVER_CERTIFICATE || 'true') === 'true',
    enableArithAbort: true,
  },
};

// Windows Authentication hay SQL Authentication
if (process.env.DB_USE_WINDOWS_AUTH === 'true') {
  config.options.trustedConnection = true;
  config.driver = 'msnodesqlv8'; // yêu cầu cài: npm install msnodesqlv8
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  console.log('✅ Đã kết nối SQL Server:', process.env.DB_SERVER, '/', process.env.DB_DATABASE);
  return pool;
}

// ---------- API: SELECT - Lấy danh sách (chỉ MaSo + HoTen cho danh sách gọn) ----------
app.get('/api/sinhvien', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT MaSo, HoTen, DiaChi FROM SinhVien ORDER BY MaSo');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn dữ liệu', detail: err.message });
  }
});

// ---------- API: SELECT - Lấy chi tiết 1 sinh viên theo MaSo (khi click) ----------
app.get('/api/sinhvien/:maso', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('MaSo', sql.NVarChar, req.params.maso)
      .query('SELECT MaSo, HoTen, DiaChi FROM SinhVien WHERE MaSo = @MaSo');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn dữ liệu', detail: err.message });
  }
});

// ---------- API: INSERT - Thêm sinh viên mới ----------
app.post('/api/sinhvien', async (req, res) => {
  const { MaSo, HoTen, DiaChi } = req.body;
  if (!MaSo || !HoTen || !DiaChi) {
    return res.status(400).json({ error: 'Thiếu thông tin: cần MaSo, HoTen, DiaChi' });
  }
  try {
    const p = await getPool();
    await p.request()
      .input('MaSo', sql.NVarChar, MaSo)
      .input('HoTen', sql.NVarChar, HoTen)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .query('INSERT INTO SinhVien (MaSo, HoTen, DiaChi) VALUES (@MaSo, @HoTen, @DiaChi)');
    res.status(201).json({ message: 'Thêm sinh viên thành công' });
  } catch (err) {
    console.error(err);
    // Lỗi trùng khóa chính (số 2627 / 2601 trong SQL Server)
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: `MaSo '${MaSo}' đã tồn tại` });
    }
    res.status(500).json({ error: 'Lỗi thêm dữ liệu', detail: err.message });
  }
});

// ---------- API: UPDATE - Cập nhật sinh viên theo MaSo ----------
app.put('/api/sinhvien/:maso', async (req, res) => {
  const { HoTen, DiaChi } = req.body;
  if (!HoTen || !DiaChi) {
    return res.status(400).json({ error: 'Thiếu thông tin: cần HoTen, DiaChi' });
  }
  try {
    const p = await getPool();
    const result = await p.request()
      .input('MaSo', sql.NVarChar, req.params.maso)
      .input('HoTen', sql.NVarChar, HoTen)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .query('UPDATE SinhVien SET HoTen = @HoTen, DiaChi = @DiaChi WHERE MaSo = @MaSo');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên để cập nhật' });
    }
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật dữ liệu', detail: err.message });
  }
});

// ---------- API: DELETE - Xóa sinh viên theo MaSo ----------
app.delete('/api/sinhvien/:maso', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('MaSo', sql.NVarChar, req.params.maso)
      .query('DELETE FROM SinhVien WHERE MaSo = @MaSo');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên để xóa' });
    }
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xóa dữ liệu', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
