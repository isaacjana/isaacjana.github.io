/**
 * Ocean - languages (English, Bahasa Malaysia, Chinese).
 *
 * The app is written in English. This module watches the page and swaps any
 * text it knows for the chosen language, so screens need no special markup.
 * Text it does not know (supplier-only screens, names, addresses) stays as is.
 * Customer, driver and tracking screens are covered.
 */
const KEY = 'ocean_lang';
export const LANGS = [['en', 'English'], ['ms', 'Bahasa Malaysia'], ['zh', '中文']];
export const getLang = () => localStorage.getItem(KEY) || 'en';

// English: [Bahasa Malaysia, Chinese]
const DICT = {
    // Sign-in and navigation
    'Live seafood, delivered.': ['Makanan laut hidup, dihantar.', '鲜活海鲜，送货上门。'],
    'Order, pack, track the driver live and invoice, all in one place.': ['Pesan, bungkus, jejak pemandu secara langsung dan invois, semuanya di satu tempat.', '下单、打包、实时追踪司机、开发票，一站完成。'],
    'Sign in with Google': ['Log masuk dengan Google', '使用 Google 登录'],
    'Try the demo (no account)': ['Cuba demo (tanpa akaun)', '试用演示（无需账号）'],
    'Track a delivery': ['Jejak penghantaran', '追踪配送'],
    'Track a delivery by code': ['Jejak penghantaran dengan kod', '用代码追踪配送'],
    'Demo mode: pick who you want to be': ['Mod demo: pilih peranan anda', '演示模式：选择您的身份'],
    'Use my real account': ['Guna akaun sebenar saya', '使用我的真实账号'],
    'Demo mode: nothing here is real, and it stays on this device.': ['Mod demo: tiada yang benar di sini, dan ia kekal pada peranti ini.', '演示模式：这里的数据都不是真实的，只保存在本设备。'],
    'Supplier (admin)': ['Pembekal (admin)', '供应商（管理员）'],
    'Customer (restaurant)': ['Pelanggan (restoran)', '客户（餐馆）'],
    'Quote, pack, assign drivers, invoice': ['Sebut harga, bungkus, tugaskan pemandu, invois', '报价、打包、分配司机、开发票'],
    'Order live seafood and track delivery': ['Pesan makanan laut hidup dan jejak penghantaran', '订购鲜活海鲜并追踪配送'],
    'Pick up jobs and share live location': ['Ambil tugasan dan kongsi lokasi langsung', '接单并分享实时位置'],
    'Supplier': ['Pembekal', '供应商'], 'Customer': ['Pelanggan', '客户'], 'Driver': ['Pemandu', '司机'],
    'Shop': ['Kedai', '商店'], 'My orders': ['Pesanan saya', '我的订单'], 'Account': ['Akaun', '账户'],
    'Jobs': ['Tugasan', '任务'], 'Done': ['Selesai', '已完成'],
    'Offline': ['Luar talian', '离线'], 'Sharing location': ['Berkongsi lokasi', '正在分享位置'], 'Location off': ['Lokasi dimatikan', '定位已关闭'], 'Finding GPS…': ['Mencari GPS…', '正在定位…'],
    'Back online': ['Kembali dalam talian', '已恢复联网'],
    'No connection. Changes are kept and sent when you are back online.': ['Tiada sambungan. Perubahan disimpan dan dihantar apabila anda kembali dalam talian.', '没有网络。更改已保存，联网后会自动发送。'],

    // Statuses
    'Requested': ['Diminta', '已提交'], 'Quote sent': ['Sebut harga dihantar', '已报价'], 'Confirmed': ['Disahkan', '已确认'],
    'Packed': ['Dibungkus', '已打包'], 'On the way': ['Dalam perjalanan', '配送中'], 'Delivered': ['Dihantar', '已送达'], 'Cancelled': ['Dibatalkan', '已取消'],
    'Request': ['Minta', '提交'], 'Quote': ['Harga', '报价'], 'Confirm': ['Sah', '确认'], 'Pack': ['Bungkus', '打包'], 'On way': ['Jalan', '配送'],
    'Waiting for the supplier to confirm weights and prices': ['Menunggu pembekal mengesahkan berat dan harga', '等待供应商确认重量和价格'],
    'Waiting for the customer to accept the quote': ['Menunggu pelanggan menerima sebut harga', '等待客户接受报价'],
    'Waiting to be packed': ['Menunggu untuk dibungkus', '等待打包'],
    'Packed and waiting for the driver': ['Sudah dibungkus dan menunggu pemandu', '已打包，等待司机'],
    'The driver is on the way': ['Pemandu dalam perjalanan', '司机正在路上'],
    'This order was cancelled': ['Pesanan ini telah dibatalkan', '此订单已取消'],
    'Paid': ['Dibayar', '已付款'], 'Unpaid': ['Belum dibayar', '未付款'],
    'Cash on delivery': ['Tunai semasa penghantaran', '货到付款'], 'Bank transfer': ['Pindahan bank', '银行转账'], 'Credit terms': ['Terma kredit', '赊账'],

    // Shop and checkout
    "Today's live catch": ['Tangkapan hidup hari ini', '今日鲜活海鲜'],
    'Live seafood is weighed when packed. You approve the final price before it ships.': ['Makanan laut hidup ditimbang semasa dibungkus. Anda meluluskan harga akhir sebelum dihantar.', '鲜活海鲜在打包时称重。发货前由您确认最终价格。'],
    'Search seafood': ['Cari makanan laut', '搜索海鲜'],
    'Out of stock': ['Kehabisan stok', '缺货'], 'Your price': ['Harga anda', '您的专属价'],
    'Nothing matches your search.': ['Tiada padanan untuk carian anda.', '没有符合搜索的商品。'],
    'The catch list is empty right now. Check back soon.': ['Senarai tangkapan kosong sekarang. Sila semak semula nanti.', '目前没有商品，请稍后再来。'],
    'Add your delivery address before ordering.': ['Tambah alamat penghantaran anda sebelum memesan.', '下单前请先添加送货地址。'],
    'Add': ['Tambah', '添加'], 'Review order': ['Semak pesanan', '查看订单'], 'Review your order': ['Semak pesanan anda', '核对订单'],
    'Delivery': ['Penghantaran', '运费'], 'Estimated total': ['Anggaran jumlah', '预计总额'], 'Total': ['Jumlah', '总计'],
    'Live seafood is sold by actual weight. We weigh your order, send the final price, and only pack once you accept.': ['Makanan laut hidup dijual mengikut berat sebenar. Kami menimbang pesanan anda, menghantar harga akhir, dan hanya membungkus selepas anda terima.', '鲜活海鲜按实际重量计价。我们称重后发送最终价格，您接受后才会打包。'],
    'Deliver to': ['Hantar ke', '送货至'], 'Delivery day': ['Hari penghantaran', '送货日期'], 'Time': ['Masa', '时间'],
    'As soon as possible': ['Secepat mungkin', '尽快'], 'Payment': ['Bayaran', '付款方式'],
    'Notes for the supplier': ['Nota untuk pembekal', '给供应商的备注'],
    'Send order request': ['Hantar permintaan pesanan', '提交订单'],
    'Order sent. We will confirm the weights shortly.': ['Pesanan dihantar. Kami akan mengesahkan berat sebentar lagi.', '订单已发送，我们会尽快确认重量。'],
    'No map pin: arrival time will not be shown.': ['Tiada pin peta: masa ketibaan tidak akan dipaparkan.', '未设置地图位置：无法显示到达时间。'],

    // Orders
    'No orders in progress.': ['Tiada pesanan sedang diproses.', '没有进行中的订单。'], 'Earlier': ['Terdahulu', '较早的订单'],
    'Review and accept the quote': ['Semak dan terima sebut harga', '查看并接受报价'],
    'History': ['Sejarah', '记录'], 'To collect': ['Untuk dikutip', '应收金额'],
    'Cancel order': ['Batal pesanan', '取消订单'], 'Decline': ['Tolak', '拒绝'], 'Order again': ['Pesan lagi', '再次订购'],
    'Track live': ['Jejak langsung', '实时追踪'], 'Track delivery': ['Jejak penghantaran', '追踪配送'], 'Live tracking': ['Penjejakan langsung', '实时追踪'],
    'Share': ['Kongsi', '分享'], 'Share tracking link': ['Kongsi pautan penjejakan', '分享追踪链接'],
    'Driver is on the way': ['Pemandu dalam perjalanan', '司机正在路上'], 'Tracking link is ready': ['Pautan penjejakan sedia', '追踪链接已生成'],
    'Anyone with the link can follow this delivery.': ['Sesiapa yang mempunyai pautan boleh mengikuti penghantaran ini.', '任何拥有链接的人都可以查看此配送。'],
    'Tap to view, download or share': ['Ketik untuk lihat, muat turun atau kongsi', '点击查看、下载或分享'],
    'Message supplier': ['Mesej pembekal', '联系供应商'], 'Pay by QR': ['Bayar dengan QR', '扫码付款'],
    'Delivery photo': ['Gambar penghantaran', '送达照片'], 'Repeat weekly': ['Ulang setiap minggu', '每周重复'],
    'Cancel this order?': ['Batalkan pesanan ini?', '取消此订单？'], 'Decline this quote?': ['Tolak sebut harga ini?', '拒绝此报价？'],
    'This cannot be undone.': ['Ini tidak boleh dibuat asal.', '此操作无法撤销。'], 'Yes, cancel': ['Ya, batal', '是，取消'], 'Keep it': ['Kekalkan', '保留'],
    'Order cancelled': ['Pesanan dibatalkan', '订单已取消'],
    'Quote accepted. We are packing your order.': ['Sebut harga diterima. Kami sedang membungkus pesanan anda.', '已接受报价，我们正在为您打包。'],
    'Items added. Check quantities, then review.': ['Barang ditambah. Semak kuantiti, kemudian semak pesanan.', '商品已添加。请核对数量后提交。'],
    'Amount': ['Jumlah', '金额'], 'Invoice': ['Invois', '发票'], 'Link copied': ['Pautan disalin', '链接已复制'],

    // Account
    'Name': ['Nama', '姓名'], 'Store': ['Kedai', '店铺'], 'Delivery address': ['Alamat penghantaran', '送货地址'], 'Map pin': ['Pin peta', '地图位置'],
    'Set': ['Ditetapkan', '已设置'], 'Not set': ['Belum ditetapkan', '未设置'], 'Phone': ['Telefon', '电话'], 'Vehicle': ['Kenderaan', '车辆'],
    'TIN (for e-invoice)': ['TIN (untuk e-invois)', '税号（电子发票用）'], 'Edit details': ['Ubah butiran', '编辑资料'],
    'Set your map pin so the driver finds you and you get an accurate arrival time.': ['Tetapkan pin peta supaya pemandu dapat mencari anda dan anda mendapat masa ketibaan yang tepat.', '请设置地图位置，方便司机找到您并显示准确的到达时间。'],
    'Sign out': ['Log keluar', '退出登录'], 'Switch demo role': ['Tukar peranan demo', '切换演示身份'], 'Reset demo data': ['Set semula data demo', '重置演示数据'],
    'Turn on alerts': ['Hidupkan makluman', '开启提醒'], 'Alerts are on: tap to turn off': ['Makluman dihidupkan: ketik untuk matikan', '提醒已开启：点击关闭'],
    'Monthly statement': ['Penyata bulanan', '月结单'], 'Repeat orders': ['Pesanan berulang', '定期订单'], 'Stop': ['Henti', '停止'],
    'My details': ['Butiran saya', '我的资料'], 'Welcome to Ocean': ['Selamat datang ke Ocean', '欢迎使用 Ocean'],
    'Tell us where to deliver. You can start ordering straight away.': ['Beritahu kami tempat penghantaran. Anda boleh mula memesan dengan segera.', '请告诉我们送货地址，您可以立即开始下单。'],
    'Add your contact details so customers can reach you.': ['Tambah butiran hubungan anda supaya pelanggan boleh menghubungi anda.', '请填写联系方式，方便客户联系您。'],
    'Store / restaurant name': ['Nama kedai / restoran', '店铺 / 餐馆名称'], 'Set map pin': ['Tetapkan pin peta', '设置地图位置'], 'Map pin set: change': ['Pin peta ditetapkan: tukar', '地图位置已设置：修改'],
    'TIN (for e-invoice, optional)': ['TIN (untuk e-invois, pilihan)', '税号（电子发票用，可选）'], 'Plate number': ['Nombor plat', '车牌号'],
    'Save': ['Simpan', '保存'], 'Saved': ['Disimpan', '已保存'], 'Save pin': ['Simpan pin', '保存位置'],
    'Tap the map where the driver should arrive.': ['Ketik peta di tempat pemandu perlu tiba.', '请在地图上点击司机应到达的位置。'],
    'Search an address': ['Cari alamat', '搜索地址'], 'Find': ['Cari', '查找'], 'Use where I am now': ['Guna lokasi saya sekarang', '使用我现在的位置'],
    'Repeat this order': ['Ulang pesanan ini', '重复此订单'], 'Deliver every': ['Hantar setiap', '每逢以下日子送货'], 'Save repeat order': ['Simpan pesanan berulang', '保存定期订单'],
    'The order is created for you the day before each delivery. Prices follow the price list on that day, and you still approve the weighed quote.': ['Pesanan dibuat untuk anda sehari sebelum setiap penghantaran. Harga mengikut senarai harga pada hari itu, dan anda masih meluluskan sebut harga selepas ditimbang.', '系统会在每次送货前一天自动为您下单。价格以当天价目为准，称重后的报价仍需您确认。'],
    'Mon': ['Isn', '周一'], 'Tue': ['Sel', '周二'], 'Wed': ['Rab', '周三'], 'Thu': ['Kha', '周四'], 'Fri': ['Jum', '周五'], 'Sat': ['Sab', '周六'], 'Sun': ['Ahd', '周日'],
    'Month': ['Bulan', '月份'], 'Statement PDF': ['Penyata PDF', '结单 PDF'], 'Balance due': ['Baki perlu dibayar', '应付余额'], 'No invoices in this month.': ['Tiada invois pada bulan ini.', '本月没有发票。'],

    // Driver
    'My deliveries': ['Penghantaran saya', '我的配送'], 'Waiting for a driver': ['Menunggu pemandu', '等待司机接单'],
    'Nothing assigned to you yet.': ['Belum ada tugasan untuk anda.', '暂时没有分配给您的任务。'], 'No open jobs right now.': ['Tiada tugasan terbuka sekarang.', '目前没有可接的任务。'],
    'Open job': ['Buka tugasan', '打开任务'], 'Continue delivery': ['Teruskan penghantaran', '继续配送'], 'Take this job': ['Ambil tugasan ini', '接此任务'],
    'Stops are listed nearest first. Each customer sees how many stops come before theirs.': ['Hentian disenaraikan dari yang terdekat. Setiap pelanggan nampak berapa hentian sebelum giliran mereka.', '停靠点按由近到远排列。每位客户都能看到在他们之前还有几站。'],
    'Release': ['Lepaskan', '放弃'], 'Map': ['Peta', '导航'], 'Start': ['Mula', '出发'], 'Simulate': ['Simulasi', '模拟'],
    'Collect on delivery': ['Kutip semasa penghantaran', '送达时收款'], 'Already paid': ['Sudah dibayar', '已付款'],
    'Call customer': ['Hubungi pelanggan', '致电客户'], 'Call': ['Panggil', '致电'],
    'Finding your position…': ['Mencari kedudukan anda…', '正在获取您的位置…'], 'Try again': ['Cuba lagi', '重试'],
    'Job is yours': ['Tugasan ini milik anda', '任务已接'], 'Job returned to the board': ['Tugasan dikembalikan ke papan', '任务已退回'],
    'Delivery started. Sharing your location.': ['Penghantaran bermula. Lokasi anda dikongsi.', '配送已开始，正在分享您的位置。'],
    'Confirm delivery': ['Sahkan penghantaran', '确认送达'], 'Received by': ['Diterima oleh', '签收人'], 'Paid by': ['Dibayar dengan', '支付方式'],
    'Cash': ['Tunai', '现金'], 'Bank transfer / QR': ['Pindahan bank / QR', '银行转账 / 二维码'],
    'Already paid. Nothing to collect.': ['Sudah dibayar. Tiada yang perlu dikutip.', '已付款，无需收款。'],
    'Add a delivery photo': ['Tambah gambar penghantaran', '添加送达照片'], 'Retake photo': ['Ambil semula gambar', '重新拍照'],
    'A photo of the goods at the door settles any later question about the delivery.': ['Gambar barang di pintu menyelesaikan sebarang pertikaian kemudian tentang penghantaran.', '在门口拍下货物照片，日后如有疑问可作凭证。'],
    'Let the customer scan this to pay': ['Biarkan pelanggan imbas ini untuk membayar', '请客户扫描此码付款'],
    'Delivery completed': ['Penghantaran selesai', '配送完成'],
    'Delivered today': ['Dihantar hari ini', '今日已送达'], 'Cash to hand in': ['Tunai untuk diserahkan', '需上交现金'],
    'Your completed deliveries will be listed here.': ['Penghantaran yang selesai akan disenaraikan di sini.', '完成的配送会显示在这里。'],

    // Tracking
    'Delivery tracking': ['Penjejakan penghantaran', '配送追踪'], 'Track your delivery': ['Jejak penghantaran anda', '追踪您的配送'],
    'Enter the tracking code from your supplier, or open the link they sent you.': ['Masukkan kod penjejakan daripada pembekal anda, atau buka pautan yang dihantar.', '请输入供应商提供的追踪码，或打开他们发给您的链接。'],
    'Tracking code': ['Kod penjejakan', '追踪码'], 'Track': ['Jejak', '追踪'], 'Open Ocean': ['Buka Ocean', '打开 Ocean'],
    'No delivery matches that code. Check it and try again.': ['Tiada penghantaran sepadan dengan kod itu. Semak dan cuba lagi.', '没有找到对应的配送。请核对后重试。'],
    'Live tracking starts when the driver sets off': ['Penjejakan langsung bermula apabila pemandu bertolak', '司机出发后开始实时追踪'],
    'The driver has set off. Waiting for the first GPS position…': ['Pemandu telah bertolak. Menunggu kedudukan GPS pertama…', '司机已出发，正在等待第一个 GPS 位置…'],
    'Working out the route…': ['Mengira laluan…', '正在计算路线…'], 'Your driver': ['Pemandu anda', '您的司机'],
    'When': ['Bila', '时间'], 'Items': ['Barang', '商品'], 'Address not set': ['Alamat belum ditetapkan', '未设置地址'],
    '1 stop before yours': ['1 hentian sebelum anda', '在您之前还有 1 站'],
    'The map could not be loaded, but the status below is live.': ['Peta tidak dapat dimuatkan, tetapi status di bawah adalah langsung.', '地图无法加载，但下方状态是实时的。'],
    'Today': ['Hari ini', '今天'], 'Tomorrow': ['Esok', '明天'], 'just now': ['baru sahaja', '刚刚']
};

