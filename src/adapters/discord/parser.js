(() => {
  const DCE = globalThis.DCE;
  const S = DCE.discord.selectors;

  function getHeader(messageElement) {
    return messageElement.querySelector('h3[aria-labelledby*="message-username"]') ||
      messageElement.querySelector(S.username)?.closest("h3") || null;
  }

  function extractUserId(messageElement) {
    const header = getHeader(messageElement);
    const avatar = header?.parentElement?.querySelector(':scope > img[src*="/avatars/"], :scope > img[src*="/users/"][src*="/avatars/"]') ||
      messageElement.querySelector(':scope > div > img[src*="/avatars/"], :scope > div > img[src*="/users/"][src*="/avatars/"]');
    if (!avatar?.src) return null;
    for (const pattern of [/\/avatars\/(\d+)\//, /\/users\/(\d+)\/avatars\//]) {
      const match = avatar.src.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  const ROLE_SUFFIX_PATTERNS = [
    /\b(?:Original Poster|Council Member|Battle Tested|Star Atlas Team|The Vantarah|I'm new here, say hi!)\b.*$/i,
    /\b[A-Z][A-Za-z0-9'’._ -]{1,40}\s+Ring holder\s*$/i
  ];

  function cleanDisplayName(value) {
    let name = String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/,?\s*Server Tag:.*$/i, "")
      .replace(/\s+/g, " ").trim();
    for (const pattern of ROLE_SUFFIX_PATTERNS) name = name.replace(pattern, "").trim();
    return name || null;
  }

  function getDisplayName(messageElement) {
    const header = getHeader(messageElement);
    if (!header) return null;
    const node = header.querySelector(S.usernameEffects) || header.querySelector(S.username);
    if (!node) return null;
    const directText = Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(" ").trim();
    return cleanDisplayName(directText || node.getAttribute("data-username-with-effects") || node.getAttribute("aria-label") || node.textContent);
  }

  function cleanReplyPreview(value) {
    let preview = String(value || "")
      .replace(/\(edited\)/ig, "")
      .replace(/,?\s*Server Tag:\s*[^\n]+/ig, "")
      .replace(/\bClick to see (?:attachment|sticker|image|video|GIF)\b/ig, "")
      .replace(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+(?:AM|PM)/ig, "")
      .replace(/\s+/g, " ").trim();
    return preview || null;
  }

  function parseReply(messageElement) {
    const replyContainer = messageElement.querySelector(S.replyPrimary) || messageElement.querySelector(S.replyFallback);
    if (!replyContainer) return { preview: null, messageId: null };
    const reference = replyContainer.querySelector('[data-list-item-id*="chat-messages"], [href*="/channels/"]');
    const href = reference?.getAttribute("href") || "";
    const idMatch = href.match(/\/(\d+)(?:\?.*)?$/) || (reference?.id || "").match(/(\d{10,})$/);
    const previewNode = replyContainer.querySelector(S.messageContent);
    const preview = cleanReplyPreview(previewNode?.innerText || replyContainer.innerText || "");
    return { preview, messageId: idMatch ? idMatch[1] : null };
  }

  function parseMentions(contentNode) {
    if (!contentNode) return [];
    const seen = new Set();
    return Array.from(contentNode.querySelectorAll(S.mention)).map(node => ({
      originalText: node.textContent?.trim() || "",
      userId: node.getAttribute("data-user-id") || node.getAttribute("data-id") || null
    })).filter(item => item.originalText && !seen.has(`${item.originalText}|${item.userId || ""}`) && seen.add(`${item.originalText}|${item.userId || ""}`));
  }

  function canonicalAttachmentKey(url) {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\/attachments\/(\d+)\/(\d+)\/([^/]+)/);
      if (m) return `discord:${m[1]}:${m[2]}:${m[3]}`;
      return `${u.hostname}${u.pathname}`;
    } catch (_) { return url; }
  }

  function attachmentType(url, mimeType) {
    if (mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|bmp|svg)(?:\?|$)/i.test(url)) return "image";
    if (/\.gif(?:\?|$)/i.test(url)) return "gif";
    if (/\.(mp4|webm|mov)(?:\?|$)/i.test(url)) return "video";
    if (/\.(mp3|wav|ogg|m4a)(?:\?|$)/i.test(url)) return "audio";
    return "document";
  }

  function parseAttachments(messageElement) {
    const accessories = messageElement.querySelector(S.messageAccessories);
    if (!accessories) return [];
    const records = [], seen = new Set();
    for (const node of accessories.querySelectorAll('a[href*="cdn.discordapp.com/attachments/"], a[href*="media.discordapp.net/attachments/"], img[src*="cdn.discordapp.com/attachments/"], img[src*="media.discordapp.net/attachments/"], a[href*="tenor.com/view/"], a[href*="klipy.com/gifs/"]')) {
      const url = node.href || node.src || "";
      if (!url) continue;
      const type = attachmentType(url, node.getAttribute("type"));
      if (["gif", "video", "audio"].includes(type)) continue;
      const key = canonicalAttachmentKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      let filename = null;
      try { filename = decodeURIComponent(new URL(url).pathname.split("/").pop()) || null; } catch (_) {}
      records.push({ attachmentId: null, type, filename, mimeType: node.getAttribute("type") || null, sizeBytes: null, url, availability: "linked", collectionStatus: "metadata-only" });
    }
    return records;
  }

  function cleanContent(contentNode) {
    if (!contentNode) return "";
    const clone = contentNode.cloneNode(true);
    clone.querySelectorAll(`${S.edited}, time, [class*="timestamp"], [class*="edited"]`).forEach(node => node.remove());
    let text = clone.innerText?.trim() || clone.textContent?.trim() || "";
    text = text.replace(/\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+(?:AM|PM)\s*$/i, "").trim();
    return text;
  }

  function detectExcludedMedia(messageElement) {
    if (messageElement.querySelector('video, audio, [class*="sticker"], [aria-label*="sticker" i], [aria-label*="GIF" i]')) return true;
    return false;
  }

  function contentKind(text, attachments, excludedMedia) {
    if (text && attachments.length) return "mixed";
    if (text) return "text";
    if (attachments.length) return "attachment-only";
    if (excludedMedia) return "media-only";
    return "empty";
  }

  function isSystemMessage(messageElement, displayName, userId) {
    if (displayName || userId) return false;
    const text = messageElement.innerText || "";
    return /\b(?:added|removed|left|joined)\b.*\b(?:the group|group)\b/i.test(text);
  }

  function parseMessage(messageElement, inheritedAuthor) {
    const contentNode = messageElement.querySelector(S.messageContent);
    const timestamp = messageElement.querySelector(S.timestamp)?.getAttribute("datetime") || null;
    const explicitDisplayName = getDisplayName(messageElement);
    const explicitUserId = extractUserId(messageElement);
    const system = isSystemMessage(messageElement, explicitDisplayName, explicitUserId);
    const author = system ? { displayName: null, userId: null, inferred: false } : (explicitDisplayName || explicitUserId
      ? { displayName: explicitDisplayName || inheritedAuthor?.displayName || null, userId: explicitUserId || inheritedAuthor?.userId || null, inferred: false }
      : { displayName: inheritedAuthor?.displayName || null, userId: inheritedAuthor?.userId || null, inferred: Boolean(inheritedAuthor) });
    const idMatch = messageElement.id.match(/chat-messages-(?:\d+)-(\d+)/);
    const reply = parseReply(messageElement);
    const content = cleanContent(contentNode);
    const attachments = parseAttachments(messageElement);
    const excludedMedia = detectExcludedMedia(messageElement);
    return {
      messageId: idMatch ? idMatch[1] : messageElement.id || null,
      sourceElementId: messageElement.id || null,
      timestamp, author, content, contentKind: contentKind(content, attachments, excludedMedia), replyTo: reply.preview, replyMessageId: reply.messageId,
      mentions: parseMentions(contentNode), edited: Boolean(messageElement.querySelector(S.edited)) || /\(edited\)/i.test(messageElement.innerText || ""),
      deletedReference: /original message was deleted/i.test(reply.preview || ""), attachments, system
    };
  }

  DCE.discord.parser = { parseMessage };
})();
