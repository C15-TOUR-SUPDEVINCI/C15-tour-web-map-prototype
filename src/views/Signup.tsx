
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { Eye, EyeOff } from 'lucide-react';
import './Signup.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

export default function Signup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    return (
        <div className="signup-container">
            <div className="signup-wrapper">
                <header className="signup-header">
                    <div className="signup-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="signup-logo" />
                    </div>
                </header>

                <div className="signup-card">
                    <div className="signup-card-header">
                        <h1 className="signup-title">Nouvel Utilisateur</h1>
                        <p className="signup-subtitle">Créez un compte pour un nouvel organisateur / administrateur.</p>
                    </div>

                    <form
                        className="signup-form"
                        onSubmit={async (e) => {
                            e.preventDefault();

                            if (password !== confirmPassword) {
                                setErrorMessage('Les mots de passe ne correspondent pas.');
                                return;
                            }

                            setLoading(true);
                            setErrorMessage('');

                            try {
                                const payload = { firstName, lastName, email, password, role: 'ADMINISTRATEUR' };
                                const response = await fetch('https://c15-tour-back.vercel.app/api/users', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify(payload)
                                });

                                if (!response.ok) {
                                    const errorData = await response.json();
                                    if (response.status === 401) {
                                        throw new Error("L'API refuse la création sans être déjà connecté (401). Demandez une route d'inscription publique.");
                                    }
                                    throw new Error(errorData.message || "Erreur lors de l'inscription");
                                }

                                alert('Utilisateur créé avec succès !');
                                navigate('/dashboard');
                            } catch (err: any) {
                                setErrorMessage(err.message || 'Une erreur est survenue.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <div className="signup-field">
                            <label className="signup-label" htmlFor="firstName">
                                Prénom
                            </label>
                            <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="Prénom"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="signup-input"
                                required
                            />
                        </div>

                        <div className="signup-field">
                            <label className="signup-label" htmlFor="lastName">
                                Nom
                            </label>
                            <Input
                                id="lastName"
                                name="lastName"
                                type="text"
                                placeholder="Nom"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="signup-input"
                                required
                            />
                        </div>

                        <div className="signup-field">
                            <label className="signup-label" htmlFor="email">
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
                                className="signup-input"
                            />
                        </div>

                        <div className="signup-field" style={{ position: 'relative' }}>
                            <label className="signup-label" htmlFor="password">
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
                                className="signup-input"
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

                        <div className="signup-field" style={{ position: 'relative' }}>
                            <label className="signup-label" htmlFor="confirmPassword">
                                Confirmer le mot de passe
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="signup-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}
                                aria-label={showConfirmPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="signup-actions">
                            <Button className="signup-submit" type="submit" disabled={loading}>
                                {loading ? 'Création en cours...' : "S'inscrire"}
                            </Button>
                        </div>
                    </form>

                    {errorMessage ? <p className="signup-error">{errorMessage}</p> : null}

                    <div className="signup-help">
                        <button
                            className="signup-link"
                            type="button"
                            onClick={() => navigate('/dashboard')}
                        >
                            Retour au Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="signup-illustration-container">
                <img src={vanIllustration} alt="" className="signup-illustration" />
            </div>
        </div>
    );
}
