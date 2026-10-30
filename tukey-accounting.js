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

  // 填充UI
  document.getElementById("tukey-user-avatar-preview").src =
    tukeyUserSettings.avatar;
  document.getElementById("tukey-user-name-input").value =
    tukeyUserSettings.username;
  document.getElementById("tukey-user-profession-input").value =
    tukeyUserSettings.profession || "";
  document.getElementById("sync-to-taobao-toggle").checked =
    tukeyUserSettings.syncWithTaobao || false;
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
  await loadAndRenderTukeyUserSettings();
  await loadTukeyCustomConfig();
  // 1. 绑定主屏幕图标点击事件
  document
    .getElementById("tukey-accounting-app-icon")
    .addEventListener("click", async () => {
      // 打开App时，总是先尝试加载群聊数据
      await loadTukeyGroupData();
      showScreen("tukey-accounting-screen");
    });

  // 2. 绑定底部导航栏事件
  document.getElementById("tukey-bottom-nav").addEventListener("click", (e) => {
    const navItem = e.target.closest(".tukey-nav-item");
    if (navItem && navItem.dataset.view) {
      const viewId = navItem.dataset.view;
      switchTukeyView(viewId); // 切换视图
      // 如果切换到钱包或群聊视图，则刷新其内容
      if (viewId === "tukey-wallet-view") renderTukeyWalletView();
      if (viewId === "tukey-group-chat-view") loadTukeyGroupData();
    }
  });

  // 3. 绑定“创建群聊”按钮
  document
    .getElementById("tukey-create-group-btn")
    .addEventListener("click", () => {
      openGroupManagerModal();
    });

  // 4. 绑定群聊管理弹窗的“保存”和“取消”按钮
  document
    .getElementById("tukey-cancel-group-manager-btn")
    .addEventListener("click", () => {
      document
        .getElementById("tukey-group-manager-modal")
        .classList.remove("visible");
    });
  document
    .getElementById("tukey-save-group-btn")
    .addEventListener("click", saveTukeyGroup);

  // 5. 绑定群聊内部的“设置”按钮    // 5. 【核心修改】绑定群聊内部的“设置”按钮 -> 改为弹出选项菜单
  document
    .getElementById("tukey-group-settings-btn")
    .addEventListener("click", async () => {
      // 使用现有的 showChoiceModal 弹出一个菜单
      const choice = await showChoiceModal("记账群聊设置", [
        { text: "👥 管理成员 (拉人/踢人)", value: "manage_members" },
        { text: "🤖 AI回复设置", value: "ai_settings" },
        { text: "⚠️ 解散群聊", value: "dissolve_group" },
      ]);

      if (choice === "manage_members") {
        openGroupManagerModal(); // 打开成员选择弹窗（支持勾选添加/取消勾选踢人）
      } else if (choice === "ai_settings") {
        openReplySettingsModal(); // 打开AI设置
      } else if (choice === "dissolve_group") {
        dissolveTukeyGroup(); // 执行解散逻辑
      }
    });

  // 6. 绑定回复设置弹窗的按钮
  document
    .getElementById("tukey-cancel-reply-settings-btn")
    .addEventListener("click", () => {
      document
        .getElementById("tukey-reply-settings-modal")
        .classList.remove("visible");
    });
  document
    .getElementById("tukey-save-reply-settings-btn")
    .addEventListener("click", saveReplySettings);

  // 7. 绑定回复设置弹窗内的模式切换逻辑
  document
    .querySelectorAll('input[name="tukey-reply-mode"]')
    .forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const mode = e.target.value;
        document.getElementById("tukey-specific-reply-options").style.display =
          mode === "random" || mode === "specific" ? "block" : "none";
      });
    });

  // 这是正确的代码
  // 9. 记一笔相关按钮
  document
    .getElementById("tukey-add-record-btn")
    .addEventListener("click", openRecordEditor);

  // 9. 记一笔弹窗内的“支出/收入”切换
  document
    .querySelector(".tukey-type-selector")
    .addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        document
          .querySelectorAll(".tukey-type-selector .type-btn")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        renderRecordCategories(e.target.dataset.type);
      }
    });

  // 10.【不要动！】你原有的钱包账户功能事件监听，保持不变
  document
    .getElementById("add-new-account-fab")
    .addEventListener("click", openAccountTypeSelector);
  document
    .getElementById("account-type-selection-view")
    .addEventListener("click", (e) => {
      // 检查是否点击了“自定义”按钮
      const customBtn = e.target.closest(".add-custom-type-btn");
      if (customBtn) {
        const category = customBtn.dataset.category;
        handleAddCustomAccountType(category);
        return;
      }

      // 检查是否点击了普通类型
      const typeItem = e.target.closest(".type-item");
      if (typeItem && !typeItem.classList.contains("add-custom-type-btn")) {
        const category = typeItem.dataset.category;
        const type = typeItem.dataset.type;
        openAccountEditor(null, category, type);
      }
    });
  const accountListEl = document.getElementById("wallet-accounts-list");
  accountListEl.addEventListener("click", (e) => {
    const item = e.target.closest(".tukey-account-item");
    if (item && item.dataset.accountId) {
      openAccountEditor(parseInt(item.dataset.accountId));
    }
  });
  accountListEl.addEventListener("contextmenu", (e) => {
    const item = e.target.closest(".tukey-account-item");
    if (item && item.dataset.accountId) {
      e.preventDefault();
      deleteTukeyAccount(parseInt(item.dataset.accountId));
    }
  });
  document
    .getElementById("cancel-account-editor-btn")
    .addEventListener("click", () => {
      document
        .getElementById("account-editor-modal")
        .classList.remove("visible");
    });
  document
    .getElementById("save-account-btn")
    .addEventListener("click", saveTukeyAccount);
  // ▼▼▼ 11. 【全新】绑定设置页面的保存和头像上传 ▼▼▼
  document
    .getElementById("save-tukey-settings-btn")
    .addEventListener("click", saveTukeyUserSettings);

  document
    .getElementById("tukey-user-avatar-input")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        const dataUrl = await handleImageUploadAndCompress(file); // 复用图片压缩函数
        document.getElementById("tukey-user-avatar-preview").src = dataUrl;
      }
      event.target.value = null;
    });
  // ▼▼▼ 12. 【全新】绑定Excel导出功能相关按钮 ▼▼▼
  document
    .getElementById("export-tukey-report-btn")
    .addEventListener("click", openTukeyExportModal);

  document
    .getElementById("cancel-tukey-export-btn")
    .addEventListener("click", () => {
      document.getElementById("tukey-export-modal").classList.remove("visible");
    });

  document
    .getElementById("confirm-tukey-export-btn")
    .addEventListener("click", exportTukeyReportToExcel);
  // ▲▲▲ 添加结束 ▲▲▲
  // 在 initTukeyAccounting 函数的末尾添加：

  // ▼▼▼ 修复重Roll按钮点击无效的问题 ▼▼▼
  const recordsListEl = document.getElementById("tukey-records-list");

  // 使用事件委托，监听列表内的点击
  recordsListEl.addEventListener("click", async (e) => {
    // 1. 查找是否点击了重Roll按钮（或其子元素）
    const rerollBtn = e.target.closest(".tukey-reroll-btn");

    if (rerollBtn) {
      e.stopPropagation(); // 阻止冒泡
      e.preventDefault(); // 阻止默认行为

      const recordId = parseInt(rerollBtn.dataset.recordId);
      console.log("点击了重Roll，账单ID:", recordId);

      if (!isNaN(recordId)) {
        // 调用全局重生成函数
        if (typeof window.handleTukeyReroll === "function") {
          await window.handleTukeyReroll(recordId);
        } else {
          console.error("找不到 window.handleTukeyReroll 函数");
          alert("功能未就绪，请刷新页面重试。");
        }
      }
    }
  });
  // ▲▲▲ 修复结束 ▲▲▲
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
 * QQ 群控中枢控制器 - Local Disk Storage + Sub-API Situational Judge + Main-API KP/OC
 * ============================================================================ */
