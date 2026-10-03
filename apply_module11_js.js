import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

// JS Code for Module 11
const module11Js = fs.readFileSync("module11_logic.js", "utf8");

// Replace avatarCropState and event handling to support rotation & flipX
const targetCropJs = `let avatarCropState = {
          rawImg: null,
          scale: 1,
          coverScale: 1,
          x: 0,
          y: 0,
          isDragging: false,
          startX: 0,
          startY: 0,
          startXPos: 0,
          startYPos: 0,
          clickCount: 0,
          clickTimer: null
        };`;

const replaceCropJs = `let avatarCropState = {
          rawImg: null,
          scale: 1,
          coverScale: 1,
          x: 0,
          y: 0,
          rotation: 0,
          isFlippedX: false,
          isDragging: false,
          startX: 0,
          startY: 0,
          startXPos: 0,
          startYPos: 0,
          clickCount: 0,
          clickTimer: null
        };`;

if (html.includes(targetCropJs)) {
  html = html.replace(targetCropJs, replaceCropJs);
  console.log("SUCCESS: Updated avatarCropState definition");
}

const targetUpdateTransform = `function updateAvatarCropTransform() {
          const imgEl = document.getElementById("avatar-crop-img");
          if (!imgEl) return;
          imgEl.style.transform = "translate(" + avatarCropState.x + "px, " + avatarCropState.y + "px) scale(" + avatarCropState.scale + ")";
        }`;

const replaceUpdateTransform = `function updateAvatarCropTransform() {
          const imgEl = document.getElementById("avatar-crop-img");
          if (!imgEl) return;
          const flip = avatarCropState.isFlippedX ? -1 : 1;
          imgEl.style.transform = \`translate(\${avatarCropState.x}px, \${avatarCropState.y}px) scale(\${avatarCropState.scale}) rotate(\${avatarCropState.rotation}deg) scaleX(\${flip})\`;
        }`;

if (html.includes(targetUpdateTransform)) {
  html = html.replace(targetUpdateTransform, replaceUpdateTransform);
  console.log("SUCCESS: Updated updateAvatarCropTransform");
}

const targetCropSetup = `function setupAvatarCropImage(img) {
          avatarCropState.rawImg = img;
          const coverScale = Math.max(220 / img.naturalWidth, 220 / img.naturalHeight);
          avatarCropState.coverScale = coverScale;
          avatarCropState.scale = coverScale;
          avatarCropState.x = (220 - img.naturalWidth * coverScale) / 2;
          avatarCropState.y = (220 - img.naturalHeight * coverScale) / 2;`;

const replaceCropSetup = `function setupAvatarCropImage(img) {
          avatarCropState.rawImg = img;
          const coverScale = Math.max(200 / img.naturalWidth, 200 / img.naturalHeight);
          avatarCropState.coverScale = coverScale;
          avatarCropState.scale = coverScale;
          avatarCropState.x = (200 - img.naturalWidth * coverScale) / 2;
          avatarCropState.y = (200 - img.naturalHeight * coverScale) / 2;
          avatarCropState.rotation = 0;
          avatarCropState.isFlippedX = false;`;

if (html.includes(targetCropSetup)) {
  html = html.replace(targetCropSetup, replaceCropSetup);
  console.log("SUCCESS: Updated setupAvatarCropImage");
}

// Update Save Button canvas rendering in initAvatarGenModalEvents
const targetCanvasSave = `if (saveBtn) {
            saveBtn.addEventListener("click", () => {
              if (!avatarCropState.rawImg) return;
              const canvas = document.createElement("canvas");
              canvas.width = 300;
              canvas.height = 300;
              const ctx = canvas.getContext("2d");
              const ratio = 300 / 220;

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, 300, 300);

              const raw = avatarCropState.rawImg;
              ctx.drawImage(
                raw,
                0, 0, raw.naturalWidth, raw.naturalHeight,
                avatarCropState.x * ratio, avatarCropState.y * ratio,
                raw.naturalWidth * avatarCropState.scale * ratio,
                raw.naturalHeight * avatarCropState.scale * ratio
              );`;

const replaceCanvasSave = `if (saveBtn) {
            saveBtn.addEventListener("click", () => {
              if (!avatarCropState.rawImg) return;
              const canvas = document.createElement("canvas");
              canvas.width = 300;
              canvas.height = 300;
              const ctx = canvas.getContext("2d");
              const ratio = 300 / 200;

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, 300, 300);

              ctx.save();
              ctx.translate(150, 150);
              ctx.rotate((avatarCropState.rotation * Math.PI) / 180);
              ctx.scale(avatarCropState.isFlippedX ? -1 : 1, 1);

              const raw = avatarCropState.rawImg;
              const drawW = raw.naturalWidth * avatarCropState.scale * ratio;
              const drawH = raw.naturalHeight * avatarCropState.scale * ratio;
              const drawX = (avatarCropState.x - 100) * ratio;
              const drawY = (avatarCropState.y - 100) * ratio;

              ctx.drawImage(raw, drawX, drawY, drawW, drawH);
              ctx.restore();`;

if (html.includes(targetCanvasSave)) {
  html = html.replace(targetCanvasSave, replaceCanvasSave);
  console.log("SUCCESS: Updated Save Button canvas rendering");
}

