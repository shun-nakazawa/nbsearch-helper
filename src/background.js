const uuidRegexp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function createContextMenus() {
  chrome.storage.sync.get({searchers: []}, ({searchers}) => {
    console.log(searchers);
    chrome.contextMenus.removeAll();
    for (const searcher of searchers) {
      chrome.contextMenus.create({
        id: `${searcher.name}`,
        title: searcher.name,
        contexts: ['link', 'selection']
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

    if (info.linkUrl) {
      const parts = info.linkUrl.split('/');
      if (parts.length && isMeme(parts[parts.length - 1])) {
        searchMeme(searcher, parts[parts.length - 1]);
      } else {
        searchText(searcher, info.linkUrl);
      }
    } else if (info.selectionText) {
      if (info.selectionText.startsWith('#') && isMeme(info.selectionText.substr(1))) {
        searchMeme(searcher, info.selectionText.substr(1));
      } else if (isMeme(info.selectionText)) {
        searchMeme(searcher, info.selectionText);
      } else {
        searchText(searcher, info.selectionText);
      }
    }
  });
});