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
    Jupyter.notebook.events.on('select.Cell', (e, {cell}) => dispatchEvent(cell));

    const currentSelectedCell = Jupyter.notebook.get_selected_cell();
    dispatchEvent(currentSelectedCell);
  });
}
