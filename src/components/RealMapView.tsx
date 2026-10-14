import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Default coordinates for major Indian cities
const DEFAULT_COORDINATES: { [key: string]: [number, number] } = {
    'Hyderabad': [17.3850, 78.4867],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.7041, 77.1025],
    'Bangalore': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Pune': [18.5204, 73.8567],
    'Ahmedabad': [23.0225, 72.5714],
};

interface RealMapViewProps {
    businessName: string;
    location: string;
    city: string;
    latitude?: number;
    longitude?: number;
    onClose: () => void;
}

export default function RealMapView({
    businessName,
    location,
    city,
    latitude,
    longitude,
    onClose
}: RealMapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Get coordinates
        let coords: [number, number] = [17.4239, 78.4738]; // Default: Hyderabad Film Nagar

        if (latitude && longitude) {
            coords = [latitude, longitude];
        } else {
            // Try to match city
            for (const [cityName, cityCoords] of Object.entries(DEFAULT_COORDINATES)) {
                if (city.toLowerCase().includes(cityName.toLowerCase())) {
                    coords = cityCoords;
                    break;
                }
            }
        }

        // Initialize map
        const map = L.map(mapContainerRef.current, {
            center: coords,
            zoom: 15,
            zoomControl: true,
            scrollWheelZoom: true,
        });

        mapRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="relative">
                    <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold whitespace-nowrap">
                        ${businessName}
                    </div>
                    <div class="w-12 h-12 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-bounce">
                        <span class="material-symbols-outlined text-white text-xl">location_on</span>
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
        });

        // Add marker
        const marker = L.marker(coords, { icon: customIcon }).addTo(map);

        // Add popup
        marker.bindPopup(`
            <div class="text-center p-2">
                <h3 class="font-bold text-sm mb-1">${businessName}</h3>
                <p class="text-xs text-gray-600">${location}</p>
                <p class="text-xs text-gray-500">${city}</p>
            </div>
        `).openPopup();

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [businessName, location, city, latitude, longitude]);

    // Calculate coords for Get Directions button
    const getDirectionsCoords = (): [number, number] => {
        if (latitude && longitude) {
            return [latitude, longitude];
        }
        for (const [cityName, cityCoords] of Object.entries(DEFAULT_COORDINATES)) {
            if (city.toLowerCase().includes(cityName.toLowerCase())) {
                return cityCoords;
            }
        }
        return [17.4239, 78.4738];
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-[110] p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl shadow-lg hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-bold">Back</span>
                    </button>

                    <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl shadow-lg">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">LOCATION</p>
                        <p className="text-sm font-black text-zinc-900 dark:text-white">{city}</p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div ref={mapContainerRef} className="flex-1 w-full h-full" />

            {/* Bottom Info Card */}
            <div className="absolute bottom-0 left-0 right-0 z-[110] p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-2xl border border-zinc-100 dark:border-white/5">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">
                                {businessName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                                <span>{location}, {city}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const coords = getDirectionsCoords();
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
                            }}
                            className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">directions</span>
                            Directions
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Controls Info */}
            <div className="absolute top-20 right-4 z-[110] bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-lg border border-zinc-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-2">MAP CONTROLS</p>
                <div className="space-y-1 text-[10px] text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">touch_app</span>
                        <span>Drag to pan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                        <span>Pinch to zoom</span>
                    </div>
                </div>
            </div>

            {/* Style for custom marker */}
            <style>{`
                .custom-marker {
                    background: transparent;
                    border: none;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                .leaflet-popup-tip {
                    display: none;
                }
            `}</style>
        </div>
    );
}
