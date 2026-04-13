
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <header className="login-header">
                    <div className="login-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="login-logo" />
                    </div>
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
                                    login(token);
                                }
                                navigate('/dashboard');
                            } catch (err: any) {
                                setErrorMessage(err.message || 'Une erreur est survenue.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <div className="login-field">
                            <label className="login-label" htmlFor="email">
                                Email
                            </label>
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
                            <label className="login-label" htmlFor="password">
                                Mot de passe
                            </label>
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

                    {errorMessage ? <p style={{color: '#ff4d4f', textAlign: 'center', marginTop: '1rem', fontWeight: 500}}>{errorMessage}</p> : null}

                    <div className="login-help">
                        <button className="login-link" type="button">
                            Mot de passe oublié ?
                        </button>
                    </div>
                </div>
            </div>

            <div className="login-illustration-container">
                <img src={vanIllustration} alt="" className="login-illustration" />
            </div>
        </div>
    );
}
