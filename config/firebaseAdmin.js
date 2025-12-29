const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Make sure this path is correct

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "thrifti-bbf7c.appspot.com", 
  });
}

const bucket = admin.storage().bucket(); // ✅ Get the storage bucket

module.exports = { admin, bucket }; // ✅ Export both
