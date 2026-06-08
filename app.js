let inspections = JSON.parse(localStorage.getItem("inspections") || "[]");
let isAdmin = localStorage.getItem("isAdmin") === "true";
const ADMIN_PASSWORD = "1234";

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav");
const form = document.getElementById("inspectionForm");

const userBox = document.querySelector(".user");
userBox.innerHTML = `
  김주림 <span>관리자</span><br>
  <small>본사</small><br>
  <button id="adminLoginBtn" style="margin-top:10px;">관리자 로그인</button>
  <button id="adminLogoutBtn" style="margin-top:6px;">로그아웃</button>
  <div id="adminStatus" style="margin-top:8px;font-size:12px;"></div>
`;

document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const pw = prompt("관리자 비밀번호를 입력하세요.");
  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    localStorage.setItem("isAdmin", "true");
    alert("관리자 모드 ON");
    renderAll();
  } else {
    alert("비밀번호가 틀렸습니다.");
  }
});

document.getElementById("adminLogoutBtn").addEventListener("click", () => {
  isAdmin = false;
  localStorage.removeItem("isAdmin");
  alert("관리자 모드 OFF");
  renderAll();
});

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    goPage(btn.dataset.page);
  });
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const formData = new FormData(form);
  const editId = form.dataset.editId;

  const oldItem = editId
    ? inspections.find(item => item.id === Number(editId))
    : null;

  const item = {
    id: editId ? Number(editId) : Date.now(),
    building: formData.get("building"),
    date: formData.get("date"),
    inspector: formData.get("inspector"),
    area: formData.get("area"),
    content: formData.get("content"),
    status: formData.get("status"),
    memo: formData.get("memo") || "",
    completed: oldItem ? oldItem.completed : false,
    processMemo: oldItem ? oldItem.processMemo || "" : ""
  };

  if (editId) {
    inspections = inspections.map(x =>
      x.id === Number(editId) ? item : x
    );
    delete form.dataset.editId;
    alert("수정되었습니다.");
  } else {
    inspections.push(item);
    alert("등록되었습니다.");
  }

  saveData();
  form.reset();
  goPage("history");
});

function saveData() {
  localStorage.setItem("inspections", JSON.stringify(inspections));
}

function goPage(pageName) {
  navButtons.forEach(b => b.classList.remove("active"));
  pages.forEach(p => p.classList.remove("active"));

  document.querySelector(`[data-page="${pageName}"]`)?.classList.add("active");
  document.getElementById(pageName)?.classList.add("active");

  renderAll();
}

function badge(status) {
  if (status === "이상 없음") return `<span class="badge ok">이상 없음</span>`;
  if (status === "수리필요") return `<span class="badge need">수리필요</span>`;
  return `<span class="badge urgent">긴급</span>`;
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
    const needCount = inspections.filter(
      x => x.building === name && x.status !== "이상 없음" && !x.completed
    ).length;

    return `
      <div class="card">
        <h3>${name}</h3>
        <p>등록 점검 수 : ${count}</p>
        <p>미처리 수리 : ${needCount}</p>
      </div>
    `;
  }).join("");

  document.getElementById("recentList").innerHTML =
    inspections.length === 0
      ? `<p>등록된 점검이 없습니다.</p>`
      : inspections.slice().reverse().slice(0, 5).map(x => `
          <div class="list-item">
            <strong>${x.building}</strong> ${x.date} / ${x.area} / ${x.status}
          </div>
        `).join("");
}

function getFilteredList() {
  const building = document.getElementById("filterBuilding")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const inspector = document.getElementById("filterInspector")?.value || "";

  return inspections.filter(x =>
    (!building || x.building === building) &&
    (!status || x.status === status) &&
    (!inspector || x.inspector.includes(inspector))
  );
}

