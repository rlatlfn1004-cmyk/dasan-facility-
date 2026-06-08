let inspections = JSON.parse(localStorage.getItem("inspections")) || [];
let isAdmin = localStorage.getItem("isAdmin") === "true";
const ADMIN_PASSWORD = "1234";

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav");
const form = document.getElementById("inspectionForm");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");

    renderAll();
  });
});

const userBox = document.querySelector(".user");
userBox.innerHTML = `
  김주림 <span>관리자</span><br>
  <small>본사</small><br>
  <button onclick="adminLogin()" style="margin-top:10px;">관리자 로그인</button>
  <button onclick="adminLogout()" style="margin-top:6px;">로그아웃</button>
  <div id="adminStatus" style="margin-top:8px;font-size:12px;"></div>
`;

function adminLogin() {
  const pw = prompt("관리자 비밀번호를 입력하세요.");

  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    localStorage.setItem("isAdmin", "true");
    alert("관리자 모드가 켜졌습니다.");
    renderAll();
  } else {
    alert("비밀번호가 틀렸습니다.");
  }
}

function adminLogout() {
  isAdmin = false;
  localStorage.removeItem("isAdmin");
  alert("관리자 모드가 꺼졌습니다.");
  renderAll();
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;

form.addEventListener("submit", e => {
  e.preventDefault();

  const editId = form.dataset.editId;

  const data = {
    id: editId ? Number(editId) : Date.now(),
    building: form.building.value,
    date: form.date.value,
    inspector: form.inspector.value,
    area: form.area.value,
    content: form.content.value,
    status: form.status.value,
    memo: form.memo.value,
    completed: editId
      ? inspections.find(x => x.id === Number(editId))?.completed || false
      : false
  };

  if (editId) {
    inspections = inspections.map(x =>
      x.id === Number(editId) ? data : x
    );
    delete form.dataset.editId;
    alert("수정되었습니다.");
  } else {
    inspections.push(data);
    alert("등록되었습니다.");
  }

  localStorage.setItem("inspections", JSON.stringify(inspections));
  form.reset();
  renderAll();
  document.querySelector('[data-page="history"]').click();
});

function badge(status) {
  if (status === "이상 없음") return `<span class="badge ok">${status}</span>`;
  if (status === "수리필요") return `<span class="badge need">${status}</span>`;
  return `<span class="badge urgent">${status}</span>`;
}

function renderDashboard() {
  document.getElementById("monthCount").textContent = inspections.length;

  document.getElementById("openRepairs").textContent =
    inspections.filter(x => x.status !== "이상 없음" && !x.completed).length;

  document.getElementById("urgentCount").textContent =
    inspections.filter(x => x.status === "긴급" && !x.completed).length;

  document.getElementById("lastDate").textContent =
    inspections.length ? inspections[inspections.length - 1].date : "-";

  const buildings = ["본사", "물류센터1", "물류센터2", "서교동"];
  const cards = document.getElementById("buildingCards");

  cards.innerHTML = buildings.map(name => {
    const count = inspections.filter(x => x.building === name).length;
    return `
      <div class="card">
        <h3>${name}</h3>
        <p>등록 점검 수 : ${count}</p>
      </div>
    `;
  }).join("");

  document.getElementById("recentList").innerHTML = inspections
    .slice()
    .reverse()
    .slice(0, 5)
    .map(x => `
      <div class="list-item">
        <strong>${x.building}</strong> (${x.date}) - ${x.area} - ${x.status}
      </div>
    `)
    .join("");
}

function renderHistory() {
  const tbody = document.getElementById("historyBody");

  tbody.innerHTML = inspections
    .slice()
    .reverse()
    .map(x => `
      <tr>
        <td>${x.building}</td>
        <td>${x.date}</td>
        <td>${x.inspector}</td>
        <td>${x.area}</td>
        <td>${x.content}</td>
        <td>${badge(x.status)}</td>
        <td>
          ${x.completed ? "완료" : "진행중"}
          ${
            isAdmin
              ? `<br>
                 <button onclick="editInspection(${x.id})">수정</button>
                 <button onclick="deleteInspection(${x.id})">삭제</button>
                 ${
                   x.completed
                     ? `<button onclick="cancelComplete(${x.id})">완료취소</button>`
                     : `<button onclick="completeRepair(${x.id})">완료처리</button>`
                 }`
              : ""
          }
        </td>
      </tr>
    `)
    .join("");
}

function renderRepairs() {
  const list = document.getElementById("repairList");
  const repairs = inspections.filter(x => x.status !== "이상 없음");

  if (repairs.length === 0) {
    list.innerHTML = `<p>수리필요 또는 긴급 항목이 없습니다.</p>`;
    return;
  }

  list.innerHTML = repairs.map(x => `
    <div class="repair-card">
      <h3>${x.building}</h3>
      <p><strong>구역:</strong> ${x.area}</p>
      <p><strong>내용:</strong> ${x.content}</p>
      <p>${badge(x.status)}</p>
      <p><strong>처리상태:</strong> ${x.completed ? "완료" : "진행중"}</p>
      ${
        isAdmin
          ? x.completed
            ? `<button onclick="cancelComplete(${x.id})">완료취소</button>`
            : `<button onclick="completeRepair(${x.id})">완료처리</button>`
          : ""
      }
    </div>
  `).join("");
}

function editInspection(id) {
  if (!isAdmin) return alert("관리자만 수정할 수 있습니다.");

  const item = inspections.find(x => x.id === id);
  if (!item) return;

  form.building.value = item.building;
  form.date.value = item.date;
  form.inspector.value = item.inspector;
  form.area.value = item.area;
  form.content.value = item.content;
  form.status.value = item.status;
  form.memo.value = item.memo || "";
  form.dataset.editId = id;

  document.querySelector('[data-page="register"]').click();
}

function deleteInspection(id) {
  if (!isAdmin) return alert("관리자만 삭제할 수 있습니다.");
  if (!confirm("정말 삭제하시겠습니까?")) return;

  inspections = inspections.filter(x => x.id !== id);
  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

function completeRepair(id) {
  if (!isAdmin) return alert("관리자만 완료처리할 수 있습니다.");

  inspections = inspections.map(x =>
    x.id === id ? { ...x, completed: true } : x
  );

  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

function cancelComplete(id) {
  if (!isAdmin) return alert("관리자만 완료취소할 수 있습니다.");

  inspections = inspections.map(x =>
    x.id === id ? { ...x, completed: false } : x
  );

  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

window.editInspection = editInspection;
window.deleteInspection = deleteInspection;
window.completeRepair = completeRepair;
window.cancelComplete = cancelComplete;

function renderAll() {
  const adminStatus = document.getElementById("adminStatus");
  if (adminStatus) {
    adminStatus.textContent = isAdmin ? "관리자 모드 ON" : "관리자 모드 OFF";
  }

  renderDashboard();
  renderHistory();
  renderRepairs();
}

renderAll();
