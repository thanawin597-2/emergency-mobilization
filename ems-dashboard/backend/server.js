// ---------- 1. MODULE IMPORTS ----------
// นำเข้าโมดูลและไลบรารีต่างๆ ที่จำเป็นต้องใช้งานในระบบ
const express = require("express");
const mqtt = require("mqtt");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");

// ---------- 2. APP & MIDDLEWARE INITIALIZATION ----------
// เริ่มต้นการใช้งาน Express App และตั้งค่า Middleware (CORS และ JSON Parser)
const app = express();

app.use(cors());
app.use(express.json());

// สร้าง HTTP Server โดยผูกเข้ากับ Express App
const server = http.createServer(app);

// เริ่มต้นใช้งาน Socket.io Server พร้อมตั้งค่า CORS ให้เปิดรับจากทุก Origin
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/* =========================
   MQTT CONNECT
========================= */
// เชื่อมต่อไปยัง MQTT Broker ที่รันอยู่ในเครื่อง Local (พอร์ต 1883)
const mqttClient = mqtt.connect("mqtt://localhost:1883");

/* =========================
   MOCK OFFICERS
========================= */
// ข้อมูลจำลอง (Mock Data) ของเจ้าหน้าที่เวรทั้งหมด 100 นาย พร้อมสถานะ อุปกรณ์ประจำตัว และเบอร์โทรศัพท์
const officers = [
  {
    id: 1,
    name: "สมชาย ใจดี",
    deviceId: "house_01",
    status: "offline",
    position: 'เจ้าหน้าที่เวร',
    phones: ['083-499-7836'],
    online: false,
    lastResponse: null,
    lastHeartbeat: null
  },
  {
    id: 2,
    name: "สมศรี วนาราก",
    deviceId: "house_02",
    status: "offline",
    position: 'เจ้าหน้าที่เวร',
    phones: ['086-541-9286'],
    online: false,
    lastResponse: null,
  },
  { id: 3, name: 'ประสิทธิ์ มานะ', nameEn: 'Prasit Mana', position: 'เจ้าหน้าที่เวร', deviceId: 'house_03', phones: ['083-456-7890'], status: 'offline', lastSeen: '02 ม.ค. 68  22:30 น.' },
  { id: 4, name: 'นภา รักชาติ', nameEn: 'Napa Rakchat', position: 'เจ้าหน้าที่เวร', deviceId: 'house_04', phones: ['084-567-8901'], status: 'online', lastSeen: '03 ม.ค. 68  02:10 น.' },
  { id: 5, name: 'อำนาจ ทองดี', nameEn: 'Amnat Thongdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_05', phones: ['085-678-9012', '095-000-1111'], status: 'online', lastSeen: '03 ม.ค. 68  02:05 น.' },
  { id: 6, name: 'มาลี สวัสดี', nameEn: 'Malee Sawatdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_06', phones: ['086-789-0123'], status: 'offline', lastSeen: '02 ม.ค. 68  20:00 น.' },
  { id: 7, name: 'ธนพล แก้วมณี', nameEn: 'Thanapol Kaewmanee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_07', phones: ['087-890-1234'], status: 'online', lastSeen: '03 ม.ค. 68  01:45 น.' },
  { id: 8, name: 'สุนีย์ ภักดี', nameEn: 'Sunee Pakdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_08', phones: ['088-901-2345'], status: 'online', lastSeen: '03 ม.ค. 68  02:01 น.' },
  { id: 9, name: 'กิตติ ศรีสุวรรณ', nameEn: 'Kitti Srisuwan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_09', phones: ['089-012-3456'], status: 'online', lastSeen: '03 ม.ค. 68  02:08 น.' },
  { id: 10, name: 'รัตนา พรมมา', nameEn: 'Rattana Prommа', position: 'เจ้าหน้าที่เวร', deviceId: 'house_10', phones: ['090-123-4567', '080-999-8888'], status: 'offline', lastSeen: '02 ม.ค. 68  18:30 น.' },
  { id: 11, name: 'ไพโรจน์ บุญมี', nameEn: 'Pairot Boonmee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_11', phones: ['091-234-5678'], status: 'online', lastSeen: '03 ม.ค. 68  01:55 น.' },
  { id: 12, name: 'จิราภรณ์ ดาวเรือง', nameEn: 'Jiraporn Daowrueang', position: 'เจ้าหน้าที่เวร', deviceId: 'house_12', phones: ['092-345-6789'], status: 'online', lastSeen: '03 ม.ค. 68  02:12 น.' },
  { id: 13, name: 'สุรพล วงษ์สุวรรณ', nameEn: 'Surapol Wongsawan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_13', phones: ['093-456-7890'], status: 'offline', lastSeen: '02 ม.ค. 68  23:10 น.' },
  { id: 14, name: 'พัชรา คำแหง', nameEn: 'Patchara Khamhang', position: 'เจ้าหน้าที่เวร', deviceId: 'house_14', phones: ['094-567-8901'], status: 'online', lastSeen: '03 ม.ค. 68  02:03 น.' },
  { id: 15, name: 'อนุชา ตันติวัฒน์', nameEn: 'Anucha Tantiwat', position: 'เจ้าหน้าที่เวร', deviceId: 'house_15', phones: ['095-678-9012'], status: 'online', lastSeen: '03 ม.ค. 68  01:50 น.' },
  { id: 16, name: 'ณัฐพล สมบูรณ์', nameEn: 'Nattapol Somboon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_16', phones: ['096-789-0123'], status: 'online', lastSeen: '03 ม.ค. 68  02:09 น.' },
  { id: 17, name: 'ศิริพร แสนสุข', nameEn: 'Siriporn Saensuk', position: 'เจ้าหน้าที่เวร', deviceId: 'house_17', phones: ['097-890-1234', '061-222-3333'], status: 'offline', lastSeen: '02 ม.ค. 68  21:45 น.' },
  { id: 18, name: 'ธีรวัฒน์ นาคสุวรรณ', nameEn: 'Teerawat Naksuwan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_18', phones: ['098-901-2345'], status: 'online', lastSeen: '03 ม.ค. 68  01:30 น.' },
  { id: 19, name: 'ลัดดา ใจงาม', nameEn: 'Ladda Jangam', position: 'เจ้าหน้าที่เวร', deviceId: 'house_19', phones: ['099-012-3456'], status: 'online', lastSeen: '03 ม.ค. 68  02:06 น.' },
  { id: 20, name: 'วรวุฒิ ปิ่นทอง', nameEn: 'Worawut Pinthong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_20', phones: ['061-123-4567'], status: 'online', lastSeen: '03 ม.ค. 68  01:48 น.' },
  { id: 21, name: 'ปิยะ มีชัย', nameEn: 'Piya Meechai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_21', phones: ['062-234-5678'], status: 'offline', lastSeen: '02 ม.ค. 68  19:20 น.' },
  { id: 22, name: 'อรทัย ฉลาดแฉล้ม', nameEn: 'Orathai Chaladchalaem', position: 'เจ้าหน้าที่เวร', deviceId: 'house_22', phones: ['063-345-6789'], status: 'online', lastSeen: '03 ม.ค. 68  02:11 น.' },
  { id: 23, name: 'ชัยวัฒน์ บุญเรือง', nameEn: 'Chaiwat Boonrueang', position: 'เจ้าหน้าที่เวร', deviceId: 'house_23', phones: ['064-456-7890', '094-777-8888'], status: 'online', lastSeen: '03 ม.ค. 68  01:52 น.' },
  { id: 24, name: 'สมหญิง รุ่งเรือง', nameEn: 'Somying Rungrueang', position: 'เจ้าหน้าที่เวร', deviceId: 'house_24', phones: ['065-567-8901'], status: 'online', lastSeen: '03 ม.ค. 68  02:00 น.' },
  { id: 25, name: 'ภานุวัฒน์ ขันแก้ว', nameEn: 'Panuwat Khankaew', position: 'เจ้าหน้าที่เวร', deviceId: 'house_25', phones: ['066-678-9012'], status: 'offline', lastSeen: '02 ม.ค. 68  20:15 น.' },
  { id: 26, name: 'นิตยา พันธุ์ดี', nameEn: 'Nittaya Pandee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_26', phones: ['067-789-0123'], status: 'online', lastSeen: '03 ม.ค. 68  01:40 น.' },
  { id: 27, name: 'เอกชัย วิเศษศรี', nameEn: 'Eakchai Wisetsri', position: 'เจ้าหน้าที่เวร', deviceId: 'house_27', phones: ['068-890-1234'], status: 'online', lastSeen: '03 ม.ค. 68  02:07 น.' },
  { id: 28, name: 'ทิพวัลย์ สุริยา', nameEn: 'Thippawan Suriya', position: 'เจ้าหน้าที่เวร', deviceId: 'house_28', phones: ['069-901-2345', '089-444-5555'], status: 'online', lastSeen: '03 ม.ค. 68  01:35 น.' },
  { id: 29, name: 'พิเชษฐ์ ศรีวิชัย', nameEn: 'Pichet Sriwichai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_29', phones: ['070-012-3456'], status: 'offline', lastSeen: '02 ม.ค. 68  22:00 น.' },
  { id: 30, name: 'กาญจนา ทองศรี', nameEn: 'Kanjana Thongsri', position: 'เจ้าหน้าที่เวร', deviceId: 'house_30', phones: ['071-123-4567'], status: 'online', lastSeen: '03 ม.ค. 68  02:13 น.' },
  { id: 31, name: 'วิชัย ดำรงค์ศักดิ์', nameEn: 'Wichai Damrongsak', position: 'เจ้าหน้าที่เวร', deviceId: 'house_31', phones: ['072-234-5678'], status: 'online', lastSeen: '03 ม.ค. 68  01:42 น.' },
  { id: 32, name: 'อัญชลี บุษบา', nameEn: 'Unchalee Butsaba', position: 'เจ้าหน้าที่เวร', deviceId: 'house_32', phones: ['073-345-6789'], status: 'offline', lastSeen: '02 ม.ค. 68  17:50 น.' },
  { id: 33, name: 'ศักดิ์ชัย ฤทธิ์เดช', nameEn: 'Sakchai Ritdej', position: 'เจ้าหน้าที่เวร', deviceId: 'house_33', phones: ['074-456-7890', '064-333-2222'], status: 'online', lastSeen: '03 ม.ค. 68  02:04 น.' },
  { id: 34, name: 'ประภา จันทร์เพ็ง', nameEn: 'Prapha Janpeng', position: 'เจ้าหน้าที่เวร', deviceId: 'house_34', phones: ['075-567-8901'], status: 'online', lastSeen: '03 ม.ค. 68  01:57 น.' },
  { id: 35, name: 'สุรศักดิ์ วงศ์ไพบูลย์', nameEn: 'Surasak Wongpaiboon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_35', phones: ['076-678-9012'], status: 'online', lastSeen: '03 ม.ค. 68  02:02 น.' },
  { id: 36, name: 'มณีรัตน์ แก้วประเสริฐ', nameEn: 'Maneerat Kaewprasert', position: 'เจ้าหน้าที่เวร', deviceId: 'house_36', phones: ['077-789-0123'], status: 'offline', lastSeen: '02 ม.ค. 68  21:00 น.' },
  { id: 37, name: 'ไชยา คงเจริญ', nameEn: 'Chaiya Kongcharoen', position: 'เจ้าหน้าที่เวร', deviceId: 'house_37', phones: ['078-890-1234'], status: 'online', lastSeen: '03 ม.ค. 68  01:38 น.' },
  { id: 38, name: 'วันเพ็ญ หอมหวาน', nameEn: 'Wanpen Homwan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_38', phones: ['079-901-2345', '099-666-7777'], status: 'online', lastSeen: '03 ม.ค. 68  02:15 น.' },
  { id: 39, name: 'ณรงค์ศักดิ์ พิมพ์ทอง', nameEn: 'Narongsak Pimthong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_39', phones: ['080-012-3456'], status: 'offline', lastSeen: '02 ม.ค. 68  23:30 น.' },
  { id: 40, name: 'สุภาพร เจริญสุข', nameEn: 'Supaporn Charoensuk', position: 'เจ้าหน้าที่เวร', deviceId: 'house_40', phones: ['081-123-4567'], status: 'online', lastSeen: '03 ม.ค. 68  02:16 น.' },
  { id: 41, name: 'ธวัชชัย สุขใจ', nameEn: 'Thawatchai Sukjai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_41', phones: ['082-111-0041'], status: 'online', lastSeen: '03 ม.ค. 68  02:05 น.' },
  { id: 42, name: 'อรอนงค์ แก้วดี', nameEn: 'Oranong Kaewdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_42', phones: ['082-111-0042'], status: 'offline', lastSeen: '02 ม.ค. 68  21:10 น.' },
  { id: 43, name: 'ชาญชัย บุญช่วย', nameEn: 'Chanchai Boonchuay', position: 'เจ้าหน้าที่เวร', deviceId: 'house_43', phones: ['082-111-0043'], status: 'online',  lastSeen: '03 ม.ค. 68  01:58 น.' },
  { id: 44, name: 'สุภาวดี พรหมมา', nameEn: 'Supawadee Promma', position: 'เจ้าหน้าที่เวร', deviceId: 'house_44', phones: ['082-111-0044'], status: 'online',  lastSeen: '03 ม.ค. 68  02:07 น.' },
  { id: 45, name: 'กฤษณะ ศรีทอง', nameEn: 'Kritsana Srithong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_45', phones: ['082-111-0045'], status: 'offline', lastSeen: '02 ม.ค. 68  20:42 น.' },
  { id: 46, name: 'จันทนา ใจบุญ', nameEn: 'Jantana Jaiboon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_46', phones: ['082-111-0046'], status: 'online',  lastSeen: '03 ม.ค. 68  02:11 น.' },
  { id: 47, name: 'ภาคภูมิ วงศ์ดี', nameEn: 'Pakkapoom Wongdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_47', phones: ['082-111-0047'], status: 'online',  lastSeen: '03 ม.ค. 68  01:47 น.' },
  { id: 48, name: 'พิมพ์ชนก สายชล', nameEn: 'Pimchanok Saichon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_48', phones: ['082-111-0048'], status: 'offline', lastSeen: '02 ม.ค. 68  22:08 น.' },
  { id: 49, name: 'ธีรภัทร บุญมี', nameEn: 'Teerapat Boonmee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_49', phones: ['082-111-0049'], status: 'online',  lastSeen: '03 ม.ค. 68  02:09 น.' },
  { id: 50, name: 'วาสนา แสงทอง', nameEn: 'Wasana Saengthong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_50', phones: ['082-111-0050'], status: 'online',  lastSeen: '03 ม.ค. 68  01:55 น.' },
  { id: 51, name: 'นิรันดร์ คำดี', nameEn: 'Niran Khamdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_51', phones: ['082-111-0051'], status: 'offline', lastSeen: '02 ม.ค. 68  19:30 น.' },
  { id: 52, name: 'สุกัญญา ใจงาม', nameEn: 'Sukanya Jaingam', position: 'เจ้าหน้าที่เวร', deviceId: 'house_52', phones: ['082-111-0052'], status: 'online',  lastSeen: '03 ม.ค. 68  02:12 น.' },
  { id: 53, name: 'วิทยา พูนทรัพย์', nameEn: 'Wittaya Poonsap', position: 'เจ้าหน้าที่เวร', deviceId: 'house_53', phones: ['082-111-0053'], status: 'online',  lastSeen: '03 ม.ค. 68  01:44 น.' },
  { id: 54, name: 'จิรเดช บุญส่ง', nameEn: 'Jiradet Boonsong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_54', phones: ['082-111-0054'], status: 'offline', lastSeen: '02 ม.ค. 68  23:15 น.' },
  { id: 55, name: 'อรวรรณ รัตนชัย', nameEn: 'Orawan Rattanachai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_55', phones: ['082-111-0055'], status: 'online',  lastSeen: '03 ม.ค. 68  02:03 น.' },
  { id: 56, name: 'พงศกร ศรีแก้ว', nameEn: 'Pongsakorn Srikaew', position: 'เจ้าหน้าที่เวร', deviceId: 'house_56', phones: ['082-111-0056'], status: 'online',  lastSeen: '03 ม.ค. 68  02:06 น.' },
  { id: 57, name: 'สุเมธ แสนคำ', nameEn: 'Sumet Saenkham', position: 'เจ้าหน้าที่เวร', deviceId: 'house_57', phones: ['082-111-0057'], status: 'offline', lastSeen: '02 ม.ค. 68  21:20 น.' },
  { id: 58, name: 'รุ่งทิวา พรชัย', nameEn: 'Rungtiwa Pornchai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_58', phones: ['082-111-0058'], status: 'online',  lastSeen: '03 ม.ค. 68  01:57 น.' },
  { id: 59, name: 'เกรียงไกร มั่นคง', nameEn: 'Kriangkrai Mankong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_59', phones: ['082-111-0059'], status: 'online',  lastSeen: '03 ม.ค. 68  02:14 น.' },
  { id: 60, name: 'มยุรี วัฒนะ', nameEn: 'Mayuree Wattana', position: 'เจ้าหน้าที่เวร', deviceId: 'house_60', phones: ['082-111-0060'], status: 'offline', lastSeen: '02 ม.ค. 68  18:55 น.' },
  { id: 61, name: 'อภิชาติ ชัยดี', nameEn: 'Apichat Chaidee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_61', phones: ['082-111-0061'], status: 'online',  lastSeen: '03 ม.ค. 68  02:08 น.' },
  { id: 62, name: 'กมลชนก พรสวรรค์', nameEn: 'Kamonchanok Pornsawan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_62', phones: ['082-111-0062'], status: 'online',  lastSeen: '03 ม.ค. 68  01:54 น.' },
  { id: 63, name: 'ณัฐวุฒิ อินทร์ทอง', nameEn: 'Nattawut Inthong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_63', phones: ['082-111-0063'], status: 'offline', lastSeen: '02 ม.ค. 68  22:33 น.' },
  { id: 64, name: 'สุนิสา วงศ์คำ', nameEn: 'Sunisa Wongkham', position: 'เจ้าหน้าที่เวร', deviceId: 'house_64', phones: ['082-111-0064'], status: 'online',  lastSeen: '03 ม.ค. 68  02:00 น.' },
  { id: 65, name: 'ถาวร บุญรักษา', nameEn: 'Thaworn Boonraksa', position: 'เจ้าหน้าที่เวร', deviceId: 'house_65', phones: ['082-111-0065'], status: 'online',  lastSeen: '03 ม.ค. 68  01:39 น.' },
  { id: 66, name: 'ชุติมา แก้วมณี', nameEn: 'Chutima Kaewmanee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_66', phones: ['082-111-0066'], status: 'offline', lastSeen: '02 ม.ค. 68  20:03 น.' },
  { id: 67, name: 'วีระชัย ศรีสุข', nameEn: 'Weerachai Srisuk', position: 'เจ้าหน้าที่เวร', deviceId: 'house_67', phones: ['082-111-0067'], status: 'online',  lastSeen: '03 ม.ค. 68  02:16 น.' },
  { id: 68, name: 'พัชราภา สุวรรณ', nameEn: 'Patcharapa Suwan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_68', phones: ['082-111-0068'], status: 'online',  lastSeen: '03 ม.ค. 68  01:52 น.' },
  { id: 69, name: 'ธนเดช พูลทรัพย์', nameEn: 'Thanadet Poolsap', position: 'เจ้าหน้าที่เวร', deviceId: 'house_69', phones: ['082-111-0069'], status: 'offline', lastSeen: '02 ม.ค. 68  21:44 น.' },
  { id: 70, name: 'สุรีย์พร คงดี', nameEn: 'Sureeporn Kongdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_70', phones: ['082-111-0070'], status: 'online',  lastSeen: '03 ม.ค. 68  02:10 น.' },
  { id: 71, name: 'อาทิตย์ บุญเรือง', nameEn: 'Athit Boonrueang', position: 'เจ้าหน้าที่เวร', deviceId: 'house_71', phones: ['082-111-0071'], status: 'online',  lastSeen: '03 ม.ค. 68  02:04 น.' },
  { id: 72, name: 'รัชนี ศรีทอง', nameEn: 'Ratchanee Srithong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_72', phones: ['082-111-0072'], status: 'offline', lastSeen: '02 ม.ค. 68  19:18 น.' },
  { id: 73, name: 'วุฒิชัย พัฒนกิจ', nameEn: 'Wuttichai Phattanakit', position: 'เจ้าหน้าที่เวร', deviceId: 'house_73', phones: ['082-111-0073'], status: 'online',  lastSeen: '03 ม.ค. 68  01:43 น.' },
  { id: 74, name: 'พรทิพย์ มั่นมี', nameEn: 'Porntip Manmee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_74', phones: ['082-111-0074'], status: 'online',  lastSeen: '03 ม.ค. 68  02:01 น.' },
  { id: 75, name: 'เจษฎา คำภา', nameEn: 'Jetsada Khampha', position: 'เจ้าหน้าที่เวร', deviceId: 'house_75', phones: ['082-111-0075'], status: 'offline', lastSeen: '02 ม.ค. 68  23:00 น.' },
  { id: 76, name: 'ปัทมา ศรีจันทร์', nameEn: 'Patama Srichan', position: 'เจ้าหน้าที่เวร', deviceId: 'house_76', phones: ['082-111-0076'], status: 'online',  lastSeen: '03 ม.ค. 68  02:13 น.' },
  { id: 77, name: 'อานนท์ สุขสวัสดิ์', nameEn: 'Anon Suksawat', position: 'เจ้าหน้าที่เวร', deviceId: 'house_77', phones: ['082-111-0077'], status: 'online',  lastSeen: '03 ม.ค. 68  01:49 น.' },
  { id: 78, name: 'นงลักษณ์ พรหมดี', nameEn: 'Nonglak Promdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_78', phones: ['082-111-0078'], status: 'offline', lastSeen: '02 ม.ค. 68  20:27 น.' },
  { id: 79, name: 'สันติชัย บุญเกิด', nameEn: 'Santichai Boonkert', position: 'เจ้าหน้าที่เวร', deviceId: 'house_79', phones: ['082-111-0079'], status: 'online',  lastSeen: '03 ม.ค. 68  02:02 น.' },
  { id: 80, name: 'อุษา รัตนวงศ์', nameEn: 'Usa Rattanawong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_80', phones: ['082-111-0080'], status: 'online',  lastSeen: '03 ม.ค. 68  01:56 น.' },
  { id: 81, name: 'ไพศาล ทองคำ', nameEn: 'Paisan Thongkham', position: 'เจ้าหน้าที่เวร', deviceId: 'house_81', phones: ['082-111-0081'], status: 'offline', lastSeen: '02 ม.ค. 68  22:20 น.' },
  { id: 82, name: 'กัลยา ศรีสุข', nameEn: 'Kanlaya Srisuk', position: 'เจ้าหน้าที่เวร', deviceId: 'house_82', phones: ['082-111-0082'], status: 'online',  lastSeen: '03 ม.ค. 68  02:15 น.' },
  { id: 83, name: 'เอกภพ บุญยืน', nameEn: 'Ekaphop Boonyuen', position: 'เจ้าหน้าที่เวร', deviceId: 'house_83', phones: ['082-111-0083'], status: 'online',  lastSeen: '03 ม.ค. 68  01:50 น.' },
  { id: 84, name: 'ดวงพร อินทรา', nameEn: 'Duangporn Intra', position: 'เจ้าหน้าที่เวร', deviceId: 'house_84', phones: ['082-111-0084'], status: 'offline', lastSeen: '02 ม.ค. 68  18:40 น.' },
  { id: 85, name: 'วิษณุ พรชัย', nameEn: 'Witsanu Pornchai', position: 'เจ้าหน้าที่เวร', deviceId: 'house_85', phones: ['082-111-0085'], status: 'online',  lastSeen: '03 ม.ค. 68  02:09 น.' },
  { id: 86, name: 'รุ่งนภา แสงดี', nameEn: 'Rungnapa Saengdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_86', phones: ['082-111-0086'], status: 'online',  lastSeen: '03 ม.ค. 68  01:53 น.' },
  { id: 87, name: 'ชัยณรงค์ ใจมั่น', nameEn: 'Chainarong Jaiman', position: 'เจ้าหน้าที่เวร', deviceId: 'house_87', phones: ['082-111-0087'], status: 'offline', lastSeen: '02 ม.ค. 68  21:37 น.' },
  { id: 88, name: 'นภาพร สุขเกษม', nameEn: 'Napaporn Sukkasem', position: 'เจ้าหน้าที่เวร', deviceId: 'house_88', phones: ['082-111-0088'], status: 'online',  lastSeen: '03 ม.ค. 68  02:06 น.' },
  { id: 89, name: 'ประยูร คงศักดิ์', nameEn: 'Prayoon Kongsak', position: 'เจ้าหน้าที่เวร', deviceId: 'house_89', phones: ['082-111-0089'], status: 'online',  lastSeen: '03 ม.ค. 68  01:46 น.' },
  { id: 90, name: 'มธุรส จันทร์ดี', nameEn: 'Mathuros Jandee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_90', phones: ['082-111-0090'], status: 'offline', lastSeen: '02 ม.ค. 68  22:48 น.' },
  { id: 91, name: 'ธงชัย ศรีบุญ', nameEn: 'Thongchai Sriboon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_91', phones: ['082-111-0091'], status: 'online',  lastSeen: '03 ม.ค. 68  02:11 น.' },
  { id: 92, name: 'ศศิธร พูลผล', nameEn: 'Sasithorn Poolpon', position: 'เจ้าหน้าที่เวร', deviceId: 'house_92', phones: ['082-111-0092'], status: 'online',  lastSeen: '03 ม.ค. 68  01:59 น.' },
  { id: 93, name: 'พิชัย วงศ์แก้ว', nameEn: 'Pichai Wongkaew', position: 'เจ้าหน้าที่เวร', deviceId: 'house_93', phones: ['082-111-0093'], status: 'offline', lastSeen: '02 ม.ค. 68  20:58 น.' },
  { id: 94, name: 'อารยา สุขดี', nameEn: 'Araya Sukdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_94', phones: ['082-111-0094'], status: 'online',  lastSeen: '03 ม.ค. 68  02:03 น.' },
  { id: 95, name: 'วิเชียร บุญมาก', nameEn: 'Wichian Boonmak', position: 'เจ้าหน้าที่เวร', deviceId: 'house_95', phones: ['082-111-0095'], status: 'online',  lastSeen: '03 ม.ค. 68  01:42 น.' },
  { id: 96, name: 'ชไมพร ทองสุข', nameEn: 'Chamaiporn Thongsuk', position: 'เจ้าหน้าที่เวร', deviceId: 'house_96', phones: ['082-111-0096'], status: 'offline', lastSeen: '02 ม.ค. 68  19:55 น.' },
  { id: 97, name: 'ณัฐชา ศรีทอง', nameEn: 'Natcha Srithong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_97', phones: ['082-111-0097'], status: 'online',  lastSeen: '03 ม.ค. 68  02:07 น.' },
  { id: 98, name: 'ธีรยุทธ แก้วคำ', nameEn: 'Teerayut Kaewkham', position: 'เจ้าหน้าที่เวร', deviceId: 'house_98', phones: ['082-111-0098'], status: 'online',  lastSeen: '03 ม.ค. 68  01:51 น.' },
  { id: 99, name: 'สุภาพรรณ บุญส่ง', nameEn: 'Suphapan Boonsong', position: 'เจ้าหน้าที่เวร', deviceId: 'house_99', phones: ['082-111-0099'], status: 'offline', lastSeen: '02 ม.ค. 68  21:12 น.' },
  { id: 100, name: 'จักรพันธ์ คำดี', nameEn: 'Jakkapan Khamdee', position: 'เจ้าหน้าที่เวร', deviceId: 'house_100', phones: ['082-111-0100'], status: 'online', lastSeen: '03 ม.ค. 68  02:16 น.' },
];

