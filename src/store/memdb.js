// src/store/memdb.js
export const users = new Map();      // id -> user
export const companies = new Map();  // id -> company
export const packages = new Map();   // id -> package

export const toArrayDesc = (map) =>
  Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
