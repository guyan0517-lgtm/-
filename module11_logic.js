// 模块 11 辅助逻辑
function isSubApiEnabledFor(usageName) {
  const cfg = state.apiConfig || {};
  const usages = cfg.subApiUsages || {};
  return !!usages[usageName];
}

function getAuxiliaryAPIConfig(usageName = "avatar_gen") {
  const cfg = state.apiConfig || {};
  const useSub = isSubApiEnabledFor(usageName) && cfg.subApiKey && cfg.subApiKey.trim();
  if (useSub) {
    return {
      proxyUrl: cfg.subProxyUrl || cfg.proxyUrl || "",
      apiKey: cfg.subApiKey || "",
      model: cfg.subModel || cfg.model || "",
      isSub: true
    };
  } else {
    return {
      proxyUrl: cfg.proxyUrl || "",
      apiKey: cfg.apiKey || "",
      model: cfg.model || "",
      isSub: false
    };
  }
}

async function callAuxiliaryAIWithConfig(config, systemPrompt, userPrompt) {
  const { proxyUrl, apiKey, model } = config;
  if (!apiKey) throw new Error("未配置 API Key");

  const isGemini = model.toLowerCase().includes("gemini");
  const messagesForApi = [
    { role: "user", content: systemPrompt + "\n\n用户描述: " + userPrompt }
  ];

  if (isGemini) {
    const geminiConfig = toGeminiRequestData(
      model,
      apiKey,
      systemPrompt,
      [{ role: "user", content: userPrompt }],
      true,
      0.7
    );
    const resp = await fetch(geminiConfig.url, geminiConfig.data);
    if (!resp.ok) throw new Error("API 请求失败: " + resp.status);
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    const targetUrl = proxyUrl.endsWith("/") ? proxyUrl + "v1/chat/completions" : proxyUrl + "/v1/chat/completions";
    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messagesForApi,
        temperature: 0.7
      })
    });
    if (!resp.ok) throw new Error("API 请求失败: " + resp.status);
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || "";
  }
}

async function triggerSubApiNovGen(chatId) {
  const chat = state.chats[chatId];
  if (!chat) return;

  const isViewingThisChat =
    document.getElementById("chat-interface-screen")?.classList.contains("active") &&
    state.activeChatId === chatId;

  const guide = chat.settings?.novGenGuide || "生成一段适合 NovelAI 生图的英文 Tag 提示词，包含核心人物外貌、表情服饰与场景细节。";

  const recentMsgs = (chat.history || [])
    .filter(m => !m.isHidden && (m.role === "user" || m.role === "assistant"))
    .slice(-6);

  if (recentMsgs.length === 0) return;

  const dialogText = recentMsgs.map(m => {
    let text = String(m.content || "");
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, "")
               .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
               .replace(/思维链[:：][\s\S]*?\n/gi, "")
               .trim();
    const sender = m.role === "user" ? "用户" : (m.senderName || chat.name || "AI");
    return sender + ": " + text;
  }).filter(t => t.length > 0).join("\n");

  const sysPrompt = "你是一个 AI 绘图 Prompt 生成专家。请根据最新对话内容和规范要求，生成一段用于 NovelAI 生图的英文 Tag 提示词。只输出英文 Tag 提示词，用逗号分隔，绝不输出任何中文、解释或 Markdown。";
  const userPrompt = "【规范要求】\n" + guide + "\n\n【对话内容】\n" + dialogText;

  try {
    const config = getAuxiliaryAPIConfig("avatar_gen");
    if (!config.apiKey) return;

    let generatedTags = await callAuxiliaryAIWithConfig(config, sysPrompt, userPrompt);
    generatedTags = generatedTags.trim().replace(/^```[a-z]*/i, "").replace(/```$/i, "").trim();

    if (!generatedTags) return;

    const apiKey = localStorage.getItem("novelai-api-key");
    if (!apiKey) return;

    const finalPositive = buildNovelAIPositivePrompt({
      userPrompt: generatedTags,
      isAvatar: false,
      chatId: chatId
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
        seed: Math.floor(Math.random() * 4294967295),
        n_samples: 1,
        ucPreset: settings.uc_preset || 1,
        qualityToggle: settings.quality_toggle,
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

    if (!resp.ok) return;

    const contentType = resp.headers.get("content-type");
    let imageBlob = null;

    if (contentType && contentType.includes("text/event-stream")) {
      const text = await resp.text();
      const lines = text.trim().split("\n");
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
      if (!base64Data) return;

      const isPNG = base64Data.startsWith("iVBORw0KGgo");
      const isJPEG = base64Data.startsWith("/9j/");
      if (isPNG || isJPEG) {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        imageBlob = new Blob([bytes], { type: isPNG ? "image/png" : "image/jpeg" });
      } else {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const zip = await JSZip.loadAsync(new Blob([bytes]));
        const imgFile = Object.values(zip.files).find(f => !f.dir);
        imageBlob = await imgFile.async("blob");
      }
    } else {
      const blob = await resp.blob();
      if (typeof JSZip !== "undefined" && blob.type.includes("zip")) {
        const zip = await JSZip.loadAsync(blob);
        const imgFile = Object.values(zip.files).find(f => !f.dir);
        imageBlob = await imgFile.async("blob");
      } else {
        imageBlob = blob;
      }
    }

    const reader = new FileReader();
    const imageDataUrl = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const imgMsg = {
      role: "assistant",
      senderName: chat.name,
      type: "naiimag",
      imageUrl: imageDataUrl,
      prompt: generatedTags,
      fullPrompt: finalPositive,
      timestamp: Date.now()
    };

    chat.history.push(imgMsg);
    await db.chats.put(chat);

    if (isViewingThisChat) {
      appendMessage(imgMsg, chat);
    }
  } catch (err) {
    console.error("NOV 生图触发失败:", err);
  }
}
