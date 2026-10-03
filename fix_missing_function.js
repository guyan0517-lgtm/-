import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

const saveAvatarFuncCode = `function saveAvatarFromCanvas() {
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

if (!html.includes("function saveAvatarFromCanvas()")) {
  const insertMarker = "function initAvatarGenModalEvents()";
  if (html.includes(insertMarker)) {
    html = html.replace(insertMarker, saveAvatarFuncCode + "\n\n" + insertMarker);
    console.log("Inserted saveAvatarFromCanvas before initAvatarGenModalEvents");
  } else {
    console.error("Marker not found!");
  }
} else {
  console.log("saveAvatarFromCanvas is already defined");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("fix_missing_function.js complete!");
