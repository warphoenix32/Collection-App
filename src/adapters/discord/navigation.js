(() => {
  const DCE = globalThis.DCE;
  let navigationObserver = null;
  let navigationRefreshTimer = null;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function currentLocationIds() {
    const match = location.pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/);
    return match ? { serverId: match[1] === "@me" ? null : match[1], channelId: match[2], isDirect: match[1] === "@me" } : null;
  }

  function canonicalConversationUrl(url = location.href) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'channels' && parts.length >= 4 && /^\d+$/.test(parts[3])) {
        parsed.pathname = `/${parts.slice(0, 3).join('/')}`;
        parsed.search = '';
        parsed.hash = '';
      }
      return parsed.toString();
    } catch (_) { return url; }
  }

  function currentConversationName() {
    const candidates = [document.querySelector('main h1')?.textContent, document.querySelector('header h1')?.textContent,
      document.querySelector('[class*="titleWrapper"] [class*="title"]')?.textContent,
      document.querySelector('[aria-label*="Direct Messages"] [aria-selected="true"]')?.textContent,
      document.title?.replace(/\s*[-|]\s*Discord.*$/i, '')];
    return candidates.map(v => v?.replace(/\s+/g, ' ').trim()).find(Boolean) || 'Current conversation';
  }

  function describeCurrentConversation(target = null) {
    const ids = currentLocationIds();
    const direct = ids?.isDirect || location.pathname.startsWith('/channels/@me/');
    const title = currentConversationName();
    const participantHints = document.querySelectorAll('[aria-label*="members" i] [role="listitem"], [class*="privateChannels"] [aria-selected="true"] [class*="avatar"]').length;
    const isGroupDirect = direct && (participantHints > 2 || /,/.test(title));
    const isForumPost = !direct && Boolean(document.querySelector('[class*="forumPost"], [class*="container"] [class*="tags"]'));
    const conversationType = isGroupDirect ? 'group-direct-message' : (direct ? 'direct-message' : (isForumPost ? 'forum-post' : 'channel'));
    return { acquisitionStrategy: target ? 'navigate' : 'current', type: conversationType, url: location.href,
      workspace: direct ? null : { id: target?.serverId || ids?.serverId || null, name: target?.serverName || null, type: 'server' },
      conversation: { id: target?.channelId || ids?.channelId || null, name: target?.channelName || currentConversationName(), type: conversationType },
      platformMetadata: { discordPath: location.pathname } };
  }

  async function updateNavigationCache() {
    const cache = await DCE.cache.readNavigationCache(); const servers = DCE.discord.discovery.scanServers(); const current = currentLocationIds();
    if (servers.length) cache.servers = servers;
    if (current?.serverId) { const channels = DCE.discord.discovery.scanChannels(current.serverId); if (channels.length) cache.channelsByServer[current.serverId] = channels; }
    cache.current = current; cache.updatedAt = new Date().toISOString(); return DCE.cache.writeNavigationCache(cache);
  }
  function scheduleNavigationCacheRefresh() { clearTimeout(navigationRefreshTimer); navigationRefreshTimer = setTimeout(() => updateNavigationCache().catch(e => console.warn('Navigation cache update failed:', e)), DCE.config.navigationRefreshDebounceMs); }
  function startNavigationObserver() { if (navigationObserver) return; navigationObserver = new MutationObserver(scheduleNavigationCacheRefresh); navigationObserver.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-list-item-id','data-dnd-name','aria-label','aria-selected','href']}); window.addEventListener('popstate',scheduleNavigationCacheRefresh); scheduleNavigationCacheRefresh(); }

  function waitForCondition(predicate, timeoutMs = 15000, intervalMs = DCE.config.waitIntervalMs) {
    return new Promise((resolve,reject)=>{ const started=Date.now(); const timer=setInterval(()=>{ try { const value=predicate(); if(value){clearInterval(timer);resolve(value);return;} if(Date.now()-started>=timeoutMs){clearInterval(timer);reject(new Error('Timed out waiting for Discord to render the requested view.'));} } catch(e){clearInterval(timer);reject(e);} },intervalMs); });
  }

  function pathMatches(url) {
    const target = url.match(/\/channels\/(\d+|@me)\/(\d+)/); const current = currentLocationIds();
    return Boolean(current && target && (target[1] === '@me' ? current.isDirect : current.serverId === target[1]) && current.channelId === target[2]);
  }

  async function attemptNavigation(url, attempt) {
    if (attempt === 0) {
      const anchor = Array.from(document.querySelectorAll('a[href]')).find(a => new URL(a.href, location.origin).href === url || a.getAttribute('href') === new URL(url).pathname);
      if (anchor) anchor.click(); else { history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); }
    } else {
      history.replaceState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate'));
    }
    await waitForCondition(() => pathMatches(url), DCE.config.navigationPathTimeoutMs);
    await waitForCondition(() => document.querySelector(DCE.discord.selectors.message), DCE.config.messageRenderTimeoutMs);
  }

  async function navigateWithinDiscord(url) {
    if (pathMatches(url) && document.querySelector(DCE.discord.selectors.message)) return;
    let lastError;
    for (let attempt=0; attempt<DCE.config.navigationRetryCount; attempt+=1) {
      try { await attemptNavigation(url, attempt); scheduleNavigationCacheRefresh(); return; }
      catch (error) { lastError=error; DCE.logger.warn('navigation.retry',{attempt:attempt+1,url,error:error.message}); await sleep(DCE.config.navigationRetryDelayMs*(attempt+1)); }
    }
    throw new Error(`${lastError?.message || 'Navigation failed'} after ${DCE.config.navigationRetryCount} attempts.`);
  }

  DCE.discord.navigation = { currentLocationIds, canonicalConversationUrl, describeCurrentConversation, updateNavigationCache, scheduleNavigationCacheRefresh, startNavigationObserver, navigateWithinDiscord };
})();
