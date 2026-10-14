import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.ifilmdirectory.app',
    appName: 'iFilmDirectory',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        // For production, use your actual domain
        // url: 'https://ifilmdirectory.com',
        // cleartext: true
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: "#0a0a0a",
            showSpinner: false,
            androidSpinnerStyle: 'small',
            splashFullScreen: true,
            splashImmersive: true
        },
        StatusBar: {
            style: 'dark',
            backgroundColor: '#0a0a0a'
        }
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
            releaseType: 'APK'
        }
    }
};

export default config;
