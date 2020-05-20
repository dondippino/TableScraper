const { setUpReadLine, getDatafromURL, extractTableHTMLtoObject, saveToArchive, interactWithUser, generateMutation, requestForUrl, requestForIdentifier } = require('./fx.js');

(async () => {
    let rl = await setUpReadLine();
    rl.on("close", function () { // callback for catching 'close' event of prompt
        process.exit(0);
    });
    let url = await requestForUrl(rl);
    let identifier = await requestForIdentifier(rl);
    let $ = await getDatafromURL(url);
    let extractedObject = await extractTableHTMLtoObject($, rl, identifier);
    await saveToArchive(extractedObject, url);
    let isLatest = await interactWithUser(extractedObject, rl);
    if (isLatest) {
        generateMutation(extractedObject, rl, url).then((h) => {
        });
    } else {
        rl.close();
    }
})();