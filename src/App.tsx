import React, { useState, useEffect, useRef } from 'react';
import Keypad from './components/Keypad';
import TimeCard from './components/TimeCard';
import CreateAdmin from './components/CreateAdmin';
import AddEmployee from './components/AddEmployee';
import Login from './components/Login';
import './assets/css/styles.css';

const App: React.FC = () => {
  const timeClockContainerRef = useRef<HTMLDivElement>(null); // Ref to the timeClockContainer
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to check if the user is logged in
  const [showLogin, setShowLogin] = useState(false); // State to control showing login
  const [showLoginButton, setShowLoginButton] = useState(false); // State to control showing login button
  const [showCreateAdmin, setShowCreateAdmin] = useState(false); // State to control showing createAdmin
  // const [pin, setPin] = useState(''); // State to store the PIN
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString()); // State to store the current time
  const [showAddEmployee, setShowAddEmployee] = useState(false); // State to control showing addEmployee
  const [timeCardRecords, setTimeCardRecords] = useState<{ 
    id: number; 
    name: string; 
    pin: string; 
    action: string; 
    date: string;  // Adicionando a propriedade 'date'
    time: string; 
    atraso: string;  
    atrasoMinutos: number;  
    ip: string;
  }[]>([]);
  const [employeeStatus, setEmployeeStatus] = useState<{ [pin: string]: string }>({}); // State to store the employee status
  const isOverlayShowing = showCreateAdmin || showLogin || showAddEmployee; // State to check if an overlay is showing
  const [lastInteractionTime, setLastInteractionTime] = useState(new Date()); // State to track the last interaction time

  const [pin, setPin] = useState(() => {
    // Retrieve the pin from localStorage when the component loads
    return localStorage.getItem("userPin") || "";
  });

  // Effect to update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Save the pin to localStorage whenever it changes
    if (pin) {
      localStorage.setItem("userPin", pin);
    }
  }, [pin]);
  
  // Effect to check if the user is logged in
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

  // Focus on the time clock container when the app first loads
  useEffect(() => {
    if (!showCreateAdmin && !showLogin) {
      timeClockContainerRef.current?.focus();
    }
  }, [showCreateAdmin, showLogin]);

  // Handle user interactions
  const handleInteraction = () => {
    setLastInteractionTime(new Date());
  };

  // Use an effect to set up the inactivity timer and handle user interactions
  useEffect(() => {
    // Function to log the user out
    const logout = () => {
      fetch('/logout').then(() => {
        setShowLoginButton(true);
        window.location.reload(); // Reload the app to reflect changes
      });
    };

    // Set up a timer to log out after 30 minutes of inactivity
    const logoutTimer = setTimeout(() => {
      const now = new Date();
      const timeDiff = now.getTime() - lastInteractionTime.getTime(); // Time difference in milliseconds

      if (timeDiff >= 30 * 60 * 1000) { // 30 minutes in milliseconds
        logout();
      }
    }, 30 * 60 * 1000);

    // Set up event listeners for user interactions
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [lastInteractionTime]); // Re-run the effect when the last interaction time changes

  const handleKeyPress = (key: string) => {
    if (pin.length < 6 && key.trim() !== '' && !isNaN(Number(key))) {
      setPin(pin + key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check if the key is a number
    if (!isNaN(Number(e.key)) && !isOverlayShowing) {
      handleKeyPress(e.key);
    }
    // Check if the key is backspace or delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleBackspace();
    }
    // Check if the key is Enter and an overlay is showing
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
    setPin(pin.slice(0, -1)); // Remove the last character from the PIN
  };

  const handleClear = () => {
    setPin(''); // Clear the entire PIN
  };

  const handleActionClick = async (selectedAction: 'Entrada' | 'Saida' | 'startBreak' | 'endBreak') => {
    // Flash red and exit early if no PIN is entered
    if (pin === '') {
      document.body.scrollTo(0, 0); // scroll up
      let currentPin = document.getElementById('currentPin');
      currentPin.style.borderColor = '#ff7866'; // red
      setTimeout(() => { currentPin.style.borderColor = 'gainsboro'; }, 250); // grey
      setTimeout(() => { currentPin.style.borderColor = '#ff7866'; }, 500); // red
      setTimeout(() => { currentPin.style.borderColor = 'gainsboro'; }, 750); // grey
      return;
    }

  //   // Implementing the clock-in/clock-out logic
  //   const lastAction = employeeStatus[pin];
  //   if (
  //     (selectedAction === 'clockIn' && lastAction !== 'clockOut' && lastAction !== undefined) ||
  //     (selectedAction === 'clockOut' && (lastAction !== 'clockIn' && lastAction !== 'endBreak')) ||
  //     (selectedAction === 'startBreak' && lastAction !== 'clockIn') ||
  //     (selectedAction === 'endBreak' && lastAction !== 'startBreak')
  //   ) {
  //     let message = `Invalid action: ${selectedAction}, Last Action: ${lastAction}`;
  //     if (selectedAction === 'clockOut' && !lastAction) message = 'You must clock in before you can clock out';
  //     if (selectedAction === 'startBreak' && !lastAction) message = 'You must clock in before you can start a break';
  //     if (selectedAction === 'endBreak' && !lastAction) message = 'You must start a break before you can end it';
  //     showMessageToUser(message, 'error');
  //     return;
  //   }

  //   const record = { action: selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1), time: currentTime };

  //   let ipResponse = await fetch('https://api.ipify.org?format=json');
  //   let ipData = await ipResponse.json();
  //   let ip = ipData.ip;

  //   fetch('/add-record', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ pin, action: record.action, time: record.time, ip: ip })
  //   })
  //     .then((response) => {
  //       if (!response.ok) return response.json().then((error) => Promise.reject(error));
  //       return response.json();
  //     })
  //     .then((data) => {
  //       // Success, update the last action for this PIN
  //       setEmployeeStatus({
  //         ...employeeStatus,
  //         [pin]: selectedAction,
  //       });
  //       setTimeCardRecords([...timeCardRecords, { id: data.id, name: data.name, pin, action: record.action, time: record.time, ip: ip }]);
  //       setPin(''); // Clearing the PIN
  //       showMessageToUser('Time recorded successfully', 'success');
  //     })
  //     .catch((error) => {
  //       console.error('Error adding record:', error.error);
  //       showMessageToUser('Error adding record: ' + error.error, 'error');
  //     });
  // };

  // function showMessageToUser(text: string, type: 'success' | 'error' | 'warning' | 'info') {
  //   const messageContainer = document.getElementById('message-container');
  //   const message = document.createElement('p');
  //   message.classList.add(`${type}-message`);
  //   message.textContent = text;
  //   messageContainer?.appendChild(message);

  //   // Add the "show" class to make the message appear
  //   message.classList.add('show');

  //   // Remove the message after 3 seconds
  //   setTimeout(() => {
  //     message.classList.add('hide');
  //     setTimeout(() => { messageContainer?.removeChild(message); }, 1000);
  //   }, 3000);
  // }
  // Implementing the clock-in/clock-out logic
const lastAction = employeeStatus[pin];

// Remove or modify the validation check based on the last action
// Allowing all actions regardless of the last action
// Just validate if the selected action exists (this is optional depending on the action structure)

if (!selectedAction) {
  showMessageToUser('Invalid action', 'error');
  return;
}

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
    // Success, update the last action for this PIN
    setEmployeeStatus({
      ...employeeStatus,
      [pin]: selectedAction,
    });
    setTimeCardRecords([ ...timeCardRecords, { id: data.id, name: data.name, pin, action: record.action, date: new Date().toISOString().split('T')[0], atraso: data.atraso, time: record.time, ip: ip, atrasoMinutos: data.atrasoMinutos || 0 }, ]);
    setPin(''); // Clearing the PIN
    showMessageToUser('Time recorded successfully', 'success');
  })
  .catch((error) => {
    console.error('Error adding record:', error.error);
    showMessageToUser('Error adding record: ' + error.error, 'error');
  });
};
// //id: number;
// name: string;
// pin: string;
// action: string;
// date:string;
// time: string;
// atraso:string;
// atrasoMinutos:string;
// us:string;
// ip: string;

