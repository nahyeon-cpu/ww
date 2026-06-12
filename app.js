const firebaseConfig = {
  databaseURL: "https://ww99-a2176-default-rtdb.firebaseio.com"
};

const SESSION_KEY = "food_expiry_session";
const CATEGORIES = ["냉장", "냉동", "실온", "채소", "과일", "기타"];

const state = {
  user: null,
  foods: {},
  filter: "all"
};

const $ = (id) => document.getElementById(id);

const el = {
  loginView: $("loginView"),
  mainView: $("mainView"),
  loginForm: $("loginForm"),
  loginName: $("loginName"),
  loginPin: $("loginPin"),
  authMessage: $("authMessage"),
  signupBtn: $("signupBtn"),
  findPinBtn: $("findPinBtn"),
  changePinBtn: $("changePinBtn"),
  helloText: $("helloText"),
  logoutBtn: $("logoutBtn"),
  activeCount: $("activeCount"),
  soonCount: $("soonCount"),
  expiredCount: $("expiredCount"),
  discardedCount: $("discardedCount"),
  addFoodBtn: $("addFoodBtn"),
  categoryFilter: $("categoryFilter"),
  foodFormSection: $("foodFormSection"),
  foodForm: $("foodForm"),
  formTitle: $("formTitle"),
  editingId: $("editingId"),
  foodName: $("foodName"),
  expiryDate: $("expiryDate"),
  category: $("category"),
  quantity: $("quantity"),
  memo: $("memo"),
  cancelBtn: $("cancelBtn"),
  cancelBtn2: $("cancelBtn2"),
  alertList: $("alertList"),
  foodList: $("foodList"),
  categoryStats: $("categoryStats"),
  monthStats: $("monthStats"),
  pinDialog: $("pinDialog"),
  dialogTitle: $("dialogTitle"),
  dialogText: $("dialogText"),
  dialogName: $("dialogName"),
  dialogPin: $("dialogPin"),
  dialogPinLabel: $("dialogPinLabel"),
  dialogConfirm: $("dialogConfirm")
};

function userPath(name) {
  return encodeURIComponent(name.trim());
}

function dbUrl(path) {
  const base = firebaseConfig.databaseURL.replace(/\/$/, "");
  return `${base}/${path}.json`;
}

function todayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateDiff(dateText) {
  const target = new Date(`${dateText}T00:00:00`);
  return Math.ceil((target - todayStart()) / 86400000);
}

function pinIsValid(pin) {
  return /^[0-9]{8}$/.test(pin);
}

function normalizeFood(raw) {
  return {
    n: raw.n || "",
    e: raw.e || "",
    c: raw.c || "기타",
    q: Number(raw.q || 1),
    m: raw.m || "",
    s: raw.s || "active",
    ca: raw.ca || Date.now(),
    da: raw.da || 0
  };
}

async function request(path, options = {}) {
  const hasDbUrl = firebaseConfig.databaseURL.includes("firebaseio.com") || firebaseConfig.databaseURL.includes("firebasedatabase.app");
  if (!hasDbUrl || firebaseConfig.databaseURL.includes("YOUR_PROJECT_ID")) {
    throw new Error("Firebase databaseURL을 app.js에 먼저 입력하세요.");
  }

  const response = await fetch(dbUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error("Firebase 요청에 실패했습니다. DB 주소와 규칙을 확인하세요.");
  }

  return response.json();
}

function setAuthMessage(text, ok = false) {
  el.authMessage.textContent = text;
  el.authMessage.classList.toggle("ok", ok);
}

function setLoading(button, loading) {
  button.disabled = loading;
}

async function getUser(name) {
  return request(`users/${userPath(name)}`);
}

async function saveUser(name, pin) {
  return request(`users/${userPath(name)}`, {
    method: "PATCH",
    body: JSON.stringify({ p: pin, ua: Date.now() })
  });
}

async function login(name, pin) {
  const user = await getUser(name);
  if (!user || user.p !== pin) {
    throw new Error("이름 또는 비밀번호가 맞지 않습니다.");
  }

  state.user = { name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
  await loadFoods();
  showMain();
}

async function signup(name, pin) {
  if (!name.trim()) throw new Error("이름을 입력하세요.");
  if (!pinIsValid(pin)) throw new Error("비밀번호는 숫자 8자리여야 합니다.");

  const existing = await getUser(name);
  if (existing) throw new Error("이미 가입된 이름입니다.");

  await saveUser(name, pin);
  setAuthMessage("가입되었습니다. 이제 로그인하세요.", true);
}

async function changePin(name, pin) {
  if (!name.trim()) throw new Error("이름을 입력하세요.");
  if (!pinIsValid(pin)) throw new Error("새 비밀번호는 숫자 8자리여야 합니다.");

  const existing = await getUser(name);
  if (!existing) throw new Error("가입된 이름을 찾을 수 없습니다.");

  await saveUser(name, pin);
}

async function loadFoods() {
  const data = await request(`users/${userPath(state.user.name)}/f`);
  state.foods = data || {};
  render();
}

async function saveFood(food) {
  const id = el.editingId.value || crypto.randomUUID().slice(0, 12);
  const payload = {
    n: food.name.trim(),
    e: food.expiry,
    c: food.category,
    q: Number(food.quantity || 1),
    s: "active",
    ca: state.foods[id]?.ca || Date.now()
  };

  if (food.memo.trim()) payload.m = food.memo.trim();

  await request(`users/${userPath(state.user.name)}/f/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  await loadFoods();
}

async function deleteFood(id) {
  await request(`users/${userPath(state.user.name)}/f/${id}`, { method: "DELETE" });
  await loadFoods();
}

async function discardFood(id) {
  await request(`users/${userPath(state.user.name)}/f/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ s: "discarded", da: Date.now() })
  });
  await loadFoods();
}

