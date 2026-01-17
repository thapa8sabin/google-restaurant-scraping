import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, DollarSign, Clock, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const RestaurantDetail = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const response = await api.get(`/restaurants/${id}`);
                setRestaurant(response.data);
            } catch (err) {
                setError('Failed to load restaurant details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurant();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    if (error || !restaurant) return (
        <div className="flex flex-col justify-center items-center h-screen text-red-500">
            <h2 className="text-2xl font-bold mb-4">{error || 'Restaurant not found'}</h2>
            <Link to="/" className="text-blue-500 hover:underline">Back to Map</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Image */}
            <div className="h-64 md:h-96 w-full bg-gray-300 relative">
                {restaurant.images && restaurant.images.length > 0 ? (
                    <img
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image Available
                    </div>
                )}
                <Link
                    to="/"
                    className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </Link>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 -mt-20 relative z-10">
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                            <div className="flex items-center text-gray-600 space-x-4">
                                <span className="flex items-center">
                                    <Star className="text-yellow-400 w-5 h-5 mr-1 fill-current" />
                                    <span className="font-semibold">{restaurant.rating || 'N/A'}</span>
                                    {restaurant.userRatingsTotal && (
                                        <span className="text-sm text-gray-400 ml-1">({restaurant.userRatingsTotal})</span>
                                    )}
                                </span>
                                <span className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {restaurant.priceLevel || 'Price N/A'}
                                </span>
                            </div>
                        </div>
                        <div className={`mt-4 md:mt-0 px-4 py-2 rounded-full font-semibold ${restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {restaurant.isOpen ? 'Open Now' : 'Closed'}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-gray-800">
                                    <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                                    Address
                                </h3>
                                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    {restaurant.address || 'Address not available'}
                                </p>
                            </section>

                            {/* Additional Details Placeholder */}
                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-gray-800">
                                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                                    Opening Hours
                                </h3>
                                <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    {/* Ideally this comes from backend, but scraper might not have it yet */}
                                    <p>Hours information not available</p>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar / More Images */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Photos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {restaurant.images && restaurant.images.slice(1, 5).map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`View ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                ))}
                            </div>
                            {(!restaurant.images || restaurant.images.length <= 1) && (
                                <p className="text-sm text-gray-500 italic">No additional photos.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetail;
