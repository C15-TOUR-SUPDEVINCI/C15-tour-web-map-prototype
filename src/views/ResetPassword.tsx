import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './ResetPassword.css';
import logoImg from '../assets/logo-tour95.png';


export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    return (
        <div className="reset-password-container">
            <div className="reset-password-wrapper">
                <header className="reset-password-header">
                    <div className="reset-password-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="reset-password-logo" />
                    </div>
                </header>

                <div className="reset-password-card">
                    {!emailSent ? (
                        <>
                            <div className="reset-password-card-header">
                                <h1 className="reset-password-title">Réinitialisation du mot de passe</h1>
                                <p className="reset-password-subtitle">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
                            </div>

                            <form
                                className="reset-password-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setEmailSent(true);
                                }}
                            >
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <Button type="submit">
                                    Envoyer le lien
                                </Button>
                            </form>

                            <div className="reset-password-footer">
                                <p>
                                    <a href="/login" className="reset-password-link">
                                        Retour à la connexion
                                    </a>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="reset-password-card-header">
                                <h1 className="reset-password-title">Email envoyé !</h1>
                                <p className="reset-password-subtitle">
                                    Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
                                </p>
                            </div>

                            <div className="reset-password-form">
                                <Button type="button" onClick={() => navigate('/new-password')}>
                                    Définir mon nouveau mot de passe
                                </Button>
                            </div>

                            <div className="reset-password-footer">
                                <p>
                                    <a href="/login" className="reset-password-link">
                                        Retour à la connexion
                                    </a>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}