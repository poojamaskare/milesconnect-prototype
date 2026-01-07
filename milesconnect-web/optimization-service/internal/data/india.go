package data

import "milesconnect-optimization/internal/models"

// IndianCities is a curated list of major cities across India for large-scale optimization testing
var IndianCities = []models.NamedLocation{
	// North
	{Name: "Delhi", Lat: 28.6139, Lng: 77.2090},
	{Name: "Jaipur", Lat: 26.9124, Lng: 75.7873},
	{Name: "Lucknow", Lat: 26.8467, Lng: 80.9462},
	{Name: "Kanpur", Lat: 26.4499, Lng: 80.3319},
	{Name: "Ghaziabad", Lat: 28.6692, Lng: 77.4538},
	{Name: "Ludhiana", Lat: 30.9010, Lng: 75.8573},
	{Name: "Agra", Lat: 27.1767, Lng: 78.0081},
	{Name: "Faridabad", Lat: 28.4089, Lng: 77.3178},
	{Name: "Meerut", Lat: 28.9845, Lng: 77.7064},
	{Name: "Varanasi", Lat: 25.3176, Lng: 82.9739},
	{Name: "Srinagar", Lat: 34.0837, Lng: 74.7973},
	{Name: "Amritsar", Lat: 31.6340, Lng: 74.8723},
	{Name: "Allahabad", Lat: 25.4358, Lng: 81.8463},
	{Name: "Chandigarh", Lat: 30.7333, Lng: 76.7794},
	{Name: "Jodhpur", Lat: 26.2389, Lng: 73.0243},
	{Name: "Kota", Lat: 25.2138, Lng: 75.8648},

	// West
	{Name: "Mumbai", Lat: 19.0760, Lng: 72.8777},
	{Name: "Pune", Lat: 18.5204, Lng: 73.8567},
	{Name: "Ahmedabad", Lat: 23.0225, Lng: 72.5714},
	{Name: "Surat", Lat: 21.1702, Lng: 72.8311},
	{Name: "Thane", Lat: 19.2183, Lng: 72.9781},
	{Name: "Vadodara", Lat: 22.3072, Lng: 73.1812},
	{Name: "Rajkot", Lat: 22.3039, Lng: 70.8022},
	{Name: "Nashik", Lat: 19.9975, Lng: 73.7898},
	{Name: "Aurangabad", Lat: 19.8762, Lng: 75.3433},
	{Name: "Navi Mumbai", Lat: 19.0330, Lng: 73.0297},
	{Name: "Nagpur", Lat: 21.1458, Lng: 79.0882},

	// South
	{Name: "Bangalore", Lat: 12.9716, Lng: 77.5946},
	{Name: "Chennai", Lat: 13.0827, Lng: 80.2707},
	{Name: "Hyderabad", Lat: 17.3850, Lng: 78.4867},
	{Name: "Visakhapatnam", Lat: 17.6868, Lng: 83.2185},
	{Name: "Coimbatore", Lat: 11.0168, Lng: 76.9558},
	{Name: "Vijayawada", Lat: 16.5062, Lng: 80.6480},
	{Name: "Madurai", Lat: 9.9252, Lng: 78.1198},
	{Name: "Mysore", Lat: 12.2958, Lng: 76.6394},
	{Name: "Kochi", Lat: 9.9312, Lng: 76.2673},
	{Name: "Thiruvananthapuram", Lat: 8.5241, Lng: 76.9366},

	// East & Central
	{Name: "Kolkata", Lat: 22.5726, Lng: 88.3639},
	{Name: "Indore", Lat: 22.7196, Lng: 75.8577},
	{Name: "Bhopal", Lat: 23.2599, Lng: 77.4126},
	{Name: "Patna", Lat: 25.5941, Lng: 85.1376},
	{Name: "Ranchi", Lat: 23.3441, Lng: 85.3096},
	{Name: "Dhanbad", Lat: 23.7957, Lng: 86.4304},
	{Name: "Howrah", Lat: 22.5958, Lng: 88.2636},
	{Name: "Gwalior", Lat: 26.2183, Lng: 78.1828},
	{Name: "Jabalpur", Lat: 23.1815, Lng: 79.9864},
	{Name: "Guwahati", Lat: 26.1445, Lng: 91.7362},
	{Name: "Bhubaneswar", Lat: 20.2961, Lng: 85.8245},
	{Name: "Raipur", Lat: 21.2514, Lng: 81.6296},
}

func GetAllIndiaLocations() []models.Location {
	locs := make([]models.Location, len(IndianCities))
	for i, c := range IndianCities {
		locs[i] = models.Location{Lat: c.Lat, Lng: c.Lng}
	}
	return locs
}
