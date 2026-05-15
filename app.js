const { createClient } = supabase;
const sb = createClient(
  "https://cehuslgiaehogmqybvjp.supabase.co",
  "sb_publishable_BHQuFWv05h0CpZ_gFRz7xA_u8-kwHsD"
);

const defaultProductCatalog = [
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
  admin: 0,
};

const defaultProfiles = {
  Бат: { name: "Бат", email: "bat@batmon.mn", phone: "99110011", age: 29, role: "Борлуулагч", photo: "./assets/batmon-icon.png" },
  Саруул: { name: "Саруул", email: "saruul@batmon.mn", phone: "99220022", age: 27, role: "Борлуулагч", photo: "./assets/batmon-icon.png" },
  bat: { name: "bat", email: "bat@batmon.mn", phone: "99000000", age: 30, role: "Нягтлан", photo: "./assets/batmon-icon.png" },
  admin: { name: "admin", email: "admin@batmon.mn", phone: "99001122", age: 30, role: "Admin", photo: "./assets/batmon-icon.png" },
};

const demoState = {
  currentUser: null,
  activeTab: "home",
  lastActiveAt: Date.now(),
  locked: false,
  selectedPayment: "bank",
  selectedSalesperson: "all",
  orderSalesperson: "",
  adminSection: "employees",
  incomeReportPeriod: "month",
  incomeReportDate: "",
  incomeReportMonth: "",
  incomeReportSalesperson: "all",
  productReportPeriod: "month",
  productReportDate: "",
  productReportMonth: "",
  archiveDateFilter: "",
  archiveNameFilter: "",
  draftCustomer: "",
  draftItems: [],
  monthlyTarget: 30000000,
  salesTargets: structuredClone(salesTargets),
  monthlySalesTargets: {},
  planMonth: "",
  products: structuredClone(defaultProductCatalog),
  profiles: structuredClone(defaultProfiles),
  users: [
    { username: "admin", password: "1234", name: "admin", role: "admin" },
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
const lockScreen = document.querySelector("#lock-screen");
const unlockForm = document.querySelector("#unlock-form");
const unlockCode = document.querySelector("#unlock-code");
const unlockUser = document.querySelector("#unlock-user");
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;
let lockTimer;

const roleLabels = {
  admin: "Admin",
  sales: "Борлуулагч",
  accountant: "Нягтлан",
};

const loginRoleMeta = {
  admin: { label: "Admin", desc: "Системийн тохиргоо", icon: "■" },
  accountant: { label: "Нягтлан", desc: "Тайлан, захиалга", icon: "▣" },
  sales: { label: "Борлуулагч", desc: "Борлуулалтын ажилтан", icon: "◆" },
};

const mainTabs = [
  { id: "home", label: "Нүүр", icon: "home" },
  { id: "accounting", label: "Тайлан", icon: "chart" },
  { id: "new-order", label: "Шинэ захиалга", icon: "+" },
  { id: "orders", label: "Захиалга", icon: "calendar" },
  { id: "more", label: "Бусад", icon: "grid" },
];

const tabMap = {
  admin: mainTabs,
  sales: mainTabs,
  accountant: mainTabs,
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
  state.locked = false;
  state.lastActiveAt = Date.now();
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

changeRole.addEventListener("click", showRoleStep);
roleSelect.addEventListener("change", updateSelectedRole);

logoutBtn.addEventListener("click", () => {
  openUserMenu("profile");
});

closeMenu.addEventListener("click", closeUserMenu);
menuLogout.addEventListener("click", () => {
  state.currentUser = null;
  state.locked = false;
  saveState();
  closeUserMenu();
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  lockScreen?.classList.add("hidden");
  showRoleStep();
});

["click", "input", "keydown", "touchstart", "pointerdown"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    () => {
      if (!state.currentUser || state.locked) return;
      state.lastActiveAt = Date.now();
      localStorage.setItem("salesops-state", JSON.stringify(state));
    },
    { passive: true },
  );
});

unlockForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = state.users.find((item) => item.name === state.currentUser?.name && item.role === state.currentUser?.role);
  if (!user || unlockCode.value !== user.password) {
    alert("Код буруу байна.");
    return;
  }
  state.locked = false;
  state.lastActiveAt = Date.now();
  unlockCode.value = "";
  saveState();
  renderApp();
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

function defaultTabForRole() {
  return "home";
}

function findUser(loginName, password, role) {
  return state.users.find((user) => user.username === loginName && user.password === password && user.role === role);
}

function defaultUsernameForRole(role) {
  return state.users.find((user) => user.role === role)?.username || "bat-sales";
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
  const visibleViews = ["profile", "employees"];
  if (!visibleViews.includes(view)) view = "profile";
  document.querySelectorAll("[data-menu-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.menuView === view);
    button.classList.toggle("hidden", !visibleViews.includes(button.dataset.menuView));
  });
  if (view === "employees") return renderContactDirectory(menuContent, true);
  renderProfileEditor(profile);
}

function renderContactDirectory(target = menuContent, updateTitle = false) {
  if (updateTitle) menuTitle.textContent = "Ажилчид";
  target.innerHTML = `
    <div class="employee-list contact-directory">
      ${state.users
        .map((user) => {
          const profile = ensureProfile(user.name);
          const phone = String(profile.phone || "").trim();
          return `
            <article class="employee-item contact-card">
              <img src="${profile.photo || "./assets/batmon-icon.png"}" alt="" />
              <div>
                <h4>${profile.name}</h4>
                <span>${roleLabels[user.role] || user.role}</span>
                ${phone ? `<a class="phone-link" href="tel:${phone}">${phone}</a>` : `<span>Утас бүртгээгүй</span>`}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderProfileEditor(profile) {
  menuTitle.textContent = "Профайл";
  menuContent.innerHTML = `
    <article class="profile-card editable-profile">
      <img id="profile-preview" src="${profile.photo || "./assets/batmon-icon.png"}" alt="" />
      <div>
        <h4>${profile.name}</h4>
        <span>${profile.role || roleLabels[state.currentUser.role]}</span>
      </div>
    </article>
    <form id="profile-form" class="menu-form">
      <label>Нэр<input id="profile-name" value="${profile.name || ""}" /></label>
      <label>И-мэйл<input id="profile-email" value="${profile.email || ""}" /></label>
      <label>Утас<input id="profile-phone" value="${profile.phone || ""}" /></label>
      <label>Нас<input id="profile-age" type="number" min="16" value="${profile.age || ""}" /></label>
      <label>Зураг upload<input id="profile-photo-file" type="file" accept="image/*" /></label>
      <button class="primary-action" type="submit">Хадгалах</button>
    </form>
  `;
  let nextPhoto = profile.photo || "./assets/batmon-icon.png";
  document.querySelector("#profile-photo-file").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      nextPhoto = reader.result;
      document.querySelector("#profile-preview").src = nextPhoto;
    });
    reader.readAsDataURL(file);
  });
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
      photo: nextPhoto || "./assets/batmon-icon.png",
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

