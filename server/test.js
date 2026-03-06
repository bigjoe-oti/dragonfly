import dotenv from 'dotenv';
import fs from 'fs';
import {
    generateArchitectPlan
} from './services/orchestrator.js';
dotenv.config();

function log(msg) {
    fs.appendFileSync('./test_execution.log', msg + '\n');
}

log('Starting test...');
generateArchitectPlan({
        problemDescription: 'We need help parsing logs.',
        mode: 'blueprint',
    })
    .then((res) => {
        log('Success! ' + JSON.stringify(res));
    })
    .catch((err) => {
        log('Test Error: ' + err.stack);
    });