(function () {
  const QQBotConsole = {
    initialized: false,
    serverState: null,
    currentGroupId: "",
    pollTimer: null,
    busyGroups: {},
    localWaitNormalized: {},
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

    async copyReverseWsUrl() {
      const input = document.getElementById("qqbot-rev-ws-copy-input");
      const val = input ? input.value : "ws://127.0.0.1:3000/api/qqbot/ws";
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(val);
        } else if (input) {
          input.select();
          document.execCommand("copy");
        }
        this.notify("已复制反向WS地址");
      } catch (e) {
        this.notify("复制完成：" + val);
      }
    },

    async openSandboxModal() {
      const modal = document.getElementById("qqbot-sandbox-modal");
      if (modal) modal.style.display = "flex";
      await this.refreshSandboxLog();
    },

    closeSandboxModal() {
      const modal = document.getElementById("qqbot-sandbox-modal");
      if (modal) modal.style.display = "none";
    },

    notify(msg) {
      const badge = document.getElementById("qqbot-conn-badge");
      if (badge) {
        badge.textContent = msg;
      }
      if (typeof window.showCustomAlert === "function" && false) {
        window.showCustomAlert("提示", msg);
      }
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
          stickerCats,
          stickers,
          modules,
          moduleChapters,
          moduleImages,
        ] = await Promise.all([
          dbRef.chats ? dbRef.chats.toArray().catch(() => []) : [],
          dbRef.personaPresets ? dbRef.personaPresets.toArray().catch(() => []) : [],
          dbRef.thoughtChainPresets
            ? dbRef.thoughtChainPresets.toArray().catch(() => [])
            : [],
          dbRef.worldBooks ? dbRef.worldBooks.toArray().catch(() => []) : [],
          dbRef.userStickerCategories
            ? dbRef.userStickerCategories.toArray().catch(() => [])
            : [],
          dbRef.userStickers ? dbRef.userStickers.toArray().catch(() => []) : [],
          dbRef.modules ? dbRef.modules.toArray().catch(() => []) : [],
          dbRef.moduleChapters ? dbRef.moduleChapters.toArray().catch(() => []) : [],
          dbRef.moduleImages ? dbRef.moduleImages.toArray().catch(() => []) : [],
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
          stickerCats: stickerCats || [],
          stickers: stickers || [],
          modules: modules || [],
          moduleChapters: moduleChapters || [],
          moduleImages: moduleImages || [],
          charCards,
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
          '<option value="">默认守秘人或温润群友</option>' +
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
          '<option value="">内置真人跑团与群聊思维链</option>' +
          this.cachedResources.thoughts
            .map(
              (t) =>
                `<option value="${this.escapeAttr(String(t.id))}">${this.escapeHtml(t.name || t.title || "思维链")}</option>`,
            )
            .join("");
        if (cur) thoughtEl.value = cur;
      }

      const wbEl = document.getElementById("qqbot-worldbook-select");
      if (wbEl) {
        const cur = g ? g.worldBookId : wbEl.value;
        wbEl.innerHTML =
          '<option value="">不挂载额外世界书</option>' +
          '<option value="ALL">挂载全部启用世界书</option>' +
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

      const cardEl = document.getElementById("qqbot-bind-card-select");
      if (cardEl) {
        const cur = cardEl.value;
        cardEl.innerHTML =
          '<option value="">选择绑定角色卡或留空</option>' +
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
        chapEl.innerHTML = '<option value="ALL">全部章节自动检索</option>';
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

    onModuleSelectChange() {
      const modEl = document.getElementById("qqbot-module-select");
      const moduleId = modEl ? modEl.value : "";
      this.renderModuleChaptersSelect(moduleId, "ALL");
      this.onCurrentGroupFieldChange();
    },

    async syncFromServer(populateInputs = false) {
      try {
        const res = await fetch("/api/qqbot/state");
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok) return;
        this.serverState = data;

        const badge = document.getElementById("qqbot-conn-badge");
        if (badge && data.runtime) {
          badge.textContent = data.runtime.statusText || "本地待命";
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
        }

        const groupsObj = (data.config && data.config.groups) || {};
        const discovered =
          (data.runtime && data.runtime.discoveredGroups) || [];

        discovered.forEach((dg) => {
          const gid = String(dg.groupId || "");
          if (gid && !groupsObj[gid]) {
            groupsObj[gid] = this.createDefaultGroupConfig(gid, dg.groupName);
          }
        });

        const groupIds = Object.keys(groupsObj);
        if (groupIds.length === 0) {
          const defaultGid = "8848001";
          groupsObj[defaultGid] = this.createDefaultGroupConfig(
            defaultGid,
            "跑团演练测试群",
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
      } catch (e) {
        console.warn("同步群控状态失败:", e);
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
        idleAskMin: 12,
        cooldownSec: 4,
        autoNaiImage: false,
        personaId: "",
        thoughtChainId: "",
        worldBookId: "",
        stickerCategoryId: "ALL",
        moduleId: "",
        chapterId: "ALL",
        customPrompt: "",
        playerBindings: [],
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
          const stateMark = g.enabled ? "监听中" : "已暂停";
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
      const setChk = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
      };

      setChk("qqbot-group-enabled-chk", g.enabled);
      setChk("qqbot-group-nai-chk", g.autoNaiImage);
      setVal("qqbot-group-mode-select", g.mode || "trpg");
      setVal("qqbot-debounce-input", g.debounceSec ?? 8);
      setVal("qqbot-context-limit-input", g.contextLimit ?? 180);
      setVal("qqbot-idle-ask-input", g.idleAskMin ?? 12);
      setVal("qqbot-cooldown-input", g.cooldownSec ?? 4);
      setVal("qqbot-custom-prompt-input", g.customPrompt || "");

      this.renderResourceSelects();
      this.renderPlayerBindingsList();
    },

    onCurrentGroupFieldChange() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;

      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
      };
      const getChk = (id) => {
        const el = document.getElementById(id);
        return el ? Boolean(el.checked) : false;
      };

      g.enabled = getChk("qqbot-group-enabled-chk");
      g.autoNaiImage = getChk("qqbot-group-nai-chk");
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
        parseInt(getVal("qqbot-idle-ask-input", "12"), 10) || 0,
      );
      g.cooldownSec = Math.max(
        1,
        parseInt(getVal("qqbot-cooldown-input", "4"), 10) || 4,
      );
      g.personaId = getVal("qqbot-persona-select", "");
      g.thoughtChainId = getVal("qqbot-thought-select", "");
      g.worldBookId = getVal("qqbot-worldbook-select", "");
      g.stickerCategoryId = getVal("qqbot-sticker-select", "ALL");
      g.moduleId = getVal("qqbot-module-select", "");
      g.chapterId = getVal("qqbot-chapter-select", "ALL");
      g.customPrompt = getVal("qqbot-custom-prompt-input", "");

      this.renderGroupSelectDropdown();
      this.saveAllSettings(false);
    },

    async onGroupSelectChange() {
      const sel = document.getElementById("qqbot-group-select");
      if (!sel) return;
      this.currentGroupId = sel.value;
      this.populateCurrentGroupUI();
      await this.loadCurrentGroupMemoryUI();
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
    },

    addPlayerBinding() {
      const g = this.getCurrentGroupConfig();
      if (!g) return;
      const qqInput = document.getElementById("qqbot-bind-qq-input");
      const hoSelect = document.getElementById("qqbot-bind-ho-select");
      const cardSelect = document.getElementById("qqbot-bind-card-select");

      const qq = qqInput ? qqInput.value.trim() : "";
      const ho = hoSelect ? hoSelect.value : "HO1";
      const cardId = cardSelect ? cardSelect.value : "";

      if (!qq) {
        this.notify("请输入玩家QQ号或单人线群号");
        return;
      }

      const cardObj = this.cachedResources.charCards.find(
        (c) => String(c.id) === String(cardId),
      );
      if (!Array.isArray(g.playerBindings)) g.playerBindings = [];

      const existingIdx = g.playerBindings.findIndex(
        (b) => String(b.qq) === String(qq),
      );
      const item = {
        qq,
        slot: ho,
        cardId: cardId || "",
        cardName: cardObj ? cardObj.name : "未绑定角色卡",
      };

      if (existingIdx >= 0) {
        g.playerBindings[existingIdx] = item;
      } else {
        g.playerBindings.push(item);
      }

      if (qqInput) qqInput.value = "";
      this.renderPlayerBindingsList();
      this.saveAllSettings(false);
    },

    removePlayerBinding(qq) {
      const g = this.getCurrentGroupConfig();
      if (!g || !Array.isArray(g.playerBindings)) return;
      g.playerBindings = g.playerBindings.filter(
        (b) => String(b.qq) !== String(qq),
      );
      this.renderPlayerBindingsList();
      this.saveAllSettings(false);
    },

    renderPlayerBindingsList() {
      const container = document.getElementById("qqbot-player-bindings-list");
      const g = this.getCurrentGroupConfig();
      if (!container) return;
      const list = (g && g.playerBindings) || [];
      if (list.length === 0) {
        container.innerHTML =
          '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 2px;">暂未绑定调查员卡片，绑定后AI会自动读取玩家技能值并通过小窗发送专属秘密线索</div>';
        return;
      }
      container.innerHTML = list
        .map(
          (b) => `
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; background: var(--secondary-bg); border: 1px solid var(--border-color);">
          <span style="width: 44px; height: 22px; line-height: 22px; text-align: center; border-radius: 6px; background: var(--card-bg); border: 1px solid var(--border-color); font-size: 11px; font-weight: 700; color: var(--accent-color); flex-shrink: 0;">${this.escapeHtml(b.slot)}</span>
          <div style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--text-primary);">
            <span style="font-weight: 600;">${this.escapeHtml(b.cardName)}</span>
            <span style="font-size: 11px; color: var(--text-secondary); margin-left: 6px;">QQ:${this.escapeHtml(b.qq)}</span>
          </div>
          <button type="button" class="mod-capsule-btn" onclick="if(window.QQBotConsole){window.QQBotConsole.removePlayerBinding('${this.escapeAttr(b.qq)}');}" style="height: 24px; padding: 0 8px; font-size: 11px; flex-shrink: 0;">移除</button>
        </div>
      `,
        )
        .join("");
    },

    async saveAllSettings(showToast = false) {
      if (!this.serverState || !this.serverState.config) return;
      const epInput = document.getElementById("qqbot-endpoint-input");
      const selfInput = document.getElementById("qqbot-selfid-input");
      const tkInput = document.getElementById("qqbot-token-input");

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
        onebotUrl: rawUrl || "ws://127.0.0.1:3000/api/qqbot/ws",
        selfId: selfInput ? selfInput.value.trim() : "",
        accessToken: tkInput ? tkInput.value.trim() : "",
        groups: this.serverState.config.groups || {},
      };

      try {
        const res = await fetch("/api/qqbot/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data && data.config) {
          this.serverState.config = data.config;
        }
        if (showToast) {
          this.notify("设置已存盘");
        }
      } catch (e) {
        if (showToast) {
          this.notify("保存失败");
        }
      }
    },

    async connectOneBot() {
      await this.saveAllSettings(false);
      this.notify("正在连接...");
      try {
        const epInput = document.getElementById("qqbot-endpoint-input");
        const tkInput = document.getElementById("qqbot-token-input");
        const rawUrl = epInput ? epInput.value.trim() : "";
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
            accessToken: tkInput ? tkInput.value.trim() : "",
          }),
        });
        const data = await res.json();
        if (data && data.runtime) {
          this.notify(data.runtime.statusText || "已就绪");
          const selfInput = document.getElementById("qqbot-selfid-input");
          if (selfInput && data.runtime.selfId) {
            selfInput.value = data.runtime.selfId;
          }
        }
        await this.refreshOneBotGroups(true);
      } catch (e) {
        this.notify("连接异常");
      }
    },

    async refreshOneBotGroups(silent = false) {
      if (!silent) this.notify("正在拉取群列表...");
      try {
        const res = await fetch("/api/qqbot/refresh-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (data && Array.isArray(data.groups) && data.groups.length > 0) {
          if (!this.serverState.config.groups) {
            this.serverState.config.groups = {};
          }
          data.groups.forEach((dg) => {
            const gid = String(dg.groupId || "");
            if (!gid) return;
            if (!this.serverState.config.groups[gid]) {
              this.serverState.config.groups[gid] =
                this.createDefaultGroupConfig(gid, dg.groupName);
            } else if (dg.groupName) {
              this.serverState.config.groups[gid].groupName = dg.groupName;
            }
          });
          this.renderGroupSelectDropdown();
          await this.saveAllSettings(false);
          if (!silent) this.notify(`已同步${data.groups.length}个群`);
        } else if (!silent) {
          this.notify("待命或手动加群");
        }
      } catch (e) {
        if (!silent) this.notify("拉取失败");
      }
    },

    async loadCurrentGroupMemoryUI() {
      if (!this.currentGroupId) return;
      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/context?limit=30`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const memBox = document.getElementById("qqbot-memory-textarea");
        const badge = document.getElementById("qqbot-disk-status-badge");
        if (memBox && data.memory) {
          memBox.value = data.memory.summaryText || "";
        }
        if (badge) {
          badge.textContent = `本地磁盘已存 ${data.totalStored || 0} 条`;
        }
      } catch (e) {
        console.warn("读取本地记忆账本失败:", e);
      }
    },

    async saveManualMemory() {
      if (!this.currentGroupId) return;
      const memBox = document.getElementById("qqbot-memory-textarea");
      const summaryText = memBox ? memBox.value.trim() : "";
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
      } catch (e) {
        console.warn("保存本地账本失败:", e);
      }
    },

    async clearCurrentGroupDisk() {
      if (!this.currentGroupId) return;
      try {
        await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/clear`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );
        await this.loadCurrentGroupMemoryUI();
        await this.refreshSandboxLog();
        const badge = document.getElementById("qqbot-disk-status-badge");
        if (badge) badge.textContent = "本地磁盘已清空";
      } catch (e) {
        console.warn("清空群磁盘记录失败:", e);
      }
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
        this.serverState = stateData;

        const badge = document.getElementById("qqbot-conn-badge");
        if (badge && stateData.runtime && badge.textContent === "本地待命") {
          badge.textContent = stateData.runtime.statusText || "本地待命";
        }

        const groups = (stateData.config && stateData.config.groups) || {};
        const groupStats =
          (stateData.runtime && stateData.runtime.groupStats) || {};
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
          if (st.lastMessageSeq > Math.max(st.lastProcessedSeq || 0, lw.lastSeenSeq)) {
            const debounceMs = Math.max(2, Number(gCfg.debounceSec) || 8) * 1000;
            const cooldownMs = Math.max(1, Number(gCfg.cooldownSec) || 4) * 1000;
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
      } catch (e) {
        // 静默忽略网络抖动
      }
    },

    /* ============================================================================
     * 副API 真人级场面判断 + 主API 回复生成与小窗派发
     * ============================================================================ */
    async processGroupTurn(groupId, gCfg, targetSeq, forceReply = false) {
      if (this.busyGroups[groupId]) return;
      this.busyGroups[groupId] = true;

      try {
        const limit = Math.max(30, Math.min(800, Number(gCfg.contextLimit) || 180));
        const ctxRes = await fetch(
          `/api/qqbot/group/${encodeURIComponent(groupId)}/context?limit=${limit}`,
        );
        if (!ctxRes.ok) return;
        const ctxData = await ctxRes.json();
        const messages = ctxData.messages || [];
        const memory = ctxData.memory || { summaryText: "", lastSummarizedSeq: 0 };
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.isSelf && !forceReply) {
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          return;
        }

        // 先检测是否是玩家发送了 还在RP 表情包或口令
        const rawLastText = String((lastMsg && lastMsg.rawMessage) || "").trim();
        if (
          !forceReply &&
          /还在\s*rp|等一下.*rp|先别推进|正在码字|还在打字/i.test(rawLastText)
        ) {
          this.updateJudgeStatusUI(
            `检测到群友 [${lastMsg.senderName}] 发送还在RP信号，已自动顺延等待计时，暂不打断玩家对戏`,
          );
          await fetch("/api/qqbot/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              markProcessedSeq: targetSeq,
              waitingForRpSince: Date.now(),
              idleAsked: false,
            }),
          });
          if (this.localWaitNormalized[groupId]) {
            this.localWaitNormalized[groupId].waitingSince = Date.now();
            this.localWaitNormalized[groupId].idleAsked = false;
          }
          await this.refreshSandboxLog();
          return;
        }

        // 调用副API进行真人级场面判断
        let judgeResult = {
          shouldReply: true,
          sceneType: "DIRECT_REPLY",
          reason: "手动触发或默认回应",
          targetUserId: lastMsg ? String(lastMsg.senderId || "") : "",
          replyToMessageId: lastMsg ? String(lastMsg.messageId || "") : "",
          needPrivateHint: false,
          privateTargetUserId: "",
        };

        if (!forceReply) {
          this.updateJudgeStatusUI("副API正在阅读群聊上下文与括号内容，判断当前场面...");
          judgeResult = await this.runSubApiSceneJudge(gCfg, messages, memory);
        }

        const unsummarizedCount =
          (ctxData.totalStored || messages.length) -
          (Number(memory.lastSummarizedSeq) || 0);
        if (unsummarizedCount >= 40) {
          this.summarizeCurrentGroupMemory(groupId, true).catch(() => {});
        }

        if (!judgeResult.shouldReply) {
          this.updateJudgeStatusUI(
            `副API判定暂不插话 · 场景类型：${judgeResult.sceneType || "等待群友对戏"} · 原因：${judgeResult.reason || "等待其他玩家行动或继续RP"}`,
          );
          await this.markGroupSeqProcessed(groupId, targetSeq, false);
          await this.refreshSandboxLog();
          return;
        }

        this.updateJudgeStatusUI(
          `副API判定需要回应 · 场景类型：${judgeResult.sceneType || "即时互动"} · 原因：${judgeResult.reason || "回应玩家行动或推进剧情"} · 正在唤醒主API...`,
        );

        // 唤醒主API生成正式回复、小窗密信、表情包与生图指令
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
      } catch (err) {
        console.error("处理QQ群回合出错:", err);
        this.updateJudgeStatusUI("处理群消息异常：" + (err.message || "请检查API配置"));
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
            ? "我看大家有一会儿没动静啦，请问还有调查员在继续RP或者补行动吗？如果还在RP可以发个还在RP的表情或吱一声，要是大家都行动完毕我就继续往下推剧情咯。"
            : "群里突然安静下来啦，大家还在聊吗？";

        await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            message: askText,
            imageUrl: stickerUrl || "",
            markProcessedSeq: currentSeq,
            waitingForRpSince: Date.now(),
            idleAsked: true,
          }),
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
     * 副API：真人级场面裁判 Prompt 与调用
     * ============================================================================ */
    async runSubApiSceneJudge(gCfg, messages, memory) {
      const recentSlice = messages.slice(-25);
      const bindings = gCfg.playerBindings || [];
      const bindingDesc =
        bindings.length > 0
          ? bindings
              .map((b) => `QQ:${b.qq} 对应 ${b.slot} 角色:${b.cardName}`)
              .join("；")
          : "未显式绑定固定HO，按群内发言昵称区分玩家";

      const transcript = recentSlice
        .map((m) => {
          const roleTag = m.isSelf ? "[我方KP或OC]" : `[群友:${m.senderName}|QQ:${m.senderId}|消息ID:${m.messageId}]`;
          return `${roleTag}: ${m.rawMessage}`;
        })
        .join("\n");

      const modeLabel =
        gCfg.mode === "trpg"
          ? "跑团带团守秘人KP模式"
          : "日常陪聊与设定OC群友模式";

      const sysPrompt = `你是QQ群控中枢的副API真人场面裁判。当前模式：${modeLabel}。
请完整阅读群聊上下文，注意群友在括号内讨论的内容同样非常重要，不能忽略括号内对KP的提问、行动声明或检定沟通。
绑定调查员列表：${bindingDesc}

请你像一个真正的资深人类跑团KP或真人OC群友一样，精准判断此刻是否应该开口说话：
1. 单人独立互动 SINGLE_INTERACTION：某位玩家单独和NPC搭话、单独向KP声明调查某个角落、或者提出一个不牵连其他人的独立行动，此时不需要死等全员，应立即决定回复该玩家，并在 replyToMessageId 中填入该玩家的消息ID以便引用回复他。
2. 括号提问或检定结算 BRACKET_QUESTION_OR_DICE：玩家在括号里向KP确认规则、询问环境细节，或者刚投出了技能检定骰子结果，应立即回复并给出检定描写或解答。
3. 玩家结伴RP且NPC在场 PC_RP_NPC_PRESENT：玩家们正在互相角色扮演对戏，如果对戏内容涉及在场NPC或主动向我方搭话，则自然接话；如果只是两位玩家私下交流且不需要NPC打断，则保持安静等待他们聊完。
4. 全员大场面等待 WAIT_ALL_ACTIONS：当前处于转场或全员危机鉴定阶段，我方刚要求所有在场调查员过骰子或表态，而目前只有部分人表态、还有活跃玩家正在行动中，则暂不回复，等待其他人行动完毕。
5. 还在RP等待信号 STILL_RP_WAIT：有人表示还在RP、等一下、正在打字，则立即保持安静不回复。
6. 结束RP推进信号 FINISH_RP_ADVANCE：玩家们表示RP结束、可以继续推剧情了，则立即回复并推进下一幕。

只输出严格的JSON对象，格式如下：
{
  "shouldReply": true,
  "sceneType": "SINGLE_INTERACTION | BRACKET_QUESTION_OR_DICE | PC_RP_NPC_PRESENT | WAIT_ALL_ACTIONS | STILL_RP_WAIT | FINISH_RP_ADVANCE",
  "reason": "简短说明为什么此时应该回复或应该继续等待",
  "targetUserId": "如果是针对某位玩家的独立行动或回答，填入其QQ号，否则留空",
  "replyToMessageId": "如果需要引用回复某条具体消息，填入其消息ID，否则留空",
  "needPrivateHint": false,
  "privateTargetUserId": "如果该行动触发了只有某位调查员能看到的秘密线索或单人线，填入其QQ号，否则留空"
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
      return {
        shouldReply: true,
        sceneType: "SINGLE_INTERACTION",
        reason: "默认响应最新群消息",
        targetUserId: lastMsg ? String(lastMsg.senderId || "") : "",
        replyToMessageId: lastMsg ? String(lastMsg.messageId || "") : "",
        needPrivateHint: false,
        privateTargetUserId: "",
      };
    },

    /* ============================================================================
     * 主API：完整挂载人设、思维链、世界书、角色卡、模组、双层记忆与生图指令
     * ============================================================================ */
    async runMainApiResponder(gCfg, messages, memory, judgeResult) {
      const personaText = this.resolvePersonaPrompt(gCfg.personaId);
      const thoughtText = this.resolveThoughtPrompt(gCfg.thoughtChainId, gCfg.mode);
      const worldbookText = this.resolveWorldbookPrompt(gCfg.worldBookId);
      const moduleContext = this.resolveModulePrompt(gCfg.moduleId, gCfg.chapterId);
      const playerCardsContext = this.resolvePlayerCardsPrompt(gCfg.playerBindings);
      const stickerNames = this.resolveAvailableStickerNames(gCfg.stickerCategoryId);

      const transcript = messages
        .map((m) => {
          const tag = m.isSelf
            ? "[我方已发消息]"
            : `[${m.senderName}|QQ:${m.senderId}|消息ID:${m.messageId}]`;
          return `${tag}: ${m.rawMessage}`;
        })
        .join("\n");

      const naiRule = gCfg.autoNaiImage
        ? "当前已开启跑团正文每轮生图：只要本轮回复包含跑团正文的场景推进、环境描写、关键NPC登场或调查发现，必须在返回的 naiPrompt 字段中填写高质量英文NovelAI生图Tag串，聚焦画面光影、场景构图与人物动作；若仅是简短规则解答则 naiPrompt 留空。"
        : "当前未开启每轮强制生图，naiPrompt 字段留空即可。";

      const sysPrompt = `你是运行在真实QQ群中的${gCfg.mode === "trpg" ? "跑团守秘人KP与NPC演绎者" : "真人感OC群友"}。
请严格遵守以下准则：
1. 自然真人语气：像真人一样在QQ群里说话或带团描写，绝不机械复读，绝不替玩家扮演他们的调查员角色，绝不强行篡改玩家的行动意愿。
2. 括号与场外互动：你能看到群友在括号里说的话。如果群友用括号问规则或闲聊，你可以自然解答或回应；正剧描写则保持沉浸细腻的文学质感。
3. 单人回应与引用：如果当前是某位玩家单独向NPC搭话或单独过检定，直接针对该玩家给出回应与结果，不需要强行把其他没表态的玩家一起拖进结算。
4. 单人线与秘密小窗：如果某位玩家触发了专属HO秘密、高难侦查独享情报、发狂幻觉或单人线剧情，在群里只发公开可见的表象，同时把专属秘密写进 privateMessages 数组中，系统会自动通过QQ小窗或单人群单独发给该玩家。
5. 分段气泡感：群内发言 groupMessages 数组可包含 1 到 3 条消息，单条不要冗长刷屏，模拟真人在QQ群里的自然分段发言。
6. ${naiRule}

【人设与身份设定】
${personaText}

【思维链与带团准则】
${thoughtText}

${worldbookText ? `【世界书设定】\n${worldbookText}\n` : ""}
${moduleContext.text ? `【当前挂载跑团模组与KP真相】\n${moduleContext.text}\n` : ""}
${moduleContext.imageTitles.length > 0 ? `【可用模组插图列表】\n${moduleContext.imageTitles.join("、")}\n若本轮剧情恰好揭示其中某张模组插图或地图，可在 moduleImageTitle 中填入对应标题。\n` : ""}
${playerCardsContext ? `【本群绑定调查员角色卡与技能】\n${playerCardsContext}\n` : ""}
${stickerNames.length > 0 ? `【可用表情包名称】\n${stickerNames.join("、")}\n若气氛合适可在 stickerName 中填入一个表情包名称。\n` : ""}
${gCfg.customPrompt ? `【本群额外指令】\n${gCfg.customPrompt}\n` : ""}

请只输出严格的JSON格式，结构如下：
{
  "groupMessages": [
    "发送到QQ群的第1条消息文本",
    "可选的第2条群消息文本"
  ],
  "quoteMessageId": "若需引用回复某位玩家的消息，填入其消息ID，否则留空",
  "privateMessages": [
    {
      "targetUserId": "接收秘密小窗的玩家QQ号或单人群号",
      "targetSlot": "对应的HO或角色名",
      "text": "单独发给该玩家小窗的秘密线索或单人线描写"
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
目标玩家QQ：${judgeResult.targetUserId || "全员"}
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

    async dispatchReplyPack(groupId, gCfg, targetSeq, judgeResult, replyPack) {
      const groupMsgs = Array.isArray(replyPack.groupMessages)
        ? replyPack.groupMessages.filter((t) => String(t || "").trim())
        : [];
      const quoteId =
        replyPack.quoteMessageId || judgeResult.replyToMessageId || "";

      // 1. 发送群聊公开消息
      for (let i = 0; i < groupMsgs.length; i++) {
        let text = String(groupMsgs[i]).trim();
        if (i === 0 && quoteId && !text.includes("[CQ:reply")) {
          text = `[CQ:reply,id=${quoteId}]${text}`;
        }
        await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            message: text,
            markProcessedSeq: targetSeq,
            waitingForRpSince: Date.now(),
            idleAsked: false,
          }),
        });
      }

      // 2. 派发单人线小窗或秘密线索
      const privList = Array.isArray(replyPack.privateMessages)
        ? replyPack.privateMessages
        : [];
      for (const pm of privList) {
        if (!pm || !pm.text) continue;
        let targetId = String(pm.targetUserId || "").trim();
        let isSoloGroup = false;

        if (!targetId && pm.targetSlot && Array.isArray(gCfg.playerBindings)) {
          const found = gCfg.playerBindings.find(
            (b) =>
              b.slot === pm.targetSlot ||
              b.cardName === pm.targetSlot,
          );
          if (found) {
            targetId = found.qq;
            if (found.slot === "单人群") isSoloGroup = true;
          }
        } else if (targetId && Array.isArray(gCfg.playerBindings)) {
          const found = gCfg.playerBindings.find(
            (b) => String(b.qq) === targetId,
          );
          if (found && found.slot === "单人群") isSoloGroup = true;
        }

        if (!targetId) continue;

        if (isSoloGroup) {
          await fetch("/api/qqbot/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: targetId,
              message: `【单人线】${pm.text}`,
            }),
          });
        } else {
          await fetch("/api/qqbot/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              userId: targetId,
              message: `【专属秘密线索】${pm.text}`,
            }),
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
          await fetch("/api/qqbot/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              message: `[表情:${replyPack.stickerName}]`,
              imageUrl: stickerUrl,
            }),
          });
        }
      }

      // 4. 发送模组自带插图
      if (replyPack.moduleImageTitle && gCfg.moduleId) {
        const modImg = this.cachedResources.moduleImages.find(
          (img) =>
            String(img.moduleId) === String(gCfg.moduleId) &&
            (img.title === replyPack.moduleImageTitle ||
              (img.title &&
                img.title.includes(replyPack.moduleImageTitle))),
        );
        if (modImg && modImg.dataUrl) {
          await fetch("/api/qqbot/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              message: `【模组情报插图：${modImg.title || "现场画面"}】`,
              imageUrl: modImg.dataUrl,
            }),
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
            await fetch("/api/qqbot/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                groupId,
                message: "【跑团现场实时插图】",
                imageUrl: imgDataUrl,
              }),
            });
            this.updateJudgeStatusUI("本轮跑团回复与NovelAI现场生图已全部发送完毕");
          }
        } catch (naiErr) {
          console.warn("群控同回合NovelAI生图失败:", naiErr);
          this.updateJudgeStatusUI("正文已发送，NovelAI生图接口未响应");
        }
      } else {
        this.updateJudgeStatusUI("本轮主API回复已发送完毕，正在监听后续群消息");
      }
    },

    /* ============================================================================
     * 酒馆式双层滚动记忆总结 - 副API自动压缩并写入本地磁盘
     * ============================================================================ */
    async summarizeCurrentGroupMemory(targetGroupId, silent = false) {
      const gid = targetGroupId || this.currentGroupId;
      if (!gid) return;
      if (!silent) {
        const badge = document.getElementById("qqbot-disk-status-badge");
        if (badge) badge.textContent = "副API总结中...";
      }

      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(gid)}/context?limit=260`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const messages = data.messages || [];
        const oldMem = (data.memory && data.memory.summaryText) || "";
        if (messages.length === 0) {
          if (!silent) {
            const badge = document.getElementById("qqbot-disk-status-badge");
            if (badge) badge.textContent = "暂无新消息可总结";
          }
          return;
        }

        const transcript = messages
          .slice(-120)
          .map(
            (m) =>
              `${m.isSelf ? "[KP或OC]" : `[${m.senderName}]`}: ${m.rawMessage}`,
          )
          .join("\n");

        const sysPrompt = `你是酒馆式双层滚动记忆总结引擎。请将旧记忆账本与最新群聊记录合并提炼为结构紧凑、极省Token但关键细节零丢失的三段式结构化账本：
