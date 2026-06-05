/**
 * ZEKiQ public site — Arabic · Turkish · English
 */
(function (global) {
  var LANG_KEY = "zekiq-site-lang";

  var T = {
    en: {
      meta_title: "ZEKiQ POS — Restaurant & Café POS for Windows",
      meta_desc:
        "Professional Windows POS: tables, kitchen, accounting, Android waiter app, table QR. 30-day free trial, then $150/year.",
      brand: "ZEKiQ POS",
      nav_features: "Features",
      nav_how: "How it works",
      nav_phone: "Mobile",
      nav_download: "Download",
      nav_wa: "WhatsApp",
      hero_badge: "Windows · Local network · 3 languages",
      hero_h1_a: "Fast POS",
      hero_h1_b: "clear accounting",
      hero_h1_c: "for your venue",
      hero_lead:
        "ZEKiQ POS unites tables, kitchen & bar, accounting, and Android waiters — no hidden monthly fees. {trial}.",
      hero_dl: "Download for Windows",
      hero_phone: "Connect mobile app",
      hero_note: "After install: updates inside the app (yellow banner) — no weekly re-download.",
      stat_trial: "days free trial",
      stat_langs: "UI languages",
      stat_price: "per year after trial",
      stat_lan: "Works offline on LAN",
      stat_installs: "verified device installs",
      trust_installs: "{n}+ venues installed ZEKiQ on a registered device",
      trust_installs_zero: "Verified installs — counted per device on first run",
      trust_devices: "Each install is counted once per device fingerprint",
      feat_h2: "What you actually get",
      feat_sub: "Features in the current release — no empty marketing promises.",
      feat_1_t: "Windows POS",
      feat_1_d: "Tables, takeaway, payments, X/Z, kitchen/bar printers, cashier PIN.",
      feat_2_t: "Accounting",
      feat_2_d: "Sales, expenses, suppliers, stock, payroll, reports & export.",
      feat_3_t: "Android waiter",
      feat_3_d: "Orders from phones on your LAN — paired via QR from the cashier (not from this site).",
      feat_4_t: "Table QR",
      feat_4_d: "Guests order from their browser — orders reach kitchen and cashier.",
      feat_5_t: "License & trial",
      feat_5_d: "Free month, remote activation after payment — no credit card.",
      feat_6_t: "Safe updates",
      feat_6_d: "In-app updates while keeping your sales database.",
      feat_7_t: "Backup",
      feat_7_d: "Automatic database backup on the cashier PC.",
      feat_8_t: "AR / TR / EN",
      feat_8_d: "Switch language from settings.",
      feat_9_t: "Direct support",
      feat_9_d: "WhatsApp with the vendor for activation and help.",
      alert_trans:
        '<b>Transparency:</b> Waiter APK is served from <b>your restaurant LAN</b> (cashier IP) — not a public internet link. See the <a href="phone.html">mobile guide</a>.',
      how_h2: "From download to first order",
      how_sub: "Four clear steps.",
      how_1_t: "Download & install",
      how_1_d: 'From the <a href="download.html">download page</a> — one Setup file for Windows 10/11.',
      how_2_t: "Start trial",
      how_2_d: "First month free. Activation arrives when online (or via WhatsApp).",
      how_3_t: "Pair waiter app",
      how_3_d: "Same Wi‑Fi → Settings → Garson → scan QR or open the link on the phone.",
      how_4_t: "Run daily",
      how_4_d: "Cashier + accounting + updates from the in-app yellow banner.",
      price_h2: "One clear price",
      price_sub: "No auto-charged card — pay via WhatsApp.",
      price_tag: "First month free",
      price_plan: "Annual plan",
      price_inc: "Full POS & accounting · updates · WhatsApp support · remote activation.",
      price_wa: "Subscribe via WhatsApp",
      dl_h2: "Ready to install?",
      dl_sub: 'Windows only — for phones see the <a href="phone.html">waiter guide</a>.',
      dl_btn: "Download ZEKiQ-POS-Setup.exe",
      dl_ver_extra: "In-app updates",
      foot_dl: "Download Windows",
      foot_phone: "Waiter — mobile",
      foot_tag: "POS & accounting for restaurants and cafés",
      wa_default: "Hello, I'd like to know more about ZEKiQ POS",
      wa_plan: "Hello, I want to subscribe to ZEKiQ POS — {plan}",
      wa_dl_help: "Hello, I need help downloading ZEKiQ POS",
      wa_phone_help: "Hello, I need help pairing the waiter app on my phone",
      dl_page_title: "Download ZEKiQ POS — Windows",
      dl_page_meta: "Download ZEKiQ POS installer for Windows — clean install, sales preserved.",
      dl_h1: "Download ZEKiQ POS for Windows",
      dl_p: "One click. Then run <b>ZEKiQ-POS-Setup.exe</b> — clean install, existing sales kept.",
      dl_preparing: "Preparing link…",
      dl_no_url: "Installer pending — contact WhatsApp",
      dl_btn_file: "Download {file}",
      dl_li_1: "Windows 10 or 11 (64-bit)",
      dl_li_2: "Internet for first activation only",
      dl_li_3: 'After install: <b>ZEKiQ POS</b> desktop icon',
      dl_li_4: "Later updates from inside the app",
      dl_warn:
        "<b>Windows «Unknown publisher»:</b> normal for new software. Choose <b>More info</b> then <b>Run anyway</b>.",
      dl_back_phone: "Pair waiter app →",
      dl_back_home: "Back to home",
      dl_counter: "{n} verified installs on registered devices",
      phone_title: "ZEKiQ Garson — Mobile pairing",
      phone_meta: "Pair the Android waiter app with ZEKiQ POS — QR and LAN only.",
      phone_h1: "Waiter app on your phone",
      phone_sub: "Android — same <b>Wi‑Fi network</b> as the Windows cashier",
      phone_warn:
        "<b>Important:</b> There is no public internet APK link. The app is served from <b>your cashier PC</b> only (e.g. <code>192.168.1.x:3000</code>). Built for security and LAN speed.",
      phone_s1_t: "Install cashier first",
      phone_s1_d: 'Download ZEKiQ POS on Windows from the <a href="download.html">download page</a> and run it daily.',
      phone_s2_t: "Same Wi‑Fi",
      phone_s2_d: "Waiter phone and cashier on the <b>same local network</b> — not mobile data alone.",
      phone_s3_t: "Settings → Garson",
      phone_s3_d: "On cashier: Settings → Garson — you'll see <b>QR</b> and install link.",
      phone_s4_t: "Scan QR or open link",
      phone_s4_d: "Opens install page on the cashier — choose «Open Garson» (recommended) or download APK.",
      phone_s4_ip: "Replace <b>SHOP-IP</b> with the IP shown in cashier settings (e.g. 192.168.1.49).",
      phone_s5_t: "Update the app",
      phone_s5_d: "When a new build ships, a banner appears on the phone — tap to install. Or re-open the QR link.",
      phone_fix: "<b>Not working?</b>",
      phone_fix_1: "Cashier app is running (ZEKiQ POS icon open)",
      phone_fix_2: "Phone and cashier on same Wi‑Fi",
      phone_fix_3: "Try the link manually in Chrome on the phone",
      phone_fix_4: "Play Protect → ⋮ → Install anyway if warned",
      phone_fix_5: "WhatsApp support — send the IP from Settings",
      phone_dl_first: "Download cashier first",
      phone_wa: "WhatsApp help",
      ver_prefix: "Version",
    },
    tr: {
      meta_title: "ZEKiQ POS — Restoran ve Kafe Kasa Sistemi",
      meta_desc:
        "Windows kasa: masalar, mutfak, muhasebe, garson Android, masa QR. 30 gün ücretsiz, sonra yıllık $150.",
      brand: "ZEKiQ POS",
      nav_features: "Özellikler",
      nav_how: "Nasıl çalışır",
      nav_phone: "Telefon",
      nav_download: "İndir",
      nav_wa: "WhatsApp",
      hero_badge: "Windows · Yerel ağ · 3 dil",
      hero_h1_a: "Hızlı kasa",
      hero_h1_b: "net muhasebe",
      hero_h1_c: "işletmeniz için",
      hero_lead:
        "ZEKiQ POS masalar, mutfak & bar, muhasebe ve Android garsonu bir araya getirir — gizli aylık ücret yok. {trial}.",
      hero_dl: "Windows için indir",
      hero_phone: "Telefonu bağla",
      hero_note: "Kurulumdan sonra: güncellemeler uygulama içinden (sarı şerit).",
      stat_trial: "gün ücretsiz deneme",
      stat_langs: "arayüz dili",
      stat_price: "denemeden sonra yıllık",
      stat_lan: "LAN'da internetsiz çalışır",
      stat_installs: "doğrulanmış cihaz kurulumu",
      trust_installs: "{n}+ işletme kayıtlı cihazda ZEKiQ kurdu",
      trust_installs_zero: "Doğrulanmış kurulumlar — ilk çalıştırmada cihaz başına",
      trust_devices: "Her kurulum cihaz parmak izi ile bir kez sayılır",
      feat_h2: "Gerçekten ne alırsınız",
      feat_sub: "Mevcut sürümdeki özellikler — boş vaat yok.",
      feat_1_t: "Windows kasa",
      feat_1_d: "Masalar, paket, ödeme, X/Z, mutfak/bar yazıcı, kasiyer PIN.",
      feat_2_t: "Muhasebe",
      feat_2_d: "Satış, gider, tedarikçi, stok, maaş, rapor ve dışa aktarma.",
      feat_3_t: "Android garson",
      feat_3_d: "Telefondan sipariş — kasadan QR ile (bu siteden değil).",
      feat_4_t: "Masa QR",
      feat_4_d: "Müşteri tarayıcıdan sipariş verir — mutfağa ve kasaya düşer.",
      feat_5_t: "Lisans & deneme",
      feat_5_d: "Ücretsiz ay, ödeme sonrası uzaktan aktivasyon — kredi kartı yok.",
      feat_6_t: "Güvenli güncelleme",
      feat_6_d: "Satış veritabanı korunarak uygulama içi güncelleme.",
      feat_7_t: "Yedekleme",
      feat_7_d: "Kasada otomatik veritabanı yedeği.",
      feat_8_t: "AR / TR / EN",
      feat_8_d: "Dili ayarlardan değiştirin.",
      feat_9_t: "Doğrudan destek",
      feat_9_d: "Aktivasyon ve yardım için WhatsApp.",
      alert_trans:
        '<b>Şeffaflık:</b> Garson APK <b>restoran LAN</b> üzerinden (kasa IP) — genel internet linki değil. <a href="phone.html">Telefon rehberi</a>.',
      how_h2: "İndirmeden ilk siparişe",
      how_sub: "Dört net adım.",
      how_1_t: "İndir & kur",
      how_1_d: '<a href="download.html">İndirme sayfası</a> — Windows 10/11 için tek Setup.',
      how_2_t: "Denemeyi başlat",
      how_2_d: "İlk ay ücretsiz. İnternet ile otomatik aktivasyon (veya WhatsApp).",
      how_3_t: "Garsonu bağla",
      how_3_d: "Aynı Wi‑Fi → Ayarlar → Garson → QR okut veya linki aç.",
      how_4_t: "Günlük kullan",
      how_4_d: "Kasa + muhasebe + sarı şerit güncellemeleri.",
      price_h2: "Tek net fiyat",
      price_sub: "Otomatik kart çekimi yok — WhatsApp ile ödeme.",
      price_tag: "İlk ay ücretsiz",
      price_plan: "Yıllık plan",
      price_inc: "Tam kasa & muhasebe · güncellemeler · WhatsApp · uzaktan aktivasyon.",
      price_wa: "WhatsApp ile abone ol",
      dl_h2: "Kurmaya hazır mısınız?",
      dl_sub: 'Sadece Windows — telefon için <a href="phone.html">garson rehberi</a>.',
      dl_btn: "ZEKiQ-POS-Setup.exe indir",
      dl_ver_extra: "Uygulama içi güncellemeler",
      foot_dl: "Windows indir",
      foot_phone: "Garson — telefon",
      foot_tag: "Restoran ve kafeler için kasa ve muhasebe",
      wa_default: "Merhaba, ZEKiQ POS hakkında bilgi almak istiyorum",
      wa_plan: "Merhaba, ZEKiQ POS aboneliği istiyorum — {plan}",
      wa_dl_help: "Merhaba, ZEKiQ POS indirme konusunda yardım lazım",
      wa_phone_help: "Merhaba, garson uygulamasını bağlamak için yardım lazım",
      dl_page_title: "ZEKiQ POS İndir — Windows",
      dl_page_meta: "ZEKiQ POS Windows kurulum dosyası — temiz kurulum, satışlar korunur.",
      dl_h1: "Windows için ZEKiQ POS",
      dl_p: "Tek tık. Sonra <b>ZEKiQ-POS-Setup.exe</b> — temiz kurulum, mevcut satışlar kalır.",
      dl_preparing: "Link hazırlanıyor…",
      dl_no_url: "Kurulum bekliyor — WhatsApp",
      dl_btn_file: "{file} indir",
      dl_li_1: "Windows 10 veya 11 (64-bit)",
      dl_li_2: "İlk aktivasyon için internet",
      dl_li_3: "Kurulumdan sonra: <b>ZEKiQ POS</b> masaüstü simgesi",
      dl_li_4: "Sonraki güncellemeler uygulama içinden",
      dl_warn:
        "<b>Windows «Bilinmeyen yayıncı»:</b> yeni yazılımlarda normal. <b>More info</b> → <b>Run anyway</b>.",
      dl_back_phone: "Garsonu bağla →",
      dl_back_home: "Ana sayfa",
      dl_counter: "{n} kayıtlı cihazda doğrulanmış kurulum",
      phone_title: "ZEKiQ Garson — Telefon eşleştirme",
      phone_meta: "Android garson uygulamasını ZEKiQ POS ile eşleştirin — QR ve LAN.",
      phone_h1: "Telefonda garson uygulaması",
      phone_sub: "Android — Windows kasa ile <b>aynı Wi‑Fi</b>",
      phone_warn:
        "<b>Önemli:</b> Genel internet APK linki yok. Uygulama yalnızca <b>kasa PC</b> üzerinden (ör. <code>192.168.1.x:3000</code>).",
      phone_s1_t: "Önce kasayı kurun",
      phone_s1_d: '<a href="download.html">İndirme sayfası</a>ndan Windows kurulumu yapın.',
      phone_s2_t: "Aynı Wi‑Fi",
      phone_s2_d: "Garson telefonu ve kasa <b>aynı yerel ağda</b>.",
      phone_s3_t: "Ayarlar → Garson",
      phone_s3_d: "Kasada: Ayarlar → Garson — <b>QR</b> ve kurulum linki.",
      phone_s4_t: "QR okut veya link aç",
      phone_s4_d: "Kasada kurulum sayfası — «Garson Aç» (önerilen) veya APK.",
      phone_s4_ip: "<b>SHOP-IP</b> yerine kasa ayarlarındaki IP (ör. 192.168.1.49).",
      phone_s5_t: "Uygulamayı güncelle",
      phone_s5_d: "Yeni sürümde telefonda şerit çıkar — dokunun. Veya QR linkini tekrar açın.",
      phone_fix: "<b>Çalışmıyor mu?</b>",
      phone_fix_1: "Kasa uygulaması açık (ZEKiQ POS)",
      phone_fix_2: "Telefon ve kasa aynı Wi‑Fi",
      phone_fix_3: "Chrome'da linki elle deneyin",
      phone_fix_4: "Play Protect → ⋮ → Yine de yükle",
      phone_fix_5: "WhatsApp — Ayarlardaki IP'yi gönderin",
      phone_dl_first: "Önce kasayı indir",
      phone_wa: "WhatsApp yardım",
      ver_prefix: "Sürüm",
    },
    ar: {
      meta_title: "ZEKiQ POS — كاشير ومحاسبة للمطاعم",
      meta_desc:
        "كاشير Windows احترافي: طاولات، مطبخ، محاسبة، جرسون أندرويد، QR. شهر مجاني ثم 150$ سنوياً.",
      brand: "ZEKiQ POS",
      nav_features: "المزايا",
      nav_how: "كيف يعمل",
      nav_phone: "الهاتف",
      nav_download: "تحميل",
      nav_wa: "واتساب",
      hero_badge: "Windows · شبكة محلية · 3 لغات",
      hero_h1_a: "كاشير سريع",
      hero_h1_b: "ومحاسبة واضحة",
      hero_h1_c: "لمطعمك",
      hero_lead:
        "ZEKiQ POS يجمع الطاولات، المطبخ والبار، المحاسبة، والجرسون على أندرويد — بدون اشتراك شهري مخفي. {trial}.",
      hero_dl: "تحميل Windows",
      hero_phone: "ربط الهاتف",
      hero_note: "بعد التثبيت: التحديثات من داخل البرنامج (شريط أصفر).",
      stat_trial: "يوم تجربة مجانية",
      stat_langs: "لغات الواجهة",
      stat_price: "سنوياً بعد التجربة",
      stat_lan: "يعمل على الشبكة المحلية",
      stat_installs: "تثبيت موثّق على جهاز",
      trust_installs: "{n}+ منشأة ثبّتت ZEKiQ على جهاز مسجّل",
      trust_installs_zero: "تثبيتات موثّقة — تُحسب لكل جهاز عند أول تشغيل",
      trust_devices: "كل تثبيت يُحسب مرة واحدة لبصمة الجهاز",
      feat_h2: "ما الذي تحصل عليه فعلاً",
      feat_sub: "مزايا موجودة في النسخة الحالية — بدون وعود فارغة.",
      feat_1_t: "كاشير Windows",
      feat_1_d: "طاولات، باكيت، دفع، X/Z، طابعات مطبخ/بار، PIN للمحاسبين.",
      feat_2_t: "محاسبة",
      feat_2_d: "مبيعات، مصروفات، موردون، مخزون، رواتب، تقارير وتصدير.",
      feat_3_t: "جرسون Android",
      feat_3_d: "طلبات من الهاتف على شبكة المحل — يُربط عبر QR من الكاشير (ليس من هذا الموقع).",
      feat_4_t: "QR من الطاولة",
      feat_4_d: "الزبون يطلب من متصفح هاتفه — يصل للمطبخ والكاشير.",
      feat_5_t: "ترخيص وتجربة",
      feat_5_d: "شهر مجاني، تفعيل عن بُعد بعد الدفع — بدون بطاقة بنكية.",
      feat_6_t: "تحديثات آمنة",
      feat_6_d: "تحديث من داخل البرنامج مع الحفاظ على قاعدة المبيعات.",
      feat_7_t: "نسخ احتياطي",
      feat_7_d: "نسخ تلقائي لقاعدة البيانات على جهاز الكاشير.",
      feat_8_t: "عربي / تركي / إنجليزي",
      feat_8_d: "واجهة متعددة اللغات من الإعدادات.",
      feat_9_t: "دعم مباشر",
      feat_9_d: "تواصل واتساب مع البائع للتفعيل والمساعدة.",
      alert_trans:
        '<b>شفافية:</b> تطبيق الجرسون يُحمّل من <b>شبكة مطعمك</b> (IP الكاشير) — ليس رابطاً عاماً. <a href="phone.html">صفحة الهاتف</a>.',
      how_h2: "من التحميل إلى أول طلب",
      how_sub: "أربع خطوات واضحة.",
      how_1_t: "حمّل وثبّت",
      how_1_d: 'من <a href="download.html">صفحة التحميل</a> — ملف Setup لـ Windows 10/11.',
      how_2_t: "ابدأ التجربة",
      how_2_d: "الشهر الأول مجاني. التفعيل عند الاتصال بالإنترنت (أو واتساب).",
      how_3_t: "اربط الجرسون",
      how_3_d: "نفس الواي فاي → الإعدادات → غارسون → امسح QR.",
      how_4_t: "اعمل يومياً",
      how_4_d: "كاشير + محاسبة + تحديثات من الشريط الأصفر.",
      price_h2: "سعر واحد واضح",
      price_sub: "لا اشتراك تلقائي ببطاقة — الدفع عبر واتساب.",
      price_tag: "شهر أول مجاني",
      price_plan: "اشتراك سنوي",
      price_inc: "كل المزايا · تحديثات · دعم واتساب · تفعيل عن بُعد.",
      price_wa: "اشترك عبر واتساب",
      dl_h2: "جاهز للتثبيت؟",
      dl_sub: 'Windows فقط — للهاتف <a href="phone.html">دليل الجرسون</a>.',
      dl_btn: "تحميل ZEKiQ-POS-Setup.exe",
      dl_ver_extra: "تحديثات من داخل البرنامج",
      foot_dl: "تحميل Windows",
      foot_phone: "الجرسون — الهاتف",
      foot_tag: "كاشير ومحاسبة للمطاعم والكافيهات",
      wa_default: "مرحباً، أريد معرفة المزيد عن ZEKiQ POS",
      wa_plan: "مرحباً، أريد الاشتراك في ZEKiQ POS — {plan}",
      wa_dl_help: "مرحباً، أحتاج مساعدة في تحميل ZEKiQ POS",
      wa_phone_help: "مرحباً، أحتاج مساعدة في ربط تطبيق الجرسون",
      dl_page_title: "تحميل ZEKiQ POS — Windows",
      dl_page_meta: "تحميل مثبّت ZEKiQ POS لـ Windows — تثبيت نظيف مع الحفاظ على المبيعات.",
      dl_h1: "تحميل ZEKiQ POS لـ Windows",
      dl_p: "اضغط مرة واحدة. شغّل <b>ZEKiQ-POS-Setup.exe</b> — تثبيت نظيف ويحافظ على المبيعات.",
      dl_preparing: "جاري تجهيز الرابط…",
      dl_no_url: "المثبّت قيد النشر — واتساب",
      dl_btn_file: "تحميل {file}",
      dl_li_1: "Windows 10 أو 11 (64-bit)",
      dl_li_2: "إنترنت للتفعيل الأول فقط",
      dl_li_3: "بعد التثبيت: أيقونة <b>ZEKiQ POS</b>",
      dl_li_4: "التحديثات اللاحقة من داخل البرنامج",
      dl_warn:
        "<b>تنبيه Windows «ناشر غير معروف»:</b> طبيعي. اختر <b>More info</b> ثم <b>Run anyway</b>.",
      dl_back_phone: "ربط هاتف الجرسون ←",
      dl_back_home: "العودة للرئيسية",
      dl_counter: "{n} تثبيت موثّق على أجهزة مسجّلة",
      phone_title: "ZEKiQ Garson — ربط الهاتف",
      phone_meta: "ربط تطبيق الجرسون على Android — QR وشبكة المحل فقط.",
      phone_h1: "تطبيق الجرسون على الهاتف",
      phone_sub: "Android — <b>نفس شبكة الواي فاي</b> مع كاشير Windows",
      phone_warn:
        "<b>مهم:</b> لا يوجد رابط عام لتحميل الجرسون. التطبيق من <b>جهاز الكاشير</b> فقط (مثل <code>192.168.1.x:3000</code>).",
      phone_s1_t: "ثبّت الكاشير أولاً",
      phone_s1_d: 'حمّل من <a href="download.html">صفحة التحميل</a> وشغّل البرنامج.',
      phone_s2_t: "نفس الواي فاي",
      phone_s2_d: "هاتف الجرسون والكاشير على <b>نفس شبكة المحل</b>.",
      phone_s3_t: "الإعدادات → غارسون",
      phone_s3_d: "من الكاشير: الإعدادات → غارسون — <b>QR</b> ورابط التثبيت.",
      phone_s4_t: "امسح QR أو افتح الرابط",
      phone_s4_d: "صفحة التثبيت على الكاشير — «فتح Garson» أو حمّل APK.",
      phone_s4_ip: "استبدل <b>SHOP-IP</b> بـ IP الإعدادات (مثل 192.168.1.49).",
      phone_s5_t: "تحديث التطبيق",
      phone_s5_d: "عند التحديث يظهر شريط على الهاتف — أو أعد فتح QR.",
      phone_fix: "<b>لا يعمل؟</b>",
      phone_fix_1: "الكاشير يعمل (أيقونة ZEKiQ POS مفتوحة)",
      phone_fix_2: "الهاتف والكاشير على نفس الواي فاي",
      phone_fix_3: "افتح الرابط يدوياً في Chrome",
      phone_fix_4: "Play Protect → ⋮ → تثبيت على أي حال",
      phone_fix_5: "واتساب — أرسل IP من الإعدادات",
      phone_dl_first: "تحميل الكاشير أولاً",
      phone_wa: "مساعدة واتساب",
      ver_prefix: "الإصدار",
    },
  };

  function detectLang() {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved && T[saved]) return saved;
    var nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ar")) return "ar";
    if (nav.startsWith("tr")) return "tr";
    return "en";
  }

  function getLang() {
    return global.__zekiqLang || detectLang();
  }

  function setLang(code) {
    if (!T[code]) return;
    global.__zekiqLang = code;
    localStorage.setItem(LANG_KEY, code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", code === "ar");
    document.body.classList.toggle("ltr", code !== "ar");
    apply();
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-lang") === code);
    });
  }

  function tr(key, vars) {
    var lang = getLang();
    var s = (T[lang] && T[lang][key]) || (T.en[key] || key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var html = el.getAttribute("data-i18n-html") === "1";
      var trial = el.getAttribute("data-trial-note") !== null;
      var text = tr(key, trial ? { trial: "" } : undefined);
      if (trial) {
        var noteEl = document.querySelector("[data-trial-note]");
        var note = noteEl ? noteEl.textContent : "";
        text = tr(key, { trial: note });
      }
      if (html) el.innerHTML = text;
      else el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-html-only]").forEach(function (el) {
      el.innerHTML = tr(el.getAttribute("data-i18n-html-only"));
    });
    var titleKey = document.body.getAttribute("data-i18n-title");
    if (titleKey) document.title = tr(titleKey);
    var metaKey = document.body.getAttribute("data-i18n-meta");
    if (metaKey) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", tr(metaKey));
    }
  }

  function initLangSwitcher() {
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
        if (global.ZekiqSite && global.ZekiqSite.onLangChange) {
          global.ZekiqSite.onLangChange();
        }
      });
    });
    setLang(detectLang());
  }

  global.ZekiqI18n = { tr: tr, getLang: getLang, setLang: setLang, apply: apply, init: initLangSwitcher, T: T };
})(window);
