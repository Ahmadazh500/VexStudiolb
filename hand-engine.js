// hand-engine.js

function setupHandModal() {
    if (sessionStorage.getItem('handModalSeen') === 'true') {
        return;
    }
    sessionStorage.setItem('handModalSeen', 'true');

    const modalHtml = `
        <div id="hand-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.5s ease;">
            <div style="background: #111; border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 16px; max-width: 500px; text-align: center; color: #fff; font-family: 'Manrope', sans-serif;">
                <h2 style="font-size: 2rem; margin-bottom: 10px;">Experience the Future</h2>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px; line-height: 1.5;">Would you like to try our experimental Hand-Free Navigation? This uses your camera to let you scroll. <strong>Once active, hold your index finger up and move it to scroll!</strong></p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button id="btn-hand-free" style="background: #fff; color: #000; border: none; padding: 12px 24px; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: transform 0.2s;">Try Hand-Free</button>
                    <button id="btn-classic" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 12px 24px; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s;">Classic Scrolling</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const overlay = document.getElementById('hand-modal-overlay');
    
    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 100);

    document.getElementById('btn-classic').addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    });

    document.getElementById('btn-hand-free').addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
        initializeHandEngine();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHandModal);
} else {
    setupHandModal();
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = "anonymous";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function initializeHandEngine() {
    // Inject UI feedback
    const uiHtml = `
        <video id="hand-video" style="display: none;"></video>
        <div id="hand-notification" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #111; color: #00FF00; padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(0,255,0,0.3); z-index: 9998; font-family: 'Manrope', sans-serif; font-size: 14px; opacity: 1; transition: opacity 0.5s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
            <span id="hand-status">Starting Camera...</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiHtml);

    try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

        const videoElement = document.getElementById('hand-video');
        const statusElement = document.getElementById('hand-status');
        let notificationHidden = false;

        let lastY = null;
        let lastX = null;
        const SENSITIVITY_Y = 1500; 
        const SENSITIVITY_X = 1500;
        const SMOOTHING = 0.5;
        
        let smoothedDeltaY = 0;
        let smoothedDeltaX = 0;

        const hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        let trackingConnected = false;
        
        hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                if (!trackingConnected) {
                    statusElement.innerHTML = "🖐️ <strong>Tracking Active!</strong> Hold index finger up & move to scroll.";
                    trackingConnected = true;
                    
                    if (!notificationHidden) {
                        setTimeout(() => {
                            const notif = document.getElementById('hand-notification');
                            if(notif) notif.style.opacity = '0';
                            notificationHidden = true;
                        }, 6000);
                    }
                }

                const landmarks = results.multiHandLandmarks[0];
                const indexFingerTip = landmarks[8];
                const currentY = indexFingerTip.y;
                const currentX = indexFingerTip.x;

                if (lastY !== null && lastX !== null) {
                    const rawDeltaY = currentY - lastY;
                    const rawDeltaX = currentX - lastX;

                    smoothedDeltaY = (rawDeltaY * SMOOTHING) + (smoothedDeltaY * (1 - SMOOTHING));
                    smoothedDeltaX = (rawDeltaX * SMOOTHING) + (smoothedDeltaX * (1 - SMOOTHING));

                    if (Math.abs(smoothedDeltaY) > 0.005 || Math.abs(smoothedDeltaX) > 0.005) {
                        window.scrollBy({
                            top: smoothedDeltaY * SENSITIVITY_Y,
                            left: smoothedDeltaX * -SENSITIVITY_X,
                            behavior: 'auto' 
                        });
                    }
                }

                lastY = currentY;
                lastX = currentX;
            } else {
                lastY = null;
                lastX = null;
            }
        });

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({image: videoElement});
            },
            width: 320,
            height: 240
        });

        statusElement.innerText = "Starting Camera...";
        camera.start().then(() => {
            statusElement.innerText = "Camera Active";
        }).catch(err => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                statusElement.innerHTML = "<strong>Security Error:</strong> HTTPS required.";
                alert("Camera Access Blocked.\n\nMobile browsers (like Safari and Chrome) require a secure HTTPS connection to use the camera. Because you are testing on a local IP network, the browser is blocking it.\n\nPlease upload this to your live Bluehost server (which has HTTPS) to test the hand tracking on your phone!");
            } else {
                statusElement.innerText = "Camera Error";
                console.error(err);
            }
        });

    } catch (e) {
        console.error("Failed to load hand tracking scripts", e);
        if (e && e.message && e.message.includes("getUserMedia")) {
             document.getElementById('hand-status').innerText = "HTTPS Required for Camera";
             alert("Camera Access Blocked.\n\nMobile browsers require a secure HTTPS connection to use the camera. Please upload this to your live server to test on mobile.");
        } else {
             document.getElementById('hand-status').innerText = "Load Failed";
        }
    }
}
