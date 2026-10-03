import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

// 1. Ensure saveAvatarFromCanvas handles rotate and flipH properly on 300x300 canvas
const oldSaveAvatar = /function saveAvatarFromCanvas\(\) \{[\s\S]*?alert\("头像保存成功！"\);[\s\S]*?\}/;
const newSaveAvatar = `function saveAvatarFromCanvas() {
  if (!avatarCropState.rawImg) {
    alert("请先生成图片");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 300, 300);

  const ratio = 300 / 200;

  ctx.save();
  ctx.translate(150, 150);
  if (avatarCropState.flipH) ctx.scale(-1, 1);
  if (avatarCropState.rotate) ctx.rotate((avatarCropState.rotate * Math.PI) / 180);

  const raw = avatarCropState.rawImg;
  const drawWidth = raw.naturalWidth * avatarCropState.scale * ratio;
  const drawHeight = raw.naturalHeight * avatarCropState.scale * ratio;
  const drawX = (avatarCropState.x - 100) * ratio;
  const drawY = (avatarCropState.y - 100) * ratio;

  ctx.drawImage(raw, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  const avatarDataUrl = canvas.toDataURL("image/png");

  if (currentAvatarGenTarget === "ai") {
    const preview = document.getElementById("ai-avatar-preview");
    if (preview) preview.src = avatarDataUrl;
    if (state.activeChatId && state.chats[state.activeChatId]) {
      state.chats[state.activeChatId].avatar = avatarDataUrl;
      if (!state.chats[state.activeChatId].settings) state.chats[state.activeChatId].settings = {};
      state.chats[state.activeChatId].settings.aiAvatar = avatarDataUrl;
      if (typeof db !== "undefined" && db.chats) db.chats.put(state.chats[state.activeChatId]);
      if (typeof renderChatList === "function") renderChatList();
      if (typeof updateChatHeader === "function") updateChatHeader();
    }
  } else if (currentAvatarGenTarget === "my") {
    const preview = document.getElementById("my-avatar-preview");
    if (preview) preview.src = avatarDataUrl;
    const profileImg = document.getElementById("profile-avatar-img");
    if (profileImg) profileImg.src = avatarDataUrl;
    if (state.qzoneSettings) {
      state.qzoneSettings.avatar = avatarDataUrl;
      if (typeof db !== "undefined" && db.qzoneSettings) db.qzoneSettings.put(state.qzoneSettings);
    }
  } else if (currentAvatarGenTarget === "group") {
    const preview = document.getElementById("group-avatar-preview");
    if (preview) preview.src = avatarDataUrl;
    if (state.activeChatId && state.chats[state.activeChatId]) {
      state.chats[state.activeChatId].avatar = avatarDataUrl;
      if (!state.chats[state.activeChatId].settings) state.chats[state.activeChatId].settings = {};
      state.chats[state.activeChatId].settings.groupAvatar = avatarDataUrl;
      if (typeof db !== "undefined" && db.chats) db.chats.put(state.chats[state.activeChatId]);
      if (typeof renderChatList === "function") renderChatList();
      if (typeof updateChatHeader === "function") updateChatHeader();
    }
  } else if (currentAvatarGenTarget === "member" && typeof editingMemberId !== "undefined") {
    const preview = document.getElementById("member-avatar-preview");
    if (preview) preview.src = avatarDataUrl;
    const chat = state.chats[state.activeChatId];
    if (chat && chat.members) {
      const member = chat.members.find(m => m.id === editingMemberId);
      if (member) {
        member.avatar = avatarDataUrl;
        if (typeof db !== "undefined" && db.chats) db.chats.put(chat);
      }
    }
  }

  const modal = document.getElementById("avatar-gen-modal");
  if (modal) modal.style.display = "none";
  alert("头像保存成功！");
}`;

if (oldSaveAvatar.test(html)) {
  html = html.replace(oldSaveAvatar, newSaveAvatar);
  console.log("Updated saveAvatarFromCanvas");
}

