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

function renderHomeStats(){
  const stats = [
    ["stat-problems", problems.length],
    ["stat-members", members.length],
    ["stat-topics", introCards.length],
  ];
  stats.forEach(([id, count]) => {
    const value = document.getElementById(id);
    if(value) value.textContent = count;
  });
}

function initHeroBackground(){
  const canvas = document.querySelector(".hero-canvas");
  const hero = canvas && canvas.closest(".hero");
  const context = canvas && canvas.getContext("2d");
  if(!canvas || !hero || !context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  function resize(){
    window.cancelAnimationFrame(animationFrame);
    const bounds = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(78, Math.max(34, Math.round(width * height / 11500)));
    particles = Array.from({length: count}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      radius: Math.random() * 1.5 + .7,
    }));
    draw();
  }

  function draw(){
    context.clearRect(0, 0, width, height);
    const linkDistance = Math.min(150, width * .16);

    particles.forEach((particle, index) => {
      if(!reducedMotion){
        particle.x += particle.vx;
        particle.y += particle.vy;
        if(particle.x < 0 || particle.x > width) particle.vx *= -1;
        if(particle.y < 0 || particle.y > height) particle.vy *= -1;

        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if(distance < 110 && distance > 0){
          particle.x += dx / distance * .35;
          particle.y += dy / distance * .35;
        }
      }

      for(let otherIndex = index + 1; otherIndex < particles.length; otherIndex++){
        const other = particles[otherIndex];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if(distance < linkDistance){
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(59, 143, 204, ${.16 * (1 - distance / linkDistance)})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(54, 139, 202, .42)";
      context.fill();
    });

    if(!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
  }

  function onVisibilityChange(){
    if(document.hidden){
      window.cancelAnimationFrame(animationFrame);
    } else if(!reducedMotion){
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  hero.addEventListener("pointermove", event => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
  }, {passive:true});
  hero.addEventListener("pointerleave", () => {
    pointer.x = -1000;
    pointer.y = -1000;
  }, {passive:true});
  window.addEventListener("resize", resize, {passive:true});
  document.addEventListener("visibilitychange", onVisibilityChange);
  resize();
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
renderHomeStats();
initHeroBackground();
renderProblems();
renderMembers();