function renderHistory() {
  const tbody = document.getElementById("historyBody");
  const list = getFilteredList().slice().reverse();

  tbody.innerHTML = list.length === 0
    ? `<tr><td colspan="8">등록된 점검 이력이 없습니다.</td></tr>`
    : list.map(x => `
      <tr>
        <td>${x.building || "-"}</td>
        <td>${x.date || "-"}</td>
        <td>${x.inspector || "-"}</td>
        <td>${x.area || "-"}</td>
        <td>${x.content || "-"}</td>
        <td>${x.memo || "-"}</td>
        <td>${badge(x.status)}</td>
        <td>
          <div><strong>${x.completed ? "완료" : "진행중"}</strong></div>
          <div style="font-size:12px; margin-top:4px; color:#555;">
            ${x.processMemo || "-"}
          </div>

          ${isAdmin ? `
            <br>
            <button class="processBtn" data-id="${x.id}">처리내용 작성</button>
            <button class="editBtn" data-id="${x.id}">수정</button>
            <button class="deleteBtn" data-id="${x.id}">삭제</button>
            ${x.completed
              ? `<button class="cancelBtn" data-id="${x.id}">완료취소</button>`
              : `<button class="completeBtn" data-id="${x.id}">완료처리</button>`
            }
          ` : ""}
        </td>
      </tr>
    `).join("");
}

function renderRepairs() {
  const list = document.getElementById("repairList");
  const repairs = inspections.filter(x => x.status !== "이상 없음");

  list.innerHTML = repairs.length === 0
    ? `<p>수리필요 또는 긴급 항목이 없습니다.</p>`
    : repairs.map(x => `
      <div class="repair-card">
        <h3>${x.building}</h3>
        <p><strong>점검일:</strong> ${x.date}</p>
        <p><strong>구역:</strong> ${x.area}</p>
        <p><strong>내용:</strong> ${x.content}</p>
        <p><strong>비고:</strong> ${x.memo || "-"}</p>
        <p>${badge(x.status)}</p>
        <p><strong>처리상태:</strong> ${x.completed ? "완료" : "진행중"}</p>
        <p><strong>처리내용:</strong> ${x.processMemo || "-"}</p>

        ${isAdmin ? `
          <button class="processBtn" data-id="${x.id}">처리내용 작성</button>
          ${x.completed
            ? `<button class="cancelBtn" data-id="${x.id}">완료취소</button>`
            : `<button class="completeBtn" data-id="${x.id}">완료처리</button>`
          }
        ` : ""}
      </div>
    `).join("");
}

document.addEventListener("click", e => {
  const id = Number(e.target.dataset.id);

  if (e.target.classList.contains("deleteBtn")) {
    if (!isAdmin) return alert("관리자만 삭제할 수 있습니다.");
    if (!confirm("정말 삭제하시겠습니까?")) return;

    inspections = inspections.filter(x => x.id !== id);
    saveData();
    renderAll();
  }

  if (e.target.classList.contains("editBtn")) {
    if (!isAdmin) return alert("관리자만 수정할 수 있습니다.");

    const item = inspections.find(x => x.id === id);
    if (!item) return;

    form.elements["building"].value = item.building;
    form.elements["date"].value = item.date;
    form.elements["inspector"].value = item.inspector;
    form.elements["area"].value = item.area;
    form.elements["content"].value = item.content;
    form.elements["status"].value = item.status;
    form.elements["memo"].value = item.memo || "";
    form.dataset.editId = id;

    goPage("register");
    alert("내용 수정 후 등록하기 버튼을 누르면 저장됩니다.");
  }

  if (e.target.classList.contains("processBtn")) {
    if (!isAdmin) return alert("관리자만 처리내용을 작성할 수 있습니다.");

    const item = inspections.find(x => x.id === id);
    if (!item) return;

    const memo = prompt("처리내용을 입력하세요.", item.processMemo || "");
    if (memo === null) return;

    inspections = inspections.map(x =>
      x.id === id ? { ...x, processMemo: memo } : x
    );

    saveData();
    renderAll();
  }

  if (e.target.classList.contains("completeBtn")) {
    if (!isAdmin) return alert("관리자만 완료처리할 수 있습니다.");

    const item = inspections.find(x => x.id === id);
    const memo = prompt("처리내용을 입력하세요.", item?.processMemo || "");
    if (memo === null) return;

    inspections = inspections.map(x =>
      x.id === id ? { ...x, completed: true, processMemo: memo } : x
    );

    saveData();
    renderAll();
  }

  if (e.target.classList.contains("cancelBtn")) {
    if (!isAdmin) return alert("관리자만 완료취소할 수 있습니다.");

    inspections = inspections.map(x =>
      x.id === id ? { ...x, completed: false } : x
    );

    saveData();
    renderAll();
  }
});

document.getElementById("filterBuilding")?.addEventListener("change", renderHistory);
document.getElementById("filterStatus")?.addEventListener("change", renderHistory);
document.getElementById("filterInspector")?.addEventListener("input", renderHistory);

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
