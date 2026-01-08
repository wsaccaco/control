const Database = require('better-sqlite3');
const db = new Database('lan_center.db', { verbose: console.log });
const bcrypt = require('bcryptjs');

// Initialize tables
function init() {
    // Users Table for Cloud/SaaS Authentication
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            tenant_name TEXT,
            role TEXT DEFAULT 'user', -- admin, user
            status TEXT DEFAULT 'trial', -- trial, active, suspended
            valid_until INTEGER,
            created_at INTEGER
        );
    `);

    // Computers table: Persistent definitions of PCs
    db.exec(`
        CREATE TABLE IF NOT EXISTS computers (
            id TEXT,
            user_id TEXT, -- Tenant ID
            name TEXT NOT NULL,
            status TEXT DEFAULT 'available', -- available, occupied, maintenance
            PRIMARY KEY (id, user_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // Sessions table: History of usage
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            computer_id TEXT,
            customer_name TEXT,
            mode TEXT, -- 'fixed' or 'open'
            start_time INTEGER,
            expected_end_time INTEGER, -- The target end time (if fixed)
            actual_end_time INTEGER,   -- When it was stopped
            price REAL DEFAULT 0,
            is_paid INTEGER DEFAULT 0, -- boolean
            active INTEGER DEFAULT 1,  -- 1 = currently running, 0 = history
            FOREIGN KEY(user_id) REFERENCES users(id)
            -- We cannot easily FK to computers(id) because computer PK is composite now.
            -- But effectively it references computers(id, user_id)
        );
    `);

    // Extras table: Items sold
    db.exec(`
        CREATE TABLE IF NOT EXISTS extras (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            session_id INTEGER,
            name TEXT,
            price REAL,
            time INTEGER,
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);

    // Session Events
    db.exec(`
        CREATE TABLE IF NOT EXISTS session_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            session_id INTEGER,
            type TEXT, -- start, add, extra, open
            description TEXT,
            minutes INTEGER,
            price REAL,
            time INTEGER,
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);

    // Settings table: Global configuration
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT,
            user_id TEXT,
            value TEXT,
            PRIMARY KEY (key, user_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
}

// User Management
const createUser = (id, email, password, tenantName) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Default 7 days trial
    const validUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);

    // Check if this is the FIRST user ever -> Make Admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const role = userCount === 0 ? 'admin' : 'user';

    try {
        db.prepare(`
            INSERT INTO users (id, email, password_hash, tenant_name, role, status, valid_until, created_at)
            VALUES (?, ?, ?, ?, ?, 'trial', ?, ?)
        `).run(id, email, hash, tenantName, role, validUntil, Date.now());
        return { id, email, tenantName, role, status: 'trial' };
    } catch (e) {
        console.error('Error creating user:', e);
        return null;
    }
};

const getUserByEmail = (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

const getUserById = (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

// Settings
const getSettings = (userId) => {
    const rows = db.prepare('SELECT key, value FROM settings WHERE user_id = ?').all(userId);
    const settings = {};
    rows.forEach(row => {
        settings[row.key] = row.value;
    });
    return settings;
};

const updateSettings = (userId, newSettings) => {
    const insert = db.prepare('INSERT OR REPLACE INTO settings (key, user_id, value) VALUES (?, ?, ?)');
    const trans = db.transaction((data) => {
        for (const [key, value] of Object.entries(data)) {
            insert.run(key, userId, String(value));
        }
    });
    trans(newSettings);
};

const getAllUsers = () => {
    return db.prepare('SELECT id, email, tenant_name, role, status, valid_until, created_at FROM users ORDER BY created_at DESC').all();
};

const updateUserStatus = (id, status, validUntil) => {
    db.prepare('UPDATE users SET status = ?, valid_until = ? WHERE id = ?').run(status, validUntil, id);
};

// Computers & Sessions
const getComputers = (userId) => {
    const computers = db.prepare('SELECT * FROM computers WHERE user_id = ?').all(userId);

    return computers.map(pc => {
        // Get active session if any
        const session = db.prepare('SELECT * FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(pc.id, userId);

        if (session) {
            const extras = db.prepare('SELECT * FROM extras WHERE session_id = ? AND user_id = ?').all(session.id, userId);
            const events = db.prepare('SELECT type, minutes, price, time, description FROM session_events WHERE session_id = ? AND user_id = ? ORDER BY time ASC').all(session.id, userId);

            return {
                id: pc.id,
                name: pc.name,
                status: pc.status,
                mode: session.mode,
                startTime: session.start_time,
                endTime: session.expected_end_time,
                customerName: session.customer_name,
                isPaid: !!session.is_paid,
                extras: extras,
                history: events
            };
        } else {
            return {
                id: pc.id,
                name: pc.name,
                status: pc.status
            };
        }
    });
};

const ensureComputersExist = (userId, count) => {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM computers WHERE user_id = ?').get(userId).count;
    if (currentCount < count) {
        const insert = db.prepare('INSERT INTO computers (id, user_id, name, status) VALUES (?, ?, ?, ?)');
        const insertMany = db.transaction((cnt) => {
            for (let i = currentCount; i < cnt; i++) {
                insert.run(String(i + 1), userId, `PC-${String(i + 1).padStart(2, '0')}`, 'available');
            }
        });
        insertMany(count);
    }
};

const startSession = (userId, computerId, durationMinutes, customerName, price, startTime) => {
    const now = startTime || Date.now();
    const endTime = now + durationMinutes * 60000;

    const trans = db.transaction(() => {
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('occupied', computerId, userId);

        const info = db.prepare(`
            INSERT INTO sessions (user_id, computer_id, customer_name, mode, start_time, expected_end_time, price, active)
            VALUES (?, ?, ?, 'fixed', ?, ?, ?, 1)
        `).run(userId, computerId, customerName || 'Cliente', now, endTime, price || 0);

        const sessionId = info.lastInsertRowid;

        db.prepare(`
            INSERT INTO session_events (user_id, session_id, type, description, minutes, price, time)
            VALUES (?, ?, 'start', ?, ?, ?, ?)
        `).run(userId, sessionId, `Inicio (${durationMinutes} min)`, durationMinutes, price || 0, now);
    });

    trans();
};

const startOpenSession = (userId, computerId, customerName, startTime) => {
    const now = startTime || Date.now();

    const trans = db.transaction(() => {
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('occupied', computerId, userId);

        const info = db.prepare(`
            INSERT INTO sessions (user_id, computer_id, customer_name, mode, start_time, active)
            VALUES (?, ?, ?, 'open', ?, 1)
        `).run(userId, computerId, customerName || 'Cliente', now);

        const sessionId = info.lastInsertRowid;

        db.prepare(`
            INSERT INTO session_events (user_id, session_id, type, description, price, time)
            VALUES (?, ?, 'open', 'Inicio Libre', 0, ?)
        `).run(userId, sessionId, now);
    });

    trans();
};

const stopSession = (userId, computerId) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
        if (session) {
            db.prepare('UPDATE sessions SET active = 0, actual_end_time = ? WHERE id = ?').run(now, session.id);
        }
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('available', computerId, userId);
    });
    trans();
};


const addTime = (userId, computerId, minutes, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id, expected_end_time FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
        if (!session) return;

        if (session.expected_end_time) {
            const newEnd = session.expected_end_time + (minutes * 60000);
            db.prepare('UPDATE sessions SET expected_end_time = ?, price = price + ? WHERE id = ?').run(newEnd, price || 0, session.id);
        } else {
            if (price) {
                db.prepare('UPDATE sessions SET price = price + ? WHERE id = ?').run(price, session.id);
            }
        }

        db.prepare(`
            INSERT INTO session_events (user_id, session_id, type, description, minutes, price, time)
            VALUES (?, ?, 'add', ?, ?, ?, ?)
        `).run(userId, session.id, `Aumentó ${minutes} min`, minutes, price || 0, now);
    });
    return trans();
};

const addExtra = (userId, computerId, name, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
        if (!session) return;

        const extraId = Math.random().toString(36).substr(2, 9);

        db.prepare(`
            INSERT INTO extras (id, user_id, session_id, name, price, time)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(extraId, userId, session.id, name, price, now);

        db.prepare(`
            INSERT INTO session_events (user_id, session_id, type, description, price, time)
            VALUES (?, ?, 'extra', ?, ?, ?)
        `).run(userId, session.id, `Extra: ${name}`, price, now);
    });
    trans();
};