// ---------- 3. GLOBAL VARIABLES & STATE ----------
// ตัวแปรเก็บสถานะการระดมพล (Mobilization State) ปัจจุบัน
let mobilization = {
  active: false,
  startedAt: null,
  targetCount: 0,
  ackCount: 0
};

// อ็อบเจกต์เก็บข้อมูลการระดมพลรอบปัจจุบัน
let currentMobilization = null;

// ---------- 4. HISTORY LOG FUNCTIONS ----------
// ฟังก์ชันบันทึกข้อมูลประวัติการระดมพลลงไฟล์ history.json
function saveHistory() {
  fs.writeFileSync(
    "history.json",
    JSON.stringify(
      mobilizationHistory,
      null,
      2
    )
  );
}

// ฟังก์ชันดึงข้อมูลรายละเอียดเพิ่มเติมของเจ้าหน้าที่เข้ามาเสริมใน Log ประวัติ
function enrichHistoryEvent(event) {
  if (!event) return event;
  return {
    ...event,
    officers: (event.officers || []).map(historyOfficer => {
      const officer = officers.find(o => o.id === historyOfficer.id);
      return {
        ...historyOfficer,
        name: historyOfficer.name || officer?.name,
        nameEn: historyOfficer.nameEn || officer?.nameEn,
        position: historyOfficer.position || officer?.position,
        deviceId: historyOfficer.deviceId || officer?.deviceId,
        phones: historyOfficer.phones || officer?.phones || []
      };
    })
  };
}

