import React from 'react';
import {IonPage, IonContent, IonButton} from '@ionic/react';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
    return (
        <IonPage>
            <IonContent className = " landing-page">
                {/* Hero banner */}
                <section className = "landing-hero">
                    <div className = "landing-inner">
                        <div className = "hero-grid">
                            <div className = "hero-left">
                                <img
                                    src = "../public/assets/WeEat_logo_transparent.webp" alt = "Landing" className = "hero-logo">
                                
                                </img>
                                <h1 className = "hero-title">Allergen-aware restaurant menus, saved your way</h1>
                                <p className = "hero-subtitle">Find restaurants, explore menus, and save dishes that match your preferences and allergens</p>
                                <div className = "hero-cta">
                                    <IonButton className = "landing-page-btn"  fill= "solid" routerLink = "/login" expand = "block">
                                        Log In
                                    </IonButton>
                                    <IonButton routerLink = "/create-account" className = "hero-create" expand= "block">Create Account</IonButton>
                                </div>
                            </div>
                            <div className = "hero-right">
                                <img
                                    className = "hero-phone" src = "../public/assets/homepage.png" alt = "WeEat app preview">
                                
                                </img>
                            </div>
                        </div>
                    </div>
                </section>
            
            {/* about section */}
            <section className = "landing-about">
                <div className = "landing-inner">
                    <h2 className  = "about-title">About WeEat</h2>
                </div>
            </section>
            {/* about section */}
            <section className = "landing-how-it-works">
                <div className = "landing-inner">
                    <h2 className  = "about-title">How it Works</h2>
                </div>
            </section>
            </IonContent>
        </IonPage>);
    };

export default LandingPage;