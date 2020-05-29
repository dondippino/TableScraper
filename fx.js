/**
 * Tiny Console Table Scraper
 * Author: Olabosinde Oladipo <olabosindeoladipo@gmail.com>
 */

const { from, Subject } = require('rxjs');
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const hash = require('object-hash');
const path = require('path');
const readline = require("readline-promise").default;
const rimraf = require('rimraf-promise');
const ObjectsToCsv = require('objects-to-csv');
var Promise = require('promise');
const mkdirp = require('mkdirp')



exports.url = ""; // URL of page to be scraped
exports.identifier = ""; // Identifier of the table element in the DOM of the page
exports.uniqueColumn = ""; // The column containing the unique values by which the table is indexed


/**
 * @description This function creates the directories for the generated data, 
 * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
 * @requires mkdirp
 */

exports.setUpDataDirs = async (CURRENT_DIR, DATA_DIR, MUTATIONS_DIR) => {
    var mades = [];

    let made1 = await mkdirp(CURRENT_DIR);
    let made2 = await mkdirp(DATA_DIR);
    let made3 = await mkdirp(MUTATIONS_DIR);

    mades.push(made1);
    mades.push(made2);
    mades.push(made3);

    return mades;
}

/**
 * @description The readline prompt is created, 
 * to enable user interaction throughout the application
 * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
 * @requires readline
 */

exports.setUpReadLine = () => {
    return new Promise((resolve, reject) => {
        try {
            let rl = readline.createInterface({ // Create readline prompt
                input: process.stdin,
                output: process.stdout
            });

            resolve(rl);
        } catch (error) {
            reject(error);
        }
    });
}



/**
 * @description The Subject is part of the rxjs library, it provides a 'publish-subscribe feature
 * which enables us to emit events from anywhere within the code, while also subscribing to these
 * events.
 * In our case we use this for logging progress or other info in the console
 * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
 * @requires Subject
 */

const subject = new Subject();
subject.subscribe((data) => {

    if (typeof data === 'object') {
        if (data.type === 'function') {
            data.val();
        }
    } else {
        console.log('[NOTICE] ' + data);
    }
});

/** 
  * @desc This function will prompt the user to enter required parameter which is: 
  * URL of the HTML table in the DOM
  * @param rl : The readline object
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @returns Promise
*/

exports.requestForUrl = async (rl) => {

    // Prompt user for URL
    let url = await rl.questionAsync("\nEnter the URL to the desired page ['https://covid19.ncdc.gov.ng/']: ");
    url = url || 'https://covid19.ncdc.gov.ng/'; // Choose input URL or the default
    exports.url = url;
    return exports.url;
}

/** 
  * @desc This function will prompt the user to enter required parameter which is: 
  * identifier of the HTML table in the DOM
  * @param rl : The readline object
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @returns Promise
*/

exports.requestForIdentifier = async (rl) => {

    // Prompt user for the identifier of the table on the DOM
    let identifier = await rl.questionAsync("\nEnter the identifier to the HTML table element 'e.g. id or class of element ['#custom1']: ");
    identifier = identifier || '#custom1'; // Choose input identifier or the default
    exports.identifier = identifier
    return exports.identifier;
}

/** 
  * @desc This function calls the URL and queries the DOM with the identifier,
  * to extract the HTML table
  * @param url
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @returns Observable
*/

exports.getDatafromURL = (url) => {
    const options = {
        url: url,
        json: false,
        transform: body => cheerio.load(body)
    }
    subject.next(`Creating connection to: ${options.url} ...`);
    return rp(options); //calling URL
}

/** 
  * @desc This function extracts the content of the HTML table, 
  * the converts it to an object
  * @param $ : jQuery object
  * @param rl : The readline object
  * @param identifier
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @requires $
  * @returns Promise
*/

exports.extractTableHTMLtoObject = async ($, rl, identifier) => {

    let data = [];
    let columns = [];

    subject.next('Downloaded web page ...');

    // Check if the extracted data is a table, by checking for rows
    if ($(`table${identifier}`).has('tr').length === 0) {
        subject.next('Table has no data ...');
        rl.close();
    }

    subject.next('Extracting and processing column headers ...');

    // Check if the table has th header for column names; else improvise
    if ($(`table${identifier}`).find('th') != 0) {
        $(`table${identifier}`).find('th').each(function (index) {
            columns.push(($(this).text()).trim());
        })
    } else { // Create arbitrary column names in the absence of th
        var columnSize = $(`table${identifier} tr:first-child td`).length;
        for (var i = 0; i < columnSize; i++) {
            columns.push(`Column_${i}`);
        }
    }

    console.table(columns);
    let uniqueColumn = await rl.questionAsync("\nSelect the unique column by which the data will be indexed [0]: ");
    exports.uniqueColumn = uniqueColumn || 0;
    if (!(/^-?\d+$/.test(exports.uniqueColumn)) || parseInt(exports.uniqueColumn) >= columns.length || parseInt(exports.uniqueColumn) < -1) {
        subject.next('Input must be in the range of (index) as shown above ...');
        subject.next('Aborting, please try again ...');
        rl.close();
    }

    // Loop through the rows to process each row and return an array of arrays
    $(`table${identifier} tr`).has('td').each(function (index) {
        var array_data = [];
        $(this).find('td').each(function (d) { // Another loop through the cells td of the table to pull data
            array_data.push($(this).text());
        })
        data.push(array_data);
    });

    // Array of arrays wwill be converted to an object for ease of processing
    let mainObject = {};
    // let mainObject = [];
    data.forEach(function (item, index) {
        var obj = item.reduce(function (a, b, c) {
            b = b.replace(/\,/gi, "");
            a[columns[c]] = parseFloat(b) == b ? parseFloat(b) : b.trim();
            return a;
        }, {});
        if (exports.uniqueColumn === '-1') {
            mainObject[index] = obj;
        } else {
            mainObject[item[exports.uniqueColumn].trim()] = obj;
        }
    });
    subject.next('Extraction completed ...');
    return mainObject;

}

