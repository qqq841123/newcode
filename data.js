const snippets = [
    {
        id: 1,
        title: "歡迎使用代碼庫",
        language: "javascript",
        code: `console.log("請點擊左側開始查看，或進入管理員模式新增代碼。");`
    },

    {
        id: 1772396158831,
        title: "KVM管理工具",
        language: "html",
        code: `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>設備連線管理面板</title>
    <style>
        body { font-family: "Segoe UI", Tahoma, sans-serif; padding: 20px; background: #f0f2f5; }
        .container { max-width: 900px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { color: #333; border-left: 5px solid #007bff; padding-left: 15px; }
        
        /* 搜尋框樣式 */
        .search-box {
            width: 100%;
            padding: 10px 15px;
            margin: 15px 0;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box; 
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        .search-box:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0,123,255,0.3);
        }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #007bff; color: white; position: sticky; top: 0; z-index: 10; }
        th, td { border: 1px solid #dee2e6; padding: 10px; text-align: left; }
        
        /* 移除原本的 tr:nth-child(even)，改用 CSS 變數控制背景色
           未設定顏色的預設為白色
        */
        tbody tr { 
            background-color: var(--row-bg, #ffffff); 
            transition: background-color 0.2s;
        }
        
        /* Hover 效果優化：
           當游標指到該列時，在 td 上覆蓋一層 8% 不透明度的黑色漸層
           這樣不僅會變色，還能完美保留原本 IP 群組的底色！
        */
        tbody tr:hover > td { 
            background-image: linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)); 
            cursor: default;
        }
        
        /* 複製按鈕樣式 */
        .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            float: right;
            transition: background 0.2s;
        }
        .copy-btn:hover { background: #218838; }
        .copy-btn:active { transform: scale(0.95); }

        /* IP 連結樣式 */
        .ip-link {
            color: #0056b3;
            text-decoration: none;
            font-weight: 500;
        }
        .ip-link:hover { text-decoration: underline; color: #003d80; }

        /* 通知彈窗 */
        #toast {
            visibility: hidden;
            background: #333;
            color: #fff;
            text-align: center;
            border-radius: 4px;
            padding: 10px;
            position: fixed;
            z-index: 100;
            left: 50%;
            bottom: 30px;
            transform: translateX(-50%);
        }
        #toast.show { visibility: visible; animation: fadein 0.3s, fadeout 0.3s 1.7s; }
        @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
        @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
    </style>
</head>
<body>

<div class="container">
    <h2>設備 KVM 快速連線表</h2>
    
    <input type="text" id="searchInput" class="search-box" placeholder="輸入 Station, MachID, EQPName 或 IP 來快速搜尋...">

    <table>
        <thead>
            <tr>
                <th>Station</th>
                <th>MachID</th>
                <th>EQPName (點擊複製)</th>
                <th>KVM_IP (點擊跳轉)</th>
            </tr>
        </thead>
        <tbody id="list-body">
            </tbody>
    </table>
</div>
<div id="toast">已複製 EQPName 到剪貼簿</div>

<script>
    const rawData = \`
    2395 903 E0049447 10.10.246.60
    2395 904 E0091494 10.10.246.60
    2395 905 E0099466 10.10.246.60
    2395 906 E0099468 10.10.246.60
    2400 A901 E0135474 10.10.246.60
    2400 A902 E0131567 10.10.246.60
    2400 A903 E0138690 10.10.246.60
    2400 A904 E0076307 10.10.246.60
    2400 A905 E0076309 10.10.246.60
    2400 A906 E0004693 10.10.246.60
    2400 A908 E0076305 10.10.246.60
    2395 703 E0150498 10.10.230.73
    2395 704 E0075676 10.10.230.73
    2395 705 E0058986 10.10.230.73
    2395 706 E0132985 10.10.230.73
    2395 707 E0138614 10.10.230.73
    2400 A702 E0044179 10.10.230.73
    2400 A703 E0037376 10.10.230.76
    2400 A704 E0049574 10.10.230.76
    2400 A705 E0037713 10.10.230.76
    2400 A706 E0064162 10.10.230.73
    2400 A707 E0044061 10.10.230.73
    2400 A708 E0075634 10.10.230.76
    2400 A710 E0064866 10.10.230.76
    2400 A711 E0064746 10.10.230.76
    2400 A712 E0133529 10.10.230.76
    2400 A713 E0064163 10.10.230.73
    2400 A714 E0035146 10.10.230.73
    2400 A715 E0046965 10.10.230.73
    \`;

    let toastTimeout;

    // 準備一組柔和的背景色盤 (Pastel colors)，確保黑色文字好閱讀
    const colorPalette = [
        '#e3f2fd', // 淺藍
        '#f3e5f5', // 淺紫
        '#e8f5e9', // 淺綠
        '#fff3e0', // 淺橘
        '#ffebee', // 淺粉紅
        '#e0f7fa', // 淺青色
        '#fff8e1', // 淺黃
        '#fce4ec'  // 淺玫瑰紅
    
    {
        id: 1772398033774,
        title: "阿貴導航v2",
        language: "html",
        code: `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>阿貴導航 & 萬用時鐘系統</title>
    <style>
        :root {
            --bg-color: #1a1a2e;
            --card-bg: rgba(255, 255, 255, 0.1);
            --primary-accent: #4ecca3;
            --secondary-accent: #45b7d1;
            --text-color: #eeeeee;
            --btn-hover: #555;
            --danger: #e94560;
            --modal-bg: rgba(20, 20, 30, 0.95);
        }

        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: radial-gradient(circle at center, #2c3e50 0%, #000000 100%);
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: var(--text-color);
            transition: all 0.5s ease;
            padding: 20px;
        }

        /* --- 超大時間日期 --- */
        .time-dashboard {
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.5s ease;
            z-index: 10;
        }

        #current-date {
            font-size: 1.5rem;
            color: var(--secondary-accent);
            margin-bottom: 5px;
            font-weight: 500;
        }

        #clock {
            font-family: 'Courier New', Courier, monospace;
            color: var(--primary-accent);
            font-size: 120px;
            font-weight: bold;
            line-height: 1;
            text-shadow: 0 0 20px rgba(0,0,0,0.5);
        }

        /* --- 時鐘控制項 --- */
        .clock-controls {
            display: none;
            gap: 20px;
            margin-top: 25px;
            background: rgba(0,0,0,0.6);
            padding: 12px 25px;
            border-radius: 50px;
            align-items: center;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* --- 模式切換邏輯 --- */
        body.clock-only-mode .main-content { display: none; }
        body.clock-only-mode .clock-controls { display: flex; }
        body.clock-only-mode { justify-content: center; }

        /* --- 玻璃卡片 --- */
        .main-content { width: 100%; max-width: 900px; }
        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 1.1rem;
            margin-bottom: 15px;
            border-left: 4px solid var(--primary-accent);
            padding-left: 10px;
            color: var(--secondary-accent);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .btn {
            background: rgba(255, 255, 255, 0.05); color: white; padding: 12px;
            text-align: center; text-decoration: none; border-radius: 10px; font-size: 14px;
            transition: 0.2s; border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn:hover { background: var(--primary-accent); color: #000; transform: translateY(-2px); }

        .action-btn {
            background: #333; color: white; border: none; padding: 10px 18px;
            border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;
        }
        .btn-mode { background: #f39c12; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3); }
        .btn-kvm { background: #6c5ce7; }
        .btn-step { padding: 2px 10px; background: #444; border-radius: 4px; }
        .btn-step:hover { background: #666; }

        .input-field {
            background: rgba(0,0,0,0.3); border: 1px solid #444; color: white;
            padding: 10px; border-radius: 5px; width: 140px; text-transform: uppercase;
        }

        /* --- KVM 彈窗 --- */
        #kvmModal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center;
        }
        .modal-content { 
            background: var(--modal-bg); width: 90%; max-width: 1000px; max-height: 85vh;
            border-radius: 20px; padding: 25px; border: 1px solid var(--secondary-accent);
            overflow-y: auto; position: relative;
        }
        .kvm-table { width: 100%; border-collapse: collapse; margin-top: 15px; color: #333; }
        .kvm-table th { background: #2d3436; color: var(--secondary-accent); padding: 12px; text-align: left; }
        .kvm-table td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .kvm-table tr { background-color: var(--row-bg, #fff); }

        .copy-tag {
            background: #28a745; color: white; padding: 2px 6px; 
            border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 5px;
        }

        #toast {
            visibility: hidden; background: var(--primary-accent); color: #000;
            padding: 12px 25px; border-radius: 50px; position: fixed;
            bottom: 30px; left: 50%; transform: translateX(-50%); font-weight: bold; z-index: 2000;
        }
        #toast.show { visibility: visible; }
    </style>
</head>
<body>

<button class="action-btn btn-mode" onclick="toggleClockMode()">🔄 切換模式 (純時鐘 / 返回)</button>

<div class="time-dashboard">
    <div id="current-date">載入日期中...</div>
    <div id="clock">00:00:00</div>
    
    <div class="clock-controls">
        <div class="control-group">
            <label>顏色:</label>
            <input type="color" id="colorPicker" onchange="updateClockStyle()">
        </div>
        
        <div class="control-group">
            <label>大小:</label>
            <button class="action-btn btn-step" onclick="stepSize(-5)">-</button>
            <input type="range" id="sizePicker" min="50" max="350" step="5" oninput="updateClockStyle()">
            <button class="action-btn btn-step" onclick="stepSize(5)">+</button>
            <span id="sizeValue" style="min-width: 50px; font-size: 14px; font-family: monospace;">120px</span>
        </div>
        
        <button class="action-btn" style="font-size:12px; padding:5px 10px; background: #e94560;" onclick="resetClockStyle()">重設樣式</button>
    </div>
</div>

<div class="main-content">
    <div class="glass-card">
        <div class="section-title">快速開啟系統 <span><button class="action-btn btn-kvm" onclick="toggleKVM(true)">🔍 KVM 連線表</button></span></div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="action-btn" onclick="openBatch(['http://myvf.kh.asegroup.com:7230/mes_center/ifcRuleWaferSaw_A1A2_NEW.aspx?', 'http://myvf.kh.asegroup.com:7230/mes_center/ifcWS_LASERSAW_RMS_Setting.aspx?', 'http://myvf.kh.asegroup.com/oneweb/AutoMoveLogMonitor.aspx', 'http://myvf.kh.asegroup.com:7230/mes_center/N_4INQ_Query.aspx'])">DS-RMS 系列</button>
            <button class="action-btn" onclick="openBatch(['http://cimwebsrv.kh.asegroup.com:7600/eqp/frmASE_RepairEQP_EE.aspx', 'https://cimwebsrv.kh.asegroup.com:17600/eqp/frmASE_RepairEQP_Enrol.aspx', 'http://cimwebsrv.kh.asegroup.com:7600/lot/frmASE_AssignCarrierByCarrier.aspx', 'http://cimwebsrv.kh.asegroup.com:7600/lot/frmASE_SplitLot.aspx'])">簽修機系列</button>
            <button class="action-btn" style="background:var(--danger)" onclick="window.location.href='http://cimwebsrv.kh.asegroup.com:7600/lot/frmASE_BatchTrackOut.aspx';">Move Out</button>
        </div>
    </div>

    <div class="glass-card">
        <div class="section-title">常用導航</div>
        <div class="btn-grid" id="navContainer"></div>
    </div>

    <div class="glass-card">
        <div class="section-title">批號數據統計</div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            <input type="text" id="batchNum" class="input-field" placeholder="批號">
            <input type="number" id="qtyCalc" class="input-field" placeholder="計算片數">
            <input type="number" id="qtyTotal" class="input-field" placeholder="QTY 數量">
            <button class="action-btn" style="background:var(--primary-accent); color:#000;" onclick="addBatchData()">添加</button>
            <button class="action-btn" style="background:var(--danger)" onclick="resetBatchData()">重置</button>
        </div>
        <div id="batchResult" style="margin-top:15px; padding:15px; border:1px dashed #666; border-radius:10px; line-height: 1.6;">尚未輸入資料...</div>
        <button class="action-btn" style="width:100%; margin-top:10px; background:var(--secondary-accent)" onclick="copyToExcel()">複製到剪貼簿 (Excel)</button>
    </div>
</div>

<div id="kvmModal">
    <div class="modal-content">
        <span onclick="toggleKVM(false)" style="position:absolute; top:15px; right:20px; font-size:30px; color:#fff; cursor:pointer;">&times;</span>
        <h2 style="color:var(--secondary-accent); margin-top:0;">KVM 設備連線管理面板</h2>
        <input type="text" id="kvmSearch" class="input-field" style="width:100%; margin-bottom:15px;" placeholder="搜尋 STATION, MACHID, EQPNAME 或 IP...">
        <table class="kvm-table">
            <thead><tr><th>Station</th><th>MachID</th><th>EQPName</th><th>KVM_IP</th></tr></thead>
            <tbody id="kvmBody"></tbody>
        </table>
    </div>
</div>

<div id="toast">已複製到剪貼簿</div>

<script>
// --- 資料集 ---
const navLinks = [
    { href: "https://myasex.kh.asegroup.com/", text: "日月光首頁" },
    { href: "http://myvf.kh.asegroup.com/vf/root/", text: "MFG" },
    { href: "https://cimwebsrv.kh.asegroup.com:17600/home.aspx", text: "MES" },
    { href: "https://myhr.kh.asegroup.com/HRD/ASE_Meal/", text: "訂便當" },
    { href: "https://wbcimwebsrv.kh.asegroup.com:1471/HomePage/index.php", text: "WBCIM" },
    { href: "https://wbcimwebsrv.kh.asegroup.com:1471/Nasbrowser/Home/Index", text: "照片存取" },
    { href: "https://vqacim:8266/frmMain2.aspx?USER=RjY3NTE1", text: "SPC" },
    { href: "http://vqacim:8077/LoginPage/index.html", text: "PSN查詢" },
    { href: "https://khhriswebsrv.kh.asegroup.com/hrm/pla", text: "無塵服申請" },
    { href: "https://myhr.kh.asegroup.com/", text: "MyHR" }
];

const kvmRaw = \`
2395 903 E0049447 10.10.246.60
2395 904 E0091494 10.10.246.60
2395 905 E0099466 10.10.246.60
2395 906 E0099468 10.10.246.60
2400 A901 E0135474 10.10.246.60
2400 A902 E0131567 10.10.246.60
2400 A903 E0138690 10.10.246.60
2400 A904 E0076307 10.10.246.60
2400 A905 E0076309 10.10.246.60
2400 A906 E0004693 10.10.246.60
2400 A908 E0076305 10.10.246.60
2395 703 E0150498 10.10.230.73
2395 704 E0075676 10.10.230.73
2395 705 E0058986 10.10.230.73
2395 706 E0132985 10.10.230.73
2395 707 E0138614 10.10.230.73
2400 A702 E0044179 10.10.230.73
2400 A703 E0037376 10.10.230.76
2400 A704 E0049574 10.10.230.76
2400 A705 E0037713 10.10.230.76
2400 A706 E0064162 10.10.230.73
2400 A707 E0044061 10.10.230.73
2400 A708 E0075634 10.10.230.76
2400 A710 E0064866 10.10.230.76
2400 A711 E0064746 10.10.230.76
2400 A712 E0133529 10.10.230.76
2400 A713 E0064163 10.10.230.73
2400 A714 E0035146 10.10.230.73
2400 A715 E0046965 10.10.230.73
\`;

// --- 初始化功能 ---
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('clock').textContent = now.toTimeString().split(' ')[0];
}
setInterval(updateDateTime, 1000);
updateDateTime();

function toggleClockMode() {
    document.body.classList.toggle('clock-only-mode');
    localStorage.setItem('clockOnly', document.body.classList.contains('clock-only-mode'));
}

function updateClockStyle() {
    const color = document.getElementById('colorPicker').value;
    const size = document.getElementById('sizePicker').value;
    const clock = document.getElementById('clock');
    const display = document.getElementById('sizeValue');

    clock.style.color = color;
    clock.style.fontSize = size + "px";
    display.textContent = size + "px";

    localStorage.setItem('clockColor', color);
    localStorage.setItem('clockSize', size);
}

function stepSize(delta) {
    const picker = document.getElementById('sizePicker');
    let newSize = parseInt(picker.value) + delta;
    if (newSize < 50) newSize = 50;
    if (newSize > 350) newSize = 350;
    picker.value = newSize;
    updateClockStyle();
}

function resetClockStyle() {
    localStorage.removeItem('clockColor'); localStorage.removeItem('clockSize');
    location.reload();
}

// 載入時執行
window.addEventListener('DOMContentLoaded', () => {
    // 渲染導航
    const nav = document.getElementById('navContainer');
    navLinks.forEach(l => {
        const a = document.createElement('a');
        a.className = 'btn'; a.href = l.href; a.target = "_blank"; a.textContent = l.text;
        nav.appendChild(a);
    });

    // 渲染 KVM
    const kvmBody = document.getElementById('kvmBody');
    const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#ffebee', '#e0f7fa'];
    const ipMap = {};
    let cIdx = 0;

    kvmRaw.trim().split('\\n').forEach(line => {
        const parts = line.trim().split(/\\s+/);
        if(parts.length < 4) return;
        const [st, mid, ename, ip] = parts;
        if(!ipMap[ip]) ipMap[ip] = colors[cIdx++ % colors.length];
        const tr = document.createElement('tr');
        tr.style.setProperty('--row-bg', ipMap[ip]);
        tr.innerHTML = \`<td>\${st}</td><td>\${mid}</td>
            <td>\${ename} <span class="copy-tag" onclick="copyText('\${ename}')">複製</span></td>
            <td><a href="http://\${ip}" target="_blank" style="color:#0056b3; font-weight:bold;">\${ip}</a></td>\`;
        kvmBody.appendChild(tr);
    });

    // 恢復記憶
    if(localStorage.getItem('clockOnly') === 'true') document.body.classList.add('clock-only-mode');
    const savedColor = localStorage.getItem('clockColor') || '#4ecca3';
    const savedSize = localStorage.getItem('clockSize') || '120';
    
    document.getElementById('clock').style.color = savedColor;
    document.getElementById('clock').style.fontSize = savedSize + "px";
    document.getElementById('sizeValue').textContent = savedSize + "px";
    document.getElementById('sizePicker').value = savedSize;
    document.getElementById('colorPicker').value = savedColor;
});

// --- 功能函數 ---
function toggleKVM(show) {
    document.getElementById('kvmModal').style.display = show ? 'flex' : 'none';
    if(show) document.getElementById('kvmSearch').focus();
}

function openBatch(urls) { urls.forEach(u => window.open(u, '_blank')); }

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        const t = document.getElementById('toast');
        t.className = "show";
        setTimeout(() => t.className = "", 2000);
    });
}

// 搜尋與統計邏輯
document.getElementById('kvmSearch').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
    const val = this.value;
    document.querySelectorAll('#kvmBody tr').forEach(r => r.style.display = r.innerText.toUpperCase().includes(val) ? '' : 'none');
});

document.getElementById('batchNum').addEventListener('input', function() { this.value = this.value.toUpperCase(); });

let bData = {};
function addBatchData() {
    const b = document.getElementById('batchNum').value.trim();
    const q1 = parseInt(document.getElementById('qtyCalc').value);
    const q2 = parseInt(document.getElementById('qtyTotal').value);
    if(b && !isNaN(q1) && !isNaN(q2)) {
        if(!bData[b]) bData[b] = {q1:0, q2:0};
        bData[b].q1 += q1; bData[b].q2 += q2;
        updateBatchUI();
        document.getElementById('batchNum').value = ''; document.getElementById('qtyCalc').value = ''; document.getElementById('qtyTotal').value = '';
        document.getElementById('batchNum').focus();
    }
}
function updateBatchUI() {
    const keys = Object.keys(bData);
    if(keys.length === 0) { document.getElementById('batchResult').innerHTML = "尚未輸入資料..."; return; }
    const s1 = keys.reduce((s, k) => s + bData[k].q1, 0);
    const s2 = keys.reduce((s, k) => s + bData[k].q2, 0);
    document.getElementById('batchResult').innerHTML = \`批號: \${keys.join(', ')}<br>總片數: <b>\${s1}</b> | 總數量: <b>\${s2}</b>\`;
}
function resetBatchData() { bData = {}; updateBatchUI(); }
function copyToExcel() {
    const keys = Object.keys(bData); if(keys.length === 0) return;
    const s1 = keys.reduce((s, k) => s + bData[k].q1, 0);
    const s2 = keys.reduce((s, k) => s + bData[k].q2, 0);
    copyText(\`\${keys.join(', ')}\\t\${s1}\\t\${s2}\`);
}
</script>
</body>
</html>`
    },
];

    function initTable() {
        const tbody = document.getElementById('list-body');
        const rows = rawData.trim().split('\\n');
        const fragment = document.createDocumentFragment();

        // 用來記錄每個 IP 對應的顏色
        const ipColorMap = {};
        let colorIndex = 0;

        rows.forEach(rowStr => {
            const cols = rowStr.trim().split(/\\s+/);
            if (cols.length === 4) {
                const [st, mid, ename, ip] = cols;
                
                // 判斷這個 IP 是否已經分配過顏色，沒有的話就從色盤拿一個新顏色
                if (!ipColorMap[ip]) {
                    ipColorMap[ip] = colorPalette[colorIndex % colorPalette.length];
                    colorIndex++;
                }
                
                const rowColor = ipColorMap[ip];
                const tr = document.createElement('tr');
                
                // 將該 IP 的專屬顏色設為 CSS 變數
                tr.style.setProperty('--row-bg', rowColor);
                
                tr.innerHTML = \`
                    <td>\${st}</td>
                    <td>\${mid}</td>
                    <td>
                        <span>\${ename}</span>
                        <button class="copy-btn" onclick="copyText('\${ename}')">複製</button>
                    </td>
                    <td><a href="http://\${ip}" class="ip-link" target="_blank">\${ip}</a></td>
                \`;
                fragment.appendChild(tr);
            }
        });
        tbody.appendChild(fragment);
    }

    function copyText(val) {
        navigator.clipboard.writeText(val).then(() => {
            const toast = document.getElementById('toast');
            toast.className = "show";
            
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => { 
                toast.className = toast.className.replace("show", ""); 
            }, 2000);
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            const filter = this.value.toUpperCase(); 
            const rows = document.getElementById('list-body').getElementsByTagName('tr');

            for (let i = 0; i < rows.length; i++) {
                const rowText = rows[i].textContent || rows[i].innerText;
                if (rowText.toUpperCase().indexOf(filter) > -1) {
                    rows[i].style.display = "";
                } else {
                    rows[i].style.display = "none";
                }
            }
        });
    }

    initTable();
    setupSearch();

</script>

</body>
</html>`
    },
];