function renderEmployeesMenu(target = menuContent, rerender = () => renderUserMenu("employees"), showTitle = true) {
  if (showTitle) menuTitle.textContent = "Ажилчид";
  target.innerHTML = `
    ${state.currentUser.role === "admin" ? `
      <details class="add-user-panel">
        <summary>Шинэ хэрэглэгч нэмэх</summary>
        <form id="add-user-form" class="menu-form">
          <label>Нэр<input id="new-user-name" required /></label>
          <label>
            Эрх
            <select id="new-user-role">
              <option value="sales">Борлуулагч</option>
              <option value="accountant">Нягтлан</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>Нэвтрэх нэр<input id="new-user-username" required /></label>
          <label>Нууц үг<input id="new-user-password" value="1234" required /></label>
          <label>И-мэйл<input id="new-user-email" type="email" /></label>
          <label>Утас<input id="new-user-phone" /></label>
          <label>Нас<input id="new-user-age" type="number" min="16" /></label>
          <label>Сарын борлуулалтын төлөвлөгөө<input id="new-user-sales-target" type="number" min="0" value="8000000" /></label>
          <button class="primary-action" type="submit">Хэрэглэгч нэмэх</button>
        </form>
      </details>
    ` : ""}
    <div class="employee-list">
      ${state.users
        .map((user, index) => {
          const profile = ensureProfile(user.name);
          return `
            <article class="employee-item admin-user-card">
              <img src="${profile.photo || "./assets/batmon-icon.png"}" alt="" />
              <div>
                <h4>${profile.name}</h4>
                <span>${roleLabels[user.role]} · ${profile.phone || "Утас бүртгээгүй"}</span>
                <label>Нэвтрэх нэр<input data-user-field="username" data-user-index="${index}" value="${user.username}" /></label>
                <label>Code<input data-user-field="password" data-user-index="${index}" value="${user.password}" /></label>
                <div class="mini-row">
                  <button class="secondary-action compact-action" type="button" data-save-user="${index}">Хадгалах</button>
                  ${user.name === state.currentUser.name ? "" : `<button class="danger-action compact-action" type="button" data-delete-user="${index}">Устгах</button>`}
                </div>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
  const addUserForm = document.querySelector("#add-user-form");
  if (addUserForm) addUserForm.addEventListener("submit", addNewUser);
  target.querySelectorAll("[data-save-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.saveUser);
      const user = state.users[index];
      if (!user) return;
      user.username = document.querySelector(`[data-user-field="username"][data-user-index="${index}"]`).value.trim();
      user.password = document.querySelector(`[data-user-field="password"][data-user-index="${index}"]`).value;
      saveState();
      rerender();
    });
  });
  target.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.deleteUser);
      const user = state.users[index];
      if (!user || user.name === state.currentUser.name) return;
      if (!confirm(`${user.name} хэрэглэгчийг устгах уу?`)) return;
      state.users.splice(index, 1);
      delete state.profiles[user.name];
      delete state.salesTargets[user.name];
      saveState();
      renderApp();
      rerender();
    });
  });
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
    photo: "./assets/batmon-icon.png",
  };
  state.salesTargets[newUser.name] = Number(document.querySelector("#new-user-sales-target").value || 0);
  saveState();
  renderApp();
  if (state.activeTab === "more") renderMoreView();
  else renderUserMenu("employees");
}

function renderProductsMenu(target = menuContent, rerender = () => renderUserMenu("products"), showTitle = true) {
  if (showTitle) menuTitle.textContent = "Бараа";
  target.innerHTML = `
    <form id="product-form" class="menu-form">
      <label>Барааны нэр<input id="new-product-name" required /></label>
      <label>Үнэ<input id="new-product-price" type="number" min="0" value="0" required /></label>
      <button class="primary-action" type="submit">Бараа нэмэх</button>
    </form>
    <div class="employee-list">
      ${state.products
        .map(
          (product, index) => `
            <article class="employee-item product-admin-card">
              <div>
                <label>Нэр<input data-product-field="name" data-product-index="${index}" value="${product.name}" /></label>
                <label>Үнэ<input data-product-field="price" data-product-index="${index}" type="number" min="0" value="${product.price}" /></label>
                <div class="mini-row">
                  <button class="secondary-action compact-action" type="button" data-save-product="${index}">Хадгалах</button>
                  <button class="danger-action compact-action" type="button" data-delete-product="${index}">Устгах</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
  document.querySelector("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#new-product-name").value.trim();
    const price = Number(document.querySelector("#new-product-price").value || 0);
    if (!name) return;
    state.products.push({ name, price });
    saveState();
    rerender();
  });
  target.querySelectorAll("[data-save-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.saveProduct);
      if (!state.products[index]) return;
      state.products[index].name = document.querySelector(`[data-product-field="name"][data-product-index="${index}"]`).value.trim();
      state.products[index].price = Number(document.querySelector(`[data-product-field="price"][data-product-index="${index}"]`).value || 0);
      saveState();
      rerender();
    });
  });
  target.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.deleteProduct);
      if (!state.products[index]) return;
      if (!confirm(`${state.products[index].name} барааг устгах уу?`)) return;
      state.products.splice(index, 1);
      saveState();
      rerender();
    });
  });
}