一、已发生关键事件与时间线
二、当前所处场景与已获线索道具
三、人物关系态度、技能检定结果与待回收伏笔

直接输出整理后的三段式纯文本账本，不要寒暄。`;

        const userPrompt = `【原有记忆账本】\n${oldMem || "无"}\n\n【近期群聊记录】\n${transcript}\n\n请输出更新后的三段式记忆账本：`;
        const summaryText = await this.callBotAI(sysPrompt, userPrompt, true);

        if (summaryText && summaryText.trim()) {
          const lastSeq = messages[messages.length - 1].seq || data.totalStored;
          await fetch(`/api/qqbot/group/${encodeURIComponent(gid)}/memory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              summaryText: summaryText.trim(),
              lastSummarizedSeq: lastSeq,
            }),
          });

          if (String(gid) === String(this.currentGroupId)) {
            const memBox = document.getElementById("qqbot-memory-textarea");
            if (memBox) memBox.value = summaryText.trim();
            const badge = document.getElementById("qqbot-disk-status-badge");
            if (badge) badge.textContent = "副API已更新本地账本";
          }
        }
      } catch (e) {
        console.warn("副API总结记忆失败:", e);
        if (!silent) {
          const badge = document.getElementById("qqbot-disk-status-badge");
          if (badge) badge.textContent = "总结失败，请检查API";
        }
      }
    },

    /* ============================================================================
     * 演练沙盒：一键模拟群友发言、括号问KP、还在RP表情与骰子检定
     * ============================================================================ */
    async refreshSandboxLog() {
      const box = document.getElementById("qqbot-sandbox-log");
      if (!box || !this.currentGroupId) return;
      try {
        const res = await fetch(
          `/api/qqbot/group/${encodeURIComponent(this.currentGroupId)}/context?limit=40`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const msgs = data.messages || [];
        if (msgs.length === 0) {
          box.innerHTML =
            '<div style="text-align: center; color: var(--text-secondary); padding: 24px 8px;">当前群暂无消息记录，可点击下方快捷按钮演练群友互动</div>';
          return;
        }
        box.innerHTML = msgs
          .map((m) => {
            const align = m.isSelf ? "flex-end" : "flex-start";
            const bg = m.isSelf ? "var(--accent-color)" : "var(--card-bg)";
            const color = m.isSelf ? "#ffffff" : "var(--text-primary)";
            return `
            <div style="display: flex; flex-direction: column; align-items: ${align}; gap: 2px;">
              <span style="font-size: 10px; color: var(--text-secondary);">${this.escapeHtml(m.senderName || "群友")} · #${m.messageId || m.seq}</span>
              <div style="max-width: 88%; padding: 6px 10px; border-radius: 10px; background: ${bg}; color: ${color}; border: 1px solid var(--border-color); font-size: 12px; line-height: 1.45; word-break: break-word;">
                ${this.escapeHtml(m.rawMessage || "")}
              </div>
            </div>
          `;
          })
          .join("");
        box.scrollTop = box.scrollHeight;
      } catch (_) {}
    },

    updateJudgeStatusUI(text) {
      const el = document.getElementById("qqbot-judge-status-box");
      if (el) el.textContent = text;
    },

    async simulateQuickScene(sceneKey) {
      if (!this.currentGroupId) return;
      const presets = {
        single_npc: {
          senderId: "10001",
          senderName: "早川秋",
          text: "我走到柜台前敲了敲木桌，低声问店员：昨晚八点左右，有没有一个穿黑色雨衣的人来寄存过手提箱？",
        },
        bracket_ask: {
          senderId: "10002",
          senderName: "佐藤葵",
          text: "【问一下KP，房间里的老式座机电话现在还有忙音吗？我能不能直接拨号或者撬开听筒看线路？】",
        },
        still_rp: {
          senderId: "10001",
          senderName: "早川秋",
          text: "[表情:等一下我还在RP] 等一下，我和佐藤再对两句词！",
        },
        dice_check: {
          senderId: "10002",
          senderName: "佐藤葵",
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
        await fetch("/api/qqbot/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: this.currentGroupId,
            message: text,
          }),
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
      const res = await fetch("/api/qqbot/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: this.currentGroupId,
          groupName: gCfg ? gCfg.groupName : "测试群",
          senderId,
          senderName,
          message: text,
        }),
      });
      const data = await res.json();
      await this.refreshSandboxLog();
      await this.loadCurrentGroupMemoryUI();

      if (data && data.entry && gCfg) {
        await this.processGroupTurn(
          this.currentGroupId,
          gCfg,
          data.entry.seq,
          false,
        );
      }
    },

    /* ============================================================================
     * 资源解析与主副API统一调用底层
     * ============================================================================ */
    resolvePersonaPrompt(personaId) {
      if (!personaId) {
        return "你是一位温和、细腻、极具画面感与公平裁决力的跑团守秘人KP，在日常闲聊时则是自然亲切的群友。";
      }
      const found = this.cachedResources.personas.find(
        (p) => String(p.id) === String(personaId),
      );
      return found && found.prompt
        ? found.prompt
        : "保持角色鲜明性格，以自然真人口吻在群内互动。";
    },

    resolveThoughtPrompt(thoughtId, mode) {
      if (thoughtId) {
        const found = this.cachedResources.thoughts.find(
          (t) => String(t.id) === String(thoughtId),
        );
        if (found && (found.content || found.prompt)) {
          return found.content || found.prompt;
        }
      }
      if (mode === "trpg") {
        return "1. 先梳理现场每位调查员所处位置与行动因果；2. 区分公开可见环境与个人私密情报；3. 用具体感官细节展现氛围，绝不替玩家做决定或强行煽情说教。";
      }
      return "1. 读懂群友话里的情绪与梗；2. 简短自然地接话，像真人在手机上打字聊天一样。";
    },

    resolveWorldbookPrompt(wbId) {
      if (!wbId) return "";
      if (wbId === "ALL") {
        return this.cachedResources.worldbooks
          .slice(0, 12)
          .map((w) => `【${w.name}】${w.content}`)
          .join("\n");
      }
      const found = this.cachedResources.worldbooks.find(
        (w) => String(w.id) === String(wbId),
      );
      return found ? `【${found.name}】\n${found.content}` : "";
    },

    resolveModulePrompt(moduleId, chapterId) {
      if (!moduleId) return { text: "", imageTitles: [] };
      const mod = this.cachedResources.modules.find(
        (m) => String(m.id) === String(moduleId),
      );
      const chaps = this.cachedResources.moduleChapters
        .filter((c) => String(c.moduleId) === String(moduleId))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      let selectedChaps = chaps;
      if (chapterId && chapterId !== "ALL") {
        const target = chaps.find((c) => String(c.id) === String(chapterId));
        if (target) selectedChaps = [target];
      }

      const chapText = selectedChaps
        .map(
          (c) =>
            `章节《${c.title || ""}》\n正文与场景：${(c.content || "").slice(0, 2200)}\nKP真相与暗线：${(c.kpNotes || c.truth || "").slice(0, 1200)}`,
        )
        .join("\n\n");

      const imgs = this.cachedResources.moduleImages
        .filter((img) => String(img.moduleId) === String(moduleId))
        .map((img) => img.title || "模组插图")
        .filter(Boolean);

      return {
        text: `模组名称：${(mod && (mod.title || mod.name)) || ""}\n简介与真相：${(mod && (mod.description || mod.summary || mod.truth)) || ""}\n\n${chapText}`,
        imageTitles: imgs,
      };
    },

    resolvePlayerCardsPrompt(bindings) {
      if (!Array.isArray(bindings) || bindings.length === 0) return "";
      return bindings
        .map((b) => {
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
                detail = ` 属性:${stats.slice(0, 260)} 技能:${skills.slice(0, 400)}`;
              } catch (_) {}
            }
            if (card.persona) {
              detail += ` 设定:${String(card.persona).slice(0, 220)}`;
            }
          }
          return `- 位置:${b.slot} | 玩家QQ:${b.qq} | 调查员:${b.cardName}${detail}`;
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
      // 优先使用副API配置进行场面判断与记忆总结，若未配置副API则自动回退到主API
      const getInputVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const stCfg = (window.state && window.state.apiConfig) || {};
      let proxyUrl = "";
      let apiKey = "";
      let model = "";

      if (useSubApi) {
        proxyUrl =
          getInputVal("sub-proxy-url") ||
          stCfg.subProxyUrl ||
          getInputVal("proxy-url") ||
          stCfg.proxyUrl;
        apiKey =
          getInputVal("sub-api-key") ||
          stCfg.subApiKey ||
          getInputVal("api-key") ||
          stCfg.apiKey;
        model =
          getInputVal("sub-model-select") ||
          stCfg.subModel ||
          getInputVal("model-select") ||
          stCfg.model;
      } else {
        proxyUrl =
          getInputVal("proxy-url") ||
          stCfg.proxyUrl ||
          getInputVal("sub-proxy-url") ||
          stCfg.subProxyUrl;
        apiKey =
          getInputVal("api-key") ||
          stCfg.apiKey ||
          getInputVal("sub-api-key") ||
          stCfg.subApiKey;
        model =
          getInputVal("model-select") ||
          stCfg.model ||
          getInputVal("sub-model-select") ||
          stCfg.subModel;
      }

      if (
        (!proxyUrl || !apiKey) &&
        typeof window.ModuleManager !== "undefined" &&
        typeof window.ModuleManager.callAI === "function"
      ) {
        return await window.ModuleManager.callAI(
          sysPrompt,
          userPrompt,
          [],
          useSubApi ? "sub" : "main",
        );
      }

      let endpoint = String(proxyUrl || "").replace(/\/+$/, "");
      if (!endpoint.endsWith("/chat/completions")) {
        if (endpoint.endsWith("/v1")) {
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

