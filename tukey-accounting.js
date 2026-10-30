// ▼▼▼ 用这块新代码替换旧的 ACCOUNT_STRUCTURE ▼▼▼
let ACCOUNT_STRUCTURE = {
  普通账户: {
    isAsset: true,
    types: [
      { name: "现金", iconUrl: "https://i.postimg.cc/Vs99GyjW/现金钞票.png" },
      { name: "储蓄卡", iconUrl: "https://i.postimg.cc/G3PP70kJ/储蓄卡.png" },
      {
        name: "微信钱包",
        iconUrl: "https://i.postimg.cc/FFbbWtjb/微信钱包.png",
      },
      {
        name: "支付宝",
        iconUrl: "https://i.postimg.cc/2jddcp4Q/支付宝.png",
      },
      {
        name: "其他",
        iconUrl: "https://i.postimg.cc/MZ00Pkyy/报销_已选中.png",
      },
    ],
  },
  信用账户: {
    isAsset: false,
    types: [
      {
        name: "信用卡",
        iconUrl: "https://i.postimg.cc/nVKKR8vq/信用卡.png",
      },
      {
        name: "花呗",
        iconUrl: "https://i.postimg.cc/kMNN1rxS/花呗.png",
      },
      {
        name: "白条",
        iconUrl: "https://i.postimg.cc/wx55fKhm/京东_白条.png",
      },
      {
        name: "其他",
        iconUrl: "https://i.postimg.cc/2jddcp4B/7.png",
      },
    ],
  },
  投资理财: {
    isAsset: true,
    types: [
      {
        name: "股票",
        iconUrl: "https://i.postimg.cc/sfPP6FpB/股票分析.pngg",
      },
      {
        name: "基金",
        iconUrl: "https://i.postimg.cc/44vvLCz7/基金点击.png",
      },
      { name: "其他", iconUrl: "https://i.postimg.cc/wx55fKh1/投资.png" },
    ],
  },
  充值账户: {
    isAsset: true,
    types: [
      {
        name: "饭卡",
        iconUrl: "https://i.postimg.cc/gcyyS9vn/饭卡2.png",
      },
      {
        name: "公交卡",
        iconUrl: "https://i.postimg.cc/G3PP70k9/公交卡.png",
      },
      {
        name: "其他",
        iconUrl: "https://i.postimg.cc/05GGWgpj/补卡.png",
      },
    ],
  },
  其他账户: {
    isAsset: null,
    types: [
      {
        name: "借入",
        iconUrl: "https://i.postimg.cc/7P11svgL/借入.png",
      },
      {
        name: "借出",
        iconUrl: "https://i.postimg.cc/dQRRHM8s/借出登记.png",
      },
    ],
  },
};
// ▲▲▲ 替换结束 ▲▲▲
// ▼▼▼ 【兔k记账】在JS文件顶部，变量定义区添加 ▼▼▼
let ACCOUNTING_CATEGORIES = {
  expense: [
    {
      name: "餐饮",
      icon: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1763966898357_qdqqd_q6gypk.png",
    },
    {
      name: "购物",
      icon: "https://static.eeo.cn/upload/images/20251124/286655c4437163e96279.png",
    },
    {
      name: "交通",
      icon: "https://static.eeo.cn/upload/images/20251124/83e440191818e2208623.png",
    },
    {
      name: "娱乐",
      icon: "https://zkaicc.huilan.com/aicc/api/aicc-file/miniofile/preViewPicture/aicc/qdqqd_1763967070965.png",
    },
    {
      name: "住房",
      icon: "https://yfupload.hebccw.cn/images/08zygs/wqbs/2025/11/24/1763967177_wqbs.png",
    },
    {
      name: "医疗",
      icon: "https://xiaoiwg.dongfeng-nissan.com.cn/aicc-workbench/res/download/default/temp/images/20251124/21f586446548ec0b99bdd1e7c08adec359069046.png",
    },
    { name: "其他", icon: "https://image.uglycat.cc/yfneo8.png" },
  ],
  income: [
    { name: "工资", icon: "https://image.uglycat.cc/abn2a9.png" },
    { name: "红包", icon: "https://image.uglycat.cc/k4zlkz.png" },
    {
      name: "理财",
      icon: "https://xiaoiwg.dongfeng-nissan.com.cn/aicc-workbench/res/download/default/temp/images/20251124/bb17bb33337885d0a579889b1cb8499d37a15de9.png",
    },
    { name: "其他", icon: "https://image.uglycat.cc/3la2dz.png" },
  ],
};
// ▲▲▲ 添加结束 ▲▲▲
/**
 * 【全新】切换“兔k记账”App内部的页面视图
 * @param {string} viewId - 要显示的目标视图的ID
 */
function switchTukeyView(viewId) {
  // 隐藏所有视图
  document.querySelectorAll(".tukey-view").forEach((view) => {
    view.style.display = "none";
  });

  // 显示目标视图
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.style.display = "block";
  }

  // 更新底部导航栏高亮状态
  document
    .querySelectorAll("#tukey-bottom-nav .tukey-nav-item")
    .forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewId);
    });

  // 根据视图ID更新头部标题
  const headerTitle = document.getElementById("tukey-header-title");
  const navItem = document.querySelector(
    `.tukey-nav-item[data-view="${viewId}"]`,
  );
  if (headerTitle && navItem) {
    headerTitle.textContent = navItem.querySelector("span").textContent;
  }
  // ▼▼▼ 在这里添加一个 case ▼▼▼
  if (viewId === "tukey-reports-view") {
    renderTukeyReportsView(); // 调用我们即将创建的主渲染函数
  }
  // ▲▲▲ 添加结束 ▲▲▲
}
/* --- 【全新】兔k记账-用户设置功能核心函数 --- */
let tukeyUserSettings = {
  // 全局变量，用于缓存用户设置
  id: "main_user",
  avatar: "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg",
  username: "我",
  profession: "",
  syncWithTaobao: false,
};

/**
 * 加载兔k记账的用户设置并渲染到设置页面
 */
async function loadAndRenderTukeyUserSettings() {
  const settings = await db.tukeyUserSettings.get("main_user");
  if (settings) {
    tukeyUserSettings = settings;
  }
  const av = document.getElementById("tukey-user-avatar-preview");
  if (!av) return;
  av.src = tukeyUserSettings.avatar;
  const nm = document.getElementById("tukey-user-name-input");
  if (nm) nm.value = tukeyUserSettings.username;
  const pf = document.getElementById("tukey-user-profession-input");
  if (pf) pf.value = tukeyUserSettings.profession || "";
  const tg = document.getElementById("sync-to-taobao-toggle");
  if (tg) tg.checked = tukeyUserSettings.syncWithTaobao || false;
}

/**
 * 保存兔k记账的用户设置
 */
async function saveTukeyUserSettings() {
  tukeyUserSettings.avatar = document.getElementById(
    "tukey-user-avatar-preview",
  ).src;
  tukeyUserSettings.username =
    document.getElementById("tukey-user-name-input").value.trim() || "我";
  tukeyUserSettings.profession = document
    .getElementById("tukey-user-profession-input")
    .value.trim();
  tukeyUserSettings.syncWithTaobao = document.getElementById(
    "sync-to-taobao-toggle",
  ).checked;

  await db.tukeyUserSettings.put(tukeyUserSettings);
  alert("记账设置已保存！");
}
/* --- 用户设置功能函数结束 --- */
// ▼▼▼ 【全新】兔k记账 - 自定义配置核心函数 ▼▼▼

/**
 * 加载自定义配置并合并到全局变量中
 */
async function loadTukeyCustomConfig() {
  try {
    const config = await db.tukeyCustomConfig.get("main");
    if (config) {
      // 1. 合并自定义收支分类
      if (config.customCategories) {
        // 我们将自定义的追加到默认列表后面，或者完全覆盖（这里选择追加去重，或者简单替换）
        // 为了简单起见，我们假设 config 里存的是“最新的完整列表”
        // 如果你想保留默认项不可删除，可以做合并逻辑。这里我们假设用户配置是最终结果。
        // 但为了防止第一次覆盖掉默认值，我们在保存时会保存完整列表。
        ACCOUNTING_CATEGORIES = config.customCategories;
      }

      // 2. 合并自定义账户结构
      if (config.customAccountStructure) {
        ACCOUNT_STRUCTURE = config.customAccountStructure;
      }
    }
  } catch (e) {
    console.error("加载兔k记账自定义配置失败:", e);
  }
}

/**
 * 保存当前的全局配置到数据库
 */
async function saveTukeyCustomConfig() {
  await db.tukeyCustomConfig.put({
    id: "main",
    customCategories: ACCOUNTING_CATEGORIES,
    customAccountStructure: ACCOUNT_STRUCTURE,
  });
  // console.log("自定义配置已保存");
}

/**
 * 【核心】处理添加自定义收支分类
 * @param {string} type - 'expense' (支出) 或 'income' (收入)
 */
async function handleAddCustomCategory(type) {
  const typeName = type === "expense" ? "支出" : "收入";

  // 1. 输入名称
  const name = await showCustomPrompt(
    `添加${typeName}分类`,
    "请输入分类名称 (例如: 奶茶, 游戏)",
  );
  if (!name || !name.trim()) return;

  // 2. 选择图标来源
  const choice = await showChoiceModal("选择图标", [
    { text: "📁 从本地上传", value: "local" },
    { text: "🌐 使用网络URL", value: "url" },
    { text: "🎲 使用默认图标", value: "default" },
  ]);

  if (!choice) return;

  let iconUrl = "";

  if (choice === "local") {
    iconUrl = await uploadImageLocally();
  } else if (choice === "url") {
    iconUrl = await showCustomPrompt("图标URL", "请输入图片链接", "", "url");
  } else {
    // 默认图标
    iconUrl = "https://i.postimg.cc/y88P16yW/default-icon.png";
  }

  if (!iconUrl) {
    alert("图标无效，添加取消。");
    return;
  }

  // 3. 更新数据
  const newCategory = { name: name.trim(), icon: iconUrl };
  ACCOUNTING_CATEGORIES[type].push(newCategory);

  // 4. 保存并刷新
  await saveTukeyCustomConfig();

  // 重新渲染分类列表 (如果在记账弹窗中)
  const card = document.getElementById("tukey-record-input-card");
  if (card.classList.contains("visible")) {
    // 只有当前是在对应类型的标签页下才刷新
    const activeBtn = card.querySelector(".type-selector .type-btn.active");
    if (activeBtn && activeBtn.dataset.type === type) {
      renderRecordCategories(type); // 重新渲染分类网格
    }
  }

  alert(`分类 "${newCategory.name}" 添加成功！`);
}

/**
 * 【核心】处理添加自定义账户类型
 * @param {string} categoryName - 账户大类名称 (例如 "普通账户", "信用账户")
 */
async function handleAddCustomAccountType(categoryName) {
  // 1. 输入名称
  const name = await showCustomPrompt(
    `添加${categoryName}类型`,
    "请输入类型名称 (例如: 招商银行, 京东金条)",
  );
  if (!name || !name.trim()) return;

  // 2. 选择图标
  const choice = await showChoiceModal("选择图标", [
    { text: "📁 从本地上传", value: "local" },
    { text: "🌐 使用网络URL", value: "url" },
    { text: "🎲 使用默认图标", value: "default" },
  ]);

  if (!choice) return;

  let iconUrl = "";
  if (choice === "local") {
    iconUrl = await uploadImageLocally();
  } else if (choice === "url") {
    iconUrl = await showCustomPrompt("图标URL", "请输入图片链接", "", "url");
  } else {
    iconUrl = "https://i.postimg.cc/y88P16yW/default-icon.png";
  }

  if (!iconUrl) return;

  // 3. 更新数据
  if (ACCOUNT_STRUCTURE[categoryName]) {
    ACCOUNT_STRUCTURE[categoryName].types.push({
      name: name.trim(),
      iconUrl: iconUrl,
    });

    // 4. 保存并刷新
    await saveTukeyCustomConfig();
    openAccountTypeSelector(); // 重新渲染类型选择界面
    alert(`账户类型 "${name.trim()}" 添加成功！`);
  }
}

/**
 * 【辅助】渲染记账弹窗中的分类网格（带添加按钮）
 * 替换掉 switchRecordType 中的简单 innerHTML 生成逻辑
 */
function renderRecordCategories(type) {
  const card = document.getElementById("tukey-record-input-card");
  const grid = card.querySelector(".category-grid");
  grid.innerHTML = "";

  // 渲染现有分类
  ACCOUNTING_CATEGORIES[type].forEach((cat) => {
    grid.innerHTML += `
        <div class="tukey-category-item" data-type="${type}" data-category="${cat.name}">
            <img src="${cat.icon}" alt="${cat.name}">
            <span>${cat.name}</span>
        </div>
    `;
  });

  // ★★★ 添加“自定义”按钮 ★★★
  const addBtn = document.createElement("div");
  addBtn.className = "tukey-category-item add-custom-btn";
  addBtn.innerHTML = `
      <div style="width:40px; height:40px; border-radius:50%; background:#f0f2f5; display:flex; align-items:center; justify-content:center; font-size:24px; color:#999;">+</div>
      <span>自定义</span>
  `;
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // 防止触发选择事件
    handleAddCustomCategory(type);
  });
  grid.appendChild(addBtn);
}
// ▲▲▲ 新增函数结束 ▲▲▲

/* --- 【全新】兔k记账-钱包功能核心函数 --- */

let editingAccountId = null; // 用于追踪正在编辑的账户ID