/** 
  * @desc This function saves the object containing the table data to the archive directory
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param mainObject: Converted HTML table to object
  * @param url
  * @requires fs
  * @requires hash
  * @returns Promise
*/

exports.saveToArchive = (mainObject, url, DATA_DIR) => {

    //  Create a unique means of identification for the extracted data by hashing the object
    var hashedFile = path.join(`${DATA_DIR}/`, exports.extractHostname(url) + '_' + hash(mainObject));
    subject.next('Attemmpting to save report to the archive ...');

    return new Promise((resolve) => {
        // Check if this file exists in the archives data directory
        fs.promises.access(hashedFile).then((err) => { // if Yes, Don't save
            subject.next('This report already exists in the archive ...');
            resolve("");
        }).catch((err) => { // if No, Save it
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
    });
}

/** 
  * @desc This function prompts the user, to make the version current
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param mainObject: The converted object of the HTML table
  * @param rl: The readline object
  * @requires rl
  * @returns Promise
*/

exports.interactWithUser = (mainObject, rl) => {
    let isLatest = false;

    return new Promise(async (resolve) => {

        // Prompt the user to save the file as the recent version
        let latest = await rl.questionAsync("\nMake this the latest version of report Y/N [N]: ");
        latest = latest || 'N';
        latest = latest.toLowerCase();
        if (latest === 'n' || latest === 'y') {
            isLatest = latest === 'y' ? true : false;
            resolve(isLatest);
        } else {
            subject.next('Invalid input ...');
            return exports.interactWithUser(mainObject);
        }
    });

}

/** 
  * @desc This function calculates the difference between two similar objects
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param new_version
  * @param old_version
  * @returns object
*/

exports.calculateMutation = (old_version, new_version) => {
    var ret = {};
    for (var key in new_version) {
        var obj = new_version[key];
        var obj2 = old_version[key]
        if (typeof obj === "number" && !isNaN(obj) && typeof obj2 === "number" && !isNaN(obj2)) {
            ret[key] = obj - obj2;
        } else {
            if (typeof obj === 'object' && typeof obj2 === 'object') {
                ret[key] = exports.calculateMutation(obj2, obj);
            }
            else {
                ret[key] = obj;
            }
        }
    }
    return ret;
}

/** 
  * @desc This function calculates the difference between two similar array
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param new_version
  * @param old_version
  * @returns array
*/

calculateMutation2 = (old_version, new_version) => {
    return old_version.map(function (v, i) { return (v - new_version[i]); });
}

/** 
  * @desc This function generates mutation from the difference between two versions of the data
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param mainObject
  * @param readLineObject
  * @param url
  * @returns object
*/

exports.generateMutation = (mainObject, readLineObject, url, CURRENT_DIR, MUTATIONS_DIR) => {
    return new Promise((resolve, reject) => {
        var files = fs.readdirSync(CURRENT_DIR);
        if (fs.existsSync(`${CURRENT_DIR}/${exports.extractHostname(url) + '_' + hash(mainObject)}`)) {
            subject.next('The current version is up to date  ...');
            readLineObject.close();
            return;
        }
        try {
            var currentFile = path.join(`${CURRENT_DIR}/`, exports.extractHostname(url) + '_' + hash(mainObject));
            var existingCurrentFile = `${CURRENT_DIR}/${exports.extractHostname(url) + '_*'}`;
            if (files.filter(fn => fn.startsWith(exports.extractHostname(url) + '_')).length > 0) {

                const data = fs.readFileSync(path.join(`${CURRENT_DIR}/`, files.filter(fn => fn.startsWith(exports.extractHostname(url) + '_'))[0]), 'utf8');

                // Calculate the difference
                var mutation = calculateMutation(JSON.parse(data), mainObject);


                // Save json to mutation folder
                var date = new Date();
                var mutant_file_name = exports.extractHostname(url) + '_' + date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + '-' + Date.now();

                fs.writeFile(`${MUTATIONS_DIR}/` + mutant_file_name, JSON.stringify(mutation), function (err) {
                    if (err) return console.log(err);
                    //Convert to csv and save also to mutation folder
                    const csv = new ObjectsToCsv(Object.values(mutation));
                    // const csv = new ObjectsToCsv(mutation);
                    csv.toDisk(`${MUTATIONS_DIR}/` + mutant_file_name + '.csv');
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
    });
}

/** 
  * @desc This function extracts the hostname from the URL
  * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
  * @param url
  * @returns string
*/

exports.extractHostname = (url) => {
    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1];
    return domain;
}