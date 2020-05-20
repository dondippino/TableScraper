const readline2 = require('readline-promise').default;
var Promise = require('promise');

exports.forTest = () => {
    return new Promise(async (resolve) => {
        let rl2 = readline2.createInterface({ // Create readline prompt
            input: process.stdin,
            output: process.stdout
        });
        let answer = await rl2.questionAsync('Hey i am a test question')
        // rl2.close();
        resolve(answer);
    })
}