// ตัวแปรอาร์เรย์เก็บประวัติทั้งหมด (โหลดมาจากไฟล์ตอนสตาร์ทเซิร์ฟเวอร์)
let mobilizationHistory = [];

try {
  mobilizationHistory = JSON.parse(
    fs.readFileSync(
      "history.json",
      "utf8"
    )
  );
} catch {
  mobilizationHistory = [];
}

/* =========================
   SOCKET CONNECTION
========================= */
// เมื่อมีไคลเอนต์ (หน้าเว็บ Web Dashboard) เชื่อมต่อผ่าน WebSockets
io.on("connection", (socket) => {
  console.log("Client connected");

  // ส่งข้อมูลเริ่มต้นให้ฝั่งหน้าเว็บนำไปแสดงผลทันที
  socket.emit("initialData", {
    officers,
    emergencyActive: mobilization.active,
    startedAt: mobilization.startedAt,
    historyLogs: [],
  });
});

// ---------- 5. HTTP API ENDPOINTS ----------

// 5.1 POST /mobilize - สั่งเริ่มการระดมพล (ส่งสัญญาณแจ้งเตือน)
app.post(
  "/mobilize",
  (req, res) => {
    // เตรียม payload ส่งไปยังอุปกรณ์ IoT ผ่าน MQTT
    const payload = JSON.stringify({
      event: "mobilize"
    });

    mqttClient.publish(
      "ems/mobilize",
      payload
    );

    // เลือกเจ้าหน้าที่เฉพาะคนที่มีสถานะออนไลน์เพื่อเป็นเป้าหมายระดมพล
    const targetOfficers = officers.filter(
      o => o.status === "online"
    );

    console.log(
      "TARGET OFFICERS:",
      targetOfficers
    );

    // อัปเดตสถานะตัวแปรระดมพลกลาง
    mobilization.active = true;
    mobilization.startedAt = Date.now();
    mobilization.targetCount = targetOfficers.length;
    mobilization.ackCount = 0;

    // สร้าง Record ข้อมูลรอบการระดมพลปัจจุบัน
    currentMobilization = {
      id: Date.now(),
      startedAt: Date.now(),
      endedAt: null,
      targetCount: targetOfficers.length,
      officers: targetOfficers.map(o => ({
        id: o.id,
        name: o.name,
        nameEn: o.nameEn,
        position: o.position,
        deviceId: o.deviceId,
        phones: o.phones || [],
        ack: false,
        ackTime: null
      }))
    };

    console.log(
      "TARGET:",
      targetOfficers.length
    );

    // เปลี่ยนสถานะของเจ้าหน้าที่ออนไลน์ทุกคนเป็น "alerting" (แจ้งเตือนอยู่)
    officers.forEach(o => {
      if (o.status === "online") {
        o.status = "alerting";
      }
    });

    // ส่งข้อมูลสถานะอัปเดตใหม่ไปยังหน้าเว็บคอมพิวเตอร์ผ่าน WebSockets
    io.emit(
      "mobilizationStarted",
      officers
    );

    console.log(
      "MOBILIZE SENT"
    );

    res.json({
      success: true
    });
  }
);

