const { from, Subject } = require('rxjs');
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const hash = require('object-hash');
const readline = require("readline-promise").default;
const path = require('path');
const rimraf = require('rimraf-promise');
const ObjectsToCsv = require('objects-to-csv');
var Promise = require('promise');

exports.url = "";
exports.identifier = "";

const subject = new Subject();
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
rl.on("close", function () {
    process.exit(0);
});
subject.subscribe((data) => {

    if (typeof data === 'object') {
        if (data.type === 'function') {
            data.val();
        }
    } else {
        console.log('[NOTICE] ' + data);
    }
});
exports.setUp = () => {
    return from(new Promise((resolve) => {
        rl.questionAsync("\nEnter the URL to the desired page ['https://covid19.ncdc.gov.ng/']: ")
            .then((url) => {
                url = url || 'https://covid19.ncdc.gov.ng/';
                exports.url = url;
                rl.questionAsync("\nEnter the identifier to the HTML table element 'e.g. id or class of element ['#custom1']: ")
                    .then((identifier) => {
                        identifier = identifier || '#custom1';
                        exports.identifier = identifier
                        resolve(rl);
                    });
            });
    }));
}
exports.getDatafromURLandTransform = (readLineObject) => {
    const options = {
        url: exports.url,
        json: false,
        transform: body => cheerio.load(body)
    }
    let data = [];
    let columns = [];
    subject.next(`Creating connection to: ${options.url} ...`);
    return from(rp(options)
        .then(($) => {
            subject.next('Downloaded web page ...');
            if (!$(`table${exports.identifier}`).has('tr')) {
                subject.next('Table has no data ...');
                readLineObject.close();
            }

            // detect column headers
            subject.next('Extracting and processing resources ...');
            if ($(`table${exports.identifier}`).has('th')) {
                $(`table${exports.identifier}`).find('th').each(function (index) {
                    columns.push($(this).text());
                })
            } else {
                var columnSize = $(`table${exports.identifier} tr:nth(0) td`).length;
                for (var i = 0; i < columnSize; i++) {
                    columns.push(`Column_${i}`);
                }
            }
            $(`table${exports.identifier} tr`).has('td').each(function (index) {
                var array_data = [];
                $(this).find('td').each(function (d) {
                    array_data.push($(this).text());
                })
                data.push(array_data);
            });
            let mainObject = {};
            data.forEach(function (item, index) {
                var obj = item.reduce(function (a, b, c) {
                    b = b.replace(/\,/gi, "");
                    a[columns[c]] = parseFloat(b) == b ? parseFloat(b) : b.trim();
                    return a;
                }, {});
                mainObject[item[0].trim()] = obj;
            });
            subject.next('Extraction completed ...');
            return new Promise(resolve => resolve(mainObject));
        }));
}
exports.saveToArchive = (mainObject) => {
    var hashedFile = path.join('./archive/data/', exports.extractHostname(exports.url) + '_' + hash(mainObject));
    subject.next('Attemmpting to save report to the archive ...');
    return from(
        new Promise((resolve) => {
            fs.promises.access(hashedFile).then((err) => {
                subject.next('This report already exists in the archive ...');
                resolve("");
            }).catch((err) => {
                subject.next('Saving file to the archive ...');
                fs.promises.writeFile(hashedFile, JSON.stringify(mainObject), 'utf8')
                    .then(() => {
                        subject.next('File saved successfully ...\n');
                        resolve("");
                    })
                    .catch((err) => {
                        resolve("");
                        console.log(err);
                    });
            })
        })
    );
}
exports.interactWithUser = (mainObject) => {
    let isLatest = false;

    return from(new Promise((resolve) => {
        rl.questionAsync("\nMake this the latest version of report Y/N [N]: ")
            .then((latest, l) => {
                latest = latest || 'N';
                latest = latest.toLowerCase();
                if (latest === 'n' || latest === 'y') {
                    isLatest = latest === 'y' ? true : false;

                    resolve({ a: rl, b: isLatest });

                } else {
                    subject.next('Invalid input ...');
                    return exports.interactWithUser(mainObject);
                }
            });
    }));

}

calculateMutation = (schema2, schema1) => {
    var ret = {};
    for (var key in schema1) {
        var obj = schema1[key];
        var obj2 = schema2[key]
        if (typeof obj === "number" && !isNaN(obj) && typeof obj2 === "number" && !isNaN(obj2)) {
            ret[key] = obj - obj2;
        }
        else {
            if (typeof obj === 'object' && typeof obj2 === 'object') {
                ret[key] = calculateMutation(obj, obj2);
            }
            else {
                ret[key] = obj;
            }
        }
    }
    return ret;
}

exports.generateMutation = (mainObject, readLineObject) => {
    return from(new Promise((resolve, reject) => {
        var files = fs.readdirSync('./archive/current');
        // if (files.length === 0 || !fs.existsSync(exports.extractHostname(exports.url) + "_*")) {
        //     subject.next('There is no current version, hence no mutation yet ...');
        //     readLineObject.close();
        //     return;
        // }
        // if (hash(mainObject) === files[0]) {
        if (fs.existsSync(`./archive/current/${exports.extractHostname(exports.url) + '_' + hash(mainObject)}`)) {
            subject.next('The current version is up to date  ...');
            readLineObject.close();
            return;
        }
        try {
            var currentFile = path.join('./archive/current/', exports.extractHostname(exports.url) + '_' + hash(mainObject));
            var existingCurrentFile = `archive/current/${exports.extractHostname(exports.url) + '_*'}`;
            if (files.filter(fn => fn.startsWith(exports.extractHostname(exports.url) + '_')).length > 0) {

                const data = fs.readFileSync(path.join('./archive/current/', files.filter(fn => fn.startsWith(exports.extractHostname(exports.url) + '_'))[0]), 'utf8');
                var mutation = calculateMutation(mainObject, JSON.parse(data));
                //Save json to mutation folder
                var date = new Date();
                var mutant_file_name = exports.extractHostname(exports.url) + '_' + date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + '-' + Date.now();
                fs.writeFile('./archive/mutations/' + mutant_file_name, JSON.stringify(mutation), function (err) {
                    if (err) return console.log(err);
                    //Convert to csv and save also to mutation folder
                    const csv = new ObjectsToCsv(Object.values(mutation));
                    csv.toDisk('./archive/mutations/' + mutant_file_name + '.csv');
                    subject.next('Mutant File saved successfully ...');

                    rimraf(existingCurrentFile).then(() => {
                        subject.next('Cleared current directory ...');
                        fs.promises.writeFile(currentFile, JSON.stringify(mainObject), 'utf8').then(
                            () => {
                                subject.next('File has been saved as latest ...');
                                readLineObject.close();
                            }
                        ).catch((err) => { console.log(err); });
                    });


                });
            } else {

                fs.promises.writeFile(currentFile, JSON.stringify(mainObject), 'utf8').then(
                    () => {
                        subject.next('File has been saved as latest ...');
                        readLineObject.close();
                    }
                ).catch((err) => { console.log(err); });
            }

        } catch (err) {
            console.error(err)
        }
    }));
}


exports.extractHostname = (url) => {
    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1];
    return domain;
}