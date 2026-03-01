const listContainer = document.getElementById('list-container');
const codeView = document.getElementById('code-view');
const placeholder = document.getElementById('placeholder');
const codeBlock = document.getElementById('code-block');
const codeTitle = document.getElementById('code-title');
const searchInput = document.getElementById('search');

// --- 基礎功能：顯示與搜尋 ---
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

function showCode(id) {
    const item = snippets.find(s => s.id === id);
    if (!item) return;
    placeholder.style.display = 'none';
    codeView.style.display = 'block';
    codeTitle.textContent = item.title;
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
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
    });
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderList(snippets.filter(s => s.title.toLowerCase().includes(term)));
});

// --- 管理員功能：登入與介面 ---
function loginAdmin() {
    if (prompt("請輸入管理員密碼：") === "gm@660606") {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
        document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || '';
        renderAdminManager(); // 顯示刪除清單
    } else { alert("密碼錯誤"); }
}

// 在管理面板顯示可刪除的列表
function renderAdminManager() {
    const container = document.getElementById('admin-delete-list') || document.createElement('div');
    container.id = 'admin-delete-list';
    container.innerHTML = '<h4>🗑️ 刪除已發布代碼</h4>';
    container.style.marginTop = '15px';
    
    snippets.forEach(item => {
        const div = document.createElement('div');
        div.style = 'display:flex; justify-content:space-between; background:#fff; padding:5px 10px; margin-bottom:5px; border-radius:4px; font-size:0.85rem; border:1px solid #ddd;';
        div.innerHTML = `<span>${item.title}</span><button onclick="deleteSnippet(${item.id})" style="color:red; border:none; background:none; cursor:pointer;">[刪除]</button>`;
        container.appendChild(div);
    });
    
    // 將刪除列表插入到發布按鈕下方
    const panel = document.getElementById('admin-panel');
    if (!document.getElementById('admin-delete-list')) panel.appendChild(container);
}

// --- GitHub API 核心邏輯 (優化版：支援新增與刪除) ---

async function getGithubData(token, repo) {
    const url = `https://api.github.com/repos/${repo}/contents/data.js`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
    if (!res.ok) throw new Error("讀取 data.js 失敗");
    return await res.json();
}

async function updateGithubFile(token, repo, sha, newContent, message) {
    const url = `https://api.github.com/repos/${repo}/contents/data.js`;
    const putRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(newContent))),
            sha: sha
        })
    });
    return putRes.ok;
}

// 格式化寫回 data.js 的字串
function wrapContent(dataObj) {
    return `const snippets = ${JSON.stringify(dataObj, null, 4)};`;
}

// 發布按鈕
async function publishToGithub() {
    const token = document.getElementById('gh-token').value;
    const repo = document.getElementById('gh-repo').value;
    const title = document.getElementById('admin-title').value;
    const lang = document.getElementById('admin-lang').value;
    const rawCode = document.getElementById('admin-raw-code').value;
    const msg = document.getElementById('status-msg');

    if (!token || !repo || !title || !rawCode) return alert("資料不全");

    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    msg.textContent = "🚀 正在發布...";

    try {
        const fileData = await getGithubData(token, repo);
        // 直接使用當前頁面的 snippets 物件（它是從 data.js 載入的）
        const newEntry = {
            id: Date.now(),
            title: title,
            language: lang,
            code: rawCode
        };
        
        const updatedSnippets = [...snippets, newEntry];
        const finalContent = wrapContent(updatedSnippets);

        if (await updateGithubFile(token, repo, fileData.sha, finalContent, `Add: ${title}`)) {
            msg.style.color = "green";
            msg.textContent = "✅ 發布成功！請等 1 分鐘後重新整理。";
            setTimeout(() => location.reload(), 2000);
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "❌ 錯誤: " + e.message;
    }
}

// 刪除功能
async function deleteSnippet(id) {
    if (!confirm("確定要刪除這段代碼嗎？此操作不可逆！")) return;
    
    const token = document.getElementById('gh-token').value;
    const repo = document.getElementById('gh-repo').value;
    const msg = document.getElementById('status-msg');
    
    if (!token || !repo) return alert("請先填寫 Token 與 Repo 資訊");

    msg.textContent = "🗑️ 正在刪除...";

    try {
        const fileData = await getGithubData(token, repo);
        const updatedSnippets = snippets.filter(s => s.id !== id);
        const finalContent = wrapContent(updatedSnippets);

        if (await updateGithubFile(token, repo, fileData.sha, finalContent, `Delete ID: ${id}`)) {
            msg.style.color = "orange";
            msg.textContent = "✅ 刪除成功！頁面即將跳轉。";
            setTimeout(() => location.reload(), 2000);
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "❌ 刪除失敗: " + e.message;
    }
}

// 初始化
renderList(snippets);
