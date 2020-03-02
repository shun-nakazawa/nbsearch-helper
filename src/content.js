const eventName = 'NBSearchHelperUpdatedNBSelectedCell';


function requestUpdateSelectedNBCell(meme) {
  chrome.runtime.sendMessage({
    request: 'updateSelectedNBCell',
    meme,
  });
}

if (document.body) {
  document.body.addEventListener(eventName, e => {
    requestUpdateSelectedNBCell(e.detail.meme);
  });

  // inject proxy script
  const filePath = chrome.extension.getURL('nb_selected_cell_proxy.js');
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', filePath);
  document.body.appendChild(script);
}
