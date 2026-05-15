const { createClient } = supabase;
const sb = createClient(
  "https://cehuslgiaehogmqybvjp.supabase.co",
  "sb_publishable_BHQuFWv05h0CpZ_gFRz7xA_u8-kwHsD"
);

const productCatalog = [
  { name: "Цай 500гр", price: 25000 },
  { name: "Кофе 1кг", price: 42000 },
  { name: "Ундаа 1л", price: 3500 },
  { name: "Печень 400гр", price: 6800 },
  { name: "Ус 0.5л", price: 1200 },
  { name: "Чихэр 1кг", price: 18500 },
];

const salesTargets = {
  Бат: 12000000,
  Саруул: 10000000,
  bat: 8000000,
};

const defaultProfiles = {
  Бат: { name: "Бат", email: "bat@batmon.mn", phone: "99110011", age: 29, role: "Борлуулагч", photo: "./assets/batmon-icon.png" },
  Саруул: { name: "Саруул", email: "saruul@batmon.mn", phone: "99220022", age: 27, role: "Борлуулагч", photo: "./assets/batmon-icon.png" },
  bat: { name: "bat", email: "bat@batmon.mn", phone: "99000000", age: 30, role: "Нягтлан", photo: "./assets/batmon-icon.png" },
};

const demoState = {
  currentUser: null,
  activeTab: "order",
  selectedPayment: "bank",
  selectedSalesperson: "all",
  archiveDateFilter: "",
  archiveNameFilter: "",
  draftCustomer: "",
  draftItems: [],
  monthlyTarget: 30000000,
  salesTargets: structuredClone(salesTargets),
  profiles: structuredClone(defaultProfiles),
  users: [
    { username: "bat", password: "1234", name: "bat", role: "accountant" },
    { username: "bat-sales", password: "1234", name: "Бат", role: "sales" },
    { username: "saruul", password: "1234", name: "Саруул", role: "sales" },
  ],
  orders: [
    {
      id: 101,
      salesperson: "Бат",
      customer: "Номин Дархан",
      items: [{ product: "Цай 500гр", quantity: 8, price: 25000 }],
      paid: 200000,
      payment: "bank",
      status: "paid",
      createdAt: "2026-05-14 10:24",
    },
    {
      id: 102,
      salesperson: "Саруул",
      customer: "Мини маркет 24",
      items: [
        { product: "Кофе 1кг", quantity: 3, price: 42000 },
        { product: "Ус 0.5л", quantity: 10, price: 1200 },
      ],
      paid: 138000,
      payment: "cash",
      status: "paid",
      createdAt: "2026-05-14 11:05",
    },
  ],
};

const state = loadState();

const loginScreen = document.querySelector("#login-screen");
const appScreen = document.querySelector("#app-screen");
const loginForm = document.querySelector("#login-form");
const roleStep = document.querySelector("#role-step");
const loginStep = document.querySelector("#login-step");
const roleSelect = document.querySelector("#role-select");
const username = document.querySelector("#username");
const backToRoles = document.querySelector("#back-to-roles");
const changeRole = document.querySelector("#change-role");
const selectedRoleIcon = document.querySelector("#selected-role-icon");
const selectedRoleName = document.querySelector("#selected-role-name");
const selectedRoleDesc = document.querySelector("#selected-role-desc");
const logoutBtn = document.querySelector("#logout-btn");
const userMenu = document.querySelector("#user-menu");
const closeMenu = document.querySelector("#close-menu");
const menuContent = document.querySelector("#menu-content");
const menuTitle = document.querySelector("#menu-title");
const menuLogout = document.querySelector("#menu-logout");
const userTitle = document.querySelector("#user-title");
const currentRole = document.querySelector("#current-role");
const tabs = document.querySelector("#tabs");
const view = document.querySelector("#view");

const roleLabels = {
  sales: "Борлуулагч",
  staff: "Ажилтан",
  accountant: "Нягтлан",
};

const loginRoleMeta = {
  accountant: { label: "Нягтлан", desc: "Системийн админ", icon: "▣" },
  staff: { label: "Ажилтан", desc: "Компанийн ажилтан", icon: "●" },
  sales: { label: "Борлуулагч", desc: "Борлуулалтын ажилтан", icon: "◆" },
};