// ▼▼▼ 【兔k记账】用这整块【V2 - 图标修复版】的代码，替换旧的 renderTukeyWalletView 函数 ▼▼▼
async function renderTukeyWalletView() {
  const listEl = document.getElementById("wallet-accounts-list");
  listEl.innerHTML = "";

  const allAccounts = await db.tukeyAccounts.toArray();

  // --- 1. 计算并显示资产总览 (这部分逻辑不变) ---
  let totalAssets = 0;
  let totalLiabilities = 0;
  allAccounts.forEach((acc) => {
    const balance = parseFloat(acc.balance) || 0;
    const categoryInfo = ACCOUNT_STRUCTURE[acc.category];
    if (!categoryInfo) return;

    if (categoryInfo.isAsset === true) {
      totalAssets += balance;
    } else if (categoryInfo.isAsset === false) {
      totalLiabilities += balance;
    } else {
      if (acc.type === "借出") totalAssets += balance;
      if (acc.type === "借入") totalLiabilities += balance;
    }
  });

  const netAssets = totalAssets - totalLiabilities;
  document.getElementById("net-assets-value").textContent =
    `¥ ${netAssets.toFixed(2)}`;
  document.getElementById("total-assets-value").textContent =
    `¥ ${totalAssets.toFixed(2)}`;
  document.getElementById("total-liabilities-value").textContent =
    `¥ ${totalLiabilities.toFixed(2)}`;

  // --- 2. 按分类渲染账户列表 ---
  for (const categoryName in ACCOUNT_STRUCTURE) {
    const accountsInCategory = allAccounts.filter(
      (acc) => acc.category === categoryName,
    );
    if (accountsInCategory.length === 0) continue;

    const categoryCard = document.createElement("div");
    categoryCard.className = "tukey-account-category-card";

    let categoryTotal = 0;
    accountsInCategory.forEach(
      (acc) => (categoryTotal += parseFloat(acc.balance) || 0),
    );

    // ▼▼▼ ★★★★★ 核心修改在这里 ★★★★★ ▼▼▼
    let accountsHtml = "";
    accountsInCategory.forEach((acc) => {
      // 1. 根据账户的分类和类型，找到对应的图标URL
      const categoryInfo = ACCOUNT_STRUCTURE[acc.category];
      const typeInfo = categoryInfo?.types.find((t) => t.name === acc.type);
      // 2. 如果找到了就用它的图标，找不到就用一个备用图标或空字符串
      const iconUrl = typeInfo
        ? typeInfo.iconUrl
        : "https://i.postimg.cc/y88P16yW/default-icon.png";

      // 3. 在HTML结构中，添加 <img> 标签来显示图标
      accountsHtml += `
                <div class="tukey-account-item" data-account-id="${acc.id}">
                    <div class="account-info">
                        <img src="${iconUrl}" class="account-icon" alt="${acc.type}">
                        <span class="account-name">${acc.name}</span>
                    </div>
                    <div class="account-balance-and-type">
                        <span class="account-balance">¥ ${parseFloat(acc.balance).toFixed(2)}</span>
                        <span class="account-type-name">${acc.type}</span>
                    </div>
                </div>
            `;
    });
    // ▲▲▲ ★★★★★ 核心修改结束 ★★★★★ ▲▲▲

    // 渲染大类标题和总额
    categoryCard.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <span class="name">${categoryName}</span>
                    <span class="total">¥ ${categoryTotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="category-accounts-list">
                ${accountsHtml}
            </div>
        `;
    listEl.appendChild(categoryCard);
  }
}
// ▲▲▲ 替换结束 ▲▲▲
// ▼▼▼ 粘贴下面这【三个】全新的函数，来替换旧的 openAccountEditor 和 saveTukeyAccount ▼▼▼

// ▼▼▼ 【修改】添加自定义账户类型按钮 ▼▼▼
function openAccountTypeSelector() {
  editingAccountId = null;
  const modal = document.getElementById("account-editor-modal");
  const titleEl = document.getElementById("account-editor-title");
  const selectionView = document.getElementById("account-type-selection-view");
  const formView = document.getElementById("account-editor-form");
  const saveBtn = document.getElementById("save-account-btn");

  titleEl.textContent = "选择账户类型";
  formView.style.display = "none";
  selectionView.style.display = "block";
  saveBtn.style.display = "none";
  selectionView.innerHTML = "";

  for (const categoryName in ACCOUNT_STRUCTURE) {
    const categoryInfo = ACCOUNT_STRUCTURE[categoryName];
    const groupEl = document.createElement("div");
    groupEl.className = "category-group";

    let typesHtml = "";
    categoryInfo.types.forEach((type) => {
      typesHtml += `
                <div class="type-item" data-category="${categoryName}" data-type="${type.name}">
                    <img src="${type.iconUrl}" class="type-icon">
                    <span class="type-name">${type.name}</span>
                </div>
            `;
    });

    // ★★★ 添加自定义按钮 ★★★
    // 注意：我们给它一个特殊的 class 'add-custom-type-btn'
    typesHtml += `
        <div class="type-item add-custom-type-btn" data-category="${categoryName}">
             <div style="width:40px; height:40px; border-radius:50%; background:#f0f2f5; display:flex; align-items:center; justify-content:center; font-size:20px; color:#999; margin-bottom:5px;">+</div>
             <span class="type-name">自定义</span>
        </div>
    `;

    groupEl.innerHTML = `
            <div class="category-group-title">${categoryName}</div>
            <div class="type-grid">${typesHtml}</div>
        `;
    selectionView.appendChild(groupEl);
  }
  modal.classList.add("visible");
}
// ▲▲▲ 替换结束 ▲▲▲

/**
 * 【重构】第二步：打开账户编辑器表单（用于添加或编辑）
 */
async function openAccountEditor(
  accountId = null,
  preselectedCategory = null,
  preselectedType = null,
) {
  editingAccountId = accountId;
  const modal = document.getElementById("account-editor-modal");
  const titleEl = document.getElementById("account-editor-title");
  const selectionView = document.getElementById("account-type-selection-view");
  const formView = document.getElementById("account-editor-form");
  const saveBtn = document.getElementById("save-account-btn");

  // 获取表单元素
  const categorySelect = document.getElementById("account-category-select");
  const typeSelect = document.getElementById("account-type-select");
  const nameInput = document.getElementById("account-name-input");
  const balanceInput = document.getElementById("account-balance-input");
  const remarksInput = document.getElementById("account-remarks-input");

  // 切换视图
  selectionView.style.display = "none";
  formView.style.display = "block";
  saveBtn.style.display = "inline-block";

  if (accountId) {
    // --- 编辑模式 ---
    titleEl.textContent = "编辑账户";
    const account = await db.tukeyAccounts.get(accountId);
    if (account) {
      // 填充并选中已保存的数据
      categorySelect.innerHTML = `<option value="${account.category}">${account.category}</option>`;
      typeSelect.innerHTML = `<option value="${account.type}">${account.type}</option>`;
      categorySelect.value = account.category;
      typeSelect.value = account.type;
      nameInput.value = account.name;
      balanceInput.value = account.balance;
      remarksInput.value = account.remarks || "";
      // 编辑时不允许修改分类和类型
      categorySelect.disabled = true;
      typeSelect.disabled = true;
    }
  } else {
    // --- 添加模式 (已选定类型) ---
    titleEl.textContent = "添加新账户";
    // 填充并锁定预选的分类和类型
    categorySelect.innerHTML = `<option value="${preselectedCategory}">${preselectedCategory}</option>`;
    typeSelect.innerHTML = `<option value="${preselectedType}">${preselectedType}</option>`;
    categorySelect.value = preselectedCategory;
    typeSelect.value = preselectedType;
    categorySelect.disabled = true;
    typeSelect.disabled = true;

    // 清空其他输入框
    nameInput.value = "";
    balanceInput.value = "";
    remarksInput.value = "";

    // 自动聚焦到账户名称输入框
    nameInput.focus();
  }
  modal.classList.add("visible");
}

/**
 * 【重构】保存账户信息的核心函数
 */
async function saveTukeyAccount() {
  const category = document.getElementById("account-category-select").value;
  const typeName = document.getElementById("account-type-select").value;
  const name = document.getElementById("account-name-input").value.trim();
  const balance = document.getElementById("account-balance-input").value;
  const remarks = document.getElementById("account-remarks-input").value.trim();

  if (!name) {
    alert("账户名称不能为空！");
    return;
  }
  if (balance === "" || isNaN(parseFloat(balance))) {
    alert("请输入有效的账户余额！");
    return;
  }

  const selectedType = ACCOUNT_STRUCTURE[category]?.types.find(
    (t) => t.name === typeName,
  );
  const iconUrl = selectedType ? selectedType.iconUrl : "";

  const accountData = {
    category,
    type: typeName,
    name,
    balance: parseFloat(balance),
    remarks,
    iconUrl,
  };

  try {
    if (editingAccountId) {
      await db.tukeyAccounts.update(editingAccountId, accountData);
      alert("账户已更新！");
    } else {
      await db.tukeyAccounts.add(accountData);
      alert("新账户已添加！");
    }
    document.getElementById("account-editor-modal").classList.remove("visible");
    await renderTukeyWalletView(); // ★★★ 这就是解决“不加入列表”问题的关键！
  } catch (error) {
    console.error("保存账户失败:", error);
    alert(`保存失败: ${error.message}`);
  }
}
// ▲▲▲ 函数替换结束 ▲▲▲

/**
 * 删除一个账户
 * @param {number} accountId - 要删除的账户ID
 */
async function deleteTukeyAccount(accountId) {
  const confirmed = await showCustomConfirm(
    "删除账户",
    "确定要删除这个账户吗？此操作不可恢复。",
    {
      confirmButtonClass: "btn-danger",
    },
  );
  if (confirmed) {
    await db.tukeyAccounts.delete(accountId);
    await renderTukeyWalletView(); // 刷新钱包界面
    alert("账户已删除。");
  }
}

/* --- 【全新】兔k记账-Excel导出功能 --- */

/**
 * 打开导出选项模态框
 */
async function openTukeyExportModal() {
  const modal = document.getElementById("tukey-export-modal");
  const listEl = document.getElementById("tukey-export-account-list");
  listEl.innerHTML = "";

  const accounts = await db.tukeyAccounts.toArray();

  // 添加“所有账户”选项
  listEl.innerHTML += `<label><input type="checkbox" value="all" id="tukey-export-select-all"> <strong>所有账户</strong></label>`;

  // 添加各个单独账户的选项
  accounts.forEach((acc) => {
    listEl.innerHTML += `<label><input type="checkbox" class="tukey-export-account-cb" value="${acc.id}"> ${acc.name} (${acc.type})</label>`;
  });

  // 为“所有账户”复选框添加联动逻辑
  document
    .getElementById("tukey-export-select-all")
    .addEventListener("change", (e) => {
      document.querySelectorAll(".tukey-export-account-cb").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });

  modal.classList.add("visible");
}

/**
 * 执行导出为Excel的核心函数
 */
async function exportTukeyReportToExcel() {
  const selectedAccountIds = Array.from(
    document.querySelectorAll(".tukey-export-account-cb:checked"),
  ).map((cb) => parseInt(cb.value));

  if (selectedAccountIds.length === 0) {
    alert("请至少选择一个要导出的账户！");
    return;
  }

  document.getElementById("tukey-export-modal").classList.remove("visible");
  await showCustomAlert("请稍候...", "正在生成Excel文件...");

  try {
    // 1. 根据选择的账户ID从数据库获取记录
    const records = await db.tukeyAccountingRecords
      .where("accountId")
      .anyOf(selectedAccountIds)
      .sortBy("timestamp");

    if (records.length === 0) {
      await showCustomAlert("无数据", "选中的账户没有任何记账记录可供导出。");
      return;
    }

    // 2. 将数据格式化为适合Excel的数组
    const dataForSheet = records.map((rec) => ({
      日期: new Date(rec.timestamp).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      类型: rec.type === "expense" ? "支出" : "收入",
      分类: rec.category,
      金额: rec.type === "expense" ? -rec.amount : rec.amount,
      账户: rec.accountName,
      备注: rec.remarks || "",
    }));

    // 3. 使用SheetJS创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "账单明细");

    // (可选) 调整列宽
    worksheet["!cols"] = [
      { wch: 20 }, // 日期
      { wch: 8 }, // 类型
      { wch: 15 }, // 分类
      { wch: 12 }, // 金额
      { wch: 20 }, // 账户
      { wch: 30 }, // 备注
    ];

    // 4. 生成并下载Excel文件
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `兔k记账报表-${dateStr}.xlsx`);
  } catch (error) {
    console.error("导出Excel失败:", error);
    await showCustomAlert("导出失败", `发生错误: ${error.message}`);
  }
}

/* --- Excel导出功能结束 --- */

// ▼▼▼ 用这整块新代码，替换旧的 initTukeyAccounting 函数 ▼▼▼
/* --- 兔k记账功能 V2.0 (记账群聊版) --- */
let activeTukeyGroup = null; // 用于存储当前激活的记账群聊数据

/**
 * 【总入口】初始化兔k记账App的所有功能和事件监听
 */
async function initTukeyAccounting() {
  if (window.QQBotConsole) {
    await window.QQBotConsole.init();
  }
}

/**
 * 加载群聊数据并渲染主界面
 */
async function loadTukeyGroupData() {
  activeTukeyGroup = await db.tukeyAccountingGroups.get("main_group");
  if (activeTukeyGroup) {
    document.getElementById("tukey-no-group-placeholder").style.display =
      "none";
    document.getElementById("tukey-group-chat-container").style.display =
      "flex";
    document.getElementById("tukey-group-name").textContent =
      activeTukeyGroup.name;
    await renderTukeyRecordsList();
  } else {
    document.getElementById("tukey-no-group-placeholder").style.display =
      "flex";
    document.getElementById("tukey-group-chat-container").style.display =
      "none";
  }
}

/**
 * 打开群聊创建/管理模态框
 */
async function openGroupManagerModal() {
  const modal = document.getElementById("tukey-group-manager-modal");
  const pickerList = document.getElementById("tukey-member-picker-list");
  pickerList.innerHTML = "";

  // 加载所有单聊角色作为备选成员
  const allChars = Object.values(state.chats).filter((c) => !c.isGroup);

  if (activeTukeyGroup) {
    // 编辑模式
    document.getElementById("tukey-group-manager-title").textContent =
      "管理群成员";
    document.getElementById("tukey-group-name-input").value =
      activeTukeyGroup.name;
    const currentMemberIds = new Set(activeTukeyGroup.members.map((m) => m.id));
    allChars.forEach((char) => {
      const isChecked = currentMemberIds.has(char.id) ? "checked" : "";
      pickerList.innerHTML += `
                <label>
                    <input type="checkbox" value="${char.id}" ${isChecked}> ${char.name}
                </label>`;
    });
  } else {
    // 创建模式
    document.getElementById("tukey-group-manager-title").textContent =
      "创建记账群聊";
    document.getElementById("tukey-group-name-input").value = "";
    allChars.forEach((char) => {
      pickerList.innerHTML += `<label><input type="checkbox" value="${char.id}"> ${char.name}</label>`;
    });
  }

  modal.classList.add("visible");
}

/**
 * 保存群聊设置
 */
async function saveTukeyGroup() {
  const name = document.getElementById("tukey-group-name-input").value.trim();
  if (!name) {
    alert("群聊名称不能为空！");
    return;
  }

  const selectedCheckboxes = document.querySelectorAll(
    "#tukey-member-picker-list input:checked",
  );
  if (selectedCheckboxes.length === 0) {
    alert("请至少选择一位群成员！");
    return;
  }

  const members = Array.from(selectedCheckboxes).map((cb) => {
    const char = state.chats[cb.value];
    return {
      id: char.id,
      name: char.name,
      persona: char.settings.aiPersona,
      avatar: char.settings.aiAvatar,
    };
  });

  const groupData = {
    id: "main_group",
    name: name,
    members: members,
    replySettings: activeTukeyGroup?.replySettings || {
      // 保留旧设置或使用默认值
      threshold: 1,
      mode: "all",
      randomCount: 1,
      specificMemberIds: [],
    },
  };

  await db.tukeyAccountingGroups.put(groupData);
  activeTukeyGroup = groupData;

  document
    .getElementById("tukey-group-manager-modal")
    .classList.remove("visible");
  await loadTukeyGroupData(); // 重新加载并渲染主界面
}

/**
 * 打开AI回复设置模态框
 */
function openReplySettingsModal() {
  if (!activeTukeyGroup) return;

  const settings = activeTukeyGroup.replySettings;
  document.getElementById("tukey-reply-threshold-input").value =
    settings.threshold;
  document.querySelector(
    `input[name="tukey-reply-mode"][value="${settings.mode}"]`,
  ).checked = true;

  const specificOptions = document.getElementById(
    "tukey-specific-reply-options",
  );
  specificOptions.style.display =
    settings.mode === "random" || settings.mode === "specific"
      ? "block"
      : "none";

  document.getElementById("tukey-random-count-input").value =
    settings.randomCount;

  // 渲染指定成员选择列表
  const specificMemberList = document.getElementById(
    "tukey-specific-member-picker-list",
  );
  specificMemberList.innerHTML = "";
  activeTukeyGroup.members.forEach((member) => {
    const isChecked = settings.specificMemberIds.includes(member.id)
      ? "checked"
      : "";
    specificMemberList.innerHTML += `<label><input type="checkbox" value="${member.id}" ${isChecked}> ${member.name}</label>`;
  });

  document
    .getElementById("tukey-reply-settings-modal")
    .classList.add("visible");
}

/**
 * 保存AI回复设置
 */
async function saveReplySettings() {
  const threshold = parseInt(
    document.getElementById("tukey-reply-threshold-input").value,
  );
  const mode = document.querySelector(
    'input[name="tukey-reply-mode"]:checked',
  ).value;
  const randomCount = parseInt(
    document.getElementById("tukey-random-count-input").value,
  );
  const specificMemberIds = Array.from(
    document.querySelectorAll(
      "#tukey-specific-member-picker-list input:checked",
    ),
  ).map((cb) => cb.value);

  activeTukeyGroup.replySettings = {
    threshold,
    mode,
    randomCount,
    specificMemberIds,
  };
  await db.tukeyAccountingGroups.put(activeTukeyGroup);

  document
    .getElementById("tukey-reply-settings-modal")
    .classList.remove("visible");
  alert("回复设置已保存！");
}

/**
 * 【全新】解散记账群聊
 */
async function dissolveTukeyGroup() {
  if (!activeTukeyGroup) return;

  // 1. 弹出红色警告确认框
  const confirmed = await showCustomConfirm(
    "确认解散",
    "确定要解散记账群聊吗？\n\n注意：\n1. 之前的记账记录**不会**被删除，依然可以在报表中查看。\n2. 解散后您可以重新创建一个新的记账群。",
    { confirmButtonClass: "btn-danger" },
  );

  if (confirmed) {
    try {
      // 2. 从数据库删除群组配置
      await db.tukeyAccountingGroups.delete("main_group");

      // 3. 重置内存状态
      activeTukeyGroup = null;

      // 4. 刷新界面（会自动显示回“创建群聊”的空状态页面）
      await loadTukeyGroupData();

      alert("记账群聊已解散。");
    } catch (error) {
      console.error("解散群聊失败:", error);
      alert("解散失败，请重试。");
    }
  }
}

/**
 * 【V3修正版】打开浮动记账卡片并初始化 (已修复自定义按钮点击报错)
 */
async function openRecordEditor() {
  const card = document.getElementById("tukey-record-input-card");
  if (!card) return;

  // 清空旧数据
  document.getElementById("tukey-card-amount-input").value = "";
  document.getElementById("tukey-card-remarks-input").value = "";

  // 设置时间默认为当前时间
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("tukey-card-time-input").value = now
    .toISOString()
    .slice(0, 16);

  // 渲染账户下拉列表
  const accountSelect = document.getElementById("tukey-card-account-select");
  accountSelect.innerHTML = "";
  const accounts = await db.tukeyAccounts.toArray();
  if (accounts.length === 0) {
    alert("请先在“钱包”页面添加一个账户！");
    return;
  }
  accounts.forEach((acc) => {
    accountSelect.innerHTML += `<option value="${acc.id}" data-name="${acc.name}">${acc.name}</option>`;
  });

  // 默认显示支出分类，并重置已选分类
  switchRecordType("expense");
  updateSelectedCategoryDisplay();

  // ---- 事件绑定 (使用克隆节点防止重复绑定) ----
  const typeSelector = card.querySelector(".type-selector");
  const newTypeSelector = typeSelector.cloneNode(true);
  typeSelector.parentNode.replaceChild(newTypeSelector, typeSelector);
  newTypeSelector.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      switchRecordType(e.target.dataset.type);
    }
  });

  const categoryGrid = card.querySelector(".category-grid");
  const newCategoryGrid = categoryGrid.cloneNode(true);
  categoryGrid.parentNode.replaceChild(newCategoryGrid, categoryGrid);

  // ★★★★★ 核心修复在这里 ★★★★★
  newCategoryGrid.addEventListener("click", (e) => {
    // 1. 找到被点击的项
    const item = e.target.closest(".tukey-category-item");

    // 2. 检查：如果点到了，并且它不是“添加自定义”按钮
    if (item && !item.classList.contains("add-custom-btn")) {
      newCategoryGrid
        .querySelectorAll(".tukey-category-item")
        .forEach((el) => el.classList.remove("selected"));
      item.classList.add("selected");
      // 3. 现在可以安全地读取 img.src 了
      updateSelectedCategoryDisplay(
        item.dataset.category,
        item.querySelector("img").src,
      );
    }
  });
  // ★★★★★ 修复结束 ★★★★★

  const closeBtn = card.querySelector(".close-card-btn");
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  newCloseBtn.addEventListener("click", () => card.classList.remove("visible"));

  const saveBtn = card.querySelector("#tukey-save-from-card-btn");
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  newSaveBtn.addEventListener("click", saveTukeyRecordFromCard);

  // 显示卡片
  card.classList.add("visible");
  document.getElementById("tukey-card-amount-input").focus();
}

// ▼▼▼ 【修改】使用新的渲染函数，支持自定义按钮 ▼▼▼
function switchRecordType(type) {
  const card = document.getElementById("tukey-record-input-card");
  card.querySelectorAll(".type-selector .type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });

  // 使用新函数来渲染，包含那个“+”号
  renderRecordCategories(type);

  // 切换后清空已选分类
  updateSelectedCategoryDisplay();
}
// ▲▲▲ 替换结束 ▲▲▲

/**
 * 【全新】更新金额输入框旁边已选分类的显示
 */
function updateSelectedCategoryDisplay(
  categoryName = "请选择分类",
  iconSrc = "",
) {
  const displayEl = document.getElementById("tukey-card-selected-category");
  const imgEl = displayEl.querySelector("img");
  const spanEl = displayEl.querySelector("span");

  if (iconSrc) {
    imgEl.src = iconSrc;
    imgEl.style.display = "inline";
  } else {
    imgEl.style.display = "none";
  }
  spanEl.textContent = categoryName;
}

/**
 * 【V3版-核心】从记账卡片中读取数据并保存
 */
async function saveTukeyRecordFromCard() {
  const card = document.getElementById("tukey-record-input-card");

  const type = card.querySelector(".type-selector .type-btn.active").dataset
    .type;
  const selectedCategoryItem = card.querySelector(
    ".tukey-category-item.selected",
  );
  const amount = parseFloat(
    document.getElementById("tukey-card-amount-input").value,
  );
  const remarks = document
    .getElementById("tukey-card-remarks-input")
    .value.trim();

  // 【核心修改】从对应的选择器读取账户和时间
  const accountSelect = document.getElementById("tukey-card-account-select");
  const accountId = parseInt(accountSelect.value);
  const accountName =
    accountSelect.options[accountSelect.selectedIndex].dataset.name;
  const timeValue = document.getElementById("tukey-card-time-input").value;
  const timestamp = timeValue ? new Date(timeValue).getTime() : Date.now();

  if (!selectedCategoryItem) {
    alert("请选择一个分类！");
    return;
  }
  const category = selectedCategoryItem.dataset.category;

  if (isNaN(amount) || amount <= 0) {
    alert("请输入有效的金额！");
    return;
  }

  const newRecord = {
    groupId: activeTukeyGroup.id,
    timestamp,
    type,
    amount,
    category,
    remarks,
    accountId,
    accountName,
    isRepliedTo: false,
  };

  // 【核心修改】更新正确的账户余额
  const account = await db.tukeyAccounts.get(accountId);
  if (account) {
    const currentBalance = parseFloat(account.balance);
    const change = type === "expense" ? -amount : amount;

    // 特殊处理信用账户和借贷
    const categoryInfo = ACCOUNT_STRUCTURE[account.category];
    if (categoryInfo.isAsset === false) {
      // 信用账户
      account.balance =
        currentBalance + (type === "expense" ? amount : -amount);
    } else if (account.type === "借入") {
      account.balance =
        currentBalance + (type === "expense" ? -amount : amount);
    } else {
      // 资产账户
      account.balance = currentBalance + change;
    }

    await db.tukeyAccounts.put(account);
  }

  await db.tukeyAccountingRecords.add(newRecord);
  // ▼▼▼ 在这里粘贴下面的新代码 ▼▼▼
  // 【核心】检查同步开关，如果开启，则更新桃宝余额
  if (tukeyUserSettings.syncWithTaobao) {
    const syncAmount =
      newRecord.type === "expense" ? -newRecord.amount : newRecord.amount;
    const syncDescription = `[兔k记账同步] ${newRecord.category} - ${newRecord.remarks || "无备注"}`;
    await updateUserBalanceAndLogTransaction(syncAmount, syncDescription);
    console.log(
      `桃宝余额已同步: ${syncAmount > 0 ? "+" : ""}${syncAmount.toFixed(2)}`,
    );
  }
  // ▲▲▲ 新代码粘贴结束 ▲▲▲

  card.classList.remove("visible"); // 保存后隐藏卡片
  await renderTukeyRecordsList(); // 刷新列表
  await checkAndTriggerAiReply(); // 检查AI回复
}
/**
 * 【重构渲染】渲染记账记录和AI回复列表（美化版气泡模式）
 */
async function renderTukeyRecordsList() {
  const listEl = document.getElementById("tukey-records-list");
  listEl.innerHTML = ""; // 清空
  if (!activeTukeyGroup) return;

  // 获取所有记录并按时间升序排列（旧的在前，新的在后）
  const records = await db.tukeyAccountingRecords
    .where("groupId")
    .equals(activeTukeyGroup.id)
    .sortBy("timestamp");

  if (records.length === 0) {
    listEl.innerHTML =
      '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; color:#ccc;">' +
      '<span style="font-size:40px; margin-bottom:10px;">📝</span>' +
      "<span>还没记账呢，点右下角开始吧~</span>" +
      "</div>";
    return;
  }

  for (const record of records) {
    const recordTime = new Date(record.timestamp);
    const timeString = `${recordTime.getMonth() + 1}/${recordTime.getDate()} ${String(recordTime.getHours()).padStart(2, "0")}:${String(recordTime.getMinutes()).padStart(2, "0")}`;

    // 找到对应分类的图标
    let categoryIcon = "";
    // 尝试在支出和收入里找
    const expenseCat = ACCOUNTING_CATEGORIES["expense"]?.find(
      (c) => c.name === record.category,
    );
    const incomeCat = ACCOUNTING_CATEGORIES["income"]?.find(
      (c) => c.name === record.category,
    );
    const customCat = (ACCOUNTING_CATEGORIES["expense"] || [])
      .concat(ACCOUNTING_CATEGORIES["income"] || [])
      .find((c) => c.name === record.category);

    if (expenseCat) categoryIcon = expenseCat.icon;
    else if (incomeCat) categoryIcon = incomeCat.icon;
    else if (customCat) categoryIcon = customCat.icon;
    else categoryIcon = "https://i.postimg.cc/y88P16yW/default-icon.png"; // 默认图标

    // --- 创建用户记账气泡 (右侧) ---
    const userRecordWrapper = document.createElement("div");
    userRecordWrapper.className = "tukey-record-wrapper user-record";

    // 创建记账气泡本身
    // 添加删除按钮 logic
    const recordBubble = document.createElement("div");
    recordBubble.className = `tukey-record-bubble ${record.type}`;
    recordBubble.innerHTML = `
            <div class="record-header">
                <img src="${categoryIcon}" class="record-category-icon" alt="${record.category}">
                <span class="record-category-name">${record.category}</span>
                <span class="record-amount" style="margin-left:auto;">${record.type === "expense" ? "-" : "+"} ${record.amount.toFixed(2)}</span>
            </div>
            <div class="record-body" style="margin-bottom:0;">
                <span class="record-remarks">${record.remarks || "无备注"}</span>
            </div>
            <div class="record-footer">
                <span>${record.accountName || "账户"}</span> · <span>${timeString}</span>
            </div>
            <!-- 删除按钮 (绝对定位在气泡左侧外面一点，或者做成悬浮显示，这里简单处理放气泡内角落) -->
            <div class="delete-record-btn" data-id="${record.id}" style="position:absolute; top:-5px; left:-10px; background:#fff; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.1); cursor:pointer; color:#ff3b30; font-size:14px; opacity:0; transition:opacity 0.2s;">×</div>
        `;

    // 鼠标悬停显示删除按钮
    recordBubble.addEventListener("mouseenter", () => {
      recordBubble.querySelector(".delete-record-btn").style.opacity = "1";
    });
    recordBubble.addEventListener("mouseleave", () => {
      recordBubble.querySelector(".delete-record-btn").style.opacity = "0";
    });

    // 绑定删除事件
    recordBubble
      .querySelector(".delete-record-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTukeyAccountingRecord(record.id);
      });

    // 创建头像
    const userAvatarImg = document.createElement("img");
    userAvatarImg.src =
      tukeyUserSettings.avatar || "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg";
    userAvatarImg.className = "record-user-avatar";

    // 组装用户消息
    userRecordWrapper.appendChild(recordBubble);
    userRecordWrapper.appendChild(userAvatarImg);
    listEl.appendChild(userRecordWrapper);

    // --- 查询并渲染对应的 AI 回复 (左侧) ---
    const replies = await db.tukeyAccountingReplies
      .where("recordId")
      .equals(record.id)
      .toArray();

    if (replies.length > 0) {
      const repliesContainer = document.createElement("div");
      repliesContainer.className = "tukey-replies-container"; // 这个容器是列布局

      for (const reply of replies) {
        const member = activeTukeyGroup.members.find(
          (m) => m.id === reply.charId,
        );
        if (member) {
          const replyEl = document.createElement("div");
          replyEl.className = "tukey-reply-item"; // flex row
          replyEl.innerHTML = `
                <img src="${member.avatar}" class="reply-avatar" alt="${member.name}">
                <div class="reply-content">
                    <div class="reply-sender-name">${member.groupNickname || member.name}</div>
                    <div class="reply-bubble">${reply.content}</div>
                </div>
            `;
          repliesContainer.appendChild(replyEl);
        }
      }

      // ★★★ 新增：添加重Roll按钮 ★★★
      const rerollBtn = document.createElement("div");
      rerollBtn.className = "tukey-reroll-btn";
      rerollBtn.dataset.recordId = record.id; // 绑定账单ID
      rerollBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>重生成</span>
      `;
      repliesContainer.appendChild(rerollBtn);
      // ★★★ 新增结束 ★★★

      listEl.appendChild(repliesContainer);
    }
  }

  // 滚动到底部
  setTimeout(() => {
    listEl.scrollTop = listEl.scrollHeight;
  }, 100);
}

// ▼▼▼ 【兔k记账】这是全新的AI回复核心逻辑，请完整粘贴 ▼▼▼

/**
 * 检查是否达到阈值，并触发AI回复
 */
async function checkAndTriggerAiReply() {
  if (!activeTukeyGroup) return;

  const settings = activeTukeyGroup.replySettings;
  // ▼▼▼ 【核心修复】使用 .filter() 来正确查找未回复的记录 ▼▼▼
  const unrepliedRecords = await db.tukeyAccountingRecords
    .where("groupId")
    .equals(activeTukeyGroup.id)
    .filter((record) => !record.isRepliedTo) // 这会匹配 isRepliedTo 为 false, undefined 或 null 的所有情况
    .toArray();
  // ▲▲▲ 修复结束 ▲▲▲

  console.log(
    `[记账AI检查] 未回复记录数: ${unrepliedRecords.length}, 阈值: ${settings.threshold}`,
  );

  // 如果未回复的记录数达到了阈值
  if (unrepliedRecords.length >= settings.threshold) {
    console.log(`[记账AI触发] 达到阈值，准备生成回复...`);
    await triggerAccountingAiResponse(unrepliedRecords);
  }
}
/**
 * 【全局函数】处理单条账单的AI回复重生成
 * 放在代码的最外层，不要放在其他函数里面！
 */
window.handleTukeyReroll = async function (recordId) {
  console.log("正在重Roll账单 ID:", recordId); // 调试日志

  // 1. 检查是否有激活的群组
  if (!window.activeTukeyGroup && window.state.chats) {
    // 尝试自动修复 activeTukeyGroup (防止刷新后丢失)
    // 这里假设群组ID固定为 main_group，如果你的逻辑不同请调整
    window.activeTukeyGroup =
      await window.db.tukeyAccountingGroups.get("main_group");
  }

  if (!window.activeTukeyGroup) {
    alert("无法获取当前群聊信息，请刷新页面重试。");
    return;
  }

  // 2. 获取账单记录
  const record = await window.db.tukeyAccountingRecords.get(recordId);
  if (!record) {
    alert("找不到该账单记录！");
    return;
  }

  // 3. 视觉反馈：将按钮变成“生成中...”
  const listEl = document.getElementById("tukey-records-list");
  // 使用更精确的选择器找到那个被点击的按钮
  const btn = listEl.querySelector(
    `.tukey-reroll-btn[data-record-id="${recordId}"]`,
  );
  if (btn) {
    btn.innerHTML = "<span>⏳ 生成中...</span>";
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.7";
  }

  try {
    // 4. 删除旧的回复
    const oldReplies = await window.db.tukeyAccountingReplies
      .where("recordId")
      .equals(recordId)
      .toArray();

    if (oldReplies.length > 0) {
      const replyIds = oldReplies.map((r) => r.id);
      await window.db.tukeyAccountingReplies.bulkDelete(replyIds);
      console.log(`已删除 ${replyIds.length} 条旧回复`);
    }

    // 5. 重新调用生成函数 (注意：传入数组)
    // 确保 triggerAccountingAiResponse 也是全局可访问的，或者在同一作用域
    if (typeof triggerAccountingAiResponse === "function") {
      await triggerAccountingAiResponse([record]);
    } else if (typeof window.triggerAccountingAiResponse === "function") {
      await window.triggerAccountingAiResponse([record]);
    } else {
      alert("错误：找不到生成函数 triggerAccountingAiResponse");
    }
  } catch (error) {
    console.error("重Roll失败:", error);
    alert("重生成失败: " + error.message);
    // 如果失败，尝试恢复界面
    if (typeof renderTukeyRecordsList === "function") {
      await renderTukeyRecordsList();
    }
  }
};

/**
 * 【AI核心】触发记账群聊的AI回复
 * @param {Array} recordsToReply - 需要AI进行评论的账单记录数组
 */
