/**
 * Live GPS Weather Service for Megane IV Dashboard & Ambient Display
 * Auto-detects GPS location once, caches permissions in localStorage, and prevents repetitive permission prompts.
 */

class WeatherService {
    constructor() {
        this.STORAGE_KEY = 'megane_gps_cache_v2';
        this.currentLat = 41.0082;
        this.currentLon = 28.9784;
        this.currentLocationName = 'İstanbul';
        this.isGpsAuto = true;
        this.hasRequestedPermission = false;

        this.cities = {
            gps: { name: 'Mevcut Konum (Canlı GPS)', lat: null, lon: null },
            istanbul: { name: 'İstanbul', lat: 41.0082, lon: 28.9784 },
            ankara: { name: 'Ankara', lat: 39.9334, lon: 32.8597 },
            izmir: { name: 'İzmir', lat: 38.4192, lon: 27.1287 },
            bursa: { name: 'Bursa', lat: 40.1885, lon: 29.0610 },
            antalya: { name: 'Antalya', lat: 36.8969, lon: 30.7133 },
            adana: { name: 'Adana', lat: 37.0000, lon: 35.3213 },
            trabzon: { name: 'Trabzon', lat: 41.0027, lon: 39.7168 },
            kocaeli: { name: 'Kocaeli', lat: 40.7654, lon: 29.9408 },
            konya: { name: 'Konya', lat: 37.8714, lon: 32.4846 },
            gaziantep: { name: 'Gaziantep', lat: 37.0662, lon: 37.3833 }
        };

        this.weatherCodeMap = {
            0: { desc: 'Açık & Güneşli', icon: 'fa-sun', ambientIcon: 'fa-sun' },
            1: { desc: 'Çoğunlukla Açık', icon: 'fa-cloud-sun', ambientIcon: 'fa-cloud-sun' },
            2: { desc: 'Parçalı Bulutlu', icon: 'fa-cloud-sun', ambientIcon: 'fa-cloud-sun' },
            3: { desc: 'Kapalı / Bulutlu', icon: 'fa-cloud', ambientIcon: 'fa-cloud' },
            45: { desc: 'Sisli Hava', icon: 'fa-smog', ambientIcon: 'fa-smog' },
            48: { desc: 'Yoğun Sis', icon: 'fa-smog', ambientIcon: 'fa-smog' },
            51: { desc: 'Hafif Çisenti', icon: 'fa-cloud-rain', ambientIcon: 'fa-cloud-rain' },
            53: { desc: 'Çisenti Yağış', icon: 'fa-cloud-rain', ambientIcon: 'fa-cloud-rain' },
            55: { desc: 'Yoğun Çisenti', icon: 'fa-cloud-showers-heavy', ambientIcon: 'fa-cloud-showers-heavy' },
            61: { desc: 'Hafif Yağmurlu', icon: 'fa-cloud-rain', ambientIcon: 'fa-cloud-rain' },
            63: { desc: 'Yağmurlu', icon: 'fa-cloud-rain', ambientIcon: 'fa-cloud-rain' },
            65: { desc: 'Kuvvetli Sağanak', icon: 'fa-cloud-showers-heavy', ambientIcon: 'fa-cloud-showers-heavy' },
            71: { desc: 'Hafif Kar Yağışlı', icon: 'fa-snowflake', ambientIcon: 'fa-snowflake' },
            73: { desc: 'Kar Yağışlı', icon: 'fa-snowflake', ambientIcon: 'fa-snowflake' },
            75: { desc: 'Yoğun Kar Yağışı', icon: 'fa-snowflake', ambientIcon: 'fa-snowflake' },
            80: { desc: 'Sağanak Yağmur', icon: 'fa-cloud-showers-water', ambientIcon: 'fa-cloud-showers-water' },
            95: { desc: 'Gök Gürültülü Fırtına', icon: 'fa-cloud-bolt', ambientIcon: 'fa-cloud-bolt' }
        };
    }

    async init() {
        // 1. Load cached coordinates from localStorage immediately
        this.loadCachedLocation();

        // 2. Initial weather fetch with cached or detected location
        await this.detectLiveLocation();

        // 3. Setup refresh interval (every 15 mins) using coordinates WITHOUT prompting
        setInterval(() => {
            this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
        }, 15 * 60 * 1000);
    }