// Text with numbers or names in it: [pattern, (match) => [ms, zh]]
const PATTERNS = [
    [/^(\d+) items? · est\. (RM [\d,.]+)$/, (m) => [`${m[1]} barang · angg. ${m[2]}`, `${m[1]} 件商品 · 预计 ${m[2]}`]],
    [/^([\d.]+) (\S+) available$/, (m) => [`${m[1]} ${m[2]} tersedia`, `可订 ${m[1]} ${m[2]}`]],
    [/^Est\. (RM [\d,.]+)$/, (m) => [`Angg. ${m[1]}`, `预计 ${m[1]}`]],
    [/^Accept (RM [\d,.]+)$/, (m) => [`Terima ${m[1]}`, `接受 ${m[1]}`]],
    [/^Collect (RM [\d,.]+) cash$/, (m) => [`Kutip ${m[1]} tunai`, `收取现金 ${m[1]}`]],
    [/^Payment collected:$/, () => ['Bayaran dikutip:', '已收款：']],
    [/^(Today|Tomorrow), (.+)$/, (m) => [`${m[1] === 'Today' ? 'Hari ini' : 'Esok'}, ${m[2]}`, `${m[1] === 'Today' ? '今天' : '明天'}，${m[2]}`]],
    [/^About ([\d.]+) km away( \(estimate\))?$/, (m) => [`Kira-kira ${m[1]} km lagi${m[2] ? ' (anggaran)' : ''}`, `距离约 ${m[1]} 公里${m[2] ? '（估算）' : ''}`]],
    [/^Live · updated (.+)$/, (m) => [`Langsung · dikemas kini ${ago(m[1], 0)}`, `实时 · ${ago(m[1], 1)}更新`]],
    [/^⚠️ Signal lost · last seen (.+)$/, (m) => [`⚠️ Isyarat hilang · kali terakhir ${ago(m[1], 0)}`, `⚠️ 信号中断 · 最后出现于${ago(m[1], 1)}`]],
    [/^(\d+) stops before yours$/, (m) => [`${m[1]} hentian sebelum anda`, `在您之前还有 ${m[1]} 站`]],
    [/^Stop (\d+): $/, (m) => [`Hentian ${m[1]}: `, `第 ${m[1]} 站：`]],
    [/^Start all (\d+)$/, (m) => [`Mula semua ${m[1]}`, `全部出发（${m[1]}）`]],
    [/^Order before (.+) for delivery today\.$/, (m) => [`Pesan sebelum ${m[1]} untuk penghantaran hari ini.`, `${m[1]} 前下单可当天送达。`]],
    [/^Same-day orders closed at (.+)\. Orders placed now are delivered from tomorrow\.$/, (m) => [`Pesanan hari yang sama ditutup pada ${m[1]}. Pesanan sekarang dihantar mulai esok.`, `当天订单已于 ${m[1]} 截止。现在下单将从明天起配送。`]],
    [/^Same-day orders closed at (.+), so the earliest delivery is tomorrow\.$/, (m) => [`Pesanan hari yang sama ditutup pada ${m[1]}, jadi penghantaran paling awal ialah esok.`, `当天订单已于 ${m[1]} 截止，最早明天送达。`]],
    [/^Sharing your location with the customer( \(accurate to (\d+) m\))?\. Keep this page open and the screen on\.$/, (m) => [`Lokasi anda dikongsi dengan pelanggan${m[2] ? ` (tepat hingga ${m[2]} m)` : ''}. Biarkan halaman ini terbuka dan skrin menyala.`, `正在与客户分享您的位置${m[2] ? `（精确到 ${m[2]} 米）` : ''}。请保持此页面打开并保持屏幕常亮。`]],
    [/^Delivered (.+?)( · received by (.+))?\.$/, (m) => [`Dihantar ${ago(m[1], 0)}${m[3] ? ` · diterima oleh ${m[3]}` : ''}.`, `${ago(m[1], 1)}送达${m[3] ? ` · 签收人 ${m[3]}` : ''}。`]],
    [/^Invoice (\S+)$/, (m) => [`Invois ${m[1]}`, `发票 ${m[1]}`]],
    [/^Reference: $/, () => ['Rujukan: ', '参考号：']]
];

