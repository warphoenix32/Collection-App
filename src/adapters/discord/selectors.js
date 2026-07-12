(() => {
  const DCE = globalThis.DCE;
  DCE.discord = DCE.discord || {};
  DCE.discord.selectors = Object.freeze({
    message: '[id^="chat-messages-"]',
    serverTreeItem: '[role="treeitem"][data-list-item-id^="guildsnav___"]',
    channelAnchor: 'a[data-list-item-id^="channels___"]',
    messageContent: '[id^="message-content-"]',
    messageAccessories: '[id^="message-accessories-"]',
    username: '[id^="message-username-"]',
    usernameEffects: '[data-username-with-effects]',
    timestamp: 'time[datetime]',
    avatar: 'img[src*="/avatars/"], img[src*="/users/"][src*="/avatars/"]',
    replyPrimary: '[class*="repliedMessage"]',
    replyFallback: '[class*="reply"]',
    mention: '[class*="mention"], [data-user-id]',
    edited: '[class*="edited"]'
  });
})();
