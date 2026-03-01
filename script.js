const listContainer = document.getElementById('list-container');
const codeView = document.getElementById('code-view');
const placeholder = document.getElementById('placeholder');
const codeBlock = document.getElementById('code-block');
const codeTitle = document.getElementById('code-title');
const searchInput = document.getElementById('searchInput');

// 渲染列表
function renderList(data) {
    listContainer.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.textContent = item.title;
        div.onclick = () => showCode(item.id);
        listContainer.appendChild(div);
    });
}

// 顯示代碼與隱藏圖片
function showCode(id) {
    const item = snippets.find(s => s.id === id);
    if (!item) return;

    placeholder.style.display = 'none';
    codeView.style.display = 'block';

    codeTitle.textContent = item.title;
    document.getElementById('code-lang-tag').textContent = item.language;
    codeBlock.className = `language-${item.language}`;
    codeBlock.textContent = item.code;
    
    Prism.highlightElement(codeBlock);

    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.textContent === item.title);
    });
}

function copyCode() {
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        const btn = document.querySelector('.btn-copy');
        btn.textContent = '✅ COPIED';
        setTimeout(() => btn.textContent = 'COPY CODE', 2000);
    });
}

// 搜尋功能
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderList(snippets.filter(s => s.title.toLowerCase().includes(term)));
});

// 管理員登入
function loginAdmin() {
    if (prompt("輸入密碼") === "gm@660606") {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
        document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || '';
        renderDeleteList();
    }
}

// 渲染刪除清單
function renderDeleteList() {
    const delContainer = document.getElementById('admin-delete-list');
    delContainer.innerHTML = '<p style="color:#aaa; font-size:0.8rem; margin-bottom:5px;">🗑️ 點擊刪除項目：</p>';
    snippets.forEach(item => {
        const d = document.createElement('div');
        d.style = "display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:5px 10px; margin-bottom:5px; font-size:0.8rem; border-radius:4px;";
        d.innerHTML = `<span>${item.title}</span><button onclick="deleteSnippet(${item.id})" style="color:red; background:none; border:none; cursor:pointer;">[刪除]</button>`;
        delContainer.appendChild(d);
    });
}

// GitHub API 通用函數
async function updateGithub(updatedData, msgText) {
    const token = document.getElementById('gh-token').value;
    const repo = document.getElementById('gh-repo').value;
    const msg = document.getElementById('status-msg');
    if(!token || !repo) return alert("請填寫 Token 與 Repo");

    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    msg.textContent = "⏳ 處理中...";

    try {
        const url = `https://api.github.com/repos/${repo}/contents/data.js`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const fileData = await res.json();
        
        const finalContent = `const snippets = ${JSON.stringify(updatedData, null, 4)};`;
        
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msgText,
                content: btoa(unescape(encodeURIComponent(finalContent))),
                sha: fileData.sha
            })
        });

        if (putRes.ok) {
            msg.style.color = "cyan";
            msg.textContent = "✅ 操作成功，1分鐘後重新整理網頁。";
            setTimeout(() => location.reload(), 2000);
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "❌ 失敗: " + e.message;
    }
}

async function publishToGithub() {
    const newItem = {
        id: Date.now(),
        title: document.getElementById('admin-title').value,
        language: document.getElementById('admin-lang').value,
        code: document.getElementById('admin-raw-code').value
    };
    await updateGithub([...snippets, newItem], `Add: ${newItem.title}`);
}

async function deleteSnippet(id) {
    if(!confirm("確定刪除？")) return;
    await updateGithub(snippets.filter(s => s.id !== id), `Delete ID: ${id}`);
}

renderList(snippets);
// 新增：返回首頁圖片的函數
function goHome() {
    // 1. 顯示圖片區域，隱藏代碼區域
    const placeholder = document.getElementById('placeholder');
    const codeView = document.getElementById('code-view');
    
    if (placeholder && codeView) {
        placeholder.style.display = 'flex'; // 使用 flex 確保文字置中
        placeholder.style.opacity = '1';
        codeView.style.display = 'none';
    }

    // 2. 移除左側列表所有項目的選取狀態 (Active)
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });

    // 3. 清空語言標籤文字
    const langTag = document.getElementById('code-lang-tag');
    if (langTag) langTag.textContent = '';
}

// 微調原本的 showCode 函數，確保切換順暢
const originalShowCode = window.showCode;
window.showCode = function(id) {
    const placeholder = document.getElementById('placeholder');
    const codeView = document.getElementById('code-view');

    // 隱藏圖片，顯示代碼
    if (placeholder && codeView) {
        placeholder.style.display = 'none';
        codeView.style.display = 'block';
    }

    // 執行原本 script.js 裡的顯示邏輯 (尋找資料、高亮等)
    const item = snippets.find(s => s.id === id);
    if (!item) return;

    codeTitle.textContent = item.title;
    document.getElementById('code-lang-tag').textContent = item.language;
    codeBlock.className = `language-${item.language}`;
    codeBlock.textContent = item.code;
    
    Prism.highlightElement(codeBlock);

    // 切換 Active 狀態
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', snippets.find(s => s.title === el.textContent).id === id);
    });
};
