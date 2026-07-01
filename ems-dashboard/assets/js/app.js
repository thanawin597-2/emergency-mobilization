/* ============================================================
   EMS DASHBOARD — app.js v3.0
   ลบ: Sidebar state, Event Log
   ============================================================ */

function emsDashboard() {
  return {

    /* ── SYSTEM STATE ── */
    emergencyActive:  false,
    
    mqttStatus:       'online',
    currentTime:      '',
    isLoading:        true,

    refreshCounter: 0,
    mobilizeTimeoutId: null,
    unreadLogs: 0,
    notificationCount: 0,
    lastReadHistoryId: 0,
    isDataLoaded: false,

    /* ── FILTER & SEARCH ── */
    searchQuery:  '',
    activeFilter: 'all',

    /* ── OFFICER MODAL ── */
    selectedOfficer: null,

    /* ── MOBILIZE MODAL ── */
    mobilizeStep:             1,
    mobilizePassword:         '',
    mobilizePasswordVisible:  false,
    mobilizeError:            '',
    isProcessing:             false,
    MOBILIZE_PASSWORD:        '1234',

    /* ── TOASTS ── */
    toasts:       [],
    toastCounter: 0,

  

    /* ── SOCKET ── */
    socket: null,

    /* ── OFFICERS DATA (40 คน) ── */
    officers: [ ],

    /* ── COMPUTED: filtered list ── */
    get filteredOfficers() {
      return this.officers.filter(o => {
        const q = this.searchQuery.toLowerCase().trim();
        const matchSearch = !q
          || o.name.toLowerCase().includes(q)
          || o.nameEn.toLowerCase().includes(q)
          || o.deviceId.toLowerCase().includes(q);

        let matchFilter = true;
        if (this.activeFilter === 'online')   matchFilter = o.status === 'online';
        if (this.activeFilter === 'offline')  matchFilter = o.status === 'offline';
        if (this.activeFilter === 'alerting') matchFilter = o.status === 'alerting';
        if (this.activeFilter === 'ack')      matchFilter = o.status === 'ack';

        return matchSearch && matchFilter;
      });
    },

    /* ── COMPUTED: summary counts ── */
    get totalCount()   { return this.officers.length; },
    get onlineCount() { return this.officers.filter(o => o.status === 'online').length; },
    get ackCount()     { return this.officers.filter(o => o.status === 'ack').length; },
    get alertingCount(){ return this.officers.filter(o => o.status === 'alerting').length; },
    get offlineCount() { return this.officers.filter(o => o.status === 'offline').length; },


    async loadNotificationCount() {

  try {

    const response =
      await fetch(
        "http://localhost:3000/mobilization/history"
      );

    const history =
      await response.json();

    const lastReadCount =
      Number(
        localStorage.getItem(
          "lastReadHistoryCount"
        )
      ) || 0;

    this.notificationCount =
      history.length -
      lastReadCount;

  }

  catch (err) {

    console.error(err);

  }

},


    /* ── INIT ── */
    init() {

  // จำลอง loading skeleton
  setTimeout(() => {
    this.isLoading = false;
  }, 700);

  this.applyEmergencyModeClass();

  // Realtime clock
  this.updateClock();

  this.loadNotificationCount();

  setInterval(() => {
    this.updateClock();
    this.refreshCounter++;
  }, 1000);

  this.lastReadHistoryId =
  Number(
    localStorage.getItem(
      "lastReadHistoryId"
    )
  ) || 0;

  /* =========================================================*/
  console.log(
  "Page loaded at:",
  new Date()
);
console.log(
  "Dashboard INIT:",
  new Date()
);

  
  /* =========================================================
     SOCKET.IO CONNECT
  ========================================================= */

  this.socket = io("http://localhost:3000");
  this.socket.on(
  "mobilizationStarted",
  (updatedOfficers) => {

    console.log("Mobilization Started");

    this.officers.forEach(o => {
      if (o.status === "online") {
        o.status = "alerting";
      }
    });

    this.officers.forEach(updatedOfficer => {

      const officer = this.officers.find(
        o => o.id === updatedOfficer.id
      );

      if (!officer) {
        return;
      }

      const previousStatus = officer.status;

      officer.status = updatedOfficer.status;

    });

  }
);


this.socket.on(
  "mobilizationEnded",
  (updatedOfficers) => {

    this.emergencyActive = false;

    this.applyEmergencyModeClass();

    updatedOfficers.forEach(
      updatedOfficer => {

        const officer = this.officers.find(
  o => o.id === updatedOfficer.id
);

if (!officer) {
  return;
}

const previousStatus = officer.status;

// อัปเดต status ใหม่
officer.status = updatedOfficer.status;

      }
    );

    this.loadNotificationCount();

  }
);

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  this.socket.on(
  "initialData",
  (data) => {

    console.log(
  "Emergency Active:",
  data.emergencyActive
);

    console.log(
      "InitialData received at:",
      new Date()
    );

    console.log(
      "Initial Data:",
      data
    );

    this.officers =
      JSON.parse(
      JSON.stringify(
      data.officers
    )
  );

        this.emergencyActive = data.emergencyActive;
        if (
  data.emergencyActive &&
  data.startedAt
) {

  const elapsed =
    Date.now() -
    data.startedAt;

  const remaining =
    60000 - elapsed;

  console.log(
    "Remaining:",
    remaining
  );

  if (remaining > 0) {

    this.startMobilizeAutoResetTimer(
      remaining
    );

  }

}
        this.applyEmergencyModeClass();

    // ยังไม่โหลด officers จาก backend
    // เพราะ frontend ยังใช้ mockup 40 คนอยู่
      this.isDataLoaded = true;
  }
);

  /* =========================================================
     REALTIME OFFICER UPDATE
  ========================================================= */

  this.socket.on(
  "officerUpdated",
  (updatedOfficer) => {

    console.log("Officer Updated:", updatedOfficer);

    const officer = this.officers.find(
      o => o.id === updatedOfficer.id
    );

    officer.lastHeartbeat =
    updatedOfficer.lastHeartbeat;

    if (!officer) return;

    // ✅ สำคัญ: เก็บค่าก่อนเปลี่ยน
    const previousStatus = officer.status;

    // update status (logic เดิมของคุณ)
    if (
      officer.status === "ack" &&
      updatedOfficer.status === "online" &&
      this.emergencyActive
    ) {
      // ไม่ทำอะไร
    } else {
      officer.status = updatedOfficer.status;
    }

    // update time
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    officer.lastSeen = `${hh}:${mm}:${ss} น.`;
    // officer.lastHeartbeat = Date.now();

    // ✅ FIX: ใช้ previousStatus ได้แล้ว
    if (
      updatedOfficer.status === 'ack' &&
      previousStatus !== 'ack'
    ) {
      this.showToast(
        `✅ ${officer.name} รับทราบแล้ว`,
        'success'
      );
    }

    if (updatedOfficer.status === 'offline') {
      this.showToast(
        `🔴 ${officer.name} Offline`,
        'error'
      );
    }

  }
);


},

    /* ── CLOCK ── */
    updateClock() {
      const now  = new Date();
      const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
      const d  = String(now.getDate()).padStart(2,'0');
      const m  = String(now.getMonth()+1).padStart(2,'0');
      const y  = now.getFullYear() + 543;
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');
      this.currentTime = `${days[now.getDay()]}  ${d}/${m}/${y}  ${hh}:${mm}:${ss}`;
    },


    getOfflineDuration(officer) {

  if (
    officer.status !== "offline" ||
    !officer.lastHeartbeat
  ) {
    return "";
  }

  const diff =
    Date.now() -
    officer.lastHeartbeat;

  const minutes =
    Math.floor(diff / 60000);

  if (minutes < 60) {
    return `ออฟไลน์ ${minutes} นาที`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `ออฟไลน์ ${hours} ชั่วโมง`;
  }

  const days =
    Math.floor(hours / 24);

  return `ออฟไลน์ ${days} วัน`;
},



    /* ── STATUS HELPERS ── */
    getDotWrapClass(status) {
      switch(status) {
        case 'online':   return 'status-dot-wrap dot-online';
        case 'offline':  return 'status-dot-wrap dot-offline';
        case 'alerting': return 'status-dot-wrap dot-alerting';
        case 'ack':      return 'status-dot-wrap dot-ack';
        default:         return 'status-dot-wrap dot-offline';
      }
    },

    getCardClass(status) {
      switch(status) {
        case 'online':   return 'officer-card state-online';
        case 'offline':  return 'officer-card state-offline';
        case 'alerting': return 'officer-card state-alerting';
        case 'ack':      return 'officer-card state-ack';
        default:         return 'officer-card state-offline';
      }
    },

    getStatusLabel(status) {
      switch(status) {
        case 'online':   return 'ออนไลน์';
        case 'offline':  return 'ออฟไลน์';
        case 'alerting': return 'กำลังแจ้งเตือน';
        case 'ack':      return 'รับทราบแล้ว';
        default:         return '—';
      }
    },

    getStatusIcon(status) {
      switch(status) {
        case 'online':   return 'bi-circle-fill';
        case 'offline':  return 'bi-circle';
        case 'alerting': return 'bi-bell-fill';
        case 'ack':      return 'bi-check-circle-fill';
        default:         return 'bi-circle';
      }
    },


   getOfflineDuration(officer) {
    
  if (
    officer.status !== "offline"
  ) {
    return "";
  }

  if (!officer.lastHeartbeat) {
    return "ออฟไลน์";
  }

  const diff =
    Date.now() -
    officer.lastHeartbeat;

  const minutes =
    Math.floor(diff / 60000);

  if (minutes < 1) {
    return "ออฟไลน์เมื่อสักครู่";
  }

  if (minutes < 60) {
    return `ออฟไลน์ ${minutes} นาทีที่แล้ว`;
  }

  const hours =
    Math.floor(minutes / 60);

  return `ออฟไลน์ ${hours} ชั่วโมงที่แล้ว`;
},

    /* ── OFFICER MODAL ── */
    openOfficerModal(officer) {
      this.selectedOfficer = officer;
      const modal = new bootstrap.Modal(
        document.getElementById('officerModal')
      );
      modal.show();
    },

    /* ── MOBILIZE FLOW ── */
    openMobilizeModal() {
      this.mobilizeStep            = 1;
      this.mobilizePassword        = '';
      this.mobilizePasswordVisible = false;
      this.mobilizeError           = '';
      this.isProcessing            = false;
      const modal = new bootstrap.Modal(
        document.getElementById('mobilizeModal')
      );
      modal.show();
    },

    nextToPasswordStep() {
      this.mobilizeStep = 2;
    },

    verifyPassword() {
      this.mobilizeError = '';
      if (!this.mobilizePassword) {
        this.mobilizeError = 'กรุณากรอกรหัสผ่าน';
        return;
      }
      if (this.mobilizePassword !== this.MOBILIZE_PASSWORD) {
        this.mobilizeError = 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่';
        this.mobilizePassword = '';
        return;
      }
      this.mobilizeStep = 3;
    },

    /* ── MOBILIZE: ยืนยันและส่งสัญญาณ ── */
    confirmMobilize() {
      this.isProcessing = true;

      setTimeout(() => {
        // เปิด Emergency
        this.emergencyActive = true;
        this.applyEmergencyModeClass();
        this.applyEmergencyModeClass();
        this.startMobilizeAutoResetTimer();

        // นับจำนวน online ก่อน เพื่อใช้คำนวณ timer
        const onlineCount = this.officers.filter(
          o => o.status === 'online'
        ).length;

        fetch(
  "http://localhost:3000/mobilize",
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json"
    }
  }
)
.then(r => r.json())
.then(data => {

  console.log(
    "Mobilize Sent",
    data
  );

})
.catch(err => {

  console.error(err);

});
        this.showToast('🚨 ระดมพลเริ่มต้น — กระดิ่งกำลังดัง', 'error');

        // ปิด modal
        const modalEl = document.getElementById('mobilizeModal');
        bootstrap.Modal.getInstance(modalEl)?.hide();

        this.isProcessing = false;

        // จำลอง ACK ทีละคน แล้ว reset เมื่อทุกคน ack ครบ

        // this.simulateAckResponses(onlineCount);

      }, 1200);
    },

    /* ── SIMULATE ACK + AUTO RESET ── */
    simulateAckResponses(onlineCount) {
      /*
       * ในระบบจริง:
       *   - แต่ละ ACK มาจาก MQTT message
       *   - เมื่อทุกคน ACK ครบ หรือครบเวลาที่กำหนด → เรียก resetSystem()
       *
       * Demo นี้:
       *   - สุ่ม delay 5–25 วิ ต่อคน
       *   - เมื่อ ACK ครบทุกคนที่ alerting → รอ 3 วิ แล้ว reset
       */
      const alertingOfficers = this.officers.filter(
        o => o.status === 'alerting'
      );

      let ackReceived = 0;
      const totalToAck = alertingOfficers.length;

      alertingOfficers.forEach((officer, idx) => {
        const delay = 5000 + Math.random() * 20000 + idx * 250;

        setTimeout(() => {
          const o = this.officers.find(x => x.id === officer.id);
          if (o && o.status === 'alerting') {
            o.status = 'ack';
            const now = new Date();
            const hh  = String(now.getHours()).padStart(2,'0');
            const mm  = String(now.getMinutes()).padStart(2,'0');
            const ss  = String(now.getSeconds()).padStart(2,'0');
            o.lastSeen = `${hh}:${mm}:${ss} น.`;

            this.showToast(`✅ ${o.name} รับทราบแล้ว`, 'success');

            ackReceived++;

            // เมื่อ ACK ครบทุกคน → แจ้งเตือน แล้ว reset หลัง 3 วิ
            if (ackReceived >= totalToAck) {
              this.showToast(
                '✅ เจ้าหน้าที่รับทราบครบทุกคน — ระบบจะรีเซ็ตใน 3 วินาที',
                'info'
              );
              setTimeout(() => {
                this.resetSystem();
              }, 3000);
            }
          }
        }, delay);
      });
    },

    /* ── RESET SYSTEM ── */
    /*
     * รีเซ็ตสถานะทั้งหมดกลับเป็น standby
     * เจ้าหน้าที่ที่ ack → กลับเป็น online
     * เจ้าหน้าที่ที่ offline → คงสถานะ offline ไว้
     */
    resetSystem() {
      // รีเซ็ต officer status
      this.officers.forEach(o => {
        if (o.status === 'ack' || o.status === 'alerting') {
          o.status = 'online';
        }
        // offline คงเดิม
      });

      // รีเซ็ต emergency flag

          fetch(
  "http://localhost:3000/mobilization/reset",
  {
    method: "POST"
  }
)
.then(r => r.json())
.then(data => {

  console.log(
    "Backend Reset",
    data
  );

});
      this.emergencyActive = false;
      this.applyEmergencyModeClass();

      if (this.mobilizeTimeoutId) {
        clearTimeout(this.mobilizeTimeoutId);
    this.mobilizeTimeoutId = null;
    }

      // รีเซ็ต mobilize modal state
      this.mobilizeStep            = 1;
      this.mobilizePassword        = '';
      this.mobilizePasswordVisible = false;
      this.mobilizeError           = '';
      this.isProcessing            = false;

      // รีเซ็ต filter กลับ all
      this.activeFilter = 'all';
      this.searchQuery  = '';

      this.showToast(
        '🔄 ระบบรีเซ็ตเรียบร้อย — พร้อมระดมพลครั้งถัดไป',
        'info'
      );
    },

    /* ── SIMULATE ACK (demo only) ── */
    simulateAckResponses() {
      const alerting = this.officers.filter(o => o.status === 'alerting');
      alerting.forEach((officer, idx) => {
        const delay = 5000 + Math.random() * 20000 + idx * 250;
        setTimeout(() => {
          const o = this.officers.find(x => x.id === officer.id);
          if (o && o.status === 'alerting') {
            o.status = 'ack';
            const now = new Date();
            const hh  = String(now.getHours()).padStart(2,'0');
            const mm  = String(now.getMinutes()).padStart(2,'0');
            const ss  = String(now.getSeconds()).padStart(2,'0');
            o.lastSeen = `${hh}:${mm}:${ss} น.`;
            this.showToast(`✅ ${o.name} รับทราบแล้ว`, 'success');
          }
        }, delay);
      });
    },

    /* ── TOAST ── */
    showToast(message, type = 'info') {
      const id = ++this.toastCounter;
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 4000);
    },

    /* ── FILTER HELPERS ── */
    setFilter(f) { this.activeFilter = f; },

    filterClass(f) {
      if (this.activeFilter !== f) return 'filter-btn';
      return f === 'alerting' ? 'filter-btn f-active-red' : 'filter-btn f-active';
    },

applyEmergencyModeClass() {
  if (this.emergencyActive) {
    document.body.classList.add('emergency-mode');
  } else {
    document.body.classList.remove('emergency-mode');
  }
},
startMobilizeAutoResetTimer(
  duration = 60000
) {

  if (this.mobilizeTimeoutId) {
    clearTimeout(
      this.mobilizeTimeoutId
    );
  }

  this.mobilizeTimeoutId =
    setTimeout(() => {

      if (this.emergencyActive) {

        this.showToast(
          '⏰ ครบเวลา — ระบบรีเซ็ตกลับสู่สถานะปกติ',
          'warning'
        );
        this.resetSystem();
      }

    }, duration);

},

  openHistory() {

  localStorage.setItem(
    "lastReadHistoryCount",
    this.notificationCount +
    Number(
      localStorage.getItem(
        "lastReadHistoryCount"
      ) || 0
    )
  );

  this.notificationCount = 0;

  window.location.href =
    "history.html";

},
  }; // end return
} // end emsDashboard