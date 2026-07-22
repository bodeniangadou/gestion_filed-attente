import http from 'k6/http';
import { check, sleep } from 'k6';

const API_KEY = __ENV.SUPABASE_API_KEY;
const BASE_URL = 'https://iyylwgxwcklhrvzbjkfp.supabase.co';

export const options = {
    stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
    ],
};

export default function () {
    // Exemple : Chercher les utilisateurs ayant le rôle 'agent' 
    // Cela correspond au SQL : SELECT * FROM utilisateur WHERE role = 'agent'
    const url = `${BASE_URL}/rest/v1/utilisateur?role=eq.agent`;
    
    const params = {
        headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json',
            'Prefer': 'count=exact', // Demande à Supabase de compter les résultats
        },
    };

    const res = http.get(url, params);

    check(res, {
        'status est 200': (r) => r.status === 200,
        'données reçues': (r) => r.json() !== null,
    });

    sleep(1);
}