/**
 * IceAdobe Ruffle Client Loader
 * Integrates Ruffle's WASM core with custom UI and configuration options.
 */

(async function () {
    'use strict';

    class IceAdobeClient {
        constructor() {
            this.config = null;
            this.ruffle = null;
            this.player = null;
        }

        async init() {
            try {
                // Load configuration
                const response = await fetch('./config.json');
                this.config = await response.json();
                
                console.log(`[${this.config.clientName}] Initializing client v${this.config.version}...`);

                // Load Ruffle API script dynamically if not already present
                await this.loadRuffleScript();

                // Wait for Ruffle to be ready and load WASM core
                window.RufflePlayer = window.RufflePlayer || {};
                this.ruffle = window.RufflePlayer.newest();

                this.setupPlayerContainer();
            } catch (error) {
                console.error(`[IceAdobe] Initialization failed:`, error);
            }
        }

        loadRuffleScript() {
            return new Promise((resolve, reject) => {
                if (window.RufflePlayer) {
                    return resolve();
                }
                const script = document.createElement('script');
                script.src = `${this.config.ruffleConfig.publicPath}ruffle.js`;
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Ruffle core script.'));
                document.head.appendChild(script);
            });
        }

        setupPlayerContainer() {
            // Create container element for the SWF file
            const container = document.getElementById('ice-adobe-container') || document.body;
            
            this.player = this.ruffle.createPlayer();
            this.player.id = 'ice-adobe-player-instance';
            this.player.style.width = '100%';
            this.player.style.height = '100%';
            
            container.appendChild(this.player);

            // Apply global Ruffle configuration (WASM loader options)
            window.RufflePlayer.config = this.config.ruffleConfig;
            
            console.log(`[IceAdobe] Player container ready. WASM engine loaded.`);
        }

        async loadSwf(swfUrl) {
            if (!this.player) {
                console.error('[IceAdobe] Player has not been initialized yet.');
                return;
            }
            console.log(`[IceAdobe] Loading SWF file: ${swfUrl}`);
            await this.player.load({
                url: swfUrl,
                ...this.config.ruffleConfig
            });
        }
    }

    // Export and auto-instantiate
    window.IceAdobe = IceAdobeClient;
    const client = new IceAdobeClient();
    await client.init();

    // Expose global helper to run SWFs easily
    window.loadFlash = (url) => client.loadSwf(url);
})();
