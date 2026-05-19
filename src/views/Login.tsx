
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { Eye, EyeOff } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_MAP_CONFIG, OSM_ATTRIBUTION } from '../domain/constants';
import './Login.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function MapInvalidator() {
    const map = useMap();
    useEffect(() => {
        const t1 = setTimeout(() => map.invalidateSize(), 50);
        const t2 = setTimeout(() => map.invalidateSize(), 400);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [map]);
    return null;
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    return (
        <div className="login-root">

            {/* ── Fond carte Leaflet décoratif plein écran ── */}
            <div className="login-map-bg" aria-hidden="true">
                <MapContainer
                    center={DEFAULT_MAP_CONFIG.center}
                    zoom={DEFAULT_MAP_CONFIG.zoom - 2}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    keyboard={false}
                    attributionControl={false}
                    style={{ width: '100%', height: '100%' }}
                >
                    <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE} />
                    <MapInvalidator />
                </MapContainer>
            </div>

            {/* ── Overlay dégradé rose ── */}
            <div className="login-rose-overlay" aria-hidden="true" />

            {/* ── Illustration van ── */}
            <div className="login-van" aria-hidden="true">
                <img src={vanIllustration} alt="" />
            </div>

            {/* ── Contenu ── */}
            <div className="login-container">
                <div className="login-wrapper">
                    <header className="login-header">
                        <img src={logoImg} alt="Tour 95!" className="login-logo" />
                    </header>

                    <div className="login-card">
                        <div className="login-card-header">
                            <h1 className="login-title">Connexion</h1>
                            <p className="login-subtitle">Accède à ton espace pour créer et gérer tes trajets.</p>
                        </div>

                        <form
                            className="login-form"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setLoading(true);
                                setErrorMessage('');

                                try {
                                    const response = await fetch('https://c15-tour-back.vercel.app/api/auth/login', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, password })
                                    });

                                    if (!response.ok) {
                                        throw new Error("Identifiants incorrects ou adresse introuvable.");
                                    }

                                    const data = await response.json();
                                    const token = data.access_token || data.token;

                                    if (token) {
                                        const profileRes = await fetch('https://c15-tour-back.vercel.app/api/auth/profile', {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });

                                        if (profileRes.ok) {
                                            const userProfile = await profileRes.json();
                                            login(token, userProfile);
                                        } else {
                                            login(token, null);
                                        }
                                    }
                                    navigate('/dashboard');
                                } catch (err: unknown) {
                                    setErrorMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <div className="login-field">
                                <label className="login-label" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="ex: maxime@mail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="login-input"
                                />
                            </div>

                            <div className="login-field" style={{ position: 'relative' }}>
                                <label className="login-label" htmlFor="password">Mot de passe</label>
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}
                                    aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <div className="login-actions">
                                <Button className="login-submit" type="submit" disabled={loading}>
                                    {loading ? 'Connexion...' : 'Se connecter'}
                                </Button>
                            </div>
                        </form>

                        {errorMessage ? (
                            <p style={{ color: '#e11d48', textAlign: 'center', marginTop: '1rem', fontWeight: 700 }}>
                                {errorMessage}
                            </p>
                        ) : null}

                        <div className="login-help">
                            <button className="login-link" type="button" onClick={() => navigate('/reset-password')}>
                                Mot de passe oublié ?
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