// Update target avatar handling in Save button
const targetSaveAvatarTargets = `if (currentAvatarGenTarget === "ai") {
                const preview = document.getElementById("ai-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
                if (state.activeChatId && state.chats[state.activeChatId]) {
                  state.chats[state.activeChatId].avatar = avatarDataUrl;
                  if (!state.chats[state.activeChatId].settings) state.chats[state.activeChatId].settings = {};
                  state.chats[state.activeChatId].settings.aiAvatar = avatarDataUrl;
                  if (typeof db !== "undefined" && db.chats) {
                    db.chats.put(state.chats[state.activeChatId]);
                  }
                  if (typeof renderChatList === "function") renderChatList();
                  if (typeof updateChatHeader === "function") updateChatHeader();
                }
              } else {
                const preview = document.getElementById("my-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
                const profileImg = document.getElementById("profile-avatar-img");
                if (profileImg) profileImg.src = avatarDataUrl;
                if (state.qzoneSettings) {
                  state.qzoneSettings.avatar = avatarDataUrl;
                  if (typeof db !== "undefined" && db.qzoneSettings) {
                    db.qzoneSettings.put(state.qzoneSettings);
                  }
                }
              }`;

const replaceSaveAvatarTargets = `if (currentAvatarGenTarget === "ai") {
                const preview = document.getElementById("ai-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
                if (state.activeChatId && state.chats[state.activeChatId]) {
                  state.chats[state.activeChatId].avatar = avatarDataUrl;
                  if (!state.chats[state.activeChatId].settings) state.chats[state.activeChatId].settings = {};
                  state.chats[state.activeChatId].settings.aiAvatar = avatarDataUrl;
                  if (typeof db !== "undefined" && db.chats) {
                    db.chats.put(state.chats[state.activeChatId]);
                  }
                  if (typeof renderChatList === "function") renderChatList();
                  if (typeof updateChatHeader === "function") updateChatHeader();
                }
              } else if (currentAvatarGenTarget === "group") {
                const preview = document.getElementById("group-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
                if (state.activeChatId && state.chats[state.activeChatId]) {
                  if (!state.chats[state.activeChatId].settings) state.chats[state.activeChatId].settings = {};
                  state.chats[state.activeChatId].settings.groupAvatar = avatarDataUrl;
                  if (typeof db !== "undefined" && db.chats) {
                    db.chats.put(state.chats[state.activeChatId]);
                  }
                }
              } else if (currentAvatarGenTarget === "member") {
                const preview = document.getElementById("member-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
              } else {
                const preview = document.getElementById("my-avatar-preview");
                if (preview) preview.src = avatarDataUrl;
                const profileImg = document.getElementById("profile-avatar-img");
                if (profileImg) profileImg.src = avatarDataUrl;
                if (state.qzoneSettings) {
                  state.qzoneSettings.avatar = avatarDataUrl;
                  if (typeof db !== "undefined" && db.qzoneSettings) {
                    db.qzoneSettings.put(state.qzoneSettings);
                  }
                }
              }`;

if (html.includes(targetSaveAvatarTargets)) {
  html = html.replace(targetSaveAvatarTargets, replaceSaveAvatarTargets);
  console.log("SUCCESS: Updated save avatar targets");
}

// Bind rotate, flip, reset, wheel, group/member gen buttons
const targetInitBtnBinds = `const aiGenBtn = document.getElementById("ai-avatar-gen-btn");
          if (aiGenBtn) {
            aiGenBtn.addEventListener("click", () => openAvatarGenModal("ai"));
          }
          const myGenBtn = document.getElementById("my-avatar-gen-btn");
          if (myGenBtn) {
            myGenBtn.addEventListener("click", () => openAvatarGenModal("my"));
          }`;

const replaceInitBtnBinds = `const aiGenBtn = document.getElementById("ai-avatar-gen-btn");
          if (aiGenBtn) {
            aiGenBtn.addEventListener("click", () => openAvatarGenModal("ai"));
          }
          const myGenBtn = document.getElementById("my-avatar-gen-btn");
          if (myGenBtn) {
            myGenBtn.addEventListener("click", () => openAvatarGenModal("my"));
          }
          const groupGenBtn = document.getElementById("group-avatar-gen-btn");
          if (groupGenBtn) {
            groupGenBtn.addEventListener("click", () => openAvatarGenModal("group"));
          }
          const memberGenBtn = document.getElementById("member-avatar-gen-btn");
          if (memberGenBtn) {
            memberGenBtn.addEventListener("click", () => openAvatarGenModal("member"));
          }

          const flipBtn = document.getElementById("avatar-crop-flip-btn");
          if (flipBtn) {
            flipBtn.addEventListener("click", () => {
              avatarCropState.isFlippedX = !avatarCropState.isFlippedX;
              updateAvatarCropTransform();
            });
          }

          const rotateBtn = document.getElementById("avatar-crop-rotate-btn");
          if (rotateBtn) {
            rotateBtn.addEventListener("click", () => {
              avatarCropState.rotation = (avatarCropState.rotation + 90) % 360;
              updateAvatarCropTransform();
            });
          }

          if (viewport) {
            viewport.addEventListener("wheel", (e) => {
              if (!avatarCropState.rawImg) return;
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.05 : -0.05;
              const newScale = Math.max(avatarCropState.coverScale * 0.3, Math.min(avatarCropState.coverScale * 4, avatarCropState.scale + delta));
              avatarCropState.scale = newScale;
              updateAvatarCropTransform();
            }, { passive: false });
          }`;

if (html.includes(targetInitBtnBinds)) {
  html = html.replace(targetInitBtnBinds, replaceInitBtnBinds);
  console.log("SUCCESS: Updated button binds in initAvatarGenModalEvents");
}

// Insert module11Js before end of script
const scriptEndTag = `</script>\n  </body>`;
if (html.includes(scriptEndTag)) {
  html = html.replace(scriptEndTag, module11Js + "\n    </script>\n  </body>");
  console.log("SUCCESS: Inserted Module 11 JS logic");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("Finished updating JS logic in index.html");
