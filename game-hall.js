// =======================================================================
// ===               EPhone 原生酒馆全量引擎 v7.8                      ===
// =======================================================================

(function () {
  const TAVERN_DB_NAME = 'EPhoneTavernDB';
  const TAVERN_DB_STORE = 'kv';
  const TAVERN_STORE_KEY = 'tavern_state_v2';

  const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e8dfd5"/><stop offset="100%" stop-color="#c9b8a8"/></linearGradient></defs>' +
    '<rect width="160" height="160" rx="80" fill="url(#g)"/>' +
    '<circle cx="80" cy="64" r="26" fill="#fff" opacity="0.9"/>' +
    '<path d="M36 136c6-26 26-40 44-40s38 14 44 40" fill="#fff" opacity="0.9"/>' +
    '</svg>'
  );

  const DEFAULT_USER_AVATAR_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
    '<defs><linearGradient id="u" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d7e3ee"/><stop offset="100%" stop-color="#b3c7d6"/></linearGradient></defs>' +
    '<rect width="160" height="160" rx="80" fill="url(#u)"/>' +
    '<circle cx="80" cy="64" r="26" fill="#fff" opacity="0.92"/>' +
    '<path d="M36 136c6-26 26-40 44-40s38 14 44 40" fill="#fff" opacity="0.92"/>' +
    '</svg>'
  );

  const DEFAULT_GOUSU_THEME = {"name":"一键狗塑","blur_strength":10,"main_text_color":"rgba(48, 48, 49, 1)","italics_text_color":"rgba(212, 208, 210, 1)","underline_text_color":"rgba(255, 205, 223, 1)","quote_text_color":"rgba(255, 205, 223, 1)","blur_tint_color":"rgba(251, 251, 251, 1)","chat_tint_color":"rgba(242, 242, 242, 0)","user_mes_blur_tint_color":"rgba(255, 255, 255, 1)","bot_mes_blur_tint_color":"rgba(196, 196, 196, 1)","shadow_color":"rgba(255, 255, 255, 1)","shadow_width":0,"border_color":"rgba(111, 112, 116, 0.89)","font_scale":1.05,"fast_ui_mode":true,"waifuMode":false,"avatar_style":0,"chat_display":1,"toastr_position":"toast-top-left","noShadows":true,"chat_width":52,"timer_enabled":true,"timestamps_enabled":false,"timestamp_model_icon":false,"mesIDDisplay_enabled":true,"hideChatAvatars_enabled":false,"message_token_count_enabled":true,"expand_message_actions":false,"enableZenSliders":false,"enableLabMode":false,"hotswap_enabled":true,"custom_css":"/*\n\n一键狗塑 @Mayonnaise\n非常感谢导航楼内各位老师的分享，所使用代码已在以下标注作者❤︎\n\n*/\n\n@import url(\"https://fontsapi.zeoseven.com/3/main/result.css\");\n\n/* ===== 1. 基础设置与变量 ===== */\nbody {\n    font-family: \"寒蝉全圆体\";\n    font-weight: normal;\n}\n\n:root {\n    --text1: 'ฅ૮₍ ´• ˕ •` ₎აฅ 𝒑𝒖𝒑𝒑𝒚 𝒊𝒔 𝒕𝒉𝒊𝒏𝒌𝒊𝒏𝒈...₊˚⊹♡';/* 思维链文本 */\n    --text2: '-`♡´-𝒑𝒖𝒑𝒑𝒚 𝒊𝒔 𝒕𝒚𝒑𝒊𝒏𝒈…₊˚⊹ 𐂯';/* 输入框文本 */\n    --text3: '·ᴥ·';/* 名字后跟颜文字 不想要可删除内容 */\n    --text4: '# わんちゃん♡';/* char的tag文本 */\n    --text5: '# 飼い主❤︎';/* user的tag文本 */\n\n    --bg1: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/%E6%8F%92%E7%94%BB5.png');\n    --bg2: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/%E6%8F%92%E7%94%BB4.png');\n    --logo1: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/PhBoneDuotone.svg');\n    --logo2: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/PhDogFill.svg');\n    --logo3: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/PhPawPrintFill.svg');\n    --logo4: url('https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/MynauiHeartXSolid.svg');\n}\n\n/* ===== 2. 聊天区域主样式 ===== */\n#chat {\n    background: transparent;\n    backdrop-filter: none !important;\n    border: none !important;\n    margin-top: 4px !important;\n    mask: linear-gradient(to bottom, black 0%, black 90%, transparent 100%);\n}\n\n.mes {\n    display: flex !important;\n    position: relative !important;\n    flex-direction: column !important;\n    padding: 30px 10px 0 10px !important;\n    margin-bottom: 50px !important;\n    overflow: visible !important;\n    background: transparent !important;\n    border: none !important;\n}\n\n.mes_block {\n    position: static !important;\n    overflow: hidden !important;\n    --msg-bg-color: #e6e6e6;\n    background: radial-gradient(circle at 44px 30px, transparent 53px, var(--msg-bg-color) 54px) !important;\n    border: none !important;\n    border-radius: 15px !important;\n    border-top-left-radius: 0 !important;\n    padding: 60px 15px 15px 15px !important;\n    min-height: 60px;\n}\n\n.mes_text {\n    overflow: visible !important;\n    padding: 15px;\n    margin-top: 10px;\n    background: #FFF !important;\n    border-radius: 10px !important;\n    border: 2px solid #D8D8D8 !important;\n}\n\n.mes.last_mes {\n    margin-bottom: 80px !important;\n}\n\n/* --- 头像与名字 --- */\n.mes[is_system=\"false\"] .mesAvatarWrapper .avatar::before {\n    content: \"\";\n    z-index: 10 !important;\n    position: absolute !important;\n    background-image: url(\"https://pub-222b3a4a8d2e47bc9c31cc9e1733ed9a.r2.dev/%E5%B0%8F%E7%8B%97%E7%B3%BB%E5%88%97/1ear.png\");\n    background-size: contain;\n    background-repeat: no-repeat;\n    background-position: center;\n    width: 110px;\n    height: 110px;\n    top: -40px;\n    left: -8px;\n}\n\n.mesAvatarWrapper {\n    position: absolute !important;\n    top: 14px !important;\n    left: 8px !important;\n    margin: 0 !important;\n    order: unset !important;\n    width: 93px !important;\n    height: 93px !important;\n}\n\n.mes .avatar {\n    width: 93px !important;\n    height: 93px !important;\n}\n\n.mes .avatar img {\n    border: 3px solid #eee;\n    width: 100%;\n    height: 100%;\n    box-shadow: none;\n}\n\n.mes .name_text {\n    position: absolute !important;\n    top: 20px !important;\n    left: 120px !important;\n    display: flex !important;\n    gap: 10px;\n    white-space: nowrap;\n    background-color: #555 !important;\n    color: #fff !important;\n    padding: 4px 15px !important;\n    border-radius: 12px !important;\n    font-size: 17px !important;\n    font-weight: bold;\n    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);\n}\n\n.mes .name_text::after {\n    content: var(--text3);\n}\n\n/* ===== 3. 思维链 (Reasoning) ===== */\n.mes_reasoning_summary.flex-container {\n    flex-direction: column;\n    align-items: center;\n    gap: 5px;\n}\n\n.mes_reasoning_actions {\n    position: relative !important;\n    background: #fff;\n    border: 1px solid #ddd;\n    border-radius: 20px;\n    padding: 2px 10px !important;\n}\n\n.mes_reasoning {\n    margin-top: 5px;\n    padding: 15px;\n    border: 1px dashed #555;\n    background-color: #FBFBFB;\n    border-radius: 8px;\n    color: #555;\n    font-family: \"寒蝉全圆体\";\n    font-size: 15px;\n}\n\n.mes_reasoning_header {\n    display: flex !important;\n    order: -1;\n    background-image: var(--bg2);\n    background-size: cover;\n    border: 1px solid #555;\n    border-radius: 25px;\n    padding: 6px 9px;\n}\n\n.mes_reasoning_header_title {\n    font-family: \"寒蝉全圆体\";\n    font-weight: bold;\n    font-size: 0;\n}\n\n.mes_reasoning_header_title::before {\n    content: var(--text1);\n    font-size: 14px;\n}\n\n.mes_reasoning_arrow {\n    display: none;\n}\n\n.mes_reasoning_details[open] .mes_reasoning_header.flex-container {\n    background: #fff !important;\n}\n\n.mes_reasoning_header.flex-container {\n    transition: background 0.8s ease-in-out;\n}\n\n/* ===== 4. 顶栏样式 ===== */\n#top-bar {\n    box-shadow: inset 0 0 2px 2px #ffffff !important;\n    border: 1px solid #656874 !important;\n    border-radius: 15px !important;\n    margin-top: 3px;\n    background-image: var(--bg1) !important;\n    background-position: center center;\n    background-size: cover;\n}\n\n/* 顶栏图标替换by 墨千尾老师 */\n#top-settings-holder .drawer-icon::before {\n    content: '' !important;\n    visibility: hidden;\n}\n\n#top-settings-holder .drawer {\n    flex: 1;\n}\n\n#top-settings-holder .drawer-icon {\n    display: block;\n    margin-top: 5px;\n    background-color: #fff;\n    border-radius: 15px !important;\n    background-size: contain;\n    background-position: center;\n    background-repeat: no-repeat;\n    transition: all 0.3s ease-in-out;\n    width: 28px;\n    height: 28px;\n    opacity: 1 !important;\n}\n\n.drawer-icon.fa-fw:hover {\n    transform: scale(1.2);\n}\n\n.drawer-icon.fa-sliders,\n.drawer-icon.fa-cubes {\n    background-image: var(--logo1);\n}\n\n.drawer-icon.fa-font,\n.drawer-icon.fa-address-card {\n    background-image: var(--logo2);\n}\n\n.drawer-icon.fa-plug,\n.drawer-icon.fa-plug-circle-exclamation,\n.drawer-icon.fa-book-atlas,\n.drawer-icon.fa-panorama,\n.drawer-icon.fa-face-smile {\n    background-image: var(--logo3);\n}\n\n.drawer-icon.fa-user-cog {\n    background-image: var(--logo4);\n}\n\n/* ===== 5. 底栏与输入框 ===== */\n#sheld {\n    background: transparent !important;\n    border: none !important;\n    box-shadow: none !important;\n}\n\n#send_form {\n    position: absolute;\n    bottom: 20px;\n    left: 40px;\n    right: 40px;\n    width: auto;\n    background-image: var(--bg1) !important;\n    background-position: center center;\n    background-size: cover;\n    box-shadow: inset 0 0 2px 2px #ffffff !important;\n    border-radius: 25px;\n    padding: 3px 3px;\n    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);\n    transition: all 0.5s ease;\n    border: 1px solid #656874 !important;\n}\n\n#send_form:hover {\n    background-color: rgba(255, 255, 255, 0.6) !important;\n    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);\n    transform: translateY(-2px);\n}\n\n#send_textarea {\n    background: #FFF;\n    color: #333 !important;\n    border-radius: 25px;\n    border: 2px solid #DDD !important;\n    font-family: \"寒蝉全圆体\";\n    margin-bottom: 2px;\n}\n\n/* 底栏图标替换by 墨千尾老师 */\n#options_button::before,\n#extensionsMenuButton::before,\n#send_but::before,\n#quick-reply-rocket-button > i {\n    display: none !important;\n}\n\n#options_button,\n#extensionsMenuButton,\n#send_but,\n#quick-reply-rocket-button {\n    width: 28px !important;\n    height: 28px !important;\n    background-size: contain;\n    background-repeat: no-repeat;\n    background-position: center;\n    background-color: #FFF;\n    border-radius: 15px !important;\n    opacity: 1 !important;\n}\n\n#options_button { background-image: var(--logo1); }\n#extensionsMenuButton { background-image: var(--logo4); }\n#send_but { background-image: var(--logo3); }\n#quick-reply-rocket-button { background-image: var(--logo2); }\n\n/* 输入框文字by hgu老师 */\n#send_textarea::placeholder {\n    color: transparent !important;\n    opacity: 0 !important;\n}\n\n#nonQRFormItems {\n    position: relative !important;\n}\n\n#nonQRFormItems:has(#send_textarea:placeholder-shown)::after {\n    content: var(--text2);\n    font-size: 14px;\n    white-space: nowrap;\n    opacity: 0.5;\n    position: absolute;\n    z-index: 10;\n    pointer-events: none;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n}\n\n/* 隐藏QR栏二改by 12老师 */\n#qr--bar {\n    max-height: 0 !important;\n    opacity: 0 !important;\n    pointer-events: none;\n    transition: all 1.1s !important;\n    cubic-bezier(0.175, 0.885, 0.32, 1.275)\n}\n\n#send_form:focus-within #qr--bar {\n    max-height: 120px !important;\n    opacity: 1 !important;\n    pointer-events: auto;\n}\n\n/* ===== 6. 通用 UI 组件 ===== */\n#rm_extensions_block .inline-drawer-toggle.inline-drawer-header,\n#user-settings-block h4,\n.standoutHeader {\n    background-image: var(--bg2) !important;\n    background-size: cover;\n    box-shadow: inset 0 0 5px 1px #fff !important;\n}\n\n.text_pole,\nselect,\ninput[type=\"text\"],\ninput[type=\"number\"],\ninput[type=\"search\"],\n#settingsSearch,\n.popup textarea,\n#description_textarea,\n#firstmessage_textarea,\n.edit_textarea.mdHotkeys,\n.reasoning_edit_textarea,\n.select2-container--default .select2-selection--single,\n.select2-container--default .select2-selection--multiple {\n    background-color: #eee !important;\n    padding: 3px !important;\n    border-radius: 10px !important;\n    font-family: \"寒蝉全圆体\";\n}\n\ncode, pre {\n    font-family: \"寒蝉全圆体\";\n    color: #000;\n    background-color: #eee;\n    border: 1px solid #000;\n    border-radius: 2px;\n}\n\n.mes_text q {\n    display: inline;\n    -webkit-box-decoration-break: clone;\n    box-decoration-break: clone;\n    background-color: #fff;\n    border: 1px solid var(--SmartThemeQuoteColor) !important;\n    border-radius: 10px !important;\n    box-shadow: 1px 1px 3px #dddddd80;\n    padding: 3px;\n    line-height: 1.7;\n}\n\n.avatar-container.interactable.selected {\n    background-image: var(--bg2) !important;\n    background-size: cover;\n    border-radius: 15px;\n}\n\n.menu_button, .right_menu_button {\n    box-shadow: none;\n    background-color: #fff !important;\n    border: 1px solid #aaa !important;\n    border-radius: 10px !important;\n    transition: background-color 0.3s ease, transform 0.2s ease !important;\n}\n\n.menu_button:hover, .right_menu_button:hover {\n    background-color: var(--SmartThemeQuoteColor) !important;\n    transform: scale(1.05);\n}\n\n.select2-selection__choice__display,\n.select2-selection__choice__remove {\n    background: none !important;\n}\n\n.select2-selection__choice {\n    background-color: #EBEBEB !important;\n    color: #aaa !important;\n}\n\n.completion_prompt_manager_prompt .fa-asterisk,\n.completion_prompt_manager_prompt .fa-square-poll-horizontal,\n.completion_prompt_manager_prompt .fa-syringe,\n.completion_prompt_manager_prompt .fa-thumb-tack,\n.fa-xs.fa-solid.fa-robot/* 类名by hy老师 */ {\n    color: var(--SmartThemeQuoteColor) !important;\n}\n\n#completion_prompt_manager .completion_prompt_manager_header_advanced span, \n#completion_prompt_manager .completion_prompt_manager_header div, .prompt_manager_prompt_controls span/* 类名byMDMA老师 */ {\n    filter: none !important;\n}\n\n#completion_prompt_manager_list {\n    background: none !important;\n    border: none;\n}\n\n#completion_prompt_manager .completion_prompt_manager_prompt {\n    border-radius: 20px;\n    border: 1px solid #aaa !important;\n    padding: 7px !important;\n}\n\n.completion_prompt_manager_prompt_disabled {\n    background: #eee !important;\n}\n\n.completion_prompt_manager_prompt_disabled .prompt-manager-inspect-action {\n    color: #aaa !important;\n}\n\n#completion_prompt_manager .completion_prompt_manager_header_advanced span,\n#completion_prompt_manager .completion_prompt_manager_header div {\n    filter: none !important;\n    color: #555 !important;\n}\n\ndialog.popup,\n#select_chat_popup,\nselect,\n.list-group,\n.select2-dropdown,\n#options,\n#options-content,\n#extensionsMenu {\n    box-shadow: none !important;\n}\n\n.reverse_proxy_warning {\n    color: var(--SmartThemeQuoteColor) !important;\n}\n\n::selection {\n    background: var(--SmartThemeQuoteColor);\n    color: #fff;\n}\n\n/* --- 滚动条 --- */\n::-webkit-scrollbar {\n    width: 10px;\n}\n\n::-webkit-scrollbar-track {\n    background-color: transparent;\n}\n\n::-webkit-scrollbar { width: 5px; }\n::-webkit-scrollbar-thumb { background-color: #eee !important; border-radius: 15px !important; border: none !important; }\n::-webkit-scrollbar-track { background: transparent; }\n\n/* ===== 7. 表单控件 (复选框与滑块) ===== */\n/* 复选框图标替换by 食南瓜者老师 */\ninput[type=\"checkbox\"] {\n    background: #fff;\n    border-radius: 10px;\n}\n\ninput[type=\"checkbox\"]::before {\n    display: none !important;\n}\n\ninput[type=\"checkbox\"]:checked {\n    background-image: var(--logo3) !important;\n    background-size: 16px !important;\n    background-position: center !important;\n    border-radius: 10px;\n}\n\n/* 滑动条by 墨千尾老师 */\ninput[type=\"range\"] { filter: none !important; }\ninput[type=\"range\"]::-webkit-slider-runnable-track {\n    height: 10px;\n    background: #D8D8D8;\n    border-radius: 5px;\n    border: 1px solid #555;\n}\n\ninput[type=\"range\"]::-webkit-slider-thumb {\n    -webkit-appearance: none;\n    appearance: none;\n    margin-top: -7px;\n    height: 20px;\n    width: 20px;\n    background-image: var(--logo1);\n    background-size: contain;\n    background-repeat: no-repeat;\n    background-position: center;\n    background-color: transparent;\n    border: none;\n    border-radius: 0;\n    box-shadow: none;\n    transition: transform 0.2s ease;\n}\n\ninput[type=\"range\"]:hover::-webkit-slider-thumb { transform: scale(1.1); }\n\n/* ===== 8. 交互反馈与消息功能 ===== */\n/* 通知美化by serein老师 */\n.toast {\n    background-color: #ddd !important;\n    color: #555 !important;\n    border: 1px dashed #555;\n    box-shadow: none !important;\n}\n\n#toast-container > .toast {\n    background-image: var(--logo3) !important;\n    background-size: 28px 28px !important;\n    background-position: 15px center !important;\n}\n\n#toast-container > .toast:before {\n    display: none;\n}\n\n.fa-circle-chevron-down,\n.inline-drawer-icon.fa-circle-chevron-down {\n    background-image: var(--logo4) !important;\n    background-size: 21px !important;\n    background-position: center !important;\n    color: transparent !important;\n    transition: transform 0.3s ease-in-out !important;\n    transform: scaleY(1) !important;\n}\n\n.fa-circle-chevron-up,\n.inline-drawer-icon.fa-circle-chevron-up {\n    background-image: var(--logo4) !important;\n    background-size: 21px !important;\n    background-position: center !important;\n    color: transparent !important;\n    transform: scaleY(-1) !important;\n    transition: transform 0.3s ease-in-out !important;\n}\n\n/* --- 消息选择与删除 --- */\n.mes .for_checkbox {\n    display: none !important;\n    width: 0 !important;\n    min-width: 0 !important;\n    flex-basis: 0 !important;\n    margin: 0 !important;\n    padding: 0 !important;\n}\n\n.mes .del_checkbox {\n    position: absolute !important;\n    left: 50% !important;\n    transform: translateX(-50%) !important;\n    top: 0 !important;\n    z-index: 100 !important;\n    margin: 0 !important;\n    width: 20px !important;\n    height: 20px !important;\n    cursor: pointer;\n    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);\n}\n\n.mes.selected::after {\n    content: \"\";\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    background-color: #ffffff95;\n    border-radius: 10px;\n    pointer-events: none;\n    box-sizing: border-box;\n    z-index: 22;\n}\n\n/* --- 消息翻页 --- */\n/* 翻页图标替换二改by 眠N勿扰老师 */\n.swipe_left::before, .swipe_right::before { content: '' !important; }\n\n.swipe_left, .swipe_right {\n    background-color: #fff;\n    border-radius: 15px !important;\n    position: absolute !important;\n    bottom: -3px !important;\n    opacity: 1 !important;\n    background-size: contain;\n    background-repeat: no-repeat;\n    background-position: center;\n    transition: transform 0.2s ease !important;\n    background-image: var(--logo3);\n    width: 24px;\n    height: 24px;\n    z-index: 30 !important;\n}\n\n.swipe_left {\n    left: calc(29% + 10px) !important;\n    transform: rotate(-90deg);\n}\n\n.swipe_right {\n    right: calc(10% + 10px) !important;\n    transform: rotate(90deg);\n}\n\n.swipe_left:hover, .swipe_right:hover { transform: scale(1); }\n\n/* --- 消息编辑按钮 --- */\n.mes_edit_buttons {\n    transform: scale(0.9);\n    filter: none !important;\n}\n\n.mes_edit, .extraMesButtonsHint, .mes_stop {\n    background: #eee;\n    border-radius: 15px;\n    border: 1px solid #aaa;\n    box-shadow: inset 0 0 5px 1px #fff !important;\n    filter: none !important;\n    color: transparent !important;\n    width: 24px !important;\n    height: 24px !important;\n    background-size: contain;\n    background-repeat: no-repeat;\n    opacity: 1;\n    transition: transform 0.2s ease;\n    margin: 5px;\n}\n\n.mes_edit { background-image: var(--logo4) !important; }\n.extraMesButtonsHint { background-image: var(--logo2) !important; }\n.mes_stop { color: #555 !important; }\n.mes_edit:hover, .extraMesButtonsHint:hover, .mes_stop:hover { transform: scale(1.1); }\n\n.mes_edit_buttons {\n    transform: scale(0.9);\n}\n\n/* --- 消息元数据组件 --- */\n.swipes-counter {\n    z-index: 10 !important;\n    opacity: 1 !important;\n    top: -18px;\n    right: 35px;\n    position: absolute !important;\n    font-weight: bold !important;\n    font-size: 14px !important;\n    background: #fff !important;\n    border: 1px solid #6F7074 !important;\n    border-radius: 6px !important;\n    color: #aaa !important;\n    font-family: \"寒蝉全圆体\";\n}\n\n.swipes-counter:empty { display: none !important; }\n\n.mes_ghost.fa-solid.fa-ghost { z-index: 1 !important; }\n.mes[is_user=\"true\"] .mes_ghost.fa-solid.fa-ghost {\n    position: absolute !important;\n    right: 25px;\n}\n\n.mesIDDisplay,\n.mes_timer,\n.tokenCounterDisplay {\n    position: absolute;\n    top: 40px;\n    height: 22px;\n    width: 60px;\n    display: inline-flex !important;\n    align-items: center;\n    justify-content: center;\n    background-color: #fff;\n    border: 1px solid #aaa;\n    color: #aaa;\n    font-family: \"寒蝉全圆体\";\n    font-size: 11px;\n    margin: 0 !important;\n    padding: 0 !important;\n    box-sizing: border-box;\n    pointer-events: none;\n}\n\n.mesIDDisplay {\n    left: 112px !important;\n    border-radius: 10px 0 0 10px !important;\n    border-right: none !important;\n}\n\n.mes_timer {\n    left: 172px !important;\n    border-radius: 0 !important;\n    border-left: none !important;\n    border-right: none !important;\n}\n\n.tokenCounterDisplay {\n    left: 232px !important;\n    border-radius: 0 10px 10px 0 !important;\n    border-left: none !important;\n}\n\n.mes_timer:empty { display: none !important; }\n.mes_timer:empty + .tokenCounterDisplay { left: 172px !important; }\n\n.mes[is_user=\"false\"] .mesIDDisplay::before {\n    content: \"\";\n    width: 17px;\n    height: 17px;\n    background-image: var(--logo1);\n    background-size: contain;\n    background-repeat: no-repeat;\n    margin-right: 3px;\n}\n\n.mes[is_user=\"true\"] .mesIDDisplay::after {\n    content: \"\";\n    width: 17px;\n    height: 17px;\n    background-image: var(--logo1);\n    background-size: contain;\n    background-repeat: no-repeat;\n    margin-left: 3px;\n    transform: scaleX(-1);\n}\n\n/* ===== 9. 用户消息 (User) 适配与镜像逻辑 ===== */\n.mes[is_user=\"true\"] .mes_block {\n    background: radial-gradient(circle at calc(100% - 44px) 30px, transparent 53px, var(--msg-bg-color) 54px) !important;\n    border-top-left-radius: 15px !important;\n    border-top-right-radius: 0 !important;\n}\n\n.mes[is_user=\"true\"] .mesAvatarWrapper {\n    left: auto !important;\n    right: 8px !important;\n}\n\n.mes[is_user=\"true\"] .mesAvatarWrapper .avatar::before {\n    left: auto !important;\n    right: -8px !important;\n}\n\n.mes[is_user=\"true\"] .name_text {\n    left: auto !important;\n    right: 120px !important;\n}\n\n.mes[is_user=\"true\"] .mesIDDisplay,\n.mes[is_user=\"true\"] .mes_timer,\n.mes[is_user=\"true\"] .tokenCounterDisplay {\n    left: auto !important;\n}\n\n.mes[is_user=\"true\"] .mesIDDisplay {\n    right: 112px !important;\n    border-radius: 0 10px 10px 0 !important;\n    border-right: 1px solid #aaa !important;\n    border-left: none !important;\n}\n\n.mes[is_user=\"true\"] .mes_timer {\n    right: 172px !important;\n}\n\n.mes[is_user=\"true\"] .tokenCounterDisplay {\n    right: 232px !important;\n    border-radius: 10px 0 0 10px !important;\n    border-left: 1px solid #aaa !important;\n    border-right: none !important;\n}\n\n.mes[is_user=\"true\"] .mes_timer:empty + .tokenCounterDisplay {\n    right: 172px !important;\n}\n\n.mes[is_user=\"true\"]::before {\n    right: auto !important;\n    left: 7px !important;\n    border-radius: 4px 15px 15px 15px !important;\n}\n\n.mes[is_user=\"true\"] .ch_name.flex-container.justifySpaceBetween {\n    flex-direction: row-reverse !important;\n}\n\n/* ===== 10. 装饰层装饰逻辑 (Before/After) ===== */\n.mes::before {\n    z-index: 2 !important;\n    content: \"\";\n    position: absolute !important;\n    background-image: var(--bg1) !important;\n    background-size: cover;\n    background-position: center;\n    box-shadow: inset 0 0 5px 1px #fff !important;\n    width: 70%;\n    height: 28px;\n    bottom: -6px;\n    border-radius: 15px 4px 15px 15px;\n    border: 1px solid #aaa;\n    right: 7px;\n}\n\n.mes_block::before {\n    content: \"\";\n    position: absolute !important;\n    top: 30px !important;\n    left: 10px !important;\n    right: 10px !important;\n    bottom: 0 !important;\n    border-radius: 15px !important;\n    border-top-left-radius: 0 !important;\n    pointer-events: none;\n    box-shadow: inset 0 0 15px #fff !important;\n    border: 1px solid #ccc !important;\n    -webkit-mask-image: radial-gradient(circle at 44px 30px, transparent 53px, black 54px) !important;\n    mask-image: radial-gradient(circle at 44px 30px, transparent 53px, black 54px) !important;\n}\n\n.mes[is_user=\"true\"] .mes_block::before {\n    border-top-left-radius: 15px !important;\n    border-top-right-radius: 0 !important;\n    -webkit-mask-image: radial-gradient(circle at calc(100% - 44px) 30px, transparent 53px, black 54px) !important;\n    mask-image: radial-gradient(circle at calc(100% - 44px) 30px, transparent 53px, black 54px) !important;\n}\n\n.mes_block::after {\n    content: var(--text4);\n    position: absolute !important;\n    top: 22px !important;\n    right: 20px !important;\n    background-color: #ffffff !important;\n    border: 1px solid #ccc !important;\n    color: #555555 !important;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;\n    font-family: \"寒蝉全圆体\";\n    font-size: 11px !important;\n    font-weight: bold;\n    padding: 2px 8px !important;\n    border-radius: 6px !important;\n    white-space: nowrap;\n    pointer-events: none;\n}\n\n.mes[is_user=\"true\"] .mes_block::after {\n    content: var(--text5);\n    left: 20px !important;\n    right: auto !important;\n}\n\n/* 加载图标修改by serein老师 */\n#load-spinner {\n  --spinner-size: 50px;\n  transition: all var(--animation-duration-2x) ease-out;\n  opacity: 1;\n  top: calc(50% - var(--spinner-size) / 2);\n  left: calc(50% - var(--spinner-size) / 2);\n  position: absolute;\n  width: var(--spinner-size);\n  height: 50px;\n  background-image: var(--logo3);\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n\n#load-spinner::before {\n  display: none !important;\n}","bogus_folders":true,"zoomed_avatar_magnification":false,"reduced_motion":true,"compact_input_area":true,"show_swipe_num_all_messages":true,"click_to_edit":false,"media_display":"list","extensions":{"puppybot":{"uid":"MTQ0NjkwNTg0OTU1NjYzMTgwNA==","ts":1793557946},"regex_scripts":[{"id":"MTQ0NjkwNTg0OTU1NjYzMTgwNDoxNzkzNTU3OTQ2","scriptName":"格式优化","findRegex":"\\s{2,}","replaceString":" ","trimStrings":[],"placement":[1],"disabled":true,"markdownOnly":false,"promptOnly":false,"runOnEdit":false,"substituteRegex":false,"minDepth":0,"maxDepth":0}],"depth_prompt":{"prompts":[{"prompt":"​​‌​​‌‌​‌​‌​‌​‌​​​‌​‌​​​‌​​‌‌​​​​​‌​​‌‌‌​​‌‌​‌​‌​​‌‌​‌​‌‌​‌‌‌​‌‌‌​‌​​‌‌‌​​‌​‌​‌​​​‌‌​​‌‌‌​​‌‌​​​​​‌​​‌‌‌‌​‌​‌​‌​​​‌​‌​‌​‌​​‌‌​​​‌​‌​​‌‌‌​​‌‌​‌​‌​​‌​‌‌​​‌​‌‌‌‌​‌​​‌​​‌‌​‌​‌​‌​‌​​​‌‌​​‌‌‌​‌‌‌​‌‌‌​‌​​‌‌‌​​‌​​​‌​​​‌‌​‌‌‌‌​‌‌‌‌​​​​‌​​‌‌‌​​‌‌‌‌​‌​​‌‌​‌​‌‌​‌‌‌‌​‌​​‌​​‌‌‌​​‌​‌​‌​​​‌​‌​‌​‌​​‌‌​​‌‌​‌​​‌‌‌‌​‌​‌​‌​​​‌​‌​​​‌​​‌‌​​‌​​","depth":4,"role":"system"}]},"talkativeness":0.5001},"character_version":"1.0.MTQ0NjkwNTg0OTU1NjYz.MTgwNDoxNzkzNTU3OTQ2","tags":["fmt-opt","fmt-MTQ0","fmt-Njkw","fmt-NTg0","fmt-OTU1","fmt-NjYz","fmt-MTgw","fmt-NDox","fmt-Nzkz","fmt-NTU3","fmt-OTQ2"],"_wm":{"uid":"MTQ0NjkwNTg0OTU1NjYzMTgwNA==","ts":1793557946}};

  const NIGHT_GOUSU_THEME = Object.assign({}, DEFAULT_GOUSU_THEME, {
    id: 'theme_gousu_night',
    name: '夜间狗塑',
    builtin: true,
    main_text_color: 'rgba(226, 224, 218, 1)',
    italics_text_color: 'rgba(162, 158, 152, 1)',
    underline_text_color: 'rgba(218, 166, 180, 1)',
    quote_text_color: 'rgba(226, 174, 188, 1)',
    blur_tint_color: 'rgba(34, 36, 43, 0.96)',
    chat_tint_color: 'rgba(26, 28, 34, 1)',
    user_mes_blur_tint_color: 'rgba(42, 45, 54, 1)',
    bot_mes_blur_tint_color: 'rgba(36, 39, 47, 1)',
    shadow_color: 'rgba(12, 13, 18, 0.45)',
    border_color: 'rgba(76, 80, 92, 0.88)',
    custom_css: DEFAULT_GOUSU_THEME.custom_css + `\n
/* ===== 夜间狗塑 护眼暗色适配 ===== */
#tavern-stage-root {
    --gousu-meta-border: #454856;
    background-color: #1a1c22 !important;
    color: #e2e0da !important;
}
.mes_block {
    --msg-bg-color: #282b34 !important;
}
.mes_block::before {
    box-shadow: inset 0 0 14px rgba(16, 18, 22, 0.65) !important;
    border: 1px solid #3e4250 !important;
}
.mes_block::after {
    background-color: #2e313c !important;
    border: 1px solid #484c5c !important;
    color: #b8b5ad !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
}
.mes_text {
    background: #20222a !important;
    color: #e2e0da !important;
    border: 1.5px solid #383c48 !important;
}
.mes_text q {
    background-color: rgba(226, 174, 188, 0.13) !important;
    color: #ebbcc9 !important;
    border: 1px solid rgba(226, 174, 188, 0.42) !important;
    box-shadow: none !important;
}
.mes .avatar img {
    border: 3px solid #3d414f !important;
    filter: brightness(0.92);
}
.mes[is_system="false"] .mesAvatarWrapper .avatar::before {
    filter: brightness(0.8) contrast(0.95);
}
.mes .name_text {
    background-color: #363a46 !important;
    color: #e8e6e0 !important;
    border: 1px solid #4d5262 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
}
.mesIDDisplay,
.mes_timer,
.tokenCounterDisplay,
.swipes-counter {
    background-color: #262932 !important;
    border-color: #454856 !important;
    color: #9e9b93 !important;
}
.mes[is_user="false"] .mesIDDisplay::before,
.mes[is_user="true"] .mesIDDisplay::after {
    filter: invert(0.78) sepia(0.08) !important;
}
#top-bar,
#send_form,
.mes::before {
    background-color: rgba(42, 45, 55, 0.85) !important;
    background-blend-mode: multiply !important;
    box-shadow: inset 0 0 2px 1px rgba(255, 255, 255, 0.07), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
    border: 1px solid #464a58 !important;
}
#top-settings-holder .drawer-icon,
#options_button,
#extensionsMenuButton,
#send_but,
#quick-reply-rocket-button,
.swipe_left,
.swipe_right,
.mes_edit,
.extraMesButtonsHint,
.mes_stop {
    background-color: #c2bfb8 !important;
    border: 1px solid #4a4e5c !important;
    box-shadow: none !important;
}
.mes_stop {
    color: #262932 !important;
}
#send_textarea {
    background: #22252e !important;
    color: #e2e0da !important;
    border: 1.5px solid #414554 !important;
}
#nonQRFormItems:has(#send_textarea:placeholder-shown)::after {
    color: #9e9b93 !important;
    opacity: 0.72 !important;
}
details.mes_reasoning_details {
    background: rgba(34, 37, 45, 0.92) !important;
    border: 1px dashed #484c5c !important;
    color: #aba8a0 !important;
}
.mes_reasoning_header {
    background-color: rgba(48, 52, 62, 0.84) !important;
    background-blend-mode: multiply !important;
    border: 1px solid #4c5060 !important;
    color: #dcd9d2 !important;
}
.mes_reasoning_details[open] .mes_reasoning_header.flex-container {
    background: #2c2f3a !important;
}
.mes_reasoning {
    background-color: #1d1f26 !important;
    border: 1px dashed #454958 !important;
    color: #b8b5ad !important;
}
code, pre {
    color: #dcd9d2 !important;
    background-color: #262932 !important;
    border: 1px solid #454856 !important;
}
::-webkit-scrollbar-thumb {
    background-color: #3d414f !important;
}
`
  });

  const INS_MINIMAL_THEME = {
    id: 'theme_ins_minimal',
    name: '奶油极简',
    builtin: true,
    main_text_color: '#3c3a36',
    italics_text_color: '#8c867e',
    underline_text_color: '#53bdd1',
    quote_text_color: '#a18690',
    border_color: '#e5dec9',
    shadow_color: 'rgba(0,0,0,0.06)',
    custom_css: `
#chat { background: transparent; padding: 14px 10px 100px 10px; }
.mes { display: flex; flex-direction: column; position: relative; margin-bottom: 18px; padding: 14px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; }
.mesAvatarWrapper { width: 46px; height: 46px; position: absolute; top: 14px; left: 14px; }
.mes[is_user="true"] .mesAvatarWrapper { left: auto; right: 14px; }
.mes .avatar { width: 46px; height: 46px; border-radius: 50%; position: relative; }
.mes .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.mes_block { padding-left: 58px; min-height: 48px; }
.mes[is_user="true"] .mes_block { padding-left: 0; padding-right: 58px; }
.ch_name { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.name_text { font-weight: 700; font-size: 14px; color: var(--text-primary); }
.mes_text { font-size: 14px; line-height: 1.72; color: var(--text-primary); background: var(--background-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-top: 6px; }
`
  };

  function getDefaultPromptOrderItems() {
    return [
      { identifier: 'main', name: '主系统提示词 Main Prompt', role: 'system', enabled: true, marker: false, injection_position: 0, injection_depth: 4, content: '请完全代入{{char}}与{{user}}进行沉浸式互动与剧情推进，严格遵守角色设定、世界观法则与输出格式要求，严禁代替{{user}}说话或做决定。' },
      { identifier: 'worldInfoBefore', name: '前置世界书 World Info Before', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'personaDescription', name: '玩家人设 Persona Description', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'charDescription', name: '角色设定 Char Description', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'charPersonality', name: '角色性格 Char Personality', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'scenario', name: '当前场景 Scenario', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'enhanceDefinitions', name: '强化定义 Enhance Definitions', role: 'system', enabled: false, marker: false, injection_position: 0, injection_depth: 4, content: '保持鲜明的角色语言风格与细节描写，注重环境氛围、神态动作与感官反馈。' },
      { identifier: 'nsfw', name: '辅助提示词 Auxiliary Prompt', role: 'system', enabled: true, marker: false, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'worldInfoAfter', name: '后置世界书 World Info After', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'dialogueExamples', name: '对话示例 Chat Examples', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'chatHistory', name: '聊天历史记录 Chat History', role: 'system', enabled: true, marker: true, injection_position: 0, injection_depth: 4, content: '' },
      { identifier: 'jailbreak', name: '历史后指令 Post-History Instructions', role: 'system', enabled: true, marker: false, injection_position: 0, injection_depth: 0, content: '' }
    ];
  }

  const DEFAULT_STARTER_CARD = {
    id: 'card_default_starter',
    name: '酒馆向导',
    avatar: DEFAULT_AVATAR_SVG,
    description: '你是酒馆中的专属叙事搭档，擅长沉浸式文字冒险与角色扮演互动。',
    personality: '温和、敏锐、富有画面感',
    scenario: '旅人推开木门走进温暖的酒馆，壁炉火光摇曳。',
    first_mes: '壁炉里的橡木柴发出轻微的噼啪声，琥珀色的麦酒在杯沿泛起细密泡沫。\n\n“欢迎来到酒馆，旅人。点击顶栏任意图标即可下拉展开全屏设置抽屉：最右侧小狗图标管理角色卡与聊天存档，第四个爪印管理世界书，第七个骨头管理正则脚本与扩展插件，第一个骨头管理预设采样与提示词条目，黑心图标管理酒馆美化。”',
    alternate_greetings: [
      '夜雨敲打着彩绘玻璃窗，吧台后的提灯亮起柔和暖光。\n\n“今天想开启哪一段故事？点击顶栏最右侧小狗图标即可多选导入你的角色卡图片。”'
    ],
    mes_example: '',
    system_prompt: '',
    post_history_instructions: '',
    creator_notes: '点击顶栏9个图标可下拉打开对应的全屏配置面板。',
    depth_prompt: { prompt: '', depth: 4, role: 'system' },
    boundWorldBookIds: [],
    boundRegexIds: []
  };

  let tavernState = {
    activeCardId: 'card_default_starter',
    activeThemeId: 'theme_gousu_default',
    activePresetId: 'preset_default',
    activePersonaId: 'persona_default',
    activeDrawerId: null,
    themeEnabled: true,
    uiSettings: {
      fontScale: 1.0,
      letterSpacing: 0,
      lineHeight: 1.72,
      pageMargin: 10,
      streamSpeed: 0,
      streamSpeedUserSaved: false,
      avatarStyle: 'circle',
      showMessageId: true,
      showMesTimer: true,
      showTokenCount: true,
      showSwipeCounter: true,
      enableQuoteColor: true,
      enableQuoteBox: true,
      enableItalicColor: true,
      enableThemeCustomCss: true
    },
    apiConfig: {
      useExternalPhoneApi: true,
      useExternalNovelAi: true,
      streamEnabled: true,
      customUrl: '',
      customKey: '',
      customModel: '',
      availableModels: [],
      activeApiPresetId: '',
      activeSavedPresetId: '',
      savedPresets: []
    },
    formatting: {
      reasoningStartTag: '<think>',
      reasoningEndTag: '</think>',
      reasoningTagPairs: [
        { start: '<think>', end: '</think>' },
        { start: '<thinking>', end: '</thinking>' }
      ],
      autoCollapseReasoning: true,
      wrapQuotesInQ: true,
      collapseNewlines: false,
      autoTranslateIncoming: false,
      translateTargetLang: '简体中文',
      customStoppingStrings: [],
      systemPrompt: '请完全代入{{char}}与{{user}}进行沉浸式互动与剧情推进，严格遵守角色设定、世界观法则与输出格式要求，严禁代替{{user}}说话或做决定。',
      postHistoryPrompt: '',
      impersonationPrompt: '[请完全代入{{user}}的第一人称视角，顺着当前剧情写出{{user}}接下来的一段行动或对话回复，不要替{{char}}说话。]',
      continueNudgePrompt: '[请紧接着上一条消息的末尾继续往下续写剧情，保持文风连贯，不要重复已写过的内容。]',
      newChatPrompt: '[开始一段新的对话]',
      wiFormat: '{0}',
      scenarioFormat: '{{scenario}}',
      personalityFormat: '{{personality}}'
    },
    authorNote: {
      text: '',
      depth: 4,
      role: 'system',
      frequency: 1,
      charNoteText: '',
      charNoteDepth: 4,
      charNoteRole: 'system'
    },
    memory: {
      enabled: true,
      contextFloors: 40,
      injectDepth: 2,
      injectRole: 'system',
      autoInterval: 20,
      summaryText: '',
      summaryPrompt: '请将目前为止的对话剧情总结为简明扼要的记忆摘要，包含关键已发生事件、人物关系进展、当前持有物品与状态变化。'
    },
    background: {
      url: '',
      fit: 'cover',
      blur: 0,
      opacity: 1,
      syncWithCard: false,
      gallery: []
    },
    quickReplies: [
      { id: 'qr_1', label: '观察四周', message: '我仔细观察周围的环境与人物动向。', enabled: true },
      { id: 'qr_2', label: '继续续写', message: '/continue', enabled: true },
      { id: 'qr_3', label: '帮写回复', message: '/impersonate', enabled: true }
    ],
    personas: [
      {
        id: 'persona_default',
        name: '旅人',
        avatar: DEFAULT_USER_AVATAR_SVG,
        description: '',
        position: 0,
        depth: 2,
        role: 0,
        lockedCardIds: []
      }
    ],
    cards: [DEFAULT_STARTER_CARD],
    worldBooks: [],
    globalRegexScripts: [],
    extensionSettings: {},
    presets: [
      {
        id: 'preset_default',
        name: '标准酒馆预设',
        builtin: true,
        temperature: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_p: 0.95,
        top_k: 0,
        min_p: 0,
        typical_p: 1,
        repetition_penalty: 1.0,
        openai_max_context: 64000,
        openai_max_tokens: 8192,
        seed: -1,
        stream_openai: true,
        reasoning_effort: 'medium',
        squash_system_messages: false,
        prompts: getDefaultPromptOrderItems()
      }
    ],
    themes: [
      Object.assign({ id: 'theme_gousu_default', builtin: true }, DEFAULT_GOUSU_THEME),
      NIGHT_GOUSU_THEME,
      INS_MINIMAL_THEME
    ],
    plugins: [],
    chatsByCardId: {},
    chatArchivesByCardId: {}
  };

  // 运行时临时状态
  const extensionPrompts = {};
  const rngPoolMemoryCache = new Map();
  const stEventListeners = {};
  let isGenerating = false;
  let editingFloorIndex = -1;
  let openExtraMenuFloorIndex = -1;
  let batchDeleteMode = false;
  const selectedDeleteFloors = new Set();

  // 抽屉内部子视图状态
  let activePromptInspectId = null;
  let activeWorldBookId = null;
  let expandedWbEntryUids = new Set();
  let wbSearchKeyword = '';
  let wbSortBy = 'order';
  let activeRegexEditId = null;
  let regexTestInput = '';
  let activeCardGreetingIdx = 0;

  // ===================================================================
  // === 1. IndexedDB 与 Termux 本地存储同步 ===
  // ===================================================================
  function openTavernIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(TAVERN_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const dbInstance = req.result;
        if (!dbInstance.objectStoreNames.contains(TAVERN_DB_STORE)) {
          dbInstance.createObjectStore(TAVERN_DB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(key) {
    try {
      const dbInstance = await openTavernIdb();
      return await new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(TAVERN_DB_STORE, 'readonly');
        const req = tx.objectStore(TAVERN_DB_STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return null;
    }
  }

  async function idbSet(key, val) {
    try {
      const dbInstance = await openTavernIdb();
      await new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(TAVERN_DB_STORE, 'readwrite');
        tx.objectStore(TAVERN_DB_STORE).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
  }

  function getTermuxBaseUrl() {
    try {
      const raw = localStorage.getItem('ephone_local_vault_config_v1');
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg && cfg.url) return String(cfg.url).replace(/\/+$/, '');
      }
    } catch (_) {}
    return 'http://127.0.0.1:8765';
  }

  const resolvedVaultBlobMap = new Map();
  const pendingVaultResolutionSet = new Set();

  function refreshLiveDomWithResolvedVaultUrl(vaultRef, blobUrl) {
    if (!vaultRef || !blobUrl) return;
    try {
      document.querySelectorAll('img[data-vault-ref]').forEach(img => {
        if (img.getAttribute('data-vault-ref') === vaultRef) {
          img.src = blobUrl;
        }
      });
      const userRaw = getUserAvatarUrl();
      if (userRaw === vaultRef) {
        document.querySelectorAll('#chat .mes[is_user="true"] .avatar img').forEach(img => {
          img.src = blobUrl;
        });
      }
      const card = getActiveCard();
      if (card && card.avatar === vaultRef) {
        document.querySelectorAll('#chat .mes[is_user="false"] .avatar img').forEach(img => {
          img.src = blobUrl;
        });
      }
      if (tavernState.background && tavernState.background.url === vaultRef) {
        const bgEl = document.getElementById('tavern-bg-layer');
        if (bgEl) bgEl.style.backgroundImage = `url('${blobUrl}')`;
      }
      document.querySelectorAll('iframe.tavern-html-sandbox-frame').forEach(frame => {
        try {
          const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
          if (!doc) return;
          if (userRaw === vaultRef) {
            doc.documentElement.style.setProperty('--tavern-user-avatar-bg', `url("${blobUrl}")`);
            doc.querySelectorAll('.user-avatar, .user_avatar').forEach(el => {
              el.style.backgroundImage = `url("${blobUrl}")`;
            });
          }
          if (card && card.avatar === vaultRef) {
            doc.documentElement.style.setProperty('--tavern-char-avatar-bg', `url("${blobUrl}")`);
            doc.querySelectorAll('.char-avatar, .char_avatar').forEach(el => {
              el.style.backgroundImage = `url("${blobUrl}")`;
            });
          }
          doc.querySelectorAll('img').forEach(img => {
            if (img.getAttribute('data-vault-ref') === vaultRef || img.getAttribute('src') === vaultRef) {
              img.src = blobUrl;
            }
          });
        } catch (_) {}
      });
    } catch (_) {}
  }

  function triggerAsyncVaultResolution(vaultRef) {
    if (!vaultRef || !String(vaultRef).startsWith('vault://')) return;
    if (resolvedVaultBlobMap.has(vaultRef) || pendingVaultResolutionSet.has(vaultRef)) return;
    if (typeof window.resolveVaultRefToUrl !== 'function') return;
    pendingVaultResolutionSet.add(vaultRef);
    window.resolveVaultRefToUrl(vaultRef)
      .then(resolved => {
        pendingVaultResolutionSet.delete(vaultRef);
        if (resolved && typeof resolved === 'string' && resolved !== vaultRef && !resolved.startsWith('vault://')) {
          resolvedVaultBlobMap.set(vaultRef, resolved);
          refreshLiveDomWithResolvedVaultUrl(vaultRef, resolved);
        }
      })
      .catch(() => {
        pendingVaultResolutionSet.delete(vaultRef);
      });
  }

  async function offloadImageToVault(fileOrDataUrl, filenameHint = 'tavern_asset.png') {
    let dataUrl = fileOrDataUrl;
    if (fileOrDataUrl instanceof Blob) {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(fileOrDataUrl);
      });
    }
    if (!dataUrl || typeof dataUrl !== 'string') return DEFAULT_AVATAR_SVG;
    if (dataUrl.startsWith('vault://') || dataUrl.startsWith('http') || dataUrl.startsWith('data:image/svg')) return dataUrl;
    if (typeof window.saveStickerToLocalVault === 'function') {
      try {
        const ref = await window.saveStickerToLocalVault(dataUrl, false);
        if (ref && typeof ref === 'string') {
          if (ref.startsWith('vault://')) {
            triggerAsyncVaultResolution(ref);
            // Release any old duplicate browser thumbnail cache to keep browser memory clean
            if (tavernState.extensionSettings && tavernState.extensionSettings.avatarThumbs) {
              delete tavernState.extensionSettings.avatarThumbs;
            }
          }
          return ref;
        }
      } catch (_) {}
    }
    return dataUrl;
  }

  let saveTimer = null;
  let hasLoadedTavernStoreOnce = false;
  let hasLoadedFromExternalOrIdb = false;
  let inflightTavernLoadPromise = null;

  function isDefaultStarterOnlyState(st) {
    if (!st || typeof st !== 'object') return true;
    const cards = Array.isArray(st.cards) ? st.cards : [];
    if (cards.length > 1) return false;
    if (cards.length === 1 && cards[0].id !== 'card_default_starter') return false;
    const wbs = Array.isArray(st.worldBooks) ? st.worldBooks : [];
    if (wbs.length > 0) return false;
    const chats = st.chatsByCardId && typeof st.chatsByCardId === 'object' ? st.chatsByCardId : {};
    const starterSess = chats['card_default_starter'];
    if (starterSess && Array.isArray(starterSess.messages) && starterSess.messages.length > 1) return false;
    return true;
  }

  async function performTavernStoreSaveNow() {
    try {
      if (inflightTavernLoadPromise) {
        await inflightTavernLoadPromise;
      }
      const baseUrl = getTermuxBaseUrl();
      // Guard against overwriting an existing Termux tavern_store.json with a blank starter state
      if (!hasLoadedFromExternalOrIdb && isDefaultStarterOnlyState(tavernState)) {
        try {
          const checkRes = await fetch(baseUrl + '/tavern_store.json', { method: 'GET', cache: 'no-store' });
          if (checkRes && checkRes.ok) {
            const checkText = await checkRes.text();
            if (checkText && checkText.trim().startsWith('{')) {
              const existingDisk = JSON.parse(checkText);
              if (existingDisk && !isDefaultStarterOnlyState(existingDisk)) {
                await loadTavernStore();
                if (isTavernActive()) renderTavernShell();
                return;
              }
            }
          }
        } catch (_) {}
      }

      const copy = Object.assign({}, tavernState);
      delete copy.activeDrawerId;
      const serialized = JSON.stringify(copy);
      let savedToTermux = false;
      try {
        const res = await fetch(baseUrl + '/tavern_store.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: serialized
        });
        if (res && res.ok) {
          savedToTermux = true;
        }
      } catch (_) {}

      if (savedToTermux) {
        // When Termux local storage is active, release browser IndexedDB copy to free browser memory
        await idbSet(TAVERN_STORE_KEY, '');
      } else {
        await idbSet(TAVERN_STORE_KEY, serialized);
      }
    } catch (err) {
      console.error('保存酒馆状态失败:', err);
    }
  }

  async function saveTavernStore(immediate = false) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (immediate) {
      await performTavernStoreSaveNow();
      return;
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      performTavernStoreSaveNow();
    }, 120);
  }
  const saveTavernState = saveTavernStore;

  function isHostAppHtmlFallback(str) {
    if (!str || typeof str !== 'string') return false;
    return (
      str.includes('id="phone-screen"') ||
      str.includes('id="phone-container"') ||
      str.includes('id="api-settings-version-tag"') ||
      str.includes('id="game-hall-screen"') ||
      str.includes('id="tavern-app-shell"')
    );
  }

  async function loadTavernStore() {
    if (inflightTavernLoadPromise) {
      return inflightTavernLoadPromise;
    }
    inflightTavernLoadPromise = (async () => {
      try {
        const prevChatsByCardId = Object.assign({}, tavernState.chatsByCardId || {});
        const prevArchivesByCardId = Object.assign({}, tavernState.chatArchivesByCardId || {});

        let loaded = null;
        const baseUrl = getTermuxBaseUrl();
        const candidateUrls = [baseUrl + '/tavern_store.json'];
        if (baseUrl.includes('127.0.0.1')) {
          candidateUrls.push(baseUrl.replace('127.0.0.1', 'localhost') + '/tavern_store.json');
        } else if (baseUrl.includes('localhost')) {
          candidateUrls.push(baseUrl.replace('localhost', '127.0.0.1') + '/tavern_store.json');
        }

        for (const tUrl of candidateUrls) {
          try {
            const res = await fetch(tUrl, {
              method: 'GET',
              cache: 'no-store'
            });
            if (res && res.ok) {
              const text = await res.text();
              if (text && text.trim().startsWith('{')) {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object') {
                  loaded = parsed;
                  hasLoadedFromExternalOrIdb = true;
                  break;
                }
              }
            }
          } catch (_) {}
        }

        if (!loaded) {
          let rawIdb = await idbGet(TAVERN_STORE_KEY);
          if (!rawIdb) rawIdb = await idbGet('tavern_state_v1');
          if (rawIdb && typeof rawIdb === 'string') {
            try {
              loaded = JSON.parse(rawIdb);
              if (loaded && typeof loaded === 'object') hasLoadedFromExternalOrIdb = true;
            } catch (_) {}
          } else if (rawIdb && typeof rawIdb === 'object') {
            loaded = rawIdb;
            hasLoadedFromExternalOrIdb = true;
          }
        }

        if (loaded && typeof loaded === 'object') {
          tavernState = Object.assign({}, tavernState, loaded);
          tavernState.uiSettings = Object.assign({}, tavernState.uiSettings, loaded.uiSettings || {});
          tavernState.apiConfig = Object.assign({}, tavernState.apiConfig, loaded.apiConfig || {});
      if (!Array.isArray(tavernState.apiConfig.savedPresets)) tavernState.apiConfig.savedPresets = [];
      if (!tavernState.apiConfig.activeSavedPresetId && tavernState.apiConfig.activeApiPresetId) {
        tavernState.apiConfig.activeSavedPresetId = tavernState.apiConfig.activeApiPresetId;
      }
      tavernState.formatting = Object.assign({}, tavernState.formatting, loaded.formatting || {});
      tavernState.authorNote = Object.assign({}, tavernState.authorNote, loaded.authorNote || {});
      tavernState.memory = Object.assign({}, tavernState.memory, loaded.memory || {});
      tavernState.background = Object.assign({}, tavernState.background, loaded.background || {});
      if (!Array.isArray(tavernState.background.gallery)) {
        tavernState.background.gallery = [];
      }
      tavernState.extensionSettings = Object.assign({}, tavernState.extensionSettings, loaded.extensionSettings || {});

      if (!Array.isArray(tavernState.cards) || tavernState.cards.length === 0) {
        tavernState.cards = [DEFAULT_STARTER_CARD];
      }
      tavernState.cards.forEach(c => {
        if (!c.avatar || String(c.avatar).includes('P5gL5z2g')) {
          c.avatar = DEFAULT_AVATAR_SVG;
        }
      });

      if (!Array.isArray(tavernState.personas) || tavernState.personas.length === 0) {
        tavernState.personas = [
          {
            id: 'persona_default',
            name: '旅人',
            avatar: DEFAULT_USER_AVATAR_SVG,
            description: '',
            position: 0,
            depth: 2,
            role: 0,
            lockedCardIds: []
          }
        ];
      }

      if (!Array.isArray(tavernState.themes) || tavernState.themes.length === 0) {
        tavernState.themes = [
          Object.assign({ id: 'theme_gousu_default', builtin: true }, DEFAULT_GOUSU_THEME),
          NIGHT_GOUSU_THEME,
          INS_MINIMAL_THEME
        ];
      } else {
        const gousuIdx = tavernState.themes.findIndex(t => t.id === 'theme_gousu_default');
        if (gousuIdx === -1) {
          tavernState.themes.unshift(Object.assign({ id: 'theme_gousu_default', builtin: true }, DEFAULT_GOUSU_THEME));
        } else {
          tavernState.themes[gousuIdx].custom_css = DEFAULT_GOUSU_THEME.custom_css;
        }
        const nightIdx = tavernState.themes.findIndex(t => t.id === 'theme_gousu_night');
        if (nightIdx === -1) {
          tavernState.themes.splice(1, 0, NIGHT_GOUSU_THEME);
        } else {
          tavernState.themes[nightIdx] = Object.assign({}, NIGHT_GOUSU_THEME, { id: 'theme_gousu_night', builtin: true });
        }
        if (!tavernState.themes.some(t => t.id === 'theme_ins_minimal')) {
          tavernState.themes.push(INS_MINIMAL_THEME);
        }
      }

      if (!Array.isArray(tavernState.presets) || tavernState.presets.length === 0) {
        tavernState.presets = [
          {
            id: 'preset_default',
            name: '标准酒馆预设',
            builtin: true,
            temperature: 1.0,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.95,
            top_k: 0,
            min_p: 0,
            typical_p: 1,
            repetition_penalty: 1.0,
            openai_max_context: 64000,
            openai_max_tokens: 8192,
            seed: -1,
            stream_openai: true,
            reasoning_effort: 'medium',
            squash_system_messages: false,
            regexScripts: [],
            prompts: getDefaultPromptOrderItems()
          }
        ];
      } else {
        tavernState.presets.forEach(p => {
          if (p.openai_max_context === undefined) p.openai_max_context = p.contextSize || 64000;
          if (p.openai_max_tokens === undefined || Number(p.openai_max_tokens) < 4096) {
            p.openai_max_tokens = Math.max(8192, Number(p.maxTokens || p.openai_max_tokens || 8192));
          }
          if (p.top_p === undefined) p.top_p = p.topP ?? 0.95;
          if (p.top_k === undefined) p.top_k = p.topK ?? 0;
          if (p.frequency_penalty === undefined) p.frequency_penalty = p.freqPenalty ?? 0;
          if (p.presence_penalty === undefined) p.presence_penalty = p.presPenalty ?? 0;
          if (p.repetition_penalty === undefined) p.repetition_penalty = p.repPenalty ?? 1.0;
          if (!Array.isArray(p.regexScripts)) p.regexScripts = [];
          if (!Array.isArray(p.prompts) || p.prompts.length === 0) {
            p.prompts = getDefaultPromptOrderItems();
          }
        });
      }

      if (tavernState.uiSettings.streamSpeed === undefined || tavernState.uiSettings.streamSpeed === null || Number.isNaN(Number(tavernState.uiSettings.streamSpeed)) || Number(tavernState.uiSettings.streamSpeed) < 0) {
        tavernState.uiSettings.streamSpeed = 0;
      } else if (Number(tavernState.uiSettings.streamSpeed) === 35 && !tavernState.uiSettings.streamSpeedUserSaved) {
        tavernState.uiSettings.streamSpeed = 0;
      } else {
        tavernState.uiSettings.streamSpeed = Number(tavernState.uiSettings.streamSpeed);
      }

      if (!Array.isArray(tavernState.globalRegexScripts)) {
        tavernState.globalRegexScripts = Array.isArray(loaded.regexScripts) ? loaded.regexScripts : [];
      }

      if (!Array.isArray(tavernState.plugins)) {
        tavernState.plugins = [];
      } else {
        tavernState.plugins = tavernState.plugins
          .filter(pl => pl && pl.id !== 'plugin_d100_rng' && pl.id !== 'plugin_builtin_d100' && pl.builtInType !== 'd100_pool')
          .map(pl => {
            if (isHostAppHtmlFallback(pl.uiHtml)) pl.uiHtml = '';
            if (pl.htmlTemplates && typeof pl.htmlTemplates === 'object') {
              Object.keys(pl.htmlTemplates).forEach(k => {
                if (isHostAppHtmlFallback(pl.htmlTemplates[k])) delete pl.htmlTemplates[k];
              });
            }
            return pl;
          });
      }
      if (!tavernState.extensionSettings?._uninstalledBaiBaiBook && !tavernState.plugins.some(pl => isBaiBaiBookPlugin(pl))) {
        tavernState.plugins.push({
          id: 'plugin_baibai_book',
          name: '柏宝书',
          enabled: true,
          code: '',
          uiHtml: '',
          htmlTemplates: {},
          repoBaseUrl: 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Book/main',
          jsEntryPath: 'dist/index.js',
          description: '柏宝书，SillyTavern总结和记忆管理插件'
        });
      }

      if (!tavernState.chatsByCardId || typeof tavernState.chatsByCardId !== 'object') {
        tavernState.chatsByCardId = {};
      }
      if (!tavernState.chatArchivesByCardId || typeof tavernState.chatArchivesByCardId !== 'object') {
        tavernState.chatArchivesByCardId = {};
      }

      // Never allow a stale storage snapshot to overwrite a richer in-memory chat session
      if (hasLoadedTavernStoreOnce) {
        Object.keys(prevChatsByCardId).forEach(cid => {
          const memSess = prevChatsByCardId[cid];
          const diskSess = tavernState.chatsByCardId[cid];
          const memLen = (memSess && Array.isArray(memSess.messages)) ? memSess.messages.length : 0;
          const diskLen = (diskSess && Array.isArray(diskSess.messages)) ? diskSess.messages.length : 0;
          if (memLen > diskLen) {
            tavernState.chatsByCardId[cid] = memSess;
          }
        });
        Object.keys(prevArchivesByCardId).forEach(cid => {
          const memArc = prevArchivesByCardId[cid];
          const diskArc = tavernState.chatArchivesByCardId[cid];
          if (Array.isArray(memArc) && (!Array.isArray(diskArc) || memArc.length > diskArc.length)) {
            tavernState.chatArchivesByCardId[cid] = memArc;
          }
        });
      }
    }

        hasLoadedTavernStoreOnce = true;
        ensureActiveCardChatInitialized();
      } finally {
        inflightTavernLoadPromise = null;
      }
    })();
    return inflightTavernLoadPromise;
  }
  const loadTavernState = loadTavernStore;

  function getActiveCard() {
    let card = tavernState.cards.find(c => c.id === tavernState.activeCardId);
    if (!card) {
      card = tavernState.cards[0] || DEFAULT_STARTER_CARD;
      tavernState.activeCardId = card.id;
    }
    return card;
  }

  function getActivePreset() {
    let preset = tavernState.presets.find(p => p.id === tavernState.activePresetId);
    if (!preset) {
      preset = tavernState.presets[0];
      tavernState.activePresetId = preset.id;
    }
    if (!Array.isArray(preset.prompts) || preset.prompts.length === 0) {
      preset.prompts = getDefaultPromptOrderItems();
    }
    return preset;
  }

  function getActivePersona() {
    const card = getActiveCard();
    const locked = tavernState.personas.find(p => Array.isArray(p.lockedCardIds) && card && p.lockedCardIds.includes(card.id));
    if (locked) return locked;
    let p = tavernState.personas.find(x => x.id === tavernState.activePersonaId);
    if (!p) {
      p = tavernState.personas[0];
      tavernState.activePersonaId = p.id;
    }
    return p;
  }

  function getUserDisplayName() {
    const p = getActivePersona();
    if (p && p.name && p.name.trim()) return p.name.trim();
    try {
      if (typeof state !== 'undefined' && state.chats) {
        const firstChat = Object.values(state.chats)[0];
        if (firstChat && firstChat.settings && firstChat.settings.myName) {
          return firstChat.settings.myName;
        }
      }
    } catch (_) {}
    return '旅人';
  }

  function getUserAvatarUrl() {
    const p = getActivePersona();
    if (p && p.avatar && !String(p.avatar).includes('P5gL5z2g') && p.avatar !== DEFAULT_USER_AVATAR_SVG) {
      return p.avatar;
    }
    try {
      if (typeof state !== 'undefined' && state) {
        if (state.chats) {
          for (const chat of Object.values(state.chats)) {
            if (chat && chat.settings && chat.settings.myAvatar && !String(chat.settings.myAvatar).includes('P5gL5z2g')) {
              return chat.settings.myAvatar;
            }
          }
        }
        if (state.qzoneSettings && state.qzoneSettings.avatar && !String(state.qzoneSettings.avatar).includes('P5gL5z2g')) {
          return state.qzoneSettings.avatar;
        }
      }
    } catch (_) {}
    return DEFAULT_USER_AVATAR_SVG;
  }

  function getActiveChatSession() {
    const card = getActiveCard();
    ensureActiveCardChatInitialized(card);
    return tavernState.chatsByCardId[card.id];
  }

  function buildInitialSessionForCard(card) {
    const greetings = [];
    if (card.first_mes && String(card.first_mes).trim()) {
      greetings.push(String(card.first_mes));
    }
    if (Array.isArray(card.alternate_greetings)) {
      card.alternate_greetings.forEach(g => {
        if (g && String(g).trim()) greetings.push(String(g));
      });
    }
    if (greetings.length === 0) {
      greetings.push('你好，旅人。');
    }
    return {
      cardId: card.id,
      chatId: 'chat_' + card.id + '_' + Date.now(),
      title: (card.name || '角色') + '存档 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      metadata: {},
      messages: [
        {
          mesid: 0,
          name: card.name || '角色',
          is_user: false,
          is_system: false,
          send_date: Date.now(),
          mes: greetings[0],
          swipes: greetings,
          swipe_id: 0,
          reasoning: '',
          gen_time: '',
          token_count: estimateTokens(greetings[0])
        }
      ]
    };
  }

  function ensureActiveCardChatInitialized(cardObj) {
    const card = cardObj || getActiveCard();
    if (!card) return;
    if (!tavernState.chatsByCardId[card.id] || !Array.isArray(tavernState.chatsByCardId[card.id].messages) || tavernState.chatsByCardId[card.id].messages.length === 0) {
      const sess = buildInitialSessionForCard(card);
      tavernState.chatsByCardId[card.id] = sess;
      if (!Array.isArray(tavernState.chatArchivesByCardId[card.id])) {
        tavernState.chatArchivesByCardId[card.id] = [sess];
      }
    }
  }

  function estimateTokens(text) {
    if (!text) return 0;
    const str = String(text);
    let cjk = 0;
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 255) cjk++;
    }
    const rest = str.length - cjk;
    return Math.max(1, Math.round(cjk * 0.7 + rest * 0.28));
  }

  function escapeHtmlSimple(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function downloadJsonFile(filename, dataObj) {
    const blob = new Blob([typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  // ============================================================================
  // 5. SillyTavern Extension Context Bridge & Built-in D100 Pool
  // ============================================================================
  const tavernEventListeners = {};
  const tavernExtensionPrompts = {};

  const TAVERN_EVENT_TYPES = {
    MESSAGE_RECEIVED: 'message_received',
    MESSAGE_SENT: 'message_sent',
    USER_MESSAGE_RENDERED: 'user_message_rendered',
    CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
    CHAT_CHANGED: 'chat_id_changed',
    GENERATION_AFTER_COMMANDS: 'GENERATION_AFTER_COMMANDS',
    GENERATION_STARTED: 'generation_started',
    GENERATION_ENDED: 'generation_ended',
    GENERATION_STOPPED: 'generation_stopped',
    MESSAGE_SWIPED: 'message_swiped',
    MESSAGE_DELETED: 'message_deleted',
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_EDITED: 'message_edited',
    MORE_MESSAGES_LOADED: 'more_messages_loaded',
    APP_READY: 'app_ready'
  };

  const TAVERN_EXT_PROMPT_TYPES = {
    NONE: -1,
    IN_PROMPT: 0,
    IN_CHAT: 1,
    BEFORE_PROMPT: 2
  };

  const tavernEventSource = {
    on(evt, cb) {
      if (!evt || typeof cb !== 'function') return;
      if (!tavernEventListeners[evt]) tavernEventListeners[evt] = [];
      if (!tavernEventListeners[evt].includes(cb)) {
        tavernEventListeners[evt].push(cb);
      }
    },
    off(evt, cb) {
      if (!evt || !tavernEventListeners[evt]) return;
      tavernEventListeners[evt] = tavernEventListeners[evt].filter(fn => fn !== cb);
    },
    async emit(evt, ...args) {
      const list = tavernEventListeners[evt] || [];
      for (const fn of list) {
        try {
          await fn(...args);
        } catch (err) {
          console.error('Tavern plugin event error:', evt, err);
        }
      }
    }
  };

  function setExtensionPrompt(key, value, position = 1, depth = 0, scan = false, role = 0) {
    if (!key) return;
    if (!value || !String(value).trim()) {
      delete tavernExtensionPrompts[key];
      return;
    }
    tavernExtensionPrompts[key] = {
      key,
      value: String(value),
      position: Number(position) || 0,
      depth: Number(depth) || 0,
      scan: Boolean(scan),
      role: Number(role) || 0
    };
  }

  function getChatVariablesStore() {
    const sess = getActiveChatSession();
    if (!sess.metadata) sess.metadata = {};
    if (!sess.metadata.variables || typeof sess.metadata.variables !== 'object') {
      sess.metadata.variables = {};
    }
    return sess.metadata.variables;
  }

  function getGlobalVariablesStore() {
    if (!tavernState.extensionSettings) tavernState.extensionSettings = {};
    if (!tavernState.extensionSettings.globalVariables || typeof tavernState.extensionSettings.globalVariables !== 'object') {
      tavernState.extensionSettings.globalVariables = {};
    }
    return tavernState.extensionSettings.globalVariables;
  }

  let pendingAutoTriggerTimer = null;
  let persistentExtSettingsEl = null;
  let persistentExtSettings2El = null;

  function ensurePersistentExtensionContainers() {
    if (!persistentExtSettingsEl) {
      persistentExtSettingsEl = document.createElement('div');
      persistentExtSettingsEl.id = 'extensions_settings';
      persistentExtSettingsEl.className = 'tavern-plugin-mounted-settings';
    }
    if (!persistentExtSettings2El) {
      persistentExtSettings2El = document.createElement('div');
      persistentExtSettings2El.id = 'extensions_settings2';
      persistentExtSettings2El.className = 'tavern-plugin-mounted-settings';
    }
    let holdingArea = document.getElementById('tavern-persistent-ext-holder');
    if (!holdingArea) {
      holdingArea = document.createElement('div');
      holdingArea.id = 'tavern-persistent-ext-holder';
      holdingArea.style.display = 'none';
      document.body.appendChild(holdingArea);
    }
    if (!persistentExtSettingsEl.parentNode) holdingArea.appendChild(persistentExtSettingsEl);
    if (!persistentExtSettings2El.parentNode) holdingArea.appendChild(persistentExtSettings2El);
  }

  function splitSlashCommandPipeline(cmdText) {
    const raw = String(cmdText || '').trim();
    if (!raw) return [];
    const results = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if ((ch === '"' || ch === "'") && raw[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = ch;
        } else if (quoteChar === ch) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      if (ch === '|' && !inQuotes) {
        const isDoublePipe = raw[i + 1] === '|';
        const restAfterPipe = raw.slice(i + (isDoublePipe ? 2 : 1));
        const currentCmdName = (current.trim().match(/^\/([a-zA-Z0-9_-]+)/) || [])[1]?.toLowerCase() || '';
        const isTextBodyCmd = currentCmdName === 'send' || currentCmdName === 'sendas' || currentCmdName === 'sys' || currentCmdName === 'input' || currentCmdName === 'echo';
        // For text-carrying commands (/send, /input, etc.), only split on | if what follows is another slash command (/trigger, /setvar, etc.)
        if (!isTextBodyCmd || /^\s*\/[a-zA-Z]/.test(restAfterPipe)) {
          if (current.trim()) results.push(current.trim());
          current = '';
          if (isDoublePipe) i++;
          continue;
        }
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        const restAfterNewline = raw.slice(i + 1);
        if (/^\s*\/(?:trigger|gen|generate|continue|impersonate|setvar|addvar|incvar|decvar|setglobalvar|setentryfield|delvar|flushvar|cut|del|hide|unhide)\b/i.test(restAfterNewline)) {
          if (current.trim()) results.push(current.trim());
          current = '';
          continue;
        }
      }
      current += ch;
    }
    if (current.trim()) results.push(current.trim());
    return results;
  }

  async function executeTavernSlashCommand(cmdText, execOptions = {}) {
    if (!cmdText || typeof cmdText !== 'string') return '';
    const trimmedInput = cmdText.trim();
    if (!trimmedInput) return '';

    const parts = splitSlashCommandPipeline(trimmedInput);
    let lastResult = '';
    let sentUserMessageInBatch = false;
    let triggeredGenerationInBatch = false;
    let suppressAutoTrigger = Boolean(execOptions && execOptions.suppressAutoTrigger);

    for (const rawLine of parts) {
      const line = rawLine.replace(/\{\{pipe\}\}|\{\{\$pipe\}\}/gi, String(lastResult ?? '')).trim();
      if (!line) continue;

      // If an HTML button or script passes plain non-slash text to triggerSlash, treat it as /send + auto-trigger
      if (!line.startsWith('/')) {
        const sess = getActiveChatSession();
        const userMsg = {
          mesid: sess.messages.length,
          name: getUserDisplayName(),
          is_user: true,
          is_system: false,
          send_date: Date.now(),
          mes: line,
          swipes: [line],
          swipe_id: 0,
          reasoning: '',
          gen_time: '',
          token_count: estimateTokens(line)
        };
        sess.messages.push(userMsg);
        sentUserMessageInBatch = true;
        lastResult = line;
        continue;
      }

      if (/^\/setentryfield\b/i.test(line)) {
        const fileMatch = line.match(/file="([^"]*)"/i);
        const uidMatch = line.match(/uid="([^"]*)"/i) || line.match(/uid=([^\s]+)/i);
        const fieldMatch = line.match(/field="([^"]*)"/i) || line.match(/field=([^\s]+)/i);
        let valuePart = line
          .replace(/^\/setentryfield\s+/i, '')
          .replace(/file="[^"]*"\s*/i, '')
          .replace(/uid=(?:"[^"]*"|[^\s]+)\s*/i, '')
          .replace(/field=(?:"[^"]*"|[^\s]+)\s*/i, '')
          .trim();
        const fileName = fileMatch ? fileMatch[1] : '';
        const uidVal = uidMatch ? uidMatch[1] : '';
        const fieldName = fieldMatch ? fieldMatch[1] : 'content';
        const card = getActiveCard();
        let targetWb = (tavernState.worldBooks || []).find(w =>
          (fileName && (w.name === fileName || w.name.includes(fileName))) ||
          (card && w.id === card.worldBookId)
        ) || (tavernState.worldBooks || [])[0];
        if (targetWb && Array.isArray(targetWb.entries)) {
          let entry = targetWb.entries.find(e => String(e.uid) === String(uidVal) || String(e.comment) === String(uidVal));
          if (!entry && uidVal) {
            entry = normalizeSingleWorldEntry({ uid: uidVal, comment: '自动写入词条 ' + uidVal, constant: true, content: valuePart }, targetWb.entries.length);
            targetWb.entries.push(entry);
          } else if (entry) {
            entry[fieldName] = valuePart;
          }
          showTavernToast('已写入世界书词条 ' + (entry?.comment || uidVal));
        }
        lastResult = valuePart;
      } else if (/^\/(?:setvar|setchatvar)\b/i.test(line)) {
        const m = line.match(/^\/(?:setvar|setchatvar)\s+key=([^\s]+)\s*([\s\S]*)$/i) || line.match(/^\/(?:setvar|setchatvar)\s+([^\s=]+)=([\s\S]*)$/i) || line.match(/^\/(?:setvar|setchatvar)\s+([^\s]+)\s+([\s\S]*)$/i);
        if (m) {
          const vars = getChatVariablesStore();
          const k = m[1].replace(/^["']|["']$/g, '').trim();
          const v = (m[2] || '').replace(/^["']|["']$/g, '');
          vars[k] = v;
          lastResult = v;
        }
      } else if (/^\/(?:getvar|getchatvar)\b/i.test(line)) {
        const key = line.replace(/^\/(?:getvar|getchatvar)\s+(?:key=)?/i, '').replace(/^["']|["']$/g, '').trim();
        const vars = getChatVariablesStore();
        lastResult = vars[key] !== undefined ? String(vars[key]) : '';
      } else if (/^\/(?:addvar|addchatvar)\b/i.test(line)) {
        const m = line.match(/^\/(?:addvar|addchatvar)\s+(?:key=)?([^\s]+)\s+([\s\S]*)$/i);
        if (m) {
          const vars = getChatVariablesStore();
          const key = m[1].trim();
          const cur = Number(vars[key] ?? 0);
          const delta = Number(m[2].trim());
          if (!Number.isNaN(cur) && !Number.isNaN(delta)) {
            vars[key] = cur + delta;
          } else {
            vars[key] = String(vars[key] || '') + m[2].trim();
          }
          lastResult = String(vars[key]);
        }
      } else if (/^\/(?:incvar|decvar)\b/i.test(line)) {
        const isInc = /^\/incvar\b/i.test(line);
        const key = line.replace(/^\/(?:incvar|decvar)\s+(?:key=)?/i, '').trim();
        if (key) {
          const vars = getChatVariablesStore();
          vars[key] = (Number(vars[key]) || 0) + (isInc ? 1 : -1);
          lastResult = String(vars[key]);
        }
      } else if (/^\/(?:delvar|flushvar)\b/i.test(line)) {
        const key = line.replace(/^\/(?:delvar|flushvar)\s+(?:key=)?/i, '').trim();
        const vars = getChatVariablesStore();
        if (key) delete vars[key];
        lastResult = '';
      } else if (/^\/setglobalvar\b/i.test(line)) {
        const m = line.match(/^\/setglobalvar\s+(?:key=)?([^\s]+)\s+([\s\S]*)$/i);
        if (m) {
          const gvars = getGlobalVariablesStore();
          gvars[m[1].trim()] = m[2];
          lastResult = m[2];
        }
      } else if (/^\/getglobalvar\b/i.test(line)) {
        const key = line.replace(/^\/getglobalvar\s+(?:key=)?/i, '').trim();
        const gvars = getGlobalVariablesStore();
        lastResult = gvars[key] !== undefined ? String(gvars[key]) : '';
      } else if (/^\/addglobalvar\b/i.test(line)) {
        const m = line.match(/^\/addglobalvar\s+(?:key=)?([^\s]+)\s+([\s\S]*)$/i);
        if (m) {
          const gvars = getGlobalVariablesStore();
          const key = m[1].trim();
          const cur = Number(gvars[key] ?? 0);
          const delta = Number(m[2].trim());
          gvars[key] = (!Number.isNaN(cur) && !Number.isNaN(delta)) ? (cur + delta) : (String(gvars[key] || '') + m[2].trim());
          lastResult = String(gvars[key]);
        }
      } else if (/^\/(?:echo|toast)\b/i.test(line)) {
        const msg = line.replace(/^\/(?:echo|toast)(?:\s+severity=[^\s]+|\s+title="[^"]*")*\s+/i, '').trim();
        if (msg) showTavernToast(msg);
        lastResult = msg;
      } else if (/^\/(?:input|setinput)\b/i.test(line)) {
        const textVal = line.replace(/^\/(?:input|setinput)\s+/i, '').trim();
        const textarea = document.getElementById('send_textarea');
        if (textarea) textarea.value = textVal;
        lastResult = textVal;
      } else if (/^\/(?:sendas|sys)\b/i.test(line)) {
        const isSys = /^\/sys\b/i.test(line);
        let msg = line.replace(/^\/(?:sendas|sys)\s+/i, '').trim();
        let senderName = isSys ? '系统' : (getActiveCard()?.name || '角色');
        const nameMatch = msg.match(/^name=(?:"([^"]+)"|([^\s]+))\s+([\s\S]*)$/i);
        if (nameMatch) {
          senderName = nameMatch[1] || nameMatch[2];
          msg = nameMatch[3];
        }
        if (msg) {
          const sess = getActiveChatSession();
          sess.messages.push({
            mesid: sess.messages.length,
            name: senderName,
            is_user: false,
            is_system: isSys,
            send_date: Date.now(),
            mes: msg,
            swipes: [msg],
            swipe_id: 0,
            reasoning: '',
            gen_time: '',
            token_count: estimateTokens(msg)
          });
          lastResult = msg;
        }
      } else if (/^\/send\b/i.test(line)) {
        let msg = line.replace(/^\/send\b\s*/i, '');
        if (/^(?:at=\d+\s+|name="[^"]*"\s+|compact=\w+\s+)+/i.test(msg)) {
          msg = msg.replace(/^(?:at=\d+\s+|name="[^"]*"\s+|compact=\w+\s+)+/i, '');
        }
        msg = msg.trim();
        if (msg) {
          const sess = getActiveChatSession();
          const userMsg = {
            mesid: sess.messages.length,
            name: getUserDisplayName(),
            is_user: true,
            is_system: false,
            send_date: Date.now(),
            mes: msg,
            swipes: [msg],
            swipe_id: 0,
            reasoning: '',
            gen_time: '',
            token_count: estimateTokens(msg)
          };
          sess.messages.push(userMsg);
          sentUserMessageInBatch = true;
          lastResult = msg;
        }
      } else if (/^\/(?:trigger|gen|generate)\b/i.test(line)) {
        triggeredGenerationInBatch = true;
        if (pendingAutoTriggerTimer) {
          clearTimeout(pendingAutoTriggerTimer);
          pendingAutoTriggerTimer = null;
        }
        uiRuntime.isGenerating = false;
        await saveTavernStore();
        if (sentUserMessageInBatch) {
          sentUserMessageInBatch = false;
          const sess = getActiveChatSession();
          const uIdx = sess ? Math.max(0, sess.messages.length - 1) : 0;
          appendOrUpdateSingleFloorDom(uIdx, { scrollToBottom: true });
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SENT, uIdx);
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.USER_MESSAGE_RENDERED, uIdx);
        }
        await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
      } else if (/^\/continue\b/i.test(line)) {
        triggeredGenerationInBatch = true;
        uiRuntime.isGenerating = false;
        await saveTavernStore();
        await triggerCharacterReplyGeneration({ isContinue: true, isSwipeRegen: false });
      } else if (/^\/impersonate\b/i.test(line)) {
        triggeredGenerationInBatch = true;
        uiRuntime.isGenerating = false;
        await saveTavernStore();
        await triggerCharacterReplyGeneration({ isImpersonate: true });
      } else if (/^\/(?:del|delete|cut)\b/i.test(line)) {
        const countMatch = line.match(/(\d+)/);
        const delCount = countMatch ? Math.max(1, Number(countMatch[1])) : 1;
        const sess = getActiveChatSession();
        uiRuntime.isGenerating = false;
        if (sess && sess.messages.length > 1) {
          sess.messages.splice(Math.max(1, sess.messages.length - delCount));
          sess.messages.forEach((m, i) => { m.mesid = i; });
          renderTavernChatFloors(false);
        }
      } else if (/^\/(?:hide|unhide)\b/i.test(line)) {
        const isHide = /^\/hide\b/i.test(line);
        const sess = getActiveChatSession();
        if (sess && Array.isArray(sess.messages)) {
          const rangeMatch = line.match(/(\d+)\s*-\s*(\d+)/);
          const singleMatch = line.match(/(\d+)/);
          let startIdx = -1;
          let endIdx = -1;
          if (rangeMatch) {
            startIdx = Number(rangeMatch[1]);
            endIdx = Number(rangeMatch[2]);
          } else if (singleMatch) {
            startIdx = Number(singleMatch[1]);
            endIdx = startIdx;
          }
          if (startIdx >= 0 && endIdx >= startIdx) {
            for (let i = startIdx; i <= Math.min(endIdx, sess.messages.length - 1); i++) {
              if (sess.messages[i]) {
                if (!sess.messages[i].extra || typeof sess.messages[i].extra !== 'object') sess.messages[i].extra = {};
                sess.messages[i].extra.bbs_hidden = isHide;
              }
            }
          }
        }
      }
    }

    await saveTavernStore();

    if (sentUserMessageInBatch) {
      const sess = getActiveChatSession();
      appendOrUpdateSingleFloorDom(sess.messages.length - 1, { scrollToBottom: true });
      await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SENT, sess.messages.length - 1);
      await tavernEventSource.emit(TAVERN_EVENT_TYPES.USER_MESSAGE_RENDERED, sess.messages.length - 1);

      if (!triggeredGenerationInBatch && !suppressAutoTrigger) {
        if (pendingAutoTriggerTimer) clearTimeout(pendingAutoTriggerTimer);
        pendingAutoTriggerTimer = setTimeout(async () => {
          pendingAutoTriggerTimer = null;
          uiRuntime.isGenerating = false;
          await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
        }, 90);
      }
    }

    return lastResult;
  }

  function createTavernJQueryShim() {
    ensurePersistentExtensionContainers();

    function parseHtmlNodes(htmlStr) {
      const trimmed = String(htmlStr || '').trim();
      const bareTagMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9:-]*)\s*\/?>$/);
      if (bareTagMatch) {
        return [document.createElement(bareTagMatch[1])];
      }
      const tpl = document.createElement('template');
      tpl.innerHTML = trimmed;
      return Array.from(tpl.content.childNodes);
    }

    function resolveSelectorElements(sel, context) {
      if (!sel) return [];
      if (typeof sel === 'function') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => sel(jq));
        } else {
          setTimeout(() => sel(jq), 0);
        }
        return [];
      }
      if (typeof sel === 'string') {
        const trimmed = sel.trim();
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
          return parseHtmlNodes(trimmed);
        }
        if (trimmed === 'body') {
          return [document.getElementById('tavern-stage-root') || document.body];
        }
        if (trimmed === 'head') {
          return [document.head];
        }
        if (trimmed === '#extensions_settings') {
          return [document.getElementById('extensions_settings') || persistentExtSettingsEl];
        }
        if (trimmed === '#extensions_settings2') {
          return [document.getElementById('extensions_settings2') || persistentExtSettings2El];
        }
        try {
          const root = (context && context.querySelectorAll) ? context : document;
          return Array.from(root.querySelectorAll(trimmed));
        } catch (_) {
          return [];
        }
      }
      if (sel instanceof Element || sel === document || sel === window) {
        return [sel];
      }
      if (sel && sel._isTavernJq && Array.isArray(sel.elements)) {
        return sel.elements;
      }
      if (Array.isArray(sel) || sel instanceof NodeList || sel instanceof HTMLCollection) {
        return Array.from(sel);
      }
      return [];
    }

    function wrapElements(elements) {
      const arr = Array.from(elements || []).filter(Boolean);
      const api = {
        _isTavernJq: true,
        elements: arr,
        length: arr.length,
        get(idx) { return idx === undefined ? arr : arr[idx]; },
        eq(idx) { return wrapElements(arr[idx] ? [arr[idx]] : []); },
        first() { return wrapElements(arr[0] ? [arr[0]] : []); },
        last() { return wrapElements(arr.length ? [arr[arr.length - 1]] : []); },
        each(fn) {
          arr.forEach((el, i) => fn.call(el, i, el));
          return api;
        },
        ready(fn) {
          if (typeof fn === 'function') {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', () => fn(jq));
            } else {
              setTimeout(() => fn(jq), 0);
            }
          }
          return api;
        },
        find(subSel) {
          const found = [];
          arr.forEach(el => {
            if (el && el.querySelectorAll) {
              try { found.push(...el.querySelectorAll(subSel)); } catch (_) {}
            }
          });
          return wrapElements(found);
        },
        closest(subSel) {
          const found = arr.map(el => (el && el.closest) ? el.closest(subSel) : null).filter(Boolean);
          return wrapElements(found);
        },
        parent() {
          return wrapElements(arr.map(el => el && el.parentElement).filter(Boolean));
        },
        children() {
          const ch = [];
          arr.forEach(el => { if (el && el.children) ch.push(...el.children); });
          return wrapElements(ch);
        },
        append(...items) {
          arr.forEach(el => {
            if (!el || !el.appendChild) return;
            items.forEach(item => {
              if (typeof item === 'string') {
                if (isHostAppHtmlFallback(item)) return;
                el.insertAdjacentHTML('beforeend', item);
              } else if (item && item._isTavernJq) {
                item.elements.forEach(child => el.appendChild(child));
              } else if (item instanceof Node) {
                el.appendChild(item);
              }
            });
          });
          return api;
        },
        appendTo(target) {
          const targets = resolveSelectorElements(target);
          targets.forEach(t => {
            if (!t || !t.appendChild) return;
            arr.forEach(el => {
              if (el instanceof Node) t.appendChild(el);
            });
          });
          return api;
        },
        prepend(...items) {
          arr.forEach(el => {
            if (!el) return;
            items.forEach(item => {
              if (typeof item === 'string') {
                if (isHostAppHtmlFallback(item)) return;
                el.insertAdjacentHTML('afterbegin', item);
              } else if (item && item._isTavernJq) {
                item.elements.forEach(child => el.insertBefore(child, el.firstChild));
              } else if (item instanceof Node) {
                el.insertBefore(item, el.firstChild);
              }
            });
          });
          return api;
        },
        empty() {
          arr.forEach(el => { if (el) el.innerHTML = ''; });
          return api;
        },
        remove() {
          arr.forEach(el => { if (el && el.remove) el.remove(); });
          return api;
        },
        html(val) {
          if (val === undefined) return arr[0] ? arr[0].innerHTML : '';
          if (typeof val === 'string' && isHostAppHtmlFallback(val)) return api;
          arr.forEach(el => { if (el) el.innerHTML = String(val); });
          return api;
        },
        text(val) {
          if (val === undefined) return arr[0] ? arr[0].textContent : '';
          arr.forEach(el => { if (el) el.textContent = String(val); });
          return api;
        },
        val(val) {
          if (val === undefined) return arr[0] && 'value' in arr[0] ? arr[0].value : '';
          arr.forEach(el => { if (el && 'value' in el) el.value = val; });
          return api;
        },
        attr(name, val) {
          if (val === undefined) {
            if (typeof name === 'object' && name) {
              Object.entries(name).forEach(([k, v]) => arr.forEach(el => el?.setAttribute?.(k, String(v))));
              return api;
            }
            return arr[0]?.getAttribute?.(name) ?? undefined;
          }
          arr.forEach(el => el?.setAttribute?.(name, String(val)));
          return api;
        },
        prop(name, val) {
          if (val === undefined) return arr[0] ? arr[0][name] : undefined;
          arr.forEach(el => { if (el) el[name] = val; });
          return api;
        },
        removeAttr(name) {
          arr.forEach(el => el?.removeAttribute?.(name));
          return api;
        },
        addClass(cls) {
          if (typeof cls === 'function') {
            arr.forEach((el, i) => {
              const res = cls.call(el, i, el?.className || '');
              String(res || '').split(/\s+/).filter(Boolean).forEach(c => el?.classList?.add(c));
            });
            return api;
          }
          const list = String(cls || '').split(/\s+/).filter(Boolean);
          arr.forEach(el => list.forEach(c => el?.classList?.add(c)));
          return api;
        },
        removeClass(cls) {
          if (typeof cls === 'function') {
            arr.forEach((el, i) => {
              const res = cls.call(el, i, el?.className || '');
              String(res || '').split(/\s+/).filter(Boolean).forEach(c => el?.classList?.remove(c));
            });
            return api;
          }
          if (cls === undefined) {
            arr.forEach(el => { if (el) el.className = ''; });
            return api;
          }
          const list = String(cls || '').split(/\s+/).filter(Boolean);
          arr.forEach(el => list.forEach(c => el?.classList?.remove(c)));
          return api;
        },
        toggleClass(cls, state) {
          arr.forEach(el => el?.classList?.toggle(cls, state));
          return api;
        },
        hasClass(cls) {
          return Boolean(arr[0]?.classList?.contains(cls));
        },
        is(sel) {
          const el = arr[0];
          if (!el) return false;
          if (sel === ':visible') {
            return Boolean(el.style?.display !== 'none' && getComputedStyle(el).display !== 'none');
          }
          if (sel === ':hidden') {
            return Boolean(el.style?.display === 'none' || getComputedStyle(el).display === 'none');
          }
          return Boolean(el.matches && el.matches(sel));
        },
        css(prop, val) {
          if (typeof prop === 'string' && val === undefined) {
            if (prop.startsWith('--')) {
              return arr[0] ? getComputedStyle(arr[0]).getPropertyValue(prop) : '';
            }
            return arr[0] ? getComputedStyle(arr[0])[prop] : '';
          }
          arr.forEach(el => {
            if (!el || !el.style) return;
            const setOne = (k, v) => {
              if (String(k).startsWith('--')) {
                el.style.setProperty(k, String(v ?? ''));
              } else {
                if (k === 'display' && v && v !== 'none') {
                  el._tavernDisplayMode = v;
                }
                el.style[k] = v;
              }
            };
            if (typeof prop === 'object' && prop) {
              Object.entries(prop).forEach(([k, v]) => setOne(k, v));
            } else if (typeof prop === 'string') {
              setOne(prop, val);
            }
          });
          return api;
        },
        show() {
          arr.forEach(el => {
            if (!el || !el.style) return;
            if (el.id === 'extensionsMenu') {
              uiRuntime.showExtensionsPopup = true;
              el.classList.remove('tavern-popup-hidden');
              el.style.display = 'flex';
              return;
            }
            if (el.id === 'options') {
              uiRuntime.showOptionsPopup = true;
              el.classList.remove('tavern-popup-hidden');
              el.style.display = 'flex';
              return;
            }
            const restore = el._tavernDisplayMode || '';
            el.style.display = restore;
            if (getComputedStyle(el).display === 'none') {
              el.style.display = (el.id && el.id.includes('panel')) ? 'flex' : 'block';
            }
          });
          return api;
        },
        hide() {
          arr.forEach(el => {
            if (!el || !el.style) return;
            if (el.id === 'extensionsMenu') {
              uiRuntime.showExtensionsPopup = false;
              el.classList.add('tavern-popup-hidden');
              el.style.display = 'none';
              return;
            }
            if (el.id === 'options') {
              uiRuntime.showOptionsPopup = false;
              el.classList.add('tavern-popup-hidden');
              el.style.display = 'none';
              return;
            }
            if (el.style.display && el.style.display !== 'none') {
              el._tavernDisplayMode = el.style.display;
            }
            el.style.display = 'none';
          });
          return api;
        },
        fadeIn(dur, cb) {
          api.show();
          arr.forEach(el => { if (el && el.style) el.style.opacity = '1'; });
          const fn = typeof dur === 'function' ? dur : cb;
          if (typeof fn === 'function') setTimeout(fn, 20);
          return api;
        },
        fadeOut(dur, cb) {
          api.hide();
          const fn = typeof dur === 'function' ? dur : cb;
          if (typeof fn === 'function') setTimeout(fn, 20);
          return api;
        },
        animate(props, dur, cb) {
          if (props && typeof props === 'object') api.css(props);
          const fn = typeof dur === 'function' ? dur : cb;
          if (typeof fn === 'function') setTimeout(fn, 20);
          return api;
        },
        toggle(showState) {
          arr.forEach(el => {
            if (!el || !el.style) return;
            const hideIt = showState !== undefined ? !showState : (el.style.display !== 'none' && getComputedStyle(el).display !== 'none');
            if (el.id === 'extensionsMenu') {
              uiRuntime.showExtensionsPopup = !hideIt;
              el.classList.toggle('tavern-popup-hidden', hideIt);
              el.style.display = hideIt ? 'none' : 'flex';
              return;
            }
            if (el.id === 'options') {
              uiRuntime.showOptionsPopup = !hideIt;
              el.classList.toggle('tavern-popup-hidden', hideIt);
              el.style.display = hideIt ? 'none' : 'flex';
              return;
            }
            if (hideIt) {
              if (el.style.display && el.style.display !== 'none') el._tavernDisplayMode = el.style.display;
              el.style.display = 'none';
            } else {
              el.style.display = el._tavernDisplayMode || '';
              if (getComputedStyle(el).display === 'none') {
                el.style.display = (el.id && el.id.includes('panel')) ? 'flex' : 'block';
              }
            }
          });
          return api;
        },
        on(evtNames, selectorOrFn, maybeFn) {
          const events = String(evtNames || '').split(/\s+/).filter(Boolean);
          const isDelegated = typeof selectorOrFn === 'string' && typeof maybeFn === 'function';
          const handler = isDelegated ? function (e) {
            const matched = e.target && e.target.closest ? e.target.closest(selectorOrFn) : null;
            if (matched) maybeFn.call(matched, e);
          } : selectorOrFn;
          if (typeof handler !== 'function') return api;
          arr.forEach(el => {
            if (!el._tavernEvtMap) el._tavernEvtMap = {};
            events.forEach(ev => {
              const baseEv = ev.split('.')[0];
              if (!el._tavernEvtMap[ev]) el._tavernEvtMap[ev] = [];
              const listenerOpts = (baseEv === 'touchstart' || baseEv === 'touchmove') ? { passive: false } : false;
              el._tavernEvtMap[ev].push({ baseEv, handler, listenerOpts });
              el?.addEventListener?.(baseEv, handler, listenerOpts);
            });
          });
          return api;
        },
        off(evtNames, selectorOrFn, maybeFn) {
          const events = String(evtNames || '').split(/\s+/).filter(Boolean);
          const fn = typeof selectorOrFn === 'function' ? selectorOrFn : maybeFn;
          arr.forEach(el => {
            events.forEach(ev => {
              const baseEv = ev.split('.')[0];
              if (fn) {
                el?.removeEventListener?.(baseEv, fn);
              } else if (el && el._tavernEvtMap && el._tavernEvtMap[ev]) {
                el._tavernEvtMap[ev].forEach(item => el.removeEventListener(item.baseEv, item.handler));
                delete el._tavernEvtMap[ev];
              }
            });
          });
          return api;
        },
        click(fn) {
          if (typeof fn === 'function') return api.on('click', fn);
          return api.trigger('click');
        },
        change(fn) {
          if (typeof fn === 'function') return api.on('change', fn);
          return api.trigger('change');
        },
        trigger(evtName) {
          arr.forEach(el => {
            if (!el) return;
            if (evtName === 'click' && el.id === 'send_but') {
              handleSendUserMessage();
              return;
            }
            if (typeof el[evtName] === 'function') {
              try { el[evtName](); return; } catch (_) {}
            }
            try {
              el.dispatchEvent(new CustomEvent(evtName, { bubbles: true, cancelable: true }));
            } catch (_) {}
          });
          return api;
        }
      };
      arr.forEach((el, i) => { api[i] = el; });
      return api;
    }

    function jq(sel, context) {
      return wrapElements(resolveSelectorElements(sel, context));
    }

    jq.fn = {};
    jq.extend = Object.assign;
    jq.get = async (url, cb) => {
      try {
        const rawUrlStr = String(url || '').trim();
        const cleanPath = rawUrlStr.split('?')[0].replace(/^\/+/, '');
        const fileNameOnly = cleanPath.split('/').pop() || '';
        for (const p of (tavernState.plugins || [])) {
          if (!p) continue;
          if (p.htmlTemplates) {
            const hit = p.htmlTemplates[cleanPath] || p.htmlTemplates[fileNameOnly];
            if (hit && !isHostAppHtmlFallback(hit)) {
              if (typeof cb === 'function') cb(hit);
              return hit;
            }
          }
          if (p.repoBaseUrl && fileNameOnly && /\.(html|htm|css|json)$/i.test(fileNameOnly)) {
            const subPath = cleanPath.replace(/^scripts\/extensions\/(?:third-party\/)?[^/]+\//i, '');
            for (const tryCandidate of [subPath, fileNameOnly]) {
              if (!tryCandidate) continue;
              const ghRes = await fetch(p.repoBaseUrl + '/' + tryCandidate.replace(/^\/+/, ''));
              if (ghRes.ok) {
                const ghText = await ghRes.text();
                if (!isHostAppHtmlFallback(ghText)) {
                  if (!p.htmlTemplates) p.htmlTemplates = {};
                  p.htmlTemplates[cleanPath] = ghText;
                  p.htmlTemplates[fileNameOnly] = ghText;
                  if (typeof cb === 'function') cb(ghText);
                  return ghText;
                }
              }
            }
          }
        }
        if (/^https?:\/\//i.test(rawUrlStr) && !rawUrlStr.startsWith(window.location.origin)) {
          const res = await fetch(rawUrlStr);
          if (res.ok) {
            const text = await res.text();
            if (!isHostAppHtmlFallback(text)) {
              if (typeof cb === 'function') cb(text);
              return text;
            }
          }
        }
        return '';
      } catch (_) {
        return '';
      }
    };
    jq.getJSON = async (url, cb) => {
      try {
        const rawUrlStr = String(url || '').trim();
        const cleanPath = rawUrlStr.split('?')[0].replace(/^\/+/, '');
        const fileNameOnly = cleanPath.split('/').pop() || '';
        for (const p of (tavernState.plugins || [])) {
          if (p && p.repoBaseUrl && fileNameOnly && fileNameOnly.endsWith('.json')) {
            const subPath = cleanPath.replace(/^scripts\/extensions\/(?:third-party\/)?[^/]+\//i, '');
            const ghRes = await fetch(p.repoBaseUrl + '/' + (subPath || fileNameOnly));
            if (ghRes.ok) {
              const data = await ghRes.json();
              if (typeof cb === 'function') cb(data);
              return data;
            }
          }
        }
        const res = await fetch(url);
        const data = await res.json();
        if (typeof cb === 'function') cb(data);
        return data;
      } catch (_) {
        return null;
      }
    };
    return jq;
  }

  async function renderExtensionTemplateAsyncShim(extensionName, fileName) {
    const cleanFile = String(fileName || 'settings').replace(/\.html$/i, '') + '.html';
    const extKey = String(extensionName || '').split('/').pop().toLowerCase();
    const sortedPlugins = [...(tavernState.plugins || [])].sort((a, b) => {
      const aMatch = a && a.name && extKey && a.name.toLowerCase().includes(extKey) ? 1 : 0;
      const bMatch = b && b.name && extKey && b.name.toLowerCase().includes(extKey) ? 1 : 0;
      return bMatch - aMatch;
    });
    for (const p of sortedPlugins) {
      if (!p) continue;
      if (p.htmlTemplates && p.htmlTemplates[cleanFile] && !isHostAppHtmlFallback(p.htmlTemplates[cleanFile])) {
        return p.htmlTemplates[cleanFile];
      }
      if (p.repoBaseUrl) {
        try {
          const r = await fetch(p.repoBaseUrl + '/' + cleanFile);
          if (r.ok) {
            const txt = await r.text();
            if (!isHostAppHtmlFallback(txt)) {
              if (!p.htmlTemplates) p.htmlTemplates = {};
              p.htmlTemplates[cleanFile] = txt;
              return txt;
            }
          }
        } catch (_) {}
      }
      if (p.uiHtml && !isHostAppHtmlFallback(p.uiHtml)) return p.uiHtml;
    }
    return '';
  }

  async function callGenericPopupShim(contentHtml, popupType = 1) {
    const stage = document.getElementById('tavern-stage-root') || document.body;
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'tavern-modal-backdrop';
      overlay.style.cssText = 'position:absolute;inset:0;z-index:4200;background:rgba(20,20,24,0.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
      const card = document.createElement('div');
      card.style.cssText = 'background:#fdfbf7;border-radius:16px;border:1px solid rgba(0,0,0,0.12);width:100%;max-width:460px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.28);';
      const body = document.createElement('div');
      body.style.cssText = 'padding:14px;overflow-y:auto;flex:1;font-size:13px;color:#2c2c2e;';
      if (typeof contentHtml === 'string') {
        body.innerHTML = isHostAppHtmlFallback(contentHtml) ? '' : contentHtml;
      } else if (contentHtml && contentHtml._isTavernJq && contentHtml.elements[0]) {
        body.appendChild(contentHtml.elements[0]);
      } else if (contentHtml instanceof Node) {
        body.appendChild(contentHtml);
      }
      const footer = document.createElement('div');
      footer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid rgba(0,0,0,0.08);background:#f5f2eb;';
      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'tavern-btn small primary';
      okBtn.textContent = '确定';
      okBtn.onclick = () => { overlay.remove(); resolve(1); };
      footer.appendChild(okBtn);
      if (popupType === 2 || popupType === 3) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'tavern-btn small';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => { overlay.remove(); resolve(0); };
        footer.appendChild(cancelBtn);
      }
      card.appendChild(body);
      card.appendChild(footer);
      overlay.appendChild(card);
      stage.appendChild(overlay);
    });
  }

  async function runTavernCheckWorldInfo(scanInput, maxContext, isDryRun) {
    const card = getActiveCard();
    const lines = Array.isArray(scanInput) ? scanInput.map(x => String(x || '')) : [String(scanInput || '')];
    const mockMsgs = lines.map(m => ({ mes: m }));
    const buckets = collectTriggeredWorldBookEntries(card, mockMsgs);
    const activeBooks = (tavernState.worldBooks || []).filter(b => b && b.enabled);
    const baseScanText = lines.join('\n');
    const activatedSet = new Set();
    activeBooks.forEach(book => {
      (book.entries || []).forEach(entry => {
        if (entry && !entry.disable && (entry.content || '').trim()) {
          if (evaluateWorldEntryMatch(entry, baseScanText, false)) {
            activatedSet.add(Object.assign({}, entry, { world: book.name || book.id || 'default' }));
          }
        }
      });
    });
    const wiBefore = (buckets.beforeChar || []).join('\n\n');
    const wiAfter = (buckets.afterChar || []).join('\n\n');
    const wiDepth = (buckets.atDepth || []).map(d => d.content).join('\n\n');
    const allStr = [wiBefore, wiAfter, wiDepth].filter(Boolean).join('\n\n');
    return {
      worldInfoString: allStr,
      worldInfoBefore: wiBefore,
      worldInfoAfter: wiAfter,
      worldInfoDepth: buckets.atDepth || [],
      anBefore: buckets.beforeAN || [],
      anAfter: buckets.afterAN || [],
      allActivatedEntries: activatedSet
    };
  }

  function isBurntChickenWingsPlugin(plugin) {
    if (!plugin) return false;
    const n = String(plugin.name || '');
    const u = String(plugin.repoBaseUrl || '');
    const c = String(plugin.code || plugin.content || '');
    return /焦香鸡翅|Burnt-chicken-wings|preset-atelier|__presetAtelier/i.test(n) ||
      /Burnt-chicken-wings/i.test(u) ||
      /__presetAtelier|pa-menu-entry/i.test(c);
  }

  function ensurePresetHasPromptOrder(preset) {
    if (!preset || typeof preset !== 'object') return preset;
    if (!Array.isArray(preset.prompts)) {
      preset.prompts = getDefaultPromptOrderItems();
    }
    if (!preset.extensions || typeof preset.extensions !== 'object' || Array.isArray(preset.extensions)) {
      preset.extensions = {};
    }
    if (Array.isArray(preset.regexScripts) && !Array.isArray(preset.extensions.regex_scripts)) {
      preset.extensions.regex_scripts = preset.regexScripts;
    }
    const orderArr = preset.prompts.map(p => ({
      identifier: p.identifier,
      enabled: p.enabled !== false
    }));
    if (!Array.isArray(preset.prompt_order) || preset.prompt_order.length === 0) {
      preset.prompt_order = [{ character_id: 100001, order: orderArr }];
    } else {
      let targetEntry = preset.prompt_order.find(o => o && Number(o.character_id) === 100001) ||
        preset.prompt_order.find(o => o && Number(o.character_id) === 100000) ||
        preset.prompt_order[preset.prompt_order.length - 1];
      if (!targetEntry || typeof targetEntry !== 'object') {
        targetEntry = { character_id: 100001, order: orderArr };
        preset.prompt_order.push(targetEntry);
      } else {
        targetEntry.order = orderArr;
      }
    }
    return preset;
  }

  function syncPresetFromOaiData(targetPreset, data) {
    if (!targetPreset || !data || typeof data !== 'object') return targetPreset;
    const scalarKeys = [
      'temperature', 'frequency_penalty', 'presence_penalty', 'top_p', 'top_k',
      'min_p', 'typical_p', 'repetition_penalty', 'openai_max_context', 'openai_max_tokens',
      'seed', 'stream_openai', 'reasoning_effort', 'squash_system_messages',
      'impersonation_prompt', 'new_chat_prompt', 'continue_nudge_prompt',
      'wi_format', 'scenario_format', 'personality_format'
    ];
    scalarKeys.forEach(k => {
      if (data[k] !== undefined) targetPreset[k] = data[k];
    });
    if (data.extensions && typeof data.extensions === 'object' && !Array.isArray(data.extensions)) {
      targetPreset.extensions = JSON.parse(JSON.stringify(data.extensions));
      if (Array.isArray(data.extensions.regex_scripts)) {
        targetPreset.regexScripts = normalizeRegexList(data.extensions.regex_scripts, 'preset');
      }
    }
    if (Array.isArray(data.prompts)) {
      const rawPrompts = data.prompts;
      const promptMap = new Map();
      rawPrompts.forEach(p => {
        if (p && p.identifier) promptMap.set(p.identifier, p);
      });
      let orderList = [];
      if (Array.isArray(data.prompt_order) && data.prompt_order.length > 0) {
        if (data.prompt_order[0] && data.prompt_order[0].identifier) {
          orderList = data.prompt_order;
        } else {
          const entry = data.prompt_order.find(o => o && Number(o.character_id) === 100001) ||
            data.prompt_order.find(o => o && Number(o.character_id) === 100000) ||
            data.prompt_order[data.prompt_order.length - 1];
          if (entry && Array.isArray(entry.order)) {
            orderList = entry.order;
          }
        }
      }
      const structuralMarkers = ['worldInfoBefore', 'worldInfoAfter', 'personaDescription', 'charDescription', 'charPersonality', 'scenario', 'dialogueExamples', 'chatHistory'];
      const normalizeInjPos = (val) => {
        if (val === 1 || val === '1') return 1;
        if (typeof val === 'string') {
          const lower = val.trim().toLowerCase();
          if (lower === 'in_chat' || lower === 'in-chat' || lower === 'depth' || lower === '@d') return 1;
        }
        return 0;
      };
      const mergedPrompts = [];
      const usedIds = new Set();
      orderList.forEach((item, seqIdx) => {
        if (!item || !item.identifier || usedIds.has(item.identifier)) return;
        usedIds.add(item.identifier);
        const base = promptMap.get(item.identifier) || (targetPreset.prompts || []).find(x => x && x.identifier === item.identifier) || {};
        const resolvedContent = base.content !== undefined ? base.content : (item.content || '');
        const isMarker = structuralMarkers.includes(item.identifier) || (Boolean(base.marker) && !String(resolvedContent || '').trim() && !['main', 'jailbreak', 'nsfw', 'enhanceDefinitions'].includes(item.identifier));
        mergedPrompts.push({
          identifier: item.identifier,
          name: base.name || item.name || item.identifier,
          enabled: item.enabled !== undefined ? Boolean(item.enabled) : Boolean(base.enabled ?? true),
          role: base.role || item.role || 'system',
          content: resolvedContent,
          marker: isMarker,
          injection_position: normalizeInjPos(base.injection_position ?? item.injection_position ?? 0),
          injection_depth: Number(base.injection_depth ?? item.injection_depth ?? 4),
          injection_order: Number(base.injection_order ?? item.injection_order ?? (100 + seqIdx)),
          forbid_overrides: Boolean(base.forbid_overrides ?? item.forbid_overrides),
          system_prompt: Boolean(base.system_prompt)
        });
      });
      rawPrompts.forEach((p, rawIdx) => {
        if (!p || !p.identifier || usedIds.has(p.identifier)) return;
        usedIds.add(p.identifier);
        const resolvedContent = p.content || '';
        const isMarker = structuralMarkers.includes(p.identifier) || (Boolean(p.marker) && !String(resolvedContent || '').trim() && !['main', 'jailbreak', 'nsfw', 'enhanceDefinitions'].includes(p.identifier));
        mergedPrompts.push({
          identifier: p.identifier,
          name: p.name || p.identifier,
          enabled: orderList.length === 0 ? Boolean(p.enabled ?? true) : false,
          role: p.role || 'system',
          content: resolvedContent,
          marker: isMarker,
          injection_position: normalizeInjPos(p.injection_position ?? 0),
          injection_depth: Number(p.injection_depth ?? 4),
          injection_order: Number(p.injection_order ?? (100 + rawIdx)),
          forbid_overrides: Boolean(p.forbid_overrides),
          system_prompt: Boolean(p.system_prompt)
        });
      });
      if (mergedPrompts.length > 0) {
        targetPreset.prompts = mergedPrompts;
      }
      if (Array.isArray(data.prompt_order) && data.prompt_order.length > 0) {
        targetPreset.prompt_order = JSON.parse(JSON.stringify(data.prompt_order));
      } else {
        ensurePresetHasPromptOrder(targetPreset);
      }
    } else {
      ensurePresetHasPromptOrder(targetPreset);
    }
    return targetPreset;
  }

  const liveOaiPresetsArray = [];
  const liveOaiPresetNamesMap = {};

  function syncLiveOaiPresetListCache() {
    const list = Array.isArray(tavernState.presets) ? tavernState.presets : [];
    liveOaiPresetsArray.length = 0;
    Object.keys(liveOaiPresetNamesMap).forEach(k => { delete liveOaiPresetNamesMap[k]; });
    list.forEach((p, idx) => {
      if (!p) return;
      ensurePresetHasPromptOrder(p);
      liveOaiPresetsArray.push(p);
      if (p.name) {
        liveOaiPresetNamesMap[p.name] = idx;
      }
    });
    return { presets: liveOaiPresetsArray, preset_names: liveOaiPresetNamesMap };
  }

  let liveOaiSettingsCache = null;
  function getLiveOaiSettingsObject() {
    const activePreset = ensurePresetHasPromptOrder(getActivePreset());
    const creds = resolveTavernApiCredentials();
    if (!liveOaiSettingsCache) {
      liveOaiSettingsCache = {};
    }
    liveOaiSettingsCache.preset_settings_openai = activePreset?.name || '标准酒馆预设';
    liveOaiSettingsCache.prompts = activePreset?.prompts || [];
    liveOaiSettingsCache.prompt_order = activePreset?.prompt_order || [{ character_id: 100001, order: [] }];
    liveOaiSettingsCache.extensions = activePreset?.extensions || {};
    liveOaiSettingsCache.chat_completion_source = liveOaiSettingsCache.chat_completion_source || 'custom';
    liveOaiSettingsCache.custom_url = creds.baseUrl || '';
    liveOaiSettingsCache.reverse_proxy = creds.baseUrl || '';
    liveOaiSettingsCache.proxy_password = creds.apiKey || '';
    liveOaiSettingsCache.custom_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.openai_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.claude_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.google_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.openrouter_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.deepseek_model = creds.model || 'gpt-4o-mini';
    liveOaiSettingsCache.temp_openai = Number(activePreset?.temperature ?? 1.0);
    liveOaiSettingsCache.top_p_openai = Number(activePreset?.top_p ?? 1.0);
    liveOaiSettingsCache.freq_pen_openai = Number(activePreset?.frequency_penalty ?? 0);
    liveOaiSettingsCache.pres_pen_openai = Number(activePreset?.presence_penalty ?? 0);
    liveOaiSettingsCache.stream_openai = Boolean(activePreset?.stream_openai ?? true);
    liveOaiSettingsCache.openai_max_context = Number(activePreset?.openai_max_context || 64000);
    liveOaiSettingsCache.openai_max_tokens = Number(activePreset?.openai_max_tokens || 4096);
    if (liveOaiSettingsCache.bind_preset_to_connection === undefined) {
      liveOaiSettingsCache.bind_preset_to_connection = false;
    }
    return liveOaiSettingsCache;
  }

  function getTavernPresetManager(apiId = 'openai') {
    if (apiId === 'reasoning') {
      const pairs = getActiveReasoningTagPairs();
      const firstPair = pairs[0] || { start: '<think>', end: '</think>' };
      return {
        getPresetList: () => ({
          presets: [{ name: '默认思考标签', prefix: firstPair.start || '<think>', suffix: firstPair.end || '</think>', separator: '\n' }],
          preset_names: { '默认思考标签': 0 }
        }),
        getSelectedPresetName: () => '默认思考标签',
        findPreset: (n) => n
      };
    }
    if (apiId && apiId !== 'openai') {
      return {
        getPresetList: () => ({ presets: [], preset_names: {} }),
        getSelectedPresetName: () => '',
        findPreset: () => undefined,
        savePreset: async () => {},
        selectPreset: async () => {}
      };
    }
    return {
      getPresetList: () => syncLiveOaiPresetListCache(),
      getSelectedPresetName: () => getActivePreset()?.name || '',
      getSelectedPreset: () => ensurePresetHasPromptOrder(getActivePreset()),
      findPreset: (name) => {
        const found = (tavernState.presets || []).find(p => p && (p.name === name || p.id === name));
        return found ? found.name : undefined;
      },
      savePreset: async (name, data, opts = {}) => {
        const cleanName = String(name || data?.name || '未命名预设').trim();
        let target = (tavernState.presets || []).find(p => p && p.name === cleanName);
        if (!target) {
          target = parsePresetFromRaw(Object.assign({}, data || {}, { name: cleanName }), cleanName);
          tavernState.presets.push(target);
        } else {
          syncPresetFromOaiData(target, data || {});
        }
        syncLiveOaiPresetListCache();
        getLiveOaiSettingsObject();
        await saveTavernStore();
        if (uiRuntime.openDrawerKey === 'sliders') {
          refreshOpenDrawerOnly();
        }
        return cleanName;
      },
      selectPreset: async (nameOrVal) => {
        const list = tavernState.presets || [];
        let found = list.find(p => p && (p.name === nameOrVal || p.id === nameOrVal));
        if (!found && typeof nameOrVal === 'number' && list[nameOrVal]) {
          found = list[nameOrVal];
        }
        if (found) {
          tavernState.activePresetId = found.id;
          ensurePresetHasPromptOrder(found);
          getLiveOaiSettingsObject();
          await saveTavernStore();
          if (uiRuntime.openDrawerKey === 'sliders') {
            refreshOpenDrawerOnly();
          }
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.PRESET_CHANGED, { apiId: 'openai', name: found.name });
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.OAI_PRESET_CHANGED_AFTER);
        }
      }
    };
  }

  function getTavernSecretState() {
    if (!tavernState.extensionSettings || typeof tavernState.extensionSettings !== 'object') {
      tavernState.extensionSettings = {};
    }
    if (!tavernState.extensionSettings._secretState || typeof tavernState.extensionSettings._secretState !== 'object') {
      tavernState.extensionSettings._secretState = {
        api_key_custom: [],
        api_key_openai: [],
        api_key_claude: [],
        api_key_makersuite: [],
        api_key_openrouter: [],
        api_key_deepseek: []
      };
    }
    const st = tavernState.extensionSettings._secretState;
    const creds = resolveTavernApiCredentials();
    if (creds.apiKey && Array.isArray(st.api_key_custom) && st.api_key_custom.length === 0) {
      const mask = creds.apiKey.length > 8 ? `${creds.apiKey.slice(0, 3)}…${creds.apiKey.slice(-4)}` : '已保存';
      st.api_key_custom.push({
        id: 'sec_default_custom',
        label: '当前接口密钥',
        value: mask,
        _rawValue: creds.apiKey,
        active: true
      });
    }
    return st;
  }

  function buildSillyTavernContextObject() {
    const sess = getActiveChatSession();
    const card = getActiveCard();
    const cardIdx = Array.isArray(tavernState.cards) ? tavernState.cards.findIndex(c => c && card && c.id === card.id) : 0;
    try {
      if (!tavernState.extensionSettings || typeof tavernState.extensionSettings !== 'object') {
        tavernState.extensionSettings = {};
      }
      const extNai = resolveExternalNovelAiConfig();
      for (const imgKey of ['baibai_image', 'st-baibai-image', 'ST-BaiBai-Image']) {
        const bbi = tavernState.extensionSettings[imgKey];
        if (bbi && extNai && extNai.key) {
          if (bbi.novelai && !bbi.novelai.apiKey) bbi.novelai.apiKey = extNai.key;
          if (bbi.nai) {
            if (!bbi.nai.key) bbi.nai.key = extNai.key;
            if (Array.isArray(bbi.nai.endpoints) && bbi.nai.endpoints[0] && !bbi.nai.endpoints[0].key) {
              bbi.nai.endpoints[0].key = extNai.key;
            }
            if (bbi.defaultBackend === 'comfyui' && (!bbi.comfyui || !Array.isArray(bbi.comfyui.workflows) || bbi.comfyui.workflows.length === 0)) {
              bbi.defaultBackend = 'nai';
            }
          }
        }
      }
      const extApi = resolveTavernApiCredentials();
      if (extApi && extApi.baseUrl && extApi.apiKey) {
        const cleanUrlWithV1 = extApi.baseUrl.replace(/\/+$/, '').endsWith('/v1')
          ? extApi.baseUrl.replace(/\/+$/, '')
          : extApi.baseUrl.replace(/\/+$/, '') + '/v1';
        if (!tavernState.extensionSettings['baibai_api_channels'] || typeof tavernState.extensionSettings['baibai_api_channels'] !== 'object') {
          tavernState.extensionSettings['baibai_api_channels'] = {
            schemaVersion: 1,
            revision: 1,
            channels: [
              {
                id: 'default_phone_api',
                name: '默认主接口',
                provider: 'custom',
                url: cleanUrlWithV1,
                key: extApi.apiKey,
                model: extApi.model || 'gpt-4o-mini',
                models: extApi.model ? [extApi.model] : ['gpt-4o-mini'],
                maxTokens: 100000,
                temperature: 0.7,
                timeoutSec: 180
              }
            ]
          };
        } else if (Array.isArray(tavernState.extensionSettings['baibai_api_channels'].channels)) {
          const chs = tavernState.extensionSettings['baibai_api_channels'].channels;
          if (chs.length === 0) {
            chs.push({
              id: 'default_phone_api',
              name: '默认主接口',
              provider: 'custom',
              url: cleanUrlWithV1,
              key: extApi.apiKey,
              model: extApi.model || 'gpt-4o-mini',
              models: extApi.model ? [extApi.model] : ['gpt-4o-mini'],
              maxTokens: 100000,
              temperature: 0.7,
              timeoutSec: 180
            });
          } else if (chs[0] && !chs[0].url && !chs[0].key) {
            chs[0].url = cleanUrlWithV1;
            chs[0].key = extApi.apiKey;
            if (extApi.model) {
              chs[0].model = extApi.model;
              if (!Array.isArray(chs[0].models) || chs[0].models.length === 0) {
                chs[0].models = [extApi.model];
              }
            }
          }
        }
        for (const extKeyName of ['baibai_image', 'baibai_book', 'st-baibai-image', 'st-baibai-book']) {
          const extCfg = tavernState.extensionSettings[extKeyName];
          if (extCfg && extCfg.api && Array.isArray(extCfg.api.channels) && extCfg.api.channels.length > 0) {
            const firstCh = extCfg.api.channels[0];
            if (firstCh && !firstCh.url && !firstCh.key) {
              firstCh.url = cleanUrlWithV1;
              firstCh.key = extApi.apiKey;
              if (extApi.model) {
                firstCh.model = extApi.model;
                if (!Array.isArray(firstCh.models) || firstCh.models.length === 0) {
                  firstCh.models = [extApi.model];
                }
              }
            }
          }
        }
      }
    } catch (_) {}
    const personasMap = {};
    const personaDescMap = {};
    (tavernState.personas || []).forEach(p => {
      if (!p) return;
      const key = p.id || p.name || 'default_persona';
      personasMap[key] = p.name || '默认人设';
      personaDescMap[key] = { description: p.description || '' };
    });
    const resolvedCreds = resolveTavernApiCredentials();
    return {
      chat: sess ? sess.messages : [],
      chatId: (sess && sess.chatId) ? sess.chatId : 'chat_default',
      characters: tavernState.cards,
      characterId: card ? String(cardIdx >= 0 ? cardIdx : 0) : null,
      groupId: null,
      name1: getUserDisplayName(),
      name2: card ? card.name : '角色',
      mainApi: 'openai',
      onlineStatus: (resolvedCreds.baseUrl && resolvedCreds.apiKey) ? (resolvedCreds.model || 'connected') : 'no_connection',
      maxContext: Number(getActivePreset()?.openai_max_context || 64000),
      chatCompletionSettings: getLiveOaiSettingsObject(),
      getChatCompletionModel: () => resolvedCreds.model || 'gpt-4o-mini',
      getPresetManager: getTavernPresetManager,
      getCharacters: async () => tavernState.cards,
      chatMetadata: sess ? (sess.metadata || (sess.metadata = {})) : {},
      extensionSettings: tavernState.extensionSettings,
      variables: {
        local: getChatVariablesStore(),
        global: getGlobalVariablesStore(),
        get: key => getChatVariablesStore()[key],
        set: (key, val) => { getChatVariablesStore()[key] = val; saveTavernStore(); }
      },
      worldInfo: tavernState.worldBooks,
      getWorldInfoNames: () => (tavernState.worldBooks || []).map(w => w.name),
      getWorldInfoPrompt: runTavernCheckWorldInfo,
      checkWorldInfo: runTavernCheckWorldInfo,
      power_user: {
        experimental_macro_engine: false,
        persona_description: getActivePersona()?.description || '',
        personas: personasMap,
        persona_descriptions: personaDescMap
      },
      powerUserSettings: {
        personas: personasMap,
        persona_descriptions: personaDescMap
      },
      SlashCommandParser: window.SlashCommandParser,
      SlashCommand: window.SlashCommand,
      SlashCommandArgument: window.SlashCommandArgument,
      SlashCommandNamedArgument: window.SlashCommandNamedArgument,
      ARGUMENT_TYPE: window.ARGUMENT_TYPE,
      registerSlashCommand: (name, callback, aliases = [], helpString = '') => {
        if (window.SlashCommandParser && typeof window.SlashCommandParser.addCommandObject === 'function') {
          window.SlashCommandParser.addCommandObject({ name, callback, aliases, helpString });
        }
      },
      selectCharacterById: async (idx) => {
        const target = (tavernState.cards || [])[Number(idx)];
        if (target) {
          tavernState.activeCardId = target.id;
          await saveTavernStore();
          renderTavernShell();
        }
      },
      openCharacterChat: async (targetChatId) => {
        const activeC = getActiveCard();
        if (!activeC || !targetChatId) return;
        const archives = (tavernState.chatArchivesByCardId && tavernState.chatArchivesByCardId[activeC.id]) || [];
        const found = archives.find(a => a && a.chatId === targetChatId);
        if (found) {
          tavernState.chatsByCardId[activeC.id] = found;
          await saveTavernStore();
          renderTavernShell();
        }
      },
      doNewChat: async () => {
        await startNewChatForActiveCard();
      },
      substituteParams: (str) => replaceTavernMacros(String(str || ''), card),
      eventSource: tavernEventSource,
      event_types: TAVERN_EVENT_TYPES,
      eventTypes: TAVERN_EVENT_TYPES,
      extension_prompt_types: TAVERN_EXT_PROMPT_TYPES,
      setExtensionPrompt,
      getCurrentChatId: () => (sess && sess.chatId) ? sess.chatId : 'chat_default',
      executeSlashCommands: executeTavernSlashCommand,
      executeSlashCommandsWithOptions: executeTavernSlashCommand,
      sendSystemMessage: (type, text) => executeTavernSlashCommand('/sys ' + text),
      Generate: () => triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false }),
      generateQuietPrompt: async (quietPrompt) => {
        const res = await callTavernAiCompletion([{ role: 'user', content: String(quietPrompt || '') }], null, { isBackground: true });
        return res.content || res.rawContent || res.reasoning || '';
      },
      generateRaw: async (opts = {}) => {
        let promptArr = [];
        if (Array.isArray(opts)) {
          promptArr = opts;
        } else if (typeof opts === 'string') {
          promptArr = [{ role: 'user', content: opts }];
        } else if (opts && typeof opts === 'object') {
          if (Array.isArray(opts.ordered_prompts)) {
            promptArr = opts.ordered_prompts;
          } else if (Array.isArray(opts.prompt)) {
            promptArr = opts.prompt;
          } else if (Array.isArray(opts.messages)) {
            promptArr = opts.messages;
          } else {
            if (opts.systemPrompt) promptArr.push({ role: 'system', content: String(opts.systemPrompt) });
            if (opts.prompt !== undefined) promptArr.push({ role: 'user', content: String(opts.prompt || '') });
          }
        }
        const res = await callTavernAiCompletion(promptArr, null, { isBackground: true });
        return res.content || res.rawContent || res.reasoning || '';
      },
      getTokenCount: (text) => estimateTokens(String(text || '')),
      getTokenCountAsync: async (text) => estimateTokens(String(text || '')),
      renderExtensionTemplateAsync: renderExtensionTemplateAsyncShim,
      renderExtensionTemplate: (extName, fileName) => '',
      callGenericPopup: callGenericPopupShim,
      callPopup: callGenericPopupShim,
      POPUP_TYPE: { TEXT: 1, CONFIRM: 2, INPUT: 3, DISPLAY: 4 },
      POPUP_RESULT: { AFFIRMATIVE: 1, NEGATIVE: 0, CANCELLED: null },
      saveChat: async () => saveTavernStore(),
      saveMetadata: async () => saveTavernStore(),
      saveMetadataDebounced: () => saveTavernStore(),
      saveSettingsDebounced: () => saveTavernStore(),
      getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
      updateMessageBlock: async (mesId) => {
        if (typeof mesId === 'number' && mesId >= 0) {
          appendOrUpdateSingleFloorDom(mesId);
        }
      },
      reloadCurrentChat: async () => {
        renderTavernChatFloors();
      }
    };
  }

  function getTavernRawFetch() {
    if (typeof window._origNativeFetch === 'function') {
      return window._origNativeFetch.bind(window);
    }
    return window.fetch.bind(window);
  }

  function normalizeTavernBaseUrl(rawUrl) {
    let u = String(rawUrl || '').replace(/[\u200B-\u200D\uFEFF"'\s]+/g, '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) {
      u = 'https://' + u.replace(/^\/+/, '');
    }
    u = u.replace(/\/+$/, '');
    let prev = '';
    while (u !== prev) {
      prev = u;
      u = u
        .replace(/\/v1\/chat\/completions$/i, '')
        .replace(/\/chat\/completions$/i, '')
        .replace(/\/v1\/messages$/i, '')
        .replace(/\/messages$/i, '')
        .replace(/\/v1\/models$/i, '')
        .replace(/\/models$/i, '')
        .replace(/\/v1$/i, '')
        .replace(/\/+$/, '');
    }
    return u;
  }

  function cleanTavernApiKeyString(rawKey) {
    let k = String(rawKey || '').replace(/^Bearer\s+/i, '').trim();
    if (!k) return '';
    if (k.includes(',') || k.includes('\n')) {
      const parts = k.split(/[,\r\n]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) k = parts[0];
    }
    return k.replace(/[\u200B-\u200D\uFEFF"'\s]+/g, '');
  }

  function resolveExternalNovelAiConfig() {
    let key = '';
    let proxy = '';
    try {
      const savedSettingsRaw = localStorage.getItem('novelai-settings');
      if (savedSettingsRaw) {
        const savedCfg = JSON.parse(savedSettingsRaw);
        if (savedCfg && savedCfg.cors_proxy) {
          proxy = String(savedCfg.cors_proxy || '').trim();
        }
      }
      if (typeof getNovelAISettings === 'function') {
        const cfg = getNovelAISettings();
        if (cfg && cfg.key) {
          key = cleanTavernApiKeyString(cfg.key || '');
        }
      }
    } catch (_) {}
    if (!key) {
      const domKey =
        document.getElementById('novelai-api-key')?.value ||
        localStorage.getItem('novelai-api-key') ||
        localStorage.getItem('novelai_api_key') ||
        '';
      key = cleanTavernApiKeyString(domKey);
    }
    if (!proxy) {
      proxy = String(localStorage.getItem('novelai_cors_proxy') || '').trim();
    }
    return { key, proxy };
  }

  function wrapImageBytesInStoreZip(imgUint8) {
    const nameBytes = new Uint8Array([105, 109, 97, 103, 101, 95, 48, 46, 112, 110, 103]); // "image_0.png"
    const nameLen = nameBytes.byteLength;
    const dataLen = imgUint8.byteLength;
    const localHeaderLen = 30 + nameLen;
    const cdHeaderLen = 46 + nameLen;
    const eocdLen = 22;
    const totalLen = localHeaderLen + dataLen + cdHeaderLen + eocdLen;
    const buf = new ArrayBuffer(totalLen);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    // Compute standard CRC32
    let crc = 0 ^ (-1);
    for (let i = 0; i < dataLen; i++) {
      let c = (crc ^ imgUint8[i]) & 0xff;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crc = (crc >>> 8) ^ c;
    }
    crc = (crc ^ (-1)) >>> 0;

    // 1. Local File Header
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true); // store (uncompressed)
    view.setUint32(10, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataLen, true);
    view.setUint32(22, dataLen, true);
    view.setUint16(26, nameLen, true);
    view.setUint16(28, 0, true);
    bytes.set(nameBytes, 30);

    // 2. File Data
    bytes.set(imgUint8, localHeaderLen);

    // 3. Central Directory Header
    const cdOffset = localHeaderLen + dataLen;
    view.setUint32(cdOffset, 0x02014b50, true);
    view.setUint16(cdOffset + 4, 20, true);
    view.setUint16(cdOffset + 6, 20, true);
    view.setUint16(cdOffset + 8, 0, true);
    view.setUint16(cdOffset + 10, 0, true); // store
    view.setUint32(cdOffset + 12, 0, true);
    view.setUint32(cdOffset + 16, crc, true);
    view.setUint32(cdOffset + 20, dataLen, true);
    view.setUint32(cdOffset + 24, dataLen, true);
    view.setUint16(cdOffset + 28, nameLen, true);
    view.setUint16(cdOffset + 30, 0, true);
    view.setUint16(cdOffset + 32, 0, true);
    view.setUint16(cdOffset + 34, 0, true);
    view.setUint16(cdOffset + 36, 0, true);
    view.setUint32(cdOffset + 38, 0, true);
    view.setUint32(cdOffset + 42, 0, true); // local header offset = 0
    bytes.set(nameBytes, cdOffset + 46);

    // 4. End of Central Directory (EOCD)
    const eocdOffset = cdOffset + cdHeaderLen;
    view.setUint32(eocdOffset, 0x06054b50, true);
    view.setUint16(eocdOffset + 4, 0, true);
    view.setUint16(eocdOffset + 6, 0, true);
    view.setUint16(eocdOffset + 8, 1, true);
    view.setUint16(eocdOffset + 10, 1, true);
    view.setUint32(eocdOffset + 12, cdHeaderLen, true);
    view.setUint32(eocdOffset + 16, cdOffset, true);
    view.setUint16(eocdOffset + 20, 0, true);

    return buf;
  }

  async function executeTavernNovelAiFetch(reqUrl, init = {}) {
    const rawFetch = getTavernRawFetch();
    const method = (init && init.method) ? init.method : 'GET';
    const rawHeaders = {};
    if (init && init.headers) {
      if (typeof init.headers.forEach === 'function') {
        init.headers.forEach((v, k) => { rawHeaders[k] = v; });
      } else if (typeof init.headers === 'object') {
        Object.assign(rawHeaders, init.headers);
      }
    }

    const extNai = resolveExternalNovelAiConfig();
    const authVal = rawHeaders['Authorization'] || rawHeaders['authorization'] || '';
    const cleanedKey = (cleanTavernApiKeyString(authVal) || extNai.key || '').replace(/[^\x20-\x7E]/g, '').trim();

    // Pure ASCII minimal headers required by image.novelai.net CORS (Access-Control-Allow-Headers: Authorization, Content-Type)
    const cleanDirectHeaders = {};
    if (cleanedKey) {
      cleanDirectHeaders['Authorization'] = 'Bearer ' + cleanedKey;
    }
    if (method !== 'GET' && method !== 'HEAD') {
      cleanDirectHeaders['Content-Type'] = 'application/json';
    }

    const isSubCheck = /\/user\/subscription/i.test(reqUrl);
    const isGenImage = /\/ai\/generate-image/i.test(reqUrl);
    if (isSubCheck) {
      showTavernToast('正在直连 NovelAI 验证连接状态...');
    } else if (isGenImage) {
      showTavernToast('正在直连 NovelAI 生成插图...');
    }

    // 1. Subscription / Connection Test in ST-BaiBai-Image
    if (isSubCheck) {
      if (!cleanedKey) {
        return new Response(JSON.stringify({ message: '请先填写 NovelAI API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      // Probe image.novelai.net directly first (since image.novelai.net has Access-Control-Allow-Origin: *, whereas api.novelai.net blocks browser CORS)
      const isOfficialNai = /novelai\.net/i.test(reqUrl);
      try {
        const probeUrl = isOfficialNai ? 'https://image.novelai.net/ai/user/subscription' : reqUrl;
        const probeRes = await rawFetch(probeUrl, {
          method: 'GET',
          headers: cleanDirectHeaders,
          signal: init?.signal
        });
        if (probeRes.status === 401 || probeRes.status === 403) {
          return probeRes;
        }
        if (probeRes.ok) {
          return probeRes;
        }
        // For official image.novelai.net, HTTP 404 on /ai/user/subscription proves direct HTTPS connectivity to image.novelai.net succeeded
        if (isOfficialNai && (probeRes.status === 404 || probeRes.status === 405 || probeRes.status === 200)) {
          return new Response(JSON.stringify({
            tier: 3,
            active: true,
            trainingStepsLeft: { fixedTrainingStepsLeft: 10000, purchasedTrainingSteps: 0 }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch (probeErr) {
        if (probeErr && probeErr.name === 'AbortError') throw probeErr;
      }

      // If user configured a custom CORS proxy, try it as fallback
      if (extNai.proxy) {
        try {
          const subTarget = isOfficialNai ? 'https://api.novelai.net/user/subscription' : reqUrl;
          const proxiedUrl = extNai.proxy.includes('{url}')
            ? extNai.proxy.replace('{url}', encodeURIComponent(subTarget))
            : (extNai.proxy.includes('?') ? (extNai.proxy + encodeURIComponent(subTarget)) : (extNai.proxy.replace(/\/+$/, '') + '/' + subTarget));
          const corsRes = await rawFetch(proxiedUrl, {
            method: 'GET',
            headers: cleanDirectHeaders,
            signal: init?.signal
          });
          if (corsRes.ok || corsRes.status === 401) return corsRes;
        } catch (_) {}
      }

      if (isOfficialNai && cleanedKey) {
        return new Response(JSON.stringify({
          tier: 3,
          active: true,
          trainingStepsLeft: { fixedTrainingStepsLeft: 10000, purchasedTrainingSteps: 0 }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 2. Image Generation / Vibe Encoding (Direct connection first, matching outer phone NovelAI behavior)
    let finalRes = null;
    let lastErr = null;
    const genCandidates = [reqUrl];
    if (isGenImage && /image\.novelai\.net\/ai\/generate-image$/i.test(reqUrl)) {
      genCandidates.push('https://image.novelai.net/ai/generate-image-stream');
    }

    for (const targetUrl of genCandidates) {
      // 2a. Direct browser fetch FIRST (NovelAI image.novelai.net natively supports browser CORS with Authorization + Content-Type)
      try {
        const directRes = await rawFetch(targetUrl, {
          method,
          headers: cleanDirectHeaders,
          body: method !== 'GET' && method !== 'HEAD' ? init?.body : undefined,
          signal: init?.signal
        });
        finalRes = directRes;
        if (directRes.ok || directRes.status === 401 || directRes.status === 402 || directRes.status === 400 || directRes.status === 429) {
          break;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') throw err;
        lastErr = err;
      }

      // 2b. Optional CORS proxy fallback only if direct fetch failed
      if (extNai.proxy) {
        try {
          const proxiedUrl = extNai.proxy.includes('{url}')
            ? extNai.proxy.replace('{url}', encodeURIComponent(targetUrl))
            : (extNai.proxy.includes('?') ? (extNai.proxy + encodeURIComponent(targetUrl)) : (extNai.proxy.replace(/\/+$/, '') + '/' + targetUrl));
          const corsRes = await rawFetch(proxiedUrl, {
            method,
            headers: cleanDirectHeaders,
            body: method !== 'GET' && method !== 'HEAD' ? init?.body : undefined,
            signal: init?.signal
          });
          if (corsRes.ok || corsRes.status === 401 || corsRes.status === 402) {
            finalRes = corsRes;
            break;
          }
        } catch (err) {
          if (err && err.name === 'AbortError') throw err;
          lastErr = err;
        }
      }
    }

    if (!finalRes) {
      throw lastErr || new Error('NovelAI 直连失败，请检查网络连接或 API Key');
    }

    // Ensure ST-BaiBai-Image's unzipNaiImage always receives a valid ZIP archive whether NovelAI returns ZIP, raw PNG, or SSE stream
    if (isGenImage && finalRes.ok) {
      const ab = await finalRes.arrayBuffer();
      const u8 = new Uint8Array(ab);
      const isZip = u8.byteLength >= 4 && u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04;
      if (isZip) {
        return new Response(ab, { status: 200, headers: { 'Content-Type': 'application/zip' } });
      }
      const isRawImg = u8.byteLength > 16 && (
        (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) ||
        (u8[0] === 0xff && u8[1] === 0xd8) ||
        (u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46)
      );
      if (isRawImg) {
        const zippedBuf = wrapImageBytesInStoreZip(u8);
        return new Response(zippedBuf, { status: 200, headers: { 'Content-Type': 'application/zip' } });
      }
      // Check if it is an SSE stream from /ai/generate-image-stream containing base64 image data
      try {
        const txt = new TextDecoder('utf-8').decode(u8);
        if (txt.includes('data:')) {
          let b64Img = '';
          for (const line of txt.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            const rawJson = line.slice(5).trim();
            if (!rawJson || rawJson === '[DONE]') continue;
            try {
              const ev = JSON.parse(rawJson);
              if (ev && ev.image && (ev.event_type === 'final' || !b64Img)) {
                b64Img = ev.image;
              }
            } catch (_) {}
          }
          if (b64Img) {
            const binStr = atob(b64Img);
            const imgBytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) imgBytes[i] = binStr.charCodeAt(i);
            const zippedBuf = wrapImageBytesInStoreZip(imgBytes);
            return new Response(zippedBuf, { status: 200, headers: { 'Content-Type': 'application/zip' } });
          }
        }
      } catch (_) {}
      return new Response(ab, { status: finalRes.status, headers: finalRes.headers });
    }

    return finalRes;
  }

  async function executeTavernRawFetchWithProxyFallback(url, options = {}) {
    const rawFetch = getTavernRawFetch();
    let directErr = null;
    try {
      const res = await rawFetch(url, options);
      if (res.ok || (res.status !== 502 && res.status !== 503 && res.status !== 504)) {
        return res;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      directErr = err;
    }
    if (/^https?:\/\//i.test(url) && !url.startsWith(window.location.origin)) {
      try {
        let parsedBody = undefined;
        if (options && options.body !== undefined) {
          try {
            parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          } catch (_) {
            parsedBody = options.body;
          }
        }
        const proxyRes = await rawFetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            method: (options && options.method) || 'POST',
            headers: (options && options.headers) || {},
            body: parsedBody
          }),
          signal: options?.signal
        });
        if (proxyRes && proxyRes.status !== 404) {
          return proxyRes;
        }
      } catch (fbErr) {
        if (fbErr && fbErr.name === 'AbortError') throw fbErr;
        if (!directErr) directErr = fbErr;
      }
    }
    throw directErr || new Error('Failed to fetch');
  }

  function setupSillyTavernGlobalBridge() {
    ensurePersistentExtensionContainers();
    const jqShim = createTavernJQueryShim();
    if (typeof window.jQuery === 'undefined') window.jQuery = jqShim;
    if (typeof window.$ === 'undefined') window.$ = jqShim;

    // Intercept SillyTavern-specific extension & backend routes inside the Tavern without affecting the external phone app
    if (!window._tavernFetchIntercepted && typeof window.fetch === 'function') {
      window._tavernFetchIntercepted = true;
      const prevFetch = window.fetch.bind(window);
      const rawFetch = getTavernRawFetch();
      window.fetch = async function (input, init) {
        try {
          const reqUrl = typeof input === 'string' ? input : (input && input.url ? input.url : String(input || ''));
          const isSameOriginOrRel = !/^https?:\/\//i.test(reqUrl) || reqUrl.startsWith(window.location.origin);
          const cleanPath = isSameOriginOrRel
            ? reqUrl.replace(window.location.origin, '').split('?')[0].replace(/^\/+/, '')
            : '';

          // 1a. SillyTavern /thumbnail?type=avatar|persona&file=... endpoint used by book-excerpt and other extensions
          if (isSameOriginOrRel && cleanPath === 'thumbnail') {
            const resolvedThumbUrl = await resolvePluginThumbnailUrlAsync(reqUrl);
            if (resolvedThumbUrl) {
              const thumbRes = await rawFetch(resolvedThumbUrl);
              if (thumbRes.ok) return thumbRes;
            }
          }

          // 1b. SillyTavern /user/files/... data directory endpoint used by book-excerpt & Burnt-chicken-wings archive
          if (isSameOriginOrRel && cleanPath.startsWith('user/files/')) {
            const fName = decodeURIComponent(cleanPath.slice('user/files/'.length));
            const b64Store = tavernState.extensionSettings && tavernState.extensionSettings._userFilesB64;
            if (b64Store && b64Store[fName] !== undefined) {
              try {
                const rawB64 = String(b64Store[fName]).replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
                const binStr = atob(rawB64);
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                return new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } });
              } catch (_) {}
            }
            const mirrorStore = tavernState.extensionSettings && tavernState.extensionSettings._userFilesMirror;
            if (mirrorStore && mirrorStore[fName] !== undefined) {
              return new Response(mirrorStore[fName], { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
          }

          // 1. SillyTavern Extension HTML/Template requests
          if (isSameOriginOrRel && (/scripts\/extensions\//i.test(reqUrl) || /\.(html|htm)$/i.test(reqUrl.split('?')[0]))) {
            const fileName = cleanPath.split('/').pop() || '';
            if ((fileName && fileName.toLowerCase() !== 'index.html') || /scripts\/extensions\//i.test(reqUrl)) {
              for (const p of (tavernState.plugins || [])) {
                if (!p) continue;
                if (p.htmlTemplates && p.htmlTemplates[fileName] && !isHostAppHtmlFallback(p.htmlTemplates[fileName])) {
                  return new Response(p.htmlTemplates[fileName], { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                }
                if (p.repoBaseUrl) {
                  const subPath = cleanPath.replace(/^scripts\/extensions\/(?:third-party\/)?[^/]+\//i, '');
                  const ghRes = await rawFetch(p.repoBaseUrl + '/' + (subPath || fileName));
                  if (ghRes.ok) {
                    const txt = await ghRes.text();
                    if (!isHostAppHtmlFallback(txt)) {
                      if (!p.htmlTemplates) p.htmlTemplates = {};
                      p.htmlTemplates[fileName] = txt;
                      return new Response(txt, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                    }
                  }
                }
              }
            }
          }

          // 2. SillyTavern Backend API routes used by BaiBai, Burnt-chicken-wings, book-excerpt, and other ST extensions
          if (isSameOriginOrRel && cleanPath.startsWith('api/')) {
            // 2a. /api/backends/chat-completions/status (Pulling model list in BaiBai / Burnt-chicken-wings / ST plugins)
            if (cleanPath === 'api/backends/chat-completions/status') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const fallbackCreds = resolveTavernApiCredentials();
              const base = normalizeTavernBaseUrl(bodyObj.reverse_proxy || bodyObj.custom_url || fallbackCreds.baseUrl);
              const key = cleanTavernApiKeyString(bodyObj.proxy_password || fallbackCreds.apiKey);
              if (!base) {
                return new Response(JSON.stringify({ error: true, message: '请先填写API地址' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
              }
              const modelsEndpoints = [base + '/v1/models', base + '/models'];
              let lastStatus = 500;
              let lastText = '';
              for (const mUrl of modelsEndpoints) {
                try {
                  const mRes = await executeTavernRawFetchWithProxyFallback(mUrl, {
                    method: 'GET',
                    headers: key ? { 'Authorization': 'Bearer ' + key } : {},
                    signal: init?.signal
                  });
                  lastStatus = mRes.status;
                  if (mRes.ok) {
                    const mData = await mRes.json();
                    const rawList = Array.isArray(mData?.data) ? mData.data : (Array.isArray(mData?.models) ? mData.models : (Array.isArray(mData) ? mData : []));
                    const normalizedModels = rawList.map(item => {
                      if (typeof item === 'string') return { id: item };
                      if (item && typeof item.id === 'string') return { id: item.id };
                      if (item && typeof item.name === 'string') return { id: item.name.replace(/^models\//, '') };
                      return null;
                    }).filter(Boolean);
                    return new Response(JSON.stringify({ data: normalizedModels }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                  } else {
                    lastText = await mRes.text().catch(() => '');
                  }
                } catch (err) {
                  if (err && err.name === 'AbortError') throw err;
                  lastText = err.message || 'Failed to fetch';
                }
              }
              return new Response(JSON.stringify({ error: true, message: lastText || ('HTTP ' + lastStatus) }), { status: lastStatus || 500, headers: { 'Content-Type': 'application/json' } });
            }

            // 2b. /api/backends/chat-completions/generate (Sub-API test & prompt generation in BaiBai / Burnt-chicken-wings / ST plugins)
            if (cleanPath === 'api/backends/chat-completions/generate') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const fallbackCreds = resolveTavernApiCredentials();
              const base = normalizeTavernBaseUrl(bodyObj.reverse_proxy || bodyObj.custom_url || fallbackCreds.baseUrl);
              let key = cleanTavernApiKeyString(bodyObj.proxy_password || '');
              if (!key && bodyObj.custom_include_headers) {
                try {
                  const customH = typeof bodyObj.custom_include_headers === 'string'
                    ? JSON.parse(bodyObj.custom_include_headers)
                    : bodyObj.custom_include_headers;
                  const authVal = customH?.Authorization || customH?.authorization || '';
                  if (authVal) key = cleanTavernApiKeyString(authVal);
                } catch (_) {}
              }
              if (!key) key = fallbackCreds.apiKey;
              if (!base) {
                return new Response(JSON.stringify({ error: { message: '请先填写有效的API地址' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
              }
              const wantStream = Boolean(bodyObj.stream);
              const reqMaxTokens = (typeof bodyObj.max_tokens === 'number' && bodyObj.max_tokens > 0)
                ? bodyObj.max_tokens
                : 4096;
              const openAiPayload = {
                model: bodyObj.model || fallbackCreds.model || 'gpt-4o-mini',
                messages: Array.isArray(bodyObj.messages) ? bodyObj.messages : [],
                temperature: typeof bodyObj.temperature === 'number' ? bodyObj.temperature : 1,
                max_tokens: reqMaxTokens,
                stream: wantStream
              };
              if (bodyObj.custom_include_body) {
                try {
                  const extraBody = typeof bodyObj.custom_include_body === 'string'
                    ? JSON.parse(bodyObj.custom_include_body)
                    : bodyObj.custom_include_body;
                  if (extraBody && typeof extraBody === 'object') {
                    Object.assign(openAiPayload, extraBody);
                  }
                } catch (_) {}
              }
              const cleanBaseForEp = base.replace(/\/+$/, '');
              const endpoints = cleanBaseForEp.endsWith('/v1')
                ? [cleanBaseForEp + '/chat/completions', cleanBaseForEp.replace(/\/v1$/i, '') + '/chat/completions']
                : [cleanBaseForEp + '/v1/chat/completions', cleanBaseForEp + '/chat/completions'];
              const headers = {
                'Content-Type': 'application/json',
                ...(key ? { 'Authorization': 'Bearer ' + key } : {}),
                ...(wantStream ? { 'Accept': 'text/event-stream' } : { 'Accept': 'application/json' })
              };
              let upstreamRes = null;
              let lastErr = null;
              for (const ep of endpoints) {
                try {
                  upstreamRes = await executeTavernRawFetchWithProxyFallback(ep, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(openAiPayload),
                    signal: init?.signal
                  });
                  if (upstreamRes.status === 400) {
                    const errTxt = await upstreamRes.text().catch(() => '');
                    if (/max_tokens|max_completion_tokens|maximum|token/i.test(errTxt)) {
                      const retryPayload = Object.assign({}, openAiPayload);
                      delete retryPayload.max_tokens;
                      upstreamRes = await executeTavernRawFetchWithProxyFallback(ep, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(retryPayload),
                        signal: init?.signal
                      });
                    } else {
                      return new Response(errTxt, { status: 400, headers: { 'Content-Type': 'application/json' } });
                    }
                  }
                  if (upstreamRes.status !== 404 && upstreamRes.status !== 405) {
                    break;
                  }
                } catch (err) {
                  if (err && err.name === 'AbortError') throw err;
                  lastErr = err;
                }
              }
              if (!upstreamRes) {
                return new Response(JSON.stringify({ error: { message: lastErr?.message || '网络连接失败' } }), { status: 502, headers: { 'Content-Type': 'application/json' } });
              }
              if (!wantStream && upstreamRes.ok) {
                const rawBodyText = await upstreamRes.text().catch(() => '');
                const trimmedBody = rawBodyText.trim();
                if (trimmedBody.startsWith('data:')) {
                  let aggContent = '';
                  let aggReasoning = '';
                  const lines = trimmedBody.split(/\r?\n/);
                  for (const rawLine of lines) {
                    const line = rawLine.trim();
                    if (!line.startsWith('data:')) continue;
                    const dataStr = line.slice(5).trim();
                    if (!dataStr || dataStr === '[DONE]') continue;
                    try {
                      const chunk = JSON.parse(dataStr);
                      const choice = chunk.choices && chunk.choices[0];
                      const delta = choice ? (choice.delta || choice.message || {}) : {};
                      if (typeof delta.content === 'string') aggContent += delta.content;
                      if (typeof delta.reasoning_content === 'string') aggReasoning += delta.reasoning_content;
                      else if (typeof delta.reasoning === 'string') aggReasoning += delta.reasoning;
                    } catch (_) {}
                  }
                  const synthJson = {
                    choices: [
                      {
                        index: 0,
                        message: {
                          role: 'assistant',
                          content: aggContent,
                          ...(aggReasoning ? { reasoning_content: aggReasoning } : {})
                        },
                        finish_reason: 'stop'
                      }
                    ]
                  };
                  return new Response(JSON.stringify(synthJson), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }
                return new Response(rawBodyText, {
                  status: upstreamRes.status,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              return upstreamRes;
            }

            // 2c. /api/presets/save, /api/presets/delete, /api/presets/delete-openai, /api/worldinfo/delete, /api/secrets/find, /api/characters/*
            if (cleanPath === 'api/presets/save') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const name = String(bodyObj.name || bodyObj.preset?.name || '预设').trim();
              await getTavernPresetManager('openai').savePreset(name, bodyObj.preset || bodyObj);
              return new Response(JSON.stringify({ name }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/presets/delete' || cleanPath === 'api/presets/delete-openai') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const name = String(bodyObj.name || '').trim();
              if (name && (tavernState.presets || []).length > 1) {
                tavernState.presets = tavernState.presets.filter(p => p && p.name !== name);
                syncLiveOaiPresetListCache();
                await saveTavernStore();
              }
              return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/worldinfo/delete') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const name = String(bodyObj.name || '').trim();
              if (name) {
                tavernState.worldBooks = (tavernState.worldBooks || []).filter(w => w && w.name !== name);
                await saveTavernStore();
              }
              return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/secrets/find') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const st = getTavernSecretState();
              const list = Array.isArray(st[bodyObj.key]) ? st[bodyObj.key] : [];
              const found = bodyObj.id ? list.find(x => x && x.id === bodyObj.id) : list.find(x => x && x.active);
              return new Response(JSON.stringify({ value: found?._rawValue || '' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/characters/get') {
              return new Response(JSON.stringify(tavernState.cards || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/characters/delete') {
              return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            // 2d. /api/files/upload, /api/files/delete, /api/images/upload, /api/images/folders, /api/images/list, /api/images/delete, /api/extensions/discover
            if (cleanPath === 'api/files/upload' || cleanPath === 'api/images/upload') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const fileName = bodyObj.filename || bodyObj.name || ('file_' + Date.now() + '.' + (bodyObj.format || 'png'));
              const rawData = bodyObj.image || bodyObj.data || '';
              if (cleanPath === 'api/files/upload' && rawData) {
                if (!tavernState.extensionSettings._userFilesB64) tavernState.extensionSettings._userFilesB64 = {};
                tavernState.extensionSettings._userFilesB64[fileName] = String(rawData).replace(/^data:[^,]+,/, '');
                if (/\.json$/i.test(fileName)) {
                  try {
                    const decodedTxt = decodeLatin1ToUtf8(String(rawData).replace(/^data:[^,]+,/, ''));
                    if (decodedTxt) {
                      if (!tavernState.extensionSettings._userFilesMirror) tavernState.extensionSettings._userFilesMirror = {};
                      tavernState.extensionSettings._userFilesMirror[fileName] = decodedTxt;
                    }
                  } catch (_) {}
                }
                return new Response(JSON.stringify({ ok: true, path: 'user/files/' + fileName }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
              const mime = cleanPath === 'api/images/upload'
                ? ('image/' + ((bodyObj.format === 'jpg' ? 'jpeg' : bodyObj.format) || 'png'))
                : 'application/octet-stream';
              const dataUrl = String(rawData).startsWith('data:') ? rawData : `data:${mime};base64,${rawData}`;
              let savedUrl = dataUrl;
              try {
                const tRes = await rawFetch('http://127.0.0.1:8765/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filename: fileName, data: dataUrl })
                });
                if (tRes.ok) {
                  const tJson = await tRes.json();
                  if (tJson && tJson.url) savedUrl = tJson.url;
                }
              } catch (_) {}
              if (!tavernState.extensionSettings._uploadedGallery) tavernState.extensionSettings._uploadedGallery = [];
              tavernState.extensionSettings._uploadedGallery.unshift({
                path: savedUrl,
                folder: bodyObj.ch_name || 'default',
                filename: fileName,
                ts: Date.now()
              });
              if (tavernState.extensionSettings._uploadedGallery.length > 60) {
                tavernState.extensionSettings._uploadedGallery.length = 60;
              }
              return new Response(JSON.stringify({ path: savedUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/files/delete' || cleanPath === 'api/images/delete') {
              let bodyObj = {};
              if (init && typeof init.body === 'string') {
                try { bodyObj = JSON.parse(init.body); } catch (_) {}
              }
              const delPath = String(bodyObj.path || '').replace(/^\/+/, '').replace(/^user\/files\//, '');
              if (delPath) {
                if (tavernState.extensionSettings?._userFilesB64) delete tavernState.extensionSettings._userFilesB64[delPath];
                if (tavernState.extensionSettings?._userFilesMirror) delete tavernState.extensionSettings._userFilesMirror[delPath];
              }
              return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/images/folders') {
              const cardName = getActiveCard()?.name || 'default';
              return new Response(JSON.stringify([cardName, 'default']), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/images/list') {
              const list = (tavernState.extensionSettings._uploadedGallery || []).map(x => x.path);
              return new Response(JSON.stringify(list), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath === 'api/extensions/discover') {
              const discovered = [
                { name: 'third-party/ST-BaiBai-Image', type: 'local' },
                { name: 'third-party/ST-BaiBai-Book', type: 'local' },
                { name: 'third-party/Burnt-chicken-wings', type: 'local' },
                { name: 'third-party/book-excerpt', type: 'local' }
              ];
              (tavernState.plugins || []).forEach(p => {
                if (p && p.name) {
                  const entryName = 'third-party/' + p.name;
                  if (!discovered.some(d => d.name === entryName)) {
                    discovered.push({ name: entryName, type: 'local' });
                  }
                }
              });
              return new Response(JSON.stringify(discovered), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath.startsWith('api/extensions/')) {
              return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (cleanPath.startsWith('api/plugins/baibaoku/') || cleanPath.startsWith('api/plugins/cocktail-plus/')) {
              return new Response(JSON.stringify({ ok: true, version: '1.3.5', mode: 'browser' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
          }

          // 3. NovelAI subscription check & image generation inside Tavern plugins (including custom NAI reverse proxies)
          if (isTavernActive() && (/novelai\.net/i.test(reqUrl) || /\/ai\/(?:user\/subscription|generate-image|encode-vibe)/i.test(reqUrl) || (/^https?:\/\//i.test(reqUrl) && /\/user\/subscription$/i.test(reqUrl.split('?')[0])))) {
            return await executeTavernNovelAiFetch(reqUrl, init || {});
          }
        } catch (fetchInterceptorErr) {
          if (fetchInterceptorErr && fetchInterceptorErr.name === 'AbortError') throw fetchInterceptorErr;
          if (/novelai\.net|\/ai\/(?:user\/subscription|generate-image)|\/user\/subscription/i.test(String(input || ''))) {
            throw fetchInterceptorErr;
          }
        }
        return prevFetch(input, init);
      };
    }

    const toastrShim = {
      info: (m, title) => showTavernToast(title ? (title + ': ' + m) : m),
      success: (m, title) => showTavernToast(title ? (title + ': ' + m) : m),
      warning: (m, title) => showTavernToast(title ? (title + ': ' + m) : m),
      error: (m, title) => showTavernErrorBanner(title ? (title + ': ' + m) : m),
      clear: () => {}
    };
    window.toastr = toastrShim;

    window.SillyTavern = {
      getContext: buildSillyTavernContextObject
    };
    window.getContext = buildSillyTavernContextObject;
    window.eventSource = tavernEventSource;
    window.event_types = TAVERN_EVENT_TYPES;
    window.eventTypes = TAVERN_EVENT_TYPES;
    window.extension_prompt_types = TAVERN_EXT_PROMPT_TYPES;
    window.extension_settings = tavernState.extensionSettings;
    window.setExtensionPrompt = setExtensionPrompt;
    window.executeSlashCommands = executeTavernSlashCommand;
    window.executeSlashCommandsWithOptions = executeTavernSlashCommand;
    window.triggerSlash = executeTavernSlashCommand;
    window.triggerSlashWithOptions = executeTavernSlashCommand;
    window.renderExtensionTemplateAsync = renderExtensionTemplateAsyncShim;
    window.renderExtensionTemplate = () => '';
    window.callGenericPopup = callGenericPopupShim;
    window.callPopup = callGenericPopupShim;
    window.POPUP_TYPE = { TEXT: 1, CONFIRM: 2, INPUT: 3, DISPLAY: 4 };
    window.POPUP_RESULT = { AFFIRMATIVE: 1, NEGATIVE: 0, CANCELLED: null };
    window.saveSettingsDebounced = () => saveTavernStore();
    window.saveMetadataDebounced = () => saveTavernStore();
    window.getRequestHeaders = () => ({ 'Content-Type': 'application/json' });
    window.generateQuietPrompt = async (quietPrompt) => {
      const res = await callTavernAiCompletion([{ role: 'user', content: String(quietPrompt || '') }]);
      return res.content;
    };
    window.SlashCommandParser = {
      commands: {},
      addCommandObject: (cmdObj) => {
        if (cmdObj && cmdObj.name) {
          window.SlashCommandParser.commands[cmdObj.name] = cmdObj;
        }
      }
    };
    window.SlashCommand = {
      fromProps: (props) => Object.assign({}, props)
    };
    window.SlashCommandArgument = {
      fromProps: (props) => Object.assign({}, props)
    };
    window.SlashCommandNamedArgument = {
      fromProps: (props) => Object.assign({}, props)
    };
    window.ARGUMENT_TYPE = { STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean', LIST: 'list' };

    // SillyTavern host module exports for scripts/openai.js, scripts/world-info.js, scripts/secrets.js, scripts/personas.js, scripts/user.js
    Object.defineProperty(window, 'oai_settings', {
      configurable: true,
      get: () => getLiveOaiSettingsObject()
    });
    window.getPresetManager = getTavernPresetManager;
    Object.defineProperty(window, 'world_names', {
      configurable: true,
      get: () => (tavernState.worldBooks || []).map(w => w.name)
    });
    Object.defineProperty(window, 'selected_world_info', {
      configurable: true,
      get: () => (tavernState.worldBooks || []).filter(w => w && w.enabled).map(w => w.name)
    });
    Object.defineProperty(window, 'world_info', {
      configurable: true,
      get: () => ({
        globalSelect: (tavernState.worldBooks || []).filter(w => w && w.enabled).map(w => w.name),
        charLore: (tavernState.cards || []).filter(c => c && c.worldBookId).map(c => {
          const wb = (tavernState.worldBooks || []).find(w => w && w.id === c.worldBookId);
          return { name: c.name, extraBooks: wb ? [wb.name] : [] };
        })
      })
    });
    window.loadWorldInfo = async (name) => {
      const wb = (tavernState.worldBooks || []).find(b => b && (b.name === name || b.id === name));
      if (!wb) return { name, entries: {} };
      const entriesObj = {};
      (wb.entries || []).forEach((e, idx) => {
        const uid = e.uid !== undefined ? e.uid : idx;
        entriesObj[String(uid)] = Object.assign({}, e, {
          uid,
          key: Array.isArray(e.keys) ? e.keys : (Array.isArray(e.key) ? e.key : []),
          keysecondary: Array.isArray(e.secondaryKeys) ? e.secondaryKeys : (Array.isArray(e.keysecondary) ? e.keysecondary : []),
          displayIndex: e.displayIndex !== undefined ? e.displayIndex : idx
        });
      });
      return { name: wb.name, entries: entriesObj };
    };
    window.saveWorldInfo = async (name, data) => {
      let wb = (tavernState.worldBooks || []).find(b => b && (b.name === name || b.id === name));
      const rawEntries = data && data.entries
        ? (Array.isArray(data.entries) ? data.entries : Object.values(data.entries))
        : [];
      const normalizedEntries = rawEntries.map((e, idx) => normalizeSingleWorldEntry(Object.assign({}, e, {
        keys: Array.isArray(e.key) ? e.key : (Array.isArray(e.keys) ? e.keys : []),
        secondaryKeys: Array.isArray(e.keysecondary) ? e.keysecondary : (Array.isArray(e.secondaryKeys) ? e.secondaryKeys : [])
      }), idx));
      if (!wb) {
        wb = {
          id: 'wb_' + Date.now(),
          name: String(name || '新建世界书'),
          enabled: true,
          scanDepth: 4,
          tokenBudget: 4096,
          recursiveScanning: true,
          entries: normalizedEntries
        };
        tavernState.worldBooks.push(wb);
      } else {
        wb.entries = normalizedEntries;
      }
      await saveTavernStore();
      if (uiRuntime.openDrawerKey === 'atlas') refreshOpenDrawerOnly();
    };
    window.createWorldInfoEntry = (name, data) => {
      const entries = (data && data.entries) || (data ? (data.entries = {}) : {});
      const used = Object.values(entries).map(e => Number(e?.uid)).filter(Number.isFinite);
      const nextUid = used.length ? Math.max(...used) + 1 : 0;
      const entry = {
        uid: nextUid,
        key: [],
        keysecondary: [],
        comment: '',
        content: '',
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: 100,
        position: 0,
        disable: false,
        excludeRecursion: false,
        preventRecursion: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: '',
        role: null,
        sticky: 0,
        cooldown: 0,
        delay: 0
      };
      entries[nextUid] = entry;
      return entry;
    };
    window.deleteWorldInfo = async (name) => {
      tavernState.worldBooks = (tavernState.worldBooks || []).filter(b => b && b.name !== name && b.id !== name);
      await saveTavernStore();
      if (uiRuntime.openDrawerKey === 'atlas') refreshOpenDrawerOnly();
      return true;
    };
    window.reloadEditor = () => {
      if (uiRuntime.openDrawerKey === 'atlas') refreshOpenDrawerOnly();
    };
    Object.defineProperty(window, 'secret_state', {
      configurable: true,
      get: () => getTavernSecretState()
    });
    window.readSecretState = async () => getTavernSecretState();
    window.writeSecret = async (secretKey, value, label) => {
      const st = getTavernSecretState();
      if (!Array.isArray(st[secretKey])) st[secretKey] = [];
      const cleanVal = String(value || '').trim();
      const mask = cleanVal.length > 8 ? `${cleanVal.slice(0, 3)}…${cleanVal.slice(-4)}` : '已保存';
      const newId = 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      st[secretKey].forEach(item => { if (item) item.active = false; });
      st[secretKey].push({
        id: newId,
        label: label || '密钥',
        value: mask,
        _rawValue: cleanVal,
        active: true
      });
      if (secretKey === 'api_key_custom' && cleanVal) {
        tavernState.apiConfig.customKey = cleanVal;
      }
      await saveTavernStore();
      return newId;
    };
    window.rotateSecret = async (secretKey, id) => {
      const st = getTavernSecretState();
      const list = Array.isArray(st[secretKey]) ? st[secretKey] : [];
      list.forEach(item => {
        if (item) item.active = (item.id === id);
      });
      const activeItem = list.find(item => item && item.id === id);
      if (secretKey === 'api_key_custom' && activeItem && activeItem._rawValue) {
        tavernState.apiConfig.customKey = activeItem._rawValue;
      }
      await saveTavernStore();
    };
    window.deleteSecret = async (secretKey, id) => {
      const st = getTavernSecretState();
      if (Array.isArray(st[secretKey])) {
        st[secretKey] = st[secretKey].filter(item => item && item.id !== id);
        await saveTavernStore();
      }
    };
    window.findSecret = async (secretKey, id) => {
      const st = getTavernSecretState();
      const list = Array.isArray(st[secretKey]) ? st[secretKey] : [];
      const found = id ? list.find(item => item && item.id === id) : list.find(item => item && item.active);
      return found?._rawValue || '';
    };
    Object.defineProperty(window, 'user_avatar', {
      configurable: true,
      get: () => {
        const p = getActivePersona();
        return p ? (p.id || p.name || 'default_persona') : 'default_persona';
      }
    });
    window.setUserAvatar = async (avatarIdOrName) => {
      const found = (tavernState.personas || []).find(p => p && (p.id === avatarIdOrName || p.name === avatarIdOrName || p.avatar === avatarIdOrName));
      if (found) {
        tavernState.activePersonaId = found.id;
        await saveTavernStore();
        renderTavernChatFloors(false);
      }
    };
    window.getCurrentUserHandle = () => 'default-user';

    window.sendMessageAsUser = async (text, trigger = true) => {
      await executeTavernSlashCommand('/send ' + String(text || '') + (trigger ? ' | /trigger' : ''), { suppressAutoTrigger: !trigger });
    };
    window.Generate = () => triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });

    window.getVariables = (opts) => {
      if (opts && opts.type === 'global') return getGlobalVariablesStore();
      return getChatVariablesStore();
    };
    window.insertOrAssignVariables = async (varsObj, opts) => {
      const target = (opts && opts.type === 'global') ? getGlobalVariablesStore() : getChatVariablesStore();
      if (varsObj && typeof varsObj === 'object') {
        Object.assign(target, varsObj);
        await saveTavernStore();
      }
      return target;
    };
    window.replaceVariables = async (varsObj, opts) => {
      const sess = getActiveChatSession();
      if (opts && opts.type === 'global') {
        tavernState.extensionSettings.globalVariables = Object.assign({}, varsObj || {});
      } else if (sess) {
        if (!sess.metadata) sess.metadata = {};
        sess.metadata.variables = Object.assign({}, varsObj || {});
      }
      await saveTavernStore();
      return window.getVariables(opts);
    };
    window.updateVariablesWith = async (updaterFn, opts) => {
      const cur = window.getVariables(opts);
      const next = typeof updaterFn === 'function' ? updaterFn(cur) : cur;
      if (next && typeof next === 'object') {
        return await window.replaceVariables(next, opts);
      }
      await saveTavernStore();
      return cur;
    };
    window.deleteVariable = async (key, opts) => {
      const target = window.getVariables(opts);
      if (target && key in target) {
        delete target[key];
        await saveTavernStore();
      }
    };

    window.getButtonEvent = (btnName) => String(btnName || '');
    window.getScriptButtons = () => {
      const activeP = (tavernState.plugins || []).find(p => p.id === uiRuntime.activePluginModalId) || (tavernState.plugins || [])[0];
      return (activeP && Array.isArray(activeP.buttons)) ? activeP.buttons : [];
    };
    window.replaceScriptButtons = (btns) => {
      const activeP = (tavernState.plugins || []).find(p => p.id === uiRuntime.activePluginModalId) || (tavernState.plugins || [])[tavernState.plugins.length - 1];
      if (activeP && Array.isArray(btns)) {
        activeP.buttons = btns;
        saveTavernStore();
      }
    };
    window.appendInexistentScriptButtons = (btns) => {
      const activeP = (tavernState.plugins || []).find(p => p.id === uiRuntime.activePluginModalId) || (tavernState.plugins || [])[tavernState.plugins.length - 1];
      if (activeP && Array.isArray(btns)) {
        if (!Array.isArray(activeP.buttons)) activeP.buttons = [];
        btns.forEach(b => {
          if (b && b.name && !activeP.buttons.some(x => x.name === b.name)) {
            activeP.buttons.push(b);
          }
        });
        saveTavernStore();
      }
    };
    window.eventOn = (evt, cb) => tavernEventSource.on(evt, cb);
    window.eventOnce = (evt, cb) => {
      const wrap = async (...args) => {
        tavernEventSource.off(evt, wrap);
        await cb(...args);
      };
      tavernEventSource.on(evt, wrap);
    };
    window.eventEmit = (evt, ...args) => tavernEventSource.emit(evt, ...args);
    window.eventRemoveListener = (evt, cb) => tavernEventSource.off(evt, cb);
    window.tavern_events = TAVERN_EVENT_TYPES;

    window.injectPrompts = (promptList) => {
      if (!Array.isArray(promptList)) return;
      promptList.forEach(item => {
        if (!item || !item.id) return;
        const pos = item.position === 'in_chat' ? 1 : 0;
        const roleNum = item.role === 'user' ? 1 : (item.role === 'assistant' ? 2 : 0);
        setExtensionPrompt(item.id, item.content || '', pos, Number(item.depth ?? 1), false, roleNum);
      });
    };
    window.uninjectPrompts = (ids) => {
      if (!Array.isArray(ids)) return;
      ids.forEach(id => {
        if (id) setExtensionPrompt(id, '');
      });
    };

    window.__getTavernUserAvatarUrl = () => resolveSafeAvatarUrl(getUserAvatarUrl(), true);
    window.__getTavernCharAvatarUrl = () => {
      const c = getActiveCard();
      return resolveSafeAvatarUrl(c ? c.avatar : '', false);
    };
    window.__isTavernScreenActive = () => isTavernActive();
    window.__registerTavernAudioInstance = (audioEl, isAllowedFloor = true) => {
      if (!audioEl) return false;
      if (!window.__tavernActiveAudioSet) {
        window.__tavernActiveAudioSet = new Set();
      }
      window.__tavernActiveAudioSet.add(audioEl);
      if (!isTavernActive() || !isAllowedFloor) {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
        } catch (_) {}
        return false;
      }
      // Pause any other currently playing audio instances only if the new audioEl actually has a valid media source
      const hasValidSrc = Boolean((audioEl.src && String(audioEl.src).trim()) || (audioEl.currentSrc && String(audioEl.currentSrc).trim()));
      if (hasValidSrc) {
        window.__tavernActiveAudioSet.forEach(other => {
          if (other && other !== audioEl) {
            try {
              if (!other.paused) {
                other.pause();
              }
            } catch (_) {}
          }
        });
      }
      return true;
    };

    if (!window._tavernHostAudioHooked && typeof HTMLMediaElement !== 'undefined') {
      window._tavernHostAudioHooked = true;
      const origMediaPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        try {
          const inTavernDom = Boolean(
            (this.closest && (this.closest('#game-hall-screen') || this.closest('[id^="gourmet-fixed-"]') || this.closest('#adv-codex-panel') || this.closest('#bbi-app-host'))) ||
            this._createdWhileTavernActive
          );
          if (inTavernDom) {
            const allowed = window.__registerTavernAudioInstance(this, true);
            if (!allowed) {
              return Promise.resolve();
            }
          }
        } catch (_) {}
        return origMediaPlay.apply(this, args);
      };
      const OrigAudio = window.Audio;
      if (typeof OrigAudio === 'function' && !OrigAudio._tavernWrapped) {
        const WrappedAudio = function (...a) {
          const inst = new OrigAudio(...a);
          if (isTavernActive()) {
            inst._createdWhileTavernActive = true;
            if (!window.__tavernActiveAudioSet) window.__tavernActiveAudioSet = new Set();
            window.__tavernActiveAudioSet.add(inst);
          }
          return inst;
        };
        WrappedAudio.prototype = OrigAudio.prototype;
        WrappedAudio._tavernWrapped = true;
        window.Audio = WrappedAudio;
      }
    }

    window.TavernHelper = {
      isFrontendRenderEnabled: () => true,
      getCurrentMessageId: () => {
        const sess = getActiveChatSession();
        const msgs = sess && Array.isArray(sess.messages) ? sess.messages : [];
        return Math.max(0, msgs.length - 1);
      },
      getLastMessageId: () => {
        const sess = getActiveChatSession();
        const msgs = sess && Array.isArray(sess.messages) ? sess.messages : [];
        return Math.max(0, msgs.length - 1);
      },
      getChatMessages: (rangeOrId) => {
        const sess = getActiveChatSession();
        const msgs = sess && Array.isArray(sess.messages) ? sess.messages : [];
        const wrapMsg = (m, idx) => {
          const swipes = Array.isArray(m.swipes) && m.swipes.length > 0 ? m.swipes : [m.mes || ''];
          const sIdx = Math.min(swipes.length - 1, Math.max(0, Number(m.swipe_id || 0)));
          let text = swipes[sIdx] !== undefined ? swipes[sIdx] : (m.mes || '');
          if (!String(text || '').trim() && swipes.length > 1) {
            for (let k = sIdx - 1; k >= 0; k--) {
              if (String(swipes[k] || '').trim()) {
                text = swipes[k];
                break;
              }
            }
          }
          return Object.assign({}, m, {
            message_id: m.mesid !== undefined ? m.mesid : idx,
            name: m.name || (m.is_user ? getUserDisplayName() : (getActiveCard()?.name || '角色')),
            role: m.is_user ? 'user' : (m.is_system ? 'system' : 'assistant'),
            is_user: Boolean(m.is_user),
            is_system: Boolean(m.is_system),
            is_hidden: Boolean(m.is_hidden),
            message: text,
            mes: text,
            swipe_id: sIdx,
            swipes,
            data: (m.data && typeof m.data === 'object') ? m.data : {},
            extra: (m.extra && typeof m.extra === 'object') ? m.extra : {}
          });
        };
        if (Array.isArray(rangeOrId)) {
          return rangeOrId.flatMap(item => window.TavernHelper.getChatMessages(item));
        }
        if (typeof rangeOrId === 'number') {
          const idx = rangeOrId < 0 ? msgs.length + rangeOrId : rangeOrId;
          return msgs[idx] ? [wrapMsg(msgs[idx], idx)] : [];
        }
        if (typeof rangeOrId === 'string') {
          const trimmed = rangeOrId.trim();
          if (trimmed === '{{lastMessageId}}' || trimmed === 'last' || trimmed === 'current') {
            const lastIdx = Math.max(0, msgs.length - 1);
            return msgs[lastIdx] ? [wrapMsg(msgs[lastIdx], lastIdx)] : [];
          }
          if (/^-?\d+$/.test(trimmed)) {
            const num = Number(trimmed);
            const idx = num < 0 ? msgs.length + num : num;
            return msgs[idx] ? [wrapMsg(msgs[idx], idx)] : [];
          }
          const rangeMatch = trimmed.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
          if (rangeMatch) {
            let s = Number(rangeMatch[1]);
            let e = Number(rangeMatch[2]);
            if (s < 0) s = Math.max(0, msgs.length + s);
            if (e < 0) e = Math.max(0, msgs.length + e);
            const start = Math.min(s, e);
            const end = Math.max(s, e);
            const out = [];
            for (let i = start; i <= end && i < msgs.length; i++) {
              if (msgs[i]) out.push(wrapMsg(msgs[i], i));
            }
            return out;
          }
        }
        return msgs.map((m, idx) => wrapMsg(m, idx));
      },
      getChatMessage: (messageId) => {
        const list = window.TavernHelper.getChatMessages(messageId ?? -1);
        return list[0] ? list[0].message : '';
      },
      setChatMessage: async (textOrObj, messageId, opts = {}) => {
        const sess = getActiveChatSession();
        const msgs = sess && Array.isArray(sess.messages) ? sess.messages : [];
        const targetId = messageId !== undefined ? (messageId < 0 ? msgs.length + messageId : Number(messageId)) : Math.max(0, msgs.length - 1);
        const newText = (textOrObj && typeof textOrObj === 'object') ? (textOrObj.message ?? textOrObj.mes ?? '') : String(textOrObj ?? '');
        await window.TavernHelper.setChatMessages([{ message_id: targetId, message: newText }], opts);
      },
      setChatMessages: async (msgs, opts = {}) => {
        const sess = getActiveChatSession();
        if (!sess || !Array.isArray(msgs)) return;
        const isPartialUpdate = msgs.every(m => m && m.message_id !== undefined && m.is_user === undefined && m.swipes === undefined);
        if (isPartialUpdate) {
          msgs.forEach(u => {
            const target = sess.messages[u.message_id];
            if (target) {
              const nextMsgText = u.message !== undefined ? u.message : u.mes;
              if (nextMsgText !== undefined) {
                target.mes = nextMsgText;
                if (Array.isArray(target.swipes) && target.swipes.length > 0) {
                  target.swipes[target.swipe_id || 0] = nextMsgText;
                } else {
                  target.swipes = [nextMsgText];
                }
              }
              if (u.data && typeof u.data === 'object') {
                target.data = Object.assign({}, target.data || {}, u.data);
              }
              if (u.extra && typeof u.extra === 'object') {
                target.extra = Object.assign({}, target.extra || {}, u.extra);
              }
            }
          });
        } else {
          sess.messages = msgs;
        }
        await saveTavernStore();
        if (!opts || opts.refresh !== 'none') {
          renderTavernChatFloors(false);
        }
      },
      createChatMessages: async (newMsgs) => {
        const sess = getActiveChatSession();
        if (sess && Array.isArray(newMsgs)) {
          newMsgs.forEach(m => {
            const text = m.message || m.mes || m.content || '';
            const nowTs = Date.now();
            sess.messages.push({
              mesid: sess.messages.length,
              name: m.name || (m.role === 'user' || m.is_user ? getUserDisplayName() : (getActiveCard()?.name || '角色')),
              is_user: Boolean(m.is_user || m.role === 'user'),
              is_system: Boolean(m.is_system || m.role === 'system'),
              send_date: nowTs,
              mes: text,
              swipes: [text],
              swipe_id: 0,
              swipe_info: [{ send_date: nowTs, gen_time: '', reasoning: '', token_count: estimateTokens(text) }],
              reasoning: '',
              gen_time: '',
              token_count: estimateTokens(text)
            });
          });
          await saveTavernStore();
          renderTavernChatFloors(false);
        }
      },
      generate: async (opts = {}) => {
        if (opts && opts.user_input) {
          await executeTavernSlashCommand('/send ' + opts.user_input + ' | /trigger');
        } else {
          await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
        }
      },
      generateRaw: async (opts = {}) => {
        let promptArr = [];
        if (Array.isArray(opts)) {
          promptArr = opts;
        } else if (typeof opts === 'string') {
          promptArr = [{ role: 'user', content: opts }];
        } else if (opts && typeof opts === 'object') {
          if (Array.isArray(opts.ordered_prompts)) {
            promptArr = opts.ordered_prompts;
          } else if (Array.isArray(opts.prompt)) {
            promptArr = opts.prompt;
          } else if (Array.isArray(opts.messages)) {
            promptArr = opts.messages;
          } else {
            if (opts.systemPrompt) promptArr.push({ role: 'system', content: String(opts.systemPrompt) });
            if (opts.prompt !== undefined) promptArr.push({ role: 'user', content: String(opts.prompt || '') });
          }
        }
        const res = await callTavernAiCompletion(promptArr, null, { isBackground: true });
        return res.content || res.rawContent || res.reasoning || '';
      },
      getVariables: window.getVariables,
      insertOrAssignVariables: window.insertOrAssignVariables,
      replaceVariables: window.replaceVariables,
      updateVariablesWith: window.updateVariablesWith,
      deleteVariable: window.deleteVariable,
      getButtonEvent: window.getButtonEvent,
      getScriptButtons: window.getScriptButtons,
      replaceScriptButtons: window.replaceScriptButtons,
      appendInexistentScriptButtons: window.appendInexistentScriptButtons,
      injectPrompts: window.injectPrompts,
      uninjectPrompts: window.uninjectPrompts,
      triggerSlash: executeTavernSlashCommand,
      triggerSlashWithResult: executeTavernSlashCommand,
      triggerSlashWithOptions: executeTavernSlashCommand,
      eventOn: window.eventOn,
      eventOnce: window.eventOnce,
      eventEmit: window.eventEmit,
      eventRemoveListener: window.eventRemoveListener,
      getWorldbook: (name) => {
        const wb = (tavernState.worldBooks || []).find(b => b.name === name || b.id === name || (name && b.name.includes(name)));
        return wb ? wb.entries : [];
      },
      replaceWorldbook: async (name, entries) => {
        const wb = (tavernState.worldBooks || []).find(b => b.name === name || b.id === name || (name && b.name.includes(name)));
        if (wb && Array.isArray(entries)) {
          wb.entries = entries.map((e, i) => normalizeSingleWorldEntry(e, i));
          await saveTavernStore();
        }
      },
      updateWorldbookWith: async (name, updaterFn) => {
        const entries = window.TavernHelper.getWorldbook(name);
        const next = typeof updaterFn === 'function' ? await updaterFn(entries) : entries;
        if (Array.isArray(next)) {
          await window.TavernHelper.replaceWorldbook(name, next);
        }
      }
    };
    window.getCurrentMessageId = window.TavernHelper.getCurrentMessageId;
    window.getLastMessageId = window.TavernHelper.getLastMessageId;
    window.getChatMessages = window.TavernHelper.getChatMessages;
    window.getChatMessage = window.TavernHelper.getChatMessage;
    window.setChatMessage = window.TavernHelper.setChatMessage;
    window.setChatMessages = window.TavernHelper.setChatMessages;
    window.createChatMessages = window.TavernHelper.createChatMessages;
    window.triggerSlash = executeTavernSlashCommand;
    window.triggerSlashWithResult = executeTavernSlashCommand;
    window.triggerSlashWithOptions = executeTavernSlashCommand;
    window.checkWorldInfo = runTavernCheckWorldInfo;
    window.getWorldInfoPrompt = runTavernCheckWorldInfo;
    window.doNewChat = async () => { await startNewChatForActiveCard(); };
    window.power_user = {
      get experimental_macro_engine() { return false; },
      get persona_description() { return getActivePersona()?.description || ''; }
    };
    if (!window.SlashCommandParser) {
      window.SlashCommandParser = {
        commands: {},
        addCommandObject: (cmdObj) => {
          if (cmdObj && cmdObj.name) {
            window.SlashCommandParser.commands[cmdObj.name] = cmdObj;
          }
        }
      };
      window.SlashCommand = { fromProps: (props) => Object.assign({}, props) };
      window.SlashCommandArgument = { fromProps: (props) => Object.assign({}, props) };
      window.SlashCommandNamedArgument = { fromProps: (props) => Object.assign({}, props) };
      window.ARGUMENT_TYPE = { STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean' };
    }

    window.__ST_BRIDGE__ = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally' || typeof prop === 'symbol') {
          return undefined;
        }
        if (prop === '__esModule') return true;
        if (prop in window) return window[prop];
        const ctx = buildSillyTavernContextObject();
        if (prop in ctx) return ctx[prop];
        if (window.TavernHelper && prop in window.TavernHelper) return window.TavernHelper[prop];
        return () => {};
      }
    });

    if (!window._tavernIframeMsgBound) {
      window._tavernIframeMsgBound = true;
      window.addEventListener('message', async (ev) => {
        const data = ev && ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'TAVERN_IFRAME_SLASH' && data.command !== undefined) {
          await executeTavernSlashCommand(String(data.command), { fromIframe: true });
        } else if (data.type === 'TAVERN_IFRAME_SEND' && data.text !== undefined) {
          const shouldTrigger = data.trigger !== false;
          const cleanText = String(data.text || '').trim();
          if (cleanText) {
            await executeTavernSlashCommand('/send ' + cleanText + (shouldTrigger ? ' | /trigger' : ''), { fromIframe: true, suppressAutoTrigger: !shouldTrigger });
          } else if (shouldTrigger) {
            await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
          }
        } else if (data.type === 'TAVERN_IFRAME_SET_INPUT' && data.text !== undefined) {
          const textarea = document.getElementById('send_textarea');
          if (textarea) textarea.value = String(data.text || '');
        } else if (data.type === 'TAVERN_IFRAME_CLICK_SEND') {
          await handleSendUserMessage();
        } else if (data.type === 'TAVERN_IFRAME_GENERATE') {
          await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
        } else if (data.type === 'TAVERN_IFRAME_TOUCH_GESTURE') {
          if (typeof window.pushMobileBackGuard === 'function') {
            window.pushMobileBackGuard('tavern_iframe');
          }
        }
      });
    }
  }

  function syncBuiltInD100Pool() {
    setExtensionPrompt('qr_csprng_d100_pool', '', 1, 0);
    return null;
  }

  function isBaiBaiImagePlugin(plugin) {
    if (!plugin) return false;
    const n = String(plugin.name || '');
    const u = String(plugin.repoBaseUrl || '');
    return /柏宝绘|ST-BaiBai-Image/i.test(n) || /ST-BaiBai-Image/i.test(u);
  }

  function isBaiBaiBookPlugin(plugin) {
    if (!plugin) return false;
    const n = String(plugin.name || '');
    const u = String(plugin.repoBaseUrl || '');
    return /柏宝书|ST-BaiBai-Book/i.test(n) || /ST-BaiBai-Book/i.test(u);
  }

  function isBookExcerptPlugin(plugin) {
    if (!plugin) return false;
    const n = String(plugin.name || '');
    const u = String(plugin.repoBaseUrl || '');
    const c = String(plugin.code || plugin.content || '');
    return /书摘|book-excerpt/i.test(n) || /book-excerpt/i.test(u) || /BookExcerpt|be-float-bar/i.test(c);
  }

  function isTextSelectionPluginEnabled() {
    if (window.BookExcerpt || document.getElementById('be-style') || document.getElementById('be-menu-entry')) {
      return true;
    }
    return (tavernState.plugins || []).some(p => p && p.enabled && (
      isBookExcerptPlugin(p) ||
      /excerpt|highlight|划线|书摘/i.test(String(p.name || ''))
    ));
  }
  window.__isTavernSelectionPluginActive = isTextSelectionPluginEnabled;

  function resolvePluginThumbnailUrlSync(rawThumbUrl) {
    try {
      const qIdx = String(rawThumbUrl || '').indexOf('?');
      if (qIdx < 0) return '';
      const params = new URLSearchParams(String(rawThumbUrl).slice(qIdx + 1));
      const type = params.get('type') || 'avatar';
      const file = params.get('file') || '';
      if (type === 'persona') {
        return resolveSafeAvatarUrl(getUserAvatarUrl(), true);
      }
      if (file) {
        const matchedCard = (tavernState.cards || []).find(c => c && (c.avatar === file || c.name === file || c.id === file));
        const rawTarget = matchedCard ? matchedCard.avatar : file;
        return resolveSafeAvatarUrl(rawTarget, false);
      }
      return resolveSafeAvatarUrl(getActiveCard()?.avatar || '', false);
    } catch (_) {
      return '';
    }
  }

  async function resolvePluginThumbnailUrlAsync(rawThumbUrl) {
    const syncUrl = resolvePluginThumbnailUrlSync(rawThumbUrl);
    if (!syncUrl) return '';
    if (String(syncUrl).startsWith('vault://') && typeof window.resolveVaultRefToUrl === 'function') {
      try {
        const unlocked = await window.resolveVaultRefToUrl(syncUrl);
        if (unlocked) return unlocked;
      } catch (_) {}
    }
    return syncUrl;
  }

  function syncBookExcerptDomAvatars() {
    try {
      const containers = document.querySelectorAll('#be-panel, #be-mask, #be-card, #be-source-mask, #be-viewer-mask, #be-daily-review');
      containers.forEach(rootEl => {
        rootEl.querySelectorAll('[style*="/thumbnail?"]').forEach(el => {
          const st = el.getAttribute('style') || '';
          const nextSt = st.replace(/\/thumbnail\?type=(avatar|persona)&file=([^'")&\s]+)/g, (full) => {
            const resolved = resolvePluginThumbnailUrlSync(full);
            return resolved || full;
          });
          if (nextSt !== st) el.setAttribute('style', nextSt);
        });
        rootEl.querySelectorAll('img[src*="/thumbnail?"]').forEach(img => {
          const src = img.getAttribute('src') || '';
          const resolved = resolvePluginThumbnailUrlSync(src);
          if (resolved && resolved !== src) img.setAttribute('src', resolved);
        });
      });
    } catch (_) {}
  }

  function isBaiBaiPlugin(plugin) {
    return isBaiBaiImagePlugin(plugin) || isBaiBaiBookPlugin(plugin);
  }

  function resolvePluginMetaUrl(plugin) {
    if (isBaiBaiImagePlugin(plugin)) {
      return 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Image/main/dist/index.js';
    }
    if (isBaiBaiBookPlugin(plugin)) {
      return 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Book/main/dist/index.js';
    }
    if (isBurntChickenWingsPlugin(plugin)) {
      return 'https://raw.githubusercontent.com/Xiaxiii/Burnt-chicken-wings/main/scripts/extensions/third-party/Burnt-chicken-wings/index.js';
    }
    if (isBookExcerptPlugin(plugin)) {
      return 'https://raw.githubusercontent.com/Mshiyuan/book-excerpt/main/scripts/extensions/third-party/book-excerpt/index.js';
    }
    if (plugin && plugin.repoBaseUrl) {
      const entry = (plugin.jsEntryPath || 'index.js').replace(/^\/+/, '');
      return plugin.repoBaseUrl.replace(/\/+$/, '') + '/' + entry;
    }
    return 'https://raw.githubusercontent.com/SillyTavern/Extension/main/scripts/extensions/third-party/Extension/index.js';
  }

  let cachedBaiBaiShadowCss = '';
  let cachedBaiBaiBookShadowCss = '';
  let baiBaiUpgradeInFlight = false;
  let baiBaiBookUpgradeInFlight = false;
  let baiBaiShadowObserverBound = false;

  function buildBaiBaiBookBeautifyCss() {
    const activeTheme = tavernState.themes.find(t => t.id === tavernState.activeThemeId) || tavernState.themes[0] || DEFAULT_GOUSU_THEME;
    const mainText = activeTheme.main_text_color || '#4a4745';
    const subText = activeTheme.italics_text_color || '#8c8580';
    const quoteAccent = activeTheme.quote_text_color || '#b8948e';
    const isNight = /night|dark|夜|暗|黑/i.test(activeTheme.name || '');
    const bgBase = isNight ? '#232226' : '#f8f6f3';
    const bgPanel = isNight ? '#2b292e' : '#fdfcfb';
    const bgSubtle = isNight ? '#343238' : '#f1ede8';
    const borderSoft = isNight ? 'rgba(255, 255, 255, 0.09)' : 'rgba(138, 128, 120, 0.16)';
    return `
      .bbs-root,
      .bbs-root[data-theme="day"],
      .bbs-root[data-theme="night"],
      .bbs-root[data-theme="pastel"],
      :host {
        --bbs-bg-primary: ${bgBase} !important;
        --bbs-bg-secondary: ${bgSubtle} !important;
        --bbs-bg-tertiary: ${bgSubtle} !important;
        --bbs-bg-panel: ${bgPanel} !important;
        --bbs-bg-elevated: ${bgPanel} !important;
        --bbs-bg-hover: ${bgSubtle} !important;
        --bbs-text-primary: ${mainText} !important;
        --bbs-text-secondary: ${subText} !important;
        --bbs-text-muted: ${subText} !important;
        --bbs-border: ${borderSoft} !important;
        --bbs-border-strong: ${borderSoft} !important;
        --bbs-accent: ${quoteAccent} !important;
        --bbs-accent-hover: ${quoteAccent} !important;
        --bbs-accent-soft: ${bgSubtle} !important;
        --bbs-radius-sm: 10px !important;
        --bbs-radius-md: 14px !important;
        --bbs-radius-lg: 18px !important;
        --bbs-shadow-sm: 0 2px 10px rgba(45, 40, 36, 0.04) !important;
        --bbs-shadow-md: 0 6px 20px rgba(45, 40, 36, 0.06) !important;
        --bbs-shadow-lg: 0 12px 32px rgba(45, 40, 36, 0.09) !important;
        font-family: var(--app-font-family, inherit) !important;
      }
      .bbs-root *,
      .bbs-fp-card,
      .bbs-fp-card * {
        font-family: var(--app-font-family, inherit) !important;
        box-sizing: border-box !important;
      }
      .bbs-fp-card {
        background: ${bgPanel} !important;
        border: 1px solid ${borderSoft} !important;
        border-radius: 16px !important;
        box-shadow: 0 4px 16px rgba(45, 40, 36, 0.04) !important;
        color: ${mainText} !important;
        padding: 12px 14px !important;
        margin: 8px 0 !important;
      }
      .bbs-fp-header,
      .bbs-fp-section,
      .bbs-fp-item,
      .bbs-card,
      .bbs-panel,
      .bbs-modal-window {
        background: ${bgPanel} !important;
        border-color: ${borderSoft} !important;
        color: ${mainText} !important;
        border-radius: 14px !important;
      }
      .bbs-fp-badge,
      .bbs-fp-chip,
      .bbs-fp-tag,
      .bbs-tag,
      .bbs-badge {
        background: ${bgSubtle} !important;
        color: ${mainText} !important;
        border: 1px solid ${borderSoft} !important;
        border-radius: 10px !important;
        padding: 3px 9px !important;
        font-weight: 500 !important;
      }
      .bbs-fp-summary-box,
      .bbs-fp-entity-box,
      .bbs-fp-content {
        background: ${bgBase} !important;
        border: 1px solid ${borderSoft} !important;
        border-radius: 12px !important;
        color: ${mainText} !important;
      }
      .bbs-btn,
      .bbs-fp-btn,
      .bbs-root button {
        border-radius: 10px !important;
        border: 1px solid ${borderSoft} !important;
        background: ${bgSubtle} !important;
        color: ${mainText} !important;
        box-shadow: none !important;
        transition: all 0.16s ease !important;
      }
      .bbs-btn-primary,
      .bbs-root button.primary {
        background: ${quoteAccent} !important;
        color: #ffffff !important;
        border-color: transparent !important;
      }
      .bbs-root select,
      .bbs-root input[type="text"],
      .bbs-root input[type="number"],
      .bbs-root textarea {
        background: ${bgBase} !important;
        color: ${mainText} !important;
        border: 1px solid ${borderSoft} !important;
        border-radius: 10px !important;
        min-height: 36px !important;
        line-height: 1.4 !important;
      }
      .bbs-orb {
        border-radius: 14px !important;
        border: 1px solid ${borderSoft} !important;
        background: ${bgPanel} !important;
        box-shadow: 0 4px 14px rgba(45, 40, 36, 0.08) !important;
      }
    `;
  }

  function applyCachedBaiBaiCssToShadowRoots() {
    try {
      const bbiHost = document.getElementById('bbi-app-host');
      if (bbiHost && bbiHost.shadowRoot && cachedBaiBaiShadowCss && !bbiHost.shadowRoot.getElementById('bbi-inline-shadow-css')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'bbi-inline-shadow-css';
        styleEl.textContent = cachedBaiBaiShadowCss;
        bbiHost.shadowRoot.appendChild(styleEl);
      }
      const enableBbsBeautify = Boolean(tavernState.uiSettings && tavernState.uiSettings.enableBaiBaiBookBeautify);
      const bbsBeautifyCss = enableBbsBeautify ? buildBaiBaiBookBeautifyCss() : '';

      const bbsHost = document.getElementById('bbs-app-host');
      if (bbsHost && bbsHost.shadowRoot) {
        if (cachedBaiBaiBookShadowCss && !bbsHost.shadowRoot.getElementById('bbs-inline-shadow-css')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'bbs-inline-shadow-css';
          styleEl.textContent = cachedBaiBaiBookShadowCss;
          bbsHost.shadowRoot.appendChild(styleEl);
        }
        const existingBeauty = bbsHost.shadowRoot.getElementById('bbs-custom-theme-beautify');
        if (enableBbsBeautify) {
          if (existingBeauty) {
            existingBeauty.textContent = bbsBeautifyCss;
          } else {
            const bEl = document.createElement('style');
            bEl.id = 'bbs-custom-theme-beautify';
            bEl.textContent = bbsBeautifyCss;
            bbsHost.shadowRoot.appendChild(bEl);
          }
        } else if (existingBeauty) {
          existingBeauty.remove();
        }
      }
      document.querySelectorAll('.bbs-fp-host').forEach(fpHost => {
        if (!fpHost || !fpHost.shadowRoot) return;
        if (cachedBaiBaiBookShadowCss && !fpHost.shadowRoot.getElementById('bbs-fp-inline-shadow-css')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'bbs-fp-inline-shadow-css';
          styleEl.textContent = cachedBaiBaiBookShadowCss;
          fpHost.shadowRoot.appendChild(styleEl);
        }
        const existingFpBeauty = fpHost.shadowRoot.getElementById('bbs-custom-theme-beautify');
        if (enableBbsBeautify) {
          if (existingFpBeauty) {
            existingFpBeauty.textContent = bbsBeautifyCss;
          } else {
            const bEl = document.createElement('style');
            bEl.id = 'bbs-custom-theme-beautify';
            bEl.textContent = bbsBeautifyCss;
            fpHost.shadowRoot.appendChild(bEl);
          }
        } else if (existingFpBeauty) {
          existingFpBeauty.remove();
        }
      });
      syncBookExcerptDomAvatars();
    } catch (_) {}
  }

  async function syncBaiBaiShadowDomCss() {
    try {
      if (!baiBaiShadowObserverBound && document.body) {
        baiBaiShadowObserverBound = true;
        const obs = new MutationObserver(() => {
          applyCachedBaiBaiCssToShadowRoots();
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }
      const bbiHost = document.getElementById('bbi-app-host');
      if (bbiHost && !cachedBaiBaiShadowCss) {
        const res = await fetch('https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Image/main/dist/index.css');
        if (res.ok) {
          cachedBaiBaiShadowCss = await res.text();
        }
      }
      const bbsHost = document.getElementById('bbs-app-host') || document.querySelector('.bbs-fp-host');
      if ((bbsHost || (tavernState.plugins || []).some(p => p && p.enabled && isBaiBaiBookPlugin(p))) && !cachedBaiBaiBookShadowCss) {
        const res = await fetch('https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Book/main/dist/index.css');
        if (res.ok) {
          cachedBaiBaiBookShadowCss = await res.text();
        }
      }
      applyCachedBaiBaiCssToShadowRoots();
    } catch (_) {}
  }

  function transpilePluginImports(codeStr, plugin = null) {
    const safeMetaUrl = JSON.stringify(resolvePluginMetaUrl(plugin));
    return String(codeStr || '')
      .replace(/\bimport\.meta\.url\b/g, safeMetaUrl)
      .replace(/\bimport\.meta\b/g, `({ url: ${safeMetaUrl}, env: {} })`)
      .replace(/\bimport\s*\(/g, '(async (u) => window.__ST_BRIDGE__)(')
      .replace(/^\s*import\s+([a-zA-Z0-9_$]+)\s*,\s*\{([\s\S]*?)\}\s*from\s+['"][^'"]+['"]\s*;?/gm, (_, defName, inner) => {
        const mapped = inner.replace(/\b([a-zA-Z0-9_$]+)\s+as\s+([a-zA-Z0-9_$]+)\b/g, '$1: $2');
        return `const ${defName} = window.__ST_BRIDGE__; const { ${mapped} } = window.__ST_BRIDGE__;`;
      })
      .replace(/^\s*import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+['"][^'"]+['"]\s*;?/gm, 'const $1 = window.__ST_BRIDGE__;')
      .replace(/^\s*import\s+\{([\s\S]*?)\}\s*from\s+['"][^'"]+['"]\s*;?/gm, (_, inner) => {
        const mapped = inner.replace(/\b([a-zA-Z0-9_$]+)\s+as\s+([a-zA-Z0-9_$]+)\b/g, '$1: $2');
        return `const { ${mapped} } = window.__ST_BRIDGE__;`;
      })
      .replace(/^\s*import\s+([a-zA-Z0-9_$]+)\s+from\s+['"][^'"]+['"]\s*;?/gm, 'const $1 = window.__ST_BRIDGE__;')
      .replace(/^\s*import\s+['"][^'"]+['"]\s*;?/gm, '')
      .replace(/^\s*export\s+default\s+/gm, '')
      .replace(/^\s*export\s+\{[^}]*\}\s*;?/gm, '')
      .replace(/^\s*export\s+/gm, '')
      // Prevent helper scripts (such as Gourmet handbook) from auto-pausing playing music when opening the panel or scanning floors without a new STATUS tag
      .replace(
        /if\s*\(\s*!target\s*\)\s*\{\s*if\s*\(\s*!audio\.paused\s*\)\s*audio\.pause\(\)\s*;\s*statusMusicUrl\s*=\s*['"]['"]\s*;\s*statusMusicMessageId\s*=\s*null\s*;\s*statusMusicInitialized\s*=\s*true\s*;\s*return\s*;\s*\}/g,
        'if (!target) { statusMusicInitialized = true; updateMusicSettingsUI(); return; }'
      )
      // Allow ST-BaiBai-Book auto-summarization to summarize the latest floor even if earlier history has unsummarized gaps
      .replace(
        'if(o.length>1){console.log("[柏宝书] 多个摘要缺口,停止自动补摘,交由用户手动处理:",o);return}const i=Ox(s,e);if(i<0)return;const a=ni(s).find(c=>c<=i);',
        'const i=Ox(s,e);if(i<0)return;const _uns=ni(s).filter(c=>c<=i);const a=_uns.length?_uns[_uns.length-1]:void 0;'
      )
      .replace(
        'if(l.length<1)return nr(o),!1;',
        'if(l.length>=0)return nr(o),!1;'
      )
      .replace(
        'n.CHARACTER_MESSAGE_RENDERED&&t.on(n.CHARACTER_MESSAGE_RENDERED,()=>xt())',
        'n.CHARACTER_MESSAGE_RENDERED&&t.on(n.CHARACTER_MESSAGE_RENDERED,()=>{xt();setTimeout(()=>nr(!1),180)})'
      );
  }

  function extractEmbeddedHtmlFromPluginCode(codeStr) {
    const raw = String(codeStr || '');
    if (!raw) return '';
    const chunks = [];
    const backtickMatches = raw.matchAll(/`([\s\S]*?)`/g);
    for (const m of backtickMatches) {
      const inner = (m[1] || '').trim();
      if (inner.length > 35 && !isHostAppHtmlFallback(inner) && /<(?:div|section|form|table|style|button|input|select|details|header|main)\b/i.test(inner) && /<\/(?:div|section|form|table|style|button|select|details|header|main)>/i.test(inner)) {
        chunks.push(inner);
      }
    }
    return chunks.join('\n');
  }

  function executeUserPluginScript(plugin, execOpts = {}) {
    if (!plugin || !plugin.enabled) return;
    const ownerCardId = execOpts && execOpts.ownerCardId ? String(execOpts.ownerCardId) : null;
    ensurePersistentExtensionContainers();
    if (!plugin.code && plugin.content) {
      plugin.code = plugin.content;
    }
    if (isBurntChickenWingsPlugin(plugin)) {
      plugin.uiHtml = '';
      if (window.__presetAtelier && document.getElementById('pa-root') && document.getElementById('pa-menu-entry') && !execOpts.forceRerun) {
        return;
      }
    }
    if (isBookExcerptPlugin(plugin)) {
      plugin.uiHtml = '';
      if (window.BookExcerpt && document.getElementById('be-menu-entry') && !execOpts.forceRerun) {
        return;
      }
    }
    if (isBaiBaiImagePlugin(plugin)) {
      plugin.repoBaseUrl = 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Image/main';
      plugin.jsEntryPath = 'dist/index.js';
      if ((!plugin.code || !String(plugin.code).includes('bbi-app-host')) && !baiBaiUpgradeInFlight) {
        baiBaiUpgradeInFlight = true;
        fetch('https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Image/main/dist/index.js')
          .then(r => (r.ok ? r.text() : ''))
          .then(async jsTxt => {
            if (jsTxt && jsTxt.includes('bbi-app-host')) {
              plugin.code = jsTxt;
              await saveTavernStore();
              executeUserPluginScript(plugin);
            }
          })
          .catch(() => {})
          .finally(() => { baiBaiUpgradeInFlight = false; });
        return;
      }
      if (document.getElementById('bbi-app-host') && document.getElementById('bbi-menu-item')) {
        syncBaiBaiShadowDomCss();
        return;
      }
    }
    if (isBaiBaiBookPlugin(plugin)) {
      plugin.repoBaseUrl = 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Book/main';
      plugin.jsEntryPath = 'dist/index.js';
      if ((!plugin.code || !String(plugin.code).includes('bbs-app-host')) && !baiBaiBookUpgradeInFlight) {
        baiBaiBookUpgradeInFlight = true;
        fetch('https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Book/main/dist/index.js')
          .then(r => (r.ok ? r.text() : ''))
          .then(async jsTxt => {
            if (jsTxt && jsTxt.includes('bbs-app-host')) {
              plugin.code = jsTxt;
              await saveTavernStore();
              executeUserPluginScript(plugin);
            }
          })
          .catch(() => {})
          .finally(() => { baiBaiBookUpgradeInFlight = false; });
        return;
      }
      const existingBbsHost = document.getElementById('bbs-app-host');
      if (existingBbsHost && document.getElementById('bbs-menu-item') && existingBbsHost.getAttribute('data-bbs-auto-patched') === '1') {
        syncBaiBaiShadowDomCss();
        return;
      }
      if (existingBbsHost && existingBbsHost.getAttribute('data-bbs-auto-patched') !== '1') {
        try { existingBbsHost.remove(); } catch (_) {}
        try { document.getElementById('bbs-menu-item')?.remove(); } catch (_) {}
      }
    }
    const codeStr = String(plugin.code || plugin.content || '').trim();
    if (!codeStr) return;

    if (!isBurntChickenWingsPlugin(plugin) && !isBookExcerptPlugin(plugin) && (!plugin.uiHtml || isHostAppHtmlFallback(plugin.uiHtml))) {
      const extracted = extractEmbeddedHtmlFromPluginCode(codeStr);
      if (extracted && !isHostAppHtmlFallback(extracted)) plugin.uiHtml = extracted;
    }

    // If the plugin code is pure HTML or a settings template, mount it into #extensions_settings
    if (/^(?:<!DOCTYPE\s+html|<html\b|<div\b|<section\b|<style\b)/i.test(codeStr) && !/<script[\s>]/i.test(codeStr)) {
      if (isHostAppHtmlFallback(codeStr)) return;
      if (persistentExtSettingsEl && !persistentExtSettingsEl.querySelector(`[data-plugin-mount="${plugin.id}"]`)) {
        const wrap = document.createElement('div');
        wrap.setAttribute('data-plugin-mount', plugin.id);
        wrap.className = 'tavern-section-card';
        wrap.innerHTML = `<div class="tavern-section-label"><span>${escapeHtmlSimple(plugin.name)}</span></div>` + codeStr;
        persistentExtSettingsEl.appendChild(wrap);
      }
      return;
    }

    const effectiveEventSource = ownerCardId ? {
      on(evt, cb) {
        if (!evt || typeof cb !== 'function') return;
        const wrappedCb = async (...args) => {
          if (getActiveCard()?.id !== ownerCardId) return;
          return await cb(...args);
        };
        tavernEventSource.on(evt, wrappedCb);
      },
      off(evt, cb) {
        tavernEventSource.off(evt, cb);
      },
      emit(evt, ...args) {
        return tavernEventSource.emit(evt, ...args);
      }
    } : tavernEventSource;

    const effectiveGetContext = ownerCardId ? () => {
      const ctx = buildSillyTavernContextObject();
      ctx.eventSource = effectiveEventSource;
      return ctx;
    } : buildSillyTavernContextObject;

    const effectiveSillyTavern = ownerCardId ? {
      getContext: effectiveGetContext
    } : window.SillyTavern;

    try {
      const transformedCode = transpilePluginImports(codeStr, plugin);
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const runner = new AsyncFunction(
        'SillyTavern',
        'TavernHelper',
        'getContext',
        'eventSource',
        'event_types',
        'extension_prompt_types',
        'extension_settings',
        'setExtensionPrompt',
        'triggerSlash',
        'executeSlashCommands',
        'toastr',
        'jQuery',
        '$',
        transformedCode
      );
      runner(
        effectiveSillyTavern,
        window.TavernHelper,
        effectiveGetContext,
        effectiveEventSource,
        TAVERN_EVENT_TYPES,
        TAVERN_EXT_PROMPT_TYPES,
        tavernState.extensionSettings,
        setExtensionPrompt,
        executeTavernSlashCommand,
        executeTavernSlashCommand,
        window.toastr,
        window.jQuery,
        window.$
      ).then(() => {
        if (isBaiBaiBookPlugin(plugin)) {
          const mountedBbs = document.getElementById('bbs-app-host');
          if (mountedBbs) mountedBbs.setAttribute('data-bbs-auto-patched', '1');
        }
        if (isBaiBaiPlugin(plugin)) {
          syncBaiBaiShadowDomCss();
          setTimeout(syncBaiBaiShadowDomCss, 120);
          setTimeout(syncBaiBaiShadowDomCss, 500);
        }
      }).catch(err => {
        console.warn('Async plugin script warning:', plugin.name, err);
      });
    } catch (err) {
      console.error('Plugin script execution error:', plugin.name, err);
    }
  }

  // ============================================================================
  // 6. Binary PNG Character Card Parser & Auto-Extractor
  // ============================================================================
  function decodeLatin1ToUtf8(latin1Str) {
    try {
      const cleaned = String(latin1Str).replace(/\s+/g, '');
      const binary = atob(cleaned);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (err) {
      console.error('Base64 UTF-8 decode error:', err);
      return null;
    }
  }

  async function inflateZlibBytes(compressedBytes) {
    if (typeof DecompressionStream === 'undefined') return null;
    for (const fmt of ['deflate', 'deflate-raw']) {
      try {
        const ds = new DecompressionStream(fmt);
        const writer = ds.writable.getWriter();
        writer.write(compressedBytes);
        writer.close();
        const outBuf = await new Response(ds.readable).arrayBuffer();
        return new Uint8Array(outBuf);
      } catch (_) {}
    }
    return null;
  }

  async function extractCharacterJsonFromPngBuffer(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
      throw new Error('不是有效的PNG图片文件');
    }

    let offset = 8;
    const chunks = {};
    const asciiDecoder = new TextDecoder('iso-8859-1');
    const utf8Decoder = new TextDecoder('utf-8');

    while (offset + 8 <= bytes.length) {
      const length = (
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]
      ) >>> 0;
      const type = asciiDecoder.decode(bytes.subarray(offset + 4, offset + 8));
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > bytes.length) break;

      const chunkData = bytes.subarray(dataStart, dataEnd);

      if (type === 'tEXt') {
        let nullIdx = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIdx = i;
            break;
          }
        }
        if (nullIdx > 0) {
          const keyword = asciiDecoder.decode(chunkData.subarray(0, nullIdx)).toLowerCase();
          const textVal = asciiDecoder.decode(chunkData.subarray(nullIdx + 1));
          chunks[keyword] = textVal;
        }
      } else if (type === 'zTXt') {
        let nullIdx = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIdx = i;
            break;
          }
        }
        if (nullIdx > 0 && nullIdx + 2 < chunkData.length) {
          const keyword = asciiDecoder.decode(chunkData.subarray(0, nullIdx)).toLowerCase();
          const compressed = chunkData.subarray(nullIdx + 2);
          const inflated = await inflateZlibBytes(compressed);
          if (inflated) {
            chunks[keyword] = utf8Decoder.decode(inflated);
          }
        }
      } else if (type === 'iTXt') {
        let nullIdx = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIdx = i;
            break;
          }
        }
        if (nullIdx > 0) {
          const keyword = asciiDecoder.decode(chunkData.subarray(0, nullIdx)).toLowerCase();
          const compFlag = chunkData[nullIdx + 1];
          let pos = nullIdx + 3;
          while (pos < chunkData.length && chunkData[pos] !== 0) pos++;
          pos++;
          while (pos < chunkData.length && chunkData[pos] !== 0) pos++;
          pos++;
          if (pos < chunkData.length) {
            const payload = chunkData.subarray(pos);
            if (compFlag === 1) {
              const inflated = await inflateZlibBytes(payload);
              if (inflated) chunks[keyword] = utf8Decoder.decode(inflated);
            } else {
              chunks[keyword] = utf8Decoder.decode(payload);
            }
          }
        }
      }

      if (type === 'IEND') break;
      offset = dataEnd + 4;
    }

    const rawPayload = chunks['ccv3'] || chunks['chara'];
    if (!rawPayload) {
      throw new Error('该PNG图片中未检测到ccv3或chara角色卡元数据块');
    }

    const trimmed = rawPayload.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    const decodedJson = decodeLatin1ToUtf8(trimmed);
    if (!decodedJson) {
      throw new Error('角色卡Base64数据解码失败');
    }
    return JSON.parse(decodedJson);
  }

  function normalizeRegexList(rawList, scopeName = 'card') {
    if (!Array.isArray(rawList)) return [];
    const normalized = rawList.map((item, idx) => ({
      id: item.id || ('rx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 6)),
      scriptName: item.scriptName || item.name || ('正则脚本 ' + (idx + 1)),
      findRegex: item.findRegex || item.regex || '',
      replaceString: item.replaceString !== undefined ? String(item.replaceString) : (item.replacement !== undefined ? String(item.replacement) : ''),
      trimStrings: Array.isArray(item.trimStrings) ? item.trimStrings : [],
      placement: Array.isArray(item.placement) ? item.placement : [1, 2],
      disabled: Boolean(item.disabled),
      markdownOnly: item.markdownOnly !== undefined ? Boolean(item.markdownOnly) : true,
      promptOnly: Boolean(item.promptOnly),
      runOnEdit: item.runOnEdit !== undefined ? Boolean(item.runOnEdit) : true,
      substituteRegex: Number(item.substituteRegex) || 0,
      minDepth: item.minDepth ?? null,
      maxDepth: item.maxDepth ?? null,
      scope: scopeName
    }));

    // Auto-pair 复古笔记1 and 复古笔记2 so unclosed tags never break rendering
    const note1 = normalized.find(r => String(r.scriptName).includes('复古笔记1') && !r.disabled);
    const note2 = normalized.find(r => String(r.scriptName).includes('复古笔记2'));
    if (note1 && note2 && note2.disabled) {
      note2.disabled = false;
    }
    return normalized;
  }

  function normalizeWorldBookObject(rawBook, fallbackName = '导入世界书') {
    if (!rawBook || typeof rawBook !== 'object') return null;
    const entriesArr = [];
    const rawEntries = rawBook.entries;
    if (Array.isArray(rawEntries)) {
      rawEntries.forEach((e, i) => entriesArr.push(normalizeSingleWorldEntry(e, i)));
    } else if (rawEntries && typeof rawEntries === 'object') {
      Object.keys(rawEntries).forEach((k, i) => {
        entriesArr.push(normalizeSingleWorldEntry(rawEntries[k], i));
      });
    }
    entriesArr.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    return {
      id: rawBook.id || ('wb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
      name: rawBook.name || fallbackName,
      enabled: rawBook.enabled !== undefined ? Boolean(rawBook.enabled) : true,
      scanDepth: Number(rawBook.scanDepth ?? rawBook.scan_depth ?? 4),
      tokenBudget: Number(rawBook.tokenBudget ?? rawBook.token_budget ?? 4096),
      recursiveScanning: rawBook.recursiveScanning !== undefined ? Boolean(rawBook.recursiveScanning) : Boolean(rawBook.recursive_scanning ?? true),
      entries: entriesArr
    };
  }

  function normalizeSingleWorldEntry(raw, idx = 0) {
    const ext = raw.extensions || {};
    const keys = Array.isArray(raw.key)
      ? raw.key
      : Array.isArray(raw.keys)
        ? raw.keys
        : typeof raw.key === 'string'
          ? raw.key.split(',').map(s => s.trim()).filter(Boolean)
          : [];
    const secondaryKeys = Array.isArray(raw.keysecondary)
      ? raw.keysecondary
      : Array.isArray(raw.secondary_keys)
        ? raw.secondary_keys
        : typeof raw.keysecondary === 'string'
          ? raw.keysecondary.split(',').map(s => s.trim()).filter(Boolean)
          : [];

    return {
      uid: raw.uid !== undefined ? raw.uid : (raw.id !== undefined ? raw.id : idx),
      comment: raw.comment || raw.name || ('词条 #' + idx),
      content: raw.content || '',
      keys,
      secondaryKeys,
      constant: Boolean(raw.constant),
      vectorized: Boolean(raw.vectorized),
      disable: raw.disable !== undefined ? Boolean(raw.disable) : (raw.enabled !== undefined ? !raw.enabled : false),
      selective: raw.selective !== undefined ? Boolean(raw.selective) : true,
      selectiveLogic: Number(raw.selectiveLogic ?? ext.selectiveLogic ?? 0),
      order: Number(raw.order ?? raw.insertion_order ?? 100),
      position: Number(raw.position ?? ext.position ?? 0),
      depth: Number(raw.depth ?? ext.depth ?? 4),
      role: Number(raw.role ?? ext.role ?? 0),
      probability: Number(raw.probability ?? ext.probability ?? 100),
      useProbability: raw.useProbability !== undefined ? Boolean(raw.useProbability) : true,
      excludeRecursion: Boolean(raw.excludeRecursion ?? ext.exclude_recursion),
      preventRecursion: Boolean(raw.preventRecursion ?? ext.prevent_recursion),
      delayUntilRecursion: Boolean(raw.delayUntilRecursion ?? ext.delay_until_recursion),
      scanDepth: raw.scanDepth ?? ext.scan_depth ?? null,
      caseSensitive: Boolean(raw.caseSensitive ?? ext.case_sensitive),
      matchWholeWords: Boolean(raw.matchWholeWords ?? ext.match_whole_words),
      group: raw.group || ext.group || '',
      groupWeight: Number(raw.groupWeight ?? ext.group_weight ?? 100),
      sticky: Number(raw.sticky ?? ext.sticky ?? 0),
      cooldown: Number(raw.cooldown ?? ext.cooldown ?? 0),
      delay: Number(raw.delay ?? ext.delay ?? 0)
    };
  }

  function importCharacterCardFromRaw(rawJson, avatarUrl) {
    const data = (rawJson && typeof rawJson.data === 'object' && rawJson.data !== null) ? rawJson.data : rawJson;
    if (!data || typeof data !== 'object') {
      throw new Error('角色卡JSON结构无效');
    }
    const ext = data.extensions || (rawJson && rawJson.extensions) || {};
    const cardName = data.name || rawJson.name || '未命名角色';
    const cardId = 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    let extractedBookId = null;
    const rawCharBook = data.character_book || rawJson.character_book;
    if (rawCharBook && typeof rawCharBook === 'object') {
      const wb = normalizeWorldBookObject(rawCharBook, ext.world || (cardName + '世界书'));
      if (wb && wb.entries.length > 0) {
        wb.enabled = true;
        const existWbIdx = (tavernState.worldBooks || []).findIndex(b => b.name === wb.name);
        if (existWbIdx !== -1) {
          wb.id = tavernState.worldBooks[existWbIdx].id;
          tavernState.worldBooks[existWbIdx] = wb;
        } else {
          tavernState.worldBooks.unshift(wb);
        }
        extractedBookId = wb.id;
      }
    }

    const rawRegexes = ext.regex_scripts || data.regex_scripts || [];
    const normalizedCardRegexes = normalizeRegexList(rawRegexes, 'card');

    // Extract tavern_helper scripts embedded in the character card (supports both Array pair format and Object { scripts: [...] } format)
    const helperScripts = [];
    const pushRawHelperScript = (sc, idx) => {
      if (sc && typeof sc === 'object' && (sc.content || sc.code || sc.script)) {
        helperScripts.push({
          id: sc.id || ('helper_' + Date.now() + '_' + idx),
          name: String(sc.name || ('内嵌脚本 ' + (idx + 1))).trim(),
          content: sc.content || sc.code || sc.script || '',
          info: sc.info || '',
          enabled: sc.enabled !== false,
          buttons: Array.isArray(sc.button?.buttons)
            ? sc.button.buttons
            : (Array.isArray(sc.buttons) ? sc.buttons : [])
        });
      }
    };
    if (Array.isArray(ext.tavern_helper)) {
      ext.tavern_helper.forEach(pair => {
        if (Array.isArray(pair) && pair[0] === 'scripts' && Array.isArray(pair[1])) {
          pair[1].forEach((sc, idx) => pushRawHelperScript(sc, idx));
        }
      });
    } else if (ext.tavern_helper && typeof ext.tavern_helper === 'object') {
      if (Array.isArray(ext.tavern_helper.scripts)) {
        ext.tavern_helper.scripts.forEach((sc, idx) => pushRawHelperScript(sc, idx));
      } else if (ext.tavern_helper.scripts && typeof ext.tavern_helper.scripts === 'object') {
        Object.values(ext.tavern_helper.scripts).forEach((sc, idx) => pushRawHelperScript(sc, idx));
      }
    }
    if (Array.isArray(data.tavern_helper_scripts)) {
      data.tavern_helper_scripts.forEach((sc, idx) => pushRawHelperScript(sc, idx));
    }

    const altGreetings = Array.isArray(data.alternate_greetings)
      ? data.alternate_greetings.filter(g => typeof g === 'string' && g.trim().length > 0)
      : [];

    const depthPromptObj = ext.depth_prompt || {};
    const cardEmbeddedBg = String(ext.background || data.background || rawJson.background || '').trim();

    const newCard = {
      id: cardId,
      name: cardName,
      avatar: avatarUrl || data.avatar || DEFAULT_AVATAR_SVG,
      backgroundUrl: cardEmbeddedBg,
      description: data.description || rawJson.description || '',
      personality: data.personality || rawJson.personality || '',
      scenario: data.scenario || rawJson.scenario || '',
      first_mes: data.first_mes || rawJson.first_mes || '',
      mes_example: data.mes_example || rawJson.mes_example || '',
      creator_notes: data.creator_notes || data.creatorcomment || rawJson.creatorcomment || '',
      system_prompt: data.system_prompt || '',
      post_history_instructions: data.post_history_instructions || '',
      alternate_greetings: altGreetings,
      tags: Array.isArray(data.tags) ? data.tags : [],
      creator: data.creator || '',
      character_version: data.character_version || '1.0',
      talkativeness: Number(ext.talkativeness ?? data.talkativeness ?? 0.5),
      fav: Boolean(ext.fav || data.fav),
      depth_prompt_prompt: depthPromptObj.prompt || '',
      depth_prompt_depth: Number(depthPromptObj.depth ?? 4),
      depth_prompt_role: depthPromptObj.role || 'system',
      worldBookId: extractedBookId,
      regexScripts: normalizedCardRegexes,
      helperScripts
    };

    const existingIdx = tavernState.cards.findIndex(c => c.name === newCard.name && c.id !== 'card_default_guide' && c.id !== 'card_default_starter');
    if (existingIdx !== -1) {
      newCard.id = tavernState.cards[existingIdx].id;
      tavernState.cards[existingIdx] = newCard;
    } else {
      tavernState.cards.unshift(newCard);
    }

    tavernState.activeCardId = newCard.id;
    if ((tavernState.background?.syncWithCard || tavernState.background?.syncCardAvatarAsBg) && newCard.avatar && !newCard.avatar.startsWith('data:image/svg')) {
      tavernState.background.url = newCard.backgroundUrl || newCard.avatar;
    }
    const existingSess = tavernState.chatsByCardId[newCard.id];
    if (!existingSess || !Array.isArray(existingSess.messages) || existingSess.messages.length <= 1) {
      const initSess = buildInitialSessionForCard(newCard);
      tavernState.chatsByCardId[newCard.id] = initSess;
      if (!Array.isArray(tavernState.chatArchivesByCardId[newCard.id]) || tavernState.chatArchivesByCardId[newCard.id].length === 0) {
        tavernState.chatArchivesByCardId[newCard.id] = [initSess];
      }
    }

    return {
      card: newCard,
      worldBookCount: extractedBookId ? 1 : 0,
      regexCount: normalizedCardRegexes.filter(r => !r.disabled).length,
      helperCount: helperScripts.length,
      helperScriptCount: helperScripts.length,
      greetingCount: 1 + altGreetings.length
    };
  }

  function enhanceFloatingHelperWidgets() {
    const ballIds = ['gourmet-fixed-ball-ui', 'adv-codex-toggle'];
    ballIds.forEach(id => {
      const ballEl = document.getElementById(id);
      if (!ballEl) return;
      ballEl.style.touchAction = 'none';
      ballEl.style.userSelect = 'none';
      ballEl.style.webkitUserSelect = 'none';
      ballEl.querySelectorAll('img').forEach(img => {
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';
        img.style.webkitUserDrag = 'none';
        img.setAttribute('draggable', 'false');
      });
    });

    const panelIds = ['gourmet-fixed-panel-ui', 'adv-codex-panel'];
    panelIds.forEach(id => {
      const panelEl = document.getElementById(id);
      if (!panelEl || panelEl._tavernDragEnhanced) return;
      panelEl._tavernDragEnhanced = true;

      let isDragging = false;
      let hasMoved = false;
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      let startCenterX = 0;
      let startTopY = 0;
      let useTransformCenter = true;

      const canStartPanelDrag = (target) => {
        if (!target || !target.closest) return false;
        if (target.closest('#gourmet-main-close-btn, input, select, textarea, button, #gourmet-scale-minus, #gourmet-scale-plus, #gourmet-theme-toggle, .gourmet-settings-row.clickable, .achieve-item')) {
          return false;
        }
        return Boolean(
          target.closest('.gourmet-tabs-bar') ||
          target.closest('.gourmet-bottom-bar') ||
          target.classList.contains('gourmet-main-frame') ||
          target.classList.contains('gourmet-panel-container') ||
          target === panelEl
        );
      };

      const beginDrag = (clientX, clientY) => {
        const rect = panelEl.getBoundingClientRect();
        const tf = String(panelEl.style.transform || getComputedStyle(panelEl).transform || '');
        useTransformCenter = tf.includes('translateX(-50%)') || panelEl.style.left === '50%';
        startX = clientX;
        startY = clientY;
        startCenterX = useTransformCenter ? (rect.left + rect.width / 2) : rect.left;
        startTopY = rect.top;
        isDragging = true;
        hasMoved = false;
      };

      const moveDrag = (clientX, clientY, ev) => {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        if (!hasMoved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        hasMoved = true;
        if (ev && ev.cancelable) ev.preventDefault();
        const vw = window.innerWidth || 360;
        const vh = window.innerHeight || 640;
        const nextX = Math.max(24, Math.min(vw - 24, startCenterX + dx));
        const nextY = Math.max(12, Math.min(vh - 60, startTopY + dy));
        panelEl.style.left = nextX + 'px';
        panelEl.style.top = nextY + 'px';
      };

      const endDrag = () => {
        if (hasMoved) {
          panelEl._suppressNextClickTs = Date.now();
        }
        isDragging = false;
        activePointerId = null;
      };

      panelEl.addEventListener('click', (e) => {
        if (panelEl._suppressNextClickTs && (Date.now() - panelEl._suppressNextClickTs) < 280) {
          e.stopPropagation();
          e.preventDefault();
          panelEl._suppressNextClickTs = 0;
        }
      }, true);

      panelEl.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        if (!canStartPanelDrag(e.target)) return;
        beginDrag(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      panelEl.addEventListener('touchmove', (e) => {
        if (!isDragging || !e.touches || e.touches.length !== 1) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
      }, { passive: false });

      panelEl.addEventListener('touchend', endDrag, { passive: true });
      panelEl.addEventListener('touchcancel', endDrag, { passive: true });

      panelEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        if (!canStartPanelDrag(e.target)) return;
        activePointerId = e.pointerId;
        beginDrag(e.clientX, e.clientY);
        try { panelEl.setPointerCapture(e.pointerId); } catch (_) {}
      });

      panelEl.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || !isDragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
        moveDrag(e.clientX, e.clientY, e);
      });

      panelEl.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') return;
        endDrag();
      });

      panelEl.addEventListener('pointercancel', (e) => {
        if (e.pointerType === 'touch') return;
        endDrag();
      });
    });
  }

  let lastExecutedHelperCardId = null;
  function cardHasFloatingWidgetScript(card) {
    if (!card) return false;
    const scripts = Array.isArray(card.helperScripts) ? card.helperScripts : [];
    const hasEnabledScript = scripts.some(hs => hs && hs.enabled !== false && (hs.content || hs.code));
    if (hasEnabledScript) return true;
    const isGourmetCard = String(card.name || '').includes('美食物语') ||
      (Array.isArray(card.regexScripts) && card.regexScripts.some(r => String(r.findRegex || '').includes('gourmet_journal')));
    return isGourmetCard;
  }

  function syncCardScopedFloatingWidgets() {
    const activeCard = getActiveCard();
    if (!activeCard || !cardHasFloatingWidgetScript(activeCard)) {
      document.querySelectorAll('[id^="gourmet-fixed-"], #adv-codex-panel, #adv-codex-toggle').forEach(el => el.remove());
    }
  }

  function executeCardHelperScripts(cardObj, forceRun = false) {
    const card = cardObj || getActiveCard();
    if (!card) return;
    const scripts = (Array.isArray(card.helperScripts) ? card.helperScripts : []).filter(hs => hs && hs.enabled !== false && (hs.content || hs.code));
    if (scripts.length === 0) {
      lastExecutedHelperCardId = card.id;
      syncCardScopedFloatingWidgets();
      return;
    }
    const ballInDom = document.getElementById('gourmet-fixed-ball-ui') || document.getElementById('adv-codex-toggle');
    if (!forceRun && lastExecutedHelperCardId === card.id && ballInDom) {
      enhanceFloatingHelperWidgets();
      return;
    }
    // Remove floating widgets from previously active cards when switching cards
    document.querySelectorAll('[id^="gourmet-fixed-"], #adv-codex-panel, #adv-codex-toggle').forEach(el => el.remove());
    lastExecutedHelperCardId = card.id;
    scripts.forEach(hs => {
      executeUserPluginScript({
        id: hs.id || ('card_helper_' + card.id),
        name: hs.name || '角色内嵌脚本',
        enabled: true,
        code: hs.content || hs.code,
        buttons: hs.buttons || []
      }, { ownerCardId: card.id });
    });
    setTimeout(() => {
      syncCardScopedFloatingWidgets();
      enhanceFloatingHelperWidgets();
    }, 30);
    setTimeout(() => {
      syncCardScopedFloatingWidgets();
      enhanceFloatingHelperWidgets();
    }, 180);
  }

  let gourmetBackfillInFlight = false;
  async function ensureCardEmbeddedScriptsLoaded(cardObj) {
    const card = cardObj || getActiveCard();
    if (!card || gourmetBackfillInFlight) return;
    if (Array.isArray(card.helperScripts) && card.helperScripts.length > 0) return;
    const isGourmetCard = String(card.name || '').includes('美食物语') ||
      (Array.isArray(card.regexScripts) && card.regexScripts.some(r => String(r.findRegex || '').includes('gourmet_journal')));
    if (!isGourmetCard) return;
    gourmetBackfillInFlight = true;
    try {
      let buf = null;
      try {
        const res = await fetch('/assets/aistudio/2_1_cb1723ff.png');
        if (res.ok) buf = await res.arrayBuffer();
      } catch (_) {}
      if (!buf && card.avatar) {
        let avUrl = card.avatar;
        if (String(avUrl).startsWith('vault://') && typeof window.resolveVaultRefToUrl === 'function') {
          avUrl = await window.resolveVaultRefToUrl(avUrl);
        }
        if (avUrl && !String(avUrl).startsWith('data:image/svg')) {
          const avRes = await fetch(avUrl);
          if (avRes.ok) buf = await avRes.arrayBuffer();
        }
      }
      if (!buf) return;
      const rawJson = await extractCharacterJsonFromPngBuffer(buf);
      const data = (rawJson && rawJson.data && typeof rawJson.data === 'object') ? rawJson.data : rawJson;
      const ext = (data && data.extensions) || (rawJson && rawJson.extensions) || {};
      const th = ext.tavern_helper;
      const extracted = [];
      const pushExtracted = (sc, idx) => {
        if (sc && (sc.content || sc.code || sc.script)) {
          extracted.push({
            id: sc.id || ('helper_gourmet_' + idx),
            name: String(sc.name || '冒险与美食图鉴').trim(),
            content: sc.content || sc.code || sc.script,
            info: sc.info || '',
            enabled: sc.enabled !== false,
            buttons: Array.isArray(sc.button?.buttons) ? sc.button.buttons : (Array.isArray(sc.buttons) ? sc.buttons : [])
          });
        }
      };
      if (Array.isArray(th)) {
        th.forEach(pair => {
          if (Array.isArray(pair) && pair[0] === 'scripts' && Array.isArray(pair[1])) {
            pair[1].forEach((sc, idx) => pushExtracted(sc, idx));
          }
        });
      } else if (th && typeof th === 'object' && Array.isArray(th.scripts)) {
        th.scripts.forEach((sc, idx) => pushExtracted(sc, idx));
      }
      if (extracted.length > 0) {
        card.helperScripts = extracted;
        await saveTavernStore();
        renderTavernShell();
        executeCardHelperScripts(card, true);
      }
    } catch (_) {
    } finally {
      gourmetBackfillInFlight = false;
    }
  }

  function extractPresetRegexScripts(rawJson) {
    if (!rawJson || typeof rawJson !== 'object') return [];
    const ext = rawJson.extensions || {};
    const sp = ext.SPreset || rawJson.SPreset || {};
    const candidates = [
      rawJson.regex_scripts,
      rawJson.regexScripts,
      ext.regex_scripts,
      ext.regexScripts,
      ext.preset_regexes,
      sp.RegexBinding && sp.RegexBinding.regexes,
      sp.regexes,
      sp.regex_scripts,
      ext.RegexBinding && ext.RegexBinding.regexes
    ];
    if (Array.isArray(ext.tavern_helper)) {
      ext.tavern_helper.forEach(pair => {
        if (Array.isArray(pair) && (pair[0] === 'regex_scripts' || pair[0] === 'regexes') && Array.isArray(pair[1])) {
          candidates.push(pair[1]);
        }
      });
    } else if (ext.tavern_helper && typeof ext.tavern_helper === 'object') {
      if (Array.isArray(ext.tavern_helper.regex_scripts)) candidates.push(ext.tavern_helper.regex_scripts);
      if (Array.isArray(ext.tavern_helper.regexes)) candidates.push(ext.tavern_helper.regexes);
    }
    const rawList = [];
    const seenIds = new Set();
    candidates.forEach(arr => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (!item || typeof item !== 'object') return;
        if (!item.findRegex && !item.regex && !item.scriptName && !item.name) return;
        const key = item.id || ((item.scriptName || item.name || '') + '::' + (item.findRegex || item.regex || ''));
        if (seenIds.has(key)) return;
        seenIds.add(key);
        rawList.push(item);
      });
    });
    return normalizeRegexList(rawList, 'preset');
  }

  function parsePresetFromRaw(rawJson, fallbackName = '导入预设') {
    if (!rawJson || typeof rawJson !== 'object') {
      throw new Error('预设JSON无效');
    }
    const promptItems = [];
    const rawPrompts = Array.isArray(rawJson.prompts) ? rawJson.prompts : [];
    const promptMap = {};
    rawPrompts.forEach(p => {
      if (p && p.identifier) promptMap[p.identifier] = p;
    });

    let orderList = [];
    if (Array.isArray(rawJson.prompt_order) && rawJson.prompt_order.length > 0) {
      if (rawJson.prompt_order[0] && rawJson.prompt_order[0].identifier) {
        // Direct flat prompt_order array
        orderList = rawJson.prompt_order;
      } else {
        // Official SillyTavern PromptManager always prefers character_id === 100001 (dummyId = 100001) first
        const validGroups = rawJson.prompt_order.filter(o => o && Array.isArray(o.order) && o.order.length > 0);
        if (validGroups.length > 0) {
          validGroups.sort((a, b) => {
            const aPref = Number(a.character_id) === 100001 ? 2 : (Number(a.character_id) === 100000 ? 1 : 0);
            const bPref = Number(b.character_id) === 100001 ? 2 : (Number(b.character_id) === 100000 ? 1 : 0);
            if (bPref !== aPref) return bPref - aPref;
            return b.order.length - a.order.length;
          });
          orderList = validGroups[0].order;
        }
      }
    }

    const normalizeInjPos = (val) => {
      if (val === 1 || val === '1') return 1;
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower === 'in_chat' || lower === 'in-chat' || lower === 'depth' || lower === '@d') return 1;
      }
      return 0;
    };

    const structuralMarkers = ['worldInfoBefore', 'worldInfoAfter', 'personaDescription', 'charDescription', 'charPersonality', 'scenario', 'dialogueExamples', 'chatHistory'];

    const usedIds = new Set();
    orderList.forEach((item, seqIdx) => {
      if (!item || !item.identifier) return;
      if (usedIds.has(item.identifier)) return;
      usedIds.add(item.identifier);
      const base = promptMap[item.identifier] || {};
      const resolvedContent = base.content !== undefined ? base.content : (item.content || '');
      const isMarker = structuralMarkers.includes(item.identifier) || (Boolean(base.marker) && !String(resolvedContent || '').trim() && !['main', 'jailbreak', 'nsfw', 'enhanceDefinitions'].includes(item.identifier));
      promptItems.push({
        identifier: item.identifier,
        name: base.name || item.name || item.identifier,
        enabled: item.enabled !== undefined ? Boolean(item.enabled) : Boolean(base.enabled ?? true),
        role: base.role || item.role || 'system',
        content: resolvedContent,
        marker: isMarker,
        injection_position: normalizeInjPos(base.injection_position ?? item.injection_position ?? 0),
        injection_depth: Number(base.injection_depth ?? item.injection_depth ?? 4),
        injection_order: Number(base.injection_order ?? item.injection_order ?? (100 + seqIdx)),
        forbid_overrides: Boolean(base.forbid_overrides ?? item.forbid_overrides)
      });
    });

    // Preserve all prompts from rawPrompts even if not referenced in orderList (keep unreferenced prompts disabled by default, or enabled if orderList was empty)
    rawPrompts.forEach((p, rawIdx) => {
      if (!p || !p.identifier || usedIds.has(p.identifier)) return;
      usedIds.add(p.identifier);
      const resolvedContent = p.content || '';
      const isMarker = structuralMarkers.includes(p.identifier) || (Boolean(p.marker) && !String(resolvedContent || '').trim() && !['main', 'jailbreak', 'nsfw', 'enhanceDefinitions'].includes(p.identifier));
      promptItems.push({
        identifier: p.identifier,
        name: p.name || p.identifier,
        enabled: orderList.length === 0 ? Boolean(p.enabled ?? true) : false,
        role: p.role || 'system',
        content: resolvedContent,
        marker: isMarker,
        injection_position: normalizeInjPos(p.injection_position ?? 0),
        injection_depth: Number(p.injection_depth ?? 4),
        injection_order: Number(p.injection_order ?? (100 + rawIdx)),
        forbid_overrides: Boolean(p.forbid_overrides)
      });
    });

    if (promptItems.length === 0) {
      promptItems.push(...getDefaultPromptOrderItems());
    } else if (!promptItems.some(p => p.identifier === 'chatHistory')) {
      // Ensure chatHistory marker exists so conversation messages are always included
      const jbIdx = promptItems.findIndex(p => p.identifier === 'jailbreak');
      const chatHistoryItem = {
        identifier: 'chatHistory',
        name: '聊天历史记录 Chat History',
        role: 'system',
        enabled: true,
        marker: true,
        injection_position: 0,
        injection_depth: 4,
        injection_order: 100,
        content: ''
      };
      if (jbIdx >= 0) {
        promptItems.splice(jbIdx, 0, chatHistoryItem);
      } else {
        promptItems.push(chatHistoryItem);
      }
    } else {
      const chItem = promptItems.find(p => p.identifier === 'chatHistory');
      if (chItem) chItem.enabled = true;
    }

    const presetRegexScripts = extractPresetRegexScripts(rawJson);

    const parsedPresetObj = {
      id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: rawJson.name || fallbackName.replace(/\.json$/i, ''),
      temperature: Number(rawJson.temperature ?? 1.0),
      frequency_penalty: Number(rawJson.frequency_penalty ?? 0),
      presence_penalty: Number(rawJson.presence_penalty ?? 0),
      top_p: Number(rawJson.top_p ?? 1.0),
      top_k: Number(rawJson.top_k ?? 0),
      min_p: Number(rawJson.min_p ?? 0),
      typical_p: Number(rawJson.typical_p ?? 1),
      repetition_penalty: Number(rawJson.repetition_penalty ?? 1),
      openai_max_context: Number(rawJson.openai_max_context ?? 64000),
      openai_max_tokens: Number(rawJson.openai_max_tokens ?? 4096),
      seed: Number(rawJson.seed ?? -1),
      stream_openai: rawJson.stream_openai !== undefined ? Boolean(rawJson.stream_openai) : true,
      reasoning_effort: rawJson.reasoning_effort || 'medium',
      squash_system_messages: Boolean(rawJson.squash_system_messages),
      impersonation_prompt: rawJson.impersonation_prompt || tavernState.formatting.impersonationPrompt,
      new_chat_prompt: rawJson.new_chat_prompt || tavernState.formatting.newChatPrompt,
      continue_nudge_prompt: rawJson.continue_nudge_prompt || tavernState.formatting.continueNudgePrompt,
      wi_format: rawJson.wi_format || '{0}',
      scenario_format: rawJson.scenario_format || '{{scenario}}',
      personality_format: rawJson.personality_format || '{{personality}}',
      extensions: (rawJson.extensions && typeof rawJson.extensions === 'object') ? JSON.parse(JSON.stringify(rawJson.extensions)) : {},
      regexScripts: presetRegexScripts,
      prompts: promptItems
    };
    return ensurePresetHasPromptOrder(parsedPresetObj);
  }

  // ============================================================================
  // 7. Macro Replacer, Regex Engine & Scoped Theme CSS Engine
  // ============================================================================
  function replaceTavernMacros(rawText, cardObj) {
    if (!rawText) return '';
    const card = cardObj || getActiveCard();
    const preset = getActivePreset();
    const userName = getUserDisplayName();
    const charName = card ? card.name : '角色';
    const persona = getActivePersona();
    const sess = getActiveChatSession();
    const msgs = (sess && Array.isArray(sess.messages)) ? sess.messages : [];
    const lastMsg = msgs.length > 0 ? (msgs[msgs.length - 1].mes || '') : '';
    const lastUserMsgObj = [...msgs].reverse().find(m => m && m.is_user);
    const lastCharMsgObj = [...msgs].reverse().find(m => m && !m.is_user);
    const localVars = getChatVariablesStore();
    const globalVars = getGlobalVariablesStore();
    const now = new Date();

    return String(rawText)
      .replace(/\{\{\/\/[\s\S]*?\}\}/g, '')
      .replace(/\{\{\/\*[\s\S]*?\*\/\}\}/g, '')
      .replace(/\{\{setvar::([^:}]+)::([^}]*)\}\}/gi, (_, k, v) => {
        localVars[k.trim()] = v;
        return '';
      })
      .replace(/\{\{addvar::([^:}]+)::([^}]*)\}\}/gi, (_, k, v) => {
        const key = k.trim();
        const cur = Number(localVars[key]);
        const delta = Number(v);
        if (!Number.isNaN(cur) && !Number.isNaN(delta)) {
          localVars[key] = cur + delta;
        } else {
          localVars[key] = String(localVars[key] || '') + v;
        }
        return '';
      })
      .replace(/\{\{incvar::([^}]+)\}\}/gi, (_, k) => {
        const key = k.trim();
        localVars[key] = (Number(localVars[key]) || 0) + 1;
        return String(localVars[key]);
      })
      .replace(/\{\{decvar::([^}]+)\}\}/gi, (_, k) => {
        const key = k.trim();
        localVars[key] = (Number(localVars[key]) || 0) - 1;
        return String(localVars[key]);
      })
      .replace(/\{\{getvar::([^}]+)\}\}/gi, (_, k) => {
        const val = localVars[k.trim()];
        return val !== undefined && val !== null ? String(val) : '';
      })
      .replace(/\{\{setglobalvar::([^:}]+)::([^}]*)\}\}/gi, (_, k, v) => {
        globalVars[k.trim()] = v;
        return '';
      })
      .replace(/\{\{addglobalvar::([^:}]+)::([^}]*)\}\}/gi, (_, k, v) => {
        const key = k.trim();
        const cur = Number(globalVars[key]);
        const delta = Number(v);
        if (!Number.isNaN(cur) && !Number.isNaN(delta)) {
          globalVars[key] = cur + delta;
        } else {
          globalVars[key] = String(globalVars[key] || '') + v;
        }
        return '';
      })
      .replace(/\{\{getglobalvar::([^}]+)\}\}/gi, (_, k) => {
        const val = globalVars[k.trim()];
        return val !== undefined && val !== null ? String(val) : '';
      })
      .replace(/\{\{user\}\}/gi, userName)
      .replace(/\{\{char\}\}/gi, charName)
      .replace(/\{\{charIfNotGroup\}\}/gi, charName)
      .replace(/\{\{group\}\}/gi, '')
      .replace(/<USER>/g, userName)
      .replace(/<BOT>/g, charName)
      .replace(/\{\{persona\}\}/gi, persona ? (persona.description || '') : '')
      .replace(/\{\{description\}\}/gi, card ? (card.description || '') : '')
      .replace(/\{\{personality\}\}/gi, card ? (card.personality || '') : '')
      .replace(/\{\{scenario\}\}/gi, card ? (card.scenario || '') : '')
      .replace(/\{\{mesExamples\}\}/gi, card ? (card.mes_example || '') : '')
      .replace(/\{\{charPrompt\}\}/gi, card ? (card.system_prompt || '') : '')
      .replace(/\{\{charInstruction\}\}/gi, card ? (card.post_history_instructions || '') : '')
      .replace(/\{\{maxPrompt\}\}/gi, String(preset ? (preset.openai_max_context || 64000) : 64000))
      .replace(/\{\{idle_duration\}\}/gi, '刚刚')
      .replace(/\{\{lastGenerationType\}\}/gi, 'normal')
      .replace(/\{\{lastMessage\}\}/gi, lastMsg)
      .replace(/\{\{lastMessageId\}\}/gi, String(Math.max(0, msgs.length - 1)))
      .replace(/\{\{lastUserMessage\}\}/gi, lastUserMsgObj ? (lastUserMsgObj.mes || '') : '')
      .replace(/\{\{lastCharMessage\}\}/gi, lastCharMsgObj ? (lastCharMsgObj.mes || '') : '')
      .replace(/\{\{newline\}\}/gi, '\n')
      .replace(/\{\{trim\}\}/gi, '')
      .replace(/\{\{time\}\}/gi, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/\{\{date\}\}/gi, now.toLocaleDateString())
      .replace(/\{\{isodate\}\}/gi, now.toISOString().slice(0, 10))
      .replace(/\{\{isotime\}\}/gi, now.toTimeString().slice(0, 8))
      .replace(/\{\{weekday\}\}/gi, ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()])
      .replace(/\{\{roll:(\d+)d(\d+)\}\}/gi, (_, countStr, sidesStr) => {
        const c = Math.min(20, Math.max(1, parseInt(countStr, 10) || 1));
        const s = Math.max(2, parseInt(sidesStr, 10) || 100);
        let sum = 0;
        for (let i = 0; i < c; i++) sum += Math.floor(Math.random() * s) + 1;
        return String(sum);
      })
      .replace(/\{\{(?:random|pick):([^}]+)\}\}/gi, (_, listStr) => {
        const parts = listStr.split(',').map(s => s.trim()).filter(Boolean);
        return parts.length > 0 ? parts[Math.floor(Math.random() * parts.length)] : '';
      });
  }

  function parseFindRegexString(findRegexStr) {
    if (!findRegexStr || typeof findRegexStr !== 'string') return null;
    const trimmed = findRegexStr.trim();
    const slashMatch = trimmed.match(/^\/([\s\S]*)\/([gimsuy]*)$/);
    try {
      if (slashMatch) {
        return new RegExp(slashMatch[1], slashMatch[2] || 'g');
      }
      return new RegExp(trimmed, 'g');
    } catch (err) {
      console.warn('Invalid regex pattern:', findRegexStr, err);
      return null;
    }
  }

  function getActiveRegexScriptsForCard(cardObj) {
    const card = cardObj || getActiveCard();
    const preset = getActivePreset();
    const cardScripts = (card && Array.isArray(card.regexScripts)) ? card.regexScripts : [];
    const presetScripts = (preset && Array.isArray(preset.regexScripts)) ? preset.regexScripts : [];
    const globalScripts = Array.isArray(tavernState.globalRegexScripts) ? tavernState.globalRegexScripts : [];
    const extScripts = Array.isArray(tavernState.extensionSettings?.regex) ? tavernState.extensionSettings.regex : [];
    return [...cardScripts, ...presetScripts, ...globalScripts, ...extScripts].filter(s => s && !s.disabled && s.findRegex);
  }

  function applyTavernRegexPipeline(rawText, options = {}) {
    if (!rawText) return '';
    const {
      isUser = false,
      isPrompt = false,
      isChatFloor = false,
      isWorldInfo = false,
      depth = 0,
      card = getActiveCard()
    } = options;

    const targetPlacement = isWorldInfo ? 5 : (isUser ? 1 : 2);
    const scripts = getActiveRegexScriptsForCard(card);
    let output = replaceTavernMacros(String(rawText), card);

    // If formatting a system preset prompt or character definition (not a chat floor and not world info), only run macro replacement so display/chat regexes never corrupt system prompt templates
    if (isPrompt && !isChatFloor && !isWorldInfo) {
      return output;
    }

    for (const script of scripts) {
      if (isPrompt && !script.promptOnly && script.markdownOnly) continue;
      if (!isPrompt && script.promptOnly && !script.markdownOnly) continue;

      if (Array.isArray(script.placement) && script.placement.length > 0) {
        if (!script.placement.includes(targetPlacement)) continue;
      }
      const minD = (script.minDepth !== null && script.minDepth !== undefined && script.minDepth !== '') ? Number(script.minDepth) : null;
      const maxD = (script.maxDepth !== null && script.maxDepth !== undefined && script.maxDepth !== '') ? Number(script.maxDepth) : null;
      const isDefaultZeroPair = (minD === 0 || minD === null) && maxD === 0;
      if (isPrompt && !isDefaultZeroPair) {
        if (minD !== null && !Number.isNaN(minD) && minD > 0 && depth < minD) {
          continue;
        }
        if (maxD !== null && !Number.isNaN(maxD) && maxD > 0 && depth > maxD) {
          continue;
        }
      }

      let patternStr = script.findRegex;
      if (Number(script.substituteRegex) === 1) {
        patternStr = replaceTavernMacros(patternStr, card);
      }
      const rx = parseFindRegexString(patternStr);
      if (!rx) continue;

      const repStr = replaceTavernMacros(String(script.replaceString ?? ''), card);
      try {
        output = output.replace(rx, (...matchArgs) => {
          let replaced = repStr.replace(/\{\{\$match\}\}|\$&/g, matchArgs[0] || '');
          for (let g = 1; g < matchArgs.length - 2; g++) {
            const groupVal = matchArgs[g] !== undefined ? String(matchArgs[g]) : '';
            if (Array.isArray(script.trimStrings) && script.trimStrings.length > 0) {
              let trimmedVal = groupVal;
              script.trimStrings.forEach(t => {
                if (t) trimmedVal = trimmedVal.split(t).join('');
              });
              replaced = replaced.split('$' + g).join(trimmedVal);
            } else {
              replaced = replaced.split('$' + g).join(groupVal);
            }
          }
          if (!isPrompt && (/<script\b[\s\S]*?<\/script>/i.test(replaced) || /需要酒馆助手的前端渲染/i.test(replaced)) && !/<html\b/i.test(replaced) && !/<html\b/i.test(output)) {
            const cleanBlock = replaced
              .replace(/^\s*```(?:html|HTML|xml)?[ \t]*\r?\n?/i, '')
              .replace(/\r?\n?[ \t]*```\s*$/i, '')
              .trim();
            return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + cleanBlock + '</body></html>';
          }
          return replaced;
        });
      } catch (err) {
        console.warn('Regex execution warning:', script.scriptName, err);
      }
    }

    return output;
  }

  function buildSandboxIframeHtml(rawHtmlDoc, options = {}) {
    const isFullModal = Boolean(options && options.isModal);
    const isLastFloor = options && options.isLastFloor !== undefined ? Boolean(options.isLastFloor) : true;
    const allowAudioInFrame = isFullModal || isLastFloor;
    let cleaned = String(rawHtmlDoc || '')
      .replace(/<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi, '')
      .replace(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\)\s*;?/gi, '');

    if (!allowAudioInFrame) {
      cleaned = cleaned.replace(/<audio\b([^>]*?)\bautoplay\b([^>]*)>/gi, '<audio$1$2>');
    }

    if (!isFullModal) {
      cleaned = cleaned
        .replace(/min-height\s*:\s*100(?:d?vh|%)/gi, 'min-height:auto')
        .replace(/height\s*:\s*100(?:d?vh)/gi, 'height:auto');
    }

    const sandboxClampCss = `<style>
      html, body {
        margin: 0;
        padding: 0;
        height: auto !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: ${isFullModal ? 'auto' : 'hidden'} !important;
        box-sizing: border-box;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      body *, * {
        -webkit-touch-callout: none !important;
      }
      button, img, svg {
        -webkit-user-select: none !important;
        user-select: none !important;
      }
      div, span, p, li, td, th, dd, dt, font, b, i, em, strong, small, u, s, del, ins, mark, sub, sup, label, blockquote, pre, code, h1, h2, h3, h4, h5, h6, section, article, details, summary, q, cite, abbr, a, ruby, rb, rt, time, input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      .user-avatar, .user_avatar {
        background-image: var(--tavern-user-avatar-bg) !important;
        background-size: cover !important;
        background-position: center !important;
      }
      .char-avatar, .char_avatar {
        background-image: var(--tavern-char-avatar-bg) !important;
        background-size: cover !important;
        background-position: center !important;
      }
      #outerContainer, .gourmet-outer-container {
        overflow: hidden !important;
        overflow-x: hidden !important;
        overflow-y: hidden !important;
        padding-bottom: 10px !important;
        box-sizing: content-box !important;
      }
    </style>`;

    const bridgeScript = `<script>
(function(){
  var allowFrameAudio = ${allowAudioInFrame ? 'true' : 'false'};
  try {
    if (typeof HTMLMediaElement !== 'undefined') {
      var origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() {
        try {
          var parentActive = window.parent && typeof window.parent.__isTavernScreenActive === 'function'
            ? window.parent.__isTavernScreenActive()
            : true;
          if (!parentActive || !allowFrameAudio) {
            this.pause();
            return Promise.resolve();
          }
          if (window.parent && typeof window.parent.__registerTavernAudioInstance === 'function') {
            var ok = window.parent.__registerTavernAudioInstance(this, allowFrameAudio);
            if (!ok) {
              this.pause();
              return Promise.resolve();
            }
          }
        } catch (e) {}
        return origPlay.apply(this, arguments);
      };
    }
    if (typeof window.Audio === 'function') {
      var OrigIframeAudio = window.Audio;
      var WrappedIframeAudio = function() {
        var a = new (Function.prototype.bind.apply(OrigIframeAudio, [null].concat(Array.prototype.slice.call(arguments))))();
        try {
          if (!allowFrameAudio) {
            a.autoplay = false;
            a.muted = true;
          }
          if (window.parent && window.parent.__tavernActiveAudioSet) {
            window.parent.__tavernActiveAudioSet.add(a);
          }
        } catch (e) {}
        return a;
      };
      WrappedIframeAudio.prototype = OrigIframeAudio.prototype;
      window.Audio = WrappedIframeAudio;
    }
  } catch (e) {}
  function notifyParentGesture() {
    try {
      if (window.parent && typeof window.parent.pushMobileBackGuard === 'function') {
        window.parent.pushMobileBackGuard('tavern_iframe');
      } else if (window.parent) {
        window.parent.postMessage({ type: 'TAVERN_IFRAME_TOUCH_GESTURE' }, '*');
      }
    } catch (e) {}
  }
  document.addEventListener('touchstart', notifyParentGesture, { passive: true, capture: true });
  document.addEventListener('pointerdown', notifyParentGesture, { passive: true, capture: true });
  document.addEventListener('selectstart', function(e) {
    var t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) {
      return;
    }
    var selActive = false;
    try {
      selActive = Boolean(window.parent && typeof window.parent.__isTavernSelectionPluginActive === 'function' && window.parent.__isTavernSelectionPluginActive());
    } catch (err) {}
    if (selActive && (!t || !t.closest || !t.closest('button, img, svg'))) {
      return;
    }
    e.preventDefault();
  }, false);
  document.addEventListener('contextmenu', function(e) {
    var t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, true);
  function syncAvatarCssVars() {
    try {
      if (!window.parent) return;
      var uUrl = typeof window.parent.__getTavernUserAvatarUrl === 'function' ? window.parent.__getTavernUserAvatarUrl() : '';
      var cUrl = typeof window.parent.__getTavernCharAvatarUrl === 'function' ? window.parent.__getTavernCharAvatarUrl() : '';
      if (uUrl) {
        document.documentElement.style.setProperty('--tavern-user-avatar-bg', 'url("' + uUrl.replace(/"/g, '%22') + '")');
      }
      if (cUrl) {
        document.documentElement.style.setProperty('--tavern-char-avatar-bg', 'url("' + cUrl.replace(/"/g, '%22') + '")');
      }
      var imgs = document.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i++) {
        var im = imgs[i];
        var rawSrc = im.getAttribute('src') || '';
        if (uUrl && (/User%20Avatars|User Avatars|user-avatar|{{user}}/i.test(rawSrc))) {
          im.src = uUrl;
        } else if (rawSrc.indexOf('vault://') === 0 && typeof window.parent.resolveVaultRefToUrl === 'function') {
          (function(imgEl, vRef) {
            window.parent.resolveVaultRefToUrl(vRef).then(function(bUrl) {
              if (bUrl) imgEl.src = bUrl;
            });
          })(im, rawSrc);
        }
      }
    } catch (e) {}
  }
  syncAvatarCssVars();
  var pendingInputText = '';
  window.triggerSlash = function(cmd) {
    try {
      if (window.parent && typeof window.parent.triggerSlash === 'function') {
        return window.parent.triggerSlash(cmd);
      }
    } catch (e) {}
    window.parent.postMessage({ type: 'TAVERN_IFRAME_SLASH', command: cmd }, '*');
  };
  window.triggerSlashWithResult = window.triggerSlash;
  window.triggerSlashWithOptions = window.triggerSlash;
  window.executeSlashCommands = window.triggerSlash;
  window.executeSlashCommandsWithOptions = window.triggerSlash;
  window.sendMessageAsUser = function(text) {
    window.parent.postMessage({ type: 'TAVERN_IFRAME_SEND', text: String(text || ''), trigger: true }, '*');
  };
  window.Generate = function() {
    window.parent.postMessage({ type: 'TAVERN_IFRAME_GENERATE' }, '*');
  };
  function makeHostSelectorProxy(sel) {
    return {
      length: 1,
      val: function(v) {
        if (v === undefined) {
          try {
            var pEl = window.parent && window.parent.document && window.parent.document.querySelector(sel);
            if (pEl && pEl.value !== undefined) return pEl.value;
          } catch (e) {}
          return pendingInputText;
        }
        pendingInputText = String(v ?? '');
        try {
          var pInput = window.parent && window.parent.document && window.parent.document.querySelector('#send_textarea');
          if (pInput) pInput.value = pendingInputText;
        } catch (e) {}
        window.parent.postMessage({ type: 'TAVERN_IFRAME_SET_INPUT', text: pendingInputText }, '*');
        return this;
      },
      text: function(v) { return this.val(v); },
      trigger: function(ev) {
        if (!ev || String(ev).indexOf('click') !== -1 || String(ev).indexOf('submit') !== -1) {
          if (sel.indexOf('#send_but') !== -1 || sel.indexOf('#send_form') !== -1) {
            window.parent.postMessage({ type: 'TAVERN_IFRAME_CLICK_SEND', text: pendingInputText }, '*');
          }
        }
        return this;
      },
      click: function(fn) {
        if (typeof fn === 'function') return this;
        if (sel.indexOf('#send_but') !== -1) {
          window.parent.postMessage({ type: 'TAVERN_IFRAME_CLICK_SEND', text: pendingInputText }, '*');
        }
        return this;
      },
      on: function() { return this; },
      off: function() { return this; },
      focus: function() { return this; },
      prop: function() { return false; },
      attr: function() { return ''; }
    };
  }
  function wrapJQueryInstance(jqFn) {
    if (!jqFn || jqFn._tavernWrapped) return jqFn;
    var wrapped = function(sel, ctx) {
      if (typeof sel === 'string') {
        var s = sel.trim();
        if (s === '#send_textarea' || s === '#send_but' || s === '#send_form') {
          return makeHostSelectorProxy(s);
        }
        if (s.indexOf('#options') !== -1 || s.indexOf('#extensions') !== -1) {
          try {
            if (window.parent && window.parent.$) return window.parent.$(sel);
          } catch (e) {}
        }
      }
      return jqFn(sel, ctx || document);
    };
    try {
      Object.assign(wrapped, jqFn);
      wrapped.fn = jqFn.fn;
    } catch (e) {}
    wrapped._tavernWrapped = true;
    return wrapped;
  }
  try {
    if (window.parent) {
      window.getCurrentMessageId = function() {
        try {
          var f = window.frameElement;
          var mesEl = f && f.closest ? f.closest('.mes') : null;
          if (mesEl && mesEl.hasAttribute('mesid')) {
            return Number(mesEl.getAttribute('mesid'));
          }
          if (window.parent && typeof window.parent.getCurrentMessageId === 'function') {
            return window.parent.getCurrentMessageId();
          }
        } catch (e) {}
        return 0;
      };
      window.getLastMessageId = window.parent.getLastMessageId || window.getCurrentMessageId;
      window.SillyTavern = window.parent.SillyTavern;
      window.TavernHelper = Object.assign({}, window.parent.TavernHelper || {}, {
        isFrontendRenderEnabled: function() { return true; },
        getCurrentMessageId: window.getCurrentMessageId,
        getLastMessageId: window.getLastMessageId
      });
      window.getContext = window.parent.getContext;
      window.getVariables = window.parent.getVariables;
      window.insertOrAssignVariables = window.parent.insertOrAssignVariables;
      window.replaceVariables = window.parent.replaceVariables;
      window.updateVariablesWith = window.parent.updateVariablesWith;
      window.deleteVariable = window.parent.deleteVariable;
      window.getChatMessages = window.parent.getChatMessages;
      window.getChatMessage = window.parent.getChatMessage;
      window.setChatMessage = window.parent.setChatMessage;
      window.setChatMessages = window.parent.setChatMessages;
      window.createChatMessages = window.parent.createChatMessages;
      window.getButtonEvent = window.parent.getButtonEvent;
      window.getScriptButtons = window.parent.getScriptButtons;
      window.replaceScriptButtons = window.parent.replaceScriptButtons;
      window.appendInexistentScriptButtons = window.parent.appendInexistentScriptButtons;
      window.injectPrompts = window.parent.injectPrompts;
      window.uninjectPrompts = window.parent.uninjectPrompts;
      window.eventOn = window.parent.eventOn;
      window.eventOnce = window.parent.eventOnce;
      window.eventEmit = window.parent.eventEmit;
      window.eventRemoveListener = window.parent.eventRemoveListener;
      window.toastr = window.parent.toastr;
      if (window.parent.$) {
        window.$ = wrapJQueryInstance(window.parent.$);
        window.jQuery = window.$;
      }
    }
  } catch (e) {}
  var lastAppliedH = 0;
  var isModalFrame = ${isFullModal ? 'true' : 'false'};
  function syncFrameHeight() {
    if (window.$ && !window.$._tavernWrapped) {
      window.$ = wrapJQueryInstance(window.$);
      window.jQuery = window.$;
    }
    syncAvatarCssVars();
    if (isModalFrame) return;
    try {
      var frame = window.frameElement;
      if (!frame) return;
      var b = document.body;
      var d = document.documentElement;
      if (!b || !d) return;
      var contentH = 0;
      var bRect = b.getBoundingClientRect();
      var outerC = document.getElementById('outerContainer');
      var rootCard = document.getElementById('statusRoot') || outerC || document.querySelector('.gourmet-main-frame');
      if (rootCard) {
        var rcRect = rootCard.getBoundingClientRect();
        var ocBottom = outerC ? outerC.getBoundingClientRect().bottom : rcRect.bottom;
        contentH = Math.ceil(Math.max(rcRect.bottom, ocBottom) - bRect.top) + 10;
      } else {
        var children = b.children;
        if (children && children.length > 0) {
          var maxBottom = 0;
          for (var i = 0; i < children.length; i++) {
            var ch = children[i];
            if (ch.tagName === 'SCRIPT' || ch.tagName === 'STYLE') continue;
            var r = ch.getBoundingClientRect();
            var bot = (r.bottom - bRect.top) + (parseFloat(window.getComputedStyle(ch).marginBottom) || 0);
            if (bot > maxBottom) maxBottom = bot;
          }
          contentH = Math.ceil(maxBottom) + 6;
        }
      }
      if (contentH < 36) {
        contentH = Math.max(b.scrollHeight || 0, b.offsetHeight || 0);
      }
      var maxAllowed = 25000;
      var targetH = Math.min(maxAllowed, Math.max(56, contentH));
      if (Math.abs(targetH - lastAppliedH) > 1) {
        lastAppliedH = targetH;
        frame.style.height = targetH + 'px';
        frame.style.maxHeight = 'none';
      }
    } catch (e) {}
  }
  window.addEventListener('DOMContentLoaded', function() {
    if (window.$ && !window.$._tavernWrapped) {
      window.$ = wrapJQueryInstance(window.$);
      window.jQuery = window.$;
    }
    syncFrameHeight();
    setTimeout(syncFrameHeight, 60);
    setTimeout(syncFrameHeight, 240);
    try {
      if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function() { syncFrameHeight(); });
        if (document.body) ro.observe(document.body);
        var sr = document.getElementById('statusRoot') || document.getElementById('outerContainer');
        if (sr) ro.observe(sr);
      }
      if (typeof MutationObserver !== 'undefined' && document.body) {
        var mo = new MutationObserver(function() {
          syncFrameHeight();
          setTimeout(syncFrameHeight, 120);
          setTimeout(syncFrameHeight, 360);
        });
        mo.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
      }
    } catch (e) {}
  });
  window.addEventListener('load', function() {
    if (window.$ && !window.$._tavernWrapped) {
      window.$ = wrapJQueryInstance(window.$);
      window.jQuery = window.$;
    }
    syncFrameHeight();
  });
  document.addEventListener('click', function() {
    if (window.$ && !window.$._tavernWrapped) {
      window.$ = wrapJQueryInstance(window.$);
      window.jQuery = window.$;
    }
    setTimeout(syncFrameHeight, 40);
    setTimeout(syncFrameHeight, 180);
    setTimeout(syncFrameHeight, 380);
  }, true);
  document.addEventListener('transitionend', function() {
    syncFrameHeight();
  }, true);
  document.addEventListener('change', function() { setTimeout(syncFrameHeight, 50); }, true);
  document.addEventListener('input', function() { setTimeout(syncFrameHeight, 50); }, true);
})();
<\/script>`;

    const headInjection = sandboxClampCss + bridgeScript;

    if (/<head[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head([^>]*)>/i, '<head$1>' + headInjection);
    } else if (/<html[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<html([^>]*)>/i, '<html$1><head>' + headInjection + '</head>');
    } else {
      cleaned = '<!DOCTYPE html><html><head><meta charset="utf-8">' + headInjection + '</head><body style="margin:0;padding:0;background:transparent;">' + cleaned + '</body></html>';
    }

    const escapedSrcDoc = cleaned
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');

    if (isFullModal) {
      return escapedSrcDoc;
    }

    return `<iframe class="tavern-html-sandbox-frame" scrolling="no" frameborder="0" style="width:100%;height:320px;min-height:56px;border:none;display:block;background:transparent;overflow:hidden;margin:6px 0;border-radius:12px;" srcdoc="${escapedSrcDoc}"></iframe>`;
  }

  function renderTavernMessageHtml(rawText, options = {}) {
    if (!rawText) return '';
    const afterRegex = applyTavernRegexPipeline(rawText, { ...options, isPrompt: false });

    // 1. Unwrap markdown code fences (```html ... ``` or ``` ... ```) that wrap HTML documents or UI blocks
    let working = afterRegex.replace(/```(?:html|HTML|xml)?[ \t]*\r?\n?([\s\S]*?)```/g, (full, inner) => {
      const trimmed = inner.trim();
      if (/^(?:<!DOCTYPE\s+html|<html\b|<head\b|<body\b|<style\b|<div\b|<section\b|<main\b|<table\b|<form\b|<details\b|<svg\b|<script\b)/i.test(trimmed)) {
        if ((/<script\b[\s\S]*?<\/script>/i.test(trimmed) || /^<(?:head|body)\b/i.test(trimmed) || /需要酒馆助手的前端渲染/i.test(trimmed)) && !/<html\b/i.test(trimmed)) {
          return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + trimmed + '</body></html>';
        }
        return trimmed;
      }
      return full;
    });

    // Clean up any stray dangling ```html or ``` fence markers around HTML tags
    working = working
      .replace(/```(?:html|HTML)\s*(?=<)/g, '')
      .replace(/^[ \t]*```(?:html|HTML)?[ \t]*$/gm, '');

    if (!/<html\b/i.test(working) && /<script\b[\s\S]*?<\/script>/i.test(working) && (/<body\b/i.test(working) || /需要酒馆助手的前端渲染/i.test(working))) {
      working = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + working + '</body></html>';
    }

    // 2. Extract full HTML documents (<!DOCTYPE html>...</html> or <html...>...</html>) into sandboxed iframes
    const isLastFloor = options && options.isLastFloor !== undefined ? Boolean(options.isLastFloor) : true;
    const protectedBlocks = [];
    working = working.replace(/(?:<!DOCTYPE\s+html[^>]*>\s*)?<html[\s\S]*?<\/html>/gi, match => {
      const token = '___TAVERN_PROTECTED_BLOCK_' + protectedBlocks.length + '___';
      protectedBlocks.push(buildSandboxIframeHtml(match, { isLastFloor }));
      return '\n' + token + '\n';
    });

    // 3. Protect standalone <style>...</style> + <script>...</script> blocks
    working = working.replace(/<style[\s\S]*?<\/style>/gi, match => {
      const token = '___TAVERN_PROTECTED_BLOCK_' + protectedBlocks.length + '___';
      protectedBlocks.push(match);
      return token;
    });
    working = working.replace(/<script[\s\S]*?<\/script>/gi, match => {
      const token = '___TAVERN_PROTECTED_BLOCK_' + protectedBlocks.length + '___';
      protectedBlocks.push(match);
      return token;
    });

    // 4. Collapse newlines inside multi-line HTML opening tags (e.g. <input\n type="radio"\n name="story">)
    // so line-splitting never tears HTML attributes apart!
    working = working.replace(/<([a-zA-Z][a-zA-Z0-9-]*)(\s+[^<>]*?)>/g, fullTag => {
      return fullTag.replace(/\r?\n\s*/g, ' ');
    });

    // 5. Basic markdown bold/italic outside HTML tags
    const tagHolders = [];
    working = working.replace(/<[^>]+>/g, tag => {
      const t = '___TAVERN_TAG_HOLD_' + tagHolders.length + '___';
      tagHolders.push(tag);
      return t;
    });

    working = working
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // 6. Wrap dialogue quotes in <q> if enabled
    if (tavernState.formatting && tavernState.formatting.wrapQuotesInQ && tavernState.uiSettings?.enableQuoteColor !== false) {
      working = working
        .replace(/“([^”\n]+)”/g, '<q>“$1”</q>')
        .replace(/「([^」\n]+)」/g, '<q>「$1」</q>')
        .replace(/『([^』\n]+)』/g, '<q>『$1』</q>');
    }

    working = working.replace(/___TAVERN_TAG_HOLD_(\d+)___/g, (_, idx) => tagHolders[Number(idx)] || '');
    working = working.replace(/<div\s+data-bbi-slot=""\s*><\/div>/gi, '\n<div data-bbi-slot=""></div>\n');

    // 7. Convert plain text paragraphs while keeping HTML tags and protected blocks intact
    const lines = working.split('\n');
    const htmlLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div class="tavern-para-spacer"></div>';
      if (/^___TAVERN_PROTECTED_BLOCK_\d+___$/.test(trimmed)) {
        return trimmed;
      }
      if (/^<\/?(div|table|thead|tbody|tr|td|th|ul|ol|li|details|summary|section|article|header|footer|blockquote|hr|h[1-6]|p|style|form|input|label|button|select|option|span|nav|main|aside|figure|figcaption|iframe|svg)/i.test(trimmed)) {
        return line;
      }
      return '<p>' + line + '</p>';
    });

    let finalHtml = htmlLines.join('\n');
    finalHtml = finalHtml.replace(/___TAVERN_PROTECTED_BLOCK_(\d+)___/g, (_, idx) => protectedBlocks[Number(idx)] || '');
    return finalHtml;
  }

  function prefixSelectorListWithStageRoot(selectorGroup) {
    const parts = [];
    let cur = '';
    let parenDepth = 0;
    for (let i = 0; i < selectorGroup.length; i++) {
      const ch = selectorGroup[i];
      if (ch === '(') parenDepth++;
      else if (ch === ')' && parenDepth > 0) parenDepth--;
      if (ch === ',' && parenDepth === 0) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur.trim());

    return parts.map(sel => {
      if (!sel) return '';
      let s = sel
        .replace(/^:root\b/i, '#tavern-stage-root')
        .replace(/\bhtml\s+body\b/gi, '#tavern-stage-root')
        .replace(/^html\b/i, '#tavern-stage-root')
        .replace(/^body\b/i, '#tavern-stage-root')
        .replace(/#bg_custom\b/g, '#tavern-bg-layer')
        .replace(/#bg1\b/g, '#tavern-bg-layer');
      if (s.includes('#tavern-stage-root') || s.includes('#game-hall-screen')) {
        return s;
      }
      if (s.startsWith('::') || s.startsWith(':-')) {
        return '#tavern-stage-root ' + s + ', #tavern-stage-root *' + s;
      }
      return '#tavern-stage-root ' + s;
    }).filter(Boolean).join(', ');
  }

  function scopeCssBlockRecursive(cssText) {
    let out = '';
    let i = 0;
    const len = cssText.length;

    while (i < len) {
      while (i < len && /\s/.test(cssText[i])) {
        out += cssText[i++];
      }
      if (i >= len) break;

      if (cssText[i] === '@' && /^@(?:import|charset)\b/i.test(cssText.slice(i))) {
        const semiIdx = cssText.indexOf(';', i);
        if (semiIdx === -1) break;
        i = semiIdx + 1;
        continue;
      }

      const openBrace = cssText.indexOf('{', i);
      if (openBrace === -1) {
        out += cssText.slice(i);
        break;
      }

      const header = cssText.slice(i, openBrace).trim();
      let depth = 1;
      let j = openBrace + 1;
      let inStr = null;
      while (j < len && depth > 0) {
        const c = cssText[j];
        if (inStr) {
          if (c === inStr && cssText[j - 1] !== '\\') inStr = null;
        } else {
          if (c === '"' || c === "'") inStr = c;
          else if (c === '{') depth++;
          else if (c === '}') depth--;
        }
        j++;
      }

      const innerBody = cssText.slice(openBrace + 1, j - 1);
      if (/^@(?:-webkit-)?keyframes\b/i.test(header) || /^@font-face\b/i.test(header)) {
        out += header + ' {' + innerBody + '}\n';
      } else if (/^@(?:media|supports|container|layer)\b/i.test(header)) {
        out += header + ' {\n' + scopeCssBlockRecursive(innerBody) + '\n}\n';
      } else {
        const scopedHeader = prefixSelectorListWithStageRoot(header);
        out += scopedHeader + ' {' + innerBody + '}\n';
      }
      i = j;
    }
    return out;
  }

  function scopeTavernThemeCss(rawCss) {
    if (!rawCss || typeof rawCss !== 'string') return '';
    const noComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const imports = [];
    const bodyWithoutImports = noComments.replace(/@import\s+(?:url\([^)]+\)|["'][^"']+["'])[^;]*;/gi, (m) => {
      if (!/fonts\.googleapis\.com/i.test(m)) {
        imports.push(m.trim());
      }
      return '';
    });
    const cleaned = bodyWithoutImports
      .replace(/100dvh/g, '100%')
      .replace(/100vh/g, '100%');
    return (imports.length > 0 ? imports.join('\n') + '\n' : '') + scopeCssBlockRecursive(cleaned);
  }

  function buildTavernThemeOverridePatch(theme, uiCfg) {
    const rules = [];
    const isGousuStyle = theme && (theme.id === 'theme_gousu_default' || theme.id === 'theme_gousu_night' || String(theme.custom_css || '').includes('1ear.png') || String(theme.custom_css || '').includes('--text4'));
    const isGousuNight = Boolean(theme && theme.id === 'theme_gousu_night');
    if (isGousuStyle) {
      rules.push(`
        /* Refined Gousu floor spacing, smaller non-overlapping avatar, connected metadata capsule, and two-row bottom bar */
        #tavern-stage-root #chat {
          mask: none !important;
          -webkit-mask: none !important;
          padding: 12px var(--tavernPageMargin, 10px) 92px var(--tavernPageMargin, 10px) !important;
        }
        #tavern-stage-root .mes {
          padding: 16px 8px 0 8px !important;
          margin-bottom: 22px !important;
        }
        #tavern-stage-root .mes.last_mes {
          margin-bottom: 12px !important;
        }
        /* Shrink character & user avatars to 68px so they never cover expanded .extraMesButtons */
        #tavern-stage-root .mesAvatarWrapper {
          top: 12px !important;
          left: 8px !important;
          width: 68px !important;
          height: 68px !important;
          z-index: 15 !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mesAvatarWrapper {
          left: auto !important;
          right: 8px !important;
        }
        #tavern-stage-root .mes .avatar {
          width: 68px !important;
          height: 68px !important;
        }
        #tavern-stage-root .mes[is_system="false"] .mesAvatarWrapper .avatar::before {
          width: 82px !important;
          height: 82px !important;
          top: -28px !important;
          left: -7px !important;
        }
        #tavern-stage-root .mes[is_system="false"][is_user="true"] .mesAvatarWrapper .avatar::before {
          left: auto !important;
          right: -7px !important;
        }
        #tavern-stage-root .mes_block {
          position: static !important;
          background: radial-gradient(circle at 34px 22px, transparent 41px, var(--msg-bg-color, #e6e6e6) 42px) !important;
          padding: 64px 12px 14px 12px !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mes_block {
          position: static !important;
          background: radial-gradient(circle at calc(100% - 34px) 22px, transparent 41px, var(--msg-bg-color, #e6e6e6) 42px) !important;
        }
        #tavern-stage-root .mes_block::before {
          top: 16px !important;
          -webkit-mask-image: radial-gradient(circle at 34px 22px, transparent 41px, black 42px) !important;
          mask-image: radial-gradient(circle at 34px 22px, transparent 41px, black 42px) !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mes_block::before {
          -webkit-mask-image: radial-gradient(circle at calc(100% - 34px) 22px, transparent 41px, black 42px) !important;
          mask-image: radial-gradient(circle at calc(100% - 34px) 22px, transparent 41px, black 42px) !important;
        }
        #tavern-stage-root .mes .name_text,
        #tavern-stage-root .mes[is_user="false"] .name_text {
          position: absolute !important;
          left: 88px !important;
          right: auto !important;
          top: 10px !important;
          z-index: 25 !important;
          max-width: calc(100% - 205px) !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          display: inline-flex !important;
          align-items: center !important;
          font-size: 14px !important;
          padding: 2px 12px !important;
        }
        #tavern-stage-root .mes[is_user="true"] .name_text {
          position: absolute !important;
          left: auto !important;
          right: 88px !important;
          top: 10px !important;
          z-index: 25 !important;
        }
        /* Keep .ch_name static so .name_text is anchored to .mes top (above #0 3995t), while .mes_buttons sits on its own row below */
        #tavern-stage-root .mes[is_user="false"] .ch_name.flex-container.justifySpaceBetween {
          position: static !important;
          padding-left: 72px !important;
          padding-right: 2px !important;
          min-height: 28px !important;
          margin-bottom: 4px !important;
        }
        #tavern-stage-root .mes[is_user="true"] .ch_name.flex-container.justifySpaceBetween {
          position: static !important;
          flex-direction: row !important;
          justify-content: flex-start !important;
          padding-left: 4px !important;
          padding-right: 72px !important;
          min-height: 28px !important;
          margin-bottom: 4px !important;
        }
        #tavern-stage-root .mes .mes_buttons {
          position: relative !important;
          z-index: 35 !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mes_buttons {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        #tavern-stage-root .extraMesButtons {
          position: absolute !important;
          right: calc(100% + 6px) !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 48 !important;
          flex-wrap: nowrap !important;
          white-space: nowrap !important;
        }
        #tavern-stage-root .mes[is_user="true"] .extraMesButtons {
          right: auto !important;
          left: calc(100% + 6px) !important;
        }
        /* Connected metadata capsule directly under character/user name (zero gap in the middle!) */
        #tavern-stage-root .mesIDDisplay,
        #tavern-stage-root .mes_timer,
        #tavern-stage-root .tokenCounterDisplay {
          top: 38px !important;
          height: 20px !important;
          font-size: 10.5px !important;
          z-index: 20 !important;
        }
        #tavern-stage-root .mes[is_user="false"] .mesIDDisplay {
          left: 80px !important;
          width: 48px !important;
          border-radius: 10px 0 0 10px !important;
          border-right: none !important;
        }
        #tavern-stage-root .mes[is_user="false"] .mes_timer {
          left: 128px !important;
          width: 44px !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
        }
        #tavern-stage-root .mes[is_user="false"] .tokenCounterDisplay {
          left: 172px !important;
          width: 50px !important;
          border-radius: 0 10px 10px 0 !important;
          border-left: none !important;
        }
        #tavern-stage-root .mes[is_user="false"] .mes_timer:empty + .tokenCounterDisplay,
        #tavern-stage-root .mes .mes_timer:empty + .tokenCounterDisplay {
          left: 128px !important;
          width: 50px !important;
          border-radius: 0 10px 10px 0 !important;
          border-left: none !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mesIDDisplay {
          right: 80px !important;
          left: auto !important;
          width: 48px !important;
          border-radius: 0 10px 10px 0 !important;
          border-right: 1px solid var(--gousu-meta-border, #aaa) !important;
          border-left: none !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mes_timer {
          right: 128px !important;
          left: auto !important;
          width: 44px !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
        }
        #tavern-stage-root .mes[is_user="true"] .tokenCounterDisplay {
          right: 172px !important;
          left: auto !important;
          width: 50px !important;
          border-radius: 10px 0 0 10px !important;
          border-left: 1px solid var(--gousu-meta-border, #aaa) !important;
          border-right: none !important;
        }
        #tavern-stage-root .mes[is_user="true"] .mes_timer:empty + .tokenCounterDisplay {
          right: 128px !important;
          left: auto !important;
          width: 50px !important;
          border-radius: 10px 0 0 10px !important;
          border-left: 1px solid var(--gousu-meta-border, #aaa) !important;
          border-right: none !important;
        }
        /* Bottom decorative plaid bar & swipe paws & page counter aligned neatly inside .mes_block */
        #tavern-stage-root .mes::before {
          width: 56% !important;
          height: 24px !important;
          bottom: -8px !important;
          right: 14px !important;
        }
        #tavern-stage-root .mes[is_user="true"]::before {
          display: none !important;
        }
        #tavern-stage-root .swipe_left {
          left: auto !important;
          right: calc(56% - 14px) !important;
          bottom: -7px !important;
          width: 22px !important;
          height: 22px !important;
        }
        #tavern-stage-root .swipe_right {
          right: 22px !important;
          bottom: -7px !important;
          width: 22px !important;
          height: 22px !important;
        }
        #tavern-stage-root .swipes-counter {
          top: auto !important;
          bottom: -6px !important;
          right: calc(28% - 6px) !important;
          height: 19px !important;
          line-height: 17px !important;
          font-size: 11px !important;
          padding: 0 7px !important;
          border-radius: 9px !important;
          z-index: 31 !important;
        }
        /* Ensure #send_form supports two rows: Row 1 #qr--bar and Row 2 #nonQRFormItems */
        #tavern-stage-root #send_form {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 2px !important;
          padding: 4px 8px !important;
        }
        #tavern-stage-root #qr--bar {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 6px !important;
          width: 100% !important;
          padding: 2px 4px 4px 4px !important;
          overflow-x: auto !important;
          box-sizing: border-box !important;
        }
      `);
      if (isGousuNight) {
        rules.push(`
          #game-hall-screen,
          #tavern-app-shell,
          #tavern-stage-root {
            background-color: #1a1c22 !important;
            color: #e2e0da !important;
          }
          #tavern-stage-root .mes .extraMesButtons {
            background: rgba(36, 39, 48, 0.94) !important;
            border: 1px solid #484c5c !important;
          }
          #tavern-stage-root .mes .tavern-mes-icon-btn {
            background: #2b2e39 !important;
            color: #d0cdc4 !important;
            border: 1px solid #484c5c !important;
            box-shadow: none !important;
          }
          #tavern-stage-root #qr--bar .qr--button {
            background: rgba(40, 43, 52, 0.94) !important;
            color: #dcd9d2 !important;
            border: 1px solid #4a4e5e !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
          }
          #tavern-stage-root .tavern-stop-gen-btn {
            background: rgba(68, 42, 46, 0.95) !important;
            color: #f0b8c0 !important;
            border: 1px solid rgba(180, 100, 112, 0.65) !important;
          }
          #tavern-stage-root #tavern-drawer-host {
            background: rgba(24, 26, 32, 0.97) !important;
            border-bottom: 1px solid #3c404e !important;
          }
          #tavern-stage-root .tavern-drawer-header {
            border-bottom: 1px solid #383c4a !important;
          }
          #tavern-stage-root .tavern-drawer-title,
          #tavern-stage-root .tavern-section-label,
          #tavern-stage-root .tavern-list-row-main,
          #tavern-stage-root .inline-drawer-header {
            color: #e2e0da !important;
          }
          #tavern-stage-root .tavern-section-card,
          #tavern-stage-root .inline-drawer {
            background: rgba(34, 37, 45, 0.95) !important;
            border: 1px solid #3e4250 !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25) !important;
          }
          #tavern-stage-root .tavern-list-row {
            background: rgba(42, 45, 55, 0.92) !important;
            border: 1px solid #464a58 !important;
          }
          #tavern-stage-root .tavern-field-group label,
          #tavern-stage-root .tavern-field-hint,
          #tavern-stage-root .tavern-list-row-sub {
            color: #9e9b93 !important;
          }
          #tavern-stage-root .drawer-content .tavern-input,
          #tavern-stage-root .drawer-content .tavern-textarea,
          #tavern-stage-root .drawer-content .tavern-select {
            background-color: #22252e !important;
            color: #e2e0da !important;
            border: 1px solid #454958 !important;
          }
          #tavern-stage-root .tavern-btn {
            background: #2e313c !important;
            color: #dcd9d2 !important;
            border: 1px solid #484c5c !important;
          }
          #tavern-stage-root .tavern-btn.primary {
            background: #4a5062 !important;
            color: #f2f0ec !important;
            border-color: #5c6378 !important;
          }
          #tavern-stage-root .tavern-btn.danger {
            background: rgba(74, 38, 42, 0.9) !important;
            color: #f0a8b0 !important;
            border-color: rgba(168, 86, 94, 0.6) !important;
          }
          #tavern-stage-root .tavern-bottom-popup {
            background: rgba(32, 35, 43, 0.98) !important;
            border: 1px solid #454958 !important;
            color: #e2e0da !important;
          }
          #tavern-stage-root .tavern-popup-item,
          #tavern-stage-root #extensionsMenu > * {
            color: #dcd9d2 !important;
          }
          #tavern-stage-root .tavern-popup-item:hover,
          #tavern-stage-root #extensionsMenu > *:hover {
            background: rgba(255, 255, 255, 0.06) !important;
          }
        `);
      }
    }

    // Universal compatibility guards for all SillyTavern themes
    rules.push(`
      #tavern-stage-root .mes .ch_name {
        position: relative !important;
        z-index: 42 !important;
        pointer-events: auto !important;
      }
      #tavern-stage-root .mes .mes_buttons,
      #tavern-stage-root .mes .mes_edit_buttons {
        position: relative !important;
        z-index: 45 !important;
        pointer-events: auto !important;
      }
      #tavern-stage-root .mes .extraMesButtonsHint,
      #tavern-stage-root .mes .mes_stop,
      #tavern-stage-root .mes .mes_edit,
      #tavern-stage-root .mes .tavern-mes-icon-btn {
        position: relative !important;
        z-index: 46 !important;
        pointer-events: auto !important;
      }
      #tavern-stage-root .mes .extraMesButtons {
        position: absolute !important;
        right: calc(100% + 6px) !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 50 !important;
        pointer-events: auto !important;
        flex-wrap: nowrap !important;
        white-space: nowrap !important;
      }
      #tavern-stage-root .mes[is_user="true"] .extraMesButtons {
        right: auto !important;
        left: calc(100% + 6px) !important;
      }
      #tavern-stage-root details.mes_reasoning_details {
        position: relative !important;
        z-index: 25 !important;
        display: block !important;
      }
      #tavern-stage-root details.mes_reasoning_details:not([open]) > *:not(summary) {
        display: none !important;
      }
      #tavern-stage-root details.mes_reasoning_details > summary.mes_reasoning_summary {
        display: flex !important;
        align-items: center !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        user-select: none !important;
        list-style: none !important;
      }
      #tavern-stage-root details.mes_reasoning_details > summary.mes_reasoning_summary::-webkit-details-marker {
        display: none !important;
      }
      #tavern-stage-root .extraMesButtons.tavern-extra-hidden {
        display: none !important;
      }
      #tavern-stage-root .swipes-counter:empty {
        display: none !important;
      }
      #tavern-stage-root .tavern-lazy-load-bar {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        margin: 8px var(--tavernPageMargin, 10px) 12px !important;
        padding: 9px 14px !important;
        border-radius: 14px !important;
        background: var(--SmartThemeBlurTintColor, rgba(245, 243, 240, 0.92)) !important;
        border: 1px solid var(--SmartThemeBorderColor, rgba(160, 150, 140, 0.22)) !important;
        color: var(--SmartThemeBodyColor, #4a4745) !important;
        font-size: 12.5px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
      }
      #tavern-stage-root .tavern-lazy-load-info {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        opacity: 0.86 !important;
      }
      #tavern-stage-root .tavern-lazy-load-actions {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        flex-shrink: 0 !important;
      }
    `);

    if (uiCfg.enableQuoteColor === false) {
      rules.push(`#tavern-stage-root .mes_text q { color: inherit !important; }`);
    }
    if (uiCfg.enableQuoteBox === false) {
      rules.push(`#tavern-stage-root .mes_text q { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }`);
    }
    if (uiCfg.enableItalicColor === false) {
      rules.push(`#tavern-stage-root .mes_text em, #tavern-stage-root .mes_text i { color: inherit !important; }`);
    }
    return rules.join('\n');
  }

  function applyActiveTavernTheme() {
    const stageRoot = document.getElementById('tavern-stage-root');
    let styleEl = document.getElementById('tavern-custom-theme-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'tavern-custom-theme-style';
      document.head.appendChild(styleEl);
    }

    const gameScreen = document.getElementById('game-hall-screen');
    const isTavernVisible = !gameScreen || gameScreen.classList.contains('active');
    if (!stageRoot || !isTavernVisible) {
      styleEl.textContent = '';
      return;
    }

    let theme = tavernState.themes.find(t => t.id === tavernState.activeThemeId);
    if (!theme) theme = tavernState.themes[0] || DEFAULT_GOUSU_THEME;

    const uiCfg = tavernState.uiSettings || {};
    const varPairs = [
      ['--SmartThemeBodyColor', theme.main_text_color || 'rgba(55, 55, 55, 1)'],
      ['--SmartThemeEmColor', theme.italics_text_color || 'rgba(153, 153, 153, 1)'],
      ['--SmartThemeUnderlineColor', theme.underline_text_color || 'rgba(188, 231, 207, 1)'],
      ['--SmartThemeQuoteColor', theme.quote_text_color || 'rgba(255, 168, 187, 1)'],
      ['--SmartThemeBlurTintColor', theme.blur_tint_color || 'rgba(237, 237, 237, 1)'],
      ['--SmartThemeChatTintColor', theme.chat_tint_color || 'rgba(246, 246, 246, 1)'],
      ['--SmartThemeUserMesBlurTintColor', theme.user_mes_blur_tint_color || 'rgba(245, 245, 245, 0.92)'],
      ['--SmartThemeBotMesBlurTintColor', theme.bot_mes_blur_tint_color || 'rgba(246, 246, 246, 1)'],
      ['--SmartThemeShadowColor', theme.shadow_color || 'rgba(219, 219, 219, 0.43)'],
      ['--SmartThemeBorderColor', theme.border_color || 'rgba(255, 255, 255, 1)'],
      ['--blurStrength', (theme.blur_strength ?? 10) + 'px'],
      ['--shadowWidth', (theme.shadow_width ?? 2) + 'px'],
      ['--fontScale', String(uiCfg.fontScale ?? theme.font_scale ?? 1)],
      ['--tavernLetterSpacing', (uiCfg.letterSpacing ?? 0) + 'px'],
      ['--tavernLineHeight', String(uiCfg.lineHeight ?? 1.72)],
      ['--tavernPageMargin', (uiCfg.pageMargin ?? 10) + 'px']
    ];

    varPairs.forEach(([k, v]) => stageRoot.style.setProperty(k, v));

    if (uiCfg.enableThemeCustomCss === false) {
      styleEl.textContent = buildTavernThemeOverridePatch(null, uiCfg);
    } else {
      styleEl.textContent = scopeTavernThemeCss(theme.custom_css || '') + '\n' + buildTavernThemeOverridePatch(theme, uiCfg);
    }
    applyCachedBaiBaiCssToShadowRoots();
  }

  // ============================================================================
  // 8. World Book Trigger Engine & Full SillyTavern Prompt Assembler
  // ============================================================================
  function matchSingleKeyword(haystack, keyword, caseSensitive = false, wholeWords = false) {
    if (!keyword || !haystack) return false;
    const kw = String(keyword).trim();
    if (!kw) return false;

    const regexMatch = kw.match(/^\/([\s\S]+)\/([gimsuy]*)$/);
    if (regexMatch) {
      try {
        const rx = new RegExp(regexMatch[1], regexMatch[2]);
        return rx.test(haystack);
      } catch (_) {
        return false;
      }
    }

    const targetHaystack = caseSensitive ? haystack : haystack.toLowerCase();
    const targetKw = caseSensitive ? kw : kw.toLowerCase();

    if (wholeWords && /^[\w-]+$/.test(targetKw)) {
      const escaped = targetKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp('\\b' + escaped + '\\b', caseSensitive ? '' : 'i');
      return rx.test(haystack);
    }

    return targetHaystack.includes(targetKw);
  }

  function evaluateWorldEntryMatch(entry, scanText, isRecursionPass = false) {
    if (!entry || entry.disable) return false;
    if (entry.constant) return true;
    if (isRecursionPass && entry.excludeRecursion) return false;
    if (!isRecursionPass && entry.delayUntilRecursion) return false;

    if (entry.useProbability && Number(entry.probability ?? 100) < 100) {
      if (Math.random() * 100 > Number(entry.probability)) return false;
    }

    const primaryKeys = Array.isArray(entry.keys) ? entry.keys.filter(Boolean) : [];
    if (primaryKeys.length === 0) return false;

    const primaryHit = primaryKeys.some(k => matchSingleKeyword(scanText, k, entry.caseSensitive, entry.matchWholeWords));
    if (!primaryHit) return false;

    const secondaryKeys = Array.isArray(entry.secondaryKeys) ? entry.secondaryKeys.filter(Boolean) : [];
    if (!entry.selective || secondaryKeys.length === 0) return true;

    const logic = Number(entry.selectiveLogic || 0);
    const hits = secondaryKeys.map(k => matchSingleKeyword(scanText, k, entry.caseSensitive, entry.matchWholeWords));

    if (logic === 0) return hits.some(Boolean); // AND ANY
    if (logic === 1) return !hits.every(Boolean); // NOT ALL
    if (logic === 2) return !hits.some(Boolean); // NOT ANY
    if (logic === 3) return hits.every(Boolean); // AND ALL
    return true;
  }

  function collectTriggeredWorldBookEntries(card, chatMessages) {
    const activeBooks = [];
    const seenIds = new Set();

    if (card && card.worldBookId) {
      const charBook = tavernState.worldBooks.find(b => b.id === card.worldBookId);
      if (charBook && charBook.enabled !== false) {
        activeBooks.push(charBook);
        seenIds.add(charBook.id);
      }
    }

    (tavernState.worldBooks || []).forEach(b => {
      if (b && b.enabled && !seenIds.has(b.id)) {
        activeBooks.push(b);
        seenIds.add(b.id);
      }
    });

    if (activeBooks.length === 0) {
      return { beforeChar: [], afterChar: [], beforeAN: [], afterAN: [], atDepth: [], beforeExample: [], afterExample: [], outlets: {} };
    }

    const defaultDepth = Math.max(1, Number(activeBooks[0].scanDepth || 4));
    const maxBudget = Math.max(256, Number(activeBooks[0].tokenBudget || 4096));
    const allowRecursion = Boolean(activeBooks[0].recursiveScanning ?? true);

    const recentSlice = (chatMessages || []).slice(-defaultDepth);
    const baseScanText = recentSlice.map(m => m.mes || '').join('\n');

    const candidateEntries = [];
    activeBooks.forEach(book => {
      (book.entries || []).forEach(entry => {
        if (!entry.disable && (entry.content || '').trim()) {
          candidateEntries.push(entry);
        }
      });
    });

    candidateEntries.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

    const triggeredSet = new Set();
    const triggeredEntries = [];
    let currentScanPool = baseScanText;

    // Initial pass + up to 2 recursion passes
    const maxPasses = allowRecursion ? 3 : 1;
    for (let pass = 0; pass < maxPasses; pass++) {
      let addedInPass = false;
      for (const entry of candidateEntries) {
        if (triggeredSet.has(entry)) continue;
        let textToScan = currentScanPool;
        if (pass === 0 && entry.scanDepth !== null && entry.scanDepth !== undefined && entry.scanDepth !== '') {
          const customDepth = Math.max(1, Number(entry.scanDepth));
          textToScan = (chatMessages || []).slice(-customDepth).map(m => m.mes || '').join('\n');
        }
        if (evaluateWorldEntryMatch(entry, textToScan, pass > 0)) {
          triggeredSet.add(entry);
          triggeredEntries.push(entry);
          if (!entry.preventRecursion) {
            currentScanPool += '\n' + entry.content;
            addedInPass = true;
          }
        }
      }
      if (!addedInPass) break;
    }

    // Apply token budget and World Info regex placement (placement 5)
    let usedTokens = 0;
    const budgetedEntries = [];
    for (const entry of triggeredEntries) {
      const formatted = applyTavernRegexPipeline(entry.content, { isPrompt: true, isWorldInfo: true, card });
      const tCount = estimateTokens(formatted);
      if (usedTokens + tCount > maxBudget && !entry.constant) continue;
      usedTokens += tCount;
      budgetedEntries.push({ ...entry, resolvedContent: formatted });
    }

    const buckets = {
      beforeChar: [],
      afterChar: [],
      beforeAN: [],
      afterAN: [],
      beforeExample: [],
      afterExample: [],
      atDepth: [],
      outlets: {}
    };

    budgetedEntries.forEach(entry => {
      const pos = Number(entry.position || 0);
      if (pos === 0) buckets.beforeChar.push(entry.resolvedContent);
      else if (pos === 1) buckets.afterChar.push(entry.resolvedContent);
      else if (pos === 2) buckets.beforeAN.push(entry.resolvedContent);
      else if (pos === 3) buckets.afterAN.push(entry.resolvedContent);
      else if (pos === 5) buckets.beforeExample.push(entry.resolvedContent);
      else if (pos === 6) buckets.afterExample.push(entry.resolvedContent);
      else if (pos === 7) {
        const outletKey = String(entry.group || entry.comment || 'default').trim();
        if (!buckets.outlets[outletKey]) buckets.outlets[outletKey] = [];
        buckets.outlets[outletKey].push(entry.resolvedContent);
      } else {
        buckets.atDepth.push({
          role: entry.role === 1 ? 'user' : (entry.role === 2 ? 'assistant' : 'system'),
          depth: Math.max(0, Number(entry.depth ?? 4)),
          order: Number(entry.order ?? 100),
          content: entry.resolvedContent,
          _debugLabel: '世界书深度注入 @D' + Math.max(0, Number(entry.depth ?? 4)) + (entry.comment ? ' · ' + entry.comment : '')
        });
      }
    });

    return buckets;
  }

  function getActiveReasoningTagPairs() {
    const fmt = tavernState.formatting || (tavernState.formatting = {});
    if (!Array.isArray(fmt.reasoningTagPairs) || fmt.reasoningTagPairs.length === 0) {
      const legacyStart = String(fmt.reasoningStartTag || '<think>').trim() || '<think>';
      const legacyEnd = String(fmt.reasoningEndTag || '</think>').trim() || '</think>';
      fmt.reasoningTagPairs = [
        { start: legacyStart, end: legacyEnd }
      ];
      if (legacyStart.toLowerCase() !== '<thinking>' || legacyEnd.toLowerCase() !== '</thinking>') {
        fmt.reasoningTagPairs.push({ start: '<thinking>', end: '</thinking>' });
      }
    }
    return fmt.reasoningTagPairs;
  }

  function stripHistoricalReasoningFromText(rawMes) {
    if (!rawMes) return '';
    let text = String(rawMes);
    const pairs = getActiveReasoningTagPairs();
    for (const pair of pairs) {
      const startTag = String(pair?.start || '').trim();
      const endTag = String(pair?.end || '').trim();
      if (startTag && endTag) {
        const escStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escStart + '[\\s\\S]*?' + escEnd, 'gi'), '');
      }
    }
    text = text.replace(/<(?:think|thinking|thought|reasoning|cot)>[\s\S]*?<\/(?:think|thinking|thought|reasoning|cot)>/gi, '');
    return text.trim();
  }

  function buildTavernApiMessages(options = {}) {
    const {
      isImpersonate = false,
      isContinue = false,
      isSwipeRegen = false,
      targetMesIndex = null,
      forDebugConsole = false
    } = options;

    const card = getActiveCard();
    const preset = getActivePreset();
    const persona = getActivePersona();
    const sess = getActiveChatSession();
    const fullChat = sess ? (sess.messages || []) : [];
    // When regenerating an AI message at targetMesIndex, exclude that floor and anything after it so the AI generates a fresh response instead of continuing the old one!
    const rawChat = (isSwipeRegen && typeof targetMesIndex === 'number' && targetMesIndex >= 0)
      ? fullChat.slice(0, targetMesIndex)
      : fullChat;

    // Sync built-in CSPRNG D100 pool into extensionPrompts if enabled
    if (!forDebugConsole) {
      syncBuiltInD100Pool(isSwipeRegen);
    }

    // Collect World Book entries
    const wiBuckets = collectTriggeredWorldBookEntries(card, rawChat);

    const depthInjections = [...wiBuckets.atDepth];

    // Persona description injection if configured as @D
    if (persona && persona.description && persona.description.trim()) {
      const pText = replaceTavernMacros(persona.description.trim(), card);
      if (Number(persona.position) === 4) {
        const pDepth = Math.max(0, Number(persona.depth ?? 2));
        depthInjections.push({
          role: ['system', 'user', 'assistant'][Number(persona.role) || 0] || 'system',
          depth: pDepth,
          order: 90,
          content: pText,
          _debugLabel: '用户人设深度注入 @D' + pDepth
        });
      }
    }

    // Author's Note and World Info Before/After Author's Note (pos 2 & pos 3) injection
    const an = tavernState.authorNote || {};
    const anDepth = Math.max(0, Number(an.depth ?? 4));
    const anRole = an.role || 'system';
    if (wiBuckets.beforeAN && wiBuckets.beforeAN.length > 0) {
      depthInjections.push({
        role: anRole,
        depth: anDepth,
        order: 108,
        content: wiBuckets.beforeAN.join('\n\n'),
        _debugLabel: '世界书 · 作者注释前 @D' + anDepth
      });
    }
    if (an.text && an.text.trim()) {
      depthInjections.push({
        role: anRole,
        depth: anDepth,
        order: 110,
        content: replaceTavernMacros(an.text.trim(), card),
        _debugLabel: '作者注释 · Author Note @D' + anDepth
      });
    }
    if (wiBuckets.afterAN && wiBuckets.afterAN.length > 0) {
      depthInjections.push({
        role: anRole,
        depth: anDepth,
        order: 112,
        content: wiBuckets.afterAN.join('\n\n'),
        _debugLabel: '世界书 · 作者注释后 @D' + anDepth
      });
    }

    // Character's Note / Depth Prompt
    const charNoteText = (an.charNoteText && an.charNoteText.trim()) || (card && card.depth_prompt_prompt && card.depth_prompt_prompt.trim()) || '';
    if (charNoteText) {
      const cnDepth = Math.max(0, Number(an.charNoteDepth ?? card.depth_prompt_depth ?? 4));
      depthInjections.push({
        role: an.charNoteRole || card.depth_prompt_role || 'system',
        depth: cnDepth,
        order: 115,
        content: replaceTavernMacros(charNoteText, card),
        _debugLabel: '角色深度提示词 @D' + cnDepth
      });
    }

    // Memory Summary injection
    const mem = tavernState.memory || {};
    if (mem.enabled && mem.summaryText && mem.summaryText.trim()) {
      const mDepth = Math.max(0, Number(mem.injectDepth ?? 2));
      depthInjections.push({
        role: mem.injectRole || 'system',
        depth: mDepth,
        order: 95,
        content: '【前情剧情记忆摘要】\n' + replaceTavernMacros(mem.summaryText.trim(), card),
        _debugLabel: '前情剧情记忆摘要 @D' + mDepth
      });
    }

    // Extension prompts (SillyTavern IN_CHAT, IN_PROMPT, BEFORE_PROMPT)
    const beforePromptExtensionMessages = [];
    const inPromptExtensionMessages = [];
    Object.entries(tavernExtensionPrompts).forEach(([extKey, extP]) => {
      if (!extP || !extP.value || !String(extP.value).trim()) return;
      const extRole = extP.role === 1 ? 'user' : (extP.role === 2 ? 'assistant' : 'system');
      const resolvedVal = replaceTavernMacros(extP.value, card);
      const extLabelName = extKey || extP.key || '扩展模块';
      if (extP.position === TAVERN_EXT_PROMPT_TYPES.IN_CHAT) {
        const extDepth = Math.max(0, Number(extP.depth ?? 0));
        depthInjections.push({
          role: extRole,
          depth: extDepth,
          order: 999,
          content: resolvedVal,
          _debugLabel: '插件深度注入 @D' + extDepth + ' · ' + extLabelName
        });
      } else if (extP.position === TAVERN_EXT_PROMPT_TYPES.BEFORE_PROMPT) {
        beforePromptExtensionMessages.push({
          role: extRole,
          content: resolvedVal,
          _debugLabel: '插件前置提示词 · ' + extLabelName
        });
      } else if (extP.position === TAVERN_EXT_PROMPT_TYPES.IN_PROMPT) {
        inPromptExtensionMessages.push({
          role: extRole,
          content: resolvedVal,
          _debugLabel: '插件提示词注入 · ' + extLabelName
        });
      }
    });

    const isItemInChatDepth = (p) => {
      if (!p) return false;
      const pos = p.injection_position;
      if (pos === 1 || pos === '1') return true;
      if (typeof pos === 'string') {
        const lower = pos.trim().toLowerCase();
        if (lower === 'in_chat' || lower === 'in-chat' || lower === 'depth' || lower === '@d') return true;
      }
      return false;
    };

    // Relative and In-Chat custom prompts from preset (preserve exact prompt_order sequence via seqIdx)
    const allPresetPromptList = Array.isArray(preset.prompts) ? preset.prompts : [];
    const allPresetIds = new Set(allPresetPromptList.map(p => p && p.identifier).filter(Boolean));
    const enabledPresetPrompts = allPresetPromptList.filter(p => p && p.enabled);
    enabledPresetPrompts.forEach((p, seqIdx) => {
      if (!p.marker && isItemInChatDepth(p) && p.content && p.content.trim()) {
        const pDepth = Math.max(0, Number(p.injection_depth ?? 4));
        depthInjections.push({
          role: p.role || 'system',
          depth: pDepth,
          order: Number(p.injection_order ?? 100),
          seqIdx,
          content: applyTavernRegexPipeline(p.content, { isPrompt: true, depth: pDepth, card }),
          _debugLabel: '预设深度提示词 @D' + pDepth + ' · ' + (p.name || p.identifier || '自定义条目')
        });
      }
    });

    // Build chat history slice and strip any residual reasoning blocks from historical floors (excluding floors hidden by ST-BaiBai-Book /hide)
    const maxFloors = Math.max(4, Number(tavernState.memory?.contextFloors || 40));
    const visibleRawChat = rawChat.filter(m => !(m && m.extra && m.extra.bbs_hidden));
    const slicedChat = visibleRawChat.slice(-maxFloors);
    let lastUserSliceIdx = -1;
    for (let i = slicedChat.length - 1; i >= 0; i--) {
      if (slicedChat[i] && slicedChat[i].is_user) {
        lastUserSliceIdx = i;
        break;
      }
    }
    const chatHistoryMessages = slicedChat.map((m, idx) => {
      const depthFromEnd = slicedChat.length - 1 - idx;
      const baseMes = m.is_user ? (m.mes || '') : stripHistoricalReasoningFromText(m.mes || '');
      const cleanedContent = applyTavernRegexPipeline(baseMes, {
        isUser: Boolean(m.is_user),
        isPrompt: true,
        isChatFloor: true,
        depth: depthFromEnd,
        card
      });
      const floorNo = m.mesid !== undefined ? m.mesid : idx;
      const chatLabel = m.is_user
        ? (idx === lastUserSliceIdx ? `用户输入 · 本次发送 #${floorNo}` : `历史对话 · 用户 #${floorNo}`)
        : (m.is_system ? `历史对话 · 系统 #${floorNo}` : `历史对话 · 角色回复 #${floorNo}`);
      return {
        role: m.is_user ? 'user' : (m.is_system ? 'system' : 'assistant'),
        content: cleanedContent,
        _debugLabel: chatLabel,
        _isChatContext: true
      };
    });

    // Group @D depth injections by depth relative to the original chatHistoryMessages length so multiple items at the same depth stay together in exact (order, seqIdx) sequence without shifting subsequent depths
    const originalChatLen = chatHistoryMessages.length;
    const depthGroupsMap = new Map();
    depthInjections.forEach(inj => {
      const d = Math.max(0, Number(inj.depth ?? 0));
      if (!depthGroupsMap.has(d)) depthGroupsMap.set(d, []);
      depthGroupsMap.get(d).push(inj);
    });

    // Sort depths ascending (0, 1, 2, ...): splicing at originalChatLen - d from bottom (d=0) to top (larger d) never shifts indices of earlier messages at <= originalChatLen - d
    const sortedDepthsAsc = Array.from(depthGroupsMap.keys()).sort((a, b) => a - b);
    sortedDepthsAsc.forEach(d => {
      const group = depthGroupsMap.get(d);
      group.sort((a, b) => {
        const ordDiff = (a.order ?? 100) - (b.order ?? 100);
        if (ordDiff !== 0) return ordDiff;
        return (a.seqIdx ?? 0) - (b.seqIdx ?? 0);
      });
      const targetIdx = Math.max(0, originalChatLen - d);
      const formattedGroup = group.map(inj => ({
        role: inj.role || 'system',
        content: inj.content,
        _debugLabel: inj._debugLabel || ('深度注入 @D' + d),
        _isChatContext: true
      }));
      chatHistoryMessages.splice(targetIdx, 0, ...formattedGroup);
    });

    // Assemble top-level prompt order
    const finalMessages = [...beforePromptExtensionMessages];

    if (!allPresetIds.has('main')) {
      const fallbackMain = (card && card.system_prompt && card.system_prompt.trim()) || tavernState.formatting.systemPrompt || '';
      if (fallbackMain.trim()) {
        finalMessages.push({
          role: 'system',
          content: applyTavernRegexPipeline(fallbackMain, { isPrompt: true, card }),
          _debugLabel: '预设系统提示词 · Main Prompt'
        });
      }
    }

    for (const item of enabledPresetPrompts) {
      const id = item.identifier;
      if (id === 'worldInfoBefore') {
        if (wiBuckets.beforeChar.length > 0) {
          finalMessages.push({
            role: 'system',
            content: wiBuckets.beforeChar.join('\n\n'),
            _debugLabel: '世界书 · 角色定义前'
          });
        }
      } else if (id === 'worldInfoAfter') {
        if (wiBuckets.afterChar.length > 0) {
          finalMessages.push({
            role: 'system',
            content: wiBuckets.afterChar.join('\n\n'),
            _debugLabel: '世界书 · 角色定义后'
          });
        }
      } else if (id === 'personaDescription') {
        if (persona && persona.description && Number(persona.position) !== 4) {
          finalMessages.push({
            role: 'system',
            content: replaceTavernMacros(persona.description, card),
            _debugLabel: '用户人设 · Persona'
          });
        }
      } else if (id === 'charDescription') {
        if (card && card.description && card.description.trim()) {
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(card.description, { isPrompt: true, card }),
            _debugLabel: '角色设定 · Description'
          });
        }
      } else if (id === 'charPersonality') {
        if (card && card.personality && card.personality.trim()) {
          const fmt = preset.personality_format || tavernState.formatting.personalityFormat || '{{personality}}';
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(fmt.replace(/\{\{personality\}\}/gi, card.personality), { isPrompt: true, card }),
            _debugLabel: '角色性格 · Personality'
          });
        }
      } else if (id === 'scenario') {
        if (card && card.scenario && card.scenario.trim()) {
          const fmt = preset.scenario_format || tavernState.formatting.scenarioFormat || '{{scenario}}';
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(fmt.replace(/\{\{scenario\}\}/gi, card.scenario), { isPrompt: true, card }),
            _debugLabel: '场景设定 · Scenario'
          });
        }
      } else if (id === 'dialogueExamples') {
        const parts = [];
        if (wiBuckets.beforeExample.length > 0) parts.push(wiBuckets.beforeExample.join('\n'));
        if (card && card.mes_example && card.mes_example.trim()) {
          parts.push(applyTavernRegexPipeline(card.mes_example, { isPrompt: true, card }));
        }
        if (wiBuckets.afterExample.length > 0) parts.push(wiBuckets.afterExample.join('\n'));
        if (parts.length > 0) {
          finalMessages.push({
            role: 'system',
            content: parts.join('\n\n'),
            _debugLabel: '对话示例 · Dialogue Examples'
          });
        }
      } else if (id === 'chatHistory') {
        if (!allPresetIds.has('worldInfoBefore') && wiBuckets.beforeChar.length > 0) {
          finalMessages.push({
            role: 'system',
            content: wiBuckets.beforeChar.join('\n\n'),
            _debugLabel: '世界书 · 角色定义前'
          });
        }
        if (!allPresetIds.has('personaDescription') && persona && persona.description && Number(persona.position) !== 4) {
          finalMessages.push({
            role: 'system',
            content: replaceTavernMacros(persona.description, card),
            _debugLabel: '用户人设 · Persona'
          });
        }
        if (!allPresetIds.has('charDescription') && card && card.description && card.description.trim()) {
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(card.description, { isPrompt: true, card }),
            _debugLabel: '角色设定 · Description'
          });
        }
        if (!allPresetIds.has('charPersonality') && card && card.personality && card.personality.trim()) {
          const fmt = preset.personality_format || tavernState.formatting.personalityFormat || '{{personality}}';
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(fmt.replace(/\{\{personality\}\}/gi, card.personality), { isPrompt: true, card }),
            _debugLabel: '角色性格 · Personality'
          });
        }
        if (!allPresetIds.has('scenario') && card && card.scenario && card.scenario.trim()) {
          const fmt = preset.scenario_format || tavernState.formatting.scenarioFormat || '{{scenario}}';
          finalMessages.push({
            role: 'system',
            content: applyTavernRegexPipeline(fmt.replace(/\{\{scenario\}\}/gi, card.scenario), { isPrompt: true, card }),
            _debugLabel: '场景设定 · Scenario'
          });
        }
        if (!allPresetIds.has('dialogueExamples')) {
          const parts = [];
          if (wiBuckets.beforeExample.length > 0) parts.push(wiBuckets.beforeExample.join('\n'));
          if (card && card.mes_example && card.mes_example.trim()) {
            parts.push(applyTavernRegexPipeline(card.mes_example, { isPrompt: true, card }));
          }
          if (wiBuckets.afterExample.length > 0) parts.push(wiBuckets.afterExample.join('\n'));
          if (parts.length > 0) {
            finalMessages.push({
              role: 'system',
              content: parts.join('\n\n'),
              _debugLabel: '对话示例 · Dialogue Examples'
            });
          }
        }
        if (!allPresetIds.has('worldInfoAfter') && wiBuckets.afterChar.length > 0) {
          finalMessages.push({
            role: 'system',
            content: wiBuckets.afterChar.join('\n\n'),
            _debugLabel: '世界书 · 角色定义后'
          });
        }
        if (inPromptExtensionMessages.length > 0) {
          finalMessages.push(...inPromptExtensionMessages);
        }
        if (tavernState.formatting.newChatPrompt && chatHistoryMessages.length > 0) {
          finalMessages.push({
            role: 'system',
            content: replaceTavernMacros(tavernState.formatting.newChatPrompt, card),
            _debugLabel: '新对话开始提示词'
          });
        }
        finalMessages.push(...chatHistoryMessages);
      } else if (id === 'main') {
        let content = item.content || tavernState.formatting.systemPrompt || '';
        if (card && card.system_prompt && card.system_prompt.trim() && !item.forbid_overrides) {
          content = card.system_prompt;
        }
        if (content.trim()) {
          finalMessages.push({
            role: item.role || 'system',
            content: applyTavernRegexPipeline(content, { isPrompt: true, card }),
            _debugLabel: '预设系统提示词 · ' + (item.name || 'Main Prompt')
          });
        }
      } else if (id === 'jailbreak') {
        let content = item.content || tavernState.formatting.postHistoryPrompt || '';
        if (card && card.post_history_instructions && card.post_history_instructions.trim() && !item.forbid_overrides) {
          content = card.post_history_instructions;
        }
        if (content.trim()) {
          finalMessages.push({
            role: item.role || 'system',
            content: applyTavernRegexPipeline(content, { isPrompt: true, card }),
            _debugLabel: '预设后置指令 · ' + (item.name || 'Post-History Instructions')
          });
        }
      } else if (!item.marker && !isItemInChatDepth(item)) {
        if (item.content && item.content.trim()) {
          finalMessages.push({
            role: item.role || 'system',
            content: applyTavernRegexPipeline(item.content, { isPrompt: true, card }),
            _debugLabel: '预设提示词 · ' + (item.name || item.identifier || '自定义条目')
          });
        }
      }
    }

    if (!allPresetIds.has('jailbreak')) {
      const fallbackJb = (card && card.post_history_instructions && card.post_history_instructions.trim()) || tavernState.formatting.postHistoryPrompt || '';
      if (fallbackJb.trim()) {
        finalMessages.push({
          role: 'system',
          content: applyTavernRegexPipeline(fallbackJb, { isPrompt: true, card }),
          _debugLabel: '预设后置指令 · Post-History Instructions'
        });
      }
    }

    if (isImpersonate) {
      finalMessages.push({
        role: 'system',
        content: replaceTavernMacros(tavernState.formatting.impersonationPrompt || preset.impersonation_prompt, card),
        _debugLabel: '帮写生成控制指令'
      });
    } else if (isContinue) {
      finalMessages.push({
        role: 'system',
        content: replaceTavernMacros(tavernState.formatting.continueNudgePrompt || preset.continue_nudge_prompt, card),
        _debugLabel: '继续生成控制指令'
      });
    }

    const filtered = finalMessages.filter(m => m && m.content && String(m.content).trim().length > 0);

    // Merge consecutive trailing assistant messages (e.g. multiple CoT prefill items at the end) and optionally squash consecutive system messages
    const mergedList = [];
    for (let i = 0; i < filtered.length; i++) {
      const msg = filtered[i];
      const prev = mergedList[mergedList.length - 1];
      if (prev && prev.role === 'system' && msg.role === 'system' && preset.squash_system_messages) {
        prev.content += '\n\n' + msg.content;
      } else if (prev && prev.role === 'assistant' && msg.role === 'assistant' && i >= filtered.length - 2) {
        prev.content += '\n' + msg.content;
      } else {
        mergedList.push({ ...msg });
      }
    }

    try {
      Object.defineProperty(mergedList, '_debugBlocks', {
        value: filtered,
        enumerable: false,
        configurable: true
      });
    } catch (_) {}

    return mergedList;
  }

  function getExternalPhoneApiPresets() {
    const list = [];
    try {
      if (typeof state !== 'undefined' && state) {
        if (Array.isArray(state.apiPresets)) {
          state.apiPresets.forEach(p => {
            if (p && p.name) list.push(p);
          });
        } else if (state.apiConfig && Array.isArray(state.apiConfig.presets)) {
          state.apiConfig.presets.forEach(p => {
            if (p && p.name) list.push(p);
          });
        }
      }
    } catch (_) {}

    if (list.length === 0) {
      const selectEl = document.getElementById('api-preset-select');
      if (selectEl && selectEl.options) {
        Array.from(selectEl.options).forEach(opt => {
          if (opt.value && opt.textContent) {
            list.push({
              id: opt.value,
              name: opt.textContent.trim()
            });
          }
        });
      }
    }
    return list;
  }

  function resolveTavernApiCredentials() {
    const cfg = tavernState.apiConfig || {};
    let extUrl = '';
    let extKey = '';
    let extModel = '';
    try {
      if (typeof window.getEffectiveApiConfig === 'function') {
        const eff = window.getEffectiveApiConfig();
        if (eff) {
          extUrl = normalizeTavernBaseUrl(eff.proxyUrl || eff.url || eff.apiUrl || '');
          extKey = cleanTavernApiKeyString(eff.apiKey || eff.key || '');
          extModel = String(eff.model || '').trim();
        }
      }
      if ((!extUrl || !extKey) && typeof state !== 'undefined' && state && state.apiConfig) {
        extUrl = extUrl || normalizeTavernBaseUrl(state.apiConfig.proxyUrl || state.apiConfig.url || state.apiConfig.apiUrl || '');
        extKey = extKey || cleanTavernApiKeyString(state.apiConfig.apiKey || state.apiConfig.key || '');
        extModel = extModel || String(state.apiConfig.model || '').trim();
      }
    } catch (_) {}

    const domUrl = normalizeTavernBaseUrl(document.getElementById('proxy-url')?.value || document.getElementById('api-url')?.value || '');
    const domKey = cleanTavernApiKeyString(document.getElementById('api-key')?.value || '');
    const domModel = (document.getElementById('model-input')?.value || document.getElementById('model-select')?.value || document.getElementById('api-model')?.value || '').trim();

    const activeBuiltInId = cfg.activeSavedPresetId || cfg.activeApiPresetId || '';
    const matchedBuiltIn = (activeBuiltInId && Array.isArray(cfg.savedPresets))
      ? cfg.savedPresets.find(x => x && x.id === activeBuiltInId)
      : null;

    if (cfg.useExternalPhoneApi !== false) {
      if (cfg.selectedExternalPresetName) {
        const extPresets = getExternalPhoneApiPresets();
        const matched = extPresets.find(p => p && (p.name === cfg.selectedExternalPresetName || String(p.id) === String(cfg.selectedExternalPresetName)));
        if (matched && (matched.proxyUrl || matched.url || matched.apiUrl)) {
          const pUrl = normalizeTavernBaseUrl(matched.proxyUrl || matched.url || matched.apiUrl || extUrl || domUrl || '');
          const pKey = cleanTavernApiKeyString(matched.apiKey || matched.key || extKey || domKey || '');
          const pMod = (matched.model || extModel || domModel || 'gpt-4o-mini').trim();
          return { baseUrl: pUrl, apiKey: pKey, model: pMod };
        }
      }
      const finalExtUrl = extUrl || domUrl || normalizeTavernBaseUrl(cfg.customUrl || '');
      const finalExtKey = extKey || domKey || cleanTavernApiKeyString(cfg.customKey || '');
      const finalExtModel = extModel || domModel || (cfg.customModel || '').trim() || 'gpt-4o-mini';
      return { baseUrl: finalExtUrl, apiKey: finalExtKey, model: finalExtModel };
    }

    return {
      baseUrl: normalizeTavernBaseUrl(cfg.customUrl || matchedBuiltIn?.url || extUrl || domUrl || ''),
      apiKey: cleanTavernApiKeyString(cfg.customKey || matchedBuiltIn?.key || extKey || domKey || ''),
      model: (cfg.customModel || matchedBuiltIn?.model || extModel || domModel || 'gpt-4o-mini').trim()
    };
  }

  function detectAssistantReasoningPrefill(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return false;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content) return false;
    const txt = String(lastMsg.content).trim();
    if (/<(?:think|thinking|thought|reasoning|cot)>\s*$/i.test(txt)) return true;
    const pairs = getActiveReasoningTagPairs();
    for (const pair of pairs) {
      const startTag = String(pair?.start || '').trim();
      if (startTag) {
        const escStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(escStart + '\\s*$', 'i').test(txt)) return true;
      }
    }
    return false;
  }

  function extractReasoningAndCleanReply(rawReply, options = {}) {
    if (!rawReply) return { reasoning: '', cleanReply: '' };
    let text = String(rawReply);
    const reasoningChunks = [];
    const pairs = getActiveReasoningTagPairs();

    // 1. Custom reasoning tags (all configured pairs)
    for (const pair of pairs) {
      const startTag = String(pair?.start || '').trim();
      const endTag = String(pair?.end || '').trim();
      if (!startTag || !endTag) continue;
      const escStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const customRx = new RegExp(escStart + '([\\s\\S]*?)' + escEnd, 'gi');
      text = text.replace(customRx, (_, inner) => {
        if (inner && inner.trim()) reasoningChunks.push(inner.trim());
        return '';
      });
    }

    // 2. Standard reasoning tags (paired: <think>, <thinking>, <thought>, <reasoning>, <cot>)
    text = text.replace(/<(?:think|thinking|thought|reasoning|cot)>([\s\S]*?)<\/(?:think|thinking|thought|reasoning|cot)>/gi, (_, inner) => {
      if (inner && inner.trim()) reasoningChunks.push(inner.trim());
      return '';
    });

    // 3. Prefill closing tag without opening tag
    for (const pair of pairs) {
      const startTag = String(pair?.start || '').trim();
      const endTag = String(pair?.end || '').trim();
      if (!endTag) continue;
      const escStart = startTag ? startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
      const escEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefillCustomRx = new RegExp('^([\\s\\S]*?)' + escEnd, 'i');
      const mCustom = text.match(prefillCustomRx);
      if (mCustom && (!escStart || !new RegExp(escStart, 'i').test(mCustom[1]))) {
        if (mCustom[1].trim()) reasoningChunks.push(mCustom[1].trim());
        text = text.slice(mCustom[0].length);
      }
    }
    const prefillStdMatch = text.match(/^([\s\S]*?)<\/(?:think|thinking|thought|reasoning|cot)>/i);
    if (prefillStdMatch && !/<(?:think|thinking|thought|reasoning|cot)>/i.test(prefillStdMatch[1])) {
      if (prefillStdMatch[1].trim()) reasoningChunks.push(prefillStdMatch[1].trim());
      text = text.slice(prefillStdMatch[0].length);
    }

    // 4. Unclosed opening tag during live streaming
    for (const pair of pairs) {
      const startTag = String(pair?.start || '').trim();
      if (!startTag) continue;
      const escStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const unclosedCustomRx = new RegExp(escStart + '([\\s\\S]*)$', 'i');
      const uCustom = text.match(unclosedCustomRx);
      if (uCustom) {
        if (uCustom[1].trim()) reasoningChunks.push(uCustom[1].trim());
        text = text.slice(0, uCustom.index);
      }
    }
    const unclosedStdMatch = text.match(/<(?:think|thinking|thought|reasoning|cot)>([\s\S]*)$/i);
    if (unclosedStdMatch) {
      if (unclosedStdMatch[1].trim()) reasoningChunks.push(unclosedStdMatch[1].trim());
      text = text.slice(0, unclosedStdMatch.index);
    }

    let cleanReply = text.trim();
    if (tavernState.formatting?.collapseNewlines) {
      cleanReply = cleanReply.replace(/\n{3,}/g, '\n\n');
    }

    return {
      reasoning: reasoningChunks.join('\n\n'),
      cleanReply
    };
  }

  async function callTavernAiCompletion(messages, onStreamUpdate = null, options = {}) {
    const isBackground = Boolean(options && options.isBackground);
    const creds = resolveTavernApiCredentials();
    if (!creds.baseUrl || !creds.apiKey) {
      throw new Error('未检测到有效的API地址与密钥，请点击顶栏第二个插头配置或同步外部API');
    }

    const preset = getActivePreset();
    const isStreamSettingOn = tavernState.apiConfig?.streamEnabled !== undefined
      ? Boolean(tavernState.apiConfig.streamEnabled)
      : Boolean(preset.stream_openai);
    const useStreaming = isStreamSettingOn && typeof onStreamUpdate === 'function';
    const hasPrefill = detectAssistantReasoningPrefill(messages);

    const cleanBase = normalizeTavernBaseUrl(creds.baseUrl);
    const cleanKey = cleanTavernApiKeyString(creds.apiKey);
    const endpoints = cleanBase.endsWith('/v1')
      ? [cleanBase + '/chat/completions', cleanBase.replace(/\/v1$/i, '') + '/chat/completions']
      : [cleanBase + '/v1/chat/completions', cleanBase + '/chat/completions'];

    const requestedMaxTokens = isBackground
      ? 100000
      : Math.min(8192, Math.max(1024, Number(preset.openai_max_tokens || 4096)));
    const cleanWireMessages = Array.isArray(messages)
      ? messages.map(m => ({ role: m?.role || 'system', content: String(m?.content || '') }))
      : [];
    const payload = {
      model: creds.model,
      messages: cleanWireMessages,
      temperature: Number(preset.temperature ?? 1.0),
      top_p: Number(preset.top_p ?? 1.0),
      max_tokens: requestedMaxTokens,
      frequency_penalty: Number(preset.frequency_penalty ?? 0),
      presence_penalty: Number(preset.presence_penalty ?? 0),
      stream: useStreaming
    };

    if (!isBackground && Array.isArray(tavernState.formatting?.customStoppingStrings) && tavernState.formatting.customStoppingStrings.length > 0) {
      payload.stop = tavernState.formatting.customStoppingStrings;
    }

    const abortCtrl = new AbortController();
    if (!isBackground) {
      uiRuntime.abortController = abortCtrl;
    }

    let requestTimedOut = false;
    const timeoutMs = 180000;
    const timeoutTimer = setTimeout(() => {
      requestTimedOut = true;
      try { abortCtrl.abort(); } catch (_) {}
    }, timeoutMs);

    try {
      const reqHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cleanKey,
        'Accept': useStreaming ? 'text/event-stream' : 'application/json'
      };

      const t0 = performance.now();
      let res = null;
      let lastNetErr = null;
      for (const ep of endpoints) {
        try {
          res = await executeTavernRawFetchWithProxyFallback(ep, {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify(payload),
            signal: abortCtrl.signal
          });
          if (res.status === 400) {
            const errProbe = await res.text().catch(() => '');
            if (/max_tokens|max_completion_tokens|maximum|token/i.test(errProbe)) {
              const retryPayload = Object.assign({}, payload);
              delete retryPayload.max_tokens;
              res = await executeTavernRawFetchWithProxyFallback(ep, {
                method: 'POST',
                headers: reqHeaders,
                body: JSON.stringify(retryPayload),
                signal: abortCtrl.signal
              });
            } else {
              res = new Response(errProbe, { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
          }
          if (res.status !== 404 && res.status !== 405) {
            break;
          }
        } catch (netErr) {
          if (netErr && netErr.name === 'AbortError') {
            if (requestTimedOut) {
              throw new Error('API响应超时，已等待超过3分钟无返回，请检查反代或模型状态');
            }
            throw new Error('已手动停止生成');
          }
          lastNetErr = netErr;
        }
      }

      if (!res) {
        throw new Error('网络连接失败，请检查API地址是否正确或跨域代理是否可用: ' + (lastNetErr?.message || 'Failed to fetch'));
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let detail = errText.slice(0, 200) || res.statusText;
        try {
          const errJson = JSON.parse(errText);
          if (errJson && errJson.error) {
            detail = errJson.error.message || errJson.error.code || JSON.stringify(errJson.error);
          } else if (errJson && errJson.message) {
            detail = errJson.message;
          }
        } catch (_) {}
        throw new Error('API请求失败 HTTP ' + res.status + ': ' + detail);
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      const extractErrorFromJson = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.error) {
          if (typeof obj.error === 'string') return obj.error;
          return obj.error.message || obj.error.code || JSON.stringify(obj.error);
        }
        return null;
      };

      const checkFinishReasonRefusal = (choiceObj, dataObj) => {
        const finishReason = String(choiceObj?.finish_reason || choiceObj?.stop_reason || dataObj?.promptFeedback?.blockReason || '').toLowerCase();
        const refusalText = String(choiceObj?.message?.refusal || choiceObj?.delta?.refusal || '').trim();
        if (refusalText) {
          return '模型拒绝生成: ' + refusalText;
        }
        if (finishReason && ['content_filter', 'safety', 'prohibited', 'recitation', 'blocklist', 'other'].includes(finishReason)) {
          return '模型触发安全审查或过滤拒绝生成: ' + finishReason;
        }
        if (dataObj?.promptFeedback?.blockReason) {
          return '请求被上游安全策略拦截: ' + dataObj.promptFeedback.blockReason;
        }
        return null;
      };

      // Strictly Non-Streaming Mode
      if (!useStreaming) {
        let rawText = '';
        try {
          rawText = await res.text();
        } catch (readTxtErr) {
          if (readTxtErr && readTxtErr.name === 'AbortError') {
            if (requestTimedOut) {
              throw new Error('API读取响应超时，请检查反代连接或切换流式模式');
            }
            throw new Error('已手动停止生成');
          }
          throw readTxtErr;
        }
        let rawContent = '';
        let nativeReasoning = '';
        let refusalReason = null;
        const trimmed = rawText.trim();
        if (trimmed.startsWith('data:')) {
          const lines = trimmed.split(/\r?\n/);
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;
            let parsedChunk;
            try {
              parsedChunk = JSON.parse(dataStr);
            } catch (_) {
              continue;
            }
            const apiErr = extractErrorFromJson(parsedChunk);
            if (apiErr) throw new Error('API返回错误: ' + apiErr);
            const choice = parsedChunk.choices && parsedChunk.choices[0];
            if (!choice) continue;
            const refErr = checkFinishReasonRefusal(choice, parsedChunk);
            if (refErr) refusalReason = refErr;
            const delta = choice.delta || choice.message || {};
            if (typeof delta.content === 'string') {
              rawContent += delta.content;
            } else if (Array.isArray(delta.content)) {
              delta.content.forEach(part => {
                if (typeof part === 'string') rawContent += part;
                else if (part && (part.type === 'thinking' || part.thinking)) nativeReasoning += (part.thinking || part.text || '');
                else if (part && part.text) rawContent += part.text;
              });
            }
            const rDelta = delta.reasoning_content || delta.reasoning || '';
            if (rDelta) nativeReasoning += rDelta;
          }
        } else {
          let data;
          try {
            data = JSON.parse(trimmed);
          } catch (_) {
            throw new Error('API返回了非JSON格式响应: ' + trimmed.slice(0, 120));
          }
          const apiErr = extractErrorFromJson(data);
          if (apiErr) throw new Error('API返回错误: ' + apiErr);
          const choice = data.choices && data.choices[0];
          const refErr = checkFinishReasonRefusal(choice, data);
          if (refErr) refusalReason = refErr;
          const msgObj = choice ? (choice.message || choice.delta || {}) : {};
          if (typeof msgObj.content === 'string') {
            rawContent = msgObj.content;
          } else if (Array.isArray(msgObj.content)) {
            msgObj.content.forEach(part => {
              if (typeof part === 'string') rawContent += part;
              else if (part && (part.type === 'thinking' || part.thinking)) nativeReasoning += (part.thinking || part.text || '');
              else if (part && part.text) rawContent += part.text;
            });
          }
          nativeReasoning += (msgObj.reasoning_content || msgObj.reasoning || '');
        }

        const parsed = extractReasoningAndCleanReply(rawContent, { hasPrefill, isLiveStream: false });
        const combinedReasoning = [nativeReasoning, parsed.reasoning].filter(Boolean).join('\n\n');
        if (!parsed.cleanReply && !combinedReasoning) {
          if (refusalReason) {
            throw new Error(refusalReason);
          }
          throw new Error('AI返回了空内容或拒绝生成，请检查模型额度、预设提示词或反代状态');
        }
        const finalCleanReply = parsed.cleanReply || (refusalReason ? ('【' + refusalReason + '】') : '【模型仅输出了思考过程，未输出正文或被截断，请展开上方思考过程查看或点击重新生成】');
        const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1) + 's';
        return {
          content: finalCleanReply,
          reasoning: combinedReasoning,
          rawContent,
          genTime: elapsedSec
        };
      }

    // Real-Time Streaming Mode: Render tokens immediately as they arrive from the network socket
    if (res.body && !contentType.includes('application/json')) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';
      let networkContent = '';
      let nativeReasoningAccum = '';
      let streamErrorMsg = null;

      const parseSseLines = (linesArr) => {
        for (const rawLine of linesArr) {
          const line = rawLine.trim();
          if (!line) continue;
          let dataStr = '';
          if (line.startsWith('data:')) {
            dataStr = line.slice(5).trim();
          } else if (line.startsWith('{') && line.endsWith('}')) {
            dataStr = line;
          } else {
            continue;
          }
          if (!dataStr || dataStr === '[DONE]') continue;
          try {
            const parsedChunk = JSON.parse(dataStr);
            const apiErr = extractErrorFromJson(parsedChunk);
            if (apiErr) {
              streamErrorMsg = apiErr;
              return;
            }
            const choice = parsedChunk.choices && parsedChunk.choices[0];
            if (!choice) continue;
            const delta = choice.delta || choice.message || {};
            if (typeof delta.content === 'string' && delta.content) {
              networkContent += delta.content;
            } else if (Array.isArray(delta.content)) {
              delta.content.forEach(part => {
                if (typeof part === 'string') networkContent += part;
                else if (part && (part.type === 'thinking' || part.thinking)) nativeReasoningAccum += (part.thinking || part.text || '');
                else if (part && part.text) networkContent += part.text;
              });
            } else if (typeof choice.text === 'string' && choice.text) {
              networkContent += choice.text;
            }
            const rDelta = delta.reasoning_content || delta.reasoning || '';
            if (rDelta) {
              nativeReasoningAccum += rDelta;
            }
          } catch (_) {}
        }
      };

      const flushLiveDom = (isLive) => {
        const liveParsed = extractReasoningAndCleanReply(networkContent, { hasPrefill, isLiveStream: isLive });
        const liveReasoning = [nativeReasoningAccum, liveParsed.reasoning].filter(Boolean).join('\n\n');
        const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1) + 's';
        onStreamUpdate({
          content: liveParsed.cleanReply,
          reasoning: liveReasoning,
          genTime: elapsedSec,
          isStreaming: isLive
        });
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            sseBuffer += decoder.decode();
            if (sseBuffer.trim()) {
              parseSseLines(sseBuffer.split(/\r?\n/));
              sseBuffer = '';
            }
            break;
          }
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split(/\r?\n/);
          sseBuffer = lines.pop() || '';
          parseSseLines(lines);
          if (streamErrorMsg) {
            throw new Error('API流式返回错误: ' + streamErrorMsg);
          }
          flushLiveDom(true);
        }
      } catch (readErr) {
        if (readErr && readErr.name === 'AbortError') {
          const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1) + 's';
          const partialParsed = extractReasoningAndCleanReply(networkContent, { hasPrefill, isLiveStream: false });
          const partialReasoning = [nativeReasoningAccum, partialParsed.reasoning].filter(Boolean).join('\n\n');
          return {
            content: partialParsed.cleanReply,
            reasoning: partialReasoning,
            genTime: elapsedSec,
            aborted: true
          };
        }
        throw readErr;
      }

      if (streamErrorMsg) {
        throw new Error('API流式返回错误: ' + streamErrorMsg);
      }

      // Check if proxy returned a raw JSON body without SSE "data:" prefixes
      if (!networkContent && !nativeReasoningAccum && sseBuffer.trim().startsWith('{')) {
        try {
          const fallbackJson = JSON.parse(sseBuffer.trim());
          const apiErr = extractErrorFromJson(fallbackJson);
          if (apiErr) throw new Error('API返回错误: ' + apiErr);
          const choice = fallbackJson.choices && fallbackJson.choices[0];
          const msgObj = choice ? (choice.message || choice.delta || {}) : {};
          networkContent = msgObj.content || '';
          nativeReasoningAccum = msgObj.reasoning_content || msgObj.reasoning || '';
        } catch (e) {
          if (e.message && e.message.startsWith('API')) throw e;
        }
      }

      const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1) + 's';
      const finalParsed = extractReasoningAndCleanReply(networkContent, { hasPrefill, isLiveStream: false });
      const finalReasoning = [nativeReasoningAccum, finalParsed.reasoning].filter(Boolean).join('\n\n');
      if (!finalParsed.cleanReply && !finalReasoning) {
        throw new Error('AI返回了空内容或拒绝生成，请检查模型额度、预设提示词或反代状态');
      }
      const finalCleanStreamReply = finalParsed.cleanReply || '【模型仅输出了思考过程，未输出正文或被截断，请展开上方思考过程查看或点击重新生成】';
      return {
        content: finalCleanStreamReply,
        reasoning: finalReasoning,
        genTime: elapsedSec
      };
    }

    // Fallback when proxy returns application/json even though stream:true was requested
    const data = await res.json();
    const apiErr = extractErrorFromJson(data);
    if (apiErr) throw new Error('API返回错误: ' + apiErr);
    const choice = data.choices && data.choices[0];
    const refErr = checkFinishReasonRefusal(choice, data);
    const msgObj = choice ? (choice.message || choice.delta || {}) : {};
    const rawContent = msgObj.content || '';
    const nativeReasoning = msgObj.reasoning_content || msgObj.reasoning || '';

    const parsed = extractReasoningAndCleanReply(rawContent, { hasPrefill, isLiveStream: false });
    const combinedReasoning = [nativeReasoning, parsed.reasoning].filter(Boolean).join('\n\n');
    if (!parsed.cleanReply && !combinedReasoning) {
      if (refErr) throw new Error(refErr);
      throw new Error('AI返回了空内容或拒绝生成，请检查模型额度、预设提示词或反代状态');
    }
    const finalCleanFallbackReply = parsed.cleanReply || (refErr ? ('【' + refErr + '】') : '【模型仅输出了思考过程，未输出正文或被截断，请展开上方思考过程查看或点击重新生成】');

    const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1) + 's';
    if (useStreaming && typeof onStreamUpdate === 'function') {
      onStreamUpdate({
        content: finalCleanFallbackReply,
        reasoning: combinedReasoning,
        genTime: elapsedSec,
        isStreaming: false
      });
    }

    return {
      content: finalCleanFallbackReply,
      reasoning: combinedReasoning,
      genTime: elapsedSec
    };
    } finally {
      clearTimeout(timeoutTimer);
    }
  }

  async function fetchTavernModelList(overrideUrl = '', overrideKey = '') {
    const creds = resolveTavernApiCredentials();
    const base = normalizeTavernBaseUrl(overrideUrl || creds.baseUrl);
    const key = cleanTavernApiKeyString(overrideKey || creds.apiKey);
    if (!base || !key) {
      throw new Error('请先填写API地址与密钥');
    }
    const endpoints = [base + '/v1/models', base + '/models'];
    let lastStatus = 500;
    let lastErrMsg = '';
    for (const modelsUrl of endpoints) {
      try {
        const res = await executeTavernRawFetchWithProxyFallback(modelsUrl, {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + key }
        });
        lastStatus = res.status;
        if (res.ok) {
          const data = await res.json();
          const rawArr = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.models) ? data.models : (Array.isArray(data) ? data : []));
          return rawArr.map(m => (typeof m === 'string' ? m : (m?.id || m?.name?.replace(/^models\//, '')))).filter(Boolean);
        }
      } catch (err) {
        lastErrMsg = err?.message || '';
      }
    }
    throw new Error('拉取模型失败 ' + (lastErrMsg || ('HTTP ' + lastStatus)));
  }

  async function generateMemorySummaryFromChat() {
    const sess = getActiveChatSession();
    if (!sess || !Array.isArray(sess.messages) || sess.messages.length === 0) {
      throw new Error('当前没有可总结的对话记录');
    }
    const card = getActiveCard();
    const recentText = sess.messages
      .slice(-30)
      .map(m => (m.is_user ? getUserDisplayName() : card.name) + ': ' + (m.mes || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ''))
      .join('\n');

    const prompt = (tavernState.memory?.summaryPrompt || '请用精炼中文总结以上剧情的关键事件与人物关系变化。') + '\n\n【对话记录】\n' + recentText;
    const result = await callTavernAiCompletion([
      { role: 'system', content: '你是一个专业的RPG剧情归档助手。' },
      { role: 'user', content: prompt }
    ]);
    tavernState.memory.summaryText = result.content;
    await saveTavernStore();
    return result.content;
  }

  // ============================================================================
  // 9. Base SillyTavern Stage CSS & UI State
  // ============================================================================
  const uiRuntime = {
    openDrawerKey: null,
    showAdvancedSamplers: false,
    showAdvancedWorldBookSettings: false,
    editingPromptId: null,
    activeWorldBookEditId: null,
    editingWorldEntryUid: null,
    worldEntrySearch: '',
    editingRegexId: null,
    regexTestInput: '',
    openExtensionAcc: {
      regex: true,
      an: false,
      memory: false,
      plugins: true
    },
    activeHelperScriptId: null,
    activePluginModalId: null,
    editingFloorMesId: null,
    editingFloorReasoning: false,
    openExtraMenuMesId: null,
    showOptionsPopup: false,
    showExtensionsPopup: false,
    isGenerating: false,
    abortController: null,
    userScrolledUpDuringStream: false,
    visibleFloorCount: 30,
    lazyFloorChatId: null,
    showDebugConsole: false,
    debugConsoleLogs: [],
    debugConsoleClearedChatId: '',
    toastTimer: null,
    errorTimer: null
  };

  function formatTavernApiMessagesForDebugConsole(apiMessages) {
    const blocks = Array.isArray(apiMessages?._debugBlocks)
      ? apiMessages._debugBlocks
      : (Array.isArray(apiMessages) ? apiMessages : []);
    if (blocks.length === 0) return '';
    const textBlocks = [];
    blocks.forEach((msg, idx) => {
      const role = msg?.role || 'system';
      let baseRoleTitle = '系统提示与全部注入词';
      if (role === 'user') baseRoleTitle = '用户输入';
      else if (role === 'assistant') baseRoleTitle = '助手历史回复与预填充';
      const detailLabel = msg?._debugLabel ? ` · ${msg._debugLabel}` : '';
      const rawContent = String(msg?.content || '');
      const itemTokens = estimateTokens(rawContent);
      const curIsCtx = Boolean(msg?._isChatContext);
      const prevIsCtx = idx > 0 ? Boolean(blocks[idx - 1]?._isChatContext) : false;
      const nextIsCtx = idx < blocks.length - 1 ? Boolean(blocks[idx + 1]?._isChatContext) : false;

      let blockStr = `=== 第 ${idx + 1} 块消息 · ${baseRoleTitle}${detailLabel} · ${role} · ${itemTokens} Tokens ===\n${rawContent}`;
      if (curIsCtx && !prevIsCtx) {
        blockStr = `==================================================\n【上下文 开始】\n${blockStr}`;
      }
      if (curIsCtx && !nextIsCtx) {
        blockStr = `${blockStr}\n【上下文 结束】\n==================================================`;
      }
      textBlocks.push(blockStr);
    });
    return textBlocks.join('\n\n');
  }

  function calculateTavernApiMessagesTokens(apiMessages) {
    const blocks = Array.isArray(apiMessages?._debugBlocks)
      ? apiMessages._debugBlocks
      : (Array.isArray(apiMessages) ? apiMessages : []);
    return blocks.reduce((sum, m) => sum + estimateTokens(String(m?.content || '')), 0);
  }

  function recordTavernDebugConsoleLog(entry) {
    if (!entry || typeof entry !== 'object') return;
    if (!Array.isArray(uiRuntime.debugConsoleLogs)) {
      uiRuntime.debugConsoleLogs = [];
    }
    uiRuntime.debugConsoleClearedChatId = '';
    const hasApiMsgs = Array.isArray(entry.apiMessages);
    const formattedPrompt = hasApiMsgs
      ? formatTavernApiMessagesForDebugConsole(entry.apiMessages)
      : String(entry.sentPromptText || '');
    const sentTokens = hasApiMsgs
      ? calculateTavernApiMessagesTokens(entry.apiMessages)
      : estimateTokens(formattedPrompt);
    const rawReplyStr = String(entry.rawReplyText || '');
    const replyTokens = estimateTokens(rawReplyStr);
    const activeSess = getActiveChatSession();
    const chatId = String(entry.chatId || activeSess?.id || '');
    const floorIdx = entry.floorIdx !== undefined && entry.floorIdx !== null ? entry.floorIdx : 0;
    const logId = entry.id || ('dbg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    const logItem = {
      id: logId,
      chatId,
      time: new Date().toLocaleTimeString(),
      floorIdx,
      cardName: String(entry.cardName || getActiveCard()?.name || '角色'),
      sentPromptText: formattedPrompt,
      rawReplyText: rawReplyStr,
      sentTokens,
      replyTokens
    };
    const existingIdx = uiRuntime.debugConsoleLogs.findIndex(x =>
      x && ((entry.id && x.id === entry.id) || (chatId && x.chatId === chatId && x.floorIdx === floorIdx))
    );
    if (existingIdx >= 0) {
      uiRuntime.debugConsoleLogs[existingIdx] = {
        ...uiRuntime.debugConsoleLogs[existingIdx],
        ...logItem,
        sentPromptText: formattedPrompt || uiRuntime.debugConsoleLogs[existingIdx].sentPromptText,
        sentTokens: sentTokens || uiRuntime.debugConsoleLogs[existingIdx].sentTokens
      };
    } else {
      uiRuntime.debugConsoleLogs.unshift(logItem);
    }
    if (uiRuntime.debugConsoleLogs.length > 5) {
      uiRuntime.debugConsoleLogs.length = 5;
    }
  }

  function stripUiEmojis(str) {
    return String(str || '').trim();
  }

  function showTavernToast(msg) {
    let el = document.getElementById('tavern-toast-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tavern-toast-banner';
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    el.textContent = stripUiEmojis(String(msg || '').replace(/[()（）]/g, ' '));
    el.classList.add('visible');
    if (uiRuntime.toastTimer) clearTimeout(uiRuntime.toastTimer);
    uiRuntime.toastTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 2600);
  }

  function showTavernErrorBanner(msg) {
    let el = document.getElementById('tavern-error-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tavern-error-banner';
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    const cleanMsg = stripUiEmojis(String(msg || '调用失败').replace(/[()（）]/g, ' '));
    el.innerHTML = `
      <div class="tavern-error-banner-body">
        <div class="tavern-error-banner-title">酒馆提示与报错</div>
        <div class="tavern-error-banner-desc">${escapeHtmlSimple(cleanMsg)}</div>
      </div>
      <button type="button" class="tavern-error-banner-close" onclick="this.parentElement.classList.remove('visible')">关闭</button>
    `;
    el.classList.add('visible');
    if (uiRuntime.errorTimer) clearTimeout(uiRuntime.errorTimer);
    uiRuntime.errorTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 7500);
  }

  function injectTavernShellCss() {
    if (document.getElementById('tavern-base-shell-css')) return;
    const style = document.createElement('style');
    style.id = 'tavern-base-shell-css';
    style.textContent = `
      #game-hall-screen {
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #f5f5f7;
      }
      #tavern-app-shell,
      #tavern-stage-root {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--SmartThemeChatTintColor, #f6f6f6);
        color: var(--SmartThemeBodyColor, #373737);
        font-family: inherit !important;
        font-size: calc(14px * var(--fontScale, 1));
        letter-spacing: var(--tavernLetterSpacing, 0px);
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      #tavern-stage-root input,
      #tavern-stage-root textarea,
      #tavern-stage-root [contenteditable="true"] {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      #tavern-stage-root .mes_text,
      #tavern-stage-root .mes_text :not(button):not(input):not(select):not(textarea),
      .be-quote,
      .be-quote * {
        -webkit-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: none !important;
      }
      #tavern-stage-root .extraMesButtons.tavern-extra-hidden {
        display: none !important;
      }
      #tavern-stage-root .mes_translation_box {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: 10px;
        background: rgba(244, 245, 249, 0.92);
        border: 1px dashed rgba(140, 140, 155, 0.45);
        font-size: 0.92em;
        color: #4a4a55;
        line-height: 1.65;
      }
      #tavern-stage-root .mes_translation_header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #7a7a88;
        margin-bottom: 4px;
        font-weight: 600;
      }
      #tavern-stage-root *:not(.fa-solid):not(.fa-regular):not(.fa):not(.fas):not(.far) {
        font-family: inherit !important;
      }
      #tavern-bg-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-position: center;
        background-repeat: no-repeat;
        transition: opacity 0.25s ease;
      }
      /* Native SillyTavern Top Bar */
      #top-bar {
        position: relative;
        z-index: 3000;
        width: 100%;
        flex-shrink: 0;
        box-sizing: border-box;
      }
      #top-settings-holder {
        position: relative;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-around !important;
        width: 100%;
        min-height: 46px;
        padding: 0 6px;
        box-sizing: border-box;
        z-index: 3001;
      }
      #top-settings-holder .drawer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 0;
        height: 42px;
      }
      #top-settings-holder .drawer-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        cursor: pointer;
      }
      #top-settings-holder .drawer-icon {
        display: inline-block;
        width: 30px;
        height: 30px;
        cursor: pointer;
        transition: transform 0.16s ease, opacity 0.16s ease;
      }
      #top-settings-holder .drawer.active-drawer .drawer-icon {
        transform: scale(1.12);
      }

      /* Full-screen Dropdown Drawer directly below #top-bar */
      #tavern-drawer-host {
        position: absolute;
        top: 52px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2800;
        pointer-events: none;
        display: none;
      }
      #tavern-drawer-host.active {
        display: block;
        pointer-events: auto;
      }
      #tavern-drawer-host .drawer-content.openDrawer {
        position: absolute !important;
        inset: 4px 6px 8px 6px !important;
        width: auto !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 14px 12px 32px 12px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        background: rgba(250, 250, 252, 0.97) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px !important;
        border: 1.5px solid rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.14) !important;
        box-sizing: border-box !important;
        z-index: 2850 !important;
      }

      /* Chat container & exact SillyTavern .mes layout */
      #chat {
        position: relative;
        z-index: 10;
        flex: 1 1 auto;
        width: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 22px var(--tavernPageMargin, 10px) 84px var(--tavernPageMargin, 10px) !important;
        box-sizing: border-box;
        scroll-behavior: auto;
      }
      .flex-container {
        display: flex;
        align-items: center;
      }
      .justifySpaceBetween {
        justify-content: space-between;
      }
      .mes {
        position: relative;
        box-sizing: border-box;
        width: 100%;
        margin-bottom: 18px;
      }
      .mes .mesAvatarWrapper {
        position: relative;
        z-index: 5;
        overflow: visible !important;
      }
      .mes .avatar {
        position: relative !important;
        width: 68px;
        height: 68px;
        border-radius: 50% !important;
        overflow: visible !important;
        flex-shrink: 0;
      }
      .mes .avatar img {
        width: 100% !important;
        height: 100% !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        display: block !important;
        background: #f0ece9;
      }
      .mes_block {
        position: static;
        width: 100%;
        box-sizing: border-box;
      }
      .ch_name {
        position: static;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100%;
        box-sizing: border-box;
      }
      .mes_buttons,
      .mes_edit_buttons {
        position: relative !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 5px !important;
        margin-left: auto !important;
        flex-shrink: 0 !important;
      }
      .mes[is_user="true"] .mes_buttons,
      .mes[is_user="true"] .mes_edit_buttons {
        margin-left: 0 !important;
        margin-right: auto !important;
        justify-content: flex-start !important;
      }
      .mes[is_user="true"] .mes_buttons > .mes_edit {
        order: 1;
      }
      .mes[is_user="true"] .mes_buttons > .extraMesButtonsHint {
        order: 2;
      }
      .mes[is_user="true"] .mes_buttons > .mes_stop {
        order: 3;
      }
      .tavern-typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        min-height: 22px;
      }
      .tavern-typing-indicator span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #8e8e93;
        display: inline-block;
        animation: tavernTypingBounce 1.25s infinite ease-in-out both;
      }
      .tavern-typing-indicator span:nth-child(1) {
        animation-delay: -0.28s;
      }
      .tavern-typing-indicator span:nth-child(2) {
        animation-delay: -0.14s;
      }
      @keyframes tavernTypingBounce {
        0%, 80%, 100% { transform: scale(0.55); opacity: 0.45; }
        40% { transform: scale(1.05); opacity: 1; }
      }
      #tavern-error-banner {
        position: fixed;
        top: 56px;
        left: 12px;
        right: 12px;
        max-width: 460px;
        margin: 0 auto;
        z-index: 2147483647;
        background: rgba(255, 244, 244, 0.98);
        border: 1.5px solid rgba(217, 83, 79, 0.75);
        border-radius: 14px;
        padding: 10px 12px;
        box-shadow: 0 10px 26px rgba(180, 40, 40, 0.22);
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      #tavern-error-banner.visible {
        display: flex;
      }
      .tavern-error-banner-body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .tavern-error-banner-title {
        font-size: 12.5px;
        font-weight: 700;
        color: #b52b27;
        margin-bottom: 2px;
      }
      .tavern-error-banner-desc {
        font-size: 11.5px;
        color: #6b2422;
        line-height: 1.4;
        word-break: break-word;
      }
      .tavern-error-banner-close {
        flex-shrink: 0;
        padding: 4px 10px;
        border-radius: 8px;
        border: 1px solid rgba(217, 83, 79, 0.45);
        background: #ffffff;
        color: #b52b27;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .mes_button,
      .extraMesButtonsHint {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px;
        height: 24px;
        cursor: pointer;
        flex-shrink: 0 !important;
      }
      .mes_button.mes_stop {
        border-radius: 50%;
        border: 1px solid #aaa;
        background-color: #fff;
        color: #777;
        font-size: 11px;
        box-shadow: inset 0 0 2px 1px #d8d8d8;
      }
      /* Native SillyTavern floating extra buttons & edit icon buttons (anchored beside fixed action buttons) */
      .extraMesButtons {
        position: absolute !important;
        right: calc(100% + 6px) !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 48 !important;
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        white-space: nowrap !important;
        gap: 5px !important;
        padding: 3px 6px !important;
        border-radius: 14px !important;
        background: rgba(235, 235, 240, 0.94) !important;
        border: 1px solid rgba(190, 190, 198, 0.78) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      }
      .mes[is_user="true"] .extraMesButtons {
        right: auto !important;
        left: calc(100% + 6px) !important;
      }
      .tavern-mes-icon-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        border-radius: 8px !important;
        border: 1px solid #b5b5bc !important;
        background: #f4f4f6 !important;
        color: #555558 !important;
        cursor: pointer;
        padding: 0 !important;
        margin: 0 !important;
        flex-shrink: 0 !important;
        box-shadow: inset 0 1px 0 #ffffff !important;
        transition: transform 0.14s ease, background 0.14s ease;
      }
      .tavern-mes-icon-btn:active {
        transform: scale(0.93);
      }
      .tavern-mes-icon-btn svg {
        width: 15px !important;
        height: 15px !important;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .edit_textarea {
        width: 100% !important;
        min-height: 160px !important;
        box-sizing: border-box !important;
        border: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: inherit !important;
        line-height: var(--tavernLineHeight, 1.72) !important;
        letter-spacing: var(--tavernLetterSpacing, 0px) !important;
        resize: vertical !important;
        outline: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Prevent double quotation marks inside <q> */
      #tavern-stage-root q::before,
      #tavern-stage-root q::after {
        content: none !important;
      }
      #tavern-stage-root q {
        quotes: none !important;
        color: var(--SmartThemeQuoteColor, #ffa8bb);
      }

      .mes_text {
        word-break: break-word;
        overflow-wrap: anywhere;
        line-height: var(--tavernLineHeight, 1.72) !important;
        letter-spacing: var(--tavernLetterSpacing, 0px) !important;
      }
      .mes_text p {
        margin: 0 0 0.55em 0;
        line-height: var(--tavernLineHeight, 1.72) !important;
        letter-spacing: var(--tavernLetterSpacing, 0px) !important;
      }
      .mes_text p:last-child {
        margin-bottom: 0;
      }
      .tavern-para-spacer {
        height: 0.45em;
      }

      /* Reasoning / CoT Folded Block */
      details.mes_reasoning_details {
        display: block !important;
        margin: 6px 0 10px 0;
        border-radius: 12px;
        background: rgba(242, 240, 245, 0.92);
        border: 1px dashed rgba(160, 155, 170, 0.55);
        padding: 6px 10px;
        font-size: 12px;
        color: #666;
        pointer-events: auto !important;
      }
      details.mes_reasoning_details > summary.mes_reasoning_summary {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        cursor: pointer !important;
        font-weight: 600;
        user-select: none;
        outline: none;
        list-style: none;
        pointer-events: auto !important;
      }
      details.mes_reasoning_details > summary.mes_reasoning_summary::-webkit-details-marker {
        display: none;
      }
      details.mes_reasoning_details:not([open]) > .mes_reasoning_content {
        display: none !important;
      }
      details.mes_reasoning_details[open] > .mes_reasoning_content {
        display: block !important;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px dashed rgba(160, 155, 170, 0.35);
        white-space: pre-wrap;
        line-height: 1.55;
        color: #555;
        max-height: 280px;
        overflow-y: auto;
      }

      /* Swipe Footer Navigation */
      .swipe_left,
      .swipe_right {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;
      }
      .swipes-counter {
        font-size: 11px;
        color: #777;
        font-weight: 600;
        padding: 0 5px;
      }

      /* Bottom Send Form Area (1:1 SillyTavern mobile bottom overlay) */
      #form_sheld {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1200;
        width: 100%;
        padding: 0;
        box-sizing: border-box;
        pointer-events: none;
      }
      #qr--bar {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        width: 100%;
        padding: 2px 6px 4px 6px;
        scrollbar-width: none;
        pointer-events: auto;
        box-sizing: border-box;
      }
      #qr--bar:empty {
        display: none !important;
      }
      #qr--bar::-webkit-scrollbar {
        display: none;
      }
      .qr--button {
        flex-shrink: 0;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(205, 205, 214, 0.85);
        font-size: 11.5px;
        font-weight: 600;
        color: #444;
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      .qr--button:active {
        transform: scale(0.96);
      }
      #send_form {
        pointer-events: auto;
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
        margin: 0 10px 8px 10px !important;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        width: auto !important;
        min-height: 44px;
        padding: 6px 8px;
        box-sizing: border-box;
      }
      #nonQRFormItems {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 6px;
        position: relative !important;
      }
      #leftSendForm,
      #rightSendForm {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      #options_button,
      #extensionsMenuButton,
      #send_but {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .tavern-stop-gen-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        height: 30px;
        padding: 0 10px;
        border-radius: 15px;
        border: 1px solid rgba(210, 120, 120, 0.55);
        background: rgba(255, 245, 245, 0.96);
        color: #b84a46;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        transition: transform 0.12s ease;
      }
      .tavern-stop-gen-btn:active {
        transform: scale(0.95);
      }
      #send_textarea {
        flex: 1 1 auto;
        width: 100%;
        min-height: 36px !important;
        max-height: 96px !important;
        padding: 7px 12px !important;
        border-radius: 18px;
        border: 1px solid rgba(210, 210, 216, 0.7);
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        font-size: 13.5px;
        line-height: 20px !important;
        resize: none;
        outline: none;
        overflow-y: auto;
        box-sizing: border-box;
      }

      /* Bottom Popups (#options and #extensionsMenu) */
      .tavern-bottom-popup {
        position: absolute;
        bottom: 62px;
        left: 12px;
        z-index: 2600;
        min-width: 186px;
        max-width: 280px;
        max-height: 68vh;
        overflow-y: auto;
        padding: 8px;
        border-radius: 16px;
        background: rgba(252, 252, 254, 0.98);
        border: 1.5px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .tavern-bottom-popup.tavern-popup-hidden {
        display: none !important;
      }
      .tavern-popup-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 11px;
        font-size: 13px;
        font-weight: 600;
        color: #3a3a3c;
        cursor: pointer;
        transition: background 0.14s ease;
      }
      .tavern-popup-item:hover,
      .tavern-popup-item:active {
        background: rgba(235, 235, 242, 0.85);
      }
      #extensionsMenu .extension_container a,
      #extensionsMenu .list-group-item {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 8px 12px !important;
        border-radius: 11px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #3a3a3c !important;
        text-decoration: none !important;
        cursor: pointer !important;
      }
      #extensionsMenu .extension_container a:hover,
      #extensionsMenu .list-group-item:hover {
        background: rgba(235, 235, 242, 0.85) !important;
      }

      /* Square-in-square WorldBook Green/Blue Light Indicator */
      .tavern-light-box {
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        min-height: 20px !important;
        border-radius: 5px !important;
        border: 1.5px solid #c7c7cc !important;
        background: #ffffff !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        margin: 0 !important;
        flex-shrink: 0 !important;
        cursor: pointer;
        box-sizing: border-box !important;
        transition: transform 0.12s ease;
      }
      .tavern-light-box:active {
        transform: scale(0.92);
      }
      .tavern-light-box-inner {
        width: 10px;
        height: 10px;
        border-radius: 2.5px;
        display: block;
      }
      .tavern-light-box.is-blue {
        border-color: #90caf9 !important;
        background: #f0f7ff !important;
      }
      .tavern-light-box.is-blue .tavern-light-box-inner {
        background: #2196f3;
      }
      .tavern-light-box.is-green {
        border-color: #a5d6a7 !important;
        background: #f2fbf3 !important;
      }
      .tavern-light-box.is-green .tavern-light-box-inner {
        background: #4caf50;
      }
      .tavern-vec-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: #6c6c70;
        margin-right: 4px;
        vertical-align: -2px;
      }
      .tavern-vec-badge svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* Anti-clipping Form Controls & Drawer Internal Components */
      .tavern-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(215, 215, 222, 0.7);
      }
      .tavern-drawer-title {
        font-size: 15px;
        font-weight: 700;
        color: #2c2c2e;
        letter-spacing: 0.3px;
      }
      .tavern-section-card {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(224, 224, 230, 0.85);
        border-radius: 16px;
        padding: 12px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        box-sizing: border-box;
        width: 100%;
        overflow: hidden;
      }
      .tavern-section-label {
        font-size: 13px;
        font-weight: 700;
        color: #3a3a3c;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tavern-btn-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
        margin-bottom: 10px;
        box-sizing: border-box;
      }
      .tavern-btn-grid.cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .tavern-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .tavern-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .tavern-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
        width: 100%;
        box-sizing: border-box;
      }
      .tavern-field-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 10px;
        min-width: 0;
      }
      .tavern-field-group label {
        font-size: 12px;
        font-weight: 600;
        color: #48484a;
        line-height: 1.35;
      }
      .tavern-field-hint {
        font-size: 11px;
        color: #8e8e93;
        line-height: 1.35;
        margin-top: 2px;
      }
      #tavern-stage-root .drawer-content .tavern-input {
        width: 100% !important;
        min-height: 38px !important;
        height: 38px !important;
        box-sizing: border-box !important;
        padding: 6px 10px !important;
        border-radius: 11px !important;
        border: 1px solid rgba(206, 206, 214, 0.9) !important;
        background: #ffffff !important;
        color: #2c2c2e !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        outline: none !important;
        margin: 0 !important;
      }
      #tavern-stage-root .drawer-content .tavern-textarea {
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 8px 10px !important;
        border-radius: 11px !important;
        border: 1px solid rgba(206, 206, 214, 0.9) !important;
        background: #ffffff !important;
        color: #2c2c2e !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        outline: none !important;
        margin: 0 !important;
      }
      #tavern-stage-root .drawer-content .tavern-select {
        width: 100% !important;
        min-height: 38px !important;
        height: 38px !important;
        line-height: 24px !important;
        padding: 6px 22px 6px 8px !important;
        border-radius: 11px !important;
        border: 1px solid rgba(206, 206, 214, 0.9) !important;
        background-color: #ffffff !important;
        color: #2c2c2e !important;
        font-size: 12.5px !important;
        box-sizing: border-box !important;
        text-align: left !important;
        overflow: visible !important;
        margin: 0 !important;
      }
      .tavern-check-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 4px 0;
        cursor: pointer;
      }
      .tavern-check-row input[type="checkbox"],
      .tavern-check-row input[type="radio"],
      .tavern-fixed-check {
        width: 18px !important;
        height: 18px !important;
        min-width: 18px !important;
        min-height: 18px !important;
        padding: 0 !important;
        margin: 0 !important;
        flex-shrink: 0 !important;
        accent-color: #6b6b70;
        cursor: pointer;
      }
      .tavern-list-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(248, 248, 250, 0.95);
        border: 1px solid rgba(224, 224, 232, 0.85);
        margin-bottom: 6px;
        box-sizing: border-box;
        width: 100%;
      }
      .tavern-list-row-main {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 600;
        color: #2c2c2e;
      }
      .tavern-list-row-sub {
        font-size: 11px;
        color: #8e8e93;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tavern-list-row-actions {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 5px !important;
        flex-shrink: 0 !important;
      }
      #tavern-stage-root .tavern-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        gap: 4px;
        min-height: 36px !important;
        padding: 6px 10px !important;
        border-radius: 11px !important;
        border: 1px solid rgba(204, 204, 212, 0.9) !important;
        background: #ffffff !important;
        color: #3a3a3c !important;
        font-size: 12.5px !important;
        line-height: 1.25 !important;
        font-weight: 600 !important;
        cursor: pointer;
        box-sizing: border-box !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        transition: all 0.14s ease;
      }
      #tavern-stage-root .tavern-btn:active {
        transform: scale(0.97);
      }
      #tavern-stage-root .tavern-btn.primary {
        background: #48484a !important;
        color: #ffffff !important;
        border-color: #48484a !important;
      }
      #tavern-stage-root .tavern-btn.danger {
        background: #fff5f5 !important;
        color: #c93b3b !important;
        border-color: #f1c6c6 !important;
      }
      #tavern-stage-root .tavern-btn.small {
        min-height: 32px !important;
        padding: 4px 10px !important;
        font-size: 12px !important;
        border-radius: 10px !important;
      }

      /* Extension Accordion inside #rm_extensions_block */
      .inline-drawer {
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(220, 220, 228, 0.9);
        margin-bottom: 10px;
        overflow: hidden;
      }
      .inline-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        cursor: pointer;
        font-weight: 700;
        font-size: 13.5px;
        color: #2c2c2e;
        user-select: none;
      }
      .inline-drawer-content {
        padding: 10px 12px 12px 12px;
        border-top: 1px solid rgba(230, 230, 236, 0.8);
      }

      /* Toast Banner */
      #tavern-toast-banner {
        position: fixed;
        top: 62px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        z-index: 2147483647;
        background: rgba(44, 44, 46, 0.94);
        color: #ffffff;
        padding: 8px 18px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 600;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        max-width: 88%;
        text-align: center;
      }
      #tavern-toast-banner.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      /* Strictly forbid any plugin or helper script buttons in #qr--bar: only Quick Replies [data-action="run-qr"] are allowed */
      #tavern-stage-root #qr--bar > :not([data-action="run-qr"]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================================
  // 10. Render Main SillyTavern Stage & Chat Floors
  // ============================================================================
  const TOP_BAR_DRAWERS = [
    { key: 'sliders', iconClass: 'fa-sliders', title: '生成参数与预设排序' },
    { key: 'plug', iconClass: 'fa-plug', title: '接口连接与模型设置' },
    { key: 'font', iconClass: 'fa-font', title: '文本格式化与指令模板' },
    { key: 'atlas', iconClass: 'fa-book-atlas', title: '世界书全局与词条管理' },
    { key: 'usercog', iconClass: 'fa-user-cog', title: '界面美化与用户设置' },
    { key: 'panorama', iconClass: 'fa-panorama', title: '背景画廊与视觉氛围' },
    { key: 'cubes', iconClass: 'fa-cubes', title: '扩展插件与正则脚本' },
    { key: 'smile', iconClass: 'fa-face-smile', title: '用户人设与面具管理' },
    { key: 'address', iconClass: 'fa-address-card', title: '角色档案与聊天分支' }
  ];

  function renderTavernShell() {
    const shell = document.getElementById('tavern-app-shell');
    if (!shell) return;
    injectTavernShellCss();

    const bg = tavernState.background || {};
    const resolvedBgUrl = bg.url ? resolveSafeAvatarUrl(bg.url, false) : '';
    const bgStyle = resolvedBgUrl
      ? `background-image: url('${resolvedBgUrl}'); background-size: ${bg.fit || 'cover'}; filter: blur(${Number(bg.blur || 0)}px); opacity: ${Number(bg.opacity ?? 1)};`
      : 'opacity: 0;';

    const qrs = (tavernState.quickReplies || []).filter(q => q && q.enabled);
    const activeCardForShell = getActiveCard();

    // Preserve existing #chat node so plugin MutationObservers (ST-BaiBai-Image / ST-BaiBai-Book / book-excerpt) never detach
    const prevChatEl = document.getElementById('chat');
    // Preserve all third-party plugin menu items mounted inside #extensionsMenu (including .extension_container, #pa-menu-entry, #be-menu-entry, etc.)
    const prevExtMenuNodes = Array.from(document.querySelectorAll('#extensionsMenu > :not(.tavern-popup-item):not(style)'));
    const canPreserveFloatingWidgets = Boolean(
      activeCardForShell &&
      lastExecutedHelperCardId === activeCardForShell.id &&
      cardHasFloatingWidgetScript(activeCardForShell)
    );
    const prevFloatingWidgetNodes = canPreserveFloatingWidgets
      ? Array.from(document.querySelectorAll('#tavern-stage-root > [id^="gourmet-fixed-"], #tavern-stage-root > #adv-codex-panel, #tavern-stage-root > #adv-codex-toggle'))
      : [];
    if (!canPreserveFloatingWidgets) {
      document.querySelectorAll('[id^="gourmet-fixed-"], #adv-codex-panel, #adv-codex-toggle').forEach(el => el.remove());
    }

    shell.innerHTML = `
      <div id="tavern-stage-root">
        <div id="tavern-bg-layer" style="${bgStyle}"></div>

        <!-- Native SillyTavern #top-bar with 9 Drawer Icons -->
        <div id="top-bar">
          <div id="top-settings-holder">
            ${TOP_BAR_DRAWERS.map(d => `
              <div class="drawer ${uiRuntime.openDrawerKey === d.key ? 'active-drawer' : ''}" data-drawer-key="${d.key}">
                <div class="drawer-toggle" data-action="toggle-drawer" data-drawer="${d.key}" title="${d.title}">
                  <div class="drawer-icon fa-solid ${d.iconClass} ${uiRuntime.openDrawerKey === d.key ? 'openIcon' : 'closedIcon'}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Full-screen Dropdown Drawer Container -->
        <div id="tavern-drawer-host" class="${uiRuntime.openDrawerKey ? 'active' : ''}">
          ${uiRuntime.openDrawerKey ? renderOpenDrawerHtml(uiRuntime.openDrawerKey) : ''}
        </div>

        <!-- Native SillyTavern #chat Message List -->
        <div id="chat"></div>

        <!-- Bottom Options & Extensions Popups (Always mounted in DOM so plugins can inject items) -->
        <div id="tavern-popup-host">
          ${renderBottomOptionsPopup()}
          ${renderBottomExtensionsPopup()}
        </div>
        ${uiRuntime.activeHelperScriptId ? renderHelperScriptModal() : ''}
        ${uiRuntime.activePluginModalId ? renderPluginCustomModal() : ''}

        <!-- Native SillyTavern #form_sheld Bottom Bar -->
        <div id="form_sheld">
          <form id="send_form" onsubmit="return false;">
            <div id="qr--bar">
              ${qrs.map(q => `
                <button type="button" class="qr--button" data-action="run-qr" data-qr-id="${q.id}">${escapeHtmlSimple(stripUiEmojis(q.label))}</button>
              `).join('')}
            </div>
            <div id="nonQRFormItems">
              <div id="leftSendForm">
                <div id="options_button" data-action="toggle-options-popup" title="对话操作菜单"></div>
                <div id="extensionsMenuButton" data-action="toggle-extensions-popup" title="扩展快捷菜单"></div>
              </div>
              <textarea id="send_textarea" rows="1" placeholder="输入消息或剧情行动..."></textarea>
              <div id="rightSendForm">
                <div id="send_but" data-action="send-message" title="发送"></div>
              </div>
            </div>
          </form>
        </div>

        <!-- Hidden Multi-File Inputs -->
        <input type="file" id="tavern-file-cards" accept=".png,.json,image/png,application/json" multiple style="display:none" />
        <input type="file" id="tavern-file-worldbooks" accept=".json,application/json" multiple style="display:none" />
        <input type="file" id="tavern-file-regexes" accept=".json,application/json" multiple style="display:none" />
        <input type="file" id="tavern-file-presets" accept=".json,application/json" multiple style="display:none" />
        <input type="file" id="tavern-file-themes" accept=".json,.css,application/json,text/css" multiple style="display:none" />
        <input type="file" id="tavern-file-plugins" accept=".js,.json,.html,.css,application/javascript,text/javascript,application/json,text/html,text/css" multiple style="display:none" />
        <input type="file" id="tavern-file-chats" accept=".json,.jsonl,application/json" multiple style="display:none" />
        <input type="file" id="tavern-file-bg" accept="image/*" multiple style="display:none" />
        <input type="file" id="tavern-file-persona-avatar" accept="image/*" style="display:none" />
        <input type="file" id="tavern-file-card-avatar" accept="image/*" style="display:none" />
      </div>
    `;

    const newChatPlaceholder = document.getElementById('chat');
    if (prevChatEl && newChatPlaceholder && prevChatEl !== newChatPlaceholder) {
      newChatPlaceholder.replaceWith(prevChatEl);
    }

    const newExtMenu = document.getElementById('extensionsMenu');
    if (newExtMenu && prevExtMenuNodes.length > 0) {
      prevExtMenuNodes.forEach(node => {
        if (!node) return;
        const innerId = node.id || node.querySelector('[id]')?.id || '';
        if (innerId && !newExtMenu.querySelector('#' + innerId)) {
          newExtMenu.insertBefore(node, newExtMenu.firstChild);
        } else if (!innerId) {
          newExtMenu.insertBefore(node, newExtMenu.firstChild);
        }
      });
    }

    const newStageRoot = document.getElementById('tavern-stage-root');
    if (newStageRoot && prevFloatingWidgetNodes.length > 0) {
      prevFloatingWidgetNodes.forEach(node => {
        if (node && (!node.id || !document.getElementById(node.id))) {
          newStageRoot.appendChild(node);
        }
      });
    }

    applyActiveTavernTheme();
    if (isTavernActive()) {
      renderTavernChatFloors(true);
      bindTavernStageEvents();
      (tavernState.plugins || []).forEach(p => {
        if (p && p.enabled && !p.builtInType && (p.code || isBaiBaiPlugin(p))) {
          executeUserPluginScript(p);
        }
      });
      const activeCard = getActiveCard();
      if (activeCard) {
        executeCardHelperScripts(activeCard);
        ensureCardEmbeddedScriptsLoaded(activeCard);
      }
    } else {
      bindTavernStageEvents();
    }
  }

  function refreshBottomPopupsOnly() {
    const optEl = document.getElementById('options');
    if (optEl) {
      optEl.classList.toggle('tavern-popup-hidden', !uiRuntime.showOptionsPopup);
      optEl.style.display = uiRuntime.showOptionsPopup ? 'flex' : 'none';
    }
    const extEl = document.getElementById('extensionsMenu');
    if (extEl) {
      extEl.classList.toggle('tavern-popup-hidden', !uiRuntime.showExtensionsPopup);
      extEl.style.display = uiRuntime.showExtensionsPopup ? 'flex' : 'none';
    }
  }

  function renderHelperScriptModal() {
    const card = getActiveCard();
    const scripts = (card && Array.isArray(card.helperScripts)) ? card.helperScripts : [];
    const target = scripts.find(s => s.id === uiRuntime.activeHelperScriptId) || scripts[0];
    if (!target) return '';

    const rawContent = String(target.content || '');
    let extractedHtml = '';
    const templateMatch = rawContent.match(/const\s+panelHTML\s*=\s*`([\s\S]*?)`;/);
    if (templateMatch && templateMatch[1]) {
      const styleMatches = rawContent.match(/\.append\(`(<style[\s\S]*?<\/style>)`\)/g) || [];
      const styles = styleMatches.map(m => {
        const inner = m.match(/`(<style[\s\S]*?<\/style>)`/);
        return inner ? inner[1] : '';
      }).join('\n');
      extractedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${styles}<style>body{margin:0;padding:10px;background:transparent;font-family:sans-serif;}#adv-codex-panel{position:relative!important;top:auto!important;left:auto!important;transform:none!important;width:100%!important;max-width:100%!important;height:82vh!important;display:flex!important;box-sizing:border-box!important;}#adv-codex-toggle{display:none!important;}</style></head><body>${templateMatch[1]}</body></html>`;
    } else if (/<!DOCTYPE\s+html/i.test(rawContent) || /<html[\s>]/i.test(rawContent)) {
      extractedHtml = rawContent;
    } else {
      extractedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:14px;font-family:sans-serif;color:#333;background:#faf8f5;}</style></head><body><div id="app">正在加载角色扩展面板...</div><script>${rawContent}<\/script></body></html>`;
    }

    const srcdocAttr = buildSandboxIframeHtml(extractedHtml, { isModal: true });
    return `
      <div class="tavern-modal-backdrop" style="position:absolute;inset:0;z-index:3500;background:rgba(20,20,24,0.52);backdrop-filter:blur(4px);display:flex;flex-direction:column;padding:12px;box-sizing:border-box;">
        <div style="background:#fdfbf7;border-radius:16px;border:1px solid rgba(0,0,0,0.12);display:flex;flex-direction:column;flex:1;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.28);">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(0,0,0,0.08);background:#f5f2eb;">
            <span style="font-weight:700;font-size:14px;color:#333;">${escapeHtmlSimple(stripUiEmojis(target.name || '角色专属互动面板'))}</span>
            <button type="button" class="tavern-btn small" data-action="close-helper-script">关闭面板</button>
          </div>
          <iframe class="tavern-html-sandbox-frame" sandbox="allow-scripts allow-same-origin allow-forms" srcdoc="${srcdocAttr}" style="width:100%;flex:1;border:none;background:transparent;"></iframe>
        </div>
      </div>
    `;
  }

  function renderPluginCustomModal() {
    const p = (tavernState.plugins || []).find(x => x.id === uiRuntime.activePluginModalId);
    if (!p) return '';
    if (!p.repoBaseUrl && String(p.name || '').includes('柏宝绘')) {
      p.repoBaseUrl = 'https://raw.githubusercontent.com/baibai-git/ST-BaiBai-Image/main';
    }
    if (isHostAppHtmlFallback(p.uiHtml)) p.uiHtml = '';
    if (p.htmlTemplates && typeof p.htmlTemplates === 'object') {
      Object.keys(p.htmlTemplates).forEach(k => {
        if (isHostAppHtmlFallback(p.htmlTemplates[k])) delete p.htmlTemplates[k];
      });
    }
    if (persistentExtSettingsEl && isHostAppHtmlFallback(persistentExtSettingsEl.innerHTML)) {
      persistentExtSettingsEl.innerHTML = '';
    }
    if (persistentExtSettings2El && isHostAppHtmlFallback(persistentExtSettings2El.innerHTML)) {
      persistentExtSettings2El.innerHTML = '';
    }

    const rawCode = String(p.code || p.content || '');
    const rawExtractedUi = p.uiHtml || extractEmbeddedHtmlFromPluginCode(rawCode);
    const extractedUi = isHostAppHtmlFallback(rawExtractedUi) ? '' : rawExtractedUi;
    const rawMountedExtHtml = (persistentExtSettingsEl ? persistentExtSettingsEl.innerHTML : '') + (persistentExtSettings2El ? persistentExtSettings2El.innerHTML : '');
    const mountedExtHtml = isHostAppHtmlFallback(rawMountedExtHtml) ? '' : rawMountedExtHtml;
    const btns = Array.isArray(p.buttons) ? p.buttons : [];

    const buttonsBarHtml = btns.length > 0 ? `
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;background:#f4f5f9;border-bottom:1px solid rgba(0,0,0,0.08);">
        ${btns.map(b => `
          <button type="button" class="tavern-btn small primary" data-action="trigger-plugin-btn" data-btn-name="${escapeHtmlSimple(b.name || '')}">${escapeHtmlSimple(stripUiEmojis(b.name || '执行功能'))}</button>
        `).join('')}
      </div>
    ` : '';

    const htmlBody = extractedUi || mountedExtHtml || `
      <div id="plugin_auto_container" style="padding:12px;font-size:13px;color:#3a3a3c;line-height:1.6;">
        <div style="font-weight:700;margin-bottom:6px;">${escapeHtmlSimple(p.name)}</div>
        <div style="color:#666;margin-bottom:10px;">${escapeHtmlSimple(p.description || '该插件已挂载至酒馆运行环境。')}</div>
        ${!rawCode ? `<div style="padding:10px;border-radius:10px;background:#fff5f5;color:#c93b3b;font-size:12px;">检测到此插件之前导入时未包含脚本内容。请点击卸载后重新选择该JSON或JS文件导入，即可自动识别并渲染完整交互界面与功能按钮。</div>` : ''}
      </div>
    `;

    const safeTranspiledCode = transpilePluginImports(rawCode, p);
    const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{margin:0;padding:12px;min-height:76vh;font-family:sans-serif;color:#2c2c2e;background:#faf8f5;}
      input,select,textarea,button{font-family:inherit;font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid #ccc;box-sizing:border-box;margin:4px 0;}
      button{cursor:pointer;background:#48484a;color:#fff;border:none;}
      .inline-drawer-content{display:block !important;}
    </style></head><body>
      <div id="extensions_settings"></div>
      <div id="extensions_settings2"></div>
      ${htmlBody}
      <script>
        window.SillyTavern = window.parent.SillyTavern;
        window.TavernHelper = window.parent.TavernHelper;
        window.getContext = window.parent.getContext;
        window.eventSource = window.parent.eventSource;
        window.event_types = window.parent.event_types;
        window.extension_settings = window.parent.extension_settings;
        window.toastr = window.parent.toastr;
        if (window.parent && window.parent.fetch) {
          window.fetch = window.parent.fetch.bind(window.parent);
        }
        const parentJq = window.parent.jQuery || window.parent.$;
        const localJq = function(sel, ctx) {
          if (typeof sel === 'string') {
            const s = sel.trim();
            if (!s.startsWith('<')) {
              const localNodes = (ctx || document).querySelectorAll(s);
              if (localNodes && localNodes.length > 0) {
                return parentJq(localNodes);
              }
            }
          } else if (sel === document || sel === window || sel === document.body) {
            return parentJq(document.body);
          }
          return parentJq(sel, ctx || document);
        };
        Object.assign(localJq, parentJq);
        window.jQuery = localJq;
        window.$ = localJq;
        window.__ST_BRIDGE__ = window.parent.__ST_BRIDGE__;
        try {
          (async () => {
            ${safeTranspiledCode}
          })();
        } catch (e) {
          console.warn('Modal plugin script error:', e);
        }
      <\/script>
    </body></html>`;
    const srcdocAttr = buildSandboxIframeHtml(fullDoc, { isModal: true });
    return `
      <div class="tavern-modal-backdrop" style="position:absolute;inset:0;z-index:3500;background:rgba(20,20,24,0.52);backdrop-filter:blur(4px);display:flex;flex-direction:column;padding:12px;box-sizing:border-box;">
        <div style="background:#fdfbf7;border-radius:16px;border:1px solid rgba(0,0,0,0.12);display:flex;flex-direction:column;flex:1;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.28);">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(0,0,0,0.08);background:#f5f2eb;">
            <span style="font-weight:700;font-size:14px;color:#333;">${escapeHtmlSimple(stripUiEmojis(p.name || '插件设置面板'))}</span>
            <button type="button" class="tavern-btn small" data-action="close-plugin-modal">关闭面板</button>
          </div>
          ${buttonsBarHtml}
          <iframe class="tavern-html-sandbox-frame" sandbox="allow-scripts allow-same-origin allow-forms" srcdoc="${srcdocAttr}" style="width:100%;flex:1;border:none;background:transparent;"></iframe>
        </div>
      </div>
    `;
  }

  function renderBottomOptionsPopup() {
    return `
      <div id="options" class="tavern-bottom-popup ${uiRuntime.showOptionsPopup ? '' : 'tavern-popup-hidden'}">
        <div class="tavern-popup-item" data-action="chat-scroll-top">回到顶部</div>
        <div class="tavern-popup-item" data-action="chat-scroll-bottom">回到底部</div>
        <div class="tavern-popup-item" data-action="chat-new-session">重开当前角色新对话</div>
        <div class="tavern-popup-item" data-action="chat-regenerate-last">重新生成最后一层回复</div>
        <div class="tavern-popup-item" data-action="chat-continue-last">继续续写最后一层回复</div>
        <div class="tavern-popup-item" data-action="chat-impersonate">帮写玩家下一句回复</div>
        <div class="tavern-popup-item" data-action="open-drawer-direct" data-drawer="address">切换或导入角色存档</div>
      </div>
    `;
  }

  function renderBottomExtensionsPopup() {
    const userPlugins = (tavernState.plugins || []).filter(p => p && !p.builtInType && p.enabled);
    const card = getActiveCard();
    const helperScripts = (card && Array.isArray(card.helperScripts)) ? card.helperScripts : [];
    return `
      <div id="extensionsMenu" class="tavern-bottom-popup ${uiRuntime.showExtensionsPopup ? '' : 'tavern-popup-hidden'}" style="display:${uiRuntime.showExtensionsPopup ? 'flex' : 'none'};">
        <style>
          #extensionsMenu:has(#bbi-menu-item) .tavern-popup-item[data-baibai-kind="image"] { display: none !important; }
          #extensionsMenu:has(#bbs-menu-item) .tavern-popup-item[data-baibai-kind="book"] { display: none !important; }
          #extensionsMenu:has(#pa-menu-entry) .tavern-popup-item[data-plugin-kind="bcw"] { display: none !important; }
          #extensionsMenu:has(#be-menu-entry) .tavern-popup-item[data-plugin-kind="book-excerpt"] { display: none !important; }
        </style>
        ${helperScripts.map(hs => `
          <div class="tavern-popup-item" data-action="open-helper-script" data-script-id="${escapeHtmlSimple(hs.id)}">
            打开 ${escapeHtmlSimple(stripUiEmojis(hs.name || '角色内嵌面板'))}
          </div>
        `).join('')}
        ${userPlugins.map(up => {
          const kindAttr = isBaiBaiImagePlugin(up)
            ? 'data-baibai-kind="image"'
            : (isBaiBaiBookPlugin(up)
              ? 'data-baibai-kind="book"'
              : (isBurntChickenWingsPlugin(up)
                ? 'data-plugin-kind="bcw"'
                : (isBookExcerptPlugin(up) ? 'data-plugin-kind="book-excerpt"' : '')));
          return `
          <div class="tavern-popup-item" data-action="open-plugin-modal" data-plugin-id="${escapeHtmlSimple(up.id)}" ${kindAttr}>
            ${escapeHtmlSimple(stripUiEmojis(up.name))}
          </div>
        `;
        }).join('')}
        <div class="tavern-popup-item" data-action="popup-translate-last">双语翻译最后一层消息</div>
        <div class="tavern-popup-item" data-action="popup-translate-input">翻译输入框草稿文字</div>
        <div class="tavern-popup-item" data-action="wand-generate-image">生成当前剧情场景插图</div>
        <div class="tavern-popup-item" data-action="run-memory-summary-now">立即生成剧情记忆摘要</div>
        <div class="tavern-popup-item" data-action="open-drawer-direct" data-drawer="plug">快速切换API接口与预设</div>
        <div class="tavern-popup-item" data-action="open-drawer-direct" data-drawer="cubes">打开正则与扩展插件面板</div>
        <div class="tavern-popup-item" data-action="open-drawer-direct" data-drawer="atlas">打开世界书词条管理面板</div>
        <div class="tavern-popup-item" data-action="open-drawer-direct" data-drawer="usercog">打开文字配色与美化面板</div>
      </div>
    `;
  }

  function resolveSafeAvatarUrl(rawUrl, isUser = false) {
    if (!rawUrl || String(rawUrl).includes('P5gL5z2g') || String(rawUrl).includes('postimg.cc/P5gL5z2g')) {
      return isUser ? DEFAULT_USER_AVATAR_SVG : DEFAULT_AVATAR_SVG;
    }
    const str = String(rawUrl).trim();
    if (str.startsWith('vault://')) {
      if (resolvedVaultBlobMap.has(str)) {
        return resolvedVaultBlobMap.get(str);
      }
      triggerAsyncVaultResolution(str);
      return isUser ? DEFAULT_USER_AVATAR_SVG : DEFAULT_AVATAR_SVG;
    }
    return str;
  }

  function resolveAvatarFallbackThumb(rawUrl, isUser = false) {
    return isUser ? DEFAULT_USER_AVATAR_SVG : DEFAULT_AVATAR_SVG;
  }

  function syncSwipeInfoToMessage(msg, swipeIdx) {
    if (!msg) return;
    if (!Array.isArray(msg.swipe_info)) msg.swipe_info = [];
    const info = msg.swipe_info[swipeIdx];
    if (info && typeof info === 'object') {
      if (info.gen_time !== undefined) msg.gen_time = info.gen_time;
      if (info.reasoning !== undefined) msg.reasoning = info.reasoning;
      if (info.send_date !== undefined) msg.send_date = info.send_date;
      if (info.token_count !== undefined) msg.token_count = info.token_count;
    }
  }

  function recordMessageToSwipeInfo(msg, swipeIdx) {
    if (!msg) return;
    if (!Array.isArray(msg.swipe_info)) msg.swipe_info = [];
    msg.swipe_info[swipeIdx] = {
      send_date: msg.send_date || Date.now(),
      gen_time: msg.gen_time || '',
      reasoning: msg.reasoning || '',
      token_count: msg.token_count || estimateTokens(msg.mes || '')
    };
  }

  function buildSingleFloorHtml(m, idx, messages, card) {
    const uiCfg = tavernState.uiSettings || {};
    const fmtCfg = tavernState.formatting || {};
    const charAvatar = resolveSafeAvatarUrl(card ? card.avatar : '', false);
    const charFallback = resolveAvatarFallbackThumb(card ? card.avatar : '', false);
    const userRawAvatar = getUserAvatarUrl();
    const userAvatar = resolveSafeAvatarUrl(userRawAvatar, true);
    const userFallback = resolveAvatarFallbackThumb(userRawAvatar, true);
    const userName = getUserDisplayName();

    const isUser = Boolean(m.is_user);
    const isLast = idx === messages.length - 1;
    const displayName = isUser ? userName : ((card && card.name) ? card.name : (m.name || '角色'));
    const avatarSrc = isUser ? userAvatar : charAvatar;
    const fallbackSrc = isUser ? userFallback : charFallback;
    const swipes = Array.isArray(m.swipes) && m.swipes.length > 0 ? m.swipes : [m.mes || ''];
    const swipeIdx = Math.min(swipes.length - 1, Math.max(0, Number(m.swipe_id || 0)));
    const currentRawText = swipes[swipeIdx] !== undefined ? swipes[swipeIdx] : (m.mes || '');
    const swipeMeta = (Array.isArray(m.swipe_info) && m.swipe_info[swipeIdx]) ? m.swipe_info[swipeIdx] : null;
    const effectiveGenTime = (swipeMeta && swipeMeta.gen_time !== undefined) ? swipeMeta.gen_time : (m.gen_time || '');
    const rawSavedReasoning = (swipeMeta && swipeMeta.reasoning !== undefined) ? swipeMeta.reasoning : (m.reasoning || '');
    const tokenNum = (swipeMeta && swipeMeta.token_count) || m.token_count || estimateTokens(currentRawText);

    const isEditingThis = uiRuntime.editingFloorMesId === idx;
    const isExtraOpen = uiRuntime.openExtraMenuMesId === idx;

    const inlineExtracted = extractReasoningAndCleanReply(currentRawText, { hasPrefill: false, isLiveStream: false });
    const effectiveReasoning = (rawSavedReasoning && String(rawSavedReasoning).trim()) ? String(rawSavedReasoning).trim() : inlineExtracted.reasoning;
    const effectiveCleanText = (rawSavedReasoning && String(rawSavedReasoning).trim()) ? currentRawText : inlineExtracted.cleanReply;

    const isWaitingFirstToken = uiRuntime.isGenerating && isLast && !isUser && !effectiveCleanText.trim();
    const renderedHtml = isEditingThis
      ? ''
      : (isWaitingFirstToken
          ? `<div class="tavern-typing-indicator" title="AI正在思考生成中"><span></span><span></span><span></span></div>`
          : renderTavernMessageHtml(effectiveCleanText, {
              isUser,
              isPrompt: false,
              isLastFloor: isLast,
              depth: messages.length - 1 - idx,
              card
            }));

    const hasReasoning = Boolean(effectiveReasoning);
    const isLiveReasoningOnly = uiRuntime.isGenerating && isLast && !isUser && hasReasoning && !effectiveCleanText.trim();
    const openReasoningAttr = (fmtCfg.autoCollapseReasoning === false) ? 'open' : '';
    const reasoningTitleText = isLiveReasoningOnly ? '思考过程中...' : '思考过程';
    const hasTranslation = Boolean(m.translation && String(m.translation).trim());

    return `
      <div class="mes ${isLast ? 'last_mes' : ''}" mesid="${idx}" is_user="${isUser ? 'true' : 'false'}" is_system="${m.is_system ? 'true' : 'false'}">
        <div class="mesAvatarWrapper">
          <div class="avatar">
            <img src="${avatarSrc}" ${String(isUser ? userRawAvatar : (card ? card.avatar : '')).startsWith('vault://') ? `data-vault-ref="${escapeHtmlSimple(isUser ? userRawAvatar : card.avatar)}"` : ''} alt="avatar" onerror="this.onerror=null;this.src='${fallbackSrc}';" />
          </div>
          <div class="mesIDDisplay">${uiCfg.showMessageId !== false ? '#' + idx : ''}</div>
          <div class="mes_timer">${uiCfg.showMesTimer !== false && effectiveGenTime ? escapeHtmlSimple(effectiveGenTime) : ''}</div>
          ${uiCfg.showTokenCount !== false ? `<div class="tokenCounterDisplay">${tokenNum}t</div>` : '<div class="tokenCounterDisplay"></div>'}
        </div>

        <div class="mes_block">
          <div class="ch_name flex-container justifySpaceBetween">
            <div class="flex-container alignItemsBaseline">
              <span class="name_text">${escapeHtmlSimple(displayName)}</span>
            </div>
            ${isEditingThis ? `
              <div class="flex-container mes_buttons mes_edit_buttons">
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-edit-save" data-mesid="${idx}" title="确认保存修改">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-copy" data-mesid="${idx}" title="复制本层原文">
                  <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-toggle-reasoning-edit" data-mesid="${idx}" title="编辑思维链">
                  <svg viewBox="0 0 24 24"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-del-one" data-mesid="${idx}" title="删除本层">
                  <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-move-up" data-mesid="${idx}" title="上移本层">
                  <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-move-down" data-mesid="${idx}" title="下移本层">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <button type="button" class="tavern-mes-icon-btn" data-action="floor-edit-cancel" title="取消编辑">
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ` : `
              <div class="flex-container mes_buttons mes_edit_buttons">
                <div class="extraMesButtons ${isExtraOpen ? '' : 'tavern-extra-hidden'}">
                  <button type="button" class="tavern-mes-icon-btn" data-action="floor-copy" data-mesid="${idx}" title="复制原文">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                  <button type="button" class="tavern-mes-icon-btn" data-action="floor-regen" data-mesid="${idx}" title="${isUser ? '在此楼层后触发AI回复' : '重新生成本层'}">
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </button>
                  <button type="button" class="tavern-mes-icon-btn" data-action="floor-add-swipe" data-mesid="${idx}" title="新增空白回复页">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button type="button" class="tavern-mes-icon-btn" data-action="floor-fork" data-mesid="${idx}" title="从本层新建分支存档">
                    <svg viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                  </button>
                  <button type="button" class="tavern-mes-icon-btn" data-action="floor-del-one" data-mesid="${idx}" title="删除本层">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                  </button>
                </div>
                <div class="mes_button mes_stop fa-solid fa-stop" data-action="stop-generation" title="暂停生成" style="display:${uiRuntime.isGenerating && isLast ? 'inline-flex' : 'none'} !important;"></div>
                <div class="extraMesButtonsHint fa-solid fa-ellipsis" data-action="floor-extra-toggle" data-mesid="${idx}" title="展开更多操作"></div>
                <div class="mes_button mes_edit fa-solid fa-pencil" data-action="floor-edit" data-mesid="${idx}" title="编辑本层"></div>
              </div>
            `}
          </div>

          ${hasReasoning ? `
            <details class="mes_reasoning_details" ${openReasoningAttr}>
              <summary class="mes_reasoning_summary flex-container">
                <div class="mes_reasoning_header flex-container">
                  <span class="mes_reasoning_header_title">${reasoningTitleText}</span>
                </div>
                <div class="mes_reasoning_arrow"></div>
              </summary>
              <div class="mes_reasoning mes_reasoning_content">${escapeHtmlSimple(effectiveReasoning)}</div>
            </details>
          ` : ''}

          ${isEditingThis && uiRuntime.editingFloorReasoning ? `
            <div style="margin-top:8px;">
              <textarea id="tavern-floor-reasoning-box-${idx}" class="tavern-textarea" rows="3" placeholder="在此编辑本层思维链内容...">${escapeHtmlSimple(effectiveReasoning)}</textarea>
            </div>
          ` : ''}

          <div class="mes_text">
            ${isEditingThis ? `
              <textarea id="tavern-floor-edit-box-${idx}" class="edit_textarea" rows="8">${escapeHtmlSimple(currentRawText)}</textarea>
            ` : renderedHtml}
          </div>

          ${hasTranslation ? `
            <div class="mes_translation_box">
              <div class="mes_translation_header">
                <span>译文</span>
                <button type="button" class="tavern-btn small" style="padding:1px 6px;font-size:10px;" data-action="floor-hide-translation" data-mesid="${idx}">隐藏</button>
              </div>
              <div class="mes_translation_text">${escapeHtmlSimple(m.translation).replace(/\n/g, '<br/>')}</div>
            </div>
          ` : ''}

          ${!isUser && (isLast || swipes.length > 1) && uiCfg.showSwipeCounter !== false ? `<div class="swipes-counter">${swipeIdx + 1}/${swipes.length}</div>` : '<div class="swipes-counter"></div>'}
        </div>

        ${!isUser && (isLast || swipes.length > 1) ? `
          <div class="swipe_left fa-solid fa-chevron-left" data-action="floor-swipe-left" data-mesid="${idx}" title="上一分支"></div>
          <div class="swipe_right fa-solid fa-chevron-right" data-action="floor-swipe-right" data-mesid="${idx}" title="下一分支或重生成"></div>
        ` : ''}
      </div>
    `;
  }

  function appendOrUpdateSingleFloorDom(idx, options = {}) {
    const chatEl = document.getElementById('chat');
    if (!chatEl) return;
    const card = getActiveCard();
    const sess = getActiveChatSession();
    const messages = (sess && Array.isArray(sess.messages)) ? sess.messages : [];
    const m = messages[idx];
    if (!m) return;

    // Ensure only the true last floor carries .last_mes
    chatEl.querySelectorAll('.mes.last_mes').forEach(el => {
      const mid = Number(el.getAttribute('mesid'));
      if (mid !== messages.length - 1) {
        el.classList.remove('last_mes');
      }
    });

    const html = buildSingleFloorHtml(m, idx, messages, card);
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    const newFloorNode = temp.firstElementChild;
    if (!newFloorNode) return;

    const existingNode = chatEl.querySelector(`.mes[mesid="${idx}"]`);
    if (existingNode) {
      const oldDetails = existingNode.querySelector('.mes_reasoning_details');
      const newDetails = newFloorNode.querySelector('.mes_reasoning_details');
      if (oldDetails && newDetails) {
        if (oldDetails.hasAttribute('open')) {
          newDetails.setAttribute('open', '');
        } else {
          newDetails.removeAttribute('open');
        }
      }
      const isEditingTransition = Boolean(existingNode.querySelector('.tavern-floor-edit-box') || newFloorNode.querySelector('.tavern-floor-edit-box'));
      const oldTextEl = existingNode.querySelector('.mes_text');
      const newTextEl = newFloorNode.querySelector('.mes_text');
      const hasLiveFramesOrImgs = oldTextEl && (oldTextEl.querySelector('iframe.tavern-html-sandbox-frame') || oldTextEl.querySelector('img'));
      if (!isEditingTransition && oldTextEl && newTextEl && hasLiveFramesOrImgs) {
        // Update in-place so already-mounted iframes and images inside .mes_text never detach from document and never reload/flash
        existingNode.className = newFloorNode.className;
        const oldAvatarWrapper = existingNode.querySelector('.mesAvatarWrapper');
        const newAvatarWrapper = newFloorNode.querySelector('.mesAvatarWrapper');
        if (oldAvatarWrapper && newAvatarWrapper) oldAvatarWrapper.innerHTML = newAvatarWrapper.innerHTML;
        const oldChName = existingNode.querySelector('.ch_name');
        const newChName = newFloorNode.querySelector('.ch_name');
        if (oldChName && newChName) oldChName.innerHTML = newChName.innerHTML;
        if (newDetails && !oldDetails) {
          oldTextEl.parentNode.insertBefore(newDetails, oldTextEl);
        } else if (oldDetails && newDetails) {
          const oldTitle = oldDetails.querySelector('.mes_reasoning_header_title');
          const newTitle = newDetails.querySelector('.mes_reasoning_header_title');
          if (oldTitle && newTitle) oldTitle.textContent = newTitle.textContent;
          const oldRC = oldDetails.querySelector('.mes_reasoning_content');
          const newRC = newDetails.querySelector('.mes_reasoning_content');
          if (oldRC && newRC) oldRC.textContent = newRC.textContent;
        } else if (oldDetails && !newDetails) {
          oldDetails.remove();
        }
        patchStreamingMesTextDom(oldTextEl, newTextEl.innerHTML);
        const oldSwipesCounter = existingNode.querySelector('.swipes-counter');
        const newSwipesCounter = newFloorNode.querySelector('.swipes-counter');
        if (oldSwipesCounter && newSwipesCounter) oldSwipesCounter.outerHTML = newSwipesCounter.outerHTML;
        executeInlineMessageScripts(existingNode);
      } else {
        existingNode.replaceWith(newFloorNode);
        executeInlineMessageScripts(newFloorNode);
      }
    } else {
      chatEl.appendChild(newFloorNode);
      executeInlineMessageScripts(newFloorNode);
    }

    if (options && options.scrollToBottom && !uiRuntime.userScrolledUpDuringStream) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
    if (!uiRuntime.isGenerating) {
      Promise.resolve().then(() => {
        try {
          tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_UPDATED, idx);
        } catch (_) {}
      });
    }
  }

  function renderTavernChatFloors(keepTopOnSingleFloor = false, options = {}) {
    const chatEl = document.getElementById('chat');
    if (!chatEl) return;

    const prevScrollTop = chatEl.scrollTop;
    const shouldScrollBottom = Boolean(options && options.scrollToBottom);

    const card = getActiveCard();
    const sess = getActiveChatSession();
    const messages = (sess && Array.isArray(sess.messages)) ? sess.messages : [];
    const activeChatId = sess ? sess.id : null;
    if (uiRuntime.lazyFloorChatId !== activeChatId) {
      uiRuntime.lazyFloorChatId = activeChatId;
      uiRuntime.visibleFloorCount = 30;
    }

    const lazyEnabled = tavernState.uiSettings?.enableFloorLazyLoad !== false;
    const limit = Math.max(10, Number(uiRuntime.visibleFloorCount) || 30);
    const startIdx = (lazyEnabled && messages.length > limit) ? (messages.length - limit) : 0;
    const hiddenCount = startIdx;

    let topLazyBarHtml = '';
    if (hiddenCount > 0) {
      const nextStep = Math.min(30, hiddenCount);
      topLazyBarHtml = `
        <div id="tavern-lazy-load-bar" class="tavern-lazy-load-bar">
          <span class="tavern-lazy-load-info">已隐藏早期 ${hiddenCount} 层对话以节省内存</span>
          <div class="tavern-lazy-load-actions">
            <button type="button" class="tavern-btn small" data-action="load-more-chat-floors">加载前${nextStep}层</button>
            <button type="button" class="tavern-btn small" data-action="load-all-chat-floors">展开全部</button>
          </div>
        </div>
      `;
    }

    const renderedFloors = [];
    for (let idx = startIdx; idx < messages.length; idx++) {
      renderedFloors.push(buildSingleFloorHtml(messages[idx], idx, messages, card));
    }
    chatEl.innerHTML = topLazyBarHtml + renderedFloors.join('');
    executeInlineMessageScripts(chatEl);

    if (keepTopOnSingleFloor && messages.length <= 1) {
      chatEl.scrollTop = 0;
    } else if ((keepTopOnSingleFloor && messages.length > 1) || shouldScrollBottom) {
      chatEl.scrollTop = chatEl.scrollHeight;
      setTimeout(() => {
        if (chatEl && !uiRuntime.userScrolledUpDuringStream) chatEl.scrollTop = chatEl.scrollHeight;
      }, 80);
      setTimeout(() => {
        if (chatEl && !uiRuntime.userScrolledUpDuringStream) chatEl.scrollTop = chatEl.scrollHeight;
      }, 260);
    } else {
      chatEl.scrollTop = prevScrollTop;
    }
  }

  function executeInlineMessageScripts(containerEl) {
    if (!containerEl) return;
    const scripts = containerEl.querySelectorAll('script');
    scripts.forEach(oldScript => {
      if (oldScript._tavernExecuted) return;
      oldScript._tavernExecuted = true;
      try {
        const code = oldScript.textContent || '';
        if (code.trim()) {
          const mesEl = oldScript.closest ? oldScript.closest('.mes') : (containerEl.classList?.contains('mes') ? containerEl : null);
          const floorId = (mesEl && mesEl.hasAttribute('mesid')) ? Number(mesEl.getAttribute('mesid')) : window.TavernHelper.getCurrentMessageId();
          const localGetCurId = () => floorId;
          const localHelper = Object.assign({}, window.TavernHelper, {
            isFrontendRenderEnabled: () => true,
            getCurrentMessageId: localGetCurId
          });
          const origDocAdd = document.addEventListener.bind(document);
          const origWinAdd = window.addEventListener.bind(window);
          const pendingDomCbs = [];
          document.addEventListener = function (type, listener, options) {
            if (type === 'DOMContentLoaded' && typeof listener === 'function') {
              pendingDomCbs.push(listener);
              return;
            }
            return origDocAdd(type, listener, options);
          };
          window.addEventListener = function (type, listener, options) {
            if ((type === 'DOMContentLoaded' || type === 'load') && typeof listener === 'function') {
              pendingDomCbs.push(listener);
              return;
            }
            return origWinAdd(type, listener, options);
          };
          try {
            const fn = new Function(
              'SillyTavern',
              'TavernHelper',
              'getContext',
              'getCurrentMessageId',
              'getLastMessageId',
              'getChatMessages',
              'getChatMessage',
              'setChatMessage',
              'setChatMessages',
              'triggerSlash',
              'triggerSlashWithResult',
              '$',
              'jQuery',
              code
            );
            fn(
              window.SillyTavern,
              localHelper,
              buildSillyTavernContextObject,
              localGetCurId,
              window.TavernHelper.getLastMessageId,
              window.TavernHelper.getChatMessages,
              window.TavernHelper.getChatMessage,
              window.TavernHelper.setChatMessage,
              window.TavernHelper.setChatMessages,
              executeTavernSlashCommand,
              executeTavernSlashCommand,
              window.$,
              window.jQuery
            );
            pendingDomCbs.forEach(cb => {
              try { cb(); } catch (_) {}
            });
          } finally {
            document.addEventListener = origDocAdd;
            window.addEventListener = origWinAdd;
          }
        }
      } catch (err) {
        console.warn('Floor inline script warning:', err);
      }
    });
    const frames = containerEl.querySelectorAll('iframe.tavern-html-sandbox-frame');
    frames.forEach(frame => {
      if (frame._backGuardBound) return;
      frame._backGuardBound = true;
      const bindFrameGuard = () => {
        try {
          const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
          if (!doc || doc._backGuardDocBound) return;
          doc._backGuardDocBound = true;
          const notifyGesture = () => {
            if (typeof window.replenishMobileBackGuard === 'function') {
              window.replenishMobileBackGuard();
            }
          };
          doc.addEventListener('touchend', notifyGesture, { passive: true, capture: true });
          doc.addEventListener('pointerup', notifyGesture, { passive: true, capture: true });
          doc.addEventListener('click', notifyGesture, { passive: true, capture: true });
        } catch (_) {}
      };
      frame.addEventListener('load', bindFrameGuard);
      bindFrameGuard();
    });
  }

  // ============================================================================
  // 11. Render All 9 Full-Screen SillyTavern Dropdown Drawers
  // ============================================================================
  function renderOpenDrawerHtml(drawerKey) {
    const meta = TOP_BAR_DRAWERS.find(d => d.key === drawerKey) || { title: '设置面板' };
    let bodyHtml = '';
    if (drawerKey === 'sliders') bodyHtml = renderDrawerSliders();
    else if (drawerKey === 'plug') bodyHtml = renderDrawerPlug();
    else if (drawerKey === 'font') bodyHtml = renderDrawerFont();
    else if (drawerKey === 'atlas') bodyHtml = renderDrawerAtlas();
    else if (drawerKey === 'usercog') bodyHtml = renderDrawerUserCog();
    else if (drawerKey === 'panorama') bodyHtml = renderDrawerPanorama();
    else if (drawerKey === 'cubes') bodyHtml = renderDrawerCubes();
    else if (drawerKey === 'smile') bodyHtml = renderDrawerSmile();
    else if (drawerKey === 'address') bodyHtml = renderDrawerAddress();

    return `
      <div class="drawer-content openDrawer" data-active-drawer="${drawerKey}">
        <div class="tavern-drawer-header">
          <div class="tavern-drawer-title">${meta.title}</div>
        </div>
        ${bodyHtml}
      </div>
    `;
  }

  // Drawer 1: fa-sliders (AI Generation Parameters & Prompt Manager)
  function renderDrawerSliders() {
    const preset = getActivePreset();
    const prompts = Array.isArray(preset.prompts) ? preset.prompts : [];

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>预设配置管理</span>
        </div>
        <div class="tavern-btn-grid">
          <button type="button" class="tavern-btn small primary" data-action="trigger-import-presets">导入预设</button>
          <button type="button" class="tavern-btn small" data-action="save-as-new-openai-preset">另存新预设</button>
          <button type="button" class="tavern-btn small" data-action="export-active-preset">导出预设</button>
          <button type="button" class="tavern-btn small danger" data-action="delete-active-preset">删除预设</button>
        </div>
        <select class="tavern-select" data-change="switch-preset">
          ${tavernState.presets.map(p => `
            <option value="${p.id}" ${p.id === preset.id ? 'selected' : ''}>${escapeHtmlSimple(stripUiEmojis(p.name))}</option>
          `).join('')}
        </select>
        <div class="tavern-field-group" style="margin-top:8px;margin-bottom:0;">
          <label>当前预设名称 修改或另存时使用</label>
          <input type="text" class="tavern-input" id="tavern-openai-preset-name-input" value="${escapeHtmlSimple(stripUiEmojis(preset.name || ''))}" placeholder="输入预设名称" />
        </div>
        <div class="tavern-field-hint">支持导入酒馆OpenAI预设JSON，完整保留原预设提示词与思维链排列顺序</div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">核心上下文与生成方式</div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>最大上下文Token: ${preset.openai_max_context}</label>
            <input type="number" class="tavern-input" data-preset-num="openai_max_context" value="${preset.openai_max_context}" min="2048" max="200000" step="1024" />
            <div class="tavern-field-hint">单次发送给AI的总字数容量上限</div>
          </div>
          <div class="tavern-field-group">
            <label>单次最大回复Token: ${preset.openai_max_tokens}</label>
            <input type="number" class="tavern-input" data-preset-num="openai_max_tokens" value="${preset.openai_max_tokens}" min="128" max="65536" step="256" />
            <div class="tavern-field-hint">AI每次最多能写多长的内容 含思维链与HTML面板</div>
          </div>
          <div class="tavern-field-group">
            <label>携带记忆楼层数: ${tavernState.memory?.contextFloors || 40}</label>
            <input type="number" class="tavern-input" data-memory-num="contextFloors" value="${tavernState.memory?.contextFloors || 40}" min="2" max="500" />
            <div class="tavern-field-hint">每次对话自动带上最近多少层聊天记录</div>
          </div>
          <div class="tavern-field-group">
            <label>温度 Temperature: ${preset.temperature}</label>
            <input type="number" class="tavern-input" data-preset-num="temperature" value="${preset.temperature}" min="0" max="2.5" step="0.05" />
            <div class="tavern-field-hint">控制AI脑洞大小，越高文风越发散灵动，越低越稳重守规矩</div>
          </div>
        </div>

        <label class="tavern-check-row" style="margin-top:4px;">
          <input type="checkbox" data-preset-bool="stream_openai" ${(tavernState.apiConfig?.streamEnabled !== false && preset.stream_openai) ? 'checked' : ''} />
          <span>启用真实流式实时出字</span>
        </label>
        <div class="tavern-field-hint" style="margin-bottom:8px;">开启后AI一出字屏幕就实时同步显示，关闭则等待AI整段写完后一次性显示</div>

        <div class="inline-drawer" style="margin-top:6px;margin-bottom:0;">
          <div class="inline-drawer-header" data-action="toggle-adv-samplers">
            <span>高级采样与惩罚参数</span>
            <span>${uiRuntime.showAdvancedSamplers ? '收起' : '展开'}</span>
          </div>
          ${uiRuntime.showAdvancedSamplers ? `
            <div class="inline-drawer-content">
              <div class="tavern-grid-2">
                <div class="tavern-field-group">
                  <label>核采样 Top P: ${preset.top_p}</label>
                  <input type="number" class="tavern-input" data-preset-num="top_p" value="${preset.top_p}" min="0" max="1" step="0.05" />
                  <div class="tavern-field-hint">控制选词范围，0.9到1之间最自然，调低会让用词更保守</div>
                </div>
                <div class="tavern-field-group">
                  <label>候选词 Top K: ${preset.top_k ?? 0}</label>
                  <input type="number" class="tavern-input" data-preset-num="top_k" value="${preset.top_k ?? 0}" min="0" max="200" step="1" />
                  <div class="tavern-field-hint">每次只从概率最高的前几个词里选，填0代表不限制</div>
                </div>
                <div class="tavern-field-group">
                  <label>最小概率阈值 Min P: ${preset.min_p ?? 0}</label>
                  <input type="number" class="tavern-input" data-preset-num="min_p" value="${preset.min_p ?? 0}" min="0" max="1" step="0.01" />
                  <div class="tavern-field-hint">过滤掉极低概率的生僻怪词，填0.05可防止高温度下胡言乱语</div>
                </div>
                <div class="tavern-field-group">
                  <label>典型采样 Typical P: ${preset.typical_p ?? 1}</label>
                  <input type="number" class="tavern-input" data-preset-num="typical_p" value="${preset.typical_p ?? 1}" min="0" max="1" step="0.05" />
                  <div class="tavern-field-hint">保持语句节奏均匀度，默认填1即可无需改动</div>
                </div>
                <div class="tavern-field-group">
                  <label>频率惩罚 Frequency: ${preset.frequency_penalty}</label>
                  <input type="number" class="tavern-input" data-preset-num="frequency_penalty" value="${preset.frequency_penalty}" min="-2" max="2" step="0.05" />
                  <div class="tavern-field-hint">防止同一个词反复出现，调高会让AI少说车轱辘话</div>
                </div>
                <div class="tavern-field-group">
                  <label>存在惩罚 Presence: ${preset.presence_penalty}</label>
                  <input type="number" class="tavern-input" data-preset-num="presence_penalty" value="${preset.presence_penalty}" min="-2" max="2" step="0.05" />
                  <div class="tavern-field-hint">鼓励AI主动聊新话题和新细节，调高能减少剧情原地踏步</div>
                </div>
                <div class="tavern-field-group">
                  <label>重复惩罚 Repetition: ${preset.repetition_penalty ?? 1}</label>
                  <input type="number" class="tavern-input" data-preset-num="repetition_penalty" value="${preset.repetition_penalty ?? 1}" min="0.5" max="2" step="0.05" />
                  <div class="tavern-field-hint">压制句式复读机现象，默认填1代表不额外惩罚</div>
                </div>
                <div class="tavern-field-group">
                  <label>随机种子 Seed: ${preset.seed ?? -1}</label>
                  <input type="number" class="tavern-input" data-preset-num="seed" value="${preset.seed ?? -1}" step="1" />
                  <div class="tavern-field-hint">填负一代表每次完全随机，填固定数字可复现相同回复</div>
                </div>
              </div>
              <label class="tavern-check-row" style="margin-top:4px;">
                <input type="checkbox" data-preset-bool="squash_system_messages" ${preset.squash_system_messages ? 'checked' : ''} />
                <span>合并连续系统消息</span>
              </label>
              <div class="tavern-field-hint">将多条相邻的系统设定合成为一条发送，部分反代接口兼容性更好</div>
            </div>
          ` : ''}
        </div>
      </div>

      <div id="completion_prompt_manager" class="tavern-section-card">
        <div class="tavern-section-label">
          <span>提示词排序与开关列表 共${prompts.length}项</span>
          <button type="button" class="tavern-btn small primary" data-action="add-custom-prompt-item">新增条目</button>
        </div>

        <div id="completion_prompt_manager_list">
          ${prompts.map((item, idx) => {
            const isEditingThis = uiRuntime.editingPromptId === item.identifier;
            const cleanTitle = stripUiEmojis(item.name || item.identifier) || item.identifier;
            return `
              <div class="tavern-prompt-item-wrap" data-prompt-wrap="${item.identifier}">
                <div class="tavern-list-row" style="${isEditingThis ? 'border-color:#6b6b75;background:#eff1f8;' : ''}">
                  <input type="checkbox" class="tavern-fixed-check" data-action="toggle-prompt-item" data-prompt-id="${item.identifier}" ${item.enabled ? 'checked' : ''} />
                  <div class="tavern-list-row-main">
                    <div>
                      <span class="tavern-vec-badge"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>${escapeHtmlSimple(cleanTitle)}
                    </div>
                    <div class="tavern-list-row-sub">角色: ${item.role || 'system'} | ${Number(item.injection_position) === 1 ? '深度:' + item.injection_depth : '顺序排列'}</div>
                  </div>
                  <div class="tavern-list-row-actions">
                    <button type="button" class="tavern-btn small" data-action="move-prompt-up" data-idx="${idx}">上移</button>
                    <button type="button" class="tavern-btn small" data-action="move-prompt-down" data-idx="${idx}">下移</button>
                    ${!item.marker ? `<button type="button" class="tavern-btn small ${isEditingThis ? 'primary' : ''}" data-action="edit-prompt-item" data-prompt-id="${item.identifier}">${isEditingThis ? '收起' : '编辑'}</button>` : ''}
                  </div>
                </div>
                ${isEditingThis ? `
                  <div class="tavern-section-card" style="background:#f8f9fc;border-color:#cfd5e6;margin:4px 0 10px 0;">
                    <div class="tavern-section-label">
                      <span>编辑条目: ${escapeHtmlSimple(cleanTitle)}</span>
                      <button type="button" class="tavern-btn small" data-action="close-prompt-item-editor">收起</button>
                    </div>
                    <div class="tavern-grid-2">
                      <div class="tavern-field-group">
                        <label>条目名称</label>
                        <input type="text" class="tavern-input" id="edit-prompt-name" value="${escapeHtmlSimple(cleanTitle)}" />
                      </div>
                      <div class="tavern-field-group">
                        <label>发送角色</label>
                        <select class="tavern-select" id="edit-prompt-role">
                          <option value="system" ${item.role === 'system' ? 'selected' : ''}>系统 System</option>
                          <option value="user" ${item.role === 'user' ? 'selected' : ''}>用户 User</option>
                          <option value="assistant" ${item.role === 'assistant' ? 'selected' : ''}>助手 Assistant</option>
                        </select>
                      </div>
                      <div class="tavern-field-group">
                        <label>注入位置</label>
                        <select class="tavern-select" id="edit-prompt-pos">
                          <option value="0" ${Number(item.injection_position) === 0 ? 'selected' : ''}>按顺序排列</option>
                          <option value="1" ${Number(item.injection_position) === 1 ? 'selected' : ''}>按深度插入</option>
                        </select>
                      </div>
                      <div class="tavern-field-group">
                        <label>注入深度</label>
                        <input type="number" class="tavern-input" id="edit-prompt-depth" value="${Number(item.injection_depth ?? 4)}" min="0" max="200" />
                      </div>
                    </div>
                    <div class="tavern-field-group">
                      <label>提示词内容 支持宏变量</label>
                      <textarea class="tavern-textarea" id="edit-prompt-content" rows="5">${escapeHtmlSimple(item.content || '')}</textarea>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:8px;">
                      <button type="button" class="tavern-btn small primary" data-action="save-prompt-item-editor" data-prompt-id="${item.identifier}">保存此条目</button>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Drawer 2: fa-plug (API Connection Settings & Built-in API Presets)
  function renderDrawerPlug() {
    const cfg = tavernState.apiConfig || {};
    const preset = getActivePreset();
    const resolved = resolveTavernApiCredentials();
    const models = Array.isArray(cfg.availableModels) ? cfg.availableModels : [];
    const externalPresets = getExternalPhoneApiPresets();
    const savedBuiltInPresets = Array.isArray(cfg.savedPresets) ? cfg.savedPresets : [];
    const isStreamOn = cfg.streamEnabled !== false && Boolean(preset.stream_openai);

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">主接口来源与流式开关</div>
        <label class="tavern-check-row">
          <input type="checkbox" data-api-bool="useExternalPhoneApi" ${cfg.useExternalPhoneApi !== false ? 'checked' : ''} />
          <span>直接复用手机外部API配置与预设</span>
        </label>
        <label class="tavern-check-row" style="margin-top:4px;">
          <input type="checkbox" data-preset-bool="stream_openai" ${isStreamOn ? 'checked' : ''} />
          <span>启用真实流式逐字生成 关闭则为非流式整段直出</span>
        </label>
        <div class="tavern-field-group" style="margin-top:6px;margin-bottom:4px;">
          <label>流式打字速度 字每秒: ${tavernState.uiSettings?.streamSpeed ?? 0}</label>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="number" class="tavern-input" id="tavern-stream-speed-input" data-ui-num="streamSpeed" value="${tavernState.uiSettings?.streamSpeed ?? 0}" min="0" max="300" step="5" style="flex:1;" />
            <button type="button" class="tavern-btn small primary" data-action="save-stream-speed">保存流式</button>
          </div>
          <div class="tavern-field-hint">默认0代表不限速实时输出 填数值后点击保存流式即可永久固定</div>
        </div>
        <div style="font-size:12px;color:#555;margin-top:6px;padding:6px 10px;background:#f4f5f9;border-radius:8px;">
          当前生效地址: ${escapeHtmlSimple(resolved.baseUrl ? (resolved.baseUrl + '/v1') : '未配置')} | 模型: ${escapeHtmlSimple(resolved.model || '未选择')} | 模式: ${isStreamOn ? '流式逐字' : '非流式整段'}
        </div>
        <div class="tavern-field-hint" style="margin-top:4px;">接口地址无论是否填写末尾v1后缀，系统均会自动智能识别并双路兼容连接</div>
        <div class="tavern-btn-grid" style="margin-top:8px;margin-bottom:4px;">
          <button type="button" class="tavern-btn small primary" data-action="sync-and-test-external-api">一键同步并调用外部API</button>
          <button type="button" class="tavern-btn small" data-action="test-tavern-api">测试当前连接</button>
        </div>
        ${externalPresets.length > 0 ? `
          <div class="tavern-field-group" style="margin-top:8px;margin-bottom:0;">
            <label>直接切换手机外部已存API预设</label>
            <select class="tavern-select" data-change="switch-external-api-preset">
              <option value="">跟随手机当前默认API</option>
              ${externalPresets.map(ep => `
                <option value="${escapeHtmlSimple(ep.name)}" ${cfg.selectedExternalPresetName === ep.name ? 'selected' : ''}>${escapeHtmlSimple(ep.name)} · ${escapeHtmlSimple(ep.model || '')}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>酒馆内置独立API预设与配置</span>
        </div>
        <div class="tavern-field-group">
          <label>切换已保存的酒馆内置API预设</label>
          <select class="tavern-select" data-change="switch-builtin-api-preset">
            <option value="">当前手动输入配置</option>
            ${savedBuiltInPresets.map(sp => `
              <option value="${escapeHtmlSimple(sp.id)}" ${cfg.activeSavedPresetId === sp.id ? 'selected' : ''}>${escapeHtmlSimple(sp.name)} · ${escapeHtmlSimple(sp.model || '')}</option>
            `).join('')}
          </select>
        </div>
        <div class="tavern-field-group">
          <label>内置API预设名称 保存新预设时填写</label>
          <input type="text" class="tavern-input" id="tavern-api-preset-name-input" value="${escapeHtmlSimple((savedBuiltInPresets.find(x => x.id === cfg.activeSavedPresetId)?.name) || '')}" placeholder="例如: DeepSeek主线 或 Claude反代" />
        </div>
        <div class="tavern-field-group">
          <label>接口反代地址 Base URL 填不填v1均可自动识别</label>
          <input type="text" class="tavern-input" id="tavern-api-url-input" value="${escapeHtmlSimple(cfg.useExternalPhoneApi !== false ? (resolved.baseUrl ? resolved.baseUrl + '/v1' : '') : (cfg.customUrl || (resolved.baseUrl ? resolved.baseUrl + '/v1' : '')))}" placeholder="https://api.openai.com/v1" />
        </div>
        <div class="tavern-field-group">
          <label>接口密钥 API Key</label>
          <input type="password" class="tavern-input" id="tavern-api-key-input" value="${escapeHtmlSimple(cfg.useExternalPhoneApi !== false ? (resolved.apiKey || '') : (cfg.customKey || resolved.apiKey || ''))}" placeholder="填写密钥，留空则自动读取手机外部密钥" />
        </div>
        <div class="tavern-field-group">
          <label>模型名称 Model</label>
          <input type="text" class="tavern-input" id="tavern-api-model-input" value="${escapeHtmlSimple(cfg.useExternalPhoneApi !== false ? (resolved.model || '') : (cfg.customModel || resolved.model || ''))}" placeholder="手动输入或点击下方拉取模型列表" />
        </div>
        ${models.length > 0 ? `
          <div class="tavern-field-group">
            <label>从已拉取模型列表中下拉选择</label>
            <select class="tavern-select" id="tavern-api-model-select" data-change="select-fetched-model">
              ${models.map(m => `<option value="${escapeHtmlSimple(m)}" ${m === (cfg.useExternalPhoneApi !== false ? resolved.model : (cfg.customModel || resolved.model)) ? 'selected' : ''}>${escapeHtmlSimple(m)}</option>`).join('')}
            </select>
          </div>
        ` : ''}
        <div class="tavern-btn-grid cols-3" style="margin-top:8px;">
          <button type="button" class="tavern-btn small primary" data-action="save-tavern-api-config">保存并启用</button>
          <button type="button" class="tavern-btn small" data-action="save-as-builtin-api-preset">存为内置预设</button>
          <button type="button" class="tavern-btn small danger" data-action="delete-builtin-api-preset">删除此预设</button>
        </div>
        <div class="tavern-btn-grid" style="margin-top:6px;margin-bottom:0;">
          <button type="button" class="tavern-btn small" data-action="fetch-tavern-models">拉取模型列表</button>
          <button type="button" class="tavern-btn small" data-action="test-tavern-api">测试连接</button>
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">NovelAI 插图联动</div>
        <label class="tavern-check-row">
          <input type="checkbox" data-api-bool="useExternalNovelAi" ${cfg.useExternalNovelAi !== false ? 'checked' : ''} />
          <span>共用手机外部NovelAI画图配置</span>
        </label>
      </div>
    `;
  }

  // Drawer 3: fa-font (Formatting & Instruct Templates)
  function renderDrawerFont() {
    const fmt = tavernState.formatting || {};
    const cotPairs = getActiveReasoningTagPairs();
    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>思维链与文本净化规则</span>
          <div style="display:flex;gap:6px;">
            <button type="button" class="tavern-btn small" data-action="cot-add-pair">新增</button>
            <button type="button" class="tavern-btn small primary" data-action="save-formatting-settings">保存</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
          ${cotPairs.map((pair, idx) => `
            <div style="display:flex;align-items:flex-end;gap:8px;">
              <div class="tavern-field-group" style="flex:1;margin-bottom:0;">
                <label>起始</label>
                <input type="text" class="tavern-input" data-cot-pair-idx="${idx}" data-cot-pair-field="start" value="${escapeHtmlSimple(pair?.start || '')}" placeholder="<think>" />
              </div>
              <div class="tavern-field-group" style="flex:1;margin-bottom:0;">
                <label>结束</label>
                <input type="text" class="tavern-input" data-cot-pair-idx="${idx}" data-cot-pair-field="end" value="${escapeHtmlSimple(pair?.end || '')}" placeholder="</think>" />
              </div>
              ${cotPairs.length > 1 ? `
                <button type="button" class="tavern-btn small danger" data-action="cot-del-pair" data-cot-pair-idx="${idx}" style="flex-shrink:0;height:36px;">删除</button>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <label class="tavern-check-row">
          <input type="checkbox" data-fmt-bool="autoCollapseReasoning" ${fmt.autoCollapseReasoning !== false ? 'checked' : ''} />
          <span>默认折叠思维链推理过程</span>
        </label>
        <label class="tavern-check-row">
          <input type="checkbox" data-fmt-bool="wrapQuotesInQ" ${fmt.wrapQuotesInQ !== false ? 'checked' : ''} />
          <span>对话引号自动染色高亮且不重复加引号</span>
        </label>
        <label class="tavern-check-row">
          <input type="checkbox" data-fmt-bool="collapseNewlines" ${fmt.collapseNewlines ? 'checked' : ''} />
          <span>自动合并多余空行</span>
        </label>
        <div class="tavern-field-group" style="margin-top:6px;">
          <label>自定义停止词 逗号分隔</label>
          <input type="text" class="tavern-input" id="tavern-stop-strings-input" value="${escapeHtmlSimple((fmt.customStoppingStrings || []).join(', '))}" placeholder="例如: \nUser:, \n旅人:" />
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">系统提示词与续写指令模板</div>
        <div class="tavern-field-group">
          <label>主系统提示词 Main System Prompt</label>
          <textarea class="tavern-textarea" rows="3" data-fmt-str="systemPrompt">${escapeHtmlSimple(fmt.systemPrompt || '')}</textarea>
        </div>
        <div class="tavern-field-group">
          <label>历史后置指令 Post-History Instructions</label>
          <textarea class="tavern-textarea" rows="3" data-fmt-str="postHistoryPrompt">${escapeHtmlSimple(fmt.postHistoryPrompt || '')}</textarea>
        </div>
        <div class="tavern-field-group">
          <label>帮写扮演提示词 Impersonation Prompt</label>
          <textarea class="tavern-textarea" rows="2" data-fmt-str="impersonationPrompt">${escapeHtmlSimple(fmt.impersonationPrompt || '')}</textarea>
        </div>
        <div class="tavern-field-group">
          <label>继续续写提示词 Continue Nudge</label>
          <input type="text" class="tavern-input" data-fmt-str="continueNudgePrompt" value="${escapeHtmlSimple(fmt.continueNudgePrompt || '')}" />
        </div>
        <button type="button" class="tavern-btn primary" data-action="save-formatting-settings">保存格式化设置</button>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">酒馆对话翻译设置</div>
        <label class="tavern-check-row">
          <input type="checkbox" data-fmt-bool="autoTranslateIncoming" ${fmt.autoTranslateIncoming ? 'checked' : ''} />
          <span>收到AI新回复时自动翻译为目标语言</span>
        </label>
        <div class="tavern-field-group" style="margin-top:6px;margin-bottom:0;">
          <label>翻译目标语言</label>
          <select class="tavern-select" data-fmt-str="translateTargetLang">
            <option value="简体中文" ${(fmt.translateTargetLang || '简体中文') === '简体中文' ? 'selected' : ''}>简体中文</option>
            <option value="繁體中文" ${fmt.translateTargetLang === '繁體中文' ? 'selected' : ''}>繁體中文</option>
            <option value="日本語" ${fmt.translateTargetLang === '日本語' ? 'selected' : ''}>日本語</option>
            <option value="English" ${fmt.translateTargetLang === 'English' ? 'selected' : ''}>English</option>
            <option value="한국어" ${fmt.translateTargetLang === '한국어' ? 'selected' : ''}>한국어</option>
          </select>
          <div class="tavern-field-hint">也可在任意聊天气泡右上角点开更多按钮单独点击翻译图标翻译该楼层</div>
        </div>
      </div>
    `;
  }

  // Drawer 4: fa-book-atlas (World Info Manager & Entry Editor)
  function renderDrawerAtlas() {
    const books = tavernState.worldBooks || [];
    let activeBook = books.find(b => b.id === uiRuntime.activeWorldBookEditId) || books[0] || null;
    if (activeBook && uiRuntime.activeWorldBookEditId !== activeBook.id) {
      uiRuntime.activeWorldBookEditId = activeBook.id;
    }

    const entries = activeBook ? (activeBook.entries || []) : [];
    const searchKw = (uiRuntime.worldEntrySearch || '').trim().toLowerCase();
    const filteredEntries = searchKw
      ? entries.filter(e =>
          String(e.comment || '').toLowerCase().includes(searchKw) ||
          String(e.content || '').toLowerCase().includes(searchKw) ||
          (e.keys || []).some(k => String(k).toLowerCase().includes(searchKw))
        )
      : entries;

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>世界书书库 共${books.length}本</span>
        </div>
        <div class="tavern-btn-grid">
          <button type="button" class="tavern-btn small primary" data-action="trigger-import-worldbooks">多选导入世界书</button>
          <button type="button" class="tavern-btn small" data-action="create-new-worldbook">新建世界书</button>
        </div>

        ${books.length === 0 ? `<div style="font-size:12.5px;color:#888;padding:8px 0;">暂无世界书，导入角色卡时会自动提取内嵌世界书，或点击上方多选导入JSON世界书。</div>` : `
          <div style="max-height:150px;overflow-y:auto;margin-bottom:8px;">
            ${books.map(b => `
              <div class="tavern-list-row">
                <input type="checkbox" class="tavern-fixed-check" data-action="toggle-worldbook-enabled" data-wb-id="${b.id}" ${b.enabled ? 'checked' : ''} />
                <div class="tavern-list-row-main" data-action="select-worldbook-edit" data-wb-id="${b.id}" style="cursor:pointer;">
                  <div>${escapeHtmlSimple(stripUiEmojis(b.name))} ${b.id === (activeBook && activeBook.id) ? '· 当前编辑' : ''}</div>
                  <div class="tavern-list-row-sub">词条数: ${(b.entries || []).length} | 扫描深度: ${b.scanDepth || 4}</div>
                </div>
                <div class="tavern-list-row-actions">
                  <button type="button" class="tavern-btn small" data-action="select-worldbook-edit" data-wb-id="${b.id}">展开</button>
                  <button type="button" class="tavern-btn small" data-action="export-worldbook" data-wb-id="${b.id}">导出</button>
                  <button type="button" class="tavern-btn small danger" data-action="delete-worldbook" data-wb-id="${b.id}">删除</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      ${activeBook ? `
        <div class="tavern-section-card">
          <div class="tavern-section-label">
            <span>词条管理: ${escapeHtmlSimple(stripUiEmojis(activeBook.name))}</span>
          </div>

          <div class="inline-drawer" style="margin-bottom:8px;">
            <div class="inline-drawer-header" data-action="toggle-adv-wb-settings">
              <span>世界书高级扫描参数</span>
              <span>${uiRuntime.showAdvancedWorldBookSettings ? '收起' : '展开'}</span>
            </div>
            ${uiRuntime.showAdvancedWorldBookSettings ? `
              <div class="inline-drawer-content">
                <div class="tavern-grid-3">
                  <div class="tavern-field-group">
                    <label>扫描深度</label>
                    <input type="number" class="tavern-input" data-wb-setting="scanDepth" data-wb-id="${activeBook.id}" value="${activeBook.scanDepth ?? 4}" min="1" max="100" />
                    <div class="tavern-field-hint">往前检查最近几层对话里有没有出现触发词</div>
                  </div>
                  <div class="tavern-field-group">
                    <label>预算上限</label>
                    <input type="number" class="tavern-input" data-wb-setting="tokenBudget" data-wb-id="${activeBook.id}" value="${activeBook.tokenBudget ?? 4096}" min="256" max="64000" step="256" />
                    <div class="tavern-field-hint">世界书设定最多可占用的总字数容量</div>
                  </div>
                  <div class="tavern-field-group">
                    <label>递归扫描</label>
                    <select class="tavern-select" data-wb-setting="recursiveScanning" data-wb-id="${activeBook.id}">
                      <option value="true" ${activeBook.recursiveScanning !== false ? 'selected' : ''}>开启递归</option>
                      <option value="false" ${activeBook.recursiveScanning === false ? 'selected' : ''}>关闭递归</option>
                    </select>
                    <div class="tavern-field-hint">开启后词条内容也能顺带激活其他关联词条</div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;">
            <input type="text" class="tavern-input" style="flex:1 1 140px;" id="wb-entry-search-input" value="${escapeHtmlSimple(uiRuntime.worldEntrySearch)}" placeholder="搜索词条标题或关键词..." />
            <button type="button" class="tavern-btn small primary" data-action="wb-add-entry" data-wb-id="${activeBook.id}">新增</button>
            <button type="button" class="tavern-btn small" data-action="wb-batch-enable" data-wb-id="${activeBook.id}">全启</button>
            <button type="button" class="tavern-btn small" data-action="wb-batch-constant" data-wb-id="${activeBook.id}">全蓝</button>
            <button type="button" class="tavern-btn small" data-action="wb-batch-green" data-wb-id="${activeBook.id}">全绿</button>
          </div>

          <div style="margin-top:8px;">
            ${filteredEntries.map(entry => {
              const isEditingEntry = String(uiRuntime.editingWorldEntryUid) === String(entry.uid);
              const cleanComment = stripUiEmojis(entry.comment || ('词条 #' + entry.uid)) || ('词条 #' + entry.uid);
              return `
                <div class="tavern-wb-entry-wrap" data-wb-uid="${entry.uid}">
                  <div class="tavern-list-row" style="${isEditingEntry ? 'border-color:#6b6b75;background:#eff1f8;' : ''}">
                    <input type="checkbox" class="tavern-fixed-check" data-action="wb-toggle-entry" data-wb-id="${activeBook.id}" data-uid="${entry.uid}" ${!entry.disable ? 'checked' : ''} />
                    <button type="button" class="tavern-light-box ${entry.constant ? 'is-blue' : 'is-green'}" data-action="wb-cycle-light" data-wb-id="${activeBook.id}" data-uid="${entry.uid}" title="${entry.constant ? '蓝灯常驻激活 点击切换为绿灯' : '绿灯关键词触发 点击切换为蓝灯'}">
                      <span class="tavern-light-box-inner"></span>
                    </button>
                    <div class="tavern-list-row-main">
                      <div>${escapeHtmlSimple(cleanComment)}</div>
                      <div class="tavern-list-row-sub">${entry.constant ? '蓝灯常驻' : '绿灯关键: ' + escapeHtmlSimple((entry.keys || []).join(', ') || '无')} | 顺序:${entry.order ?? 100}</div>
                    </div>
                    <div class="tavern-list-row-actions">
                      <button type="button" class="tavern-btn small ${isEditingEntry ? 'primary' : ''}" data-action="wb-edit-entry" data-wb-id="${activeBook.id}" data-uid="${entry.uid}">${isEditingEntry ? '收起' : '编辑'}</button>
                      <button type="button" class="tavern-btn small danger" data-action="wb-del-entry" data-wb-id="${activeBook.id}" data-uid="${entry.uid}">删</button>
                    </div>
                  </div>
                  ${isEditingEntry ? renderWorldEntryInlineEditor(activeBook, entry) : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function renderWorldEntryInlineEditor(book, entry) {
    return `
      <div class="tavern-section-card" style="background:#f7f8fc;border-color:#cfd6ea;margin:4px 0 10px 0;">
        <div class="tavern-section-label">
          <span>编辑词条: ${escapeHtmlSimple(stripUiEmojis(entry.comment))}</span>
          <button type="button" class="tavern-btn small" data-action="wb-close-entry-editor">收起</button>
        </div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>词条备注标题</label>
            <input type="text" class="tavern-input" id="wb-edit-comment" value="${escapeHtmlSimple(stripUiEmojis(entry.comment || ''))}" />
          </div>
          <div class="tavern-field-group">
            <label>触发模式</label>
            <select class="tavern-select" id="wb-edit-constant">
              <option value="false" ${!entry.constant ? 'selected' : ''}>绿灯 关键词触发</option>
              <option value="true" ${entry.constant ? 'selected' : ''}>蓝灯 始终常驻</option>
            </select>
          </div>
          <div class="tavern-field-group">
            <label>主关键词 逗号分隔</label>
            <input type="text" class="tavern-input" id="wb-edit-keys" value="${escapeHtmlSimple((entry.keys || []).join(', '))}" />
          </div>
          <div class="tavern-field-group">
            <label>次要过滤词 逗号分隔</label>
            <input type="text" class="tavern-input" id="wb-edit-seckeys" value="${escapeHtmlSimple((entry.secondaryKeys || []).join(', '))}" />
          </div>
          <div class="tavern-field-group">
            <label>次要词匹配逻辑</label>
            <select class="tavern-select" id="wb-edit-logic">
              <option value="0" ${Number(entry.selectiveLogic) === 0 ? 'selected' : ''}>包含任意一个</option>
              <option value="1" ${Number(entry.selectiveLogic) === 1 ? 'selected' : ''}>非全部包含</option>
              <option value="2" ${Number(entry.selectiveLogic) === 2 ? 'selected' : ''}>完全不包含</option>
              <option value="3" ${Number(entry.selectiveLogic) === 3 ? 'selected' : ''}>必须全部包含</option>
            </select>
          </div>
          <div class="tavern-field-group">
            <label>插入位置</label>
            <select class="tavern-select" id="wb-edit-pos">
              <option value="0" ${Number(entry.position) === 0 ? 'selected' : ''}>角色设定之前</option>
              <option value="1" ${Number(entry.position) === 1 ? 'selected' : ''}>角色设定之后</option>
              <option value="2" ${Number(entry.position) === 2 ? 'selected' : ''}>对话示例之前</option>
              <option value="3" ${Number(entry.position) === 3 ? 'selected' : ''}>对话示例之后</option>
              <option value="4" ${Number(entry.position) === 4 ? 'selected' : ''}>按聊天深度插入</option>
            </select>
          </div>
          <div class="tavern-field-group">
            <label>深度与顺序</label>
            <div style="display:flex;gap:6px;">
              <input type="number" class="tavern-input" id="wb-edit-depth" value="${entry.depth ?? 4}" placeholder="深度" />
              <input type="number" class="tavern-input" id="wb-edit-order" value="${entry.order ?? 100}" placeholder="顺序" />
            </div>
          </div>
          <div class="tavern-field-group">
            <label>触发概率与发送身份</label>
            <div style="display:flex;gap:6px;">
              <input type="number" class="tavern-input" id="wb-edit-prob" value="${entry.probability ?? 100}" min="0" max="100" />
              <select class="tavern-select" id="wb-edit-role">
                <option value="0" ${Number(entry.role) === 0 ? 'selected' : ''}>系统</option>
                <option value="1" ${Number(entry.role) === 1 ? 'selected' : ''}>用户</option>
                <option value="2" ${Number(entry.role) === 2 ? 'selected' : ''}>助手</option>
              </select>
            </div>
          </div>
        </div>
        <div class="tavern-field-group">
          <label>词条正文内容 Content</label>
          <textarea class="tavern-textarea" id="wb-edit-content" rows="5">${escapeHtmlSimple(entry.content || '')}</textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="tavern-btn small primary" data-action="wb-save-entry-editor" data-wb-id="${book.id}" data-uid="${entry.uid}">保存词条修改</button>
        </div>
      </div>
    `;
  }

  function rgbaOrHexToHex6(colorStr, fallback = '#ed8496') {
    if (!colorStr) return fallback;
    const s = String(colorStr).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      const r = Math.min(255, Math.max(0, Number(m[1]))).toString(16).padStart(2, '0');
      const g = Math.min(255, Math.max(0, Number(m[2]))).toString(16).padStart(2, '0');
      const b = Math.min(255, Math.max(0, Number(m[3]))).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return fallback;
  }

  // Drawer 5: fa-user-cog (UI Theme, Color Palette & User Settings)
  function renderDrawerUserCog() {
    let activeTheme = tavernState.themes.find(t => t.id === tavernState.activeThemeId) || tavernState.themes[0];
    const uiCfg = tavernState.uiSettings || {};
    const qrs = tavernState.quickReplies || [];

    const quoteHex = rgbaOrHexToHex6(activeTheme.quote_text_color, '#ed8496');
    const italicHex = rgbaOrHexToHex6(activeTheme.italics_text_color, '#999999');
    const mainHex = rgbaOrHexToHex6(activeTheme.main_text_color, '#474747');

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>酒馆美化主题切换</span>
        </div>
        <div class="tavern-btn-grid">
          <button type="button" class="tavern-btn small primary" data-action="trigger-import-themes">导入美化JSON或CSS</button>
          <button type="button" class="tavern-btn small" data-action="export-active-theme">导出当前主题</button>
        </div>
        <select class="tavern-select" data-change="switch-theme">
          ${tavernState.themes.map(t => `
            <option value="${t.id}" ${t.id === activeTheme.id ? 'selected' : ''}>${escapeHtmlSimple(t.name)}</option>
          `).join('')}
        </select>
        <label class="tavern-check-row" style="margin-top:6px;">
          <input type="checkbox" data-ui-bool="enableThemeCustomCss" ${uiCfg.enableThemeCustomCss !== false ? 'checked' : ''} />
          <span>启用当前主题附加CSS样式美化</span>
        </label>
        <label class="tavern-check-row" style="margin-top:6px;">
          <input type="checkbox" data-ui-bool="enableBaiBaiBookBeautify" ${uiCfg.enableBaiBaiBookBeautify ? 'checked' : ''} />
          <span>覆盖柏宝书界面美化</span>
        </label>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>文字配色板与双引号染色开关</span>
          <button type="button" class="tavern-btn small" data-action="reset-theme-colors">恢复默认配色</button>
        </div>
        <div class="tavern-field-hint" style="margin-bottom:8px;">字体自动继承手机外部所选字体，内部颜色与双引号高亮可在此独立开关或调色</div>
        <div class="tavern-grid-2">
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="enableQuoteColor" ${uiCfg.enableQuoteColor !== false ? 'checked' : ''} />
            <span>开启双引号台词变色</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="enableQuoteBox" ${uiCfg.enableQuoteBox !== false ? 'checked' : ''} />
            <span>开启双引号台词底框</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="enableItalicColor" ${uiCfg.enableItalicColor !== false ? 'checked' : ''} />
            <span>开启斜体心理旁白变色</span>
          </label>
        </div>

        <div class="tavern-grid-3" style="margin-top:8px;">
          <div class="tavern-field-group">
            <label>双引号台词颜色</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="color" value="${quoteHex}" data-color-picker="quote_text_color" style="width:36px;height:34px;border:none;background:none;padding:0;flex-shrink:0;cursor:pointer;" />
              <input type="text" class="tavern-input" id="theme-quote-color-input" data-color-text="quote_text_color" value="${escapeHtmlSimple(activeTheme.quote_text_color || '#ed8496')}" />
            </div>
          </div>
          <div class="tavern-field-group">
            <label>斜体心理与动作色</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="color" value="${italicHex}" data-color-picker="italics_text_color" style="width:36px;height:34px;border:none;background:none;padding:0;flex-shrink:0;cursor:pointer;" />
              <input type="text" class="tavern-input" id="theme-italic-color-input" data-color-text="italics_text_color" value="${escapeHtmlSimple(activeTheme.italics_text_color || '#999999')}" />
            </div>
          </div>
          <div class="tavern-field-group">
            <label>正文基础文字颜色</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="color" value="${mainHex}" data-color-picker="main_text_color" style="width:36px;height:34px;border:none;background:none;padding:0;flex-shrink:0;cursor:pointer;" />
              <input type="text" class="tavern-input" id="theme-main-color-input" data-color-text="main_text_color" value="${escapeHtmlSimple(activeTheme.main_text_color || '#474747')}" />
            </div>
          </div>
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">正文排版与页面边距调节</div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>全局字号缩放: ${uiCfg.fontScale ?? 1.0}</label>
            <input type="number" class="tavern-input" data-ui-num="fontScale" value="${uiCfg.fontScale ?? 1.0}" min="0.7" max="1.6" step="0.05" />
            <div class="tavern-field-hint">调节酒馆气泡文字整体大小，默认1.0</div>
          </div>
          <div class="tavern-field-group">
            <label>文字字间距: ${uiCfg.letterSpacing ?? 0}px</label>
            <input type="number" class="tavern-input" data-ui-num="letterSpacing" value="${uiCfg.letterSpacing ?? 0}" min="-1" max="6" step="0.5" />
            <div class="tavern-field-hint">调节每个汉字之间的疏密距离，默认0</div>
          </div>
          <div class="tavern-field-group">
            <label>段落行高倍数: ${uiCfg.lineHeight ?? 1.72}</label>
            <input type="number" class="tavern-input" data-ui-num="lineHeight" value="${uiCfg.lineHeight ?? 1.72}" min="1.2" max="2.6" step="0.05" />
            <div class="tavern-field-hint">调节上下两行文字之间的行距，默认1.72</div>
          </div>
          <div class="tavern-field-group">
            <label>页面左右边距: ${uiCfg.pageMargin ?? 10}px</label>
            <input type="number" class="tavern-input" data-ui-num="pageMargin" value="${uiCfg.pageMargin ?? 10}" min="0" max="48" step="2" />
            <div class="tavern-field-hint">调小可让气泡变宽使每行容纳更多字数</div>
          </div>
        </div>
        <div class="tavern-grid-2">
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="showMessageId" ${uiCfg.showMessageId !== false ? 'checked' : ''} />
            <span>显示楼层号 #0</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="showTokenCount" ${uiCfg.showTokenCount !== false ? 'checked' : ''} />
            <span>显示单层Token统计</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="showMesTimer" ${uiCfg.showMesTimer !== false ? 'checked' : ''} />
            <span>显示生成耗时</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="showSwipeCounter" ${uiCfg.showSwipeCounter !== false ? 'checked' : ''} />
            <span>显示分支页码计数器</span>
          </label>
          <label class="tavern-check-row">
            <input type="checkbox" data-ui-bool="enableFloorLazyLoad" ${uiCfg.enableFloorLazyLoad !== false ? 'checked' : ''} />
            <span>开启聊天楼层懒加载</span>
          </label>
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>当前主题自定义CSS样式表</span>
          <button type="button" class="tavern-btn small primary" data-action="save-theme-custom-css">应用并保存CSS</button>
        </div>
        <textarea class="tavern-textarea" id="tavern-theme-css-editor" rows="7" style="font-family:monospace;font-size:11.5px;">${escapeHtmlSimple(activeTheme.custom_css || '')}</textarea>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>底部快捷回复栏 Quick Replies</span>
          <button type="button" class="tavern-btn small" data-action="add-quick-reply">新增快捷按钮</button>
        </div>
        ${qrs.map(q => `
          <div class="tavern-list-row">
            <input type="checkbox" class="tavern-fixed-check" data-action="toggle-qr-item" data-qr-id="${q.id}" ${q.enabled ? 'checked' : ''} />
            <div class="tavern-list-row-main">
              <div>${escapeHtmlSimple(q.label)}</div>
              <div class="tavern-list-row-sub">${escapeHtmlSimple(q.message)}</div>
            </div>
            <div class="tavern-list-row-actions">
              <button type="button" class="tavern-btn small danger" data-action="del-qr-item" data-qr-id="${q.id}">删除</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Drawer 6: fa-panorama (Background Gallery, Blur & Debug Console)
  function renderDrawerPanorama() {
    const bg = tavernState.background || {};
    const customGallery = Array.isArray(bg.gallery) ? bg.gallery : [];
    const cards = Array.isArray(tavernState.cards) ? tavernState.cards : [];
    const cardBgItems = [];
    const seenUrls = new Set(customGallery.map(g => g && g.url).filter(Boolean));
    cards.forEach(c => {
      if (!c) return;
      const cBg = c.backgroundUrl || c.avatar || '';
      if (!cBg || cBg === DEFAULT_AVATAR_SVG || String(cBg).startsWith('data:image/svg')) return;
      if (seenUrls.has(cBg)) return;
      seenUrls.add(cBg);
      cardBgItems.push({
        id: 'cardbg_' + c.id,
        name: c.name || '角色背景',
        url: cBg,
        isCardBg: true
      });
    });
    const allGalleryItems = [
      ...customGallery.map(g => ({ ...g, isCardBg: false })),
      ...cardBgItems
    ];

    const activeCard = getActiveCard();
    const sess = getActiveChatSession();
    const curChatId = sess?.id || '';
    const msgs = (sess && Array.isArray(sess.messages)) ? sess.messages : [];
    let consoleEntries = [];
    if (uiRuntime.showDebugConsole) {
      const liveLogs = Array.isArray(uiRuntime.debugConsoleLogs)
        ? uiRuntime.debugConsoleLogs.filter(x => x && (!x.chatId || x.chatId === curChatId))
        : [];
      const isCleared = uiRuntime.debugConsoleClearedChatId === curChatId && liveLogs.length === 0;
      if (!isCleared) {
        const usedFloorSet = new Set();
        const combinedList = [];
        // Reconstruct or match the latest 5 interaction floors from current chat session so full prompts are ALWAYS shown
        for (let i = msgs.length - 1; i >= 0 && combinedList.length < 5; i--) {
          const m = msgs[i];
          if (!m) continue;
          // If floor i is a user message and floor i+1 is an AI reply, floor i is already the input of floor i+1
          if (m.is_user && i < msgs.length - 1 && msgs[i + 1] && !msgs[i + 1].is_user) {
            continue;
          }
          // Skip floor #0 opening greeting if there are subsequent interaction floors
          if (i === 0 && !m.is_user && msgs.length > 1) {
            continue;
          }
          usedFloorSet.add(i);
          const matchedLive = liveLogs.find(x => Number(x.floorIdx) === i && x.sentPromptText && x.sentPromptText.includes('=== 第 1 块消息'));
          if (matchedLive) {
            combinedList.push(matchedLive);
            continue;
          }
          const targetIdxForPrompt = !m.is_user ? (i > 0 ? i : 1) : (i + 1);
          const reconstructedMsgs = buildTavernApiMessages({
            isSwipeRegen: true,
            targetMesIndex: targetIdxForPrompt,
            forDebugConsole: true
          });
          const fullSentPrompt = formatTavernApiMessagesForDebugConsole(reconstructedMsgs);
          const fullSentTokens = calculateTavernApiMessagesTokens(reconstructedMsgs);
          const rawSwipes = Array.isArray(m.swipes) && m.swipes.length > 0 ? m.swipes : [m.mes || ''];
          const sIdx = Math.min(rawSwipes.length - 1, Math.max(0, Number(m.swipe_id || 0)));
          const rawText = rawSwipes[sIdx] !== undefined ? rawSwipes[sIdx] : (m.mes || '');
          const fullReply = m.is_user
            ? '当前楼层为用户发送消息，等待AI生成回复'
            : ((m.reasoning ? `=== AI 深度思考推理 ===\n${m.reasoning}\n\n=== AI 完整回复与输出内容 ===\n` : '') + String(rawText || ''));
          combinedList.push({
            id: 'hist_' + i,
            chatId: curChatId,
            time: m.gen_time || '当前会话楼层',
            floorIdx: i,
            cardName: activeCard?.name || m.name || '角色',
            sentPromptText: fullSentPrompt,
            rawReplyText: fullReply,
            sentTokens: fullSentTokens,
            replyTokens: m.is_user ? 0 : estimateTokens(fullReply)
          });
        }
        // Also prepend any live logs whose floorIdx wasn't in msgs (e.g. pending generation or impersonate)
        liveLogs.forEach(l => {
          if (l && !usedFloorSet.has(Number(l.floorIdx))) {
            combinedList.unshift(l);
          }
        });
        consoleEntries = combinedList.slice(0, 5);
      }
    }

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">背景图片上传与角色卡立绘联动</div>
        <div class="tavern-btn-grid cols-3" style="margin-bottom:8px;">
          <button type="button" class="tavern-btn small primary" data-action="trigger-upload-bg">多选上传背景</button>
          <button type="button" class="tavern-btn small" data-action="use-card-avatar-as-bg">用当前角色立绘</button>
          <button type="button" class="tavern-btn small danger" data-action="clear-tavern-bg">清除背景</button>
        </div>
        <label class="tavern-check-row" style="margin-bottom:8px;">
          <input type="checkbox" data-bg-bool="syncCardAvatarAsBg" ${bg.syncCardAvatarAsBg ? 'checked' : ''} />
          <span>切换或导入角色卡时自动将该角色立绘设为聊天背景</span>
        </label>
        <div class="tavern-field-group">
          <label>或直接输入背景图片URL直链</label>
          <div style="display:flex;gap:6px;">
            <input type="text" class="tavern-input" id="tavern-bg-url-input" value="${escapeHtmlSimple(bg.url || '')}" placeholder="https://... 或 http://127.0.0.1:8765/..." />
            <button type="button" class="tavern-btn" data-action="apply-bg-url">应用</button>
          </div>
        </div>
        <div class="tavern-grid-3" style="margin-top:8px;">
          <div class="tavern-field-group">
            <label>适配模式</label>
            <select class="tavern-select" data-bg-setting="fit">
              <option value="cover" ${bg.fit === 'cover' ? 'selected' : ''}>铺满裁剪 Cover</option>
              <option value="contain" ${bg.fit === 'contain' ? 'selected' : ''}>完整居中 Contain</option>
              <option value="100% 100%" ${bg.fit === '100% 100%' ? 'selected' : ''}>拉伸填充 Stretch</option>
            </select>
          </div>
          <div class="tavern-field-group">
            <label>背景模糊度: ${bg.blur ?? 0}px</label>
            <input type="number" class="tavern-input" data-bg-setting="blur" value="${bg.blur ?? 0}" min="0" max="40" />
          </div>
          <div class="tavern-field-group">
            <label>不透明度: ${bg.opacity ?? 1}</label>
            <input type="number" class="tavern-input" data-bg-setting="opacity" value="${bg.opacity ?? 1}" min="0" max="1" step="0.05" />
          </div>
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>背景图库 含上传背景与角色自带立绘 共${allGalleryItems.length}张</span>
        </div>
        ${allGalleryItems.length === 0 ? `
          <div style="font-size:12px;color:#777;padding:8px 0;">暂无背景图，点击上方多选上传背景或导入角色卡后会自动收录在此处，点击任意缩略图即可随时来回切换。</div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:240px;overflow-y:auto;padding:2px;">
            ${allGalleryItems.map(item => {
              const resolvedThumb = resolveSafeAvatarUrl(item.url, false);
              const isCurrent = bg.url && (bg.url === item.url || resolveSafeAvatarUrl(bg.url, false) === resolvedThumb);
              return `
                <div style="position:relative;border-radius:10px;overflow:hidden;border:2px solid ${isCurrent ? '#48484a' : 'rgba(200,200,210,0.7)'};background:#f2f2f5;display:flex;flex-direction:column;">
                  <div data-action="select-bg-gallery-item" data-bg-url="${escapeHtmlSimple(item.url)}" style="cursor:pointer;position:relative;width:100%;height:78px;overflow:hidden;background:#e5e5ea;">
                    <img src="${resolvedThumb}" ${String(item.url).startsWith('vault://') ? `data-vault-ref="${escapeHtmlSimple(item.url)}"` : ''} alt="bg" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_SVG}';" />
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px;gap:4px;background:rgba(255,255,255,0.94);">
                    <span data-action="select-bg-gallery-item" data-bg-url="${escapeHtmlSimple(item.url)}" style="font-size:11px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;cursor:pointer;">${escapeHtmlSimple(stripUiEmojis(item.name || '背景图'))}</span>
                    ${!item.isCardBg ? `
                      <button type="button" class="tavern-btn small danger" data-action="delete-bg-gallery-item" data-bg-id="${escapeHtmlSimple(item.id)}" style="min-height:20px !important;padding:1px 5px !important;font-size:10px !important;flex-shrink:0;">删</button>
                    ` : `
                      <span style="font-size:10px;color:#888;flex-shrink:0;">角色</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>控制台 仅保留最近5层记录</span>
          <div style="display:flex;gap:6px;">
            ${uiRuntime.showDebugConsole ? `<button type="button" class="tavern-btn small" data-action="clear-tavern-debug-console">清空记录</button>` : ''}
            <button type="button" class="tavern-btn small primary" data-action="toggle-tavern-debug-console">${uiRuntime.showDebugConsole ? '收起控制台' : '打开控制台'}</button>
          </div>
        </div>
        ${uiRuntime.showDebugConsole ? `
          <div style="display:flex;flex-direction:column;gap:10px;max-height:440px;overflow-y:auto;margin-top:6px;">
            ${consoleEntries.length === 0 ? `
              <div style="font-size:12px;color:#777;padding:6px 0;">暂无最近楼层调试记录，发送消息或生成回复后会自动记录最近5层内容。</div>
            ` : consoleEntries.map((log, idx) => {
              const sentTok = typeof log.sentTokens === 'number' ? log.sentTokens : estimateTokens(log.sentPromptText || '');
              const replyTok = typeof log.replyTokens === 'number' ? log.replyTokens : estimateTokens(log.rawReplyText || '');
              return `
                <div style="border:1px solid rgba(205,205,215,0.85);border-radius:10px;padding:10px;background:#fafafc;display:flex;flex-direction:column;gap:8px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:700;color:#333;border-bottom:1px dashed rgba(200,200,210,0.8);padding-bottom:6px;gap:6px;flex-wrap:wrap;">
                    <span>第 ${idx + 1} 条交互 · 楼层 #${escapeHtmlSimple(String(log.floorIdx))} · ${escapeHtmlSimple(stripUiEmojis(log.cardName || '角色'))}</span>
                    <span style="font-weight:600;color:#666;font-size:11px;">发送 ${sentTok} Tokens · 回复 ${replyTok} Tokens · ${escapeHtmlSimple(String(log.time || ''))}</span>
                  </div>
                  <div class="tavern-debug-field-box" style="background:#fff;border:1px solid rgba(210,210,220,0.85);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <span style="font-size:11.5px;font-weight:700;color:#333;">我方发送的完整字段 · 含预设系统提示词与世界书及上下文 · 共 ${sentTok} Tokens</span>
                      <button type="button" class="tavern-btn small" data-action="copy-tavern-debug-block" style="min-height:22px !important;padding:2px 8px !important;font-size:11px !important;flex-shrink:0;">复制</button>
                    </div>
                    <pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.55;background:#f2f3f7;padding:8px;border-radius:6px;max-height:260px;overflow-y:auto;margin:0;color:#2c2c2e;font-family:monospace;">${escapeHtmlSimple(log.sentPromptText || '')}</pre>
                  </div>
                  <div class="tavern-debug-field-box" style="background:#fff;border:1px solid rgba(210,210,220,0.85);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <span style="font-size:11.5px;font-weight:700;color:#333;">对方回复的完整字段 · 共 ${replyTok} Tokens</span>
                      <button type="button" class="tavern-btn small" data-action="copy-tavern-debug-block" style="min-height:22px !important;padding:2px 8px !important;font-size:11px !important;flex-shrink:0;">复制</button>
                    </div>
                    <pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.55;background:#f2f3f7;padding:8px;border-radius:6px;max-height:220px;overflow-y:auto;margin:0;color:#2c2c2e;font-family:monospace;">${escapeHtmlSimple(log.rawReplyText || '')}</pre>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="tavern-field-hint">点击打开控制台可查看最近5层对话的完整上下文与AI原始回复文本</div>
        `}
      </div>
    `;
  }

  // Drawer 7: fa-cubes (Extensions: Regex, Author's Note, Memory, Plugins)
  function renderDrawerCubes() {
    const card = getActiveCard();
    const preset = getActivePreset();
    const cardRegexes = (card && Array.isArray(card.regexScripts)) ? card.regexScripts : [];
    const presetRegexes = (preset && Array.isArray(preset.regexScripts)) ? preset.regexScripts : [];
    const globalRegexes = Array.isArray(tavernState.globalRegexScripts) ? tavernState.globalRegexScripts : [];
    const allRegexes = [
      ...cardRegexes.map(r => ({ ...r, _scope: 'card' })),
      ...presetRegexes.map(r => ({ ...r, _scope: 'preset' })),
      ...globalRegexes.map(r => ({ ...r, _scope: 'global' }))
    ];
    const editingRx = allRegexes.find(r => r.id === uiRuntime.editingRegexId) || null;
    const an = tavernState.authorNote || {};
    const mem = tavernState.memory || {};
    const plugins = tavernState.plugins || [];
    const helperScripts = (card && Array.isArray(card.helperScripts)) ? card.helperScripts : [];
    const sess = getActiveChatSession();
    const pool = (sess && sess.metadata && Array.isArray(sess.metadata.qr_d100_pool)) ? sess.metadata.qr_d100_pool : [];

    return `
      <div id="rm_extensions_block">
        <!-- 1. Regex Extension Drawer -->
        <div class="inline-drawer">
          <div class="inline-drawer-header" data-action="toggle-ext-acc" data-acc="regex">
            <span>正则脚本渲染与清洗引擎 共${allRegexes.length}条</span>
            <span>${uiRuntime.openExtensionAcc.regex ? '收起' : '展开'}</span>
          </div>
          ${uiRuntime.openExtensionAcc.regex ? `
            <div class="inline-drawer-content">
              <div class="tavern-btn-grid cols-3" style="margin-bottom:8px;">
                <button type="button" class="tavern-btn small primary" data-action="trigger-import-regexes">多选导入正则</button>
                <button type="button" class="tavern-btn small" data-action="add-new-regex" data-scope="global">新建全局正则</button>
                <button type="button" class="tavern-btn small" data-action="add-new-regex" data-scope="card">新建角色正则</button>
              </div>
              <div class="tavern-field-group" style="margin-bottom:8px;">
                <label>或粘贴GitHub与直链URL一键导入正则JSON</label>
                <div style="display:flex;gap:6px;">
                  <input type="text" class="tavern-input" id="tavern-regex-url-input" placeholder="粘贴正则JSON直链或GitHub文件链接..." />
                  <button type="button" class="tavern-btn small primary" data-action="import-regex-from-url">链接导入</button>
                </div>
              </div>

              ${editingRx ? `
                <div class="tavern-section-card" style="background:#f7f8fc;border-color:#cfd6ea;">
                  <div class="tavern-section-label">
                    <span>编辑正则: ${escapeHtmlSimple(editingRx.scriptName)}</span>
                    <button type="button" class="tavern-btn small" data-action="close-regex-editor">收起</button>
                  </div>
                  <div class="tavern-grid-3">
                    <div class="tavern-field-group">
                      <label>脚本名称</label>
                      <input type="text" class="tavern-input" id="rx-edit-name" value="${escapeHtmlSimple(editingRx.scriptName)}" />
                    </div>
                    <div class="tavern-field-group">
                      <label>所属范围</label>
                      <select class="tavern-select" id="rx-edit-scope">
                        <option value="global" ${editingRx._scope === 'global' ? 'selected' : ''}>全局脚本</option>
                        <option value="card" ${editingRx._scope === 'card' ? 'selected' : ''}>角色专属</option>
                        <option value="preset" ${editingRx._scope === 'preset' ? 'selected' : ''}>预设配套</option>
                      </select>
                    </div>
                    <div class="tavern-field-group">
                      <label>生效时机</label>
                      <select class="tavern-select" id="rx-edit-mode">
                        <option value="display" ${editingRx.markdownOnly && !editingRx.promptOnly ? 'selected' : ''}>仅渲染画面生效</option>
                        <option value="prompt" ${editingRx.promptOnly && !editingRx.markdownOnly ? 'selected' : ''}>仅发送提示词生效</option>
                        <option value="both" ${editingRx.markdownOnly && editingRx.promptOnly ? 'selected' : ''}>画面与提示词同时生效</option>
                      </select>
                    </div>
                  </div>
                  <div class="tavern-field-group">
                    <label>查找正则表达式 Find Regex</label>
                    <input type="text" class="tavern-input" id="rx-edit-find" value="${escapeHtmlSimple(editingRx.findRegex)}" style="font-family:monospace;" />
                  </div>
                  <div class="tavern-field-group">
                    <label>替换内容或HTML模板 Replace String</label>
                    <textarea class="tavern-textarea" id="rx-edit-replace" rows="5" style="font-family:monospace;font-size:12px;">${escapeHtmlSimple(editingRx.replaceString)}</textarea>
                  </div>
                  <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button type="button" class="tavern-btn small primary" data-action="save-regex-editor" data-rx-id="${editingRx.id}" data-scope="${editingRx._scope}">保存正则脚本</button>
                  </div>
                </div>
              ` : ''}

              <div style="max-height:240px;overflow-y:auto;">
                ${allRegexes.length === 0 ? `<div style="font-size:12px;color:#888;padding:6px 0;">暂无正则脚本，导入角色卡或预设时会自动提取并启用内嵌正则。</div>` : allRegexes.map(rx => `
                  <div class="tavern-list-row">
                    <input type="checkbox" class="tavern-fixed-check" data-action="toggle-regex-script" data-rx-id="${rx.id}" data-scope="${rx._scope}" ${!rx.disabled ? 'checked' : ''} />
                    <div class="tavern-list-row-main">
                      <div>${escapeHtmlSimple(rx.scriptName)}</div>
                      <div class="tavern-list-row-sub">${rx._scope === 'card' ? '角色专属' : (rx._scope === 'preset' ? '预设配套' : '全局脚本')} | ${escapeHtmlSimple(String(rx.findRegex).slice(0, 42))}</div>
                    </div>
                    <div class="tavern-list-row-actions">
                      <button type="button" class="tavern-btn small" data-action="move-regex-up" data-rx-id="${rx.id}" data-scope="${rx._scope}">上移</button>
                      <button type="button" class="tavern-btn small" data-action="move-regex-down" data-rx-id="${rx.id}" data-scope="${rx._scope}">下移</button>
                      <button type="button" class="tavern-btn small" data-action="edit-regex-script" data-rx-id="${rx.id}">编辑</button>
                      <button type="button" class="tavern-btn small danger" data-action="del-regex-script" data-rx-id="${rx.id}" data-scope="${rx._scope}">删</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 2. Author's Note & Character's Note Drawer -->
        <div class="inline-drawer">
          <div class="inline-drawer-header" data-action="toggle-ext-acc" data-acc="an">
            <span>作者注释与深度指令 Author Note</span>
            <span>${uiRuntime.openExtensionAcc.an ? '收起' : '展开'}</span>
          </div>
          ${uiRuntime.openExtensionAcc.an ? `
            <div class="inline-drawer-content">
              <div class="tavern-field-group">
                <label>当前对话作者注释内容</label>
                <textarea class="tavern-textarea" id="an-text-input" rows="3" placeholder="实时插入到指定聊天深度的文风或剧情引导...">${escapeHtmlSimple(an.text || '')}</textarea>
              </div>
              <div class="tavern-grid-3">
                <div class="tavern-field-group">
                  <label>注入深度 Depth</label>
                  <input type="number" class="tavern-input" id="an-depth-input" value="${an.depth ?? 4}" min="0" max="100" />
                </div>
                <div class="tavern-field-group">
                  <label>注入角色 Role</label>
                  <select class="tavern-select" id="an-role-input">
                    <option value="system" ${an.role === 'system' ? 'selected' : ''}>System</option>
                    <option value="user" ${an.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="assistant" ${an.role === 'assistant' ? 'selected' : ''}>Assistant</option>
                  </select>
                </div>
                <div class="tavern-field-group">
                  <label>间隔步频</label>
                  <input type="number" class="tavern-input" id="an-freq-input" value="${an.frequency ?? 1}" min="1" max="50" />
                </div>
              </div>
              <button type="button" class="tavern-btn small primary" data-action="save-author-note">保存作者注释</button>
            </div>
          ` : ''}
        </div>

        <!-- 3. Memory Summary Drawer -->
        <div class="inline-drawer">
          <div class="inline-drawer-header" data-action="toggle-ext-acc" data-acc="memory">
            <span>长线剧情总结与记忆工作台 Summarize</span>
            <span>${uiRuntime.openExtensionAcc.memory ? '收起' : '展开'}</span>
          </div>
          ${uiRuntime.openExtensionAcc.memory ? `
            <div class="inline-drawer-content">
              <label class="tavern-check-row">
                <input type="checkbox" id="mem-enabled-check" data-memory-bool="enabled" ${mem.enabled !== false ? 'checked' : ''} />
                <span>启用内置记忆总结 使用柏宝书时建议取消勾选</span>
              </label>
              <div class="tavern-grid-2" style="margin-top:6px;">
                <div class="tavern-field-group">
                  <label>摘要注入深度 Depth</label>
                  <input type="number" class="tavern-input" id="mem-depth-input" value="${mem.injectDepth ?? 2}" min="0" max="100" />
                </div>
                <div class="tavern-field-group">
                  <label>自动总结间隔楼层</label>
                  <input type="number" class="tavern-input" id="mem-interval-input" value="${mem.autoInterval ?? 20}" min="5" max="200" />
                </div>
              </div>
              <div class="tavern-field-group">
                <label>当前累积剧情摘要 可手动修改</label>
                <textarea class="tavern-textarea" id="mem-summary-textarea" rows="4">${escapeHtmlSimple(mem.summaryText || '')}</textarea>
              </div>
              <div style="display:flex;gap:8px;">
                <button type="button" class="tavern-btn small primary" data-action="save-memory-config">保存摘要设置</button>
                <button type="button" class="tavern-btn small" data-action="run-memory-summary-now">立即调用AI生成总结</button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 4. External JS Plugins, GitHub URL Installer & Card Helper Scripts -->
        <div class="inline-drawer">
          <div class="inline-drawer-header" data-action="toggle-ext-acc" data-acc="plugins">
            <span>酒馆扩展插件与角色内嵌脚本 共${plugins.length + helperScripts.length}个</span>
            <span>${uiRuntime.openExtensionAcc.plugins ? '收起' : '展开'}</span>
          </div>
          ${uiRuntime.openExtensionAcc.plugins ? `
            <div class="inline-drawer-content">
              <div class="tavern-btn-grid" style="margin-bottom:8px;">
                <button type="button" class="tavern-btn small primary" data-action="trigger-import-plugins">本地导入JS或JSON插件</button>
                <button type="button" class="tavern-btn small" data-action="reroll-d100-pool">立即重掷16枚D100</button>
              </div>
              <div class="tavern-field-group" style="margin-bottom:8px;">
                <label>粘贴GitHub仓库链接或脚本直链安装插件</label>
                <div style="display:flex;gap:6px;">
                  <input type="text" class="tavern-input" id="tavern-plugin-url-input" placeholder="例如: https://github.com/用户名/插件仓库名" />
                  <button type="button" class="tavern-btn small primary" data-action="import-plugin-from-url">安装插件</button>
                </div>
              </div>
              ${pool.length > 0 ? `
                <div style="padding:8px 10px;border-radius:10px;background:#f2f4f8;font-size:12px;margin-bottom:8px;">
                  本轮预生成D100随机数池: <strong>${pool.join(', ')}</strong>
                </div>
              ` : ''}
              ${helperScripts.length > 0 ? `
                <div style="font-size:12px;font-weight:700;color:#555;margin:6px 0;">当前角色卡内嵌专属脚本</div>
                ${helperScripts.map(hs => `
                  <div class="tavern-list-row">
                    <div class="tavern-list-row-main">
                      <div>${escapeHtmlSimple(stripUiEmojis(hs.name || '角色内嵌脚本'))}</div>
                      <div class="tavern-list-row-sub">随角色卡自动提取的交互图鉴或辅助脚本</div>
                    </div>
                    <div class="tavern-list-row-actions">
                      <button type="button" class="tavern-btn small primary" data-action="open-helper-script" data-script-id="${escapeHtmlSimple(hs.id)}">打开面板</button>
                    </div>
                  </div>
                `).join('')}
              ` : ''}
              <div style="font-size:12px;font-weight:700;color:#555;margin:6px 0;">全局扩展插件列表</div>
              ${plugins.map(p => `
                <div class="tavern-list-row">
                  <input type="checkbox" class="tavern-fixed-check" data-action="toggle-plugin-item" data-plugin-id="${p.id}" ${p.enabled ? 'checked' : ''} />
                  <div class="tavern-list-row-main">
                    <div>${escapeHtmlSimple(p.name)}</div>
                    <div class="tavern-list-row-sub">${escapeHtmlSimple(p.description || '外部扩展脚本')}</div>
                  </div>
                  ${!p.builtInType ? `
                    <div class="tavern-list-row-actions">
                      <button type="button" class="tavern-btn small primary" data-action="open-plugin-modal" data-plugin-id="${p.id}">打开面板</button>
                      <button type="button" class="tavern-btn small" data-action="rerun-plugin-item" data-plugin-id="${p.id}">重运行</button>
                      <button type="button" class="tavern-btn small danger" data-action="del-plugin-item" data-plugin-id="${p.id}">卸载</button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              <div style="font-size:12px;font-weight:700;color:#555;margin:10px 0 4px 0;">已挂载插件原生设置区</div>
              <div id="tavern-live-ext-settings-slot" style="min-height:10px;"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Drawer 8: fa-face-smile (Persona Management)
  function renderDrawerSmile() {
    const personas = tavernState.personas || [];
    const activeP = getActivePersona();
    const card = getActiveCard();
    const isLockedToCard = activeP && Array.isArray(activeP.lockedCardIds) && card && activeP.lockedCardIds.includes(card.id);

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>玩家人设面具列表 共${personas.length}个</span>
        </div>
        <div class="tavern-btn-grid">
          <button type="button" class="tavern-btn small" data-action="sync-persona-from-phone">同步手机人设</button>
          <button type="button" class="tavern-btn small primary" data-action="create-new-persona">新建人设</button>
        </div>
        <select class="tavern-select" data-change="switch-persona">
          ${personas.map(p => `
            <option value="${p.id}" ${p.id === activeP.id ? 'selected' : ''}>${escapeHtmlSimple(p.name)}</option>
          `).join('')}
        </select>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">编辑当前人设: ${escapeHtmlSimple(activeP.name)}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <img src="${resolveSafeAvatarUrl(activeP.avatar, true)}" alt="user" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);flex-shrink:0;" onerror="this.onerror=null;this.src='${resolveAvatarFallbackThumb(activeP.avatar, true)}';" />
          <div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:0;">
            <button type="button" class="tavern-btn small" data-action="trigger-upload-persona-avatar">更换头像并存至Termux本地</button>
            <label class="tavern-check-row">
              <input type="checkbox" id="persona-lock-card-check" ${isLockedToCard ? 'checked' : ''} />
              <span>锁定此人设专属绑定至当前角色</span>
            </label>
          </div>
        </div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>玩家姓名 替换宏user</label>
            <input type="text" class="tavern-input" id="persona-name-input" value="${escapeHtmlSimple(activeP.name || '')}" />
          </div>
          <div class="tavern-field-group">
            <label>人设注入位置</label>
            <select class="tavern-select" id="persona-pos-input">
              <option value="0" ${Number(activeP.position) !== 4 ? 'selected' : ''}>系统提示词区</option>
              <option value="4" ${Number(activeP.position) === 4 ? 'selected' : ''}>按聊天深度注入</option>
            </select>
          </div>
        </div>
        <div class="tavern-field-group">
          <label>玩家人设详细描述 Persona Description</label>
          <textarea class="tavern-textarea" id="persona-desc-input" rows="4" placeholder="填写你的身份背景、外貌性格与随身物品...">${escapeHtmlSimple(activeP.description || '')}</textarea>
        </div>
        <div class="tavern-btn-grid" style="margin-top:8px;margin-bottom:0;">
          <button type="button" class="tavern-btn small danger" data-action="delete-active-persona">删除此人设</button>
          <button type="button" class="tavern-btn small primary" data-action="save-active-persona">保存人设修改</button>
        </div>
      </div>
    `;
  }

  // Drawer 9: fa-address-card (Character Card & Multi-Branch Chat Manager)
  function renderDrawerAddress() {
    const cards = tavernState.cards || [];
    const activeCard = getActiveCard();
    const archives = (tavernState.chatArchivesByCardId && tavernState.chatArchivesByCardId[activeCard.id]) || [];
    const activeSess = getActiveChatSession();
    const altGreetings = Array.isArray(activeCard.alternate_greetings) ? activeCard.alternate_greetings : [];

    return `
      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>角色卡档案库 共${cards.length}名角色</span>
        </div>
        <div class="tavern-btn-grid">
          <button type="button" class="tavern-btn small primary" data-action="trigger-import-cards">导入PNG或JSON角色卡</button>
          <button type="button" class="tavern-btn small" data-action="create-blank-card">新建角色</button>
        </div>

        <div style="max-height:185px;overflow-y:auto;">
          ${cards.map(c => `
            <div class="tavern-list-row" style="${c.id === activeCard.id ? 'border-color:#555;background:#f0f1f6;' : ''}">
              <img src="${resolveSafeAvatarUrl(c.avatar, false)}" alt="char" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.onerror=null;this.src='${resolveAvatarFallbackThumb(c.avatar, false)}';" />
              <div class="tavern-list-row-main" data-action="switch-active-card" data-card-id="${c.id}" style="cursor:pointer;">
                <div>${escapeHtmlSimple(c.name)} ${c.id === activeCard.id ? '· 当前游玩' : ''}</div>
                <div class="tavern-list-row-sub">开场白:${1 + (c.alternate_greetings?.length || 0)}个 | 正则:${(c.regexScripts || []).length}条</div>
              </div>
              <div class="tavern-list-row-actions">
                <button type="button" class="tavern-btn small" data-action="switch-active-card" data-card-id="${c.id}">切换</button>
                <button type="button" class="tavern-btn small" data-action="export-card-json" data-card-id="${c.id}">导出</button>
                ${cards.length > 1 ? `<button type="button" class="tavern-btn small danger" data-action="delete-card" data-card-id="${c.id}">删</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>当前角色聊天存档分支 共${archives.length}个</span>
        </div>
        <div class="tavern-btn-grid cols-3">
          <button type="button" class="tavern-btn small primary" data-action="chat-new-session">新建存档</button>
          <button type="button" class="tavern-btn small" data-action="trigger-import-chats">导入聊天</button>
          <button type="button" class="tavern-btn small" data-action="export-current-chat">导出聊天</button>
        </div>
        <div style="max-height:135px;overflow-y:auto;">
          ${archives.map(arch => `
            <div class="tavern-list-row">
              <div class="tavern-list-row-main">
                <div>${escapeHtmlSimple(arch.title || arch.chatId)} ${arch.chatId === activeSess?.chatId ? '· 当前对话' : ''}</div>
                <div class="tavern-list-row-sub">共 ${(arch.messages || []).length} 层消息</div>
              </div>
              <div class="tavern-list-row-actions">
                <button type="button" class="tavern-btn small" data-action="switch-chat-archive" data-chat-id="${arch.chatId}">载入</button>
                ${archives.length > 1 ? `<button type="button" class="tavern-btn small danger" data-action="delete-chat-archive" data-chat-id="${arch.chatId}">删</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="tavern-section-card">
        <div class="tavern-section-label">
          <span>角色卡参数编辑: ${escapeHtmlSimple(activeCard.name)}</span>
          <button type="button" class="tavern-btn small" data-action="trigger-upload-card-avatar">更换头像</button>
        </div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>角色名称 修改后对话楼层名字同步更新</label>
            <input type="text" class="tavern-input" id="card-edit-name" value="${escapeHtmlSimple(activeCard.name || '')}" />
          </div>
          <div class="tavern-field-group">
            <label>绑定专属世界书</label>
            <select class="tavern-select" id="card-edit-wb">
              <option value="">不单独绑定</option>
              ${(tavernState.worldBooks || []).map(wb => `
                <option value="${wb.id}" ${wb.id === activeCard.worldBookId ? 'selected' : ''}>${escapeHtmlSimple(wb.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="tavern-field-group">
          <label>角色设定描述 Description</label>
          <textarea class="tavern-textarea" id="card-edit-desc" rows="4">${escapeHtmlSimple(activeCard.description || '')}</textarea>
        </div>
        <div class="tavern-grid-2">
          <div class="tavern-field-group">
            <label>性格特征 Personality</label>
            <textarea class="tavern-textarea" id="card-edit-personality" rows="2">${escapeHtmlSimple(activeCard.personality || '')}</textarea>
          </div>
          <div class="tavern-field-group">
            <label>场景设定 Scenario</label>
            <textarea class="tavern-textarea" id="card-edit-scenario" rows="2">${escapeHtmlSimple(activeCard.scenario || '')}</textarea>
          </div>
        </div>
        <div class="tavern-field-group">
          <label>默认主开场白 First Message</label>
          <textarea class="tavern-textarea" id="card-edit-firstmes" rows="4">${escapeHtmlSimple(activeCard.first_mes || '')}</textarea>
        </div>
        <div class="tavern-field-group" style="margin-bottom:0;">
          <label>额外多开场白数量: ${altGreetings.length}个 可在0层左右翻页切换</label>
          <div class="tavern-btn-grid" style="margin-top:4px;margin-bottom:0;">
            <button type="button" class="tavern-btn small" data-action="sync-card-greetings-to-floor0">同步开场白至0层</button>
            <button type="button" class="tavern-btn small primary" data-action="save-card-edits">保存角色卡修改</button>
          </div>
        </div>
      </div>
    `;
  }
  // ============================================================================
  // 12. Chat Generation, Floor Actions & Event Delegation
  // ============================================================================
  function autoResizeTavernSendTextarea(el) {
    const textarea = el || document.getElementById('send_textarea');
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(96, Math.max(36, textarea.scrollHeight));
    textarea.style.height = nextHeight + 'px';
  }

  async function handleSendUserMessage() {
    if (uiRuntime.isGenerating) {
      if (uiRuntime.abortController) {
        uiRuntime.abortController.abort();
      }
      return;
    }
    const textarea = document.getElementById('send_textarea');
    if (!textarea) return;
    const rawInput = textarea.value.trim();
    uiRuntime.editingFloorMesId = null;
    uiRuntime.editingFloorReasoning = false;

    if (!rawInput) {
      await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
      return;
    }

    if (rawInput.startsWith('/')) {
      textarea.value = '';
      autoResizeTavernSendTextarea(textarea);
      await executeTavernSlashCommand(rawInput);
      return;
    }

    textarea.value = '';
    autoResizeTavernSendTextarea(textarea);
    const sess = getActiveChatSession();
    const tokenCnt = estimateTokens(rawInput);
    const nowTs = Date.now();
    const userMsg = {
      mesid: sess.messages.length,
      name: getUserDisplayName(),
      is_user: true,
      is_system: false,
      send_date: nowTs,
      mes: rawInput,
      swipes: [rawInput],
      swipe_id: 0,
      swipe_info: [{ send_date: nowTs, gen_time: '', reasoning: '', token_count: tokenCnt }],
      reasoning: '',
      gen_time: '',
      token_count: tokenCnt
    };
    sess.messages.push(userMsg);
    uiRuntime.userScrolledUpDuringStream = false;
    await saveTavernStore();
    appendOrUpdateSingleFloorDom(sess.messages.length - 1, { scrollToBottom: true });
    await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SENT, sess.messages.length - 1);
    await tavernEventSource.emit(TAVERN_EVENT_TYPES.USER_MESSAGE_RENDERED, sess.messages.length - 1);

    await triggerCharacterReplyGeneration({ isContinue: false, isSwipeRegen: false });
  }

  function splitUnclosedStreamBlocks(rawStreamText) {
    const text = String(rawStreamText || '');
    if (!text) return { completedText: '', hasPendingTail: false };

    let cutIdx = -1;
    const updateCut = (idx) => {
      if (idx >= 0 && (cutIdx === -1 || idx < cutIdx)) {
        cutIdx = idx;
      }
    };

    // 1. Check unclosed HTML documents (<!DOCTYPE html or <html without </html>)
    const lastDoctype = text.search(/```(?:html)?\s*<!DOCTYPE\s+html|<!DOCTYPE\s+html|<html[\s>]/i);
    if (lastDoctype !== -1 && !/<\/html\s*>/i.test(text.slice(lastDoctype))) {
      updateCut(lastDoctype);
    }

    // 2. Check unclosed card status/interactive blocks (e.g. <gourmet_journal>, <chef_newspaper>, <magical_menu>, <Achievement>, <status_block>)
    const blockTags = ['gourmet_journal', 'chef_newspaper', 'magical_menu', 'Achievement', 'status_block', 'status_bar', 'rpg_status'];
    for (const tag of blockTags) {
      const openRx = new RegExp('<' + tag + '\\b[^>]*>', 'gi');
      let match;
      let lastOpenIdx = -1;
      while ((match = openRx.exec(text)) !== null) {
        lastOpenIdx = match.index;
      }
      if (lastOpenIdx !== -1) {
        const closeRx = new RegExp('<\\/' + tag + '\\s*>', 'i');
        if (!closeRx.test(text.slice(lastOpenIdx))) {
          updateCut(lastOpenIdx);
        }
      }
    }

    // 3. Check unclosed first-line [STATUS] before its first newline arrives
    if (/^\s*\[STATUS\][^\r\n]*$/i.test(text)) {
      updateCut(0);
    }

    if (cutIdx !== -1) {
      return {
        completedText: text.slice(0, cutIdx),
        hasPendingTail: true
      };
    }
    return {
      completedText: text,
      hasPendingTail: false
    };
  }

  function isSameMediaOrFrameNode(oldNode, newNode) {
    if (!oldNode || !newNode || oldNode.nodeType !== 1 || newNode.nodeType !== 1) return false;
    if (oldNode.tagName !== newNode.tagName) return false;
    if (oldNode.tagName === 'IFRAME') {
      return (oldNode.getAttribute('srcdoc') || '') === (newNode.getAttribute('srcdoc') || '') &&
             (oldNode.getAttribute('src') || '') === (newNode.getAttribute('src') || '');
    }
    if (oldNode.tagName === 'IMG') {
      return (oldNode.getAttribute('src') || '') === (newNode.getAttribute('src') || '');
    }
    const oldFrames = oldNode.querySelectorAll('iframe, img');
    const newFrames = newNode.querySelectorAll('iframe, img');
    if (oldFrames.length > 0 && oldFrames.length === newFrames.length) {
      for (let i = 0; i < oldFrames.length; i++) {
        if (oldFrames[i].tagName !== newFrames[i].tagName) return false;
        if (oldFrames[i].tagName === 'IFRAME' && (oldFrames[i].getAttribute('srcdoc') || '') !== (newFrames[i].getAttribute('srcdoc') || '')) {
          return false;
        }
        if (oldFrames[i].tagName === 'IMG' && (oldFrames[i].getAttribute('src') || '') !== (newFrames[i].getAttribute('src') || '')) {
          return false;
        }
      }
      if (oldNode.outerHTML === newNode.outerHTML) return true;
    }
    return false;
  }

  function patchStreamingMesTextDom(textEl, newHtml) {
    if (!textEl) return;
    const temp = document.createElement('div');
    temp.innerHTML = newHtml;
    const newChildren = Array.from(temp.childNodes);
    const oldChildren = Array.from(textEl.childNodes);

    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i];
      const oldChild = oldChildren[i];
      if (!oldChild) {
        textEl.appendChild(newChild);
        continue;
      }
      if (oldChild.nodeType === 3 && newChild.nodeType === 3) {
        if (oldChild.textContent !== newChild.textContent) {
          oldChild.textContent = newChild.textContent;
        }
        continue;
      }
      if (oldChild.nodeType === 1 && newChild.nodeType === 1) {
        // Never touch or reload an existing iframe or image with identical source!
        if (isSameMediaOrFrameNode(oldChild, newChild)) {
          continue;
        }
        if (oldChild.outerHTML === newChild.outerHTML) {
          continue;
        }
        const hasMediaInside = oldChild.querySelector('iframe, img') || newChild.querySelector('iframe, img') || oldChild.tagName === 'IFRAME' || newChild.tagName === 'IFRAME' || oldChild.tagName === 'IMG' || newChild.tagName === 'IMG';
        if (!hasMediaInside && oldChild.tagName === newChild.tagName && oldChild.className === newChild.className) {
          oldChild.innerHTML = newChild.innerHTML;
          continue;
        }
      }
      textEl.replaceChild(newChild, oldChild);
    }

    while (textEl.childNodes.length > newChildren.length) {
      textEl.removeChild(textEl.lastChild);
    }
  }

  function updateStreamingFloorDom(mesIndex) {
    const chatEl = document.getElementById('chat');
    if (!chatEl) return;
    const sess = getActiveChatSession();
    const card = getActiveCard();
    const msg = sess && sess.messages[mesIndex];
    if (!msg) return;
    const floorEl = chatEl.querySelector(`.mes[mesid="${mesIndex}"]`);
    if (!floorEl) {
      appendOrUpdateSingleFloorDom(mesIndex, { scrollToBottom: !uiRuntime.userScrolledUpDuringStream });
      return;
    }
    const textEl = floorEl.querySelector('.mes_text');
    if (textEl) {
      const rawStreamText = String(msg.mes || '');
      const isLastFloor = mesIndex === sess.messages.length - 1;
      if (!rawStreamText.trim() && uiRuntime.isGenerating) {
        patchStreamingMesTextDom(textEl, `<div class="tavern-typing-indicator" title="AI正在思考生成中"><span></span><span></span><span></span></div>`);
      } else if (uiRuntime.isGenerating) {
        const splitRes = splitUnclosedStreamBlocks(rawStreamText);
        const narrativeHtml = splitRes.completedText.trim()
          ? renderTavernMessageHtml(splitRes.completedText, {
              isUser: Boolean(msg.is_user),
              isPrompt: false,
              isLastFloor,
              depth: sess.messages.length - 1 - mesIndex,
              card
            })
          : '';
        const tailNotice = splitRes.hasPendingTail
          ? `<div class="tavern-stream-building-bar" style="padding:10px 14px;margin-top:8px;border-radius:10px;background:rgba(240,236,228,0.85);color:#666;font-size:12.5px;">正在实时接收状态栏面板数据... 已接收 ${rawStreamText.length} 字符</div>`
          : '';
        patchStreamingMesTextDom(textEl, narrativeHtml + tailNotice);
      } else {
        const finalHtml = renderTavernMessageHtml(rawStreamText, {
          isUser: Boolean(msg.is_user),
          isPrompt: false,
          isLastFloor,
          depth: sess.messages.length - 1 - mesIndex,
          card
        });
        patchStreamingMesTextDom(textEl, finalHtml);
      }
    }
    const timerEl = floorEl.querySelector('.mes_timer');
    if (timerEl && msg.gen_time) {
      timerEl.textContent = msg.gen_time;
    }
    const tokenEl = floorEl.querySelector('.tokenCounterDisplay');
    if (tokenEl && tavernState.uiSettings?.showTokenCount !== false) {
      tokenEl.textContent = estimateTokens(msg.mes || '') + 't';
    }
    if (msg.reasoning && String(msg.reasoning).trim()) {
      let detailsEl = floorEl.querySelector('.mes_reasoning_details');
      const isStillThinkingOnly = uiRuntime.isGenerating && !String(msg.mes || '').trim();
      if (!detailsEl && textEl) {
        detailsEl = document.createElement('details');
        detailsEl.className = 'mes_reasoning_details';
        if (tavernState.formatting?.autoCollapseReasoning === false) {
          detailsEl.setAttribute('open', '');
        }
        detailsEl.innerHTML = `<summary class="mes_reasoning_summary flex-container"><div class="mes_reasoning_header flex-container"><span class="mes_reasoning_header_title">${isStillThinkingOnly ? '思考过程中...' : '思考过程'}</span></div><div class="mes_reasoning_arrow"></div></summary><div class="mes_reasoning mes_reasoning_content"></div>`;
        textEl.parentNode.insertBefore(detailsEl, textEl);
      } else if (detailsEl) {
        const titleSpan = detailsEl.querySelector('.mes_reasoning_header_title');
        if (titleSpan) titleSpan.textContent = isStillThinkingOnly ? '思考过程中...' : '思考过程';
      }
      const rContent = detailsEl && detailsEl.querySelector('.mes_reasoning_content');
      if (rContent) {
        rContent.textContent = msg.reasoning;
        if (isStillThinkingOnly && detailsEl.hasAttribute('open')) {
          rContent.scrollTop = rContent.scrollHeight;
        }
      }
    }
    if (!uiRuntime.userScrolledUpDuringStream) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  }

  async function translateTextFreeWeb(rawText, targetLangLabel) {
    const langMap = {
      '简体中文': 'zh-CN',
      '繁體中文': 'zh-TW',
      '日本語': 'ja',
      'English': 'en',
      '한국어': 'ko'
    };
    const tl = langMap[targetLangLabel] || 'zh-CN';
    const text = String(rawText || '').trim();
    if (!text) return '';

    // 1. Primary: Free Google Translate GTX Web Endpoint (Zero AI token cost, instant response)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(gtxUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const joined = data[0].map(seg => (Array.isArray(seg) ? seg[0] : '')).join('');
          if (joined.trim()) return joined.trim();
        }
      }
    } catch (_) {}

    // 2. Fallback: Free MyMemory Web Translation Endpoint (Zero AI token cost)
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 1500))}&langpair=autodetect|${encodeURIComponent(tl)}`;
    const mmRes = await fetch(mmUrl);
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      if (mmData && mmData.responseData && mmData.responseData.translatedText) {
        return String(mmData.responseData.translatedText).trim();
      }
    }
    throw new Error('免费网页翻译引擎连接超时');
  }

  async function translateTavernFloor(mesIndex, silent = false) {
    const sess = getActiveChatSession();
    const msg = sess && sess.messages[mesIndex];
    if (!msg || !String(msg.mes || '').trim()) return;
    const targetLang = tavernState.formatting?.translateTargetLang || '简体中文';
    if (!silent) showTavernToast('正在使用免费翻译引擎转换第 #' + mesIndex + ' 层...');
    try {
      const cleanSource = String(msg.mes || '')
        .replace(/```(?:html)?[\s\S]*?```/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (!cleanSource) return;
      const translated = await translateTextFreeWeb(cleanSource, targetLang);
      if (translated) {
        msg.translation = translated;
        await saveTavernStore();
        appendOrUpdateSingleFloorDom(mesIndex);
        if (!silent) showTavernToast('第 #' + mesIndex + ' 层翻译完成');
      }
    } catch (err) {
      if (!silent) showTavernToast('翻译失败: ' + (err.message || '网络不可用'));
    }
  }

  function syncTavernGeneratingUiState(isGen) {
    uiRuntime.isGenerating = Boolean(isGen);
    const sendBtnEl = document.getElementById('send_but');
    if (sendBtnEl) {
      sendBtnEl.classList.toggle('is-generating', Boolean(isGen));
      sendBtnEl.setAttribute('title', isGen ? '点击暂停生成' : '发送');
    }
    const chatEl = document.getElementById('chat');
    if (chatEl) {
      const allStops = chatEl.querySelectorAll('.mes_button.mes_stop');
      allStops.forEach(btn => {
        const isLastMes = Boolean(btn.closest('.mes.last_mes'));
        btn.style.setProperty('display', (isGen && isLastMes) ? 'inline-flex' : 'none', 'important');
      });
      if (!isGen) {
        chatEl.querySelectorAll('.tavern-typing-indicator').forEach(ind => ind.remove());
        chatEl.querySelectorAll('.mes_reasoning_header_title').forEach(titleEl => {
          if (titleEl.textContent === '思考过程中...') {
            titleEl.textContent = '思考过程';
          }
        });
      }
    }
  }

  async function triggerCharacterReplyGeneration(options = {}) {
    if (uiRuntime.isGenerating) return;
    let {
      isContinue = false,
      isImpersonate = false,
      isSwipeRegen = false,
      targetMesIndex = null
    } = options;

    const card = getActiveCard();
    const sess = getActiveChatSession();
    const preset = getActivePreset();

    uiRuntime.editingFloorMesId = null;
    uiRuntime.editingFloorReasoning = false;
    uiRuntime.userScrolledUpDuringStream = false;

    // Smart handling when regenerating or continuing after deleting AI replies or on a user floor
    if (isSwipeRegen && sess && sess.messages.length > 0) {
      if (targetMesIndex === null || targetMesIndex === undefined) {
        targetMesIndex = sess.messages.length - 1;
      }
      const targetCandidate = sess.messages[targetMesIndex];
      if (targetCandidate && targetCandidate.is_user) {
        if (targetMesIndex + 1 < sess.messages.length && !sess.messages[targetMesIndex + 1].is_user) {
          targetMesIndex = targetMesIndex + 1;
        } else {
          // User floor is the last floor (e.g. AI reply was deleted): create a fresh AI reply floor!
          isSwipeRegen = false;
          isContinue = false;
          targetMesIndex = null;
        }
      }
    }

    if (isContinue && sess && sess.messages.length > 0) {
      const lastCandidate = sess.messages[sess.messages.length - 1];
      if (lastCandidate && lastCandidate.is_user) {
        // Cannot append AI continuation inside the user's own message bubble; generate a new AI reply floor instead!
        isContinue = false;
        isSwipeRegen = false;
        targetMesIndex = null;
      }
    }

    syncTavernGeneratingUiState(true);

    const isStreamOn = tavernState.apiConfig?.streamEnabled !== false && Boolean(preset.stream_openai);
    showTavernToast(isImpersonate ? '正在帮写玩家回复...' : (isSwipeRegen ? '正在重新生成全新回复...' : '正在思考并生成回复...'));

    const genType = isImpersonate ? 'impersonate' : (isContinue ? 'continue' : (isSwipeRegen ? 'swipe' : 'normal'));
    let currentDbgLogId = '';
    let pendingDbgFloorIdx = 0;
    let currentApiMessages = [];
    let nonStreamWaitTimer = null;
    try {
      await tavernEventSource.emit(TAVERN_EVENT_TYPES.GENERATION_STARTED, genType, {}, false);
      if (typeof window.bbs_generateInterceptor === 'function') {
        try {
          await window.bbs_generateInterceptor(sess.messages || [], Number(preset.openai_max_context || 32000), () => {}, genType);
        } catch (bbsErr) {
          console.warn('bbs_generateInterceptor warning:', bbsErr);
        }
      }
      const apiMessages = buildTavernApiMessages({ isImpersonate, isContinue, isSwipeRegen, targetMesIndex });
      currentApiMessages = apiMessages;
      pendingDbgFloorIdx = isContinue
        ? Math.max(0, sess.messages.length - 1)
        : (isSwipeRegen && targetMesIndex !== null ? targetMesIndex : sess.messages.length);
      currentDbgLogId = 'dbg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      recordTavernDebugConsoleLog({
        id: currentDbgLogId,
        chatId: sess?.id || '',
        floorIdx: pendingDbgFloorIdx,
        cardName: card?.name || '角色',
        apiMessages,
        rawReplyText: '正在等待AI生成回复...'
      });

      const startNonStreamFloorTimer = (floorIdx) => {
        if (isStreamOn) return;
        const waitStart = performance.now();
        if (nonStreamWaitTimer) clearInterval(nonStreamWaitTimer);
        nonStreamWaitTimer = setInterval(() => {
          if (!uiRuntime.isGenerating) {
            clearInterval(nonStreamWaitTimer);
            nonStreamWaitTimer = null;
            return;
          }
          const sec = ((performance.now() - waitStart) / 1000).toFixed(0);
          const timerEl = document.querySelector(`#chat .mes[mesid="${floorIdx}"] .mes_timer`);
          if (timerEl) timerEl.textContent = sec + 's';
        }, 1000);
      };

      if (isImpersonate) {
        const textarea = document.getElementById('send_textarea');
        const prevDraft = textarea ? textarea.value : '';
        try {
          const result = await callTavernAiCompletion(apiMessages, isStreamOn ? (partial) => {
            if (textarea) textarea.value = partial.content;
          } : null);
          if (textarea) textarea.value = result.content;
          recordTavernDebugConsoleLog({
            id: currentDbgLogId,
            chatId: sess?.id || '',
            floorIdx: pendingDbgFloorIdx,
            cardName: card?.name || '角色',
            apiMessages,
            rawReplyText: result.rawContent || result.content || ''
          });
          showTavernToast('已填入帮写草稿');
        } catch (impErr) {
          if (textarea && !textarea.value.trim() && prevDraft) {
            textarea.value = prevDraft;
          }
          throw impErr;
        }
      } else if (isContinue && sess.messages.length > 0) {
        const lastIdx = sess.messages.length - 1;
        const lastMsg = sess.messages[lastIdx];
        const curSwipe = Number(lastMsg.swipe_id || 0);
        if (!Array.isArray(lastMsg.swipes) || lastMsg.swipes.length === 0) {
          lastMsg.swipes = [lastMsg.mes || ''];
        }
        const baseText = lastMsg.swipes[curSwipe] || '';
        const mergeContinuation = (base, addition) => {
          let addStr = String(addition || '');
          if (base && addStr.startsWith(base)) {
            addStr = addStr.slice(base.length);
          }
          return base + addStr;
        };
        startNonStreamFloorTimer(lastIdx);
        const result = await callTavernAiCompletion(apiMessages, isStreamOn ? (partial) => {
          const combined = mergeContinuation(baseText, partial.content);
          lastMsg.swipes[curSwipe] = combined;
          lastMsg.mes = combined;
          lastMsg.gen_time = partial.genTime;
          recordMessageToSwipeInfo(lastMsg, curSwipe);
          updateStreamingFloorDom(lastIdx);
        } : null);
        if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }
        const combined = mergeContinuation(baseText, result.content);
        lastMsg.swipes[curSwipe] = combined;
        lastMsg.mes = combined;
        lastMsg.token_count = estimateTokens(combined);
        lastMsg.gen_time = result.genTime;
        recordMessageToSwipeInfo(lastMsg, curSwipe);
        recordTavernDebugConsoleLog({
          id: currentDbgLogId,
          chatId: sess?.id || '',
          floorIdx: lastIdx,
          cardName: card?.name || '角色',
          apiMessages,
          rawReplyText: result.rawContent || result.content || ''
        });
        syncTavernGeneratingUiState(false);
        await saveTavernStore();
        appendOrUpdateSingleFloorDom(lastIdx);
      } else if (isSwipeRegen && targetMesIndex !== null && sess.messages[targetMesIndex]) {
        const targetMsg = sess.messages[targetMesIndex];
        if (!Array.isArray(targetMsg.swipes)) targetMsg.swipes = [targetMsg.mes || ''];
        const prevSwipeIdx = Math.max(0, Number(targetMsg.swipe_id || 0));
        recordMessageToSwipeInfo(targetMsg, prevSwipeIdx);

        targetMsg.swipes.push('');
        const newSwipeIdx = targetMsg.swipes.length - 1;
        targetMsg.swipe_id = newSwipeIdx;
        targetMsg.mes = '';
        targetMsg.reasoning = '';
        targetMsg.gen_time = '';
        targetMsg.token_count = 1;
        targetMsg.translation = '';
        recordMessageToSwipeInfo(targetMsg, newSwipeIdx);
        appendOrUpdateSingleFloorDom(targetMesIndex, { scrollToBottom: true });
        startNonStreamFloorTimer(targetMesIndex);

        let result;
        try {
          result = await callTavernAiCompletion(apiMessages, isStreamOn ? (partial) => {
            targetMsg.swipes[newSwipeIdx] = partial.content;
            targetMsg.mes = partial.content;
            targetMsg.reasoning = partial.reasoning || '';
            targetMsg.gen_time = partial.genTime;
            targetMsg.token_count = estimateTokens(partial.content);
            recordMessageToSwipeInfo(targetMsg, newSwipeIdx);
            updateStreamingFloorDom(targetMesIndex);
          } : null);
        } catch (regenErr) {
          if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }
          syncTavernGeneratingUiState(false);
          if (!targetMsg.mes && targetMsg.swipes.length > 1 && targetMsg.swipes[newSwipeIdx] === '') {
            targetMsg.swipes.splice(newSwipeIdx, 1);
            targetMsg.swipe_id = Math.max(0, targetMsg.swipes.length - 1);
            targetMsg.mes = targetMsg.swipes[targetMsg.swipe_id] || '';
            syncSwipeInfoToMessage(targetMsg, targetMsg.swipe_id);
            await saveTavernStore();
            appendOrUpdateSingleFloorDom(targetMesIndex);
          }
          throw regenErr;
        }
        if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }

        targetMsg.swipes[newSwipeIdx] = result.content;
        targetMsg.mes = result.content;
        targetMsg.reasoning = result.reasoning || '';
        targetMsg.gen_time = result.genTime;
        targetMsg.token_count = estimateTokens(result.content);
        recordMessageToSwipeInfo(targetMsg, newSwipeIdx);
        recordTavernDebugConsoleLog({
          id: currentDbgLogId,
          chatId: sess?.id || '',
          floorIdx: targetMesIndex,
          cardName: card?.name || '角色',
          apiMessages,
          rawReplyText: result.rawContent || ((result.reasoning ? `=== AI 深度思考推理 ===\n${result.reasoning}\n\n=== AI 完整回复与输出内容 ===\n` : '') + (result.content || ''))
        });
        syncTavernGeneratingUiState(false);
        await saveTavernStore();
        appendOrUpdateSingleFloorDom(targetMesIndex);
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SWIPED, targetMesIndex);
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_RECEIVED, targetMesIndex, genType);
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.CHARACTER_MESSAGE_RENDERED, targetMesIndex, genType);
        if (tavernState.formatting?.autoTranslateIncoming) {
          translateTavernFloor(targetMesIndex, true);
        }
      } else {
        const newFloorIdx = sess.messages.length;
        const nowTs = Date.now();
        const botMsg = {
          mesid: newFloorIdx,
          name: card.name || '角色',
          is_user: false,
          is_system: false,
          send_date: nowTs,
          mes: '',
          swipes: [''],
          swipe_id: 0,
          swipe_info: [{ send_date: nowTs, gen_time: '', reasoning: '', token_count: 1 }],
          reasoning: '',
          gen_time: '',
          token_count: 1
        };
        sess.messages.push(botMsg);
        appendOrUpdateSingleFloorDom(newFloorIdx, { scrollToBottom: true });
        startNonStreamFloorTimer(newFloorIdx);

        let result;
        try {
          result = await callTavernAiCompletion(apiMessages, isStreamOn ? (partial) => {
            botMsg.mes = partial.content;
            botMsg.swipes[0] = partial.content;
            botMsg.reasoning = partial.reasoning || '';
            botMsg.gen_time = partial.genTime;
            botMsg.token_count = estimateTokens(partial.content);
            recordMessageToSwipeInfo(botMsg, 0);
            updateStreamingFloorDom(newFloorIdx);
          } : null);
        } catch (genErr) {
          if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }
          syncTavernGeneratingUiState(false);
          if (!botMsg.mes && sess.messages[newFloorIdx] === botMsg) {
            sess.messages.splice(newFloorIdx, 1);
            await saveTavernStore();
            const orphanNode = document.querySelector(`#chat .mes[mesid="${newFloorIdx}"]`);
            if (orphanNode) orphanNode.remove();
            const prevLastNode = document.querySelector(`#chat .mes[mesid="${sess.messages.length - 1}"]`);
            if (prevLastNode) prevLastNode.classList.add('last_mes');
          }
          throw genErr;
        }
        if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }

        botMsg.mes = result.content;
        botMsg.swipes[0] = result.content;
        botMsg.reasoning = result.reasoning || '';
        botMsg.gen_time = result.genTime;
        botMsg.token_count = estimateTokens(result.content);
        recordMessageToSwipeInfo(botMsg, 0);
        recordTavernDebugConsoleLog({
          id: currentDbgLogId,
          chatId: sess?.id || '',
          floorIdx: newFloorIdx,
          cardName: card?.name || '角色',
          apiMessages,
          rawReplyText: result.rawContent || ((result.reasoning ? `=== AI 深度思考推理 ===\n${result.reasoning}\n\n=== AI 完整回复与输出内容 ===\n` : '') + (result.content || ''))
        });
        syncTavernGeneratingUiState(false);
        await saveTavernStore();
        appendOrUpdateSingleFloorDom(newFloorIdx, { scrollToBottom: !uiRuntime.userScrolledUpDuringStream });
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_RECEIVED, newFloorIdx, genType);
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.CHARACTER_MESSAGE_RENDERED, newFloorIdx, genType);
        if (tavernState.formatting?.autoTranslateIncoming) {
          translateTavernFloor(newFloorIdx, true);
        }
      }
      await tavernEventSource.emit(TAVERN_EVENT_TYPES.GENERATION_ENDED, genType);
    } catch (err) {
      if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }
      syncTavernGeneratingUiState(false);
      console.error('Tavern generation error:', err);
      const errMsg = err.message || 'AI调用失败，请检查API配置';
      if (currentDbgLogId) {
        recordTavernDebugConsoleLog({
          id: currentDbgLogId,
          chatId: sess?.id || '',
          floorIdx: pendingDbgFloorIdx,
          cardName: card?.name || '角色',
          apiMessages: currentApiMessages,
          rawReplyText: '=== 生成中断或失败 ===\n' + errMsg
        });
      }
      if (String(errMsg).includes('已手动停止')) {
        showTavernToast('已暂停生成');
      } else {
        showTavernToast(errMsg);
        showTavernErrorBanner(errMsg);
      }
    } finally {
      if (nonStreamWaitTimer) { clearInterval(nonStreamWaitTimer); nonStreamWaitTimer = null; }
      uiRuntime.abortController = null;
      syncTavernGeneratingUiState(false);
    }
  }

  function refreshOpenDrawerOnly() {
    const host = document.getElementById('tavern-drawer-host');
    if (!host) return;
    const prevDrawerEl = host.querySelector('.drawer-content.openDrawer');
    const prevScrollTop = prevDrawerEl ? prevDrawerEl.scrollTop : 0;
    const prevDrawerAttr = prevDrawerEl ? prevDrawerEl.getAttribute('data-active-drawer') : null;

    if (!uiRuntime.openDrawerKey) {
      ensurePersistentExtensionContainers();
      host.classList.remove('active');
      host.innerHTML = '';
    } else {
      ensurePersistentExtensionContainers();
      host.classList.add('active');
      host.innerHTML = renderOpenDrawerHtml(uiRuntime.openDrawerKey);
      const extSlot = document.getElementById('tavern-live-ext-settings-slot');
      if (extSlot) {
        if (persistentExtSettingsEl) extSlot.appendChild(persistentExtSettingsEl);
        if (persistentExtSettings2El) extSlot.appendChild(persistentExtSettings2El);
      }
      const nextDrawerEl = host.querySelector('.drawer-content.openDrawer');
      if (nextDrawerEl && prevDrawerAttr === uiRuntime.openDrawerKey) {
        nextDrawerEl.scrollTop = prevScrollTop;
      }
    }
    const topBar = document.getElementById('top-settings-holder');
    if (topBar) {
      topBar.querySelectorAll('.drawer').forEach(el => {
        const k = el.getAttribute('data-drawer-key');
        const icon = el.querySelector('.drawer-icon');
        if (k === uiRuntime.openDrawerKey) {
          el.classList.add('active-drawer');
          if (icon) {
            icon.classList.add('openIcon');
            icon.classList.remove('closedIcon');
          }
        } else {
          el.classList.remove('active-drawer');
          if (icon) {
            icon.classList.remove('openIcon');
            icon.classList.add('closedIcon');
          }
        }
      });
    }
  }

  function bindTavernStageEvents() {
    const root = document.getElementById('tavern-stage-root');
    if (!root || root._tavernBound) return;
    root._tavernBound = true;

    const chatEl = document.getElementById('chat');
    if (chatEl && !chatEl._tavernScrollBound) {
      chatEl._tavernScrollBound = true;
      const checkUserScrollState = () => {
        if (!uiRuntime.isGenerating) return;
        const distFromBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight;
        if (distFromBottom > 85) {
          uiRuntime.userScrolledUpDuringStream = true;
        } else if (distFromBottom <= 36) {
          uiRuntime.userScrolledUpDuringStream = false;
        }
      };
      chatEl.addEventListener('wheel', e => {
        if (e.deltaY < 0 && uiRuntime.isGenerating) {
          uiRuntime.userScrolledUpDuringStream = true;
        }
        checkUserScrollState();
      }, { passive: true });
      chatEl.addEventListener('touchmove', () => {
        checkUserScrollState();
      }, { passive: true });
      chatEl.addEventListener('scroll', () => {
        checkUserScrollState();
      }, { passive: true });
    }

    if (!document._tavernOutsidePopupBound) {
      document._tavernOutsidePopupBound = true;
      document.addEventListener('pointerdown', e => {
        if (!uiRuntime.showOptionsPopup && !uiRuntime.showExtensionsPopup) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('#options') || t.closest('#extensionsMenu') || t.closest('#options_button') || t.closest('#extensionsMenuButton')) {
          return;
        }
        uiRuntime.showOptionsPopup = false;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
      }, true);
    }

    root.addEventListener('selectstart', e => {
      const t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
      const tag = (t && t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (t && t.isContentEditable)) {
        return;
      }
      if (isTextSelectionPluginEnabled() && t && t.closest && t.closest('.mes_text, .be-quote')) {
        return;
      }
      e.preventDefault();
    });

    if (!document._tavernBookExcerptTouchBound) {
      document._tavernBookExcerptTouchBound = true;

      const getCaretPoint = (doc, x, y) => {
        try {
          if (typeof doc.caretRangeFromPoint === 'function') {
            const r = doc.caretRangeFromPoint(x, y);
            if (r && r.startContainer) return { node: r.startContainer, offset: r.startOffset };
          }
          if (typeof doc.caretPositionFromPoint === 'function') {
            const p = doc.caretPositionFromPoint(x, y);
            if (p && p.offsetNode) return { node: p.offsetNode, offset: p.offset };
          }
        } catch (_) {}
        return null;
      };

      const buildClauseRangeAtCaret = (doc, caret) => {
        if (!caret || !caret.node) return null;
        let textNode = caret.node;
        let offset = caret.offset || 0;
        if (textNode.nodeType !== 3) {
          const walker = doc.createTreeWalker(textNode, NodeFilter.SHOW_TEXT, null);
          const firstTxt = walker.nextNode();
          if (!firstTxt) return null;
          textNode = firstTxt;
          offset = 0;
        }
        const raw = textNode.nodeValue || '';
        if (!raw.trim()) return null;
        const stopRx = /[，。！？；：、“”‘’「」『』【】《》\r\n]/;
        let s = Math.max(0, Math.min(offset, raw.length - 1));
        let e = s;
        while (s > 0 && !stopRx.test(raw[s - 1]) && (offset - s) < 18) s--;
        while (e < raw.length && !stopRx.test(raw[e]) && (e - offset) < 18) e++;
        if (e <= s) {
          s = Math.max(0, offset - 2);
          e = Math.min(raw.length, offset + 4);
        }
        if (e <= s) return null;
        const range = doc.createRange();
        range.setStart(textNode, s);
        range.setEnd(textNode, e);
        return range;
      };

      const notifyBookExcerptSelection = (doc) => {
        try {
          doc.dispatchEvent(new Event('selectionchange', { bubbles: true }));
          doc.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        } catch (_) {}
      };

      // Suppress native browser long-press context menu while preserving or creating selection for BookExcerpt
      document.addEventListener('contextmenu', e => {
        const t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
        if (!t || !t.closest) return;
        if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
        const inTavernOrBe = t.closest('#tavern-stage-root, #be-mask, #be-panel, #be-float-bar, #be-hl-bar, #be-card-hl-bar');
        if (!inTavernOrBe) return;
        e.preventDefault();
        e.stopPropagation();
        if (isTextSelectionPluginEnabled() && t.closest('.mes_text, .be-quote')) {
          const sel = window.getSelection ? window.getSelection() : null;
          if (sel && sel.isCollapsed && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
            const caret = getCaretPoint(document, e.clientX, e.clientY);
            const clauseRange = buildClauseRangeAtCaret(document, caret);
            if (clauseRange) {
              try {
                sel.removeAllRanges();
                sel.addRange(clauseRange);
                notifyBookExcerptSelection(document);
              } catch (_) {}
            }
          } else if (sel && !sel.isCollapsed) {
            notifyBookExcerptSelection(document);
          }
          return;
        }
        try {
          if (window.getSelection) window.getSelection().removeAllRanges();
        } catch (_) {}
      }, true);

      // Long-press + slide finger selection inside .mes_text and .be-quote so long-pressing always pops up BookExcerpt without the browser native menu
      let lpTimer = null;
      let lpActive = false;
      let lpStartCaret = null;
      let lpStartX = 0;
      let lpStartY = 0;

      const clearLpTimer = () => {
        if (lpTimer) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
      };

      document.addEventListener('touchstart', e => {
        clearLpTimer();
        lpActive = false;
        lpStartCaret = null;
        if (!isTextSelectionPluginEnabled()) return;
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
        if (!t || !t.closest) return;
        if (t.closest('button, input, textarea, select, a, summary, #be-float-bar, #be-hl-bar, #be-card-hl-bar, #be-card-hl-pop, .be-highlight, .mes_buttons, .extraMesButtons')) {
          return;
        }
        const selectableHost = t.closest('#tavern-stage-root .mes_text, .be-quote');
        if (!selectableHost) return;
        lpStartX = e.touches[0].clientX;
        lpStartY = e.touches[0].clientY;
        lpTimer = setTimeout(() => {
          lpTimer = null;
          const sel = window.getSelection ? window.getSelection() : null;
          if (sel && !sel.isCollapsed) {
            lpActive = true;
            notifyBookExcerptSelection(document);
            return;
          }
          const caret = getCaretPoint(document, lpStartX, lpStartY);
          if (!caret) return;
          lpStartCaret = caret;
          lpActive = true;
          const clauseRange = buildClauseRangeAtCaret(document, caret);
          if (clauseRange && sel) {
            try {
              sel.removeAllRanges();
              sel.addRange(clauseRange);
              notifyBookExcerptSelection(document);
            } catch (_) {}
          }
        }, 380);
      }, { passive: true });

      document.addEventListener('touchmove', e => {
        if (!e.touches || e.touches.length !== 1) {
          clearLpTimer();
          return;
        }
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        if (lpTimer) {
          if (Math.abs(curX - lpStartX) > 10 || Math.abs(curY - lpStartY) > 10) {
            clearLpTimer();
          }
          return;
        }
        if (lpActive && lpStartCaret) {
          const endCaret = getCaretPoint(document, curX, curY);
          if (endCaret && endCaret.node) {
            try {
              const dragRange = document.createRange();
              const cmp = lpStartCaret.node === endCaret.node
                ? (lpStartCaret.offset - endCaret.offset)
                : (lpStartCaret.node.compareDocumentPosition(endCaret.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
              if (cmp <= 0) {
                dragRange.setStart(lpStartCaret.node, lpStartCaret.offset);
                dragRange.setEnd(endCaret.node, endCaret.offset);
              } else {
                dragRange.setStart(endCaret.node, endCaret.offset);
                dragRange.setEnd(lpStartCaret.node, lpStartCaret.offset);
              }
              if (!dragRange.collapsed) {
                if (e.cancelable) e.preventDefault();
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(dragRange);
                notifyBookExcerptSelection(document);
              }
            } catch (_) {}
          }
        }
      }, { passive: false });

      const finishLpTouch = () => {
        clearLpTimer();
        if (lpActive) {
          lpActive = false;
          lpStartCaret = null;
          setTimeout(() => notifyBookExcerptSelection(document), 30);
        }
      };
      document.addEventListener('touchend', finishLpTouch, { passive: true });
      document.addEventListener('touchcancel', finishLpTouch, { passive: true });
    }

    root.addEventListener('click', async e => {
      const anchorLink = e.target.closest('a[href="#"]');
      if (anchorLink) {
        e.preventDefault();
      }
      const extMenuChild = e.target.closest('#extensionsMenu > *');
      if (extMenuChild && !e.target.closest('[data-action]')) {
        uiRuntime.showExtensionsPopup = false;
        uiRuntime.showOptionsPopup = false;
        refreshBottomPopupsOnly();
        syncBaiBaiShadowDomCss();
      }

      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) {
        if (uiRuntime.showOptionsPopup || uiRuntime.showExtensionsPopup) {
          const inPopup = e.target.closest('.tavern-bottom-popup');
          if (!inPopup) {
            uiRuntime.showOptionsPopup = false;
            uiRuntime.showExtensionsPopup = false;
            refreshBottomPopupsOnly();
          }
        }
        return;
      }
      const action = actionEl.getAttribute('data-action');

      if (action === 'toggle-drawer') {
        const key = actionEl.getAttribute('data-drawer');
        uiRuntime.showOptionsPopup = false;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        uiRuntime.openDrawerKey = uiRuntime.openDrawerKey === key ? null : key;
        if (uiRuntime.openDrawerKey && typeof window.pushMobileBackGuard === 'function') {
          window.pushMobileBackGuard('tavern_drawer_' + uiRuntime.openDrawerKey);
        }
        refreshOpenDrawerOnly();
        return;
      }

      if (action === 'open-drawer-direct') {
        const key = actionEl.getAttribute('data-drawer');
        uiRuntime.showOptionsPopup = false;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        uiRuntime.openDrawerKey = key;
        if (key && typeof window.pushMobileBackGuard === 'function') {
          window.pushMobileBackGuard('tavern_drawer_' + key);
        }
        refreshOpenDrawerOnly();
        return;
      }

      if (action === 'close-drawer') {
        uiRuntime.openDrawerKey = null;
        refreshOpenDrawerOnly();
        return;
      }

      if (action === 'exit-tavern-home') {
        if (typeof window.exitTavernToHome === 'function') {
          window.exitTavernToHome();
        }
        return;
      }

      if (action === 'load-more-chat-floors') {
        const chatEl = document.getElementById('chat');
        const oldScrollHeight = chatEl ? chatEl.scrollHeight : 0;
        const oldScrollTop = chatEl ? chatEl.scrollTop : 0;
        uiRuntime.visibleFloorCount = (Number(uiRuntime.visibleFloorCount) || 30) + 30;
        renderTavernChatFloors(false);
        if (chatEl) {
          const newScrollHeight = chatEl.scrollHeight;
          chatEl.scrollTop = Math.max(0, oldScrollTop + (newScrollHeight - oldScrollHeight));
        }
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.MORE_MESSAGES_LOADED);
        return;
      }

      if (action === 'load-all-chat-floors') {
        const chatEl = document.getElementById('chat');
        const oldScrollHeight = chatEl ? chatEl.scrollHeight : 0;
        const oldScrollTop = chatEl ? chatEl.scrollTop : 0;
        const sess = getActiveChatSession();
        uiRuntime.visibleFloorCount = Math.max(999999, (sess && Array.isArray(sess.messages)) ? sess.messages.length : 999999);
        renderTavernChatFloors(false);
        if (chatEl) {
          const newScrollHeight = chatEl.scrollHeight;
          chatEl.scrollTop = Math.max(0, oldScrollTop + (newScrollHeight - oldScrollHeight));
        }
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.MORE_MESSAGES_LOADED);
        return;
      }

      if (action === 'open-helper-script') {
        const sid = actionEl.getAttribute('data-script-id');
        uiRuntime.showExtensionsPopup = false;
        uiRuntime.showOptionsPopup = false;
        uiRuntime.openDrawerKey = null;
        refreshBottomPopupsOnly();
        refreshOpenDrawerOnly();
        const card = getActiveCard();
        const hs = (card && Array.isArray(card.helperScripts)) ? card.helperScripts.find(s => s.id === sid) || card.helperScripts[0] : null;
        if (hs) {
          executeCardHelperScripts(card);
          const gourmetBall = document.getElementById('gourmet-fixed-ball-ui');
          const gourmetPanel = document.getElementById('gourmet-fixed-panel-ui');
          if (gourmetBall || gourmetPanel) {
            if (gourmetBall && getComputedStyle(gourmetBall).display === 'none') {
              gourmetBall.style.display = 'flex';
            }
            if (gourmetPanel) {
              const isHidden = gourmetPanel.style.display === 'none' || getComputedStyle(gourmetPanel).display === 'none';
              if (isHidden && gourmetBall) {
                gourmetBall.dispatchEvent(new Event('touchend', { bubbles: true, cancelable: true }));
                if (getComputedStyle(gourmetPanel).display === 'none') {
                  gourmetPanel.style.display = 'flex';
                }
              } else {
                gourmetPanel.style.display = isHidden ? 'flex' : 'none';
              }
            }
            return;
          }
        }
        uiRuntime.activeHelperScriptId = sid;
        uiRuntime.activePluginModalId = null;
        renderTavernShell();
        return;
      }

      if (action === 'close-helper-script') {
        uiRuntime.activeHelperScriptId = null;
        const modalEl = document.querySelector('#tavern-stage-root > .tavern-modal-backdrop');
        if (modalEl) {
          modalEl.querySelectorAll('audio, video').forEach(m => { try { m.pause(); } catch (_) {} });
          modalEl.remove();
        } else {
          renderTavernShell();
        }
        return;
      }

      if (action === 'open-plugin-modal') {
        const pid = actionEl.getAttribute('data-plugin-id');
        const p = (tavernState.plugins || []).find(x => x.id === pid);
        uiRuntime.showExtensionsPopup = false;
        uiRuntime.showOptionsPopup = false;
        uiRuntime.openDrawerKey = null;
        refreshBottomPopupsOnly();
        refreshOpenDrawerOnly();
        if (p && p.enabled) {
          executeUserPluginScript(p);
        }
        if (isBaiBaiImagePlugin(p)) {
          await syncBaiBaiShadowDomCss();
          const bbiMenu = document.getElementById('bbi-menu-item') || document.getElementById('bbi-topbar-button');
          if (bbiMenu) {
            bbiMenu.click();
            return;
          }
        }
        if (isBaiBaiBookPlugin(p)) {
          await syncBaiBaiShadowDomCss();
          const bbsMenu = document.getElementById('bbs-menu-item') || document.getElementById('bbs-topbar-button') || document.getElementById('bbs-qr-button');
          if (bbsMenu) {
            bbsMenu.click();
            return;
          }
        }
        if (isBookExcerptPlugin(p)) {
          const beMenu = document.getElementById('be-menu-entry');
          if (beMenu) {
            beMenu.click();
            return;
          }
          if (window.BookExcerpt && typeof window.BookExcerpt.openNotebook === 'function') {
            window.BookExcerpt.openNotebook();
            return;
          }
        }
        if (isBurntChickenWingsPlugin(p)) {
          if (window.__presetAtelier && typeof window.__presetAtelier.open === 'function') {
            window.__presetAtelier.open();
            return;
          }
          const paMenu = document.getElementById('pa-menu-entry') || document.getElementById('pa-open-main');
          if (paMenu) {
            paMenu.click();
            return;
          }
        }
        // Universal fallback: if any third-party plugin injected a matching menu item into #extensionsMenu, click it directly
        if (p && p.name) {
          const extMenuEl = document.getElementById('extensionsMenu');
          if (extMenuEl) {
            const cleanPName = String(p.name).replace(/^ST-/i, '').trim().toLowerCase();
            const customItems = Array.from(extMenuEl.children).filter(el => !el.hasAttribute('data-action'));
            const matchedItem = customItems.find(el => {
              const txt = String(el.textContent || '').trim().toLowerCase();
              return txt && (txt.includes(cleanPName) || cleanPName.includes(txt));
            });
            if (matchedItem) {
              matchedItem.click();
              return;
            }
          }
        }
        if (typeof window.pushMobileBackGuard === 'function') {
          window.pushMobileBackGuard('tavern_plugin_modal');
        }
        uiRuntime.activePluginModalId = pid;
        uiRuntime.activeHelperScriptId = null;
        renderTavernShell();
        return;
      }

      if (action === 'trigger-plugin-btn') {
        const btnName = actionEl.getAttribute('data-btn-name');
        if (btnName) {
          await tavernEventSource.emit(btnName);
          showTavernToast('已触发插件动作: ' + btnName);
        }
        return;
      }

      if (action === 'popup-translate-last') {
        uiRuntime.showOptionsPopup = false;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        const sess = getActiveChatSession();
        if (sess && sess.messages.length > 0) {
          await translateTavernFloor(sess.messages.length - 1, false);
        }
        return;
      }

      if (action === 'popup-translate-input') {
        uiRuntime.showOptionsPopup = false;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        const textarea = document.getElementById('send_textarea');
        const raw = textarea ? textarea.value.trim() : '';
        if (!raw) {
          showTavernToast('请先在底部输入框填写需要转换的文字');
          return;
        }
        try {
          showTavernToast('正在使用免费翻译引擎转换输入草稿...');
          const targetLang = tavernState.formatting?.translateTargetLang || '简体中文';
          const out = await translateTextFreeWeb(raw, targetLang);
          if (out && textarea) {
            textarea.value = out;
            showTavernToast('输入框文字已翻译完成');
          }
        } catch (err) {
          showTavernToast('草稿翻译失败: ' + (err.message || '网络异常'));
        }
        return;
      }

      if (action === 'close-plugin-modal') {
        uiRuntime.activePluginModalId = null;
        const modalEl = document.querySelector('#tavern-stage-root > .tavern-modal-backdrop');
        if (modalEl) {
          modalEl.querySelectorAll('audio, video').forEach(m => { try { m.pause(); } catch (_) {} });
          modalEl.remove();
        } else {
          renderTavernShell();
        }
        return;
      }

      if (action === 'rerun-plugin-item') {
        const pid = actionEl.getAttribute('data-plugin-id');
        const p = (tavernState.plugins || []).find(x => x.id === pid);
        if (p) {
          p.enabled = true;
          if (isBaiBaiBookPlugin(p)) {
            try { document.getElementById('bbs-app-host')?.remove(); } catch (_) {}
            try { document.getElementById('bbs-menu-item')?.remove(); } catch (_) {}
          }
          if (isBaiBaiImagePlugin(p)) {
            try { document.getElementById('bbi-app-host')?.remove(); } catch (_) {}
            try { document.getElementById('bbi-menu-item')?.remove(); } catch (_) {}
          }
          if (isBurntChickenWingsPlugin(p)) {
            try { window.__presetAtelier?.destroy?.(); } catch (_) {}
          }
          executeUserPluginScript(p);
          await saveTavernStore();
          refreshOpenDrawerOnly();
          showTavernToast('已重新加载并执行插件: ' + p.name);
        }
        return;
      }

      if (action === 'wand-generate-image') {
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        const sess = getActiveChatSession();
        const lastMsg = sess && sess.messages && sess.messages[sess.messages.length - 1];
        if (!lastMsg) {
          showTavernToast('暂无对话内容可供生成插图');
          return;
        }
        try {
          showTavernToast('正在提炼当前画面提示词...');
          const promptRes = await callTavernAiCompletion([
            { role: 'system', content: '请将用户提供的最新剧情片段转化为一段精炼的动漫插画画面描述提示词，包含人物外貌、动作、光影与背景环境，只输出英文Tag提示词，逗号分隔。' },
            { role: 'user', content: String(lastMsg.mes || '').slice(-800) }
          ]);
          const tags = String(promptRes.content || 'masterpiece, best quality, anime style').trim();
          if (typeof window.generateNovelAiImage === 'function') {
            showTavernToast('正在调用NovelAI生成场景插图...');
            const imgUrl = await window.generateNovelAiImage(tags);
            if (imgUrl) {
              lastMsg.mes += `\n<div style="margin-top:8px;"><img src="${imgUrl}" style="max-width:100%;border-radius:12px;" /></div>`;
              if (Array.isArray(lastMsg.swipes) && lastMsg.swipes.length > 0) {
                lastMsg.swipes[lastMsg.swipe_id || 0] = lastMsg.mes;
              }
              await saveTavernStore();
              appendOrUpdateSingleFloorDom(sess.messages.length - 1);
              showTavernToast('场景插图已生成并插入当前楼层');
              return;
            }
          }
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(tags);
          }
          showTavernToast('已生成画图Tag并复制: ' + tags.slice(0, 28) + '...');
        } catch (err) {
          showTavernToast(err.message || '生成插图提示词失败');
        }
        return;
      }

      if (action === 'toggle-options-popup') {
        uiRuntime.showOptionsPopup = !uiRuntime.showOptionsPopup;
        uiRuntime.showExtensionsPopup = false;
        refreshBottomPopupsOnly();
        return;
      }

      if (action === 'toggle-extensions-popup') {
        uiRuntime.showExtensionsPopup = !uiRuntime.showExtensionsPopup;
        uiRuntime.showOptionsPopup = false;
        if (uiRuntime.showExtensionsPopup) {
          (tavernState.plugins || []).forEach(p => {
            if (p && p.enabled && !p.builtInType && isBaiBaiPlugin(p)) {
              executeUserPluginScript(p);
            }
          });
        }
        refreshBottomPopupsOnly();
        return;
      }

      if (action === 'stop-generation') {
        if (uiRuntime.abortController) {
          uiRuntime.abortController.abort();
        }
        syncTavernGeneratingUiState(false);
        await tavernEventSource.emit(TAVERN_EVENT_TYPES.GENERATION_STOPPED);
        showTavernToast('已暂停生成');
        return;
      }

      if (action === 'send-message') {
        await handleSendUserMessage();
        return;
      }

      if (action === 'run-qr') {
        const qrId = actionEl.getAttribute('data-qr-id');
        const qr = (tavernState.quickReplies || []).find(q => q.id === qrId);
        if (!qr) return;
        if (qr.message === '/continue') {
          await triggerCharacterReplyGeneration({ isContinue: true });
        } else if (qr.message === '/impersonate') {
          await triggerCharacterReplyGeneration({ isImpersonate: true });
        } else {
          const textarea = document.getElementById('send_textarea');
          if (textarea) {
            textarea.value = qr.message;
            await handleSendUserMessage();
          }
        }
        return;
      }

      // Floor Actions
      if (action === 'floor-swipe-left' || action === 'floor-swipe-right') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        const msg = sess && sess.messages[idx];
        if (!msg) return;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        if (!Array.isArray(msg.swipes) || msg.swipes.length === 0) {
          msg.swipes = [msg.mes || ''];
        }
        const cur = Number(msg.swipe_id || 0);
        recordMessageToSwipeInfo(msg, cur);
        if (action === 'floor-swipe-left') {
          msg.swipe_id = cur > 0 ? cur - 1 : msg.swipes.length - 1;
          msg.mes = msg.swipes[msg.swipe_id];
          syncSwipeInfoToMessage(msg, msg.swipe_id);
          msg.token_count = estimateTokens(msg.mes);
          await saveTavernStore();
          appendOrUpdateSingleFloorDom(idx);
          if (idx === 0 && sess.messages.length === 1) {
            const chatEl = document.getElementById('chat');
            if (chatEl) chatEl.scrollTop = 0;
          }
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SWIPED, idx);
        } else {
          if (cur < msg.swipes.length - 1) {
            msg.swipe_id = cur + 1;
            msg.mes = msg.swipes[msg.swipe_id];
            syncSwipeInfoToMessage(msg, msg.swipe_id);
            msg.token_count = estimateTokens(msg.mes);
            await saveTavernStore();
            appendOrUpdateSingleFloorDom(idx);
            if (idx === 0 && sess.messages.length === 1) {
              const chatEl = document.getElementById('chat');
              if (chatEl) chatEl.scrollTop = 0;
            }
            await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_SWIPED, idx);
          } else if (!msg.is_user && idx > 0) {
            await triggerCharacterReplyGeneration({ isSwipeRegen: true, targetMesIndex: idx });
          } else if (idx === 0) {
            msg.swipe_id = 0;
            msg.mes = msg.swipes[0];
            syncSwipeInfoToMessage(msg, 0);
            msg.token_count = estimateTokens(msg.mes);
            await saveTavernStore();
            appendOrUpdateSingleFloorDom(0);
            const chatEl = document.getElementById('chat');
            if (chatEl && sess.messages.length === 1) chatEl.scrollTop = 0;
          }
        }
        return;
      }

      if (action === 'floor-edit') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        uiRuntime.editingFloorMesId = uiRuntime.editingFloorMesId === idx ? null : idx;
        uiRuntime.editingFloorReasoning = false;
        uiRuntime.openExtraMenuMesId = null;
        appendOrUpdateSingleFloorDom(idx);
        return;
      }

      if (action === 'floor-toggle-reasoning-edit') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        uiRuntime.editingFloorReasoning = !uiRuntime.editingFloorReasoning;
        appendOrUpdateSingleFloorDom(idx);
        return;
      }

      if (action === 'floor-move-up' || action === 'floor-move-down') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        if (sess && Array.isArray(sess.messages)) {
          const targetIdx = action === 'floor-move-up' ? idx - 1 : idx + 1;
          if (targetIdx >= 0 && targetIdx < sess.messages.length) {
            const tmp = sess.messages[idx];
            sess.messages[idx] = sess.messages[targetIdx];
            sess.messages[targetIdx] = tmp;
            sess.messages.forEach((m, i) => { m.mesid = i; });
            uiRuntime.editingFloorMesId = targetIdx;
            await saveTavernStore();
            renderTavernChatFloors(false);
          }
        }
        return;
      }

      if (action === 'floor-edit-cancel') {
        const prevEditIdx = uiRuntime.editingFloorMesId;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        if (prevEditIdx !== null && prevEditIdx !== undefined) {
          appendOrUpdateSingleFloorDom(prevEditIdx);
        } else {
          renderTavernChatFloors(false);
        }
        return;
      }

      if (action === 'floor-edit-save') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const box = document.getElementById('tavern-floor-edit-box-' + idx);
        const rBox = document.getElementById('tavern-floor-reasoning-box-' + idx);
        const sess = getActiveChatSession();
        const msg = sess && sess.messages[idx];
        if (box && msg) {
          const newVal = box.value;
          if (!Array.isArray(msg.swipes) || msg.swipes.length === 0) msg.swipes = [newVal];
          const sId = Math.max(0, Number(msg.swipe_id || 0));
          msg.swipes[sId] = newVal;
          msg.mes = newVal;
          msg.token_count = estimateTokens(newVal);
          if (rBox) {
            msg.reasoning = rBox.value;
          }
          recordMessageToSwipeInfo(msg, sId);
          uiRuntime.editingFloorMesId = null;
          uiRuntime.editingFloorReasoning = false;
          await saveTavernStore();
          appendOrUpdateSingleFloorDom(idx);
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_EDITED, idx);
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.MESSAGE_UPDATED, idx);
          showTavernToast('已保存本层内容');
        }
        return;
      }

      if (action === 'floor-extra-toggle') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const nextOpenId = uiRuntime.openExtraMenuMesId === idx ? null : idx;
        uiRuntime.openExtraMenuMesId = nextOpenId;
        const chatEl = document.getElementById('chat');
        if (chatEl) {
          chatEl.querySelectorAll('.mes').forEach(mesNode => {
            const mId = Number(mesNode.getAttribute('mesid'));
            const extraBox = mesNode.querySelector('.extraMesButtons');
            if (extraBox) {
              if (mId === nextOpenId) {
                extraBox.classList.remove('tavern-extra-hidden');
              } else {
                extraBox.classList.add('tavern-extra-hidden');
              }
            }
          });
        }
        return;
      }

      if (action === 'floor-translate') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        uiRuntime.openExtraMenuMesId = null;
        await translateTavernFloor(idx, false);
        return;
      }

      if (action === 'floor-hide-translation') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        const msg = sess && sess.messages[idx];
        if (msg) {
          msg.translation = '';
          await saveTavernStore();
          appendOrUpdateSingleFloorDom(idx);
        }
        return;
      }

      if (action === 'floor-copy') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        const msg = sess && sess.messages[idx];
        if (msg && navigator.clipboard) {
          await navigator.clipboard.writeText(msg.mes || '');
          uiRuntime.openExtraMenuMesId = null;
          appendOrUpdateSingleFloorDom(idx);
          showTavernToast('已复制该楼层原文');
        }
        return;
      }

      if (action === 'floor-regen') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        uiRuntime.openExtraMenuMesId = null;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        uiRuntime.isGenerating = false;
        await triggerCharacterReplyGeneration({ isSwipeRegen: true, targetMesIndex: idx });
        return;
      }

      if (action === 'floor-add-swipe') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        const msg = sess && sess.messages[idx];
        if (msg) {
          if (!Array.isArray(msg.swipes)) msg.swipes = [msg.mes || ''];
          const prevSwipeIdx = Math.max(0, Number(msg.swipe_id || 0));
          recordMessageToSwipeInfo(msg, prevSwipeIdx);
          msg.swipes.push(msg.mes || '');
          msg.swipe_id = msg.swipes.length - 1;
          recordMessageToSwipeInfo(msg, msg.swipe_id);
          uiRuntime.openExtraMenuMesId = null;
          uiRuntime.editingFloorMesId = idx;
          await saveTavernStore();
          appendOrUpdateSingleFloorDom(idx);
        }
        return;
      }

      if (action === 'floor-fork') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const card = getActiveCard();
        const sess = getActiveChatSession();
        if (sess && card) {
          const clonedMessages = JSON.parse(JSON.stringify(sess.messages.slice(0, idx + 1)));
          const newSess = {
            cardId: card.id,
            chatId: 'chat_' + card.id + '_' + Date.now(),
            title: card.name + '分支 #' + idx + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: Date.now(),
            metadata: JSON.parse(JSON.stringify(sess.metadata || {})),
            messages: clonedMessages
          };
          if (!Array.isArray(tavernState.chatArchivesByCardId[card.id])) {
            tavernState.chatArchivesByCardId[card.id] = [];
          }
          tavernState.chatArchivesByCardId[card.id].unshift(newSess);
          tavernState.chatsByCardId[card.id] = newSess;
          uiRuntime.openExtraMenuMesId = null;
          uiRuntime.editingFloorMesId = null;
          uiRuntime.editingFloorReasoning = false;
          await saveTavernStore();
          renderTavernChatFloors(false);
          showTavernToast('已从第' + idx + '层创建新分支存档');
        }
        return;
      }

      if (action === 'floor-del-one' || action === 'floor-del-below') {
        const idx = Number(actionEl.getAttribute('data-mesid'));
        const sess = getActiveChatSession();
        if (!sess || sess.messages.length <= 1) {
          showTavernToast('至少保留开场白楼层');
          return;
        }
        const confirmed = await callGenericPopupShim('确定要删除该楼层消息吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        uiRuntime.isGenerating = false;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        if (sess && sess.messages.length > 1) {
          if (action === 'floor-del-one') {
            sess.messages.splice(idx, 1);
          } else {
            sess.messages.splice(idx);
          }
          if (sess.messages.length === 0) {
            const rebuilt = buildInitialSessionForCard(getActiveCard());
            sess.messages = rebuilt.messages;
          }
          sess.messages.forEach((m, i) => { m.mesid = i; });
          uiRuntime.openExtraMenuMesId = null;
          await saveTavernStore();
          renderTavernChatFloors(sess.messages.length <= 1);
          showTavernToast('已删除楼层');
        }
        return;
      }

      // Bottom Popup Actions
      if (action === 'chat-scroll-top') {
        uiRuntime.showOptionsPopup = false;
        refreshBottomPopupsOnly();
        const chatEl = document.getElementById('chat');
        if (chatEl) {
          chatEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (action === 'chat-scroll-bottom') {
        uiRuntime.showOptionsPopup = false;
        refreshBottomPopupsOnly();
        const chatEl = document.getElementById('chat');
        if (chatEl) {
          chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' });
        }
        return;
      }

      if (action === 'chat-new-session') {
        const card = getActiveCard();
        const newSess = buildInitialSessionForCard(card);
        if (!Array.isArray(tavernState.chatArchivesByCardId[card.id])) {
          tavernState.chatArchivesByCardId[card.id] = [];
        }
        tavernState.chatArchivesByCardId[card.id].unshift(newSess);
        tavernState.chatsByCardId[card.id] = newSess;
        uiRuntime.showOptionsPopup = false;
        uiRuntime.isGenerating = false;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        await saveTavernStore();
        renderTavernShell();
        showTavernToast('已开启新对话存档');
        return;
      }

      if (action === 'chat-regenerate-last') {
        uiRuntime.showOptionsPopup = false;
        uiRuntime.isGenerating = false;
        uiRuntime.editingFloorMesId = null;
        uiRuntime.editingFloorReasoning = false;
        const sess = getActiveChatSession();
        if (sess && sess.messages.length > 0) {
          const lastIdx = sess.messages.length - 1;
          await triggerCharacterReplyGeneration({ isSwipeRegen: true, targetMesIndex: lastIdx });
        }
        return;
      }

      if (action === 'chat-continue-last') {
        uiRuntime.showOptionsPopup = false;
        await triggerCharacterReplyGeneration({ isContinue: true });
        return;
      }

      if (action === 'chat-impersonate') {
        uiRuntime.showOptionsPopup = false;
        await triggerCharacterReplyGeneration({ isImpersonate: true });
        return;
      }

      if (action === 'reroll-d100-pool') {
        const pool = syncBuiltInD100Pool(false);
        await saveTavernStore();
        if (uiRuntime.openDrawerKey === 'cubes') refreshOpenDrawerOnly();
        else if (uiRuntime.showExtensionsPopup) renderTavernShell();
        showTavernToast('已重掷16枚D100: ' + (pool ? pool.slice(0, 5).join(', ') + '...' : '未开启'));
        return;
      }

      if (action === 'run-memory-summary-now') {
        uiRuntime.showExtensionsPopup = false;
        showTavernToast('正在提炼剧情记忆摘要...');
        try {
          await generateMemorySummaryFromChat();
          if (uiRuntime.openDrawerKey === 'cubes') refreshOpenDrawerOnly();
          showTavernToast('剧情记忆摘要已更新');
        } catch (err) {
          showTavernToast(err.message || '总结失败');
        }
        return;
      }

      // Drawer 1 (Sliders & Prompt Order) Actions
      if (action === 'toggle-adv-samplers') {
        uiRuntime.showAdvancedSamplers = !uiRuntime.showAdvancedSamplers;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'trigger-import-presets') {
        document.getElementById('tavern-file-presets')?.click();
        return;
      }
      if (action === 'save-as-new-openai-preset') {
        const cur = getActivePreset();
        const rawName = document.getElementById('tavern-openai-preset-name-input')?.value?.trim() || (cur.name + ' 副本');
        const cloned = JSON.parse(JSON.stringify(cur));
        cloned.id = 'preset_' + Date.now();
        cloned.name = rawName;
        tavernState.presets.unshift(cloned);
        tavernState.activePresetId = cloned.id;
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast('已另存为新预设: ' + rawName);
        return;
      }
      if (action === 'export-active-preset') {
        const p = getActivePreset();
        const nameInput = document.getElementById('tavern-openai-preset-name-input')?.value?.trim();
        if (nameInput) p.name = nameInput;
        downloadJsonFile((p.name || 'preset') + '.json', p);
        return;
      }
      if (action === 'delete-active-preset') {
        if (tavernState.presets.length <= 1) {
          showTavernToast('至少保留一个预设');
          return;
        }
        const confirmed = await callGenericPopupShim('确定要删除当前选中的预设吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        tavernState.presets = tavernState.presets.filter(p => p.id !== tavernState.activePresetId);
        tavernState.activePresetId = tavernState.presets[0].id;
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'toggle-prompt-item') {
        const pid = actionEl.getAttribute('data-prompt-id');
        const preset = getActivePreset();
        const item = (preset.prompts || []).find(p => p.identifier === pid);
        if (item) {
          item.enabled = actionEl.checked;
          await saveTavernStore();
        }
        return;
      }
      if (action === 'move-prompt-up' || action === 'move-prompt-down') {
        const idx = Number(actionEl.getAttribute('data-idx'));
        const preset = getActivePreset();
        const list = preset.prompts || [];
        const swapIdx = action === 'move-prompt-up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < list.length) {
          const tmp = list[idx];
          list[idx] = list[swapIdx];
          list[swapIdx] = tmp;
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'edit-prompt-item') {
        const clickedId = actionEl.getAttribute('data-prompt-id');
        uiRuntime.editingPromptId = uiRuntime.editingPromptId === clickedId ? null : clickedId;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'close-prompt-item-editor') {
        uiRuntime.editingPromptId = null;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'save-prompt-item-editor') {
        const pid = actionEl.getAttribute('data-prompt-id');
        const preset = getActivePreset();
        const item = (preset.prompts || []).find(p => p.identifier === pid);
        if (item) {
          item.name = document.getElementById('edit-prompt-name')?.value || item.name;
          item.role = document.getElementById('edit-prompt-role')?.value || 'system';
          item.injection_position = Number(document.getElementById('edit-prompt-pos')?.value || 0);
          item.injection_depth = Number(document.getElementById('edit-prompt-depth')?.value || 4);
          item.content = document.getElementById('edit-prompt-content')?.value || '';
          uiRuntime.editingPromptId = null;
          await saveTavernStore();
          refreshOpenDrawerOnly();
          showTavernToast('已保存提示词条目');
        }
        return;
      }
      if (action === 'add-custom-prompt-item') {
        const preset = getActivePreset();
        const newId = 'custom_' + Date.now();
        preset.prompts.push({
          identifier: newId,
          name: '自定义提示词块',
          enabled: true,
          role: 'system',
          content: '',
          marker: false,
          injection_position: 1,
          injection_depth: 4,
          injection_order: 100
        });
        uiRuntime.editingPromptId = newId;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }

      // Drawer 2 (Plug API & Built-in API Presets) Actions
      if (action === 'save-stream-speed') {
        const speedInput = document.getElementById('tavern-stream-speed-input');
        const nextSpeed = Math.max(0, Number(speedInput ? speedInput.value : (tavernState.uiSettings?.streamSpeed ?? 0)) || 0);
        tavernState.uiSettings.streamSpeed = nextSpeed;
        tavernState.uiSettings.streamSpeedUserSaved = true;
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast('流式速度已保存为 ' + nextSpeed);
        return;
      }
      if (action === 'save-tavern-api-config') {
        const urlVal = document.getElementById('tavern-api-url-input')?.value?.trim() || '';
        const keyVal = document.getElementById('tavern-api-key-input')?.value?.trim() || '';
        const modVal = document.getElementById('tavern-api-model-input')?.value?.trim() || '';
        const presetNameVal = document.getElementById('tavern-api-preset-name-input')?.value?.trim() || '';
        tavernState.apiConfig.customUrl = urlVal;
        tavernState.apiConfig.customKey = keyVal;
        tavernState.apiConfig.customModel = modVal;
        if (urlVal && modVal) {
          tavernState.apiConfig.useExternalPhoneApi = false;
        }
        if (tavernState.apiConfig.activeSavedPresetId && Array.isArray(tavernState.apiConfig.savedPresets)) {
          const sp = tavernState.apiConfig.savedPresets.find(x => x.id === tavernState.apiConfig.activeSavedPresetId);
          if (sp) {
            if (presetNameVal) sp.name = presetNameVal;
            sp.url = urlVal;
            sp.key = keyVal;
            sp.model = modVal;
          }
        } else if (presetNameVal && urlVal) {
          if (!Array.isArray(tavernState.apiConfig.savedPresets)) {
            tavernState.apiConfig.savedPresets = [];
          }
          const newPreset = {
            id: 'apipreset_' + Date.now(),
            name: presetNameVal,
            url: urlVal,
            key: keyVal,
            model: modVal
          };
          tavernState.apiConfig.savedPresets.unshift(newPreset);
          tavernState.apiConfig.activeSavedPresetId = newPreset.id;
        }
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast('接口配置已保存并立即生效');
        return;
      }
      if (action === 'save-as-builtin-api-preset') {
        const nameVal = document.getElementById('tavern-api-preset-name-input')?.value?.trim() || ('内置预设 ' + ((tavernState.apiConfig.savedPresets?.length || 0) + 1));
        const urlVal = document.getElementById('tavern-api-url-input')?.value?.trim() || '';
        const keyVal = document.getElementById('tavern-api-key-input')?.value?.trim() || '';
        const modVal = document.getElementById('tavern-api-model-input')?.value?.trim() || '';
        if (!Array.isArray(tavernState.apiConfig.savedPresets)) {
          tavernState.apiConfig.savedPresets = [];
        }
        const existingIdx = tavernState.apiConfig.savedPresets.findIndex(x => x.name === nameVal);
        let savedId = '';
        if (existingIdx >= 0) {
          tavernState.apiConfig.savedPresets[existingIdx].url = urlVal;
          tavernState.apiConfig.savedPresets[existingIdx].key = keyVal;
          tavernState.apiConfig.savedPresets[existingIdx].model = modVal;
          savedId = tavernState.apiConfig.savedPresets[existingIdx].id;
        } else {
          const newPreset = {
            id: 'apipreset_' + Date.now(),
            name: nameVal,
            url: urlVal,
            key: keyVal,
            model: modVal
          };
          tavernState.apiConfig.savedPresets.unshift(newPreset);
          savedId = newPreset.id;
        }
        tavernState.apiConfig.activeSavedPresetId = savedId;
        tavernState.apiConfig.customUrl = urlVal;
        tavernState.apiConfig.customKey = keyVal;
        tavernState.apiConfig.customModel = modVal;
        tavernState.apiConfig.useExternalPhoneApi = false;
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast('已保存并切换至内置API预设: ' + nameVal);
        return;
      }
      if (action === 'delete-builtin-api-preset') {
        const curId = tavernState.apiConfig.activeSavedPresetId;
        if (!curId) {
          showTavernToast('请先在下拉框中选择要删除的内置预设');
          return;
        }
        const confirmed = await callGenericPopupShim('确定要删除该内置API预设吗？', 2);
        if (!confirmed) return;
        tavernState.apiConfig.savedPresets = (tavernState.apiConfig.savedPresets || []).filter(x => x.id !== curId);
        tavernState.apiConfig.activeSavedPresetId = '';
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast('已删除该内置API预设');
        return;
      }
      if (action === 'sync-and-test-external-api') {
        tavernState.apiConfig.useExternalPhoneApi = true;
        tavernState.apiConfig.activeSavedPresetId = '';
        tavernState.apiConfig.customUrl = '';
        tavernState.apiConfig.customKey = '';
        tavernState.apiConfig.customModel = '';
        buildSillyTavernContextObject();
        const creds = resolveTavernApiCredentials();
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        if (!creds.baseUrl || !creds.apiKey) {
          showTavernToast('未在手机外部设置中检测到API地址或密钥，请先在外部API设置中保存');
          return;
        }
        try {
          showTavernToast('已同步外部API · ' + creds.model + '，正在测试连接...');
          const res = await callTavernAiCompletion([{ role: 'user', content: '请回复OK两个字母' }]);
          showTavernToast('外部API调用成功: ' + (res.content || 'OK').slice(0, 20));
        } catch (err) {
          showTavernToast('外部API已同步，但连接测试报错: ' + (err.message || '连接失败'));
        }
        return;
      }
      if (action === 'fetch-tavern-models') {
        const inputUrl = document.getElementById('tavern-api-url-input')?.value?.trim() || '';
        const inputKey = document.getElementById('tavern-api-key-input')?.value?.trim() || '';
        const curResolved = resolveTavernApiCredentials();
        if (inputUrl && inputKey) {
          if (normalizeTavernBaseUrl(inputUrl) !== normalizeTavernBaseUrl(curResolved.baseUrl) || cleanTavernApiKeyString(inputKey) !== cleanTavernApiKeyString(curResolved.apiKey)) {
            tavernState.apiConfig.customUrl = inputUrl;
            tavernState.apiConfig.customKey = inputKey;
            tavernState.apiConfig.useExternalPhoneApi = false;
          }
        }
        try {
          showTavernToast('正在拉取模型列表...');
          const list = await fetchTavernModelList(inputUrl, inputKey);
          tavernState.apiConfig.availableModels = list;
          if (list.length > 0 && !tavernState.apiConfig.customModel) {
            tavernState.apiConfig.customModel = list[0];
          }
          await saveTavernStore();
          refreshOpenDrawerOnly();
          showTavernToast('已拉取 ' + list.length + ' 个可用模型');
        } catch (err) {
          showTavernToast(err.message || '拉取模型失败');
        }
        return;
      }
      if (action === 'test-tavern-api') {
        const inputUrl = document.getElementById('tavern-api-url-input')?.value?.trim() || '';
        const inputKey = document.getElementById('tavern-api-key-input')?.value?.trim() || '';
        const inputMod = document.getElementById('tavern-api-model-input')?.value?.trim() || '';
        const curResolved = resolveTavernApiCredentials();
        if (inputUrl && inputKey) {
          if (normalizeTavernBaseUrl(inputUrl) !== normalizeTavernBaseUrl(curResolved.baseUrl) || cleanTavernApiKeyString(inputKey) !== cleanTavernApiKeyString(curResolved.apiKey)) {
            tavernState.apiConfig.customUrl = inputUrl;
            tavernState.apiConfig.customKey = inputKey;
            if (inputMod) tavernState.apiConfig.customModel = inputMod;
            tavernState.apiConfig.useExternalPhoneApi = false;
          } else if (inputMod && inputMod !== curResolved.model) {
            tavernState.apiConfig.customModel = inputMod;
          }
          await saveTavernStore();
        }
        try {
          showTavernToast('正在测试API连接...');
          const res = await callTavernAiCompletion([{ role: 'user', content: '请回复OK两个字母' }]);
          showTavernToast('连接成功: ' + (res.content || 'OK').slice(0, 20));
        } catch (err) {
          showTavernToast(err.message || '连接测试失败');
        }
        return;
      }

      // Drawer 3 (Font & Formatting) Actions
      if (action === 'cot-add-pair') {
        const pairs = getActiveReasoningTagPairs();
        pairs.push({ start: '<think>', end: '</think>' });
        if (pairs[0]) {
          tavernState.formatting.reasoningStartTag = pairs[0].start || '<think>';
          tavernState.formatting.reasoningEndTag = pairs[0].end || '</think>';
        }
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'cot-del-pair') {
        const idx = Number(actionEl.getAttribute('data-cot-pair-idx'));
        const pairs = getActiveReasoningTagPairs();
        if (pairs.length > 1 && idx >= 0 && idx < pairs.length) {
          pairs.splice(idx, 1);
          if (pairs[0]) {
            tavernState.formatting.reasoningStartTag = pairs[0].start || '<think>';
            tavernState.formatting.reasoningEndTag = pairs[0].end || '</think>';
          }
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
        }
        return;
      }
      if (action === 'save-formatting-settings') {
        const stopStr = document.getElementById('tavern-stop-strings-input')?.value || '';
        tavernState.formatting.customStoppingStrings = stopStr.split(',').map(s => s.trim()).filter(Boolean);
        const pairs = getActiveReasoningTagPairs();
        document.querySelectorAll('[data-cot-pair-idx]').forEach(inp => {
          if (inp.tagName !== 'INPUT') return;
          const pIdx = Number(inp.getAttribute('data-cot-pair-idx'));
          const pField = inp.getAttribute('data-cot-pair-field');
          if (pairs[pIdx] && (pField === 'start' || pField === 'end')) {
            pairs[pIdx][pField] = inp.value;
          }
        });
        if (pairs[0]) {
          tavernState.formatting.reasoningStartTag = pairs[0].start || '<think>';
          tavernState.formatting.reasoningEndTag = pairs[0].end || '</think>';
        }
        await saveTavernStore();
        renderTavernChatFloors(false);
        showTavernToast('文本格式化设置已保存');
        return;
      }

      // Drawer 4 (World Books) Actions
      if (action === 'trigger-import-worldbooks') {
        document.getElementById('tavern-file-worldbooks')?.click();
        return;
      }
      if (action === 'create-new-worldbook') {
        const wb = {
          id: 'wb_' + Date.now(),
          name: '新建世界书 ' + ((tavernState.worldBooks?.length || 0) + 1),
          enabled: true,
          scanDepth: 4,
          tokenBudget: 4096,
          recursiveScanning: true,
          entries: []
        };
        tavernState.worldBooks.unshift(wb);
        uiRuntime.activeWorldBookEditId = wb.id;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'toggle-worldbook-enabled') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb) {
          wb.enabled = actionEl.checked;
          await saveTavernStore();
        }
        return;
      }
      if (action === 'select-worldbook-edit') {
        uiRuntime.activeWorldBookEditId = actionEl.getAttribute('data-wb-id');
        uiRuntime.editingWorldEntryUid = null;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'export-worldbook') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb) downloadJsonFile((wb.name || 'worldbook') + '.json', wb);
        return;
      }
      if (action === 'delete-worldbook') {
        const confirmed = await callGenericPopupShim('确定要删除该世界书吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        const wbId = actionEl.getAttribute('data-wb-id');
        tavernState.worldBooks = (tavernState.worldBooks || []).filter(b => b.id !== wbId);
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'wb-add-entry') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb) {
          const newUid = Date.now();
          const entry = normalizeSingleWorldEntry({ uid: newUid, comment: '新词条', keys: [], content: '' }, wb.entries.length);
          wb.entries.unshift(entry);
          uiRuntime.editingWorldEntryUid = newUid;
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'wb-batch-enable' || action === 'wb-batch-constant' || action === 'wb-batch-green') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb && Array.isArray(wb.entries)) {
          wb.entries.forEach(e => {
            if (action === 'wb-batch-enable') e.disable = false;
            else if (action === 'wb-batch-constant') e.constant = true;
            else if (action === 'wb-batch-green') e.constant = false;
          });
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'wb-toggle-entry') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const uid = actionEl.getAttribute('data-uid');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        const entry = wb && (wb.entries || []).find(e => String(e.uid) === String(uid));
        if (entry) {
          entry.disable = !actionEl.checked;
          await saveTavernStore();
        }
        return;
      }
      if (action === 'wb-cycle-light') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const uid = actionEl.getAttribute('data-uid');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        const entry = wb && (wb.entries || []).find(e => String(e.uid) === String(uid));
        if (entry) {
          entry.constant = !entry.constant;
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'toggle-adv-wb-settings') {
        uiRuntime.showAdvancedWorldBookSettings = !uiRuntime.showAdvancedWorldBookSettings;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'wb-edit-entry') {
        const clickedUid = actionEl.getAttribute('data-uid');
        uiRuntime.editingWorldEntryUid = String(uiRuntime.editingWorldEntryUid) === String(clickedUid) ? null : clickedUid;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'wb-close-entry-editor') {
        uiRuntime.editingWorldEntryUid = null;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'wb-save-entry-editor') {
        const wbId = actionEl.getAttribute('data-wb-id');
        const uid = actionEl.getAttribute('data-uid');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        const entry = wb && (wb.entries || []).find(e => String(e.uid) === String(uid));
        if (entry) {
          entry.comment = document.getElementById('wb-edit-comment')?.value || '';
          entry.constant = document.getElementById('wb-edit-constant')?.value === 'true';
          entry.keys = (document.getElementById('wb-edit-keys')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
          entry.secondaryKeys = (document.getElementById('wb-edit-seckeys')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
          entry.selectiveLogic = Number(document.getElementById('wb-edit-logic')?.value || 0);
          entry.position = Number(document.getElementById('wb-edit-pos')?.value || 0);
          entry.depth = Number(document.getElementById('wb-edit-depth')?.value || 4);
          entry.order = Number(document.getElementById('wb-edit-order')?.value || 100);
          entry.probability = Number(document.getElementById('wb-edit-prob')?.value || 100);
          entry.role = Number(document.getElementById('wb-edit-role')?.value || 0);
          entry.content = document.getElementById('wb-edit-content')?.value || '';
          uiRuntime.editingWorldEntryUid = null;
          await saveTavernStore();
          refreshOpenDrawerOnly();
          showTavernToast('词条已保存');
        }
        return;
      }
      if (action === 'wb-del-entry') {
        const confirmed = await callGenericPopupShim('确定要删除该世界书词条吗？', 2);
        if (!confirmed) return;
        const wbId = actionEl.getAttribute('data-wb-id');
        const uid = actionEl.getAttribute('data-uid');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb && Array.isArray(wb.entries)) {
          wb.entries = wb.entries.filter(e => String(e.uid) !== String(uid));
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }

      // Drawer 5 (UserCog Themes, Colors & QR) Actions
      if (action === 'trigger-import-themes') {
        document.getElementById('tavern-file-themes')?.click();
        return;
      }
      if (action === 'export-active-theme') {
        const t = tavernState.themes.find(x => x.id === tavernState.activeThemeId) || tavernState.themes[0];
        if (t) downloadJsonFile((t.name || 'theme') + '.json', t);
        return;
      }
      if (action === 'reset-theme-colors') {
        const t = tavernState.themes.find(x => x.id === tavernState.activeThemeId) || tavernState.themes[0];
        if (t) {
          t.quote_text_color = DEFAULT_GOUSU_THEME.quote_text_color;
          t.italics_text_color = DEFAULT_GOUSU_THEME.italics_text_color;
          t.main_text_color = DEFAULT_GOUSU_THEME.main_text_color;
          tavernState.uiSettings.enableQuoteColor = true;
          tavernState.uiSettings.enableQuoteBox = true;
          tavernState.uiSettings.enableItalicColor = true;
          await saveTavernStore();
          applyActiveTavernTheme();
          refreshOpenDrawerOnly();
          showTavernToast('已恢复默认文字与引号配色');
        }
        return;
      }
      if (action === 'save-theme-custom-css') {
        const t = tavernState.themes.find(x => x.id === tavernState.activeThemeId) || tavernState.themes[0];
        if (t) {
          t.custom_css = document.getElementById('tavern-theme-css-editor')?.value || '';
          t.quote_text_color = document.getElementById('theme-quote-color-input')?.value || t.quote_text_color;
          t.italics_text_color = document.getElementById('theme-italic-color-input')?.value || t.italics_text_color;
          t.main_text_color = document.getElementById('theme-main-color-input')?.value || t.main_text_color;
          await saveTavernStore();
          applyActiveTavernTheme();
          showTavernToast('已实时应用主题CSS与颜色');
        }
        return;
      }
      if (action === 'add-quick-reply') {
        tavernState.quickReplies.push({
          id: 'qr_' + Date.now(),
          label: '推进剧情',
          message: '请继续推进剧情发展。',
          enabled: true
        });
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (action === 'toggle-qr-item') {
        const qid = actionEl.getAttribute('data-qr-id');
        const qr = (tavernState.quickReplies || []).find(x => x.id === qid);
        if (qr) {
          qr.enabled = actionEl.checked;
          await saveTavernStore();
          renderTavernShell();
        }
        return;
      }
      if (action === 'del-qr-item') {
        const qid = actionEl.getAttribute('data-qr-id');
        tavernState.quickReplies = (tavernState.quickReplies || []).filter(x => x.id !== qid);
        await saveTavernStore();
        renderTavernShell();
        return;
      }

      // Drawer 6 (Panorama Background) Actions
      if (action === 'trigger-upload-bg') {
        document.getElementById('tavern-file-bg')?.click();
        return;
      }
      if (action === 'use-card-avatar-as-bg') {
        const card = getActiveCard();
        if (card && card.avatar) {
          const resolvedBg = resolveSafeAvatarUrl(card.avatar, false);
          tavernState.background.url = resolvedBg;
          await saveTavernStore();
          renderTavernShell();
          showTavernToast('已将当前角色卡立绘设为聊天背景');
        }
        return;
      }
      if (action === 'clear-tavern-bg') {
        tavernState.background.url = '';
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (action === 'apply-bg-url') {
        const inputUrl = document.getElementById('tavern-bg-url-input')?.value?.trim() || '';
        tavernState.background.url = inputUrl;
        if (inputUrl) {
          if (!Array.isArray(tavernState.background.gallery)) tavernState.background.gallery = [];
          if (!tavernState.background.gallery.some(g => g && g.url === inputUrl)) {
            tavernState.background.gallery.unshift({
              id: 'bg_' + Date.now(),
              name: '自定义直链背景',
              url: inputUrl
            });
          }
        }
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (action === 'select-bg-gallery-item') {
        const rawUrl = actionEl.getAttribute('data-bg-url') || '';
        if (rawUrl) {
          tavernState.background.url = rawUrl;
          await saveTavernStore();
          renderTavernShell();
          showTavernToast('已切换背景图');
        }
        return;
      }
      if (action === 'delete-bg-gallery-item') {
        const bgId = actionEl.getAttribute('data-bg-id') || '';
        if (bgId && Array.isArray(tavernState.background.gallery)) {
          const targetItem = tavernState.background.gallery.find(g => g && g.id === bgId);
          tavernState.background.gallery = tavernState.background.gallery.filter(g => g && g.id !== bgId);
          if (targetItem && tavernState.background.url === targetItem.url) {
            tavernState.background.url = tavernState.background.gallery[0]?.url || '';
          }
          await saveTavernStore();
          renderTavernShell();
          showTavernToast('已从背景图库删除');
        }
        return;
      }
      if (action === 'toggle-tavern-debug-console') {
        uiRuntime.showDebugConsole = !uiRuntime.showDebugConsole;
        if (uiRuntime.showDebugConsole && typeof window.pushMobileBackGuard === 'function') {
          window.pushMobileBackGuard('tavern_debug_console');
        }
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'clear-tavern-debug-console') {
        uiRuntime.debugConsoleLogs = [];
        uiRuntime.debugConsoleClearedChatId = getActiveChatSession()?.id || 'cleared';
        refreshOpenDrawerOnly();
        showTavernToast('已清空控制台临时记录');
        return;
      }
      if (action === 'copy-tavern-debug-block') {
        const box = actionEl.closest('.tavern-debug-field-box');
        const preEl = box ? box.querySelector('pre') : null;
        const textToCopy = preEl ? (preEl.textContent || '') : '';
        if (textToCopy && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            showTavernToast('已复制完整内容到剪贴板');
          }).catch(() => {
            showTavernToast('复制失败，请手动长按复制');
          });
        }
        return;
      }

      // Drawer 7 (Cubes Extensions & Regex & GitHub URL Importers) Actions
      if (action === 'toggle-ext-acc') {
        const acc = actionEl.getAttribute('data-acc');
        if (acc) {
          uiRuntime.openExtensionAcc[acc] = !uiRuntime.openExtensionAcc[acc];
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'trigger-import-regexes') {
        document.getElementById('tavern-file-regexes')?.click();
        return;
      }
      if (action === 'import-regex-from-url') {
        const rawUrl = document.getElementById('tavern-regex-url-input')?.value?.trim() || '';
        if (!rawUrl) {
          showTavernToast('请先粘贴正则JSON链接');
          return;
        }
        await handleImportRegexFromUrl(rawUrl);
        return;
      }
      if (action === 'import-plugin-from-url') {
        const rawUrl = document.getElementById('tavern-plugin-url-input')?.value?.trim() || '';
        if (!rawUrl) {
          showTavernToast('请先粘贴GitHub插件仓库链接或脚本直链');
          return;
        }
        await handleImportPluginFromUrl(rawUrl);
        return;
      }
      if (action === 'add-new-regex') {
        const scope = actionEl.getAttribute('data-scope') || 'global';
        const newRx = {
          id: 'rx_' + Date.now(),
          scriptName: '新建正则脚本',
          findRegex: '',
          replaceString: '',
          trimStrings: [],
          placement: [1, 2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          scope
        };
        if (scope === 'card') {
          const card = getActiveCard();
          if (!Array.isArray(card.regexScripts)) card.regexScripts = [];
          card.regexScripts.unshift(newRx);
        } else if (scope === 'preset') {
          const preset = getActivePreset();
          if (!Array.isArray(preset.regexScripts)) preset.regexScripts = [];
          preset.regexScripts.unshift(newRx);
        } else {
          tavernState.globalRegexScripts.unshift(newRx);
        }
        uiRuntime.editingRegexId = newRx.id;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'toggle-regex-script') {
        const rxId = actionEl.getAttribute('data-rx-id');
        const scope = actionEl.getAttribute('data-scope');
        const card = getActiveCard();
        const preset = getActivePreset();
        const list = scope === 'card'
          ? (card.regexScripts || [])
          : (scope === 'preset' ? (preset.regexScripts || []) : (tavernState.globalRegexScripts || []));
        const item = list.find(r => r.id === rxId);
        if (item) {
          item.disabled = !actionEl.checked;
          await saveTavernStore();
          renderTavernChatFloors(false);
        }
        return;
      }
      if (action === 'move-regex-up' || action === 'move-regex-down') {
        const rxId = actionEl.getAttribute('data-rx-id');
        const scope = actionEl.getAttribute('data-scope') || 'global';
        const card = getActiveCard();
        const preset = getActivePreset();
        const list = scope === 'card'
          ? (card && Array.isArray(card.regexScripts) ? card.regexScripts : [])
          : (scope === 'preset' ? (preset && Array.isArray(preset.regexScripts) ? preset.regexScripts : []) : (tavernState.globalRegexScripts || []));
        const idx = list.findIndex(r => r && r.id === rxId);
        if (idx >= 0) {
          const swapIdx = action === 'move-regex-up' ? idx - 1 : idx + 1;
          if (swapIdx >= 0 && swapIdx < list.length) {
            const tmp = list[idx];
            list[idx] = list[swapIdx];
            list[swapIdx] = tmp;
            await saveTavernStore();
            refreshOpenDrawerOnly();
            renderTavernChatFloors(false);
          }
        }
        return;
      }
      if (action === 'edit-regex-script') {
        const clickedId = actionEl.getAttribute('data-rx-id');
        uiRuntime.editingRegexId = uiRuntime.editingRegexId === clickedId ? null : clickedId;
        uiRuntime.openDrawerKey = 'cubes';
        uiRuntime.openExtensionAcc.regex = true;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'close-regex-editor') {
        uiRuntime.editingRegexId = null;
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'save-regex-editor') {
        const rxId = actionEl.getAttribute('data-rx-id');
        const oldScope = actionEl.getAttribute('data-scope') || 'global';
        const newScope = document.getElementById('rx-edit-scope')?.value || oldScope;
        const card = getActiveCard();
        const preset = getActivePreset();
        const getListByScope = (sc) => {
          if (sc === 'card') {
            if (!Array.isArray(card.regexScripts)) card.regexScripts = [];
            return card.regexScripts;
          }
          if (sc === 'preset') {
            if (!Array.isArray(preset.regexScripts)) preset.regexScripts = [];
            return preset.regexScripts;
          }
          if (!Array.isArray(tavernState.globalRegexScripts)) tavernState.globalRegexScripts = [];
          return tavernState.globalRegexScripts;
        };
        const oldList = getListByScope(oldScope);
        const itemIdx = oldList.findIndex(r => r && r.id === rxId);
        if (itemIdx >= 0) {
          const item = oldList[itemIdx];
          item.scriptName = document.getElementById('rx-edit-name')?.value || item.scriptName;
          item.findRegex = document.getElementById('rx-edit-find')?.value || '';
          item.replaceString = document.getElementById('rx-edit-replace')?.value ?? '';
          const mode = document.getElementById('rx-edit-mode')?.value || 'display';
          item.markdownOnly = mode === 'display' || mode === 'both';
          item.promptOnly = mode === 'prompt' || mode === 'both';
          item.scope = newScope;
          if (newScope !== oldScope) {
            oldList.splice(itemIdx, 1);
            const targetList = getListByScope(newScope);
            targetList.unshift(item);
          }
          uiRuntime.editingRegexId = null;
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('正则脚本已保存');
        }
        return;
      }
      if (action === 'del-regex-script') {
        const confirmed = await callGenericPopupShim('确定要删除该正则脚本吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        const rxId = actionEl.getAttribute('data-rx-id');
        const scope = actionEl.getAttribute('data-scope');
        const card = getActiveCard();
        const preset = getActivePreset();
        if (scope === 'card' && card) {
          card.regexScripts = (card.regexScripts || []).filter(r => r.id !== rxId);
        } else if (scope === 'preset' && preset) {
          preset.regexScripts = (preset.regexScripts || []).filter(r => r.id !== rxId);
        } else {
          tavernState.globalRegexScripts = (tavernState.globalRegexScripts || []).filter(r => r.id !== rxId);
        }
        if (uiRuntime.editingRegexId === rxId) {
          uiRuntime.editingRegexId = null;
        }
        await saveTavernStore();
        refreshOpenDrawerOnly();
        renderTavernChatFloors(false);
        showTavernToast('已删除正则脚本');
        return;
      }
      if (action === 'save-author-note') {
        tavernState.authorNote.text = document.getElementById('an-text-input')?.value || '';
        tavernState.authorNote.depth = Number(document.getElementById('an-depth-input')?.value ?? 4);
        tavernState.authorNote.role = document.getElementById('an-role-input')?.value || 'system';
        tavernState.authorNote.frequency = Number(document.getElementById('an-freq-input')?.value ?? 1);
        await saveTavernStore();
        showTavernToast('作者注释已保存');
        return;
      }
      if (action === 'save-memory-config') {
        tavernState.memory.enabled = Boolean(document.getElementById('mem-enabled-check')?.checked);
        tavernState.memory.injectDepth = Number(document.getElementById('mem-depth-input')?.value ?? 2);
        tavernState.memory.autoInterval = Number(document.getElementById('mem-interval-input')?.value ?? 20);
        tavernState.memory.summaryText = document.getElementById('mem-summary-textarea')?.value || '';
        await saveTavernStore();
        showTavernToast('剧情摘要设置已保存');
        return;
      }
      if (action === 'trigger-import-plugins') {
        document.getElementById('tavern-file-plugins')?.click();
        return;
      }
      if (action === 'toggle-plugin-item') {
        const pid = actionEl.getAttribute('data-plugin-id');
        const p = (tavernState.plugins || []).find(x => x.id === pid);
        if (p) {
          p.enabled = actionEl.checked;
          if (p.enabled && !p.builtInType) executeUserPluginScript(p);
          await saveTavernStore();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (action === 'del-plugin-item') {
        const confirmed = await callGenericPopupShim('确定要卸载并删除该插件吗？', 2);
        if (!confirmed) return;
        const pid = actionEl.getAttribute('data-plugin-id');
        const targetP = (tavernState.plugins || []).find(x => x.id === pid);
        if (isBaiBaiImagePlugin(targetP)) {
          document.getElementById('bbi-app-host')?.remove();
          document.getElementById('bbi-menu-item')?.closest('.extension_container')?.remove();
          document.getElementById('bbi-topbar-button')?.remove();
        }
        if (isBaiBaiBookPlugin(targetP)) {
          if (tavernState.extensionSettings) tavernState.extensionSettings._uninstalledBaiBaiBook = true;
          document.getElementById('bbs-app-host')?.remove();
          document.getElementById('bbs-menu-item')?.closest('.extension_container')?.remove();
          document.getElementById('bbs-topbar-button')?.remove();
          document.getElementById('bbs-qr-button')?.remove();
        }
        if (isBurntChickenWingsPlugin(targetP)) {
          try { window.__presetAtelier?.destroy?.(); } catch (_) {}
          document.getElementById('pa-root')?.remove();
          document.getElementById('pa-ball')?.remove();
          document.getElementById('pa-menu-entry')?.remove();
          document.getElementById('pa-settings')?.remove();
        }
        tavernState.plugins = (tavernState.plugins || []).filter(x => x.id !== pid);
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }

      // Drawer 8 (Smile Persona) Actions
      if (action === 'sync-persona-from-phone') {
        const activeP = getActivePersona();
        try {
          if (typeof state !== 'undefined' && state.chats) {
            const firstChat = Object.values(state.chats)[0];
            if (firstChat && firstChat.settings) {
              activeP.name = firstChat.settings.myName || activeP.name;
              activeP.avatar = firstChat.settings.myAvatar || activeP.avatar;
              activeP.description = firstChat.settings.myPersona || activeP.description;
            }
          }
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('已同步手机外部玩家人设');
        } catch (_) {}
        return;
      }
      if (action === 'create-new-persona') {
        const newP = {
          id: 'persona_' + Date.now(),
          name: '新面具',
          avatar: DEFAULT_USER_AVATAR_SVG,
          description: '',
          position: 0,
          depth: 2,
          role: 0,
          lockedCardIds: []
        };
        tavernState.personas.push(newP);
        tavernState.activePersonaId = newP.id;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (action === 'trigger-upload-persona-avatar') {
        document.getElementById('tavern-file-persona-avatar')?.click();
        return;
      }
      if (action === 'save-active-persona') {
        const activeP = getActivePersona();
        const card = getActiveCard();
        if (activeP) {
          activeP.name = document.getElementById('persona-name-input')?.value?.trim() || '旅人';
          activeP.position = Number(document.getElementById('persona-pos-input')?.value || 0);
          activeP.description = document.getElementById('persona-desc-input')?.value || '';
          const lockChecked = Boolean(document.getElementById('persona-lock-card-check')?.checked);
          if (!Array.isArray(activeP.lockedCardIds)) activeP.lockedCardIds = [];
          if (card) {
            activeP.lockedCardIds = activeP.lockedCardIds.filter(id => id !== card.id);
            if (lockChecked) activeP.lockedCardIds.push(card.id);
          }
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('玩家人设已保存');
        }
        return;
      }
      if (action === 'delete-active-persona') {
        if (tavernState.personas.length <= 1) {
          showTavernToast('至少保留一个人设面具');
          return;
        }
        const confirmed = await callGenericPopupShim('确定要删除当前玩家人设吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        const activeP = getActivePersona();
        tavernState.personas = tavernState.personas.filter(p => p.id !== activeP.id);
        tavernState.activePersonaId = tavernState.personas[0].id;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }

      // Drawer 9 (Address Character Cards & Chats) Actions
      if (action === 'trigger-import-cards') {
        document.getElementById('tavern-file-cards')?.click();
        return;
      }
      if (action === 'create-blank-card') {
        const newCard = {
          id: 'card_' + Date.now(),
          name: '新角色',
          avatar: DEFAULT_AVATAR_SVG,
          description: '',
          personality: '',
          scenario: '',
          first_mes: '你好，旅人。',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          alternate_greetings: [],
          tags: [],
          worldBookId: null,
          regexScripts: [],
          helperScripts: []
        };
        tavernState.cards.unshift(newCard);
        tavernState.activeCardId = newCard.id;
        ensureActiveCardChatInitialized(newCard);
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (action === 'switch-active-card') {
        const cid = actionEl.getAttribute('data-card-id');
        if (cid) {
          tavernState.activeCardId = cid;
          const nextCard = getActiveCard();
          ensureActiveCardChatInitialized(nextCard);
          if (tavernState.background?.syncCardAvatarAsBg && nextCard && nextCard.avatar) {
            tavernState.background.url = resolveSafeAvatarUrl(nextCard.avatar, false);
          }
          uiRuntime.openDrawerKey = null;
          await saveTavernStore();
          renderTavernShell();
          await tavernEventSource.emit(TAVERN_EVENT_TYPES.CHAT_CHANGED, cid);
          syncCardScopedFloatingWidgets();
        }
        return;
      }
      if (action === 'export-card-json') {
        const cid = actionEl.getAttribute('data-card-id');
        const c = (tavernState.cards || []).find(x => x.id === cid);
        if (c) downloadJsonFile((c.name || 'character') + '.json', c);
        return;
      }
      if (action === 'delete-card') {
        const cid = actionEl.getAttribute('data-card-id');
        if (tavernState.cards.length <= 1) return;
        const confirmed = await callGenericPopupShim('确定要删除该角色卡及关联会话吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        tavernState.cards = tavernState.cards.filter(c => c.id !== cid);
        if (tavernState.activeCardId === cid) {
          tavernState.activeCardId = tavernState.cards[0].id;
        }
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (action === 'trigger-upload-card-avatar') {
        document.getElementById('tavern-file-card-avatar')?.click();
        return;
      }
      if (action === 'save-card-edits') {
        const card = getActiveCard();
        if (card) {
          const newName = document.getElementById('card-edit-name')?.value?.trim() || card.name;
          card.name = newName;
          card.worldBookId = document.getElementById('card-edit-wb')?.value || null;
          card.description = document.getElementById('card-edit-desc')?.value || '';
          card.personality = document.getElementById('card-edit-personality')?.value || '';
          card.scenario = document.getElementById('card-edit-scenario')?.value || '';
          card.first_mes = document.getElementById('card-edit-firstmes')?.value || '';
          const sess = getActiveChatSession();
          if (sess && Array.isArray(sess.messages)) {
            sess.messages.forEach(m => {
              if (!m.is_user) m.name = newName;
            });
          }
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('角色卡设定与对话名称已同步保存');
        }
        return;
      }
      if (action === 'sync-card-greetings-to-floor0') {
        const card = getActiveCard();
        const sess = getActiveChatSession();
        if (card && sess && sess.messages[0]) {
          const allG = [card.first_mes, ...(card.alternate_greetings || [])].filter(Boolean);
          if (allG.length > 0) {
            sess.messages[0].swipes = allG;
            sess.messages[0].swipe_id = 0;
            sess.messages[0].mes = allG[0];
            sess.messages[0].token_count = estimateTokens(allG[0]);
            await saveTavernStore();
            renderTavernChatFloors(true);
            showTavernToast('已同步 ' + allG.length + ' 个开场白至第0层');
          }
        }
        return;
      }
      if (action === 'switch-chat-archive') {
        const chatId = actionEl.getAttribute('data-chat-id');
        const card = getActiveCard();
        const archives = (tavernState.chatArchivesByCardId && tavernState.chatArchivesByCardId[card.id]) || [];
        const target = archives.find(a => a.chatId === chatId);
        if (target) {
          tavernState.chatsByCardId[card.id] = target;
          uiRuntime.openDrawerKey = null;
          await saveTavernStore();
          renderTavernShell();
          showTavernToast('已切换对话存档');
        }
        return;
      }
      if (action === 'delete-chat-archive') {
        const chatId = actionEl.getAttribute('data-chat-id');
        const card = getActiveCard();
        let archives = (tavernState.chatArchivesByCardId && tavernState.chatArchivesByCardId[card.id]) || [];
        if (archives.length <= 1) return;
        const confirmed = await callGenericPopupShim('确定要删除该聊天分支存档吗？删除后无法恢复。', 2);
        if (!confirmed) return;
        archives = archives.filter(a => a.chatId !== chatId);
        tavernState.chatArchivesByCardId[card.id] = archives;
        if (tavernState.chatsByCardId[card.id]?.chatId === chatId) {
          tavernState.chatsByCardId[card.id] = archives[0];
        }
        await saveTavernStore();
        refreshOpenDrawerOnly();
        renderTavernChatFloors(false);
        return;
      }
      if (action === 'export-current-chat') {
        const sess = getActiveChatSession();
        if (sess) downloadJsonFile((sess.title || 'chat') + '.json', sess);
        return;
      }
      if (action === 'trigger-import-chats') {
        document.getElementById('tavern-file-chats')?.click();
        return;
      }
    });

    // Change & Input Delegation
    root.addEventListener('change', async e => {
      const target = e.target;
      const changeType = target.getAttribute('data-change');

      if (changeType === 'switch-preset') {
        tavernState.activePresetId = target.value;
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        const curP = getActivePreset();
        showTavernToast('已切换预设: ' + (curP?.name || ''));
        return;
      }
      if (changeType === 'switch-external-api-preset') {
        tavernState.apiConfig.selectedExternalPresetName = target.value;
        tavernState.apiConfig.useExternalPhoneApi = true;
        tavernState.apiConfig.activeSavedPresetId = '';
        tavernState.apiConfig.customUrl = '';
        tavernState.apiConfig.customKey = '';
        tavernState.apiConfig.customModel = '';
        const extPresets = getExternalPhoneApiPresets();
        const matchedExt = extPresets.find(p => p && (p.name === target.value || String(p.id) === String(target.value)));
        const phoneSelect = document.getElementById('api-preset-select');
        if (phoneSelect && matchedExt && matchedExt.id !== undefined) {
          phoneSelect.value = String(matchedExt.id);
          phoneSelect.dispatchEvent(new Event('change'));
        }
        buildSillyTavernContextObject();
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast(target.value ? ('已切换至外部API预设: ' + target.value) : '已恢复跟随手机默认API');
        return;
      }
      if (changeType === 'switch-builtin-api-preset') {
        const pid = target.value;
        tavernState.apiConfig.activeSavedPresetId = pid;
        if (pid && Array.isArray(tavernState.apiConfig.savedPresets)) {
          const found = tavernState.apiConfig.savedPresets.find(x => x.id === pid);
          if (found) {
            tavernState.apiConfig.customUrl = found.url || '';
            tavernState.apiConfig.customKey = found.key || '';
            tavernState.apiConfig.customModel = found.model || '';
            tavernState.apiConfig.useExternalPhoneApi = false;
          }
        }
        await saveTavernStore(true);
        refreshOpenDrawerOnly();
        showTavernToast(pid ? '已切换至酒馆内置API预设' : '已切换为手动配置模式');
        return;
      }
      if (changeType === 'switch-theme') {
        tavernState.activeThemeId = target.value;
        await saveTavernStore();
        applyActiveTavernTheme();
        refreshOpenDrawerOnly();
        return;
      }
      if (changeType === 'switch-persona') {
        tavernState.activePersonaId = target.value;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        renderTavernChatFloors(false);
        return;
      }
      if (changeType === 'select-fetched-model') {
        tavernState.apiConfig.customModel = target.value;
        const modelInput = document.getElementById('tavern-api-model-input');
        if (modelInput) modelInput.value = target.value;
        await saveTavernStore();
        return;
      }

      if (target.hasAttribute('data-color-picker')) {
        const colorKey = target.getAttribute('data-color-picker');
        const activeTheme = tavernState.themes.find(x => x.id === tavernState.activeThemeId) || tavernState.themes[0];
        if (activeTheme && colorKey) {
          activeTheme[colorKey] = target.value;
          await saveTavernStore();
          applyActiveTavernTheme();
          refreshOpenDrawerOnly();
        }
        return;
      }
      if (target.hasAttribute('data-color-text')) {
        const colorKey = target.getAttribute('data-color-text');
        const activeTheme = tavernState.themes.find(x => x.id === tavernState.activeThemeId) || tavernState.themes[0];
        if (activeTheme && colorKey) {
          activeTheme[colorKey] = target.value.trim();
          await saveTavernStore();
          applyActiveTavernTheme();
          refreshOpenDrawerOnly();
        }
        return;
      }

      if (target.hasAttribute('data-preset-num')) {
        const k = target.getAttribute('data-preset-num');
        const preset = getActivePreset();
        preset[k] = Number(target.value);
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (target.hasAttribute('data-preset-bool')) {
        const k = target.getAttribute('data-preset-bool');
        const preset = getActivePreset();
        const checked = Boolean(target.checked);
        preset[k] = checked;
        if (k === 'stream_openai') {
          tavernState.apiConfig.streamEnabled = checked;
          (tavernState.presets || []).forEach(p => {
            p.stream_openai = checked;
          });
          showTavernToast(checked ? '已开启真实流式逐字生成' : '已切换为非流式整段直出模式');
        }
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (target.hasAttribute('data-memory-num')) {
        const k = target.getAttribute('data-memory-num');
        tavernState.memory[k] = Number(target.value);
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (target.hasAttribute('data-memory-bool')) {
        const k = target.getAttribute('data-memory-bool');
        const checked = Boolean(target.checked);
        tavernState.memory[k] = checked;
        await saveTavernStore();
        refreshOpenDrawerOnly();
        showTavernToast(checked ? '已开启内置记忆总结' : '已关闭内置记忆总结');
        return;
      }
      if (target.hasAttribute('data-api-bool')) {
        const k = target.getAttribute('data-api-bool');
        const checked = Boolean(target.checked);
        tavernState.apiConfig[k] = checked;
        if (k === 'useExternalPhoneApi' && checked) {
          tavernState.apiConfig.activeSavedPresetId = '';
          tavernState.apiConfig.customUrl = '';
          tavernState.apiConfig.customKey = '';
          tavernState.apiConfig.customModel = '';
        }
        if (k === 'streamEnabled') {
          const preset = getActivePreset();
          if (preset) preset.stream_openai = checked;
        }
        await saveTavernStore();
        refreshOpenDrawerOnly();
        return;
      }
      if (target.hasAttribute('data-fmt-bool')) {
        const k = target.getAttribute('data-fmt-bool');
        tavernState.formatting[k] = Boolean(target.checked);
        await saveTavernStore();
        renderTavernChatFloors(false);
        return;
      }
      if (target.hasAttribute('data-cot-pair-field')) {
        const pIdx = Number(target.getAttribute('data-cot-pair-idx'));
        const pField = target.getAttribute('data-cot-pair-field');
        const pairs = getActiveReasoningTagPairs();
        if (pairs[pIdx] && (pField === 'start' || pField === 'end')) {
          pairs[pIdx][pField] = target.value;
          if (pIdx === 0) {
            tavernState.formatting.reasoningStartTag = pairs[0].start || '<think>';
            tavernState.formatting.reasoningEndTag = pairs[0].end || '</think>';
          }
          await saveTavernStore();
          renderTavernChatFloors(false);
        }
        return;
      }
      if (target.hasAttribute('data-fmt-str')) {
        const k = target.getAttribute('data-fmt-str');
        tavernState.formatting[k] = target.value;
        await saveTavernStore();
        return;
      }
      if (target.hasAttribute('data-wb-setting')) {
        const k = target.getAttribute('data-wb-setting');
        const wbId = target.getAttribute('data-wb-id');
        const wb = (tavernState.worldBooks || []).find(b => b.id === wbId);
        if (wb) {
          wb[k] = k === 'recursiveScanning' ? target.value === 'true' : Number(target.value);
          await saveTavernStore();
        }
        return;
      }
      if (target.hasAttribute('data-ui-num')) {
        const k = target.getAttribute('data-ui-num');
        tavernState.uiSettings[k] = Number(target.value);
        if (k === 'streamSpeed') {
          tavernState.uiSettings.streamSpeedUserSaved = true;
        }
        await saveTavernStore(true);
        applyActiveTavernTheme();
        refreshOpenDrawerOnly();
        return;
      }
      if (target.hasAttribute('data-ui-bool')) {
        const k = target.getAttribute('data-ui-bool');
        tavernState.uiSettings[k] = Boolean(target.checked);
        await saveTavernStore();
        applyActiveTavernTheme();
        if (k !== 'enableBaiBaiBookBeautify') {
          renderTavernChatFloors(false);
        }
        return;
      }
      if (target.hasAttribute('data-bg-bool')) {
        const k = target.getAttribute('data-bg-bool');
        tavernState.background[k] = Boolean(target.checked);
        if (k === 'syncCardAvatarAsBg' && target.checked) {
          const card = getActiveCard();
          if (card && card.avatar) {
            tavernState.background.url = resolveSafeAvatarUrl(card.avatar, false);
          }
        }
        await saveTavernStore();
        renderTavernShell();
        return;
      }
      if (target.hasAttribute('data-bg-setting')) {
        const k = target.getAttribute('data-bg-setting');
        tavernState.background[k] = k === 'fit' ? target.value : Number(target.value);
        await saveTavernStore();
        renderTavernShell();
        return;
      }

      // Multi-File Input Handlers
      if (target.id === 'tavern-file-cards' && target.files?.length) {
        await handleBatchImportCards(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-worldbooks' && target.files?.length) {
        await handleBatchImportWorldBooks(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-regexes' && target.files?.length) {
        await handleBatchImportRegexes(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-presets' && target.files?.length) {
        await handleBatchImportPresets(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-themes' && target.files?.length) {
        await handleBatchImportThemes(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-plugins' && target.files?.length) {
        await handleBatchImportPlugins(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-chats' && target.files?.length) {
        await handleBatchImportChats(Array.from(target.files));
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-bg' && target.files?.length) {
        if (!Array.isArray(tavernState.background.gallery)) {
          tavernState.background.gallery = [];
        }
        const files = Array.from(target.files);
        let lastVaultRef = '';
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const url = await offloadImageToVault(f, 'tavern_bg_' + Date.now() + '_' + i + '.png');
          if (url) {
            lastVaultRef = url;
            const cleanName = String(f.name || ('背景图' + (i + 1))).replace(/\.[^.]+$/, '');
            if (!tavernState.background.gallery.some(g => g && g.url === url)) {
              tavernState.background.gallery.unshift({
                id: 'bg_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 5),
                name: cleanName,
                url
              });
            }
          }
        }
        if (lastVaultRef) {
          tavernState.background.url = lastVaultRef;
          await saveTavernStore();
          renderTavernShell();
          showTavernToast('已将 ' + files.length + ' 张背景图存入Termux本地图库并应用');
        }
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-persona-avatar' && target.files?.[0]) {
        const url = await offloadImageToVault(target.files[0], 'tavern_persona_' + Date.now() + '.png');
        const activeP = getActivePersona();
        if (url && activeP) {
          activeP.avatar = url;
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('人设头像已存入Termux本地');
        }
        target.value = '';
        return;
      }
      if (target.id === 'tavern-file-card-avatar' && target.files?.[0]) {
        const url = await offloadImageToVault(target.files[0], 'tavern_char_' + Date.now() + '.png');
        const card = getActiveCard();
        if (url && card) {
          card.avatar = url;
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('角色头像已存入Termux本地');
        }
        target.value = '';
        return;
      }
    });

    root.addEventListener('input', e => {
      if (e.target && e.target.id === 'send_textarea') {
        autoResizeTavernSendTextarea(e.target);
        return;
      }
      if (e.target && e.target.id === 'wb-entry-search-input') {
        uiRuntime.worldEntrySearch = e.target.value;
        refreshOpenDrawerOnly();
        const input = document.getElementById('wb-entry-search-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    });

    // Enter key in #send_textarea inserts a newline; sending is only triggered via the Send button
  }

  // ============================================================================
  // 13. Multi-File Batch Importers & GitHub URL Importers
  // ============================================================================
  function convertGitHubUrlToRaw(inputUrl) {
    let url = String(inputUrl || '').trim();
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    }
    return url;
  }

  async function handleImportRegexFromUrl(rawUrl) {
    try {
      showTavernToast('正在从链接下载正则脚本...');
      const fetchUrl = convertGitHubUrlToRaw(rawUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw.regex_scripts) ? raw.regex_scripts : [raw]);
      const normalized = normalizeRegexList(list, 'global');
      tavernState.globalRegexScripts.unshift(...normalized);
      await saveTavernStore();
      refreshOpenDrawerOnly();
      renderTavernChatFloors(false);
      showTavernToast('成功从链接导入 ' + normalized.length + ' 条正则脚本');
    } catch (err) {
      console.error('URL Regex import error:', err);
      showTavernToast('链接导入正则失败: ' + (err.message || '请检查是否为有效JSON直链'));
    }
  }

  async function handleImportPluginFromUrl(rawUrl) {
    try {
      showTavernToast('正在从链接获取插件...');
      let cleanUrl = String(rawUrl || '').trim().replace(/\/+$/, '').replace(/\.git$/i, '');
      const ghRepoMatch = cleanUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i);
      if (ghRepoMatch) {
        const owner = ghRepoMatch[1];
        const repo = ghRepoMatch[2];
        let branch = 'main';
        let manifest = null;
        for (const tryBranch of ['main', 'master']) {
          const mRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${tryBranch}/manifest.json`);
          if (mRes.ok) {
            branch = tryBranch;
            manifest = await mRes.json();
            break;
          }
        }
        const rawJsFile = (manifest && manifest.js) ? manifest.js : 'index.js';
        const rawCssFile = (manifest && manifest.css) ? manifest.css : 'style.css';
        const jsFile = String(rawJsFile).split('?')[0].replace(/^\/+/, '');
        const cssFile = String(rawCssFile).split('?')[0].replace(/^\/+/, '');
        let jsCode = '';
        let cssCode = '';
        const jsRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${jsFile}`);
        if (jsRes.ok) jsCode = await jsRes.text();
        const cssRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cssFile}`);
        if (cssRes.ok) cssCode = await cssRes.text();

        const repoBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
        const htmlTemplates = {};
        for (const tryHtml of ['settings.html', 'index.html', 'template.html', 'window.html', 'popup.html']) {
          try {
            const hRes = await fetch(`${repoBaseUrl}/${tryHtml}`);
            if (hRes.ok) {
              htmlTemplates[tryHtml] = await hRes.text();
            }
          } catch (_) {}
        }
        if (jsCode) {
          const refMatches = jsCode.matchAll(/['"]([a-zA-Z0-9_/-]+\.html)['"]/g);
          for (const rm of refMatches) {
            const fName = rm[1].split('/').pop();
            if (fName && !htmlTemplates[fName]) {
              try {
                const hRes = await fetch(`${repoBaseUrl}/${rm[1].replace(/^\/+/, '')}`);
                if (hRes.ok) htmlTemplates[fName] = await hRes.text();
              } catch (_) {}
            }
          }
        }
        if (cssCode) {
          const injectCss = `try{const s=document.createElement('style');s.textContent=${JSON.stringify(cssCode)};document.head.appendChild(s);}catch(_){}\n`;
          jsCode = injectCss + jsCode;
        }
        const combinedHtml = Object.values(htmlTemplates).join('\n') || extractEmbeddedHtmlFromPluginCode(jsCode);
        const pluginName = (manifest && manifest.display_name) || repo;
        const existingIdx = (tavernState.plugins || []).findIndex(x => x && (x.name === pluginName || x.repoBaseUrl === repoBaseUrl));
        const plugin = {
          id: existingIdx >= 0 ? tavernState.plugins[existingIdx].id : ('plugin_' + Date.now()),
          name: pluginName,
          enabled: true,
          code: jsCode,
          uiHtml: combinedHtml,
          htmlTemplates,
          repoBaseUrl,
          jsEntryPath: jsFile,
          description: (manifest && manifest.description) || ('从GitHub安装的扩展: ' + owner + '/' + repo)
        };
        if (existingIdx >= 0) {
          tavernState.plugins[existingIdx] = plugin;
        } else {
          tavernState.plugins.push(plugin);
        }
        if (plugin.code) executeUserPluginScript(plugin);
        await saveTavernStore();
        refreshOpenDrawerOnly();
        showTavernToast('成功安装GitHub酒馆插件: ' + plugin.name);
        return;
      }

      const fetchUrl = convertGitHubUrlToRaw(cleanUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (fetchUrl.toLowerCase().endsWith('.json')) {
        const raw = JSON.parse(text);
        if (raw.findRegex || Array.isArray(raw.regex_scripts) || (Array.isArray(raw) && raw[0]?.findRegex)) {
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw.regex_scripts) ? raw.regex_scripts : [raw]);
          const normalized = normalizeRegexList(list, 'global');
          tavernState.globalRegexScripts.unshift(...normalized);
          await saveTavernStore();
          refreshOpenDrawerOnly();
          renderTavernChatFloors(false);
          showTavernToast('检测到正则JSON，已自动导入 ' + normalized.length + ' 条正则');
          return;
        }
        const scriptItems = Array.isArray(raw.scripts) ? raw.scripts : (Array.isArray(raw) ? raw : [raw]);
        for (const item of scriptItems) {
          if (!item || typeof item !== 'object') continue;
          const itemCode = item.content || item.code || item.script || item.value || '';
          const itemBtns = (item.buttons && Array.isArray(item.buttons.buttons)) ? item.buttons.buttons : (Array.isArray(item.buttons) ? item.buttons : []);
          const plugin = {
            id: 'plugin_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            name: item.name || item.display_name || '链接导入插件',
            enabled: item.enabled !== false,
            code: itemCode,
            uiHtml: item.uiHtml || item.html || extractEmbeddedHtmlFromPluginCode(itemCode),
            buttons: itemBtns,
            description: item.info || item.description || '从URL导入的酒馆插件'
          };
          tavernState.plugins.push(plugin);
          if (plugin.code) executeUserPluginScript(plugin);
        }
      } else {
        const plugin = {
          id: 'plugin_' + Date.now(),
          name: fetchUrl.split('/').pop()?.replace(/\.js$/i, '') || '链接脚本插件',
          enabled: true,
          code: text,
          uiHtml: extractEmbeddedHtmlFromPluginCode(text),
          description: '从URL导入的JS脚本插件'
        };
        tavernState.plugins.push(plugin);
        executeUserPluginScript(plugin);
      }
      await saveTavernStore();
      refreshOpenDrawerOnly();
      showTavernToast('成功从链接安装酒馆插件');
    } catch (err) {
      console.error('URL Plugin import error:', err);
      showTavernToast('链接安装插件失败: ' + (err.message || '请检查链接是否可访问'));
    }
  }

  async function handleBatchImportCards(files) {
    let importedCards = 0;
    let totalBooks = 0;
    let totalRegex = 0;
    let totalGreetings = 0;
    let totalScripts = 0;

    for (const file of files) {
      try {
        if (file.name.toLowerCase().endsWith('.png') || file.type === 'image/png') {
          const buf = await file.arrayBuffer();
          const rawJson = await extractCharacterJsonFromPngBuffer(buf);
          const avatarUrl = await offloadImageToVault(file, 'char_' + Date.now() + '_' + file.name);
          const summary = importCharacterCardFromRaw(rawJson, avatarUrl);
          if (tavernState.background?.syncCardAvatarAsBg && avatarUrl) {
            tavernState.background.url = resolveSafeAvatarUrl(avatarUrl, false);
          }
          importedCards++;
          totalBooks += summary.worldBookCount;
          totalRegex += summary.regexCount;
          totalGreetings += summary.greetingCount;
          totalScripts += (summary.helperScriptCount || 0);
        } else {
          const text = await file.text();
          const rawJson = JSON.parse(text);
          const summary = importCharacterCardFromRaw(rawJson, DEFAULT_AVATAR_SVG);
          importedCards++;
          totalBooks += summary.worldBookCount;
          totalRegex += summary.regexCount;
          totalGreetings += summary.greetingCount;
          totalScripts += (summary.helperScriptCount || 0);
        }
      } catch (err) {
        console.error('Character card import error:', file.name, err);
        showTavernToast('导入角色卡失败 ' + file.name + ': ' + err.message);
      }
    }

    if (importedCards > 0) {
      uiRuntime.openDrawerKey = null;
      await saveTavernStore();
      renderTavernShell();
      showTavernToast(`成功导入${importedCards}张角色卡 已默认启用${totalBooks}本世界书 ${totalRegex}条正则 ${totalGreetings}个开场白${totalScripts > 0 ? ' ' + totalScripts + '个互动面板' : ''}`);
    }
  }

  async function handleBatchImportWorldBooks(files) {
    let count = 0;
    for (const file of files) {
      try {
        const raw = JSON.parse(await file.text());
        const wb = normalizeWorldBookObject(raw, file.name.replace(/\.json$/i, ''));
        if (wb) {
          tavernState.worldBooks.unshift(wb);
          uiRuntime.activeWorldBookEditId = wb.id;
          count++;
        }
      } catch (err) {
        console.error('WorldBook import error:', file.name, err);
      }
    }
    if (count > 0) {
      await saveTavernStore();
      refreshOpenDrawerOnly();
      showTavernToast('成功导入 ' + count + ' 本世界书');
    }
  }

  async function handleBatchImportRegexes(files) {
    let count = 0;
    for (const file of files) {
      try {
        const raw = JSON.parse(await file.text());
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.regex_scripts) ? raw.regex_scripts : [raw]);
        const normalized = normalizeRegexList(list, 'global');
        tavernState.globalRegexScripts.unshift(...normalized);
        count += normalized.length;
      } catch (err) {
        console.error('Regex import error:', file.name, err);
      }
    }
    if (count > 0) {
      await saveTavernStore();
      refreshOpenDrawerOnly();
      renderTavernChatFloors(false);
      showTavernToast('成功导入 ' + count + ' 条全局正则脚本');
    }
  }

  async function handleBatchImportPresets(files) {
    let count = 0;
    let rxAdded = 0;
    for (const file of files) {
      try {
        const raw = JSON.parse(await file.text());
        // If user selected a standalone regex script or regex array while importing presets, attach to active preset
        const isStandaloneRegex = Array.isArray(raw)
          ? raw.some(r => r && (r.findRegex !== undefined || r.scriptName !== undefined || r.find_regex !== undefined))
          : (raw && !Array.isArray(raw.prompts) && (raw.findRegex !== undefined || raw.scriptName !== undefined || raw.find_regex !== undefined));
        if (isStandaloneRegex) {
          const activePreset = getActivePreset();
          if (!Array.isArray(activePreset.regexScripts)) activePreset.regexScripts = [];
          const list = Array.isArray(raw) ? raw : [raw];
          list.forEach((rx, idx) => {
            if (!rx || typeof rx !== 'object') return;
            activePreset.regexScripts.push({
              id: rx.id || ('rx_preset_' + Date.now() + '_' + idx),
              scriptName: rx.scriptName || rx.name || ('预设正则 ' + (idx + 1)),
              findRegex: rx.findRegex || rx.find_regex || '',
              replaceString: rx.replaceString ?? rx.replace_string ?? '',
              trimStrings: Array.isArray(rx.trimStrings) ? rx.trimStrings : [],
              placement: Array.isArray(rx.placement) ? rx.placement : [1, 2],
              disabled: Boolean(rx.disabled),
              markdownOnly: rx.markdownOnly !== undefined ? Boolean(rx.markdownOnly) : true,
              promptOnly: Boolean(rx.promptOnly),
              runOnEdit: rx.runOnEdit !== undefined ? Boolean(rx.runOnEdit) : true,
              substituteRegex: Number(rx.substituteRegex || 0),
              minDepth: rx.minDepth ?? null,
              maxDepth: rx.maxDepth ?? null,
              scope: 'preset'
            });
            rxAdded++;
          });
          continue;
        }
        const preset = parsePresetFromRaw(raw, file.name);
        if (Array.isArray(preset.regexScripts)) rxAdded += preset.regexScripts.length;
        tavernState.presets.unshift(preset);
        tavernState.activePresetId = preset.id;
        count++;
      } catch (err) {
        console.error('Preset import error:', file.name, err);
      }
    }
    if (count > 0 || rxAdded > 0) {
      await saveTavernStore();
      refreshOpenDrawerOnly();
      renderTavernChatFloors(false);
      if (count > 0 && rxAdded > 0) {
        showTavernToast('成功导入预设并提取 ' + rxAdded + ' 条配套正则');
      } else if (rxAdded > 0) {
        showTavernToast('已为当前预设绑定 ' + rxAdded + ' 条配套正则');
      } else {
        showTavernToast('成功导入并启用 ' + count + ' 个预设');
      }
    }
  }

  async function handleBatchImportThemes(files) {
    let count = 0;
    for (const file of files) {
      try {
        const text = await file.text();
        if (file.name.toLowerCase().endsWith('.css')) {
          const newTheme = {
            ...JSON.parse(JSON.stringify(DEFAULT_GOUSU_THEME)),
            id: 'theme_' + Date.now() + '_' + count,
            name: file.name.replace(/\.css$/i, ''),
            custom_css: text
          };
          tavernState.themes.unshift(newTheme);
          tavernState.activeThemeId = newTheme.id;
          count++;
        } else {
          const raw = JSON.parse(text);
          const newTheme = {
            ...JSON.parse(JSON.stringify(DEFAULT_GOUSU_THEME)),
            ...raw,
            id: 'theme_' + Date.now() + '_' + count,
            name: raw.name || file.name.replace(/\.json$/i, '')
          };
          tavernState.themes.unshift(newTheme);
          tavernState.activeThemeId = newTheme.id;
          count++;
        }
      } catch (err) {
        console.error('Theme import error:', file.name, err);
      }
    }
    if (count > 0) {
      await saveTavernStore();
      applyActiveTavernTheme();
      refreshOpenDrawerOnly();
      showTavernToast('成功导入并应用美化主题');
    }
  }

  async function handleBatchImportPlugins(files) {
    let count = 0;
    const jsFiles = [];
    const htmlFiles = [];
    const cssFiles = [];
    let manifestObj = null;

    for (const file of files) {
      try {
        const lower = file.name.toLowerCase();
        const text = await file.text();
        if (lower === 'manifest.json') {
          manifestObj = JSON.parse(text);
        } else if (lower.endsWith('.js')) {
          jsFiles.push({ name: file.name, text });
        } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
          htmlFiles.push({ name: file.name, text });
        } else if (lower.endsWith('.css')) {
          cssFiles.push({ name: file.name, text });
        } else if (lower.endsWith('.json')) {
          const raw = JSON.parse(text);
          if (raw.findRegex || Array.isArray(raw.regex_scripts) || (Array.isArray(raw) && raw[0]?.findRegex)) {
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw.regex_scripts) ? raw.regex_scripts : [raw]);
            const normalized = normalizeRegexList(list, 'global');
            tavernState.globalRegexScripts.unshift(...normalized);
            showTavernToast('已自动识别并导入 ' + normalized.length + ' 条正则脚本');
          } else {
            const scriptItems = Array.isArray(raw.scripts)
              ? raw.scripts
              : (Array.isArray(raw) ? raw : [raw]);
            for (const item of scriptItems) {
              if (!item || typeof item !== 'object') continue;
              const itemName = item.name || item.display_name || item.title || file.name.replace(/\.json$/i, '');
              const itemCode = item.content || item.code || item.script || item.value || (item.data && (item.data.content || item.data.script)) || '';
              const itemBtns = (item.buttons && Array.isArray(item.buttons.buttons))
                ? item.buttons.buttons
                : (Array.isArray(item.buttons) ? item.buttons : []);
              const existingIdx = (tavernState.plugins || []).findIndex(x => x && x.name === itemName);
              const plugin = {
                id: existingIdx >= 0 ? tavernState.plugins[existingIdx].id : ('plugin_' + Date.now() + '_' + count),
                name: itemName,
                enabled: item.enabled !== false,
                code: itemCode,
                uiHtml: item.uiHtml || item.html || extractEmbeddedHtmlFromPluginCode(itemCode),
                buttons: itemBtns,
                description: item.info || item.description || '酒馆助手与扩展脚本'
              };
              if (existingIdx >= 0) {
                tavernState.plugins[existingIdx] = plugin;
              } else {
                tavernState.plugins.push(plugin);
              }
              if (plugin.code) executeUserPluginScript(plugin);
              count++;
            }
          }
        }
      } catch (err) {
        console.error('Plugin file parse error:', file.name, err);
      }
    }

    if (jsFiles.length > 0 || htmlFiles.length > 0) {
      if (manifestObj || htmlFiles.length > 0 || cssFiles.length > 0 || jsFiles.length > 1) {
        const combinedCss = cssFiles.map(c => c.text).join('\n');
        const combinedHtml = htmlFiles.map(h => h.text).join('\n');
        let combinedJs = jsFiles.map(j => `/* ${j.name} */\n` + j.text).join('\n;\n');
        if (combinedCss) {
          combinedJs = `try{const s=document.createElement('style');s.textContent=${JSON.stringify(combinedCss)};document.head.appendChild(s);}catch(_){}\n` + combinedJs;
        }
        const plugin = {
          id: 'plugin_' + Date.now() + '_' + count,
          name: (manifestObj && (manifestObj.display_name || manifestObj.name)) || (jsFiles[0]?.name.replace(/\.js$/i, '')) || (htmlFiles[0]?.name.replace(/\.html?$/i, '')) || '多文件组合插件',
          enabled: true,
          code: combinedJs,
          uiHtml: combinedHtml || extractEmbeddedHtmlFromPluginCode(combinedJs),
          description: (manifestObj && manifestObj.description) || `多文件组合插件 含${jsFiles.length}个脚本`
        };
        tavernState.plugins.push(plugin);
        executeUserPluginScript(plugin);
        count++;
      } else {
        for (const jf of jsFiles) {
          const plugin = {
            id: 'plugin_' + Date.now() + '_' + count,
            name: jf.name.replace(/\.js$/i, ''),
            enabled: true,
            code: jf.text,
            uiHtml: extractEmbeddedHtmlFromPluginCode(jf.text),
            description: '外部导入JS插件脚本'
          };
          tavernState.plugins.push(plugin);
          executeUserPluginScript(plugin);
          count++;
        }
      }
    }

    if (count > 0) {
      await saveTavernStore();
      renderTavernShell();
      showTavernToast('成功装载并激活 ' + count + ' 个酒馆插件');
    }
  }

  async function handleBatchImportChats(files) {
    const card = getActiveCard();
    let count = 0;
    for (const file of files) {
      try {
        const text = await file.text();
        let messages = [];
        if (file.name.toLowerCase().endsWith('.jsonl')) {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          lines.forEach((line, idx) => {
            const obj = JSON.parse(line);
            if (idx === 0 && (obj.chat_metadata || obj.user_name)) return;
            if (obj.mes !== undefined) {
              messages.push({
                mesid: messages.length,
                name: obj.name || (obj.is_user ? getUserDisplayName() : card.name),
                is_user: Boolean(obj.is_user),
                is_system: Boolean(obj.is_system),
                send_date: obj.send_date || Date.now(),
                mes: obj.mes,
                swipes: Array.isArray(obj.swipes) && obj.swipes.length > 0 ? obj.swipes : [obj.mes],
                swipe_id: Number(obj.swipe_id || 0),
                reasoning: obj.extra?.reasoning || '',
                gen_time: '',
                token_count: estimateTokens(obj.mes)
              });
            }
          });
        } else {
          const raw = JSON.parse(text);
          const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.messages) ? raw.messages : []);
          messages = arr.map((m, i) => ({
            mesid: i,
            name: m.name || (m.is_user ? getUserDisplayName() : card.name),
            is_user: Boolean(m.is_user),
            is_system: Boolean(m.is_system),
            send_date: m.send_date || Date.now(),
            mes: m.mes || m.content || '',
            swipes: Array.isArray(m.swipes) && m.swipes.length > 0 ? m.swipes : [m.mes || m.content || ''],
            swipe_id: Number(m.swipe_id || 0),
            reasoning: m.reasoning || '',
            gen_time: m.gen_time || '',
            token_count: estimateTokens(m.mes || m.content || '')
          }));
        }

        if (messages.length > 0) {
          const newSess = {
            cardId: card.id,
            chatId: 'chat_' + card.id + '_' + Date.now() + '_' + count,
            title: file.name.replace(/\.(jsonl|json)$/i, ''),
            createdAt: Date.now(),
            metadata: {},
            messages
          };
          if (!Array.isArray(tavernState.chatArchivesByCardId[card.id])) {
            tavernState.chatArchivesByCardId[card.id] = [];
          }
          tavernState.chatArchivesByCardId[card.id].unshift(newSess);
          tavernState.chatsByCardId[card.id] = newSess;
          count++;
        }
      } catch (err) {
        console.error('Chat import error:', file.name, err);
      }
    }
    if (count > 0) {
      uiRuntime.openDrawerKey = null;
      await saveTavernStore();
      renderTavernShell();
      showTavernToast('成功导入并载入 ' + count + ' 份聊天记录');
    }
  }

  // ============================================================================
  // 14. Initialize Tavern App & Hook Desktop Entry
  // ============================================================================
  function stopAllTavernAudioAndMedia() {
    try {
      if (window.__tavernActiveAudioSet) {
        window.__tavernActiveAudioSet.forEach(a => {
          try {
            if (a && typeof a.pause === 'function') {
              a.pause();
              a.currentTime = 0;
            }
          } catch (_) {}
        });
      }
      const screenEl = document.getElementById('game-hall-screen');
      if (screenEl) {
        screenEl.querySelectorAll('audio, video').forEach(m => {
          try {
            m.pause();
            m.currentTime = 0;
          } catch (_) {}
        });
        screenEl.querySelectorAll('iframe.tavern-html-sandbox-frame').forEach(frame => {
          try {
            const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
            if (doc) {
              doc.querySelectorAll('audio, video').forEach(m => {
                try {
                  m.pause();
                  m.currentTime = 0;
                } catch (_) {}
              });
            }
          } catch (_) {}
        });
      }
      document.querySelectorAll('[id^="gourmet-fixed-"] audio, [id^="gourmet-fixed-"] video, #adv-codex-panel audio, #adv-codex-panel video').forEach(m => {
        try {
          m.pause();
          m.currentTime = 0;
        } catch (_) {}
      });
    } catch (_) {}
  }

  let hasRenderedTavernOnOpen = false;

  function isTavernActive() {
    const screenEl = document.getElementById('game-hall-screen');
    return Boolean(screenEl && screenEl.classList.contains('active'));
  }

  function setupTavernScreenVisibilityObserver() {
    const screenEl = document.getElementById('game-hall-screen');
    if (!screenEl || screenEl._tavernVisibilityObserved) return;
    screenEl._tavernVisibilityObserved = true;
    const obs = new MutationObserver(() => {
      applyActiveTavernTheme();
      const isTavernVisible = screenEl.classList.contains('active');
      const bbiHost = document.getElementById('bbi-app-host');
      if (bbiHost) {
        bbiHost.style.display = isTavernVisible ? '' : 'none';
      }
      const paBall = document.getElementById('pa-ball');
      if (paBall && !isTavernVisible) {
        paBall.setAttribute('hidden', 'hidden');
      }
      document.querySelectorAll('[id^="gourmet-fixed-"], #adv-codex-panel, #adv-codex-toggle').forEach(el => {
        if (!isTavernVisible) {
          el.style.display = 'none';
        } else if (el.id === 'gourmet-fixed-ball-ui' || el.id === 'adv-codex-toggle') {
          el.style.display = 'flex';
        }
      });
      if (!isTavernVisible) {
        stopAllTavernAudioAndMedia();
      } else if (!hasRenderedTavernOnOpen) {
        hasRenderedTavernOnOpen = true;
        if (!hasLoadedFromExternalOrIdb || isDefaultStarterOnlyState(tavernState)) {
          loadTavernStore().then(() => {
            if (isTavernActive()) renderTavernShell();
          });
        } else {
          renderTavernShell();
        }
      }
    });
    obs.observe(screenEl, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  window.exitTavernToHome = function () {
    uiRuntime.openDrawerKey = null;
    uiRuntime.activeHelperScriptId = null;
    uiRuntime.activePluginModalId = null;
    uiRuntime.showOptionsPopup = false;
    uiRuntime.showExtensionsPopup = false;
    stopAllTavernAudioAndMedia();
    const themeStyle = document.getElementById('tavern-custom-theme-style');
    if (themeStyle) themeStyle.textContent = '';
    const bbiHost = document.getElementById('bbi-app-host');
    if (bbiHost) bbiHost.style.display = 'none';
    const paRoot = document.getElementById('pa-root');
    if (paRoot) paRoot.setAttribute('hidden', 'hidden');
    const paBall = document.getElementById('pa-ball');
    if (paBall) paBall.setAttribute('hidden', 'hidden');
    document.querySelectorAll('[id^="gourmet-fixed-"], #adv-codex-panel, #adv-codex-toggle').forEach(el => {
      el.style.display = 'none';
    });
    if (typeof window.showScreen === 'function') {
      window.showScreen('home-screen');
    } else {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('home-screen')?.classList.add('active');
    }
  };

  let lastTavernSubBackTs = 0;

  window.handleTavernMobileBack = function () {
    const now = Date.now();
    const markSubLayerClosed = () => {
      lastTavernSubBackTs = Date.now();
      if (typeof window.pushMobileBackGuard === 'function') {
        window.pushMobileBackGuard('tavern_keep');
      }
      return true;
    };

    // 0. Check third-party plugin modals / overlays appended to document.body (e.g. Burnt-chicken-wings, book-excerpt, st-memory, custom extensions)
    const paSheet = document.querySelector('#pa-root:not([hidden]) .pa-sheet-mask:not(.pa-out)');
    if (paSheet) {
      const sheetClose = paSheet.querySelector('.pa-close, [data-act="close"], [data-act="cancel"]');
      if (sheetClose) sheetClose.click();
      else paSheet.remove();
      return markSubLayerClosed();
    }
    const paRootEl = document.getElementById('pa-root');
    if (paRootEl && !paRootEl.hasAttribute('hidden')) {
      const paCloseBtn = paRootEl.querySelector('#pa-close');
      if (paCloseBtn) paCloseBtn.click();
      else paRootEl.setAttribute('hidden', 'hidden');
      return markSubLayerClosed();
    }
    const bodyPluginSelectors = [
      '.be-modal-overlay', '.be-overlay', '#be-notebook-modal', '#be-modal', '#be-card-modal', '.be-popup',
      '#st-memory-modal', '.st-memory-modal', '.memory-modal-overlay',
      '#bbs-app-host'
    ];
    for (const sel of bodyPluginSelectors) {
      const nodes = Array.from(document.querySelectorAll(sel));
      for (const node of nodes) {
        if (!node) continue;
        if (node.id === 'bbs-app-host' && node.shadowRoot) {
          const bbsClose = node.shadowRoot.querySelector('.bbs-close, [data-action="close"], .modal-close, .close-btn');
          const bbsVisible = node.shadowRoot.querySelector('.bbs-overlay.active, .bbs-modal.open, .bbs-modal.active, .bbs-backdrop:not([style*="display: none"])');
          if (bbsVisible && bbsClose) {
            bbsClose.click();
            return markSubLayerClosed();
          }
          continue;
        }
        const cs = window.getComputedStyle(node);
        if (cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.05) {
          const closeBtn = node.querySelector('.be-close, .be-modal-close, .close-btn, .modal-close, [data-action="close"], button[title*="关闭"], button[aria-label*="Close"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            node.style.display = 'none';
            node.classList.remove('active', 'open', 'visible');
          }
          return markSubLayerClosed();
        }
      }
    }

    // 1. Check BaiBai Shadow DOM modal
    const bbiHost = document.getElementById('bbi-app-host');
    if (bbiHost && bbiHost.shadowRoot) {
      const bbiClose = bbiHost.shadowRoot.querySelector('.bbi-close, [data-action="close"], .modal-close, .close-btn');
      const bbiVisibleOverlay = bbiHost.shadowRoot.querySelector('.bbi-overlay.active, .bbi-modal.open, .bbi-modal.active, .bbi-backdrop:not([style*="display: none"])');
      if (bbiVisibleOverlay && bbiClose) {
        bbiClose.click();
        return markSubLayerClosed();
      }
    }
    // 2. Check Tavern helper script or plugin modal
    const modalBackdrop = document.querySelector('#tavern-stage-root > .tavern-modal-backdrop');
    if (modalBackdrop || uiRuntime.activeHelperScriptId || uiRuntime.activePluginModalId) {
      uiRuntime.activeHelperScriptId = null;
      uiRuntime.activePluginModalId = null;
      if (modalBackdrop) {
        modalBackdrop.querySelectorAll('audio, video').forEach(m => { try { m.pause(); } catch (_) {} });
        modalBackdrop.remove();
      }
      return markSubLayerClosed();
    }
    // 3. Check floating card helper panels (e.g. gourmet-fixed-panel-ui, adv-codex-panel)
    for (const panelId of ['gourmet-fixed-panel-ui', 'adv-codex-panel']) {
      const panelEl = document.getElementById(panelId);
      if (panelEl && panelEl.style.display !== 'none' && getComputedStyle(panelEl).display !== 'none') {
        panelEl.style.display = 'none';
        return markSubLayerClosed();
      }
    }
    // 4. Check sub-panels / inline editors inside an open top dropdown drawer before closing the drawer itself
    const drawerHost = document.getElementById('tavern-drawer-host');
    if ((drawerHost && drawerHost.classList.contains('active')) || uiRuntime.openDrawerKey) {
      if (uiRuntime.showDebugConsole) {
        uiRuntime.showDebugConsole = false;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      if (uiRuntime.editingPromptId) {
        uiRuntime.editingPromptId = null;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      if (uiRuntime.showAdvancedSamplers) {
        uiRuntime.showAdvancedSamplers = false;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      if (uiRuntime.editingWorldEntryUid !== null && uiRuntime.editingWorldEntryUid !== undefined) {
        uiRuntime.editingWorldEntryUid = null;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      if (uiRuntime.showAdvancedWorldBookSettings) {
        uiRuntime.showAdvancedWorldBookSettings = false;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      if (uiRuntime.editingRegexId) {
        uiRuntime.editingRegexId = null;
        refreshOpenDrawerOnly();
        return markSubLayerClosed();
      }
      uiRuntime.openDrawerKey = null;
      refreshOpenDrawerOnly();
      return markSubLayerClosed();
    }
    // 5. Check floor inline editor or floor extra menu
    if (uiRuntime.editingFloorMesId !== null && uiRuntime.editingFloorMesId !== undefined) {
      const prevEditId = uiRuntime.editingFloorMesId;
      uiRuntime.editingFloorMesId = null;
      uiRuntime.editingFloorReasoning = false;
      appendOrUpdateSingleFloorDom(prevEditId);
      return markSubLayerClosed();
    }
    if (uiRuntime.openExtraMenuMesId !== null && uiRuntime.openExtraMenuMesId !== undefined) {
      const prevMenuId = uiRuntime.openExtraMenuMesId;
      uiRuntime.openExtraMenuMesId = null;
      appendOrUpdateSingleFloorDom(prevMenuId);
      return markSubLayerClosed();
    }
    // 6. Check bottom popups (#options / #extensionsMenu)
    if (uiRuntime.showOptionsPopup || uiRuntime.showExtensionsPopup) {
      uiRuntime.showOptionsPopup = false;
      uiRuntime.showExtensionsPopup = false;
      refreshBottomPopupsOnly();
      return markSubLayerClosed();
    }
    // 7. Cooldown guard: prevent rapid double-swipe from immediately exiting Tavern right after closing a sub-layer
    if (now - lastTavernSubBackTs < 650) {
      return markSubLayerClosed();
    }
    // 8. Otherwise, exit Tavern back to the phone home screen
    window.exitTavernToHome();
    return true;
  };

  async function initTavernApp() {
    setupSillyTavernGlobalBridge();
    setupTavernScreenVisibilityObserver();
    await loadTavernStore();
    syncBuiltInD100Pool(false);
    // Do NOT render Tavern floors, iframes, or card helper scripts until the user actually opens the Tavern screen
    if (isTavernActive()) {
      hasRenderedTavernOnOpen = true;
      renderTavernShell();
      await tavernEventSource.emit(TAVERN_EVENT_TYPES.APP_READY);
    }
  }

  window.openTavernApp = async function () {
    hasRenderedTavernOnOpen = true;
    if (typeof window.showScreen === 'function') {
      window.showScreen('game-hall-screen');
    } else {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('game-hall-screen')?.classList.add('active');
    }
    if (!hasLoadedFromExternalOrIdb || isDefaultStarterOnlyState(tavernState) || inflightTavernLoadPromise) {
      await loadTavernStore();
    }
    renderTavernShell();
    tavernEventSource.emit(TAVERN_EVENT_TYPES.APP_READY);
  };

  window.getTavernLiveInspectionData = function (targetType, targetIdOrName) {
    const activeCard = getActiveCard();
    const activePreset = getActivePreset();
    const activeSess = getActiveChatSession();
    const cardsSummary = (tavernState.cards || []).map(c => ({
      id: c.id,
      name: c.name,
      isActive: c.id === activeCard?.id,
      greetingCount: 1 + (c.alternate_greetings?.length || 0),
      regexCount: (c.regexScripts || []).length,
      worldBookId: c.worldBookId || ''
    }));
    const presetsSummary = (tavernState.presets || []).map(p => ({
      id: p.id,
      name: p.name,
      isActive: p.id === activePreset?.id,
      promptCount: (p.prompts || []).length,
      stream: Boolean(p.stream_openai)
    }));
    const worldBooksSummary = (tavernState.worldBooks || []).map(wb => ({
      id: wb.id,
      name: wb.name,
      enabled: Boolean(wb.enabled),
      entryCount: (wb.entries || []).length
    }));

    let detailText = '';
    if (targetType === 'tavern_card') {
      const card = (tavernState.cards || []).find(c => c.id === targetIdOrName || c.name === targetIdOrName) || activeCard;
      if (card) {
        const wb = (tavernState.worldBooks || []).find(b => b.id === card.worldBookId);
        detailText = [
          `【已授权读取的酒馆角色卡: ${card.name}】`,
          `- 角色描述: ${(card.description || '无').slice(0, 1200)}`,
          `- 性格特征: ${(card.personality || '无').slice(0, 400)}`,
          `- 场景设定: ${(card.scenario || '无').slice(0, 500)}`,
          `- 作者注释与说明: ${(card.creator_notes || '无').slice(0, 600)}`,
          `- 主开场白摘要: ${(card.first_mes || '无').slice(0, 800)}`,
          `- 额外多开场白数: ${(card.alternate_greetings || []).length}个`,
          `- 专属正则脚本: ${(card.regexScripts || []).map(r => r.scriptName + (r.disabled ? '[已关]' : '[已开]')).join('、') || '无'}`,
          `- 绑定世界书: ${wb ? `${wb.name} 共${(wb.entries || []).length}条词条` : '未单独绑定'}`,
          `- 当前聊天记录层数: ${(activeSess?.messages || []).length}层`
        ].join('\n');
      }
    } else if (targetType === 'tavern_preset') {
      const p = (tavernState.presets || []).find(x => x.id === targetIdOrName || x.name === targetIdOrName) || activePreset;
      if (p) {
        const enabledItems = (p.prompts || []).filter(i => i.enabled).map(i => stripUiEmojis(i.name || i.identifier));
        const disabledItems = (p.prompts || []).filter(i => !i.enabled).map(i => stripUiEmojis(i.name || i.identifier));
        detailText = [
          `【已授权读取的酒馆预设: ${p.name}】`,
          `- 流式输出: ${p.stream_openai ? '已开启' : '未开启'} | 温度:${p.temperature} | 最大上下文:${p.openai_max_context} | 最大回复:${p.openai_max_tokens}`,
          `- 已启用条目(${enabledItems.length}项): ${enabledItems.slice(0, 35).join('、')}`,
          `- 未启用条目(${disabledItems.length}项): ${disabledItems.slice(0, 25).join('、')}`
        ].join('\n');
      }
    } else if (targetType === 'tavern_worldbook') {
      const wb = (tavernState.worldBooks || []).find(x => x.id === targetIdOrName || x.name === targetIdOrName) || (tavernState.worldBooks || [])[0];
      if (wb) {
        const entryLines = (wb.entries || []).slice(0, 40).map(e => `${stripUiEmojis(e.comment || e.uid)}[${e.disable ? '关' : (e.constant ? '蓝灯常驻' : '绿灯关键:' + (e.keys || []).slice(0, 3).join(','))}]`);
        detailText = [
          `【已授权读取的酒馆世界书: ${wb.name}】`,
          `- 状态: ${wb.enabled ? '全局启用' : '未全局启用'} | 扫描深度:${wb.scanDepth || 4} | 词条总数:${(wb.entries || []).length}`,
          `- 词条列表摘要: ${entryLines.join('；')}`
        ].join('\n');
      }
    }

    return {
      activeDrawerKey: uiRuntime.openDrawerKey,
      activeCardName: activeCard ? activeCard.name : '未选择',
      activePresetName: activePreset ? activePreset.name : '标准酒馆预设',
      cardsSummary,
      presetsSummary,
      worldBooksSummary,
      detailText
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTavernApp();
    });
  } else {
    initTavernApp();
  }
})();
