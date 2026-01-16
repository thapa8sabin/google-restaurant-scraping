import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ setPosition, position }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [position, setPosition] = useState(null);
    const [radius, setRadius] = useState(1000); // meters
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            const res = await api.get('/admin/areas');
            setAreas(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleScrape = async () => {
        if (!position) {
            setMessage('Please select a location on the map.');
            return;
        }
        setLoading(true);
        setMessage('Scraping started...');
        try {
            await api.post('/admin/scrape', {
                lat: position.lat,
                lng: position.lng,
                radius: parseFloat(radius),
            });
            setMessage('Scrape triggered successfully!');
            fetchAreas();
        } catch (error) {
            setMessage('Error triggering scrape');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto border-r">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
                </div>

                <div className="bg-white p-4 rounded shadow mb-6">
                    <h2 className="font-semibold mb-2">New Scrape</h2>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Click on map to set center.</p>
                        {position && (
                            <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                                Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <button
                        onClick={handleScrape}
                        disabled={loading || !position}
                        className={`w-full py-2 rounded text-white font-bold ${loading || !position ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Processing...' : 'Trigger Scrape'}
                    </button>
                    {message && <p className="mt-2 text-sm text-center">{message}</p>}
                </div>

                <div>
                    <h2 className="font-semibold mb-2">Scrape History</h2>
                    <ul className="space-y-2">
                        {areas.map((area) => (
                            <li key={area.id} className="bg-white p-3 rounded shadow text-sm">
                                <div className="font-medium">ID: {area.id}</div>
                                <div className="text-gray-500">
                                    {new Date(area.createdAt).toLocaleString()}
                                </div>
                                <div>Radius: {area.radius}m</div>
                                <div className="text-xs break-all">Lat: {area.lat}, Lng: {area.lng}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Map */}
            <div className="w-2/3 relative">
                <MapContainer center={[27.7031, 85.3566]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker setPosition={setPosition} position={position} />
                    {position && <Circle center={position} radius={radius} />}

                    {/* Show past areas */}
                    {areas.map(area => (
                        <Circle key={area.id} center={[area.lat, area.lng]} radius={area.radius} pathOptions={{ color: 'gray', fillColor: 'gray', fillOpacity: 0.1 }} />
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default AdminDashboard;
