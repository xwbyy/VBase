const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const sheetConfig = require('./sheet.json');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const serviceAccountAuth = new JWT({
  email: sheetConfig.GOOGLE_CLIENT_EMAIL,
  key: sheetConfig.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(sheetConfig.GOOGLE_SHEET_ID, serviceAccountAuth);

async function initSheets() {
    try {
        await doc.loadInfo();
        console.log(`Connected to Spreadsheet: ${doc.title}`);
        
        // Ensure Users sheet exists
        let usersSheet = doc.sheetsByTitle['Users'];
        if (!usersSheet) {
            usersSheet = await doc.addSheet({ title: 'Users', headerValues: ['id', 'email', 'password', 'name', 'plan', 'apiKey', 'requests', 'createdAt', 'role'] });
        }

        // Ensure Databases sheet exists
        let dbsSheet = doc.sheetsByTitle['Databases'];
        if (!dbsSheet) {
            dbsSheet = await doc.addSheet({ title: 'Databases', headerValues: ['id', 'name', 'type', 'description', 'ownerEmail', 'createdAt'] });
        }
        
        return { usersSheet, dbsSheet };
    } catch (e) {
        console.error('Error initializing Google Sheets:', e);
        return null;
    }
}

async function loadUsers() {
    const { usersSheet } = await initSheets();
    if (!usersSheet) return {};
    const rows = await usersSheet.getRows();
    const loadedUsers = {};
    rows.forEach(row => {
        loadedUsers[row.get('email')] = {
            id: row.get('id'),
            email: row.get('email'),
            password: row.get('password'),
            name: row.get('name'),
            plan: row.get('plan'),
            apiKey: row.get('apiKey'),
            requests: parseInt(row.get('requests')) || 0,
            createdAt: row.get('createdAt'),
            role: row.get('role'),
            limits: { free: 500, vip1: 10000, vip2: 20000, vip3: 50000, enterprise: 999999 },
            databases: [] // Will be populated from Databases sheet
        };
    });
    return loadedUsers;
}

async function saveUser(user) {
    const { usersSheet } = await initSheets();
    if (!usersSheet) return;
    const rows = await usersSheet.getRows();
    const existingRow = rows.find(r => r.get('email') === user.email);
    if (existingRow) {
        existingRow.assign({
            plan: user.plan,
            requests: user.requests.toString(),
            apiKey: user.apiKey
        });
        await existingRow.save();
    } else {
        await usersSheet.addRow({
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            plan: user.plan,
            apiKey: user.apiKey,
            requests: user.requests.toString(),
            createdAt: user.createdAt.toString(),
            role: user.role || 'user'
        });
    }
}

async function loadDatabases() {
    const { dbsSheet } = await initSheets();
    if (!dbsSheet) return {};
    const rows = await dbsSheet.getRows();
    const dbsByEmail = {};
    rows.forEach(row => {
        const db = {
            id: row.get('id'),
            name: row.get('name'),
            type: row.get('type'),
            description: row.get('description'),
            ownerEmail: row.get('ownerEmail'),
            createdAt: row.get('createdAt'),
            records: [] 
        };
        if (!dbsByEmail[db.ownerEmail]) dbsByEmail[db.ownerEmail] = [];
        dbsByEmail[db.ownerEmail].push(db);
    });
    return dbsByEmail;
}

async function saveDatabase(userId, db) {
    const { dbsSheet } = await initSheets();
    if (!dbsSheet) return;
    await dbsSheet.addRow({
        id: db.id,
        name: db.name,
        type: db.type,
        description: db.description,
        ownerEmail: db.ownerEmail,
        createdAt: db.createdAt.toString()
    });
}

module.exports = { initSheets, loadUsers, saveUser, loadDatabases, saveDatabase, doc };
