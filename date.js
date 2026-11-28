// date.js - 思维链管理

// 全局变量
let currentThinkingChains = [];

// 从 localStorage 加载思维链数据
function loadThinkingChains() {
  try {
    const raw = localStorage.getItem("thinking_chains");
    if (raw) {
      currentThinkingChains = JSON.parse(raw);
    } else {
      currentThinkingChains = [
        {
          id: "tc_default",
          name: "深度心理分析",
          content: "要求角色在思考时分析玩家的真实动机、当前的情感状态、以及如何委婉或强烈地表达自己的态度。",
          boundChars: []
        }
      ];
      saveThinkingChains();
    }
  } catch (e) {
    console.error("加载思维链失败:", e);
    currentThinkingChains = [];
  }
}

function saveThinkingChains() {
  try {
    localStorage.setItem("thinking_chains", JSON.stringify(currentThinkingChains));
  } catch (e) {
    console.error("保存思维链失败:", e);
  }
}

// 获取绑定给某特定角色的思维链内容
window.getThinkingChainPrompt = function(chatId) {
  loadThinkingChains();
  const chain = currentThinkingChains.find(c => c.boundChars && c.boundChars.includes(chatId));
  if (chain) {
    return chain.content;
  }
  return "";
};

// 打开思维链管理 App
window.openDatingApp = function() {
  console.log("打开思维链App...");
  showScreen("date-a-live-screen");
  
  // 更新屏幕标题
  const headerSpan = document.querySelector("#date-a-live-screen .header span:not(.back-btn)");
  if (headerSpan) {
    headerSpan.textContent = "思维链";
  }

  // 放入新的添加按钮
  const headerActions = document.querySelector("#date-a-live-screen .header .header-actions");
  if (headerActions) {
    headerActions.innerHTML = `
      <button type="button" id="tc-add-btn" class="moe-btn-small" style="font-size: 11px; padding: 2px 8px; height: 24px; line-height: 20px;">+ 新建</button>
    `;
    document.getElementById("tc-add-btn").onclick = openCreateThinkingChainModal;
  }

  loadThinkingChains();
  renderThinkingChains();
};

