import http from 'k6/http';
import { check, sleep } from 'k6';

const API_KEY = __ENV.SUPABASE_API_KEY;
const BASE_URL = 'https://iyylwgxwcklhrvzbjkfp.supabase.co';

export const options = {
    scenarios: {
        // 1. LOAD TEST: Montée douce (0 -> 50) + descente
        load_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '30s', target: 50 },
                { duration: '30s', target: 50 },
                { duration: '20s', target: 0 },
            ],
            exec: 'parcoursPatient',
        },
        // 2. SPIKE TEST: Pic brutal (0 -> 200) + descente
        spike_test: {
            executor: 'ramping-vus',
            startTime: '1m30s',
            stages: [
                { duration: '10s', target: 200 },
                { duration: '20s', target: 200 },
                { duration: '20s', target: 0 },
            ],
            exec: 'parcoursPatient',
        },
        // 3. STRESS TEST: Pression max (0 -> 500) + descente
        stress_test: {
            executor: 'ramping-vus',
            startTime: '2m30s',
            stages: [
                { duration: '30s', target: 300 },
                { duration: '30s', target: 500 },
                { duration: '30s', target: 0 },
            ],
            exec: 'parcoursPatient',
        },
    },
};

// Fonction complète : Création (POST) suivi de consultation (GET)
export function parcoursPatient() {
    const params = {
        headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
    };

    // Action POST
    const payload = JSON.stringify({
        code: `TEST-${Math.random()}`,
        patient_nom: 'User',
        statut: 'En attente',
    });
    const resPost = http.post(`${BASE_URL}/rest/v1/ticket`, payload, params);
    check(resPost, { 'POST OK (201)': (r) => r.status === 201 });

    // Action GET
    const resGet = http.get(`${BASE_URL}/rest/v1/ticket?statut=eq.En%20attente`, params);
    check(resGet, { 'GET OK (200)': (r) => r.status === 200 });

    sleep(1);
}