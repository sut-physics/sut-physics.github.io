// Default users (seeded to Firebase on first run)
var DEFAULT_USERS = [
    { username: 'admin', password: 'coe2024', role: 'admin', displayName: 'Admin' }
];

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUThZbpRG8jeDphNfus2i0kM7fbEQ-Y3c",
  authDomain: "sut-dashboard.firebaseapp.com",
  databaseURL: "https://sut-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sut-dashboard",
  storageBucket: "sut-dashboard.firebasestorage.app",
  messagingSenderId: "1065359005555",
  appId: "1:1065359005555:web:a753c593df9f7bee549706",
  measurementId: "G-BK3S3SF67Y"
};

// Maximum sheets in comparison view
var MAX_COMPARISON_SHEETS = 4;

