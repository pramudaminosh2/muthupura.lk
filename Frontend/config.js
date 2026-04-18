/**
 * Centralized API Configuration
 * This file contains all backend API configuration and Firebase configuration
 * Change only this file to update API endpoints across the entire frontend
 */

const API_BASE_URL = 'https://api-soez2bw2ma-uc.a.run.app';

// Firebase Configuration for Storage
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDGR24p3h94s8KfCwqxEDgJfC9sxJPB6zs",
    authDomain: "muthupuralk.firebaseapp.com",
    projectId: "muthupuralk",
    storageBucket: "muthupuralk.firebasestorage.app",
    messagingSenderId: "589862208063",
    appId: "1:589862208063:web:dc1d00e00bcab0cf8e5c70",
    measurementId: "G-NJVKKR7BXY"
};

// Validation check
if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
    console.error('❌ CRITICAL: API_BASE_URL is not properly defined');
}

if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.projectId) {
    console.error('❌ CRITICAL: Firebase configuration is incomplete');
}

console.log('✅ API Configuration loaded. Base URL:', API_BASE_URL);
console.log('✅ Firebase Configuration loaded. Project:', FIREBASE_CONFIG.projectId);

