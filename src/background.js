const uuidRegexp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
let selectedNBCellMeme = null;


/**
 * Create Context Menu
 */

function createContextMenus() {
  chrome.storage.sync.get({searchers: []}, ({searchers}) => {
    console.log(searchers);
    chrome.contextMenus.removeAll();
    for (const searcher of searchers) {
      chrome.contextMenus.create({
        id: `${searcher.name}`,
        title: searcher.name,
        contexts: ['all']
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && Object.keys(changes).includes('searchers')) {
    createContextMenus();
  }
});


/**
 * Context Menu Event
 */

function isMeme(meme) {
  return uuidRegexp.test(meme);
}

function searchMeme(searcher, meme) {
  const url = `${searcher.url}?meme=${meme}`;
  chrome.tabs.create({url});
}

function searchText(searcher, text) {
  const url = `${searcher.url}?q=${encodeURIComponent(text)}`;
  chrome.tabs.create({url});
}

chrome.contextMenus.onClicked.addListener((info) => {
  const id = info.menuItemId.toString();

  chrome.storage.sync.get({searchers: []}, ({searchers}) => {
    const searcher = searchers.find(searcher => searcher.name === id);
    if (!searcher) return;

    const linkUrl = info.linkUrl ? info.linkUrl.trim() : '';
    const selectionText = info.selectionText ? info.selectionText.trim() : '';

    if (linkUrl) {
      const parts = linkUrl.split('/');
      if (parts.length && isMeme(parts[parts.length - 1])) {
        searchMeme(searcher, parts[parts.length - 1]);
      } else {
        searchText(searcher, linkUrl);
      }
    } else if (selectionText) {
      if (selectionText.startsWith('#') && isMeme(selectionText.substr(1))) {
        searchMeme(searcher, selectionText.substr(1));
      } else if (isMeme(selectionText)) {
        searchMeme(searcher, selectionText);
      } else {
        searchText(searcher, selectionText);
      }
    } else if (selectedNBCellMeme) {
      searchMeme(searcher, selectedNBCellMeme);
    }
  });
});


/**
 * Synchronize Selected Jupyter Notebook Cell
 */

chrome.runtime.onMessage.addListener(message => {
  if (message.request === "updateSelectedNBCell") {
    selectedNBCellMeme = message.meme;
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.sendMessage(activeInfo.tabId, {
    request: 'getSelectedNBCell'
  });
});