const togglePaid = (userId, computerId) => {
    const session = db.prepare('SELECT id, is_paid FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
    if (!session) return;
    const newState = session.is_paid ? 0 : 1;
    db.prepare('UPDATE sessions SET is_paid = ? WHERE id = ?').run(newState, session.id);
};

const toggleMaintenance = (userId, computerId) => {
    const pc = db.prepare('SELECT status FROM computers WHERE id = ? AND user_id = ?').get(computerId, userId);
    if (!pc) return;

    if (pc.status === 'maintenance') {
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('available', computerId, userId);
    } else {
        stopSession(userId, computerId);
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('maintenance', computerId, userId);
    }
};

const moveSession = (userId, fromId, toId) => {
    const trans = db.transaction(() => {
        const fromSession = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(fromId, userId);
        const toPc = db.prepare('SELECT status FROM computers WHERE id = ? AND user_id = ?').get(toId, userId);

        if (!fromSession || !toPc || toPc.status !== 'available') return;

        db.prepare('UPDATE sessions SET computer_id = ? WHERE id = ?').run(toId, fromSession.id);
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('available', fromId, userId);
        db.prepare('UPDATE computers SET status = ? WHERE id = ? AND user_id = ?').run('occupied', toId, userId);
    });
    trans();
};

const updateSession = (userId, computerId, newMode, durationMinutes, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT * FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
        if (!session) return;

        if (session.mode === 'fixed' && newMode === 'fixed') {
            const newEndTime = session.start_time + (durationMinutes * 60000);
            db.prepare('UPDATE sessions SET expected_end_time = ?, price = ? WHERE id = ?').run(newEndTime, price, session.id);

            db.prepare(`
                INSERT INTO session_events (user_id, session_id, type, description, minutes, price, time)
                VALUES (?, ?, 'update', ?, ?, ?, ?)
            `).run(userId, session.id, `Actualizado a ${durationMinutes} min`, durationMinutes, price, now);
        }
        else if (session.mode === 'fixed' && newMode === 'open') {
            db.prepare('UPDATE sessions SET mode = ?, expected_end_time = NULL, price = 0 WHERE id = ?').run('open', session.id);

            db.prepare(`
                INSERT INTO session_events (user_id, session_id, type, description, price, time)
                VALUES (?, ?, 'update', 'Cambiado a Tiempo Libre', 0, ?)
            `).run(userId, session.id, now);
        }
        else if (session.mode === 'open' && newMode === 'fixed') {
            const newEndTime = session.start_time + (durationMinutes * 60000);
            db.prepare('UPDATE sessions SET mode = ?, expected_end_time = ?, price = ? WHERE id = ?').run('fixed', newEndTime, price, session.id);

            db.prepare(`
                INSERT INTO session_events (user_id, session_id, type, description, minutes, price, time)
                VALUES (?, ?, 'update', ?, ?, ?, ?)
            `).run(userId, session.id, `Cambiado a Fijo (${durationMinutes} min)`, durationMinutes, price, now);
        }
    });
    trans();
};

const updateCustomerName = (userId, computerId, newName) => {
    const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND user_id = ? AND active = 1').get(computerId, userId);
    if (!session) return;
    db.prepare('UPDATE sessions SET customer_name = ? WHERE id = ?').run(newName, session.id);
};

module.exports = {
    init,
    createUser,
    getUserByEmail,
    getComputers,
    ensureComputersExist,
    startSession,
    startOpenSession,
    stopSession,
    addTime,
    addExtra,
    togglePaid,
    toggleMaintenance,
    moveSession,
    updateSession,
    updateCustomerName,
    getSettings,
    updateSettings,
    getAllUsers,
    updateUserStatus,
    getUserById
};
