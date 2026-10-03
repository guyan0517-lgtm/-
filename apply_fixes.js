import fs from "fs";

// 1. Update style.css button vertical text alignment
let css = fs.readFileSync("style.css", "utf8");

const buttonFixCSS = `
/* 修复按钮上下居中与字缩进错位问题 */
.moe-btn-mini, .btn-stack button, .change-frame-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  line-height: 1 !important;
  box-sizing: border-box !important;
  padding: 4px 10px !important;
  font-size: 12px !important;
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  background: var(--card-bg) !important;
  color: var(--text-primary) !important;
  cursor: pointer;
  width: 100%;
  font-weight: 500 !important;
  height: 30px !important;
  min-height: 30px !important;
  margin: 0 !important;
  vertical-align: middle !important;
}

.moe-btn, .moe-btn-secondary, .moe-btn-small {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  line-height: 1 !important;
  box-sizing: border-box !important;
  vertical-align: middle !important;
}

.modal-header .close {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  height: 30px !important;
  width: 30px !important;
}
`;

if (!css.includes("修复按钮上下居中与字缩进错位问题")) {
  css += "\n" + buttonFixCSS;
  fs.writeFileSync("style.css", css, "utf8");
  console.log("Updated style.css with button flex alignment rules");
}

// 2. Update index.html for Vice API card, Weibo card, and JS bindings
let html = fs.readFileSync("index.html", "utf8");

// Replace Vice API Card HTML
const oldViceCardRegex = /<!-- 副 API 卡片 -->[\s\S]*?<!-- 2\. 语音合成卡片 -->/;
const newViceCardHTML = `<!-- 副 API 卡片 -->
          <div class="moe-card">
            <div class="moe-card-header">
              <span class="icon">⚡</span>
              <h3>副 API</h3>
            </div>
            <div class="moe-card-body">
              <div class="form-group">
                <label>反代地址 (Proxy)</label>
                <input
                  type="text"
                  id="sub-proxy-url"
                  placeholder="https://api.openai.com"
                  class="moe-input"
                />
              </div>
              <div class="form-group">
                <label>密钥 (Key)</label>
                <input
                  type="password"
                  id="sub-api-key"
                  placeholder="sk-..."
                  class="moe-input"
                />
              </div>
              <div class="form-group">
                <label>模型选择 (手动输入 或 拉取后选择)</label>
                <input
                  type="text"
                  id="sub-model-select"
                  class="moe-input"
                  placeholder="如 gpt-4o, claude-3-5-sonnet"
                />
                <select
                  id="sub-fetched-model-list"
                  class="moe-input"
                  style="
                    margin-top: 5px;
                    display: none;
                    border: 1px dashed var(--accent-color);
                  "
                  onchange="
                    document.getElementById('sub-model-select').value = this.value
                  "
                >
                  <option value="">▼ 点击此处选择已拉取的模型</option>
                </select>
              </div>
              <div class="form-group">
                <label
                  >温度 (随机性):
                  <span
                    id="sub-temperature-value"
                    style="color: var(--accent-color)"
                    >0.8</span
                  ></label
                >
                <input
                  type="range"
                  id="sub-temperature-slider"
                  min="0"
                  max="2"
                  step="0.1"
                  value="0.8"
                  class="moe-slider"
                />
              </div>
              <button id="sub-fetch-models-btn" class="moe-btn-secondary" type="button">
                拉取模型列表
              </button>
              <div class="form-group" style="margin-top: 14px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; display: block;">用途</label>
                <div style="display: flex; flex-direction: column; gap: 8px; background: var(--secondary-bg); padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border-color);">
                  <label style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; text-align: left;">
                    <input type="checkbox" id="sub-usage-summary" class="sub-usage-checkbox" value="summary" style="margin: 0;" />
                    <span>总结聊天记录</span>
                  </label>
                  <label style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; text-align: left;">
                    <input type="checkbox" id="sub-usage-fanfic" class="sub-usage-checkbox" value="fanfic" style="margin: 0;" />
                    <span>同人文生成</span>
                  </label>
                  <label style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; text-align: left;">
                    <input type="checkbox" id="sub-usage-module" class="sub-usage-checkbox" value="module" style="margin: 0;" />
                    <span>模组自动分割</span>
                  </label>
                  <label style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; text-align: left;">
                    <input type="checkbox" id="sub-usage-avatar-gen" class="sub-usage-checkbox" value="avatar_gen" style="margin: 0;" />
                    <span>头像、道具图生成</span>
                  </label>
                  <label style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; text-align: left;">
                    <input type="checkbox" id="sub-usage-map" class="sub-usage-checkbox" value="map" style="margin: 0;" />
                    <span>地图生成</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <!-- 2. 语音合成卡片 -->`;

if (oldViceCardRegex.test(html)) {
  html = html.replace(oldViceCardRegex, newViceCardHTML);
  console.log("Replaced Vice API card HTML");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("apply_fixes.js completed part 1");