function renderPlanSettings(target = menuContent, rerender = () => renderUserMenu("plans"), showTitle = true) {
  if (showTitle) menuTitle.textContent = "Төлөвлөгөө";
  target.innerHTML = `
    <form id="plan-form" class="menu-form">
      <label>Сар<input id="plan-month" type="month" /></label>
      <label>
        Хэрэглэгч
        <select id="plan-person">
          ${salespersonNames().map((name) => `<option value="${name}">${name}</option>`).join("")}
        </select>
      </label>
      <label>Сарын борлуулалтын төлөвлөгөө<input id="plan-sales" type="number" min="0" /></label>
      <button class="primary-action" type="submit">Төлөвлөгөө хадгалах</button>
    </form>
  `;
  const monthInput = document.querySelector("#plan-month");
  const personSelect = document.querySelector("#plan-person");
  const salesInput = document.querySelector("#plan-sales");
  monthInput.value = state.planMonth || currentMonth();
  const syncPlanInputs = () => {
    salesInput.value = salesTargetFor(personSelect.value, monthInput.value);
  };
  personSelect.addEventListener("change", syncPlanInputs);
  monthInput.addEventListener("change", syncPlanInputs);
  syncPlanInputs();
  document.querySelector("#plan-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.planMonth = monthInput.value || currentMonth();
    state.monthlySalesTargets[state.planMonth] = state.monthlySalesTargets[state.planMonth] || {};
    state.monthlySalesTargets[state.planMonth][personSelect.value] = Number(salesInput.value || 0);
    saveState();
    renderApp();
    rerender();
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
  initialState.monthlySalesTargets = initialState.monthlySalesTargets || {};
  initialState.planMonth = initialState.planMonth || currentMonth();
  initialState.products = Array.isArray(initialState.products) ? initialState.products : structuredClone(defaultProductCatalog);
  initialState.profiles = { ...structuredClone(defaultProfiles), ...(initialState.profiles || {}) };
  initialState.users = [...(demoState.users || []), ...(initialState.users || [])].filter(
    (user, index, users) => users.findIndex((item) => item.username === user.username) === index,
  ).filter((user) => user.role !== "staff");
  initialState.selectedSalesperson = initialState.selectedSalesperson || "all";
  initialState.orderSalesperson = initialState.orderSalesperson || salespersonNamesFromState(initialState)[0] || "";
  if (initialState.selectedSalesperson !== "all" && !initialState.users.some((user) => user.role === "sales" && user.name === initialState.selectedSalesperson)) {
    initialState.selectedSalesperson = "all";
  }
  initialState.incomeReportPeriod = initialState.incomeReportPeriod || "month";
  initialState.incomeReportDate = initialState.incomeReportDate || today();
  initialState.incomeReportMonth = initialState.incomeReportMonth || currentMonth();
  initialState.incomeReportSalesperson = initialState.incomeReportSalesperson || "all";
  initialState.productReportPeriod = initialState.productReportPeriod || "month";
  initialState.productReportDate = initialState.productReportDate || today();
  initialState.productReportMonth = initialState.productReportMonth || currentMonth();
  initialState.archiveDateFilter = initialState.archiveDateFilter || "";
  initialState.archiveNameFilter = initialState.archiveNameFilter || "";
  initialState.lastActiveAt = Number(initialState.lastActiveAt || Date.now());
  initialState.locked = Boolean(initialState.locked && initialState.currentUser);
  const validTabs = {
    admin: ["home", "accounting", "new-order", "orders", "more"],
    sales: ["home", "accounting", "new-order", "orders", "more"],
    accountant: ["home", "accounting", "new-order", "orders", "more"],
  };
  if (initialState.currentUser?.role === "staff") initialState.currentUser = null;
  if (!validTabs[initialState.currentUser?.role]?.includes(initialState.activeTab)) {
    initialState.activeTab = defaultTabForRole(initialState.currentUser?.role);
  }
  return initialState;
}

function prepareRuntimeState(target) {
  target.products = Array.isArray(target.products) ? target.products : structuredClone(defaultProductCatalog);
  target.users = [...(demoState.users || []), ...(target.users || [])]
    .filter((user, index, users) => users.findIndex((item) => item.username === user.username) === index)
    .filter((user) => user.role !== "staff");
  target.profiles = { ...structuredClone(defaultProfiles), ...(target.profiles || {}) };
  target.salesTargets = { ...salesTargets, ...(target.salesTargets || {}) };
  target.monthlySalesTargets = target.monthlySalesTargets || {};
  target.planMonth = target.planMonth || currentMonth();
  target.orders = (target.orders || []).map(normalizeOrder);
  if (target.currentUser?.role === "staff") target.currentUser = null;
  if (target.currentUser && !tabMap[target.currentUser.role]?.some((tab) => tab.id === target.activeTab)) {
    target.activeTab = defaultTabForRole(target.currentUser.role);
  }
  target.incomeReportDate = target.incomeReportDate || today();
  target.incomeReportMonth = target.incomeReportMonth || currentMonth();
  target.productReportDate = target.productReportDate || today();
  target.productReportMonth = target.productReportMonth || currentMonth();
  target.orderSalesperson = target.orderSalesperson || salespersonNamesFromState(target)[0] || "";
  target.lastActiveAt = Number(target.lastActiveAt || Date.now());
  target.locked = Boolean(target.locked && target.currentUser);
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

function salespersonNames() {
  return salespersonNamesFromState(state);
}

function salespersonNamesFromState(source) {
  return [
    ...new Set([
      ...(source.users || []).filter((user) => user.role === "sales").map((user) => user.name),
      ...(source.orders || []).map((order) => order.salesperson),
    ]),
  ].filter(Boolean);
}

function ensureProfile(name = state.currentUser?.name) {
  if (!name) return null;
  if (!state.profiles[name]) {
    state.profiles[name] = {
      name,
      email: `${name}@batmon.mn`,
      phone: "",
      age: "",
      role: roleLabels[state.currentUser?.role] || "Борлуулагч",
      photo: "./assets/batmon-icon.png",
    };
  }
  return state.profiles[name];
}

function salesTargetFor(name, month = currentMonth()) {
  return Number(state.monthlySalesTargets?.[month]?.[name] ?? state.salesTargets?.[name] ?? 8000000);
}

function renderPersonSelect(targetId, value, onChange) {
  const target = document.querySelector(targetId);
  if (!target) return;
  const names = salespersonNames();
  target.innerHTML = `
    <section class="tool-panel selector-panel">
      <label>
        Борлуулагч сонгох
        <select id="${targetId.replace("#", "")}-select">
          <option value="all" ${value === "all" ? "selected" : ""}>Бүгд</option>
          ${names
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
  startLockTimer();
  userTitle.textContent = `${state.currentUser.name}, сайн байна уу`;
  currentRole.textContent = roleLabels[state.currentUser.role];
  renderTabs();
  renderView();
  renderLockState();
}

function startLockTimer() {
  if (lockTimer) return;
  lockTimer = setInterval(checkInactivityLock, 30000);
}

function checkInactivityLock() {
  if (!state.currentUser || state.locked) return;
  if (Date.now() - Number(state.lastActiveAt || Date.now()) < LOCK_TIMEOUT_MS) return;
  state.locked = true;
  saveState();
  renderLockState();
}

function renderLockState() {
  if (!lockScreen) return;
  if (!state.currentUser || !state.locked) {
    lockScreen.classList.add("hidden");
    return;
  }
  unlockUser.textContent = state.currentUser.name;
  lockScreen.classList.remove("hidden");
  setTimeout(() => unlockCode?.focus(), 0);
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
  const names = new Set(salespersonNames());
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

function reportDatePrefix(period, dateValue, monthValue) {
  return period === "day" ? dateValue || today() : monthValue || currentMonth();
}

function scopedReportOrders({ period = "month", date = today(), month = currentMonth(), salesperson = "all" } = {}) {
  const prefix = reportDatePrefix(period, date, month);
  return state.orders
    .filter((order) => order.createdAt?.startsWith(prefix))
    .filter((order) => salesperson === "all" || order.salesperson === salesperson);
}

function incomeMetrics(orders = scopedReportOrders()) {
  const totalIncome = orders.reduce((sum, order) => sum + Number(order.paid || 0), 0);
  const expectedIncome = orders.reduce((sum, order) => sum + orderTotal(order), 0);
  const unpaidIncome = Math.max(0, expectedIncome - totalIncome);
  const paidOrders = orders.filter((order) => order.status === "paid").length;
  return { orders, totalIncome, expectedIncome, unpaidIncome, paidOrders };
}

function topProducts(orders = scopedReportOrders()) {
  const totals = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = totals.get(item.product) || { product: item.product, quantity: 0, total: 0 };
      existing.quantity += Number(item.quantity || 0);
      existing.total += Number(item.quantity || 0) * Number(item.price || 0);
      totals.set(item.product, existing);
    });
  });
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity || b.total - a.total);
}

function incomeReportOrders() {
  return scopedReportOrders({
    period: state.incomeReportPeriod,
    date: state.incomeReportDate,
    month: state.incomeReportMonth,
    salesperson: state.incomeReportSalesperson,
  });
}

function productReportOrders() {
  return scopedReportOrders({
    period: state.productReportPeriod,
    date: state.productReportDate,
    month: state.productReportMonth,
  });
}

function reportLabel(period, dateValue, monthValue) {
  return reportDatePrefix(period, dateValue, monthValue);
}

function downloadIncomeReport() {
  const orders = incomeReportOrders();
  const metrics = incomeMetrics(orders);
  const rows = [
    ["Огноо", "Борлуулагч", "Харилцагч", "Бараа", "Нийт дүн", "Хүлээн авсан", "Төлөв", "Төлбөр"],
    ...orders.map((order) => [
      order.createdAt,
      order.salesperson,
      order.customer,
      order.items.map((item) => `${item.product} ${item.quantity}ш`).join("; "),
      orderTotal(order),
      order.paid,
      order.status === "paid" ? "Төлөгдсөн" : "Төлөгдөөгүй",
      order.payment === "bank" ? "Дансаар" : "Бэлнээр",
    ]),
    ["Нийт", "", "", "", metrics.expectedIncome, metrics.totalIncome, "", ""],
  ];
  downloadCsv(rows, `batmon-orlogo-${reportLabel(state.incomeReportPeriod, state.incomeReportDate, state.incomeReportMonth)}.csv`);
}

function downloadProductReport() {
  const rows = [
    ["Бараа", "Тоо ширхэг", "Нийт дүн"],
    ...topProducts(productReportOrders()).map((item) => [item.product, item.quantity, item.total]),
  ];
  const totals = rows.slice(1).reduce(
    (sum, row) => ({ quantity: sum.quantity + Number(row[1] || 0), total: sum.total + Number(row[2] || 0) }),
    { quantity: 0, total: 0 },
  );
  rows.push(["Нийт", totals.quantity, totals.total]);
  downloadCsv(rows, `batmon-baraa-${reportLabel(state.productReportPeriod, state.productReportDate, state.productReportMonth)}.csv`);
}

function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
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
      const primary = tab.id === "new-order" ? "primary-tab" : "";
      return `<button class="tab-button ${active} ${primary}" type="button" data-tab="${tab.id}"><span class="tab-icon">${iconSvg(tab.icon)}</span><span>${tab.label}</span></button>`;
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
  if (state.activeTab === "home") return renderHomeView();
  if (state.activeTab === "accounting") return renderAccountingView();
  if (state.activeTab === "new-order") return renderOrderView(true);
  if (state.activeTab === "orders") return renderOrdersView();
  if (state.activeTab === "more") return renderMoreView();
  state.activeTab = defaultTabForRole(state.currentUser.role);
  saveState();
  return renderView();
}

function renderScreenHero(title, subtitle = "", actionHtml = "") {
  return `
    <section class="screen-hero">
      <div class="status-row"><span>9:41</span><span class="system-icons"><i></i><i></i><i></i>${iconSvg("pulse")}</span></div>
      <div class="hero-main">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        ${actionHtml}
      </div>
    </section>
  `;
}

function ordersForCurrentRole() {
  if (state.currentUser.role === "sales") return state.orders.filter((order) => order.salesperson === state.currentUser.name);
  return state.orders;
}

function renderHomeView() {
  view.innerHTML = `
    <section class="prompt-home">
      <header class="prompt-home-hero">
        <div class="prompt-home-top">
          <img src="./assets/batmon-icon.png" alt="Batmon" class="prompt-logo" />
          <button class="prompt-bell" type="button" data-open-menu aria-label="Мэдэгдэл">${iconSvg("bell")}</button>
        </div>
        <div class="prompt-home-copy">
          <h1>Сайн байна уу</h1>
          <p>Өнөөдрийн борлуулалтын тойм</p>
        </div>
      </header>

      <div class="prompt-home-content">
        <section class="prompt-kpi-grid" aria-label="Товч үзүүлэлт">
          ${[
            ["wallet", "Нийт орлого", "263,000₮", "blue"],
            ["file", "Захиалга", "12", "orange"],
            ["checkedFile", "Төлөгдсөн", "180,000₮", "green"],
            ["pulse", "Үлдэгдэл", "83,000₮", "purple"],
          ].map(([icon, label, value, tone]) => `
            <article class="prompt-kpi-card">
              <span class="prompt-icon-box ${tone}">${iconSvg(icon)}</span>
              <p>${label}</p>
              <strong>${value}</strong>
            </article>
          `).join("")}
        </section>

        <section class="prompt-recent-card">
          <div class="prompt-section-head">
            <h2>Сүүлийн захиалга</h2>
            <button type="button" data-goto-orders>Бүгд</button>
          </div>
          <div class="prompt-order-list">
            ${[
              ["#1024", "Миний дэлгүүр", "Өнөөдөр", "125,000₮", "Шинэ", "new"],
              ["#1023", "OD Paper", "Өчигдөр", "89,000₮", "Баталгаажсан", "confirmed"],
              ["#1022", "Office Plus", "05/15", "49,000₮", "Хүргэгдсэн", "delivered"],
            ].map(([number, company, date, price, status, tone]) => `
              <article class="prompt-order-row">
                <span class="prompt-order-icon">${iconSvg("file")}</span>
                <div class="prompt-order-main">
                  <strong>${number}</strong>
                  <p>${company}</p>
                  <small>${date}</small>
                </div>
                <div class="prompt-order-side">
                  <strong>${price}</strong>
                  <span class="prompt-status ${tone}">${status}</span>
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      </div>
    </section>
  `;
  document.querySelector("[data-open-menu]")?.addEventListener("click", () => openUserMenu("profile"));
  document.querySelector("[data-goto-orders]")?.addEventListener("click", () => { state.activeTab = "orders"; saveState(); renderApp(); });
}

function renderOrderCards(orders, editable = true) {
  return orders.length ? orders.map((order) => {
    const total = orderTotal(order);
    const balance = Math.max(0, total - Number(order.paid || 0));
    const statusLabel = order.status === "paid" ? "Төлөгдсөн" : "Төлөгдөөгүй";
    const canDelete = editable && order.status !== "paid" && (state.currentUser.role === "accountant" || (state.currentUser.role === "sales" && order.salesperson === state.currentUser.name));
    return `
      <article class="mobile-order-card">
        <div class="order-card-icon ${order.status === "paid" ? "paid" : "unpaid"}">${iconSvg(order.status === "paid" ? "checkedFile" : "file")}</div>
        <div class="order-card-main">
          <div class="order-card-top"><strong>#Z-${String(order.id).slice(-6)}</strong><span class="status-pill ${order.status}">${statusLabel}</span></div>
          <p>${order.customer}</p>
          <small>${order.salesperson} · ${order.createdAt} · ${order.items.length} бараа</small>
        </div>
        <div class="order-card-money"><strong>${money(total)}</strong><span>Төлсөн: ${money(order.paid)}</span><span>Үлдэгдэл: ${money(balance)}</span>${canDelete ? `<button class="delete-order-btn icon-delete" data-order-id="${order.id}" type="button">Устгах</button>` : ""}</div>
      </article>
    `;
  }).join("") : `<p class="empty-note">Захиалга алга байна.</p>`;
}

function renderOrdersView() {
  const scoped = ordersForCurrentRole();
  const paid = scoped.reduce((sum, order) => sum + Number(order.paid || 0), 0);
  const total = scoped.reduce((sum, order) => sum + orderTotal(order), 0);
  view.innerHTML = `
    ${renderScreenHero("Захиалга", "Бүх захиалга, төлөв, төлбөрийн мэдээлэл", `<button class="hero-action" type="button" data-goto-new>+ Шинэ захиалга</button>`)}
    <section class="mobile-panel overlap-panel order-filter-panel">
      <input id="orders-search" placeholder="Харилцагч, захиалгын дугаар хайх" />
      <div class="mobile-filter-row">
        <input id="orders-date" type="date" value="" />
        <select id="orders-person"><option value="all">Бүх борлуулагч</option>${salespersonNames().map((name) => `<option value="${name}">${name}</option>`).join("")}</select>
      </div>
      <div class="orders-total-strip"><span>Нийт захиалга <strong>${scoped.length}</strong></span><span>Нийт дүн <strong>${money(total)}</strong></span><span>Төлсөн <strong>${money(paid)}</strong></span><span>Үлдэгдэл <strong>${money(Math.max(0, total - paid))}</strong></span></div>
    </section>
    <section class="status-tabs"><button class="active">Бүгд</button><button>Шинэ</button><button>Баталгаажсан</button><button>Хүргэгдсэн</button><button>Цуцлагдсан</button></section>
    <section id="orders-card-list" class="mobile-order-list">${renderOrderCards(scoped)}</section>
  `;
  document.querySelector("[data-goto-new]")?.addEventListener("click", () => { state.activeTab = "new-order"; saveState(); renderApp(); });
  document.querySelector("#orders-date")?.addEventListener("change", renderFilteredOrders);
  document.querySelector("#orders-person")?.addEventListener("change", renderFilteredOrders);
  document.querySelector("#orders-search")?.addEventListener("input", renderFilteredOrders);
  bindOrderCardActions();
}

function renderFilteredOrders() {
  const q = document.querySelector("#orders-search")?.value.trim().toLowerCase() || "";
  const date = document.querySelector("#orders-date")?.value || "";
  const person = document.querySelector("#orders-person")?.value || "all";
  const orders = ordersForCurrentRole().filter((order) => (!date || order.createdAt?.startsWith(date)) && (person === "all" || order.salesperson === person) && (!q || [order.customer, order.salesperson, String(order.id)].some((value) => String(value || "").toLowerCase().includes(q))));
  document.querySelector("#orders-card-list").innerHTML = renderOrderCards(orders);
  bindOrderCardActions();
}

function bindOrderCardActions() {
  document.querySelectorAll(".delete-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const order = state.orders.find((item) => String(item.id) === button.dataset.orderId);
      if (!order || order.status === "paid") return;
      const canDelete = state.currentUser.role === "accountant" || (state.currentUser.role === "sales" && order.salesperson === state.currentUser.name);
      if (!canDelete) return;
      if (!confirm("Энэ төлөгдөөгүй захиалгыг устгах уу?")) return;
      state.orders = state.orders.filter((item) => String(item.id) !== button.dataset.orderId);
      saveState();
      renderView();
    });
  });
}

function iconSvg(name) {
  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V12"/><path d="M12 20V6"/><path d="M19 20V9"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v3"/><path d="M17 4v3"/><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M8 14h3"/><path d="M13 14h3"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12H4z"/><path d="M4 7l12-3v3"/><path d="M16 13h4"/></svg>`,
    pulse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-7 4 13 2-6h6"/></svg>`,
    file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`,
    checkedFile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-5"/></svg>`,
    box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 8-4 8 4-8 4z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/></svg>`,
    users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M17 14a5 5 0 0 1 4.5 5"/></svg>`,
    building: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V5l9-2v18"/><path d="M14 9h5v12"/><path d="M8 8h2"/><path d="M8 12h2"/><path d="M8 16h2"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13 11 22 2 13V4h9z"/><path d="M7 8h.01"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.5v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2h3a1.5 1.5 0 0 1 1.4 1l1 3a1.5 1.5 0 0 1-.4 1.5L8.8 9A12 12 0 0 0 15 15.2l1.5-1.7a1.5 1.5 0 0 1 1.5-.4l3 1a1.5 1.5 0 0 1 1 1.4Z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.05.05-2.1 2.1-.05-.05a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V20.5h-3v-.11A1.8 1.8 0 0 0 10.4 18.7a1.8 1.8 0 0 0-2 .36l-.05.05-2.1-2.1.05-.05a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.65-1.1H5v-3h.11a1.8 1.8 0 0 0 1.65-1.1 1.8 1.8 0 0 0-.36-2l-.05-.05 2.1-2.1.05.05a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1.1-1.65V3.5h3v.11a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.05-.05 2.1 2.1-.05.05a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.65 1.1H21v3h-.11a1.8 1.8 0 0 0-1.49 1.14Z"/></svg>`,
  };
  return icons[name] || name;
}

