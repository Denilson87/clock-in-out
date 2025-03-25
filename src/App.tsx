import React, { useState, useEffect, useRef } from 'react';
import Keypad from './components/Keypad';
import TimeCard from './components/TimeCard';
import CreateAdmin from './components/CreateAdmin';
import AddEmployee from './components/AddEmployee';
import Login from './components/Login';
import './assets/css/styles.css';
import './components/button.css';

const App: React.FC = () => {
  const timeClockContainerRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [timeCardRecords, setTimeCardRecords] = useState<{ 
    id: number; 
    name: string; 
    pin: string; 
    action: string; 
    date: string;
    time: string; 
    atraso: string;  
    atrasoMinutos: number;  
    ip: string;
  }[]>([]);
  const [employeeStatus, setEmployeeStatus] = useState<{ [pin: string]: string }>({});
  const isOverlayShowing = showCreateAdmin || showLogin || showAddEmployee;
  const [lastInteractionTime, setLastInteractionTime] = useState(new Date());
  const [popupData, setPopupData] = useState<{
    show: boolean;
    name: string;
    time: string;
  }>({ show: false, name: '', time: '' });

  const [pin, setPin] = useState(() => {
    return localStorage.getItem("userPin") || "";
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pin) {
      localStorage.setItem("userPin", pin);
    }
  }, [pin]);
  
  useEffect(() => {
    fetch('/is-logged-in')
      .then((response) => response.json())
      .then((data) => {
        setIsLoggedIn(data.isLoggedIn);
        if (!data.isLoggedIn) {
          fetch('/get-users', { method: 'POST' })
            .then((response) => response.json())
            .then((users) => {
              if (users.length === 0) {
                setShowCreateAdmin(true);
              } else {
                fetch('/get-records', { method: 'POST' })
                  .then((response) => response.json())
                  .then((records) => {
                    setShowLoginButton(true);
                    setTimeCardRecords(records);
                  })
                  .catch((error) => console.error('Error checking records:', error));
              }
            })
        }
      })
      .catch((error) => console.error('Error checking login status:', error));
  }, [setIsLoggedIn, setTimeCardRecords]);

  useEffect(() => {
    if (!showCreateAdmin && !showLogin) {
      timeClockContainerRef.current?.focus();
    }
  }, [showCreateAdmin, showLogin]);

  const handleInteraction = () => {
    setLastInteractionTime(new Date());
  };

  useEffect(() => {
    const logout = () => {
      fetch('/logout').then(() => {
        setShowLoginButton(true);
        window.location.reload();
      });
    };

    const logoutTimer = setTimeout(() => {
      const now = new Date();
      const timeDiff = now.getTime() - lastInteractionTime.getTime();

      if (timeDiff >= 30 * 60 * 1000) {
        logout();
      }
    }, 30 * 60 * 1000);

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [lastInteractionTime]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 6 && key.trim() !== '' && !isNaN(Number(key))) {
      setPin(pin + key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isNaN(Number(e.key)) && !isOverlayShowing) {
      handleKeyPress(e.key);
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleBackspace();
    }
    if (e.key === 'Enter' && isOverlayShowing) {
      if (showLogin) {
        let loginButton = document.getElementById('login');
        loginButton?.click();
      }
      if (showCreateAdmin) {
        let createAdminButton = document.getElementById('createAdmin');
        createAdminButton?.click();
      }
      if (showAddEmployee) {
        let addEmployeeButton = document.getElementById('addEmployee');
        addEmployeeButton?.click();
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleActionClick = async (selectedAction: 'Entrada' | 'Saida' | 'startBreak' | 'endBreak') => {
    if (pin === '') {
      document.body.scrollTo(0, 0);
      let currentPin = document.getElementById('currentPin');
      currentPin.style.borderColor = '#ff7866';
      setTimeout(() => { currentPin.style.borderColor = 'gainsboro'; }, 250);
      setTimeout(() => { currentPin.style.borderColor = '#ff7866'; }, 500);
      setTimeout(() => { currentPin.style.borderColor = 'gainsboro'; }, 750);
      return;
    }

    const lastAction = employeeStatus[pin];
    const record = { action: selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1), time: currentTime };

    let ipResponse = await fetch('https://api.ipify.org?format=json');
    let ipData = await ipResponse.json();
    let ip = ipData.ip;

    fetch('/add-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, action: record.action, time: record.time, ip: ip })
    })
      .then((response) => {
        if (!response.ok) return response.json().then((error) => Promise.reject(error));
        return response.json();
      })
      .then((data) => {
        setEmployeeStatus({
          ...employeeStatus,
          [pin]: selectedAction,
        });
        setTimeCardRecords([ ...timeCardRecords, { 
          id: data.id, 
          name: data.name, 
          pin, 
          action: record.action, 
          date: new Date().toISOString().split('T')[0], 
          atraso: data.atraso, 
          time: record.time, 
          ip: ip, 
          atrasoMinutos: data.atrasoMinutos || 0 
        }]);
        setPin('');
        showMessageToUser('Time recorded successfully', 'success');
        
        // Show popup with user info
        setPopupData({
          show: true,
          name: data.name,
          time: record.time
        });
      })
      .catch((error) => {
        console.error('Error adding record:', error.error);
        showMessageToUser('Error adding record: ' + error.error, 'error');
      });
  };

  function showMessageToUser(text: string, type: 'success' | 'error' | 'warning' | 'info') {
    const messageContainer = document.getElementById('message-container');
    const message = document.createElement('p');
    message.classList.add(`${type}-message`);
    message.textContent = text;
    messageContainer?.appendChild(message);

    message.classList.add('show');

    setTimeout(() => {
      message.classList.add('hide');
      setTimeout(() => { messageContainer?.removeChild(message); }, 1000);
    }, 3000);
  }

  function downloadRecords() {
    fetch('/download-records', { method: 'POST' })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'time-cards.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      })
      .then(() => showMessageToUser('Records downloaded', 'info'))
      .catch((error) => console.error('Error downloading records:', error));
  }

  const onLoginSuccess = () => {
    setShowLogin(false);
    setShowLoginButton(false);
    setIsLoggedIn(true);
  };

  const onCreateAdminSuccess = () => {
    setShowCreateAdmin(false);
    setShowLoginButton(false);
    setIsLoggedIn(true);
  };

  const onAddEmployeeSuccess = () => {
    setShowAddEmployee(false);
    showMessageToUser('Employee added', 'info');
  };

  const onCloseOverlay = () => {
    setShowLogin(false);
    setShowCreateAdmin(false);
    setShowAddEmployee(false);
  };

  const closePopup = () => {
    setPopupData({ show: false, name: '', time: '' });
  };

  return (    
    <div className="time-clock-container" ref={timeClockContainerRef} onKeyDown={handleKeyDown} tabIndex={0}>
          {/* Popup for record confirmation */}
          {popupData.show && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h1>Registo efectuado !</h1>
            <h3><strong>Nome:</strong> <b>{popupData.name}</b></h3>
            <h3><strong>Hora:</strong> <b>{popupData.time}</b></h3>
            <button style={{background: 'Green', textDecorationColor:'white'}}  onClick={closePopup}><b><h1>OK</h1></b></button>
          </div>
        </div>
      )}
      <Login showLogin={showLogin} onLoginSuccess={onLoginSuccess} onCloseOverlay={onCloseOverlay} />
      {showAddEmployee && isLoggedIn && <AddEmployee onAddSuccess={onAddEmployeeSuccess} onCloseOverlay={onCloseOverlay} />}
      {showCreateAdmin && !isLoggedIn && <CreateAdmin onCreateSuccess={onCreateAdminSuccess} onCloseOverlay={onCloseOverlay} />}
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <img src={require("./assets/main.png")} alt="logo" width="300" />
      </div>     
      <h2>Controle de assiduidade</h2>
      <div id="currentTime"><b>Horario local: {currentTime}</b></div>
      <div className="pin-entry">
        <button className="clear-button" onClick={handleClear}></button>
      </div>
      <div id="message-container"></div>
      <div className="main-container">
        <Keypad onKeyPress={handleKeyPress}/>
      </div>
      <div className="action-buttons">
        <button onClick={() => handleActionClick('Entrada')}>Entrada</button>
        <button onClick={() => handleActionClick('Saida')}>Saida</button>
      </div>
      {showLoginButton && !isLoggedIn && <button id="loginButton" onClick={() => setShowLogin(true)}>
        Login como administrator</button>}
      {isLoggedIn && <hr></hr>}
      {isLoggedIn && <TimeCard records={timeCardRecords} />}
      {!isOverlayShowing && isLoggedIn && <button id="downloadButton" onClick={() => { downloadRecords(); }}>Baixar dados XLS</button>}
      {!isOverlayShowing && isLoggedIn && <button id="addEmployeeButton" onClick={() => { setShowAddEmployee(true) }}>Adicionar colaborador</button>}
      {!isOverlayShowing && isLoggedIn && <button id="logoutButton" onClick={() => { setShowLoginButton(true); setIsLoggedIn(false); }}>Logout</button>}
    </div>
  );
};

export default App;