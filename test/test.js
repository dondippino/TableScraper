const nock = require('nock');

const { setUpReadLine, getDatafromURL, extractTableHTMLtoObject, saveToArchive, interactWithUser, generateMutation, requestForUrl, requestForIdentifier } = require('../fx.js');
jest.setTimeout(30000);


let url;
let identifier;
let rl;
describe('Testing the prompts', function () {

    beforeAll(async () => {
        rl = await setUpReadLine();
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
            rl.close();
        } catch (error) {
            done(error);
        }


    });
    afterAll(async () => {
        
    });
});