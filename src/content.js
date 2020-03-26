let beforeSelectedText = '';

function throttle(delay, callback) {
  let timeoutId;
  let lastExec = 0;

  return (...args) => {
    const elapsed = Date.now() - lastExec;
    const exec = () => {
      lastExec = Date.now();
      callback(...args);
    };

    clearTimeout(timeoutId);

    if (elapsed > delay) {
      exec();
    } else {
      timeoutId = setTimeout(exec, delay - elapsed);
    }
  };
}

function onSelectionChange() {
  const selection = window.getSelection();
  const text = selection !== null ? selection.toString().trim() : '';

  if (beforeSelectedText !== text) {
    beforeSelectedText = text;
    chrome.runtime.sendMessage({
      request: 'updateSelectedText',
      text: text,
    });
  }
}

chrome.runtime.onMessage.addListener(message => {
  if (message.request === "restoreSelectedText") {
    chrome.runtime.sendMessage({
      request: 'updateSelectedText',
      text: beforeSelectedText,
    });
  }
});

document.addEventListener("selectionchange", throttle(100, onSelectionChange));
onSelectionChange();