function renderMoreView() {
  const adminQuick = state.currentUser.role === "admin" ? `
    <section class="mobile-panel overlap-panel more-quick-panel">
      <h3>Түргэн хандалт</h3>
      <div class="quick-grid six-grid">
        <button type="button" data-admin-section="employees"><span>${iconSvg("users")}</span>Ажилчид</button>
        <button type="button" data-admin-section="products"><span>${iconSvg("box")}</span>Бараа</button>
        <button type="button" data-admin-section="plans"><span>${iconSvg("chart")}</span>Төлөвлөгөө</button>
        <button type="button" data-menu-profile><span>${iconSvg("user")}</span>Профайл</button>
        <button type="button" data-goto-orders><span>${iconSvg("calendar")}</span>Захиалга</button>
        <button type="button" data-goto-report><span>${iconSvg("file")}</span>Тайлан</button>
      </div>
      <div class="more-summary-grid">
        <article><span>${iconSvg("box")}</span><strong>${state.products.length}</strong><p>Бараа</p></article>
        <article><span>${iconSvg("users")}</span><strong>${state.users.length}</strong><p>Хэрэглэгч</p></article>
        <article><span>${iconSvg("building")}</span><strong>${state.orders.length}</strong><p>Захиалга</p></article>
      </div>
    </section>
    <section class="mobile-panel admin-workspace"><div id="admin-section-content"></div></section>
  ` : `
    <section class="mobile-panel overlap-panel more-quick-panel"><h3>Миний цэс</h3><div class="quick-grid"><button type="button" data-menu-profile><span>${iconSvg("user")}</span>Профайл</button><button type="button" data-menu-employees><span>${iconSvg("phone")}</span>Ажилчид</button></div></section>
    <section class="mobile-panel"><h3>Ажилчид</h3><div id="more-contact-directory"></div></section>
  `;
  view.innerHTML = `
    ${renderScreenHero("Бусад", "Компанийн тохиргоо, хэрэглэгч, бараа, ангилал зэрэг", `<button class="hero-icon" type="button" data-open-menu>${iconSvg("settings")}</button>`)}
    ${adminQuick}
  `;
  document.querySelector("[data-open-menu]")?.addEventListener("click", () => openUserMenu("profile"));
  document.querySelector("[data-menu-profile]")?.addEventListener("click", () => openUserMenu("profile"));
  document.querySelector("[data-menu-employees]")?.addEventListener("click", () => openUserMenu("employees"));
  document.querySelector("[data-goto-orders]")?.addEventListener("click", () => { state.activeTab = "orders"; saveState(); renderApp(); });
  document.querySelector("[data-goto-report]")?.addEventListener("click", () => { state.activeTab = "accounting"; saveState(); renderApp(); });
  if (state.currentUser.role === "admin") {
    state.adminSection = state.adminSection || "employees";
    document.querySelectorAll("[data-admin-section]").forEach((button) => {
      button.classList.toggle("active", button.dataset.adminSection === state.adminSection);
      button.addEventListener("click", () => { state.adminSection = button.dataset.adminSection; saveState(); renderMoreView(); });
    });
    renderAdminSection();
  } else {
    renderContactDirectory(document.querySelector("#more-contact-directory"));
  }
}

