
export type Language = 'EN' | 'CN' | 'BM';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  priority: number; // 1-4 are primary sequence, >4 are other contacts
}

export interface MedicalID {
  fullName: string;
  icNumber: string;
  isIcVerified: boolean;
  personalPhoto?: string; // base64
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  // Vehicle Details
  vehicleBrand: string;
  vehicleColor: string;
  licensePlate: string;
}

export type CrashSeverity = 'Low' | 'Medium' | 'High';

export interface Translation {
  startRide: string;
  stopRide: string;
  monitoring: string;
  sos: string;
  crashDetected: string;
  cancelPrompt: string;
  iamOk: string;
  emergencyContacts: string;
  medicalId: string;
  vehicleInfo: string;
  language: string;
  unresponsiveMsg: string;
  location: string;
  settings: string;
  recording: string;
  driveSafe: string;
  dashcam: string;
  capture: string;
  saveVideo: string;
  autoSave: string;
  icVerify: string;
  verified: string;
  rinoActive: string;
  rinoPrompt: string;
  speed: string;
  highwayInfo: string;
  calling: string;
  testCrash: string;
  dialOrder: string;
  otherContacts: string;
  severity: string;
  unresponsive: string;
}

export const TRANSLATIONS: Record<Language, Translation> = {
  EN: {
    startRide: "Start Ride",
    stopRide: "Stop Ride",
    monitoring: "Monitoring Active",
    sos: "SOS",
    crashDetected: "Crash Detected!",
    cancelPrompt: "Cancelling in",
    iamOk: "I AM OK",
    emergencyContacts: "Emergency Contacts",
    medicalId: "Medical ID",
    vehicleInfo: "Vehicle Information",
    language: "Language",
    unresponsiveMsg: "Rider is unresponsive. Sending automated rescue call.",
    location: "Current Location",
    settings: "Settings",
    recording: "Emergency Recording Active",
    driveSafe: "Drive Safe",
    dashcam: "Dashcam",
    capture: "Capture",
    saveVideo: "Record",
    autoSave: "Auto-save on Crash",
    icVerify: "Verify IC",
    verified: "Verified",
    rinoActive: "Rino Listening...",
    rinoPrompt: "Say 'Hi Rino' followed by 'Call [Name]'",
    speed: "KM/H",
    highwayInfo: "Nearest Highway Segment",
    calling: "Dialing Priority Contacts",
    testCrash: "Test Crash",
    dialOrder: "Dialing Order",
    otherContacts: "Other Contacts",
    severity: "Impact Severity",
    unresponsive: "Status: Unresponsive"
  },
  CN: {
    startRide: "开始骑行",
    stopRide: "停止骑行",
    monitoring: "监控中",
    sos: "紧急求助",
    crashDetected: "检测到撞击！",
    cancelPrompt: "取消倒计时",
    iamOk: "我没事",
    emergencyContacts: "紧急联系人",
    medicalId: "医疗档案",
    vehicleInfo: "车辆信息",
    language: "语言",
    unresponsiveMsg: "骑手无响应。正在发送自动救援呼叫。",
    location: "当前位置",
    settings: "设置",
    recording: "紧急录制已开启",
    driveSafe: "一路平安",
    dashcam: "行车记录",
    capture: "截图",
    saveVideo: "录影",
    autoSave: "事故自动保存",
    icVerify: "验证身份",
    verified: "已验证",
    rinoActive: "Rino 正在听...",
    rinoPrompt: "说 'Hi Rino' 然后 '打电话给 [名字]'",
    speed: "公里/时",
    highwayInfo: "最近高速标志信息",
    calling: "正在按优先级拨号",
    testCrash: "测试模拟撞击",
    dialOrder: "拨打顺序",
    otherContacts: "其他联系人",
    severity: "撞击强度",
    unresponsive: "状态: 昏迷无响应"
  },
  BM: {
    startRide: "Mula Menunggang",
    stopRide: "Henti Menunggang",
    monitoring: "Pemantauan Aktif",
    sos: "SOS",
    crashDetected: "Kemalangan Dikesan!",
    cancelPrompt: "Batal dalam",
    iamOk: "SAYA OK",
    emergencyContacts: "Kenalan Kecemasan",
    medicalId: "ID Perubatan",
    vehicleInfo: "Maklumat Kenderaan",
    language: "Bahasa",
    unresponsiveMsg: "Penunggang tidak bertindak balas. Menghantar panggilan penyelamat automatik.",
    location: "Lokasi Semasa",
    settings: "Tetapan",
    recording: "Rakaman Kecemasan Aktif",
    driveSafe: "Tunggang Selamat",
    dashcam: "Dashcam",
    capture: "Tangkap",
    saveVideo: "Rakam",
    autoSave: "Auto-simpan Kemalangan",
    icVerify: "Sahkan IC",
    verified: "Disahkan",
    rinoActive: "Rino Mendengar...",
    rinoPrompt: "Sebut 'Hi Rino' kemudian 'Panggil [Nama]'",
    speed: "KM/J",
    highwayInfo: "Maklumat Lebuhraya Terdekat",
    calling: "Mendail Kenalan Utama",
    testCrash: "Uji Kemalangan",
    dialOrder: "Urutan Dail",
    otherContacts: "Kenalan Lain",
    severity: "Tahap Impak",
    unresponsive: "Status: Tidak Sedar Diri"
  }
};