function ago(text, i) {
    if (text === 'just now') return ['baru sahaja', '刚刚'][i];
    let m = text.match(/^(\d+)s ago$/); if (m) return [`${m[1]} saat lalu`, `${m[1]} 秒前`][i];
    m = text.match(/^(\d+) min ago$/); if (m) return [`${m[1]} minit lalu`, `${m[1]} 分钟前`][i];
    m = text.match(/^(\d+) h ago$/); if (m) return [`${m[1]} jam lalu`, `${m[1]} 小时前`][i];
    return text;
}

function lookup(text, i) {
    if (DICT[text]) return DICT[text][i];
    for (const [re, fn] of PATTERNS) { const m = text.match(re); if (m) return fn(m)[i]; }
    return null;
}

/** Translate one piece of text, or return null to leave it alone. */
function translate(raw, lang) {
    const i = lang === 'ms' ? 0 : 1;
    const lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
    const text = raw.trim();
    if (!text || !/[A-Za-z]/.test(text)) return null;
    let out = lookup(text, i);
    if (out === null) {
        // "📍 Track a delivery", "Review order ›", "Waiting to be packed."
        const m = text.match(/^([^A-Za-z0-9]*)(.*?)([.:›\s]*)$/);
        const inner = m && (m[1] || m[3]) ? lookup(m[2], i) : null;
        if (inner !== null) out = m[1] + inner + (i === 1 ? m[3].replace('.', '。') : m[3]);
    }
    if (out === null && text.includes('. ')) {
        // Two sentences joined together: translate the ones we know
        const parts = text.split(/(?<=\.) /).map((part) => translate(part, lang));
        if (parts.every((p) => p !== null)) out = parts.join(i === 1 ? '' : ' ');
    }
    return out === null ? null : lead + out + tail;
}

