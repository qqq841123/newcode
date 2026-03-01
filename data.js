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
        .search-box { width: 100%; padding: 10px 15px; margin: 15px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #007bff; color: white; }
        th, td { border: 1px solid #dee2e6; padding: 10px; }
        tbody tr { background-color: var(--row-bg, #ffffff); }
        .copy-btn { background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; float: right; }
    </style>
</head>
<body>
    <div class="container">
        <h2>設備 KVM 快速連線表</h2>
        <input type="text" id="searchInput" class="search-box" placeholder="搜尋...">
        <table>
            <thead><tr><th>Station</th><th>MachID</th><th>EQPName</th><th>KVM_IP</th></tr></thead>
            <tbody id="list-body"></tbody>
        </table>
    </div>
    <script>
        const rawData = \\\`2395 903 E0049447 10.10.246.60\\\`; // 此處簡化處理
        // ... 原有 KVM 邏輯 ...
    </script>
</body>
</html>`
    },
    {
        id: 1772398033774,
        title: "阿貴導航v2",
        language: "html",
        code: `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>阿貴導航 & 萬用時鐘系統</title>
    <style>
        :root { --bg-color: #1a1a2e; --primary-accent: #4ecca3; }
        body { background: #000; color: white; font-family: sans-serif; }
        #clock { font-size: 100px; text-align: center; color: var(--primary-accent); }
    </style>
</head>
<body>
    <div id="clock">00:00:00</div>
    <script>
        setInterval(() => { document.getElementById('clock').innerText = new Date().toTimeString().split(' ')[0]; }, 1000);
    </script>
</body>
</html>`
    }
];
