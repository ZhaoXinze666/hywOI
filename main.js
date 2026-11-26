// 渲染逻辑：首页介绍（Markdown）、题目列表、成员卡片、成员详情弹窗

function avatarColor(m){ return m.color || "#0f8fff"; }

/* ── 轻量 Markdown 渲染 ──
   支持：## 标题、**加粗**、*斜体*、`代码`、[链接](url)、- 列表、换行 */
function renderMarkdown(md){
  let html = md
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/^### (.*)$/gm,"<h4>$1</h4>")
    .replace(/^## (.*)$/gm,"<h3>$1</h3>")
    .replace(/^# (.*)$/gm,"<h3>$1</h3>")
    .replace(/^- (.*)$/gm,"<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,"<em>$1</em>")
    .replace(/`([^`]+)`/g,"<code>$1</code>");
  // 把连续的 <li> 包进 <ul>
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, m => "<ul>" + m.trim() + "</ul>");
  // 剩余的普通文本行包成 <p>
  html = html.split(/\n{2,}/).map(block=>{
    if(/^<(h3|h4|ul)/.test(block.trim())) return block;
    return "<p>" + block.replace(/\n/g,"<br>") + "</p>";
  }).join("\n");
  return html;
}

function renderIntro(){
  const box = document.getElementById("intro-cards");
  if(!box) return;
  box.innerHTML = introCards.map(c=>`
    <div class="intro-card">
      <h3>${c.title}</h3>
      <div class="intro-md">${renderMarkdown(c.markdown)}</div>
    </div>`).join("");
}

function renderProblems(){
  const box = document.getElementById("problem-list");
  if(!box) return;
  box.innerHTML = problems.map(p=>`
    <a class="problem-item" href="https://www.luogu.com.cn/problem/${p.pid}" target="_blank" rel="noopener">
      <span class="pid">${p.pid}</span>
      <span class="p-title">${p.title}</span>
      <span class="difficulty diff-${p.difficulty}">${p.difficulty}</span>
    </a>`).join("");
}

function renderMembers(){
  const grid = document.getElementById("member-grid");
  if(!grid) return;
  grid.innerHTML = members.map((m,i)=>`
    <div class="member-card" onclick="openMember(${i})">
      <div class="avatar" style="background:${avatarColor(m)}">${m.name[0]}</div>
      <div class="m-name">${m.name}</div>
      <div class="m-role">${m.role}</div>
    </div>`).join("");
}

function openMember(i){
  const m = members[i];
  const av = document.getElementById("m-avatar");
  av.textContent = m.name[0];
  av.style.background = avatarColor(m);
  document.getElementById("m-name").textContent = m.name;
  document.getElementById("m-role").textContent = m.role;
  document.getElementById("m-desc").textContent = m.desc;
  const link = document.getElementById("m-link");
  if(m.uid){
    link.href = "https://www.luogu.com.cn/user/" + m.uid;
    link.style.display = "";
    document.getElementById("m-uid").textContent = "洛谷 UID：" + m.uid;
  } else {
    link.style.display = "none";
    document.getElementById("m-uid").textContent = "";
  }
  document.getElementById("modal-mask").classList.add("open");
}
function closeModal(){ document.getElementById("modal-mask").classList.remove("open"); }
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });

renderIntro();
renderProblems();
renderMembers();
