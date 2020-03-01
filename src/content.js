const eventName = 'NBSearchHelperUpdatedNBSelectedCell';

function updateSelectedNBCell(meme) {
  chrome.runtime.sendMessage({
    request: 'updateSelectedNBCell',
    meme: meme,
  });
}

if (document.body) {
  document.body.addEventListener(eventName, e => {
    updateSelectedNBCell(e.detail.meme);
  });

  // inject proxy script
  const filePath = chrome.extension.getURL('nb_selected_cell_proxy.js');
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', filePath);
  document.body.appendChild(script);
}
