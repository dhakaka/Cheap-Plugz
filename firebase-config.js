// Firebase configuration for Cheap Plugz
const firebaseConfig = {
    apiKey: "AIzaSyCmrLK4OnFmNTo8yBWX1XU6e6PeEDOMZHs",
    authDomain: "cheaplugz-4c5cc.firebaseapp.com",
    projectId: "cheaplugz-4c5cc",
    storageBucket: "cheaplugz-4c5cc.firebasestorage.app",
    messagingSenderId: "847203022627",
    appId: "1:847203022627:web:e7b5e9e7a63606ce88fe96",
    measurementId: "G-2BWJJFNFHW"
};

// Initialize Firebase Realtime Database using the Compat SDK
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Global API Functions to replace localStorage.getItem('tonka_products')
window.getFirebaseProducts = function () {
    return new Promise((resolve, reject) => {
        db.ref('products').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                resolve(data ? data : []);
            })
            .catch(error => {
                console.error("Error fetching products from Firebase:", error);
                resolve([]); // Resolve with empty to not break the site
            });
    });
};

window.saveFirebaseProducts = function (products) {
    return db.ref('products').set(products)
        .then(() => {
            console.log("Products completely synchronized to Firebase!");
        })
        .catch((error) => {
            console.error("Error saving products:", error);
        });
};

// Automatically listen for updates in real-time
window.onProductsUpdate = function (callback) {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data ? data : []);
    });
};
