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