// 5.2 POST /mobilization/reset - เคลียร์หรือยกเลิกการระดมพลรอบปัจจุบัน
app.post(
  "/mobilization/reset",
  (req, res) => {
    // บันทึกเวลาสิ้นสุดของการระดมพลรอบปัจจุบันเข้าสู่ประวัติศาสตร์
    if (currentMobilization) {
      currentMobilization.endedAt = Date.now();
      mobilizationHistory.unshift(currentMobilization);
      saveHistory();
      currentMobilization = null;
    }

    // รีเซ็ตสถานะตัวแปรกลางกลับสู่ปกติ
    mobilization.active = false;
    mobilization.startedAt = null;
    mobilization.targetCount = 0;
    mobilization.ackCount = 0;

    // ปรับเปลี่ยนเจ้าหน้าที่ที่ตอบรับแล้ว (ack) หรือกำลังเตือนอยู่ (alerting) กลับเป็นออนไลน์ (online)
    officers.forEach(o => {
      if (
        o.status === "ack" ||
        o.status === "alerting"
      ) {
        o.status = "online";
      }
    });

    console.log(
      "AFTER RESET:",
      officers
    );

    // ยิงสตรีมแจ้งเหตุการณ์จบระดมพลให้หน้าเว็บทราบ
    io.emit(
      "mobilizationEnded",
      officers
    );

    console.log(
      "MOBILIZATION RESET"
    );

    res.json({
      success: true
    });
  }
);

