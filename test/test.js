const nock = require('nock');
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');
const rimraf = require('rimraf-promise');


const { setUpDataDirs, setUpReadLine, getDatafromURL, extractTableHTMLtoObject, saveToArchive, interactWithUser, generateMutation, requestForUrl, requestForIdentifier, extractHostname } = require('../fx.js');
jest.setTimeout(30000);

const FAKE_ARCHIVE = './fake_archive';
const CURRENT_DIR = './fake_archive/current';
const DATA_DIR = './fake_archive/data';
const MUTATIONS_DIR = './fake_archive/mutations';

let url;
let identifier;
let rl;


describe('Testing setup of readline', function () {
    beforeAll(async () => {
        rl = await setUpReadLine();
    });

    it('tests the success of creating readline object', async (done) => {
        try {
            process.nextTick(() => {
                rl.write('OK\n');
            });
            let answer = await rl.questionAsync('Testing readline...');
            expect(answer).toEqual('OK');
            done();
        } catch (error) {
            done(error);
        }
    });

    afterAll(async () => {

    });
});

describe('Testing the prompts', function () {

    beforeAll(async () => {

    });
    it('checks and validates the input url', async (done) => {
        try {
            process.nextTick(() => {
                rl.write('http://data.mock-server.ext/with-th\n');
            });
            url = await requestForUrl(rl);
            expect(url).toBe('http://data.mock-server.ext/with-th');
            done();
        } catch (error) {
            done(error);
        }


    });

    it('checks and validates the input identifier', async (done) => {
        try {
            process.nextTick(() => {
                rl.write('#identifier\n');
            });
            identifier = await requestForIdentifier(rl);
            expect(identifier).toBe('#identifier');
            done();
        } catch (error) {
            done(error);
        }


    });

    afterAll(async () => {

    });

});

describe('Testing extraction of data from HTML table', function () {
    beforeAll(async () => {
        nock('http://data.mock-server.ext')
            .get('/with-th')
            .delay({
                head: 1000, // header will be delayed for 1 seconds, i.e. the whole response will be delayed for 1 seconds.
                body: 1000, // body will be delayed for another 1 seconds after header is sent out.
            })
            .reply(200, `<html>
                    <head></head>
                    <body>
                        <table id="identifier">
                            <thead>
                                <tr><th>Name</th><th>Age</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>John</td><td>22</td></tr>
                                <tr><td>Jane</td><td>21</td></tr>
                            </tbody>
                        </table>
                    </body>
                </html>`
            )
            .get('/without-th')
            .delay({
                head: 1000, // header will be delayed for ` seconds, i.e. the whole response will be delayed for ` seconds.
                body: 1000, // body will be delayed for another ` seconds after header is sent out.
            })
            .reply(200, (200, `<html>
                            <head></head>
                            <body>
                                <table id="identifier">
                                    <tbody>
                                        <tr><td>John</td><td>22</td></tr>
                                        <tr><td>Jane</td><td>21</td></tr>
                                    </tbody>
                                </table>
                            </body>
                        </html>`
            ))
            .get('/without-tr')
            .delay({
                head: 1000, // header will be delayed for ` seconds, i.e. the whole response will be delayed for ` seconds.
                body: 1000, // body will be delayed for another ` seconds after header is sent out.
            })
            .reply(200, (200, `<html>
                            <head></head>
                            <body>
                                <div id="identifier"></div>
                            </body>
                        </html>`
            ));
    });
    it('checks to see the object generated from the HTML table with header columns - th, is correct', async (done) => {
        try {
            let $ = await getDatafromURL(url);
            process.nextTick(() => {
                rl.write('0\n');
            });
            let extractedObject = await extractTableHTMLtoObject($, rl, identifier);
            const expectedObject = { 'John': { 'Name': 'John', 'Age': 22 }, 'Jane': { 'Name': 'Jane', 'Age': 21 } };
            expect(extractedObject).toEqual(expectedObject);
            done();
        } catch (error) {
            done(error);
        }
    });

    it('checks to see the object generated from the HTML table without header columns - th, is correct', async (done) => {
        try {
            url = 'http://data.mock-server.ext/without-th';
            let $ = await getDatafromURL(url);
            process.nextTick(() => {
                rl.write('0\n');
            });
            let extractedObject = await extractTableHTMLtoObject($, rl, identifier);
            const expectedObject = { 'John': { 'Column_0': 'John', 'Column_1': 22 }, 'Jane': { 'Column_0': 'Jane', 'Column_1': 21 } };
            expect(extractedObject).toEqual(expectedObject);

            done();
            // rl.close();
        } catch (error) {
            done(error);
        }


    });
    afterAll(async () => {

    });
});

describe('Testing persistence of files to the archive directory', function () {
    beforeAll(async () => {

    });
    it('checks to see if file was saved to the archive', async (done) => {
        try {
            await rimraf(FAKE_ARCHIVE);
            await setUpDataDirs(CURRENT_DIR, DATA_DIR, MUTATIONS_DIR);
            let url = 'http://data.mock-server.ext/with-th';
            let extractedObject = { 'John': { 'Name': 'John', 'Age': 22 }, 'Jane': { 'Name': 'Jane', 'Age': 21 } };
            await saveToArchive(extractedObject, url, DATA_DIR);
            var expectedHashedFile = path.join(`${DATA_DIR}/`, extractHostname(url) + '_' + hash(extractedObject));
            // expect(fs.existsSync(expectedHashedFile)).toBe(true);
            const data = fs.readFileSync(expectedHashedFile, 'utf8');
            expect(JSON.parse(data)).toEqual(extractedObject);
            await rimraf(FAKE_ARCHIVE);
            done();
        } catch (error) {
            done(error);
        }
    });



    afterAll(async () => {

    });
});

describe('Testing the prompts to make current report the latest', function () {
    beforeAll(async () => {

    });

    it('tests the prompt for making the current report the latest', async (done) => {
        try {
            let extractedObject = { 'John': { 'Name': 'John', 'Age': 22 }, 'Jane': { 'Name': 'Jane', 'Age': 21 } };
            process.nextTick(() => {
                rl.write('y\n');
            });
            let isLatest = await interactWithUser(extractedObject, rl);
            expect(isLatest).toEqual(true);
            done();
        } catch (error) {
            done(error);
        }
    });

    it('tests the prompt for not making the current report the latest', async (done) => {
        try {
            let extractedObject = { 'John': { 'Name': 'John', 'Age': 22 }, 'Jane': { 'Name': 'Jane', 'Age': 21 } };
            process.nextTick(() => {
                rl.write('n\n');
            });
            let isLatest = await interactWithUser(extractedObject, rl);
            expect(isLatest).toEqual(false);
            done();

        } catch (error) {
            done(error);
        }
    });

    afterAll(async () => {

    });
});


describe('Testing creation of directories', function () {
    beforeAll(async () => {

    });

    it('tests the success of creating data directories', async (done) => {
        try {
            await setUpDataDirs(CURRENT_DIR, DATA_DIR, MUTATIONS_DIR);
            var allCreated = fs.existsSync(CURRENT_DIR) && fs.existsSync(DATA_DIR) && fs.existsSync(MUTATIONS_DIR);
            expect(allCreated).toEqual(true);
            await rimraf(FAKE_ARCHIVE);
            done();
            rl.close();
        } catch (error) {
            done(error);
        }
    });

    afterAll(async () => {

    });
});