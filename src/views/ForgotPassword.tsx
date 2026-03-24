import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './ForgotPassword.css';
import logoImg from '../assets/logo-tour95.png';
import vanIllustration from '../assets/van-illustration.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would normally call your backend API
        setSubmitted(true);
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-wrapper">
                <header className="forgot-password-header">
                    <div className="forgot-password-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="forgot-password-logo" />
                    </div>
                </header>

                <div className="forgot-password-card">
                    {!submitted ? (
                        <>
                            <div className="forgot-password-card-header">
                                <h1 className="forgot-password-title">Mot de passe oublié ?</h1>
                                <p className="forgot-password-subtitle">
                                    Entrez votre adresse mail pour réinitialiser votre mot de passe.
                                </p>
                            </div>

                            <form className="forgot-password-form" onSubmit={handleSubmit}>
                                <div className="forgot-password-field">
                                    <label className="forgot-password-label" htmlFor="email">
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
                                        className="forgot-password-input"
                                        required
                                    />
                                </div>

                                <div className="forgot-password-actions">
                                    <Button className="forgot-password-submit" type="submit">
                                        Réinitialiser votre mot de passe
                                    </Button>
                                </div>
                            </form>

                            <div className="forgot-password-help">
                                <button 
                                    className="forgot-password-link" 
                                    type="button"
                                    onClick={() => navigate('/login')}
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="forgot-password-success">
                            <div className="forgot-password-card-header">
                                <h1 className="forgot-password-title">Demande envoyée</h1>
                                <p className="forgot-password-subtitle success-message">
                                    Une demande de réinitialisation a été envoyée à votre mail.
                                </p>
                            </div>
                            
                            <div className="forgot-password-actions">
                                <Button 
                                    className="forgot-password-submit" 
                                    type="button"
                                    onClick={() => navigate('/login')}
                                >
                                    Retour
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="forgot-password-illustration-container">
                <img src={vanIllustration} alt="" className="forgot-password-illustration" />
            </div>
        </div>
    );
}