async function triggerAccountingAiResponse(recordsToReply) {
  if (!activeTukeyGroup) return;

  // 显示一个加载提示
  const listEl = document.getElementById("tukey-records-list");
  const loadingEl = document.createElement("div");
  loadingEl.className = "tukey-reply-item";
  loadingEl.innerHTML = `<div class="reply-bubble">成员们正在赶来的路上...</div>`;
  listEl.appendChild(loadingEl);
  listEl.scrollTop = listEl.scrollHeight;

  const { proxyUrl, apiKey, model, temperature } = state.apiConfig;
  if (!proxyUrl || !apiKey || !model) {
    loadingEl.remove();
    alert("请先在API设置中配置好才能触发AI回复哦！");
    return;
  }

  const settings = activeTukeyGroup.replySettings;
  let membersToReply = [];

  // 根据设置决定哪些成员需要回复
  switch (settings.mode) {
    case "all":
      membersToReply = activeTukeyGroup.members;
      break;
    case "random":
      const shuffled = [...activeTukeyGroup.members].sort(
        () => 0.5 - Math.random(),
      );
      membersToReply = shuffled.slice(0, settings.randomCount || 1);
      break;
    case "specific":
      membersToReply = activeTukeyGroup.members.filter((m) =>
        settings.specificMemberIds.includes(m.id),
      );
      break;
  }

  if (membersToReply.length === 0) {
    loadingEl.remove();
    console.warn("[记账AI] 没有找到需要回复的成员。");
    return;
  }

  // 构建给AI的指令 (Prompt)
  const recordsText = recordsToReply
    .map(
      (r) =>
        `- [${new Date(r.timestamp).toLocaleString()}] ${r.type === "expense" ? "支出" : "收入"} ${r.amount.toFixed(
          2,
        )}元, 分类: ${r.category}, 备注: ${r.remarks || "无"}`,
    )
    .join("\n");

  // ... 在 triggerAccountingAiResponse 函数内部 ...

  const membersText = membersToReply
    .map((m) => `- ${m.name} (人设: ${m.persona})`)
    .join("\n");

  // ▼▼▼ 用这整块新代码替换旧的 systemPrompt ▼▼▼
  const systemPrompt = `
# 角色
你是一个多角色扮演AI，在一个记账群聊中。

# 用户信息 (这是账单的记录者)
- 用户名: ${tukeyUserSettings.username}
- 职业: ${tukeyUserSettings.profession || "未设定"}

# 任务
群里的用户刚刚记录了以下几笔账单。请你根据下方指定的角色列表及其人设，以及用户的职业信息，为他们每个人生成对这些账单的评论。

# 待评论的账单
${recordsText}

# 你需要扮演的角色 (及人设)
${membersText}

# 回复规则
1.  你的回复【必须严格符合】每个角色的人设。
2.  你的回复可以结合用户的【职业】进行评论，让对话更真实。例如，如果用户是学生，可以说“学生党花钱真大方呀”；如果是白领，可以说“看来这个月工资不错嘛”。
3.  你的回复【必须】是一个JSON数组，每个对象代表一个角色的评论。
4.  【格式铁律】: \`[{"charName": "角色A的名字", "comment": "角色A的评论内容"}, {"charName": "角色B的名字", "comment": "角色B的评论内容"}]\`
5.  评论内容要简短、口语化，像真实的群聊一样。

现在，请开始生成评论。
`;

  try {
    const messagesForApi = [{ role: "user", content: systemPrompt }];
    let isGemini = proxyUrl === GEMINI_API_URL;
    let geminiConfig = toGeminiRequestData(
      model,
      apiKey,
      systemPrompt,
      messagesForApi,
      isGemini,
      temperature,
    );

    const response = isGemini
      ? await fetch(geminiConfig.url, geminiConfig.data)
      : await fetch(`${proxyUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: messagesForApi,
            temperature: parseFloat(temperature) || 0.8,
            response_format: { type: "json_object" },
          }),
        });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const rawContent = (
      isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content
    )
      .replace(/^```json\s*|```$/g, "")
      .trim();
    const replies = JSON.parse(rawContent);

    if (Array.isArray(replies)) {
      // 为所有被评论的账单都添加这些回复
      for (const record of recordsToReply) {
        for (const reply of replies) {
          const member = activeTukeyGroup.members.find(
            (m) => m.name === reply.charName,
          );
          if (member && reply.comment) {
            await db.tukeyAccountingReplies.add({
              recordId: record.id,
              charId: member.id,
              charName: member.name,
              content: reply.comment,
              timestamp: Date.now(),
            });
          }
        }
      }

      // 【关键】将所有已回复的记录标记为 isRepliedTo: true
      const recordIdsToUpdate = recordsToReply.map((r) => r.id);
      await db.tukeyAccountingRecords
        .where("id")
        .anyOf(recordIdsToUpdate)
        .modify({ isRepliedTo: true });

      await renderTukeyRecordsList(); // 重新渲染，显示新回复
    }
  } catch (error) {
    console.error("生成记账回复失败:", error);
    await showCustomAlert("回复生成失败", `发生错误: ${error.message}`);
  } finally {
    // 无论成功失败，都移除加载提示
    loadingEl.remove();
  }
}
// ▲▲▲ 新增AI回复逻辑结束 ▲▲▲
// ▼▼▼ 在你的JS功能区添加下面这些全新的报表功能函数 ▼▼▼

/**
 * 【报表总入口】渲染报表主视图，填充筛选器并显示默认报表
 */
async function renderTukeyReportsView() {
  await populateReportFilters();
  // 默认显示“每日明细”
  document.getElementById("report-type-filter").value = "daily_details";
  handleReportFilterChange(); // 触发一次渲染
}

/**
 * 【辅助】填充报表的筛选器（账户、月份）
 */
async function populateReportFilters() {
  // 填充账户筛选器
  const accountSelect = document.getElementById("report-account-filter");
  const accounts = await db.tukeyAccounts.toArray();
  accountSelect.innerHTML = '<option value="all">所有账户</option>';
  accounts.forEach((acc) => {
    accountSelect.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });

  // 填充月份筛选器
  const monthSelect = document.getElementById("report-month-filter");
  const records = await db.tukeyAccountingRecords
    .orderBy("timestamp")
    .reverse()
    .toArray();
  const months = new Set();
  records.forEach((rec) => {
    const date = new Date(rec.timestamp);
    months.add(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  });

  monthSelect.innerHTML = "";
  months.forEach((month) => {
    monthSelect.innerHTML += `<option value="${month}">${month}</option>`;
  });
  // 如果没有记录，给一个默认当前月份
  if (months.size === 0) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthSelect.innerHTML = `<option value="${currentMonth}">${currentMonth}</option>`;
  }
}

/**
 * 【核心】处理筛选条件变化，并调用相应的报表渲染函数
 */
function handleReportFilterChange() {
  const reportType = document.getElementById("report-type-filter").value;
  const accountId = document.getElementById("report-account-filter").value;
  const monthValue = document.getElementById("report-month-filter").value;

  const dailyView = document.getElementById("daily-report-view");
  const monthlyView = document.getElementById("monthly-report-view");

  if (reportType === "daily_details") {
    dailyView.style.display = "block";
    monthlyView.style.display = "none";
    renderDailyDetailView(accountId === "all" ? null : parseInt(accountId));
  } else if (reportType === "monthly_summary") {
    dailyView.style.display = "none";
    monthlyView.style.display = "block";
    if (monthValue) {
      const [year, month] = monthValue.split("-");
      renderMonthlySummaryView(
        parseInt(year),
        parseInt(month),
        accountId === "all" ? null : parseInt(accountId),
      );
    }
  }
}

/**
 * 【渲染 - 美化版】每日明细视图 (精致的删除按钮)
 */
async function renderDailyDetailView(accountId) {
  const view = document.getElementById("daily-report-view");
  view.innerHTML = '<p class="report-placeholder">正在加载每日明细...</p>';

  let records;
  if (accountId) {
    records = await db.tukeyAccountingRecords
      .where({ accountId: accountId })
      .reverse()
      .sortBy("timestamp");
  } else {
    records = await db.tukeyAccountingRecords.reverse().sortBy("timestamp");
  }

  if (records.length === 0) {
    view.innerHTML = '<p class="report-placeholder">没有找到任何记账记录。</p>';
    return;
  }

  const recordsByDay = records.reduce((acc, rec) => {
    const day = new Date(rec.timestamp).toISOString().split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(rec);
    return acc;
  }, {});

  view.innerHTML = "";

  for (const day in recordsByDay) {
    const dayRecords = recordsByDay[day];
    let dailyIncome = 0;
    let dailyExpense = 0;

    let transactionsHtml = "";
    dayRecords.forEach((rec) => {
      if (rec.type === "income") dailyIncome += rec.amount;
      else dailyExpense += rec.amount;

      const categoryData = ACCOUNTING_CATEGORIES[rec.type].find(
        (c) => c.name === rec.category,
      );
      const categoryIcon = categoryData ? categoryData.icon : "";
      const recordTime = new Date(rec.timestamp);
      const timeString = `${String(recordTime.getHours()).padStart(2, "0")}:${String(
        recordTime.getMinutes(),
      ).padStart(2, "0")}`;

      // ▼▼▼ 找到 renderDailyDetailView 函数内的 forEach 循环，替换 transactionsHtml 生成部分 ▼▼▼

      transactionsHtml += `
    <div class="report-record-item">
        <!-- 气泡主体 -->
        <div class="tukey-record-bubble ${rec.type}"> 
            <div class="record-main-row">
                <!-- 左侧：图标和分类 -->
                <div class="record-icon-wrapper">
                    <img src="${categoryIcon}" class="record-category-icon" alt="${rec.category}">
                </div>
                
                <!-- 中间：分类名和备注 -->
                <div class="record-info-col">
                    <div class="record-category-name">${rec.category}</div>
                    ${rec.remarks ? `<div class="record-remarks">${rec.remarks}</div>` : ""}
                    <div class="record-meta">
                        <span>${rec.accountName}</span> · <span>${timeString}</span>
                    </div>
                </div>

                <!-- 右侧：金额 -->
                <div class="record-amount-col">
                    <span class="record-amount">${rec.type === "expense" ? "-" : "+"}</span>
                    <span class="record-amount-num">${rec.amount.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <!-- 删除按钮 (悬浮显示) -->
        <button class="delete-record-btn" data-id="${rec.id}" title="删除">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
    </div>
`;
      // ▲▲▲ 替换结束 ▲▲▲
    });

    const dayGroup = document.createElement("div");
    dayGroup.className = "report-day-group";
    dayGroup.innerHTML = `
            <div class="day-header">
                <span class="date">${day}</span>
                <span class="day-summary">
                    <span class="expense">支出: ${dailyExpense.toFixed(2)}</span>
                    <span class="income">收入: ${dailyIncome.toFixed(2)}</span>
                </span>
            </div>
            <div class="transaction-list">${transactionsHtml}</div>
        `;
    view.appendChild(dayGroup);
  }
}

/**
 * 【全新】删除一条记账记录并回滚账户余额
 * @param {number} recordId - 要删除的记录ID
 */
async function deleteTukeyAccountingRecord(recordId) {
  // 1. 获取记录详情
  const record = await db.tukeyAccountingRecords.get(recordId);
  if (!record) {
    alert("找不到该记录，可能已被删除。");
    return;
  }

  // 2. 弹出确认框
  const confirmed = await showCustomConfirm(
    "确认删除",
    `确定要删除这笔 ${record.type === "expense" ? "支出" : "收入"} (¥${
      record.amount
    }) 吗？\n删除后，关联账户的余额将自动回滚。`,
    { confirmButtonClass: "btn-danger" },
  );
  if (!confirmed) return;

  try {
    // 3. 回滚账户余额
    const account = await db.tukeyAccounts.get(record.accountId);
    if (account) {
      let currentBalance = parseFloat(account.balance);

      // 核心回滚逻辑：
      // 如果删的是支出(expense)，余额应该加回去 (+ amount)
      // 如果删的是收入(income)，余额应该减出来 (- amount)
      if (record.type === "expense") {
        // 特殊处理：如果是借入/信用账户，支出意味着欠款增加，删除支出意味着欠款减少（数值逻辑取决于您是如何存储的）
        // 根据您之前的 saveTukeyRecordFromCard 逻辑：
        // 资产账户：余额 = 余额 - 支出。 回滚：余额 + 支出
        // 信用账户：余额 = 余额 + 支出 (欠款变多)。 回滚：余额 - 支出

        const categoryInfo = ACCOUNT_STRUCTURE[account.category];
        // 检查是否是信用账户(isAsset === false) 或 借入账户
        if (
          (categoryInfo && categoryInfo.isAsset === false) ||
          account.type === "借入"
        ) {
          // 信用账户之前是加了金额，现在要减去
          account.balance = currentBalance - record.amount;
        } else {
          // 普通资产账户之前是减了金额，现在要加回
          account.balance = currentBalance + record.amount;
        }
      } else {
        // 如果删的是收入/还款
        // 资产账户：余额 = 余额 + 收入。 回滚：余额 - 收入
        // 信用账户：余额 = 余额 - 收入 (还款)。 回滚：余额 + 收入
        const categoryInfo = ACCOUNT_STRUCTURE[account.category];
        if (
          (categoryInfo && categoryInfo.isAsset === false) ||
          account.type === "借入"
        ) {
          account.balance = currentBalance + record.amount;
        } else {
          account.balance = currentBalance - record.amount;
        }
      }

      // 保存账户余额更新
      await db.tukeyAccounts.put(account);
    }

    // 4. 如果开启了桃宝同步，也要回滚桃宝余额
    if (tukeyUserSettings.syncWithTaobao) {
      // 逻辑取反：删支出=加钱，删收入=扣钱
      const reverseAmount =
        record.type === "expense" ? record.amount : -record.amount;
      await updateUserBalanceAndLogTransaction(
        reverseAmount,
        `[撤销记账] ${record.category}`,
      );
    }

    // 5. 删除记录本身
    await db.tukeyAccountingRecords.delete(recordId);

    // 6. 删除关联的AI回复 (如果有)
    const replies = await db.tukeyAccountingReplies
      .where("recordId")
      .equals(recordId)
      .toArray();
    if (replies.length > 0) {
      const replyIds = replies.map((r) => r.id);
      await db.tukeyAccountingReplies.bulkDelete(replyIds);
    }

    // 7. 刷新界面
    await renderTukeyReportsView(); // 刷新报表
    // 如果记账群聊界面也在后台，可能需要标记刷新，这里暂只刷新当前报表

    alert("记录已删除，余额已回滚。");
  } catch (error) {
    console.error("删除账单失败:", error);
    alert(`删除失败: ${error.message}`);
  }
}

/**
 * 【渲染】月度统计视图
 */
async function renderMonthlySummaryView(year, month, accountId) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  let query = db.tukeyAccountingRecords
    .where("timestamp")
    .between(startDate.getTime(), endDate.getTime());
  if (accountId) {
    query = query.and((record) => record.accountId === accountId);
  }
  const records = await query.toArray();

  // 1. 计算月度总收支
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = {};
  const expenseByDay = {};

  records.forEach((rec) => {
    if (rec.type === "income") {
      totalIncome += rec.amount;
    } else {
      totalExpense += rec.amount;
      // 为饼图准备数据
      expenseByCategory[rec.category] =
        (expenseByCategory[rec.category] || 0) + rec.amount;
      // 为折线图准备数据
      const day = new Date(rec.timestamp).getDate();
      expenseByDay[day] = (expenseByDay[day] || 0) + rec.amount;
    }
  });

  document.getElementById("monthly-summary-card").innerHTML = `
        <div class="summary-item">
            <span class="label">总支出</span>
            <span class="value expense">¥ ${totalExpense.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="label">总收入</span>
            <span class="value income">¥ ${totalIncome.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="label">结余</span>
            <span class="value">¥ ${(totalIncome - totalExpense).toFixed(2)}</span>
        </div>
    `;

  // 2. 渲染饼图
  createCategoryPieChart(expenseByCategory);

  // 3. 渲染折线图
  createExpenditureLineChart(expenseByDay, endDate.getDate());
}

/**
 * 【图表】创建支出分类饼图
 */
function createCategoryPieChart(data) {
  const ctx = document.getElementById("category-pie-chart").getContext("2d");
  if (pieChartInstance) {
    pieChartInstance.destroy(); // 销毁旧图表实例
  }
  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#C9CBCF",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += new Intl.NumberFormat("zh-CN", {
                  style: "currency",
                  currency: "CNY",
                }).format(context.parsed);
              }
              return label;
            },
          },
        },
      },
    },
  });
}

/**
 * 【图表】创建月度支出折线图
 */
function createExpenditureLineChart(data, daysInMonth) {
  const ctx = document
    .getElementById("expenditure-line-chart")
    .getContext("2d");
  const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const chartData = labels.map((day) => data[day] || 0);

  if (lineChartInstance) {
    lineChartInstance.destroy();
  }
  lineChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "每日支出",
          data: chartData,
          borderColor: "#F44336",
          backgroundColor: "rgba(244, 67, 54, 0.2)",
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "¥" + value;
            },
          },
        },
      },
    },
  });
}

/* ============================================================================
 * QQ 群控中枢控制器 - Local Disk Storage + Direct WS + Sub-API Judge + Main-API KP/OC
 * ============================================================================ */
(function () {
  function getDefaultThoughtChainItems() {
    return [
      {
        id: "tc_single",
        title: "单人搭话独立回应",
        content:
          "当某位群友单独向NPC搭话或声明独立行动且不牵连他人时，直接引用回复该群友，无需死等全员表态。",
        enabled: true,
      },
      {
        id: "tc_bracket",
        title: "识别括号场外沟通",
        content:
          "完整阅读群友在括号内发的规则提问、环境确认或场外沟通，及时给出清晰解答。",
        enabled: true,
      },
      {
        id: "tc_rp_quiet",
        title: "玩家对戏保持安静",
        content:
          "当群友之间正在进行角色扮演对戏且不需要NPC插话时，副API自动判定保持安静不打断。",
        enabled: true,
      },
      {
        id: "tc_secret",
        title: "单人线秘密发小窗",
        content:
          "遇到专属HO秘密、高难侦查独享线索或单人线剧情时，表面信息发群内，秘密内容通过小窗或单人群私发。",
        enabled: true,
      },
      {
        id: "tc_no_godmod",
        title: "禁止替群友做决定",
        content:
          "绝不替玩家扮演其角色台词与心理，绝不强行篡改玩家的行动意愿，保持自然真人语气。",
        enabled: true,
      },
    ];
  }

  const QQBotConsole = {
    initialized: false,
    serverState: null,
    currentGroupId: "",
    pollTimer: null,
    busyGroups: {},
    localWaitNormalized: {},
    directWs: null,
    directWsConnected: false,
    directPendingEchoes: new Map(),
    termuxDiskAvailable: false,
    staticFallbackLogs: {},
    staticFallbackMemory: {},
    cachedResources: {
      personas: [],
      thoughts: [],
      worldbooks: [],
      stickerCats: [],
      stickers: [],
      modules: [],
      moduleChapters: [],
      moduleImages: [],
      charCards: [],
    },

    async openScreen() {
      if (typeof window.showScreen === "function") {
        window.showScreen("tukey-accounting-screen");
      }
      await this.init();
      await this.refreshLocalResources();
      await this.syncFromServer(true);
      await this.refreshSandboxLog();
    },

    closeScreen() {
      if (typeof window.showScreen === "function") {
        window.showScreen("home-screen");
      }
    },

    async init() {
      if (this.initialized) return;
      this.initialized = true;
      this.populateTutorialReverseWsUrl();
      await this.refreshLocalResources();
      await this.syncFromServer(true);
      await this.refreshSandboxLog();
      this.startBackgroundWatcher();
    },

    populateTutorialReverseWsUrl() {
      const input = document.getElementById("qqbot-rev-ws-copy-input");
      if (!input) return;
      const host = window.location.host || "127.0.0.1:3000";
      const isLocal =
        host.includes("127.0.0.1") ||
        host.includes("localhost") ||
        host.startsWith("192.168.");
      input.value = isLocal
        ? `ws://${host}/api/qqbot/ws`
        : "ws://127.0.0.1:3000/api/qqbot/ws";
    },

    openTutorialModal() {
      this.populateTutorialReverseWsUrl();
      const modal = document.getElementById("qqbot-tutorial-modal");
      if (modal) modal.style.display = "flex";
    },

    closeTutorialModal() {
      const modal = document.getElementById("qqbot-tutorial-modal");
      if (modal) modal.style.display = "none";
    },

    async copyCmdById(inputId, tipText) {
      const input = document.getElementById(inputId);
      const val = input ? input.value : "";
      if (!val) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(val);
        } else if (input) {
          input.select();
          document.execCommand("copy");
        }
        this.notify(tipText || "已复制命令");
      } catch (e) {
        this.notify("已选中请长按复制");
      }
    },

    async copyTermuxCmd() {
      await this.copyCmdById("qqbot-termux-cmd-input", "已复制Termux磁盘命令");
    },

    async copyReverseWsUrl() {
      await this.copyCmdById("qqbot-rev-ws-copy-input", "已复制反向WS地址");
    },

    toastTimer: null,
    worldBookCollapsedMap: {},
    moduleCategoryCollapsedMap: {},

    notify(msg) {
      const badge = document.getElementById("qqbot-conn-badge");
      if (badge) {
        badge.textContent = msg;
      }
      const banner = document.getElementById("qqbot-toast-banner");
      if (banner) {
        banner.textContent = msg;
        banner.style.display = "block";
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
          banner.style.display = "none";
        }, 3600);
      }
    },

    updateConnDetail(text, isHighlight = false) {
      const box = document.getElementById("qqbot-conn-detail-box");
      if (box) {
        box.textContent = text;
        box.style.color = isHighlight
          ? "var(--accent-color)"
          : "var(--text-primary)";
      }
    },

    /* ============================================================================
     * 群成员实时备注名解析：优先自定义备注 -> AI在QQ上改的好友备注或群名片 -> 角色卡名 -> QQ号
     * ============================================================================ */
    resolveMemberDisplayName(gCfg, senderId, fallbackName) {
      const sid = String(senderId || "").trim();
      const cleanFallback = String(fallbackName || "").trim();
      if (!gCfg) return cleanFallback || sid || "群友";

      if (!gCfg.memberRemarks) gCfg.memberRemarks = {};
      if (cleanFallback && cleanFallback !== sid && cleanFallback !== "群成员" && cleanFallback !== "群友") {
        gCfg.memberRemarks[sid] = cleanFallback;
      }

      if (Array.isArray(gCfg.playerBindings)) {
        const bound = gCfg.playerBindings.find((b) => String(b.qq) === sid);
        if (bound) {
          if (cleanFallback && cleanFallback !== sid && cleanFallback !== "群成员") {
            bound.qqRemark = cleanFallback;
          }
          if (bound.alias && String(bound.alias).trim()) {
            return String(bound.alias).trim();
          }
          if (bound.qqRemark && String(bound.qqRemark).trim()) {
            return String(bound.qqRemark).trim();
          }
          if (
            bound.cardName &&
            bound.cardName !== "未绑定角色卡" &&
            bound.cardName !== "未绑角色卡"
          ) {
            return String(bound.cardName).trim();
          }
        }
      }

      return cleanFallback || gCfg.memberRemarks[sid] || sid || "群友";
    },

    async refreshLocalResources() {
      const dbRef = window.db;
      if (!dbRef) return;
      try {
        const [
          chats,
          personaPresets,
          thoughtPresets,
          worldBooks,
          worldBookCategories,
          stickerCats,
          stickers,
          modules,
          moduleChapters,
          moduleImages,
          globalApiCfg,
        ] = await Promise.all([
          dbRef.chats ? dbRef.chats.toArray().catch(() => []) : [],
          dbRef.personaPresets ? dbRef.personaPresets.toArray().catch(() => []) : [],
          dbRef.thoughtChainPresets
            ? dbRef.thoughtChainPresets.toArray().catch(() => [])
            : [],
          dbRef.worldBooks ? dbRef.worldBooks.toArray().catch(() => []) : [],
          dbRef.worldBookCategories
            ? dbRef.worldBookCategories.toArray().catch(() => [])
            : [],
          dbRef.userStickerCategories
            ? dbRef.userStickerCategories.toArray().catch(() => [])
            : [],
          dbRef.userStickers ? dbRef.userStickers.toArray().catch(() => []) : [],
          dbRef.modules ? dbRef.modules.toArray().catch(() => []) : [],
          dbRef.moduleChapters ? dbRef.moduleChapters.toArray().catch(() => []) : [],
          dbRef.moduleImages ? dbRef.moduleImages.toArray().catch(() => []) : [],
          dbRef.apiConfig ? dbRef.apiConfig.get("main").catch(() => null) : null,
        ]);

        const personas = [];
        (chats || []).forEach((c) => {
          if (!c.isGroup) {
            personas.push({
              id: "chat:" + c.id,
              name: c.name || "角色 " + c.id,
              prompt:
                (c.settings && c.settings.aiPersona) ||
                c.description ||
                c.personality ||
                "",
            });
          }
        });
        (personaPresets || []).forEach((p) => {
          personas.push({
            id: "preset:" + p.id,
            name: p.name || p.title || "预设 " + p.id,
            prompt: p.content || p.persona || p.prompt || "",
          });
        });

        const charCards = [];
        (chats || []).forEach((c) => {
          if (!c.isGroup) {
            charCards.push({
              id: String(c.id),
              name: c.name || "角色卡",
              cocData: c.cocData || (c.settings && c.settings.cocData) || null,
              persona:
                (c.settings && c.settings.aiPersona) ||
                (c.settings && c.settings.myPersona) ||
                c.description ||
                "",
            });
          }
        });

        this.cachedResources = {
          personas,
          thoughts: thoughtPresets || [],
          worldbooks: worldBooks || [],
          worldbookCats: worldBookCategories || [],
          stickerCats: stickerCats || [],
          stickers: stickers || [],
          modules: modules || [],
          moduleChapters: moduleChapters || [],
          moduleImages: moduleImages || [],
          charCards,
          globalApiConfig: globalApiCfg || null,
        };

        this.renderResourceSelects();
      } catch (err) {
        console.warn("加载本地数据库资源异常:", err);
      }
    },

    renderResourceSelects() {
      const g = this.getCurrentGroupConfig();

      const personaEl = document.getElementById("qqbot-persona-select");
      if (personaEl) {
        const cur = g ? g.personaId : personaEl.value;
        personaEl.innerHTML =
          '<option value="">自定义AI人设或选择角色预设导入</option>' +
          this.cachedResources.personas
            .map(
              (p) =>
                `<option value="${this.escapeAttr(p.id)}">${this.escapeHtml(p.name)}</option>`,
            )
            .join("");
        if (cur) personaEl.value = cur;
      }

      const thoughtEl = document.getElementById("qqbot-thought-select");
      if (thoughtEl) {
        const cur = g ? g.thoughtChainId : thoughtEl.value;
        thoughtEl.innerHTML =
          '<option value="">选择思维链预设导入到下方列表</option>' +
          this.cachedResources.thoughts
            .map(
              (t) =>
                `<option value="${this.escapeAttr(String(t.id))}">${this.escapeHtml(t.name || t.title || "思维链预设")}</option>`,
            )
            .join("");
        if (cur) thoughtEl.value = cur;
      }

      const wbEl = document.getElementById("qqbot-worldbook-select");
      if (wbEl) {
        const cur = g ? g.worldBookId : wbEl.value;
        const cats = this.cachedResources.worldbookCats || [];
        wbEl.innerHTML =
          '<option value="">选择世界书或下方逐条开关</option>' +
          '<option value="ALL">全部世界书条目</option>' +
          cats
            .map(
              (c) =>
                `<option value="CAT:${this.escapeAttr(String(c.id))}">分类 · ${this.escapeHtml(c.name || "未命名分类")}</option>`,
            )
            .join("") +
          this.cachedResources.worldbooks
            .map(
              (w) =>
                `<option value="${this.escapeAttr(String(w.id))}">${this.escapeHtml(w.name || "世界书")}</option>`,
            )
            .join("");
        if (cur) wbEl.value = cur;
      }

      const stEl = document.getElementById("qqbot-sticker-select");
      if (stEl) {
        const cur = g ? g.stickerCategoryId : stEl.value;
        stEl.innerHTML =
          '<option value="ALL">全部可用表情包</option>' +
          '<option value="NONE">不自动发表情包</option>' +
          this.cachedResources.stickerCats
            .map(
              (c) =>
                `<option value="${this.escapeAttr(String(c.id))}">${this.escapeHtml(c.name || "分类")}</option>`,
            )
            .join("");
        if (cur) stEl.value = cur;
      }

      const modEl = document.getElementById("qqbot-module-select");
      if (modEl) {
        const cur = g ? g.moduleId : modEl.value;
        modEl.innerHTML =
          '<option value="">不加载跑团模组</option>' +
          this.cachedResources.modules
            .map(
              (m) =>
                `<option value="${this.escapeAttr(String(m.id))}">${this.escapeHtml(m.title || m.name || "未命名模组")}</option>`,
            )
            .join("");
        if (cur) modEl.value = cur;
      }

      this.renderModuleChaptersSelect(
        g ? g.moduleId : modEl ? modEl.value : "",
        g ? g.chapterId : "",
      );
      this.renderWorldBookItemsList();
      this.renderModuleChaptersList();

      const cardEl = document.getElementById("qqbot-bind-card-select");
      if (cardEl) {
        const cur = cardEl.value;
        cardEl.innerHTML =
          '<option value="">不绑角色卡仅用下方人设</option>' +
          this.cachedResources.charCards
            .map(
              (c) =>
                `<option value="${this.escapeAttr(c.id)}">${this.escapeHtml(c.name)}</option>`,
            )
            .join("");
        if (cur) cardEl.value = cur;
      }
    },

    renderModuleChaptersSelect(moduleId, selectedChapterId) {
      const chapEl = document.getElementById("qqbot-chapter-select");
      if (!chapEl) return;
      if (!moduleId) {
        chapEl.innerHTML = '<option value="ALL">全部章节与KP真相</option>';
        return;
      }
      const chaps = this.cachedResources.moduleChapters
        .filter((c) => String(c.moduleId) === String(moduleId))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      chapEl.innerHTML =
        '<option value="ALL">全部章节与KP真相</option>' +
        chaps
          .map(
            (c, idx) =>
              `<option value="${this.escapeAttr(String(c.id))}">第${idx + 1}章 ${this.escapeHtml(c.title || "章节")}</option>`,
          )
          .join("");
      if (selectedChapterId) chapEl.value = selectedChapterId;
    },

    /* ============================================================================
     * 跑团模组分类与章节条目逐条开关 - 与群聊载入模组完全一致
     * ============================================================================ */
    classifyModuleChapter(chap) {
      const c = String(chap.category || "").toLowerCase();
      const t = String(chap.title || "").toLowerCase();
      if (
        c.includes("公开") ||
        t.includes("公开") ||
        c.includes("事前") ||
        t.includes("事前") ||
        c.includes("须知") ||
        t.includes("须知") ||
        c.includes("背景") ||
        t.includes("背景")
      )
        return "事前公开";
      if (
        c.includes("真相") ||
        c.includes("kp信息") ||
        c.includes("大纲") ||
        c.includes("带团") ||
        c.includes("导读") ||
        t.includes("真相") ||
        t.includes("大纲") ||
        t.includes("机制") ||
        t.includes("导读") ||
        t.includes("kp信息")
      )
        return "大纲与真相";
      if (
        c.includes("npc与猫") ||
        c.includes("猫") ||
        t.includes("猫") ||
        (c.includes("npc") && c.includes("猫"))
      )
        return "NPC与猫";
      if (
        c.includes("npc") ||
        t.includes("npc") ||
        c.includes("人设") ||
        t.includes("人设") ||
        t.includes("人物设定")
      )
        return "人设";
      if (
        c.includes("导入") ||
        t.includes("导入") ||
        t.includes("开局") ||
        t.includes("序幕")
      )
        return "导入";
      if (
        c.includes("ho") ||
        c.includes("秘密") ||
        t.includes("ho") ||
        t.includes("秘密")
      )
        return "HO秘密与设定";
      if (c.includes("单人") || t.includes("单人")) return "单人线";
      if (
        c.includes("结局") ||
        t.includes("结局") ||
        t.includes("结末") ||
        t.includes("尾声")
      )
        return "结局";
      if (
        c.includes("道具") ||
        t.includes("道具") ||
        c.includes("线索") ||
        t.includes("线索") ||
        c.includes("物品") ||
        t.includes("物品")
      )
        return "道具与线索";
      if (c.includes("附录") || c.includes("数值") || c.includes("规则"))
        return "附录与规则";
      if (
        c.includes("正文") ||
        c.includes("主线") ||
        c.includes("地点") ||
        c.includes("时间") ||
        t.includes("第") ||
        t.includes("章")
      )
        return "正文";
      return "其他分类";
    },

    onModuleSelectChange() {
      const modEl = document.getElementById("qqbot-module-select");
      const g = this.getCurrentGroupConfig();
      const moduleId = modEl ? modEl.value : "";
      if (g) {
        const prevModId = g.moduleId;
        g.moduleId = moduleId;
        if (moduleId && String(prevModId) !== String(moduleId)) {
          const chaps = this.cachedResources.moduleChapters.filter(
            (c) => String(c.moduleId) === String(moduleId),
          );
          g.selectedModuleChapterIds = chaps.map((c) => String(c.id));
          if (g.loadModuleToc === undefined) g.loadModuleToc = true;
          if (g.loadModuleImages === undefined) g.loadModuleImages = true;
        }
      }
      this.renderModuleChaptersSelect(moduleId, "ALL");
      this.renderModuleChaptersList();
      this.onCurrentGroupFieldChange();
      if (moduleId) {
        this.notify("已载入模组分类与条目");
      }
    },

    loadSelectedModuleEntries() {
      const modEl = document.getElementById("qqbot-module-select");
      const g = this.getCurrentGroupConfig();
      if (!g || !modEl || !modEl.value) {
        this.notify("请先在下拉框中选择模组");
        return;
      }
      const moduleId = String(modEl.value);
      g.moduleId = moduleId;
      const chaps = this.cachedResources.moduleChapters.filter(
        (c) => String(c.moduleId) === moduleId,
      );
      if (
        !Array.isArray(g.selectedModuleChapterIds) ||
        g.selectedModuleChapterIds.length === 0
      ) {
        g.selectedModuleChapterIds = chaps.map((c) => String(c.id));
      }
      Object.keys(this.moduleCategoryCollapsedMap).forEach((k) => {
        this.moduleCategoryCollapsedMap[k] = false;
      });
      this.renderModuleChaptersList();
      this.saveAllSettings(false);
      this.notify(`已载入模组共${chaps.length}个条目`);
    },

    onModuleMetaToggle() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const tocCb = document.getElementById("qqbot-module-toc-cb");
      const imgCb = document.getElementById("qqbot-module-img-cb");
      if (tocCb) g.loadModuleToc = Boolean(tocCb.checked);
      if (imgCb) g.loadModuleImages = Boolean(imgCb.checked);
      this.saveAllSettings(false);
    },

    toggleAllModuleChapters(enable) {
      const g = this.getCurrentGroupConfig();
      if (!g || !g.moduleId) {
        this.notify("请先选择跑团模组");
        return;
      }
      const chaps = this.cachedResources.moduleChapters.filter(
        (c) => String(c.moduleId) === String(g.moduleId),
      );
      g.selectedModuleChapterIds = enable
        ? chaps.map((c) => String(c.id))
        : [];
      this.renderModuleChaptersList();
      this.saveAllSettings(false);
      this.notify(enable ? "已全开模组条目" : "已全关模组条目");
    },

    toggleModuleCategory(categoryName) {
      const g = this.getCurrentGroupConfig();
      if (!g || !g.moduleId) return;
      const chaps = this.cachedResources.moduleChapters.filter(
        (c) =>
          String(c.moduleId) === String(g.moduleId) &&
          this.classifyModuleChapter(c) === categoryName,
      );
      if (!Array.isArray(g.selectedModuleChapterIds)) {
        g.selectedModuleChapterIds = [];
      }
      const selectedSet = new Set(g.selectedModuleChapterIds.map(String));
      const allActive =
        chaps.length > 0 && chaps.every((c) => selectedSet.has(String(c.id)));
      if (allActive) {
        chaps.forEach((c) => selectedSet.delete(String(c.id)));
      } else {
        chaps.forEach((c) => selectedSet.add(String(c.id)));
      }
      g.selectedModuleChapterIds = Array.from(selectedSet);
      this.renderModuleChaptersList();
      this.saveAllSettings(false);
    },

    toggleModuleCategoryFold(categoryName) {
      const key = String(this.currentGroupId || "") + "_" + categoryName;
      this.moduleCategoryCollapsedMap[key] =
        !this.moduleCategoryCollapsedMap[key];
      this.renderModuleChaptersList();
    },

    toggleModuleChapter(chapId) {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      if (!Array.isArray(g.selectedModuleChapterIds)) {
        g.selectedModuleChapterIds = [];
      }
      const idStr = String(chapId);
      const idx = g.selectedModuleChapterIds.findIndex(
        (x) => String(x) === idStr,
      );
      if (idx >= 0) {
        g.selectedModuleChapterIds.splice(idx, 1);
      } else {
        g.selectedModuleChapterIds.push(idStr);
      }
      this.renderModuleChaptersList();
      this.saveAllSettings(false);
    },

    renderModuleChaptersList() {
      const listEl = document.getElementById("qqbot-module-chapters-list");
      const countEl = document.getElementById("qqbot-module-active-count");
      const tocCb = document.getElementById("qqbot-module-toc-cb");
      const imgCb = document.getElementById("qqbot-module-img-cb");
      const g = this.getCurrentGroupConfig();
      if (!listEl) return;

      if (!g || !g.moduleId) {
        if (countEl) countEl.textContent = "未选择跑团模组";
        listEl.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 2px;">在上方下拉框选择模组并点载入后，即可像群聊一样按分类展开并单独打开或关闭每个模组条目与章节</div>';
        return;
      }

      if (tocCb) tocCb.checked = g.loadModuleToc !== false;
      if (imgCb) imgCb.checked = g.loadModuleImages !== false;

      const allChaps = this.cachedResources.moduleChapters
        .filter((c) => String(c.moduleId) === String(g.moduleId))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      if (!Array.isArray(g.selectedModuleChapterIds)) {
        g.selectedModuleChapterIds = allChaps.map((c) => String(c.id));
      }
      const selectedSet = new Set(g.selectedModuleChapterIds.map(String));
      const activeCount = allChaps.filter((c) =>
        selectedSet.has(String(c.id)),
      ).length;
      if (countEl) {
        countEl.textContent = `已加载 ${activeCount} / ${allChaps.length} 个章节条目`;
      }

      if (allChaps.length === 0) {
        listEl.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 6px 2px;">该模组暂无章节条目数据</div>';
        return;
      }

      const GROUP_ORDER = [
        "事前公开",
        "大纲与真相",
        "NPC与猫",
        "人设",
        "导入",
        "正文",
        "HO秘密与设定",
        "单人线",
        "结局",
        "道具与线索",
        "附录与规则",
        "其他分类",
      ];

      const groupedMap = new Map();
      GROUP_ORDER.forEach((name) => groupedMap.set(name, []));
      allChaps.forEach((chap) => {
        const gName = this.classifyModuleChapter(chap);
        if (!groupedMap.has(gName)) groupedMap.set(gName, []);
        groupedMap.get(gName).push(chap);
      });

      const htmlParts = [];
      GROUP_ORDER.forEach((categoryName) => {
        const chaps = groupedMap.get(categoryName) || [];
        if (chaps.length === 0) return;

        const foldKey = String(this.currentGroupId || "") + "_" + categoryName;
        const isCollapsed = Boolean(this.moduleCategoryCollapsedMap[foldKey]);
        const enabledInCat = chaps.filter((c) =>
          selectedSet.has(String(c.id)),
        ).length;
        const isAllCatOn = enabledInCat === chaps.length;
        const catBadgeBg = isAllCatOn
          ? "var(--accent-color)"
          : enabledInCat > 0
            ? "var(--secondary-bg)"
            : "var(--card-bg)";
        const catBadgeColor = isAllCatOn ? "#ffffff" : "var(--text-primary)";

        const rowsHtml = chaps
          .map((chap) => {
            const isOn = selectedSet.has(String(chap.id));
            const bBg = isOn ? "var(--accent-color)" : "var(--card-bg)";
            const bColor = isOn ? "#ffffff" : "var(--text-secondary)";
            const wc =
              chap.wordCount || (chap.content ? chap.content.length : 0);
            return `
              <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border-color);">
                <span style="width: 38px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${bBg}; color: ${bColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "已开" : "已关"}</span>
                <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; color: var(--text-primary);">
                  <span style="font-weight: 600;">${this.escapeHtml(chap.title || "未命名章节")}</span>
                  <span style="font-size: 10.5px; color: var(--text-secondary); margin-left: 4px;">${wc}字</span>
                </div>
                <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleModuleChapter('${this.escapeAttr(String(chap.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
              </div>
            `;
          })
          .join("");

        htmlParts.push(`
          <div style="border-radius: 8px; border: 1px solid var(--border-color); background: var(--secondary-bg); overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer;" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategoryFold('${this.escapeAttr(categoryName)}');}">
              <span style="width: 42px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${catBadgeBg}; color: ${catBadgeColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${enabledInCat}/${chaps.length}</span>
              <span style="flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(categoryName)}</span>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategory('${this.escapeAttr(categoryName)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isAllCatOn ? "停用" : "启用"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategoryFold('${this.escapeAttr(categoryName)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isCollapsed ? "展开" : "折叠"}</button>
            </div>
            <div style="display: ${isCollapsed ? "none" : "flex"}; flex-direction: column; gap: 4px; padding: 0 8px 8px;">
              ${rowsHtml}
            </div>
          </div>
        `);
      });

      listEl.innerHTML = htmlParts.join("");
    },

    /* ============================================================================
     * 世界书分类与条目逐条开关 - 与群聊世界书完全一致
     * ============================================================================ */
    onWorldBookSelectChange() {
      const wbEl = document.getElementById("qqbot-worldbook-select");
      const g = this.getCurrentGroupConfig();
      if (!g || !wbEl) return;
      g.worldBookId = wbEl.value;
      if (wbEl.value) {
        this.loadWorldBookEntries();
      } else {
        this.renderWorldBookItemsList();
        this.saveAllSettings(false);
      }
    },

    loadWorldBookEntries() {
      const wbEl = document.getElementById("qqbot-worldbook-select");
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const val = wbEl ? wbEl.value : "";
      const allBooks = this.cachedResources.worldbooks || [];
      if (!Array.isArray(g.enabledWorldBookIds)) {
        g.enabledWorldBookIds = [];
      }
      const set = new Set(g.enabledWorldBookIds.map(String));

      if (!val || val === "ALL") {
        allBooks.forEach((b) => set.add(String(b.id)));
        Object.keys(this.worldBookCollapsedMap).forEach((k) => {
          this.worldBookCollapsedMap[k] = false;
        });
        this.notify(`已载入全部${allBooks.length}个世界书条目`);
      } else if (val.startsWith("CAT:")) {
        const catId = val.slice(4);
        const matched = allBooks.filter(
          (b) => String(b.categoryId || "uncategorized") === String(catId),
        );
        matched.forEach((b) => set.add(String(b.id)));
        this.worldBookCollapsedMap[catId] = false;
        this.notify(`已载入分类下${matched.length}个世界书条目`);
      } else {
        set.add(String(val));
        const found = allBooks.find((b) => String(b.id) === String(val));
        if (found) {
          this.worldBookCollapsedMap[String(found.categoryId || "uncategorized")] =
            false;
        }
        this.notify("已载入选中世界书条目");
      }

      g.enabledWorldBookIds = Array.from(set);
      this.renderWorldBookItemsList();
      this.saveAllSettings(false);
    },

    toggleAllWorldBookEntries(enable) {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const allBooks = this.cachedResources.worldbooks || [];
      g.enabledWorldBookIds = enable
        ? allBooks.map((b) => String(b.id))
        : [];
      if (!enable) g.worldBookId = "";
      this.renderWorldBookItemsList();
      this.saveAllSettings(false);
      this.notify(enable ? "已全开世界书条目" : "已全关世界书条目");
    },

    toggleWorldBookCategory(catId) {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const allBooks = this.cachedResources.worldbooks || [];
      const catIds = new Set(
        (this.cachedResources.worldbookCats || []).map((c) => String(c.id)),
      );
      const booksInCat = allBooks.filter((b) => {
        const cid =
          b.categoryId && catIds.has(String(b.categoryId))
            ? String(b.categoryId)
            : "uncategorized";
        return cid === String(catId);
      });
      if (!Array.isArray(g.enabledWorldBookIds)) g.enabledWorldBookIds = [];
      const set = new Set(g.enabledWorldBookIds.map(String));
      const allOn =
        booksInCat.length > 0 &&
        booksInCat.every((b) => set.has(String(b.id)));
      if (allOn) {
        booksInCat.forEach((b) => set.delete(String(b.id)));
      } else {
        booksInCat.forEach((b) => set.add(String(b.id)));
      }
      g.enabledWorldBookIds = Array.from(set);
      this.renderWorldBookItemsList();
      this.saveAllSettings(false);
    },

    toggleWorldBookCategoryFold(catId) {
      const key = String(catId);
      this.worldBookCollapsedMap[key] = !this.worldBookCollapsedMap[key];
      this.renderWorldBookItemsList();
    },

    toggleWorldBookEntry(bookId) {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      if (!Array.isArray(g.enabledWorldBookIds)) g.enabledWorldBookIds = [];
      const idStr = String(bookId);
      const idx = g.enabledWorldBookIds.findIndex((x) => String(x) === idStr);
      if (idx >= 0) {
        g.enabledWorldBookIds.splice(idx, 1);
      } else {
        g.enabledWorldBookIds.push(idStr);
      }
      this.renderWorldBookItemsList();
      this.saveAllSettings(false);
    },

    renderWorldBookItemsList() {
      const container = document.getElementById("qqbot-worldbook-items-list");
      const g = this.getCurrentGroupConfig();
      if (!container || !g) return;

      const allBooks = this.cachedResources.worldbooks || [];
      if (allBooks.length === 0) {
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 2px;">当前尚无世界书条目</div>';
        return;
      }

      if (!Array.isArray(g.enabledWorldBookIds)) {
        if (g.worldBookId === "ALL") {
          g.enabledWorldBookIds = allBooks.map((b) => String(b.id));
        } else if (g.worldBookId && !g.worldBookId.startsWith("CAT:")) {
          g.enabledWorldBookIds = [String(g.worldBookId)];
        } else {
          g.enabledWorldBookIds = [];
        }
      }
      const enabledSet = new Set(g.enabledWorldBookIds.map(String));
      const rawCats = this.cachedResources.worldbookCats || [];
      const catIds = new Set(rawCats.map((c) => String(c.id)));
      const categories = rawCats.map((c) => ({
        id: String(c.id),
        name: c.name || "未命名分类",
      }));
      if (
        allBooks.some(
          (b) => !b.categoryId || !catIds.has(String(b.categoryId)),
        )
      ) {
        categories.push({ id: "uncategorized", name: "未分类世界书" });
      }

      const htmlParts = [];
      categories.forEach((cat) => {
        const books = allBooks.filter((b) => {
          const cid =
            b.categoryId && catIds.has(String(b.categoryId))
              ? String(b.categoryId)
              : "uncategorized";
          return cid === cat.id;
        });
        if (books.length === 0) return;

        const isCollapsed = Boolean(this.worldBookCollapsedMap[cat.id]);
        const onCount = books.filter((b) =>
          enabledSet.has(String(b.id)),
        ).length;
        const isAllOn = onCount === books.length;
        const catBg = isAllOn
          ? "var(--accent-color)"
          : onCount > 0
            ? "var(--secondary-bg)"
            : "var(--card-bg)";
        const catColor = isAllOn ? "#ffffff" : "var(--text-primary)";

        const rows = books
          .map((b) => {
            const isOn = enabledSet.has(String(b.id));
            const bBg = isOn ? "var(--accent-color)" : "var(--card-bg)";
            const bColor = isOn ? "#ffffff" : "var(--text-secondary)";
            const preview = String(b.content || "")
              .replace(/\s+/g, " ")
              .slice(0, 36);
            return `
              <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border-color);">
                <span style="width: 38px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${bBg}; color: ${bColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "已开" : "已关"}</span>
                <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; color: var(--text-primary);">
                  <span style="font-weight: 700;">${this.escapeHtml(b.name || "世界书条目")}</span>
                  <span style="color: var(--text-secondary); margin-left: 4px;">${this.escapeHtml(preview)}</span>
                </div>
                <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookEntry('${this.escapeAttr(String(b.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
              </div>
            `;
          })
          .join("");

        htmlParts.push(`
          <div style="border-radius: 8px; border: 1px solid var(--border-color); background: var(--secondary-bg); overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer;" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategoryFold('${this.escapeAttr(cat.id)}');}">
              <span style="width: 42px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${catBg}; color: ${catColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${onCount}/${books.length}</span>
              <span style="flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(cat.name)}</span>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategory('${this.escapeAttr(cat.id)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isAllOn ? "停用" : "启用"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategoryFold('${this.escapeAttr(cat.id)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isCollapsed ? "展开" : "折叠"}</button>
            </div>
            <div style="display: ${isCollapsed ? "none" : "flex"}; flex-direction: column; gap: 4px; padding: 0 8px 8px;">
              ${rows}
            </div>
          </div>
        `);
      });

      container.innerHTML = htmlParts.join("");
    },

    onPersonaPresetSelect() {
      const personaEl = document.getElementById("qqbot-persona-select");
      const aiPersonaInput = document.getElementById("qqbot-ai-persona-input");
      const val = personaEl ? personaEl.value : "";
      if (val && aiPersonaInput) {
        const found = this.cachedResources.personas.find(
          (p) => String(p.id) === String(val),
        );
        if (found && found.prompt) {
          aiPersonaInput.value = found.prompt;
        }
      }
      this.onCurrentGroupFieldChange();
    },

    /* ============================================================================
     * 群控独立主API与副API配置与模型拉取
     * ============================================================================ */
    populateApiConfigUI() {
      if (!this.serverState || !this.serverState.config) return;
      const cfg = this.serverState.config;
      const mainApi = cfg.mainApi || {};
      const subApi = cfg.subApi || {};

      const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el && v !== undefined && v !== null) el.value = String(v);
      };

      setVal("qqbot-main-api-url", mainApi.url || "");
      setVal("qqbot-main-api-key", mainApi.apiKey || "");
      setVal("qqbot-main-api-model", mainApi.model || "");
      setVal("qqbot-sub-api-url", subApi.url || "");
      setVal("qqbot-sub-api-key", subApi.apiKey || "");
      setVal("qqbot-sub-api-model", subApi.model || "");
    },

    onApiFieldChange() {
      if (!this.serverState || !this.serverState.config) return;
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };
      this.serverState.config.mainApi = {
        url: getVal("qqbot-main-api-url"),
        apiKey: getVal("qqbot-main-api-key"),
        model: getVal("qqbot-main-api-model"),
      };
      this.serverState.config.subApi = {
        url: getVal("qqbot-sub-api-url"),
        apiKey: getVal("qqbot-sub-api-key"),
        model: getVal("qqbot-sub-api-model"),
      };
      this.saveAllSettings(false);
    },

    copyFromGlobalApi(targetType) {
      const stCfg =
        this.cachedResources.globalApiConfig ||
        (window.state && window.state.apiConfig) ||
        {};
      const getGlobalVal = (id, fallback) => {
        const el = document.getElementById(id);
        return (el && el.value && el.value.trim()) || fallback || "";
      };
      if (targetType === "main") {
        const url = getGlobalVal("proxy-url", stCfg.proxyUrl);
        const key = getGlobalVal("api-key", stCfg.apiKey);
        const mod = getGlobalVal("model-select", stCfg.model);
        const uEl = document.getElementById("qqbot-main-api-url");
        const kEl = document.getElementById("qqbot-main-api-key");
        const mEl = document.getElementById("qqbot-main-api-model");
        if (uEl) uEl.value = url;
        if (kEl) kEl.value = key;
        if (mEl) mEl.value = mod;
        this.notify("已填入全局主API");
      } else {
        const url =
          getGlobalVal("sub-proxy-url", stCfg.subProxyUrl) ||
          getGlobalVal("proxy-url", stCfg.proxyUrl);
        const key =
          getGlobalVal("sub-api-key", stCfg.subApiKey) ||
          getGlobalVal("api-key", stCfg.apiKey);
        const mod =
          getGlobalVal("sub-model-select", stCfg.subModel) ||
          getGlobalVal("model-select", stCfg.model);
        const uEl = document.getElementById("qqbot-sub-api-url");
        const kEl = document.getElementById("qqbot-sub-api-key");
        const mEl = document.getElementById("qqbot-sub-api-model");
        if (uEl) uEl.value = url;
        if (kEl) kEl.value = key;
        if (mEl) mEl.value = mod;
        this.notify("已填入全局副API");
      }
      this.onApiFieldChange();
    },

    async fetchBotModels(targetType) {
      const isMain = targetType === "main";
      const urlEl = document.getElementById(
        isMain ? "qqbot-main-api-url" : "qqbot-sub-api-url",
      );
      const keyEl = document.getElementById(
        isMain ? "qqbot-main-api-key" : "qqbot-sub-api-key",
      );
      const modEl = document.getElementById(
        isMain ? "qqbot-main-api-model" : "qqbot-sub-api-model",
      );
      const dlEl = document.getElementById(
        isMain ? "qqbot-main-model-datalist" : "qqbot-sub-model-datalist",
      );

      const stCfg =
        this.cachedResources.globalApiConfig ||
        (window.state && window.state.apiConfig) ||
        {};
      let rawUrl = urlEl ? urlEl.value.trim() : "";
      let rawKey = keyEl ? keyEl.value.trim() : "";

      if (!rawUrl) {
        const gUrlEl = document.getElementById(
          isMain ? "proxy-url" : "sub-proxy-url",
        );
        rawUrl =
          (gUrlEl && gUrlEl.value.trim()) ||
          (isMain ? stCfg.proxyUrl : stCfg.subProxyUrl) ||
          stCfg.proxyUrl ||
          "";
      }
      if (!rawKey) {
        const gKeyEl = document.getElementById(
          isMain ? "api-key" : "sub-api-key",
        );
        rawKey =
          (gKeyEl && gKeyEl.value.trim()) ||
          (isMain ? stCfg.apiKey : stCfg.subApiKey) ||
          stCfg.apiKey ||
          "";
      }

      if (!rawUrl) {
        this.notify("请先填写接口地址");
        return;
      }

      const apiBadge = document.getElementById("qqbot-api-status-badge");
      if (apiBadge) apiBadge.textContent = "正在拉取模型...";

      let base = rawUrl.replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
      if (!base.endsWith("/v1") && !base.includes("/paas/v4")) {
        base += "/v1";
      }

      try {
        const res = await fetch(`${base}/models`, {
          method: "GET",
          headers: rawKey ? { Authorization: `Bearer ${rawKey}` } : {},
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const models = Array.isArray(data && data.data)
          ? data.data.map((m) => m.id).filter(Boolean)
          : [];
        if (models.length > 0 && dlEl) {
          dlEl.innerHTML = models
            .map(
              (id) =>
                `<option value="${this.escapeAttr(id)}">${this.escapeHtml(id)}</option>`,
            )
            .join("");
          if (modEl && !modEl.value) {
            modEl.value = models[0];
          }
          this.onApiFieldChange();
          if (apiBadge) apiBadge.textContent = `已拉取 ${models.length} 个模型`;
          this.notify(`拉取成功共${models.length}个`);
        } else {
          if (apiBadge) apiBadge.textContent = "未返回模型列表";
        }
      } catch (e) {
        if (apiBadge) apiBadge.textContent = "拉取失败请手填";
        this.notify("拉取失败请检查地址");
      }
    },

    /* ============================================================================
     * 思维链预设加载与分类条目逐条开关 - 支持天空之城等完整分组条目结构
     * ============================================================================ */
    renderThoughtItemsList() {
      const container = document.getElementById("qqbot-thought-items-list");
      const g = this.getCurrentGroupConfig();
      if (!container || !g) return;
      if (!Array.isArray(g.thoughtItems) || g.thoughtItems.length === 0) {
        g.thoughtItems = getDefaultThoughtChainItems();
      }

      const groups = Array.isArray(g.thoughtGroups) ? g.thoughtGroups : [];
      const renderEntryRow = (item) => {
        const isOn = item.enabled !== false;
        const badgeBg = isOn ? "var(--accent-color)" : "var(--card-bg)";
        const badgeColor = isOn ? "#ffffff" : "var(--text-secondary)";
        const titleStr = item.title || item.key || "规则条目";
        const contentPreview = String(item.content || "")
          .replace(/\s+/g, " ")
          .slice(0, 42);
        return `
          <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border-color);">
            <span style="width: 38px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "已开" : "已关"}</span>
            <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; color: var(--text-primary);">
              <span style="font-weight: 700;">${this.escapeHtml(titleStr)}</span>
              <span style="color: var(--text-secondary); margin-left: 4px;">${this.escapeHtml(contentPreview)}</span>
            </div>
            <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleThoughtItem('${this.escapeAttr(String(item.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
            <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.deleteThoughtItem('${this.escapeAttr(String(item.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">移除</button>
          </div>
        `;
      };

      if (groups.length > 0) {
        const validGroupIds = new Set(
          groups.map((grp) => grp && String(grp.id)).filter(Boolean),
        );
        const htmlParts = [];

        groups.forEach((grp) => {
          if (!grp) return;
          const gid = String(grp.id);
          const grpEntries = g.thoughtItems.filter(
            (ent) => ent && String(ent.groupId || "") === gid,
          );
          const isCollapsed = Boolean(grp.collapsed);
          const onCount = grpEntries.filter(
            (ent) => ent.enabled !== false,
          ).length;
          const isAllOn =
            grp.enabled !== false &&
            (grpEntries.length === 0 || onCount === grpEntries.length);
          const grpBadgeBg = isAllOn
            ? "var(--accent-color)"
            : onCount > 0
              ? "var(--secondary-bg)"
              : "var(--card-bg)";
          const grpBadgeColor = isAllOn ? "#ffffff" : "var(--text-primary)";

          htmlParts.push(`
            <div style="border-radius: 8px; border: 1px solid var(--border-color); background: var(--secondary-bg); overflow: hidden;">
              <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer;" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleThoughtGroupFold('${this.escapeAttr(gid)}');}">
                <span style="width: 42px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${grpBadgeBg}; color: ${grpBadgeColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${onCount}/${grpEntries.length}</span>
                <span style="flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(grp.name || "思维链分类")}</span>
                <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleThoughtGroup('${this.escapeAttr(gid)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isAllOn ? "停用" : "启用"}</button>
                <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleThoughtGroupFold('${this.escapeAttr(gid)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isCollapsed ? "展开" : "折叠"}</button>
              </div>
              <div style="display: ${isCollapsed ? "none" : "flex"}; flex-direction: column; gap: 4px; padding: 0 8px 8px;">
                ${
                  grpEntries.length > 0
                    ? grpEntries.map(renderEntryRow).join("")
                    : '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 2px;">该分类下暂无条目</div>'
                }
              </div>
            </div>
          `);
        });

        const ungrouped = g.thoughtItems.filter(
          (ent) =>
            ent && (!ent.groupId || !validGroupIds.has(String(ent.groupId))),
        );
        ungrouped.forEach((item) => {
          htmlParts.push(renderEntryRow(item));
        });

        container.innerHTML = htmlParts.join("");
        return;
      }

      container.innerHTML = g.thoughtItems.map(renderEntryRow).join("");
    },

    toggleThoughtGroup(groupId) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.thoughtGroups)) return;
      const grp = g.thoughtGroups.find(
        (x) => x && String(x.id) === String(groupId),
      );
      if (!grp) return;
      const grpEntries = (g.thoughtItems || []).filter(
        (ent) => ent && String(ent.groupId || "") === String(groupId),
      );
      const allOn =
        grp.enabled !== false &&
        grpEntries.every((ent) => ent.enabled !== false);
      const nextState = !allOn;
      grp.enabled = nextState;
      grpEntries.forEach((ent) => {
        ent.enabled = nextState;
      });
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
    },

    toggleThoughtGroupFold(groupId) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.thoughtGroups)) return;
      const grp = g.thoughtGroups.find(
        (x) => x && String(x.id) === String(groupId),
      );
      if (!grp) return;
      grp.collapsed = !grp.collapsed;
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
    },

    toggleAllThoughtItems(enable) {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      if (Array.isArray(g.thoughtGroups)) {
        g.thoughtGroups.forEach((grp) => {
          if (grp) grp.enabled = Boolean(enable);
        });
      }
      if (Array.isArray(g.thoughtItems)) {
        g.thoughtItems.forEach((item) => {
          if (item) item.enabled = Boolean(enable);
        });
      }
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
      this.notify(enable ? "已全开思维链条目" : "已全关思维链条目");
    },

    toggleThoughtItem(itemId) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.thoughtItems)) return;
      const target = g.thoughtItems.find((i) => String(i.id) === String(itemId));
      if (target) {
        target.enabled = target.enabled === false;
        if (
          target.enabled &&
          target.groupId &&
          Array.isArray(g.thoughtGroups)
        ) {
          const parentGrp = g.thoughtGroups.find(
            (grp) => grp && String(grp.id) === String(target.groupId),
          );
          if (parentGrp) parentGrp.enabled = true;
        }
        this.renderThoughtItemsList();
        this.saveAllSettings(false);
      }
    },

    deleteThoughtItem(itemId) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.thoughtItems)) return;
      g.thoughtItems = g.thoughtItems.filter(
        (i) => String(i.id) !== String(itemId),
      );
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
    },

    addThoughtItem() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const titleEl = document.getElementById("qqbot-new-thought-title");
      const contentEl = document.getElementById("qqbot-new-thought-content");
      const title = (titleEl ? titleEl.value.trim() : "") || "自定义规则";
      const content = contentEl ? contentEl.value.trim() : "";
      if (!content) {
        this.notify("请输入思维链内容");
        return;
      }
      if (!Array.isArray(g.thoughtItems)) g.thoughtItems = [];
      g.thoughtItems.push({
        id: "tc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        title,
        key: title,
        content,
        enabled: true,
      });
      if (titleEl) titleEl.value = "";
      if (contentEl) contentEl.value = "";
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
      this.notify("已新增思维链条目");
    },

    async importThoughtChainPreset() {
      const g = this.getCurrentGroupConfig();
      const sel = document.getElementById("qqbot-thought-select");
      if (!g || !sel || !sel.value) {
        this.notify("请先选择思维链预设");
        return;
      }
      if (
        !this.cachedResources.thoughts ||
        this.cachedResources.thoughts.length === 0
      ) {
        await this.refreshLocalResources();
      }
      let preset = this.cachedResources.thoughts.find(
        (t) => String(t.id) === String(sel.value),
      );
      if (!preset && window.db && window.db.thoughtChainPresets) {
        try {
          const allPresets = await window.db.thoughtChainPresets.toArray();
          this.cachedResources.thoughts = allPresets || [];
          preset = (allPresets || []).find(
            (t) => String(t.id) === String(sel.value),
          );
        } catch (_) {}
      }
      if (!preset) {
        this.notify("未找到该思维链预设");
        return;
      }

      g.thoughtChainId = String(sel.value);
      g.thoughtHeaderContent = String(preset.headerContent || "");
      g.thoughtGeneralContent = String(preset.generalContent || "");
      g.thoughtCocContent = String(preset.cocContent || "");

      const pGroups = Array.isArray(preset.groups) ? preset.groups : [];
      const pEntries = Array.isArray(preset.entries) ? preset.entries : [];

      if (pGroups.length > 0 || pEntries.length > 0) {
        g.thoughtGroups = pGroups.map((grp) => ({
          id: String(grp.id),
          name: grp.name || "未命名分类",
          color: grp.color || "",
          enabled: grp.enabled !== false,
          collapsed: false,
        }));
        g.thoughtItems = pEntries.map((ent, idx) => ({
          id: String(ent.id || "tc_ent_" + idx),
          key: ent.key || ent.title || "条目" + (idx + 1),
          title: ent.key || ent.title || "条目" + (idx + 1),
          groupId: ent.groupId ? String(ent.groupId) : "",
          content: String(ent.content || ""),
          enabled: ent.enabled !== false,
        }));
        this.renderThoughtItemsList();
        this.saveAllSettings(false);
        this.notify(
          `已载入「${preset.name || "思维链"}」共${g.thoughtItems.length}个条目`,
        );
        return;
      }

      const rawContent = String(
        preset.content ||
          preset.prompt ||
          preset.generalContent ||
          preset.headerContent ||
          "",
      ).trim();
      if (!rawContent) {
        this.notify("该预设暂无条目内容");
        return;
      }

      const lines = rawContent
        .split(/\r?\n+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 2);

      g.thoughtGroups = [];
      g.thoughtItems = lines.slice(0, 30).map((line, idx) => {
        const cleanLine = line.replace(/^\d+[\.\、\s]*/, "");
        return {
          id: "preset_" + Date.now() + "_" + idx,
          title: (preset.name || "条目") + " " + (idx + 1),
          key: (preset.name || "条目") + " " + (idx + 1),
          content: cleanLine,
          enabled: true,
        };
      });
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
      this.notify(`已载入思维链共${g.thoughtItems.length}个条目`);
    },

    resetDefaultThoughtItems() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      g.thoughtChainId = "";
      g.thoughtGroups = [];
      g.thoughtHeaderContent = "";
      g.thoughtGeneralContent = "";
      g.thoughtItems = getDefaultThoughtChainItems();
      const sel = document.getElementById("qqbot-thought-select");
      if (sel) sel.value = "";
      this.renderThoughtItemsList();
      this.saveAllSettings(false);
      this.notify("已重置默认思维链");
    },

    /* ============================================================================
     * 服务端与 Termux 静态网页双通道同步
     * ============================================================================ */
    async syncFromServer(populateInputs = false) {
      let synced = false;
      try {
        const res = await fetch("/api/qqbot/state");
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) {
            this.serverState = data;
            synced = true;
          }
        }
      } catch (_) {}

      if (!synced) {
        // 若部署在GitHub等纯静态网站上，尝试检测手机本地 Termux 8765 磁盘桥接服务
        try {
          const tRes = await fetch("http://127.0.0.1:8765/load", {
            signal: AbortSignal.timeout(1200),
          });
          if (tRes.ok) {
            this.termuxDiskAvailable = true;
            const parsed = await tRes.json();
            if (parsed && parsed.config) {
              this.serverState = {
                ok: true,
                runtime: {
                  connected: this.directWsConnected,
                  statusText: this.directWsConnected
                    ? "Termux直连已就绪"
                    : "Termux磁盘已连",
                  groupStats: {},
                },
                config: parsed.config,
              };
              synced = true;
            }
          }
        } catch (_) {}
      }

      if (!this.serverState || !this.serverState.config) {
        const defaultGid = "88482026";
        this.serverState = {
          ok: true,
          runtime: {
            connected: this.directWsConnected,
            statusText: this.directWsConnected ? "浏览器直连中" : "本地待命",
            groupStats: {},
          },
          config: {
            onebotUrl: "ws://127.0.0.1:3001",
            selfId: "",
            accessToken: "",
            mainApi: { url: "", apiKey: "", model: "" },
            subApi: { url: "", apiKey: "", model: "" },
            groups: {
              [defaultGid]: this.createDefaultGroupConfig(
                defaultGid,
                "八月二十二日跑团群",
              ),
            },
          },
        };
      }

      const data = this.serverState;
      const badge = document.getElementById("qqbot-conn-badge");
      if (badge && data.runtime) {
        badge.textContent = this.directWsConnected
          ? "Termux直连在线"
          : data.runtime.statusText || "本地待命";
      }

      const selfBadge = document.getElementById("qqbot-self-badge");
      if (selfBadge && data.runtime && data.runtime.selfId) {
        selfBadge.textContent = `在线QQ ${data.runtime.selfId}`;
      }

      if (populateInputs && data.config) {
        const epInput = document.getElementById("qqbot-endpoint-input");
        const selfInput = document.getElementById("qqbot-selfid-input");
        const tkInput = document.getElementById("qqbot-token-input");
        if (epInput && data.config.onebotUrl) {
          epInput.value = data.config.onebotUrl;
        }
        if (selfInput && data.config.selfId) {
          selfInput.value = data.config.selfId;
        }
        if (tkInput && data.config.accessToken !== undefined) {
          tkInput.value = data.config.accessToken;
        }
        this.populateApiConfigUI();
      }

      const groupsObj = (data.config && data.config.groups) || {};
      const groupIds = Object.keys(groupsObj);
      if (groupIds.length === 0) {
        const defaultGid = "88482026";
        groupsObj[defaultGid] = this.createDefaultGroupConfig(
          defaultGid,
          "八月二十二日跑团群",
        );
      }

      if (!this.currentGroupId || !groupsObj[this.currentGroupId]) {
        this.currentGroupId = Object.keys(groupsObj)[0];
      }

      if (populateInputs) {
        this.renderGroupSelectDropdown();
        this.populateCurrentGroupUI();
        await this.loadCurrentGroupMemoryUI();
      }
    },

    createDefaultGroupConfig(groupId, groupName) {
      return {
        groupId: String(groupId),
        groupName: groupName || "QQ群 " + groupId,
        enabled: true,
        mode: "trpg",
        debounceSec: 8,
        contextLimit: 180,
        idleAskMin: 15,
        cooldownSec: 5,
        autoNaiImage: true,
        modImgMode: "auto",
        personaId: "",
        aiPersona:
          "你是一位经验丰富、沉稳自然的真人跑团守秘人KP兼群友。说话自然流畅，绝不说教，遇到单人向NPC搭话或独立行动时直接回应对应玩家，遇到全员关键节点时引导大家自然互动。",
        customPrompt:
          "单条消息保持自然分段气泡感，不要长篇大论刷屏；严格区分公开表象与私聊秘密线索。",
        thoughtChainId: "",
        thoughtItems: getDefaultThoughtChainItems(),
        worldBookId: "",
        stickerCategoryId: "ALL",
        moduleId: "",
        chapterId: "ALL",
        memberRemarks: {
          "10001": "早川秋",
          "10002": "佐藤葵",
        },
        playerBindings: [
          {
            qq: "10001",
            alias: "",
            qqRemark: "早川秋",
            slot: "HO1",
            cardId: "",
            cardName: "早川秋",
            persona:
              "冷静敏锐的刑侦调查员，擅长观察环境细节与审讯推理，性格外冷内热。",
          },
          {
            qq: "10002",
            alias: "",
            qqRemark: "佐藤葵",
            slot: "HO2",
            cardId: "",
            cardName: "佐藤葵",
            persona:
              "温和细心的民俗学研究生，擅长交涉、聆听与古籍查阅，说话礼貌温和。",
          },
        ],
      };
    },

    getCurrentGroupConfig() {
      if (
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.groups
      ) {
        return null;
      }
      if (!this.currentGroupId) return null;
      return this.serverState.config.groups[this.currentGroupId] || null;
    },

    renderGroupSelectDropdown() {
      const sel = document.getElementById("qqbot-group-select");
      const dl = document.getElementById("qqbot-group-datalist");
      if (!sel || !this.serverState || !this.serverState.config) return;
      const groups = this.serverState.config.groups || {};
      const entries = Object.values(groups);
      sel.innerHTML = entries
        .map((g) => {
          const stateMark = g.enabled ? "监听中" : "已停用";
          return `<option value="${this.escapeAttr(g.groupId)}">${this.escapeHtml(g.groupName || g.groupId)} · ${g.groupId} · ${stateMark}</option>`;
        })
        .join("");
      if (this.currentGroupId && groups[this.currentGroupId]) {
        sel.value = this.currentGroupId;
      }
      if (dl) {
        dl.innerHTML = entries
          .map(
            (g) =>
              `<option value="${this.escapeAttr(g.groupId)}">${this.escapeHtml(g.groupName || "")}</option>`,
          )
          .join("");
      }
    },

    populateCurrentGroupUI() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = String(val);
      };

      const dashGroup = document.getElementById("qqbot-dash-group-name");
      if (dashGroup) dashGroup.textContent = g.groupName || g.groupId;

      setVal("qqbot-group-enabled-select", g.enabled ? "true" : "false");
      setVal("qqbot-group-mode-select", g.mode || "trpg");
      setVal("qqbot-debounce-input", g.debounceSec ?? 8);
      setVal("qqbot-context-limit-input", g.contextLimit ?? 180);
      setVal("qqbot-idle-ask-input", g.idleAskMin ?? 15);
      setVal("qqbot-cooldown-input", g.cooldownSec ?? 5);
      setVal("qqbot-ai-persona-input", g.aiPersona || g.customPersona || "");
      setVal("qqbot-custom-prompt-input", g.customPrompt || "");
      setVal(
        "qqbot-nai-mode",
        g.autoNaiImage === false ? "off" : "trpg_every_round",
      );
      setVal("qqbot-modimg-mode", g.modImgMode || "auto");

      this.renderResourceSelects();
      this.renderWorldBookItemsList();
      this.renderThoughtItemsList();
      this.renderModuleChaptersList();
      this.renderPlayerBindingsList();
      this.renderSimSenderSelect();
    },

    renderSimSenderSelect() {
      const g = this.getCurrentGroupConfig();
      const sel = document.getElementById("qqbot-sim-sender");
      if (!sel || !g) return;
      const bindings = Array.isArray(g.playerBindings) ? g.playerBindings : [];
      const memberOptions = bindings.map((b) => {
        const name = this.resolveMemberDisplayName(g, b.qq, b.qqRemark);
        return `<option value="${this.escapeAttr(b.qq + "|" + name)}">${this.escapeHtml(name)}</option>`;
      });
      if (memberOptions.length === 0) {
        memberOptions.push('<option value="10001|早川秋">早川秋</option>');
        memberOptions.push('<option value="10002|佐藤葵">佐藤葵</option>');
      }
      memberOptions.push('<option value="BOT|主动发群">直接发群</option>');
      sel.innerHTML = memberOptions.join("");
    },

    onCurrentGroupFieldChange() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;

      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
      };

      g.enabled = getVal("qqbot-group-enabled-select", "true") === "true";
      g.mode = getVal("qqbot-group-mode-select", "trpg");
      g.debounceSec = Math.max(
        2,
        parseInt(getVal("qqbot-debounce-input", "8"), 10) || 8,
      );
      g.contextLimit = Math.max(
        20,
        parseInt(getVal("qqbot-context-limit-input", "180"), 10) || 180,
      );
      g.idleAskMin = Math.max(
        0,
        parseInt(getVal("qqbot-idle-ask-input", "15"), 10) || 0,
      );
      g.cooldownSec = Math.max(
        1,
        parseInt(getVal("qqbot-cooldown-input", "5"), 10) || 5,
      );
      g.personaId = getVal("qqbot-persona-select", "");
      g.aiPersona = getVal("qqbot-ai-persona-input", "");
      g.customPrompt = getVal("qqbot-custom-prompt-input", "");
      g.worldBookId = getVal("qqbot-worldbook-select", "");
      g.stickerCategoryId = getVal("qqbot-sticker-select", "ALL");
      g.moduleId = getVal("qqbot-module-select", "");
      g.chapterId = getVal("qqbot-chapter-select", "ALL");
      g.autoNaiImage =
        getVal("qqbot-nai-mode", "trpg_every_round") === "trpg_every_round";
      g.modImgMode = getVal("qqbot-modimg-mode", "auto");

      this.renderGroupSelectDropdown();
      this.saveAllSettings(false);
    },

    async onGroupSelectChange() {
      const sel = document.getElementById("qqbot-group-select");
      if (!sel) return;
      this.currentGroupId = sel.value;
      this.populateCurrentGroupUI();
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
    },

    async addOrSelectGroup() {
      const idInput = document.getElementById("qqbot-new-group-id");
      const nameInput = document.getElementById("qqbot-new-group-name");
      const rawId = idInput ? idInput.value.trim() : "";
      const rawName = nameInput ? nameInput.value.trim() : "";
      if (!rawId) {
        this.notify("请先输入QQ群号");
        return;
      }
      if (!this.serverState) {
        await this.syncFromServer(true);
      }
      if (!this.serverState.config.groups) {
        this.serverState.config.groups = {};
      }
      if (!this.serverState.config.groups[rawId]) {
        this.serverState.config.groups[rawId] = this.createDefaultGroupConfig(
          rawId,
          rawName || "QQ群 " + rawId,
        );
      } else if (rawName) {
        this.serverState.config.groups[rawId].groupName = rawName;
      }
      this.currentGroupId = rawId;
      if (idInput) idInput.value = "";
      if (nameInput) nameInput.value = "";
      this.renderGroupSelectDropdown();
      this.populateCurrentGroupUI();
      await this.saveAllSettings(true);
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
    },

    /* ============================================================================
     * 群成员备注名与每个人专属人设管理
     * ============================================================================ */
    addPlayerBinding() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const qqInput = document.getElementById("qqbot-bind-qq-input");
      const aliasInput = document.getElementById("qqbot-bind-alias-input");
      const hoSelect = document.getElementById("qqbot-bind-ho-select");
      const cardSelect = document.getElementById("qqbot-bind-card-select");
      const personaInput = document.getElementById("qqbot-bind-persona-input");

      const qq = qqInput ? qqInput.value.trim() : "";
      const alias = aliasInput ? aliasInput.value.trim() : "";
      const ho = hoSelect ? hoSelect.value : "群友";
      const cardId = cardSelect ? cardSelect.value : "";
      const persona = personaInput ? personaInput.value.trim() : "";

      if (!qq) {
        this.notify("请输入群成员QQ号");
        return;
      }

      const cardObj = this.cachedResources.charCards.find(
        (c) => String(c.id) === String(cardId),
      );
      if (!Array.isArray(g.playerBindings)) g.playerBindings = [];
      if (!g.memberRemarks) g.memberRemarks = {};

      const existingIdx = g.playerBindings.findIndex(
        (b) => String(b.qq) === String(qq),
      );
      const prevRemark =
        (existingIdx >= 0 && g.playerBindings[existingIdx].qqRemark) ||
        g.memberRemarks[qq] ||
        "";

      const item = {
        qq,
        alias,
        qqRemark: prevRemark,
        slot: ho,
        cardId: cardId || "",
        cardName: cardObj
          ? cardObj.name
          : alias || prevRemark || "未绑角色卡",
        persona: persona || (cardObj && cardObj.persona ? cardObj.persona : ""),
      };

      if (existingIdx >= 0) {
        g.playerBindings[existingIdx] = item;
      } else {
        g.playerBindings.push(item);
      }

      if (qqInput) qqInput.value = "";
      if (aliasInput) aliasInput.value = "";
      if (personaInput) personaInput.value = "";
      this.renderPlayerBindingsList();
      this.renderSimSenderSelect();
      this.saveAllSettings(true);
    },

    editPlayerBinding(qq) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.playerBindings)) return;
      const found = g.playerBindings.find((b) => String(b.qq) === String(qq));
      if (!found) return;

      const qqInput = document.getElementById("qqbot-bind-qq-input");
      const aliasInput = document.getElementById("qqbot-bind-alias-input");
      const hoSelect = document.getElementById("qqbot-bind-ho-select");
      const cardSelect = document.getElementById("qqbot-bind-card-select");
      const personaInput = document.getElementById("qqbot-bind-persona-input");

      if (qqInput) qqInput.value = found.qq || "";
      if (aliasInput) aliasInput.value = found.alias || "";
      if (hoSelect && found.slot) hoSelect.value = found.slot;
      if (cardSelect) cardSelect.value = found.cardId || "";
      if (personaInput) personaInput.value = found.persona || "";
      this.notify("已载入成员信息可修改");
    },

    removePlayerBinding(qq) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.playerBindings)) return;
      g.playerBindings = g.playerBindings.filter(
        (b) => String(b.qq) !== String(qq),
      );
      this.renderPlayerBindingsList();
      this.renderSimSenderSelect();
      this.saveAllSettings(false);
    },

    renderPlayerBindingsList() {
      const container = document.getElementById("qqbot-player-bindings-list");
      const countBadge = document.getElementById("qqbot-dash-member-count");
      const qqDl = document.getElementById("qqbot-player-qq-datalist");
      const g = this.getCurrentGroupConfig();
      if (!container) return;
      const list = (g && g.playerBindings) || [];

      if (countBadge) {
        countBadge.textContent = `已配置 ${list.length} 人`;
      }
      if (qqDl && list.length > 0) {
        qqDl.innerHTML = list
          .map((b) => {
            const disp = this.resolveMemberDisplayName(g, b.qq, b.qqRemark);
            return `<option value="${this.escapeAttr(b.qq)}">${this.escapeHtml(disp)}</option>`;
          })
          .join("");
      }

      if (list.length === 0) {
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 2px;">暂未添加群成员人设，可点击下方同步按钮自动拉取群成员与QQ备注，或手动填写每个人的专属人设</div>';
        return;
      }

      container.innerHTML = list
        .map((b) => {
          const realName = this.resolveMemberDisplayName(g, b.qq, b.qqRemark);
          const sourceLabel = b.alias
            ? "自定义备注"
            : b.qqRemark
              ? "QQ备注识别"
              : "QQ号直显";
          const personaPreview = b.persona
            ? b.persona
            : "暂未填写专属人设，点击右侧编辑可为该群友写人设";
          return `
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 8px; background: var(--secondary-bg); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 46px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: var(--card-bg); border: 1px solid var(--border-color); font-size: 11px; font-weight: 700; color: var(--accent-color); flex-shrink: 0;">${this.escapeHtml(b.slot || "群友")}</span>
            <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--text-primary);">
              <span style="font-weight: 700;">${this.escapeHtml(realName)}</span>
              <span style="font-size: 10.5px; color: var(--accent-color); margin-left: 6px;">${this.escapeHtml(sourceLabel)}</span>
              <span style="font-size: 10.5px; color: var(--text-secondary); margin-left: 6px;">账号:${this.escapeHtml(b.qq)}</span>
            </div>
            <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.editPlayerBinding('${this.escapeAttr(b.qq)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">编辑</button>
            <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.removePlayerBinding('${this.escapeAttr(b.qq)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">移除</button>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            人设：${this.escapeHtml(personaPreview)}
          </div>
        </div>
      `;
        })
        .join("");
    },

    async syncGroupMembersFromQQ() {
      if (!this.currentGroupId) return;
      const syncBtn = document.getElementById("qqbot-sync-btn");
      if (syncBtn) syncBtn.textContent = "同步中";
      this.notify("正在同步QQ群成员与备注名...");
      this.updateConnDetail(
        "正在向手机Termux请求当前群的成员名册与你在QQ上修改的好友备注...",
        true,
      );
      const g = this.getCurrentGroupConfig();

      try {
        // 1. 如果浏览器直连了手机本机 Termux OneBot WS，直接拉取好友备注与群名片
        if (this.directWsConnected && this.directWs) {
          try {
            const [friends, members] = await Promise.all([
              this.callDirectOneBotWs("get_friend_list", {}).catch(() => []),
              this.callDirectOneBotWs("get_group_member_list", {
                group_id:
                  Number(this.currentGroupId) || String(this.currentGroupId),
              }).catch(() => []),
            ]);
            const friendMap = {};
            if (Array.isArray(friends)) {
              friends.forEach((f) => {
                if (f && f.user_id && f.remark) {
                  friendMap[String(f.user_id)] = String(f.remark).trim();
                }
              });
            }
            if (g && Array.isArray(members) && members.length > 0) {
              if (!g.memberRemarks) g.memberRemarks = {};
              if (!Array.isArray(g.playerBindings)) g.playerBindings = [];
              members.forEach((m) => {
                const uid = String(m.user_id || "");
                if (!uid) return;
                const best = String(
                  friendMap[uid] || m.remark || m.card || m.nickname || uid,
                ).trim();
                g.memberRemarks[uid] = best;
                const ex = g.playerBindings.find((b) => String(b.qq) === uid);
                if (ex) {
                  ex.qqRemark = best;
                } else {
                  g.playerBindings.push({
                    qq: uid,
                    alias: "",
                    qqRemark: best,
                    slot: "群友",
                    cardId: "",
                    cardName: "未绑角色卡",
                    persona: "",
                  });
                }
              });
              this.renderPlayerBindingsList();
              this.renderSimSenderSelect();
              await this.saveAllSettings(false);
              this.notify(`已同步${members.length}位群成员备注`);
              this.updateConnDetail(
                `已成功从QQ拉取本群 ${members.length} 位成员的实时好友备注与群名片`,
                true,
              );
              return;
            }
          } catch (_) {}
        }

        // 2. 通过后端接口同步群成员与QQ备注
        try {
          const res = await fetch(
            `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/sync-members`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (
              data &&
              data.group &&
              this.serverState &&
              this.serverState.config
            ) {
              this.serverState.config.groups[this.currentGroupId] = data.group;
              this.renderPlayerBindingsList();
              this.renderSimSenderSelect();
              if (data.syncedFromOneBot) {
                this.notify("已同步QQ群备注名");
                this.updateConnDetail(
                  "已从OneBot成功同步本群成员与QQ好友备注名",
                  true,
                );
              } else {
                this.notify("当前未连接QQ，已刷新本地成员名册");
                this.updateConnDetail(
                  "当前尚未连上Termux 3001端口，已刷新本地预设群友名册；请先填好6099后台的Token密钥并点连接",
                  false,
                );
              }
              return;
            }
          }
        } catch (_) {}

        this.renderPlayerBindingsList();
        this.renderSimSenderSelect();
        this.notify("已刷新当前群成员名册");
        this.updateConnDetail(
          "已刷新本地群友名册；如需从真实QQ拉取群名片，请先确认上方连接状态为已连接",
          false,
        );
      } finally {
        if (syncBtn) syncBtn.textContent = "同步";
      }
    },

    async saveAllSettings(showToast = false) {
      if (!this.serverState || !this.serverState.config) return;
      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const rawUrl = epInput ? epInput.value.trim() : "";
      let mode = "reverse_ws";
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        mode = "http";
      } else if (rawUrl.startsWith("ws://") || rawUrl.startsWith("wss://")) {
        if (!rawUrl.includes("/api/qqbot/ws")) {
          mode = "forward_ws";
        }
      }

      const payload = {
        connectionMode: mode,
        onebotUrl: rawUrl || "ws://127.0.0.1:3001",
        selfId: selfInput ? selfInput.value.trim() : "",
        accessToken: tkInput ? tkInput.value.trim() : "",
        mainApi: {
          url: getVal("qqbot-main-api-url"),
          apiKey: getVal("qqbot-main-api-key"),
          model: getVal("qqbot-main-api-model"),
        },
        subApi: {
          url: getVal("qqbot-sub-api-url"),
          apiKey: getVal("qqbot-sub-api-key"),
          model: getVal("qqbot-sub-api-model"),
        },
        groups: this.serverState.config.groups || {},
      };

      this.serverState.config = {
        ...this.serverState.config,
        ...payload,
      };

      let savedBackend = false;
      try {
        const res = await fetch("/api/qqbot/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            this.serverState.config = data.config;
            savedBackend = true;
          }
        }
      } catch (_) {}

      // 同时同步到手机 Termux 8765 磁盘减负服务
      if (!savedBackend || this.termuxDiskAvailable) {
        try {
          await fetch("http://127.0.0.1:8765/save", {
            method: "POST",
            body: JSON.stringify({
              config: this.serverState.config,
              memory: this.staticFallbackMemory,
              logs: this.staticFallbackLogs,
            }),
            signal: AbortSignal.timeout(1500),
          });
          this.termuxDiskAvailable = true;
          savedBackend = true;
        } catch (_) {}
      }

      if (showToast) {
        this.notify(savedBackend ? "设置已存本地磁盘" : "设置已保存生效");
      }
    },

    /* ============================================================================
     * 浏览器直连本机 Termux OneBot WebSocket 引擎 · 兼容 GitHub 静态网站
     * ============================================================================ */
    trySingleBrowserWs(wsUrl, token) {
      return new Promise((resolve) => {
        try {
          let finalUrl = wsUrl;
          if (token) {
            const sep = wsUrl.includes("?") ? "&" : "?";
            finalUrl = `${wsUrl}${sep}access_token=${encodeURIComponent(token)}&token=${encodeURIComponent(token)}`;
          }
          const ws = new WebSocket(finalUrl);
          let settled = false;

          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              try {
                ws.close();
              } catch (_) {}
              resolve(null);
            }
          }, 2200);

          ws.onopen = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(ws);
            }
          };

          ws.onclose = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(null);
            }
          };

          ws.onerror = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(null);
            }
          };
        } catch (err) {
          resolve(null);
        }
      });
    },

    async connectBrowserDirectWs(wsUrl, token) {
      if (this.directWs) {
        try {
          this.directWs.close();
        } catch (_) {}
        this.directWs = null;
        this.directWsConnected = false;
      }

      const candidates = [wsUrl];
      if (wsUrl.includes("127.0.0.1")) {
        candidates.push(wsUrl.replace("127.0.0.1", "localhost"));
      } else if (wsUrl.includes("localhost")) {
        candidates.push(wsUrl.replace("localhost", "127.0.0.1"));
      }

      let connectedWs = null;
      for (const candidateUrl of candidates) {
        connectedWs = await this.trySingleBrowserWs(candidateUrl, token);
        if (connectedWs) break;
      }

      if (!connectedWs) {
        return false;
      }

      this.directWs = connectedWs;
      this.directWsConnected = true;

      connectedWs.onmessage = (evt) => {
        try {
          const data = JSON.parse(String(evt.data || ""));
          this.handleDirectWsEvent(data);
        } catch (_) {}
      };

      connectedWs.onclose = () => {
        if (this.directWs === connectedWs) {
          this.directWsConnected = false;
          this.directWs = null;
          const selfBadge = document.getElementById("qqbot-self-badge");
          if (selfBadge) selfBadge.textContent = "连接已断开";
          this.updateConnDetail(
            "与Termux 3001的连接已断开，请确认Termux与6099后台里的Token是否一致",
            false,
          );
        }
      };

      this.notify("手机Termux直连成功");
      const selfBadge = document.getElementById("qqbot-self-badge");
      if (selfBadge) selfBadge.textContent = "Termux已连接";
      this.updateConnDetail(
        "已成功连通手机Termux NapCat 3001端口，正在读取登录QQ信息与群列表...",
        true,
      );

      try {
        const info = await this.callDirectOneBotWs("get_login_info", {});
        if (info && info.user_id) {
          const selfInput = document.getElementById("qqbot-selfid-input");
          if (selfInput) selfInput.value = String(info.user_id);
          if (selfBadge) {
            selfBadge.textContent = `${info.nickname || "在线"} ${info.user_id}`;
          }
          if (this.serverState && this.serverState.config) {
            this.serverState.config.selfId = String(info.user_id);
          }
          this.updateConnDetail(
            `已成功连接 Termux NapCat · 登录QQ：${info.nickname || ""} ${info.user_id} · 实时监听已启动`,
            true,
          );
        }
      } catch (_) {}

      return true;
    },

    callDirectOneBotWs(action, params = {}) {
      if (!this.directWs || this.directWs.readyState !== 1) {
        return Promise.reject(new Error("未连接直连WS"));
      }
      const echo =
        "d_echo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.directPendingEchoes.delete(echo);
          reject(new Error("OneBot响应超时"));
        }, 8000);
        this.directPendingEchoes.set(echo, { resolve, reject, timer });
        this.directWs.send(JSON.stringify({ action, params, echo }));
      });
    },

    async handleDirectWsEvent(data) {
      if (!data || typeof data !== "object") return;
      if (data.echo && this.directPendingEchoes.has(data.echo)) {
        const p = this.directPendingEchoes.get(data.echo);
        clearTimeout(p.timer);
        this.directPendingEchoes.delete(data.echo);
        p.resolve(data.data !== undefined ? data.data : data);
        return;
      }

      if (data.post_type === "message" && data.message_type === "group") {
        const gid = String(data.group_id || "");
        if (!gid) return;
        const senderId = String(
          data.user_id || (data.sender && data.sender.user_id) || "",
        );
        const selfId =
          (this.serverState &&
            this.serverState.config &&
            this.serverState.config.selfId) ||
          "";
        if (selfId && senderId === String(selfId)) return;

        const rawRemark = String(
          (data.sender &&
            (data.sender.remark || data.sender.card || data.sender.nickname)) ||
            senderId,
        ).trim();
        const rawText = String(data.raw_message || data.message || "").trim();
        if (!rawText) return;

        // 转发给本地后端或直接触发群回合
        try {
          const simRes = await fetch("/api/qqbot/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (simRes.ok) return;
        } catch (_) {}

        // 若处于纯静态网页环境，直接走本地流转与Termux磁盘保存
        if (!this.serverState.config.groups[gid]) {
          this.serverState.config.groups[gid] = this.createDefaultGroupConfig(
            gid,
            data.group_name || "QQ群 " + gid,
          );
        }
        const gCfg = this.serverState.config.groups[gid];
        const dispName = this.resolveMemberDisplayName(
          gCfg,
          senderId,
          rawRemark,
        );
        this.appendStaticMessage(gid, {
          messageId: String(data.message_id || Date.now()),
          groupId: gid,
          senderId,
          senderName: dispName,
          qqRemark: rawRemark,
          rawMessage: rawText,
          content: rawText,
          isSelf: false,
          timestamp: Date.now(),
        });
        await this.refreshSandboxLog();
        if (gCfg.enabled) {
          const list = this.staticFallbackLogs[gid] || [];
          await this.processGroupTurn(gid, gCfg, list.length, false);
        }
      }
    },

    appendStaticMessage(gid, msgObj) {
      if (!this.staticFallbackLogs[gid]) this.staticFallbackLogs[gid] = [];
      const arr = this.staticFallbackLogs[gid];
      msgObj.seq = arr.length + 1;
      arr.push(msgObj);
      // 严控网页端缓存条数，超过 60 条立即裁剪并转存 Termux 磁盘，绝不占用浏览器内存
      if (arr.length > 60) {
        this.staticFallbackLogs[gid] = arr.slice(-60);
      }
      if (this.termuxDiskAvailable) {
        fetch("http://127.0.0.1:8765/save", {
          method: "POST",
          body: JSON.stringify({
            config: this.serverState && this.serverState.config,
            memory: this.staticFallbackMemory,
            logs: this.staticFallbackLogs,
          }),
        }).catch(() => {});
      }
    },

    async connectOneBot() {
      const connBtn = document.getElementById("qqbot-connect-btn");
      if (connBtn) connBtn.textContent = "连接中";
      await this.saveAllSettings(false);
      const epInput = document.getElementById("qqbot-endpoint-input");
      const tkInput = document.getElementById("qqbot-token-input");
      const rawUrl = epInput ? epInput.value.trim() : "ws://127.0.0.1:3001";
      const token = tkInput ? tkInput.value.trim() : "";

      this.notify(`正在连接 ${rawUrl} ...`);
      this.updateConnDetail(`正在尝试连接 ${rawUrl} ...`, true);

      try {
        // 1. 若是正向 ws:// 地址，优先尝试浏览器直接连接本机 Termux OneBot
        if (
          (rawUrl.startsWith("ws://") || rawUrl.startsWith("wss://")) &&
          !rawUrl.includes("/api/qqbot/ws")
        ) {
          const directOk = await this.connectBrowserDirectWs(rawUrl, token);
          if (directOk) {
            await this.refreshOneBotGroups(true);
            await this.syncGroupMembersFromQQ();
            return;
          }
        }

        // 2. 尝试通过本地后端连接
        let backendConnected = false;
        try {
          let mode = "reverse_ws";
          if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            mode = "http";
          } else if (
            (rawUrl.startsWith("ws://") || rawUrl.startsWith("wss://")) &&
            !rawUrl.includes("/api/qqbot/ws")
          ) {
            mode = "forward_ws";
          }

          const res = await fetch("/api/qqbot/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectionMode: mode,
              onebotUrl: rawUrl,
              accessToken: token,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.runtime && data.runtime.connected) {
              backendConnected = true;
              this.notify(data.runtime.statusText || "已连接OneBot");
              const selfInput = document.getElementById("qqbot-selfid-input");
              if (selfInput && data.runtime.selfId) {
                selfInput.value = data.runtime.selfId;
              }
              const selfBadge = document.getElementById("qqbot-self-badge");
              if (selfBadge) {
                selfBadge.textContent = data.runtime.selfId
                  ? `在线QQ ${data.runtime.selfId}`
                  : "已连接";
              }
              this.updateConnDetail(
                `已通过服务端连通 ${rawUrl} · 状态：${data.runtime.statusText || "在线"}`,
                true,
              );
              await this.refreshOneBotGroups(true);
              return;
            }
          }
        } catch (_) {}

        if (!backendConnected) {
          const selfBadge = document.getElementById("qqbot-self-badge");
          if (selfBadge) selfBadge.textContent = "未连上3001";
          const isHttps = window.location.protocol === "https:";
          const tokenHint = !token
            ? "你在 6099 网页后台新建 3001 端口时，系统默认自动生成了一串 Token 密钥，请把 6099 后台里的 Token 复制填进上方「密钥」框，或者去 6099 后台把 Token 删空并点保存！"
            : "请核对上方「密钥」框里的 Token 是否与 6099 网页后台里的一模一样。";
          const httpsHint = isHttps
            ? "另外当前网页为 https 加密网址，若手机浏览器拦截了本地 ws 连接，请点浏览器地址栏左侧图标打开「网站设置」，将「不安全内容」设为允许。"
            : "";
          const fullMsg = `未能连上 ${rawUrl}：1. ${tokenHint} 2. 确认 6099 后台新建的是「WebSocket服务端」且已打开启用开关。${httpsHint}`;
          this.notify("未能连上3001请看下方提示");
          this.updateConnDetail(fullMsg, false);
        }
      } finally {
        if (connBtn) connBtn.textContent = "连接";
      }
    },

    async refreshOneBotGroups(silent = false) {
      const refBtn = document.getElementById("qqbot-refresh-btn");
      if (!silent && refBtn) refBtn.textContent = "刷新中";
      if (!silent) {
        this.notify("正在拉取QQ群列表...");
        this.updateConnDetail("正在从已连接的QQ号拉取群聊列表...", true);
      }
      try {
        if (this.directWsConnected && this.directWs) {
          try {
            const list = await this.callDirectOneBotWs("get_group_list", {});
            if (Array.isArray(list) && list.length > 0) {
              list.forEach((g) => {
                const gid = String(g.group_id || "");
                if (!gid) return;
                if (!this.serverState.config.groups[gid]) {
                  this.serverState.config.groups[gid] =
                    this.createDefaultGroupConfig(gid, g.group_name);
                } else if (g.group_name) {
                  this.serverState.config.groups[gid].groupName = g.group_name;
                }
              });
              this.renderGroupSelectDropdown();
              await this.saveAllSettings(false);
              if (!silent) {
                this.notify(`已同步${list.length}个QQ群`);
                this.updateConnDetail(
                  `已成功拉取到 ${list.length} 个QQ群，可在下方分群管理下拉框中切换`,
                  true,
                );
              }
              return;
            }
          } catch (_) {}
        }

        const res = await fetch("/api/qqbot/refresh-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        const groupList = Array.isArray(data && data.groups)
          ? data.groups
          : data && data.groups && typeof data.groups === "object"
            ? Object.values(data.groups)
            : [];
        if (groupList.length > 0) {
          if (!this.serverState.config.groups) {
            this.serverState.config.groups = {};
          }
          groupList.forEach((dg) => {
            const gid = String(dg.groupId || dg.group_id || "");
            const gname = dg.groupName || dg.group_name || "QQ群 " + gid;
            if (!gid) return;
            if (!this.serverState.config.groups[gid]) {
              this.serverState.config.groups[gid] =
                this.createDefaultGroupConfig(gid, gname);
            } else if (gname) {
              this.serverState.config.groups[gid].groupName = gname;
            }
          });
          this.renderGroupSelectDropdown();
          await this.saveAllSettings(false);
          if (!silent) {
            const count = Object.keys(this.serverState.config.groups).length;
            this.notify(
              data.refreshedFromOneBot
                ? `已从QQ拉取${count}个群`
                : `已刷新本地${count}个群`,
            );
            this.updateConnDetail(
              data.refreshedFromOneBot
                ? `已从OneBot同步 ${count} 个QQ群`
                : `当前尚未连上3001端口，已刷新本地 ${count} 个配置群；也可在分群管理里手动输入QQ群号点添加`,
              Boolean(data.refreshedFromOneBot),
            );
          }
        } else if (!silent) {
          this.notify("请先连上3001或手动添加群号");
          this.updateConnDetail(
            "未检测到在线OneBot连接，请先核对密钥并点连接，或在下方分群管理直接输入QQ群号点添加",
            false,
          );
        }
      } catch (e) {
        if (!silent) {
          this.notify("已刷新本地群列表");
        }
      } finally {
        if (!silent && refBtn) refBtn.textContent = "刷新";
      }
    },

    async loadCurrentGroupMemoryUI() {
      if (!this.currentGroupId) return;
      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/context?limit=30`,
        );
        if (res.ok) {
          const data = await res.json();
          const memBox = document.getElementById("qqbot-memory-textarea");
          const badge = document.getElementById("qqbot-disk-status-badge");
          if (memBox && data.memory) {
            memBox.value = data.memory.summaryText || data.memory.ledger || "";
          }
          if (badge) {
            badge.textContent = `本地已存 ${data.totalStored || data.totalMessages || 0} 条`;
          }
          return;
        }
      } catch (_) {}

      const memBox = document.getElementById("qqbot-memory-textarea");
      if (memBox) {
        memBox.value =
          this.staticFallbackMemory[this.currentGroupId] ||
          "一、已发生关键事件与时间线：暂无归档\n二、当前所处场景与持有线索道具：初始阶段\n三、人物关系态度与待回收伏笔：正常";
      }
    },

    async saveManualMemory() {
      if (!this.currentGroupId) return;
      const memBox = document.getElementById("qqbot-memory-textarea");
      const summaryText = memBox ? memBox.value.trim() : "";
      this.staticFallbackMemory[this.currentGroupId] = summaryText;
      try {
        await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/memory`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summaryText }),
          },
        );
        const badge = document.getElementById("qqbot-disk-status-badge");
        if (badge) badge.textContent = "本地账本已保存";
      } catch (_) {}
    },

    async clearCurrentGroupDisk() {
      if (!this.currentGroupId) return;
      this.staticFallbackLogs[this.currentGroupId] = [];
      try {
        await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/clear`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (_) {}
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
      const badge = document.getElementById("qqbot-disk-status-badge");
      if (badge) badge.textContent = "本地已存 0 条";
    },

    /* ============================================================================
     * 事件驱动唤醒与挂机盯梢循环 - 无新消息零API消耗
     * ============================================================================ */
    startBackgroundWatcher() {
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => {
        this.tickGroupWatchers();
      }, 2500);
    },

    async tickGroupWatchers() {
      try {
        const res = await fetch("/api/qqbot/state");
        if (!res.ok) return;
        const stateData = await res.json();
        if (!stateData || !stateData.ok) return;

        // 保留前端尚未提交的正在编辑字段，仅更新 runtime 与 groupStats
        this.serverState.runtime = stateData.runtime;
        this.serverState.groupStats = stateData.groupStats;

        const badge = document.getElementById("qqbot-conn-badge");
        if (badge && stateData.runtime && badge.textContent === "本地待命") {
          badge.textContent = this.directWsConnected
            ? "Termux直连在线"
            : stateData.runtime.statusText || "本地待命";
        }

        const groups =
          (this.serverState.config && this.serverState.config.groups) || {};
        const groupStats =
          (stateData.runtime && stateData.runtime.groupStats) ||
          stateData.groupStats ||
          {};
        const now = Date.now();

        for (const gid of Object.keys(groups)) {
          const gCfg = groups[gid];
          if (!gCfg || !gCfg.enabled) continue;
          if (this.busyGroups[gid]) continue;

          const st = groupStats[gid];
          if (!st) continue;

          if (!this.localWaitNormalized[gid]) {
            this.localWaitNormalized[gid] = {
              lastSeenSeq: st.lastProcessedSeq || 0,
              waitingSince: st.waitingForRpSince || 0,
              idleAsked: Boolean(st.idleAsked),
              lastReplyAt: 0,
            };
          }
          const lw = this.localWaitNormalized[gid];

          // 1. 有未处理的新群消息，且已经过防抖缓冲秒数
          if (
            st.lastMessageSeq >
            Math.max(st.lastProcessedSeq || 0, lw.lastSeenSeq)
          ) {
            const debounceMs =
              Math.max(2, Number(gCfg.debounceSec) || 8) * 1000;
            const cooldownMs =
              Math.max(1, Number(gCfg.cooldownSec) || 5) * 1000;
            if (
              now - (st.lastMessageAt || 0) >= debounceMs &&
              now - lw.lastReplyAt >= cooldownMs
            ) {
              lw.lastSeenSeq = st.lastMessageSeq;
              await this.processGroupTurn(gid, gCfg, st.lastMessageSeq, false);
            }
            continue;
          }

          // 2. 挂机超时询问：AI发完消息后等待玩家RP，若超过设定分钟数无人说话，且本轮尚未询问过
          const idleMin = Number(gCfg.idleAskMin) || 0;
          const waitStart = st.waitingForRpSince || lw.waitingSince || 0;
          const alreadyAsked = Boolean(st.idleAsked || lw.idleAsked);
          if (idleMin > 0 && waitStart > 0 && !alreadyAsked) {
            const idleMs = idleMin * 60 * 1000;
            if (now - waitStart >= idleMs) {
              lw.idleAsked = true;
              await this.triggerIdleRpCheck(gid, gCfg, st.lastMessageSeq);
            }
          }
        }
      } catch (_) {}
    },

    async forceTriggerReply() {
      if (!this.currentGroupId) return;
      const gCfg = this.getCurrentGroupConfig();
      if (!gCfg) return;
      await this.processGroupTurn(this.currentGroupId, gCfg, Date.now(), true);
    },

    /* ============================================================================
     * 副API 真人级场面判断 + 主API 回复生成与小窗派发
     * ============================================================================ */
    async processGroupTurn(groupId, gCfg, targetSeq, forceReply = false) {
      if (this.busyGroups[groupId]) return;
      this.busyGroups[groupId] = true;

      try {
        const limit = Math.max(
          30,
          Math.min(800, Number(gCfg.contextLimit) || 180),
        );
        let messages = [];
        let memory = {
          summaryText: this.staticFallbackMemory[groupId] || "",
          lastSummarizedSeq: 0,
        };
        let totalStored = 0;

        try {
          const ctxRes = await fetch(
            `/api/qqbot/group/${encodeURIComponent(groupId)}/context?limit=${limit}`,
          );
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            messages = ctxData.messages || [];
            memory = ctxData.memory || memory;
            totalStored = ctxData.totalStored || ctxData.totalMessages || messages.length;
          }
        } catch (_) {
          messages = this.staticFallbackLogs[groupId] || [];
          totalStored = messages.length;
        }

        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.isSelf && !forceReply) {
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          return;
        }

        const speakerRealName = lastMsg
          ? this.resolveMemberDisplayName(
              gCfg,
              lastMsg.senderId,
              lastMsg.qqRemark || lastMsg.senderName,
            )
          : "群友";

        // 先检测是否是玩家发送了 还在RP 表情包或口令
        const rawLastText = String(
          (lastMsg && (lastMsg.rawMessage || lastMsg.content)) || "",
        ).trim();
        if (
          !forceReply &&
          /还在\s*rp|等一下.*rp|先别推进|正在码字|还在打字/i.test(rawLastText)
        ) {
          this.updateJudgeStatusUI(
            `检测到 ${speakerRealName} 发送还在RP信号，已自动顺延等待计时，暂不打断对戏`,
          );
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          if (this.localWaitNormalized[groupId]) {
            this.localWaitNormalized[groupId].waitingSince = Date.now();
            this.localWaitNormalized[groupId].idleAsked = false;
          }
          await this.refreshSandboxLog();
          return;
        }

        // 调用群控专用副API进行真人级场面判断
        let judgeResult = {
          shouldReply: true,
          sceneType: "SINGLE_INTERACTION",
          reason: "手动推进或直接回应",
          targetSpeakerName: speakerRealName,
          targetUserId: lastMsg ? String(lastMsg.senderId || "") : "",
          replyToMessageId: lastMsg ? String(lastMsg.messageId || "") : "",
          needPrivateHint: false,
          privateTargetName: "",
        };

        if (!forceReply) {
          this.updateJudgeStatusUI(
            "群控副API正在阅读群聊上下文与成员人设，判断此刻是否应当开口...",
          );
          judgeResult = await this.runSubApiSceneJudge(gCfg, messages, memory);
        }

        const unsummarizedCount =
          totalStored - (Number(memory.lastSummarizedSeq) || 0);
        if (unsummarizedCount >= 40) {
          this.summarizeCurrentGroupMemory(groupId, true).catch(() => {});
        }

        if (!judgeResult.shouldReply) {
          this.updateJudgeStatusUI(
            `副API判定暂不插话 · 场面：${judgeResult.sceneType || "等待群友对戏"} · 原因：${judgeResult.reason || "等待其他群友行动或继续RP"}`,
          );
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          await this.refreshSandboxLog();
          return;
        }

        this.updateJudgeStatusUI(
          `副API判定需要回应 · 场面：${judgeResult.sceneType || "即时互动"} · 原因：${judgeResult.reason || "回应群友行动"} · 正在调用群控主API...`,
        );

        // 唤醒群控主API生成正式回复、小窗密信、表情包与生图指令
        const replyPack = await this.runMainApiResponder(
          gCfg,
          messages,
          memory,
          judgeResult,
        );

        await this.dispatchReplyPack(
          groupId,
          gCfg,
          targetSeq,
          judgeResult,
          replyPack,
        );

        if (this.localWaitNormalized[groupId]) {
          this.localWaitNormalized[groupId].lastReplyAt = Date.now();
          this.localWaitNormalized[groupId].waitingSince = Date.now();
          this.localWaitNormalized[groupId].idleAsked = false;
        }
        await this.refreshSandboxLog();
        await this.loadCurrentGroupMemoryUI();
      } catch (err) {
        console.error("处理QQ群回合出错:", err);
        this.updateJudgeStatusUI(
          "处理群消息异常：" + (err.message || "请检查群控主副API配置"),
        );
      } finally {
        this.busyGroups[groupId] = false;
      }
    },

    async markGroupSeqProcessed(groupId, seq, idleAsked) {
      try {
        await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            markProcessedSeq: seq,
            waitingForRpSince: Date.now(),
            idleAsked: Boolean(idleAsked),
          }),
        });
      } catch (_) {}
    },

    async triggerIdleRpCheck(groupId, gCfg, currentSeq) {
      if (this.busyGroups[groupId]) return;
      this.busyGroups[groupId] = true;
      try {
        const stickerUrl = this.pickMatchedStickerUrl(
          gCfg.stickerCategoryId,
          "还在RP吗",
        );
        const askText =
          gCfg.mode === "trpg"
            ? "我看大家有一会儿没动静啦，请问还有调查员在继续RP或者补行动吗？如果还在RP可以发个还在RP的表情或说一声，要是大家都行动完毕我就继续往下推剧情咯。"
            : "群里突然安静下来啦，大家还在聊吗？";

        await this.sendBotMessage({
          groupId,
          message: askText,
          imageUrl: stickerUrl || "",
          markProcessedSeq: currentSeq,
          waitingForRpSince: Date.now(),
          idleAsked: true,
        });

        this.updateJudgeStatusUI(
          "已触发超时盯梢询问：发送了单次询问消息，若无人回应将保持安静不再刷屏",
        );
        await this.refreshSandboxLog();
      } catch (e) {
        console.warn("挂机询问发送失败:", e);
      } finally {
        this.busyGroups[groupId] = false;
      }
    },

    /* ============================================================================
     * 副API：真人级场面裁判 Prompt 与调用 · 上下文直接传实时备注名不传QQ号
     * ============================================================================ */
    async runSubApiSceneJudge(gCfg, messages, memory) {
      const recentSlice = messages.slice(-25);
      const memberRoster = this.resolvePlayerCardsPrompt(gCfg);

      const transcript = recentSlice
        .map((m) => {
          if (m.isSelf) {
            return `[我方已发消息]: ${m.rawMessage || m.content}`;
          }
          const realName = this.resolveMemberDisplayName(
            gCfg,
            m.senderId,
            m.qqRemark || m.senderName,
          );
          return `[${realName}|消息ID:${m.messageId}]: ${m.rawMessage || m.content}`;
        })
        .join("\n");

      const modeLabel =
        gCfg.mode === "trpg"
          ? "跑团带团守秘人KP模式"
          : "日常陪聊与设定OC群友模式";

      const sysPrompt = `你是QQ群控中枢的副API真人场面裁判。当前模式：${modeLabel}。
请完整阅读群聊上下文，注意群友在括号内讨论的内容同样非常重要，不能忽略括号内对KP或OC的提问、行动声明或检定沟通。

【本群成员名册与专属人设】
${memberRoster || "按群内显示的实时备注名字区分每位群成员"}

请你像一个真正的资深人类跑团KP或真人OC群友一样，精准判断此刻是否应该开口说话：
1. 单人独立互动 SINGLE_INTERACTION：某位群友单独和NPC搭话、单独向KP声明调查某个角落、或者提出一个不牵连其他人的独立行动，此时不需要死等全员，应立即决定回复该群友，并在 replyToMessageId 中填入该消息ID以便引用回复。
2. 括号提问或检定结算 BRACKET_QUESTION_OR_DICE：群友在括号里确认规则、询问环境细节，或者刚投出了技能检定骰子结果，应立即回复并给出检定描写或解答。
3. 玩家结伴RP且NPC在场 PC_RP_NPC_PRESENT：群友们正在互相角色扮演对戏，如果对戏内容涉及在场NPC或主动向我方搭话，则自然接话；如果只是两位群友私下交流且不需要NPC打断，则保持安静等待他们聊完。
4. 全员大场面等待 WAIT_ALL_ACTIONS：当前处于转场或全员危机鉴定阶段，我方刚要求所有在场调查员过骰子或表态，而目前只有部分人表态、还有活跃成员正在行动中，则暂不回复，等待其他人行动完毕。
5. 还在RP等待信号 STILL_RP_WAIT：有人表示还在RP、等一下、正在打字，则立即保持安静不回复。
6. 结束RP推进信号 FINISH_RP_ADVANCE：群友们表示RP结束、可以继续推剧情了，则立即回复并推进下一幕。

只输出严格的JSON对象，格式如下：
{
  "shouldReply": true,
  "sceneType": "SINGLE_INTERACTION | BRACKET_QUESTION_OR_DICE | PC_RP_NPC_PRESENT | WAIT_ALL_ACTIONS | STILL_RP_WAIT | FINISH_RP_ADVANCE",
  "reason": "简短说明为什么此时应该回复或应该继续等待",
  "targetSpeakerName": "如果是针对某位群友的独立行动或回答，填入其实时名字，否则留空",
  "replyToMessageId": "如果需要引用回复某条具体消息，填入其消息ID，否则留空",
  "needPrivateHint": false,
  "privateTargetName": "如果该行动触发了只有某位成员能看到的秘密线索或单人线，填入其实时名字或HO代号，否则留空"
}`;

      const userPrompt = `【过往记忆摘要】\n${memory.summaryText || "暂无历史摘要"}\n\n【最新群聊记录】\n${transcript}\n\n请判断当前场面并输出JSON：`;

      try {
        const raw = await this.callBotAI(sysPrompt, userPrompt, true);
        const parsed = this.extractJsonObject(raw);
        if (parsed && typeof parsed.shouldReply === "boolean") {
          return parsed;
        }
      } catch (e) {
        console.warn("副API判断调用异常，回退为默认回复:", e);
      }

      const lastMsg = messages[messages.length - 1];
      const fallbackName = lastMsg
        ? this.resolveMemberDisplayName(
            gCfg,
            lastMsg.senderId,
            lastMsg.qqRemark || lastMsg.senderName,
          )
        : "";
      return {
        shouldReply: true,
        sceneType: "SINGLE_INTERACTION",
        reason: "默认响应最新群消息",
        targetSpeakerName: fallbackName,
        replyToMessageId: lastMsg ? String(lastMsg.messageId || "") : "",
        needPrivateHint: false,
        privateTargetName: "",
      };
    },

    /* ============================================================================
     * 主API：完整挂载AI人设、要求、开启的思维链条目、每个群成员的实时名字与专属人设
     * ============================================================================ */
    async runMainApiResponder(gCfg, messages, memory, judgeResult) {
      const personaText = this.resolvePersonaPrompt(gCfg);
      const thoughtText = this.resolveThoughtPrompt(gCfg);
      const worldbookText = this.resolveWorldbookPrompt(gCfg);
      const moduleContext = this.resolveModulePrompt(gCfg);
      const playerCardsContext = this.resolvePlayerCardsPrompt(gCfg);
      const stickerNames = this.resolveAvailableStickerNames(
        gCfg.stickerCategoryId,
      );

      // 传送给AI的上下文直接显示每个人的实时备注名字，不再显示冰冷的QQ号ID
      const transcript = messages
        .map((m) => {
          if (m.isSelf) {
            return `[我方已发消息]: ${m.rawMessage || m.content}`;
          }
          const realName = this.resolveMemberDisplayName(
            gCfg,
            m.senderId,
            m.qqRemark || m.senderName,
          );
          return `[${realName}|消息ID:${m.messageId}]: ${m.rawMessage || m.content}`;
        })
        .join("\n");

      const naiRule = gCfg.autoNaiImage
        ? "当前已开启跑团正文每轮生图：只要本轮回复包含跑团正文的场景推进、环境描写、关键NPC登场或调查发现，必须在返回的 naiPrompt 字段中填写高质量英文NovelAI生图Tag串，聚焦画面光影、场景构图与人物动作；若仅是简短规则解答则 naiPrompt 留空。"
        : "当前未开启每轮强制生图，naiPrompt 字段留空即可。";

      const sysPrompt = `你是运行在真实QQ群中的${gCfg.mode === "trpg" ? "跑团守秘人KP与NPC演绎者" : "真人感OC群友"}。
请严格遵守以下核心准则：
1. 称呼与人设对应：上下文中每位群友都以其实时备注名字显示，请严格按照【本群成员实时名字与专属人设名册】来认识每一位群友、记住他们的设定与关系，直接称呼他们的名字或角色名。
2. 自然真人语气：像真人一样在QQ群里说话或带团描写，绝不机械复读，绝不替玩家扮演他们的角色，绝不强行篡改群友的行动意愿。
3. 括号与场外互动：你能看到群友在括号里说的话。如果群友用括号问规则或闲聊，你可以自然解答或回应；正剧描写则保持沉浸细腻的文学质感。
4. 单人回应与引用：如果当前是某位群友单独向NPC搭话或单独过检定，直接针对该群友给出回应与结果，不需要强行把其他没表态的群友一起拖进结算。
5. 单人线与秘密小窗：如果某位群友触发了专属HO秘密、高难侦查独享情报、发狂幻觉或单人线剧情，在群里只发公开可见的表象，同时把专属秘密写进 privateMessages 数组中，并在 targetSlot 中填入该群友的实时名字或HO代号，系统会自动通过QQ小窗单独私发给他。
6. ${naiRule}

【AI自身人设与身份设定】
${personaText}

${gCfg.customPrompt ? `【带团与聊天要求规范】\n${gCfg.customPrompt}\n` : ""}
【当前启用的思维链条目】
${thoughtText}

${playerCardsContext ? `【本群成员实时名字与专属人设名册】\n${playerCardsContext}\n` : ""}
${worldbookText ? `【世界书设定】\n${worldbookText}\n` : ""}
${moduleContext.text ? `【当前挂载跑团模组与KP真相】\n${moduleContext.text}\n` : ""}
${moduleContext.imageTitles.length > 0 ? `【可用模组插图列表】\n${moduleContext.imageTitles.join("、")}\n若本轮剧情恰好揭示其中某张模组插图或地图，可在 moduleImageTitle 中填入对应标题。\n` : ""}
${stickerNames.length > 0 ? `【可用表情包名称】\n${stickerNames.join("、")}\n若气氛合适可在 stickerName 中填入一个表情包名称。\n` : ""}

请只输出严格的JSON格式，结构如下：
{
  "groupMessages": [
    "发送到QQ群的第1条消息文本",
    "可选的第2条群消息文本"
  ],
  "quoteMessageId": "若需引用回复某位群友的消息，填入其消息ID，否则留空",
  "privateMessages": [
    {
      "targetSlot": "接收秘密小窗的群友实时名字或HO代号",
      "text": "单独发给该群友小窗的秘密线索或单人线描写"
    }
  ],
  "stickerName": "可选的表情包名称，不发则留空",
  "moduleImageTitle": "可选的模组插图标题，不发则留空",
  "naiPrompt": "若开启生图且本轮为跑团正文，填入英文NovelAI Tag串，否则留空"
}`;

      const userPrompt = `【本地双层滚动记忆账本】
${memory.summaryText || "尚无归档记忆"}

【副API场面裁判分析】
场景类型：${judgeResult.sceneType || "常规互动"}
判断依据：${judgeResult.reason || "正常接话"}
目标互动群友：${judgeResult.targetSpeakerName || "全员"}
建议引用消息ID：${judgeResult.replyToMessageId || "无"}

【最近群聊完整上下文】
${transcript}

请生成本轮响应JSON：`;

      const raw = await this.callBotAI(sysPrompt, userPrompt, false);
      const parsed = this.extractJsonObject(raw);
      if (parsed && Array.isArray(parsed.groupMessages)) {
        return parsed;
      }
      return {
        groupMessages: [String(raw || "").trim() || "收到。"],
        quoteMessageId: judgeResult.replyToMessageId || "",
        privateMessages: [],
        stickerName: "",
        moduleImageTitle: "",
        naiPrompt: "",
      };
    },

    async sendBotMessage(payload) {
      // 1. 若浏览器已直连手机 Termux OneBot WS，直接通过 WS 发送到真实 QQ 群或小窗
      if (this.directWsConnected && this.directWs) {
        const rawText = String(payload.message || payload.content || "").trim();
        const segments = [];
        if (payload.replyToMessageId) {
          segments.push({
            type: "reply",
            data: { id: String(payload.replyToMessageId) },
          });
        }
        if (rawText) {
          segments.push({
            type: "text",
            data: { text: rawText.replace(/^\[CQ:reply,id=[^\]]+\]/, "") },
          });
        }
        if (payload.imageUrl) {
          let fileVal = String(payload.imageUrl).trim();
          if (fileVal.startsWith("data:image/")) {
            const b64 = fileVal.split(",")[1] || "";
            if (b64) fileVal = "base64://" + b64;
          }
          segments.push({ type: "image", data: { file: fileVal } });
        }
        if (segments.length > 0) {
          try {
            if (payload.userId) {
              await this.callDirectOneBotWs("send_private_msg", {
                user_id: Number(payload.userId) || String(payload.userId),
                message: segments,
              });
            } else if (payload.groupId) {
              await this.callDirectOneBotWs("send_group_msg", {
                group_id: Number(payload.groupId) || String(payload.groupId),
                message: segments,
              });
            }
          } catch (_) {}
        }
      }

      // 2. 同步写入本地磁盘记录
      try {
        const res = await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return;
      } catch (_) {}

      if (payload.groupId && (payload.message || payload.imageUrl)) {
        this.appendStaticMessage(payload.groupId, {
          messageId: "bot_" + Date.now(),
          groupId: payload.groupId,
          senderId: "BOT",
          senderName: "群控AI",
          rawMessage: payload.message || "[发送插图]",
          content: payload.message || "[发送插图]",
          isSelf: true,
          timestamp: Date.now(),
        });
      }
    },

    async dispatchReplyPack(groupId, gCfg, targetSeq, judgeResult, replyPack) {
      const groupMsgs = Array.isArray(replyPack.groupMessages)
        ? replyPack.groupMessages.filter((t) => String(t || "").trim())
        : [];
      const quoteId =
        replyPack.quoteMessageId || judgeResult.replyToMessageId || "";

      // 1. 发送群聊公开消息
      for (let i = 0; i < groupMsgs.length; i++) {
        let text = String(groupMsgs[i]).trim();
        await this.sendBotMessage({
          groupId,
          message: text,
          replyToMessageId: i === 0 ? quoteId : "",
          markProcessedSeq: targetSeq,
          waitingForRpSince: Date.now(),
          idleAsked: false,
        });
      }

      // 2. 派发单人线小窗或秘密线索：支持按群友实时备注名、角色卡名、HO代号或QQ号匹配
      const privList = Array.isArray(replyPack.privateMessages)
        ? replyPack.privateMessages
        : [];
      for (const pm of privList) {
        if (!pm || !pm.text) continue;
        let targetId = String(pm.targetUserId || "").trim();
        const targetKey = String(
          pm.targetSlot || pm.targetName || pm.targetUserId || "",
        ).trim();
        let isSoloGroup = false;

        if (Array.isArray(gCfg.playerBindings)) {
          const found = gCfg.playerBindings.find((b) => {
            const disp = this.resolveMemberDisplayName(gCfg, b.qq, b.qqRemark);
            return (
              String(b.qq) === targetKey ||
              String(b.qq) === targetId ||
              b.slot === targetKey ||
              b.alias === targetKey ||
              b.qqRemark === targetKey ||
              b.cardName === targetKey ||
              disp === targetKey
            );
          });
          if (found) {
            targetId = found.qq;
            if (found.slot === "单人群") isSoloGroup = true;
          }
        }

        if (!targetId) continue;

        if (isSoloGroup) {
          await this.sendBotMessage({
            groupId: targetId,
            message: `【单人线】${pm.text}`,
          });
        } else {
          await this.sendBotMessage({
            groupId,
            userId: targetId,
            message: `【专属秘密线索】${pm.text}`,
          });
        }
      }

      // 3. 发送匹配的表情包
      if (replyPack.stickerName && gCfg.stickerCategoryId !== "NONE") {
        const stickerUrl = this.pickMatchedStickerUrl(
          gCfg.stickerCategoryId,
          replyPack.stickerName,
        );
        if (stickerUrl) {
          await this.sendBotMessage({
            groupId,
            message: `[表情:${replyPack.stickerName}]`,
            imageUrl: stickerUrl,
          });
        }
      }

      // 4. 发送模组自带插图
      if (
        replyPack.moduleImageTitle &&
        gCfg.moduleId &&
        gCfg.modImgMode !== "manual"
      ) {
        const modImg = this.cachedResources.moduleImages.find(
          (img) =>
            String(img.moduleId) === String(gCfg.moduleId) &&
            (img.title === replyPack.moduleImageTitle ||
              (img.title && img.title.includes(replyPack.moduleImageTitle))),
        );
        if (modImg && modImg.dataUrl) {
          await this.sendBotMessage({
            groupId,
            message: `【模组情报插图：${modImg.title || "现场画面"}】`,
            imageUrl: modImg.dataUrl,
          });
        }
      }

      // 5. 同回合强制调用 NovelAI 生图并发送到群
      if (
        gCfg.autoNaiImage &&
        replyPack.naiPrompt &&
        typeof window.callNovelAiDirect === "function"
      ) {
        this.updateJudgeStatusUI(
          "主API正文已发送，正在同回合调用NovelAI生成现场插图...",
        );
        try {
          const imgDataUrl = await window.callNovelAiDirect(
            String(replyPack.naiPrompt).trim(),
          );
          if (imgDataUrl) {
            await this.sendBotMessage({
              groupId,
              message: "【跑团现场实时插图】",
              imageUrl: imgDataUrl,
            });
            this.updateJudgeStatusUI(
              "本轮跑团回复与NovelAI现场生图已全部发送完毕",
            );
          }
        } catch (naiErr) {
          console.warn("群控同回合NovelAI生图失败:", naiErr);
          this.updateJudgeStatusUI("正文已发送，NovelAI生图接口未响应");
        }
      } else {
        this.updateJudgeStatusUI(
          "本轮主API回复已发送完毕，正在监听后续群消息",
        );
      }
    },

    /* ============================================================================
     * 酒馆式双层滚动记忆总结 - 群控副API自动压缩并写入本地磁盘
     * ============================================================================ */
    async summarizeCurrentGroupMemory(targetGroupId, silent = false) {
      const gid = targetGroupId || this.currentGroupId;
      if (!gid) return;
      const gCfg =
        (this.serverState &&
          this.serverState.config &&
          this.serverState.config.groups &&
          this.serverState.config.groups[gid]) ||
        this.getCurrentGroupConfig();

      if (!silent) {
        const badge = document.getElementById("qqbot-disk-status-badge");
        if (badge) badge.textContent = "副API总结中...";
      }

      try {
        let messages = [];
        let oldMem = this.staticFallbackMemory[gid] || "";
        let totalStored = 0;

        try {
          const res = await fetch(
            `/api/qqbot/group/${encodeURIComponent(gid)}/context?limit=260`,
          );
          if (res.ok) {
            const data = await res.json();
            messages = data.messages || [];
            oldMem = (data.memory && data.memory.summaryText) || oldMem;
            totalStored = data.totalStored || messages.length;
          }
        } catch (_) {
          messages = this.staticFallbackLogs[gid] || [];
          totalStored = messages.length;
        }

        if (messages.length === 0) {
          if (!silent) {
            const badge = document.getElementById("qqbot-disk-status-badge");
            if (badge) badge.textContent = "暂无新消息可总结";
          }
          return;
        }

        const transcript = messages
          .slice(-120)
          .map((m) => {
            if (m.isSelf) return `[我方AI]: ${m.rawMessage || m.content}`;
            const disp = this.resolveMemberDisplayName(
              gCfg,
              m.senderId,
              m.qqRemark || m.senderName,
            );
            return `[${disp}]: ${m.rawMessage || m.content}`;
          })
          .join("\n");

        const sysPrompt = `你是酒馆式双层滚动记忆总结引擎。请将旧记忆账本与最新群聊记录合并提炼为结构紧凑、极省Token但关键细节零丢失的三段式结构化账本。请一律使用群友的实时备注名字记录，不要写QQ号：
一、已发生关键事件与时间线
二、当前所处场景与已获线索道具
三、人物关系态度、技能检定结果与待回收伏笔

直接输出整理后的三段式纯文本账本，不要寒暄。`;

        const userPrompt = `【原有记忆账本】\n${oldMem || "无"}\n\n【近期群聊记录】\n${transcript}\n\n请输出更新后的三段式记忆账本：`;
        const summaryText = await this.callBotAI(sysPrompt, userPrompt, true);

        if (summaryText && summaryText.trim()) {
          const cleanSummary = summaryText.trim();
          this.staticFallbackMemory[gid] = cleanSummary;
          const lastSeq =
            messages[messages.length - 1].seq || totalStored || messages.length;
          try {
            await fetch(`/api/qqbot/group/${encodeURIComponent(gid)}/memory`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                summaryText: cleanSummary,
                lastSummarizedSeq: lastSeq,
              }),
            });
          } catch (_) {}

          if (String(gid) === String(this.currentGroupId)) {
            const memBox = document.getElementById("qqbot-memory-textarea");
            if (memBox) memBox.value = cleanSummary;
            const badge = document.getElementById("qqbot-disk-status-badge");
            if (badge) badge.textContent = "副API已更新账本";
          }
        }
      } catch (e) {
        console.warn("副API总结记忆失败:", e);
        if (!silent) {
          const badge = document.getElementById("qqbot-disk-status-badge");
          if (badge) badge.textContent = "总结失败请检查副API";
        }
      }
    },

    /* ============================================================================
     * 实时控制台监控画面与快捷演练
     * ============================================================================ */
    async refreshSandboxLog() {
      const box = document.getElementById("qqbot-live-console-log");
      if (!box || !this.currentGroupId) return;
      const gCfg = this.getCurrentGroupConfig();
      let msgs = [];
      let total = 0;

      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/context?limit=40`,
        );
        if (res.ok) {
          const data = await res.json();
          msgs = data.messages || [];
          total = data.totalStored || data.totalMessages || msgs.length;
        }
      } catch (_) {
        msgs = this.staticFallbackLogs[this.currentGroupId] || [];
        total = msgs.length;
      }

      const badge = document.getElementById("qqbot-disk-status-badge");
      if (badge) {
        badge.textContent = `本地已存 ${total} 条`;
      }

      if (msgs.length === 0) {
        box.innerHTML =
          '<div style="text-align: center; color: var(--text-secondary); padding: 28px 8px;">当前群暂无消息记录，可点击下方单人、括号、待机、检定按钮演练，或连接Termux实时接收QQ群消息</div>';
        return;
      }

      box.innerHTML = msgs
        .map((m) => {
          const align = m.isSelf ? "flex-end" : "flex-start";
          const bg = m.isSelf ? "var(--accent-color)" : "var(--card-bg)";
          const color = m.isSelf ? "#ffffff" : "var(--text-primary)";
          const dispName = m.isSelf
            ? m.senderName || "群控AI"
            : this.resolveMemberDisplayName(
                gCfg,
                m.senderId,
                m.qqRemark || m.senderName,
              );
          return `
          <div style="display: flex; flex-direction: column; align-items: ${align}; gap: 2px;">
            <span style="font-size: 10px; color: var(--text-secondary);">${this.escapeHtml(dispName)} · #${m.seq || m.messageId}</span>
            <div style="max-width: 88%; padding: 6px 10px; border-radius: 10px; background: ${bg}; color: ${color}; border: 1px solid var(--border-color); font-size: 12px; line-height: 1.45; word-break: break-word;">
              ${this.escapeHtml(m.rawMessage || m.content || "")}
            </div>
          </div>
        `;
        })
        .join("");
      box.scrollTop = box.scrollHeight;
    },

    updateJudgeStatusUI(text) {
      const el = document.getElementById("qqbot-judge-status-box");
      if (el) el.textContent = text;
    },

    async simulateQuickScene(sceneKey) {
      if (!this.currentGroupId) return;
      const g = this.getCurrentGroupConfig();
      const bindings = (g && g.playerBindings) || [];
      const first = bindings[0] || { qq: "10001", qqRemark: "早川秋" };
      const second = bindings[1] || first;
      const name1 = this.resolveMemberDisplayName(g, first.qq, first.qqRemark);
      const name2 = this.resolveMemberDisplayName(g, second.qq, second.qqRemark);

      const presets = {
        single_npc: {
          senderId: first.qq,
          senderName: name1,
          text: "我走到柜台前敲了敲木桌，低声问店员：昨晚八点左右，有没有一个穿黑色雨衣的人来寄存过手提箱？",
        },
        bracket_ask: {
          senderId: second.qq,
          senderName: name2,
          text: "【问一下KP，房间里的老式座机电话现在还有忙音吗？我能不能直接拨号或者撬开听筒看线路？】",
        },
        still_rp: {
          senderId: first.qq,
          senderName: name1,
          text: "[表情:等一下我还在RP] 等一下，我和同伴再对两句词！",
        },
        dice_check: {
          senderId: second.qq,
          senderName: name2,
          text: "我对书桌抽屉夹层过一个侦查检定：.rd100=18 / 70 困难成功！",
        },
      };
      const item = presets[sceneKey];
      if (!item) return;
      await this.injectSimulatedMessage(
        item.senderId,
        item.senderName,
        item.text,
      );
    },

    async submitSandboxInput() {
      const senderSel = document.getElementById("qqbot-sim-sender");
      const inputEl = document.getElementById("qqbot-sim-input");
      const text = inputEl ? inputEl.value.trim() : "";
      if (!text || !this.currentGroupId) return;
      if (inputEl) inputEl.value = "";

      const rawSender = senderSel ? senderSel.value : "10001|早川秋";
      if (rawSender.startsWith("BOT|")) {
        await this.sendBotMessage({
          groupId: this.currentGroupId,
          message: text,
        });
        await this.refreshSandboxLog();
        return;
      }

      const [senderId, senderName] = rawSender.split("|");
      await this.injectSimulatedMessage(
        senderId || "10001",
        senderName || "群友",
        text,
      );
    },

    async injectSimulatedMessage(senderId, senderName, text) {
      if (!this.currentGroupId) return;
      const gCfg = this.getCurrentGroupConfig();
      const realName = this.resolveMemberDisplayName(
        gCfg,
        senderId,
        senderName,
      );
      let seq = Date.now();

      try {
        const res = await fetch("/api/qqbot/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: this.currentGroupId,
            groupName: gCfg ? gCfg.groupName : "测试群",
            senderId,
            senderName: realName,
            message: text,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.entry && data.entry.seq) {
            seq = data.entry.seq;
          }
        } else {
          throw new Error("fallback");
        }
      } catch (_) {
        this.appendStaticMessage(this.currentGroupId, {
          messageId: "sim_" + Date.now(),
          groupId: this.currentGroupId,
          senderId,
          senderName: realName,
          qqRemark: realName,
          rawMessage: text,
          content: text,
          isSelf: false,
          timestamp: Date.now(),
        });
      }

      await this.refreshSandboxLog();
      await this.loadCurrentGroupMemoryUI();

      if (gCfg) {
        await this.processGroupTurn(this.currentGroupId, gCfg, seq, false);
      }
    },

    /* ============================================================================
     * 资源解析与群控独立主副API调用底层
     * ============================================================================ */
    resolvePersonaPrompt(gCfg) {
      if (gCfg && gCfg.aiPersona && String(gCfg.aiPersona).trim()) {
        return String(gCfg.aiPersona).trim();
      }
      if (gCfg && gCfg.personaId) {
        const found = this.cachedResources.personas.find(
          (p) => String(p.id) === String(gCfg.personaId),
        );
        if (found && found.prompt) return found.prompt;
      }
      return "你是一位温和、细腻、极具画面感与公平裁决力的跑团守秘人KP，在日常闲聊时则是自然亲切的群友。";
    },

    resolveThoughtPrompt(gCfg) {
      if (
        gCfg &&
        Array.isArray(gCfg.thoughtItems) &&
        gCfg.thoughtItems.length > 0
      ) {
        const enabledItems = gCfg.thoughtItems.filter(
          (i) => i && i.enabled !== false,
        );
        if (enabledItems.length > 0) {
          const usedTitles = new Set();
          const replacePlaceholders = (tmpl) => {
            if (!tmpl) return "";
            let result = String(tmpl);
            enabledItems.forEach((item) => {
              const name = String(item.title || item.name || "").trim();
              if (!name) return;
              const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(`\\[${escaped}\\]`, "g");
              if (regex.test(result)) {
                usedTitles.add(name);
                result = result.replace(regex, String(item.content || ""));
              }
            });
            return result.replace(/\[[^\[\]\n]{1,30}\]/g, "");
          };

          const headerResolved = replacePlaceholders(
            gCfg.thoughtHeaderContent || "",
          );
          const generalResolved = replacePlaceholders(
            gCfg.thoughtGeneralContent || "",
          );
          const remaining = enabledItems.filter(
            (i) => !usedTitles.has(String(i.title || i.name || "").trim()),
          );

          const parts = [];
          if (headerResolved.trim()) parts.push(headerResolved.trim());
          if (generalResolved.trim()) parts.push(generalResolved.trim());
          if (remaining.length > 0) {
            parts.push(
              remaining
                .map(
                  (item, idx) =>
                    `${idx + 1}. 【${item.title || item.name}】：${item.content}`,
                )
                .join("\n"),
            );
          }
          if (parts.length > 0) return parts.join("\n\n");
        }
      }
      return "1. 先梳理现场每位群成员所处位置与行动因果；2. 区分公开可见环境与个人私密情报；3. 用具体感官细节展现氛围，绝不替群友做决定。";
    },

    resolveWorldbookPrompt(gCfgOrId) {
      if (!gCfgOrId) return "";
      if (typeof gCfgOrId === "object") {
        const gCfg = gCfgOrId;
        const enabledIds = Array.isArray(gCfg.enabledWorldBookIds)
          ? gCfg.enabledWorldBookIds.map(String)
          : [];
        if (enabledIds.length > 0) {
          const matched = (this.cachedResources.worldbooks || []).filter((w) =>
            enabledIds.includes(String(w.id)),
          );
          if (matched.length > 0) {
            return matched
              .map((w) => `【${w.name}】\n${w.content}`)
              .join("\n\n");
          }
        }
        if (!gCfg.worldBookId) return "";
        return this.resolveWorldbookPrompt(gCfg.worldBookId);
      }

      const wbId = String(gCfgOrId);
      if (wbId === "ALL") {
        return (this.cachedResources.worldbooks || [])
          .slice(0, 15)
          .map((w) => `【${w.name}】${w.content}`)
          .join("\n");
      }
      const found = (this.cachedResources.worldbooks || []).find(
        (w) => String(w.id) === wbId,
      );
      return found ? `【${found.name}】\n${found.content}` : "";
    },

    resolveModulePrompt(gCfgOrModuleId, chapterId) {
      let moduleId = gCfgOrModuleId;
      let selectedChapterIds = null;
      let loadToc = false;
      let loadImages = true;

      if (gCfgOrModuleId && typeof gCfgOrModuleId === "object") {
        const gCfg = gCfgOrModuleId;
        moduleId = gCfg.moduleId;
        chapterId = gCfg.chapterId;
        if (Array.isArray(gCfg.selectedModuleChapterIds)) {
          selectedChapterIds = gCfg.selectedModuleChapterIds.map(String);
        }
        loadToc = Boolean(gCfg.loadModuleToc);
        loadImages = gCfg.loadModuleImages !== false;
      }

      if (!moduleId) return { text: "", imageTitles: [] };
      const mod = (this.cachedResources.modules || []).find(
        (m) => String(m.id) === String(moduleId),
      );
      const chaps = (this.cachedResources.moduleChapters || [])
        .filter((c) => String(c.moduleId) === String(moduleId))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      let selectedChaps = chaps;
      if (Array.isArray(selectedChapterIds)) {
        selectedChaps = chaps.filter((c) =>
          selectedChapterIds.includes(String(c.id)),
        );
      } else if (chapterId && chapterId !== "ALL") {
        const target = chaps.find((c) => String(c.id) === String(chapterId));
        if (target) selectedChaps = [target];
      }

      const tocPart =
        loadToc && mod && mod.toc ? `【模组目录】\n${mod.toc}\n\n` : "";

      const chapText = selectedChaps
        .map(
          (c) =>
            `章节《${c.title || ""}》\n正文与场景：${(c.content || "").slice(0, 2200)}\nKP真相与暗线：${(c.kpNotes || c.truth || "").slice(0, 1200)}`,
        )
        .join("\n\n");

      const imgs = loadImages
        ? (this.cachedResources.moduleImages || [])
            .filter((img) => String(img.moduleId) === String(moduleId))
            .map((img) => img.title || "模组插图")
            .filter(Boolean)
        : [];

      return {
        text: `模组名称：${(mod && (mod.title || mod.name)) || ""}\n简介与真相：${(mod && (mod.description || mod.summary || mod.truth)) || ""}\n\n${tocPart}${chapText}`,
        imageTitles: imgs,
      };
    },

    resolvePlayerCardsPrompt(gCfg) {
      const bindings = (gCfg && gCfg.playerBindings) || [];
      if (!Array.isArray(bindings) || bindings.length === 0) return "";
      return bindings
        .map((b) => {
          const realName = this.resolveMemberDisplayName(
            gCfg,
            b.qq,
            b.qqRemark,
          );
          const card = this.cachedResources.charCards.find(
            (c) => String(c.id) === String(b.cardId),
          );
          let detail = "";
          if (card) {
            if (card.cocData) {
              try {
                const stats = JSON.stringify(
                  card.cocData.characteristics || card.cocData.stats || {},
                );
                const skills = JSON.stringify(card.cocData.skills || {});
                detail += ` | 角色卡:${card.name} 属性:${stats.slice(0, 240)} 技能:${skills.slice(0, 360)}`;
              } catch (_) {}
            } else if (card.name) {
              detail += ` | 关联角色卡:${card.name}`;
            }
          }
          const customPersona = String(
            b.persona || (card && card.persona) || "",
          ).trim();
          if (customPersona) {
            detail += ` | 专属人设:${customPersona}`;
          }
          return `- 实时名字:${realName} | 定位:${b.slot || "群友"}${detail}`;
        })
        .join("\n");
    },

    resolveAvailableStickerNames(catId) {
      if (catId === "NONE") return [];
      let list = this.cachedResources.stickers || [];
      if (catId && catId !== "ALL") {
        list = list.filter((s) => String(s.categoryId) === String(catId));
      }
      return list
        .slice(0, 30)
        .map((s) => s.name || s.meaning || "")
        .filter(Boolean);
    },

    pickMatchedStickerUrl(catId, keyword) {
      if (catId === "NONE") return "";
      let list = this.cachedResources.stickers || [];
      if (catId && catId !== "ALL") {
        list = list.filter((s) => String(s.categoryId) === String(catId));
      }
      if (list.length === 0) return "";
      const kw = String(keyword || "").trim();
      const matched =
        list.find(
          (s) =>
            (s.name && s.name.includes(kw)) ||
            (s.meaning && s.meaning.includes(kw)),
        ) || list[0];
      return matched ? matched.url || matched.dataUrl || "" : "";
    },

    async callBotAI(sysPrompt, userPrompt, useSubApi = false) {
      const getInputVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const cfg = (this.serverState && this.serverState.config) || {};
      const botMain = cfg.mainApi || {};
      const botSub = cfg.subApi || {};
      const stCfg =
        (window.state && window.state.apiConfig) ||
        this.cachedResources.globalApiConfig ||
        {};

      let proxyUrl = "";
      let apiKey = "";
      let model = "";

      if (useSubApi) {
        // 群控副API：严格优先使用群控界面内独立配置的副API，与外部生图副API互不干扰
        proxyUrl =
          getInputVal("qqbot-sub-api-url") ||
          botSub.url ||
          getInputVal("qqbot-main-api-url") ||
          botMain.url ||
          getInputVal("sub-proxy-url") ||
          stCfg.subProxyUrl ||
          getInputVal("proxy-url") ||
          stCfg.proxyUrl;
        apiKey =
          getInputVal("qqbot-sub-api-key") ||
          botSub.apiKey ||
          getInputVal("qqbot-main-api-key") ||
          botMain.apiKey ||
          getInputVal("sub-api-key") ||
          stCfg.subApiKey ||
          getInputVal("api-key") ||
          stCfg.apiKey;
        model =
          getInputVal("qqbot-sub-api-model") ||
          botSub.model ||
          getInputVal("qqbot-main-api-model") ||
          botMain.model ||
          getInputVal("sub-model-select") ||
          stCfg.subModel ||
          getInputVal("model-select") ||
          stCfg.model;
      } else {
        // 群控主API：严格优先使用群控界面内独立配置的主API
        proxyUrl =
          getInputVal("qqbot-main-api-url") ||
          botMain.url ||
          getInputVal("proxy-url") ||
          stCfg.proxyUrl ||
          getInputVal("qqbot-sub-api-url") ||
          botSub.url;
        apiKey =
          getInputVal("qqbot-main-api-key") ||
          botMain.apiKey ||
          getInputVal("api-key") ||
          stCfg.apiKey ||
          getInputVal("qqbot-sub-api-key") ||
          botSub.apiKey;
        model =
          getInputVal("qqbot-main-api-model") ||
          botMain.model ||
          getInputVal("model-select") ||
          stCfg.model ||
          getInputVal("qqbot-sub-api-model") ||
          botSub.model;
      }

      if (!proxyUrl || !apiKey) {
        if (useSubApi) {
          return JSON.stringify({
            shouldReply: true,
            sceneType: "SINGLE_INTERACTION",
            reason: "本地演练模式自动放行，配置群控API后将启用真实副API判断",
            targetSpeakerName: "",
            replyToMessageId: "",
            needPrivateHint: false,
            privateTargetName: "",
          });
        }
        return JSON.stringify({
          groupMessages: [
            "本地沙盘演练已收到消息。当前尚未填入群控主API密钥，请在下方群控专属主API与副API独立接口卡片中填入地址与密钥，或点击同主按钮复用全局API后即可生成真实AI回复。",
          ],
          quoteMessageId: "",
          privateMessages: [],
          stickerName: "",
          moduleImageTitle: "",
          naiPrompt: "",
        });
      }

      let endpoint = String(proxyUrl || "").replace(/\/+$/, "");
      if (!endpoint.endsWith("/chat/completions")) {
        if (endpoint.endsWith("/v1") || endpoint.includes("/paas/v4")) {
          endpoint += "/chat/completions";
        } else {
          endpoint += "/v1/chat/completions";
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: useSubApi ? 0.25 : 0.78,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`API HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }
      const data = await res.json();
      return (
        (data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content) ||
        ""
      );
    },

    extractJsonObject(raw) {
      const text = String(raw || "").trim();
      if (!text) return null;
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = fenced ? fenced[1].trim() : text;
      const firstBrace = candidate.indexOf("{");
      const lastBrace = candidate.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        try {
          return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
        } catch (_) {}
      }
      try {
        return JSON.parse(candidate);
      } catch (_) {
        return null;
      }
    },

    escapeHtml(str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    escapeAttr(str) {
      return this.escapeHtml(str).replace(/'/g, "&#39;");
    },
  };

  window.QQBotConsole = QQBotConsole;

  document.addEventListener("DOMContentLoaded", () => {
    const icon = document.getElementById("tukey-accounting-app-icon");
    if (icon) {
      icon.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          QQBotConsole.openScreen();
        },
        true,
      );
    }
    setTimeout(() => {
      QQBotConsole.init().catch(() => {});
    }, 1200);
  });
})();

