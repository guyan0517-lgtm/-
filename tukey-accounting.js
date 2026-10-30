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

  function getDefaultNaiPromptConfig() {
    return {
      prefix:
        "masterpiece, best quality, ultra-detailed, cinematic lighting, anime illustration, delicate details",
      ocPrompt:
        "当目前处于日常陪聊OC模式且已开启OC生图时：如果群友或好友明确请求看照片、自拍、看看你现在的样子或周围环境，或者当前日常互动出现了非常适合配图的画面感瞬间，请在返回的 naiPrompt 字段中填写描述当前人物外貌、穿搭、动作神态与环境光影的英文NovelAI生图Tag词串；普通日常文字闲聊时 naiPrompt 留空即可。",
      kpPrompt:
        "当目前处于跑团带团守秘人KP模式或已开启每回合末尾强制生图时：本轮回复的末尾必须强制生成一张展现当前跑团现场画面、调查员行动、NPC神态或环境氛围的插图！你必须在返回的JSON对象中的 naiPrompt 字段里填写完整、高质量的英文NovelAI生图Tag词串，严禁留空！英文Tag需包含场景构图、光影氛围、关键人物外貌动作与环境细节，系统会在发送完本轮文字后立即调用NovelAI生图并发送到群里。",
    };
  }

  const QQBotConsole = {
    initialized: false,
    serverState: null,
    currentGroupId: "",
    currentPrivateUserId: "",
    pollTimer: null,
    busyGroups: {},
    busyPrivates: {},
    localWaitNormalized: {},
    directWs: null,
    directWsConnected: false,
    directPendingEchoes: new Map(),
    termuxDiskAvailable: false,
    staticFallbackLogs: {},
    staticFallbackMemory: {},
    debugTraces: [],
    groupDebounceTimers: {},
    privateDebounceTimers: {},
    pendingRerunGroups: {},
    pendingRerunPrivates: {},
    isConnectingDirectWs: false,
    PERSISTENT_STORAGE_KEY: "ephone_qqbot_persistent_v2",
    cachedResources: {
      personas: [],
      thoughts: [],
      worldbooks: [],
      worldbookCats: [],
      stickerCats: [],
      stickers: [],
      modules: [],
      moduleChapters: [],
      moduleImages: [],
      charCards: [],
    },

    loadLocalPersistentConfig() {
      try {
        const raw = localStorage.getItem(this.PERSISTENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (_) {}
      return null;
    },

    saveLocalPersistentConfig(cfg) {
      try {
        if (!cfg || typeof cfg !== "object") return;
        const snapshot = {
          onebotUrl: cfg.onebotUrl || "ws://127.0.0.1:3001",
          selfId: cfg.selfId || "",
          accessToken: cfg.accessToken || "",
          globalPaused: Boolean(cfg.globalPaused),
          currentGroupId: this.currentGroupId || cfg.currentGroupId || "",
          currentPrivateUserId:
            this.currentPrivateUserId || cfg.currentPrivateUserId || "",
          mainApi: cfg.mainApi || { url: "", apiKey: "", model: "" },
          subApi: cfg.subApi || { url: "", apiKey: "", model: "" },
          accountPresets: Array.isArray(cfg.accountPresets)
            ? cfg.accountPresets
            : [],
          privateChats:
            cfg.privateChats && typeof cfg.privateChats === "object"
              ? cfg.privateChats
              : {},
          naiPresets: Array.isArray(cfg.naiPresets) ? cfg.naiPresets : [],
          customStickers: Array.isArray(cfg.customStickers)
            ? cfg.customStickers
            : [],
          visionCache:
            cfg.visionCache && typeof cfg.visionCache === "object"
              ? cfg.visionCache
              : {},
          groups: cfg.groups || {},
          savedAt: Date.now(),
        };
        localStorage.setItem(
          this.PERSISTENT_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
      } catch (e) {
        console.warn("写入群控本地持久化配置异常:", e);
      }
    },

    mergeLocalPersistentIntoState() {
      const localCfg = this.loadLocalPersistentConfig();
      if (!localCfg || !this.serverState || !this.serverState.config) return;
      const sCfg = this.serverState.config;

      if (localCfg.onebotUrl) sCfg.onebotUrl = localCfg.onebotUrl;
      if (localCfg.selfId) sCfg.selfId = localCfg.selfId;
      if (localCfg.accessToken !== undefined && localCfg.accessToken !== "") {
        sCfg.accessToken = localCfg.accessToken;
      }
      if (localCfg.globalPaused !== undefined) {
        sCfg.globalPaused = Boolean(localCfg.globalPaused);
      }
      if (localCfg.mainApi && (localCfg.mainApi.url || localCfg.mainApi.apiKey)) {
        sCfg.mainApi = { ...sCfg.mainApi, ...localCfg.mainApi };
      }
      if (localCfg.subApi && (localCfg.subApi.url || localCfg.subApi.apiKey)) {
        sCfg.subApi = { ...sCfg.subApi, ...localCfg.subApi };
      }
      if (
        Array.isArray(localCfg.accountPresets) &&
        localCfg.accountPresets.length > 0
      ) {
        sCfg.accountPresets = localCfg.accountPresets;
      }
      if (
        localCfg.privateChats &&
        typeof localCfg.privateChats === "object" &&
        Object.keys(localCfg.privateChats).length > 0
      ) {
        sCfg.privateChats = {
          ...(sCfg.privateChats || {}),
          ...localCfg.privateChats,
        };
      }
      if (
        Array.isArray(localCfg.naiPresets) &&
        localCfg.naiPresets.length > 0
      ) {
        sCfg.naiPresets = localCfg.naiPresets;
      }
      if (
        Array.isArray(localCfg.customStickers) &&
        localCfg.customStickers.length > 0
      ) {
        sCfg.customStickers = localCfg.customStickers;
      }
      if (localCfg.visionCache && typeof localCfg.visionCache === "object") {
        sCfg.visionCache = {
          ...(sCfg.visionCache || {}),
          ...localCfg.visionCache,
        };
      }
      if (localCfg.groups && typeof localCfg.groups === "object") {
        if (!sCfg.groups) sCfg.groups = {};
        const localGids = Object.keys(localCfg.groups);
        if (localGids.length > 0) {
          if (
            !localCfg.groups["88482026"] &&
            localGids.some((id) => id !== "88482026") &&
            Object.keys(sCfg.groups).length === 1 &&
            sCfg.groups["88482026"]
          ) {
            delete sCfg.groups["88482026"];
          }
          for (const gid of localGids) {
            sCfg.groups[gid] = {
              ...this.createDefaultGroupConfig(
                gid,
                localCfg.groups[gid]?.groupName || "QQ群 " + gid,
              ),
              ...(sCfg.groups[gid] || {}),
              ...localCfg.groups[gid],
            };
          }
        }
      }
      if (
        localCfg.currentGroupId &&
        sCfg.groups &&
        sCfg.groups[localCfg.currentGroupId]
      ) {
        this.currentGroupId = localCfg.currentGroupId;
      }
      if (
        localCfg.currentPrivateUserId &&
        sCfg.privateChats &&
        sCfg.privateChats[localCfg.currentPrivateUserId]
      ) {
        this.currentPrivateUserId = localCfg.currentPrivateUserId;
      }
    },

    isGlobalPaused() {
      return Boolean(
        this.serverState &&
          this.serverState.config &&
          this.serverState.config.globalPaused,
      );
    },

    clearAllPendingTurnTimers() {
      if (this.groupDebounceTimers) {
        for (const gid of Object.keys(this.groupDebounceTimers)) {
          clearTimeout(this.groupDebounceTimers[gid]);
          delete this.groupDebounceTimers[gid];
        }
      }
      if (this.privateDebounceTimers) {
        for (const uid of Object.keys(this.privateDebounceTimers)) {
          clearTimeout(this.privateDebounceTimers[uid]);
          delete this.privateDebounceTimers[uid];
        }
      }
      this.pendingRerunGroups = {};
    },

    renderMasterPauseUI() {
      const paused = this.isGlobalPaused();
      const btn = document.getElementById("qqbot-master-pause-btn");
      const badge = document.getElementById("qqbot-master-pause-badge");
      if (btn) {
        btn.textContent = paused ? "启用" : "暂停";
        if (paused) {
          btn.classList.add("primary");
        } else {
          btn.classList.remove("primary");
        }
      }
      if (badge) {
        badge.textContent = paused ? "已全局暂停" : "监听运行中";
        badge.style.color = paused ? "#d9534f" : "var(--accent-color)";
      }
    },

    async toggleMasterPause() {
      if (!this.serverState || !this.serverState.config) return;
      const nextPaused = !this.serverState.config.globalPaused;
      this.serverState.config.globalPaused = nextPaused;
      if (nextPaused) {
        this.clearAllPendingTurnTimers();
        this.updateJudgeStatusUI(
          "已开启全局暂停：群控监听、副API场面判断与主API回复均已停止，点击启用即可恢复",
        );
        this.appendDebugLog(
          "全局暂停",
          "已暂停全部群聊与小窗监听，暂停期间绝不调用主API或副API，状态已永久保存",
          true,
        );
      } else {
        this.updateJudgeStatusUI(
          "已恢复全局启用：正在监听群聊与好友小窗消息",
        );
        this.appendDebugLog(
          "全局启用",
          "已恢复全部群聊与小窗监听及AI自动回复，状态已永久保存",
          false,
        );
      }
      this.renderMasterPauseUI();
      await this.saveAllSettings(false);
      this.notify(nextPaused ? "已全局暂停监听与API调用" : "已恢复监听与API调用");
    },

    appendDebugLog(tag, detail, isError = false) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      this.debugTraces.push({
        time: timeStr,
        tag: String(tag || "状态"),
        detail: String(detail || ""),
        isError: Boolean(isError),
      });
      if (this.debugTraces.length > 50) {
        this.debugTraces = this.debugTraces.slice(-50);
      }
      this.renderDebugTraceLog();
    },

    clearDebugTraceLog() {
      this.debugTraces = [];
      this.renderDebugTraceLog();
      this.notify("已清空调试日志");
    },

    renderDebugTraceLog() {
      const box = document.getElementById("qqbot-debug-trace-log");
      if (!box) return;
      if (!Array.isArray(this.debugTraces) || this.debugTraces.length === 0) {
        box.innerHTML =
          '<div style="color: var(--text-secondary);">调试台已启动，正在监听 127.0.0.1:3001 实时群聊与小窗数据包及副AI识图状态...</div>';
        return;
      }
      box.innerHTML = this.debugTraces
        .map((item) => {
          const tagColor = item.isError
            ? "#d9534f"
            : "var(--accent-color)";
          return `<div style="display: flex; align-items: flex-start; gap: 6px; padding: 2px 0; border-bottom: 1px dashed var(--border-color);">
            <span style="color: var(--text-secondary); flex-shrink: 0; font-family: monospace;">${this.escapeHtml(item.time)}</span>
            <span style="color: ${tagColor}; font-weight: 700; flex-shrink: 0;">[${this.escapeHtml(item.tag)}]</span>
            <span style="color: var(--text-primary); word-break: break-word; flex: 1;">${this.escapeHtml(item.detail)}</span>
          </div>`;
        })
        .join("");
      box.scrollTop = box.scrollHeight;
    },

    async openScreen() {
      if (typeof window.showScreen === "function") {
        window.showScreen("tukey-accounting-screen");
      }
      await this.init();
      await this.refreshLocalResources();
      await this.syncFromServer(true);
      await this.refreshSandboxLog();
      this.renderDebugTraceLog();
      this.ensureAutoDirectWsConnection();
    },

    closeScreen() {
      this.saveAllSettings(false).catch(() => {});
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
      this.renderDebugTraceLog();
      this.startBackgroundWatcher();
      this.ensureAutoDirectWsConnection();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.ensureAutoDirectWsConnection();
        }
      });
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

    currentTab: "monitor",

    switchTab(tabKey) {
      const normalizedKey = tabKey === "member" ? "group" : tabKey;
      const tabs = ["monitor", "group", "private", "persona", "module", "api"];
      const target = tabs.includes(normalizedKey) ? normalizedKey : "monitor";
      this.currentTab = target;
      tabs.forEach((k) => {
        const pane = document.getElementById(`qqbot-tab-${k}`);
        if (pane) {
          pane.style.display = k === target ? "flex" : "none";
        }
        const btn = document.getElementById(`qqbot-tab-btn-${k}`);
        if (btn) {
          if (k === target) {
            btn.classList.add("primary");
          } else {
            btn.classList.remove("primary");
          }
        }
      });
      const scroller = document.getElementById("qqbot-main-scroll");
      if (scroller) scroller.scrollTop = 0;
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

    async copyTermuxPanelCmd() {
      if (typeof window.copyVaultStartupCmd === "function") {
        await window.copyVaultStartupCmd("android");
      }
      this.notify("已复制Termux后台启动面板命令");
      this.updateConnDetail(
        "已复制新版Termux命令：去Termux粘贴回车后，输入 2 直接在后台启动已有NapCat且不卡死终端，随后可直接输入 3 查看 6099 与 3001 密钥",
        true,
      );
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
      await this.copyTermuxPanelCmd();
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
     * QQ账号与Token预设：支持存号、删号、下拉一键切换并永久保存
     * ============================================================================ */
    onConnectionInputEdited() {
      if (!this.serverState || !this.serverState.config) return;
      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");
      if (epInput) this.serverState.config.onebotUrl = epInput.value.trim();
      if (selfInput) this.serverState.config.selfId = selfInput.value.trim();
      if (tkInput) this.serverState.config.accessToken = tkInput.value.trim();
      this.saveLocalPersistentConfig(this.serverState.config);
      this.saveAllSettings(false);
    },

    renderAccountPresetsSelect() {
      const sel = document.getElementById("qqbot-account-preset-select");
      if (!sel || !this.serverState || !this.serverState.config) return;
      const presets = Array.isArray(this.serverState.config.accountPresets)
        ? this.serverState.config.accountPresets
        : [];
      const curSelfId = String(this.serverState.config.selfId || "").trim();
      const curToken = String(this.serverState.config.accessToken || "").trim();

      sel.innerHTML =
        '<option value="">选择已保存的QQ号与Token预设</option>' +
        presets
          .map((p) => {
            const label = `${p.name || "QQ预设"} · ${p.selfId || "未填QQ号"} · ${p.accessToken ? "含密钥" : "免密钥"}`;
            return `<option value="${this.escapeAttr(String(p.id))}">${this.escapeHtml(label)}</option>`;
          })
          .join("");

      const matched = presets.find(
        (p) =>
          (curSelfId && String(p.selfId) === curSelfId) ||
          (curToken && String(p.accessToken) === curToken),
      );
      if (matched) {
        sel.value = String(matched.id);
      }
    },

    onAccountPresetChange() {
      const sel = document.getElementById("qqbot-account-preset-select");
      if (!sel || !sel.value || !this.serverState || !this.serverState.config) {
        return;
      }
      const presets = Array.isArray(this.serverState.config.accountPresets)
        ? this.serverState.config.accountPresets
        : [];
      const found = presets.find((p) => String(p.id) === String(sel.value));
      if (!found) return;

      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");

      if (epInput && found.onebotUrl) epInput.value = found.onebotUrl;
      if (selfInput) selfInput.value = found.selfId || "";
      if (tkInput) tkInput.value = found.accessToken || "";

      this.serverState.config.onebotUrl =
        found.onebotUrl || "ws://127.0.0.1:3001";
      this.serverState.config.selfId = found.selfId || "";
      this.serverState.config.accessToken = found.accessToken || "";

      this.saveAllSettings(false);
      this.notify(`已切换预设 ${found.selfId || found.name}`);
    },

    async saveAccountPreset() {
      if (!this.serverState || !this.serverState.config) return;
      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");

      const onebotUrl =
        (epInput && epInput.value.trim()) || "ws://127.0.0.1:3001";
      const selfId = (selfInput && selfInput.value.trim()) || "";
      const accessToken = (tkInput && tkInput.value.trim()) || "";

      if (!selfId && !accessToken) {
        this.notify("请先填写QQ号或密钥再点存号");
        return;
      }

      if (!Array.isArray(this.serverState.config.accountPresets)) {
        this.serverState.config.accountPresets = [];
      }
      const presets = this.serverState.config.accountPresets;
      const existingIdx = presets.findIndex(
        (p) =>
          (selfId && String(p.selfId) === selfId) ||
          (!selfId && accessToken && String(p.accessToken) === accessToken),
      );

      const presetObj = {
        id:
          existingIdx >= 0
            ? presets[existingIdx].id
            : "acc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
        name: selfId ? `QQ ${selfId}` : "常用连接预设",
        selfId,
        accessToken,
        onebotUrl,
      };

      if (existingIdx >= 0) {
        presets[existingIdx] = presetObj;
      } else {
        presets.push(presetObj);
      }

      this.renderAccountPresetsSelect();
      const sel = document.getElementById("qqbot-account-preset-select");
      if (sel) sel.value = String(presetObj.id);
      await this.saveAllSettings(true);
      this.notify("已保存QQ号与Token预设");
    },

    async deleteAccountPreset() {
      if (!this.serverState || !this.serverState.config) return;
      const sel = document.getElementById("qqbot-account-preset-select");
      const targetId = sel ? sel.value : "";
      if (!targetId) {
        this.notify("请先在预设下拉框选择要删除的账号");
        return;
      }
      const presets = Array.isArray(this.serverState.config.accountPresets)
        ? this.serverState.config.accountPresets
        : [];
      this.serverState.config.accountPresets = presets.filter(
        (p) => String(p.id) !== String(targetId),
      );
      this.renderAccountPresetsSelect();
      await this.saveAllSettings(false);
      this.notify("已删除该账号预设");
    },

    /* ============================================================================
     * 群成员实时备注名解析：优先自定义备注 -> AI在QQ上改的好友备注或群名片 -> 角色卡名 -> QQ号
     * ============================================================================ */
    resolveMemberDisplayName(gCfg, senderId, fallbackName) {
      const sid = String(senderId || "").trim();
      const cleanFallback = String(fallbackName || "").trim();
      if (!gCfg) return cleanFallback || sid || "群友";

      if (!gCfg.memberRemarks) gCfg.memberRemarks = {};
      if (
        cleanFallback &&
        cleanFallback !== sid &&
        cleanFallback !== "群成员" &&
        cleanFallback !== "群友"
      ) {
        gCfg.memberRemarks[sid] = cleanFallback;
      }

      if (Array.isArray(gCfg.playerBindings)) {
        const bound = gCfg.playerBindings.find((b) => String(b.qq) === sid);
        if (bound) {
          if (
            cleanFallback &&
            cleanFallback !== sid &&
            cleanFallback !== "群成员"
          ) {
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
          dbRef.personaPresets
            ? dbRef.personaPresets.toArray().catch(() => [])
            : [],
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
          dbRef.userStickers
            ? dbRef.userStickers.toArray().catch(() => [])
            : [],
          dbRef.modules ? dbRef.modules.toArray().catch(() => []) : [],
          dbRef.moduleChapters
            ? dbRef.moduleChapters.toArray().catch(() => [])
            : [],
          dbRef.moduleImages
            ? dbRef.moduleImages.toArray().catch(() => [])
            : [],
          dbRef.apiConfig
            ? dbRef.apiConfig.get("main").catch(() => null)
            : null,
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
          '<option value="">选择世界书或直接在下方卡片点开关</option>' +
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
        const customCount =
          this.serverState &&
          this.serverState.config &&
          Array.isArray(this.serverState.config.customStickers)
            ? this.serverState.config.customStickers.length
            : 0;
        stEl.innerHTML =
          `<option value="ALL">全部可用表情包${customCount > 0 ? " · 含本地上传" + customCount + "张" : ""}</option>` +
          '<option value="CUSTOM">仅使用本页上传的表情包</option>' +
          '<option value="NONE">不自动发表情包</option>' +
          this.cachedResources.stickerCats
            .map(
              (c) =>
                `<option value="${this.escapeAttr(String(c.id))}">${this.escapeHtml(c.name || "分类")}</option>`,
            )
            .join("");
        if (cur) stEl.value = cur;
      }
      this.renderCustomStickersList();

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
      this.renderNaiPresetSelect();

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

    triggerStickerUpload() {
      const inp = document.getElementById("qqbot-sticker-file-input");
      if (inp) {
        inp.value = "";
        inp.click();
      }
    },

    async handleStickerFilesUpload(inputEl) {
      const files = inputEl && inputEl.files ? Array.from(inputEl.files) : [];
      if (files.length === 0) return;
      if (!this.serverState || !this.serverState.config) return;
      if (!Array.isArray(this.serverState.config.customStickers)) {
        this.serverState.config.customStickers = [];
      }

      let added = 0;
      for (const file of files) {
        try {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
          if (!dataUrl) continue;
          const rawName = String(file.name || "表情")
            .replace(/\.[^/.]+$/, "")
            .trim();
          const cleanName = rawName || "表情" + (added + 1);
          const item = {
            id: "cstk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            name: cleanName,
            meaning: cleanName,
            dataUrl,
            categoryId: "CUSTOM",
          };
          this.serverState.config.customStickers.push(item);
          if (window.db && window.db.userStickers) {
            try {
              await window.db.userStickers.add({
                name: cleanName,
                meaning: cleanName,
                url: dataUrl,
                dataUrl,
                categoryId: "CUSTOM",
              });
            } catch (_) {}
          }
          added++;
        } catch (_) {}
      }

      if (added > 0) {
        await this.refreshLocalResources();
        this.renderCustomStickersList();
        await this.saveAllSettings(false);
        this.notify(`已上传并保存 ${added} 张表情包`);
      }
    },

    async deleteCustomSticker(stickerId) {
      if (!this.serverState || !this.serverState.config) return;
      const list = Array.isArray(this.serverState.config.customStickers)
        ? this.serverState.config.customStickers
        : [];
      this.serverState.config.customStickers = list.filter(
        (s) => String(s.id) !== String(stickerId),
      );
      this.renderResourceSelects();
      this.renderCustomStickersList();
      await this.saveAllSettings(false);
      this.notify("已删除该表情包");
    },

    renderCustomStickersList() {
      const box = document.getElementById("qqbot-custom-stickers-box");
      if (!box) return;
      const customList =
        this.serverState &&
        this.serverState.config &&
        Array.isArray(this.serverState.config.customStickers)
          ? this.serverState.config.customStickers
          : [];
      if (customList.length === 0) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
      }
      box.style.display = "flex";
      box.innerHTML = customList
        .map(
          (s) => `
          <div style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 8px; background: var(--secondary-bg); border: 1px solid var(--border-color); max-width: 100%;">
            <img src="${this.escapeAttr(s.dataUrl || s.url || "")}" alt="" style="width: 26px; height: 26px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />
            <span style="font-size: 11px; color: var(--text-primary); max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(s.name || "表情")}</span>
            <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.deleteCustomSticker('${this.escapeAttr(s.id)}');}" style="height: 22px; padding: 0 6px; font-size: 10px; flex-shrink: 0;">删除</button>
          </div>
        `,
        )
        .join("");
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
     * 跑团模组分类与章节条目逐条开关 - 直观点击整行即可切换并自动保存
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
        this.notify("已切换跑团模组并保存");
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
      this.notify(enable ? "已全开模组章节并保存" : "已全关模组章节并保存");
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
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 2px;">在上方下拉框选择模组后，下方会自动列出所有章节卡片，点击任意一行即可开启或关闭该章节</div>';
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
        countEl.textContent = `已启用 ${activeCount} / ${allChaps.length} 章`;
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
              <div onclick="if(window.QQBotConsole){window.QQBotConsole.toggleModuleChapter('${this.escapeAttr(String(chap.id))}');}" style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; background: var(--card-bg); border: 1px solid ${isOn ? "var(--accent-color)" : "var(--border-color)"}; cursor: pointer;">
                <span style="width: 42px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${bBg}; color: ${bColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "启用" : "停用"}</span>
                <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--text-primary);">
                  <span style="font-weight: 700;">${this.escapeHtml(chap.title || "未命名章节")}</span>
                  <span style="font-size: 10.5px; color: var(--text-secondary); margin-left: 6px;">${wc}字</span>
                </div>
                <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleModuleChapter('${this.escapeAttr(String(chap.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "关闭" : "开启"}</button>
              </div>
            `;
          })
          .join("");

        htmlParts.push(`
          <div style="border-radius: 10px; border: 1px solid var(--border-color); background: var(--secondary-bg); overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 7px 10px; cursor: pointer;" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategoryFold('${this.escapeAttr(categoryName)}');}">
              <span style="width: 44px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${catBadgeBg}; color: ${catBadgeColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${enabledInCat}/${chaps.length}</span>
              <span style="flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(categoryName)}</span>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategory('${this.escapeAttr(categoryName)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isAllCatOn ? "全关" : "全开"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleModuleCategoryFold('${this.escapeAttr(categoryName)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isCollapsed ? "展开" : "收起"}</button>
            </div>
            <div style="display: ${isCollapsed ? "none" : "flex"}; flex-direction: column; gap: 5px; padding: 0 8px 8px;">
              ${rowsHtml}
            </div>
          </div>
        `);
      });

      listEl.innerHTML = htmlParts.join("");
    },

    /* ============================================================================
     * 世界书分类与条目直观卡片开关 - 点击整行即可开关并自动保存
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
        this.notify(`已开启全部${allBooks.length}个世界书条目`);
      } else if (val.startsWith("CAT:")) {
        const catId = val.slice(4);
        const matched = allBooks.filter(
          (b) => String(b.categoryId || "uncategorized") === String(catId),
        );
        matched.forEach((b) => set.add(String(b.id)));
        this.worldBookCollapsedMap[catId] = false;
        this.notify(`已开启该分类${matched.length}个世界书条目`);
      } else {
        set.add(String(val));
        const found = allBooks.find((b) => String(b.id) === String(val));
        if (found) {
          this.worldBookCollapsedMap[
            String(found.categoryId || "uncategorized")
          ] = false;
        }
        this.notify("已开启选中世界书条目");
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
      this.notify(enable ? "已全开世界书并保存" : "已全关世界书并保存");
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
      const countBadge = document.getElementById("qqbot-wb-active-count");
      const g = this.getCurrentGroupConfig();
      if (!container || !g) return;

      const allBooks = this.cachedResources.worldbooks || [];
      if (allBooks.length === 0) {
        if (countBadge) countBadge.textContent = "暂无世界书";
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px;">当前尚无世界书条目，可在世界书App中创建</div>';
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
      const totalEnabled = allBooks.filter((b) =>
        enabledSet.has(String(b.id)),
      ).length;
      if (countBadge) {
        countBadge.textContent = `已启用 ${totalEnabled} / ${allBooks.length} 条`;
      }

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
        categories.push({ id: "uncategorized", name: "默认世界书分类" });
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
              .slice(0, 38);
            return `
              <div onclick="if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookEntry('${this.escapeAttr(String(b.id))}');}" style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; background: var(--card-bg); border: 1px solid ${isOn ? "var(--accent-color)" : "var(--border-color)"}; cursor: pointer;">
                <span style="width: 42px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${bBg}; color: ${bColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "启用" : "停用"}</span>
                <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--text-primary);">
                  <span style="font-weight: 700;">${this.escapeHtml(b.name || "世界书条目")}</span>
                  <span style="color: var(--text-secondary); margin-left: 6px; font-size: 11px;">${this.escapeHtml(preview)}</span>
                </div>
                <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookEntry('${this.escapeAttr(String(b.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "关闭" : "开启"}</button>
              </div>
            `;
          })
          .join("");

        htmlParts.push(`
          <div style="border-radius: 10px; border: 1px solid var(--border-color); background: var(--secondary-bg); overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 7px 10px; cursor: pointer;" onclick="if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategoryFold('${this.escapeAttr(cat.id)}');}">
              <span style="width: 44px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${catBg}; color: ${catColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${onCount}/${books.length}</span>
              <span style="flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(cat.name)}</span>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategory('${this.escapeAttr(cat.id)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isAllOn ? "全关" : "全开"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleWorldBookCategoryFold('${this.escapeAttr(cat.id)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isCollapsed ? "展开" : "收起"}</button>
            </div>
            <div style="display: ${isCollapsed ? "none" : "flex"}; flex-direction: column; gap: 5px; padding: 0 8px 8px;">
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
     * NovelAI 生图提示词、末尾强制生图指令与预设管理
     * ============================================================================ */
    renderNaiPresetSelect() {
      const sel = document.getElementById("qqbot-nai-preset-select");
      if (!sel || !this.serverState || !this.serverState.config) return;
      const presets = Array.isArray(this.serverState.config.naiPresets)
        ? this.serverState.config.naiPresets
        : [];
      const curVal = sel.value;
      sel.innerHTML =
        '<option value="default">内置跑团与日常OC标准生图预设</option>' +
        presets
          .map(
            (p) =>
              `<option value="${this.escapeAttr(String(p.id))}">${this.escapeHtml(p.name || "自定义生图预设")}</option>`,
          )
          .join("");
      if (curVal && presets.some((p) => String(p.id) === String(curVal))) {
        sel.value = curVal;
      }
    },

    onNaiPresetSelectChange() {
      const sel = document.getElementById("qqbot-nai-preset-select");
      const g = this.getCurrentGroupConfig();
      if (!sel || !g) return;
      const val = sel.value;
      const def = getDefaultNaiPromptConfig();
      if (!val || val === "default") {
        g.naiPrefix = def.prefix;
        g.naiOcPrompt = def.ocPrompt;
        g.naiKpPrompt = def.kpPrompt;
      } else {
        const presets = Array.isArray(this.serverState?.config?.naiPresets)
          ? this.serverState.config.naiPresets
          : [];
        const found = presets.find((p) => String(p.id) === String(val));
        if (found) {
          g.naiPrefix = found.prefix || def.prefix;
          g.naiOcPrompt = found.ocPrompt || def.ocPrompt;
          g.naiKpPrompt = found.kpPrompt || def.kpPrompt;
        }
      }
      const prefEl = document.getElementById("qqbot-nai-prefix-input");
      const ocEl = document.getElementById("qqbot-nai-oc-prompt-input");
      const kpEl = document.getElementById("qqbot-nai-kp-prompt-input");
      if (prefEl) prefEl.value = g.naiPrefix;
      if (ocEl) ocEl.value = g.naiOcPrompt;
      if (kpEl) kpEl.value = g.naiKpPrompt;
      this.saveAllSettings(false);
      this.notify("已切换生图提示词预设");
    },

    async saveNaiPromptPreset() {
      if (!this.serverState || !this.serverState.config) return;
      this.onCurrentGroupFieldChange();
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const def = getDefaultNaiPromptConfig();
      const prefix = g.naiPrefix || def.prefix;
      const ocPrompt = g.naiOcPrompt || def.ocPrompt;
      const kpPrompt = g.naiKpPrompt || def.kpPrompt;

      if (!Array.isArray(this.serverState.config.naiPresets)) {
        this.serverState.config.naiPresets = [];
      }
      const idx = this.serverState.config.naiPresets.length + 1;
      const newPreset = {
        id: "naip_" + Date.now(),
        name: `生图预设 ${idx} · ${prefix.slice(0, 18)}`,
        prefix,
        ocPrompt,
        kpPrompt,
      };
      this.serverState.config.naiPresets.push(newPreset);
      this.renderNaiPresetSelect();
      const sel = document.getElementById("qqbot-nai-preset-select");
      if (sel) sel.value = newPreset.id;
      await this.saveAllSettings(true);
      this.notify("已保存生图指令预设");
    },

    async deleteNaiPromptPreset() {
      if (!this.serverState || !this.serverState.config) return;
      const sel = document.getElementById("qqbot-nai-preset-select");
      const val = sel ? sel.value : "";
      if (!val || val === "default") {
        this.notify("默认预设无需删除");
        return;
      }
      this.serverState.config.naiPresets = (
        this.serverState.config.naiPresets || []
      ).filter((p) => String(p.id) !== String(val));
      this.renderNaiPresetSelect();
      await this.saveAllSettings(false);
      this.notify("已删除该生图预设");
    },

    resetNaiPromptDefault() {
      const g = this.getCurrentGroupConfig();
      const def = getDefaultNaiPromptConfig();
      if (g) {
        g.naiPrefix = def.prefix;
        g.naiOcPrompt = def.ocPrompt;
        g.naiKpPrompt = def.kpPrompt;
      }
      const prefEl = document.getElementById("qqbot-nai-prefix-input");
      const ocEl = document.getElementById("qqbot-nai-oc-prompt-input");
      const kpEl = document.getElementById("qqbot-nai-kp-prompt-input");
      if (prefEl) prefEl.value = def.prefix;
      if (ocEl) ocEl.value = def.ocPrompt;
      if (kpEl) kpEl.value = def.kpPrompt;
      this.saveAllSettings(false);
      this.notify("已恢复默认生图指令与画质词");
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
        this.notify("已填入全局主API并保存");
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
        this.notify("已填入全局副API并保存");
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
     * 思维链预设加载与分类条目逐条开关
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
          <div onclick="if(window.QQBotConsole){window.QQBotConsole.toggleThoughtItem('${this.escapeAttr(String(item.id))}');}" style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: var(--card-bg); border: 1px solid ${isOn ? "var(--accent-color)" : "var(--border-color)"}; cursor: pointer;">
            <span style="width: 38px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "已开" : "已关"}</span>
            <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; color: var(--text-primary);">
              <span style="font-weight: 700;">${this.escapeHtml(titleStr)}</span>
              <span style="color: var(--text-secondary); margin-left: 4px;">${this.escapeHtml(contentPreview)}</span>
            </div>
            <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleThoughtItem('${this.escapeAttr(String(item.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
            <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.deleteThoughtItem('${this.escapeAttr(String(item.id))}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">移除</button>
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
      this.notify(enable ? "已全开思维链条目并保存" : "已全关思维链条目并保存");
    },

    toggleThoughtItem(itemId) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.thoughtItems)) return;
      const target = g.thoughtItems.find(
        (i) => String(i.id) === String(itemId),
      );
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
      this.notify("已新增思维链条目并保存");
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
     * 服务端、Termux 8765 与浏览器 localStorage 三重持久化同步（绝不丢失任何设置）
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
        try {
          const tRes = await fetch("http://127.0.0.1:8765/load", {
            signal: AbortSignal.timeout(1200),
          });
          if (tRes.ok) {
            this.termuxDiskAvailable = true;
            const parsed = await tRes.json();
            if (parsed && parsed.memory && typeof parsed.memory === "object") {
              this.staticFallbackMemory = {
                ...this.staticFallbackMemory,
                ...parsed.memory,
              };
            }
            if (parsed && parsed.logs && typeof parsed.logs === "object") {
              this.staticFallbackLogs = {
                ...this.staticFallbackLogs,
                ...parsed.logs,
              };
            }
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
            accountPresets: [],
            privateChats: {},
            naiPresets: [],
            visionCache: {},
            groups: {
              [defaultGid]: this.createDefaultGroupConfig(
                defaultGid,
                "八月二十二日跑团群",
              ),
            },
          },
        };
      }

      // 关键：将浏览器 localStorage 中永久保存的所有模块配置合并进来，防止重启后被默认数据覆盖
      this.mergeLocalPersistentIntoState();

      const data = this.serverState;
      const badge = document.getElementById("qqbot-conn-badge");
      if (badge && data.runtime) {
        badge.textContent = this.directWsConnected
          ? "Termux直连在线"
          : data.runtime.statusText || "本地待命";
      }

      const selfBadge = document.getElementById("qqbot-self-badge");
      if (selfBadge) {
        const sid =
          (data.runtime && data.runtime.selfId) ||
          (data.config && data.config.selfId) ||
          "";
        if (sid) {
          selfBadge.textContent = `在线QQ ${sid}`;
        }
      }

      if (populateInputs && data.config) {
        const epInput = document.getElementById("qqbot-endpoint-input");
        const selfInput = document.getElementById("qqbot-selfid-input");
        const tkInput = document.getElementById("qqbot-token-input");
        if (epInput && data.config.onebotUrl) {
          epInput.value = data.config.onebotUrl;
        }
        if (selfInput && data.config.selfId !== undefined) {
          selfInput.value = data.config.selfId;
        }
        if (tkInput && data.config.accessToken !== undefined) {
          tkInput.value = data.config.accessToken;
        }
        this.renderAccountPresetsSelect();
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
        const realGid = Object.keys(groupsObj).find((id) => id !== "88482026");
        this.currentGroupId = realGid || Object.keys(groupsObj)[0];
      }

      const privsObj = (data.config && data.config.privateChats) || {};
      const privIds = Object.keys(privsObj);
      if (
        privIds.length > 0 &&
        (!this.currentPrivateUserId || !privsObj[this.currentPrivateUserId])
      ) {
        this.currentPrivateUserId = privIds[0];
      }

      if (populateInputs) {
        this.renderMasterPauseUI();
        this.renderGroupSelectDropdown();
        this.renderVisualGroupList();
        this.populateCurrentGroupUI();
        this.renderPrivateChatsList();
        this.populateCurrentPrivateUI();
        await this.loadCurrentGroupMemoryUI();
      }
    },

    createDefaultGroupConfig(groupId, groupName) {
      const defNai = getDefaultNaiPromptConfig();
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
        naiMode: "trpg_every_round",
        naiPrefix: defNai.prefix,
        naiOcPrompt: defNai.ocPrompt,
        naiKpPrompt: defNai.kpPrompt,
        modImgMode: "auto",
        personaId: "",
        aiPersona:
          "你是一位经验丰富、沉稳自然的真人跑团守秘人KP兼群友。说话自然流畅，绝不说教，遇到单人向NPC搭话或独立行动时直接回应对应玩家，遇到全员关键节点时引导大家自然互动。",
        customPrompt:
          "单条消息保持自然分段气泡感，不要长篇大论刷屏；严格区分公开表象与私聊秘密线索。",
        thoughtChainId: "",
        thoughtItems: getDefaultThoughtChainItems(),
        worldBookId: "",
        enabledWorldBookIds: [],
        stickerCategoryId: "ALL",
        moduleId: "",
        chapterId: "ALL",
        selectedModuleChapterIds: [],
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
          const stateMark = g.enabled !== false ? "监听中" : "已停用";
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
      this.renderVisualGroupList();
    },

    renderVisualGroupList() {
      const container = document.getElementById("qqbot-visual-group-list");
      const badge = document.getElementById("qqbot-pulled-group-count");
      if (!container || !this.serverState || !this.serverState.config) return;
      const groups = this.serverState.config.groups || {};
      const entries = Object.values(groups);

      if (badge) {
        const activeCount = entries.filter((g) => g.enabled !== false).length;
        badge.textContent = `已启用 ${activeCount} / 共 ${entries.length} 群`;
      }

      if (entries.length === 0) {
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 6px;">暂未添加群聊，请点击顶部刷新按钮从QQ拉取群列表，或在下方输入群号点添加</div>';
        return;
      }

      container.innerHTML = entries
        .map((g) => {
          const isCurrent = String(g.groupId) === String(this.currentGroupId);
          const isOn = g.enabled !== false;
          const modeText = g.mode === "trpg" ? "守秘人KP" : "日常OC";
          const borderCol = isCurrent
            ? "var(--accent-color)"
            : "var(--border-color)";
          const cardBg = isCurrent ? "var(--card-bg)" : "var(--secondary-bg)";
          const statusBg = isOn ? "var(--accent-color)" : "var(--card-bg)";
          const statusColor = isOn ? "#ffffff" : "var(--text-secondary)";

          return `
            <div onclick="if(window.QQBotConsole){window.QQBotConsole.selectGroupFromCard('${this.escapeAttr(g.groupId)}');}" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: ${cardBg}; border: 1.5px solid ${borderCol}; cursor: pointer;">
              <span style="width: 44px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "监听" : "停用"}</span>
              <div style="flex: 1; min-width: 0; overflow: hidden;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(g.groupName || "QQ群")}</span>
                  ${isCurrent ? '<span style="font-size: 10px; color: var(--accent-color); font-weight: 700; flex-shrink: 0;">当前选中</span>' : ""}
                </div>
                <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">
                  群号 ${this.escapeHtml(g.groupId)} · ${modeText} · 缓冲 ${g.debounceSec || 8}秒
                </div>
              </div>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.toggleGroupEnabledFromCard('${this.escapeAttr(g.groupId)}');}" style="height: 26px; padding: 0 9px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.deleteGroupFromCard('${this.escapeAttr(g.groupId)}');}" style="height: 26px; padding: 0 9px; font-size: 11px; flex-shrink: 0;">移除</button>
            </div>
          `;
        })
        .join("");
    },

    async selectGroupFromCard(gid) {
      if (!gid || !this.serverState || !this.serverState.config) return;
      this.currentGroupId = String(gid);
      this.renderGroupSelectDropdown();
      this.populateCurrentGroupUI();
      this.saveAllSettings(false);
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
      this.syncRecentHistoryFromOneBot(this.currentGroupId, true).catch(() => {});
      this.notify(`已选中群 ${this.serverState.config.groups[gid]?.groupName || gid}`);
    },

    async toggleGroupEnabledFromCard(gid) {
      if (
        !gid ||
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.groups[gid]
      ) {
        return;
      }
      const g = this.serverState.config.groups[gid];
      g.enabled = g.enabled === false;
      if (!g.enabled) {
        if (this.groupDebounceTimers && this.groupDebounceTimers[gid]) {
          clearTimeout(this.groupDebounceTimers[gid]);
          delete this.groupDebounceTimers[gid];
        }
        if (this.pendingRerunGroups) {
          delete this.pendingRerunGroups[gid];
        }
      }
      this.renderGroupSelectDropdown();
      if (String(gid) === String(this.currentGroupId)) {
        const enSel = document.getElementById("qqbot-group-enabled-select");
        if (enSel) enSel.value = g.enabled ? "true" : "false";
      }
      await this.saveAllSettings(false);
      this.notify(
        `${g.groupName || gid} 已${g.enabled ? "开启监听" : "停用监听"}`,
      );
    },

    async deleteGroupFromCard(gid) {
      if (
        !gid ||
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.groups
      ) {
        return;
      }
      const groups = this.serverState.config.groups;
      if (Object.keys(groups).length <= 1) {
        this.notify("至少保留一个群聊配置");
        return;
      }
      delete groups[gid];
      if (String(this.currentGroupId) === String(gid)) {
        this.currentGroupId = Object.keys(groups)[0] || "";
      }
      this.renderGroupSelectDropdown();
      this.populateCurrentGroupUI();
      await this.saveAllSettings(false, { replaceGroups: true });
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
      this.notify("已移除该群聊并保存");
    },

    populateCurrentGroupUI() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const defNai = getDefaultNaiPromptConfig();

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = String(val);
      };

      const dashGroup = document.getElementById("qqbot-dash-group-name");
      if (dashGroup) dashGroup.textContent = g.groupName || g.groupId;

      setVal(
        "qqbot-group-enabled-select",
        g.enabled !== false ? "true" : "false",
      );
      setVal("qqbot-group-mode-select", g.mode || "trpg");
      setVal("qqbot-debounce-input", g.debounceSec ?? 8);
      setVal("qqbot-context-limit-input", g.contextLimit ?? 180);
      setVal("qqbot-idle-ask-input", g.idleAskMin ?? 15);
      setVal("qqbot-cooldown-input", g.cooldownSec ?? 5);
      setVal("qqbot-ai-persona-input", g.aiPersona || g.customPersona || "");
      setVal("qqbot-custom-prompt-input", g.customPrompt || "");

      const resolvedNaiMode =
        g.naiMode || (g.autoNaiImage === false ? "off" : "trpg_every_round");
      setVal("qqbot-nai-mode", resolvedNaiMode);
      setVal("qqbot-nai-prefix-input", g.naiPrefix || defNai.prefix);
      setVal("qqbot-nai-oc-prompt-input", g.naiOcPrompt || defNai.ocPrompt);
      setVal("qqbot-nai-kp-prompt-input", g.naiKpPrompt || defNai.kpPrompt);
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
      const defNai = getDefaultNaiPromptConfig();

      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
      };

      g.enabled = getVal("qqbot-group-enabled-select", "true") === "true";
      if (!g.enabled && this.currentGroupId) {
        if (this.groupDebounceTimers && this.groupDebounceTimers[this.currentGroupId]) {
          clearTimeout(this.groupDebounceTimers[this.currentGroupId]);
          delete this.groupDebounceTimers[this.currentGroupId];
        }
        if (this.pendingRerunGroups) {
          delete this.pendingRerunGroups[this.currentGroupId];
        }
      }
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
      g.naiMode = getVal("qqbot-nai-mode", "trpg_every_round");
      g.autoNaiImage = g.naiMode !== "off";
      g.naiPrefix = getVal("qqbot-nai-prefix-input", defNai.prefix);
      g.naiOcPrompt = getVal("qqbot-nai-oc-prompt-input", defNai.ocPrompt);
      g.naiKpPrompt = getVal("qqbot-nai-kp-prompt-input", defNai.kpPrompt);
      g.modImgMode = getVal("qqbot-modimg-mode", "auto");

      this.renderGroupSelectDropdown();
      this.saveAllSettings(false);
    },

    async onGroupSelectChange() {
      const sel = document.getElementById("qqbot-group-select");
      if (!sel) return;
      this.currentGroupId = sel.value;
      this.renderVisualGroupList();
      this.populateCurrentGroupUI();
      this.saveAllSettings(false);
      await this.loadCurrentGroupMemoryUI();
      await this.refreshSandboxLog();
      this.syncRecentHistoryFromOneBot(this.currentGroupId, true).catch(() => {});
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
     * 独立好友小窗列表管理：拉友、筛除、单人等待秒数、副AI阅读判断并唤醒主AI回复
     * ============================================================================ */
    getCurrentPrivateConfig() {
      if (
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.privateChats
      ) {
        return null;
      }
      if (!this.currentPrivateUserId) return null;
      return (
        this.serverState.config.privateChats[this.currentPrivateUserId] || null
      );
    },

    renderPrivateChatsList() {
      const container = document.getElementById("qqbot-private-chats-list");
      const badge = document.getElementById("qqbot-private-count-badge");
      if (!container || !this.serverState || !this.serverState.config) return;
      const privMap = this.serverState.config.privateChats || {};
      const entries = Object.values(privMap);

      if (badge) {
        const enabledCount = entries.filter((p) => p.enabled !== false).length;
        badge.textContent = `启用 ${enabledCount} / 共 ${entries.length} 人`;
      }

      if (entries.length === 0) {
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 8px;">暂未添加小窗好友，可点击右上角「拉友」一键拉取全部QQ好友并自由删减不需要的人，也可在上方输入好友QQ号点添加</div>';
        return;
      }

      container.innerHTML = entries
        .map((p) => {
          const uid = String(p.userId || "");
          const isCurrent = uid === String(this.currentPrivateUserId);
          const isOn = p.enabled !== false;
          const dispName = p.remark || p.nickname || uid;
          const waitSec = Math.max(2, Number(p.waitSec) || 30);
          const borderCol = isCurrent
            ? "var(--accent-color)"
            : "var(--border-color)";
          const cardBg = isCurrent ? "var(--card-bg)" : "var(--secondary-bg)";
          const stBg = isOn ? "var(--accent-color)" : "var(--card-bg)";
          const stColor = isOn ? "#ffffff" : "var(--text-secondary)";

          return `
            <div onclick="if(window.QQBotConsole){window.QQBotConsole.selectPrivateChat('${this.escapeAttr(uid)}');}" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: ${cardBg}; border: 1.5px solid ${borderCol}; cursor: pointer;">
              <span style="width: 44px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: ${stBg}; color: ${stColor}; border: 1px solid var(--border-color); font-size: 10.5px; font-weight: 700; flex-shrink: 0;">${isOn ? "监听" : "停用"}</span>
              <div style="flex: 1; min-width: 0; overflow: hidden;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(dispName)}</span>
                  <span style="font-size: 10.5px; color: var(--text-secondary);">QQ ${this.escapeHtml(uid)}</span>
                </div>
                <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  等待 ${waitSec} 秒后唤醒副AI判断${p.persona ? " · 含专属设定：" + this.escapeHtml(p.persona.slice(0, 18)) : ""}
                </div>
              </div>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.togglePrivateChatEnabled('${this.escapeAttr(uid)}');}" style="height: 26px; padding: 0 9px; font-size: 11px; flex-shrink: 0;">${isOn ? "停用" : "启用"}</button>
              <button type="button" class="mod-capsule-btn" onclick="event.stopPropagation();if(window.QQBotConsole){window.QQBotConsole.deletePrivateChat('${this.escapeAttr(uid)}');}" style="height: 26px; padding: 0 9px; font-size: 11px; flex-shrink: 0;">移除</button>
            </div>
          `;
        })
        .join("");
    },

    selectPrivateChat(uid) {
      if (!uid || !this.serverState || !this.serverState.config) return;
      this.currentPrivateUserId = String(uid);
      this.renderPrivateChatsList();
      this.populateCurrentPrivateUI();
      this.saveAllSettings(false);
    },

    populateCurrentPrivateUI() {
      const p = this.getCurrentPrivateConfig();
      const nameBadge = document.getElementById("qqbot-priv-selected-name");
      const enSel = document.getElementById("qqbot-priv-enabled-select");
      const waitIn = document.getElementById("qqbot-priv-wait-input");
      const userPerIn = document.getElementById("qqbot-priv-user-persona");
      const aiPerIn = document.getElementById("qqbot-priv-ai-persona");
      const legacyPerIn = document.getElementById("qqbot-priv-persona-input");

      if (!p) {
        if (nameBadge) nameBadge.textContent = "未选中好友";
        if (enSel) enSel.value = "true";
        if (waitIn) waitIn.value = "30";
        if (userPerIn) userPerIn.value = "";
        if (aiPerIn) aiPerIn.value = "";
        if (legacyPerIn) legacyPerIn.value = "";
        return;
      }

      if (nameBadge) {
        nameBadge.textContent = `${p.remark || p.nickname || p.userId} · ${p.userId}`;
      }
      if (enSel) enSel.value = p.enabled !== false ? "true" : "false";
      if (waitIn) waitIn.value = String(p.waitSec ?? 30);
      if (userPerIn) userPerIn.value = p.userPersona || p.persona || "";
      if (aiPerIn) aiPerIn.value = p.aiPersona || "";
      if (legacyPerIn) legacyPerIn.value = p.persona || "";
    },

    onCurrentPrivateFieldChange() {
      const p = this.getCurrentPrivateConfig();
      if (!p) return;
      const enSel = document.getElementById("qqbot-priv-enabled-select");
      const waitIn = document.getElementById("qqbot-priv-wait-input");
      const userPerIn = document.getElementById("qqbot-priv-user-persona");
      const aiPerIn = document.getElementById("qqbot-priv-ai-persona");
      const legacyPerIn = document.getElementById("qqbot-priv-persona-input");

      if (enSel) {
        p.enabled = enSel.value === "true";
        if (!p.enabled && p.userId && this.privateDebounceTimers) {
          clearTimeout(this.privateDebounceTimers[p.userId]);
          delete this.privateDebounceTimers[p.userId];
        }
      }
      if (waitIn) {
        p.waitSec = Math.max(2, parseInt(waitIn.value, 10) || 30);
      }
      if (userPerIn) {
        p.userPersona = userPerIn.value.trim();
        p.persona = p.userPersona;
      } else if (legacyPerIn) {
        p.persona = legacyPerIn.value.trim();
      }
      if (aiPerIn) {
        p.aiPersona = aiPerIn.value.trim();
      }

      this.renderPrivateChatsList();
      this.saveAllSettings(false);
    },

    async addOrSelectPrivateChat() {
      const qqEl =
        document.getElementById("qqbot-new-priv-id") ||
        document.getElementById("qqbot-new-priv-qq");
      const nameEl = document.getElementById("qqbot-new-priv-name");
      const waitEl =
        document.getElementById("qqbot-priv-wait-input") ||
        document.getElementById("qqbot-new-priv-wait");

      const uid = qqEl ? qqEl.value.trim() : "";
      const rem = nameEl ? nameEl.value.trim() : "";
      const waitSec = Math.max(
        2,
        parseInt(waitEl ? waitEl.value : "30", 10) || 30,
      );

      if (!uid) {
        this.notify("请先输入好友QQ号");
        return;
      }
      if (!this.serverState || !this.serverState.config) return;
      if (!this.serverState.config.privateChats) {
        this.serverState.config.privateChats = {};
      }
      const existing = this.serverState.config.privateChats[uid];
      this.serverState.config.privateChats[uid] = {
        userId: uid,
        nickname: rem || (existing && existing.nickname) || uid,
        remark: rem || (existing && existing.remark) || uid,
        enabled: true,
        waitSec,
        persona: (existing && existing.persona) || "",
        userPersona: (existing && existing.userPersona) || "",
        aiPersona: (existing && existing.aiPersona) || "",
      };
      this.currentPrivateUserId = uid;
      if (qqEl) qqEl.value = "";
      if (nameEl) nameEl.value = "";
      this.renderPrivateChatsList();
      this.populateCurrentPrivateUI();
      await this.saveAllSettings(true);
      this.notify(`已添加小窗好友 ${rem || uid}`);
    },

    async togglePrivateChatEnabled(uid) {
      if (
        !uid ||
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.privateChats ||
        !this.serverState.config.privateChats[uid]
      ) {
        return;
      }
      const p = this.serverState.config.privateChats[uid];
      p.enabled = p.enabled === false;
      this.renderPrivateChatsList();
      if (String(uid) === String(this.currentPrivateUserId)) {
        this.populateCurrentPrivateUI();
      }
      await this.saveAllSettings(false);
    },

    async deletePrivateChat(uid) {
      if (
        !uid ||
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.privateChats
      ) {
        return;
      }
      delete this.serverState.config.privateChats[uid];
      if (String(this.currentPrivateUserId) === String(uid)) {
        this.currentPrivateUserId =
          Object.keys(this.serverState.config.privateChats)[0] || "";
      }
      this.renderPrivateChatsList();
      this.populateCurrentPrivateUI();
      await this.saveAllSettings(false, { replacePrivateChats: true });
      this.notify("已移除该好友小窗");
    },

    async pruneDisabledPrivateChats() {
      if (
        !this.serverState ||
        !this.serverState.config ||
        !this.serverState.config.privateChats
      ) {
        return;
      }
      const privs = this.serverState.config.privateChats;
      let removed = 0;
      for (const uid of Object.keys(privs)) {
        if (privs[uid] && privs[uid].enabled === false) {
          delete privs[uid];
          removed++;
        }
      }
      if (!privs[this.currentPrivateUserId]) {
        this.currentPrivateUserId = Object.keys(privs)[0] || "";
      }
      this.renderPrivateChatsList();
      this.populateCurrentPrivateUI();
      await this.saveAllSettings(false, { replacePrivateChats: true });
      this.notify(
        removed > 0
          ? `已清理 ${removed} 个停用小窗好友`
          : "当前没有处于停用状态的好友",
      );
    },

    async pullAllFriendsForPrivate() {
      const btn = document.getElementById("qqbot-pull-friends-btn");
      if (btn) btn.textContent = "拉取中";
      this.notify("正在拉取QQ好友列表...");
      try {
        if (!this.serverState || !this.serverState.config) return;
        if (!this.serverState.config.privateChats) {
          this.serverState.config.privateChats = {};
        }
        const privs = this.serverState.config.privateChats;
        let pulledCount = 0;

        if (this.directWsConnected && this.directWs) {
          try {
            const list = await this.callDirectOneBotWs("get_friend_list", {});
            if (Array.isArray(list) && list.length > 0) {
              const selfId = String(this.serverState.config.selfId || "");
              list.forEach((f) => {
                const uid = String(f.user_id || "");
                if (!uid || (selfId && uid === selfId)) return;
                const nick = String(f.nickname || uid).trim();
                const rem = String(f.remark || nick || uid).trim();
                if (!privs[uid]) {
                  privs[uid] = {
                    userId: uid,
                    nickname: nick,
                    remark: rem,
                    enabled: true,
                    waitSec: 30,
                    persona: "",
                  };
                } else {
                  privs[uid].nickname = nick;
                  if (!privs[uid].remark || privs[uid].remark === uid) {
                    privs[uid].remark = rem;
                  }
                }
                pulledCount++;
              });
            }
          } catch (_) {}
        }

        if (pulledCount === 0) {
          try {
            const res = await fetch("/api/qqbot/refresh-friends", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.privateChats) {
                Object.assign(privs, data.privateChats);
                pulledCount = Object.keys(data.privateChats).length;
              }
            }
          } catch (_) {}
        }

        if (!this.currentPrivateUserId && Object.keys(privs).length > 0) {
          this.currentPrivateUserId = Object.keys(privs)[0];
        }
        this.renderPrivateChatsList();
        this.populateCurrentPrivateUI();
        await this.saveAllSettings(false);
        if (pulledCount > 0) {
          this.notify(`已拉取 ${pulledCount} 位QQ好友小窗`);
        } else {
          this.notify("请先连上3001端口或手动输入QQ号添加好友");
        }
      } finally {
        if (btn) btn.textContent = "拉友";
      }
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

    collectCurrentDomFields() {
      if (!this.serverState || !this.serverState.config) return;
      const g = this.getCurrentGroupConfig();
      if (g) {
        const getVal = (id) => {
          const el = document.getElementById(id);
          return el ? el.value : null;
        };
        const enVal =
          getVal("qqbot-group-enabled-select") ?? getVal("qqbot-group-enabled");
        if (enVal !== null) g.enabled = enVal === "true";
        const modeVal =
          getVal("qqbot-group-mode-select") ?? getVal("qqbot-group-mode");
        if (modeVal) g.mode = modeVal;
        const debVal =
          getVal("qqbot-debounce-input") ?? getVal("qqbot-debounce-sec");
        if (debVal !== null && debVal !== "") g.debounceSec = Number(debVal) || 8;
        const ctxVal =
          getVal("qqbot-context-limit-input") ?? getVal("qqbot-context-limit");
        if (ctxVal !== null && ctxVal !== "") g.contextLimit = Number(ctxVal) || 180;
        const idleVal =
          getVal("qqbot-idle-ask-input") ?? getVal("qqbot-idle-ask-min");
        if (idleVal !== null && idleVal !== "") g.idleAskMin = Number(idleVal) || 0;
        const coolVal =
          getVal("qqbot-cooldown-input") ?? getVal("qqbot-cooldown-sec");
        if (coolVal !== null && coolVal !== "") g.cooldownSec = Number(coolVal) || 5;
        const perSel = getVal("qqbot-persona-select");
        if (perSel !== null) g.personaId = perSel;
        const stkSel =
          getVal("qqbot-sticker-select") ?? getVal("qqbot-sticker-cat-select");
        if (stkSel !== null) g.stickerCategoryId = stkSel;
        const aiPer = getVal("qqbot-ai-persona-input");
        if (aiPer !== null) g.aiPersona = aiPer.trim();
        const cusPr = getVal("qqbot-custom-prompt-input");
        if (cusPr !== null) g.customPrompt = cusPr.trim();
        const wbSel = getVal("qqbot-worldbook-select");
        if (wbSel !== null) g.worldBookId = wbSel;
        const modSel = getVal("qqbot-module-select");
        if (modSel !== null) g.moduleId = modSel;
        const chapSel = getVal("qqbot-chapter-select");
        if (chapSel !== null) g.chapterId = chapSel;
        const naiSel =
          getVal("qqbot-nai-mode") ?? getVal("qqbot-nai-image-select");
        if (naiSel) {
          g.naiMode = naiSel;
          g.autoNaiImage = naiSel !== "off";
        }
        const naiPre = getVal("qqbot-nai-prefix-input");
        if (naiPre !== null) g.naiPrefix = naiPre.trim();
        const naiOc = getVal("qqbot-nai-oc-prompt-input");
        if (naiOc !== null) g.naiOcPrompt = naiOc.trim();
        const naiKp = getVal("qqbot-nai-kp-prompt-input");
        if (naiKp !== null) g.naiKpPrompt = naiKp.trim();
      }

      const pCfg = this.getCurrentPrivateConfig();
      if (pCfg) {
        const pWait = document.getElementById("qqbot-priv-wait-input");
        const pEn = document.getElementById("qqbot-priv-enabled-select");
        const pUserPersona = document.getElementById("qqbot-priv-user-persona");
        const pAiPersona = document.getElementById("qqbot-priv-ai-persona");
        const pLegacyPersona = document.getElementById("qqbot-priv-persona-input");
        if (pWait && pWait.value !== "") {
          pCfg.waitSec = Math.max(2, Math.min(3600, Number(pWait.value) || 30));
        }
        if (pEn) pCfg.enabled = pEn.value === "true";
        if (pUserPersona) {
          pCfg.userPersona = pUserPersona.value.trim();
          pCfg.persona = pCfg.userPersona;
        } else if (pLegacyPersona) {
          pCfg.persona = pLegacyPersona.value.trim();
        }
        if (pAiPersona) {
          pCfg.aiPersona = pAiPersona.value.trim();
        }
      }
    },

    async saveAllSettings(showToast = false, extraFlags = {}) {
      if (!this.serverState || !this.serverState.config) return;
      this.collectCurrentDomFields();

      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const rawUrl = epInput
        ? epInput.value.trim()
        : this.serverState.config.onebotUrl || "ws://127.0.0.1:3001";
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
        selfId: selfInput
          ? selfInput.value.trim()
          : this.serverState.config.selfId || "",
        accessToken: tkInput
          ? tkInput.value.trim()
          : this.serverState.config.accessToken || "",
        globalPaused: Boolean(this.serverState.config.globalPaused),
        accountPresets: Array.isArray(this.serverState.config.accountPresets)
          ? this.serverState.config.accountPresets
          : [],
        mainApi: {
          url:
            getVal("qqbot-main-api-url") ||
            (this.serverState.config.mainApi &&
              this.serverState.config.mainApi.url) ||
            "",
          apiKey:
            getVal("qqbot-main-api-key") ||
            (this.serverState.config.mainApi &&
              this.serverState.config.mainApi.apiKey) ||
            "",
          model:
            getVal("qqbot-main-api-model") ||
            (this.serverState.config.mainApi &&
              this.serverState.config.mainApi.model) ||
            "",
        },
        subApi: {
          url:
            getVal("qqbot-sub-api-url") ||
            (this.serverState.config.subApi &&
              this.serverState.config.subApi.url) ||
            "",
          apiKey:
            getVal("qqbot-sub-api-key") ||
            (this.serverState.config.subApi &&
              this.serverState.config.subApi.apiKey) ||
            "",
          model:
            getVal("qqbot-sub-api-model") ||
            (this.serverState.config.subApi &&
              this.serverState.config.subApi.model) ||
            "",
        },
        groups: this.serverState.config.groups || {},
        privateChats: this.serverState.config.privateChats || {},
        naiPresets: Array.isArray(this.serverState.config.naiPresets)
          ? this.serverState.config.naiPresets
          : [],
        customStickers: Array.isArray(this.serverState.config.customStickers)
          ? this.serverState.config.customStickers
          : [],
        visionCache: this.serverState.config.visionCache || {},
        ...extraFlags,
      };

      this.serverState.config = {
        ...this.serverState.config,
        ...payload,
      };

      // 1. 立即同步写入浏览器本地持久层，确保关掉网页或重启手机后 100% 保留
      this.saveLocalPersistentConfig(this.serverState.config);

      // 2. 同步写入后端磁盘
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
            this.serverState.config = {
              ...data.config,
              ...this.serverState.config,
            };
            this.saveLocalPersistentConfig(this.serverState.config);
            savedBackend = true;
          }
        }
      } catch (_) {}

      // 3. 同时同步到手机 Termux 8765 磁盘减负服务
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
        this.notify(savedBackend ? "全部设定已永久保存" : "已永久保存在本机");
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

    async ensureAutoDirectWsConnection() {
      if (
        this.directWsConnected &&
        this.directWs &&
        this.directWs.readyState === 1
      ) {
        return true;
      }
      if (this.isConnectingDirectWs) return false;
      const epInput = document.getElementById("qqbot-endpoint-input");
      const tkInput = document.getElementById("qqbot-token-input");
      const cfg = (this.serverState && this.serverState.config) || {};
      const rawUrl =
        (epInput && epInput.value.trim()) ||
        cfg.onebotUrl ||
        "ws://127.0.0.1:3001";
      const token =
        (tkInput && tkInput.value.trim()) || cfg.accessToken || "";
      if (
        (rawUrl.startsWith("ws://") || rawUrl.startsWith("wss://")) &&
        !rawUrl.includes("/api/qqbot/ws")
      ) {
        return await this.connectBrowserDirectWs(rawUrl, token, true);
      }
      return false;
    },

    async connectBrowserDirectWs(wsUrl, token, silent = false) {
      if (this.isConnectingDirectWs) return false;
      this.isConnectingDirectWs = true;
      try {
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

        const tokenVariants = token ? [token, ""] : [""];

        let connectedWs = null;
        for (const candidateUrl of candidates) {
          for (const tk of tokenVariants) {
            connectedWs = await this.trySingleBrowserWs(candidateUrl, tk);
            if (connectedWs) break;
          }
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
            if (selfBadge) selfBadge.textContent = "重连3001中";
            const connBadge = document.getElementById("qqbot-conn-badge");
            if (connBadge) connBadge.textContent = "等待重连3001";
            this.appendDebugLog(
              "连接断开",
              "与手机Termux 3001端口连接已断开，后台将每3秒自动重连",
              true,
            );
          }
        };

        if (!silent) {
          this.notify("手机Termux直连成功");
        }
        const selfBadge = document.getElementById("qqbot-self-badge");
        if (selfBadge) selfBadge.textContent = "已连3001";
        const connBadge = document.getElementById("qqbot-conn-badge");
        if (connBadge) connBadge.textContent = "Termux直连在线";
        this.updateConnDetail(
          "已成功连通手机Termux NapCat 3001端口，正在实时监听QQ群聊与好友小窗消息...",
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
              `已成功连接 Termux NapCat · 登录QQ：${info.nickname || ""} ${info.user_id} · 群聊与小窗实时监听已启动`,
              true,
            );
            this.appendDebugLog(
              "连接就绪",
              `已连上 Termux 3001 端口，当前登录QQ：${info.nickname || ""} ${info.user_id}`,
              false,
            );
          }
        } catch (_) {
          this.appendDebugLog(
            "连接就绪",
            "已连上 Termux 3001 端口，实时群聊与小窗监听已启动",
            false,
          );
        }

        this.refreshOneBotGroups(true).catch(() => {});
        this.syncRecentHistoryFromOneBot(this.currentGroupId, true).catch(() => {});

        return true;
      } finally {
        this.isConnectingDirectWs = false;
      }
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

    unescapeCqStr(str) {
      return String(str || "")
        .replace(/&amp;/g, "&")
        .replace(/&#91;/g, "[")
        .replace(/&#93;/g, "]")
        .replace(/&#44;/g, ",")
        .trim();
    },

    parseOneBotGroupMessage(data) {
      let replyId = "";
      let textParts = [];
      const imageUrls = [];
      const imageFiles = [];

      if (Array.isArray(data.message)) {
        for (const seg of data.message) {
          if (!seg || typeof seg !== "object") continue;
          if (seg.type === "text") {
            textParts.push(String((seg.data && seg.data.text) || ""));
          } else if (seg.type === "reply") {
            replyId = String((seg.data && seg.data.id) || "");
          } else if (seg.type === "at") {
            const qq = (seg.data && seg.data.qq) || "";
            textParts.push(`@${qq} `);
          } else if (seg.type === "image" || seg.type === "mface") {
            const u = this.unescapeCqStr((seg.data && seg.data.url) || "");
            const f = String((seg.data && seg.data.file) || "").trim();
            if (u && !imageUrls.includes(u)) imageUrls.push(u);
            if (f && !imageFiles.includes(f)) imageFiles.push(f);
            const sum = String((seg.data && seg.data.summary) || "").trim();
            const label =
              sum && sum !== "[图片]" && sum !== "[动画表情]"
                ? sum
                : "聊天图片";
            textParts.push(`[发送了图片：${label}]`);
          } else if (seg.type === "face") {
            textParts.push(`[QQ表情${(seg.data && seg.data.id) || ""}]`);
          }
        }
      }

      const rawStr = String(
        data.raw_message ||
          (typeof data.message === "string" ? data.message : "") ||
          "",
      );
      if (rawStr) {
        const cqImgRegex = /\[CQ:image,([^\]]+)\]/g;
        let m;
        while ((m = cqImgRegex.exec(rawStr)) !== null) {
          const paramsStr = m[1];
          const urlMatch = paramsStr.match(/(?:^|,)url=([^,\]]+)/);
          const fileMatch = paramsStr.match(/(?:^|,)file=([^,\]]+)/);
          if (urlMatch && urlMatch[1]) {
            const u = this.unescapeCqStr(urlMatch[1]);
            if (u && !imageUrls.includes(u)) imageUrls.push(u);
          }
          if (fileMatch && fileMatch[1]) {
            const f = this.unescapeCqStr(fileMatch[1]);
            if (f && !imageFiles.includes(f)) imageFiles.push(f);
          }
        }
      }

      if (!Array.isArray(data.message) && rawStr) {
        const repMatch = rawStr.match(/\[CQ:reply,id=([^\],]+)\]/);
        if (repMatch) replyId = repMatch[1];
        const cleaned = rawStr
          .replace(/\[CQ:reply,id=[^\]]+\]/g, "")
          .replace(/\[CQ:at,qq=([^\],]+)[^\]]*\]/g, "@$1 ")
          .replace(
            /\[CQ:image,[^\]]*summary=([^,\]]+)[^\]]*\]/g,
            "[发送了图片：$1]",
          )
          .replace(/\[CQ:image,[^\]]+\]/g, "[发送了图片]");
        textParts.push(cleaned);
      }

      const finalText =
        textParts.join("").trim() ||
        (imageUrls.length > 0 || imageFiles.length > 0 ? "[发送了图片]" : "");

      return {
        text: finalText,
        replyId,
        imageUrls,
        imageFiles,
      };
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

      if (data.self_id && this.serverState && this.serverState.config) {
        this.serverState.config.selfId = String(data.self_id);
      }

      // 1. 处理好友小窗私聊消息
      if (data.post_type === "message" && data.message_type === "private") {
        const senderId = String(
          data.user_id || (data.sender && data.sender.user_id) || "",
        );
        if (!senderId) return;
        const selfId =
          String(data.self_id || "") ||
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

        const parsed = this.parseOneBotGroupMessage(data);
        if (
          !parsed.text &&
          parsed.imageUrls.length === 0 &&
          parsed.imageFiles.length === 0
        ) {
          return;
        }

        if (!this.serverState) {
          await this.syncFromServer(false);
        }
        if (!this.serverState.config.privateChats) {
          this.serverState.config.privateChats = {};
        }
        if (!this.serverState.config.privateChats[senderId]) {
          this.serverState.config.privateChats[senderId] = {
            userId: senderId,
            nickname: rawRemark || "好友 " + senderId,
            remark: rawRemark || "",
            enabled: true,
            waitSec: 30,
            persona: "",
          };
          this.renderPrivateChatsList();
          await this.saveAllSettings(false);
        }

        const pCfg = this.serverState.config.privateChats[senderId];
        const dispName = pCfg.remark || pCfg.nickname || rawRemark || senderId;
        const logKey = "priv_" + senderId;
        const msgId = String(data.message_id || "pmsg_" + Date.now());
        const msgObj = {
          messageId: msgId,
          groupId: logKey,
          userId: senderId,
          senderId,
          senderName: dispName,
          qqRemark: dispName,
          rawMessage: parsed.text,
          content: parsed.text,
          replyId: parsed.replyId || "",
          imageUrls: parsed.imageUrls || [],
          imageFiles: parsed.imageFiles || [],
          visionDescription: "",
          visionRecognized: false,
          isSelf: false,
          timestamp: data.time ? Number(data.time) * 1000 : Date.now(),
        };

        this.appendStaticMessage(logKey, msgObj);

        fetch("/api/qqbot/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).catch(() => {});

        const imgTip =
          parsed.imageUrls.length > 0 || parsed.imageFiles.length > 0
            ? ` · 附带 ${Math.max(parsed.imageUrls.length, parsed.imageFiles.length)} 张图片`
            : "";
        this.appendDebugLog(
          "小窗消息",
          `好友「${dispName}」：${parsed.text}${imgTip}`,
          false,
        );

        if (this.isGlobalPaused()) {
          this.appendDebugLog(
            "全局暂停",
            `收到好友「${dispName}」小窗消息，当前处于全局暂停状态，不调用副API与主API`,
            false,
          );
          return;
        }

        if (pCfg.enabled !== false) {
          this.scheduleDirectPrivateTurn(senderId, pCfg);
        } else {
          this.appendDebugLog(
            "小窗未开",
            `好友「${dispName}」小窗当前为停用状态，如需自动回复请在小窗栏目点开启`,
            true,
          );
        }
        return;
      }

      // 2. 处理QQ群聊消息
      if (data.post_type === "message" && data.message_type === "group") {
        const gid = String(data.group_id || "");
        if (!gid) return;
        const senderId = String(
          data.user_id || (data.sender && data.sender.user_id) || "",
        );
        const selfId =
          String(data.self_id || "") ||
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

        const parsed = this.parseOneBotGroupMessage(data);
        if (
          !parsed.text &&
          parsed.imageUrls.length === 0 &&
          parsed.imageFiles.length === 0
        ) {
          return;
        }

        if (!this.serverState) {
          await this.syncFromServer(false);
        }
        if (!this.serverState.config.groups) {
          this.serverState.config.groups = {};
        }
        if (!this.serverState.config.groups[gid]) {
          this.serverState.config.groups[gid] = this.createDefaultGroupConfig(
            gid,
            data.group_name || "QQ群 " + gid,
          );
          this.renderGroupSelectDropdown();
          await this.saveAllSettings(false);
        } else if (data.group_name) {
          this.serverState.config.groups[gid].groupName = data.group_name;
        }

        const gCfg = this.serverState.config.groups[gid];
        const dispName = this.resolveMemberDisplayName(
          gCfg,
          senderId,
          rawRemark,
        );

        if (
          (!this.currentGroupId || this.currentGroupId === "88482026") &&
          gid !== "88482026"
        ) {
          this.currentGroupId = gid;
          this.renderGroupSelectDropdown();
          this.populateCurrentGroupUI();
        }

        const msgId = String(data.message_id || "msg_" + Date.now());
        const msgObj = {
          messageId: msgId,
          groupId: gid,
          senderId,
          senderName: dispName,
          qqRemark: rawRemark,
          rawMessage: parsed.text,
          content: parsed.text,
          replyId: parsed.replyId || "",
          imageUrls: parsed.imageUrls || [],
          imageFiles: parsed.imageFiles || [],
          visionDescription: "",
          visionRecognized: false,
          isSelf: false,
          timestamp: data.time ? Number(data.time) * 1000 : Date.now(),
        };

        this.appendStaticMessage(gid, msgObj);

        fetch("/api/qqbot/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).catch(() => {});

        const imgTip =
          parsed.imageUrls.length > 0 || parsed.imageFiles.length > 0
            ? ` · 附带 ${Math.max(parsed.imageUrls.length, parsed.imageFiles.length)} 张图片`
            : "";
        this.appendDebugLog(
          "收到群消息",
          `群「${gCfg.groupName || gid}」${dispName}：${parsed.text}${imgTip}`,
          false,
        );

        await this.refreshSandboxLog();

        if (this.isGlobalPaused()) {
          this.appendDebugLog(
            "全局暂停",
            `群「${gCfg.groupName || gid}」收到新消息，当前处于全局暂停状态，不调用副API与主API`,
            false,
          );
          return;
        }

        if (gCfg.enabled !== false) {
          this.scheduleDirectGroupTurn(gid, gCfg);
        } else {
          this.appendDebugLog(
            "监听未开",
            `群「${gCfg.groupName || gid}」当前处于停用监听状态，如需自动回复请在群聊栏目点开启`,
            true,
          );
        }
      }
    },

    scheduleDirectGroupTurn(gid, gCfg) {
      if (this.isGlobalPaused() || !gCfg || gCfg.enabled === false) {
        if (this.groupDebounceTimers[gid]) {
          clearTimeout(this.groupDebounceTimers[gid]);
          delete this.groupDebounceTimers[gid];
        }
        return;
      }
      if (this.groupDebounceTimers[gid]) {
        clearTimeout(this.groupDebounceTimers[gid]);
      }
      const waitSec = Math.max(2, Math.min(30, Number(gCfg.debounceSec) || 6));
      this.updateJudgeStatusUI(
        `已收到「${gCfg.groupName || gid}」最新群消息，正在等待 ${waitSec} 秒合并连发消息后交由副AI判断...`,
      );
      this.groupDebounceTimers[gid] = setTimeout(async () => {
        delete this.groupDebounceTimers[gid];
        if (this.isGlobalPaused() || !gCfg || gCfg.enabled === false) return;
        const list = this.staticFallbackLogs[gid] || [];
        const targetSeq =
          list.length > 0
            ? list[list.length - 1].seq || Date.now()
            : Date.now();
        await this.processGroupTurn(gid, gCfg, targetSeq, false);
      }, waitSec * 1000);
    },

    scheduleDirectPrivateTurn(userId, pCfg) {
      const uid = String(userId || "");
      if (!uid) return;
      if (this.isGlobalPaused() || !pCfg || pCfg.enabled === false) {
        if (this.privateDebounceTimers[uid]) {
          clearTimeout(this.privateDebounceTimers[uid]);
          delete this.privateDebounceTimers[uid];
        }
        return;
      }
      if (this.privateDebounceTimers[uid]) {
        clearTimeout(this.privateDebounceTimers[uid]);
      }
      const waitSec = Math.max(3, Math.min(3600, Number(pCfg.waitSec) || 30));
      const dispName = pCfg.remark || pCfg.nickname || uid;
      this.updateJudgeStatusUI(
        `已收到好友「${dispName}」小窗消息，正在等待 ${waitSec} 秒后唤醒副AI阅读并判断是否调用主AI回复...`,
      );
      this.privateDebounceTimers[uid] = setTimeout(async () => {
        delete this.privateDebounceTimers[uid];
        if (this.isGlobalPaused() || !pCfg || pCfg.enabled === false) return;
        await this.processPrivateTurn(uid, pCfg);
      }, waitSec * 1000);
    },

    async processPrivateTurn(userId, pCfg) {
      const uid = String(userId || "");
      if (!uid || this.busyPrivateChats[uid]) return;
      if (this.isGlobalPaused() || !pCfg || pCfg.enabled === false) return;
      this.busyPrivateChats[uid] = true;
      const logKey = "priv_" + uid;
      const dispName = pCfg.remark || pCfg.nickname || uid;

      try {
        let localArr = this.staticFallbackLogs[logKey] || [];
        if (localArr.length < 10) {
          try {
            const cRes = await fetch(
              `/api/qqbot/group/${encodeURIComponent(logKey)}/context?limit=35`,
            );
            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData && Array.isArray(cData.messages) && cData.messages.length > 0) {
                const seen = new Set();
                const merged = [];
                for (const m of [...cData.messages, ...localArr]) {
                  if (!m) continue;
                  const key = String(m.messageId || m.seq || "") + "_" + String(m.rawMessage || m.content || "");
                  if (seen.has(key)) continue;
                  seen.add(key);
                  merged.push(m);
                }
                localArr = merged.slice(-60);
                this.staticFallbackLogs[logKey] = localArr;
              }
            }
          } catch (_) {}
        }
        const messages = localArr.slice(-35);
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.isSelf) return;

        // 1. 提取小窗原图画面直接传给副AI与主AI，不再预先将图片转为文字
        const activeVisionUrls = await this.recognizePendingImagesInMessages(
          logKey,
          null,
          messages,
        );

        // 2. 副AI直接阅读小窗上下文与原图并判断是否需要主AI回复
        this.updateJudgeStatusUI(
          `等待时间到，副AI正在直接阅读好友「${dispName}」的小窗消息与原图，判断是否需要回复...`,
        );
        const judge = await this.runSubApiPrivateJudge(
          pCfg,
          messages,
          activeVisionUrls,
        );

        if (!judge.shouldReply) {
          const skipMsg = `小窗副AI判定暂不回复「${dispName}」 · 原因：${judge.reason || "无需回复"}`;
          this.updateJudgeStatusUI(skipMsg);
          this.appendDebugLog("小窗副AI", skipMsg, false);
          return;
        }

        const passMsg = `小窗副AI判定需要回复「${dispName}」 · 原因：${judge.reason || "回应好友私聊"} · 正在将原图与上下文传给主AI生成小窗回复...`;
        this.updateJudgeStatusUI(passMsg);
        this.appendDebugLog("小窗副AI", passMsg, false);

        // 3. 主AI直接查看原图与上下文生成私聊回复
        const replyList = await this.runMainApiPrivateResponder(
          pCfg,
          messages,
          judge,
          activeVisionUrls,
        );

        for (const text of replyList) {
          const clean = String(text || "").trim();
          if (!clean) continue;
          await this.sendBotMessage({
            userId: uid,
            message: clean,
          });
          this.appendStaticMessage(logKey, {
            messageId: "pbot_" + Date.now(),
            groupId: logKey,
            userId: uid,
            senderId: "BOT",
            senderName: "我方AI",
            rawMessage: clean,
            content: clean,
            isSelf: true,
            timestamp: Date.now(),
          });
        }
        this.updateJudgeStatusUI(
          `已向好友「${dispName}」小窗发送主AI回复，继续监听后续消息`,
        );
      } catch (err) {
        this.appendDebugLog(
          "小窗报错",
          `处理好友「${dispName}」小窗异常：${err.message || "请检查API配置"}`,
          true,
        );
      } finally {
        this.busyPrivateChats[uid] = false;
      }
    },

    async runSubApiPrivateJudge(pCfg, messages, activeVisionUrls = []) {
      const dispName = pCfg.remark || pCfg.nickname || pCfg.userId;
      const transcript = messages
        .slice(-20)
        .map((m) =>
          m.isSelf
            ? `[我方已发]: ${m.rawMessage || m.content}`
            : `[${dispName}]: ${m.rawMessage || m.content}`,
        )
        .join("\n");

      const sysPrompt = `你是QQ好友小窗私聊的副AI阅读裁判。
请阅读好友「${dispName}」发来的最新私聊消息，如果对方发了图片，原图已直接附带在本次请求中。
请判断此刻是否需要唤醒主AI回复该好友：
- 如果对方在提问、闲聊、发图分享、跑团私聊行动或等待回应，则 shouldReply 设为 true；
- 如果对方明确说先忙了、不用回、或者只是系统回执，则 shouldReply 设为 false。
只输出严格JSON：
{
  "shouldReply": true,
  "reason": "简短说明为什么需要回复或暂不回复"
}`;

      try {
        const raw = await this.callBotAI(
          sysPrompt,
          `【小窗最近聊天记录】\n${transcript}\n\n请输出JSON判断：`,
          true,
          activeVisionUrls,
        );
        const parsed = this.extractJsonObject(raw);
        if (parsed && typeof parsed.shouldReply === "boolean") {
          return parsed;
        }
      } catch (_) {}
      return { shouldReply: true, reason: "默认回复好友小窗消息" };
    },

    async runMainApiPrivateResponder(
      pCfg,
      messages,
      judge,
      activeVisionUrls = [],
    ) {
      const gCfg = this.getCurrentGroupConfig();
      const basePersona = pCfg.aiPersona || this.resolvePersonaPrompt(gCfg);
      const userPersonaText = pCfg.userPersona || pCfg.persona || "";
      const dispName = pCfg.remark || pCfg.nickname || pCfg.userId;
      const transcript = messages
        .slice(-25)
        .map((m) =>
          m.isSelf
            ? `[我方已发]: ${m.rawMessage || m.content}`
            : `[${dispName}]: ${m.rawMessage || m.content}`,
        )
        .join("\n");

      const sysPrompt = `你正在QQ小窗私聊中与好友「${dispName}」对话。
【你的自身人设】
${basePersona}

${userPersonaText ? `【该好友专属备注与关系设定】\n${userPersonaText}\n` : ""}
注意：
1. 如果好友发送了图片或表情包，原图已经直接传给了你，请直接看图并结合画面内容自然回应，绝不要说看不到图片。
2. 说话风格必须像真人在QQ小窗日常聊天一样自然简短、生活化，每次回复1到2句短话即可，不要长篇大论，不要喋喋不休说个不停。
请输出严格JSON格式：
{
  "messages": [
    "发送给该好友小窗的第1条简短回复"
  ]
}`;

      const raw = await this.callBotAI(
        sysPrompt,
        `【副AI分析】${judge.reason || "正常回复"}\n\n【小窗聊天记录】\n${transcript}\n\n请生成JSON回复：`,
        false,
        activeVisionUrls,
      );
      const parsed = this.extractJsonObject(raw);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        return parsed.messages;
      }
      if (parsed && Array.isArray(parsed.groupMessages)) {
        return parsed.groupMessages;
      }
      return [String(raw || "").trim() || "我在呢。"];
    },

    appendStaticMessage(gid, msgObj) {
      if (!this.staticFallbackLogs[gid]) this.staticFallbackLogs[gid] = [];
      const arr = this.staticFallbackLogs[gid];
      if (
        msgObj.messageId &&
        arr.some((m) => String(m.messageId) === String(msgObj.messageId))
      ) {
        return;
      }
      const prevSeq =
        arr.length > 0 ? Number(arr[arr.length - 1].seq) || arr.length : 0;
      msgObj.seq = prevSeq + 1;
      arr.push(msgObj);
      if (arr.length > 60) {
        this.staticFallbackLogs[gid] = arr.slice(-60);
      }
      if (!this.localWaitNormalized[gid]) {
        this.localWaitNormalized[gid] = {
          lastSeenSeq: 0,
          waitingSince: 0,
          idleAsked: false,
          lastReplyAt: 0,
        };
      }
      if (!msgObj.isSelf) {
        this.localWaitNormalized[gid].lastSeenSeq = msgObj.seq;
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
            ? "你在 6099 网页后台新建 3001 端口时，系统默认自动生成了一串 Token 密钥，可在 Termux 菜单输 3 查看并填进上方密钥框，或去 6099 后台把 Token 删空保存。"
            : "请核对上方密钥框里的 Token 是否与 Termux 菜单输 3 查看到的 3001 密钥一致。";
          const httpsHint = isHttps
            ? "另外当前网页为 https 加密网址，若手机浏览器拦截了本地 ws 连接，请点浏览器地址栏左侧图标打开网站设置，将不安全内容设为允许。"
            : "";
          const fullMsg = `未能连上 ${rawUrl}：1. ${tokenHint} 2. 确认 6099 后台新建的是 WebSocket服务端 且已打开启用开关。${httpsHint}`;
          this.notify("未能连上3001请看下方提示");
          this.updateConnDetail(fullMsg, false);
        }
      } finally {
        if (connBtn) connBtn.textContent = "连接";
      }
    },

    async refreshOneBotGroups(silent = false) {
      const refBtn = document.getElementById("qqbot-refresh-btn");
      if (!silent && refBtn) refBtn.textContent = "拉群中";
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
                this.notify(`已拉取${list.length}个QQ群`);
                this.updateConnDetail(
                  `已成功拉取到 ${list.length} 个QQ群并自动永久保存，可在群聊栏目卡片中直接点选切换`,
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
                : `已加载已存的${count}个群`,
            );
            this.updateConnDetail(
              data.refreshedFromOneBot
                ? `已从OneBot同步 ${count} 个QQ群并永久保存`
                : `已加载本地保存的 ${count} 个QQ群；也可在群聊栏目直接输入群号点添加`,
              Boolean(data.refreshedFromOneBot),
            );
          }
        } else if (!silent) {
          this.notify("请先连上3001或手动添加群号");
          this.updateConnDetail(
            "未检测到在线OneBot连接，请先核对密钥并点连接，或在群聊栏目直接输入QQ群号点添加",
            false,
          );
        }
      } catch (e) {
        if (!silent) {
          this.notify("已刷新本地群列表");
        }
      } finally {
        if (!silent && refBtn) refBtn.textContent = "拉群";
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
      await this.saveAllSettings(false);
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
        this.ensureAutoDirectWsConnection().catch(() => {});
        this.tickGroupWatchers();
      }, 3000);
    },

    async tickGroupWatchers() {
      try {
        if (this.isGlobalPaused()) {
          this.renderMasterPauseUI();
          return;
        }
        const res = await fetch("/api/qqbot/state");
        if (!res.ok) return;
        const stateData = await res.json();
        if (!stateData || !stateData.ok) return;

        this.serverState.runtime = stateData.runtime;
        this.serverState.groupStats = stateData.groupStats;
        this.renderMasterPauseUI();

        const badge = document.getElementById("qqbot-conn-badge");
        if (badge) {
          badge.textContent = this.directWsConnected
            ? "Termux直连在线"
            : (stateData.runtime && stateData.runtime.statusText) ||
              "等待连3001";
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
          if (!gCfg || gCfg.enabled === false) continue;
          if (this.busyGroups[gid] || this.groupDebounceTimers[gid]) continue;

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

          if (
            !this.directWsConnected &&
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
      this.appendDebugLog(
        "手动推进",
        `已手动触发群「${gCfg.groupName || this.currentGroupId}」AI立即生成回复`,
        false,
      );
      await this.processGroupTurn(this.currentGroupId, gCfg, Date.now(), true);
    },

    /* ============================================================================
     * 原图多模态直传引擎：
     * 不再让副AI预先把图片转成文字，直接提取最近消息中的原图并原封不动传给副AI与主AI
     * ============================================================================ */
    async resolveQqImageForVision(rawUrl, rawFile) {
      let cleanUrl = this.unescapeCqStr(rawUrl || "");
      if (!cleanUrl && this.directWsConnected && rawFile) {
        try {
          const imgInfo = await this.callDirectOneBotWs("get_image", {
            file: rawFile,
          });
          if (imgInfo) {
            if (imgInfo.base64) {
              return `data:image/jpeg;base64,${imgInfo.base64}`;
            }
            if (imgInfo.url) {
              cleanUrl = this.unescapeCqStr(imgInfo.url);
            }
          }
        } catch (_) {}
      }
      if (!cleanUrl) return "";
      if (cleanUrl.startsWith("data:image/")) return cleanUrl;

      try {
        const res = await fetch("/api/qqbot/fetch-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && data.dataUrl) {
            return data.dataUrl;
          }
        }
      } catch (_) {}

      return cleanUrl;
    },

    getVisionCacheKey(msgId, rawUrl, rawFile) {
      const k = String(rawFile || rawUrl || msgId || "").trim();
      return k ? k.slice(-140) : String(msgId || "");
    },

    applyVisionDescriptionToMessage(m, desc) {
      if (!m || !desc) return;
      m.visionDescription = desc;
      m.visionRecognized = true;
    },

    async recognizePendingImagesInMessages(groupId, gCfg, messages) {
      const recent = messages.slice(-6);
      const latestVisionUrls = [];

      for (const m of recent) {
        if (!m || m.isSelf) continue;
        const urls = Array.isArray(m.imageUrls) ? m.imageUrls : [];
        const files = Array.isArray(m.imageFiles) ? m.imageFiles : [];
        if (urls.length === 0 && files.length === 0) continue;

        const resolved = await this.resolveQqImageForVision(
          urls[0],
          files[0],
        );
        if (resolved) {
          latestVisionUrls.push(resolved);
          if (!m.visionRecognized) {
            m.visionRecognized = true;
            const speaker = gCfg
              ? this.resolveMemberDisplayName(
                  gCfg,
                  m.senderId,
                  m.qqRemark || m.senderName,
                )
              : m.senderName || m.qqRemark || m.senderId;
            this.appendDebugLog(
              "原图直传",
              `已提取 ${speaker} 发送的原图，直接原封不动传给副AI与主AI查看`,
              false,
            );
          }
        }
      }

      return latestVisionUrls.slice(-3);
    },

    /* ============================================================================
     * 副API 真人级场面判断 + 主API 回复生成与小窗派发
     * ============================================================================ */
    lastStickerSentAtByGroup: {},
    turnsSinceLastStickerByGroup: {},

    async processGroupTurn(groupId, gCfg, targetSeq, forceReply = false) {
      if (!forceReply) {
        if (this.isGlobalPaused()) return;
        if (!gCfg || gCfg.enabled === false) return;
      }
      if (this.busyGroups[groupId]) {
        if (!forceReply && !this.isGlobalPaused() && gCfg && gCfg.enabled !== false) {
          this.pendingRerunGroups[groupId] = true;
        }
        return;
      }
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
            totalStored =
              ctxData.totalStored || ctxData.totalMessages || messages.length;
          }
        } catch (_) {}

        const localMsgs = this.staticFallbackLogs[groupId] || [];
        if (localMsgs.length > 0) {
          const existingIds = new Set(
            messages.map((m) => String(m.messageId || "")),
          );
          for (const lm of localMsgs) {
            if (!existingIds.has(String(lm.messageId || ""))) {
              messages.push(lm);
            }
          }
          totalStored = Math.max(totalStored, messages.length);
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

        // 1. 提取最新消息中的原图多模态数据，直接发给副AI与主AI
        const activeVisionUrls = await this.recognizePendingImagesInMessages(
          groupId,
          gCfg,
          messages,
        );

        // 2. 检测是否是玩家发送了 还在RP 表情包或口令
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
          this.appendDebugLog(
            "等待对戏",
            `检测到 ${speakerRealName} 正在RP信号，本轮保持安静不插话`,
            false,
          );
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          if (this.localWaitNormalized[groupId]) {
            this.localWaitNormalized[groupId].waitingSince = Date.now();
            this.localWaitNormalized[groupId].idleAsked = false;
          }
          await this.refreshSandboxLog();
          return;
        }

        // 3. 副AI直接阅读群聊上下文与原图进行场面判断
        let judgeResult = {
          shouldReply: true,
          sceneType: "SINGLE_INTERACTION",
          reason: "手动推进或直接回应",
          targetSpeakerName: speakerRealName,
          targetUserId: lastMsg ? String(lastMsg.senderId || "") : "",
          replyToMessageId: "",
          needPrivateHint: false,
          privateTargetName: "",
        };

        if (!forceReply) {
          if (this.isGlobalPaused() || gCfg.enabled === false) return;
          this.updateJudgeStatusUI(
            "群控副AI正在阅读群聊上下文与原图，判断此刻是否需要唤醒主AI开口...",
          );
          judgeResult = await this.runSubApiSceneJudge(
            gCfg,
            messages,
            memory,
            activeVisionUrls,
          );
        }

        const unsummarizedCount =
          totalStored - (Number(memory.lastSummarizedSeq) || 0);
        if (unsummarizedCount >= 40) {
          this.summarizeCurrentGroupMemory(groupId, true).catch(() => {});
        }

        if (!judgeResult.shouldReply) {
          const skipMsg = `副AI判定暂不插话 · 场面：${judgeResult.sceneType || "等待群友对戏"} · 原因：${judgeResult.reason || "等待其他群友行动或继续RP"}`;
          this.updateJudgeStatusUI(skipMsg);
          this.appendDebugLog("副AI裁判", skipMsg, false);
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          await this.refreshSandboxLog();
          return;
        }

        if (!forceReply && (this.isGlobalPaused() || gCfg.enabled === false)) {
          return;
        }

        const passMsg = `副AI判定需要回应 · 对象：${judgeResult.targetSpeakerName || speakerRealName} · 原因：${judgeResult.reason || "回应群友发言"} · 正在连同原图与上下文唤醒主AI生成回复...`;
        this.updateJudgeStatusUI(passMsg);
        this.appendDebugLog("副AI裁判", passMsg, false);

        // 4. 唤醒群控主AI生成正式回复、小窗密信、表情包与生图指令，直接传入原图
        const replyPack = await this.runMainApiResponder(
          gCfg,
          messages,
          memory,
          judgeResult,
          activeVisionUrls,
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
        const errText =
          err.message || "请检查接口分页中的主API与副API地址及密钥";
        this.updateJudgeStatusUI("处理群消息异常：" + errText);
        this.appendDebugLog("接口报错", errText, true);
      } finally {
        this.busyGroups[groupId] = false;
        if (this.pendingRerunGroups[groupId]) {
          delete this.pendingRerunGroups[groupId];
          if (!this.isGlobalPaused() && gCfg && gCfg.enabled !== false) {
            this.scheduleDirectGroupTurn(groupId, gCfg);
          }
        }
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
      if (this.isGlobalPaused() || !gCfg || gCfg.enabled === false) return;
      if (this.busyGroups[groupId]) return;
      this.busyGroups[groupId] = true;
      try {
        const askText =
          gCfg.mode === "trpg"
            ? "我看大家有一会儿没动静啦，请问还有调查员在继续RP或者补行动吗？如果还在RP可以说一声，要是大家都行动完毕我就继续往下推剧情咯。"
            : "大家还在聊吗？";

        await this.sendBotMessage({
          groupId,
          message: askText,
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
     * 副API：真人级场面裁判 Prompt 与调用 · 直接查看原图与实时备注名
     * ============================================================================ */
    async runSubApiSceneJudge(gCfg, messages, memory, activeVisionUrls = []) {
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

      const sysPrompt = `你是QQ群控中枢的副AI真人场面裁判。当前模式：${modeLabel}。
请完整阅读群聊上下文，如果群友发送了图片，原图已直接附带在本次请求中。

【本群成员名册与专属人设】
${memberRoster || "按群内显示的实时备注名字区分每位群成员"}

请你像一个真正的资深人类跑团KP或真人OC群友一样，精准判断此刻是否应该唤醒主AI开口说话：
1. 单人独立互动 SINGLE_INTERACTION：某位群友单独和NPC搭话、发图互动、单独向KP声明调查某个角落、或者提出一个不牵连其他人的独立行动，此时不需要死等全员，应立即决定回复该群友。
2. 括号提问或检定结算 BRACKET_QUESTION_OR_DICE：群友确认规则、询问环境细节，或者刚投出了技能检定骰子结果，应立即回复并给出检定描写或解答。
3. 玩家结伴RP且NPC在场 PC_RP_NPC_PRESENT：群友们正在互相角色扮演对戏，如果对戏内容涉及在场NPC或主动向我方搭话，则自然接话；如果只是两位群友私下交流且不需要NPC打断，则保持安静等待他们聊完。
4. 全员大场面等待 WAIT_ALL_ACTIONS：当前处于转场或全员危机鉴定阶段，我方刚要求所有在场调查员过骰子或表态，而目前只有部分人表态、还有活跃成员正在行动中，则暂不回复，等待其他人行动完毕。
5. 还在RP等待信号 STILL_RP_WAIT：有人表示还在RP、等一下、正在打字，则立即保持安静不回复。
6. 结束RP推进信号 FINISH_RP_ADVANCE：群友们表示RP结束、可以继续推剧情了，则立即回复并推进下一幕。
7. 引用回复规范：replyToMessageId 默认必须留空字符串 ""！当群里只有1个人在说话、或者直接回应最后一条消息时，所有人都知道你在回谁，绝对不要填 replyToMessageId。只有当3个以上不同的人同时交叉刷屏、且你要回的那句话已经被别人的消息顶到前面去了，才填写对应的消息ID。

只输出严格的JSON对象，格式如下：
{
  "shouldReply": true,
  "sceneType": "SINGLE_INTERACTION | BRACKET_QUESTION_OR_DICE | PC_RP_NPC_PRESENT | WAIT_ALL_ACTIONS | STILL_RP_WAIT | FINISH_RP_ADVANCE",
  "reason": "简短说明为什么此时应该回复或应该继续等待",
  "targetSpeakerName": "如果是针对某位群友的独立行动或回答，填入其实时名字，否则留空",
  "replyToMessageId": "",
  "needPrivateHint": false,
  "privateTargetName": "如果该行动触发了只有某位成员能看到的秘密线索或单人线，填入其实时名字或HO代号，否则留空"
}`;

      const userPrompt = `【过往记忆摘要】\n${memory.summaryText || "暂无历史摘要"}\n\n【最新群聊记录】\n${transcript}\n\n请判断当前场面并输出JSON：`;

      try {
        const raw = await this.callBotAI(
          sysPrompt,
          userPrompt,
          true,
          activeVisionUrls,
        );
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
        replyToMessageId: "",
        needPrivateHint: false,
        privateTargetName: "",
      };
    },

    /* ============================================================================
     * 主API：完整挂载AI人设、要求、思维链、群成员专属人设、以及面板中一五一十可编辑的生图指令与代码规范
     * ============================================================================ */
    resolveNaiRuleForGroup(gCfg) {
      const def = this.getDefaultNaiPromptConfig();
      const naiMode =
        gCfg.naiMode ||
        (gCfg.autoNaiImage === false ? "off" : "trpg_every_round");
      const ocRuleText = String(gCfg.naiOcPrompt || def.naiOcPrompt).trim();
      const kpRuleText = String(gCfg.naiKpPrompt || def.naiKpPrompt).trim();

      if (naiMode === "off") {
        return "当前已关闭NovelAI生图，naiPrompt 字段必须留空字符串。";
      }
      if (naiMode === "always_force") {
        return `当前已开启【每回合末尾强制生图】模式：无论当前是守秘人带团还是日常OC聊天，你每一轮回复都必须在返回的 JSON 的 naiPrompt 字段中填写英文 NovelAI 生图 Tag 代码串，绝不能留空！\n具体生图指令与代码规范如下：\n${gCfg.mode === "trpg" ? kpRuleText : ocRuleText}`;
      }
      if (naiMode === "oc_auto") {
        return `当前已开启【日常OC按需生图】模式：\n${ocRuleText}`;
      }
      if (gCfg.mode === "trpg") {
        return `当前处于【守秘人KP模式 · 每回合末尾强制生图】：\n${kpRuleText}`;
      }
      return `当前处于【日常OC模式 · 按需自动生图】：\n${ocRuleText}`;
    },

    async runMainApiResponder(
      gCfg,
      messages,
      memory,
      judgeResult,
      activeVisionUrls = [],
    ) {
      const personaText = this.resolvePersonaPrompt(gCfg);
      const thoughtText = this.resolveThoughtPrompt(gCfg);
      const worldbookText = this.resolveWorldbookPrompt(gCfg);
      const moduleContext = this.resolveModulePrompt(gCfg);
      const playerCardsContext = this.resolvePlayerCardsPrompt(gCfg);
      const stickerNames =
        gCfg.mode === "trpg"
          ? []
          : this.resolveAvailableStickerNames(gCfg.stickerCategoryId);

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

      const naiRule = this.resolveNaiRuleForGroup(gCfg);
      const isTrpg = gCfg.mode === "trpg";

      const styleGuideline = isTrpg
        ? "当前为跑团守秘人KP带团模式：正剧剧情与环境描写请保持沉浸、克制、有画面感；严肃认真带团期间绝对禁止发送表情包，stickerName 必须留空字符串。如果群友场外提问规则，则自然简洁地解答。"
        : "当前为日常陪聊OC群友模式：请完全模仿真人在QQ群聊天的说话习惯，口语化、简短自然、有生活气息，不要像写文章或做演讲一样长篇大论，不要一直在那滔滔不绝讲话；通常1到2条简短气泡即可，每条一两句话，点到为止。表情包极少使用，大多数时候 stickerName 留空字符串，仅在情绪非常强烈或特别搞笑时偶尔发一张，并且正文中绝对不要写出任何类似 表情包名称 的文字描述。";

      const sysPrompt = `你是运行在真实QQ群中的${isTrpg ? "跑团守秘人KP与NPC演绎者" : "真人感OC群友"}。
请严格遵守以下核心准则：
1. 称呼与人设对应：上下文中每位群友都以其实时备注名字显示，请严格按照【本群成员实时名字与专属人设名册】来认识每一位群友、记住他们的设定与关系，直接称呼他们的名字或角色名。
2. 真人说话习惯与表情包纪律：${styleGuideline}
3. 原图直传看图：当群友发送图片或表情包时，原图画面已经直接附带在本次请求中传给了你。请直接看图并结合画面细节自然回应，绝不要说自己看不到图片。
4. 适度引用回复：quoteMessageId 默认必须留空字符串 ""！当群里只有1个人在说话、或者你回应的就是最后一条消息时，所有人都知道你在回他，绝对不要填 quoteMessageId。只有当3人以上同时交叉说话非常混乱、且你回的那句话已经被刷过去时，才填入对应消息ID。
5. 单人线与秘密小窗：如果某位群友触发了专属HO秘密、高难侦查独享情报、发狂幻觉或单人线剧情，在群里只发公开可见的表象，同时把专属秘密写进 privateMessages 数组中，并在 targetSlot 中填入该群友的实时名字或HO代号，系统会自动通过QQ小窗单独私发给他。
6. 【NovelAI生图指令与末尾代码规范】：
${naiRule}

【AI自身人设与身份设定】
${personaText}

${gCfg.customPrompt ? `【带团与聊天要求规范】\n${gCfg.customPrompt}\n` : ""}
【当前启用的思维链条目】
${thoughtText}

${playerCardsContext ? `【本群成员实时名字与专属人设名册】\n${playerCardsContext}\n` : ""}
${worldbookText ? `【世界书设定】\n${worldbookText}\n` : ""}
${moduleContext.text ? `【当前挂载跑团模组与KP真相】\n${moduleContext.text}\n` : ""}
${moduleContext.imageTitles.length > 0 ? `【可用模组插图列表】\n${moduleContext.imageTitles.join("、")}\n若本轮剧情恰好揭示其中某张模组插图或地图，可在 moduleImageTitle 中填入对应标题。\n` : ""}
${!isTrpg && stickerNames.length > 0 ? `【可用表情包名称】\n${stickerNames.join("、")}\n绝大多数回合请将 stickerName 留空 ""，仅在气氛特别合适时偶尔填入一个名称，且绝不在 groupMessages 正文中写出表情文字。\n` : ""}

请只输出严格的JSON格式，结构如下：
{
  "groupMessages": [
    "发送到QQ群的第1条消息文本"
  ],
  "quoteMessageId": "",
  "privateMessages": [
    {
      "targetSlot": "接收秘密小窗的群友实时名字或HO代号",
      "text": "单独发给该群友小窗的秘密线索或单人线描写"
    }
  ],
  "stickerName": "",
  "moduleImageTitle": "",
  "naiPrompt": "按照上方NovelAI生图指令填写的英文生图Tag代码串，若不生图则留空"
}`;

      const userPrompt = `【本地双层滚动记忆账本】
${memory.summaryText || "尚无归档记忆"}

【副AI场面裁判分析】
场景类型：${judgeResult.sceneType || "常规互动"}
判断依据：${judgeResult.reason || "正常接话"}
目标互动群友：${judgeResult.targetSpeakerName || "全员"}

【最近群聊完整上下文】
${transcript}

请生成本轮响应JSON：`;

      const raw = await this.callBotAI(
        sysPrompt,
        userPrompt,
        false,
        activeVisionUrls,
      );
      const parsed = this.extractJsonObject(raw);
      if (parsed && Array.isArray(parsed.groupMessages)) {
        if (!parsed.naiPrompt) {
          for (let i = 0; i < parsed.groupMessages.length; i++) {
            const mText = String(parsed.groupMessages[i] || "");
            const naiMatch = mText.match(/\[NAI\s*:\s*([^\]]+)\]/i);
            if (naiMatch && naiMatch[1]) {
              parsed.naiPrompt = naiMatch[1].trim();
              parsed.groupMessages[i] = mText
                .replace(/\[NAI\s*:\s*[^\]]+\]/gi, "")
                .trim();
            }
          }
        }
        return parsed;
      }

      let rawText = String(raw || "").trim() || "收到。";
      let extractedNai = "";
      const naiTagMatch = rawText.match(/\[NAI\s*:\s*([^\]]+)\]/i);
      if (naiTagMatch && naiTagMatch[1]) {
        extractedNai = naiTagMatch[1].trim();
        rawText = rawText.replace(/\[NAI\s*:\s*[^\]]+\]/gi, "").trim();
      }
      return {
        groupMessages: [rawText],
        quoteMessageId: "",
        privateMessages: [],
        stickerName: "",
        moduleImageTitle: "",
        naiPrompt: extractedNai,
      };
    },

    async sendBotMessage(payload) {
      const rawText = String(payload.message || payload.content || "").trim();
      let wsSentOk = false;

      if (this.directWsConnected && this.directWs) {
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
              wsSentOk = true;
            } else if (payload.groupId) {
              await this.callDirectOneBotWs("send_group_msg", {
                group_id: Number(payload.groupId) || String(payload.groupId),
                message: segments,
              });
              wsSentOk = true;
            }
          } catch (wsErr) {
            this.appendDebugLog(
              "ERR",
              `OneBot直连发消息异常：${wsErr.message || "发送超时"}`,
            );
          }
        }
      }

      if (payload.groupId && (rawText || payload.imageUrl)) {
        const botMsgObj = {
          seq: Date.now(),
          messageId: "bot_" + Date.now(),
          groupId: String(payload.groupId),
          senderId: "BOT",
          senderName: "群控AI",
          rawMessage: rawText || "[图片]",
          content: rawText || "[图片]",
          imageUrls: payload.imageUrl ? [payload.imageUrl] : [],
          isSelf: true,
          timestamp: Date.now(),
        };
        this.appendStaticMessage(String(payload.groupId), botMsgObj);
        this.appendDebugLog(
          "AI",
          `[AI已发${payload.userId ? "私聊" : "群消息"}] 群${payload.groupId}${wsSentOk ? " 已送达QQ" : ""}：${(rawText || "[纯图片]").slice(0, 120)}`,
        );
      } else if (payload.userId && (rawText || payload.imageUrl)) {
        this.appendDebugLog(
          "AI小窗",
          `[AI已发小窗] 好友${payload.userId}${wsSentOk ? " 已送达QQ" : ""}：${(rawText || "[纯图片]").slice(0, 120)}`,
        );
      }

      try {
        await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            skipOneBotSend: wsSentOk,
          }),
        });
      } catch (_) {}

      if (String(payload.groupId) === String(this.currentGroupId)) {
        await this.refreshSandboxLog();
      }
    },

    shouldAllowQuoteReply(groupId, candidateQuoteId) {
      const qid = String(candidateQuoteId || "").trim();
      if (!qid) return "";
      const recent = (this.staticFallbackLogs[groupId] || []).slice(-12);
      const humanMsgs = recent.filter((m) => m && !m.isSelf && m.senderId);
      if (humanMsgs.length === 0) return "";
      const uniqueSpeakers = new Set(
        humanMsgs.map((m) => String(m.senderId)),
      );
      // 只有1个人在说话时，绝不引用回复
      if (uniqueSpeakers.size <= 1) return "";
      // 如果要引用的就是最新一条人类消息，也不用刻意引用
      const lastHuman = humanMsgs[humanMsgs.length - 1];
      if (lastHuman && String(lastHuman.messageId) === qid) return "";
      return qid;
    },

    async dispatchReplyPack(groupId, gCfg, targetSeq, judgeResult, replyPack) {
      const groupMsgs = Array.isArray(replyPack.groupMessages)
        ? replyPack.groupMessages
            .map((t) =>
              String(t || "")
                .replace(/\[表情\s*[:：][^\]]*\]/gi, "")
                .replace(/【表情\s*[:：][^】]*】/gi, "")
                .trim(),
            )
            .filter(Boolean)
        : [];
      const rawQuoteId =
        replyPack.quoteMessageId || judgeResult.replyToMessageId || "";
      const quoteId = this.shouldAllowQuoteReply(groupId, rawQuoteId);

      // 1. 发送群聊公开消息
      for (let i = 0; i < groupMsgs.length; i++) {
        const text = String(groupMsgs[i]).trim();
        await this.sendBotMessage({
          groupId,
          message: text,
          replyToMessageId: i === 0 ? quoteId : "",
          markProcessedSeq: targetSeq,
          waitingForRpSince: Date.now(),
          idleAsked: false,
        });
      }

      // 2. 派发单人线小窗或秘密线索
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

      // 3. 发送匹配的表情包：带团模式绝不发，日常模式大幅降低频率且绝不带文字
      this.turnsSinceLastStickerByGroup[groupId] =
        (this.turnsSinceLastStickerByGroup[groupId] || 0) + 1;
      const isSeriousTrpg = gCfg.mode === "trpg";
      const lastStickerAt = this.lastStickerSentAtByGroup[groupId] || 0;
      const turnsSince = this.turnsSinceLastStickerByGroup[groupId] || 1;
      const canSendStickerNow =
        !isSeriousTrpg &&
        gCfg.stickerCategoryId !== "NONE" &&
        turnsSince >= 3 &&
        Date.now() - lastStickerAt >= 180 * 1000;

      if (replyPack.stickerName && canSendStickerNow) {
        const stickerUrl = this.pickMatchedStickerUrl(
          gCfg.stickerCategoryId,
          replyPack.stickerName,
        );
        if (stickerUrl) {
          this.lastStickerSentAtByGroup[groupId] = Date.now();
          this.turnsSinceLastStickerByGroup[groupId] = 0;
          await this.sendBotMessage({
            groupId,
            message: "",
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
            message: "",
            imageUrl: modImg.dataUrl,
          });
        }
      }

      // 5. 同回合调用 NovelAI 生图，并将主AI发出的真实生图代码一五一十回显在面板中
      const naiMode =
        gCfg.naiMode ||
        (gCfg.autoNaiImage === false ? "off" : "trpg_every_round");
      let rawNaiPrompt = String(replyPack.naiPrompt || "").trim();

      if (
        !rawNaiPrompt &&
        (naiMode === "always_force" ||
          (naiMode === "trpg_every_round" && gCfg.mode === "trpg")) &&
        groupMsgs.length > 0
      ) {
        rawNaiPrompt =
          "1girl, 1boy, dramatic lighting, mystery atmosphere, detailed background, cinematic angle, trpg scene";
      }

      if (naiMode !== "off" && rawNaiPrompt) {
        const def = this.getDefaultNaiPromptConfig();
        const prefix = String(gCfg.naiPrefix || def.naiPrefix).trim();
        const finalNaiTags = prefix
          ? `${prefix}, ${rawNaiPrompt}`
          : rawNaiPrompt;

        const lastSentBox = document.getElementById("qqbot-nai-last-sent-box");
        if (lastSentBox) {
          lastSentBox.textContent = `【主AI本轮输出的 naiPrompt 代码】：${rawNaiPrompt}\n【拼接固定前缀后实际发往NovelAI的完整Tag】：${finalNaiTags}`;
        }
        this.appendDebugLog(
          "生图代码",
          `主AI发出NovelAI生图代码：${finalNaiTags}`,
          false,
        );

        if (typeof window.callNovelAiDirect === "function") {
          this.updateJudgeStatusUI(
            "主AI正文已发送，正在按末尾生图代码调用NovelAI生成现场插图...",
          );
          try {
            const imgDataUrl = await window.callNovelAiDirect(finalNaiTags);
            if (imgDataUrl) {
              await this.sendBotMessage({
                groupId,
                message: "",
                imageUrl: imgDataUrl,
              });
              this.updateJudgeStatusUI(
                "本轮回复与NovelAI现场生图已全部发送完毕",
              );
            }
          } catch (naiErr) {
            console.warn("群控同回合NovelAI生图失败:", naiErr);
            this.updateJudgeStatusUI("正文已发送，NovelAI生图接口未响应");
          }
        }
      } else {
        this.updateJudgeStatusUI(
          "本轮主AI回复已发送完毕，正在监听后续群消息",
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
      let serverMsgs = [];
      let total = 0;

      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/context?limit=50`,
        );
        if (res.ok) {
          const data = await res.json();
          serverMsgs = data.messages || [];
          total = data.totalStored || data.totalMessages || serverMsgs.length;
        }
      } catch (_) {}

      const localMsgs = this.staticFallbackLogs[this.currentGroupId] || [];
      const mergedMap = new Map();
      [...serverMsgs, ...localMsgs].forEach((m) => {
        if (!m) return;
        const key = String(
          m.messageId ||
            m.seq ||
            `${m.senderId}_${m.timestamp}_${m.rawMessage}`,
        );
        const existing = mergedMap.get(key);
        if (!existing) {
          mergedMap.set(key, m);
        } else {
          mergedMap.set(key, {
            ...existing,
            ...m,
            visionDescription:
              m.visionDescription || existing.visionDescription || "",
            visionRecognized: Boolean(
              m.visionRecognized || existing.visionRecognized,
            ),
            imageUrls:
              Array.isArray(m.imageUrls) && m.imageUrls.length > 0
                ? m.imageUrls
                : existing.imageUrls || [],
          });
        }
      });

      const msgs = Array.from(mergedMap.values())
        .sort(
          (a, b) => (a.timestamp || a.seq || 0) - (b.timestamp || b.seq || 0),
        )
        .slice(-50);

      const finalCount = Math.max(total, msgs.length);
      const badge = document.getElementById("qqbot-disk-status-badge");
      if (badge) {
        badge.textContent = `已收发 ${finalCount} 条`;
      }
      const groupBadge = document.getElementById("qqbot-group-count-badge");
      if (groupBadge) {
        groupBadge.textContent =
          finalCount > 0 ? `本群已收发 ${finalCount} 条` : "实时监听已开启";
      }

      if (msgs.length === 0) {
        box.innerHTML =
          '<div style="text-align: center; color: var(--text-secondary); padding: 28px 8px;">当前群暂无消息记录，正在自动监听手机Termux发来的QQ群消息，也可点击下方按钮直接演练</div>';
        return;
      }

      box.innerHTML = msgs
        .map((m) => {
          const align = m.isSelf ? "flex-end" : "flex-start";
          const bg = m.isSelf ? "var(--accent-color)" : "var(--card-bg)";
          const color = m.isSelf ? "#ffffff" : "var(--text-primary)";
          const dispName = m.isSelf
            ? "AI已发群消息 · " + (m.senderName || "群控AI")
            : this.resolveMemberDisplayName(
                gCfg,
                m.senderId,
                m.qqRemark || m.senderName,
              );
          const imgsHtml =
            Array.isArray(m.imageUrls) && m.imageUrls.length > 0
              ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px;">${m.imageUrls
                  .map(
                    (u) =>
                      `<img src="${this.escapeHtml(u)}" referrerpolicy="no-referrer" style="max-width: 120px; max-height: 120px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.style.display='none'" />`,
                  )
                  .join("")}</div>`
              : "";
          const visionHtml = m.visionDescription
            ? `<div style="margin-top: 5px; padding: 4px 8px; border-radius: 6px; background: var(--secondary-bg); color: var(--text-primary); font-size: 11px; line-height: 1.4; border-left: 3px solid var(--accent-color);">副AI已识图缓存：${this.escapeHtml(m.visionDescription)}</div>`
            : "";
          return `
          <div style="display: flex; flex-direction: column; align-items: ${align}; gap: 2px;">
            <span style="font-size: 10px; color: var(--text-secondary);">${this.escapeHtml(dispName)} · #${m.seq || m.messageId}</span>
            <div style="max-width: 88%; padding: 6px 10px; border-radius: 10px; background: ${bg}; color: ${color}; border: 1px solid var(--border-color); font-size: 12px; line-height: 1.45; word-break: break-word;">
              <div>${this.escapeHtml(m.rawMessage || m.content || "")}</div>
              ${imgsHtml}
              ${visionHtml}
            </div>
          </div>
        `;
        })
        .join("");
      box.scrollTop = box.scrollHeight;
    },

    async syncRecentHistoryFromOneBot(targetGroupId, silent = true) {
      const gid = String(targetGroupId || this.currentGroupId || "").trim();
      if (!gid) return;
      const cfg = (this.serverState && this.serverState.config) || {};
      const selfInput = document.getElementById("qqbot-selfid-input");
      const selfId = String((selfInput && selfInput.value.trim()) || cfg.selfId || "");
      const gCfg = (cfg.groups && cfg.groups[gid]) || this.getCurrentGroupConfig();

      let normalizedMessages = [];
      // 1. 若浏览器已直连 NapCat 3001，主动向 OneBot 拉取最近群聊历史消息（包含关网页/重启期间错过的聊天记录）
      if (this.directWsConnected && this.directWs && this.directWs.readyState === 1) {
        try {
          const resp = await this.callDirectOneBotWs("get_group_msg_history", {
            group_id: Number(gid) || gid,
            count: 35,
          });
          const rawList =
            resp && Array.isArray(resp.messages)
              ? resp.messages
              : Array.isArray(resp)
                ? resp
                : [];
          for (const rawEvt of rawList) {
            if (!rawEvt || typeof rawEvt !== "object") continue;
            const parsed = this.parseOneBotGroupMessage(rawEvt);
            if (!parsed.text && parsed.imageUrls.length === 0) continue;
            const senderObj = rawEvt.sender || {};
            const senderId = String(rawEvt.user_id || senderObj.user_id || "");
            const qqRemark = String(
              senderObj.card || senderObj.nickname || senderId || "群成员",
            );
            const isSelf = Boolean(selfId && senderId && senderId === selfId);
            const dispName = isSelf
              ? (gCfg && gCfg.botName) || "我方AI"
              : this.resolveMemberDisplayName(gCfg, senderId, qqRemark);
            const ts = rawEvt.time
              ? Number(rawEvt.time) < 1e12
                ? Number(rawEvt.time) * 1000
                : Number(rawEvt.time)
              : Date.now();
            const msgId = String(
              rawEvt.message_id ||
                rawEvt.real_id ||
                "hist_" + ts + "_" + senderId,
            );
            normalizedMessages.push({
              seq: 0,
              messageId: msgId,
              groupId: gid,
              senderId,
              senderName: dispName,
              qqRemark,
              content: parsed.text,
              rawMessage: parsed.text,
              replyId: parsed.replyId || "",
              atTargets: parsed.atTargets || [],
              imageUrls: parsed.imageUrls || [],
              imageFiles: parsed.imageFiles || [],
              isBot: isSelf,
              isSelf,
              timestamp: ts,
            });
          }
        } catch (_) {}

        // 同时为已启用监听的好友私聊拉取历史小窗消息
        const privMap = cfg.privateChats || {};
        for (const uid of Object.keys(privMap)) {
          const pCfg = privMap[uid];
          if (!pCfg || pCfg.enabled === false) continue;
          try {
            const pResp = await this.callDirectOneBotWs("get_friend_msg_history", {
              user_id: Number(uid) || uid,
              count: 25,
            });
            const pList =
              pResp && Array.isArray(pResp.messages)
                ? pResp.messages
                : Array.isArray(pResp)
                  ? pResp
                  : [];
            if (pList.length > 0) {
              const logKey = "priv_" + uid;
              const existingPriv = this.staticFallbackLogs[logKey] || [];
              const seenPriv = new Set(
                existingPriv.map((m) => String((m && m.messageId) || "")).filter(Boolean),
              );
              const pNormalized = [];
              for (const rawEvt of pList) {
                if (!rawEvt || typeof rawEvt !== "object") continue;
                const parsed = this.parseOneBotGroupMessage(rawEvt);
                if (!parsed.text && parsed.imageUrls.length === 0) continue;
                const senderObj = rawEvt.sender || {};
                const senderId = String(rawEvt.user_id || senderObj.user_id || "");
                const isSelf = Boolean(selfId && senderId && senderId === selfId);
                const dispName = isSelf
                  ? "我方AI"
                  : String(pCfg.remark || pCfg.nickname || senderObj.nickname || uid);
                const ts = rawEvt.time
                  ? Number(rawEvt.time) < 1e12
                    ? Number(rawEvt.time) * 1000
                    : Number(rawEvt.time)
                  : Date.now();
                const msgId = String(
                  rawEvt.message_id ||
                    rawEvt.real_id ||
                    "phist_" + ts + "_" + senderId,
                );
                const entry = {
                  seq: 0,
                  messageId: msgId,
                  groupId: logKey,
                  senderId,
                  senderName: dispName,
                  qqRemark: dispName,
                  content: parsed.text,
                  rawMessage: parsed.text,
                  replyId: parsed.replyId || "",
                  imageUrls: parsed.imageUrls || [],
                  imageFiles: parsed.imageFiles || [],
                  isBot: isSelf,
                  isSelf,
                  timestamp: ts,
                };
                pNormalized.push(entry);
                if (!seenPriv.has(msgId)) {
                  seenPriv.add(msgId);
                  existingPriv.push(entry);
                }
              }
              existingPriv.sort(
                (a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0),
              );
              this.staticFallbackLogs[logKey] = existingPriv
                .slice(-60)
                .map((m, idx) => ({ ...m, seq: idx + 1 }));
              fetch(`/api/qqbot/group/${encodeURIComponent(logKey)}/sync-history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selfId, messages: pNormalized }),
              }).catch(() => {});
            }
          } catch (_) {}
        }
      }

      // 2. 合并进内存最近窗口（限制60条防占浏览器内存）并同步写入本地磁盘
      if (normalizedMessages.length > 0) {
        const currentArr = this.staticFallbackLogs[gid] || [];
        const seen = new Set(
          currentArr.map((m) => String((m && m.messageId) || "")).filter(Boolean),
        );
        for (const item of normalizedMessages) {
          if (item.messageId && seen.has(String(item.messageId))) continue;
          if (item.messageId) seen.add(String(item.messageId));
          currentArr.push(item);
        }
        currentArr.sort(
          (a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0),
        );
        this.staticFallbackLogs[gid] = currentArr
          .slice(-60)
          .map((m, idx) => ({ ...m, seq: idx + 1 }));
      }

      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(gid)}/sync-history`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selfId,
              count: 35,
              messages: normalizedMessages.length > 0 ? normalizedMessages : undefined,
            }),
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.messages) && data.messages.length > 0) {
            this.staticFallbackLogs[gid] = data.messages.slice(-60);
          }
        }
      } catch (_) {}

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

      await this.refreshSandboxLog();
      if (!silent) {
        this.notify("已同步历史聊天记录");
      }
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
      const name2 = this.resolveMemberDisplayName(
        g,
        second.qq,
        second.qqRemark,
      );

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
      const customList =
        this.serverState &&
        this.serverState.config &&
        Array.isArray(this.serverState.config.customStickers)
          ? this.serverState.config.customStickers
          : [];
      if (catId === "CUSTOM") {
        return customList
          .slice(0, 30)
          .map((s) => s.name || s.meaning || "")
          .filter(Boolean);
      }
      let list = [...customList, ...(this.cachedResources.stickers || [])];
      if (catId && catId !== "ALL") {
        list = list.filter(
          (s) =>
            String(s.categoryId) === String(catId) ||
            String(s.categoryId) === "CUSTOM",
        );
      }
      return list
        .slice(0, 30)
        .map((s) => s.name || s.meaning || "")
        .filter(Boolean);
    },

    pickMatchedStickerUrl(catId, keyword) {
      if (catId === "NONE") return "";
      const customList =
        this.serverState &&
        this.serverState.config &&
        Array.isArray(this.serverState.config.customStickers)
          ? this.serverState.config.customStickers
          : [];
      let list =
        catId === "CUSTOM"
          ? [...customList]
          : [...customList, ...(this.cachedResources.stickers || [])];
      if (catId && catId !== "ALL" && catId !== "CUSTOM") {
        list = list.filter(
          (s) =>
            String(s.categoryId) === String(catId) ||
            String(s.categoryId) === "CUSTOM",
        );
      }
      if (list.length === 0) return "";
      const kw = String(keyword || "").trim();
      const matched =
        list.find(
          (s) =>
            (s.name && s.name.includes(kw)) ||
            (s.meaning && s.meaning.includes(kw)),
        ) || list[0];
      return matched ? matched.dataUrl || matched.url || "" : "";
    },

    async callBotAI(sysPrompt, userPrompt, useSubApi = false, imageUrls = []) {
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
            "本地沙盘演练已收到消息。当前尚未填入群控主API密钥，请在接口栏目填入地址与密钥，或点击同主按钮复用全局API后即可生成真实AI回复。",
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

      const validImages = Array.isArray(imageUrls)
        ? imageUrls.filter((u) => typeof u === "string" && u.trim())
        : [];

      const buildMessages = (withImages) => {
        if (!withImages || validImages.length === 0) {
          return [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ];
        }
        const userContent = [{ type: "text", text: userPrompt }];
        validImages.slice(0, 3).forEach((imgUrl) => {
          userContent.push({
            type: "image_url",
            image_url: { url: imgUrl },
          });
        });
        return [
          { role: "system", content: sysPrompt },
          { role: "user", content: userContent },
        ];
      };

      let res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: buildMessages(validImages.length > 0),
          temperature: useSubApi ? 0.25 : 0.78,
        }),
      });

      if (!res.ok && validImages.length > 0) {
        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: buildMessages(false),
            temperature: useSubApi ? 0.25 : 0.78,
          }),
        });
      }

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