const tabMap = {
  sales: [
    { id: "order", label: "Захиалга" },
    { id: "sales", label: "Борлуулалт" },
  ],
  staff: [
    { id: "accounting", label: "Тайлан" },
  ],
  accountant: [
    { id: "accounting", label: "Тайлан" },
    { id: "order", label: "Захиалга" },
  ],
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = findUser(username.value.trim(), document.querySelector("#password").value, roleSelect.value);
  if (!user) {
    alert("Нэвтрэх нэр, нууц үг эсвэл эрх буруу байна.");
    return;
  }
  state.currentUser = {
    name: user.name,
    role: user.role,
  };
  ensureProfile(state.currentUser.name).role = roleLabels[state.currentUser.role];
  state.activeTab = defaultTabForRole(state.currentUser.role);
  saveState();
  renderApp();
});

document.querySelectorAll("[data-login-role]").forEach((button) => {
  button.addEventListener("click", () => {
    roleSelect.value = button.dataset.loginRole;
    username.value = defaultUsernameForRole(roleSelect.value);
    updateSelectedRole();
    roleStep.classList.add("hidden");
    loginStep.classList.remove("hidden");
  });
});

backToRoles.addEventListener("click", showRoleStep);
changeRole.addEventListener("click", showRoleStep);
roleSelect.addEventListener("change", updateSelectedRole);

logoutBtn.addEventListener("click", () => {
  openUserMenu("profile");
});

closeMenu.addEventListener("click", closeUserMenu);
menuLogout.addEventListener("click", () => {
  state.currentUser = null;
  saveState();
  closeUserMenu();
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  showRoleStep();
});

userMenu.addEventListener("click", (event) => {
  if (event.target === userMenu) closeUserMenu();
  const viewButton = event.target.closest("[data-menu-view]");
  if (viewButton) renderUserMenu(viewButton.dataset.menuView);
});

function showRoleStep() {
  roleStep.classList.remove("hidden");
  loginStep.classList.add("hidden");
}

function updateSelectedRole() {
  const meta = loginRoleMeta[roleSelect.value] || loginRoleMeta.sales;
  selectedRoleIcon.textContent = meta.icon;
  selectedRoleName.textContent = meta.label;
  selectedRoleDesc.textContent = meta.desc;
}

function defaultTabForRole(role) {
  if (role === "accountant" || role === "staff") return "accounting";
  return "order";
}

function findUser(loginName, password, role) {
  return state.users.find((user) => user.username === loginName && user.password === password && user.role === role);
}

function defaultUsernameForRole(role) {
  return state.users.find((user) => user.role === role)?.username || "bat";
}

function openUserMenu(view = "profile") {
  renderUserMenu(view);
  userMenu.classList.remove("hidden");
}

function closeUserMenu() {
  userMenu.classList.add("hidden");
}

function renderUserMenu(view = "profile") {
  const profile = ensureProfile();
  document.querySelectorAll("[data-menu-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.menuView === view);
    if (button.dataset.menuView === "plans") {
      button.classList.toggle("hidden", state.currentUser.role !== "accountant");
    }
  });
  if (view === "edit") return renderProfileEditor(profile);
  if (view === "employees") return renderEmployeesMenu();
  if (view === "plans" && state.currentUser.role === "accountant") return renderPlanSettings();
  menuTitle.textContent = "Профайл";
  menuContent.innerHTML = `
    <article class="profile-card">
      <img src="${profile.photo || "./assets/batmon-icon.png"}" alt="" />
      <div>
        <h4>${profile.name}</h4>
        <span>${profile.role || roleLabels[state.currentUser.role]}</span>
      </div>
    </article>
    <div class="profile-details">
      <p><strong>И-мэйл</strong><span>${profile.email || "-"}</span></p>
      <p><strong>Утас</strong><span>${profile.phone || "-"}</span></p>
      <p><strong>Нас</strong><span>${profile.age || "-"}</span></p>
      <p><strong>Эрх</strong><span>${roleLabels[state.currentUser.role]}</span></p>
    </div>
  `;
}