function renderThinkingChains() {
  const container = document.getElementById("dating-scene-content");
  if (!container) return;

  if (currentThinkingChains.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 13px;">
        暂无思维链，点击右上角【新建】按钮添加一个吧！
      </div>
    `;
    return;
  }

  container.innerHTML = currentThinkingChains.map(tc => {
    // 获取绑定的角色名字列表
    const boundNames = (tc.boundChars || []).map(cid => {
      const chat = state.chats[cid];
      return chat ? chat.name : "";
    }).filter(Boolean).join("，") || "未绑定任何角色";

    return `
      <div class="moe-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 12px; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${tc.name}</span>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="moe-btn-mini tc-edit-btn" data-id="${tc.id}" style="font-size: 11px; padding: 2px 8px;">编辑</button>
            <button type="button" class="moe-btn-mini tc-delete-btn" data-id="${tc.id}" style="font-size: 11px; padding: 2px 8px; background: var(--tukey-red, #ff4d4f); color: #fff; border: none; border-radius: 4px; cursor: pointer;">删除</button>
          </div>
        </div>
        <div style="font-size: 12px; line-height: 1.5; color: var(--text-secondary); background: var(--secondary-bg); border-radius: 6px; padding: 8px; margin-bottom: 8px; white-space: pre-wrap;">${tc.content}</div>
        <div style="font-size: 11px; color: var(--accent-color); display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>生效角色: ${boundNames}</span>
        </div>
      </div>
    `;
  }).join("");

  // 绑定编辑和删除点击事件
  container.querySelectorAll(".tc-edit-btn").forEach(btn => {
    btn.onclick = () => {
      const tcId = btn.dataset.id;
      const tcObj = currentThinkingChains.find(c => c.id === tcId);
      if (tcObj) openEditThinkingChainModal(tcObj);
    };
  });

  container.querySelectorAll(".tc-delete-btn").forEach(btn => {
    btn.onclick = async () => {
      const tcId = btn.dataset.id;
      const confirmDel = confirm("确定要删除这条思维链吗？");
      if (confirmDel) {
        currentThinkingChains = currentThinkingChains.filter(c => c.id !== tcId);
        saveThinkingChains();
        renderThinkingChains();
      }
    };
  });
}

function ensureThinkingChainModal() {
  if (document.getElementById("tc-edit-modal")) return;
  const modalHtml = `
    <div id="tc-edit-modal" class="modal">
      <div class="modal-content" style="max-width: 380px; width: 90%;">
        <div class="modal-header"><span id="tc-modal-title">编辑思维链</span></div>
        <div class="modal-body" style="padding: 15px;">
          <div class="form-group">
            <label>思考链名称</label>
            <input type="text" id="tc-name-input" class="moe-input" placeholder="例如：冷静的逻辑分析">
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label>思考要求文本 (提示词内容)</label>
            <textarea id="tc-content-input" class="moe-input" rows="5" placeholder="自由填写，要求角色思考时考虑哪些维度、情绪、动机等..."></textarea>
          </div>
          <div class="form-group" style="margin-top: 12px;">
            <label>绑定生效角色</label>
            <div id="tc-char-checkboxes" style="max-height: 120px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; gap: 6px; background: var(--secondary-bg);">
              <!-- 角色复选框列表 -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="cancel" id="cancel-tc-btn">取消</button>
          <button type="button" class="save" id="save-tc-btn">保存</button>
        </div>
      </div>
    </div>
  `;
  const div = document.createElement("div");
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);
}

function openCreateThinkingChainModal() {
  const newTcObj = {
    id: "tc_" + Date.now(),
    name: "",
    content: "",
    boundChars: []
  };
  openEditThinkingChainModal(newTcObj, true);
}

function openEditThinkingChainModal(tcObj, isNew = false) {
  ensureThinkingChainModal();
  const modal = document.getElementById("tc-edit-modal");
  if (!modal) return;

  document.getElementById("tc-modal-title").textContent = isNew ? "新建思维链" : "编辑思维链";
  document.getElementById("tc-name-input").value = tcObj.name || "";
  document.getElementById("tc-content-input").value = tcObj.content || "";

  // 渲染角色复选框列表
  const checkboxContainer = document.getElementById("tc-char-checkboxes");
  if (checkboxContainer) {
    const chatsList = Object.values(state.chats).filter(c => !c.isGroup && c.roleType !== "dice" && c.roleType !== "system_status");
    if (chatsList.length === 0) {
      checkboxContainer.innerHTML = `<span style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 4px;">暂无可用单聊角色</span>`;
    } else {
      checkboxContainer.innerHTML = chatsList.map(chat => {
        const isChecked = (tcObj.boundChars || []).includes(chat.id) ? "checked" : "";
        return `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; color: var(--text-primary);">
            <input type="checkbox" class="tc-char-chk" value="${chat.id}" ${isChecked} style="margin: 0;">
            <span>${chat.name}</span>
          </label>
        `;
      }).join("");
    }
  }

  modal.classList.add("visible");

  // 按钮事件
  document.getElementById("cancel-tc-btn").onclick = () => {
    modal.classList.remove("visible");
  };

  document.getElementById("save-tc-btn").onclick = () => {
    const name = document.getElementById("tc-name-input").value.trim();
    const content = document.getElementById("tc-content-input").value.trim();
    if (!name) {
      alert("请输入思维链名称！");
      return;
    }
    if (!content) {
      alert("请输入思考要求文本内容！");
      return;
    }

    // 搜集选中的角色
    const boundChars = [];
    modal.querySelectorAll(".tc-char-chk:checked").forEach(chk => {
      boundChars.push(chk.value);
    });

    // 确保这些角色不会和其他思维链重合 (一个角色最多只能绑定一个思维链)
    currentThinkingChains.forEach(otherTc => {
      if (otherTc.id !== tcObj.id) {
        otherTc.boundChars = (otherTc.boundChars || []).filter(cid => !boundChars.includes(cid));
      }
    });

    tcObj.name = name;
    tcObj.content = content;
    tcObj.boundChars = boundChars;

    if (isNew) {
      currentThinkingChains.push(tcObj);
    } else {
      const idx = currentThinkingChains.findIndex(c => c.id === tcObj.id);
      if (idx !== -1) {
        currentThinkingChains[idx] = tcObj;
      }
    }

    saveThinkingChains();
    modal.classList.remove("visible");
    renderThinkingChains();
  };
}

// 页面加载完成后自动绑定入口
document.addEventListener("DOMContentLoaded", () => {
  const appIcon = document.getElementById("date-a-live-app-icon");
  if (appIcon) {
    appIcon.addEventListener("click", () => {
      openDatingApp();
    });
  }
});
