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

// --- 管理員功能：GitHub API 發布 ---
function loginAdmin() {
    if (prompt("請輸入管理員密碼：") === "gm@660606") {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
        document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || '';
    } else { alert("密碼錯誤"); }
}

async function publishToGithub() {
    const token = document.getElementById('gh-token').value;
    const repo = document.getElementById('gh-repo').value;
    const title = document.getElementById('admin-title').value;
    const lang = document.getElementById('admin-lang').value;
    const rawCode = document.getElementById('admin-raw-code').value;
    const btn = document.getElementById('btn-publish');
    const msg = document.getElementById('status-msg');

    if (!token || !repo || !title || !rawCode) return alert("資料不全");

    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    btn.disabled = true;
    msg.textContent = "正在發布...";

    try {
        const url = `https://api.github.com/repos/${repo}/contents/data.js`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const fileData = await res.json();
        const oldContent = decodeURIComponent(escape(atob(fileData.content)));

        const escaped = rawCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
        const newEntry = `\n    {\n        id: ${Date.now()},\n        title: "${title}",\n        language: "${lang}",\n        code: \`${escaped}\`\n    },`;
        const updatedContent = oldContent.replace('];', `${newEntry}\n];`);

        const putRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Update: ${title}`,
                content: btoa(unescape(encodeURIComponent(updatedContent))),
                sha: fileData.sha
            })
        });

        if (putRes.ok) {
            msg.style.color = "green";
            msg.textContent = "✅ 發布成功！請等 1 分鐘後重新整理網頁。";
        } else { throw new Error(); }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "❌ 發布失敗，請檢查設定與 Token。";
    } finally { btn.disabled = false; }
}

// 初始化
renderList(snippets);