const htmlToImage = require('html-to-image');
const date = require('date-time');
const download = require('downloadjs');

const representEl = document.getElementById('represent-element');

// get image information
const widthEl = document.getElementById('input-width');
const heightEl = document.getElementById('input-height');
const nameEl = document.getElementById('input-name');    
const wordEl = document.getElementById('input-word'); 
const viEl = document.getElementById('input-vi');
const enEl = document.getElementById('input-en');
const spellingEl = document.getElementById('input-spelling');

// assign name field for the first time
nameEl.placeholder = date();

document.getElementById('render-button').addEventListener('click', (event) => {
    // prevent the page reloading
    event.preventDefault();    

    const width = (widthEl.value) ? widthEl.value : '500';
    const height = (heightEl.value) ? heightEl.value : '420';
    const name = (nameEl.value) ? nameEl.value : date();
    const word = wordEl.value; 
    const vi = viEl.value;
    const en = enEl.value;
    const spelling = spellingEl.value;

    // assign image information to represent element
    document.getElementById('abb').innerHTML = word;
    document.getElementById('meaning-vi').innerHTML = vi;
    document.getElementById('meaning-en').innerHTML = en;
    document.getElementById('spelling').innerHTML = spelling;

    representEl.style.width = `${width}px`;
    representEl.style.height = `${height}px`;

    htmlToImage.toPng(representEl)
        .then(function(dataURL) {            
            download(dataURL, name, 'image/png');
        })
        .catch(function(err) {            
            console.log(err);
        });
})