function showMain() {
  el.loginView.classList.add("hidden");
  el.mainView.classList.remove("hidden");
  el.helloText.textContent = `${state.user.name}님, 안녕하세요`;
}

function showLogin() {
  state.user = null;
  state.foods = {};
  localStorage.removeItem(SESSION_KEY);
  el.mainView.classList.add("hidden");
  el.loginView.classList.remove("hidden");
  el.loginPin.value = "";
}

function openFoodForm(foodId = "") {
  const food = foodId ? normalizeFood(state.foods[foodId]) : null;
  el.foodFormSection.classList.remove("hidden");
  el.formTitle.textContent = food ? "식품 수정" : "식품 추가";
  el.editingId.value = foodId;
  el.foodName.value = food?.n || "";
  el.expiryDate.value = food?.e || "";
  el.category.value = food?.c || "냉장";
  el.quantity.value = food?.q || 1;
  el.memo.value = food?.m || "";
  el.foodName.focus();
}

function closeFoodForm() {
  el.foodForm.reset();
  el.editingId.value = "";
  el.quantity.value = 1;
  el.foodFormSection.classList.add("hidden");
}

function sortedFoods() {
  return Object.entries(state.foods)
    .map(([id, food]) => [id, normalizeFood(food)])
    .filter(([, food]) => state.filter === "all" || food.c === state.filter)
    .sort((a, b) => {
      if (a[1].s !== b[1].s) return a[1].s === "active" ? -1 : 1;
      return a[1].e.localeCompare(b[1].e);
    });
}

function statusBadge(food) {
  if (food.s === "discarded") return { text: "폐기됨", cls: "" };
  const diff = dateDiff(food.e);
  if (diff < 0) return { text: `${Math.abs(diff)}일 지남`, cls: "expired" };
  if (diff === 0) return { text: "오늘까지", cls: "soon" };
  if (diff <= 3) return { text: `${diff}일 남음`, cls: "soon" };
  return { text: `${diff}일 남음`, cls: "" };
}

function render() {
  const entries = Object.entries(state.foods).map(([id, food]) => [id, normalizeFood(food)]);
  const active = entries.filter(([, food]) => food.s === "active");
  const discarded = entries.filter(([, food]) => food.s === "discarded");
  const soon = active.filter(([, food]) => {
    const diff = dateDiff(food.e);
    return diff >= 0 && diff <= 3;
  });
  const expired = active.filter(([, food]) => dateDiff(food.e) < 0);

  el.activeCount.textContent = active.length;
  el.soonCount.textContent = soon.length;
  el.expiredCount.textContent = expired.length;
  el.discardedCount.textContent = discarded.length;

  renderAlerts([...expired, ...soon].sort((a, b) => a[1].e.localeCompare(b[1].e)));
  renderFoodList(sortedFoods());
  renderCategoryStats(active);
  renderMonthStats(discarded);
}

function renderAlerts(items) {
  if (!items.length) {
    el.alertList.innerHTML = `<p class="empty">유통기한 임박 또는 지난 식품이 없습니다.</p>`;
    return;
  }

  el.alertList.innerHTML = items.map(([, food]) => {
    const diff = dateDiff(food.e);
    const text = diff < 0 ? "유통기한이 지났습니다." : diff === 0 ? "오늘까지입니다." : `${diff}일 전 알림 대상입니다.`;
    return `<article class="alert-card"><strong>${escapeHtml(food.n)}</strong><p>${escapeHtml(text)} ${food.e}</p></article>`;
  }).join("");
}

