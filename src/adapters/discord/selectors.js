(() => {
  const DCE = globalThis.DCE;
  DCE.discord = DCE.discord || {};
  DCE.discord.selectors = Object.freeze({
    message: '[id^="chat-messages-"]',
    serverTreeItem: '[role="treeitem"][data-list-item-id^="guildsnav___"]',
    channelAnchor: 'a[data-list-item-id^="channels___"]',
    topologyNode: '[data-list-item-id^="channels___"]',
    categoryToggle: '[data-list-item-id^="channels___"][role="button"][aria-expanded], [class*="containerDefault"] [role="button"][aria-expanded]',
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