function renderProfileEditor(profile) {
  menuTitle.textContent = "Профайл засах";
  menuContent.innerHTML = `
    <form id="profile-form" class="menu-form">
      <label>Нэр<input id="profile-name" value="${profile.name || ""}" /></label>
      <label>И-мэйл<input id="profile-email" value="${profile.email || ""}" /></label>
      <label>Утас<input id="profile-phone" value="${profile.phone || ""}" /></label>
      <label>Нас<input id="profile-age" type="number" min="16" value="${profile.age || ""}" /></label>
      <label>Зураг URL<input id="profile-photo" value="${profile.photo || "./assets/batmon-icon.png"}" /></label>
      <button class="primary-action" type="submit">Хадгалах</button>
    </form>
  `;
  document.querySelector("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const oldName = state.currentUser.name;
    const newName = document.querySelector("#profile-name").value.trim() || oldName;
    const nextProfile = {
      name: newName,
      email: document.querySelector("#profile-email").value.trim(),
      phone: document.querySelector("#profile-phone").value.trim(),
      age: document.querySelector("#profile-age").value,
      role: profile.role || roleLabels[state.currentUser.role],
      photo: document.querySelector("#profile-photo").value.trim() || "./assets/batmon-icon.png",
    };
    if (newName !== oldName) {
      delete state.profiles[oldName];
      state.salesTargets[newName] = state.salesTargets[oldName] || salesTargetFor(oldName);
      state.users.forEach((user) => {
        if (user.name === oldName) user.name = newName;
      });
      state.currentUser.name = newName;
    }
    state.profiles[newName] = nextProfile;
    saveState();
    renderApp();
    renderUserMenu("profile");
  });
}

function renderEmployeesMenu() {
  menuTitle.textContent = "Ажилчид";
  menuContent.innerHTML = `
    ${state.currentUser.role === "accountant" ? `
      <details class="add-user-panel">
        <summary>Шинэ ажилтан нэмэх</summary>
        <form id="add-user-form" class="menu-form">
          <label>Нэр<input id="new-user-name" required /></label>
          <label>
            Эрх
            <select id="new-user-role">
              <option value="sales">Борлуулагч</option>
              <option value="staff">Ажилтан</option>
              <option value="accountant">Нягтлан</option>
            </select>
          </label>
          <label>Нэвтрэх нэр<input id="new-user-username" required /></label>
          <label>Нууц үг<input id="new-user-password" value="1234" required /></label>
          <label>И-мэйл<input id="new-user-email" type="email" /></label>
          <label>Утас<input id="new-user-phone" /></label>
          <label>Нас<input id="new-user-age" type="number" min="16" /></label>
          <label>Зураг URL<input id="new-user-photo" value="./assets/batmon-icon.png" /></label>
          <label>Сарын борлуулалтын төлөвлөгөө<input id="new-user-sales-target" type="number" min="0" value="8000000" /></label>
          <button class="primary-action" type="submit">Хэрэглэгч нэмэх</button>
        </form>
      </details>
    ` : ""}
    <div class="employee-list">
      ${employeeNames()
        .map((name) => {
          const profile = ensureProfile(name);
          return `
            <article class="employee-item">
              <img src="${profile.photo || "./assets/batmon-icon.png"}" alt="" />
              <div>
                <h4>${profile.name}</h4>
                <span>${profile.phone || "Утас бүртгээгүй"}</span>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
  const addUserForm = document.querySelector("#add-user-form");
  if (addUserForm) addUserForm.addEventListener("submit", addNewUser);
}

function addNewUser(event) {
  event.preventDefault();
  const newUser = {
    name: document.querySelector("#new-user-name").value.trim(),
    role: document.querySelector("#new-user-role").value,
    username: document.querySelector("#new-user-username").value.trim(),
    password: document.querySelector("#new-user-password").value,
  };
  if (!newUser.name || !newUser.username || !newUser.password) return;
  if (state.users.some((user) => user.username === newUser.username)) {
    alert("Энэ нэвтрэх нэр бүртгэлтэй байна.");
    return;
  }
  state.users.push(newUser);
  state.profiles[newUser.name] = {
    name: newUser.name,
    email: document.querySelector("#new-user-email").value.trim(),
    phone: document.querySelector("#new-user-phone").value.trim(),
    age: document.querySelector("#new-user-age").value,
    role: roleLabels[newUser.role],
    photo: document.querySelector("#new-user-photo").value.trim() || "./assets/batmon-icon.png",
  };
  state.salesTargets[newUser.name] = Number(document.querySelector("#new-user-sales-target").value || 0);
  saveState();
  renderApp();
  renderUserMenu("employees");
}

