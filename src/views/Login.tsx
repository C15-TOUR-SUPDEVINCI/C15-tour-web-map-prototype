
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './Login.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

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
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate('/dashboard');
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

                        <div className="login-field">
                            <label className="login-label" htmlFor="password">
                                Mot de passe
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                            />
                        </div>

                        <div className="login-actions">
                            <Button className="login-submit" type="submit">
                                Se connecter
                            </Button>
                        </div>
                    </form>

                    <div className="login-help">
                        <button 
                            className="login-link" 
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Mot de passe oublié ?
                        </button>
                        <button className="login-link" type="button">
                            Créer un compte
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