function renderAdminView() {
  state.adminSection = state.adminSection || "employees";
  view.innerHTML = `
    <section class="dashboard-card admin-home">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Admin</p>
          <h3>Системийн удирдлага</h3>
        </div>
      </div>
      <div class="summary-grid in-panel">
        <article class="summary-card"><span>Хэрэглэгч</span><strong>${state.users.length}</strong></article>
        <article class="summary-card"><span>Бараа</span><strong>${state.products.length}</strong></article>
        <article class="summary-card"><span>Борлуулагч</span><strong>${salespersonNames().length}</strong></article>
        <article class="summary-card"><span>Захиалга</span><strong>${state.orders.length}</strong></article>
      </div>
      <div class="admin-action-grid admin-tabs">
        <button class="secondary-action ${state.adminSection === "employees" ? "active-admin-tab" : ""}" type="button" data-admin-section="employees">Ажилчид</button>
        <button class="secondary-action ${state.adminSection === "products" ? "active-admin-tab" : ""}" type="button" data-admin-section="products">Бараа</button>
        <button class="secondary-action ${state.adminSection === "plans" ? "active-admin-tab" : ""}" type="button" data-admin-section="plans">Төлөвлөгөө</button>
      </div>
    </section>
    <section class="tool-panel admin-workspace">
      <div class="section-heading">
        <h3>${state.adminSection === "employees" ? "Ажилчид" : state.adminSection === "products" ? "Бараа" : "Төлөвлөгөө"}</h3>
        <span>Admin</span>
      </div>
      <div id="admin-section-content"></div>
    </section>
  `;
  document.querySelectorAll("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminSection = button.dataset.adminSection;
      saveState();
      renderAdminView();
    });
  });
  renderAdminSection();
}

