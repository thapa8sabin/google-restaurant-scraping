import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import FilterBar from '../components/FilterBar';

// Fix Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const center = [27.7031, 85.3566]; // Default Kathmandu

const PublicMap = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        fetchRestaurants();
    }, [filters]);

    const fetchRestaurants = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.minRating) params.append('minRating', filters.minRating);
            if (filters.openNow) params.append('openNow', 'true');

            const response = await api.get(`/restaurants?${params.toString()}`);
            setRestaurants(response.data);
        } catch (error) {
            console.error('Failed to fetch restaurants', error);
        }
    };

    return (
        <div className="relative h-screen w-full">
            <FilterBar onFilterChange={setFilters} />
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {restaurants.map((restaurant) => (
                    <Marker key={restaurant.id} position={[restaurant.lat, restaurant.lng]}>
                        <Popup>
                            <div className="min-w-[150px]">
                                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                                {restaurant.images && restaurant.images.length > 0 && (
                                    <img src={restaurant.images[0]} alt={restaurant.name} className="w-full h-24 object-cover my-2 rounded" />
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span>⭐ {restaurant.rating}</span>
                                </div>
                                {restaurant.isOpen !== null && (
                                    <div className={`text-xs mt-1 ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                        {restaurant.isOpen ? 'Open Now' : 'Closed'}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default PublicMap;
