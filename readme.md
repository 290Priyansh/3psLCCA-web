# 🌉 3psLCCA-web: Bridge Life Cycle Cost Analysis Platform

A premium, state-of-the-art web application designed for comprehensive **Life Cycle Cost Analysis (LCCA)** and **Carbon Emission Assessments (LCA)** of bridge infrastructure. Built with React and Vite, the platform provides engineering professionals and researchers with precise calculations, interactive data entry components, and dynamic visualizations for optimizing design sustainability and cost efficiency.

---

## 🚀 Key Modules & Features

The platform is structured around a comprehensive lifecycle assessment workflow, including:

### 1. Project Initialization & Management
*   **General Information & Bridge Data:** Track geometry, location-specific data (e.g., standard databases for India like Bihar/Mumbai), and project parameters.
*   **Export/Import Engine:** Export complete project workspaces as JSON bundles for backup or sharing.

### 2. Multi-Dimensional Input Modules
*   **Construction Work Data:** Granular itemized input tables for **Foundation**, **Sub Structure**, **Super Structure**, and **Miscellaneous** components.
*   **Traffic Data:** Analyze Average Daily Traffic (ADT), heavy vehicle ratios, traffic growth patterns, and delay estimations.
*   **Financial Data:** Define discount rates, analysis periods, initial investments, and economic parameters.

### 3. Dynamic Carbon Emission Calculators
*   **Material Emissions:** Trace cradle-to-gate carbon footprints based on material volumes and custom EPD emission factors.
*   **Transportation Emissions:** Model transit distances, vehicle payloads, and fuel efficiencies.
*   **Machinery Emissions:** Operational hours, fuel burn rates, and machinery power profiles.
*   **Traffic Diversion Emissions:** Capture environmental costs incurred due to construction rerouting and idle times.
*   **Social Cost of Carbon (SCC):** Quantify the macroeconomic impact of environmental emissions.

### 4. Interactive Visualization & Reporting
*   **Visual Dashboards:** Leverages **Recharts** and **D3** for real-time breakdowns of lifecycle stage costs and carbon profiles.
*   **Export Reports:** Seamless export of generated results to PDF format (via `jsPDF` and `html2canvas`) and CSV files.

---

## 🛠️ Technology Stack

*   **Core:** React 19, JavaScript (ES6+), HTML5
*   **Bundler & Dev Server:** Vite 8 (with Oxc/SWC support)
*   **Styling & Themes:** Vanilla CSS variables combined with React-Bootstrap (supports Dracula, Neon City, Soft Pink, and Soft Light modes)
*   **Charts & Diagrams:** Recharts, D3.js
*   **Report Generators:** jsPDF, jspdf-autotable, html2canvas

---

## 📥 Setup & Installation

Follow these steps to set up the project locally on your system:

### Prerequisites
Make sure you have **Node.js** (v18.x or later recommended) and **npm** installed.
To check your versions:
```bash
node -v
npm -v
```

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd 3psLCCA-web
   ```

2. **Configure Appwrite Backend (Optional but Recommended)**
   This application utilizes Appwrite for backend user authentication and cloud project storage.
   - You can either ask Swayam for the official credentials, or set up your own Appwrite instance.
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your `VITE_APPWRITE_*` credentials in the `.env` file. If you skip this, you can still use the app in "Guest Mode" which relies on local browser storage.

3. **Install Dependencies**
   Run the following command to download and install all required node modules:
   ```bash
   npm install
   ```
   
4. **Launch the Development Server**
   Start the Vite dev server with Hot Module Replacement (HMR):
   ```bash
   npm run dev
   ```

   *By default, the application will be hosted at `http://localhost:5173`.*

---

## 🧪 Testing & Validation

The project uses standard Vite scripts for linting, bundling, and local testing. Follow these steps to validate code changes:

### 1. Code Quality & Linting
Run ESLint to scan the codebase for static code issues and syntax warnings:
```bash
npm run lint
```

### 2. Verification & Production Build
Verify that the React compiler, hooks, and bundle tree resolve without compile-time errors:
```bash
npm run build
```
This command compiles and bundles the codebase into the `dist/` directory using Rolldown/Vite. Ensure no errors occur during minification and chunk generation.

### 3. Local Production Preview
To preview the compiled assets exactly as they will perform on a production server:
```bash
npm run preview
```
*Access the preview at the local address printed by Vite (typically `http://localhost:4173`).*

---

## 🧑‍💻 Manual Verification Walkthrough

To perform a manual functional check of the platform:

1. **Log in:** Open the application in your browser. Log in as **Admin** (using any dummy/valid credentials) or choose the **Guest Login** option.
2. **Initialize a Project:**
   - Click **New Project** and enter a name (e.g., `Bridge_Design_Alpha`).
   - Select a regional database or leave the defaults.
3. **Populate Construction Materials:**
   - Navigate to the **Construction Work Data** tab in the sidebar.
   - Add structural component details (Foundation, Substructure, or Superstructure).
   - Enter materials (Steel, Concrete, Rebar) along with quantities.
4. **Inspect Carbon Emissions:**
   - Go to **Carbon Emission Data** in the sidebar.
   - Check that the calculations for *Material*, *Transportation*, and *Machinery* update dynamically based on the material inputs.
5. **View Results & Exports:**
   - Select **Outputs** from the sidebar to inspect the interactive cost and emission charts.
   - Click **Export Report** to download the comprehensive PDF summary.