// 5.3 GET /mobilization/history - เรียกดูประวัติการระดมพลทั้งหมด
app.get(
  "/mobilization/history",
  (req, res) => {
    res.json(
      mobilizationHistory.map(enrichHistoryEvent)
    );
  }
);

// 5.4 GET /mobilization/latest - เรียกดูประวัติรอบระดมพลครั้งล่าสุด
app.get(
  "/mobilization/latest",
  (req, res) => {
    if (mobilizationHistory.length === 0) {
      return res.json(null);
    }
    res.json(
      enrichHistoryEvent(mobilizationHistory[0])
    );
  }
);

// 5.5 GET /mobilization/history/:id - ดึงข้อมูลประวัติตามรหัส ID (ชุดที่ 1)
app.get(
  "/mobilization/history/:id",
  (req, res) => {
    const history = mobilizationHistory.find(
      h => h.id == req.params.id
    );

    if (!history) {
      return res.status(404).json({
        error: "History not found"
      });
    }

    res.json(
      enrichHistoryEvent(history)
    );
  }
);

// 5.6 GET /mobilization/history/:id - ดึงข้อมูลประวัติตามรหัส ID (ชุดที่ 2 - ซ้ำซ้อนจากโค้ดเดิม)
app.get(
  "/mobilization/history/:id",
  (req, res) => {
    const event = mobilizationHistory.find(
      e => e.id == req.params.id
    );

    if (!event) {
      return res
        .status(404)
        .json({
          error: "Event not found"
        });
    }

    res.json(
      enrichHistoryEvent(event)
    );
  }
);

