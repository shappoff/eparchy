const fs = require('fs').promises;
const fs1 = require('fs');
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const testFolder = './dist';

const rootRoute = '/eparchy';//`file:///C:/Users/ssa/WebstormProjects/eparchy/dist`;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}


const handleRows = (res) => {
    const rows = res.data.values;
    if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
    }
    rows.forEach((row, index) => {
        // Print columns A and E, which correspond to indices 0 and 4.

        const eparchyStr = row[4];

        if (!eparchyStr) {
            return;
        }

        const [eparchy, blagochinie, titleCh] = eparchyStr.slice(6).split(', ');

        if (!titleCh) {
            return;
        }

        const data = `
<!DOCTYPE html>
<html>
<head>
  <link href="../../styles.css" rel="stylesheet">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="utf-8" />
  <title>${row[0]}</title>
</head>
<body>
<article>
<h4>${row[0]}</h4>
<p>${row[1]}</p>
<p>${row[4]}</p>
<p>${row[5]}</p>
</article>
</body>
</html>
`.trim()

        fs.mkdir(`${testFolder}/${eparchy.replace(' ', '_')}/${blagochinie.replace(' ', '_')}/`, {recursive: true}).then(() => {
            fs1.writeFileSync(`./dist/${eparchy.replace(' ', '_')}/${blagochinie.replace(' ', '_')}/${titleCh.replace(' ', '_')}.html`, data, function (err) {
                if (err) throw err;
                console.log('Results Received');
            });
        });
    });
};

async function listMajors(auth) {
    const sheets = google.sheets({version: 'v4', auth});

    const resPromise = [
        'Гродненская епархия!A2:F',
        'Минская епархия!A2:F',
        'Могилёвская епархия!A2:F',
        'Могилёвская архиепархия!A2:F',
        'Пинская архиепархия!A2:F',
        'Полоцкая епархия!A2:F',
        'Виленская епархия!A2:F',
        'Виленская архиепархия!A2:F',
    ].map((range) => sheets.spreadsheets.values.get({
        spreadsheetId: '1A9dPH4ppRf5fWGYJzyKI9Z_82GKg-wq4HNLkDduY2r0',
        range,
    }))

    Promise.all(resPromise).then((resArr) => {
        resArr.forEach((res) => {
            handleRows(res);
        })
    });


}

authorize().then(listMajors).catch(console.error);

fs1.copyFileSync('./styles.css', './dist/styles.css');

const cteateIndexFile = (dir) => {
    fs1.readdir(dir, (err, files) => {
        const filesArr = [];
        files.forEach(file => {
            if (!file.endsWith('.css') && !file.endsWith('index.html')) {
                if (!~file.indexOf('.')) {
                    filesArr.push(file + '/index.html');
                } else {
                    filesArr.push(file);
                }
            }
            if (!file.endsWith('.css') && !file.endsWith('.html') && !~file.indexOf('.')) {
                cteateIndexFile(`${dir}/${file}`);
            }
        });
        fs1.writeFileSync(`${dir}/index.html`, `${filesArr.map((f) => `<a href="${dir.replace('./dist', rootRoute)}/${f}">${dir.replace('./dist', '')}/${f}</a>`).join('<br>\n')}`, function (err) {});
        console.log(filesArr);
    });
};
cteateIndexFile('./dist');
