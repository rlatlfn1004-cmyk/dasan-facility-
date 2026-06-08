const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav");

let inspections = JSON.parse(localStorage.getItem("inspections")) || [];
let isAdmin = false;

const ADMIN_PASSWORD = "1234";

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});

const userBox = document.querySelector(".user");
userBox.innerHTML += `
  <br><button onclick="adminLogin()" style="margin-top:10px;">관리자 로그인</button>
  <button onclick="adminLogout()" style="margin-top:6px;">로그아웃</button>
`;

function adminLogin() {
  const pw = prompt("관리자 비밀번호를 입력하세요.");

  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    alert("관리자 모드가 활성화되었습니다.");
    renderAll();
  } else {
    alert("비밀번호가 틀렸습니다.");
  }
}

function adminLogout() {
  isAdmin = false;
  alert("관리자 모드가 해제되었습니다.");
  renderAll();
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;

const form = document.getElementById("inspectionForm");

if (form) {
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
      completed: false
    };

    if (editId) {
      inspections = inspections.map(item => {
        if (item.id === Number(editId)) {
          return {
            ...item,
            ...data,
            completed: item.completed
          };
        }
        return item;
      });

      delete form.dataset.editId;
      alert("수정되었습니다.");
    } else {
      inspections.push(data);
      alert("점검이 등록되었습니다.");
    }

    localStorage.setItem("inspections", JSON.stringify(inspections));
    form.reset();
    renderAll();

    document.querySelector('[data-page="history"]').click();
  });
}

function badge(status) {
  if (status === "이상 없음") {
    return `<span class="badge ok">${status}</span>`;
  }

  if (status === "수리필요") {
    return `<span class="badge need">${status}</span>`;
  }

  return `<span class="badge urgent">${status}</span>`;
}

function getFilteredInspections() {
  const building = document.getElementById("filterBuilding")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const inspector = document.getElementById("filterInspector")?.value || "";

  return inspections.filter(item => {
    return (
      (!building || item.building === building) &&
      (!status || item.status === status) &&
      (!inspector || item.inspector.includes(inspector))
    );
  });
}

function renderDashboard() {
  document.getElementById("monthCount").textContent = inspections.length;

  const openRepairs = inspections.filter(
    x => x.status !== "이상 없음" && !x.completed
  );

  document.getElementById("openRepairs").textContent = openRepairs.length;

  document.getElementById("urgentCount").textContent =
    inspections.filter(x => x.status === "긴급" && !x.completed).length;

  document.getElementById("lastDate").textContent =
    inspections.length ? inspections[inspections.length - 1].date : "-";

  const buildings = ["본사", "물류센터1", "물류센터2", "서교동"];
  const cards = document.getElementById("buildingCards");

  cards.innerHTML = buildings.map(name => {
    const count = inspections.filter(x => x.building === name).length;
    const repairCount = inspections.filter(
      x => x.building === name && x.status !== "이상 없음" && !x.completed
    ).length;

    return `
      <div class="card">
        <h3>${name}</h3>
        <p>등록 점검 수 : ${count}</p>
        <p>미처리 수리 : ${repairCount}</p>
      </div>
    `;
  }).join("");

  const recent = document.getElementById("recentList");

  recent.innerHTML = inspections
    .slice()
    .reverse()
    .slice(0, 5)
    .map(x => `
      <div class="list-item">
        <strong>${x.building}</strong>
        (${x.date}) - ${x.area} - ${x.status}
      </div>
    `)
    .join("");
}

function renderHistory() {
  const tbody = document.getElementById("historyBody");
  const list = getFilteredInspections().slice().reverse();

  tbody.innerHTML = list.map(x => `
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
            ? `
              <br>
              <button onclick="editInspection(${x.id})">수정</button>
              <button onclick="deleteInspection(${x.id})">삭제</button>
            `
            : ""
        }
      </td>
    </tr>
  `).join("");
}

function renderRepairs() {
  const list = document.getElementById("repairList");

  const repairs = inspections.filter(x => x.status !== "이상 없음");

  list.innerHTML = repairs.map(x => `
    <div class="repair-card">
      <h3>${x.building}</h3>
      <p><strong>구역:</strong> ${x.area}</p>
      <p><strong>내용:</strong> ${x.content}</p>
      <p>${badge(x.status)}</p>
      <p><strong>상태:</strong> ${x.completed ? "처리완료" : "진행중"}</p>

      ${
        isAdmin
          ? x.completed
            ? `<button onclick="cancelComplete(${x.id})">완료 취소</button>`
            : `<button onclick="completeRepair(${x.id})">완료처리</button>`
          : ""
      }
    </div>
  `).join("");
}

function editInspection(id) {
  if (!isAdmin) {
    alert("관리자만 수정할 수 있습니다.");
    return;
  }

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
  alert("내용 수정 후 등록하기 버튼을 누르면 저장됩니다.");
}

function deleteInspection(id) {
  if (!isAdmin) {
    alert("관리자만 삭제할 수 있습니다.");
    return;
  }

  if (!confirm("정말 삭제하시겠습니까?")) return;

  inspections = inspections.filter(x => x.id !== id);
  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

function completeRepair(id) {
  if (!isAdmin) {
    alert("관리자만 완료처리할 수 있습니다.");
    return;
  }

  inspections = inspections.map(x => {
    if (x.id === id) {
      x.completed = true;
    }
    return x;
  });

  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

function cancelComplete(id) {
  if (!isAdmin) {
    alert("관리자만 완료 취소할 수 있습니다.");
    return;
  }

  inspections = inspections.map(x => {
    if (x.id === id) {
      x.completed = false;
    }
    return x;
  });

  localStorage.setItem("inspections", JSON.stringify(inspections));
  renderAll();
}

window.editInspection = editInspection;
window.deleteInspection = deleteInspection;
window.completeRepair = completeRepair;
window.cancelComplete = cancelComplete;

document.getElementById("filterBuilding")?.addEventListener("change", renderHistory);
document.getElementById("filterStatus")?.addEventListener("change", renderHistory);
document.getElementById("filterInspector")?.addEventListener("input", renderHistory);

function renderAll() {
  renderDashboard();
  renderHistory();
  renderRepairs();
}

renderAll();
