// src/ShelterFinder.js
import React, { useState, useEffect } from 'react';
import { Map, GoogleApiWrapper, DirectionsRenderer } from 'google-maps-react';

const ShelterFinder = ({ backgroundColor, textColor, google }) => {
  const [address, setAddress] = useState('');
  const [closestAddress, setClosestAddress] = useState('');
  const [eta, setEta] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [transportationMode, setTransportationMode] = useState('driving'); // Default to driving
  const [apiError, setApiError] = useState(null);
  const [kmlData, setKmlData] = useState(null);

  const googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your API key
  const kmlFileUrl = 'https://drive.google.com/file/d/10VcYQTxzL0MQzi3qBxydPY5yk8l8uTof/view?usp=sharing'; // Replace with the URL to your KML file

  useEffect(() => {
    const fetchKmlData = async () => {
      try {
        const response = await fetch(kmlFileUrl);
        const kmlContent = await response.text();
        setKmlData(kmlContent);
      } catch (error) {
        console.error('Error fetching KML data:', error);
        setApiError('Error fetching KML data');
      }
    };

    fetchKmlData();
  }, [kmlFileUrl]);

  const parseKmlAddresses = () => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlData, 'text/xml');
    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const addresses = [];

    for (let i = 0; i < placemarks.length; i++) {
      const addressElement = placemarks[i].getElementsByTagName('address')[0];
      if (addressElement) {
        const addressText = addressElement.textContent.trim();
        addresses.push(addressText);
      }
    }

    return addresses;
  };

  const hardcodedAddresses = kmlData ? parseKmlAddresses() : [];

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      findClosestAddress();
    }
  };

  const handleTransportationChange = (event) => {
    setTransportationMode(event.target.value);
  };

  const findClosestAddress = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${googleMapsApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const userLocation = data.results[0].geometry.location;
        const closest = await findClosestLocation(userLocation);
        setClosestAddress(closest.address);
        setEta(closest.eta);
        setShowDirections(true);
      } else {
        setApiError('Error fetching geolocation data');
      }
    } catch (error) {
      console.error('Error:', error);
      setApiError('Error fetching data');
    }
  };

  const findClosestLocation = async (userLocation) => {
    const promises = hardcodedAddresses.map(async (address) => {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${googleMapsApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        const distanceMatrixResponse = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLocation.lat},${userLocation.lng}&destinations=${location.lat},${location.lng}&mode=${transportationMode}&key=${googleMapsApiKey}`
        );
        const distanceData = await distanceMatrixResponse.json();

        if (distanceData.status === 'OK') {
          const duration = distanceData.rows[0].elements[0].duration.text;
          return { address, distance: distanceData.rows[0].elements[0].distance.value, eta: duration, location };
        } else {
          setApiError('Error fetching distance data');
        }
      } else {
        setApiError('Error fetching geolocation data');
      }
    });

    const results = await Promise.all(promises);
    return results.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    );
  };

  const containerStyle = {
    textAlign: 'center',
    marginTop: '50px',
    backgroundColor: backgroundColor || '#ffffff',
    color: textColor || '#000000',
  };

  const inputStyle = {
    borderBottom: '1px solid #000',
    textAlign: 'center',
    outline: 'none',
    marginTop: '10px',
  };

  const mapStyles = {
    width: '100%',
    height: '300px',
  };

  return (
    <div style={containerStyle}>
      <p>How close is shelter from</p>
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your address..."
        style={inputStyle}
      />
      {apiError && <p>{apiError}</p>}
      <div>
        <label>
          <input
            type="radio"
            value="walking"
            checked={transportationMode === 'walking'}
            onChange={handleTransportationChange}
          />
          Walking
        </label>
        <label>
          <input
            type="radio"
            value="driving"
            checked={transportationMode === 'driving'}
            onChange={handleTransportationChange}
          />
          Driving
        </label>
      </div>
      {showDirections && (
        <div>
          <p>Directions to the closest address:</p>
          <p>{`Go to ${closestAddress}`}</p>
          <p>{`ETA (${transportationMode}): ${eta}`}</p>
        </div>
      )}
      {showDirections && (
        <Map
          google={google}
          zoom={14}
          style={mapStyles}
          initialCenter={closestAddress.location}
        >
          <DirectionsRenderer
            directions={{
              routes: [
                {
                  legs: [
                    {
                      start_address: address,
                      end_address: closestAddress.address,
                      steps: [],
                    },
                  ],
                },
              ],
            }}
          />
        </Map>
      )}
    </div>
  );
};

export default GoogleApiWrapper({
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your API key
})(ShelterFinder);
