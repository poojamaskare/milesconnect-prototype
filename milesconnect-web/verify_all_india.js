
// Native fetch in Node 18+
async function verifyAllIndia() {
    console.log('Testing Genetic Algorithm on All India Data...');

    try {
        const response = await fetch('http://localhost:8081/optimize-india', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log(`✅ Success!`);
        console.log(`Optimized Route for All India Tour:`);
        console.log(`Total Distance: ${Math.round(data.total_distance_km)} km`);
        console.log(`Stops: ${data.route.length}`);

        // Print first few stops
        console.log('Start:', JSON.stringify(data.route[0]));
        console.log('End:', JSON.stringify(data.route[data.route.length - 1]));

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

verifyAllIndia();
