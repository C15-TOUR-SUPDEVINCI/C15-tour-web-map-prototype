
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './Signup.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

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
                        <h1 className="signup-title">Inscription</h1>
                        <p className="signup-subtitle">Crée ton compte pour accéder à ton espace et gérer tes trajets.</p>
                    </div>

                    <form
                        className="signup-form"
                        onSubmit={(e) => {
                            e.preventDefault();

                            if (password !== confirmPassword) {
                                setErrorMessage('Les mots de passe ne correspondent pas.');
                                return;
                            }

                            setErrorMessage('');
                            navigate('/dashboard');
                        }}
                    >
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

                        <div className="signup-field">
                            <label className="signup-label" htmlFor="password">
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
                                className="signup-input"
                            />
                        </div>

                        <div className="signup-field">
                            <label className="signup-label" htmlFor="confirmPassword">
                                Confirmer le mot de passe
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="signup-input"
                            />
                        </div>

                        <div className="signup-actions">
                            <Button className="signup-submit" type="submit">
                                S'inscrire
                            </Button>
                        </div>
                    </form>

                    {errorMessage ? <p className="signup-error">{errorMessage}</p> : null}

                    <div className="signup-help">
                        <button className="signup-link" type="button">
                            Déjà un compte ? Se connecter
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
