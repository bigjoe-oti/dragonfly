import fs from 'fs';
import {
    generateArchitectPlan
} from './services/orchestrator.js';

async function test() {
    try {
        fs.writeFileSync('test_output.json', JSON.stringify({
            status: 'started'
        }));
        const result = await generateArchitectPlan({
            problemDescription: 'Test prompt for a chef job',
            mode: 'prompt',
        });
        fs.writeFileSync('test_output.json', JSON.stringify({
            status: 'success',
            result
        }, null, 2));
    } catch (err) {
        fs.writeFileSync(
            'test_output.json',
            JSON.stringify({
                    status: 'error',
                    message: err.message,
                    stack: err.stack,
                    response: err.response ? err.response.data : null,
                },
                null,
                2
            )
        );
    }
}

test();