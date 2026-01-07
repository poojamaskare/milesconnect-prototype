// Standalone verification script
async function test() {
    console.log("Testing Go Service Integration...");

    // Mock data payload matching what routing.service.ts sends
    const payload = {
        start: { latitude: 19.076, longitude: 72.8777 },
        stops: [
            { id: "1", latitude: 18.5204, longitude: 73.8567 }, // Pune
            { id: "2", latitude: 12.9716, longitude: 77.5946 }, // Bangalore
            { id: "3", latitude: 28.7041, longitude: 77.1025 }  // Delhi
        ]
    };

    try {
        const response = await fetch("http://localhost:8081/optimize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log("✅ Go Service Responded:", result);
            if (result.length === 3) {
                console.log("✅ Correct number of stops returned");
            } else {
                console.error("❌ Incorrect counts");
            }
        } else {
            console.error("❌ Go Service Error:", response.status);
        }

    } catch (e) {
        console.error("❌ Failed to reach Go Service:", e);
    }
}

test();
