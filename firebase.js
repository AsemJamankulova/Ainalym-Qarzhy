import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyAkqiJvINU1lUKlyzVkcTTAYyZm2rIB3tU",

    authDomain: "ainalym-qarzhy.firebaseapp.com",

    projectId: "ainalym-qarzhy",

    storageBucket: "ainalym-qarzhy.firebasestorage.app",

    messagingSenderId: "575286319270",

    appId: "1:575286319270:web:b1565b7622ee028043bc67"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// Передаём функции в window
window.db = db;
window.collection = collection;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.setDoc = setDoc;
window.doc = doc;
window.deleteDoc = deleteDoc;

// Экспортируем всё
export {
    db,
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    deleteDoc
};