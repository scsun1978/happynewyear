import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import api from './services/api';
import Home from './pages/Home';
import Game from './pages/Game';
import Draw from './pages/Draw';
import Profile from './pages/Profile';
import Rank from './pages/Rank';
import Admin from './pages/Admin';
import { useEffect } from 'react';

const LoginCallback = () => {
  const navigate = useNavigate();
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      api.get(`/user/login?code=${code}`)
        .then(res => {
          const { token, user } = res.data;
          setToken(token);
          setUser(user);
          navigate('/');
        })
        .catch(err => {
          console.error('Login failed', err);
          alert('登录失败，请重试');
          navigate('/');
        });
    } else {
      // Redirect to home if no code
      navigate('/');
    }
  }, [navigate, setToken, setUser]);

  return <div className="text-white text-center mt-20 flex flex-col items-center">
    <div className="text-4xl animate-spin mb-4">🏮</div>
    <p>正在登录中...</p>
  </div>;
};

// Layout
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-festival-red text-white">
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Layout><LoginCallback /></Layout>} />
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/draw" element={<Draw />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rank" element={<Rank />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