function renderPlanSettings() {
  menuTitle.textContent = "Төлөвлөгөө";
  menuContent.innerHTML = `
    <form id="plan-form" class="menu-form">
      <label>
        Ажилтан
        <select id="plan-person">
          ${employeeNames().map((name) => `<option value="${name}">${name}</option>`).join("")}
        </select>
      </label>
      <label>Сарын борлуулалтын төлөвлөгөө<input id="plan-sales" type="number" min="0" /></label>
      <button class="primary-action" type="submit">Төлөвлөгөө хадгалах</button>
    </form>
  `;
  const personSelect = document.querySelector("#plan-person");
  const salesInput = document.querySelector("#plan-sales");
  const syncPlanInputs = () => {
    salesInput.value = salesTargetFor(personSelect.value);
  };
  personSelect.addEventListener("change", syncPlanInputs);
  syncPlanInputs();
  document.querySelector("#plan-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.salesTargets[personSelect.value] = Number(salesInput.value || 0);
    saveState();
    renderApp();
    renderUserMenu("plans");
  });
}

function loadState() {
  const saved = localStorage.getItem("salesops-state");
  const initialState = saved ? { ...structuredClone(demoState), ...JSON.parse(saved) } : structuredClone(demoState);
  initialState.orders = initialState.orders.map(normalizeOrder);
  initialState.draftItems = initialState.draftItems || [];
  initialState.draftCustomer = initialState.draftCustomer || "";
  initialState.monthlyTarget = Number(initialState.monthlyTarget || demoState.monthlyTarget);
  initialState.salesTargets = { ...salesTargets, ...(initialState.salesTargets || {}) };
  initialState.profiles = { ...structuredClone(defaultProfiles), ...(initialState.profiles || {}) };
  initialState.users = [...(demoState.users || []), ...(initialState.users || [])].filter(
    (user, index, users) => users.findIndex((item) => item.username === user.username) === index,
  );
  initialState.selectedSalesperson = initialState.selectedSalesperson || "all";
  initialState.archiveDateFilter = initialState.archiveDateFilter || "";
  initialState.archiveNameFilter = initialState.archiveNameFilter || "";
  const validTabs = {
    sales: ["order", "sales"],
    staff: ["accounting"],
    accountant: ["accounting", "order"],
  };
  if (!validTabs[initialState.currentUser?.role]?.includes(initialState.activeTab)) {
    initialState.activeTab = defaultTabForRole(initialState.currentUser?.role);
  }
  return initialState;
}

function normalizeOrder(order) {
  const normalized = Array.isArray(order.items)
    ? order
    : {
        ...order,
        items: [
          {
            product: order.product || "Бараа",
            quantity: Number(order.quantity || 1),
            price: Number(order.price || 0),
          },
        ],
      };
  const total = orderTotal(normalized);
  return {
    ...normalized,
    paid: Number(normalized.paid || 0),
    status: normalized.status || (Number(normalized.paid || 0) >= total ? "paid" : "unpaid"),
  };
}

async function saveState() {
  localStorage.setItem("salesops-state", JSON.stringify(state));
  await sb.from("app_state").upsert({ id: 1, data: state });
}


function money(value) {
  return new Intl.NumberFormat("mn-MN").format(Math.round(value || 0)) + "₮";
}

