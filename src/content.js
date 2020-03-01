const eventName = 'NBSearchHelperUpdatedNBSelectedCell';
let selectedNBCellMeme = null;


function requestUpdateSelectedNBCell() {
  chrome.runtime.sendMessage({
    request: 'updateSelectedNBCell',
    meme: selectedNBCellMeme,
  });
}

if (document.body) {
  document.body.addEventListener(eventName, e => {
    selectedNBCellMeme = e.detail.meme;
    requestUpdateSelectedNBCell();
  });

  // inject proxy script
  const filePath = chrome.extension.getURL('nb_selected_cell_proxy.js');
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', filePath);
  document.body.appendChild(script);
}

chrome.runtime.onMessage.addListener(message => {
  if (message.request === 'getSelectedNBCell') {
    requestUpdateSelectedNBCell();
  }
});