function renderFoodList(items) {
  if (!items.length) {
    el.foodList.innerHTML = `<p class="empty">등록된 식품이 없습니다.</p>`;
    return;
  }

  el.foodList.innerHTML = items.map(([id, food]) => {
    const badge = statusBadge(food);
    const note = food.m ? `<p>${escapeHtml(food.m)}</p>` : "";
    const disabled = food.s === "discarded" ? "disabled" : "";

    return `
      <article class="food-card ${food.s === "discarded" ? "discarded" : ""}">
        <div class="food-title">
          <h3>${escapeHtml(food.n)}</h3>
          <span class="badge ${badge.cls}">${badge.text}</span>
        </div>
        <div class="meta">
          <span>유통기한 ${food.e}</span>
          <span>${escapeHtml(food.c)}</span>
          <span>수량 ${food.q}</span>
        </div>
        ${note}
        <div class="card-actions">
          <button type="button" data-action="edit" data-id="${id}" ${disabled}>수정</button>
          <button type="button" data-action="discard" data-id="${id}" ${disabled}>폐기</button>
          <button type="button" class="danger" data-action="delete" data-id="${id}">삭제</button>
        </div>
      </article>`;
  }).join("");
}

function renderCategoryStats(active) {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  active.forEach(([, food]) => {
    counts[food.c] = (counts[food.c] || 0) + 1;
  });
  renderBars(el.categoryStats, counts);
}

function renderMonthStats(discarded) {
  const counts = {};
  discarded.forEach(([, food]) => {
    const date = food.da ? new Date(food.da) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  renderBars(el.monthStats, counts, "폐기 기록이 없습니다.");
}

function renderBars(target, counts, emptyText = "표시할 데이터가 없습니다.") {
  const items = Object.entries(counts).filter(([, count]) => count > 0);
  if (!items.length) {
    target.innerHTML = `<p class="empty">${emptyText}</p>`;
    return;
  }

  const max = Math.max(...items.map(([, count]) => count), 1);
  target.innerHTML = items.map(([name, count]) => `
    <div class="bar-row">
      <span>${escapeHtml(name)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.max(8, (count / max) * 100)}%"></span></span>
      <strong>${count}</strong>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function openPinDialog(mode) {
  el.dialogName.value = "";
  el.dialogPin.value = "";
  el.dialogPinLabel.classList.toggle("hidden", mode === "find");
  el.dialogTitle.textContent = mode === "find" ? "비밀번호 찾기" : "비밀번호 수정";
  el.dialogText.textContent = mode === "find"
    ? "가입한 이름을 입력하면 현재 비밀번호를 확인합니다."
    : "가입한 이름과 새 8자리 숫자 비밀번호를 입력하세요.";

  el.dialogConfirm.onclick = async (event) => {
    event.preventDefault();
    try {
      setLoading(el.dialogConfirm, true);
      const name = el.dialogName.value.trim();
      if (mode === "find") {
        const user = await getUser(name);
        if (!user) throw new Error("가입된 이름을 찾을 수 없습니다.");
        el.dialogText.textContent = `현재 비밀번호는 ${user.p} 입니다.`;
      } else {
        await changePin(name, el.dialogPin.value);
        el.pinDialog.close();
        setAuthMessage("비밀번호가 수정되었습니다.", true);
      }
    } catch (error) {
      el.dialogText.textContent = error.message;
    } finally {
      setLoading(el.dialogConfirm, false);
    }
  };

  el.pinDialog.showModal();
}

el.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage("");
  const submit = event.submitter || el.loginForm.querySelector("button[type='submit']");
  try {
    setLoading(submit, true);
    await login(el.loginName.value.trim(), el.loginPin.value);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    setLoading(submit, false);
  }
});

el.signupBtn.addEventListener("click", async () => {
  try {
    setLoading(el.signupBtn, true);
    await signup(el.loginName.value.trim(), el.loginPin.value);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    setLoading(el.signupBtn, false);
  }
});

el.findPinBtn.addEventListener("click", () => openPinDialog("find"));
el.changePinBtn.addEventListener("click", () => openPinDialog("change"));
el.logoutBtn.addEventListener("click", showLogin);
el.addFoodBtn.addEventListener("click", () => openFoodForm());
el.cancelBtn.addEventListener("click", closeFoodForm);
el.cancelBtn2.addEventListener("click", closeFoodForm);

el.categoryFilter.addEventListener("change", () => {
  state.filter = el.categoryFilter.value;
  render();
});

el.foodForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const food = {
    name: el.foodName.value,
    expiry: el.expiryDate.value,
    category: el.category.value,
    quantity: el.quantity.value,
    memo: el.memo.value
  };

  if (!food.name.trim() || !food.expiry) return;

  try {
    setLoading(event.submitter, true);
    await saveFood(food);
    closeFoodForm();
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(event.submitter, false);
  }
});

el.foodList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    openFoodForm(id);
    return;
  }

  if (action === "delete" && !confirm("이 식품을 삭제할까요?")) return;
  if (action === "discard" && !confirm("이 식품을 폐기 처리할까요?")) return;

  try {
    setLoading(button, true);
    if (action === "delete") await deleteFood(id);
    if (action === "discard") await discardFood(id);
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(button, false);
  }
});

(async function init() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return;

  try {
    state.user = JSON.parse(saved);
    await loadFoods();
    showMain();
  } catch {
    showLogin();
  }
})();
