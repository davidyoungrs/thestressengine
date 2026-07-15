# Roark's Stress & Strain Calculator - Project Status

## 🚀 Overview
A client-side web application providing analytical engineering calculations based on *Roark's Formulas for Stress and Strain, 8th Ed.*
Built with vanilla HTML, CSS, JavaScript, and Chart.js. 

**License:** MIT License
**Copyright:** © 2026 Really Simple Apps

---

## ✅ Implemented Modules
The following engineering modules have been fully implemented with dynamic input forms, results cards, and interactive charts:

1. **Flat Plates**
   - Circular / Annular
   - Rectangular
   - Odd Shapes (Elliptical, Triangular, Sector)
2. **Straight Beams**
   - Boundary Conditions: Simply Supported, Cantilever, Fixed-Fixed, Fixed-Pinned
   - Calculations: Shear, Moment, Deflection distributions
3. **Contact Stresses (Hertzian)**
   - Geometries: Sphere-on-Sphere, Cylinder-on-Cylinder, Sphere-on-Plane
   - Depth profiles and peak pressures
4. **Torsion**
   - Geometries: Solid Circle, Non-circular, Hollow, Thin-walled open sections
   - Shear stresses and rotation angles
5. **Columns**
   - Methods: Euler's formula, Johnson's parabolic formula, Secant formula
   - Custom material presets
6. **Pressure Vessels & Pipes**
   - Cylinders (Thin-wall Barlow vs Thick-wall Lamé)
   - Spheres
   - Pipe Bending (Combined stresses)
   - Water Hammer (Joukowsky surge pressure)
7. **Stress Concentration Factors**
   - Geometries: Plate with Hole, Stepped Shaft (Fillet), Notched Bar
   - Outputs: Theoretical factor ($K_t$), Fatigue notch factor ($K_f$), Local max stress

8. **Buckling & Stability**
   - Flat plates (Rectangular and Circular) with simply supported and clamped conditions
   - Thin-walled shells (Cylinders under axial/radial load, Spheres under external pressure)
   - Instability threshold load calculations
9. **Interactive Formula Guide**
   - Live rendering of primary governing equations using KaTeX.

## ✨ Core Features Added
- **Global Unit Toggle:** Switch instantly between Imperial (in, lbs, psi) and Metric (mm, N, MPa).
- **Material Presets:** Auto-populating $E$, $\nu$, and $\sigma_y$ for common metals (Steel, Aluminum, etc.).
- **Visual Safety Factors:** Color-coded status alerts based on design limits.

---

## ⏳ Pending / Next Steps
The following modules from the original Python implementation backlog are awaiting migration:

- [ ] **Curved Beams:** Winkler-Bach theory.
- [ ] **Shells:** Shells of revolution (spherical, cylindrical, conical).
- [ ] **Dynamic Loads:** Natural frequencies and shock loading.

## ☁️ Deployment
The project is a static site and is ready to be deployed to **Vercel**, **Netlify**, or **GitHub Pages**. 
Run `npx vercel` in the project root to deploy instantly.
