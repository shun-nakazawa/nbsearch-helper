let dirty = false;


class Store {
  save(searcherListAll) {
    const data = {};
    for (const searcherList of searcherListAll) {
      data[searcherList.key] = searcherList.getValues();
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({searchers: data}, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({searchers: data});
        }
      });
    });
  }

  load() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get({searchers: {}}, ({searchers}) => {
        resolve(searchers);
      });
    });
  }
}


class SearcherList {
  constructor(key, selector, addSelector) {
    this.key = key;
    this.elem = document.querySelector(selector);
    this.elems = {
      add: this.elem.querySelector(addSelector)
    };
    this.searchers = [];
    this.elems.add.addEventListener('click', e => {
      this.addItem();
    });
  }

  addItem() {
    const searcher = new Searcher();
    this.elem.insertBefore(searcher.elem, this.elems.add);
    this.searchers.push(searcher);
    searcher.on('remove-searcher', e => {
      this.removeItem(e.detail.searcher);
    });
    this.dispatch('add-searcher', {searcher});
    return searcher;
  }

  removeItem(searcher) {
    this.elem.removeChild(searcher.elem);
    this.searchers.splice(this.searchers.indexOf(searcher), 1);
    this.dispatch('remove-searcher', {searcher});
  }

  on(eventName, callback) {
    this.elem.addEventListener(eventName, callback);
  }

  dispatch(eventName, detail = {}) {
    this.elem.dispatchEvent(new CustomEvent(eventName, {detail}));
  }

  getValues() {
    return this.searchers.map(searcher => searcher.getValue());
  }

  validateAll() {
    for (const searcher of this.searchers) {
      searcher.validate();
    }
  }
}


class Searcher {
  constructor() {
    const inputName = document.createElement('input');
    inputName.setAttribute('name', 'name');
    inputName.setAttribute('type', 'text');
    inputName.setAttribute('required', '');

    const inputNameLabel = document.createElement('label');
    inputNameLabel.textContent = 'Name';

    const inputNameField = document.createElement('div');
    inputNameField.classList.add('input-field');
    inputNameField.appendChild(inputNameLabel);
    inputNameField.appendChild(inputName);

    const inputUrl = document.createElement('input');
    inputUrl.setAttribute('name', 'url');
    inputUrl.setAttribute('type', 'url');
    inputUrl.setAttribute('required', '');

    const inputUrlLabel = document.createElement('label');
    inputUrlLabel.textContent = 'URL';

    const inputUrlField = document.createElement('div');
    inputUrlField.classList.add('input-field');
    inputUrlField.appendChild(inputUrlLabel);
    inputUrlField.appendChild(inputUrl);

    const removeButton = document.createElement('a');
    removeButton.setAttribute('type', 'button');
    removeButton.setAttribute('href', '#');
    removeButton.classList.add('remove-searcher-item');
    removeButton.textContent = '×';

    const container = document.createElement('div');
    container.classList.add('searcher-item');
    container.appendChild(inputNameField);
    container.appendChild(inputUrlField);
    container.appendChild(removeButton);

    this.elem = container;
    this.elems = {
      inputName,
      inputUrl,
      removeButton
    };

    removeButton.addEventListener('click', e => {
      if (e.target && e.target.classList.contains('remove-searcher-item')) {
        this.dispatch('remove-searcher', {searcher: this});
      }
    });
  }

  on(eventName, callback) {
    this.elem.addEventListener(eventName, callback);
  }

  dispatch(eventName, detail = {}) {
    this.elem.dispatchEvent(new CustomEvent(eventName, {detail}));
  }

  setValue({name, url}) {
    if (name) {
      this.elems.inputName.value = name;
    }
    if (url) {
      this.elems.inputUrl.value = url;
    }
  }

  getValue() {
    return {
      name: this.elems.inputName.value,
      url: this.elems.inputUrl.value
    };
  }

  validate() {
    const name = this.elems.inputName.value;
    const url = this.elems.inputUrl.value;
    if (!name) throw new Error('Need Name');
    if (!url) throw new Error('Need Url');
    if (!url.includes('?')) throw new Error(`URL must contain URL query (value is "${url}", example is "http://nb1.com?nbsearch&meme=")`);
    return name && url && url.includes('?');
  }
}


class StatusViewer {
  constructor(selector) {
    this.timerId = null;
    this.selector = selector;
    this.elems = Array.from(document.querySelectorAll(selector));
  }

  show(text, cssClass, duration = 0) {
    this.clear();

    for (const elem of this.elems) {
      elem.textContent = text;
      elem.classList.add(cssClass);
      elem.classList.add('fade-in');
    }

    if (duration > 0) {
      this.timerId = setTimeout(() => {
        for (const elem of this.elems) {
          elem.classList.remove('fade-in');
        }
      }, duration);
    }
  }

  clear() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    for (const elem of this.elems) {
      elem.textContent = '';
      for (const cls of Array.from(elem.classList)) {
        if (cls !== this.selector.slice(1)) {
          elem.classList.remove(cls);
        }
      }
    }
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  const statusViewer = new StatusViewer('.save-searcher-status');
  const store = new Store();

  const searcherListAll = [
    new SearcherList('byText', '#searcher-item-list-by-text', '.add-searcher-item'),
    new SearcherList('byMeme', '#searcher-item-list-by-meme', '.add-searcher-item')
  ];

  const initialValues = await store.load();
  for (const searcherList of searcherListAll) {
    const values = initialValues[searcherList.key];
    if (values && values.length) {
      for (const value of values) {
        const searcher = searcherList.addItem();
        searcher.setValue(value);
      }
    }
  }

  const formElem = document.getElementById('searcher-settings-form');

  formElem.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      for (const searcherList of searcherListAll) {
        searcherList.validateAll();
      }
      await store.save(searcherListAll);
      dirty = false;
      statusViewer.show('Saved!', 'saved', 3000);
    } catch (err) {
      console.error(err);
      statusViewer.show('Error: ' + err, 'error', 0);
    }
  });

  for (const searcherList of searcherListAll) {
    searcherList.on('add-searcher', e => {
      dirty = true;
    });
    searcherList.on('remove-searcher', e => {
      dirty = true;
    });
  }

  formElem.addEventListener('input', e => {
    dirty = true;
  });

  window.addEventListener('beforeunload', e => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});
