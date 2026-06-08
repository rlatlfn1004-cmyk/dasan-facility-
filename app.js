const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav");

let inspections = JSON.parse(localStorage.getItem("inspections")) || [];

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});

const form = document.getElementById("inspectionForm");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      id: Date.now(),
      building: form.building.value,
      date: form.date.value,
      inspector: form.inspector.value,
      area: form.area.value,
      content: form.content.value,
      status: form.status.value,
      memo: form.memo.value,
      completed: false
    };

    inspections.push(data);

    localStorage.setItem(
      "inspections",
      JSON.stringify(inspections)
    );

    alert("점검이 등록되었습니다.");

    form.reset();

    renderAll();
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

function renderDashboard() {
  document.getElementById("monthCount").textContent =
    inspections.length;

  const repairs = inspections.filter(
    x =>
      x.status !== "이상 없음" &&
      !x.completed
  );

  document.getElementById("openRepairs").textContent =
    repairs.length;

  document.getElementById("urgentCount").textContent =
    inspections.filter(
      x => x.status === "긴급"
    ).length;

  document.getElementById("lastDate").textContent =
    inspections.length
      ? inspections[inspections.length - 1].date
      : "-";

  const buildings = [
    "본사",
    "물류센터1",
    "물류센터2",
    "서교동"
  ];

  const cards = document.getElementById("buildingCards");

  cards.innerHTML = buildings
    .map(name => {
      const count = inspections.filter(
        x => x.building === name
      ).length;

      return `
        <div class="card">
          <h3>${name}</h3>
          <p>등록 점검 수 : ${count}</p>
        </div>
      `;
    })
    .join("");

  const recent = document.getElementById("recentList");

  recent.innerHTML = inspections
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      x => `
      <div class="list-item">
        <strong>${x.building}</strong>
        (${x.date})
        - ${x.area}
        - ${x.status}
      </div>
    `
    )
    .join("");
}

function renderHistory() {
  const tbody =
    document.getElementById("historyBody");

  tbody.innerHTML = inspections
    .slice()
    .reverse()
    .map(
      x => `
      <tr>
        <td>${x.building}</td>
        <td>${x.date}</td>
        <td>${x.inspector}</td>
        <td>${x.area}</td>
        <td>${x.content}</td>
        <td>${badge(x.status)}</td>
        <td>
          ${
            x.completed
              ? "완료"
              : "진행중"
          }
        </td>
      </tr>
    `
    )
    .join("");
}

function renderRepairs() {
  const list =
    document.getElementById("repairList");

  const repairs = inspections.filter(
    x => x.status !== "이상 없음"
  );

  list.innerHTML = repairs
    .map(
      x => `
      <div class="repair-card">
        <h3>${x.building}</h3>
        <p>${x.area}</p>
        <p>${x.content}</p>
        <p>${badge(x.status)}</p>

        ${
          x.completed
            ? "<strong>처리완료</strong>"
            : `<button onclick="completeRepair(${x.id})">
                완료처리
               </button>`
        }
      </div>
    `
    )
    .join("");
}

function completeRepair(id) {
  inspections = inspections.map(x => {
    if (x.id === id) {
      x.completed = true;
    }
    return x;
  });

  localStorage.setItem(
    "inspections",
    JSON.stringify(inspections)
  );

  renderAll();
}

window.completeRepair =
  completeRepair;

function renderAll() {
  renderDashboard();
  renderHistory();
  renderRepairs();
}

renderAll();
