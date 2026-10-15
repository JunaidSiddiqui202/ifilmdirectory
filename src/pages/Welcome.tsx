import Login from './Login';

/**
 * Welcome Page - Merged with Login into a unified, cinematic onboarding & authentication hub
 * Both /welcome and /login routes serve this cohesive experience.
 */
export default function Welcome() {
    return <Login />;
}
