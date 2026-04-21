const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DB_FILE = 'bookings.json'; // سنستخدم JSON بدلاً من TXT لسهولة قراءة البيانات

// دالة مساعدة لحفظ البيانات
function saveToDB(data) {
    let currentData = [];
    if (fs.existsSync(DB_FILE)) {
        currentData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    currentData.push(data);
    fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
}

// 1. استقبال الحجز الأولي (لم يدفع بعد)
app.post('/book', (req, res) => {
    const booking = {
        id: Date.now(), // رقم تعريف فريد
        ...req.body,
        status: 'Pending ❌', // الحالة الافتراضية
        dateSent: new Date().toLocaleString()
    };
    saveToDB(booking);
    res.redirect(`/pay.html?id=${booking.id}`); // نرسل الـ ID لصفحة الدفع
});

// 2. إرسال البيانات للوحة التحكم
app.get('/api/view-bookings', (req, res) => {
    if (!fs.existsSync(DB_FILE)) return res.json([]);
    const bookings = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(bookings.reverse());
});

// 3. مسار إتمام الدفع (تحديث الحالة)
app.post('/complete-payment', (req, res) => {
    const bookingId = req.body.bookingId; // سنحصل عليه من الصفحة
    if (fs.existsSync(DB_FILE)) {
        let bookings = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const index = bookings.findIndex(b => b.id == bookingId);
        if (index !== -1) {
            bookings[index].status = 'Paid ✅';
            fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
        }
    }
    res.send('<div style="text-align:center; padding:100px;"><h1>Payment Successful! ✅</h1><a href="/">Home</a></div>');
});

// 4. حذف طلب
app.post('/api/delete-booking', (req, res) => {
    const { id, password } = req.body;
    if (password === '12345') {
        let bookings = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        bookings = bookings.filter(b => b.id != id);
        fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Wrong Password' });
    }
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.listen(PORT, () => console.log(`Server ON: http://localhost:${PORT}`));
