import fs from 'fs';
import path from 'path';

/**
 * IsolatedStore
 * Provides a lightweight, thread-safe, isolated JSON-document database
 * implementing the canonical Database-per-Service microservices pattern.
 * Each microservice instantiates its own isolated store with a dedicated
 * disk file. Cross-database queries or shared access are strictly prohibited.
 */
export class IsolatedStore {
  constructor({ dbPath, name = 'IsolatedDatabase', initialData = {} }) {
    this.name = name;
    this.dbPath = path.resolve(dbPath);
    this.dir = path.dirname(this.dbPath);
    this.data = {};
    this.isWriting = false;

    this._init(initialData);
  }

  _init(initialData) {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn(`[${this.name}] Corrupt DB file, recovering with defaults:`, err.message);
        this.data = { ...initialData };
        this._persistSync();
      }
    } else {
      this.data = { ...initialData };
      this._persistSync();
    }
  }

  _persistSync() {
    try {
      const tmpPath = `${this.dbPath}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.dbPath);
    } catch (err) {
      console.error(`[${this.name}] Atomic persistence error:`, err);
    }
  }

  collection(collectionName) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
      this._persistSync();
    }

    const store = this;
    const colName = collectionName;

    return {
      getAll() {
        return [...(store.data[colName] || [])];
      },

      findById(id) {
        return (store.data[colName] || []).find(item => item.id === id) || null;
      },

      find(predicate) {
        const items = store.data[colName] || [];
        if (typeof predicate === 'function') {
          return items.filter(predicate);
        }
        if (typeof predicate === 'object' && predicate !== null) {
          return items.filter(item => {
            return Object.entries(predicate).every(([k, v]) => item[k] === v);
          });
        }
        return [...items];
      },

      findOne(predicate) {
        const items = store.data[colName] || [];
        if (typeof predicate === 'function') {
          return items.find(predicate) || null;
        }
        if (typeof predicate === 'object' && predicate !== null) {
          return items.find(item => {
            return Object.entries(predicate).every(([k, v]) => item[k] === v);
          }) || null;
        }
        return items[0] || null;
      },

      insert(doc) {
        const id = doc.id || `${colName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const record = {
          ...doc,
          id,
          createdAt: doc.createdAt || new Date().toISOString()
        };
        store.data[colName] = store.data[colName] || [];
        store.data[colName].push(record);
        store._persistSync();
        return record;
      },

      update(id, updates) {
        const items = store.data[colName] || [];
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;

        const updated = {
          ...items[index],
          ...updates,
          id, // ensure ID is immutable
          updatedAt: new Date().toISOString()
        };
        items[index] = updated;
        store._persistSync();
        return updated;
      },

      delete(id) {
        const items = store.data[colName] || [];
        const initialLen = items.length;
        store.data[colName] = items.filter(item => item.id !== id);
        const deleted = store.data[colName].length < initialLen;
        if (deleted) store._persistSync();
        return deleted;
      },

      count(predicate) {
        if (!predicate) return (store.data[colName] || []).length;
        return this.find(predicate).length;
      },

      setAll(newRecords) {
        store.data[colName] = [...newRecords];
        store._persistSync();
      }
    };
  }

  getMetadata() {
    let sizeBytes = 0;
    try {
      if (fs.existsSync(this.dbPath)) {
        sizeBytes = fs.statSync(this.dbPath).size;
      }
    } catch {}

    const collections = {};
    for (const [key, value] of Object.entries(this.data)) {
      if (Array.isArray(value)) {
        collections[key] = value.length;
      }
    }

    return {
      name: this.name,
      dbPath: this.dbPath,
      isolationPattern: 'Database-per-Service (Isolated File Storage)',
      sizeBytes,
      collections,
      status: 'healthy'
    };
  }
}
