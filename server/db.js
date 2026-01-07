const Database = require('better-sqlite3');
const db = new Database('lan_center.db', { verbose: console.log });

// Initialize tables
function init() {
    // Computers table: Persistent definitions of PCs
    db.exec(`
        CREATE TABLE IF NOT EXISTS computers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'available' -- available, occupied, maintenance
        );
    `);

    // Sessions table: History of usage
    // end_time can be null if open session
    // timestamp_end is the EXPECTED end time for fixed sessions
    // actual_end_time is when it was actually stopped (for reports)
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            computer_id TEXT,
            customer_name TEXT,
            mode TEXT, -- 'fixed' or 'open'
            start_time INTEGER,
            expected_end_time INTEGER, -- The target end time (if fixed)
            actual_end_time INTEGER,   -- When it was stopped
            price REAL DEFAULT 0,
            is_paid INTEGER DEFAULT 0, -- boolean
            active INTEGER DEFAULT 1,  -- 1 = currently running, 0 = history
            FOREIGN KEY(computer_id) REFERENCES computers(id)
        );
    `);

    // Extras table: Items sold
    db.exec(`
        CREATE TABLE IF NOT EXISTS extras (
            id TEXT PRIMARY KEY,
            session_id INTEGER,
            name TEXT,
            price REAL,
            time INTEGER,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
    `);

    // Actions/History log (for the "history" array in frontend)
    // We can just reconstruct this from sessions/extras usually, 
    // but the frontend "history" includes events like "add time".
    // Let's create a generic table for session events to be safe.
    db.exec(`
        CREATE TABLE IF NOT EXISTS session_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            type TEXT, -- start, add, extra, open
            description TEXT,
            minutes INTEGER,
            price REAL,
            time INTEGER,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
    `);
}

// Helpers
const getComputers = () => {
    const computers = db.prepare('SELECT * FROM computers').all();

    return computers.map(pc => {
        // Get active session if any
        const session = db.prepare('SELECT * FROM sessions WHERE computer_id = ? AND active = 1').get(pc.id);

        if (session) {
            const extras = db.prepare('SELECT * FROM extras WHERE session_id = ?').all(session.id);
            const events = db.prepare('SELECT type, minutes, price, time, description FROM session_events WHERE session_id = ? ORDER BY time ASC').all(session.id);

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

const ensureComputersExist = (count) => {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM computers').get().count;
    if (currentCount < count) {
        const insert = db.prepare('INSERT INTO computers (id, name, status) VALUES (?, ?, ?)');
        const insertMany = db.transaction((cnt) => {
            for (let i = currentCount; i < cnt; i++) {
                insert.run(String(i + 1), `PC-${String(i + 1).padStart(2, '0')}`, 'available');
            }
        });
        insertMany(count);
    }
};

const startSession = (computerId, durationMinutes, customerName, price, startTime) => {
    const now = startTime || Date.now();
    const endTime = now + durationMinutes * 60000;

    const trans = db.transaction(() => {
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('occupied', computerId);

        const info = db.prepare(`
            INSERT INTO sessions (computer_id, customer_name, mode, start_time, expected_end_time, price, active)
            VALUES (?, ?, 'fixed', ?, ?, ?, 1)
        `).run(computerId, customerName || 'Cliente', now, endTime, price || 0);

        const sessionId = info.lastInsertRowid;

        db.prepare(`
            INSERT INTO session_events (session_id, type, description, minutes, price, time)
            VALUES (?, 'start', ?, ?, ?, ?)
        `).run(sessionId, `Inicio (${durationMinutes} min)`, durationMinutes, price || 0, now);
    });

    trans();
};

const startOpenSession = (computerId, customerName, startTime) => {
    const now = startTime || Date.now();

    const trans = db.transaction(() => {
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('occupied', computerId);

        const info = db.prepare(`
            INSERT INTO sessions (computer_id, customer_name, mode, start_time, active)
            VALUES (?, ?, 'open', ?, 1)
        `).run(computerId, customerName || 'Cliente', now);

        const sessionId = info.lastInsertRowid;

        db.prepare(`
            INSERT INTO session_events (session_id, type, description, price, time)
            VALUES (?, 'open', 'Inicio Libre', 0, ?)
        `).run(sessionId, now);
    });

    trans();
};

const stopSession = (computerId) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
        if (session) {
            db.prepare('UPDATE sessions SET active = 0, actual_end_time = ? WHERE id = ?').run(now, session.id);
        }
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('available', computerId);
    });
    trans();
};


const addTime = (computerId, minutes, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id, expected_end_time FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
        if (!session) return;

        // If it's a fixed session (has expected_end_time), extend it
        if (session.expected_end_time) {
            const newEnd = session.expected_end_time + (minutes * 60000);
            db.prepare('UPDATE sessions SET expected_end_time = ?, price = price + ? WHERE id = ?').run(newEnd, price || 0, session.id);
        } else {
            // Open session, just add price? Usually open sessions run until stop.
            // But if adding time to open session... maybe it converts to fixed? 
            // Or just adds cost. Let's assume adds cost for now or just logging event.
            if (price) {
                db.prepare('UPDATE sessions SET price = price + ? WHERE id = ?').run(price, session.id);
            }
        }

        db.prepare(`
            INSERT INTO session_events (session_id, type, description, minutes, price, time)
            VALUES (?, 'add', ?, ?, ?, ?)
        `).run(session.id, `Aumentó ${minutes} min`, minutes, price || 0, now);
    });
    return trans();
};

const addExtra = (computerId, name, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
        if (!session) return;

        const extraId = Math.random().toString(36).substr(2, 9);

        db.prepare(`
            INSERT INTO extras (id, session_id, name, price, time)
            VALUES (?, ?, ?, ?, ?)
        `).run(extraId, session.id, name, price, now);

        db.prepare(`
            INSERT INTO session_events (session_id, type, description, price, time)
            VALUES (?, 'extra', ?, ?, ?)
        `).run(session.id, `Extra: ${name}`, price, now);
    });
    trans();
};

const togglePaid = (computerId) => {
    const session = db.prepare('SELECT id, is_paid FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
    if (!session) return;
    const newState = session.is_paid ? 0 : 1;
    db.prepare('UPDATE sessions SET is_paid = ? WHERE id = ?').run(newState, session.id);
};

const toggleMaintenance = (computerId) => {
    const pc = db.prepare('SELECT status FROM computers WHERE id = ?').get(computerId);
    if (!pc) return;

    if (pc.status === 'maintenance') {
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('available', computerId);
    } else {
        // If occupied, maybe stop session first?
        // For simplicity, force close session if exists
        stopSession(computerId); // This sets status available
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('maintenance', computerId);
    }
};

const moveSession = (fromId, toId) => {
    const trans = db.transaction(() => {
        const fromSession = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND active = 1').get(fromId);
        const toPc = db.prepare('SELECT status FROM computers WHERE id = ?').get(toId);

        if (!fromSession || !toPc || toPc.status !== 'available') return;

        // 1. Update session to new computer ID
        db.prepare('UPDATE sessions SET computer_id = ? WHERE id = ?').run(toId, fromSession.id);

        // 2. Update computers status
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('available', fromId);
        db.prepare('UPDATE computers SET status = ? WHERE id = ?').run('occupied', toId);
    });
    trans();
};


const updateSession = (computerId, newMode, durationMinutes, price) => {
    const now = Date.now();
    const trans = db.transaction(() => {
        const session = db.prepare('SELECT * FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
        if (!session) return;

        // FIXED -> FIXED (Update duration/price)
        if (session.mode === 'fixed' && newMode === 'fixed') {
            const newEndTime = session.start_time + (durationMinutes * 60000);
            db.prepare('UPDATE sessions SET expected_end_time = ?, price = ? WHERE id = ?').run(newEndTime, price, session.id);

            db.prepare(`
                INSERT INTO session_events (session_id, type, description, minutes, price, time)
                VALUES (?, 'update', ?, ?, ?, ?)
            `).run(session.id, `Actualizado a ${durationMinutes} min`, durationMinutes, price, now);
        }

        // FIXED -> OPEN (Switch to Open)
        else if (session.mode === 'fixed' && newMode === 'open') {
            db.prepare('UPDATE sessions SET mode = ?, expected_end_time = NULL, price = 0 WHERE id = ?').run('open', session.id);

            db.prepare(`
                INSERT INTO session_events (session_id, type, description, price, time)
                VALUES (?, 'update', 'Cambiado a Tiempo Libre', 0, ?)
            `).run(session.id, now);
        }

        // OPEN -> FIXED (Switch to Fixed)
        else if (session.mode === 'open' && newMode === 'fixed') {
            const newEndTime = session.start_time + (durationMinutes * 60000);
            db.prepare('UPDATE sessions SET mode = ?, expected_end_time = ?, price = ? WHERE id = ?').run('fixed', newEndTime, price, session.id);

            db.prepare(`
                INSERT INTO session_events (session_id, type, description, minutes, price, time)
                VALUES (?, 'update', ?, ?, ?, ?)
            `).run(session.id, `Cambiado a Fijo (${durationMinutes} min)`, durationMinutes, price, now);
        }
    });
    trans();
};

const updateCustomerName = (computerId, newName) => {
    const session = db.prepare('SELECT id FROM sessions WHERE computer_id = ? AND active = 1').get(computerId);
    if (!session) return;
    db.prepare('UPDATE sessions SET customer_name = ? WHERE id = ?').run(newName, session.id);
};

module.exports = {
    init,
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
    updateCustomerName
};
