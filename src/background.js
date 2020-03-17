const uuidRegexp = /^#?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
let menuItemIdToSearcher = {};
let selectedNBCellMeme = null;
let selectedText = '';
let selectedTextType = 'none';


function showNotification(message, contextMessage) {
  chrome.notifications.create({
    iconUrl: "./icons/48.png",
    message,
    contextMessage,
    title: "nbsearch-helper",
    type: "basic",
  });
}

function isMeme(meme) {
  return uuidRegexp.test(meme);
}

function getLastUrlPath(url) {
  return url.split('?')[0]
    .split('#')[0]
    .split('/').pop();
}


/**
 * Create Context Menu
 */

function updateContextMenus() {
  chrome.storage.sync.get({searchers: {}}, ({searchers}) => {
    chrome.contextMenus.removeAll();

    const {
      byText: byTextSearchers = [],
      byMeme: byMemeSearchers = []
    } = searchers;

    const properties = {
      fromText: {
        parent: {
          id: 'fromText',
          title: 'Search from text',
          contexts: ['all']
        },
        children: []
      },
      fromLink: {
        parent: {
          id: 'fromLink',
          title: 'Search from link',
          contexts: ['link']
        },
        children: []
      },
      fromCell: {
        parent: {
          id: 'fromCell',
          title: 'Search from cell',
          contexts: ['all'],
          documentUrlPatterns: [
            "http://*/*.ipynb*",
            "https://*/*.ipynb*"
          ]
        },
        children: []
      }
    };

    if (selectedTextType === 'Text') {
      for (const searcher of byTextSearchers) {
        properties.fromText.children.push({by: 'byText', searcher});
      }
    }

    if (selectedTextType === 'MEME') {
      for (const searcher of byMemeSearchers) {
        properties.fromText.children.push({by: `byMeme`, searcher});
      }
    }

    for (const searcher of byTextSearchers) {
      properties.fromLink.children.push({by: `byText`, searcher});
    }

    for (const searcher of byMemeSearchers) {
      properties.fromLink.children.push({by: `byMeme`, searcher});
    }

    for (const searcher of byMemeSearchers) {
      properties.fromCell.children.push({by: `byMeme`, searcher});
    }

    menuItemIdToSearcher = {};
    let idx = 0;
    for (const [from, {parent, children}] of Object.entries(properties)) {
      if (children.length) {
        chrome.contextMenus.create(parent, () => {
          for (const {by, searcher} of children) {
            const prefix = by === 'byText' ? '(Text)' : '(MEME)';
            const params = {
              id: `${from}:${by}:${idx++}`,
              title: `${prefix} ${searcher.name}`,
              contexts: parent.contexts,
              parentId: parent.id,
            };
            const childId = chrome.contextMenus.create(params);
            menuItemIdToSearcher[childId] = {from, by, searcher};
          }
        });
      }
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && Object.keys(changes).includes('searchers')) {
    updateContextMenus();
  }
});


/**
 * Context Menu Event
 */

function search(searcher, query) {
  chrome.tabs.create({url: searcher.url + query});
}

chrome.contextMenus.onClicked.addListener((info) => {
  const {from, by, searcher} = menuItemIdToSearcher[info.menuItemId];

  if (from === 'fromLink') {
    let query = info.linkUrl ? info.linkUrl.trim() : '';
    if (by === 'byMeme') {
      query = getLastUrlPath(query);
    }
    if (query) {
      search(searcher, query);
    } else {
      showNotification('Please right click on non-empty link.');
    }
  } else if (from === 'fromCell') {
    if (selectedNBCellMeme) {
      search(searcher, selectedNBCellMeme);
    } else {
      showNotification('Please right click on a Cell having MEME.');
    }
  } else {  // fromText
    let query = selectedText;
    if (by === 'byMeme' && query.startsWith('#')) {
      query = query.substr(1);
    }
    if (query) {
      search(searcher, query);
    } else {
      showNotification('Please select text before right click.');
    }
  }
});


/**
 * Synchronize Selected Jupyter Notebook Cell
 */

chrome.runtime.onMessage.addListener(message => {
  if (message.request === "updateSelectedNBCell") {
    selectedNBCellMeme = message.meme;
  }
});


/**
 * Synchronize Selected Text
 */

chrome.runtime.onMessage.addListener(message => {
  if (message.request === "updateSelectedText") {
    selectedText = message.text;
    let nextSelectedTextType = 'None';
    if (selectedText.length) {
      nextSelectedTextType = isMeme(selectedText) ? 'MEME' : 'Text';
    }

    if (selectedTextType !== nextSelectedTextType) {
      selectedTextType = nextSelectedTextType;
      updateContextMenus();
    }
  }
});

chrome.tabs.onActivated.addListener(({tabId}) => {
  chrome.tabs.sendMessage(tabId, {
    request: 'restoreSelectedText'
  });
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId < 0) return;
  chrome.windows.get(windowId, {populate: true}, window => {
    const tab = window && window.tabs.find(tab => tab.active);
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, {
      request: 'restoreSelectedText'
    });
  });
});
