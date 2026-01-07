// Native fetch is available in Node.js 18+

async function verifyLoadOptimization() {
    console.log('Testing 1D Bin Packing (Fleet Allocation)...');

    // Scenario: 1 Truck (40T Capacity), 1 Shipment (32T Weight)
    const payload = {
        vehicles: [
            { id: 'v1-bharatbenz-2028', capacity_kg: 40000, current_load: 0 }
        ],
        shipments: [
            { id: 's1-heavy-load', weight_kg: 32000 }
        ]
    };

    try {
        const response = await fetch('http://localhost:8081/optimize-load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        // Assertions
        const allocation = data.allocations[0];
        if (allocation && allocation.vehicle_id === 'v1-bharatbenz-2028' && allocation.utilization_pct === 80) {
            console.log('✅ SUCCESS: Truck assigned with 80% utilization.');
        } else {
            console.error('❌ FAILURE: Incorrect allocation.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

verifyLoadOptimization();
