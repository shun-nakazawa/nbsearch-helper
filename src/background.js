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

function search(nb, meme) {
  const url = `${nb.url}?search=${meme}`;
  chrome.tabs.create({url});
}

chrome.contextMenus.onClicked.addListener((info) => {
  const id = info.menuItemId.toString();

  chrome.storage.sync.get({searchers: []}, ({searchers}) => {
    const searcher = searchers.find(searcher => searcher.name === id);
    if (!searcher) return;

    let meme = null;
    if (info.linkUrl) {
      const parts = info.linkUrl.split('/');
      if (parts.length) {
        meme = parts.pop();
      }
    } else if (info.selectionText) {
      meme = info.selectionText;
      if (meme.startsWith('#')) {
        meme = meme.substr(1);
      }
    }

    if (isMeme(meme)) {
      search(searcher, meme);
    }
  });
});