/* =========================
   START SERVER
========================= */
// เปิดพอร์ตเซิร์ฟเวอร์ HTTP ให้คอยรับ Request อยู่ที่พอร์ต 3000
server.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});

/* =========================
   MQTT CONNECTED
========================= */
// คอลแบ็คทำงานเมื่อ MQTT client เชื่อมต่อบอร์ดหรือ Broker สำเร็จ
mqttClient.on("connect", () => {
  console.log(
    "MQTT Connected"
  );

  // สมัครรับข้อมูลหัวข้อ (Topics) ต่างๆ ที่บอร์ด IoT จะส่งข้อความเข้ามา
  mqttClient.subscribe("ems/ack/#");
  mqttClient.subscribe("ems/mobilize");
  mqttClient.subscribe("ems/status");

  console.log(
    "Subscribed: ems/ack/#"
  );
});

/* =========================
   MQTT MESSAGE
========================= */
// ดักจับและจัดการข้อความ (Message Packet) ที่ได้รับเข้ามาจาก Topic บน MQTT Broker
mqttClient.on(
  "message",
  (topic, message) => {
    try {
      // แปลงข้อมูลไบนารีให้กลายเป็นข้อมูลข้อความ JSON อ็อบเจกต์
      const data = JSON.parse(message.toString());

      console.log(
        "MQTT MESSAGE:",
        topic,
        data
      );

      /* =========================
         FIND OFFICER
      ========================= */
      // ค้นหาวัตถุข้อมูลพนักงานใน Array ผ่านรหัส id ที่แนบมากับ payload
      const officer = officers.find(
        o => o.id === data.id
      );

      if (!officer) {
        console.log(
          "Officer not found"
        );
        return;
      }

      /* =========================
         HEARTBEAT
      ========================= */
      // กรณีข้อความวิ่งเข้ามาที่หัวข้อแสดงตัวตน "ems/status" (บอร์ดยังมีชีวิตอยู่)
      if (topic === "ems/status") {
        officer.online = true;
        officer.lastHeartbeat = Date.now();
        officer.lastResponse = new Date().toLocaleTimeString(
          "th-TH",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ) + " น.";

        /*
          เปลี่ยนเป็น online
          เฉพาะตอนที่ offline เท่านั้น
        */
        if (officer.status === "offline") {
          officer.status = "online";
        }

        // ยิง Socket อัปเดตข้อมูลพนักงานรายนี้บนเว็บบอร์ดแผงควบคุมทันที
        io.emit(
          "officerUpdated",
          officer
        );

        return;
      }

      /* =========================
         ACK / OTHER STATUS
      ========================= */
      // กรณีบอร์ดตอบรับสัญญาณกลับมา หรือเปลี่ยนสถานะผ่าน Topic อื่นๆ
      officer.status = data.status || "ack";

      // หากสถานะระบุเป็นตอบรับ "ack" และกำลังอยู่ในระหว่างช่วงเวลาระดมพล
      if (
        data.status === "ack" &&
        mobilization.active
      ) {
        mobilization.ackCount++;

        console.log(
          `ACK ${mobilization.ackCount}/${mobilization.targetCount}`
        );

        // =========================
        // SAVE ACK TO HISTORY
        // =========================
        // ลงประวัติบันทึกข้อมูลตอบรับภัย (ack) ของเจ้าหน้าที่รายนั้นใน Event Log รอบนี้
        if (currentMobilization) {
          const targetOfficer = currentMobilization.officers.find(
            o => o.id === officer.id
          );

          console.log(
            "FOUND OFFICER:",
            targetOfficer
          );

          if (
            targetOfficer &&
            !targetOfficer.ack
          ) {
            targetOfficer.ack = true;
            targetOfficer.ackTime = Date.now();
            console.log(
              "ACK SAVED"
            );
          }
        }
      }

      officer.online = true;
      officer.lastResponse = new Date().toLocaleTimeString(
        "th-TH",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ) + " น.";

      // อัปเดต UI หน้าเว็บ Dashboard ไคลเอนต์ให้สะท้อนผลลัพธ์
      io.emit(
        "officerUpdated",
        officer
      );

      console.log(
        `${officer.name} updated`
      );

    } catch (error) {
      console.log(
        "MQTT Parse Error:",
        error.message
      );
    }
  }
);

// ---------- 6. BACKGROUND CRON JOB (HEARTBEAT CHECKER) ----------
// ทำงานวนซ้ำในทุกๆ 5 วินาที เพื่อตรวจสอบบอร์ดที่ขาดการติดต่อ (Timeout)
setInterval(() => {
  officers.forEach(officer => {
    const diff = Date.now() - officer.lastHeartbeat;

    // หากเวลาขาดหายไปนานกว่า 15 วินาที และสถานะไม่ได้ออฟไลน์อยู่ก่อนแล้ว ให้ปรับเปลี่ยนให้เป็นออฟไลน์ขาดสัญญาณ
    if (
      diff > 15000 &&
      officer.status !== "offline"
    ) {
      officer.status = "offline";
      officer.online = false;

      // แจ้งหน้าจอ UI คอมพิวเตอร์ว่าเจ้าหน้าที่คนนี้หลุดการเชื่อมต่อ
      io.emit(
        "officerUpdated",
        officer
      );

      console.log(
        `${officer.name} OFFLINE`
      );
    }
  });
}, 5000);