function renderAdminSection() {
  const target = document.querySelector("#admin-section-content");
  const rerender = () => (state.activeTab === "more" ? renderMoreView() : renderAdminView());
  if (state.adminSection === "products") return renderProductsMenu(target, rerender, false);
  if (state.adminSection === "plans") return renderPlanSettings(target, rerender, false);
  return renderEmployeesMenu(target, rerender, false);
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

function renderOrderView(formOnly = false) {
  view.innerHTML = renderScreenHero("Шинэ захиалга", "Захиалгын мэдээллээ оруулна уу", `<button class="hero-action" type="button" disabled>Ноорог хадгалах</button>`) + document.querySelector("#order-view").innerHTML;
  const customerInput = document.querySelector("#customer");
  const productSelect = document.querySelector("#product");
  const priceInput = document.querySelector("#price");
  const paidInput = document.querySelector("#paid");
  let scopedOrders = state.orders.filter((order) => order.salesperson === state.currentUser.name && order.status !== "paid");

  if (["accountant", "admin"].includes(state.currentUser.role) && !formOnly) {
    renderPersonSelect("#accountant-order-tools", state.selectedSalesperson, (value) => {
      state.selectedSalesperson = value;
      if (value !== "all") state.orderSalesperson = value;
      saveState();
      renderOrderView(formOnly);
    });
    renderSalesDashboard(state.selectedSalesperson);
    scopedOrders = state.selectedSalesperson === "all" ? state.orders : state.orders.filter((order) => order.salesperson === state.selectedSalesperson);
  } else {
    document.querySelector("#sales-dashboard")?.remove();
  }

  renderAccountantOrderOwner();
  customerInput.value = state.draftCustomer;
  const catalog = state.products.length ? state.products : defaultProductCatalog;
  productSelect.innerHTML = catalog.map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
  priceInput.value = catalog[0]?.price || 0;
  paidInput.value = draftTotal() || catalog[0]?.price || 0;

  productSelect.addEventListener("change", () => {
    const selected = catalog.find((item) => item.name === productSelect.value);
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
    const salesperson = ["accountant", "admin"].includes(state.currentUser.role) ? state.orderSalesperson : state.currentUser.name;
    if (!salesperson || salesperson === "all") {
      alert("Захиалга үүсгэх борлуулагчаа сонгоно уу.");
      return;
    }
    const total = draftTotal();
    const paid = Number(paidInput.value);
    state.orders.unshift({
      id: Date.now(),
      salesperson,
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

  const list = document.querySelector("#order-list");
  if (formOnly && list) {
    list.remove();
  } else {
    renderOrderList("#order-list", scopedOrders);
  }
}

function renderAccountantOrderOwner() {
  const target = document.querySelector("#accountant-order-owner");
  if (!target) return;
  if (!["accountant", "admin"].includes(state.currentUser.role)) {
    target.innerHTML = "";
    return;
  }
  const names = salespersonNames();
  if (!names.includes(state.orderSalesperson)) state.orderSalesperson = names[0] || "";
  target.innerHTML = `
    <section class="order-owner-card">
      <label>
        Энэ захиалгыг хэнд үүсгэх вэ?
        <select id="order-salesperson">
          ${names.map((name) => `<option value="${name}" ${state.orderSalesperson === name ? "selected" : ""}>${name}</option>`).join("")}
        </select>
      </label>
    </section>
  `;
  target.querySelector("#order-salesperson").addEventListener("change", (event) => {
    state.orderSalesperson = event.target.value;
    saveState();
  });
}

function renderDraftItems() {
  const target = document.querySelector("#draft-items");
  const total = draftTotal();
  target.innerHTML = state.draftItems.length
    ? `
      <div class="order-table-head"><span>Бараа</span><span>Тоо</span><span>Нэгж үнэ</span><span>Нийт</span><span></span></div>
      <div class="order-lines">
        ${state.draftItems
          .map(
            (item, index) => `
              <div class="order-line">
                <div class="order-product-cell">
                  <span class="line-product-icon">${iconSvg("box")}</span>
                  <div>
                  <strong>${item.product}</strong>
                    <span>SKU: BAT-${String(index + 1).padStart(3, "0")}</span>
                  </div>
                </div>
                <span class="line-qty">${item.quantity}</span>
                <span>${money(item.price)}</span>
                <strong>${money(item.quantity * item.price)}</strong>
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
      const canDelete =
        order.status !== "paid" &&
        (state.currentUser.role === "accountant" || (state.currentUser.role === "sales" && order.salesperson === state.currentUser.name));
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
            ${
              order.status === "paid"
                ? ""
                : `<select class="status-select" data-order-status="${order.id}">
                    <option value="paid">Төлөгдсөн</option>
                    <option value="unpaid" selected>Төлөгдөөгүй</option>
                  </select>`
            }
          </div>
          <p>Борлуулагч: ${order.salesperson} · ${order.createdAt}</p>
${canDelete
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
      const order = state.orders.find((item) => String(item.id) === button.dataset.orderId);
      if (!order || order.status === "paid") return;
      const canDelete =
        state.currentUser.role === "accountant" || (state.currentUser.role === "sales" && order.salesperson === state.currentUser.name);
      if (!canDelete) return;
      if (!confirm("Энэ төлөгдөөгүй захиалгыг устгах уу?")) return;
      state.orders = state.orders.filter(
        (order) => String(order.id) !== button.dataset.orderId
      );
      saveState();
      renderView();
    });
  });
}

function renderReportFilters() {
  const target = document.querySelector("#income-report-tools");
  if (!target) return;
  target.innerHTML = `
    <div class="report-filter-grid filter-card">
      <label>
        Хугацаа
        <select id="income-report-period">
          <option value="month" ${state.incomeReportPeriod === "month" ? "selected" : ""}>Сараар</option>
          <option value="day" ${state.incomeReportPeriod === "day" ? "selected" : ""}>Өдрөөр</option>
        </select>
      </label>
      <label class="${state.incomeReportPeriod === "day" ? "" : "hidden"}">
        Өдөр
        <input id="income-report-date" type="date" value="${state.incomeReportDate || today()}" />
      </label>
      <label class="${state.incomeReportPeriod === "month" ? "" : "hidden"}">
        Сар
        <input id="income-report-month" type="month" value="${state.incomeReportMonth || currentMonth()}" />
      </label>
      <label>
        Борлуулагч
        <select id="income-report-person">
          <option value="all" ${state.incomeReportSalesperson === "all" ? "selected" : ""}>Бүгд</option>
          ${salespersonNames()
            .map((name) => `<option value="${name}" ${state.incomeReportSalesperson === name ? "selected" : ""}>${name}</option>`)
            .join("")}
        </select>
      </label>
    </div>
  `;

  document.querySelector("#income-report-period").addEventListener("change", (event) => {
    state.incomeReportPeriod = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-date").addEventListener("change", (event) => {
    state.incomeReportDate = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-month").addEventListener("change", (event) => {
    state.incomeReportMonth = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-person").addEventListener("change", (event) => {
    state.incomeReportSalesperson = event.target.value;
    saveState();
    renderAccountingView();
  });
}

function renderProductReportPanel() {
  const orders = productReportOrders();
  const products = topProducts(orders);
  const totalQuantity = products.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = products.reduce((sum, item) => sum + Number(item.total || 0), 0);
  document.querySelector("#top-products-panel").innerHTML = `
    <div class="section-heading">
      <h3>Их зарагдсан бараа</h3>
      <span>${reportLabel(state.productReportPeriod, state.productReportDate, state.productReportMonth)}</span>
    </div>
    <div class="report-filter-grid filter-card">
      <label>
        Хугацаа
        <select id="product-report-period">
          <option value="month" ${state.productReportPeriod === "month" ? "selected" : ""}>Сараар</option>
          <option value="day" ${state.productReportPeriod === "day" ? "selected" : ""}>Өдрөөр</option>
        </select>
      </label>
      <label class="${state.productReportPeriod === "day" ? "" : "hidden"}">
        Өдөр
        <input id="product-report-date" type="date" value="${state.productReportDate || today()}" />
      </label>
      <label class="${state.productReportPeriod === "month" ? "" : "hidden"}">
        Сар
        <input id="product-report-month" type="month" value="${state.productReportMonth || currentMonth()}" />
      </label>
    </div>
    <div class="rank-list">
      ${products
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
        .join("") || `<p class="empty-note">Энэ хугацаанд барааны борлуулалт алга.</p>`}
    </div>
    <div class="summary-grid in-panel">
      <article class="summary-card"><span>Нийт ширхэг</span><strong>${totalQuantity}ш</strong></article>
      <article class="summary-card"><span>Нийт дүн</span><strong>${money(totalAmount)}</strong></article>
    </div>
    <button id="download-product-report" class="secondary-action report-action" type="button">Барааны тайлан татах</button>
  `;

  document.querySelector("#product-report-period").addEventListener("change", (event) => {
    state.productReportPeriod = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#product-report-date").addEventListener("change", (event) => {
    state.productReportDate = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#product-report-month").addEventListener("change", (event) => {
    state.productReportMonth = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#download-product-report").addEventListener("click", downloadProductReport);
}

function renderAccountingView() {
  const reportOrders = incomeReportOrders();
  const income = incomeMetrics(reportOrders);
  const periodText = reportLabel(state.incomeReportPeriod, state.incomeReportDate, state.incomeReportMonth);
  const productRows = topProducts(productReportOrders());
  const productQuantity = productRows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const productAmount = productRows.reduce((sum, item) => sum + Number(item.total || 0), 0);
  view.innerHTML = `
    ${renderScreenHero("Тайлан", "Тайлангаа шүүж, татаж авах боломжтой.", `<button class="hero-action report-hero-button" type="button" data-download-hero>${iconSvg("file")} Тайлан татах</button>`)}
    <section class="mobile-panel overlap-panel report-filter-panel">
      <div class="report-filter-grid mock-filter-grid">
        <label>
          Огноо
          <div class="input-shell">${iconSvg("calendar")}
            <select id="income-report-period">
              <option value="month" ${state.incomeReportPeriod === "month" ? "selected" : ""}>Сараар</option>
              <option value="day" ${state.incomeReportPeriod === "day" ? "selected" : ""}>Өдрөөр</option>
            </select>
          </div>
        </label>
        <label class="${state.incomeReportPeriod === "day" ? "" : "hidden"}">
          Өдөр
          <div class="input-shell">${iconSvg("calendar")}<input id="income-report-date" type="date" value="${state.incomeReportDate || today()}" /></div>
        </label>
        <label class="${state.incomeReportPeriod === "month" ? "" : "hidden"}">
          Сар
          <div class="input-shell">${iconSvg("calendar")}<input id="income-report-month" type="month" value="${state.incomeReportMonth || currentMonth()}" /></div>
        </label>
        <label>
          Борлуулагч
          <div class="input-shell">${iconSvg("user")}
            <select id="income-report-person">
              <option value="all" ${state.incomeReportSalesperson === "all" ? "selected" : ""}>Бүгд</option>
              ${salespersonNames().map((name) => `<option value="${name}" ${state.incomeReportSalesperson === name ? "selected" : ""}>${name}</option>`).join("")}
            </select>
          </div>
        </label>
      </div>
      <div class="report-note"><span>${iconSvg("pulse")}</span>Огноо болон борлуулагч сонгосны дараа тайлан татах файлын мэдээлэл таны сонголтоор харагдана.</div>
    </section>
    <section class="mobile-panel selected-report-panel">
      <div class="selected-report-top">
        <div>
          <h3>Сонгосон тайлан</h3>
          <p><b>Огноо:</b> ${periodText}</p>
          <p><b>Борлуулагч:</b> ${state.incomeReportSalesperson === "all" ? "Бүгд" : state.incomeReportSalesperson}</p>
        </div>
        <span class="report-illustration">${iconSvg("file")}</span>
      </div>
      <div class="download-section">
        <h3>Тайлан татах</h3>
        <div class="download-grid">
          <button id="download-income-report" type="button" class="download-card excel"><span>X</span><strong>Excel файл</strong><small>.csv</small></button>
          <button id="download-product-report" type="button" class="download-card pdf"><span>PDF</span><strong>Барааны тайлан</strong><small>.csv</small></button>
        </div>
      </div>
      <div class="report-note compact"><span>↓</span>Тайлан таны сонгосон огноо, борлуулагчийн дагуу үүснэ.</div>
    </section>
    <section class="mobile-panel report-summary-panel">
      <h3>Товч мэдээлэл</h3>
      <div class="report-summary-grid">
        <article><span class="blue">${iconSvg("wallet")}</span><p>Нийт орлого</p><strong>${money(income.totalIncome)}</strong></article>
        <article><span class="green">${iconSvg("box")}</span><p>Нийт захиалга</p><strong>${income.orders.length}</strong></article>
        <article><span class="orange">${iconSvg("pulse")}</span><p>Хүлээгдэж буй дүн</p><strong>${money(income.unpaidIncome)}</strong></article>
        <article><span class="purple">${iconSvg("checkedFile")}</span><p>Төлөгдсөн дүн</p><strong>${money(income.totalIncome)}</strong></article>
      </div>
    </section>
    <section class="mobile-panel product-report-card">
      <div class="section-heading"><h3>Их зарагдсан бараа</h3><span>${reportLabel(state.productReportPeriod, state.productReportDate, state.productReportMonth)}</span></div>
      <div class="report-filter-grid mock-filter-grid product-mini-filter">
        <label>
          Хугацаа
          <div class="input-shell">${iconSvg("calendar")}
            <select id="product-report-period">
              <option value="month" ${state.productReportPeriod === "month" ? "selected" : ""}>Сараар</option>
              <option value="day" ${state.productReportPeriod === "day" ? "selected" : ""}>Өдрөөр</option>
            </select>
          </div>
        </label>
        <label class="${state.productReportPeriod === "day" ? "" : "hidden"}">
          Өдөр
          <div class="input-shell">${iconSvg("calendar")}<input id="product-report-date" type="date" value="${state.productReportDate || today()}" /></div>
        </label>
        <label class="${state.productReportPeriod === "month" ? "" : "hidden"}">
          Сар
          <div class="input-shell">${iconSvg("calendar")}<input id="product-report-month" type="month" value="${state.productReportMonth || currentMonth()}" /></div>
        </label>
      </div>
      <div class="rank-list">
        ${productRows.map((item, index) => `
          <article class="rank-item report-rank-item">
            <strong>${index + 1}</strong>
            <div><h4>${item.product}</h4><span>${item.quantity}ш · ${money(item.total)}</span></div>
          </article>
        `).join("") || `<p class="empty-note">Энэ хугацаанд барааны борлуулалт алга.</p>`}
      </div>
      <div class="summary-grid in-panel">
        <article class="summary-card"><span>Нийт ширхэг</span><strong>${productQuantity}ш</strong></article>
        <article class="summary-card"><span>Нийт дүн</span><strong>${money(productAmount)}</strong></article>
      </div>
    </section>
    <section class="mobile-panel sales-index-card">
      <div class="section-heading"><h3>Борлуулагчийн index</h3><span>${currentMonth()}</span></div>
      <div class="index-list">
        ${salesPeopleIndex().map((person) => `
          <article class="index-item">
            <div class="index-head"><strong>${person.name}</strong><span>${person.percent}%</span></div>
            <p>${money(person.total)} / ${money(person.target)}</p>
            <div class="progress-bar"><i style="width:${person.percent}%"></i></div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
  document.querySelector("#income-report-period").addEventListener("change", (event) => {
    state.incomeReportPeriod = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-date")?.addEventListener("change", (event) => {
    state.incomeReportDate = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-month")?.addEventListener("change", (event) => {
    state.incomeReportMonth = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#income-report-person").addEventListener("change", (event) => {
    state.incomeReportSalesperson = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#product-report-period").addEventListener("change", (event) => {
    state.productReportPeriod = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#product-report-date")?.addEventListener("change", (event) => {
    state.productReportDate = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#product-report-month")?.addEventListener("change", (event) => {
    state.productReportMonth = event.target.value;
    saveState();
    renderAccountingView();
  });
  document.querySelector("#download-income-report").addEventListener("click", downloadIncomeReport);
  document.querySelector("#download-product-report").addEventListener("click", downloadProductReport);
  document.querySelector("[data-download-hero]")?.addEventListener("click", downloadIncomeReport);
}

(async () => {
  const { data } = await sb.from("app_state").select("data").eq("id", 1).maybeSingle();
  if (data?.data) Object.assign(state, data.data);
  prepareRuntimeState(state);
  renderApp();
})();