const ATTRS = ['placeholder', 'aria-label'];

function apply(node, lang) {
    if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentNode;
        if (!parent || /^(SCRIPT|STYLE|TEXTAREA)$/.test(parent.nodeName)) return;
        if (node.__out === node.nodeValue) { // our own earlier translation: start again from the English
            if (node.__lang === lang) return;
            node.nodeValue = node.__en;
        }
        if (lang === 'en') return;
        const en = node.nodeValue, out = translate(en, lang);
        if (out !== null && out !== en) { node.__en = en; node.__out = out; node.__lang = lang; node.nodeValue = out; }
        return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    ATTRS.forEach((a) => {
        if (!node.hasAttribute(a)) return;
        const store = '__en_' + a;
        if (node[store] === undefined) node[store] = node.getAttribute(a);
        const out = lang === 'en' ? null : translate(node[store], lang);
        node.setAttribute(a, out === null ? node[store] : out);
    });
    node.childNodes.forEach((child) => apply(child, lang));
}

let busy = false;
function run(root) {
    busy = true;
    try { apply(root, getLang()); } finally { busy = false; }
}

export function setLang(lang) {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
    run(document.body);
}

/** Start watching the page. Safe to call once per page. */
export function startI18n() {
    document.documentElement.lang = getLang() === 'zh' ? 'zh-Hans' : getLang();
    run(document.body);
    new MutationObserver((changes) => {
        if (busy || getLang() === 'en') return;
        busy = true;
        try {
            const lang = getLang();
            changes.forEach((c) => {
                if (c.type === 'characterData') apply(c.target, lang);
                else c.addedNodes.forEach((n) => apply(n, lang));
            });
        } finally { busy = false; }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
