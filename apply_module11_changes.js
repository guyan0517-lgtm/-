import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

// 1. Add Sub API Card to api-settings-modal
const targetApiCard = `<button id="fetch-models-btn" class="moe-btn-secondary">\n                📡 拉取模型列表\n              </button>\n            </div>\n          </div>`;

const subApiCardHtml = `<button id="fetch-models-btn" class="moe-btn-secondary">
                拉取模型列表
              </button>
            </div>
          </div>

          <!-- 副 API 卡片 -->
          <div class="moe-card">
            <div class="moe-card-header">
              <h3>副 API</h3>
            </div>
            <div class="moe-card-body">
              <div class="form-group">
                <label>反代地址</label>
                <input
                  type="text"
                  id="sub-proxy-url"
                  placeholder="https://api.openai.com"
                  class="moe-input"
                />
              </div>
              <div class="form-group">
                <label>密钥</label>
                <input
                  type="password"
                  id="sub-api-key"
                  placeholder="sk-..."
                  class="moe-input"
                />
              </div>
              <div class="form-group">
                <label>模型选择</label>
                <input
                  type="text"
                  id="sub-model-select"
                  class="moe-input"
                  placeholder="如 gpt-4o, gemini-1.5-flash"
                />
              </div>
              <div class="form-group">
                <label>自选用途</label>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="sub-usage-summary" class="sub-usage-checkbox" value="summary" />
                    1. 总结聊天记录
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="sub-usage-fanfic" class="sub-usage-checkbox" value="fanfic" />
                    2. 同人文生成
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="sub-usage-module" class="sub-usage-checkbox" value="module" />
                    3. 模组自动分割
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="sub-usage-avatar-gen" class="sub-usage-checkbox" value="avatar_gen" />
                    4. 头像、道具图生成
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="sub-usage-map" class="sub-usage-checkbox" value="map" />
                    5. 地图生成
                  </label>
                </div>
              </div>
            </div>
          </div>`;

if (html.includes(targetApiCard)) {
  html = html.replace(targetApiCard, subApiCardHtml);
  console.log("SUCCESS 1: Added Sub API card to api-settings-modal");
} else {
  console.error("ERROR 1: Target API card not found");
}

// 2. Add "生图" button to group-avatar-group and member-avatar-group
const targetGroupAvatarBtn = `<button\n                      onclick="\n                        document.getElementById('group-avatar-input').click()\n                      "\n                      class="moe-btn-mini"\n                    >\n                      上传\n                    </button>`;
const replaceGroupAvatarBtn = `<button
                      onclick="
                        document.getElementById('group-avatar-input').click()
                      "
                      class="moe-btn-mini"
                    >
                      上传
                    </button>
                    <button
                      id="group-avatar-gen-btn"
                      class="moe-btn-mini"
                      type="button"
                    >
                      生图
                    </button>`;

if (html.includes(targetGroupAvatarBtn)) {
  html = html.replace(targetGroupAvatarBtn, replaceGroupAvatarBtn);
  console.log("SUCCESS 2A: Added group-avatar-gen-btn");
} else {
  console.error("ERROR 2A: Target group avatar btn not found");
}

const targetMemberAvatarUpload = `<div class="avatar-upload">\n              <img id="member-avatar-preview" />\n              <button\n                onclick="document.getElementById('member-avatar-input').click()"\n              >\n                上传头像\n              </button>`;

const replaceMemberAvatarUpload = `<div class="avatar-upload">
              <img id="member-avatar-preview" />
              <button
                onclick="document.getElementById('member-avatar-input').click()"
              >
                上传头像
              </button>
              <button
                id="member-avatar-gen-btn"
                class="moe-btn-mini"
                type="button"
                style="margin-top: 4px;"
              >
                生图
              </button>`;

if (html.includes(targetMemberAvatarUpload)) {
  html = html.replace(targetMemberAvatarUpload, replaceMemberAvatarUpload);
  console.log("SUCCESS 2B: Added member-avatar-gen-btn");
} else {
  console.error("ERROR 2B: Target member avatar upload not found");
}