    loadCachedLocation() {
        try {
            const cached = localStorage.getItem(this.STORAGE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data && data.lat && data.lon) {
                    this.currentLat = data.lat;
                    this.currentLon = data.lon;
                    this.currentLocationName = data.name || 'Mevcut Konum';
                }
            }
        } catch (e) {}
    }

    saveCachedLocation(lat, lon, name) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                lat: lat,
                lon: lon,
                name: name,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }

    async detectLiveLocation() {
        if (!('geolocation' in navigator)) {
            await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
            return;
        }

        // Check Permissions API if available
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const perm = await navigator.permissions.query({ name: 'geolocation' });
                if (perm.state === 'denied') {
                    // Never ask again if denied, use cached/default
                    await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
                    return;
                }
            } catch (e) {}
        }

        // Ask once with generous cache age
        if (this.hasRequestedPermission) {
            await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
            return;
        }
        this.hasRequestedPermission = true;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                this.currentLat = pos.coords.latitude;
                this.currentLon = pos.coords.longitude;
                this.isGpsAuto = true;

                // Reverse geocode to find exact Turkish city/district
                const locName = await this.reverseGeocode(this.currentLat, this.currentLon);
                this.currentLocationName = locName;
                this.saveCachedLocation(this.currentLat, this.currentLon, locName);

                await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
            },
            async (err) => {
                console.log('GPS weather fallback to cached location:', err.message);
                await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
            },
            { enableHighAccuracy: false, maximumAge: 3600000, timeout: 5000 }
        );
    }

    // Called silently by MeganeApp watchPosition to update coords without prompts
    async updateCoordsFromGps(lat, lon) {
        this.currentLat = lat;
        this.currentLon = lon;
        if (!this.currentLocationName || this.currentLocationName === 'İstanbul') {
            const locName = await this.reverseGeocode(lat, lon);
            this.currentLocationName = locName;
            this.saveCachedLocation(lat, lon, locName);
        }
    }

    async reverseGeocode(lat, lon) {
        try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=tr`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const district = data.locality || data.principalSubdivisionCity || '';
                const city = data.principalSubdivision || data.city || '';
                if (district && city && district !== city) {
                    return `${district}, ${city}`;
                } else if (city) {
                    return city;
                } else if (district) {
                    return district;
                }
            }
        } catch (e) {}
        return 'Mevcut Konum';
    }

    async fetchWeatherByCityKey(key) {
        if (key === 'gps') {
            this.isGpsAuto = true;
            this.loadCachedLocation();
            await this.fetchWeatherByCoords(this.currentLat, this.currentLon, this.currentLocationName);
            return;
        }

        this.isGpsAuto = false;
        const city = this.cities[key];
        if (city) {
            this.currentLat = city.lat;
            this.currentLon = city.lon;
            this.currentLocationName = city.name;
            await this.fetchWeatherByCoords(city.lat, city.lon, city.name);
        }
    }

    async fetchWeatherByCoords(lat, lon, locationLabel) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Open-Meteo response not ok');
            const data = await res.json();
            this.updateUI(locationLabel, data);
        } catch (err) {
            console.warn('Weather fetch fallback:', err);
            this.useFallback(locationLabel);
        }
    }

    getWeatherInfo(code) {
        return this.weatherCodeMap[code] || { desc: 'Açık & Güneşli', icon: 'fa-sun', ambientIcon: 'fa-sun' };
    }

    updateUI(locationLabel, data) {
        const cur = data.current;
        const codeInfo = this.getWeatherInfo(cur.weather_code);
        const temp = Math.round(cur.temperature_2m);
        const humidity = cur.relative_humidity_2m;
        const wind = Math.round(cur.wind_speed_10m);
        const feels = Math.round(cur.apparent_temperature);
        const rainProb = data.daily && data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : 0;

        // 1. Screensaver Update
        const ambCity = document.getElementById('ambientCity');
        const ambTemp = document.getElementById('ambientTemp');
        const ambCond = document.getElementById('ambientCondition');
        const ambHum = document.getElementById('ambientHumidity');
        const ambWind = document.getElementById('ambientWind');
        const ambIcon = document.getElementById('ambientWeatherIcon');

        if (ambCity) ambCity.innerHTML = `<i class="fa-solid fa-location-dot" style="font-size:0.9rem; margin-right:4px;"></i> ${locationLabel}`;
        if (ambTemp) ambTemp.textContent = temp;
        if (ambCond) ambCond.textContent = codeInfo.desc;
        if (ambHum) ambHum.textContent = `%${humidity}`;
        if (ambWind) ambWind.textContent = `${wind} km/s`;
        if (ambIcon) ambIcon.innerHTML = `<i class="fa-solid ${codeInfo.ambientIcon}"></i>`;

        // 2. Dashboard Topbar Compact Weather
        const dashCity = document.getElementById('dashCity');
        const dashTemp = document.getElementById('dashTemp');
        const dashIcon = document.getElementById('dashWeatherIcon');

        if (dashCity) dashCity.textContent = locationLabel;
        if (dashTemp) dashTemp.textContent = `${temp}°C`;
        if (dashIcon) dashIcon.className = `fa-solid ${codeInfo.icon}`;

        // 3. Dashboard Centered Prominent Weather Display
        const dTemp = document.getElementById('dashDetailedTemp');
        const dCond = document.getElementById('dashDetailedCondition');
        const dHum = document.getElementById('dashDetailedHumidity');
        const dFeels = document.getElementById('dashFeelsLike');
        const dWind = document.getElementById('dashDetailedWind');
        const dRain = document.getElementById('dashRainProb');
        const dIcon = document.getElementById('dashDetailedIcon');
        const dLocBadge = document.getElementById('dashLocationBadge');

        if (dTemp) dTemp.textContent = temp;
        if (dCond) dCond.textContent = codeInfo.desc;
        if (dHum) dHum.textContent = `%${humidity}`;
        if (dFeels) dFeels.textContent = `${feels}°C`;
        if (dWind) dWind.textContent = `${wind} km/s`;
        if (dRain) dRain.textContent = `%${rainProb}`;
        if (dLocBadge) dLocBadge.textContent = locationLabel;
        if (dIcon) dIcon.innerHTML = `<i class="fa-solid ${codeInfo.icon} weather-hero-icon"></i>`;

        // 4. Forecast Row (Centered 4 Days)
        if (data.daily && data.daily.time) {
            const forecastRow = document.getElementById('forecastRow');
            if (forecastRow) {
                const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                let html = '';
                for (let i = 1; i <= 4; i++) {
                    if (data.daily.time[i]) {
                        const date = new Date(data.daily.time[i]);
                        const dayName = days[date.getDay()];
                        const fCode = data.daily.weather_code[i];
                        const fInfo = this.getWeatherInfo(fCode);
                        const fMax = Math.round(data.daily.temperature_2m_max[i]);
                        const fMin = Math.round(data.daily.temperature_2m_min[i]);

                        html += `
                            <div class="forecast-day-card">
                                <span class="f-day-name">${dayName}</span>
                                <i class="fa-solid ${fInfo.icon} f-day-icon"></i>
                                <div class="f-day-temps">
                                    <span class="f-max">${fMax}°</span>
                                    <span class="f-min">${fMin}°</span>
                                </div>
                            </div>
                        `;
                    }
                }
                forecastRow.innerHTML = html;
            }
        }
    }

    useFallback(locationLabel) {
        const fakeData = {
            current: {
                temperature_2m: 26,
                relative_humidity_2m: 48,
                apparent_temperature: 27,
                weather_code: 1,
                wind_speed_10m: 16
            },
            daily: {
                time: [
                    new Date().toISOString(),
                    new Date(Date.now() + 86400000).toISOString(),
                    new Date(Date.now() + 172800000).toISOString(),
                    new Date(Date.now() + 259200000).toISOString(),
                    new Date(Date.now() + 345600000).toISOString()
                ],
                weather_code: [1, 0, 2, 61, 0],
                temperature_2m_max: [26, 28, 26, 23, 27],
                temperature_2m_min: [18, 19, 17, 16, 18],
                precipitation_probability_max: [10, 0, 20, 60, 5]
            }
        };
        this.updateUI(locationLabel, fakeData);
    }
}

window.weatherService = new WeatherService();
