        // Global variables
        let scene, camera, renderer, controls;
        let sun, earth, atmosphere, heatGlow;
        let rays = [];
        let co2Level = 350;
        let heatIntensity = 0.5;
        let temperature = 15.0;
        let timeAccelerated = 0;
        let earthRotationEnabled = true;
        let isDraggingEarth = false;
        let previousMousePosition = { x: 0, y: 0 };
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        
        // Temperature thresholds for warnings
        const temperatureThresholds = {
            '-50': { warning: 'freezeWarning', message: '-50°C: Extreme freeze conditions' },
            '-30': { warning: 'freezeWarning', message: '-30°C: Arctic conditions' },
            '-10': { warning: 'freezeWarning', message: '-10°C: Deep freeze conditions' },
            40: { warning: 'warning40', message: '40°C: Human survival threatened' },
            50: { warning: 'warning50', message: '50°C: Water sources evaporating' },
            60: { warning: 'warning60', message: '60°C: Most life cannot survive' },
            70: { warning: 'warning70', message: '70°C: Oceans boiling at surface' },
            80: { warning: 'warning80', message: '80°C: Human civilization ends' },
            100: { warning: 'warning100', message: '100°C: All complex life extinct' }
        };
        
        // Initialize the simulation
        init();
        
        function init() {
            // Create scene
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x0c0c2e, 50, 200);
            
            // Create camera with much closer zoom capability
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            // Initial camera position to show sun in front and Earth in left bottom corner
            camera.position.set(0, 15, 30);
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('simulationCanvas').appendChild(renderer.domElement);
            
            // Add orbit controls with much closer zoom
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 1;  // Can zoom very close (reduced from 5)
            controls.maxDistance = 300; // Increased zoom out capability (increased from 150)
            controls.maxPolarAngle = Math.PI * 0.95; // Allow looking more from above
            controls.minPolarAngle = Math.PI * 0.05; // Allow looking more from below
            
            // Create celestial bodies with Earth in left bottom corner and sun in front
            createSun();
            createEarth();
            createInfraredRays();
            createAtmosphere();
            createHeatGlow();
            createStars(); // More stars added
            setupLighting();
            
            // Setup event listeners
            setupEventListeners();
            
            // Start animation
            animate();
        }
        
        function createSun() {
            // Sun geometry - Large and bright
            const sunGeometry = new THREE.SphereGeometry(8, 64, 64);
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffaa00,
                emissiveIntensity: 1.2
            });
            
            // Sun positioned in front (slightly to the right)
            sun = new THREE.Mesh(sunGeometry, sunMaterial);
            sun.position.set(25, 5, -20); // Position sun in front
            sun.castShadow = true;
            scene.add(sun);
            
            // Sun corona
            const coronaGeometry = new THREE.SphereGeometry(8.8, 32, 32);
            const coronaMaterial = new THREE.ShaderMaterial({
                uniforms: { time: { value: 0 } },
                vertexShader: `
                    varying vec3 vPosition;
                    void main() {
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    varying vec3 vPosition;
                    void main() {
                        float intensity = 0.5 + 0.5 * sin(time + length(vPosition) * 2.0);
                        gl_FragColor = vec4(1.0, 0.8, 0.2, 0.5 * intensity);
                    }
                `,
                transparent: true,
                side: THREE.BackSide
            });
            
            const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
            sun.add(corona);
            
            // Animate corona
            setInterval(() => {
                coronaMaterial.uniforms.time.value += 0.05;
            }, 100);
        }
        
        function createEarth() {
            // Earth geometry
            const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
            
            // Earth material
            const earthMaterial = new THREE.MeshPhongMaterial({
                color: 0x2299ff,
                specular: 0x222222,
                shininess: 20
            });
            
            // Try to load texture
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load('earth8.jpg',
                (texture) => {
                    earthMaterial.map = texture;
                    earthMaterial.color.set(0xffffff);
                    earthMaterial.needsUpdate = true;
                },
                undefined,
                () => {
                    console.log('Using fallback Earth color');
                }
            );
            
            earth = new THREE.Mesh(earthGeometry, earthMaterial);
            // Earth positioned in left bottom corner
            earth.position.set(-25, -15, 0); // Left bottom corner
            earth.castShadow = true;
            earth.receiveShadow = true;
            scene.add(earth);
        }
        
        function createInfraredRays() {
            rays = [];
            
            // Create infrared rays from Sun to Earth
            for (let i = 0; i < 25; i++) { // Increased number of rays
                const points = [];
                const start = sun.position.clone();
                const end = earth.position.clone();
                const segments = 20; // More segments for smoother rays
                
                for (let j = 0; j <= segments; j++) {
                    const t = j / segments;
                    let point = new THREE.Vector3().lerpVectors(start, end, t);
                    
                    if (j > 0 && j < segments) {
                        const direction = new THREE.Vector3().subVectors(end, start).normalize();
                        const perpendicular = new THREE.Vector3(
                            -direction.z,
                            direction.y,
                            direction.x
                        ).normalize();
                        
                        const offsetMagnitude = Math.sin(t * Math.PI) * 6; // Increased offset for more visible rays
                        const randomOffset = (Math.random() - 0.5) * 2;
                        point.add(perpendicular.multiplyScalar(offsetMagnitude + randomOffset));
                    }
                    
                    points.push(point);
                }
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0xff8800, // Changed to more orange color for sun rays
                    transparent: true,
                    opacity: 0.9,
                    linewidth: 4 // Thicker rays
                });
                
                const ray = new THREE.Line(geometry, material);
                ray.userData.isRay = true; // Mark as ray for click detection
                scene.add(ray);
                rays.push({ line: ray, baseOpacity: 0.9, trapped: false });
            }
        }
        
        function createAtmosphere() {
            const atmosphereGeometry = new THREE.SphereGeometry(5.3, 64, 64);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    color1: { value: new THREE.Color(0x00ff88) },
                    color2: { value: new THREE.Color(0xff8800) },
                    opacity: { value: 0.3 },
                    time: { value: 0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color1;
                    uniform vec3 color2;
                    uniform float opacity;
                    uniform float time;
                    varying vec3 vNormal;
                    
                    void main() {
                        float intensity = 1.05 - dot(vNormal, vec3(0.0, 0.0, 1.0));
                        vec3 atmosphere = mix(color1, color2, sin(time + intensity * 2.0) * 0.5 + 0.5);
                        gl_FragColor = vec4(atmosphere, opacity * intensity);
                    }
                `,
                transparent: true,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            
            atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            earth.add(atmosphere);
        }
        
        function createHeatGlow() {
            const glowGeometry = new THREE.SphereGeometry(5.6, 32, 32);
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    intensity: { value: 0 },
                    time: { value: 0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    void main() {
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float intensity;
                    uniform float time;
                    varying vec3 vPosition;
                    
                    void main() {
                        float pulse = 0.8 + 0.2 * sin(time * 2.0 + length(vPosition) * 3.0);
                        float alpha = intensity * pulse * (1.0 - smoothstep(0.0, 1.0, length(vPosition)));
                        gl_FragColor = vec4(1.0, 0.2, 0.1, alpha * 0.8);
                    }
                `,
                transparent: true,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            
            heatGlow = new THREE.Mesh(glowGeometry, glowMaterial);
            earth.add(heatGlow);
        }
        
        function createStars() {
            const starGeometry = new THREE.BufferGeometry();
            const starCount = 1000000; // Increased from 3000 to 10000
            const positions = new Float32Array(starCount * 3);
            
            for (let i = 0; i < starCount * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 2000; // Larger star field
                positions[i + 1] = (Math.random() - 0.5) * 2000;
                positions[i + 2] = (Math.random() - 0.5) * 2000;
            }
            
            starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const starMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.2, // Slightly smaller stars for more density
                transparent: true,
                sizeAttenuation: true
            });
            
            const stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);
            
            // Add some bigger, brighter stars
            const bigStarGeometry = new THREE.BufferGeometry();
            const bigStarCount = 200;
            const bigStarPositions = new Float32Array(bigStarCount * 3);
            
            for (let i = 0; i < bigStarCount * 3; i += 3) {
                bigStarPositions[i] = (Math.random() - 0.5) * 1500;
                bigStarPositions[i + 1] = (Math.random() - 0.5) * 1500;
                bigStarPositions[i + 2] = (Math.random() - 0.5) * 1500;
            }
            
            bigStarGeometry.setAttribute('position', new THREE.BufferAttribute(bigStarPositions, 3));
            
            const bigStarMaterial = new THREE.PointsMaterial({
                color: 0xffffaa,
                size: 0.5,
                transparent: true,
                sizeAttenuation: true
            });
            
            const bigStars = new THREE.Points(bigStarGeometry, bigStarMaterial);
            scene.add(bigStars);
        }
        
        function setupLighting() {
            const ambientLight = new THREE.AmbientLight(0x333333);
            scene.add(ambientLight);

            const sunLight = new THREE.PointLight(0xffffaa, 2.5, 400);
            sunLight.position.copy(sun.position);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            scene.add(sunLight);

            const fillLight = new THREE.DirectionalLight(0x4466ff, 0.4);
            fillLight.position.set(-5, 5, 10);
            scene.add(fillLight);
        }
        
        function setupEventListeners() {
            // CO2 slider
            const co2Slider = document.getElementById('co2Slider');
            const co2SliderValue = document.getElementById('co2SliderValue');
            const co2Value = document.getElementById('co2Value');
            
            co2Slider.addEventListener('input', (e) => {
                co2Level = parseFloat(e.target.value);
                co2SliderValue.textContent = `${co2Level} ppm`;
                co2Value.textContent = `${co2Level} ppm`;
                updateSimulation();
            });

            // Heat slider
            const heatSlider = document.getElementById('heatSlider');
            const heatSliderValue = document.getElementById('heatSliderValue');
            const heatValue = document.getElementById('heatValue');
            
            heatSlider.addEventListener('input', (e) => {
                heatIntensity = parseFloat(e.target.value) / 100;
                heatSliderValue.textContent = `${Math.round(heatIntensity * 100)}%`;
                heatValue.textContent = `${Math.round(heatIntensity * 100)}%`;
                updateSimulation();
            });

            // Time acceleration button
            document.getElementById('accelerateBtn').addEventListener('click', () => {
                const years = prompt("How many years to accelerate? (Each year increases temperature)\nEnter number (10-1000):", "100");
                if (years && !isNaN(years) && years >= 10 && years <= 1000) {
                    accelerateTime(parseInt(years));
                } else if (years) {
                    alert("Please enter a number between 10 and 1000.");
                }
            });

            // Earth dragging
            renderer.domElement.addEventListener('mousedown', onMouseDown);
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('mouseup', onMouseUp);
            
            // Click detection for rays
            renderer.domElement.addEventListener('click', onRayClick);
            
            // Double-click to toggle rotation
            renderer.domElement.addEventListener('dblclick', () => {
                earthRotationEnabled = !earthRotationEnabled;
            });

            // Window resize
            window.addEventListener('resize', onWindowResize);
            
            // Smooth scroll for navigation
            document.querySelectorAll('.scroll-indicator, .scroll-down').forEach(element => {
                element.addEventListener('click', function() {
                    window.scrollTo({
                        top: window.innerHeight,
                        behavior: 'smooth'
                    });
                });
            });
        }
        
        function onRayClick(event) {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Check for intersections with rays
            const rayObjects = rays.map(r => r.line);
            const intersects = raycaster.intersectObjects(rayObjects);
            
            if (intersects.length > 0) {
                // Show "SUN RAYS" text at click position
                const raysText = document.getElementById('raysText');
                raysText.style.left = `${event.clientX + 20}px`;
                raysText.style.top = `${event.clientY - 20}px`;
                raysText.style.display = 'block';
                
                // Hide text after 2 seconds
                setTimeout(() => {
                    raysText.style.display = 'none';
                }, 2000);
                
                // Visual feedback: flash the clicked ray
                const clickedRay = intersects[0].object;
                const originalColor = clickedRay.material.color.getHex();
                clickedRay.material.color.set(0xffff00);
                clickedRay.material.opacity = 1;
                
                setTimeout(() => {
                    clickedRay.material.color.set(originalColor);
                    clickedRay.material.opacity = 0.9;
                }, 500);
            }
        }
        
        function accelerateTime(years) {
            timeAccelerated += years;
            document.getElementById('timeValue').textContent = `${timeAccelerated} years`;
            
            // Increase CO2 and temperature based on time
            const co2Increase = years * 2.5; // 2.5 ppm per year
            const tempIncrease = years * 0.025; // 0.025°C per year
            
            co2Level = Math.min(2000, co2Level + co2Increase);
            temperature += tempIncrease;
            
            // Update sliders
            document.getElementById('co2Slider').value = co2Level;
            document.getElementById('heatSlider').value = Math.min(500, (heatIntensity * 100) + years * 0.2);
            heatIntensity = parseFloat(document.getElementById('heatSlider').value) / 100;
            
            // Update slider displays
            document.getElementById('co2SliderValue').textContent = `${co2Level} ppm`;
            document.getElementById('heatSliderValue').textContent = `${Math.round(heatIntensity * 100)}%`;
            
            updateSimulation();
        }
        
        function updateSimulation() {
            // Calculate temperature
            const baseTemp = 15;
            const co2Effect = (co2Level - 280) * 0.08; // Stronger effect
            // Heat effect now allows cooling (1% = -50°C, 50% = 15°C, 500% = 40°C)
            const heatEffect = (heatIntensity - 0.01) * (90/0.99) - 50;
            const timeEffect = timeAccelerated * 0.025;
            
            temperature = baseTemp + co2Effect + heatEffect + timeEffect;
            
            // Cap temperature range
            temperature = Math.max(-50, Math.min(120, temperature));
            
            // Update temperature display
            document.getElementById('tempValue').textContent = `${temperature.toFixed(1)}°C`;
            
            // Update Earth color based on temperature
            updateEarthColor();
            
            // Update atmosphere
            const atmosphereOpacity = Math.min(1.2, 0.3 + (co2Level - 280) / 400);
            atmosphere.material.uniforms.opacity.value = atmosphereOpacity;
            
            const co2Ratio = Math.min(1, (co2Level - 280) / 1720);
            atmosphere.material.uniforms.color1.value.setRGB(
                0.3 * (1 - co2Ratio) + 1.0 * co2Ratio,
                1.0 * (1 - co2Ratio) + 0.2 * co2Ratio,
                0.5 * (1 - co2Ratio) + 0.1 * co2Ratio
            );
            
            // Update heat glow
            const trappedHeat = Math.min(2, (co2Level - 280) / 400 * heatIntensity * 4);
            heatGlow.material.uniforms.intensity.value = Math.max(0, trappedHeat);
            
            // Update rays
            updateRays();
            
            // Check for temperature warnings
            checkTemperatureThresholds();
        }
        
        function updateEarthColor() {
            const earthMaterial = earth.material;
            
            if (temperature < -30) {
                // Extreme cold - very blue with white ice
                const factor = Math.min(1, (temperature + 50) / 20);
                earthMaterial.color.setRGB(
                    0.1 + factor * 0.1,
                    0.3 + factor * 0.3,
                    0.8 + factor * 0.1
                );
            } else if (temperature < -10) {
                // Very cold - blue with some ice
                const factor = (temperature + 30) / 20;
                earthMaterial.color.setRGB(
                    0.2 + factor * 0.2,
                    0.4 + factor * 0.2,
                    0.9 - factor * 0.2
                );
            } else if (temperature < 20) {
                // Normal temperature range
                const factor = (temperature + 10) / 30;
                earthMaterial.color.setRGB(
                    0.13 + factor * 0.3,
                    0.35 + factor * 0.3,
                    0.6 - factor * 0.1
                );
            } else if (temperature < 40) {
                // Warming - greenish brown
                const factor = (temperature - 20) / 20;
                earthMaterial.color.setRGB(
                    0.43 + factor * 0.2,
                    0.65 - factor * 0.2,
                    0.5 - factor * 0.2
                );
            } else if (temperature < 60) {
                // Hot - brown/orange
                const factor = (temperature - 40) / 20;
                earthMaterial.color.setRGB(
                    0.63 + factor * 0.2,
                    0.45 - factor * 0.2,
                    0.3 - factor * 0.2
                );
            } else if (temperature < 80) {
                // Very hot - orange/red
                const factor = (temperature - 60) / 20;
                earthMaterial.color.setRGB(
                    0.83 + factor * 0.15,
                    0.25 - factor * 0.15,
                    0.1 - factor * 0.05
                );
            } else {
                // Extremely hot - bright red
                earthMaterial.color.setRGB(
                    1,
                    0.1,
                    0.05
                );
            }
            
            earthMaterial.needsUpdate = true;
        }
        
        function updateRays() {
            rays.forEach((ray, index) => {
                const geometry = ray.line.geometry;
                const positions = geometry.attributes.position.array;
                
                const start = sun.position.clone();
                const end = earth.position.clone();
                const segments = positions.length / 3 - 1;
                
                const co2Effect = Math.min(1, (co2Level - 280) / 1720);
                const rayTrapped = Math.random() < co2Effect * 0.9;
                ray.trapped = rayTrapped;
                
                const opacity = rayTrapped ? 0.6 : 0.9 * heatIntensity;
                ray.line.material.opacity = opacity;
                ray.line.material.color.set(rayTrapped ? 0xff0000 : 0xff8800);
                
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    let point = new THREE.Vector3().lerpVectors(start, end, t);
                    
                    if (i > 0 && i < segments) {
                        const direction = new THREE.Vector3().subVectors(end, start).normalize();
                        const perpendicular = new THREE.Vector3(
                            -direction.z,
                            direction.y,
                            direction.x
                        ).normalize();
                        
                        const offsetMagnitude = Math.sin(t * Math.PI) * 6;
                        const randomOffset = (Math.sin(index * 10 + t * 10) * 0.8);
                        point.add(perpendicular.multiplyScalar(offsetMagnitude + randomOffset));
                    }
                    
                    positions[i * 3] = point.x;
                    positions[i * 3 + 1] = point.y;
                    positions[i * 3 + 2] = point.z;
                }
                
                geometry.attributes.position.needsUpdate = true;
                ray.line.material.needsUpdate = true;
            });
        }
        
        function checkTemperatureThresholds() {
            const hotWarningElement = document.getElementById('catastropheWarning');
            const coldWarningElement = document.getElementById('coldWarning');
            
            // Reset warnings
            hotWarningElement.style.display = 'none';
            coldWarningElement.style.display = 'none';
            
            // Check for extreme cold warnings
            if (temperature <= -50) {
                document.getElementById('freezeWarning').style.display = 'block';
                coldWarningElement.textContent = '❄️ EXTREME COLD: -50°C Reached';
                coldWarningElement.style.display = 'block';
            } else if (temperature <= -30) {
                coldWarningElement.textContent = '❄️ ARCTIC CONDITIONS: -30°C';
                coldWarningElement.style.display = 'block';
            } else if (temperature <= -10) {
                coldWarningElement.textContent = '❄️ DEEP FREEZE: -10°C';
                coldWarningElement.style.display = 'block';
            }
            
            // Check for heat warnings
            for (const [threshold, data] of Object.entries(temperatureThresholds)) {
                const thresholdNum = parseInt(threshold);
                if (thresholdNum > 0 && temperature >= thresholdNum && temperature < thresholdNum + 10) {
                    // Show warning
                    document.getElementById(data.warning).style.display = 'block';
                    
                    // Update warning text
                    hotWarningElement.textContent = data.message;
                    hotWarningElement.style.display = 'block';
                    break;
                }
            }
            
            // Always show extreme warning for high temperatures
            if (temperature >= 100) {
                document.getElementById('warning100').style.display = 'block';
                hotWarningElement.textContent = 'APOCALYPSE: Earth is now uninhabitable';
                hotWarningElement.style.display = 'block';
            }
        }
        
        function closeWarning(warningId) {
            document.getElementById(warningId).style.display = 'none';
        }
        
        function onMouseDown(event) {
            if (event.button !== 0) return;
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(earth);
            
            if (intersects.length > 0) {
                isDraggingEarth = true;
                previousMousePosition = { x: event.clientX, y: event.clientY };
                controls.enabled = false;
                earth.scale.set(1.05, 1.05, 1.05);
            }
        }
        
        function onMouseMove(event) {
            if (!isDraggingEarth) return;
            
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
            
            const moveSpeed = 0.03;
            earth.position.x += deltaMove.x * moveSpeed;
            earth.position.y -= deltaMove.y * moveSpeed;
            
            // Keep Earth within reasonable bounds
            earth.position.x = Math.max(-60, Math.min(60, earth.position.x));
            earth.position.y = Math.max(-30, Math.min(30, earth.position.y));
            
            updateRays();
            
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
        
        function onMouseUp() {
            if (isDraggingEarth) {
                isDraggingEarth = false;
                controls.enabled = true;
                earth.scale.set(1, 1, 1);
            }
        }
        
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            const time = Date.now() * 0.001;
            
            // Sun rotation
            sun.rotation.y += 0.0005;
            
            // Earth rotation
            if (earthRotationEnabled && !isDraggingEarth) {
                earth.rotation.y += 0.005;
            }
            
            // Update shader times
            atmosphere.material.uniforms.time.value = time;
            heatGlow.material.uniforms.time.value = time;
            
            // Update controls
            controls.update();
            
            // Render scene
            renderer.render(scene, camera);
        }
        
        // Initial update
        updateSimulation();
  
