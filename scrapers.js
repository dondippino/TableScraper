const { setUp, getDatafromURLandTransform, saveToArchive, interactWithUser, generateMutation } = require('./fx.js');

setUp().subscribe(() => {
    getDatafromURLandTransform().subscribe((x) => {
        saveToArchive(x).subscribe((o) => {
            interactWithUser(x).subscribe((rl) => {
                if (rl.b) {
                    generateMutation(x, rl.a).subscribe((h) => {
                    });
                } else {
                    rl.a.close();
                }
            });
        });
    });
});

