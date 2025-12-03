import React from 'react';
import {IonPage, IonContent, IonButton, IonIcon} from '@ionic/react';
import { searchOutline, logoGithub, logoLinkedin, mailOutline, shieldCheckmarkOutline, compassOutline, saveOutline, expandOutline, bookmarkSharp, bookOutline, bookmarkOutline } from "ionicons/icons"
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
                                    src = "../src/assets/WeEat_logo_transparent.webp" alt = "Landing" className = "hero-logo">
                                
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
                                    className = "hero-phone" src = "../src/assets/homepage.png" alt = "WeEat app preview">
                                
                                </img>
                            </div>
                        </div>
                    </div>
                </section>
            
            {/* about section */}
            <section className = "landing-about">
                    <div className = "about-inner">
                        <h2 className  = "about-title">About WeEat</h2>
                        <hr></hr>
                        <div className = "about-grid">
                            
                            <div className = "about-left">
                                
                                <img
                                    className = "about-image" src = "../src/assets/about-img.png" alt = "About WeEat">
                                </img>
                            </div>
                            <div className = "about-right">
                                <p className = "about-text">
                                    WeEat is dedicated to making dining out safe and 
                                    enjoyable for individuals with food allergies and 
                                    dietary restrictions. 
                                    With WeEat, users can easily find restaurants, 
                                    view detailed menu information, and 
                                    save dishes that align with their preferences and allergens. 
                                    Our mission is to empower individuals to make informed dining choices and enhance their overall dining experience.</p>
                            </div>
                            
                        </div>
                    </div>
            </section>
            {/* how it works section */}
            <section className = "landing-how-it-works">
                <div className = "landing-inner-hiw">
                    <h1 className  = "how-title">How it Works</h1>
                    <div className = "how-3-container">
                        <div className = "how-it-works-step">
                            
                            <IonIcon slot="end" icon={searchOutline} style={{ color: "white" }} />
                            
                            <h2 className = "step-title">Search Restaurants</h2>
                            <p className = "step-text">Easily find restaurants in your area that cater to your dietary needs.</p>
                        </div>
                        <div className = "how-it-works-step">
                            <IonIcon slot="end" icon={compassOutline} style={{ color: "white" }} />
                            <h2 className = "step-title">Explore Menus</h2>
                            <p className = "step-text">Browse detailed menus with allergen and dietary information.</p>
                        </div>
                        <div className = "how-it-works-step">
                            <IonIcon slot="end" icon={bookmarkOutline} style={{ color: "white" }} />
                            <h2 className = "step-title">Save Your Favorites</h2>
                            <p className = "step-text">Keep track of dishes that suit your preferences for easy access later.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* footer section */}
            <footer className = "landing-footer">
                <div className = "footer-inner">
                    <div className = "footer-left">
                        <p className = "footer-brand">© 2024 WeEat. All rights reserved.</p>
                        <p className = "footer-stack">Built with Ionic React + Firebase + Google Places</p>
                        
                    </div>

                    <div className = "footer-right">
                        <a className="footer-link" href="https://github.com/kaylavera99/we-eat.git" target="_blank" rel="noreferrer">
                        <IonIcon icon={logoGithub} /> GitHub
                        </a>
                        <a className="footer-link" href="kaylavd99@gmail.com">
                        <IonIcon icon={mailOutline} /> Contact
                        </a>
                        <a className="footer-link" href="www.linkedin.com/in/kayla-duffy-447794172" target="_blank" rel="noreferrer">
                        <IonIcon icon={logoLinkedin} /> LinkedIn
                        </a>
                    </div>
                    
                </div>
                
            </footer>
            </IonContent>
        </IonPage>);
    };

export default LandingPage;