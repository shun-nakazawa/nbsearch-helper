let elems;
let statusTimerId;

function saveSearchers() {
    const items = Array.from(document.getElementsByClassName('searcher-item'));
    const searchers = items.map(item => {
        const name = item.querySelector('input[name=name]').value;
        const url = item.querySelector('input[name=url]').value;
        return {name, url}
    });
    chrome.storage.sync.set({ searchers }, (err) =>  {
        if (err) {
            console.error(err);
            updateStatus('Error: ' + err, 'error', 0);
        } else {
            updateStatus('Saved!', 'saved', 3000);
        }
    });
}

function restoreSearcher() {
    chrome.storage.sync.get({searchers: []}, ({searchers}) => {
        for (const searcher of searchers) {
            addSearcherItem(searcher);
        }

        if (searchers.length === 0) {
            addSearcherItem();
        }
    });
}

function addSearcherItem(searcher) {
    const searcherItemElem = createSearcherItemElem(searcher);
    elems.itemList.appendChild(searcherItemElem);
}

function removeSearcherItem(searcherItemElem) {
    elems.itemList.removeChild(searcherItemElem);
}

function createSearcherItemElem(searcher) {
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

    if (searcher) {
        inputName.value = searcher.name;
        inputUrl.value = searcher.url;
    }

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

    return container;
}

function updateStatus(text, cssClass, duration) {
    if (statusTimerId) {
        clearTimeout(statusTimerId);
    }
    elems.status.textContent = text;
    for (const cls of Array.from(elems.status.classList)) {
        elems.status.classList.remove(cls);
    }
    elems.status.classList.add(cssClass);
    elems.status.classList.add('fade-in');
    if (duration > 0) {
        statusTimerId = setTimeout(() => {
            elems.status.classList.remove('fade-in');
        }, duration);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    elems = {
        add: document.getElementById('add-searcher-item'),
        itemList: document.getElementById('searcher-item-list'),
        form: document.getElementById('searcher-settings-form'),
        status: document.getElementById('status')
    };

    elems.form.addEventListener('submit', e => {
        saveSearchers();
        e.preventDefault();
    });

    elems.add.addEventListener('click', e => {
        addSearcherItem();
    });

    elems.itemList.addEventListener('click', e => {
        if (e.target && e.target.classList.contains('remove-searcher-item')) {
            removeSearcherItem(e.target.parentElement);
            e.preventDefault();
        }
    });

    restoreSearcher();
});
