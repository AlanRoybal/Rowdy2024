// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import ShelterFinder from './ShelterFinder';

const App = () => {
  return (
    <div>
      <header>
        <h1>Local Weather Station</h1>
      </header>
      <main>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <video width="640" height="360" controls>
            <source src="your_video_file.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <ShelterFinder backgroundColor="#f0f0f0" textColor="#333" />
      </main>
      <footer>
        <p>&copy; 2024 Local Weather Station</p>
      </footer>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
