document.body.addEventListener('mousedown', e => {
  if (e.button !== 2) return;

  let elem = e.target;
  while (elem && !elem.classList.contains('cell')) {
    elem = elem.parentElement;
  }

  const meme = elem ? elem.getAttribute('data-nblineage-meme') : null;
  chrome.runtime.sendMessage({
    request: 'updateSelectedNBCell',
    meme,
  });
});
