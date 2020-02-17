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
  return meme && meme.includes('-');
}

function searchMeme(nb, meme) {
  const url = `${nb.url}?meme=${meme}`;
  chrome.tabs.create({url});
}

function searchText(nb, text) {
  const url = `${nb.url}?q=${encodeURIComponent(text)}`;
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
        searchMeme(parts[parts.length - 1]);
      } else {
        searchText(info.linkUrl);
      }
    } else if (info.selectionText) {
      if (info.selectionText.startsWith('#')) {
        searchMeme(info.selectionText.substr(1));
      } else {
        searchText(info.selectionText);
      }
    }
  });
});