// 2. Ensure initAvatarGenModalEvents binds listeners for all buttons
const oldInitEvents = /function initAvatarGenModalEvents\(\) \{[\s\S]*?\n\}/;
const newInitEvents = `function initAvatarGenModalEvents() {
  const closeBtn = document.getElementById("close-avatar-gen-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("avatar-gen-modal").style.display = "none";
    });
  }

  const flipBtn = document.getElementById("avatar-crop-flip-btn");
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      avatarCropState.flipH = !avatarCropState.flipH;
      updateAvatarCropTransform();
    });
  }

  const rotateBtn = document.getElementById("avatar-crop-rotate-btn");
  if (rotateBtn) {
    rotateBtn.addEventListener("click", () => {
      avatarCropState.rotate = ((avatarCropState.rotate || 0) + 90) % 360;
      updateAvatarCropTransform();
    });
  }

  const resetBtn = document.getElementById("avatar-crop-reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (avatarCropState.rawImg) setupAvatarCropImage(avatarCropState.rawImg);
    });
  }

  const saveBtn = document.getElementById("avatar-gen-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveAvatarFromCanvas);
  }

  const makePromptBtn = document.getElementById("avatar-gen-make-prompt-btn");
  if (makePromptBtn) {
    makePromptBtn.addEventListener("click", async () => {
      const appearanceText = document.getElementById("avatar-gen-appearance").value.trim();
      if (!appearanceText) {
        alert("请先填写外貌描述");
        return;
      }
      const statusDiv = document.getElementById("avatar-gen-status");
      statusDiv.style.display = "block";
      statusDiv.textContent = "正在生成 prompt...";
      makePromptBtn.disabled = true;
      try {
        const sysPrompt = "你是一个 AI 绘图 Prompt 专家。根据用户提供的角色外貌描述，将其转化为 NovelAI / Stable Diffusion 生图使用的英文 Tag 提示词。只输出英文 Tag 提示词，用逗号分隔，不要包含任何中文、解释或 Markdown。";
        let generatedTags = await callAuxiliaryAI(sysPrompt, appearanceText);
        generatedTags = generatedTags.trim().replace(/^\\\`\\\`\\\`[a-z]*/i, "").replace(/\\\`\\\`\\\`$/i, "").trim();
        document.getElementById("avatar-gen-prompt-input").value = generatedTags;
        statusDiv.textContent = "prompt 已生成！";
      } catch (err) {
        alert("生成 prompt 失败: " + err.message);
        statusDiv.style.display = "none";
      } finally {
        makePromptBtn.disabled = false;
      }
    });
  }

  const doGenBtn = document.getElementById("avatar-gen-do-gen-btn");
  if (doGenBtn) {
    doGenBtn.addEventListener("click", async () => {
      const userPrompt = document.getElementById("avatar-gen-prompt-input").value.trim();
      if (!userPrompt) {
        alert("请先填写提示词");
        return;
      }
      const apiKey = localStorage.getItem("novelai-api-key");
      if (!apiKey) {
        alert("请先在 NovelAI 设置中填写 API Key！");
        return;
      }
      const statusDiv = document.getElementById("avatar-gen-status");
      statusDiv.style.display = "block";
      statusDiv.textContent = "正在生成图片，请稍候...";
      doGenBtn.disabled = true;
      try {
        const finalPositive = buildNovelAIPositivePrompt({
          userPrompt: userPrompt,
          isAvatar: true
        });
        const settings = getNovelAISettings();
        const model = localStorage.getItem("novelai-model") || "nai-diffusion-4-5-full";
        const requestBody = {
          input: finalPositive,
          model: model,
          action: "generate",
          parameters: {
            width: 1024,
            height: 1024,
            scale: settings.cfg_scale || 5,
            sampler: settings.sampler || "k_euler_ancestral",
            steps: settings.steps || 28,
            seed: settings.seed === -1 ? Math.floor(Math.random() * 4294967295) : settings.seed,
            n_samples: 1,
            ucPreset: settings.uc_preset || 1,
            qualityToggle: false,
            negative_prompt: settings.default_negative || ""
          }
        };
        if (model.includes("nai-diffusion-4")) {
          requestBody.parameters.params_version = 3;
          requestBody.parameters.v4_prompt = {
            caption: {
              base_caption: finalPositive,
              char_captions: []
            },
            use_coords: false,
            use_order: true
          };
        }
        let apiUrl = model.includes("nai-diffusion-4")
          ? "https://image.novelai.net/ai/generate-image-stream"
          : "https://image.novelai.net/ai/generate-image";
        let corsProxy = settings.cors_proxy === "custom" ? (settings.custom_proxy_url || "") : settings.cors_proxy;
        if (corsProxy) {
          apiUrl = corsProxy + encodeURIComponent(apiUrl);
        }
        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey
          },
          body: JSON.stringify(requestBody)
        });
        if (!resp.ok) {
          const errTxt = await resp.text();
          throw new Error("API 失败 (" + resp.status + "): " + errTxt);
        }
        const contentType = resp.headers.get("content-type");
        let imageBlob = null;
        if (contentType && contentType.includes("text/event-stream")) {
          const text = await resp.text();
          const lines = text.trim().split("\\n");
          let base64Data = null;
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              const content = line.substring(6);
              try {
                const json = JSON.parse(content);
                if (json.event_type === "final" && json.image) {
                  base64Data = json.image;
                  break;
                }
                if (json.data) { base64Data = json.data; break; }
                if (json.image) { base64Data = json.image; break; }
              } catch (e) {
                base64Data = content;
                break;
              }
            }
          }
          if (!base64Data) throw new Error("解压图片数据失败");
          const isPNG = base64Data.startsWith("iVBORw0KGgo");
          const isJPEG = base64Data.startsWith("/9j/");
          if (isPNG || isJPEG) {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            imageBlob = new Blob([bytes], { type: isPNG ? "image/png" : "image/jpeg" });
          } else {
            imageBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: "image/png" });
          }
        } else {
          imageBlob = await resp.blob();
        }
        const imgUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        img.onload = () => {
          setupAvatarCropImage(img);
          statusDiv.style.display = "none";
        };
        img.src = imgUrl;
      } catch (err) {
        alert("生图失败: " + err.message);
        statusDiv.style.display = "none";
      } finally {
        doGenBtn.disabled = false;
      }
    });
  }

  const viewport = document.getElementById("avatar-crop-viewport");
  if (viewport) {
    viewport.addEventListener("pointerdown", (e) => {
      if (!avatarCropState.rawImg) return;
      avatarCropState.isDragging = true;
      avatarCropState.startX = e.clientX;
      avatarCropState.startY = e.clientY;
      avatarCropState.startXPos = avatarCropState.x;
      avatarCropState.startYPos = avatarCropState.y;
      viewport.style.cursor = "grabbing";

      avatarCropState.clickCount++;
      if (avatarCropState.clickCount === 1) {
        avatarCropState.clickTimer = setTimeout(() => {
          avatarCropState.clickCount = 0;
        }, 500);
      }
      if (avatarCropState.clickCount >= 3) {
        clearTimeout(avatarCropState.clickTimer);
        avatarCropState.clickCount = 0;
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        const imgEl = document.getElementById("avatar-crop-img");
        if (imgEl && imgEl.src) {
          const a = document.createElement("a");
          a.href = imgEl.src;
          a.download = "avatar-" + Date.now() + ".png";
          a.click();
        }
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!avatarCropState.isDragging) return;
      const dx = e.clientX - avatarCropState.startX;
      const dy = e.clientY - avatarCropState.startY;
      avatarCropState.x = avatarCropState.startXPos + dx;
      avatarCropState.y = avatarCropState.startYPos + dy;
      updateAvatarCropTransform();
    });

    window.addEventListener("pointerup", () => {
      avatarCropState.isDragging = false;
      if (viewport) viewport.style.cursor = "grab";
    });

    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (!avatarCropState.rawImg) return;
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const newScale = Math.max(0.1, Math.min(10, avatarCropState.scale + delta));
      setAvatarCropScale(newScale);
    }, { passive: false });
  }
}`;

if (oldInitEvents.test(html)) {
  html = html.replace(oldInitEvents, newInitEvents);
  console.log("Updated initAvatarGenModalEvents");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("patch_events.js done!");
