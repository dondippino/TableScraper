const { setUpDataDirs, setUpReadLine, getDatafromURL, extractTableHTMLtoObject, saveToArchive, interactWithUser, generateMutation, requestForUrl, requestForIdentifier } = require('./fx.js');
const CURRENT_DIR = './archive/current';
const DATA_DIR = './archive/data';
const MUTATIONS_DIR = './archive/mutations';

(async () => {
    await setUpDataDirs(CURRENT_DIR, DATA_DIR, MUTATIONS_DIR);
    let rl = await setUpReadLine();
    rl.on("close", function () { // callback for catching 'close' event of prompt
        process.exit(0);
    });
    let url = await requestForUrl(rl);
    let identifier = await requestForIdentifier(rl);
    let $ = await getDatafromURL(url);
    let extractedObject = await extractTableHTMLtoObject($, rl, identifier);
    await saveToArchive(extractedObject, url, DATA_DIR);
    let isLatest = await interactWithUser(extractedObject, rl);
    if (isLatest) {
        generateMutation(extractedObject, rl, url, CURRENT_DIR, MUTATIONS_DIR).then((h) => {
        });
    } else {
        rl.close();
    }
})();