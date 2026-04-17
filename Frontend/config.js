/**
 * Centralized API Configuration
 * This file contains all backend API configuration
 * Change only this file to update API endpoints across the entire frontend
 */

const API_BASE_URL = 'https://api-soez2bw2ma-uc.a.run.app';

// Validation check
if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
    console.error('❌ CRITICAL: API_BASE_URL is not properly defined');
}

console.log('✅ API Configuration loaded. Base URL:', API_BASE_URL);

