document.addEventListener('DOMContentLoaded', () => {
    const fetchLocationBtn = document.getElementById('fetchLocationBtn');
    const locationDisplay = document.getElementById('locationDisplay');
  
    fetchLocationBtn.addEventListener('click', async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const locationInfo = await fetchLocation(latitude, longitude);
        
        locationDisplay.innerHTML = `
          <p>Your current location:</p>
          <p>City: ${locationInfo.city}</p>
          <p>State: ${locationInfo.state}</p>
          <p>Country: ${locationInfo.country}</p>
          <p>Latitude: ${locationInfo.latitude}</p>
          <p>Longitude: ${locationInfo.longitude}</p>
        `;
      } catch (error) {
        console.error('Error fetching location:', error);
        locationDisplay.innerHTML = '<p>Failed to fetch location. Please try again.</p>';
      }
    });
  
    // Function to get current position (latitude and longitude)
    function getCurrentPosition() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        } else {
          reject(new Error('Geolocation is not supported by this browser.'));
        }
      });
    }
  
    // Function to fetch location data from your API
    async function fetchLocation(latitude, longitude) {
      const response = await fetch(`http://localhost:3000/geolocation?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location data.');
      }
      return await response.json();
    }
  });
  