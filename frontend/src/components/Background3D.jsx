import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Background3D() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x0a0a0f, 1)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.set(0, 0, 30)

        // --- Starfield ---
        const starGeo = new THREE.BufferGeometry()
        const starCount = 3000
        const starPos = new Float32Array(starCount * 3)
        for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 400
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
        const starMat = new THREE.PointsMaterial({ color: 0x89b4fa, size: 0.5, transparent: true, opacity: 0.6 })
        scene.add(new THREE.Points(starGeo, starMat))

        // --- Floating torus knots ---
        const torusKnots = []
        const tkColors = [0x89b4fa, 0xcba6f7, 0xa6e3a1, 0xf38ba8, 0x94e2d5]
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.TorusKnotGeometry(1.5 + Math.random(), 0.4 + Math.random() * 0.2, 100, 16)
            const mat = new THREE.MeshPhysicalMaterial({
                color: tkColors[i],
                wireframe: false,
                transparent: true,
                opacity: 0.12,
                roughness: 0.2,
                metalness: 0.8,
                emissive: tkColors[i],
                emissiveIntensity: 0.08
            })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10 - 5
            )
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
            scene.add(mesh)
            torusKnots.push({ mesh, speed: 0.002 + Math.random() * 0.003, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize() })
        }

        // --- Floating sphere particles ---
        const sphereGeo = new THREE.BufferGeometry()
        const sCount = 80
        const sPos = new Float32Array(sCount * 3)
        const sSizes = new Float32Array(sCount)
        for (let i = 0; i < sCount; i++) {
            sPos[i * 3] = (Math.random() - 0.5) * 60
            sPos[i * 3 + 1] = (Math.random() - 0.5) * 40
            sPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
            sSizes[i] = 0.5 + Math.random() * 2
        }
        sphereGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
        const sphereMat = new THREE.PointsMaterial({ color: 0xcba6f7, size: 1.2, transparent: true, opacity: 0.25, sizeAttenuation: true })
        const spherePoints = new THREE.Points(sphereGeo, sphereMat)
        scene.add(spherePoints)

        // --- Grid plane ---
        const gridHelper = new THREE.GridHelper(80, 40, 0x1e1e2e, 0x1e1e2e)
        gridHelper.material.opacity = 0.15
        gridHelper.material.transparent = true
        gridHelper.position.y = -15
        scene.add(gridHelper)

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
        scene.add(ambientLight)
        const pointLight1 = new THREE.PointLight(0x89b4fa, 2, 60)
        pointLight1.position.set(10, 10, 10)
        scene.add(pointLight1)
        const pointLight2 = new THREE.PointLight(0xcba6f7, 1.5, 60)
        pointLight2.position.set(-10, -5, 5)
        scene.add(pointLight2)

        // --- Mouse interaction ---
        const mouse = { x: 0, y: 0 }
        const onMouseMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
            mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
        }
        window.addEventListener('mousemove', onMouseMove)

        // --- Animation loop ---
        let frameId
        let t = 0
        const animate = () => {
            frameId = requestAnimationFrame(animate)
            t += 0.005

            // Camera subtle movement
            camera.position.x += (mouse.x * 3 - camera.position.x) * 0.04
            camera.position.y += (mouse.y * 2 - camera.position.y) * 0.04
            camera.lookAt(scene.position)

            // Torus knots
            torusKnots.forEach(({ mesh, speed, axis }) => {
                mesh.rotateOnAxis(axis, speed)
                mesh.position.y += Math.sin(t + mesh.position.x) * 0.005
            })

            // Drift star field
            starMat.opacity = 0.5 + Math.sin(t) * 0.1

            // Floating particles drift
            spherePoints.rotation.y += 0.0005
            spherePoints.rotation.x += 0.0003

            renderer.render(scene, camera)
        }
        animate()

        // --- Resize ---
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
        }
    }, [])

    return <canvas id="bg-canvas" ref={canvasRef} />
}
