import React, { useState } from 'react';

const FilterBar = ({ onFilterChange }) => {
    const [search, setSearch] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [openNow, setOpenNow] = useState(false);


    const handleChange = (key, value) => {
        onFilterChange({ search, minRating, openNow, [key]: value });
        if (key === 'search') setSearch(value);
        if (key === 'minRating') setMinRating(value);
        if (key === 'openNow') setOpenNow(value);
    };

    return (
        <div className="bg-white p-4 shadow-md rounded-lg w-80 absolute top-4 left-4 z-[1000] overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Filters</h2>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search restaurants..."
                    className="w-full border p-2 rounded"
                    value={search}
                    onChange={(e) => handleChange('search', e.target.value)}
                />
            </div>

            {/* Rating */}
            <div className="mb-4">
                <label className="block mb-2 font-semibold">Min Rating: {minRating}</label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => handleChange('minRating', e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Open Now */}
            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={openNow}
                        onChange={(e) => handleChange('openNow', e.target.checked)}
                    />
                    <span className="font-semibold">Open Now</span>
                </label>
            </div>
        </div>
    );
};

export default FilterBar;
