const eventName = 'NBSearchHelperUpdatedNBSelectedCell';


function dispatchEvent(cell) {
  const meme = cell && cell.metadata && cell.metadata.lc_cell_meme && cell.metadata.lc_cell_meme.current ?
      cell.metadata.lc_cell_meme.current : null;
  const event = new CustomEvent(eventName, {
    bubbles: false,
    detail: {meme}
  });
  document.body.dispatchEvent(event);
}

if (typeof Jupyter !== 'undefined') {
  Jupyter.notebook.config.loaded.then(() => {
    document.body.addEventListener('mousedown', e => {
      if (e.button !== 2) return;
      const cellElem = $(e.target).closest('.cell');
      dispatchEvent(cellElem.data('cell'));
    });
  });
} else {
  document.body.addEventListener('mousedown', e => {
    if (e.button !== 2) return;
    dispatchEvent(null);
  });
}
