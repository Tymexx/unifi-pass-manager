const { JSDOM } = require('jsdom');

JSDOM.fromURL("http://localhost:3050", {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true
}).then(dom => {
  const { window } = dom;

  window.console.error = (...args) => console.log('ERROR:', ...args);
  window.console.warn = (...args) => console.log('WARN:', ...args);
  window.console.log = (...args) => console.log('LOG:', ...args);

  window.addEventListener('error', event => {
    console.error('UNCAUGHT ERROR:', event.error);
  });

  window.addEventListener('unhandledrejection', event => {
    console.error('UNHANDLED REJECTION:', event.reason);
  });

  setTimeout(() => {
    console.log("Root content:", window.document.getElementById('root').innerHTML.substring(0, 100));
    console.log("Done checking.");
  }, 2000);
}).catch(e => console.error(e));
