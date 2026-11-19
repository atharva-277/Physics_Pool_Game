import React from "react";
import PhysicsSketch from "./components/PhysicsSketch";

import "./App.css";

function App() {
  return (
    <main className="app">
      <section className="simulation-section">
        <div className="physics-container">
          <PhysicsSketch />
        </div>
      </section>
    </main>
  );
}

export default App;
