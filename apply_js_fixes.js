import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

// 1. Update save-api-settings-btn click listener to handle sub API values properly
const oldSaveApiLogic = /state\.apiConfig\.minimaxApiKey = document[\s\S]*?\.value;/;
const newSaveApiLogic = `state.apiConfig.minimaxApiKey = document.getElementById("minimax-api-key").value;
              state.apiConfig.subProxyUrl = (document.getElementById("sub-proxy-url")?.value || "").trim();
              state.apiConfig.subApiKey = (document.getElementById("sub-api-key")?.value || "").trim();
              state.apiConfig.subModel = (document.getElementById("sub-model-select")?.value || "").trim();
              const subTempEl = document.getElementById("sub-temperature-slider");
              if (subTempEl) state.apiConfig.subTemperature = parseFloat(subTempEl.value);
              const selectedUsages = [];
              document.querySelectorAll(".sub-usage-checkbox:checked").forEach(cb => {
                selectedUsages.push(cb.value);
              });
              state.apiConfig.subUsages = selectedUsages;`;

if (oldSaveApiLogic.test(html)) {
  html = html.replace(oldSaveApiLogic, newSaveApiLogic);
  console.log("Updated save-api-settings-btn click listener");
}

// 2. Update enable-all-weibo-btn listener to toggle on/off and switch text
const oldWeiboListener = /const enableAllWeiboBtn = document\.getElementById\("enable-all-weibo-btn"\);[\s\S]*?\}\);[\s\S]*?\}/;
const newWeiboListener = `const enableAllWeiboBtn = document.getElementById("enable-all-weibo-btn");
          if (enableAllWeiboBtn) {
            enableAllWeiboBtn.addEventListener("click", async () => {
              const currentText = enableAllWeiboBtn.textContent.trim();
              const isTurnedOn = currentText === "关闭";
              const targetState = !isTurnedOn;
              let count = 0;
              for (const id in state.chats) {
                const c = state.chats[id];
                if (c && !c.isGroup) {
                  if (!c.settings) c.settings = {};
                  c.settings.weiboEnabled = targetState;
                  await db.chats.put(c);
                  count++;
                }
              }
              enableAllWeiboBtn.textContent = targetState ? "关闭" : "开启";
              const msg = targetState ? "已开启全体好友微博" : "已关闭全体好友微博";
              if (typeof showCustomAlert === "function") {
                await showCustomAlert("提示", msg);
              } else {
                alert(msg);
              }
            });
          }`;

if (oldWeiboListener.test(html)) {
  html = html.replace(oldWeiboListener, newWeiboListener);
  console.log("Updated enable-all-weibo-btn listener");
}

// 3. Ensure sub-api fetch models & temperature slider & avatar gen button bindings are initialized
const initAdditions = `
        // 副 API 拉取模型与温度滑块绑定
        const subFetchBtn = document.getElementById("sub-fetch-models-btn");
        if (subFetchBtn) {
          subFetchBtn.addEventListener("click", async () => {
            const proxyUrl = (document.getElementById("sub-proxy-url")?.value || "").trim();
            const apiKey = (document.getElementById("sub-api-key")?.value || "").trim();
            if (!apiKey) return alert("请先填写副 API 密钥 Key！");
            const selectEl = document.getElementById("sub-fetched-model-list");
            subFetchBtn.disabled = true;
            subFetchBtn.textContent = "正在拉取...";
            try {
              const targetUrl = proxyUrl ? (proxyUrl.endsWith("/") ? proxyUrl + "v1/models" : proxyUrl + "/v1/models") : "https://api.openai.com/v1/models";
              const resp = await fetch(targetUrl, {
                headers: { Authorization: "Bearer " + apiKey }
              });
              if (!resp.ok) throw new Error("HTTP " + resp.status);
              const data = await resp.json();
              const modelsList = data.data || data.models || [];
              if (selectEl) {
                selectEl.innerHTML = '<option value="">▼ 点击此处选择已拉取的模型</option>';
                modelsList.forEach(m => {
                  const mId = m.id || m.name || m;
                  const opt = document.createElement("option");
                  opt.value = mId;
                  opt.textContent = mId;
                  selectEl.appendChild(opt);
                });
                selectEl.style.display = "block";
              }
              alert("成功拉取到 " + modelsList.length + " 个模型！");
            } catch (e) {
              alert("拉取模型失败: " + e.message);
            } finally {
              subFetchBtn.disabled = false;
              subFetchBtn.textContent = "拉取模型列表";
            }
          });
        }

        const subTempSlider = document.getElementById("sub-temperature-slider");
        if (subTempSlider) {
          subTempSlider.addEventListener("input", (e) => {
            const valEl = document.getElementById("sub-temperature-value");
            if (valEl) valEl.textContent = e.target.value;
          });
        }

        // 绑定所有头像下方的“生图”按钮
        document.getElementById("my-avatar-gen-btn")?.addEventListener("click", () => openAvatarGenModal("my"));
        document.getElementById("ai-avatar-gen-btn")?.addEventListener("click", () => openAvatarGenModal("ai"));
        document.getElementById("group-avatar-gen-btn")?.addEventListener("click", () => openAvatarGenModal("group"));
        document.getElementById("member-avatar-gen-btn")?.addEventListener("click", () => openAvatarGenModal("member"));
`;

if (!html.includes("sub-fetch-models-btn")) {
  const insertMarker = 'const enableAllWeiboBtn = document.getElementById("enable-all-weibo-btn");';
  html = html.replace(insertMarker, initAdditions + "\n        " + insertMarker);
  console.log("Inserted Vice API fetch & avatar button binding logic");
}

// 4. Update loadApiSettings to restore Vice API fields and Weibo all button status
const oldLoadApiLogic = /document\.getElementById\("minimax-api-key"\)\.value =[\s\S]*?;\n/;
const newLoadApiLogic = `document.getElementById("minimax-api-key").value =
          state.apiConfig.minimaxApiKey || "";
        if (document.getElementById("sub-proxy-url")) document.getElementById("sub-proxy-url").value = state.apiConfig.subProxyUrl || "";
        if (document.getElementById("sub-api-key")) document.getElementById("sub-api-key").value = state.apiConfig.subApiKey || "";
        if (document.getElementById("sub-model-select")) document.getElementById("sub-model-select").value = state.apiConfig.subModel || "";
        if (document.getElementById("sub-temperature-slider")) {
          const subT = typeof state.apiConfig.subTemperature !== "undefined" ? state.apiConfig.subTemperature : 0.8;
          document.getElementById("sub-temperature-slider").value = subT;
          if (document.getElementById("sub-temperature-value")) document.getElementById("sub-temperature-value").textContent = subT;
        }
        const usages = state.apiConfig.subUsages || [];
        document.querySelectorAll(".sub-usage-checkbox").forEach(cb => {
          cb.checked = usages.includes(cb.value);
        });
        
        let allWeiboOn = true;
        let singleChatCount = 0;
        for (const id in state.chats) {
          const c = state.chats[id];
          if (c && !c.isGroup) {
            singleChatCount++;
            if (!c.settings?.weiboEnabled) allWeiboOn = false;
          }
        }
        const weiboBtn = document.getElementById("enable-all-weibo-btn");
        if (weiboBtn) weiboBtn.textContent = (singleChatCount > 0 && allWeiboOn) ? "关闭" : "开启";
`;

if (oldLoadApiLogic.test(html)) {
  html = html.replace(oldLoadApiLogic, newLoadApiLogic);
  console.log("Updated loadApiSettings logic");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("apply_js_fixes.js completed!");