function showMessageToUser(text: string, type: 'success' | 'error' | 'warning' | 'info') {
  const messageContainer = document.getElementById('message-container');
  const message = document.createElement('p');
  message.classList.add(`${type}-message`);
  message.textContent = text;
  messageContainer?.appendChild(message);

  // Add the "show" class to make the message appear
  message.classList.add('show');

  // Remove the message after 3 seconds
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

  // Return the JSX
  return (
    
    <div className="time-clock-container" ref={timeClockContainerRef} onKeyDown={handleKeyDown} tabIndex={0}>
      <Login showLogin={showLogin} onLoginSuccess={onLoginSuccess} onCloseOverlay={onCloseOverlay} />
      {showAddEmployee && isLoggedIn && <AddEmployee onAddSuccess={onAddEmployeeSuccess} onCloseOverlay={onCloseOverlay} />}
      {showCreateAdmin && !isLoggedIn && <CreateAdmin onCreateSuccess={onCreateAdminSuccess} onCloseOverlay={onCloseOverlay} />}
      <div style={{ textAlign: 'center', padding: '20px' }}>
      <img src={require("./assets/main.png")} alt="logo" width="300" />
      </div>     
      <h2>Controle de assiduidade</h2>
      <div id="currentTime"><b>Horario local: {currentTime}</b></div>
      <div className="pin-entry">
      {/* <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter your PIN"
      />  */}
       {/* <div id="currentPin">Digite o seu PIN: {"*".repeat(pin.length)}</div> */}
        <button className="clear-button" onClick={handleClear}></button>
      </div>
      <div id="message-container"></div>
      <div className="main-container">
        <Keypad onKeyPress={handleKeyPress} />
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