function today() {
  return dateKey(new Date());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonth() {
  return today().slice(0, 7);
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
}

function draftTotal() {
  return state.draftItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
}

function employeeNames() {
  return [...new Set([...Object.keys(state.profiles || {}), ...state.orders.map((order) => order.salesperson)])].filter(Boolean);
}

function ensureProfile(name = state.currentUser?.name) {
  if (!name) return null;
  if (!state.profiles[name]) {
    state.profiles[name] = {
      name,
      email: `${name}@batmon.mn`,
      phone: "",
      age: "",
      role: roleLabels[state.currentUser?.role] || "Ажилтан",
      photo: "./assets/batmon-icon.png",
    };
  }
  return state.profiles[name];
}

function salesTargetFor(name) {
  return Number(state.salesTargets?.[name] || 8000000);
}

function renderPersonSelect(targetId, value, onChange) {
  const target = document.querySelector(targetId);
  if (!target) return;
  target.innerHTML = `
    <section class="tool-panel selector-panel">
      <label>
        Ажилтан сонгох
        <select id="${targetId.replace("#", "")}-select">
          <option value="all" ${value === "all" ? "selected" : ""}>Бүгд</option>
          ${employeeNames()
            .map((name) => `<option value="${name}" ${value === name ? "selected" : ""}>${name}</option>`)
            .join("")}
        </select>
      </label>
    </section>
  `;
  const select = target.querySelector("select");
  select.addEventListener("change", () => onChange(select.value));
}

function renderApp() {
  if (!state.currentUser) return;
  ensureProfile(state.currentUser.name);
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  userTitle.textContent = `${state.currentUser.name}, сайн байна уу`;
  currentRole.textContent = roleLabels[state.currentUser.role];
  renderTabs();
  renderView();
}

function salesMetrics(person = "all") {
  const scopedOrders = person === "all" ? state.orders : state.orders.filter((order) => order.salesperson === person);
  const todaysOrders = scopedOrders.filter((order) => order.createdAt?.startsWith(today()));
  const monthlyOrders = scopedOrders.filter((order) => order.createdAt?.startsWith(currentMonth()));
  const daySales = todaysOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const monthSales = monthlyOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const bank = todaysOrders.filter((order) => order.payment === "bank").reduce((sum, order) => sum + order.paid, 0);
  const cash = todaysOrders.filter((order) => order.payment === "cash").reduce((sum, order) => sum + order.paid, 0);
  const target = person === "all" ? state.monthlyTarget : salesTargetFor(person);
  const percent = Math.min(100, Math.round((monthSales / target) * 100));
  return { todaysOrders, monthlyOrders, daySales, monthSales, bank, cash, percent, target };
}

function renderSalesDashboard(person = "all") {
  const target = document.querySelector("#sales-dashboard");
  if (!target) return;
  const metrics = salesMetrics(person);
  const title = person === "all" ? "Нийт борлуулалт" : `${person} - борлуулалт`;
  target.innerHTML = `
    <section class="dashboard-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Борлуулалтын явц</p>
          <h3>${title}</h3>
        </div>
        <strong>${metrics.percent}%</strong>
      </div>
      <div class="progress-wrap">
        <div class="progress-ring" style="--progress:${metrics.percent}">
          <span>${metrics.percent}%</span>
        </div>
        <div class="progress-copy">
          <span>Төлөвлөгөө: ${money(metrics.target)}</span>
          <strong>${money(metrics.monthSales)}</strong>
          <div class="progress-bar"><i style="width:${metrics.percent}%"></i></div>
        </div>
      </div>
      <div class="summary-grid in-panel">
        <article class="summary-card"><span>Өнөөдрийн борлуулалт</span><strong>${money(metrics.daySales)}</strong></article>
        <article class="summary-card"><span>Сарын борлуулалт</span><strong>${money(metrics.monthSales)}</strong></article>
      </div>
    </section>
  `;
}

function salesPeopleIndex() {
  const names = new Set([...Object.keys(state.salesTargets || {}), ...state.orders.map((order) => order.salesperson)]);
  return [...names]
    .map((name) => {
      const total = state.orders
        .filter((order) => order.salesperson === name && order.createdAt?.startsWith(currentMonth()))
        .reduce((sum, order) => sum + orderTotal(order), 0);
      const target = salesTargetFor(name);
      const percent = Math.min(100, Math.round((total / target) * 100));
      return { name, total, target, percent };
    })
    .sort((a, b) => b.percent - a.percent);
}

function paidArchiveOrders() {
  const dateFilter = state.archiveDateFilter || "";
  const nameFilter = (state.archiveNameFilter || "").trim().toLowerCase();
  const ownName = state.currentUser?.name;
  return state.orders
    .filter((order) => order.status === "paid")
    .filter((order) => state.currentUser?.role !== "sales" || order.salesperson === ownName)
    .filter((order) => !dateFilter || order.createdAt?.startsWith(dateFilter))
    .filter((order) => {
      if (!nameFilter) return true;
      return [order.customer, order.salesperson].some((value) => String(value || "").toLowerCase().includes(nameFilter));
    })
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function renderPaidArchive() {
  const dateInput = document.querySelector("#archive-date-filter");
  const nameInput = document.querySelector("#archive-name-filter");
  const list = document.querySelector("#paid-archive-list");
  if (!dateInput || !nameInput || !list) return;

  dateInput.value = state.archiveDateFilter || "";
  nameInput.value = state.archiveNameFilter || "";

  const orders = paidArchiveOrders();
  list.innerHTML = orders.length
    ? orders
        .map((order) => {
          const itemText = order.items.map((item) => `${item.product} · ${item.quantity}ш`).join(", ");
          return `
            <article class="list-item">
              <div class="list-item-header">
                <h4>${order.customer}</h4>
                <span class="status-pill paid">Төлөгдсөн</span>
              </div>
              <p>${itemText}</p>
              <p>Нийт: ${money(orderTotal(order))} · ${order.createdAt}</p>
              <p>Борлуулагч: ${order.salesperson}</p>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-note">Төлөгдсөн захиалга олдсонгүй.</p>`;
}

function incomeMetrics() {
  const monthlyOrders = state.orders.filter((order) => order.createdAt?.startsWith(currentMonth()));
  const totalIncome = monthlyOrders.reduce((sum, order) => sum + Number(order.paid || 0), 0);
  const expectedIncome = monthlyOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const unpaidIncome = Math.max(0, expectedIncome - totalIncome);
  const paidOrders = monthlyOrders.filter((order) => order.status === "paid").length;
  return { monthlyOrders, totalIncome, expectedIncome, unpaidIncome, paidOrders };
}

function topProducts() {
  const totals = new Map();
  state.orders
    .filter((order) => order.createdAt?.startsWith(currentMonth()))
    .forEach((order) => {
      order.items.forEach((item) => {
        const existing = totals.get(item.product) || { product: item.product, quantity: 0, total: 0 };
        existing.quantity += Number(item.quantity || 0);
        existing.total += Number(item.quantity || 0) * Number(item.price || 0);
        totals.set(item.product, existing);
      });
    });
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity || b.total - a.total);
}

function downloadMonthlyIncomeReport() {
  const rows = [
    ["Огноо", "Борлуулагч", "Харилцагч", "Бараа", "Нийт дүн", "Хүлээн авсан", "Төлөв", "Төлбөр"],
    ...incomeMetrics().monthlyOrders.map((order) => [
      order.createdAt,
      order.salesperson,
      order.customer,
      order.items.map((item) => `${item.product} ${item.quantity}ш`).join("; "),
      orderTotal(order),
      order.paid,
      order.status === "paid" ? "Төлөгдсөн" : "Төлөгдөөгүй",
      order.payment === "bank" ? "Дансаар" : "Бэлнээр",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `batmon-orlogo-${currentMonth()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function renderTabs() {
  tabs.innerHTML = tabMap[state.currentUser.role]
    .map((tab) => {
      const active = tab.id === state.activeTab ? "active" : "";
      return `<button class="tab-button ${active}" type="button" data-tab="${tab.id}">${tab.label}</button>`;
    })
    .join("");

  tabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      saveState();
      renderApp();
    });
  });
}

function renderView() {
  if (state.activeTab === "sales" && state.currentUser.role !== "accountant") return renderSalesView();
  if (state.activeTab === "order") return renderOrderView();
  if (state.activeTab === "accounting") return renderAccountingView();
  state.activeTab = defaultTabForRole(state.currentUser.role);
  saveState();
  return renderView();
}

function renderSalesView() {
  view.innerHTML = document.querySelector("#sales-view").innerHTML;
  renderSalesDashboard(state.currentUser.name);
  renderPaidArchive();
  document.querySelector("#archive-date-filter").addEventListener("change", (event) => {
    state.archiveDateFilter = event.target.value;
    saveState();
    renderPaidArchive();
  });
  document.querySelector("#archive-name-filter").addEventListener("input", (event) => {
    state.archiveNameFilter = event.target.value;
    saveState();
    renderPaidArchive();
  });
}

function renderOrderView() {
  view.innerHTML = document.querySelector("#order-view").innerHTML;
  const customerInput = document.querySelector("#customer");
  const productSelect = document.querySelector("#product");
  const priceInput = document.querySelector("#price");
  const paidInput = document.querySelector("#paid");

  if (state.currentUser.role === "accountant") {
    document.querySelector("#order-form").classList.add("hidden");
    renderPersonSelect("#accountant-order-tools", state.selectedSalesperson, (value) => {
      state.selectedSalesperson = value;
      saveState();
      renderOrderView();
    });
    renderSalesDashboard(state.selectedSalesperson);
    const scopedOrders = state.selectedSalesperson === "all" ? state.orders : state.orders.filter((order) => order.salesperson === state.selectedSalesperson);
    renderOrderList("#order-list", scopedOrders);
    return;
  }

  document.querySelector("#sales-dashboard").remove();
  customerInput.value = state.draftCustomer;
  productSelect.innerHTML = productCatalog.map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
  priceInput.value = productCatalog[0].price;
  paidInput.value = draftTotal() || productCatalog[0].price;

  productSelect.addEventListener("change", () => {
    const selected = productCatalog.find((item) => item.name === productSelect.value);
    priceInput.value = selected?.price || 0;
  });

  document.querySelector("#add-item").addEventListener("click", () => {
    const item = {
      product: productSelect.value,
      quantity: Number(document.querySelector("#quantity").value),
      price: Number(priceInput.value),
    };
    if (!item.product || item.quantity < 1) return;
    state.draftCustomer = customerInput.value;
    state.draftItems.push(item);
    saveState();
    renderOrderView();
  });

  renderDraftItems();

  document.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      state.draftCustomer = customerInput.value;
      state.draftItems.splice(Number(button.dataset.removeItem), 1);
      saveState();
      renderOrderView();
    });
  });

  document.querySelectorAll(".mode-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.payment === state.selectedPayment);
    button.addEventListener("click", () => {
      state.selectedPayment = button.dataset.payment;
      saveState();
      renderOrderView();
    });
  });

  document.querySelector("#order-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.draftItems.length) return;
    const total = draftTotal();
    const paid = Number(paidInput.value);
    state.orders.unshift({
      id: Date.now(),
      salesperson: state.currentUser.name,
      customer: customerInput.value,
      items: structuredClone(state.draftItems),
      paid,
      payment: state.selectedPayment,
      status: "unpaid",
      createdAt: `${today()} ${new Date().toTimeString().slice(0, 5)}`,
    });
    state.draftItems = [];
    state.draftCustomer = "";
    saveState();
    renderApp();
  });

  renderOrderList(
    "#order-list",
    state.orders.filter((order) => order.salesperson === state.currentUser.name && order.status !== "paid"),
  );
}

function renderDraftItems() {
  const target = document.querySelector("#draft-items");
  const total = draftTotal();
  target.innerHTML = state.draftItems.length
    ? `
      <div class="order-lines">
        ${state.draftItems
          .map(
            (item, index) => `
              <div class="order-line">
                <div>
                  <strong>${item.product}</strong>
                  <span>${item.quantity}ш · ${money(item.price)} · ${money(item.quantity * item.price)}</span>
                </div>
                <button class="mini-action" type="button" data-remove-item="${index}" aria-label="Хасах">×</button>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="draft-total"><span>Захиалгын нийт дүн</span><strong>${money(total)}</strong></div>
    `
    : `<p class="empty-note">Бараа сонгоод “Нэмэх” дарна.</p>`;
}

function renderOrderList(target, orders) {
  document.querySelector(target).innerHTML = orders
    .map((order) => {
      const total = orderTotal(order);
      const paymentLabel = order.payment === "bank" ? "Дансаар" : "Бэлнээр";
      const itemText = order.items.map((item) => `${item.product} · ${item.quantity}ш`).join(", ");
      const statusLabel = order.status === "paid" ? "Төлөгдсөн" : "Төлөгдөөгүй";
      return `
        <article class="list-item">
          <div class="list-item-header">
            <h4>${order.customer}</h4>
            <span class="badge ${order.payment}">${paymentLabel}</span>
          </div>
          <p>${itemText}</p>
          <p>Нийт: ${money(total)} · Хүлээн авсан: ${money(order.paid)}</p>
          <div class="order-status-row">
            <span class="status-pill ${order.status}">${statusLabel}</span>
            <select class="status-select" data-order-status="${order.id}">
              <option value="paid" ${order.status === "paid" ? "selected" : ""}>Төлөгдсөн</option>
              <option value="unpaid" ${order.status === "unpaid" ? "selected" : ""}>Төлөгдөөгүй</option>
            </select>
          </div>
          <p>Борлуулагч: ${order.salesperson} · ${order.createdAt}</p>
${state.currentUser.role === "accountant" 
  ? `<button class="delete-order-btn" data-order-id="${order.id}">🗑 Устгах</button>` 
  : ""}
</article>    
      `;
    })
    .join("");

document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const order = state.orders.find((item) => String(item.id) === select.dataset.orderStatus);
      if (!order) return;
      order.status = select.value;
      saveState();
      renderView();
    });
  });
  document.querySelectorAll(".delete-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.currentUser.role !== "accountant") return;
      if (!confirm("Зөвхөн нягтлан захиалга устгана. Энэ захиалгыг бүр мөсөн устгах уу?")) return;
      state.orders = state.orders.filter(
        (order) => String(order.id) !== button.dataset.orderId
      );
      saveState();
      renderView();
    });
  });
}
function renderAccountingView() {
  view.innerHTML = document.querySelector("#accounting-view").innerHTML;
  if (state.currentUser.role === "staff") {
    const profile = ensureProfile(state.currentUser.name);
    document.querySelector("#accounting-stats").innerHTML = [
      ["Нэр", profile.name || state.currentUser.name],
      ["И-мэйл", profile.email || "-"],
      ["Утас", profile.phone || "-"],
      ["Нас", profile.age || "-"],
    ]
      .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
    document.querySelector("#sales-index-panel").classList.add("hidden");
    document.querySelector("#income-panel").classList.add("hidden");
    document.querySelector("#top-products-panel").classList.add("hidden");
    document.querySelector("#download-income-report").classList.add("hidden");
    document.querySelector("#accounting-list").innerHTML = "";
    return;
  }

  const metrics = salesMetrics("all");
  const income = incomeMetrics();
  document.querySelector("#accounting-stats").innerHTML = [
    ["Нийт орлого", money(income.totalIncome)],
    ["Хүлээгдэж буй", money(income.expectedIncome)],
    ["Сарын захиалга", metrics.monthlyOrders.length],
    ["Төлөгдсөн захиалга", income.paidOrders],
  ]
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  document.querySelector("#download-income-report").addEventListener("click", downloadMonthlyIncomeReport);

  document.querySelector("#income-panel").innerHTML = `
    <div class="section-heading">
      <h3>Орлогын index</h3>
      <span>${currentMonth()}</span>
    </div>
    <div class="summary-grid in-panel">
      <article class="summary-card"><span>Дансаар</span><strong>${money(metrics.bank)}</strong></article>
      <article class="summary-card"><span>Бэлнээр</span><strong>${money(metrics.cash)}</strong></article>
      <article class="summary-card"><span>Төлөгдөөгүй үлдэгдэл</span><strong>${money(income.unpaidIncome)}</strong></article>
      <article class="summary-card"><span>Орлогын биелэлт</span><strong>${income.expectedIncome ? Math.round((income.totalIncome / income.expectedIncome) * 100) : 0}%</strong></article>
    </div>
  `;

  document.querySelector("#top-products-panel").innerHTML = `
    <div class="section-heading">
      <h3>Их зарагдсан бараа</h3>
      <span>Тоо ширхэгээр</span>
    </div>
    <div class="rank-list">
      ${topProducts()
        .map(
          (item, index) => `
            <article class="rank-item">
              <strong>${index + 1}</strong>
              <div>
                <h4>${item.product}</h4>
                <span>${item.quantity}ш · ${money(item.total)}</span>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;

  document.querySelector("#sales-index-panel").innerHTML = `
    <div class="section-heading">
      <h3>Борлуулагчийн index</h3>
      <span>${currentMonth()}</span>
    </div>
    <div class="index-list">
      ${salesPeopleIndex()
        .map(
          (person) => `
            <article class="index-item">
              <div class="index-head">
                <strong>${person.name}</strong>
                <span>${person.percent}%</span>
              </div>
              <p>${money(person.total)} / ${money(person.target)}</p>
              <div class="progress-bar"><i style="width:${person.percent}%"></i></div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
  document.querySelector("#accounting-list").innerHTML = "";
}

(async () => {
  const { data } = await sb.from("app_state").select("data").eq("id", 1).maybeSingle();
  if (data?.data) Object.assign(state, data.data);
  renderApp();
})();


