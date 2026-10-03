import fs from "fs";

let html = fs.readFileSync("index.html", "utf8");

// 1. Ensure getAuxiliaryAPIConfig checks usage
const oldGetAuxConfig = /function getAuxiliaryAPIConfig\(\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/;
const newGetAuxConfig = `function getAuxiliaryAPIConfig(usageType = 'avatar_gen') {
  const cfg = state.apiConfig || {};
  const usages = cfg.subUsages || [];
  const hasSubKey = !!(cfg.subApiKey && cfg.subApiKey.trim());
  const isUsageEnabled = usages.includes(usageType);
  if (hasSubKey && isUsageEnabled) {
    return {
      proxyUrl: cfg.subProxyUrl || cfg.proxyUrl || "",
      apiKey: cfg.subApiKey.trim(),
      model: cfg.subModel || cfg.model || ""
    };
  }
  return {
    proxyUrl: cfg.proxyUrl || "",
    apiKey: cfg.apiKey || "",
    model: cfg.model || ""
  };
}`;

if (oldGetAuxConfig.test(html)) {
  html = html.replace(oldGetAuxConfig, newGetAuxConfig);
  console.log("Updated getAuxiliaryAPIConfig");
}

// 2. Ensure avatarCropState has rotate and flipH
if (html.includes("let avatarCropState = {")) {
  html = html.replace(
    /let avatarCropState = \{[\s\S]*?\};/,
    `let avatarCropState = {
  rawImg: null,
  scale: 1,
  coverScale: 1,
  x: 0,
  y: 0,
  rotate: 0,
  flipH: false,
  isDragging: false,
  startX: 0,
  startY: 0,
  startXPos: 0,
  startYPos: 0,
  clickCount: 0,
  clickTimer: null
};`
  );
  console.log("Updated avatarCropState object");
}

// 3. Ensure updateAvatarCropTransform handles rotate and flipH
if (html.includes("function updateAvatarCropTransform() {")) {
  html = html.replace(
    /function updateAvatarCropTransform\(\) \{[\s\S]*?imgEl\.style\.transform = [^\n;]+;[\s\S]*?\}/,
    `function updateAvatarCropTransform() {
  const imgEl = document.getElementById("avatar-crop-img");
  if (!imgEl) return;
  const scaleX = avatarCropState.flipH ? -avatarCropState.scale : avatarCropState.scale;
  const scaleY = avatarCropState.scale;
  const rot = avatarCropState.rotate || 0;
  imgEl.style.transform = "translate(" + avatarCropState.x + "px, " + avatarCropState.y + "px) scale(" + scaleX + ", " + scaleY + ") rotate(" + rot + "deg)";
}`
  );
  console.log("Updated updateAvatarCropTransform function");
}

// 4. Ensure setupAvatarCropImage resets rotate and flipH
if (html.includes("function setupAvatarCropImage(img) {")) {
  html = html.replace(
    /function setupAvatarCropImage\(img\) \{/,
    `function setupAvatarCropImage(img) {
  avatarCropState.rotate = 0;
  avatarCropState.flipH = false;`
  );
  console.log("Updated setupAvatarCropImage function");
}

fs.writeFileSync("index.html", html, "utf8");
console.log("patch_index.js done!");