// 3. Add NOV 生图 switch to chat-settings-modal
const targetChatSettingsDivider = `<!-- 保存/取消 按钮 -->`;
const novGenSwitchHtml = `<!-- NOV 生图设置 -->
            <div class="moe-card" style="margin-top: 10px;">
              <div class="moe-card-header">
                <h3>NOV 生图</h3>
              </div>
              <div class="moe-card-body">
                <div class="form-group">
                  <label class="toggle-switch-label">
                    <span class="toggle-switch-text">NOV 生图</span>
                    <label class="toggle-switch">
                      <input type="checkbox" id="chat-nov-gen-switch" />
                      <span class="slider"></span>
                    </label>
                  </label>
                </div>
                <div id="chat-nov-gen-guide-container" style="display: none; margin-top: 10px;">
                  <div class="form-group">
                    <label>生图规范提示词</label>
                    <textarea id="chat-nov-gen-guide-input" class="moe-input" rows="2" placeholder="输入生成规范提示词..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- 保存/取消 按钮 -->`;

if (html.includes(targetChatSettingsDivider)) {
  html = html.replace(targetChatSettingsDivider, novGenSwitchHtml);
  console.log("SUCCESS 3: Added NOV 生图 switch to chat-settings-modal");
} else {
  console.error("ERROR 3: Target chat settings divider not found");
}

// 4. Update avatar-gen-modal HTML layout (2-column layout: left 1/2 textareas & buttons, right 1*1 box & circular vector buttons)
const targetAvatarGenModal = `<div id="avatar-gen-modal" class="modal" style="display: none;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>`;

const updatedAvatarGenModal = `<div id="avatar-gen-modal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 640px; width: 94%; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
          <span style="font-weight: 600; font-size: 16px; color: var(--text-primary);">生图</span>
          <span class="close" id="close-avatar-gen-modal" style="cursor: pointer; font-size: 24px; font-weight: bold; color: var(--text-secondary);">&times;</span>
        </div>
        <div class="modal-body" style="padding: 16px;">
          <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start;">
            <!-- 左侧 宽度二分之一 -->
            <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; display: block;">外貌描述</label>
                <textarea id="avatar-gen-appearance" class="moe-input" rows="3" placeholder="输入外貌特征..." style="width: 100%; box-sizing: border-box; resize: vertical;"></textarea>
              </div>

              <button type="button" id="avatar-gen-make-prompt-btn" class="moe-btn-secondary" style="width: 100%; font-size: 13px; height: 34px; border-radius: 17px;">
                生成prompt
              </button>

              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; display: block;">提示词 Prompt</label>
                <textarea id="avatar-gen-prompt-input" class="moe-input" rows="4" placeholder="英文化生图提示词..." style="width: 100%; box-sizing: border-box; resize: vertical;"></textarea>
              </div>

              <button type="button" id="avatar-gen-do-gen-btn" class="moe-btn" style="width: 100%; font-size: 14px; height: 36px; border-radius: 18px; background-color: var(--accent-color); color: #fff;">
                生图
              </button>

              <div id="avatar-gen-status" style="display: none; text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 4px;"></div>
            </div>

            <!-- 右侧 1*1 方框与圆形矢量图按钮 -->
            <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <!-- 1*1 方框 支持手拖动缩放 旋转 -->
              <div id="avatar-crop-viewport" style="width: 200px; height: 200px; border-radius: 12px; border: 2px solid var(--accent-color); overflow: hidden; position: relative; cursor: grab; background-color: var(--secondary-bg); touch-action: none;">
                <img id="avatar-crop-img" src="" alt="头像预览" style="position: absolute; top: 0; left: 0; transform-origin: center center; user-select: none; pointer-events: none; max-width: none;" />
              </div>

              <!-- 下方圆形矢量图按钮 -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%;">
                <!-- 镜像翻转 -->
                <button type="button" id="avatar-crop-flip-btn" title="镜像翻转" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3L21 7L17 11"/><path d="M3 7H21"/><path d="M7 21L3 17L7 13"/><path d="M21 17H3"/></svg>
                </button>

                <!-- 旋转 -->
                <button type="button" id="avatar-crop-rotate-btn" title="旋转" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                </button>

                <!-- 重置 -->
                <button type="button" id="avatar-crop-reset-btn" title="重置" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>

                <!-- 保存成为头像 -->
                <button type="button" id="avatar-gen-save-btn" title="保存" style="width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--accent-color); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

const regexModal = new RegExp(targetAvatarGenModal, "i");
if (regexModal.test(html)) {
  html = html.replace(regexModal, updatedAvatarGenModal);
  console.log("SUCCESS 4: Updated avatar-gen-modal HTML layout");
} else {
  console.error("ERROR 4: Target avatar gen modal not found");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("Finished updating HTML structures in index.html");
